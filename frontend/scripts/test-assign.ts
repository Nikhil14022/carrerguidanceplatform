import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing assignment...");
    const mentor = await prisma.mentorProfile.findFirst();
    const client = await prisma.clientProfile.findFirst();

    if (!mentor || !client) {
        console.log("Missing data");
        return;
    }

    try {
        const assignment = await prisma.mentorAssignment.create({
            data: {
                mentorProfileId: mentor.id,
                clientProfileId: client.id,
                permissions: ['VIEW_MODULES', 'CHAT'],
                assignedBy: mentor.userId, // mock
                expiresAt: null
            }
        });
        console.log("Assignment Success: ", assignment.id);
    } catch (e: any) {
        console.log("Assign Error: ", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
