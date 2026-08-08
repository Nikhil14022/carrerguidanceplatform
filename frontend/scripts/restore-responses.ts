import prisma from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const TRAIT_MAP: Record<string, string> = {
    'Communication': 'sw_communication',
    'Organisational Skills': 'sw_organisational_skills',
    'Organising Thoughts and Flow in Mind': 'sw_organising_thoughts',
    'Responsibility': 'sw_responsibility',
    'Problem Solving': 'sw_problem_solving',
    'Adaptability': 'sw_adaptability',
    'Prioritising': 'sw_prioritising',
    'Patience': 'sw_patience',
    'Curiosity': 'sw_curiosity',
    'Perseverance': 'sw_perseverance',
    'Thoughtfulness & Reflection': 'sw_thoughtfulness',
    'Sticking to Deadlines': 'sw_deadlines',
    'Generating Ideas': 'sw_generating_ideas',
    'Multi-tasking': 'sw_multitasking',
    'Time Management': 'sw_time_management',
    'Independence': 'sw_independence',
    'Seeking Help': 'sw_seeking_help',
    'Goal Setting and Execution': 'sw_goal_setting',
    'Stress Management': 'sw_stress_management',
    'Team Work': 'sw_teamwork',
    'Growth Mindset': 'sw_growth_mindset',
    'Criticism': 'sw_criticism',
    'Feedback': 'sw_feedback',
    'Listening': 'sw_listening',
    'Empathy / Sensitivity': 'sw_empathy',
    'Procrastination': 'sw_procrastination',
    'Working Individually/One Person': 'sw_working_individually',
    'Social Interaction': 'sw_social_interaction',
    'Expressiveness': 'sw_expressiveness',
    'Accountability': 'sw_accountability',
    'Spontaneity': 'sw_spontaneity',
    'Rules and Routines': 'sw_rules_routines',
    'Accepting Change': 'sw_accepting_change',
    'Finding Direction': 'sw_finding_direction',
    'Conversing with a Group': 'sw_conversing_group',
    'Initiating Conversations': 'sw_initiating_conversations',
    'Taking a Stand for Oneself': 'sw_taking_stand',
    'Self-control': 'sw_self_control'
};

function mapBackupKeyToTitle(key: string): string {
  if (key.includes('Module_1_Module_1__Demographics')) return 'Module 1: Demographics';
  if (key.includes('Module_2_Module_2__Aim_and_Vision')) return 'Module 2: Aim and Vision';
  if (key.includes('Module_3_Module_3__Career_Perspective')) return 'Module 3: Career Perspective';
  if (key.includes('Module_4_Module_4__Risk_Taking_Ability')) return 'Module 4: Risk Taking Ability';
  if (key.includes('Module_5_Module_5__Movies_and_Visual_World')) return 'Module 5: Movies and Visual World';
  if (key.includes('Module_6_Module____Friends___Relationships')) return 'Module 6: Friends & Relationships';
  if (key.includes('Module_7_Module____Family')) return 'Module 7: Family';
  if (key.includes('Module_8_Module____Lifestyle_Expectancies')) return 'Module 8: Lifestyle Expectancies';
  if (key.includes('Module_9_Module____Body_Image___Self_Image')) return 'Module 9: Body Image / Self Image';
  if (key.includes('Module_10_Module_10__Strengths_and_Weaknesses')) return 'Module 10: Strengths and Weaknesses';
  if (key.includes('Module_11_Module_11__Fears')) return 'Module 11: Fears';
  if (key.includes('Module_12_Module_12__1__Personality_Factors_Test')) return 'Module 12: 16 Personality Factors Test';
  if (key.includes('Module_13_Module_13__Value_System')) return 'Module 13: Value System';
  if (key.includes('Module_14_Module_14__RIASEC_Interest_Test')) return 'Module 14: RIASEC Interest Test';
  if (key.includes('Module_15_Module_15__Color_Test___Working_Style')) return 'Module 15: Color Test & Working Style';
  if (key.includes('Module_16_Module_1___Subject_Matter_Interest___Hypotheticals')) return 'Module 16: Subject Matter Interest & Hypotheticals';
  if (key.includes('Module_17_Module_1___Parents_Meeting_Questionnaire')) return 'Module 17: Parents Meeting Questionnaire';
  if (key.includes('Module_18_Module_1___Self_Discovery_Questionnaire')) return 'Module 18: Self Discovery Questionnaire';
  return '';
}

async function main() {
  const backupPath = path.join(__dirname, 'extracted_client_responses.json')
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at: ${backupPath}`)
    process.exit(1)
  }

  const backupRaw = fs.readFileSync(backupPath, 'utf-8')
  const backup = JSON.parse(backupRaw) as Record<string, any>

  // Find the active test user
  const email = 'nikhil.sharma140220@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: { clientProfile: true }
  })

  if (!user || !user.clientProfile) {
    console.error(`User with email ${email} or their client profile not found.`)
    process.exit(1)
  }

  const clientProfileId = user.clientProfile.id
  console.log(`Restoring responses for client: "${user.name}" (Profile ID: ${clientProfileId})...`)

  for (const [backupKey, entry] of Object.entries(backup)) {
    const title = mapBackupKeyToTitle(backupKey)
    if (!title) {
      console.log(`[SKIP] No title mapping found for backup key: ${backupKey}`)
      continue
    }

    const dbModule = await prisma.module.findUnique({
      where: { title }
    })

    if (!dbModule) {
      console.warn(`[WARN] Module not found in DB with title: "${title}"`)
      continue
    }

    // Find or create ClientModule
    let clientModule = await prisma.clientModule.findFirst({
      where: {
        clientProfileId,
        moduleId: dbModule.id
      }
    })

    if (!clientModule) {
      clientModule = await prisma.clientModule.create({
        data: {
          clientProfileId,
          moduleId: dbModule.id,
          order: dbModule.defaultOrder,
          status: entry.status || 'IN_PROGRESS',
          filledBy: 'CLIENT'
        }
      })
      console.log(`[CREATE] Created ClientModule for "${title}"`)
    } else {
      // Update status if it exists
      await prisma.clientModule.update({
        where: { id: clientModule.id },
        data: { status: entry.status || 'IN_PROGRESS' }
      })
    }

    // Process data to migrate legacy sw_grid structure if this is Module 10
    const rawData = entry.data || {}
    let finalData = { ...rawData }

    if (title === 'Module 10: Strengths and Weaknesses' && Array.isArray(rawData.sw_grid)) {
      console.log(`[MIGRATE] Migrating legacy sw_grid traits to individual keys for Module 10...`)
      rawData.sw_grid.forEach((row: any) => {
        const traitName = row.trait
        const rating = row.rating
        const traitId = TRAIT_MAP[traitName]
        if (traitId) {
          finalData[traitId] = rating
        }
      })
    }

    // Find or create ModuleResponse
    const response = await prisma.moduleResponse.findUnique({
      where: { clientModuleId: clientModule.id }
    })

    if (response) {
      await prisma.moduleResponse.update({
        where: { id: response.id },
        data: {
          data: finalData as any,
          submittedAt: new Date(),
          approvedAt: entry.status === 'APPROVED' ? new Date() : null
        }
      })
      console.log(`[RESTORE] Updated existing response for "${title}"`)
    } else {
      await prisma.moduleResponse.create({
        data: {
          clientModuleId: clientModule.id,
          data: finalData as any,
          submittedAt: new Date(),
          approvedAt: entry.status === 'APPROVED' ? new Date() : null
        }
      })
      console.log(`[RESTORE] Created new response for "${title}"`)
    }
  }

  console.log('Restore completed successfully!')
}

main()
  .catch((e) => {
    console.error('Restore failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
