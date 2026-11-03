import { BaseService } from './BaseService';
import {
  RIASEC_INTERPRETATIONS,
  COLOR_INTERPRETATIONS,
  SMI_INTERPRETATIONS,
} from '@/data/test-interpretations';
import {
  PF16Score,
  ValuesScore, ValueGenre, ValueCategory,
  RIASECScore, RIASECLetter,
  ColorTestScore, ColorType, EnergyType,
  SMIScore, SMIColumn,
  TestType, TestModuleResult
} from '@/types/test-modules';

const RIASEC_LABELS: Record<RIASECLetter, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const RIASEC_DESCRIPTIONS: Record<RIASECLetter, string> = {
  R: RIASEC_INTERPRETATIONS.R,
  I: RIASEC_INTERPRETATIONS.I,
  A: RIASEC_INTERPRETATIONS.A,
  S: RIASEC_INTERPRETATIONS.S,
  E: RIASEC_INTERPRETATIONS.E,
  C: RIASEC_INTERPRETATIONS.C,
};

const RIASEC_ITEM_GROUPS: Record<RIASECLetter, { iAm: string[]; iCan: string[]; iLike: string[] }> = {
  R: {
    iAm: ["Practical", "Athletic", "Straightforward", "Mechanically inclined", "Reliable", "Persistent", "Thrifty", "Genuine"],
    iCan: ["Fix, build, or repair things", "Solve mechanical problems", "Play a sport", "Read blueprints or diagrams", "Operate tools, machinery, or equipment", "Use physical strength to accomplish things"],
    iLike: ["Tinker with mechanisms", "Be outdoors", "Be physically active", "Use my hands", "Build new things", "Work with objects", "Care for animals", "Tend plants"],
  },
  I: {
    iAm: ["Inquisitive", "Analytical", "Introverted", "Scientific", "Independent", "Observant", "Precise", "Intellectual", "Reserved"],
    iCan: ["Analyze Data", "Understand scientific theories", "Do complex calculations", "Conduct research", "Evaluate information", "Chart Data on graphs"],
    iLike: ["Explore ideas", "Use Computers", "Work independently", "Solve puzzles", "Perform laboratory experiments", "Read scientific or technical publications", "Study or solve problems"],
  },
  A: {
    iAm: ["Creative", "Intuitive", "Introspective", "Innovative", "Original", "Idealistic", "Expressive", "Nonconforming"],
    iCan: ["Draw, sculpt, or paint", "Play a musical instrument, sing, or compose music", "Write stories, poems, music, plays, or scripts", "Design fashions, objects, graphics, or interiors", "Express myself creatively", "Perform in front of an audience"],
    iLike: ["Attend concerts, movies, theatre, or art exhibitions", "Read fiction, plays, or poetry", "Work on crafts", "Collect artwork", "Read about art, literature, or music", "Take photographs", "Work in unstructured situations", "Take an art course"],
  },
  S: {
    iAm: ["Helpful", "Insightful", "Outgoing", "Understanding", "Trustworthy", "Generous", "Nurturing"],
    iCan: ["Teach or train others", "Express myself clearly", "Lead a group discussion", "Counsel others", "Mediate disputes", "Plan and supervise an activity", "Cooperate well with others"],
    iLike: ["Work in groups", "Help people with problems", "Participate in meetings", "Volunteer", "Work with young people", "Entertain others", "Play team sports", "Read about psychology, sociology, human relations"],
  },
  E: {
    iAm: ["Self-confident", "Assertive", "Adventuresome", "Persuasive", "Enthusiastic", "Ambitious", "Talkative", "Extroverted"],
    iCan: ["Persuade people", "Start projects", "Sell things or promote ideas", "Give a speech", "Organize activities", "Run my own service or business", "Lead a group", "Supervise others"],
    iLike: ["Make decisions affecting others", "Participate in politics", "Excel in leaderships or sales", "Meet important people", "Plan activities or meetings", "Read business publications", "Belong to groups or clubs"],
  },
  C: {
    iAm: ["Methodical", "Accurate", "Careful", "Conscientious", "Efficient", "Detail-oriented", "Patient", "Perseverant"],
    iCan: ["Work well within a system", "Follow instructions", "Set up a record keeping system", "Use a computer and/or office machines", "Write effective business documents", "Organize office products", "Follow a set plan"],
    iLike: ["Work with numbers", "Check paperwork or products for errors", "Work with data", "Follow clearly defined office protocols", "Be responsible for details", "Collect and categorize things", "Keep accurate records", "Work in an office"],
  },
};

const SMI_LABELS: Record<SMIColumn, string> = {
  A: 'Physical & Life Sciences',
  B: 'Social Sciences & Humanities',
  C: 'Arts, Entertainment & Media',
  D: 'Business & Financial',
  E: 'Body Kinaesthetic & Sensory Acuity',
  F: 'Designer & Artisan',
  G: 'Engineering, Technology & Trades',
  H: 'Education, Hospitality & Health Care'
};

export const PF16_TYPE_INFO: Record<string, { roleName: string; narrative: string }> = {
  INTJ: {
    roleName: 'Architect',
    narrative: 'Architects (INTJs) are imaginative yet decisive, ambitious yet private, and curiously analytical. They approach life and career as a strategic chess game, constantly looking for ways to optimize systems, master complex concepts, and turn long-term visions into reality. They thrive in environments that value intellectual independence, deep competence, and innovative problem-solving.'
  },
  INTP: {
    roleName: 'Logician',
    narrative: 'Logicians (INTPs) pride themselves on their inventiveness, curiosity, and analytical precision. They love exploring underlying patterns, questioning assumptions, and designing original solutions to complex problems. In their career, they excel when given the freedom to think deeply, experiment with ideas, and master abstract or technical domains.'
  },
  ENTJ: {
    roleName: 'Commander',
    narrative: 'Commanders (ENTJs) are bold, imaginative, and strong-willed leaders, always finding a way—or making one. They naturally see inefficiencies and organize people and resources to achieve ambitious goals. They thrive in high-responsibility careers where strategic planning, decisive leadership, and continuous growth are rewarded.'
  },
  ENTP: {
    roleName: 'Debater',
    narrative: 'Debaters (ENTPs) are smart, curious thinkers who cannot resist an intellectual challenge. Quick-witted and adaptable, they excel at brainstorming, connecting seemingly unrelated ideas, and challenging the status quo. They thrive in dynamic, entrepreneurial, and creative environments rather than rigid routines.'
  },
  INFJ: {
    roleName: 'Advocate',
    narrative: 'Idealistic and principled, Advocates (INFJs) aren’t content to coast through life – they want to stand up and make a difference. For these compassionate personalities, success doesn’t come from money or status but from seeking fulfillment, helping others, and being a force for good in the world.\nWhile they have lofty goals and ambitions, Advocates shouldn’t be mistaken for idle dreamers. People with this personality type care about integrity, and they’re rarely satisfied until they’ve done what they know to be right. Conscientious to the core, they move through life with a clear sense of their values, and they aim to never lose sight of what truly matters – not according to other people or society at large, but according to their own wisdom and intuition.\nPerhaps because their personality type is so uncommon, Advocates tend to carry around a sense – whether conscious or not – of being different from most people. With their rich inner lives and their deep, abiding desire to find their life purpose, they don’t always fit in with those around them. However, Advocates’ deep compassion and commitment to helping others mean that they are often deeply valued by those close to them.'
  },
  INFP: {
    roleName: 'Mediator',
    narrative: 'Mediators (INFPs) are poetic, kind, and altruistic individuals, always eager to help a good cause. Guided by deep personal values and a rich imagination, they seek meaning, authenticity, and creative self-expression in their work. They flourish in careers that allow them to align their daily efforts with their inner purpose and empathy for others.'
  },
  ENFJ: {
    roleName: 'Protagonist',
    narrative: 'Protagonists (ENFJs) are charismatic, inspiring leaders who care deeply about helping others realize their potential. Empathetic, articulate, and organized, they naturally build consensus and uplift teams. They thrive in people-centric careers involving mentorship, communication, leadership, and social impact.'
  },
  ENFP: {
    roleName: 'Campaigner',
    narrative: 'Campaigners (ENFPs) are enthusiastic, creative, and sociable free spirits who can always find a reason to smile and an idea worth exploring. They bring infectious energy, imagination, and warmth to everything they do, thriving in careers that combine human connection, creativity, and variety.'
  },
  ISTJ: {
    roleName: 'Logistician',
    narrative: 'Logisticians (ISTJs) are practical, fact-minded individuals whose reliability cannot be doubted. Methodical, organized, and deeply committed to fulfilling their responsibilities with accuracy, they form the backbone of structured organizations and excel in fields requiring precision, integrity, and clear standards.'
  },
  ISFJ: {
    roleName: 'Defender',
    narrative: 'Defenders (ISFJs) are very dedicated and warm protectors, always ready to support and care for the people and institutions they value. Combining practical attention to detail with genuine empathy and reliability, they excel in supportive, service-oriented, and structured professional roles.'
  },
  ESTJ: {
    roleName: 'Executive',
    narrative: 'Executives (ESTJs) are excellent administrators, unsurpassed at managing things, projects, or people. Guided by clear standards, hard work, and practical order, they bring structure to complex operations and thrive in leadership, management, finance, and organizational roles.'
  },
  ESFJ: {
    roleName: 'Consul',
    narrative: 'Consuls (ESFJs) are extraordinarily caring, social, and community-minded individuals, always eager to help and bring harmony to those around them. Practical and cooperative, they excel in roles centered on teamwork, relationship management, hospitality, healthcare, and education.'
  },
  ISTP: {
    roleName: 'Virtuoso',
    narrative: 'Virtuosos (ISTPs) are bold and practical experimenters, masters of all kinds of tools and hands-on problem-solving. Calm under pressure and curious about how things work mechanically or technically, they thrive in action-oriented, engineering, technical, and troubleshooting careers.'
  },
  ISFP: {
    roleName: 'Adventurer',
    narrative: 'Adventurers (ISFPs) are flexible and charming artists, always ready to explore and experience something new. Living vibrantly in the present moment with strong aesthetic sensitivity, they excel in hands-on creative, design, experiential, and compassionate fields.'
  },
  ESTP: {
    roleName: 'Entrepreneur',
    narrative: 'Entrepreneurs (ESTPs) are smart, energetic, and very perceptive people who truly enjoy living on the edge and taking action. Pragmatic and persuasive, they think on their feet and excel in fast-paced business, negotiation, sports, and dynamic problem-solving environments.'
  },
  ESFP: {
    roleName: 'Entertainer',
    narrative: 'Entertainers (ESFPs) are spontaneous, energetic, and enthusiastic people—life is never boring around them. Observant and people-loving, they shine in interactive, creative, performing, hospitality, and client-facing careers.'
  },
};

export class TestScoringService extends BaseService {

  /**
   * Main entry: scores any test module based on testType
   */
  scoreTest(testType: TestType, rawData: any): TestModuleResult {
    let scores: any = null;

    switch (testType) {
      case '16PF':
        scores = this.score16PF(rawData);
        break;
      case 'VALUES':
        scores = this.scoreValues(rawData);
        break;
      case 'RIASEC':
        scores = this.scoreRIASEC(rawData);
        break;
      case 'COLOR':
        scores = this.scoreColorTest(rawData);
        break;
      case 'SMI':
        scores = this.scoreSMI(rawData);
        break;
      case 'PARENTS_MEETING':
      case 'SELF_DISCOVERY':
      case 'JOB_FUNCTIONS':
        scores = null; // Mentor reviews structured data
        break;
    }

    return {
      testType,
      raw: rawData,
      scores,
      scoredAt: new Date().toISOString()
    };
  }

  // ──────────────────────────────────────────────────────────
  // 16 Personality Factors (Supports both 129-question pf16_1..129 and manual summary)
  // ──────────────────────────────────────────────────────────
  score16PF(rawInput: any): PF16Score {
    const data = rawInput?.__testData || rawInput;
    if (!data || typeof data !== 'object') {
      return {
        type: 'INFJ-T',
        roleName: 'Advocate',
        narrative: PF16_TYPE_INFO.INFJ.narrative,
        dimensions: {
          mind: { label: 'Introverted (55%)', value: 'I', leftLabel: 'Extraverted', rightLabel: 'Introverted', leftPct: 45, rightPct: 55 },
          energy: { label: 'Intuitive (60%)', value: 'N', leftLabel: 'Intuitive', rightLabel: 'Observant', leftPct: 60, rightPct: 40 },
          nature: { label: 'Feeling (58%)', value: 'F', leftLabel: 'Thinking', rightLabel: 'Feeling', leftPct: 42, rightPct: 58 },
          tactics: { label: 'Judging (56%)', value: 'J', leftLabel: 'Judging', rightLabel: 'Prospecting', leftPct: 56, rightPct: 44 },
          identity: { label: 'Turbulent (54%)', value: 'T', leftLabel: 'Assertive', rightLabel: 'Turbulent', leftPct: 46, rightPct: 54 },
        }
      };
    }

    // Check if data contains pf16_1 .. pf16_129 numeric answers
    const pfKeys = Object.keys(data).filter(k => /^pf16_\d+$/.test(k));
    if (pfKeys.length > 0 && !data.mind) {
      // Score each of the 5 dimensions on a 0..100 percentage scale
      // Mind: Extraverted (E) vs Introverted (I)
      const eItems = [1, 6, 10, 15, 19, 26, 30, 35, 49, 56, 59, 65, 71, 89, 94, 96];
      const iItems = [32, 39, 40, 62, 68, 75, 76, 85, 92, 101];
      const ePairsLeft = [113, 119, 121, 124];
      const ePairsRight = [118];

      // Energy: Intuitive (N) vs Observant (S)
      const nItems = [2, 4, 9, 14, 18, 20, 23, 25, 28, 34, 38, 42, 44, 54, 58, 61, 70, 74, 78, 84, 87, 98, 100, 104];
      const sItems = [48, 63];
      const nPairsLeft = [110, 117];
      const nPairsRight = [107, 108, 109, 122];

      // Nature: Thinking (T) vs Feeling (F)
      const tItems = [46, 60, 69, 72, 105];
      const fItems = [5, 8, 12, 17, 21, 22, 27, 33, 37, 41, 50, 55, 57, 64, 77, 80, 86, 90, 97];
      const tPairsLeft = [116, 125];
      const tPairsRight = [111, 120, 123, 128];

      // Tactics: Judging (J) vs Prospecting (P)
      const jItems = [3, 7, 11, 16, 24, 29, 31, 43, 45, 53, 66, 67, 73, 79, 91];
      const pItems = [13, 36, 47, 51, 81, 88, 95, 102];
      const jPairsLeft = [106, 112, 114, 126, 127, 129];
      const jPairsRight = [115];

      // Identity: Assertive (A) vs Turbulent (T)
      const aItems = [52, 82];
      const turbItems = [83, 93, 99, 103];

      const computeDimPct = (
        leftPositiveIds: number[],
        rightPositiveIds: number[],
        pairLeftIds: number[],
        pairRightIds: number[]
      ): { leftPct: number; rightPct: number } => {
        let leftScore = 0;
        let maxPossible = 0;

        leftPositiveIds.forEach(id => {
          const val = Number(data[`pf16_${id}`]);
          if (val >= 1 && val <= 6) {
            leftScore += (val - 1); // 0..5
            maxPossible += 5;
          }
        });
        rightPositiveIds.forEach(id => {
          const val = Number(data[`pf16_${id}`]);
          if (val >= 1 && val <= 6) {
            leftScore += (6 - val); // 0..5 towards left
            maxPossible += 5;
          }
        });
        pairLeftIds.forEach(id => {
          const val = Number(data[`pf16_${id}`]);
          if (val >= 1 && val <= 6) {
            leftScore += (6 - val); // 1 is strongly left -> 5 pts
            maxPossible += 5;
          }
        });
        pairRightIds.forEach(id => {
          const val = Number(data[`pf16_${id}`]);
          if (val >= 1 && val <= 6) {
            leftScore += (val - 1); // 6 is strongly right -> 5 pts
            maxPossible += 5;
          }
        });

        if (maxPossible === 0) return { leftPct: 50, rightPct: 50 };
        const leftPct = Math.round((leftScore / maxPossible) * 100);
        return { leftPct, rightPct: 100 - leftPct };
      };

      const mindPct = computeDimPct(eItems, iItems, ePairsLeft, ePairsRight);
      const energyPct = computeDimPct(nItems, sItems, nPairsLeft, nPairsRight);
      const naturePct = computeDimPct(tItems, fItems, tPairsLeft, tPairsRight);
      const tacticsPct = computeDimPct(jItems, pItems, jPairsLeft, jPairsRight);
      const identityPct = computeDimPct(aItems, turbItems, [], []);

      const mindLetter = mindPct.leftPct >= 50 ? 'E' : 'I';
      const energyLetter = energyPct.leftPct >= 50 ? 'N' : 'S';
      const natureLetter = naturePct.leftPct >= 50 ? 'T' : 'F';
      const tacticsLetter = tacticsPct.leftPct >= 50 ? 'J' : 'P';
      const identityLetter = identityPct.leftPct >= 50 ? 'A' : 'T';

      const baseCode = `${mindLetter}${energyLetter}${natureLetter}${tacticsLetter}`;
      const typeCode = `${baseCode}-${identityLetter}`;
      const info = PF16_TYPE_INFO[baseCode] || PF16_TYPE_INFO.INFJ;

      return {
        type: typeCode,
        roleName: info.roleName,
        narrative: info.narrative,
        dimensions: {
          mind: {
            label: mindLetter === 'E' ? `Extraverted (${mindPct.leftPct}%)` : `Introverted (${mindPct.rightPct}%)`,
            value: mindLetter,
            leftLabel: 'Extraverted',
            rightLabel: 'Introverted',
            leftPct: mindPct.leftPct,
            rightPct: mindPct.rightPct
          },
          energy: {
            label: energyLetter === 'N' ? `Intuitive (${energyPct.leftPct}%)` : `Observant (${energyPct.rightPct}%)`,
            value: energyLetter,
            leftLabel: 'Intuitive',
            rightLabel: 'Observant',
            leftPct: energyPct.leftPct,
            rightPct: energyPct.rightPct
          },
          nature: {
            label: natureLetter === 'T' ? `Thinking (${naturePct.leftPct}%)` : `Feeling (${naturePct.rightPct}%)`,
            value: natureLetter,
            leftLabel: 'Thinking',
            rightLabel: 'Feeling',
            leftPct: naturePct.leftPct,
            rightPct: naturePct.rightPct
          },
          tactics: {
            label: tacticsLetter === 'J' ? `Judging (${tacticsPct.leftPct}%)` : `Prospecting (${tacticsPct.rightPct}%)`,
            value: tacticsLetter,
            leftLabel: 'Judging',
            rightLabel: 'Prospecting',
            leftPct: tacticsPct.leftPct,
            rightPct: tacticsPct.rightPct
          },
          identity: {
            label: identityLetter === 'A' ? `Assertive (${identityPct.leftPct}%)` : `Turbulent (${identityPct.rightPct}%)`,
            value: identityLetter,
            leftLabel: 'Assertive',
            rightLabel: 'Turbulent',
            leftPct: identityPct.leftPct,
            rightPct: identityPct.rightPct
          }
        }
      };
    }

    // Handle manual or pre-scored format
    const letterToLabel: Record<string, string> = {
      E: 'Extraverted', I: 'Introverted',
      N: 'Intuitive', S: 'Observant',
      T: 'Thinking', F: 'Feeling',
      J: 'Judging', P: 'Prospecting',
      A: 'Assertive',
      extraverted: 'Extraverted', introverted: 'Introverted',
      intuitive: 'Intuitive', observant: 'Observant',
      thinking: 'Thinking', feeling: 'Feeling',
      judging: 'Judging', prospecting: 'Prospecting',
      assertive: 'Assertive', turbulent: 'Turbulent'
    };

    const wordToLetter: Record<string, string> = {
      extraverted: 'E', introverted: 'I',
      intuitive: 'N', observant: 'S',
      thinking: 'T', feeling: 'F',
      judging: 'J', prospecting: 'P',
      assertive: 'A', turbulent: 'T',
      E: 'E', I: 'I', N: 'N', S: 'S',
      T: 'T', F: 'F', J: 'J', P: 'P', A: 'A'
    };

    const mind = wordToLetter[data.mind] || 'E';
    const energy = wordToLetter[data.energy] || 'N';
    const nature = wordToLetter[data.nature] || 'T';
    const tactics = wordToLetter[data.tactics] || 'J';
    const identityLetter = data.identity === 'turbulent' || data.identity === 'T' ? 'T' : 'A';

    const baseCode = `${mind}${energy}${nature}${tactics}`;
    const typeCode = `${baseCode}-${identityLetter}`;
    const info = PF16_TYPE_INFO[baseCode] || PF16_TYPE_INFO.ENTJ;

    return {
      type: typeCode,
      roleName: info.roleName,
      narrative: info.narrative,
      dimensions: {
        mind: { label: letterToLabel[data.mind] || mind, value: mind, leftLabel: 'Extraverted', rightLabel: 'Introverted', leftPct: mind === 'E' ? 65 : 35, rightPct: mind === 'I' ? 65 : 35 },
        energy: { label: letterToLabel[data.energy] || energy, value: energy, leftLabel: 'Intuitive', rightLabel: 'Observant', leftPct: energy === 'N' ? 65 : 35, rightPct: energy === 'S' ? 65 : 35 },
        nature: { label: letterToLabel[data.nature] || nature, value: nature, leftLabel: 'Thinking', rightLabel: 'Feeling', leftPct: nature === 'T' ? 65 : 35, rightPct: nature === 'F' ? 65 : 35 },
        tactics: { label: letterToLabel[data.tactics] || tactics, value: tactics, leftLabel: 'Judging', rightLabel: 'Prospecting', leftPct: tactics === 'J' ? 65 : 35, rightPct: tactics === 'P' ? 65 : 35 },
        identity: { label: letterToLabel[data.identity] || identityLetter, value: identityLetter, leftLabel: 'Assertive', rightLabel: 'Turbulent', leftPct: identityLetter === 'A' ? 65 : 35, rightPct: identityLetter === 'T' ? 65 : 35 }
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // Values
  // ──────────────────────────────────────────────────────────
  scoreValues(rawInput: any): ValuesScore {
    const data = rawInput?.__testData || rawInput;
    const normalizedSelected: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(data?.selected || {})) {
      normalizedSelected[key.toLowerCase()] = val as string[];
    }

    const topValues = (data?.ranked || []).map((value: string, index: number) => ({
      rank: index + 1,
      value,
      genre: this.findValueGenre(value, normalizedSelected),
      category: (data?.categorized?.[value] || 'want') as ValueCategory
    }));

    const distribution: Record<ValueCategory, number> = { ideal: 0, standard: 0, want: 0 };
    topValues.forEach((v: any) => {
      const cat = v.category as ValueCategory;
      if (cat in distribution) distribution[cat]++;
    });

    const genreBreakdown: Record<ValueGenre, string[]> = {
      personal: normalizedSelected['personal'] || [],
      social: normalizedSelected['social'] || [],
      achievement: normalizedSelected['achievement'] || [],
      physical: normalizedSelected['physical'] || []
    };

    return {
      totalSelected: Object.values(normalizedSelected).flat().length,
      topValues,
      distribution,
      genreBreakdown
    };
  }

  private findValueGenre(value: string, selected: Record<string, string[]>): ValueGenre {
    for (const genre of ['personal', 'social', 'achievement', 'physical'] as ValueGenre[]) {
      if (selected[genre]?.includes(value)) return genre;
    }
    return 'personal';
  }

  // ──────────────────────────────────────────────────────────
  // RIASEC (Computes I Am, I Can, I Like breakdown + Totals)
  // ──────────────────────────────────────────────────────────
  scoreRIASEC(rawInput: any): RIASECScore {
    const data = rawInput?.__testData || rawInput;
    const letters: RIASECLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];
    const totals: Record<string, number> = {};
    const subScores: Record<RIASECLetter, { iAm: number; iCan: number; iLike: number; total: number }> = {
      R: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      I: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      A: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      S: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      E: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
      C: { iAm: 0, iCan: 0, iLike: 0, total: 0 },
    };

    for (const letter of letters) {
      const section = data?.[letter];
      if (!section) {
        totals[letter] = 0;
        continue;
      }
      if (Array.isArray(section)) {
        const selectedSet = new Set(section);
        const groups = RIASEC_ITEM_GROUPS[letter];
        const iAm = groups.iAm.filter(item => selectedSet.has(item)).length;
        const iCan = groups.iCan.filter(item => selectedSet.has(item)).length;
        const iLike = groups.iLike.filter(item => selectedSet.has(item)).length;
        const total = section.length;
        totals[letter] = total;
        subScores[letter] = { iAm, iCan, iLike, total };
      } else {
        const iAm = section.iAm?.length || 0;
        const iCan = section.iCan?.length || 0;
        const iLike = section.iLikeTo?.length || section.iLike?.length || 0;
        const total = iAm + iCan + iLike;
        totals[letter] = total;
        subScores[letter] = { iAm, iCan, iLike, total };
      }
    }

    const sorted = letters
      .map(l => ({ letter: l, score: totals[l], label: RIASEC_LABELS[l], interpretation: RIASEC_DESCRIPTIONS[l] }))
      .sort((a, b) => b.score - a.score);

    const hollandCode = sorted.slice(0, 3).map(s => s.letter).join('');

    return {
      totals: totals as Record<RIASECLetter, number>,
      subScores,
      hollandCode,
      top3: sorted.slice(0, 3),
      descriptions: RIASEC_DESCRIPTIONS
    };
  }

  // ──────────────────────────────────────────────────────────
  // Color Test
  // ──────────────────────────────────────────────────────────
  scoreColorTest(rawInput: any): ColorTestScore {
    const data = rawInput?.__testData || rawInput;
    const countFromArray = (section: any[], optA: string, optB: string) => {
      let a = 0, b = 0;
      (section || []).forEach((v: any) => {
        const val = String(v).toLowerCase();
        if (val === optA.toLowerCase()) a++;
        else if (val === optB.toLowerCase()) b++;
      });
      return { a, b };
    };

    const countFromRecord = (section: Record<string, string>, optA: string, optB: string) => {
      let a = 0, b = 0;
      Object.values(section || {}).forEach(v => {
        if (v === optA) a++;
        else if (v === optB) b++;
      });
      return { a, b };
    };

    const count = (section: any, optA: string, optB: string) =>
      Array.isArray(section) ? countFromArray(section, optA, optB) : countFromRecord(section, optA, optB);

    const s1 = count(data?.section1, 'a', 'b');
    const s2 = count(data?.section2, 'a', 'b');
    const s3 = count(data?.section3, 'a', 'b');
    const s4 = count(data?.section4, 'a', 'b');

    let primaryColor: ColorType;
    let secondaryColor: ColorType;

    if (s1.a >= s1.b) {
      primaryColor = s3.a >= s3.b ? 'Gold' : 'Red';
      secondaryColor = s2.a >= s2.b ? 'Blue' : 'Green';
    } else {
      primaryColor = s2.a >= s2.b ? 'Blue' : 'Green';
      secondaryColor = s3.a >= s3.b ? 'Gold' : 'Red';
    }

    const energyType: EnergyType = s4.a >= s4.b ? 'Extrovert' : 'Introvert';
    const colorCode = `${primaryColor} ${secondaryColor} ${energyType}`;
    const interpretation = COLOR_INTERPRETATIONS[colorCode] || `No interpretation available for ${colorCode}.`;

    return {
      sectionResults: {
        section1: { columnA: s1.a, columnB: s1.b },
        section2: { columnA: s2.a, columnB: s2.b },
        section3: { columnAt: s3.a, columnHash: s3.b },
        section4: { columnE: s4.a, columnI: s4.b }
      },
      primaryColor,
      secondaryColor,
      energyType,
      colorCode,
      interpretation
    };
  }

  // ──────────────────────────────────────────────────────────
  // Subject Matter Interest
  // ──────────────────────────────────────────────────────────
  scoreSMI(rawInput: any): SMIScore {
    const data = rawInput?.__testData || rawInput;
    const columns: SMIColumn[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const columnTotals: Record<string, number> = {};
    columns.forEach(c => columnTotals[c] = 0);

    if (data?.columnTotals) {
      columns.forEach(c => {
        columnTotals[c] = data.columnTotals[c] || 0;
      });
    } else if (data?.scenarios) {
      Object.values(data.scenarios).forEach((scenario: any) => {
        (scenario.selected || []).forEach((sel: any) => {
          if (sel.column && columns.includes(sel.column)) {
            columnTotals[sel.column] += sel.rank ? (6 - sel.rank) : 1;
          }
        });
      });
    } else if (data?.scenarioAnswers) {
      columns.forEach(c => {
        columnTotals[c] = data.columnTotals?.[c] || 0;
      });
    }

    const sorted = columns
      .map(c => ({ column: c, score: columnTotals[c], label: SMI_LABELS[c], interpretation: SMI_INTERPRETATIONS[c] || '' }))
      .sort((a, b) => b.score - a.score);

    return {
      columnTotals: columnTotals as Record<SMIColumn, number>,
      topColumns: sorted.slice(0, 3),
      preferredScenarios: data?.preferredScenarios || data?.top3Scenarios?.map(String) || [],
      columnLabels: SMI_LABELS
    };
  }
}

export const testScoringService = new TestScoringService();
