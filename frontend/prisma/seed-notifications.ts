import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Finding an admin or parent user...');

    // Find the first user
    const user = await prisma.user.findFirst();

    if (!user) {
        console.log('No users found in database to seed notifications for.');
        return;
    }

    console.log(`Seeding notifications for user: ${user.email}`);

    await prisma.notification.createMany({
        data: [
            {
                userId: user.id,
                title: 'System Online',
                message: 'The new notification system is now online.',
                type: NotificationType.SYSTEM,
                isRead: false
            },
            {
                userId: user.id,
                title: 'Report Finals Ready',
                message: 'Client ABC has a finalized career report ready for review.',
                type: NotificationType.REPORT_READY,
                link: '/admin/reports',
                isRead: false
            },
            {
                userId: user.id,
                title: 'New Expert Query',
                message: 'A client has asked a matching question regarding engineering careers.',
                type: NotificationType.CHAT,
                link: '/admin/queries',
                isRead: false
            }
        ]
    });

    console.log('Successfully seeded 3 notifications');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
