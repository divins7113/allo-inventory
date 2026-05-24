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

    if (reservation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 })
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CONFIRMED' }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error confirming reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
