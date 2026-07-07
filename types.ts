
export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PERSONA_BUILDER = 'PERSONA_BUILDER',
  SOCIETIES = 'SOCIETIES',
  EXPERIMENT_LAB = 'EXPERIMENT_LAB',
  ANALYSIS = 'ANALYSIS',
  ASSETS = 'ASSETS',
  API_PLAYGROUND = 'API_PLAYGROUND',
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
  SHORT_ANSWER = 'SHORT_ANSWER',
  PARAGRAPH = 'PARAGRAPH',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOXES = 'CHECKBOXES',
  DROPDOWN = 'DROPDOWN',
  LINEAR_SCALE = 'LINEAR_SCALE',
  RATING = 'RATING',
  MULTIPLE_CHOICE_GRID = 'MULTIPLE_CHOICE_GRID',
  CHECKBOX_GRID = 'CHECKBOX_GRID',
  // Legacy types (for backward compatibility)
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
  description?: string; // Optional help text/description
  options?: string[]; // For multiple choice, checkboxes, dropdown
  imageUrl?: string; // Image attached to question
  imageId?: string; // Reference to asset if from Assets tab
  scaleMin?: number; // For linear scale (default: 1)
  scaleMax?: number; // For linear scale (default: 5)
  scaleMinLabel?: string; // Optional label for scale min
  scaleMaxLabel?: string; // Optional label for scale max
  ratingMax?: number; // For rating (default: 5)
  ratingSymbol?: 'star' | 'heart' | 'number'; // For rating
  order?: number; // Order in survey
  required?: boolean; // Hidden in UI but stored in schema
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
  thinkingSystem?: 1 | 2; // System 1 (fast/intuitive) or System 2 (slow/deliberate)
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

export interface SavedSimulation {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  simulationId: string;
  context: string;
  questions: Question[];
  results: SimulationResult[];
  selectedCohorts: string[];
  personaCount: number;
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
  marketResonance: number;
  
  // Visualizations
  sentimentBreakdown: { name: string; value: number; color: string }[];
  segmentPerformance: { segment: string; avgScore: number; dominantTheme: string }[];
  driversRadar: { subject: string; A: number; B: number; fullMark: number }[];
  trendData: { name: string; uv: number; pv: number }[];
  
  // NEW: Individual-level insights
  standoutPersonas?: {
    personaName: string;
    segment: string;
    insight: string;
    quote: string;
  }[];
  
  // NEW: Regression scatter data
  regressionScatter?: {
    x: number; // trait value
    y: number; // outcome score
    name: string; // persona name
    segment: string;
  }[];
  
  // NEW: Cross-cohort patterns
  crossCohortInsights?: string[];
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

export interface Society {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  createdAt: string;
  demographics: {
    avgAge: number;
    locationDistribution: Record<string, number>;
    occupationDistribution: Record<string, number>;
  };
  relationships: SocietyRelationship[];
  color: string;
}

export interface PersonalSociety {
  id: string;
  type: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  status: 'setup' | 'creating' | 'ready';
  progress?: number;
  authorProfile?: AuthorProfile;
  network?: NetworkNode[];
  personaIds?: string[];
  createdAt?: string;
  accessToken?: string; // Store encrypted token for API calls
  refreshToken?: string; // For token refresh
  expiresAt?: number; // Token expiration timestamp
}

export interface TargetSociety {
  id: string;
  name: string;
  description: string;
  isPrebuilt: boolean;
  personaIds: string[];
  suitabilityScores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfile {
  id: string;
  userId: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  toneOfVoice: string;
  topics: string[];
  engagementStyle: string;
  name?: string;
  avatar?: string;
  username?: string; // Social media username/handle
  bio?: string; // Profile bio
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
}

export interface NetworkNode {
  id: string;
  personaId: string;
  x: number;
  y: number;
  size: number; // Based on followers
  color: string; // Segment or behavior
  connections: string[];
  attentionScore?: number;
  actionScore?: number;
}

export interface SocietyRelationship {
  fromPersonaId: string;
  toPersonaId: string;
  strength: number; // 0-100, how connected they are
  type: 'professional' | 'social' | 'ideological' | 'behavioral';
}

export interface NetworkNode {
  id: string;
  name: string;
  group: string; // segment or society
  value: number; // size/importance
  color: string;
  traits: BehavioralTraits;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number; // strength of connection
  type: string;
}

export interface AgentActions {
  addSegment: (name: string, desc: string, count: number) => void;
  setContext: (context: string) => void;
  addResult: (result: SimulationResult) => void;
  setTaskPrompt: (prompt: string) => void;
}
