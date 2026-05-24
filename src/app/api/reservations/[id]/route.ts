import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const p = await params
    const id = p.id
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
