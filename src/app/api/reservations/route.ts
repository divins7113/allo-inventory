import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { acquireLock, releaseLock, redis } from '@/lib/redis'
import { z } from 'zod'
import { addMinutes } from 'date-fns'

const reserveSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().positive()
})

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get('Idempotency-Key')
    if (idempotencyKey) {
      const cached = await redis.get(`idempotency:${idempotencyKey}`)
      if (cached) {
        return NextResponse.json(JSON.parse(cached))
      }
    }

    const body = await req.json()
    const parseResult = reserveSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request data', details: parseResult.error }, { status: 400 })
    }

    const { productId, warehouseId, quantity } = parseResult.data
    const lockKey = `lock:stock:${productId}:${warehouseId}`

    const locked = await acquireLock(lockKey, 5000)
    if (!locked) {
      return NextResponse.json({ error: 'Server busy, try again.' }, { status: 429 })
    }

    try {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_warehouseId: { productId, warehouseId }
        }
      })

      if (!stock) {
        return NextResponse.json({ error: 'Stock record not found' }, { status: 404 })
      }

      const available = stock.totalUnits - stock.reservedUnits
      if (available < quantity) {
        const conflictResponse = { error: 'Not enough stock available' }
        if (idempotencyKey) {
          await redis.set(`idempotency:${idempotencyKey}`, JSON.stringify(conflictResponse), 'EX', 86400)
        }
        return NextResponse.json(conflictResponse, { status: 409 })
      }

      const reservation = await prisma.$transaction(async (tx) => {
        await tx.stock.update({
          where: { id: stock.id },
          data: { reservedUnits: { increment: quantity } }
        })

        return tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: 'PENDING',
            expiresAt: addMinutes(new Date(), 15),
            idempotencyKey
          }
        })
      })

      const successResponse = reservation
      if (idempotencyKey) {
        await redis.set(`idempotency:${idempotencyKey}`, JSON.stringify(successResponse), 'EX', 86400)
      }
      
      return NextResponse.json(successResponse, { status: 201 })
      
    } finally {
      await releaseLock(lockKey)
    }

  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
