import prisma from '../src/lib/prisma'
async function main() {
  const count = await prisma.module.count()
  const all = await prisma.module.findMany({ select: { defaultOrder: true, title: true }, orderBy: { defaultOrder: 'asc' } })
  console.log('Module count:', count)
  all.forEach(m => console.log(`  ${m.defaultOrder}. ${m.title}`))
}
main().catch(console.error).finally(() => prisma.$disconnect())
