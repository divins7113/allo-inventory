const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const w1 = await prisma.warehouse.findFirst({ where: { name: 'California Fulfillment Center' } })
  if (w1) {
    await prisma.warehouse.update({
      where: { id: w1.id },
      data: {
        name: 'Mumbai Fulfillment Center',
        location: 'Mumbai, MH'
      }
    })
    console.log('Updated California to Mumbai')
  }

  const w2 = await prisma.warehouse.findFirst({ where: { name: 'New York Depot' } })
  if (w2) {
    await prisma.warehouse.update({
      where: { id: w2.id },
      data: {
        name: 'Delhi Depot',
        location: 'New Delhi, DL'
      }
    })
    console.log('Updated New York to Delhi')
  }

  console.log('Warehouses updated successfully!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
