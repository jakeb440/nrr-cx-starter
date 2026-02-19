export interface ClientData {
  company: Company;
  nrr: NRRData;
  journey: JourneyData;
  synthesis: SynthesisData;
}

export interface Company {
  name: string;
  sector: string;
  financials: string;
}

export interface PeerDataPoint {
  company: string;
  nrr: number;
  period: string;
  isTarget: boolean;
  isEstimated?: boolean;
}

export interface NRRData {
  current: number;
  currentPeriod: string;
  quartile: string;
  history: { period: string; nrr: number }[];
  peers: {
    count: number;
    median: number;
    topQuartile: number;
    bottomQuartile: number;
    range: string;
  };
  peerData: PeerDataPoint[];
  methodologyNotes: string[];
  managementCommentary: {
    quote: string;
    source: string;
  }[];
  maturity: MaturityDimension[];
  waterfall: WaterfallData;
  valueAtStake: ValueAtStakeData;
  actions: Action[];
}

export interface MaturityDimension {
  dimension: string;
  current: string;
  target: string;
  label: string;
}

export interface WaterfallData {
  currentNRR: number;
  targetNRR: number;
  improvement: number;
  components: {
    grossRetention: { current: number; target: number };
    expansion: { current: number; target: number };
    contraction: { current: number; target: number };
  };
}

export interface ValueAtStakeData {
  baseARR: string;
  currentMultiple: number;
  methodology: string;
  scenarios: ValueAtStakeScenario[];
}

export interface ValueAtStakeScenario {
  name: string;
  targetNRR: number;
  incrementalARR: string;
  evMultiple: number;
  evGain: string;
  rationale: string;
}

export interface Action {
  rank: number;
  title: string;
  impact: string;
  timeline: string;
  dimension: string;
  rationale: string;
}

export interface JourneyData {
  description: string;
  stages: JourneyStage[];
}

export interface JourneyFinding {
  text: string;
  severity: "high" | "medium" | "low";
  source?: string;
}

export interface JourneyStage {
  number: number;
  name: string;
  description: string;
  strengths: JourneyFinding[];
  painPoints: JourneyFinding[];
  competitiveContext?: {
    label: string;
    type: "unique" | "competitors-better" | "industry-wide";
  }[];
}

export interface SynthesisData {
  narrative: string;
  topStrengths: {
    title: string;
    detail: string;
  }[];
  topRisks: {
    title: string;
    detail: string;
  }[];
}
