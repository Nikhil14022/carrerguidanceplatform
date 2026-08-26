import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- REPAIRING REPORT COLLECTION NULL DATES ---');

    const inspectRes: any = await prisma.$runCommandRaw({
        find: 'Report',
        filter: {}
    });

    const reports = inspectRes.cursor?.firstBatch || [];
    console.log(`Found ${reports.length} total raw documents in Report collection.`);

    for (const r of reports) {
        console.log(`Report ID: ${r._id?.$oid || r._id} | ClientProfileId: ${r.clientProfileId?.$oid || r.clientProfileId} | createdAt: ${JSON.stringify(r.createdAt)} | updatedAt: ${JSON.stringify(r.updatedAt)}`);
    }

    const nowIso = new Date().toISOString();

    const updateCreatedRes = await prisma.$runCommandRaw({
        update: 'Report',
        updates: [
            {
                q: { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] },
                u: { $set: { createdAt: { $date: nowIso } } },
                multi: true
            },
            {
                q: { $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }] },
                u: { $set: { updatedAt: { $date: nowIso } } },
                multi: true
            }
        ]
    });

    console.log('\nReport Update Result:', updateCreatedRes);

    console.log('\n--- TESTING FULL CLIENT FETCH FOR ALL ACCOUNTS ---');
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
                console.log(`\n✅ SUCCESS FOR ${email}:`);
                console.log(`   User ID: ${user.id} | ClientProfile ID: ${user.clientProfile.id}`);
                console.log(`   Modules Total: ${user.clientProfile.modules.length}`);
                console.log(`   Unlocked Modules: ${user.clientProfile.modules.filter(m => m.status !== 'LOCKED').length}`);
                console.log(`   Submitted Responses: ${user.clientProfile.modules.filter(m => m.response).length}`);
                console.log(`   Reports Total: ${user.clientProfile.reports.length}`);
                user.clientProfile.reports.forEach(rep => {
                    console.log(`      - Report ID: ${rep.id} | CreatedAt: ${rep.createdAt} | Status: ${rep.status}`);
                });
                console.log(`   Stages Total: ${user.clientProfile.stages.length}`);
            }
        } catch (e: any) {
            console.error(`❌ STILL FAILING FOR ${email}:`, e.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
