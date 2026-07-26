import type { BuildVariant, TrainingComparisonItem } from './trainingEngine';
import type { MaxPrecisionAnalysis } from './maxPrecision';
import type { EliteEvolutionAnalysis } from './eliteEvolution';
import type { MetaBuildUniverse } from './metaBuildUniverse';

export type Objective =
  | 'COMPETITIVE'
  | 'FINISHER'
  | 'CREATOR'
  | 'DRIBBLER'
  | 'PRESSING'
  | 'POSSESSION'
  | 'QUICK_COUNTER'
  | 'DEFENSIVE'
  | 'AERIAL'
  | 'GOALKEEPER'
  | 'META_2026';

const VALID_OBJECTIVES: readonly Objective[] = [
  'COMPETITIVE', 'FINISHER', 'CREATOR', 'DRIBBLER', 'PRESSING',
  'POSSESSION', 'QUICK_COUNTER', 'DEFENSIVE', 'AERIAL', 'GOALKEEPER', 'META_2026'
];

export function normalizeObjective(value: unknown): Objective {
  const raw = String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const legacy: Record<string, Objective> = {
    BALANCED: 'COMPETITIVE', EQUILIBRADO: 'COMPETITIVE', COMPETITIVO: 'COMPETITIVE',
    FINISHING: 'FINISHER', FINALIZADOR: 'FINISHER',
    CREATIVE: 'CREATOR', CRIADOR: 'CREATOR',
    DRIBBLE: 'DRIBBLER', DRIBLADOR: 'DRIBBLER',
    PRESSAO: 'PRESSING',
    POSSE: 'POSSESSION', POSSE_DE_BOLA: 'POSSESSION',
    CONTRA_ATAQUE_RAPIDO: 'QUICK_COUNTER', QUICKCOUNTER: 'QUICK_COUNTER',
    DEFESA: 'DEFENSIVE', DEFENSIVO: 'DEFENSIVE',
    AEREO: 'AERIAL',
    GOLEIRO: 'GOALKEEPER', GK: 'GOALKEEPER',
    META: 'META_2026', META_2026: 'META_2026', COMPETITIVO_2026: 'META_2026'
  };
  if (VALID_OBJECTIVES.includes(raw as Objective)) return raw as Objective;
  return legacy[raw] ?? 'COMPETITIVE';
}

export type TacticalFormation = '4-2-2-2' | '4-3-3' | '4-1-2-3' | '4-2-1-3' | '4-2-3-1' | '4-3-1-2' | '4-1-3-2' | '4-4-2' | '4-1-4-1' | '3-2-4-1' | '3-4-3' | '3-5-2' | '5-3-2' | '5-2-3' | 'AUTO';
export type TacticalStyle = 'POSSE_DE_BOLA' | 'CONTRA_ATAQUE' | 'CONTRA_ATAQUE_RAPIDO' | 'POR_FORA' | 'PASSE_LONGO' | 'AUTO';
export type TacticalProfile = { formation: TacticalFormation; style: TacticalStyle; managerId?: string | null; managerName?: string | null; managerProficiency?: number | null; managerBooster?: 'duplo' | 'especial' | 'padrao' | null };

export type PositionCode = 'CF' | 'SS' | 'LWF' | 'RWF' | 'LMF' | 'RMF' | 'AMF' | 'CMF' | 'DMF' | 'CB' | 'LB' | 'RB' | 'GK';

export type AttributeKey =
  | 'offensiveAwareness'
  | 'ballControl'
  | 'dribbling'
  | 'tightPossession'
  | 'lowPass'
  | 'loftedPass'
  | 'finishing'
  | 'heading'
  | 'placeKicking'
  | 'curl'
  | 'defensiveAwareness'
  | 'defensiveEngagement'
  | 'tackling'
  | 'aggression'
  | 'goalkeeperAwareness'
  | 'goalkeeperCatching'
  | 'goalkeeperParrying'
  | 'goalkeeperReflexes'
  | 'goalkeeperReach'
  | 'speed'
  | 'acceleration'
  | 'kickingPower'
  | 'jump'
  | 'physicalContact'
  | 'balance'
  | 'stamina';

export type Attributes = Partial<Record<AttributeKey, number>>;
export type PositionRatings = Partial<Record<PositionCode, number>>;

export type PrecisionIssue = {
  severity: 'ok' | 'review' | 'block';
  code: string;
  message: string;
};

export type PrecisionValidation = {
  level: 'safe' | 'review' | 'blocked';
  confirmed: boolean;
  canGenerate: boolean;
  issues: PrecisionIssue[];
};

export type TrainingKey =
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'dexterity'
  | 'lowerBodyStrength'
  | 'aerialStrength'
  | 'defending'
  | 'gk1'
  | 'gk2'
  | 'gk3';

export type TrainingPlan = Record<TrainingKey, number>;

export type Impetus = {
  name: string;
  value?: number | null;
  active?: boolean;
};

export type ImpetoRecommendation = {
  name: string;
  tier: 'ideal' | 'alternativo' | 'evitar';
  attributes: string[];
  reason: string;
};

export type SkillRecommendation = {
  name: string;
  tier: 'essencial' | 'alternativa' | 'evitar';
  reason: string;
};

export type PhysicalProfile = {
  armLength?: number | null;
  shoulderWidth?: number | null;
  neckLength?: number | null;
  chest?: number | null;
  neckSize?: number | null;
  shoulderHeight?: number | null;
  legLength?: number | null;
  thighSize?: number | null;
  waistSize?: number | null;
  armSize?: number | null;
  calfSize?: number | null;
  legCoverageRadius?: number | null;
  armCoverageRadius?: number | null;
  jumpHeight?: number | null;
  trunkCollision?: number | null;
  baseHeight?: number | null;
};

export type PlayerCondition = {
  weakFootFrequency?: string | null;
  weakFootAccuracy?: string | null;
  form?: string | null;
  injuryResistance?: string | null;
};

export type ParsedCard = {
  playerName: string;
  cardType: string;
  specialTag?: string | null;
  country?: string | null;
  mainPosition: PositionCode;
  mainPositionPt: string;
  positions: PositionCode[];
  positionsPt: string[];
  positionRatings: PositionRatings;
  playstyle?: string | null;
  dominantFoot?: string | null;
  overall?: number | null;
  maxOverall?: number | null;
  height?: number | null;
  weight?: number | null;
  age?: number | null;
  level?: number | null;
  trainingPointsTotal?: number | null;
  trainingPointsUsed?: number | null;
  trainingPointSource?: 'MANUAL' | 'TRAINING_READ' | 'OCR' | 'LEVEL_INFERRED' | 'FALLBACK';
  autoTrainingPlan?: TrainingPlan | null;
  autoTrainingPoints?: number | null;
  condition: PlayerCondition;
  impetos: Impetus[];
  nativeSkills: string[];
  specialSkills: string[];
  attributes: Attributes;
  physicalProfile: PhysicalProfile;
  manualConfirmed: boolean;
  evidence: {
    positionLocked: boolean;
    playstyleLocked: boolean;
    attributeCount: number;
    positionRatingsCount: number;
    localRuleMatched?: string | null;
  };
  internalId: string;
  confidence: number;
  warnings: string[];
};

export type TeamMapPhaseScores = {
  marcacao: number;
  cobertura: number;
  saidaDeBola: number;
  passe: number;
  criacao: number;
  aceleracao: number;
  finalizacao: number;
  jogoAereo: number;
  fisico: number;
};

export type TeamMapAnalysis = {
  functionLabel: string;
  tacticalIdentity: string;
  defensiveJob: string;
  buildupJob: string;
  attackingJob: string;
  pressingJob: string;
  idealPartners: string[];
  riskAlerts: string[];
  matchPlan: string[];
  sectorScores: TeamMapPhaseScores;
  coachFit: string;
};

export type DeepReadingItem = {
  field: string;
  value: string;
  source: 'lido' | 'confirmado' | 'inferido' | 'fallback';
  confidence: 'alta' | 'media' | 'baixa';
  note: string;
};

export type DeepAnalysis = {
  confidenceLevel: 'alta' | 'media' | 'baixa';
  originalIdentity: string;
  recommendedFunction: string;
  readingItems: DeepReadingItem[];
  uncertainFields: string[];
  safeguards: string[];
  pointRationale: string[];
};


export type AdvancedTacticalFunction = {
  position: PositionCode;
  officialPlaystyle: string | null;
  status: 'oficial_confirmado' | 'nao_identificado';
  activationNote: string;
  priorities: string[];
  compatibilityScore: number;
  fitLabel: 'excelente' | 'boa' | 'razoável' | 'difícil';
  officialNameGuard: string;
};

export type SpecialSkillsAnalysis = {
  ownedOfficial: string[];
  usefulOwned: Array<{ name: string; impact: string; score: number }>;
  missingRecommended: Array<{ name: string; impact: string; score: number }>;
  redundant: Array<{ name: string; reason: string }>;
  coverageScore: number;
  officialCatalogOnly: boolean;
  validationNotes: string[];
};


export type PhysicalEngineAnalysis = {
  heightCm: number | null;
  weightKg: number | null;
  dominantFoot: string | null;
  bodyProfile: 'leve' | 'equilibrado' | 'forte' | 'alto' | 'não confirmado';
  mobilityScore: number;
  strengthScore: number;
  aerialScore: number;
  staminaScore: number;
  suitabilityScore: number;
  advantages: string[];
  limitations: string[];
  notes: string[];
};

export type AttributeGoalItem = {
  attribute: AttributeKey;
  label: string;
  current: number;
  targetMin: number;
  targetIdeal: number;
  status: 'atingida' | 'próxima' | 'prioritária';
  gap: number;
  reason: string;
};

export type AttributeGoalsAnalysis = {
  position: PositionCode;
  goals: AttributeGoalItem[];
  achievedCount: number;
  priorityCount: number;
  readinessScore: number;
  summary: string;
};

export type AdvancedOptimizerAnalysis = {
  combinationsTested: number;
  winnerTitle: string;
  winnerScore: number;
  efficiencyScore: number;
  wasteScore: number;
  unusedPoints: number;
  usefulInvestment: string[];
  detectedWaste: string[];
  decisionReasons: string[];
  positionPreserved: boolean;
  budgetRespected: boolean;
};


export type CorrectionLimitAnalysis = {
  score: number;
  protectedStrengths: string[];
  correctionCaps: Array<{ training: TrainingKey; label: string; currentLevel: number; recommendedMax: number; reason: string }>;
  naturalLimits: string[];
  summary: string;
};

export type MarginalReturnItem = {
  training: TrainingKey;
  label: string;
  currentLevel: number;
  nextPointCost: number;
  marginalGain: number;
  returnLabel: 'alto' | 'médio' | 'baixo';
  recommendation: string;
};

export type ErrorToleranceAnalysis = {
  confidence: 'alta' | 'média' | 'baixa';
  conservative: TrainingPlan;
  probable: TrainingPlan;
  optimistic: TrainingPlan;
  sensitiveGroups: string[];
  stableGroups: string[];
  note: string;
};

export type SkillPriorityAnalysis = {
  ordered: Array<{ name: string; score: number; tier: 'prioridade máxima' | 'alta' | 'útil'; reasons: string[] }>;
  ownedCoverage: number;
  officialOnly: boolean;
  context: string[];
};

export type PlayerIdentityAnalysis = {
  signature: string;
  profileLabel: string;
  individualityScore: number;
  naturalStrengths: string[];
  criticalCorrections: string[];
  decisiveFactors: string[];
  protectedCharacteristics: string[];
  localReference: string | null;
  note: string;
};


export type IndividualAttributeGoal = {
  training: TrainingKey;
  label: string;
  current: number;
  functionalMin: number;
  personalizedIdeal: number;
  recommendedCeiling: number;
  priority: 'proteger' | 'corrigir' | 'especializar' | 'manter';
  reason: string;
};

export type SelectiveWeaknessStrategy = {
  training: TrainingKey;
  label: string;
  current: number;
  gap: number;
  importance: 'crítica' | 'relevante' | 'aceitável';
  correctability: 'alta' | 'parcial' | 'baixa';
  maxInvestment: number;
  strategy: string;
};

export type SpecialSkillSynergyItem = {
  name: string;
  source: 'habilidade especial' | 'habilidade oficial' | 'ímpeto';
  activationScore: number;
  attributeSupport: number;
  positionFit: number;
  expectedFrequency: 'alta' | 'média' | 'baixa';
  status: 'aproveitamento máximo' | 'bem aproveitada' | 'parcial' | 'desperdiçada';
  helpfulAttributes: string[];
  trainingGroups: TrainingKey[];
  recommendation: string;
  wasteRisk: string | null;
};

export type OnFieldBehaviorSimulation = {
  passUnderPressure: number;
  turnAndCarry: number;
  offBallMovement: number;
  defensiveRecovery: number;
  physicalDuels: number;
  reactionSpeed: number;
  matchConsistency: number;
  creation: number;
  finishing: number;
  specialSkillUsage: number;
  strongestBehaviors: string[];
  limitingBehaviors: string[];
  summary: string;
};

export type AntiCloneAnalysis = {
  fingerprint: string;
  individualityScore: number;
  identityContribution: number;
  positionTemplateContribution: number;
  distributionDiversity: number;
  distanceFromGenericTemplate: number;
  cloneRisk: 'baixo' | 'médio' | 'alto';
  recalculationTriggered: boolean;
  reasons: string[];
};

export type CardDnaAnalysis = {
  versionSignature: string;
  identityLabel: string;
  protectedStrengths: string[];
  weaknessStrategies: SelectiveWeaknessStrategy[];
  individualGoals: IndividualAttributeGoal[];
  skillSynergies: SpecialSkillSynergyItem[];
  behavior: OnFieldBehaviorSimulation;
  antiClone: AntiCloneAnalysis;
  buildPhilosophies: Array<{ title: string; purpose: string; difference: string }>;
  lifeLikeSummary: string;
  note: string;
};

export type AnalysisResult = {
  parsed: ParsedCard;
  bestPosition: { code: PositionCode; label: string; score: number };
  positionScores: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>;
  pri: Record<string, number>;
  tacticalFit: Record<string, number>;
  training: TrainingPlan;
  trainingCost: TrainingPlan;
  trainingPointsUsed: number;
  trainingPointsTotal: number;
  trainingPointsRemaining: number;
  trainingCostRule: string;
  trainingComparison: TrainingComparisonItem[];
  buildVariants: BuildVariant[];
  recommendationExplanation: string[];
  tacticalProfile: TacticalProfile;
  teamMap: TeamMapAnalysis;
  profileTips: string[];
  validation: PrecisionValidation;
  permittedPositions: Array<{ code: PositionCode; label: string; reason: string; rating?: number | null }>;
  avoidPositions: Array<{ code: PositionCode; label: string; reason: string }>;
  recommendedSkills: string[];
  skillRecommendations: SkillRecommendation[];
  avoidSkills: string[];
  recommendedImpetos: ImpetoRecommendation[];
  buildName: string;
  strengths: string[];
  weaknesses: string[];
  usageTips: string[];
  note: string;
  deepAnalysis: DeepAnalysis;
  advancedTacticalFunction: AdvancedTacticalFunction;
  specialSkillsAnalysis: SpecialSkillsAnalysis;
  physicalEngine: PhysicalEngineAnalysis;
  attributeGoals: AttributeGoalsAnalysis;
  advancedOptimizer: AdvancedOptimizerAnalysis;
  correctionLimit: CorrectionLimitAnalysis;
  marginalReturn: MarginalReturnItem[];
  errorTolerance: ErrorToleranceAnalysis;
  skillPriority: SkillPriorityAnalysis;
  playerIdentity?: PlayerIdentityAnalysis;
  cardDna?: CardDnaAnalysis;
  maxPrecision?: MaxPrecisionAnalysis;
  eliteEvolution?: EliteEvolutionAnalysis;
  metaBuildUniverse?: MetaBuildUniverse;
};

export const POSITION_PT: Record<PositionCode, string> = {
  CF: 'CA',
  SS: 'SA',
  LWF: 'PE',
  RWF: 'PD',
  LMF: 'ME',
  RMF: 'MD',
  AMF: 'MAT',
  CMF: 'MLG',
  DMF: 'VOL',
  CB: 'ZAG',
  LB: 'LE',
  RB: 'LD',
  GK: 'GOL'
};

export const ATTRIBUTE_PT: Record<AttributeKey, string> = {
  offensiveAwareness: 'Talento ofensivo',
  ballControl: 'Controle de bola',
  dribbling: 'Drible',
  tightPossession: 'Condução firme',
  lowPass: 'Passe rasteiro',
  loftedPass: 'Passe alto',
  finishing: 'Finalização',
  heading: 'Cabeçada',
  placeKicking: 'Bola parada',
  curl: 'Curva',
  defensiveAwareness: 'Talento defensivo',
  defensiveEngagement: 'Dedicação defensiva',
  tackling: 'Desarme',
  aggression: 'Agressividade',
  goalkeeperAwareness: 'Talento de GO',
  goalkeeperCatching: 'Firmeza de GO',
  goalkeeperParrying: 'Defesa de GO',
  goalkeeperReflexes: 'Reflexos de GO',
  goalkeeperReach: 'Alcance de GO',
  speed: 'Velocidade',
  acceleration: 'Aceleração',
  kickingPower: 'Força do chute',
  jump: 'Salto',
  physicalContact: 'Contato físico',
  balance: 'Equilíbrio',
  stamina: 'Resistência'
};

export const ATTRIBUTE_INPUTS: Array<{ key: AttributeKey; label: string }> = Object.entries(ATTRIBUTE_PT).map(([key, label]) => ({ key: key as AttributeKey, label }));

export const PLAYSTYLE_OPTIONS = [
  'Goleiro Ofensivo',
  'Goleiro Defensivo',
  'Atacante Surpresa',
  'Defensor Criativo',
  'Destruidor',
  'Lateral Ofensivo',
  'Lateral Atacante',
  'Perito em Cruzamento',
  'Lateral Defensivo',
  'Orquestrador',
  '1º Volante',
  'Meia versátil',
  'Infiltração',
  'Clássico 10',
  'Lateral Móvel',
  'Ala Produtivo',
  'Armador Criativo',
  'Atacante Pivô',
  'Pivô',
  'Homem de Área',
  'Puxa Marcação',
  'Artilheiro'
] as const;

export const POSITION_LABELS: Array<{ code: PositionCode | 'AUTO'; label: string }> = [
  { code: 'AUTO', label: 'Automático' },
  { code: 'CF', label: 'CA - Centroavante' },
  { code: 'SS', label: 'SA - Segundo atacante' },
  { code: 'LWF', label: 'PE - Ponta esquerda' },
  { code: 'RWF', label: 'PD - Ponta direita' },
  { code: 'LMF', label: 'ME - Meia esquerda' },
  { code: 'RMF', label: 'MD - Meia direita' },
  { code: 'AMF', label: 'MAT - Meia atacante' },
  { code: 'CMF', label: 'MLG - Meia de ligação' },
  { code: 'DMF', label: 'VOL - Volante' },
  { code: 'CB', label: 'ZAG - Zagueiro' },
  { code: 'LB', label: 'LE - Lateral esquerdo' },
  { code: 'RB', label: 'LD - Lateral direito' },
  { code: 'GK', label: 'GOL - Goleiro' }
];

