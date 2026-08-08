import { compare } from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function testUser(email: string, plaintext: string) {
  console.log(`Testing login for ${email}...`)
  const user = await prisma.user.findUnique({
    where: { email }
  })
  if (!user) {
    console.log(`User ${email} not found in DB!`)
    return
  }
  console.log(`User found. Hashed password in DB: ${user.password}`)
  const match = await compare(plaintext, user.password)
  console.log(`Password match result for "${plaintext}": ${match}`)
}

async function main() {
  await testUser('admin@careerflow.com', 'admin123')
  await testUser('john1@gmail.com', 'mentor123')
  await testUser('nikhil.sharma.201176@gmail.com', 'mentor123')
  await testUser('nikhil.sharma140220@gmail.com', 'student123')
}

main().finally(() => prisma.$disconnect())
