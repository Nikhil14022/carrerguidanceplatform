import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- DIAGNOSING NULL DATES IN DATABASE ---');

    // Use raw Prisma MongoDB command to inspect and fix null dates in User collection
    const usersWithNullCreatedAt = await (prisma.user as any).findRaw({
        filter: {
            $or: [
                { createdAt: null },
                { createdAt: { $exists: false } },
                { updatedAt: null },
                { updatedAt: { $exists: false } }
            ]
        }
    });

    console.log(`Found ${usersWithNullCreatedAt.length} users with null/missing createdAt or updatedAt.`);
    for (const u of usersWithNullCreatedAt) {
        console.log(`  Fixing User ID: ${u._id?.$oid || u._id} | Email: ${u.email}`);
    }

    // Update raw users
    const updateResult = await (prisma.user as any).updateRaw({
        filter: {
            $or: [
                { createdAt: null },
                { createdAt: { $exists: false } }
            ]
        },
        update: {
            $set: { createdAt: { $date: new Date().toISOString() } }
        }
    });
    console.log('Update result for null createdAt:', updateResult);

    const updateUpdatedResult = await (prisma.user as any).updateRaw({
        filter: {
            $or: [
                { updatedAt: null },
                { updatedAt: { $exists: false } }
            ]
        },
        update: {
            $set: { updatedAt: { $date: new Date().toISOString() } }
        }
    });
    console.log('Update result for null updatedAt:', updateUpdatedResult);

    // Also check ClientProfile, ClientModule, Report, ClientStage, MentorProfile, MentorAssignment, etc.
    const collections = ['ClientProfile', 'ClientModule', 'Report', 'ClientStage', 'MentorProfile', 'MentorAssignment', 'ModuleResponse'];
    for (const col of collections) {
        try {
            const rawModel = (prisma as any)[col.charAt(0).toLowerCase() + col.slice(1)];
            if (rawModel && rawModel.updateRaw) {
                await rawModel.updateRaw({
                    filter: { createdAt: null },
                    update: { $set: { createdAt: { $date: new Date().toISOString() } } }
                });
                await rawModel.updateRaw({
                    filter: { updatedAt: null },
                    update: { $set: { updatedAt: { $date: new Date().toISOString() } } }
                });
            }
        } catch (err) {
            console.error(`Error checking ${col}:`, err);
        }
    }

    console.log('\n--- VERIFYING USER FETCH FOR TARGET ACCOUNTS ---');
    const targetEmails = ['nikhil.sharma140220@gmail.com', 'nik035663@gmail.com'];
    for (const email of targetEmails) {
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
            console.log(`❌ Failed to fetch user or clientProfile for ${email}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
