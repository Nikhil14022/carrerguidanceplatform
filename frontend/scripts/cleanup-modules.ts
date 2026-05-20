import prisma from '../src/lib/prisma'

// Old module titles from the first seed run — these are duplicates to remove
const OLD_TITLES = [
  'Module 1: Demographics & Aim',
  'Module 2: Movies & Visual World',
  'Module 3: Friends & Relationships',
  'Module 4: Family',
  'Module 5: Lifestyle Expectancies',
  'Module 6: Strengths & Weaknesses',
  'Module 7: Fears',
  'Module 8: 16 Personality Factors Test',
  'Module 9: Value System',
  'Module 10: RIASEC Interest Test',
  'Module 11: Color Test & Working Style',
  'Module 12: Subject Matter Interest & Hypotheticals',
]

async function main() {
  // Find old modules
  const oldModules = await prisma.module.findMany({
    where: { title: { in: OLD_TITLES } },
    select: { id: true, title: true }
  })

  if (oldModules.length === 0) {
    console.log('No old modules found — nothing to clean up.')
    return
  }

  console.log(`Found ${oldModules.length} old modules to remove:`)
  oldModules.forEach(m => console.log(`  - ${m.title} (${m.id})`))

  const oldIds = oldModules.map(m => m.id)

  // Find ClientModules referencing old modules
  const clientModules = await prisma.clientModule.findMany({
    where: { moduleId: { in: oldIds } },
    select: { id: true }
  })
  const clientModuleIds = clientModules.map(cm => cm.id)

  if (clientModuleIds.length > 0) {
    console.log(`\nRemoving ${clientModuleIds.length} linked ClientModule records...`)

    // Delete comments on those ClientModules
    await prisma.moduleComment.deleteMany({
      where: { clientModuleId: { in: clientModuleIds } }
    })

    // Delete responses on those ClientModules
    await prisma.moduleResponse.deleteMany({
      where: { clientModuleId: { in: clientModuleIds } }
    })

    // Delete the ClientModules themselves
    await prisma.clientModule.deleteMany({
      where: { id: { in: clientModuleIds } }
    })
  }

  // Now delete the old modules
  const deleted = await prisma.module.deleteMany({
    where: { id: { in: oldIds } }
  })

  console.log(`\nDeleted ${deleted.count} old modules.`)

  // Show remaining modules
  const remaining = await prisma.module.findMany({
    select: { defaultOrder: true, title: true },
    orderBy: { defaultOrder: 'asc' }
  })
  console.log(`\nRemaining modules (${remaining.length} total):`)
  remaining.forEach(m => console.log(`  ${m.defaultOrder}. ${m.title}`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
