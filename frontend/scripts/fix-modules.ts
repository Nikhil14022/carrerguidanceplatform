import prisma from '../src/lib/prisma'

async function main() {
  // List all modules first
  const all = await prisma.module.findMany({
    select: { id: true, title: true, defaultOrder: true },
    orderBy: { defaultOrder: 'asc' }
  })
  console.log('All modules in DB:', all.length)
  all.forEach(m => console.log(`  ${m.defaultOrder} | "${m.title}" | ${m.id}`))

  // Delete all modules whose title matches old pattern (the 12 old ones from first seed)
  // Old ones have titles like "Module X: Name" where X is 1-12 and name matches old naming
  const oldTitles = [
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

  const toDelete = all.filter(m => oldTitles.includes(m.title))
  console.log('\nModules to delete:', toDelete.length)
  toDelete.forEach(m => console.log(`  "${m.title}"`))

  if (toDelete.length === 0) {
    // Try partial match
    console.log('\nTrying partial match...')
    const partial = all.filter(m => {
      const num = parseInt(m.title.replace('Module ', ''))
      return !isNaN(num) && num <= 12 && all.filter(x => x.defaultOrder === m.defaultOrder).length > 1
    })
    console.log('Partial match:', partial.length)
    partial.forEach(m => console.log(`  "${m.title}" | ${m.id}`))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
