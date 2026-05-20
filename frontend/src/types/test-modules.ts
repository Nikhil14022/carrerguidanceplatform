// ══════════════════════════════════════════════════════════════
// 16 Personality Factors
// ══════════════════════════════════════════════════════════════
export interface PF16Response {
  mind: 'extraverted' | 'introverted';
  energy: 'intuitive' | 'observant';
  nature: 'thinking' | 'feeling';
  tactics: 'judging' | 'prospecting';
  identity: 'assertive' | 'turbulent';
}

export interface PF16Score {
  type: string; // e.g. "ENTJ-A"
  dimensions: {
    mind: { label: string; value: string };
    energy: { label: string; value: string };
    nature: { label: string; value: string };
    tactics: { label: string; value: string };
    identity: { label: string; value: string };
  };
}

// ══════════════════════════════════════════════════════════════
// Values Test
// ══════════════════════════════════════════════════════════════
export type ValueGenre = 'personal' | 'social' | 'achievement' | 'physical';
export type ValueCategory = 'ideal' | 'standard' | 'want';

export interface ValuesResponse {
  selected: Record<ValueGenre, string[]>; // 5 per genre = 20 total
  ranked: string[]; // top 10 in order
  categorized: Record<string, ValueCategory>; // each of the top 10 categorized
}

export interface ValuesScore {
  totalSelected: number;
  topValues: { rank: number; value: string; genre: ValueGenre; category: ValueCategory }[];
  distribution: Record<ValueCategory, number>;
  genreBreakdown: Record<ValueGenre, string[]>;
}

// ══════════════════════════════════════════════════════════════
// RIASEC Interest Test
// ══════════════════════════════════════════════════════════════
export type RIASECLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RIASECResponse {
  R: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
  I: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
  A: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
  S: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
  E: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
  C: { iAm: string[]; iCan: string[]; iLikeTo: string[] };
}

export interface RIASECScore {
  totals: Record<RIASECLetter, number>;
  hollandCode: string; // top 3 letters e.g. "SAE"
  top3: { letter: RIASECLetter; score: number; label: string; interpretation: string }[];
  descriptions: Record<RIASECLetter, string>;
}

// ══════════════════════════════════════════════════════════════
// Color Test
// ══════════════════════════════════════════════════════════════
export type ColorType = 'Blue' | 'Green' | 'Gold' | 'Red';
export type EnergyType = 'Extrovert' | 'Introvert';

export interface ColorTestResponse {
  section1: Record<string, 'A' | 'B'>; // 9 rows
  section2: Record<string, 'A' | 'B'>; // 9 rows
  section3: Record<string, '@' | '#'>; // 9 rows
  section4: Record<string, 'e' | 'i'>; // 7 rows
}

export interface ColorTestScore {
  sectionResults: {
    section1: { columnA: number; columnB: number };
    section2: { columnA: number; columnB: number };
    section3: { columnAt: number; columnHash: number };
    section4: { columnE: number; columnI: number };
  };
  primaryColor: ColorType;
  secondaryColor: ColorType;
  energyType: EnergyType;
  colorCode: string; // e.g. "Green Red Introvert"
  interpretation: string; // Full career personality interpretation from Word doc
}

// ══════════════════════════════════════════════════════════════
// Subject Matter Interest
// ══════════════════════════════════════════════════════════════
export type SMIColumn = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface ScenarioSelection {
  selected: { activity: number; column: SMIColumn; rank: number }[];
}

export interface SMIResponse {
  scenarios: Record<string, ScenarioSelection>; // scenario1..scenario8
  preferredScenarios: string[]; // top 3 scenario keys
}

export interface SMIScore {
  columnTotals: Record<SMIColumn, number>;
  topColumns: { column: SMIColumn; score: number; label: string; interpretation: string }[];
  preferredScenarios: string[];
  columnLabels: Record<SMIColumn, string>;
}

// ══════════════════════════════════════════════════════════════
// Parents Meeting
// ══════════════════════════════════════════════════════════════
export interface ParentsMeetingResponse {
  [key: string]: any; // flexible structured data
}

// ══════════════════════════════════════════════════════════════
// Unified test result
// ══════════════════════════════════════════════════════════════
export type TestType = '16PF' | 'VALUES' | 'RIASEC' | 'COLOR' | 'SMI' | 'PARENTS_MEETING';

export interface TestModuleResult {
  testType: TestType;
  raw: any;
  scores: PF16Score | ValuesScore | RIASECScore | ColorTestScore | SMIScore | null;
  scoredAt: string;
}
