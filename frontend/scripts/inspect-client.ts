import prisma from '../src/lib/prisma';

async function main() {
    const id = '699f7c927d83d188567e392e';
    console.log('Searching for ID:', id);

    const userById = await prisma.user.findUnique({
        where: { id },
        include: { clientProfile: { include: { modules: true, stages: true } } }
    });
    console.log('User found by User.id:', userById ? { id: userById.id, email: userById.email, role: userById.role, clientProfileId: userById.clientProfile?.id } : null);

    const clientProfileById = await prisma.clientProfile.findUnique({
        where: { id },
        include: { user: true, modules: true, stages: true }
    });
    console.log('ClientProfile found by ClientProfile.id:', clientProfileById ? { id: clientProfileById.id, userId: clientProfileById.userId, email: clientProfileById.user.email, moduleCount: clientProfileById.modules.length, stageCount: clientProfileById.stages.length } : null);

    const allClients = await prisma.clientProfile.findMany({
        include: { user: { select: { id: true, email: true, name: true } }, modules: { select: { id: true, status: true } }, stages: true }
    });
    console.log('\n--- ALL CLIENT PROFILES IN DB ---');
    allClients.forEach(c => {
        console.log(`ClientProfile ID: ${c.id} | User ID: ${c.userId} | Email: ${c.user.email} | Modules: ${c.modules.length} (${c.modules.filter(m => m.status === 'UNLOCKED' || m.status === 'IN_PROGRESS').length} unlocked) | Stages: ${c.stages.length}`);
    });

    const allAssignments = await (prisma as any).mentorAssignment.findMany({ where: { isActive: true } });
    console.log('\n--- ACTIVE MENTOR ASSIGNMENTS ---');
    console.log(allAssignments);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
