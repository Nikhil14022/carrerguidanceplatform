import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  RIASEC_INTERPRETATIONS,
  COLOR_INTERPRETATIONS,
  SMI_INTERPRETATIONS,
} from '@/data/test-interpretations'
import { testScoringService } from '@/services/TestScoringService'
import { generateModernDocxFromHtml } from '@/lib/docxGenerator'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MENTOR_PERMANENT', 'MENTOR_TEMPORARY', 'EXPERT']

const SMI_MAIN_ATTRACTIONS: Record<string, { title: string; desc: string; attraction: string }> = {
  A: {
    title: 'Physical & Life Sciences',
    desc: 'Professions that scientifically explore the physical, geological, and biological aspects of the world.',
    attraction: 'Understanding the mysteries of the universe, uncovering patterns in the natural world, developing theories to shift paradigms, and applying knowledge to create technological solutions to complex, tangible, and spatial problems.'
  },
  B: {
    title: 'Social Sciences & Humanities',
    desc: 'Social Sciences and Humanities involve the systematic study of people, human behavior, society, and culture.',
    attraction: 'Understanding the intricacies of human interactions, societal structures, and cultural norms; analyzing social patterns, exploring human motivations, and developing solutions to address complex social challenges.'
  },
  C: {
    title: 'Arts, Entertainment, & Media',
    desc: 'Centered around inspiring, entertaining, and informing others through multimedia, storytelling, and creative expression.',
    attraction: 'Conveying ideas and emotions, fostering cultural understanding, and connecting with audiences through artistic and communicative mediums.'
  },
  D: {
    title: 'Business & Financial',
    desc: 'Managing, administering, and operating organizations that produce and provide goods and services.',
    attraction: 'Teamwork, efficiency, and the economic growth of organizations; planning, strategizing, and optimizing processes to meet the needs and desires of clients or customers.'
  },
  E: {
    title: 'Body Kinaesthetic & Sensory Acuity',
    desc: 'Professions that engage the human body or the senses, requiring strength, endurance, agility, balance, flexibility, manual dexterity, or sensory precision.',
    attraction: 'Being active, physically engaged, and using bodily and sensory skills in practical or expressive ways.'
  },
  F: {
    title: 'Designer & Artisan',
    desc: 'Creating, shaping, and crafting functional or artistic objects with attention to style, color, visual design, and spatial awareness.',
    attraction: 'Aesthetics, creativity, and enhancing the quality of everyday life by transforming ordinary spaces and objects into works that bring beauty, comfort, and functionality.'
  },
  G: {
    title: 'Engineering, Technology & Trades',
    desc: 'Designing, building, operating, and maintaining technological, electronic, or mechanical systems, including computers, networks, digital devices, machinery, and tools.',
    attraction: 'Practical problem-solving, hands-on innovation, and applying technical knowledge to real-world challenges to improve efficiency, safety, and quality of life.'
  },
  H: {
    title: 'Education, Hospitality & Health Care',
    desc: 'Working closely with people to provide support, services, or knowledge.',
    attraction: 'Solving practical problems through human interaction, teaching, hosting, caring for others, planning, organizing, and managing services and projects.'
  }
}

function escapeHtml(str: any): string {
  if (str === undefined || str === null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getScoreBand(score: number): string {
  if (score <= 4) return 'Not very high'
  if (score <= 7) return 'High'
  return 'Very high'
}

function formatOptionValue(q: any, val: any, allAnswers?: Record<string, any>): string {
  if (val === undefined || val === null || val === '') return '—'
  if (Array.isArray(val)) {
    const items = val.map((item: any) => {
      if (item && typeof item === 'object') {
        if (item.col1 || item.col2 || item.col3 || item.col4) {
          return [item.col1, item.col2, item.col3, item.col4].filter(Boolean).join(' — ')
        }
        return Object.values(item).filter(Boolean).join(' - ')
      }
      if (q?.options) {
        const opt = q.options.find((o: any) => o.id === item)
        if (opt) return opt.text
      }
      return String(item)
    }).filter(Boolean)
    let res = items.join(', ')
    if (allAnswers && q?.id && allAnswers[`${q.id}_other`]) {
      res += (res ? `, Other: ${allAnswers[`${q.id}_other`]}` : String(allAnswers[`${q.id}_other`]))
    }
    return res || '—'
  }
  if (val && typeof val === 'object' && Array.isArray(val.ranked)) {
    const items = val.ranked.map((id: string, idx: number) => {
      const opt = q?.options?.find((o: any) => o.id === id)
      return `${idx + 1}. ${opt ? opt.text : id}`
    })
    let res = items.join(', ')
    if (allAnswers && q?.id && allAnswers[`${q.id}_other`]) {
      res += ` (Other: ${allAnswers[`${q.id}_other`]})`
    }
    return res || '—'
  }
  if (q?.options) {
    const opt = q.options.find((o: any) => o.id === val)
    if (opt) return opt.text
  }
  return String(val)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'html' // 'doc' | 'html' | 'json'

    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let client = await prisma.clientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            module: true,
            response: true
          }
        }
      }
    })

    if (!client) {
      client = await prisma.clientProfile.findUnique({
        where: { userId: id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          modules: {
            orderBy: { order: 'asc' },
            include: {
              module: true,
              response: true
            }
          }
        }
      })
    }

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Helper to find module by title keyword or testType
    const findModByTitle = (kw: string) =>
      client!.modules.find(m => m.module.title.toLowerCase().includes(kw.toLowerCase()))
    const findModByTestType = (tt: string) =>
      client!.modules.find(m => (m.module.schema as any)?.testType === tt)

    const getModAnswers = (m: any): Record<string, any> => (m?.response?.data as Record<string, any>) || {}
    const getModQuestions = (m: any): any[] => ((m?.module?.schema as any)?.questions as any[]) || []
    const getQuestion = (m: any, qId: string) => getModQuestions(m).find((q: any) => q.id === qId)

    // -----------------------------------------------------------------
    // 1. DEMOGRAPHICS
    // -----------------------------------------------------------------
    const modDemo = findModByTitle('demographics')
    const demoAns = getModAnswers(modDemo)
    const modFamily = findModByTitle('family')
    const familyAns = getModAnswers(modFamily)

    const clientName = demoAns.demo_name || client.user.name || 'Client'
    const clientAge = demoAns.demo_age ? `${demoAns.demo_age} years` : '—'
    const clientDob = demoAns.demo_dob || '—'
    const clientResidence = demoAns.demo_residence || demoAns.demo_location || '—'
    const clientStream = demoAns.demo_current_stream || ''

    let schoolNameStr = '—'
    let currentAcademicYearStr = '—'
    const eduVal = demoAns.demo_education || demoAns.demo_education_level
    if (eduVal && typeof eduVal === 'object') {
      const schoolNames: string[] = []
      const gradeNames: string[] = []
      ;['school', 'college', 'university'].forEach(level => {
        const d = eduVal[level]
        const levelLabel = level.charAt(0).toUpperCase() + level.slice(1)
        if (d && (d.active || d.name || d.grade || (Array.isArray(d.entries) && d.entries.length > 0))) {
          const entries = Array.isArray(d.entries) && d.entries.length > 0
            ? d.entries
            : [{ name: d.name, grade: d.grade || d.percentage || d.stream || d.degree }]
          entries.forEach((e: any) => {
            if (e?.name && String(e.name).trim()) {
              schoolNames.push(`${levelLabel}: ${String(e.name).trim()}`)
            }
            if (e?.grade && String(e.grade).trim()) {
              gradeNames.push(`${levelLabel}: ${String(e.grade).trim()}`)
            }
          })
        }
      })
      if (schoolNames.length > 0) schoolNameStr = schoolNames.join(' | ')
      if (gradeNames.length > 0) currentAcademicYearStr = gradeNames.join(' | ')
    }

    const demoLivesWith = demoAns.demo_lives_with
      ? formatOptionValue(getQuestion(modDemo, 'demo_lives_with'), demoAns.demo_lives_with, demoAns)
      : ''
    const famLivesWith = familyAns.family_lives_with
      ? formatOptionValue(getQuestion(modFamily, 'family_lives_with'), familyAns.family_lives_with, familyAns)
      : ''
    const livesWithParts = [
      demoLivesWith && demoLivesWith !== '—' ? demoLivesWith : '',
      famLivesWith && famLivesWith !== '—' && famLivesWith !== demoLivesWith ? famLivesWith : ''
    ].filter(Boolean)
    const livesWithStr = livesWithParts.length > 0 ? livesWithParts.join(' | ') : '—'

    let subjectsStr = clientStream || '—'
    const rawAcademicOverview = demoAns.demo_academic_overview || demoAns.demo_subjects || demoAns.demo_subjects_RATINGS
    if (Array.isArray(rawAcademicOverview) && rawAcademicOverview.length > 0) {
      const subItems = rawAcademicOverview
        .map((r: any) => r?.col1 && String(r.col1).trim() ? `${String(r.col1).trim()}${r.col2 ? ` (${r.col2})` : ''}` : '')
        .filter(Boolean)
      if (subItems.length > 0) {
        subjectsStr = `${clientStream ? clientStream + ' — ' : ''}${subItems.join(', ')}`
      }
    }

    const demoExamsStr = formatOptionValue(getQuestion(modDemo, 'demo_exams'), demoAns.demo_exams, demoAns)
    const demoExtracurricularStr = formatOptionValue(getQuestion(modDemo, 'demo_extracurricular'), demoAns.demo_extracurricular, demoAns)
    const demoThoughtsAcademicsStr = formatOptionValue(getQuestion(modDemo, 'demo_thoughts_academics'), demoAns.demo_thoughts_academics, demoAns)
    const demoHobbiesBaseStr = formatOptionValue(getQuestion(modDemo, 'demo_hobbies'), demoAns.demo_hobbies, demoAns)
    const demoHobbiesNotesStr = demoAns.demo_hobbies_notes || demoAns.demo_hobbies_open_text || ''
    const demoHobbiesFullStr = [
      demoHobbiesBaseStr !== '—' ? demoHobbiesBaseStr : '',
      demoHobbiesNotesStr ? `Notes: ${demoHobbiesNotesStr}` : ''
    ].filter(Boolean).join(' | ') || '—'

    let demoRoutineStr = '—'
    if (Array.isArray(demoAns.demo_routine) && demoAns.demo_routine.length > 0) {
      const schedParts = demoAns.demo_routine.map((s: any) => {
        const days = Array.isArray(s.days) ? s.days.join(', ') : (s.days || 'Schedule')
        const slots = Array.isArray(s.slots)
          ? s.slots.filter((sl: any) => sl?.time || sl?.activity).map((sl: any) => `${sl.time || ''} ${sl.activity || ''}`.trim()).join(', ')
          : ''
        return slots ? `${days}: ${slots}` : ''
      }).filter(Boolean)
      if (schedParts.length > 0) demoRoutineStr = schedParts.join(' ; ')
    } else if (demoAns.demo_routine && typeof demoAns.demo_routine === 'object') {
      const entries = Object.entries(demoAns.demo_routine)
        .filter(([k, v]) => k && v)
        .map(([k, v]) => `${k}: ${v}`)
      if (entries.length > 0) demoRoutineStr = entries.join(', ')
    }

    // -----------------------------------------------------------------
    // 2. MOST IMPORTANT VALUES
    // -----------------------------------------------------------------
    const modValues = findModByTestType('VALUES') || findModByTitle('value system') || findModByTitle('values')
    const valuesAns = getModAnswers(modValues)
    const valuesScored = Object.keys(valuesAns).length > 0
      ? testScoringService.scoreValues(valuesAns)
      : valuesAns.__scored?.scores || null
    let topValuesRows: { rank: number; label: string; category: string }[] = []

    const mapCatCode = (cat: string): string => {
      const c = String(cat || '').toLowerCase()
      if (c.includes('ideal') || c === 'id') return 'ID'
      if (c.includes('standard') || c === 's') return 'S'
      if (c.includes('want') || c.includes('pref') || c === 'wpv' || c === 'wp') return 'WPV'
      return 'ID'
    }

    const rawValuesRanked = valuesAns.__testData?.ranked || valuesAns.ranked
    const rawValuesCategorized = valuesAns.__testData?.categorized || valuesAns.categorized || {}

    if (Array.isArray(rawValuesRanked) && rawValuesRanked.length > 0) {
      rawValuesRanked.forEach((valStr: string, idx: number) => {
        const cat = rawValuesCategorized[valStr] || 'Ideal'
        topValuesRows.push({
          rank: idx + 1,
          label: valStr,
          category: mapCatCode(cat)
        })
      })
    } else if (Array.isArray(valuesScored?.topValues) && valuesScored.topValues.length > 0) {
      valuesScored.topValues.forEach((v: any, idx: number) => {
        topValuesRows.push({
          rank: v.rank || idx + 1,
          label: v.value || String(v),
          category: mapCatCode(v.category)
        })
      })
    } else if (Array.isArray(valuesAns.__scored?.scores?.topValues) && valuesAns.__scored.scores.topValues.length > 0) {
      valuesAns.__scored.scores.topValues.forEach((v: any, idx: number) => {
        topValuesRows.push({
          rank: v.rank || idx + 1,
          label: v.value || String(v),
          category: mapCatCode(v.category)
        })
      })
    }

    // -----------------------------------------------------------------
    // 3. FEARS
    // -----------------------------------------------------------------
    const modFears = findModByTitle('fears')
    const fearsAns = getModAnswers(modFears)
    const fearsQuestions = getModQuestions(modFears)
    const fearRows: string[] = []
    fearsQuestions.forEach((q: any) => {
      if (q.id.startsWith('fear_') && q.type === 'scale') {
        const rawVal = fearsAns[q.id]
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
          const num = Number(rawVal)
          if (!isNaN(num)) {
            const note = fearsAns[`${q.id}_open_text`] ? ` (${fearsAns[`${q.id}_open_text`]})` : ''
            fearRows.push(`${q.question} - ${num} ${getScoreBand(num)}${note}`)
          }
        }
      }
    })
    if (Array.isArray(fearsAns.fears_other) && fearsAns.fears_other.length > 0) {
      fearsAns.fears_other.forEach((row: any) => {
        if (row?.col1 && String(row.col1).trim()) {
          const num = Number(row.col2 || 5)
          const band = !isNaN(num) ? `${num} ${getScoreBand(num)}` : String(row.col2 || '')
          fearRows.push(`${String(row.col1).trim()} - ${band}`)
        }
      })
    }

    // -----------------------------------------------------------------
    // 4. 16 PERSONALITY FACTOR
    // -----------------------------------------------------------------
    const mod16pf = findModByTestType('16PF') || findModByTitle('16pf') || findModByTitle('personality')
    const pf16Ans = getModAnswers(mod16pf)
    const hasPf16Raw = Object.keys(pf16Ans).some(k => k.startsWith('pf16_')) || (pf16Ans.__testData && Object.keys(pf16Ans.__testData).some(k => k.startsWith('pf16_')))
    const pf16Scored = hasPf16Raw
      ? testScoringService.score16PF(pf16Ans)
      : pf16Ans.__scored?.scores || (Object.keys(pf16Ans).length > 0 ? testScoringService.score16PF(pf16Ans) : null)

    const pf16Header = pf16Scored?.roleName && (pf16Scored?.personalityType || pf16Scored?.type)
      ? `${pf16Scored.roleName} (${pf16Scored.personalityType || pf16Scored.type})`
      : '16PF Assessment'
    const pf16Narrative = pf16Scored?.narrative || pf16Ans.__scored?.interpretation || 'Not yet completed.'
    const pf16Dims = pf16Scored?.dimensions || {}

    // -----------------------------------------------------------------
    // 5. RIASEC
    // -----------------------------------------------------------------
    const modRiasec = findModByTestType('RIASEC') || findModByTitle('riasec')
    const riasecAns = getModAnswers(modRiasec)
    const riasecLiveScored = Object.keys(riasecAns).length > 0 ? testScoringService.scoreRIASEC(riasecAns) : null
    const riasecScored = (riasecLiveScored && Object.values(riasecLiveScored.totals || {}).some(v => v > 0))
      ? riasecLiveScored
      : (riasecAns.__scored?.scores || riasecLiveScored)

    const riasecNameMap: Record<string, string> = {
      R: 'Realistic',
      I: 'Investigative',
      A: 'Artistic',
      S: 'Social',
      E: 'Enterprising',
      C: 'Conventional'
    }

    // Compute I Am / I Can / I Like breakdown
    const riasecSubScores: Record<string, { iAm: number; iCan: number; iLike: number; total: number }> = {
      R: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      I: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      A: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      S: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      E: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      C: { iAm: 0, iCan: 0, iLike: 0, total: 0 }
    }

    if (riasecLiveScored?.subScores && Object.values(riasecLiveScored.subScores).some(s => s.total > 0)) {
      Object.assign(riasecSubScores, riasecLiveScored.subScores)
    } else if (riasecAns.__riasecSubScores) {
      Object.assign(riasecSubScores, riasecAns.__riasecSubScores)
    } else if (riasecScored?.subScores) {
      Object.assign(riasecSubScores, riasecScored.subScores)
    }

    const sortedRiasec = (['R', 'I', 'A', 'S', 'E', 'C'] as const)
      .map(code => ({
        code,
        name: riasecNameMap[code],
        ...riasecSubScores[code],
        total:
          riasecSubScores[code]?.total ||
          riasecScored?.totals?.[code] ||
          riasecScored?.columnTotals?.[code] ||
          riasecScored?.scores?.[code] ||
          0
      }))
      .sort((a, b) => b.total - a.total)

    const top3Riasec = sortedRiasec.slice(0, 3)
    const riasecTop3Line = top3Riasec
      .map((item, idx) => `${item.name} - ${item.total}${idx === 0 ? '; ' : idx === 1 ? ' & ' : ''}`)
      .join('')

    // -----------------------------------------------------------------
    // 6. COLOR TEST
    // -----------------------------------------------------------------
    const modColor = findModByTestType('COLOR') || findModByTitle('color') || findModByTitle('colour')
    const colorAns = getModAnswers(modColor)
    const colorLiveScored = Object.keys(colorAns).length > 0 ? testScoringService.scoreColorTest(colorAns) : null
    const colorScored = colorAns.__scored?.scores || colorLiveScored
    const colorComboKey =
      colorAns.__testData?.result ||
      colorScored?.colorCode ||
      (colorScored?.primaryColor ? `${colorScored.primaryColor} ${colorScored.secondaryColor} ${colorScored.energyType}` : '—')
    const colorInterpretation =
      COLOR_INTERPRETATIONS[colorComboKey] ||
      colorScored?.interpretation ||
      colorAns.__scored?.interpretation ||
      'Not yet completed.'

    // -----------------------------------------------------------------
    // 7. STRENGTHS AND WEAKNESSES
    // -----------------------------------------------------------------
    const modSw = findModByTitle('strengths and weaknesses') || findModByTitle('strengths')
    const swAns = getModAnswers(modSw)
    const swQuestions = getModQuestions(modSw)
    const strengthItems: string[] = []
    const weaknessItems: string[] = []

    swQuestions.forEach((q: any) => {
      if (q.id.startsWith('sw_') && (q.type === 'scale' || q.type === 'trait_grid')) {
        const val = swAns[q.id]
        if (val === undefined || val === null || val === '') return
        if (typeof val === 'object' && !Array.isArray(val)) {
          const rating = Number(val.rating ?? 5)
          const band = getScoreBand(rating)
          const itemStr = `${q.question} - ${rating} ${band}`
          if (val.type === 'weakness') {
            weaknessItems.push(itemStr)
          } else {
            strengthItems.push(itemStr)
          }
        } else {
          const num = Number(val)
          if (!isNaN(num)) {
            const band = getScoreBand(num)
            const itemStr = `${q.question} - ${num} ${band}`
            if (num >= 5) {
              strengthItems.push(itemStr)
            } else {
              weaknessItems.push(itemStr)
            }
          }
        }
      }
    })
    if (Array.isArray(swAns.sw_grid) && swAns.sw_grid.length > 0 && strengthItems.length === 0 && weaknessItems.length === 0) {
      swAns.sw_grid.forEach((item: any) => {
        if (!item) return
        const rating = Number(item.rating ?? 5)
        const band = getScoreBand(rating)
        const label = item.trait || item.rightLabel || item.leftLabel || 'Trait'
        const itemStr = `${label} - ${rating} ${band}`
        if (item.type === 'weakness' || (!item.type && rating < 5)) {
          weaknessItems.push(itemStr)
        } else {
          strengthItems.push(itemStr)
        }
      })
    }
    if (swAns.sw_open_strengths) {
      strengthItems.push(`Additional Strengths: ${swAns.sw_open_strengths}`)
    }
    if (swAns.sw_open_weaknesses) {
      weaknessItems.push(`Additional Weaknesses: ${swAns.sw_open_weaknesses}`)
    }

    // -----------------------------------------------------------------
    // 8. SUBJECT MATTER INTEREST (SMI)
    // -----------------------------------------------------------------
    const modSmi = findModByTestType('SMI') || findModByTitle('subject matter')
    const smiAns = getModAnswers(modSmi)
    const smiLiveScored = Object.keys(smiAns).length > 0 ? testScoringService.scoreSMI(smiAns) : null
    const smiScored = (smiLiveScored && Object.values(smiLiveScored.columnTotals || {}).some(v => v > 0))
      ? smiLiveScored
      : (smiAns.__scored?.scores || smiLiveScored)
    const smiCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
    const smiTotals: Record<string, number> = {}
    smiCols.forEach(c => {
      smiTotals[c] = smiScored?.columnTotals?.[c] ?? smiAns.__testData?.columnTotals?.[c] ?? 0
    })
    const top2Smi = [...smiCols]
      .map(c => ({ code: c, score: smiTotals[c] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
    const smiSummaryLine = top2Smi.map(item => `${item.code} - ${item.score}`).join('; ')

    // -----------------------------------------------------------------
    // 9. MOVIES AND VISUAL WORLD
    // -----------------------------------------------------------------
    const modVisual = findModByTitle('movies') || findModByTitle('visual world')
    const visualAns = getModAnswers(modVisual)
    const movieGenresRaw = visualAns.visual_genres ?? visualAns.visual_1
    const movieGenresQ = getQuestion(modVisual, 'visual_genres') || getQuestion(modVisual, 'visual_1')
    const movieGenresStr = formatOptionValue(movieGenresQ, movieGenresRaw, visualAns)

    const seriesGenresStr = formatOptionValue(getQuestion(modVisual, 'visual_series_genres'), visualAns.visual_series_genres, visualAns)
    const combinedGenresStr = [
      movieGenresStr !== '—' ? `Movies: ${movieGenresStr}` : '',
      seriesGenresStr !== '—' ? `Series: ${seriesGenresStr}` : ''
    ].filter(Boolean).join(' | ') || '—'

    const favMoviesRaw = visualAns.visual_fav_movies ?? visualAns.visual_2
    const favMoviesQ = getQuestion(modVisual, 'visual_fav_movies') || getQuestion(modVisual, 'visual_2')
    const favMoviesStr = formatOptionValue(favMoviesQ, favMoviesRaw, visualAns)

    const favSeriesRaw = visualAns.visual_fav_series ?? visualAns.visual_series_fav
    const favSeriesQ = getQuestion(modVisual, 'visual_fav_series') || getQuestion(modVisual, 'visual_series_fav')
    const favSeriesStr = formatOptionValue(favSeriesQ, favSeriesRaw, visualAns)

    const likesBooksStr = formatOptionValue(getQuestion(modVisual, 'visual_books'), visualAns.visual_books, visualAns)
    const bookGenresStr = formatOptionValue(getQuestion(modVisual, 'visual_book_genres'), visualAns.visual_book_genres, visualAns)
    const bookNamesStr = visualAns.visual_book_genres_open_text || ''
    const favBooksStr = [
      likesBooksStr !== '—' ? `Likes Books: ${likesBooksStr}` : '',
      bookGenresStr !== '—' ? `Genres: ${bookGenresStr}` : '',
      bookNamesStr ? `Books: ${bookNamesStr}` : ''
    ].filter(Boolean).join(' | ') || '—'

    const favGamesBase = formatOptionValue(getQuestion(modVisual, 'visual_games'), visualAns.visual_games, visualAns)
    const favGamesOtherGenre = visualAns.visual_games_genre_other ? ` (Other Genre: ${visualAns.visual_games_genre_other})` : ''
    const favGamesStr = favGamesBase !== '—' ? `${favGamesBase}${favGamesOtherGenre}` : '—'

    const favMusicStr = formatOptionValue(getQuestion(modVisual, 'visual_music'), visualAns.visual_music, visualAns)

    const youtubeRaw = visualAns.visual_youtube_insta ?? visualAns.visual_3
    const youtubeQ = getQuestion(modVisual, 'visual_youtube_insta') || getQuestion(modVisual, 'visual_3')
    const favYoutubeStr = formatOptionValue(youtubeQ, youtubeRaw, visualAns)

    const contentGenresStr = formatOptionValue(getQuestion(modVisual, 'visual_content_genres'), visualAns.visual_content_genres, visualAns)

    const superpowerRaw = visualAns.visual_superpower ?? visualAns.visual_4
    const superpowerQ = getQuestion(modVisual, 'visual_superpower') || getQuestion(modVisual, 'visual_4')
    const superpowerStr = [
      formatOptionValue(superpowerQ, superpowerRaw, visualAns),
      visualAns.visual_superpower_open_text || visualAns.visual_4_open_text
        ? `(${visualAns.visual_superpower_open_text || visualAns.visual_4_open_text})`
        : ''
    ].filter(s => s && s !== '—').join(' ') || '—'

    const charactersRaw = visualAns.visual_characters ?? visualAns.visual_5
    const charactersQ = getQuestion(modVisual, 'visual_characters') || getQuestion(modVisual, 'visual_5')
    const charactersStr = formatOptionValue(charactersQ, charactersRaw, visualAns)

    const screenTimeStr = [
      contentGenresStr !== '—' ? `Online Content Genres: ${contentGenresStr}` : '',
      visualAns.visual_screen_hours ? `Hours/day: ${visualAns.visual_screen_hours}` : '',
      visualAns.visual_screen_activity ? `Activity: ${formatOptionValue(getQuestion(modVisual, 'visual_screen_activity'), visualAns.visual_screen_activity, visualAns)}` : '',
      visualAns.visual_search_history ? `Search History: ${formatOptionValue(getQuestion(modVisual, 'visual_search_history'), visualAns.visual_search_history, visualAns)}` : ''
    ].filter(Boolean).join(' | ') || '—'

    // -----------------------------------------------------------------
    // 10. LIFESTYLE EXPECTANCIES & NEEDS AND WANTS
    // -----------------------------------------------------------------
    const modLifeExp = findModByTitle('lifestyle expectancies') || findModByTitle('lifestyle')
    const lifeExpAns = getModAnswers(modLifeExp)
    const lifeExpQuestions = getModQuestions(modLifeExp)

    const modValExp = findModByTitle('values and expectancies')
    const valExpAns = getModAnswers(modValExp)
    const valExpQuestions = getModQuestions(modValExp)

    const modNeeds = findModByTitle('needs and wants')
    const needsAns = getModAnswers(modNeeds)
    const needsQuestions = getModQuestions(modNeeds)

    const thingsINeedList: string[] = []
    const thingsIWantList: string[] = []

    // Extract from Module 8 question `lifestyle_8` (table with col1 = Things I Need, col2 = Things I Want/Desire)
    if (Array.isArray(lifeExpAns.lifestyle_8) && lifeExpAns.lifestyle_8.length > 0) {
      lifeExpAns.lifestyle_8.forEach((row: any) => {
        if (row?.col1 && String(row.col1).trim()) thingsINeedList.push(String(row.col1).trim())
        if (row?.col2 && String(row.col2).trim()) thingsIWantList.push(String(row.col2).trim())
      })
    }

    // Also support standalone needs & wants module if present
    needsQuestions.forEach((q: any) => {
      const val = needsAns[q.id]
      if (!val) return
      const label = q.question.replace(/^\d+\.\s*/, '')
      const note = needsAns[`${q.id}_open_text`] ? ` (${needsAns[`${q.id}_open_text`]})` : ''
      if (val === 'need' || (Array.isArray(val) && val.includes('need'))) {
        thingsINeedList.push(`${label}${note}`)
      } else if (val === 'want' || (Array.isArray(val) && val.includes('want'))) {
        thingsIWantList.push(`${label}${note}`)
      } else if (typeof val === 'string') {
        thingsIWantList.push(`${label}: ${val}${note}`)
      }
    })

    // -----------------------------------------------------------------
    // 11. RISK TAKING ABILITY
    // -----------------------------------------------------------------
    const modRisk = findModByTitle('risk taking')
    const riskAns = getModAnswers(modRisk)
    const riskQuestions = getModQuestions(modRisk)

    // -----------------------------------------------------------------
    // 12. OVERVIEW (Aim & Vision, Career Perspective, Friends, Family, Body/Self Image)
    // -----------------------------------------------------------------
    const modAim = findModByTitle('aim and vision') || findModByTitle('aim') || findModByTitle('career exploration')
    const aimAns = getModAnswers(modAim)
    const aimQuestions = getModQuestions(modAim)

    const modCareerPersp = findModByTitle('career perspective') || findModByTitle('life style and work style') || findModByTitle('work style')
    const careerPerspAns = getModAnswers(modCareerPersp)
    const careerPerspQuestions = getModQuestions(modCareerPersp)

    const modFriends = findModByTitle('friends')
    const friendsAns = getModAnswers(modFriends)
    const friendsQuestions = getModQuestions(modFriends)

    const extraFamilyQuestions = [
      { id: 'family_lives_with', type: 'textarea', question: 'Who all do you currently live with at home?' },
      { id: 'family_arguments', type: 'textarea', question: 'What kind of arguments or disagreements do you usually have at home, and how are they resolved?' },
      { id: 'family_repeated_statements', type: 'textarea', question: 'What are some statements or phrases your family members keep repeating to you (can be good or bad)?' }
    ]
    const baseFamilyQuestions = getModQuestions(modFamily)
    const existingFamIds = new Set(baseFamilyQuestions.map((q: any) => q.id))
    const familyQuestions = [
      ...baseFamilyQuestions,
      ...extraFamilyQuestions.filter(fq => !existingFamIds.has(fq.id))
    ]

    const modBody = findModByTitle('body image') || findModByTitle('body and self image') || findModByTitle('self image')
    const bodyAns = getModAnswers(modBody)
    const bodyQuestions = getModQuestions(modBody)

    const renderModuleQAParagraphs = (questions: any[], answers: Record<string, any>) => {
      const items: string[] = []
      questions.forEach((q: any) => {
        const val = answers[q.id]
        if (val !== undefined && val !== null && val !== '') {
          const formatted = formatOptionValue(q, val, answers)
          const note = answers[`${q.id}_open_text`] ? ` — Note: ${answers[`${q.id}_open_text`]}` : ''
          if (formatted && formatted !== '—') {
            items.push(`<p style="margin: 4px 0;"><strong>${escapeHtml(q.question)}:</strong> ${escapeHtml(formatted)}${escapeHtml(note)}</p>`)
          }
        }
      })
      return items.join('\n') || '<p style="color:#64748b;font-style:italic;">Not answered yet.</p>'
    }

    // Collect Mentor Notes across modules
    const mentorNotesEntries = client.modules
      .filter(m => m.mentorNotes && m.mentorNotes.trim() !== '')
      .map(m => ({ title: m.module.title, notes: m.mentorNotes! }))

    // Max rows for Strengths vs Weaknesses table
    const maxSwRows = Math.max(strengthItems.length, weaknessItems.length, 1)
    // Max rows for Needs vs Wants table
    const maxNeedsRows = Math.max(thingsINeedList.length, thingsIWantList.length, 1)

    const safeName = clientName.replace(/[^a-z0-9]/gi, '_')
    const isWordFormat = format === 'doc' || format === 'docx' || format === 'word'

    const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(clientName)} - Career Report</title>
  ${!isWordFormat ? `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  ` : ''}
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      color: #111827;
      line-height: 1.55;
      padding: 36px;
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      font-size: 11pt;
    }
    h1 {
      font-size: 22pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 6px;
      color: #111827;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 28px;
      margin-bottom: 10px;
      color: #111827;
      border-bottom: 1.5px solid #111827;
      padding-bottom: 4px;
      text-transform: uppercase;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 6px;
      color: #1f2937;
    }
    p {
      margin: 6px 0;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 10.5pt;
    }
    th, td {
      border: 1px solid #374151;
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #111827;
    }
    .legend {
      font-size: 10pt;
      font-weight: bold;
      color: #374151;
      margin: 4px 0 8px 0;
    }
    .Visual-line {
      margin: 6px 0;
    }
    @media print {
      body { padding: 15px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${format === 'html' || format === 'pdf' ? `
  <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
    <div id="pdf-status-msg" style="font-size:13px;font-weight:bold;color:#374151;">${format === 'pdf' ? `⏳ Downloading ${safeName}_Career_Report.pdf...` : `${escapeHtml(clientName)} — Structured Career Report`}</div>
    <div style="display:flex;gap:10px;">
      <a href="/api/admin/clients/${id}/structured-report?format=docx" style="background:#2563eb;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;">📥 Download Word (.docx)</a>
      <button onclick="downloadReportPdf()" style="background:#111827;color:#fff;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-weight:bold;font-size:13px;">📥 Download PDF (.pdf)</button>
    </div>
  </div>
  ` : ''}

  <div id="structured-report-root">
  <h1>${escapeHtml(clientName)} — CAREER REPORT</h1>

  <h3>Index</h3>
  <table>
    <tbody>
      <tr><td style="width:50px;font-weight:bold;">1.</td><td>DEMOGRAPHICS</td></tr>
      <tr><td style="font-weight:bold;">2.</td><td>MOST IMPORTANT VALUES</td></tr>
      <tr><td style="font-weight:bold;">3.</td><td>FEARS</td></tr>
      <tr><td style="font-weight:bold;">4.</td><td>16 PERSONALITY FACTOR</td></tr>
      <tr><td style="font-weight:bold;">5.</td><td>RIASEC</td></tr>
      <tr><td style="font-weight:bold;">6.</td><td>COLOR TEST</td></tr>
      <tr><td style="font-weight:bold;">7.</td><td>STRENGTHS AND WEAKNESSES</td></tr>
      <tr><td style="font-weight:bold;">8.</td><td>SUBJECT MATTER INTEREST</td></tr>
      <tr><td style="font-weight:bold;">9.</td><td>MOVIES AND VISUAL WORLD</td></tr>
      <tr><td style="font-weight:bold;">10.</td><td>LIFESTYLE EXPECTANCIES &amp; NEEDS AND WANTS</td></tr>
      <tr><td style="font-weight:bold;">11.</td><td>RISK TAKING ABILITY</td></tr>
      <tr><td style="font-weight:bold;">12.</td><td>OVERVIEW</td></tr>
    </tbody>
  </table>

  <!-- 1. DEMOGRAPHICS -->
  <h2>1. DEMOGRAPHICS</h2>
  <table>
    <tbody>
      <tr><td style="width:35%;font-weight:bold;">Name</td><td>${escapeHtml(clientName)}</td></tr>
      <tr><td style="font-weight:bold;">Age</td><td>${escapeHtml(clientAge)}</td></tr>
      <tr><td style="font-weight:bold;">Date of Birth</td><td>${escapeHtml(clientDob)}</td></tr>
      <tr><td style="font-weight:bold;">School / College Name</td><td>${escapeHtml(schoolNameStr)}</td></tr>
      <tr><td style="font-weight:bold;">Current Academic Year</td><td>${escapeHtml(currentAcademicYearStr)}</td></tr>
      <tr><td style="font-weight:bold;">Residence</td><td>${escapeHtml(clientResidence)}</td></tr>
      <tr><td style="font-weight:bold;">Lives with</td><td>${escapeHtml(livesWithStr)}</td></tr>
      <tr><td style="font-weight:bold;">Subjects (current)</td><td>${escapeHtml(subjectsStr)}</td></tr>
      ${demoExamsStr !== '—' ? `<tr><td style="font-weight:bold;">Additional Exams</td><td>${escapeHtml(demoExamsStr)}</td></tr>` : ''}
      ${demoExtracurricularStr !== '—' ? `<tr><td style="font-weight:bold;">Extracurricular Activities</td><td>${escapeHtml(demoExtracurricularStr)}</td></tr>` : ''}
      ${demoThoughtsAcademicsStr !== '—' ? `<tr><td style="font-weight:bold;">Thoughts on Academics</td><td>${escapeHtml(demoThoughtsAcademicsStr)}</td></tr>` : ''}
      ${demoHobbiesFullStr !== '—' ? `<tr><td style="font-weight:bold;">Hobbies &amp; Free-Time Interests</td><td>${escapeHtml(demoHobbiesFullStr)}</td></tr>` : ''}
      ${demoRoutineStr !== '—' ? `<tr><td style="font-weight:bold;">Daily Routine</td><td>${escapeHtml(demoRoutineStr)}</td></tr>` : ''}
    </tbody>
  </table>

  <!-- 2. MOST IMPORTANT VALUES -->
  <h2>2. MOST IMPORTANT VALUES</h2>
  <div class="legend">ID - Ideal Value ; S - Standard Value ; WPV - Wants &amp; Preference Value</div>
  <table>
    <tbody>
      ${topValuesRows.length > 0
        ? topValuesRows.map(r => `<tr><td style="width:50px;font-weight:bold;">${r.rank}</td><td>${escapeHtml(r.label)} - ${escapeHtml(r.category)}</td></tr>`).join('\n')
        : '<tr><td colspan="2">Not completed yet.</td></tr>'}
    </tbody>
  </table>

  <!-- 3. FEARS -->
  <h2>3. FEARS</h2>
  <div class="legend">1 to 4 - Not very high ; 5 to 7 - High ; 8 to 10 - Very high</div>
  <table>
    <tbody>
      ${fearRows.length > 0
        ? fearRows.map(f => `<tr><td>${escapeHtml(f)}</td></tr>`).join('\n')
        : '<tr><td>Not completed yet.</td></tr>'}
    </tbody>
  </table>

  <!-- 4. 16 PERSONALITY FACTOR -->
  <h2>4. 16 PERSONALITY FACTOR</h2>
  <h3>${escapeHtml(pf16Header)}</h3>
  <p>${escapeHtml(pf16Narrative)}</p>
  <table>
    <thead>
      <tr>
        <th>MIND</th>
        <th>ENERGY</th>
        <th>NATURE</th>
        <th>TACTICS</th>
        <th>IDENTITY</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Extraverted: ${pf16Dims.mind?.leftPct ?? pf16Dims.MIND?.Extraverted ?? 50}%,<br/>Introverted: ${pf16Dims.mind?.rightPct ?? pf16Dims.MIND?.Introverted ?? 50}%</td>
        <td>Intuitive: ${pf16Dims.energy?.leftPct ?? pf16Dims.ENERGY?.Intuitive ?? 50}%,<br/>Observant: ${pf16Dims.energy?.rightPct ?? pf16Dims.ENERGY?.Observant ?? 50}%</td>
        <td>Thinking: ${pf16Dims.nature?.leftPct ?? pf16Dims.NATURE?.Thinking ?? 50}%,<br/>Feeling: ${pf16Dims.nature?.rightPct ?? pf16Dims.NATURE?.Feeling ?? 50}%</td>
        <td>Judging: ${pf16Dims.tactics?.leftPct ?? pf16Dims.TACTICS?.Judging ?? 50}%,<br/>Prospecting: ${pf16Dims.tactics?.rightPct ?? pf16Dims.TACTICS?.Prospecting ?? 50}%</td>
        <td>Assertive: ${pf16Dims.identity?.leftPct ?? pf16Dims.IDENTITY?.Assertive ?? 50}%,<br/>Turbulent: ${pf16Dims.identity?.rightPct ?? pf16Dims.IDENTITY?.Turbulent ?? 50}%</td>
      </tr>
    </tbody>
  </table>

  <!-- 5. RIASEC -->
  <h2>5. RIASEC</h2>
  <p><strong>${escapeHtml(riasecTop3Line)}</strong></p>
  ${top3Riasec.map(item => `
    <h3>${escapeHtml(item.name)} (${escapeHtml(item.code)})</h3>
    <p>${escapeHtml(RIASEC_INTERPRETATIONS[item.code] || '')}</p>
  `).join('\n')}
  <table>
    <thead>
      <tr>
        <th>Dimension</th>
        <th>I Am</th>
        <th>I Can</th>
        <th>I Like</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${(['R', 'I', 'A', 'S', 'E', 'C'] as const).map(code => {
        const s = riasecSubScores[code] || { iAm: 0, iCan: 0, iLike: 0, total: 0 }
        const tot = riasecScored?.totals?.[code] ?? riasecScored?.columnTotals?.[code] ?? riasecScored?.scores?.[code] ?? s.total
        return `<tr>
          <td><strong>${escapeHtml(riasecNameMap[code])} (${code})</strong></td>
          <td>${s.iAm}</td>
          <td>${s.iCan}</td>
          <td>${s.iLike}</td>
          <td><strong>${tot}</strong></td>
        </tr>`
      }).join('\n')}
    </tbody>
  </table>

  <!-- 6. COLOR TEST -->
  <h2>6. COLOR TEST</h2>
  <p><strong>Color Code : ${escapeHtml(colorComboKey)}</strong></p>
  <p>${escapeHtml(colorInterpretation)}</p>

  <!-- 7. STRENGTHS AND WEAKNESSES -->
  <h2>7. STRENGTHS AND WEAKNESSES</h2>
  <div class="legend">1 to 4 - Not very high ; 5 to 7 - High ; 8 to 10 - Very high</div>
  <table>
    <thead>
      <tr>
        <th style="width:50%;">Strengths</th>
        <th style="width:50%;">Weaknesses</th>
      </tr>
    </thead>
    <tbody>
      ${Array.from({ length: maxSwRows }, (_, i) => `
        <tr>
          <td>${escapeHtml(strengthItems[i] || '')}</td>
          <td>${escapeHtml(weaknessItems[i] || '')}</td>
        </tr>
      `).join('\n')}
    </tbody>
  </table>

  <!-- 8. SUBJECT MATTER INTEREST -->
  <h2>8. SUBJECT MATTER INTEREST</h2>
  <p><strong>${escapeHtml(smiSummaryLine)}</strong></p>
  ${top2Smi.map(item => {
    const info = SMI_MAIN_ATTRACTIONS[item.code]
    const fullDesc = SMI_INTERPRETATIONS[item.code] || ''
    return `
      <h3>${escapeHtml(item.code)}. ${escapeHtml(info?.title || '')}</h3>
      <p>${escapeHtml(fullDesc)}</p>
      ${info?.attraction ? `<p><strong>Main attraction:</strong> ${escapeHtml(info.attraction)}</p>` : ''}
    `
  }).join('\n')}
  <table>
    <thead>
      <tr>
        <th></th>
        ${smiCols.map(c => `<th style="text-align:center;">${c}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Total points in each column</strong></td>
        ${smiCols.map(c => `<td style="text-align:center;font-weight:bold;">${smiTotals[c]}</td>`).join('')}
      </tr>
    </tbody>
  </table>

  <!-- 9. MOVIES AND VISUAL WORLD -->
  <h2>9. MOVIES AND VISUAL WORLD</h2>
  <p class="visual-line"><strong>Genre :</strong> ${escapeHtml(combinedGenresStr)}</p>
  <p class="visual-line"><strong>Favorite Movies :</strong> ${escapeHtml(favMoviesStr)}</p>
  <p class="visual-line"><strong>Favorite Series :</strong> ${escapeHtml(favSeriesStr)}</p>
  <p class="visual-line"><strong>Favorite Books, Genre :</strong> ${escapeHtml(favBooksStr)}</p>
  <p class="visual-line"><strong>Favorite Games, Genre :</strong> ${escapeHtml(favGamesStr)}</p>
  <p class="visual-line"><strong>Favorite Music, Genre :</strong> ${escapeHtml(favMusicStr)}</p>
  <p class="visual-line"><strong>Youtube/Instagram Favorites :</strong> ${escapeHtml(favYoutubeStr)}</p>
  <p class="visual-line"><strong>If he/she could have a superpower it would be :</strong> ${escapeHtml(superpowerStr)}</p>
  <p class="visual-line"><strong>Characters he/she loves/relate the most with :</strong> ${escapeHtml(charactersStr)}</p>
  <p class="visual-line"><strong>Screen time, Activity and History :</strong> ${escapeHtml(screenTimeStr)}</p>

  <!-- 10. LIFESTYLE EXPECTANCIES & NEEDS AND WANTS -->
  <h2>10. LIFESTYLE EXPECTANCIES</h2>
  ${renderModuleQAParagraphs(lifeExpQuestions.filter((q: any) => q.id !== 'lifestyle_8'), lifeExpAns)}
  ${Object.keys(valExpAns).length > 0 ? `
    <h3>Values &amp; Career Expectancies</h3>
    ${renderModuleQAParagraphs(valExpQuestions, valExpAns)}
  ` : ''}

  <h3>NEEDS and WANTS</h3>
  <table>
    <thead>
      <tr>
        <th style="width:50%;">Things I Need</th>
        <th style="width:50%;">Things I Want/Desire</th>
      </tr>
    </thead>
    <tbody>
      ${Array.from({ length: maxNeedsRows }, (_, i) => `
        <tr>
          <td>${escapeHtml(thingsINeedList[i] || '')}</td>
          <td>${escapeHtml(thingsIWantList[i] || '')}</td>
        </tr>
      `).join('\n')}
    </tbody>
  </table>

  <!-- 11. RISK TAKING ABILITY -->
  <h2>11. RISK TAKING ABILITY</h2>
  ${riskQuestions.length > 0 ? riskQuestions.map((q: any, idx: number) => {
    const ans = formatOptionValue(q, riskAns[q.id], riskAns)
    const note = riskAns[`${q.id}_open_text`] ? ` (${riskAns[`${q.id}_open_text`]})` : ''
    return `<p><strong>${idx + 1}. ${escapeHtml(q.question)}</strong><br/>${escapeHtml(ans)}${escapeHtml(note)}</p>`
  }).join('\n') : '<p>Not answered yet.</p>'}

  <!-- 12. OVERVIEW -->
  <h2>12. OVERVIEW</h2>

  <h3>Aim and Vision</h3>
  ${renderModuleQAParagraphs(aimQuestions, aimAns)}
  ${Object.keys(careerPerspAns).length > 0 ? `
    <h3>Career Perspective</h3>
    ${renderModuleQAParagraphs(careerPerspQuestions, careerPerspAns)}
  ` : ''}

  <h3>Friends and Relationships (friends)</h3>
  ${renderModuleQAParagraphs(friendsQuestions, friendsAns)}

  <h3>Family</h3>
  ${renderModuleQAParagraphs(familyQuestions, familyAns)}

  <h3>Body/Self Image</h3>
  ${renderModuleQAParagraphs(bodyQuestions, bodyAns)}

  ${mentorNotesEntries.length > 0 ? `
    <h2>MENTOR / COUNSELLOR OBSERVATIONS &amp; NOTES</h2>
    ${mentorNotesEntries.map(entry => `
      <div style="margin-bottom:12px;padding:10px;border:1px solid #d97706;background:#fffbeb;">
        <strong>${escapeHtml(entry.title)}:</strong><br/>
        ${escapeHtml(entry.notes).replace(/\n/g, '<br/>')}
      </div>
    `).join('\n')}
  ` : ''}
  </div>

  ${!isWordFormat ? `
  <script>
    var isGeneratingReportPdf = false;
    async function downloadReportPdf() {
      if (isGeneratingReportPdf) return;
      var msgEl = document.getElementById('pdf-status-msg');
      var rootEl = document.getElementById('structured-report-root');
      if (!rootEl || typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        if (msgEl) msgEl.innerText = '⏳ Loading PDF generator...';
        setTimeout(downloadReportPdf, 500);
        return;
      }
      isGeneratingReportPdf = true;
      try {
        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var pageWidth = 210;
        var pageHeight = 297;
        var margin = 10;
        var contentWidth = pageWidth - margin * 2;
        var pageContentHeight = pageHeight - margin * 2;
        var cursorY = margin;

        var children = Array.from(rootEl.children || []).filter(function(el) { return el.offsetHeight > 0; });
        for (var i = 0; i < children.length; i++) {
          var block = children[i];
          if (msgEl) {
            msgEl.innerText = '⏳ Generating ${safeName}_Career_Report.pdf (' + (i + 1) + '/' + children.length + ')...';
          }
          var canvas = await html2canvas(block, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

          var pxPerMm = canvas.width / contentWidth;
          var imgHeightMm = canvas.height / pxPerMm;

          if (imgHeightMm <= pageContentHeight) {
            if (cursorY + imgHeightMm > margin + pageContentHeight && cursorY > margin) {
              pdf.addPage();
              cursorY = margin;
            }
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, cursorY, contentWidth, imgHeightMm);
            cursorY += imgHeightMm + 2.5;
          } else {
            var srcY = 0;
            while (srcY < canvas.height) {
              var availMm = (margin + pageContentHeight) - cursorY;
              if (availMm < 35 && cursorY > margin) {
                pdf.addPage();
                cursorY = margin;
                availMm = pageContentHeight;
              }
              var sliceHeightPx = Math.min(canvas.height - srcY, Math.floor(availMm * pxPerMm));
              if (sliceHeightPx <= 0) break;
              var sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = sliceHeightPx;
              var ctx = sliceCanvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
                var sliceMm = sliceHeightPx / pxPerMm;
                pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, cursorY, contentWidth, sliceMm);
                cursorY += sliceMm + 2;
              }
              srcY += sliceHeightPx;
              if (srcY < canvas.height) {
                pdf.addPage();
                cursorY = margin;
              }
            }
          }
        }

        pdf.save('${safeName}_Career_Report.pdf');
        if (msgEl) msgEl.innerText = '✅ PDF Downloaded (${safeName}_Career_Report.pdf)!';
      } catch (err) {
        console.error('Report PDF generation error:', err);
        if (msgEl) msgEl.innerText = '⚠️ Error generating PDF. Click Download PDF to retry.';
      } finally {
        isGeneratingReportPdf = false;
      }
    }
    ${format === 'pdf' ? 'window.onload = function() { setTimeout(downloadReportPdf, 400); };' : ''}
  </script>
  ` : ''}
</body>
</html>`

    if (format === 'json') {
      return NextResponse.json({ html, clientName })
    }

    if (isWordFormat) {
      const docxBuffer = generateModernDocxFromHtml(html)
      return new Response(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}_Career_Report.docx"`
        }
      })
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Error generating structured career report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
