
export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PERSONA_BUILDER = 'PERSONA_BUILDER',
  EXPERIMENT_LAB = 'EXPERIMENT_LAB',
  ANALYSIS = 'ANALYSIS',
  ASSETS = 'ASSETS',
}

export enum StudyType {
  MESSAGE_TEST = 'MESSAGE_TEST',
  PRICING_PACKAGING = 'PRICING_PACKAGING',
  ADOPTION_DIFFUSION = 'ADOPTION_DIFFUSION',
  CHOICE_ARCHITECTURE = 'CHOICE_ARCHITECTURE',
  BRAND_SIGNALING = 'BRAND_SIGNALING',
  TRUST_DECAY = 'TRUST_DECAY'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  LIKERT_SCALE = 'LIKERT_SCALE',
  RANKING = 'RANKING',
  SHORT_RESPONSE = 'SHORT_RESPONSE',
  CONJOINT_CHOICE = 'CONJOINT_CHOICE'
}

export enum CopilotLength {
  SHORT = 'SHORT',
  DEFAULT = 'DEFAULT',
  LONG = 'LONG'
}

export enum CopilotTone {
  INTELLECTUAL = 'INTELLECTUAL',
  FUN = 'FUN',
  DETECTIVE = 'DETECTIVE'
}

// Added PlanTier enum for user plans
export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  logic?: string; // Branching logic string
}

export interface BehavioralTraits {
  riskAversion: number;
  lossAversion: number;
  priceSensitivity: number;
  cognitiveReflection: number; // System 1 vs System 2
  socialConformity: number;
  noveltySeeking: number;
}

export interface GroundingSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface PersonaSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  color: string;
  grounding: {
    useSearch: boolean;
    useMaps: boolean;
    locationStr?: string; // Added locationStr for grounding context
    brief?: string; // Research brief ingestion
    sources?: GroundingSource[];
  };
  traits: BehavioralTraits;
  // Added heuristics for behavioral modeling
  heuristics?: {
    availability: number;
    anchoring: number;
    socialProof: number;
    scarcity: number;
  };
  isExpanded?: boolean; 
}

export interface Persona {
  id: string;
  segmentId: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  psychographics: string;
  spendingHabits: string;
  bio: string;
  traits: BehavioralTraits;
  avatarId: number;
  audioIntro?: string; 
  groundingAssumption?: string;
}

export interface SimulationResult {
  experimentId: string;
  personaId: string;
  personaName: string;
  segmentId: string;
  responses: {
    questionId: string;
    questionText: string;
    answer: string;
    numericValue?: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    rationale: string;
  }[];
  thinkingLog: string;
  confidence: number; // Added confidence score for individual simulation results
}

export interface HypothesisResult {
  statement: string;
  p_value: number;
  validated: boolean;
  effectSize: number; // Cohen's d or similar
  interpretation: string;
}

export interface AnalysisReport {
  summary: string;
  hypotheses: HypothesisResult[];
  regressionSummary: string;
  keyDifferentiators: string[];
  recommendations: string[];
  reliabilityScore: number;
  optimalPricePoint?: number;
  conversionProbability: number;
  marketResonance: number; // Added marketResonance for strategic KPIs
  
  sentimentBreakdown: { name: string; value: number; color: string }[];
  segmentPerformance: { segment: string; avgScore: number; dominantTheme: string }[];
  driversRadar: { subject: string; A: number; B: number; fullMark: number }[];
  trendData: { name: string; uv: number; pv: number }[]; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanTier; // Updated to use PlanTier enum
  avatar: string;
  tokens: number;
}

export interface Asset {
  id: string;
  type: 'IMAGE' | 'AUDIO';
  name: string;
  data: string;
  analysis?: string;
}

export interface TrainingFile {
  id: string;
  name: string;
  type: 'text' | 'image' | 'pdf';
  mimeType: string;
  content: string;
}

export interface AgentActions {
  addSegment: (name: string, desc: string, count: number) => void;
  setContext: (context: string) => void;
  addResult: (result: SimulationResult) => void;
  setTaskPrompt: (prompt: string) => void;
}
