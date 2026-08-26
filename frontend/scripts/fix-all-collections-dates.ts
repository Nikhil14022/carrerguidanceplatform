import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- COMPREHENSIVE NULL/MISSING DATE REPAIR FOR ALL COLLECTIONS ---');
    const collections = [
        'User',
        'MentorProfile',
        'MentorAssignment',
        'ClientProfile',
        'ClientStage',
        'ClientModule',
        'ModuleResponse',
        'ModuleComment',
        'DataFlag',
        'AppointmentSlot',
        'AppointmentBooking',
        'AuditLog',
        'ModuleResponseVersion',
        'ReportVersion',
        'ClientQuery',
        'QueryResponse',
        'ExposureProgram',
        'ClientExposureProgress',
        'ExposureFeedback',
        'Report',
        'CareerOption',
        'FinalPlan',
        'ResearchEntry',
        'SkillGap',
        'Notification',
        'Discussion',
        'DiscussionComment',
        'ParentData',
        'ParentQuestionnaire',
        'Workshop',
        'WorkshopEnrollment',
        'UploadedFile'
    ];

    const nowIso = new Date().toISOString();

    for (const col of collections) {
        try {
            const res = await prisma.$runCommandRaw({
                update: col,
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
            const r: any = res;
            if (r.nModified > 0) {
                console.log(`[REPAIRED] ${col}: Updated ${r.nModified} document(s) with missing dates.`);
            }
        } catch (err: any) {
            // Collection might not exist yet, ignore
        }
    }

    console.log('\n--- VERIFYING ALL CLIENT ACCOUNTS FETCHING ---');
    const allProfiles = await prisma.clientProfile.findMany({
        include: {
            user: { select: { email: true, name: true } },
            modules: { include: { response: true } },
            reports: true,
            stages: true
        }
    });

    console.log(`Successfully fetched all ${allProfiles.length} client profiles from MongoDB without any Prisma errors!`);
    allProfiles.forEach(p => {
        const submittedCount = p.modules.filter(m => m.response).length;
        console.log(`- ${p.user.email} (${p.user.name || 'Client'}): ${submittedCount} module responses | ${p.reports.length} reports | ${p.stages.length} stages`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
