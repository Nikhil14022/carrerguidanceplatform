import prisma from '../src/lib/prisma'
import { modules } from './seed'

async function main() {
  console.log('Starting module schema migration...')
  console.log(`Found ${modules.length} modules defined in seed configuration.`)

  let updatedCount = 0
  let createdCount = 0

  for (const mod of modules) {
    const existing = await prisma.module.findUnique({
      where: { title: mod.title }
    })

    if (existing) {
      await prisma.module.update({
        where: { id: existing.id },
        data: {
          description: mod.description,
          schema: mod.schema as any,
          defaultOrder: mod.defaultOrder
        }
      })
      console.log(`[UPDATE] Updated schema for: "${mod.title}"`)
      updatedCount++
    } else {
      await prisma.module.create({
        data: {
          title: mod.title,
          description: mod.description,
          schema: mod.schema as any,
          defaultOrder: mod.defaultOrder
        }
      })
      console.log(`[CREATE] Created new module: "${mod.title}"`)
      createdCount++
    }
  }

  console.log(`Migration completed successfully!`)
  console.log(`Summary: Updated ${updatedCount} modules, Created ${createdCount} modules. No client data was deleted.`)
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
