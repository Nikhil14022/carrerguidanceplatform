import { hash } from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function main() {
  const hashedPassword = await hash('admin123', 12)

  // ── Cleanup: delete ALL existing modules (and linked data) then recreate fresh ──
  const allModules = await prisma.module.findMany({ select: { id: true } })
  if (allModules.length > 0) {
    const allIds = allModules.map(m => m.id)
    const linked = await prisma.clientModule.findMany({
      where: { moduleId: { in: allIds } }, select: { id: true }
    })
    const linkedIds = linked.map(cm => cm.id)
    if (linkedIds.length > 0) {
      await prisma.moduleComment.deleteMany({ where: { clientModuleId: { in: linkedIds } } })
      await prisma.moduleResponse.deleteMany({ where: { clientModuleId: { in: linkedIds } } })
      await prisma.clientModule.deleteMany({ where: { id: { in: linkedIds } } })
    }
    await prisma.module.deleteMany({})
    console.log(`Removed ${allModules.length} existing module(s) — recreating fresh.`)
  }
  // ── End cleanup ──

  const adminEmail = 'admin@careerflow.com'
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { name: 'CareerFlow Admin', role: 'ADMIN', password: hashedPassword }
    })
  } else {
    await prisma.user.create({
      data: { email: adminEmail, password: hashedPassword, name: 'CareerFlow Admin', role: 'ADMIN' }
    })
  }

  const modules = [

    // ══════════════════════════════════════════════════════════════
    // TOPIC MODULES (from Word document — 11 sections)
    // ══════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────
    // MODULE 1 — DEMOGRAPHICS
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 1: Demographics',
      description: 'Basic personal and academic background information.',
      schema: {
        questions: [
          {
            id: 'demo_name',
            type: 'text',
            question: 'Name',
            placeholder: 'Your full name...'
          },
          {
            id: 'demo_age',
            type: 'number',
            question: 'Age',
            placeholder: 'Your age in years...'
          },
          {
            id: 'demo_dob',
            type: 'date',
            question: 'Date of Birth'
          },
          {
            id: 'demo_education',
            type: 'education_history',
            question: 'Educational Background'
          },
          {
            id: 'demo_residence',
            type: 'text',
            question: 'Residence (City / Town)',
            placeholder: 'Where you currently live...'
          },
          {
            id: 'demo_lives_with',
            type: 'text',
            question: 'Lives with — Mother / Father / Others',
            placeholder: 'e.g., Mother, Father, Grandparents...'
          },
          {
            id: 'demo_subjects',
            type: 'table',
            question: 'Subjects (current)',
            minRows: 3,
            col1Label: 'Subject',
            col2Label: 'Views'
          },
          {
            id: 'demo_exams',
            type: 'table',
            question: 'Additional Exams (completed / giving / planning to give)',
            minRows: 3,
            col1Label: 'Exam Name (e.g., JEE, NEET, SAT)',
            col2Label: 'Status',
            col3Label: 'Score (if completed)'
          },
          {
            id: 'demo_extracurricular',
            type: 'table',
            question: 'Any extracurricular activities you have participated in? (highlight those which you have enjoyed)',
            minRows: 3,
            col1Label: 'Activity',
            col2Label: 'Frequency',
            col3Label: 'Achievements',
            col4Label: 'Rating'
          },
          {
            id: 'demo_marksheets',
            type: 'file',
            question: 'Share with us your marksheets (Upload PDF/Images)',
            description: '- If in 10th grade – upload 7th, 8th, 9th and latest year marksheets\n- If in 12th grade – upload 9th, 10th, 11th and latest year marksheets\n- If in degree – upload 10th, 12th, and the latest year marksheets\n- If in post-graduation – upload 10th, 12th graduation, and latest year marksheets'
          },
          {
            id: 'demo_academic_overview',
            type: 'table',
            question: 'Academic Overview — For each subject, classify it:',
            description: 'Categories: Like & Score Well | Do not Like but Score Well | Like & Do not Score Well | Do not Like & Do not Score',
            minRows: 5,
            col1Label: 'Subject',
            col2Label: 'Category'
          },
          {
            id: 'demo_thoughts_academics',
            type: 'multiselect_with_rank',
            question: 'Thoughts on education & academics — which of the following best describes you? (Select all that apply, then rank)',
            options: [
              { id: '1', text: 'I am academically driven person & I enjoy it' },
              { id: '2', text: "I am academically driven person because it's important" },
              { id: '3', text: "I am academically driven person because it's a direct/indirect compulsion" },
              { id: '4', text: 'I am a combination of education & being outside (education being on higher side)' },
              { id: '5', text: 'I am a combination of education & being outside (Balanced)' },
              { id: '6', text: 'I am a combination of education & being outside (More of outgoing person)' },
              { id: '7', text: 'Academics is difficult for me, but I am willing to try hard' },
              { id: '8', text: "Academics is difficult for me & have realised it's going to be challenging in spite of hard work" },
              { id: '9', text: "Academics is difficult for me & it's just matter of clearing now" },
              { id: '10', text: "I am not academic driven person, and I don't want to carry on further" }
            ]
          },
          {
            id: 'demo_hobbies',
            type: 'table',
            question: 'Apart from academics, what other areas interest you or what are you most curious about? OR What are the things you like to do in your free time? (Hobbies)',
            minRows: 3,
            col1Label: 'Hobby/Interest',
            col2Label: 'Description',
            col3Label: 'Time Spent'
          },
          {
            id: 'demo_routine',
            type: 'schedule',
            question: 'What is your routine every day? (Time → Activity)',
            description: 'Share your typical daily schedule as closely as possible (e.g., 7am Wake up, 8am School, 3pm Sports, 10pm Sleep)'
          }
        ]
      },
      defaultOrder: 1
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 2 — AIM AND VISION
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 2: Aim and Vision',
      description: 'Your goals, aspirations, and vision for the future.',
      schema: {
        questions: [
          {
            id: 'aim_1',
            type: 'text',
            question: 'What are you aiming at with these sessions? Any expectations from the sessions? Your intention for yourself through these sessions?',
            placeholder: 'Share your goals and expectations from this career counselling process...'
          },
          {
            id: 'aim_2_career',
            type: 'text',
            question: 'Areas You Would like to work on / Goals: Career/Academics/Course',
            description: 'Focus on: **school, curriculum, marks, system, subjects**',
            placeholder: 'Your goals here...'
          },
          {
            id: 'aim_2_self',
            type: 'text',
            question: 'Areas You Would like to work on / Goals: Self',
            description: 'Focus on: **personality, skills, qualities, looks, body**',
            placeholder: 'Your goals here...'
          },
          {
            id: 'aim_2_family',
            type: 'text',
            question: 'Areas You Would like to work on / Goals: Family',
            description: 'Focus on: **communication, bond, relationship**',
            placeholder: 'Your goals here...'
          },
          {
            id: 'aim_2_friends',
            type: 'text',
            question: 'Areas You Would like to work on / Goals: Friends/Relationship',
            placeholder: 'Your goals here...'
          },
          {
            id: 'aim_3a',
            type: 'table',
            question: 'Name the 5 Most Important things/people in your life right now?',
            description: 'First share what comes to mind, then explore in depth. \n\n**Examples:** *Gadgets, Games, Friends, Daily habits, General knowledge, Current affairs, Meditation/Yoga, Food items, Self, Family, Relationships, Sports, Career, Academics, Shopping, Reading books, Hobbies, Movies, Fitness, Lifestyle, Social media, Travelling, Music, Going out/Partying, TV shows*',
            minRows: 5,
            col1Label: 'Important Thing/Person',
            col2Label: 'Why are they/it important?'
          },
          {
            id: 'aim_3b',
            type: 'table',
            question: 'Name 5 areas in which you spend the maximum amount of your time',
            minRows: 5,
            col1Label: 'Area / Activity',
            col2Label: 'Estimated time spent'
          },
          {
            id: 'aim_4',
            type: 'text',
            question: 'What is the out of the box career that fascinates you the most?',
            description: 'Either something that already exists or something you would want to exist. Can be individual fields or a combo of two different fields.',
            placeholder: 'Describe the career that excites you most...'
          },
          {
            id: 'aim_5',
            type: 'text',
            question: 'Imagine a life where you have all the money and resources — how would you want to use/spend them?',
            description: '**Examples:** *Travel, Buy a house/bungalow, Buy cars/bike/yacht, Buy all the brands, Donate/charity, Invest, Savings, Adventure, Create a start-up, Games, Experience, Gadgets, Society, Lifestyle, Parents/relatives*',
            placeholder: 'Describe how you would spend unlimited resources...'
          },
          {
            id: 'aim_6',
            type: 'table',
            question: 'Name 10 things that you would like to have in your life within the span of 10 years. This can include anything & everything — be creative!',
            description: '**Examples:** *Skills, Qualities, Things you want to do/buy/experience, Personality type, Relationship, Job/Salary, Travel, Social Status, Own a House/Car, Lifestyle change*',
            minRows: 10,
            col1Label: 'Thing to have/achieve',
            col2Label: 'Why do you want it?'
          }
        ]
      },
      defaultOrder: 2
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 3 — CAREER PERSPECTIVE (Degree Only)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 3: Career Perspective',
      description: 'Career readiness, priorities, and work environment preferences (Degree students).',
      schema: {
        questions: [
          {
            id: 'career_1',
            type: 'choice',
            question: 'Which of the following do you relate the most with?',
            options: [
              { id: '1', text: 'I want to design my future career to the point where I know exactly what I will do' },
              { id: '2', text: "I don't know how long it will take or how difficult it will be, but that's the result I want" },
              { id: '3', text: 'I want to move toward designing my future career, but I am not ready to go all the way' },
              { id: '4', text: 'I want to decide on some parts of the design and leave others open for now' },
              { id: '5', text: 'I am not ready to design my career now' },
              { id: '6', text: 'I want to use this process to learn more about myself & begin to explore career issues' },
              { id: '7', text: 'I am doing this because I am supposed to, expected to, or have to' }
            ]
          },
          {
            id: 'career_2',
            type: 'rank',
            question: 'While choosing a career, the following things matter to me (Select 3 and rank them in order of priority)',
            options: [
              { id: '1', text: 'A field which has reputation and status in the society' },
              { id: '2', text: 'Something I enjoy the most – happy & satisfied at the end of the day' },
              { id: '3', text: 'Where I feel most connected with my work – can learn something new every day' },
              { id: '4', text: 'Where I can experiment frequently – don\'t want it to get monotonous' },
              { id: '5', text: 'Where I don\'t have to move around at all – would prefer a desk job' },
              { id: '6', text: 'Where I don\'t have to move around much – somewhat is okay but not a lot' },
              { id: '7', text: 'Where I get to travel a lot, explore and experiment' },
              { id: '8', text: 'In sync with my natural talents & skills – I am okay building extra skills' },
              { id: '9', text: 'I don\'t want to put a lot of efforts – want easy-going' },
              { id: '10', text: 'Where I can earn amazingly well' },
              { id: '11', text: 'I would like to experiment with unconventional options' },
              { id: '12', text: 'I would prefer to stick to safe, conventional options' },
              { id: '13', text: 'Where the work is meaningful to me' },
              { id: '14', text: 'Where it will provide me my own space of expression' }
            ]
          },
          {
            id: 'career_3a',
            type: 'rank',
            question: 'Work criteria — People related (Select 3 and rank them)',
            options: [
              { id: '1', text: 'I get to work by myself' },
              { id: '2', text: 'I would prefer working in a group/team' },
              { id: '3', text: 'I want to have a balance between working with others and by myself' },
              { id: '4', text: 'I want more of working by self and less of group work' },
              { id: '5', text: 'I want more of working with group and less by myself' },
              { id: '6', text: 'I would prefer working with people who are more structured & deadline oriented' },
              { id: '7', text: 'I would prefer working with people who are flexible by nature, not too rigid/stubborn' },
              { id: '8', text: 'I would prefer working with people who like to be unstructured, no guidelines, creating their own path' },
              { id: '9', text: 'I would prefer working with people who help each other grow rather than pulling others down to get ahead' }
            ]
          },
          {
            id: 'career_3b',
            type: 'rank',
            question: 'Work criteria — Environment/Culture (Select 3 and rank them)',
            options: [
              { id: '1', text: 'Where efficiency & quality of work is given importance over the amount of work' },
              { id: '2', text: 'Where the overall culture is result-oriented, working towards collective goal' },
              { id: '3', text: 'Where even individual goals are given importance' },
              { id: '4', text: 'Where the functioning is more of process-driven, having systems-thinking' },
              { id: '5', text: 'Where the functioning is more inclined towards out of the box thinking & creativity' },
              { id: '6', text: 'Where there is a good combination between systems thinking & creativity' },
              { id: '7', text: 'Where there is a healthy competition and not unnecessary pressure or proving each other' },
              { id: '8', text: 'Where the employees are valued for their own skills/talents, no comparisons' },
              { id: '9', text: 'Where there is little to no politics involved' },
              { id: '10', text: 'Where the culture is very supportive of individual growth' },
              { id: '11', text: 'Where they have various opportunities for growth, no stagnancy' },
              { id: '12', text: 'Where there is recognition for the work everyone does' }
            ]
          }
        ]
      },
      defaultOrder: 3
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 4 — RISK TAKING ABILITY
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 4: Risk Taking Ability',
      description: 'Your risk appetite, financial priorities, and passion for your work.',
      schema: {
        questions: [
          {
            id: 'risk_1',
            type: 'choice',
            question: 'How much risk are you willing to take in your career?',
            options: [
              { id: 'minimal', text: 'Minimal risk (I prefer safe, stable roles)' },
              { id: 'moderate', text: "Moderate risk (I'm open to some risks for potential rewards)" },
              { id: 'high', text: 'High risk (I embrace significant risks for greater opportunities)' }
            ]
          },
          {
            id: 'risk_2',
            type: 'choice',
            question: 'How important is creative expression in your career?',
            options: [
              { id: 'not_important', text: 'Not important (I focus more on practical aspects)' },
              { id: 'somewhat', text: 'Somewhat important (I value a balance between expression and practicality)' },
              { id: 'very', text: 'Very important (Creative expression is a top priority for me)' }
            ]
          },
          {
            id: 'risk_3',
            type: 'choice',
            question: 'What is your priority when it comes to financial stability?',
            options: [
              { id: 'high', text: 'High priority (Financial stability is my main concern)' },
              { id: 'medium', text: 'Medium priority (I value financial stability but also consider other factors)' },
              { id: 'low', text: 'Low priority (I am willing to sacrifice financial stability for other opportunities)' }
            ]
          },
          {
            id: 'risk_4',
            type: 'choice',
            question: 'Which best describes your approach to stability and exploration?',
            options: [
              { id: 'stability_first', text: 'First, I want stability, then I want to explore.' },
              { id: 'explore_first', text: 'First, I want to explore; stability is not a concern in the short run.' },
              { id: 'explore_safely', text: 'I want to explore but safely.' },
              { id: 'stability_only', text: 'Stability matters, and exploring does not.' }
            ]
          },
          {
            id: 'risk_5',
            type: 'choice',
            question: 'How important is working in a field you are passionate about?',
            options: [
              { id: 'very', text: 'Very important (I want to work in a field I am passionate about)' },
              { id: 'somewhat', text: "Somewhat important (I prefer to work in a field I like, but it's not a deal-breaker)" },
              { id: 'not', text: 'Not important (I focus more on other aspects like salary or stability)' }
            ]
          }
        ]
      },
      defaultOrder: 4
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 5 — MOVIES AND VISUAL WORLD
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 5: Movies and Visual World',
      description: 'Your interaction with media, movies, books, games, music, and the digital world.',
      schema: {
        questions: [
          {
            id: 'visual_fav_movies',
            type: 'table',
            question: 'Favourite Movies (Top 5)',
            minRows: 5,
            col1Label: 'Movie Name'
          },
          {
            id: 'visual_fav_series',
            type: 'table',
            question: 'Favourite TV Serials / Series (Top 5)',
            minRows: 5,
            col1Label: 'Series Name'
          },
          {
            id: 'visual_genres',
            type: 'rank',
            question: 'Genres of movies/series you enjoy (Rank your top 5)',
            numRanks: 5,
            options: [
              { id: 'action', text: 'Action' },
              { id: 'adventure', text: 'Adventure' },
              { id: 'comedy', text: 'Comedy' },
              { id: 'drama', text: 'Dramas' },
              { id: 'horror', text: 'Horror' },
              { id: 'crime', text: 'Crime' },
              { id: 'mystery', text: 'Mystery' },
              { id: 'scifi', text: 'Sci-fi' },
              { id: 'parody', text: 'Parody' },
              { id: 'thriller', text: 'Thrillers' },
              { id: 'romance', text: 'Romance' },
              { id: 'documentary', text: 'Documentaries' },
              { id: 'sports', text: 'Sports' },
              { id: 'historical', text: 'Historical' },
              { id: 'musical', text: 'Musical' },
              { id: 'superhero', text: 'Superhero' },
              { id: 'psychological', text: 'Psychological' },
              { id: 'legal', text: 'Legal Drama' },
              { id: 'anime', text: 'Anime' },
              { id: 'tollywood', text: 'Tollywood' },
              { id: 'animation', text: 'Animation' },
              { id: 'fantasy', text: 'Fantasy' },
              { id: 'romcom', text: 'Rom-Com' },
              { id: 'classical', text: 'Classical' },
              { id: 'family', text: 'Family' },
              { id: 'filmnoir', text: 'Film Noir' },
              { id: 'war', text: 'War' },
              { id: 'biography', text: 'Biography' },
              { id: 'western', text: 'Western' },
              { id: 'short', text: 'Short Films' }
            ]
          },
          {
            id: 'visual_superpower',
            type: 'text',
            question: 'If you could have a superpower, what would it be and why?',
            placeholder: 'Describe your superpower and the reason behind your choice...'
          },
          {
            id: 'visual_books',
            type: 'choice',
            question: 'Do you like reading books?',
            options: [
              { id: 'yes', text: 'YES' },
              { id: 'no', text: 'NO' }
            ]
          },
          {
            id: 'visual_book_genres',
            type: 'multiselect',
            dependsOn: { questionId: 'visual_books', value: 'yes' },
            question: 'Different genre of books you like reading or would like to read? (Select all that apply)',
            options: [
              { id: 'fiction', text: 'Fiction' },
              { id: 'nonfiction', text: 'Non-fiction' },
              { id: 'scifi', text: 'Science Fiction' },
              { id: 'romance', text: 'Romance' },
              { id: 'thriller', text: 'Thriller' },
              { id: 'crime', text: 'Crime' },
              { id: 'suspense', text: 'Suspense' },
              { id: 'selfhelp', text: 'Self-help' },
              { id: 'history', text: 'History' },
              { id: 'mystery', text: 'Mystery' },
              { id: 'fantasy', text: 'Fantasy' },
              { id: 'biopics', text: 'Biopics' },
              { id: 'philosophical', text: 'Philosophical' },
              { id: 'mythological', text: 'Mythological' },
              { id: 'fairytales', text: 'Fairy Tales' }
            ]
          },
          {
            id: 'visual_characters',
            type: 'table',
            question: 'Characters you love/relate the most with (books/movies/series)? Any character you would want to be like?',
            description: 'Also mention a real known person whose life/qualities inspire you.',
            minRows: 3,
            col1Label: 'Character / Person',
            col2Label: 'Why do you relate / Reason'
          },
          {
            id: 'visual_games',
            type: 'table',
            question: 'Favourite games you are currently playing or have ever played? Why?',
            description: 'Game genres: Shooter Games (COD, PubG, Fortnite) | Action/Fighting | Building/Creating games | Racing Games | Brain games | Puzzles, Logic Games (Tetris) | Platform Games (Super Mario) | Strategy/Board Games (Ludo, chess, WWE, cricket cards, Pokémon) | Interactive 3D Movie Games | Candy Crush | Interactive Games (Jenga) | Crime/Investigation | Superhero | Horror | Sports',
            prefilledRows: [
              'Favourite games',
              'Favourite game genres',
              'Why you enjoy them'
            ],
            col1Label: 'Prompt',
            col2Label: 'Answer'
          },
          {
            id: 'visual_music',
            type: 'text',
            question: 'Favourite music genres?',
            placeholder: 'e.g., Pop, Hip-hop, Classical, Rock, EDM, Folk, Jazz...'
          },
          {
            id: 'visual_youtube_insta',
            type: 'table',
            question: 'Do you use YouTube and/or Instagram? List your Top Channels/Pages on each.',
            prefilledRows: [
              'YouTube Top Channels',
              'Instagram Top Pages'
            ],
            col1Label: 'Platform',
            col2Label: 'Top Channels / Pages'
          },
          {
            id: 'visual_content_genres',
            type: 'table',
            minRows: 3,
            col1Label: 'Content Genre',
            question: 'Content genres you follow online (List them)'
          },
          {
            id: 'visual_content_creators',
            type: 'text',
            question: 'Any specific Bloggers/YouTubers/Channels you follow? (Share your subscription/following list)',
            placeholder: 'Specific channels/creators you love: ...'
          },
        ]
      },
      defaultOrder: 5
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 6 — FRIENDS & RELATIONSHIPS
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 6: Friends & Relationships',
      description: 'Understanding your social circle, friendships, peer pressure, and social behaviour.',
      schema: {
        questions: [
          {
            id: 'friends_1',
            type: 'text',
            question: 'What is friendship for you? (definition/understanding)',
            placeholder: 'Define friendship in your own words...'
          },
          {
            id: 'friends_journey',
            type: 'text',
            question: 'Describe in 5 lines your friendship/school journey',
            placeholder: 'Your friendship story and school experience...'
          },
          {
            id: 'friends_2',
            type: 'table',
            question: 'Top 3 craziest things you have done with your friends (stupid, funny, hilarious, embarrassing, most memorable)',
            minRows: 3,
            col1Label: 'Craziest Thing',
            col2Label: 'When/Why'
          },
          {
            id: 'friends_3',
            type: 'text',
            question: 'What kind of people do you think you can easily form a friendship with & why?',
            description: 'Examples: Trustworthy | Honest | Reliable | Knowledgeable | Playful | Active | Sporty | Talkative | Silent | Popular | Intellectual | Emotional | Unpopular | Gossiper | Adventurous | Cautious | Supportive | Fun loving | Well mannered | Funny | Fashionable | Helpful | Humorous | Authoritative | Persuasive | Nurturer | Practical | Spontaneous | Strong Headed | Shy | Foodie | Caring | Realistic | Visionaries | Outgoing | Down to earth | Understanding | Liberal/Broadminded | Traditional/Conservative | Quiet/less talkative',
            placeholder: 'Describe the qualities of people you connect with and why...'
          },
          {
            id: 'friends_4',
            type: 'choice',
            question: 'You and Friends: Who are you here?',
            options: [
              { id: '1', text: 'I have a lot of friends & honestly, they mean a lot to me. I really enjoy being with them' },
              { id: '2', text: 'I have a lot of friends & have a mixed combination of good / difficult time with them' },
              { id: '3', text: "I have a lot of friends but most times it's too much for me to handle within" },
              { id: '4', text: 'I have a lot of friends & keep hopping within them' },
              { id: '5', text: 'I have few friends & we are very connected & I am really content with them' },
              { id: '6', text: "I have few friends & yeah, it's just fine for now. I don't want to go through the process of making new friends" },
              { id: '7', text: 'I have few friends & honestly really want new friends' },
              { id: '8', text: "I really don't have good close friends. I find it difficult but for now I don't want to go through the process of making one as its too tasking for me" },
              { id: '9', text: "I really don't have good close friends. I think I need few in my life & I am ready to open up myself to experiment and I have an idea of how to go ahead with it" },
              { id: '10', text: "I really don't have good close friends. I think I need few in my life & I am ready to open up myself to experiment, but I don't know how to do it" },
              { id: '11', text: "I think I am good alone. I don't trust people & it's better to be alone than broken trust" }
            ]
          },
          {
            id: 'friends_5',
            type: 'choice',
            question: 'Did you ever have difficulties making friends or socialising?',
            options: [
              { id: 'yes', text: 'Yes' },
              { id: 'no', text: 'No' }
            ]
          },
          {
            id: 'friends_6',
            type: 'text',
            dependsOn: { questionId: 'friends_5', value: 'yes' },
            question: 'What were the difficulties? Does it still impact how you socialise? If you already dealt successfully with it, how did you do it?',
            placeholder: 'Describe the difficulties and how you handled or are handling them...'
          },
          {
            id: 'friends_7a',
            type: 'choice',
            question: 'Have some of your closest friends tried to push you to do something that you did not want to do?',
            description: 'Examples: Drinking, Smoking, Pranks, Lying to parents/others, Eating non-veg, Physical fight, Proposing/Dating, Shoplifting, Perform a dare, Talk to a stranger, Cheating/Breakup, Breaking in/out of house',
            options: [
              { id: 'yes', text: 'YES' },
              { id: 'no', text: 'NO' }
            ]
          },
          {
            id: 'friends_7b',
            type: 'choice',
            dependsOn: { questionId: 'friends_7a', value: 'yes' },
            question: 'How did you / will you face such a situation?',
            options: [
              { id: '1', text: 'Avoid the friend completely because he/she did not respect me' },
              { id: '2', text: 'Deny firmly because I do not like to do things that go against my principles, or I do not want to do' },
              { id: '3', text: 'Give in and do it so that I can save my friendship' },
              { id: '4', text: 'Reason/argue with them to make my point and then walk away' },
              { id: '5', text: 'Maybe not break the friendship but not talk with them for a while' },
              { id: '6', text: 'Simply walk away from the situation' },
              { id: '7', text: "Find another way to come out of the situation – making sure I don't hurt anyone or it doesn't affect the friendship" },
              { id: '8', text: 'Give it a chance to see what will happen if I do so' },
              { id: '9', text: 'Give it a chance but only if it is not something that will harm others' },
              { id: '10', text: 'Make them understand my reasons for not doing it and ask them also to not get into any trouble' }
            ]
          },
          {
            id: 'friends_7c',
            type: 'choice',
            question: 'Imagine 2 of your friends are fighting — what role would you play in such a situation?',
            options: [
              { id: '1', text: 'Try to mediate between both of them and make sure things do not escalate' },
              { id: '2', text: 'Fuel the fire for fun, but only if the situation is not too serious' },
              { id: '3', text: 'Support the one whom I am closest to, even if it means I am on the wrong side' },
              { id: '4', text: 'Support the one who is correct, even if it meant going against my closest friend' },
              { id: '5', text: 'Avoid the fight and walk away, not interested in any drama' },
              { id: '6', text: 'Play on both the sides, do not want to take one side, and let it affect the friendship' },
              { id: '7', text: "Simply standing and watching the fight, don't want to meddle in others' business" },
              { id: '8', text: 'Backstabbing during the fight' },
              { id: '9', text: 'Do nothing during the fight but later can be a shoulder to cry on' }
            ]
          },
          {
            id: 'friends_8',
            type: 'choice',
            question: 'What do you do when you disagree with your friends on certain things?',
            options: [
              { id: '1', text: 'Strongly disagree & take a stand for what I believe in or want to do' },
              { id: '2', text: "Avoid and let it go because I don't like to get into any disagreements" },
              { id: '3', text: "Agree with others as I don't want to end up being alone" },
              { id: '4', text: 'Okay with other people having different opinions' },
              { id: '5', text: 'Using their words against them' },
              { id: '6', text: 'Change the topic for a safe side' },
              { id: '7', text: 'Convincing the majority to take my side so that it becomes much easier to get what I want' },
              { id: '8', text: "Taking someone's help" }
            ]
          },
          {
            id: 'friends_9',
            type: 'choice',
            question: 'Do you like meeting new people and making friends?',
            options: [
              { id: '1', text: 'Yes of course, I love meeting new people' },
              { id: '2', text: 'No, I would rather be with my own set of people' },
              { id: '3', text: 'Yes, I like meeting new people' },
              { id: '4', text: 'Depends on my mood' },
              { id: '5', text: 'Yes, but not too many people' },
              { id: '6', text: 'Only sometimes, not very frequently' },
              { id: '7', text: 'No, I would rather prefer my own company (myself)' },
              { id: '8', text: 'Meeting people is fine, but I am not very sure of making new friends' },
              { id: '9', text: 'Have not tried it much yet, but would like to experiment with the same' },
              { id: '10', text: 'Only, if I have someone mutual with me while meeting new people' }
            ]
          },
          {
            id: 'friends_10',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'How happy are you with your existing group of friends? (Rate 1–10)',
            description: '1 = Not happy at all, 10 = Extremely happy'
          }
        ]
      },
      defaultOrder: 6
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 7 — FAMILY
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 7: Family',
      description: 'Family dynamics, relationships, and family influence on career decisions.',
      schema: {
        questions: [
          {
            id: 'family_1',
            type: 'text',
            question: "What does Family mean to you? If you must randomly give out words when you hear 'Family', what all would you say?",
            placeholder: 'Share words or thoughts that come to mind when you think of family...'
          },
          {
            id: 'family_2',
            type: 'text',
            question: 'Describe your relationship with your parents/siblings in one word.',
            placeholder: 'e.g., Mother: Warm | Father: Strict | Sibling: Fun'
          },
          {
            id: 'family_3',
            type: 'choice',
            question: 'How would you describe your family space for now?',
            options: [
              { id: '1', text: "We all are very connected to each other & share everything. There's open space for sharing anything & everything & it's a beautiful support system within. We do give individual space to each other too." },
              { id: '2', text: "We all are very connected to each other & share almost everything apart from few topics which we have disputes on (but only few & disagreement doesn't go extreme. We come back pretty quickly)" },
              { id: '3', text: "We all are connected in a way but there's no real sharing about all diverse topics. Maybe few topics but don't really interfere too much. Everybody operates pretty individualistically" },
              { id: '4', text: 'I am more connected to one person (mom/dad/grandparent/sibling) & share/express very openly about almost every topic without thinking & having a fear of being judged' },
              { id: '5', text: 'I am more connected to one person but share limited stuff to them due to response & reactions I receive or may receive' },
              { id: '6', text: "I am more connected to one person but don't really talk or share personal stuff that much" },
              { id: '7', text: "Most times we only talk about limited stuff (Food, Health, Studies & Career) that's it" },
              { id: '8', text: "We have difference in thinking and that leads to a lot of clashes within. The atmosphere is always on edge & there's lack of understanding & communication within" },
              { id: '9', text: "It's suffocating most of the times but I have no choice. Once I am independent, I would want to go away from here" },
              { id: '10', text: "It's suffocating most of the times but I have no choice. Once I am independent, I would like to work around & bring on certain changes" },
              { id: '11', text: "I live most times in my room & space, talk only when it's a need or compulsion" }
            ]
          },
          {
            id: 'family_4',
            type: 'text',
            question: 'What are the general thoughts of your family towards/for you? Describe.',
            placeholder: "Describe how your family sees you, their expectations, and their feelings towards you..."
          },
          {
            id: 'family_5',
            type: 'choice',
            question: 'Does your family influence your career/work decisions?',
            options: [
              { id: 'yes', text: 'YES' },
              { id: 'no', text: 'NO' },
              { id: 'sometimes', text: 'SOMETIMES' }
            ]
          },
          {
            id: 'family_5_detail',
            type: 'text',
            question: 'In what ways does your family influence your career/work decisions?',
            placeholder: 'Describe the ways your family influences (or does not influence) your career choices...'
          },
          {
            id: 'family_6',
            type: 'choice',
            question: 'Thoughts about career in family (Select the one that best applies)',
            options: [
              { id: '1', text: "They are very open for me to explore anything I would love to do including out of the box options. They want me to express myself even if it's any offbeat space. Earning isn't really first priority & they are ok even if my journey is random to start with. They don't have any specific timeline" },
              { id: '2', text: 'They are open for me to explore anything I would love to do including out of the box career options but want me to be clearer about what I want now/work. They need me to work towards it now & find my pathway' },
              { id: '3', text: 'They say they are ok with offbeat spaces but honestly, I see them scared. They may still allow me to do what I want but internally they will always be skeptical' },
              { id: '4', text: 'They want to choose safe options, get done with degree & then whatever I want to do later' },
              { id: '5', text: "They have specific things in their mind which they keep expressing directly or indirectly & somehow, I am stuck there. Their opinion has become my opinion now" },
              { id: '6', text: "They are clear of what they want me to do & I don't have a lot of say & thought here for now. I am scared of putting my thoughts as they have counter questions for which I have no answers" },
              { id: '7', text: "They want me to be safe & secured in a way they understand/fields they know which I don't agree & thus there's always a battle" },
              { id: '8', text: 'They want me to do good with academics, get into good college & then its upto me' },
              { id: '9', text: 'Everyone in family is into something & they are looking for me to get into the same thing' },
              { id: '10', text: "They say but I do what I want to do & that's how it goes." }
            ]
          },
          {
            id: 'family_7',
            type: 'text',
            question: 'If you could change anything about your family as a whole or any particular family member, what would it be and why?',
            placeholder: 'Describe the changes you would make and your reasons...'
          }
        ]
      },
      defaultOrder: 7
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 8 — LIFESTYLE EXPECTANCIES
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 8: Lifestyle Expectancies',
      description: 'Future lifestyle vision, me-time, legacy, needs vs wants, habits, and India vs abroad.',
      schema: {
        questions: [
          {
            id: 'lifestyle_1',
            type: 'text',
            question: "What do you understand about the term 'lifestyle'?",
            placeholder: 'Define what lifestyle means to you...'
          },
          {
            id: 'lifestyle_2',
            type: 'multiselect',
            question: 'I want a lifestyle where I… (Select all that apply)',
            options: [
              { id: '1', text: 'Am satisfied with my work/career' },
              { id: '2', text: 'Have a luxurious life (brands, status symbols, gadgets, big house)' },
              { id: '3', text: 'Am able to make a lot of money' },
              { id: '4', text: 'Have sufficient amount of money to sustain and enjoy life' },
              { id: '5', text: 'Am able to explore, travel around the world & do everything that I have always wanted to do' },
              { id: '6', text: 'Will be able to spend time with friends (chill, party, hang out)' },
              { id: '7', text: 'Will have a lot of freedom (choices, being independent, going out, doing things I want to, travel etc.)' },
              { id: '8', text: 'Am living comfortably if not luxuriously' },
              { id: '9', text: 'Will be able to follow my passion (any interest/hobby)' },
              { id: '10', text: 'Have a good cultural/social life' },
              { id: '11', text: 'Am living a slow-paced life – on my own pace' },
              { id: '12', text: 'Have loads of gadgets – technology assisted lifestyle' },
              { id: '13', text: 'Have a nature based surrounding and peace' },
              { id: '14', text: 'Feel more relaxed and at ease on everyday basis' },
              { id: '15', text: 'Am more inclined towards work-oriented life and less of social life' },
              { id: '16', text: 'Am able to have a balanced life between work, family, friends, and me-time' }
            ]
          },
          {
            id: 'lifestyle_4',
            type: 'dropdown_multi',
            question: 'Which of the following would you choose? (Select one or more — indicate your inclination)',
            options: [
              { id: 'cultural_social', text: 'Cultural/Social Lifestyle' },
              { id: 'slow_paced', text: 'A slow-paced Lifestyle' },
              { id: 'gadget_tech', text: 'Gadget/Technology Person' },
              { id: 'nature_person', text: 'A Nature Person' },
              { id: 'relaxed', text: 'Relaxed Lifestyle' },
              { id: 'work_oriented', text: 'Work Oriented Lifestyle' }
            ]
          },
          {
            id: 'lifestyle_5',
            type: 'choice',
            question: 'Thoughts about Me-Time:',
            options: [
              { id: '1', text: 'I am okay if I do not get me-time' },
              { id: '2', text: 'I mandatorily need me-time every single day even if it is for some time' },
              { id: '3', text: 'I want a fixed me-time at a stretch every day (how many hours?)' },
              { id: '4', text: 'I am okay to have me-time scattered throughout the day' },
              { id: '5', text: 'I would like to have some time for myself but no compulsion as such' }
            ]
          },
          {
            id: 'lifestyle_6',
            type: 'multiselect',
            question: 'Me-Time for me is… (Select all that apply)',
            options: [
              { id: '1', text: 'Spending time all by myself doing whatever I feel in that moment' },
              { id: '2', text: 'Spending time with my friends' },
              { id: '3', text: 'Listening to music' },
              { id: '4', text: 'Engaging in my favorite hobbies' },
              { id: '5', text: 'Just sleep & do nothing more' },
              { id: '6', text: 'Journal, reflect and try to improve on myself' },
              { id: '7', text: 'Do courses or watch videos to build on my skills' },
              { id: '8', text: 'Watch TV, movies/series, YouTube videos etc.' },
              { id: '9', text: 'Workout, gym, yoga etc.' },
              { id: '10', text: 'Play sports or any other physical activity' },
              { id: '11', text: 'Online gaming' },
              { id: '12', text: 'Randomly scrolling online' }
            ]
          },
          {
            id: 'lifestyle_7',
            type: 'text',
            question: 'What would your legacy be? How do you want the world to know/remember you? (E.g., Personality, Deeds, Work, Skills, Qualities)',
            placeholder: 'Describe how you want to be remembered and what mark you want to leave...'
          },
          {
            id: 'lifestyle_8',
            type: 'table',
            question: 'NEEDS vs WANTS — List the Things You Need vs Things You Want/Desire',
            minRows: 3,
            col1Label: 'Things I Need',
            col2Label: 'Things I Want/Desire'
          },
          {
            id: 'lifestyle_9',
            type: 'text',
            question: "If you could live anyone's life for a week, who would it be & why? — Someone whose way of living/lifestyle inspires you.",
            placeholder: 'Name the person and explain what about their lifestyle inspires you...'
          },
          {
            id: 'lifestyle_10',
            type: 'choice',
            question: 'Your thoughts on India vs Abroad? What do your parents say in this?',
            options: [
              { id: 'india', text: 'India / Current Country — prefer to stay here' },
              { id: 'abroad_study', text: 'Abroad – for Study only' },
              { id: 'abroad_job', text: 'Abroad – for Study & Job' },
              { id: 'abroad_settle', text: 'Abroad – to Study, Job & Settle permanently' }
            ]
          },
          {
            id: 'lifestyle_12',
            type: 'table',
            question: 'What are a few good habits that you want to incorporate in yourself & some of the bad habits that you wish to eradicate from your day-to-day life?',
            minRows: 3,
            col1Label: 'Habits to Improve/Incorporate',
            col2Label: 'Habits to Eliminate'
          },
          {
            id: 'lifestyle_13',
            type: 'text',
            question: 'Which areas would you like to know more about & be aware of the latest trends?',
            description: 'Examples: Current Affairs, Gadgets, Brands, Fashion, Technology, Science, Series, Celebrities, Business',
            placeholder: 'List areas you want to stay informed about...'
          },
          {
            id: 'lifestyle_career_priorities',
            type: 'table',
            question: 'Career Priorities for the next 5 Years (Degree Only) — Rank your priority in each area',
            prefilledRows: [
              'Academics',
              'Human Nature/Personality',
              'Finance',
              'Beliefs/Values',
              'Family',
              'Creative Expression/Expressing yourself',
              'Skills',
              'Knowledge',
              'Lifestyle',
              'Relationship'
            ],
            col1Label: 'Area',
            col2Label: 'Priority Rank'
          }
        ]
      },
      defaultOrder: 8
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 9 — BODY IMAGE / SELF IMAGE
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 9: Body Image / Self Image',
      description: 'How you perceive your personality, body, and presentation.',
      schema: {
        questions: [
          {
            id: 'body_1',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'How happy are you with your personality?',
            description: '1 = Not happy at all, 10 = Extremely happy'
          },
          {
            id: 'body_2',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'How happy are you with your body image?',
            description: '1 = Not happy at all, 10 = Extremely happy'
          },
          {
            id: 'body_3',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'How important are looks and presentation for you?',
            description: '1 = Not important at all, 10 = Extremely important'
          },
          {
            id: 'body_4',
            type: 'text',
            question: 'When it comes to work, what is your imagination with respect to looks and presentation? (How do you imagine yourself presenting professionally?)',
            placeholder: 'Describe how you see yourself in a professional setting...'
          },
          {
            id: 'body_5',
            type: 'text',
            question: 'Do you want to change anything about your body or have you done anything extreme to change your body?',
            placeholder: 'Your thoughts and experiences around body changes...'
          }
        ]
      },
      defaultOrder: 9
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 10 — STRENGTHS AND WEAKNESSES
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 10: Strengths and Weaknesses',
      description: 'Rate yourself on each trait (1–10). 1 = Weakness side very high, 10 = Strength side very high.',
      schema: {
        questions: [
          {
            id: 'sw_grid',
            type: 'trait_grid',
            question: 'Rate yourself on each trait (1–10). 1 = Weakness, 10 = Strength.',
            traits: [
              { id: 'sw_communication', label: 'Communication', leftLabel: 'I sometimes struggle to convey my thoughts', rightLabel: 'I am able to convey my thoughts effectively' },
              { id: 'sw_organisational_skills', label: 'Organisational Skills', leftLabel: 'Disorganized', rightLabel: 'Organized' },
              { id: 'sw_organising_thoughts', label: 'Organising Thoughts and Flow in Mind', leftLabel: 'Scattered thoughts', rightLabel: 'Can organise my thoughts well' },
              { id: 'sw_responsibility', label: 'Responsibility', leftLabel: 'Irresponsible', rightLabel: 'Responsible' },
              { id: 'sw_problem_solving', label: 'Problem Solving', leftLabel: 'Avoiding the problem', rightLabel: 'Clear strategy and effective solutions' },
              { id: 'sw_adaptability', label: 'Adaptability', leftLabel: 'Find it challenging to adapt', rightLabel: 'Adapt well to new situations' },
              { id: 'sw_prioritising', label: 'Prioritising', leftLabel: 'Struggle to prioritise', rightLabel: 'Identify what is most important' },
              { id: 'sw_patience', label: 'Patience', leftLabel: 'Impatient', rightLabel: 'Patient while working through challenges' },
              { id: 'sw_curiosity', label: 'Curiosity', leftLabel: 'Lack curiosity and motivation', rightLabel: 'Always eager to learn new things' },
              { id: 'sw_perseverance', label: 'Perseverance', leftLabel: 'Give up easily', rightLabel: 'Persist through difficulties' },
              { id: 'sw_thoughtfulness', label: 'Thoughtfulness & Reflection', leftLabel: 'Act without taking time to think', rightLabel: 'Reflect and think things through' },
              { id: 'sw_deadlines', label: 'Sticking to Deadlines', leftLabel: 'Struggle to stick to deadlines', rightLabel: 'Stick to deadlines' },
              { id: 'sw_generating_ideas', label: 'Generating Ideas', leftLabel: 'Challenging to come up with ideas', rightLabel: 'Contribute creative ideas' },
              { id: 'sw_multitasking', label: 'Multi-tasking', leftLabel: 'Struggle to multitask', rightLabel: 'Can multitask' },
              { id: 'sw_time_management', label: 'Time Management', leftLabel: 'Trouble managing my time', rightLabel: 'Manage time effectively' },
              { id: 'sw_independence', label: 'Independence', leftLabel: 'Rely too much on others', rightLabel: 'Work well independently' },
              { id: 'sw_seeking_help', label: 'Seeking Help', leftLabel: 'Hesitate to ask for help', rightLabel: 'Know when to ask for help' },
              { id: 'sw_goal_setting', label: 'Goal Setting and Execution', leftLabel: 'Difficulty setting/executing goals', rightLabel: 'Set clear goals and work hard' },
              { id: 'sw_stress_management', label: 'Stress Management', leftLabel: 'Cannot work under stress', rightLabel: 'Work under stressful situations' },
              { id: 'sw_teamwork', label: 'Team Work', leftLabel: 'Don\'t work well in groups', rightLabel: 'Work well in groups' },
              { id: 'sw_growth_mindset', label: 'Growth Mindset', leftLabel: 'Abilities are innate/cannot improve', rightLabel: 'Embrace challenges and opportunities' },
              { id: 'sw_criticism', label: 'Criticism', leftLabel: 'Cannot take criticism', rightLabel: 'Can take criticism' },
              { id: 'sw_feedback', label: 'Feedback', leftLabel: 'Giving unconstructive feedback', rightLabel: 'Giving constructive feedback' },
              { id: 'sw_listening', label: 'Listening', leftLabel: 'Not paying attention', rightLabel: 'Good listener and pay attention' },
              { id: 'sw_empathy', label: 'Empathy / Sensitivity', leftLabel: 'Struggle to be empathetic', rightLabel: 'Sensitive and empathetic' },
              { id: 'sw_procrastination', label: 'Procrastination', leftLabel: 'Procrastinate a lot', rightLabel: 'Don\'t procrastinate' },
              { id: 'sw_working_individually', label: 'Working Individually/One Person', leftLabel: 'Cannot work effectively with one person', rightLabel: 'Can work well with one person' },
              { id: 'sw_social_interaction', label: 'Social Interaction', leftLabel: 'Avoiding social interaction', rightLabel: 'Like social interaction' },
              { id: 'sw_expressiveness', label: 'Expressiveness', leftLabel: 'Unable to express easily', rightLabel: 'Able to express easily & verbally' },
              { id: 'sw_accountability', label: 'Accountability', leftLabel: 'Not accepting mistakes', rightLabel: 'Accepting mistakes & owning up' },
              { id: 'sw_spontaneity', label: 'Spontaneity', leftLabel: 'Cannot do things impulsively', rightLabel: 'Can do things impulsively' },
              { id: 'sw_rules_routines', label: 'Rules and Routines', leftLabel: 'Not following rules/routines', rightLabel: 'Following rules/routines' },
              { id: 'sw_accepting_change', label: 'Accepting Change', leftLabel: 'Cannot accept change', rightLabel: 'Open to and can accept change' },
              { id: 'sw_finding_direction', label: 'Finding Direction', leftLabel: 'Struggle to find direction', rightLabel: 'Good at finding direction/path' },
              { id: 'sw_conversing_group', label: 'Conversing with a Group', leftLabel: 'Not able to talk to many people', rightLabel: 'Talking to many people' },
              { id: 'sw_initiating_conversations', label: 'Initiating Conversations', leftLabel: 'Cannot start conversations', rightLabel: 'Can start conversations easily' },
              { id: 'sw_taking_stand', label: 'Taking a Stand for Oneself', leftLabel: 'Not being able to take a stand', rightLabel: 'Taking a stand for oneself' },
              { id: 'sw_self_control', label: 'Self-control', leftLabel: 'Cannot control own impulses', rightLabel: 'Controlling actions/learning to ignore impulses' }
            ]
          }
        ]
      },
      defaultOrder: 10
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 11 — FEARS
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 11: Fears',
      description: 'Rate each fear or discomfort on a scale of 1–10. (Not necessarily a phobia — discomfort counts too.)',
      schema: {
        questions: [
          {
            id: 'fear_claustrophobia',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Claustrophobia',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_being_left_out',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Being Left Out (feel excluded with/without people around)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_public_speaking',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Public Speaking / Performance',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_too_many_people',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Too Many People (being in a crowd)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_commitment',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Commitment (work, people, situations, relationship of any kind)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_unknown',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of the Unknown (do not know what can/will happen)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_change',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Change (people around, within people, surrounding, place of living)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_missing_out',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Missing Out (people, information, situation)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_future',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of the Future',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_making_mistakes',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Making Mistakes',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_failure',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Failure',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_too_much_power',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Having Too Much Power (misuse or hurt someone)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_success',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Success (How it might impact you — ego, goes into head, change you; not able to maintain it)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_letting_go',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Letting Go',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_gaining_weight',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Gaining Weight',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_losing_freedom',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Losing Freedom (choices, financial, speech/expression, travelling etc.)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_rejection',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Rejection (people, work, relationship of any kind)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_disappointment_me_to_others',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Disappointment — me to others (I am disappointing someone)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_disappointment_others_to_me',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Disappointment — others to me (others disappointing me)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_losing_loved_one',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Losing a Loved One',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_intimacy',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Intimacy (physically, emotionally, mentally — purpose: building social skills)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_society',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Society (unable to try certain things, break certain rules, feeling restricted, legal/cultural/societal restrictions)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_being_judged',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Being Judged',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_social_media',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Social Media (catfishing, hacking, watching others post, posting, FOMO, anxiety, unable to use it/not knowing how to use it etc.)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_work',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Work (any specific task / extra or too much work / less work or no work)',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_not_remembering',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Not Being Able to Remember Things',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_mediocre_life',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Living a Mediocre Life',
            description: '1 = Not at all, 10 = Extremely high'
          },
          {
            id: 'fear_being_late',
            type: 'scale',
            min: 1,
            max: 10,
            question: 'Fear of Being Late',
            description: '1 = Not at all, 10 = Extremely high'
          }
        ]
      },
      defaultOrder: 11
    },

    // ══════════════════════════════════════════════════════════════
    // TEST MODULES (unchanged — as per original)
    // ══════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────
    // MODULE 12 — 16 PF (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 12: 16 Personality Factors Test',
      description: 'Understanding your personality type across 5 dimensions: Mind, Energy, Nature, Tactics, and Identity.',
      schema: {
        testType: '16PF',
        questions: []
      },
      defaultOrder: 12
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 13 — VALUE SYSTEM (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 13: Value System',
      description: 'Select, rank, and categorize your most important personal, social, achievement, and physical values.',
      schema: {
        testType: 'VALUES',
        questions: []
      },
      defaultOrder: 13
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 14 — RIASEC (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 14: RIASEC Interest Test',
      description: 'Holland Codes analysis across 6 interest areas: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.',
      schema: {
        testType: 'RIASEC',
        questions: []
      },
      defaultOrder: 14
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 15 — COLOR TEST (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 15: Color Test & Working Style',
      description: 'Discover your personality color combination and working style through behavioral preference questions.',
      schema: {
        testType: 'COLOR',
        questions: []
      },
      defaultOrder: 15
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 16 — SUBJECT MATTER INTEREST (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 16: Subject Matter Interest & Hypotheticals',
      description: 'Roleplay through 8 hypothetical scenarios to discover your natural interests across 8 subject domains.',
      schema: {
        testType: 'SMI',
        questions: []
      },
      defaultOrder: 16
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 17 — PARENTS MEETING QUESTIONNAIRE (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 17: Parents Meeting Questionnaire',
      description: 'Comprehensive parent questionnaire covering child\'s personality, routine, social behavior, and career perspectives.',
      schema: {
        testType: 'PARENTS_MEETING',
        questions: []
      },
      defaultOrder: 17
    },

    // ─────────────────────────────────────────────────────────────
    // MODULE 18 — SELF DISCOVERY QUESTIONNAIRE (Specialized Test Component)
    // ─────────────────────────────────────────────────────────────
    {
      title: 'Module 18: Self Discovery Questionnaire',
      description: 'Reflect deeply on your interests, creative skills, emotional clues, values, and career directions.',
      schema: {
        testType: 'SELF_DISCOVERY',
        questions: []
      },
      defaultOrder: 18
    }

  ]

  for (const mod of modules) {
    await prisma.module.create({
      data: {
        title: mod.title,
        description: mod.description,
        schema: mod.schema as any,
        defaultOrder: mod.defaultOrder
      }
    })
  }

  console.log('Seeded successfully: 11 topic modules + 7 test modules = 18 modules total')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
