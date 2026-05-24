const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const w1 = await prisma.warehouse.findFirst({ where: { name: 'California Fulfillment Center' } })
  const w2 = await prisma.warehouse.findFirst({ where: { name: 'New York Depot' } })

  if (!w1 || !w2) {
    console.error('Warehouses not found, run seed.js first')
    return
  }

  const newProducts = [
    {
      name: 'Sony PlayStation 5 Pro',
      description: 'Next-gen console with 8K gaming support.',
      price: 699.99,
      stockW1: 15,
      stockW2: 8
    },
    {
      name: 'Nintendo Switch OLED',
      description: 'Play at home or on the go with a vibrant OLED screen.',
      price: 349.99,
      stockW1: 40,
      stockW2: 25
    },
    {
      name: 'Dell XPS 15',
      description: 'High-performance creator laptop with infinity edge display.',
      price: 1899.00,
      stockW1: 3,
      stockW2: 5
    },
    {
      name: 'Sony A7 IV Camera',
      description: 'Full-frame mirrorless interchangeable lens camera.',
      price: 2498.00,
      stockW1: 2,
      stockW2: 0
    },
    {
      name: 'iPad Pro M4',
      description: 'Thin, light, and outrageously powerful.',
      price: 1099.00,
      stockW1: 10,
      stockW2: 12
    }
  ]

  for (const p of newProducts) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price
      }
    })

    await prisma.stock.create({
      data: {
        productId: product.id,
        warehouseId: w1.id,
        totalUnits: p.stockW1,
        reservedUnits: 0
      }
    })

    await prisma.stock.create({
      data: {
        productId: product.id,
        warehouseId: w2.id,
        totalUnits: p.stockW2,
        reservedUnits: 0
      }
    })
  }

  console.log('Added more products successfully!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
