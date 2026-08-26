import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- REPAIRING NULL DATES IN MONGODB WITH RUNCOMMANDRAW ---');

    const updateUsersRes = await prisma.$runCommandRaw({
        update: 'User',
        updates: [
            {
                q: { createdAt: null },
                u: { $set: { createdAt: { $date: new Date().toISOString() } } },
                multi: true
            },
            {
                q: { updatedAt: null },
                u: { $set: { updatedAt: { $date: new Date().toISOString() } } },
                multi: true
            }
        ]
    });
    console.log('User update result:', updateUsersRes);

    const updateProfilesRes = await prisma.$runCommandRaw({
        update: 'ClientProfile',
        updates: [
            {
                q: { createdAt: null },
                u: { $set: { createdAt: { $date: new Date().toISOString() } } },
                multi: true
            },
            {
                q: { updatedAt: null },
                u: { $set: { updatedAt: { $date: new Date().toISOString() } } },
                multi: true
            }
        ]
    });
    console.log('ClientProfile update result:', updateProfilesRes);

    console.log('\n--- TESTING PRISMA FETCH FOR ACCOUNTS ---');
    const emails = ['nikhil.sharma140220@gmail.com', 'nik035663@gmail.com'];
    for (const email of emails) {
        try {
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
            if (user && user.clientProfile) {
                console.log(`✅ SUCCESS for ${email}:`);
                console.log(`   User ID: ${user.id} | ClientProfile ID: ${user.clientProfile.id}`);
                console.log(`   Modules: ${user.clientProfile.modules.length} (${user.clientProfile.modules.filter(m => m.status !== 'LOCKED').length} unlocked)`);
                console.log(`   Responses: ${user.clientProfile.modules.filter(m => m.response).length}`);
                console.log(`   Reports: ${user.clientProfile.reports.length}`);
                console.log(`   Stages: ${user.clientProfile.stages.length}`);
            } else {
                console.log(`❌ No clientProfile for ${email}`);
            }
        } catch (err: any) {
            console.error(`❌ ERROR fetching ${email}:`, err.message || err);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
