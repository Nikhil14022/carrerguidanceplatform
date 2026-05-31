import { hash } from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function main() {
  try {
    const mentorHash = await hash('mentor123', 12)
    const adminHash = await hash('admin123', 12)

    console.log("Updating admin password...")
    const adminRes = await prisma.user.updateMany({
      where: { email: 'admin@careerflow.com' },
      data: { password: adminHash }
    })
    console.log("Admin update count:", adminRes.count)

    console.log("Updating john1@gmail.com password...")
    const res1 = await prisma.user.updateMany({
      where: { email: 'john1@gmail.com' },
      data: { password: mentorHash }
    })
    console.log("john1@gmail.com update count:", res1.count)

    console.log("Updating nikhil.sharma.201176@gmail.com password...")
    const res2 = await prisma.user.updateMany({
      where: { email: 'nikhil.sharma.201176@gmail.com' },
      data: { password: mentorHash }
    })
    console.log("nikhil.sharma.201176@gmail.com update count:", res2.count)

  } catch (error) {
    console.error("Error updating passwords:", error)
  }
}

main()
