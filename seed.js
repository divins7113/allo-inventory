const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const p1 = await prisma.product.create({
    data: {
      name: 'MacBook Pro M3 Max',
      description: 'The ultimate pro laptop.',
      price: 3499.00
    }
  })

  const p2 = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      description: 'Titanium design with A17 Pro.',
      price: 999.00
    }
  })

  const w1 = await prisma.warehouse.create({
    data: {
      name: 'California Fulfillment Center',
      location: 'San Jose, CA'
    }
  })

  const w2 = await prisma.warehouse.create({
    data: {
      name: 'New York Depot',
      location: 'New York, NY'
    }
  })

  await prisma.stock.create({
    data: {
      productId: p1.id,
      warehouseId: w1.id,
      totalUnits: 5,
      reservedUnits: 0
    }
  })

  await prisma.stock.create({
    data: {
      productId: p2.id,
      warehouseId: w1.id,
      totalUnits: 1,
      reservedUnits: 0
    }
  })

  await prisma.stock.create({
    data: {
      productId: p2.id,
      warehouseId: w2.id,
      totalUnits: 0,
      reservedUnits: 0
    }
  })

  console.log('Seeded successfully!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
