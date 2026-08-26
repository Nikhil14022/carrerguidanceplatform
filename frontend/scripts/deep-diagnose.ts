import prisma from '../src/lib/prisma';

async function main() {
    const emails = ['nikhil.sharma140220@gmail.com', 'nik035663@gmail.com'];
    console.log('=== DEEP DIAGNOSTIC FOR CLIENT ACCOUNTS ===\n');

    for (const email of emails) {
        console.log(`--------------------------------------------------`);
        console.log(`Checking account for email: ${email}`);
        
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                clientProfile: {
                    include: {
                        modules: {
                            orderBy: { order: 'asc' },
                            include: { module: { select: { id: true, title: true } }, response: true }
                        },
                        reports: true,
                        stages: { orderBy: { stageNumber: 'asc' } }
                    }
                }
            }
        });

        if (!user) {
            console.log(`❌ User NOT FOUND for email ${email}`);
            continue;
        }

        console.log(`User ID: ${user.id} | Role: ${user.role} | Name: ${user.name}`);

        if (!user.clientProfile) {
            console.log(`❌ ClientProfile NOT FOUND for user ID ${user.id}`);
            continue;
        }

        const profile = user.clientProfile;
        console.log(`ClientProfile ID: ${profile.id}`);
        console.log(`Journey Status: "${profile.journeyStatus}" | Current Stage: ${profile.currentStage}`);
        console.log(`Modules Count: ${profile.modules.length}`);
        
        const moduleStatusCounts: Record<string, number> = {};
        let responseCount = 0;
        profile.modules.forEach(m => {
            moduleStatusCounts[m.status] = (moduleStatusCounts[m.status] || 0) + 1;
            if (m.response) responseCount++;
        });

        console.log(`Module Statuses:`, JSON.stringify(moduleStatusCounts));
        console.log(`Modules with Responses submitted/saved: ${responseCount}`);

        profile.modules.forEach(m => {
            console.log(`   Module ${m.order}: [${m.status}] ${m.module?.title || 'No Title'} (Response: ${m.response ? 'YES' : 'NO'})`);
        });

        console.log(`Reports Count: ${profile.reports.length}`);
        profile.reports.forEach(r => {
            console.log(`   Report ID: ${r.id} | Status: ${r.status} | Active: ${r.active}`);
        });

        console.log(`Stages Count: ${profile.stages.length}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
