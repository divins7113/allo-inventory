import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date()
        }
      }
    })

    if (expiredReservations.length === 0) {
      return NextResponse.json({ success: true, message: 'No expired reservations found.' })
    }

    const operations = []
    for (const res of expiredReservations) {
      operations.push(
        prisma.reservation.update({
          where: { id: res.id },
          data: { status: 'RELEASED' }
        })
      )
      operations.push(
        prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId: res.productId,
              warehouseId: res.warehouseId
            }
          },
          data: {
            reservedUnits: { decrement: res.quantity }
          }
        })
      )
    }
    
    await prisma.$transaction(operations)

    return NextResponse.json({ success: true, releasedCount: expiredReservations.length })
  } catch (error) {
    console.error('Error releasing expired reservations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
