import prisma from '../src/lib/prisma'
import * as fs from 'fs'

async function main() {
  const email = 'nikhil.sharma140220@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      clientProfile: {
        include: {
          modules: {
            include: {
              module: true,
              response: true
            },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })

  if (!user || !user.clientProfile) {
    console.error('Client profile not found')
    return
  }

  const results: any = {}

  for (const cm of user.clientProfile.modules) {
    results[`Module_${cm.order}_${cm.module.title.replace(/[^a-zA-Z0-5]/g, '_')}`] = {
      status: cm.status,
      data: cm.response?.data || null
    }
  }

  fs.writeFileSync('scripts/extracted_client_responses.json', JSON.stringify(results, null, 2), 'utf8')
  console.log('Successfully saved responses to scripts/extracted_client_responses.json')
}

main().catch(console.error).finally(() => prisma.$disconnect())
