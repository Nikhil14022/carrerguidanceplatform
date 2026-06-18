import prisma from '../src/lib/prisma'

async function main() {
  const email = 'nikhil.sharma140220@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: { clientProfile: true }
  })

  if (!user || !user.clientProfile) {
    console.error(`User with email ${email} or their client profile not found.`)
    process.exit(1)
  }

  const clientProfileId = user.clientProfile.id
  console.log(`Fixing responses for client: "${user.name}" (Profile ID: ${clientProfileId})...`)

  const clientModules = await prisma.clientModule.findMany({
    where: {
      clientProfileId,
      status: { in: ['IN_PROGRESS', 'UNLOCKED'] }
    },
    include: { response: true }
  })

  let fixedCount = 0
  for (const cm of clientModules) {
    if (cm.response && (cm.response.submittedAt || cm.response.approvedAt)) {
      await prisma.moduleResponse.update({
        where: { id: cm.response.id },
        data: {
          submittedAt: null,
          approvedAt: null
        }
      })
      console.log(`[FIXED] Cleared submittedAt/approvedAt timestamps for module order #${cm.order}: "${cm.id}"`)
      fixedCount++
    }
  }

  console.log(`Successfully fixed ${fixedCount} module responses (now fully editable in backend).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
