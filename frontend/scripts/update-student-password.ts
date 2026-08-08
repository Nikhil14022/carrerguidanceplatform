import { hash } from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function main() {
  try {
    const studentHash = await hash('student123', 12)
    console.log("Updating student nikhil.sharma140220@gmail.com password...")
    const res = await prisma.user.updateMany({
      where: { email: 'nikhil.sharma140220@gmail.com' },
      data: { password: studentHash }
    })
    console.log("Student update count:", res.count)
  } catch (error) {
    console.error("Error updating password:", error)
  }
}

main().finally(() => prisma.$disconnect())
