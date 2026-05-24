import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Release expired reservations lazily to bypass Vercel Hobby cron limitations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() }
      }
    })

    if (expiredReservations.length > 0) {
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
    }

    const products = await prisma.product.findMany({
      include: {
        stock: {
          include: { warehouse: true }
        }
      }
    })
    
    const result = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock.map(s => ({
        warehouseId: s.warehouse.id,
        warehouseName: s.warehouse.name,
        available: s.totalUnits - s.reservedUnits,
        total: s.totalUnits,
        reserved: s.reservedUnits
      }))
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
