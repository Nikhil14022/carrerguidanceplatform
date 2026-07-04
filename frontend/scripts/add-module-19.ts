import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Checking if Module 19: Identify Your Job Functions exists...");
  let module19 = await prisma.module.findFirst({
    where: {
      title: {
        contains: 'Module 19'
      }
    }
  });

  if (!module19) {
    console.log("Module 19 not found. Creating it...");
    module19 = await prisma.module.create({
      data: {
        title: 'Module 19: Identify Your Job Functions',
        description: 'Rate the functions that come naturally to you or express what you do best across People, Info, and Thing-oriented tasks.',
        schema: {
          testType: 'JOB_FUNCTIONS',
          questions: []
        },
        defaultOrder: 19
      }
    });
    console.log("Module 19 created with ID:", module19.id);
  } else {
    console.log("Module 19 already exists with ID:", module19.id);
  }

  // Find all client profiles
  const profiles = await prisma.clientProfile.findMany({
    include: {
      modules: {
        include: {
          module: true
        }
      },
      user: true
    }
  });

  console.log(`Checking ${profiles.length} client profiles for Module 19 linkage...`);
  let linkedCount = 0;

  for (const profile of profiles) {
    const hasModule19 = profile.modules.some(cm => cm.moduleId === module19!.id || cm.module?.title.includes('Module 19'));
    if (!hasModule19) {
      // Condition: only link if user age > 17 OR user age is not set (so we don't lock out existing clients)
      const age = profile.user.age;
      if (age === null || age === undefined || age > 17) {
        // Find the highest order currently linked to append it at the end
        const orders = profile.modules.map(cm => cm.order);
        const nextOrder = orders.length > 0 ? Math.max(...orders) + 1 : 19;

        await prisma.clientModule.create({
          data: {
            clientProfileId: profile.id,
            moduleId: module19!.id,
            status: 'LOCKED',
            order: nextOrder,
            filledBy: 'CLIENT'
          }
        });
        linkedCount++;
      }
    }
  }

  console.log(`Linked Module 19 to ${linkedCount} eligible client profiles.`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
