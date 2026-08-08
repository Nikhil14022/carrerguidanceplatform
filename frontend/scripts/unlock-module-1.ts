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

  const dbModule = await prisma.module.findFirst({
    where: { title: 'Module 1: Demographics' }
  })

  if (!dbModule) {
    console.error('Module 1: Demographics not found in DB.')
    process.exit(1)
  }

  const clientModule = await prisma.clientModule.findFirst({
    where: {
      clientProfileId,
      moduleId: dbModule.id
    }
  })

  if (!clientModule) {
    console.error('ClientModule record not found for Module 1.')
    process.exit(1)
  }

  await prisma.clientModule.update({
    where: { id: clientModule.id },
    data: { status: 'IN_PROGRESS' }
  })

  console.log(`Unlocked "Module 1: Demographics" for ${user.name} (Status changed to IN_PROGRESS).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
