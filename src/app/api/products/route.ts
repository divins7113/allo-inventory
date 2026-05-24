import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
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
