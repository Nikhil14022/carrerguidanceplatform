import prisma from '../src/lib/prisma'
async function main() {
  const modules = await prisma.module.findMany({ select: { id: true, title: true, defaultOrder: true }, orderBy: { defaultOrder: 'asc' } })
  modules.forEach(m => console.log(`${m.defaultOrder} | ${m.title} | ${m.id}`))
  console.log('Total:', modules.length)
}
main().catch(console.error).finally(() => prisma.$disconnect())
