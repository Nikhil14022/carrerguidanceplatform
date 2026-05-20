import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing mentor assignments and updates...");
    const mentor = await prisma.user.findFirst({
        where: { role: { in: ['MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT'] } },
        include: { mentorProfile: true }
    });

    if (!mentor) {
        console.log("No mentor found.");
        return;
    }

    console.log("Found Mentor: ", mentor.name, mentor.id);

    try {
        const updated = await prisma.user.update({
            where: { id: mentor.id },
            data: {
                mentorProfile: {
                    update: {
                        specializations: ['T1', 'T2']
                    }
                }
            }
        });
        console.log("Update Success!");
    } catch (e: any) {
        console.log("Update Error: ", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
