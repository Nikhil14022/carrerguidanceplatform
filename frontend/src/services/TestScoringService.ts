import { BaseService } from './BaseService';
import {
  RIASEC_INTERPRETATIONS,
  COLOR_INTERPRETATIONS,
  SMI_INTERPRETATIONS,
} from '@/data/test-interpretations';
import {
  PF16Response, PF16Score,
  ValuesResponse, ValuesScore, ValueGenre, ValueCategory,
  RIASECResponse, RIASECScore, RIASECLetter,
  ColorTestResponse, ColorTestScore, ColorType, EnergyType,
  SMIResponse, SMIScore, SMIColumn,
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
        scores = null; // No scoring, mentor reviews raw data
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
  // 16 Personality Factors
  // ──────────────────────────────────────────────────────────
  score16PF(data: any): PF16Score {
    // Handle both single-letter format (E/I) and full-word format (extraverted/introverted)
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

    const typeCode = `${mind}${energy}${nature}${tactics}-${identityLetter}`;

    return {
      type: typeCode,
      dimensions: {
        mind: { label: letterToLabel[data.mind] || data.mind, value: data.mind },
        energy: { label: letterToLabel[data.energy] || data.energy, value: data.energy },
        nature: { label: letterToLabel[data.nature] || data.nature, value: data.nature },
        tactics: { label: letterToLabel[data.tactics] || data.tactics, value: data.tactics },
        identity: { label: letterToLabel[data.identity] || data.identity, value: data.identity }
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // Values
  // ──────────────────────────────────────────────────────────
  scoreValues(data: any): ValuesScore {
    // Normalize genre keys to lowercase
    const normalizedSelected: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(data.selected || {})) {
      normalizedSelected[key.toLowerCase()] = val as string[];
    }

    const topValues = (data.ranked || []).map((value: string, index: number) => ({
      rank: index + 1,
      value,
      genre: this.findValueGenre(value, normalizedSelected),
      category: (data.categorized?.[value] || 'want') as ValueCategory
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
  // RIASEC
  // ──────────────────────────────────────────────────────────
  scoreRIASEC(data: any): RIASECScore {
    const letters: RIASECLetter[] = ['R', 'I', 'A', 'S', 'E', 'C'];
    const totals: Record<string, number> = {};

    for (const letter of letters) {
      const section = data[letter];
      if (!section) {
        totals[letter] = 0;
        continue;
      }
      // Handle both flat array format (from component) and nested format (iAm/iCan/iLikeTo)
      if (Array.isArray(section)) {
        totals[letter] = section.length;
      } else {
        totals[letter] =
          (section.iAm?.length || 0) +
          (section.iCan?.length || 0) +
          (section.iLikeTo?.length || 0);
      }
    }

    const sorted = letters
      .map(l => ({ letter: l, score: totals[l], label: RIASEC_LABELS[l], interpretation: RIASEC_DESCRIPTIONS[l] }))
      .sort((a, b) => b.score - a.score);

    const hollandCode = sorted.slice(0, 3).map(s => s.letter).join('');

    return {
      totals: totals as Record<RIASECLetter, number>,
      hollandCode,
      top3: sorted.slice(0, 3),
      descriptions: RIASEC_DESCRIPTIONS
    };
  }

  // ──────────────────────────────────────────────────────────
  // Color Test
  // Scoring logic from interpretation document:
  //   Section 1: Column A majority → go to Section 3; Column B majority → go to Section 2
  //   Section 2: Column A → Blue; Column B → Green
  //   Section 3: Column @ → Gold; Column # → Red
  //   Section 4: Column e → Extrovert; Column i → Introvert
  // ──────────────────────────────────────────────────────────
  scoreColorTest(data: any): ColorTestScore {
    // Handle both array format (from component: ["a","b","a",...]) and record format
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

    const s1 = count(data.section1, 'a', 'b');
    const s2 = count(data.section2, 'a', 'b');
    const s3 = count(data.section3, 'a', 'b');  // Component uses a/b for all sections
    const s4 = count(data.section4, 'a', 'b');

    // Determine colors based on the routing logic
    let primaryColor: ColorType;
    let secondaryColor: ColorType;

    if (s1.a >= s1.b) {
      // Column A dominant in Section 1 → go to Section 3
      primaryColor = s3.a >= s3.b ? 'Gold' : 'Red';
      // Secondary from Section 2
      secondaryColor = s2.a >= s2.b ? 'Blue' : 'Green';
    } else {
      // Column B dominant in Section 1 → go to Section 2
      primaryColor = s2.a >= s2.b ? 'Blue' : 'Green';
      // Secondary from Section 3
      secondaryColor = s3.a >= s3.b ? 'Gold' : 'Red';
    }

    const energyType: EnergyType = s4.a >= s4.b ? 'Extrovert' : 'Introvert';
    const colorCode = `${primaryColor} ${secondaryColor} ${energyType}`;

    // Look up the interpretation from the Word document
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
  scoreSMI(data: any): SMIScore {
    const columns: SMIColumn[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const columnTotals: Record<string, number> = {};
    columns.forEach(c => columnTotals[c] = 0);

    // If the component pre-computed columnTotals, use them directly
    if (data.columnTotals) {
      columns.forEach(c => {
        columnTotals[c] = data.columnTotals[c] || 0;
      });
    }
    // Otherwise compute from scenario data
    else if (data.scenarios) {
      Object.values(data.scenarios).forEach((scenario: any) => {
        (scenario.selected || []).forEach((sel: any) => {
          if (sel.column && columns.includes(sel.column)) {
            columnTotals[sel.column] += sel.rank ? (6 - sel.rank) : 1;
          }
        });
      });
    }
    // Handle scenarioAnswers format from the component
    else if (data.scenarioAnswers) {
      // Component stores { scenarioAnswers: { 0: { selected: [indices], ranking: [indices] }, ... } }
      // We need the scenario definitions to map indices to columns
      // Since we don't have them here, use the pre-computed columnTotals if available
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
      preferredScenarios: data.preferredScenarios || data.top3Scenarios?.map(String) || [],
      columnLabels: SMI_LABELS
    };
  }
}

export const testScoringService = new TestScoringService();
