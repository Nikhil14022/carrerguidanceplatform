import prisma from '../src/lib/prisma'

async function main() {
  console.log("Updating module schemas non-destructively...");

  // 1. Module 6: Friends & Relationships
  const m6 = await prisma.module.findFirst({
    where: { title: { contains: "Module 6: Friends & Relationships" } }
  });
  if (m6) {
    const schema = m6.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      // Q1 (friends_1)
      const q1 = schema.questions.find((x: any) => x.id === "friends_1");
      if (q1) {
        q1.type = "multiselect";
        delete q1.placeholder;
        q1.options = [
          "Trust", "Loyalty", "Respect", "Love", "Care", "Support", "Honesty", "Understanding", 
          "Acceptance", "Compassion", "Empathy", "Kindness", "Comfort", "Safety", "Belonging", 
          "Freedom", "Peace", "Happiness", "Joy", "Laughter", "Fun", "Adventure", "Growth", 
          "Learning", "Inspiration", "Motivation", "Strength", "Healing", "Reliability", 
          "Commitment", "Authenticity", "Vulnerability", "Consistency", "Forgiveness", "Gratitude", 
          "Patience", "Encouragement", "Togetherness", "Connection", "Presence", "Home", "Family", 
          "Anchor", "Sanctuary", "Haven", "Journey", "Partnership", "Brotherhood", "Sisterhood", 
          "Lifeline", "Energy", "Hope", "Confidence", "Security", "Balance", "Harmony", "Reciprocity", 
          "Selflessness", "Unconditional", "Memories", "Celebration", "Chemistry", "Dependability", 
          "Transparency", "Faith", "Unity", "Companionship"
        ].map((opt, i) => ({ id: String(i + 1), text: opt }));
        console.log("Staged Module 6 Q1 update");
      }

      // Q2 (friends_journey)
      const q2 = schema.questions.find((x: any) => x.id === "friends_journey");
      if (q2) {
        q2.type = "multiselect";
        delete q2.placeholder;
        q2.options = [
          "Beautiful", "Fulfilling", "Meaningful", "Rewarding", "Memorable", "Joyful", "Exciting", 
          "Adventurous", "Fun-filled", "Heartwarming", "Supportive", "Secure", "Stable", "Peaceful", 
          "Comfortable", "Honest", "Genuine", "Deep", "Evolving", "Growing", "Transformative", 
          "Inspiring", "Balanced", "Unforgettable", "Cherished", "Lifelong", "Incomplete", 
          "Complicated", "Uncertain", "Confusing", "Challenging", "Difficult", "Stressful", 
          "Draining", "Lonely", "Disappointing", "Hurtful", "Painful", "Broken", "Fragile", 
          "Distant", "One-sided", "Superficial", "Toxic", "Betrayed", "Misunderstood", "Neglected", 
          "Lost", "Fading", "Temporary", "Rollercoaster", "Mixed", "Unexpected", "Healing", 
          "Hopeful", "Resilient", "Authentic", "Selective", "Unpredictable", "Precious"
        ].map((opt, i) => ({ id: String(i + 1), text: opt }));
        console.log("Staged Module 6 Q2 update");
      }

      // Q4 (friends_3)
      const q4 = schema.questions.find((x: any) => x.id === "friends_3");
      if (q4) {
        q4.type = "multiselect";
        delete q4.placeholder;
        q4.options = [
          "Trustworthy", "Honest", "Reliable", "Knowledgeable", "Playful", "Active", "Sporty", 
          "Talkative", "Silent", "Popular", "Intellectual", "Emotional", "Unpopular", "Gossiper", 
          "Adventurous", "Cautious", "Supportive", "Fun loving", "Well mannered", "Funny", 
          "Fashionable", "Helpful", "Humorous", "Authoritative", "Persuasive", "Nurturer", 
          "Practical", "Spontaneous", "Strong Headed", "Shy", "Foodie", "Caring", "Realistic", 
          "Visionaries", "Outgoing", "Down to earth", "Understanding", "Liberal/Broadminded", 
          "Traditional/Conservative", "Quiet/less talkative"
        ].map((opt, i) => ({ id: String(i + 1), text: opt }));
        console.log("Staged Module 6 Q4 update");
      }

      await prisma.module.update({
        where: { id: m6.id },
        data: { schema }
      });
      console.log("Successfully updated Module 6 questions");
    }
  }

  // 2. Module 7: Family
  const m7 = await prisma.module.findFirst({
    where: { title: { contains: "Module 7: Family" } }
  });
  if (m7) {
    const schema = m7.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      // Q1 (family_1)
      const q1 = schema.questions.find((x: any) => x.id === "family_1");
      if (q1) {
        q1.type = "multiselect";
        delete q1.placeholder;
        q1.options = [
          "Love", "Home", "Belonging", "Safety", "Security", "Trust", "Care", "Support", 
          "Acceptance", "Respect", "Comfort", "Strength", "Togetherness", "Unity", "Connection", 
          "Loyalty", "Commitment", "Responsibility", "Sacrifice", "Protection", "Guidance", 
          "Stability", "Warmth", "Peace", "Happiness", "Joy", "Gratitude", "Compassion", 
          "Kindness", "Understanding", "Encouragement", "Forgiveness", "Patience", "Reliability", 
          "Dependability", "Authenticity", "Nurturing", "Growth", "Foundation", "Identity", 
          "Roots", "Tradition", "Values", "Legacy", "Purpose", "Motivation", "Inspiration", 
          "Refuge", "Sanctuary", "Anchor", "Haven", "Lifeline", "Bond", "Resilience", "Hope", 
          "Balance", "Harmony", "Presence", "Freedom", "Unconditional", "Companionship", 
          "Memories", "Celebration", "Empowerment"
        ].map((opt, i) => ({ id: String(i + 1), text: opt }));
        console.log("Staged Module 7 Q1 update");
      }

      await prisma.module.update({
        where: { id: m7.id },
        data: { schema }
      });
      console.log("Successfully updated Module 7 questions");
    }
  }

  // 3. Module 8: Lifestyle Expectancies
  const m8 = await prisma.module.findFirst({
    where: { title: { contains: "Module 8: Lifestyle Expectancies" } }
  });
  if (m8) {
    const schema = m8.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      // Q1 (lifestyle_1)
      const q1 = schema.questions.find((x: any) => x.id === "lifestyle_1");
      if (q1) {
        q1.type = "multiselect";
        delete q1.placeholder;
        q1.options = [
          "Balance", "Health", "Wellness", "Happiness", "Freedom", "Success", "Comfort", 
          "Luxury", "Simplicity", "Discipline", "Routine", "Habits", "Purpose", "Growth", 
          "Achievement", "Fulfillment", "Adventure", "Experiences", "Relationships", "Family", 
          "Friends", "Community", "Stability", "Security", "Peace", "Mindfulness", "Productivity", 
          "Creativity", "Passion", "Ambition", "Learning", "Exploration", "Travel", "Fitness", 
          "Nutrition", "Self-care", "Spirituality", "Gratitude", "Contentment", "Independence", 
          "Flexibility", "Minimalism", "Sustainability", "Status", "Wealth", "Influence", 
          "Identity", "Expression", "Authenticity", "Resilience", "Consistency", "Energy", 
          "Harmony", "Connection", "Service", "Joy", "Confidence", "Values", "Legacy", 
          "Satisfaction"
        ].map((opt, i) => ({ id: String(i + 1), text: opt }));
        console.log("Staged Module 8 Q1 update");
      }

      await prisma.module.update({
        where: { id: m8.id },
        data: { schema }
      });
      console.log("Successfully updated Module 8 questions");
    }
  }

  // 4. Module 9: Body Image / Self Image
  const m9 = await prisma.module.findFirst({
    where: { title: { contains: "Module 9: Body Image / Self Image" } }
  });
  if (m9) {
    const schema = m9.schema as any;
    if (schema && Array.isArray(schema.questions)) {
      const originalQuestions = schema.questions;
      
      const q1 = originalQuestions.find((x: any) => x.id === "body_1");
      const q2 = originalQuestions.find((x: any) => x.id === "body_2");
      const q3 = originalQuestions.find((x: any) => x.id === "body_3");
      const q5 = originalQuestions.find((x: any) => x.id === "body_5");

      const newQuestions = [
        q1,
        q2,
        q3,
        {
          id: 'body_professional_appearance',
          type: 'multiselect',
          question: 'How do you imagine yourself looking in your ideal professional life?',
          description: 'Select 5–8 words that best describe your preferred appearance, style, and presentation.',
          options: [
            "Formal", "Professional", "Smart", "Elegant", "Sophisticated", "Polished", "Minimalist",
            "Classic", "Modern", "Trendy", "Stylish", "Fashionable", "Creative", "Artistic", "Colourful",
            "Casual", "Relaxed", "Sporty", "Luxurious", "Understated", "Distinctive", "Well-groomed",
            "Refined", "Bold", "Edgy", "Unique", "Approachability", "Neat", "Crisp", "Simple"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        {
          id: 'body_professional_presence',
          type: 'multiselect',
          question: 'When people interact with you professionally, how would you like them to experience your presence?',
          description: 'Select 5–8 words that best describe the impression you want to create.',
          options: [
            "Confident", "Calm", "Authoritative", "Friendly", "Warm", "Charismatic", "Influential",
            "Inspiring", "Assertive", "Humble", "Grounded", "Authentic", "Reliable", "Trustworthy",
            "Energetic", "Passionate", "Cheerful", "Serious", "Focused", "Disciplined", "Composed",
            "Dynamic", "Quiet", "Reserved", "Expressive", "Bold", "Visionary", "Thoughtful", "Curious",
            "Adaptable"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        {
          id: 'body_communication_style',
          type: 'multiselect',
          question: 'How would you like to communicate and express yourself in professional settings?',
          description: 'Select 5–8 words that best reflect your preferred communication style.',
          options: [
            "Articulate", "Persuasive", "Clear", "Precise", "Engaging", "Motivating", "Conversational",
            "Direct", "Diplomatic", "Empathetic", "Confident", "Calm", "Enthusiastic", "Logical",
            "Analytical", "Storytelling", "Inspirational", "Professional", "Influential", "Collaborative"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        {
          id: 'body_professional_identity',
          type: 'multiselect',
          question: 'What do you want to be known for in your professional life?',
          description: 'Select 5–8 words that best represent the professional identity you aspire to build.',
          options: [
            "Leader", "Expert", "Mentor", "Consultant", "Entrepreneur", "Executive", "Innovator",
            "Strategist", "Researcher", "Educator", "Creator", "Problem-solver", "Visionary", "Specialist",
            "Influencer", "Change-maker", "Organised", "Efficient", "Dependable", "High-achiever"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        {
          id: 'body_impact_legacy',
          type: 'multiselect',
          question: 'What kind of impact would you like to leave through your work?',
          description: 'Select 5–8 words that best describe the difference you want to make.',
          options: [
            "Powerful", "Calm", "Inspirational", "Intelligent", "Reliable", "Creative", "Innovative",
            "Approachable", "Passionate", "Ambitious", "Balanced", "Authentic", "Resilient", "Determined",
            "Optimistic", "Humble", "Fearless", "Curious", "Vision-driven", "Purpose-driven"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        q5,
        {
          id: 'body_confidence_improvements',
          type: 'multiselect',
          question: 'If you had the opportunity to improve any aspect of your physical appearance or personal presentation, what changes would you choose to make that you believe would increase your confidence in your career and everyday life?',
          description: 'Select all that apply.',
          options: [
            // Physical Appearance
            "Physical: Improve overall fitness",
            "Physical: Lose weight",
            "Physical: Gain healthy weight",
            "Physical: Build muscle",
            "Physical: Improve posture",
            "Physical: Improve skin health",
            "Physical: Improve hair style or hair health",
            "Physical: Improve smile or dental appearance",
            "Physical: Improve grooming habits",
            "Physical: Improve personal hygiene",
            "Physical: Improve body language",
            "Physical: Improve energy and vitality",
            "Physical: Improve sleep and overall wellness",
            "Physical: I am happy with my physical appearance",
            // Personal Presentation
            "Presentation: Upgrade my wardrobe",
            "Presentation: Develop my personal style",
            "Presentation: Dress more professionally",
            "Presentation: Dress more confidently",
            "Presentation: Improve communication skills",
            "Presentation: Improve public speaking skills",
            "Presentation: Improve eye contact",
            "Presentation: Improve facial expressions",
            "Presentation: Improve voice and tone",
            "Presentation: Improve confidence while meeting new people",
            "Presentation: Improve overall executive presence",
            "Presentation: Learn professional etiquette",
            // Mindset & Confidence
            "Mindset: Become more self-confident",
            "Mindset: Worry less about what others think",
            "Mindset: Accept myself as I am",
            "Mindset: Feel more comfortable in my own skin",
            "Mindset: Build greater self-esteem",
            "Mindset: Become more disciplined with my health and lifestyle",
            // Other
            "Other: Specify details in notes",
            "Other: I would not like to make any significant changes."
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        },
        {
          id: 'body_confidence_impact',
          type: 'multiselect',
          question: 'Which of these changes do you believe would have the greatest positive impact on your confidence?',
          description: 'Select up to 3.',
          options: [
            "Physical appearance",
            "Communication and presentation",
            "Health and fitness",
            "Self-acceptance",
            "Professional skills"
          ].map((opt, i) => ({ id: String(i + 1), text: opt }))
        }
      ].filter(Boolean);

      schema.questions = newQuestions;

      await prisma.module.update({
        where: { id: m9.id },
        data: { schema }
      });
      console.log("Successfully updated Module 9 questions");
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
