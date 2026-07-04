import prisma from '../src/lib/prisma'
import { modules } from './seed'

async function migrate() {
  console.log("Starting Module Schema Update & Client Data Migration...");

  // 1. Update the schema definitions in the Module collection in DB
  const titlesToUpdate = [
    'Module 5: Movies and Visual World',
    'Module 6: Friends & Relationships',
    'Module 7: Family',
    'Module 8: Lifestyle Expectancies'
  ];

  for (const title of titlesToUpdate) {
    const seedMod = modules.find(m => m.title === title);
    if (!seedMod) {
      console.error(`Could not find schema for title: ${title} in seed.ts`);
      continue;
    }
    
    const dbMod = await prisma.module.findFirst({ where: { title } });
    if (!dbMod) {
      console.warn(`Module with title "${title}" not found in DB. Skipping schema update.`);
      continue;
    }

    await prisma.module.update({
      where: { id: dbMod.id },
      data: {
        schema: seedMod.schema as any
      }
    });
    console.log(`Updated schema in DB for module: "${title}"`);
  }

  // 2. Fetch and migrate existing client responses
  const allResponses = await prisma.moduleResponse.findMany({
    include: {
      clientModule: {
        include: {
          module: true
        }
      }
    }
  });

  console.log(`Analyzing ${allResponses.length} module responses for migration...`);
  let migratedCount = 0;

  for (const resp of allResponses) {
    const data = resp.data as Record<string, any> || {};
    let needsUpdate = false;

    // A. Migrate friends_2 for Module 6
    if (resp.clientModule.module.title === 'Module 6: Friends & Relationships' && data.friends_2 && Array.isArray(data.friends_2)) {
      console.log(`Migrating friends_2 table data to string for response ID: ${resp.id}`);
      const migratedString = data.friends_2
          .map((row: any, idx: number) => {
              if (!row) return '';
              const item = row.col1 || '';
              const detail = row.col2 || '';
              if (!item && !detail) return '';
              return `${idx + 1}. Craziest Thing: ${item}${detail ? ` (When/Why: ${detail})` : ''}`;
          })
          .filter(Boolean)
          .join('\n');
      
      data.friends_2 = migratedString;
      needsUpdate = true;
    }

    // B. Migrate family_6 for Module 7
    if (resp.clientModule.module.title === 'Module 7: Family' && data.family_6 && (typeof data.family_6 === 'string' || (Array.isArray(data.family_6) && data.family_6.length > 0 && typeof data.family_6[0] === 'string'))) {
      console.log(`Migrating family_6 choice to rank object array for response ID: ${resp.id}`);
      const family6Options = [
          { id: '1', text: "They are very open for me to explore anything I would love to do including out of the box options. They want me to express myself even if it's any offbeat space. Earning isn't really first priority & they are ok even if my journey is random to start with. They don't have any specific timeline" },
          { id: '2', text: "They are open for me to explore anything I would love to do including out of the box career options but want me to be clearer about what I want now/work. They need me to work towards it now & find my pathway" },
          { id: '3', text: "They say they are ok with offbeat spaces but honestly, I see them scared. They may still allow me to do what I want but internally they will always be skeptical" },
          { id: '4', text: "They want to choose safe options, get done with degree & then whatever I want to do later" },
          { id: '5', text: "They have specific things in their mind which they keep expressing directly or indirectly & somehow, I am stuck there. Their opinion has become my opinion now" },
          { id: '6', text: "They are clear of what they want me to do & I don't have a lot of say & thought here for now. I am scared of putting my thoughts as they have counter questions for which I have no answers" },
          { id: '7', text: "They want me to be safe & secured in a way they understand/fields they know which I don't agree & thus there's always a battle" },
          { id: '8', text: "They want me to do good with academics, get into good college & then its upto me" },
          { id: '9', text: "Everyone in family is into something & they are looking for me to get into the same thing" },
          { id: '10', text: "They say but I do what I want to do & that's how it goes." }
      ];
      const selectedId = Array.isArray(data.family_6) ? data.family_6[0] : data.family_6;
      const matchedOpt = family6Options.find(o => o.id === selectedId);
      if (matchedOpt) {
          data.family_6 = [{ option: matchedOpt.text }, { option: '' }, { option: '' }];
      } else {
          data.family_6 = [{ option: '' }, { option: '' }, { option: '' }];
      }
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.moduleResponse.update({
        where: { id: resp.id },
        data: {
          data: data as any
        }
      });
      migratedCount++;
    }
  }

  console.log(`Migration completed successfully! Updated schemas for the 4 modules and successfully migrated ${migratedCount} client responses.`);
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
