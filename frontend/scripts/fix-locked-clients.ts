import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- Repairing Locked Client Profiles ---');

    const allClients = await prisma.clientProfile.findMany({
        include: {
            modules: {
                orderBy: { order: 'asc' }
            },
            user: { select: { email: true, name: true } }
        }
    });

    let repairedCount = 0;

    for (const client of allClients) {
        const hasUnlocked = client.modules.some(
            m => ['UNLOCKED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(m.status)
        );

        if (!hasUnlocked && client.modules.length > 0) {
            const firstModule = client.modules[0];
            await prisma.clientModule.update({
                where: { id: firstModule.id },
                data: { status: 'UNLOCKED' }
            });

            await prisma.clientProfile.update({
                where: { id: client.id },
                data: { journeyStatus: 'In Progress' }
            });

            console.log(`Unlocked Module 1 for client: ${client.user.email} (${client.user.name || 'Unnamed'}) [ClientProfile ID: ${client.id}]`);
            repairedCount++;
        }
    }

    console.log(`\nSuccessfully repaired ${repairedCount} client profiles.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
