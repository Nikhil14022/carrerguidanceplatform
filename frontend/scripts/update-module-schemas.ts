import prisma from '../src/lib/prisma'

async function main() {
  console.log("Updating module schemas non-destructively...");

  // 1. Module 1: Demographics
  const m1 = await prisma.module.findFirst({
    where: { title: { contains: "Module 1: Demographics" } }
  });
  if (m1) {
    const schema = m1.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      // Q7 (demo_exams)
      const q7 = schema.questions.find((x: any) => x.id === "demo_exams");
      if (q7) {
        q7.col2Label = 'Status';
        q7.col2Options = ['Ongoing', 'Completed'];
        q7.col3Label = 'Score (if completed)';
        console.log("Staged Q7 (demo_exams) update");
      }

      // Q8 (demo_extracurricular)
      const q8 = schema.questions.find((x: any) => x.id === "demo_extracurricular");
      if (q8) {
        q8.col2Label = 'Frequency';
        q8.col2Options = ['Daily', 'Weekly', 'Monthly', 'Randomly'];
        q8.col4Label = 'Rating';
        q8.col4Options = ['I am very good at it', 'I am decent at it', 'I just do it for fun'];
        console.log("Staged Q8 (demo_extracurricular) update");
      }

      // Q12 (demo_hobbies)
      const q12 = schema.questions.find((x: any) => x.id === "demo_hobbies");
      if (q12) {
        q12.col2Label = 'Time Spent';
        q12.col2Options = ['Daily', 'Weekly', 'Monthly', 'Randomly'];
        // Remove description column by deleting col3Label
        delete q12.col3Label;
        console.log("Staged Q12 (demo_hobbies) update");
      }

      await prisma.module.update({
        where: { id: m1.id },
        data: { schema }
      });
      console.log("Successfully updated Module 1: Demographics");
    }
  }

  // 2. Module 2: Aim and Vision
  const m2 = await prisma.module.findFirst({
    where: { title: { contains: "Module 2: Aim and Vision" } }
  });
  if (m2) {
    const schema = m2.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      // Q5 (aim_3a)
      const q5 = schema.questions.find((x: any) => x.id === "aim_3a");
      if (q5) {
        q5.col1Label = 'Top 5 Important Things/Activities';
        q5.col2Label = 'Top 5 People';
        console.log("Staged Q5 (aim_3a) update");
      }

      // Q6 (aim_3b)
      const q6 = schema.questions.find((x: any) => x.id === "aim_3b");
      if (q6) {
        q6.col2Label = 'Estimated time spent (Daily)';
        console.log("Staged Q6 (aim_3b) update");
      }

      // Q8 / aim_4
      const q8 = schema.questions.find((x: any) => x.id === "aim_4");
      if (q8) {
        q8.description = "Either something that already exists or something you would want to exist. Can be individual fields or a combo of two different fields. \n\n**Examples:** *Musician, Streamer, Designer, Athlete, Influencer, Astronaut, etc.*";
        console.log("Staged Q8 (aim_4) update");
      }

      await prisma.module.update({
        where: { id: m2.id },
        data: { schema }
      });
      console.log("Successfully updated Module 2: Aim and Vision");
    }
  }

  // 3. Module 5: Movies and Visual World
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

  // 4. Module 6: Friends & Relationships
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

  // 5. Module 8: Lifestyle Expectancies
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
