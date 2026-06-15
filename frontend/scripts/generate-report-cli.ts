import dotenv from 'dotenv';
import path from 'path';

// Load .env configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { generateCareerReport } from '../src/lib/ai';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2] || 'nikhil.sharma140220@gmail.com';
    console.log(`Searching for client profile with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { clientProfile: true }
    });

    if (!user || !user.clientProfile) {
        console.error(`Error: No client profile found for email: ${email}`);
        process.exit(1);
    }

    const profileId = user.clientProfile.id;
    console.log(`Found Client Profile ID: ${profileId}`);
    console.log(`Generating career report...`);

    try {
        const report = await generateCareerReport(profileId);
        
        // Check if it's the fallback report
        let isFallback = false;
        try {
            const parsed = JSON.parse(report.content || '{}');
            isFallback = parsed.personality_insights && parsed.personality_insights.includes('Pending Analysis');
        } catch (e) {
            isFallback = true;
        }

        if (isFallback) {
            console.error('Error: Report was created with fallback content. Check your Groq API Key or rate limits.');
        } else {
            console.log('Success! Career report generated and saved to the shared database.');
            console.log(`Report ID: ${report.id}`);
            console.log(`Calculated MBTI Type: ${JSON.parse(report.content || '{}').mbti_type}`);
            console.log('Career suggestions:');
            report.careerOptions.forEach((opt: any) => {
                console.log(` - ${opt.title} (${opt.match}% match)`);
            });
        }
    } catch (err: any) {
        console.error('Error during report generation:', err.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
