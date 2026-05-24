import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const p = await params
    const id = p.id
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json({ error: `Reservation is already ${reservation.status}` }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId
          }
        },
        data: { reservedUnits: { decrement: reservation.quantity } }
      })

      return tx.reservation.update({
        where: { id },
        data: { status: 'RELEASED' }
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error releasing reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
