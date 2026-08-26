import prisma from '../src/lib/prisma';

async function main() {
    const email = 'nikhil.sharma140220@gmail.com';
    console.log(`--- TESTING RELATIONS FOR EMAIL: ${email} ---`);

    // 1. User alone
    try {
        const u = await prisma.user.findUnique({ where: { email } });
        console.log('1. User alone: SUCCESS');
    } catch (e: any) { console.error('1. User alone: FAILED', e.message); }

    // 2. User + ClientProfile
    let cpId = '';
    try {
        const u = await prisma.user.findUnique({ where: { email }, include: { clientProfile: true } });
        console.log('2. User + ClientProfile: SUCCESS', u?.clientProfile?.id);
        cpId = u?.clientProfile?.id || '';
    } catch (e: any) { console.error('2. User + ClientProfile: FAILED', e.message); }

    if (cpId) {
        // 3. ClientProfile + Modules
        try {
            const cp = await prisma.clientProfile.findUnique({
                where: { id: cpId },
                include: { modules: true }
            });
            console.log('3. ClientProfile + Modules: SUCCESS');
        } catch (e: any) { console.error('3. ClientProfile + Modules: FAILED', e.message); }

        // 4. ClientProfile + Modules + Response
        try {
            const cp = await prisma.clientProfile.findUnique({
                where: { id: cpId },
                include: { modules: { include: { response: true } } }
            });
            console.log('4. ClientProfile + Modules + Response: SUCCESS');
        } catch (e: any) { console.error('4. ClientProfile + Modules + Response: FAILED', e.message); }

        // 5. ClientProfile + Reports
        try {
            const cp = await prisma.clientProfile.findUnique({
                where: { id: cpId },
                include: { reports: true }
            });
            console.log('5. ClientProfile + Reports: SUCCESS');
        } catch (e: any) { console.error('5. ClientProfile + Reports: FAILED', e.message); }

        // 6. ClientProfile + Stages
        try {
            const cp = await prisma.clientProfile.findUnique({
                where: { id: cpId },
                include: { stages: true }
            });
            console.log('6. ClientProfile + Stages: SUCCESS');
        } catch (e: any) { console.error('6. ClientProfile + Stages: FAILED', e.message); }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
