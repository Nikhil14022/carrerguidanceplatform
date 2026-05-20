import prisma from '../src/lib/prisma'
import * as fs from 'fs'

async function main() {
  const modules = await prisma.module.findMany({
    select: { defaultOrder: true, title: true },
    orderBy: { defaultOrder: 'asc' }
  })
  const lines = [
    `Total modules: ${modules.length}`,
    ...modules.map(m => `  ${m.defaultOrder}. ${m.title}`)
  ]
  const out = lines.join('\n')
  console.log(out)
  fs.writeFileSync('C:/Users/nikhi/AppData/Local/Temp/modules_verify.txt', out, 'utf8')
}
main().catch(console.error).finally(() => prisma.$disconnect())
