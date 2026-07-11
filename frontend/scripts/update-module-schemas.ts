import prisma from '../src/lib/prisma'

async function main() {
  console.log("Updating module schemas non-destructively...");

  // 1. Module 2: Aim and Vision
  const m2 = await prisma.module.findFirst({
    where: { title: { contains: "Module 2: Aim and Vision" } }
  });
  if (m2) {
    const schema = m2.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      const q = schema.questions.find((x: any) => x.id === "aim_4");
      if (q) {
        q.description = "Either something that already exists or something you would want to exist. Can be individual fields or a combo of two different fields. \n\n**Examples:** *Musician, Streamer, Designer, Athlete, Influencer, Astronaut, etc.*";
        await prisma.module.update({
          where: { id: m2.id },
          data: { schema }
        });
        console.log("Successfully updated Module 2 Question 8 (aim_4)");
      }
    }
  }

  // 2. Module 5: Movies and Visual World
  const m5 = await prisma.module.findFirst({
    where: { title: { contains: "Module 5: Movies and Visual World" } }
  });
  if (m5) {
    const schema = m5.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      const q = schema.questions.find((x: any) => x.id === "visual_content_genres");
      if (q) {
        q.allowFileUpload = true;
        q.fileUploadLabel = "Upload a screenshot of content genres you follow online (optional):";
        await prisma.module.update({
          where: { id: m5.id },
          data: { schema }
        });
        console.log("Successfully updated Module 5 Question 12 (visual_content_genres)");
      }
    }
  }

  // 3. Module 6: Friends & Relationships
  const m6 = await prisma.module.findFirst({
    where: { title: { contains: "Module 6: Friends & Relationships" } }
  });
  if (m6) {
    const schema = m6.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      const q = schema.questions.find((x: any) => x.id === "friends_7b");
      if (q) {
        q.type = "multiselect";
        await prisma.module.update({
          where: { id: m6.id },
          data: { schema }
        });
        console.log("Successfully updated Module 6 Question 9 (friends_7b) to multiselect");
      }
    }
  }

  // 4. Module 8: Lifestyle Expectancies
  const m8 = await prisma.module.findFirst({
    where: { title: { contains: "Module 8: Lifestyle Expectancies" } }
  });
  if (m8) {
    const schema = m8.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      const q = schema.questions.find((x: any) => x.id === "lifestyle_9");
      if (q) {
        q.description = "Someone whose way of living/lifestyle inspires you. \n\n**Examples:** *Cristiano Ronaldo, Elon Musk, etc.*";
        await prisma.module.update({
          where: { id: m8.id },
          data: { schema }
        });
        console.log("Successfully updated Module 8 Question 8 (lifestyle_9)");
      }
    }
  }

  console.log("All schemas updated successfully without wiping any client data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
