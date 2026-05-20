import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.moduleResponseVersion.deleteMany({})
  await prisma.moduleResponse.deleteMany({})
  await prisma.moduleComment.deleteMany({})
  await prisma.clientModule.deleteMany({})
  await prisma.module.deleteMany({})
  console.log('Successfully wiped old modules and related client data.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
