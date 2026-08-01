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
export type GameplayMode = 'RANKED' | 'UNIVERSAL' | 'OFFLINE';
export type ConnectionProfile = 'STABLE' | 'VARIABLE' | 'HIGH_DELAY';
export type ControlProfile = 'BALANCED' | 'PASSING' | 'DRIBBLE' | 'DIRECT';
export type TacticalProfile = {
  formation: TacticalFormation;
  style: TacticalStyle;
  managerId?: string | null;
  managerName?: string | null;
  managerProficiency?: number | null;
  managerBooster?: 'duplo' | 'especial' | 'padrao' | null;
  gameplayMode?: GameplayMode;
  connectionProfile?: ConnectionProfile;
  controlProfile?: ControlProfile;
};

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
  score?: number;
  confidence?: number;
  official?: boolean;
  evidence?: string[];
  warnings?: string[];
};


export type SkillIntegrityAudit = {
  version: string;
  status: 'approved' | 'review';
  ownedSkills: string[];
  recommendedSkills: string[];
  removedDuplicates: string[];
  missingSlots: number;
  checks: string[];
};

export type LocalAiModelScore = {
  id: 'leitura' | 'dna' | 'funcao' | 'ficha' | 'habilidades' | 'impeto';
  label: string;
  score: number;
  note: string;
};

export type LocalAiAnalysis = {
  engineVersion: string;
  mode: 'IA local sem API paga';
  confidence: number;
  confidenceLabel: 'alta' | 'media' | 'baixa';
  decisionState: 'confiante' | 'revisar' | 'bloqueado';
  dataQuality: number;
  summary: string;
  models: LocalAiModelScore[];
  evidence: string[];
  uncertainties: string[];
  nextAction: string;
  privacyNote: string;
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

export type CompetitiveFusionSummary = {
  engineVersion: string;
  baseTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  professionalInfluence: number;
  personalMatchSamples: number;
  sourceCount: number;
  exactCardCount: number;
  proSourceCount: number;
  confidence: number;
  confidenceLabel: string;
  reasons: string[];
  guardrails: string[];
  sourceNames: string[];
  differences: Array<{ key: TrainingKey; from: number; to: number }>;
};


export type DeepCardIntelligenceAnalysis = {
  engineVersion: string;
  mode: 'Motor especialista local';
  confidence: number;
  confidenceLabel: 'alta' | 'média' | 'baixa';
  identityScore: number;
  dataQuality: number;
  candidatesEvaluated: number;
  validCandidates: number;
  winnerScore: number;
  winnerSource: string;
  finalTraining: TrainingPlan;
  changes: Array<{ key: TrainingKey; label: string; from: number; to: number; reason: string }>;
  synergies: Array<{ label: string; score: number; status: 'forte' | 'funcional' | 'fraca'; explanation: string }>;
  functionalRanges: Array<{ label: string; current: number; ideal: number; status: 'excelente' | 'competitivo' | 'corrigir'; reason: string }>;
  skillPlan: Array<{ name: string; priority: 'máxima' | 'alta' | 'útil'; reason: string }>;
  impetoPlan: { name: string | null; score: number; reason: string };
  physicalInsights: string[];
  learning: { samples: number; state: 'sem dados' | 'aprendendo' | 'confiável'; recommendation: string };
  reasons: string[];
  warnings: string[];
  summary: string;
};


export type UnifiedSkillDecision = {
  name: string;
  score: number;
  priority: 'essencial' | 'alta' | 'complementar';
  category: 'finalização' | 'passe' | 'drible' | 'defesa' | 'aérea' | 'físico' | 'goleiro' | 'mental';
  gameplayImpact: string;
  reasons: string[];
  supportedBy: string[];
  identityBoost: number;
};

export type DeepSimulationSummary = {
  generatedCandidates: number;
  validCandidates: number;
  finalists: number;
  winnerScore: number;
  runnerUpScore: number;
  scoreGap: number;
  exactBudget: boolean;
  evaluationDimensions: string[];
  abTest: {
    available: boolean;
    minimumMatchesPerVariant: number;
    variantA: TrainingPlan;
    variantB: TrainingPlan;
    differences: Array<{ key: TrainingKey; label: string; a: number; b: number }>;
    instruction: string;
  };
};

export type MatchLearningV31 = {
  samples: number;
  confidence: 'sem dados' | 'inicial' | 'moderada' | 'alta';
  patterns: Array<{ signal: string; rate: number; training: TrainingKey; impact: string }>;
  learnedWeights: Partial<Record<TrainingKey, number>>;
  appliedInfluence: number;
  testedPlans: Array<{ signature: string; plan: TrainingPlan; samples: number; averageRating: number; issueRate: number; performanceScore: number }>;
  abComparison: {
    variantASamples: number;
    variantBSamples: number;
    averageA: number | null;
    averageB: number | null;
    provisionalWinner: 'A' | 'B' | null;
    ready: boolean;
    note: string;
  };
  recommendation: string;
};

export type UnifiedCardIntelligenceAnalysis = {
  engineVersion: string;
  stages: { dna: string; simulator: string; integration: string; learning: string; refinement: string };
  confidence: number;
  finalTraining: TrainingPlan;
  skillPlan: UnifiedSkillDecision[];
  impetoPlan: { name: string | null; score: number; confidence: number; reason: string };
  simulation: DeepSimulationSummary;
  learning: MatchLearningV31;
  gameplayChanges: string[];
  protectedTraits: string[];
  safeguards: string[];
  performance: { computeMs: number; cacheHit: boolean; modulesLoadedOnDemand: string[] };
  summary: string;
};



export type CalibrationV32Profile = {
  mode: GameplayMode;
  label: string;
  score: number;
  training: TrainingPlan;
  exactBudget: boolean;
  strengths: string[];
  tradeOffs: string[];
};

export type CalibrationV32Analysis = {
  engineVersion: string;
  patchReference: 'eFootball v5.4.0';
  selectedMode: GameplayMode;
  connectionProfile: ConnectionProfile;
  controlProfile: ControlProfile;
  readiness: 'pronta' | 'quase pronta' | 'revisar';
  readinessScore: number;
  confidence: number;
  calibrationScore: number;
  finalTraining: TrainingPlan;
  candidatesEvaluated: number;
  exactBudgetCandidates: number;
  recalibrated: boolean;
  dimensions: {
    roleFit: number;
    formationFit: number;
    playstyleFit: number;
    controlFit: number;
    connectionRobustness: number;
    pointEfficiency: number;
    skillSynergy: number;
    impetoSynergy: number;
    antiOverallWaste: number;
    crossModeStability: number;
    gameplayResponse: number;
    functionalFloor: number;
    identityPreservation: number;
  };
  profiles: CalibrationV32Profile[];
  blockers: string[];
  warnings: string[];
  safeguards: string[];
  reasons: string[];
  summary: string;
};

export type PositionGameplayBuild = {
  position: PositionCode;
  label: string;
  role: 'posição natural' | 'posição escolhida';
  training: TrainingPlan;
  score: number;
  gameplayResponse: number;
  functionalFloor: number;
  antiOverallWaste: number;
  crossModeStability: number;
  exactBudget: boolean;
  strengths: string[];
  note: string;
};

export type PositionBuildComparison = {
  engineVersion: string;
  natural: PositionGameplayBuild;
  selected: PositionGameplayBuild;
  samePosition: boolean;
  recommendation: string;
  safeguards: string[];
};

export type GameplayDnaProfileId =
  | 'DRIBBLER'
  | 'CREATOR'
  | 'FINISHER'
  | 'SECOND_STRIKER'
  | 'DIRECT_RUNNER'
  | 'AERIAL_TARGET'
  | 'WIDE_CREATOR'
  | 'BOX_TO_BOX'
  | 'DEEP_PLAYMAKER'
  | 'BALL_WINNER'
  | 'DEFENSIVE_ANCHOR'
  | 'PROGRESSIVE_DEFENDER'
  | 'DEFENSIVE_FULLBACK'
  | 'OFFENSIVE_FULLBACK'
  | 'GK_SHOT_STOPPER'
  | 'GK_DISTRIBUTOR'
  | 'GK_BALANCED';

export type GameplayDnaProfile = {
  id: GameplayDnaProfileId;
  rank: number;
  label: string;
  functionalStyle: string;
  description: string;
  position: PositionCode;
  compatibility: number;
  score: number;
  recommended: boolean;
  exactBudget: boolean;
  training: TrainingPlan;
  additionalSkills: string[];
  focus: string[];
  strengths: string[];
  limitations: string[];
  evidence: string[];
};

export type GameplayDnaAnalysis = {
  engineVersion: string;
  playerName: string;
  officialPlaystyle: string | null;
  selectedPosition: PositionCode;
  detectedDna: string[];
  primaryProfileId: GameplayDnaProfileId;
  profiles: GameplayDnaProfile[];
  summary: string;
  safeguards: string[];
};

export type SupremeGameplayAnalysis = {
  engineVersion: string;
  mode: 'Otimização competitiva personalizada';
  candidatesEvaluated: number;
  validCandidates: number;
  finalists: number;
  finalTraining: TrainingPlan;
  winnerScore: number;
  currentScore: number;
  autoScore: number | null;
  professionalReferenceScore: number | null;
  potentialEdgeVsCurrent: number;
  potentialEdgeVsAuto: number | null;
  potentialEdgeVsProfessional: number | null;
  dimensions: {
    roleFit: number;
    tacticalFit: number;
    managerFit: number;
    thresholdFit: number;
    pointEfficiency: number;
    skillSynergy: number;
    identityPreservation: number;
    onlineRobustness: number;
  };
  roleLabel: string;
  tacticalContext: string;
  reasons: string[];
  warnings: string[];
  guardrails: string[];
  summary: string;
};

export type AnalysisResult = {
  objective?: Objective;
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
  skillIntegrity?: SkillIntegrityAudit;
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
  competitiveFusion?: CompetitiveFusionSummary;
  localAi?: LocalAiAnalysis;
  deepCardIntelligence?: DeepCardIntelligenceAnalysis;
  unifiedIntelligence?: UnifiedCardIntelligenceAnalysis;
  supremeGameplay?: SupremeGameplayAnalysis;
  calibrationV32?: CalibrationV32Analysis;
  positionBuildComparison?: PositionBuildComparison;
  gameplayDna?: GameplayDnaAnalysis;
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

