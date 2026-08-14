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
export type ControlProfile = 'AUTO' | 'BALANCED' | 'PASSING' | 'DRIBBLE' | 'DIRECT';
export type EffectiveControlProfile = Exclude<ControlProfile, 'AUTO'>;
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
  /** v6.0: estilo ofensivo preservado separadamente quando a carta exibe dois estilos. */
  offensivePlaystyle?: string | null;
  /** v6.0: estilo defensivo lido; nomes novos podem ser preservados como provisórios. */
  defensivePlaystyle?: string | null;
  /** true somente quando o nome já está confirmado no catálogo oficial/conservador. */
  defensivePlaystyleConfirmed?: boolean;
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
  additionalSkills?: string[];
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
    skillSource?: 'explicit' | 'visible_block' | 'scan' | 'none';
    skillConfidence?: number;
    additionalSkillCount?: number;
    specialSkillCount?: number;
    impetoSlotStatus?: 'DISPONIVEL' | 'OCUPADO' | 'SEM_VAGA' | 'NAO_CONFIRMADO';
    impetoSlotEvidence?: string | null;
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



export type AutomaticCardGameplayProfile = {
  engineVersion: string;
  mode: 'AUTO';
  label: string;
  primaryInternalProfile: EffectiveControlProfile;
  confidence: number;
  dimensions: {
    creation: number;
    dribbling: number;
    finishing: number;
    setPieces: number;
    movement: number;
    defensive: number;
    physical: number;
    aerial: number;
    goalkeeping: number;
  };
  trainingWeights: Partial<Record<TrainingKey, number>>;
  evidence: string[];
  safeguards: string[];
  signature: string;
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
  automaticCardProfile?: AutomaticCardGameplayProfile;
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


export type StructuralFieldKey =
  | 'playerName'
  | 'cardType'
  | 'mainPosition'
  | 'playstyle'
  | 'level'
  | 'trainingPoints'
  | 'attributes'
  | 'nativeSkills'
  | 'additionalSkills'
  | 'specialSkills'
  | 'impetos';

export type StructuralFieldConfidence = {
  key: StructuralFieldKey;
  label: string;
  value: string;
  confidence: number;
  status: 'confirmed' | 'review' | 'blocked';
  source: 'manual' | 'ocr' | 'canonical' | 'inferred' | 'fallback';
  critical: boolean;
  reason: string;
};

export type StructuralSkillInventory = {
  native: string[];
  additional: string[];
  special: string[];
  duplicatesRemoved: string[];
  slotsUsed: number;
  slotsRemaining: number;
  source: 'explicit' | 'visible_block' | 'scan' | 'none';
  confidence: number;
};

export type StructuralPointAudit = {
  budget: number;
  actualCost: number;
  remaining: number;
  exact: boolean;
  source: ParsedCard['trainingPointSource'];
  sourceConfidence: number;
  costByGroup: TrainingPlan;
  invalidGroups: string[];
  signature: string;
};

export type CanonicalCardIdentity = {
  canonicalId: string;
  fingerprint: string;
  versionKey: string;
  matchStatus: 'confirmed' | 'probable' | 'uncertain';
  confidence: number;
  evidence: string[];
};

export type StructuralPrecisionAnalysis = {
  engineVersion: '37.40.0';
  canonical: CanonicalCardIdentity;
  fields: StructuralFieldConfidence[];
  overallConfidence: number;
  criticalConfidence: number;
  decision: 'approved' | 'review' | 'blocked';
  blocked: boolean;
  blockReasons: string[];
  skillInventory: StructuralSkillInventory;
  pointAudit: StructuralPointAudit;
  regressionKey: string;
  safeguards: string[];
};



export type AdvancedRoleOptimization = {
  roleId: string;
  roleLabel: string;
  position: PositionCode;
  functionScore: number;
  weights: Partial<Record<TrainingKey, number>>;
  primaryGroups: TrainingKey[];
  protectedGroups: TrainingKey[];
  correctionGroups: TrainingKey[];
  reasons: string[];
};

export type AdvancedBuildAlternative = {
  id: string;
  title: string;
  strategy: 'recomendada' | 'função' | 'identidade' | 'equilíbrio' | 'robustez';
  training: TrainingPlan;
  pointsUsed: number;
  exactBudget: boolean;
  roleFit: number;
  efficiency: number;
  balance: number;
  overallScore: number;
  strengths: string[];
  tradeOffs: string[];
};

export type SkillGraphNode = {
  id: string;
  name: string;
  category: UnifiedSkillDecision['category'];
  score: number;
  appearsInSets: number;
  essentialForRole: boolean;
};

export type SkillGraphEdge = {
  from: string;
  to: string;
  relation: 'complemento' | 'redundância' | 'conflito';
  weight: number;
  reason: string;
};

export type SkillSetComparison = {
  id: string;
  title: string;
  linkedBuildId: string;
  skills: string[];
  decisions: UnifiedSkillDecision[];
  coverageScore: number;
  synergyScore: number;
  roleFit: number;
  redundancyPenalty: number;
  overallScore: number;
  reasons: string[];
  warnings: string[];
};

export type JointBuildBoosterOption = {
  rank: number;
  buildId: string;
  buildTitle: string;
  boosterName: string;
  boosterTier: ImpetoRecommendation['tier'];
  training: TrainingPlan;
  skills: string[];
  buildScore: number;
  skillSetScore: number;
  boosterScore: number;
  boosterSynergy: number;
  saturationPenalty: number;
  overallScore: number;
  reason: string;
};

export type AdvancedMotorV3750Analysis = {
  engineVersion: '37.50.0';
  role: AdvancedRoleOptimization;
  alternatives: AdvancedBuildAlternative[];
  skillGraph: { nodes: SkillGraphNode[]; edges: SkillGraphEdge[] };
  skillSets: SkillSetComparison[];
  jointOptions: JointBuildBoosterOption[];
  winner: JointBuildBoosterOption;
  confidence: number;
  safeguards: string[];
};

export type PowerBuildScoreDimensions = {
  roleExecution: number;
  functionalThresholds: number;
  pointEfficiency: number;
  responsiveness: number;
  identityPreservation: number;
  specialSkillActivation: number;
  skillCoverage: number;
  impetoSynergy: number;
  onlineRobustness: number;
  antiOverallWaste: number;
  exactBudget: number;
  confidenceSafety: number;
};

export type PowerBuildCandidate = {
  id: string;
  title: string;
  source: string;
  training: TrainingPlan;
  pointsUsed: number;
  exactBudget: boolean;
  performanceScore: number;
  dimensions: PowerBuildScoreDimensions;
  thresholdsMet: number;
  thresholdsTotal: number;
  saturationPenalty: number;
  wastePenalty: number;
  strengths: string[];
  tradeOffs: string[];
};

export type PowerSkillDecision = UnifiedSkillDecision & {
  activationFrequency: 'muito alta' | 'alta' | 'média';
  coverageRole: string;
  redundancyPenalty: number;
};

export type PowerImpetoDecision = ImpetoRecommendation & {
  performanceScore: number;
  roleFit: number;
  attributeCoverage: number;
  buildSynergy: number;
  skillSynergy: number;
  saturationPenalty: number;
  supportedGroups: TrainingKey[];
};

export type PowerBuildEngineV3850Analysis = {
  engineVersion: '38.50.0';
  philosophy: 'DESEMPENHO_REAL_SEM_FOCO_EM_OVERALL';
  improvements: string[];
  candidatesEvaluated: number;
  finalists: PowerBuildCandidate[];
  winner: PowerBuildCandidate;
  skills: PowerSkillDecision[];
  impetos: PowerImpetoDecision[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  guardrails: string[];
  summary: string;
};


export type MaxMatchScenarioId =
  | 'RANKED_CORE'
  | 'HIGH_DELAY'
  | 'TIGHT_SPACES'
  | 'HIGH_PRESS'
  | 'FAST_TRANSITION'
  | 'PHYSICAL_DUELS'
  | 'LATE_GAME'
  | 'SPECIAL_SKILL_TRIGGER';

export type MaxMatchScenarioScore = {
  id: MaxMatchScenarioId;
  label: string;
  score: number;
  weight: number;
  bottleneck: string;
  protectedActions: string[];
};

export type MaxMatchBreakpoint = {
  attribute: AttributeKey;
  label: string;
  projected: number;
  targetBand: number;
  status: 'acima' | 'atingido' | 'proximo' | 'abaixo';
  impact: string;
};

export type MaxMatchCounterfactual = {
  change: string;
  scoreDelta: number;
  verdict: 'manter' | 'alternativa situacional' | 'melhoria encontrada';
};

export type MaxMatchSkillPackage = {
  id: string;
  label: string;
  skills: PowerSkillDecision[];
  score: number;
  activationCoverage: number;
  roleCoverage: number;
  scenarioFit: number;
  redundancyPenalty: number;
};

export type MaxMatchImpetoCombination = {
  impeto: PowerImpetoDecision;
  score: number;
  weakestScenarioGain: number;
  reason: string;
};

export type MaxMatchCandidate = PowerBuildCandidate & {
  projectedAttributes: Partial<Record<AttributeKey, number>>;
  actionScores: Record<string, number>;
  scenarioScores: MaxMatchScenarioScore[];
  scenarioAverage: number;
  worstScenario: number;
  consistency: number;
  minMaxScore: number;
  breakpointScore: number;
  fatigueResistance: number;
  duelReliability: number;
  tightSpaceControl: number;
  transitionImpact: number;
  skillPackage: MaxMatchSkillPackage;
  impetoCombination: MaxMatchImpetoCombination;
};

export type MaxMatchPerformanceV3860Analysis = {
  engineVersion: '38.60.0';
  philosophy: 'MAXIMO_DESEMPENHO_EM_PARTIDA_SEM_OVERALL';
  improvements: string[];
  microRole: string;
  candidatesEvaluated: number;
  scenariosTested: number;
  finalists: MaxMatchCandidate[];
  winner: MaxMatchCandidate;
  skillPackages: MaxMatchSkillPackage[];
  impetoCombinations: MaxMatchImpetoCombination[];
  breakpoints: MaxMatchBreakpoint[];
  counterfactuals: MaxMatchCounterfactual[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  guardrails: string[];
  summary: string;
};

export type SupremeMatchPhaseId =
  | 'BUILDUP'
  | 'CENTRAL_PROGRESSION'
  | 'FINAL_THIRD'
  | 'DEFENSIVE_TRANSITION'
  | 'SETTLED_DEFENCE'
  | 'LATE_MATCH';

export type SupremeMatchPhaseScore = {
  id: SupremeMatchPhaseId;
  label: string;
  score: number;
  weight: number;
  limitingAction: string;
  decisiveAttributes: string[];
};

export type OpponentArchetypeId =
  | 'LOW_BLOCK'
  | 'HIGH_PRESS'
  | 'FAST_COUNTER'
  | 'PHYSICAL_COMPACT'
  | 'POSSESSION_CONTROL'
  | 'BALANCED_META';

export type OpponentStressScore = {
  id: OpponentArchetypeId;
  label: string;
  score: number;
  weight: number;
  reason: string;
  protectedPhase: SupremeMatchPhaseId;
};

export type RobustnessEnvelopeV3870 = {
  expected: number;
  conservative: number;
  optimistic: number;
  uncertaintyWidth: number;
  ocrRiskPenalty: number;
  stableGroups: TrainingKey[];
  sensitiveGroups: TrainingKey[];
};

export type MarginalTrainingValueV3870 = {
  training: TrainingKey;
  label: string;
  currentLevel: number;
  nextPointCost: number;
  gain: number;
  lossIfRemoved: number;
  verdict: 'proteger' | 'eficiente' | 'situacional' | 'saturado';
  reason: string;
};

export type SkillTriggerMatrixV3870 = {
  skill: string;
  triggerRate: number;
  phaseCoverage: SupremeMatchPhaseId[];
  opponentCoverage: OpponentArchetypeId[];
  dependencyScore: number;
  reason: string;
};

export type ImpetoStressTestV3870 = {
  name: string;
  score: number;
  worstOpponentGain: number;
  worstPhaseGain: number;
  saturationRisk: number;
  verdict: 'ideal' | 'forte' | 'situacional';
  reason: string;
};

export type ParetoCandidateV3870 = {
  candidateId: string;
  title: string;
  rank: number;
  dominated: boolean;
  phaseAverage: number;
  worstPhase: number;
  opponentAverage: number;
  worstOpponent: number;
  conservativeScore: number;
  pointEfficiency: number;
  reason: string;
};

export type SupremeCandidateV3870 = MaxMatchCandidate & {
  phaseScores: SupremeMatchPhaseScore[];
  phaseAverage: number;
  worstPhase: number;
  opponentScores: OpponentStressScore[];
  opponentAverage: number;
  worstOpponent: number;
  attributeSynergy: number;
  bottleneckBalance: number;
  robustness: RobustnessEnvelopeV3870;
  triggerCoverage: number;
  paretoRank: number;
  dominated: boolean;
  supremeScore: number;
};

export type SupremePerformanceV3870Analysis = {
  engineVersion: '38.70.0';
  philosophy: 'OTIMIZACAO_ROBUSTA_PARETO_SEM_OVERALL';
  improvements: string[];
  microRole: string;
  searchRounds: number;
  candidatesGenerated: number;
  candidatesEvaluated: number;
  phasesTested: number;
  opponentsTested: number;
  winner: SupremeCandidateV3870;
  finalists: SupremeCandidateV3870[];
  paretoFrontier: ParetoCandidateV3870[];
  marginalValues: MarginalTrainingValueV3870[];
  skillTriggerMatrix: SkillTriggerMatrixV3870[];
  impetoStressTests: ImpetoStressTestV3870[];
  adaptiveVariants: Array<{
    id: string;
    label: string;
    purpose: string;
    training: TrainingPlan;
    score: number;
    bestPhase: SupremeMatchPhaseId;
    bestOpponent: OpponentArchetypeId;
  }>;
  validationProtocol: string[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  guardrails: string[];
  summary: string;
};



export type CardFirstDimensionId =
  | 'CREATION'
  | 'CONTROL'
  | 'FINISHING'
  | 'MOVEMENT'
  | 'DEFENDING'
  | 'PHYSICAL'
  | 'AERIAL'
  | 'ENDURANCE'
  | 'GOALKEEPING';

export type CardFirstDimensionScore = {
  id: CardFirstDimensionId;
  label: string;
  score: number;
  rank: number;
  evidence: string[];
};

export type CardFirstConversionClass =
  | 'NATURAL'
  | 'COMPATIVEL'
  | 'REINTERPRETACAO'
  | 'ARRISCADA'
  | 'EXTREMA';

export type CardFirstCandidateV3880 = {
  id: string;
  title: string;
  source: string;
  training: TrainingPlan;
  score: number;
  identityFit: number;
  targetFunctionFit: number;
  nativeSkillActivation: number;
  robustness: number;
  pointEfficiency: number;
  antiCloneScore: number;
  exactBudget: boolean;
  reasons: string[];
  tradeOffs: string[];
};

export type CardFirstAiV3880Analysis = {
  engineVersion: '38.80.0';
  philosophy: 'CARTA_PRIMEIRO_POSICAO_COMO_RESTRICAO_SEM_OVERALL';
  cardFingerprint: string;
  originProfile: string;
  targetFunction: string;
  conversionClass: CardFirstConversionClass;
  conversionScore: number;
  archetype: string;
  secondaryArchetype: string;
  dimensions: CardFirstDimensionScore[];
  blendWeights: {
    cardIdentity: number;
    targetFunction: number;
    matchRobustness: number;
  };
  candidatesGenerated: number;
  candidatesEvaluated: number;
  winner: CardFirstCandidateV3880;
  finalists: CardFirstCandidateV3880[];
  skillPlan: UnifiedSkillDecision[];
  impetoPlan: ImpetoRecommendation[];
  differencesFromPositionTemplate: string[];
  guardrails: string[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  summary: string;
};



export type CanonicalCardV3890Analysis = {
  engineVersion: '38.90.0';
  philosophy: 'UMA_CARTA_UMA_RECEITA_DEFINITIVA_INDEPENDENTE_DA_POSICAO';
  canonicalCardId: string;
  resultSignature: string;
  canonicalPosition: PositionCode;
  canonicalPositionLabel: string;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  positionAffectsOutput: false;
  training: TrainingPlan;
  skills: string[];
  impetos: ImpetoRecommendation[];
  primaryImpeto: string | null;
  deterministicChecks: string[];
  lockedInputs: string[];
  ignoredInputs: string[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  summary: string;
};

export type GlobalProEvidenceLevel = 'FICHA_COMPLETA' | 'PROGRESSAO' | 'PARCIAL';

export type GlobalProBlockComparison = {
  key: TrainingKey;
  label: string;
  buildMaster: number;
  proConsensus: number;
  difference: number;
  agreement: number;
  sourceCount: number;
};

export type GlobalProReferenceV3900 = {
  id: string;
  gamerTag: string;
  country: string;
  platform: string;
  achievement: string;
  playerName: string;
  cardType: string;
  specialTag: string;
  mainPosition: PositionCode;
  trainingPointsTotal: number | null;
  title: string;
  url: string;
  channel: string;
  publishedAt: string | null;
  reviewedAt: string;
  exactCard: boolean;
  identityScore: number;
  evidenceLevel: GlobalProEvidenceLevel;
  training: TrainingPlan;
  skills: string[];
  impeto: string | null;
  trainingSimilarity: number;
  skillSimilarity: number | null;
  impetoMatch: boolean | null;
  completeness: number;
  testedInMatches: boolean;
};

export type GlobalProBenchmarkV3900Analysis = {
  engineVersion: '39.00.0';
  philosophy: 'COMPARAR_SEM_COPIAR_CEGAMENTE_E_APLICAR_SOMENTE_EVIDENCIA_EXATA';
  canonicalCardId: string;
  resultSignature: string;
  registryProfiles: number;
  referencesFound: number;
  exactReferences: number;
  verifiedProReferences: number;
  fullBuildReferences: number;
  globalFullBuildReferences: number;
  distinctPros: number;
  confidence: number;
  confidenceLabel: 'muito alta' | 'alta' | 'média' | 'baixa' | 'sem dados';
  professionalInfluence: number;
  automaticCalibrationApplied: boolean;
  generatedTraining: TrainingPlan;
  proConsensusTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  generatedSkills: string[];
  proConsensusSkills: string[];
  finalSkills: string[];
  generatedImpeto: string | null;
  proConsensusImpeto: string | null;
  finalImpeto: string | null;
  trainingSimilarity: number | null;
  skillSimilarity: number | null;
  impetoAgreement: boolean | null;
  blockComparisons: GlobalProBlockComparison[];
  references: GlobalProReferenceV3900[];
  guardrails: string[];
  reasons: string[];
  warnings: string[];
  summary: string;
};

export type UniversalPositionPerformanceV3910 = {
  position: PositionCode;
  label: string;
  familiarity: number;
  weight: number;
  performanceScore: number;
  worstScenario: number;
  consistency: number;
  pointEfficiency: number;
  tightSpaceControl: number;
  transitionImpact: number;
  duelReliability: number;
  verdict: 'elite' | 'forte' | 'situacional' | 'inadequada';
};

export type EliteDominanceCandidateV3910 = {
  id: string;
  title: string;
  source: string;
  training: TrainingPlan;
  exactBudget: boolean;
  universalScore: number;
  averagePositionScore: number;
  worstPositionScore: number;
  naturalPositionScore: number;
  scenarioFloor: number;
  crossPositionConsistency: number;
  pointEfficiency: number;
  identityFit: number;
  proChallengeScore: number | null;
  proMargin: number | null;
  positionScores: UniversalPositionPerformanceV3910[];
  reasons: string[];
  tradeOffs: string[];
};

export type EliteDominanceV3910Analysis = {
  engineVersion: '39.10.0';
  philosophy: 'UMA_CARTA_UMA_RECEITA_UNIVERSAL_DOMINANTE_SEM_OVERALL';
  canonicalCardId: string;
  resultSignature: string;
  selectedPositionAffectsOutput: false;
  selectedPositionLabel: string;
  compatiblePositions: UniversalPositionPerformanceV3910[];
  candidatesGenerated: number;
  candidatesEvaluated: number;
  fullFinalistsEvaluated: number;
  winner: EliteDominanceCandidateV3910;
  finalists: EliteDominanceCandidateV3910[];
  skills: UnifiedSkillDecision[];
  impetos: ImpetoRecommendation[];
  primaryImpeto: string | null;
  proReferencesChallenged: number;
  proBestScore: number | null;
  proMargin: number | null;
  proChallengeStatus: 'supera_no_modelo' | 'empata_no_modelo' | 'abaixo_no_modelo' | 'sem_evidencia';
  proChallengeLabel: string;
  deterministicChecks: string[];
  guardrails: string[];
  confidence: number;
  decision: 'aprovada' | 'revisar';
  summary: string;
};



export type UnifiedPerformanceResourceStatusV3920 = 'APLICAR_COM_SEGURANCA' | 'TESTAR_ANTES_DE_GASTAR' | 'NAO_GASTAR_RECURSOS';

export type UnifiedPerformanceIdentityV3920 = {
  source: 'CURADORIA_E_CARTA' | 'SOMENTE_CARTA';
  profileId: string;
  label: string;
  primaryArchetype: string;
  secondaryArchetype: string;
  traits: string[];
  realLifeModel: string;
  cardEvidence: string[];
  confidence: number;
};

export type UnifiedPositionFitV3920 = {
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  naturalPosition: PositionCode;
  naturalPositionLabel: string;
  playstyle: string | null;
  playstyleActive: boolean;
  movementProfile: 'FIXO' | 'CONTROLADO' | 'MISTO' | 'VERTICAL' | 'AGRESSIVO';
  roleFit: number;
  structuralFit: number;
  identityFit: number;
  compatibility: number;
  verdict: 'IDEAL' | 'FORTE' | 'SITUACIONAL' | 'INCOMPATIVEL';
  conflicts: string[];
  strengths: string[];
  recommendedUse: string;
};

export type UnifiedMicroAdaptationV3920 = {
  available: boolean;
  appliedAutomatically: false;
  maximumLevelShift: number;
  training: TrainingPlan;
  changes: Array<{ key: TrainingKey; label: string; from: number; to: number }>;
  note: string;
};

export type UnifiedResourceSafetyV3920 = {
  status: UnifiedPerformanceResourceStatusV3920;
  label: string;
  canSpendImpeto: boolean;
  canApplySkills: boolean;
  canApplyTraining: boolean;
  minimumTestMatches: number;
  recipeLocked: boolean;
  lockSignature: string;
  reasons: string[];
  nextAction: string;
};

export type UnifiedProCompactV3920 = {
  exactReferences: number;
  fullBuildReferences: number;
  confidence: number;
  status: 'ACIMA_NO_MODELO' | 'EMPATE_TECNICO' | 'ABAIXO_NO_MODELO' | 'SEM_EVIDENCIA';
  label: string;
  margin: number | null;
};

export type UnifiedPerformanceV3920Analysis = {
  engineVersion: '39.20.0';
  philosophy: 'UMA_TELA_UMA_RECEITA_IDENTIDADE_ENCAIXE_E_PROTECAO_DE_RECURSOS';
  canonicalCardId: string;
  lockSignature: string;
  selectedPositionAffectsCanonicalRecipe: false;
  identity: UnifiedPerformanceIdentityV3920;
  positionFit: UnifiedPositionFitV3920;
  canonicalTraining: TrainingPlan;
  canonicalSkills: UnifiedSkillDecision[];
  canonicalImpetos: ImpetoRecommendation[];
  primaryImpeto: string | null;
  microAdaptation: UnifiedMicroAdaptationV3920;
  resourceSafety: UnifiedResourceSafetyV3920;
  proCompact: UnifiedProCompactV3920;
  performanceCeiling: number;
  tacticalStability: number;
  identityPreservation: number;
  deterministicChecks: string[];
  compactSections: string[];
  warnings: string[];
  summary: string;
  recipeMemory?: {
    status: 'NOVA' | 'RECUPERADA' | 'ATUALIZADA' | 'IGNORADA';
    matchScore: number;
    previousSignature?: string;
    note: string;
  };
};


export type AdaptivePositionStatusV3930 = 'PRONTO' | 'TESTE_RECOMENDADO' | 'REVISAR_LEITURA';

export type AdaptivePositionChangeV3930 = {
  key: TrainingKey;
  label: string;
  from: number;
  to: number;
};

export type AdaptivePositionV3930Analysis = {
  engineVersion: '39.30.0';
  philosophy: 'NUCLEO_DA_CARTA_FIXO_ADAPTACAO_DETERMINISTICA_POR_POSICAO';
  canonicalCardId: string;
  coreSignature: string;
  positionSignature: string;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  naturalPosition: PositionCode;
  naturalPositionLabel: string;
  selectedPositionAffectsCoreRecipe: false;
  selectedPositionAffectsAppliedRecipe: true;
  deterministic: true;
  adaptationApplied: boolean;
  adaptationMode: 'NATURAL' | 'COMPATIVEL' | 'FORA_DA_POSICAO';
  coreTraining: TrainingPlan;
  adaptedTraining: TrainingPlan;
  exactBudget: boolean;
  corePreservation: number;
  positionalGain: number;
  maxShiftLevels: number;
  changes: AdaptivePositionChangeV3930[];
  coreSkills: UnifiedSkillDecision[];
  positionalSkills: UnifiedSkillDecision[];
  finalSkills: UnifiedSkillDecision[];
  primaryImpeto: string | null;
  impetoLockedByCard: true;
  impetos: ImpetoRecommendation[];
  positionFit: number;
  status: AdaptivePositionStatusV3930;
  statusLabel: string;
  canApplyTraining: boolean;
  canApplySkills: boolean;
  canUseImpeto: boolean;
  warnings: string[];
  reasons: string[];
  summary: string;
};


export type PerformanceFunctionV3940Analysis = {
  engineVersion: '39.40.0';
  philosophy: 'DNA_DA_CARTA_FUNCAO_REAL_POSICAO_ALVO_SEM_RECEITA_GENERICA';
  deterministic: true;
  canonicalCardId: string;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  roleId: string;
  roleLabel: string;
  roleDescription: string;
  roleSignature: string;
  playstyle: string;
  movementProfile: 'FIXO' | 'CONTROLADO' | 'VERTICAL' | 'AGRESSIVO' | 'MISTO';
  baseTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  exactBudget: boolean;
  candidateCount: number;
  corePreservation: number;
  roleScoreBefore: number;
  roleScoreAfter: number;
  responseScoreBefore: number;
  responseScoreAfter: number;
  stabilityScore: number;
  fitBefore: number;
  fitAfter: number;
  changes: AdaptivePositionChangeV3930[];
  fixedSkills: UnifiedSkillDecision[];
  roleSkills: UnifiedSkillDecision[];
  finalSkills: UnifiedSkillDecision[];
  primaryImpeto: string | null;
  impetoLockedByCard: true;
  impetos: ImpetoRecommendation[];
  useLevel: 'PRINCIPAL' | 'ALTERNATIVA' | 'EXPERIMENTAL';
  canApply: boolean;
  recommendedUse: string;
  tacticalWarnings: string[];
  reasons: string[];
  summary: string;
};


export type AdaptiveMaximumProfileV4030 = {
  id: 'FINISHER' | 'CREATOR' | 'DRIBBLER' | 'QUICK_COUNTER' | 'POSSESSION' | 'PRESSING' | 'DEFENSIVE' | 'AERIAL' | 'GOALKEEPER';
  label: string;
  score: number;
  rank: number;
  reason: string;
};

export type AdaptiveMaximumV4030Analysis = {
  engineVersion: '40.30.0';
  mode: 'DESEMPENHO_MAXIMO_ADAPTATIVO';
  objectiveMode: 'ADAPTATIVO' | 'ESPECIALIZACAO_MANUAL';
  deterministic: true;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  profiles: AdaptiveMaximumProfileV4030[];
  baseTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  exactBudget: boolean;
  candidatesEvaluated: number;
  baselineScore: number;
  winnerScore: number;
  contextScores: { ranked: number; events: number; friends: number; average: number };
  changes: AdaptivePositionChangeV3930[];
  consistencyKey: string;
  skillIntegrity: { duplicatesWithOwned: number; uniqueRecommended: number; fiveSlotsRespected: boolean };
  metaRuntime: {
    engineVersion: '40.30.0';
    stableVersion: '6.0.0';
    stableSince: '2026-08-13';
    nextAnnouncedVersion: 'não anunciada';
    nextWindow: 'não anunciada';
    speculativeWeightsApplied: false;
    confirmedV600WeightsAppliedByDedicatedEngine: true;
    policy: string;
  };
  guarantees: {
    gerIsNotOptimizationTarget: true;
    noRandomness: true;
    exactPointBudget: boolean;
    nativeSkillDuplicationBlocked: boolean;
    speculativeNextPatchWeightsBlocked: boolean;
  };
  reasons: string[];
  summary: string;
};


export type MaximumPerformanceAlternativeV4040 = {
  id: 'MAXIMO_COMPETITIVO' | 'RESPOSTA_ONLINE' | 'DNA_PRESERVADO';
  label: string;
  training: TrainingPlan;
  score: number;
  rankedScore: number;
  dnaPreservation: number;
  efficiencyScore: number;
};

export type MaximumPerformanceV4040Analysis = {
  engineVersion: '40.40.0';
  mode: 'PRECISAO_COMPETITIVA_99';
  deterministic: true;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  baseTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  exactBudget: boolean;
  candidatesEvaluated: number;
  paretoCandidates: number;
  baselineScore: number;
  winnerScore: number;
  scoreGap: number;
  contextScores: { ranked: number; events: number; friends: number; average: number };
  responseScore: number;
  dnaPreservation: number;
  efficiencyScore: number;
  profileFitScore: number;
  confidence: {
    score: number;
    level: 'ALTA' | 'MEDIA' | 'REVISAR';
    dataQuality: number;
    decisionMargin: number;
    reasons: string[];
  };
  alternatives: MaximumPerformanceAlternativeV4040[];
  changes: AdaptivePositionChangeV3930[];
  skillPlan: {
    finalSkills: string[];
    slotsFilled: number;
    duplicatesBlocked: number;
    unique: boolean;
    sourcePolicy: string;
  };
  metaRuntime: {
    engineVersion: '40.40.0';
    stableVersion: '6.0.0';
    stableSince: '2026-08-13';
    nextAnnouncedVersion: 'não anunciada';
    announcedTeamPlaystyle: 'Sobreposição';
    announcedTeamPlaystyleInternalId: 'OVERLOAD';
    speculativeWeightsApplied: false;
    confirmedV600WeightsAppliedByDedicatedEngine: true;
    automaticActivationAllowed: true;
    policy: string;
  };
  guarantees: {
    gerIsNotOptimizationTarget: true;
    noRandomness: true;
    exactPointBudget: boolean;
    onlyExistingSkillNames: true;
    ownedSkillDuplicationBlocked: boolean;
    speculativeV600WeightsBlocked: boolean;
  };
  reasons: string[];
  summary: string;
};


export type GameplayValidationMemoryV4050 = {
  engineVersion: '40.50.0';
  applied: true;
  winnerId: string;
  winnerLabel: string;
  confidenceScore: number;
  rawMatches: number;
  effectiveMatches: number;
  verifiedAt: string;
};

export type LongitudinalGameplayMemoryV4060 = {
  engineVersion: '40.60.0';
  applied: boolean;
  provisionalV4050Blocked: boolean;
  winnerId: string | null;
  winnerLabel: string | null;
  confidenceScore: number;
  sessions: number;
  pairedSessions: number;
  verifiedAt: string | null;
};

export type MaximumPerformanceV4080Impeto = {
  slotStatus: 'DISPONIVEL' | 'OCUPADO' | 'SEM_VAGA' | 'NAO_CONFIRMADO';
  canCraft: boolean;
  existing: string[];
  primary: string | null;
  candidates: ImpetoRecommendation[];
  bestScore: number;
  selectableOfficialCount: 28;
  randomPool: { outfieldMin: 14; outfieldMax: 15; goalkeeper: 8 };
  policy: string;
};

export type MaximumPerformanceV4080Analysis = {
  engineVersion: '40.80.0';
  mode: 'DESEMPENHO_MAXIMO_STACK_FINAL';
  deterministic: true;
  selectedPosition: PositionCode;
  selectedPositionLabel: string;
  trainingSource: 'VALIDADO_LONGITUDINAL' | 'PARETO_RECONCILIADO' | 'ATUAL';
  baseTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  exactBudget: boolean;
  candidatesEvaluated: number;
  baselineJointScore: number;
  winnerJointScore: number;
  jointGain: number;
  skillPlan: {
    finalSkills: string[];
    score: number;
    lateBound: true;
    duplicatesWithOwned: number;
    slotsFilled: number;
  };
  impeto: MaximumPerformanceV4080Impeto;
  marginalAudit: Array<{
    key: TrainingKey;
    label: string;
    level: number;
    roleWeight: number;
    saturationRisk: number;
    verdict: 'PROTEGER' | 'EFICIENTE' | 'SATURADO' | 'BAIXA_PRIORIDADE';
  }>;
  guarantees: {
    gerIsNotOptimizationTarget: true;
    finalBuildFirst: true;
    finalSkillsReconciled: boolean;
    invalidImpetoSpendBlocked: boolean;
    existingImpetoPreserved: true;
    longitudinalWinnerProtected: boolean;
    noRandomness: true;
  };
  reasons: string[];
  summary: string;
};

export type EfootballV600PerformanceAnalysis = {
  engineVersion: '6.0.0-buildmaster-r5';
  season: 'eFootball 2027';
  liveMeta: true;
  selectedPosition: PositionCode;
  connectionProfile: ConnectionProfile;
  offensivePlaystyle: string | null;
  defensivePlaystyle: string | null;
  baselineTraining: TrainingPlan;
  finalTraining: TrainingPlan;
  exactBudget: boolean;
  candidatesEvaluated: number;
  baselineScore: number;
  winnerScore: number;
  gain: number;
  responseScore: number;
  manualDefenceScore: number;
  firstTouchScore: number;
  finalSkills: string[];
  impetoPrimary: string | null;
  fluidFormationReady: true;
  overloadReady: true;
  previousSeasonMemoryDownweighted: boolean;
  guarantees: {
    doesNotClaimToFixNetwork: true;
    gerIsNotOptimizationTarget: true;
    exactPointBudget: boolean;
    onlyConfirmedDefensiveStyleWeighted: boolean;
    ownedSkillDuplicationBlocked: boolean;
    invalidImpetoSpendBlocked: boolean;
  };
  reasons: string[];
  summary: string;
};


export type RealPerformance2027V4080R7Analysis = {
  engineVersion: '40.80-r7-real-performance-2027';
  mode: 'DESEMPENHO_REAL_2027';
  selectedPosition: PositionCode;
  connectionProfile: ConnectionProfile;
  phaseProfile: {
    attackRole: string;
    defenceRole: string;
    attackWeight: number;
    defenceWeight: number;
    phaseBalanceScore: number;
  };
  skillMarginal: Array<{
    name: string;
    category: UnifiedSkillDecision['category'];
    marginalGain: number;
    attackGain: number;
    defenceGain: number;
    delayResilience: number;
    dnaGain: number;
    reason: string;
  }>;
  finalSkills: string[];
  impetoPolicy: {
    slotStatus: 'DISPONIVEL' | 'OCUPADO' | 'SEM_VAGA' | 'NAO_CONFIRMADO';
    current: string | null;
    currentScore: number | null;
    ideal: string | null;
    idealScore: number | null;
    gain: number;
    decision: 'MANTER' | 'ADICIONAR_QUANDO_POSSIVEL' | 'TROCAR_QUANDO_POSSIVEL' | 'SEM_VAGA' | 'CONFIRMAR_ANTES_DE_GASTAR';
    reason: string;
  };
  learning: {
    epoch: 'V6';
    memoryState: 'V6_ATUAL' | 'LEGADO_5X' | 'SEM_DADOS';
    currentMatchWeight: 1;
    legacyMatchWeight: 0.35;
    minimumAbMatchesPerArm: 5;
    recommendation: string;
  };
  guarantees: {
    gerIsNotOptimizationTarget: true;
    networkIsNotModified: true;
    existingImpetoNotAutoReplaced: true;
    onlyOwnedSafeSkills: true;
    attackAndDefenceEvaluated: true;
    v5HistoryDownweighted: true;
  };
  reasons: string[];
  summary: string;
};

export type MetaVivoDefensiveResponsibilityV4080R8 =
  | 'PRESSOR_PRIMARIO'
  | 'FECHADOR_LINHA'
  | 'COBERTURA'
  | 'ANCORA'
  | 'RASTREADOR'
  | 'PROTETOR_AREA'
  | 'SAIDA_TRANSICAO';

export type MetaVivo2027V4080R8Analysis = {
  engineVersion: '40.80-r8-meta-vivo-2027';
  mode: 'META_VIVO_2027';
  selectedPosition: PositionCode;
  attributeMeta: {
    engineVersion: '40.81-r1-attribute-meta-2027';
    positionLabel: string;
    playerPlaystyle: string | null;
    teamPlaystyle: string;
    topPriorities: Array<{ label: string; current: number; targetMin: number; targetIdeal: number; usefulCeiling: number; priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'MANTER' | 'SATURADA'; gap: number; reason: string }>;
    stopSpending: Array<{ label: string; current: number; targetIdeal: number; usefulCeiling: number; priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'MANTER' | 'SATURADA'; reason: string }>;
    dnaRule: string;
    summary: string;
  };
  scores: {
    firstTouch: number;
    commandResponse: number;
    manualDefence: number;
    coverageDiscipline: number;
    transition: number;
    phaseBalance: number;
    delayRobustness: number;
    finalFunctional: number;
    confidence: number;
  };
  phaseRole: {
    attack: string;
    defence: string;
    responsibility: MetaVivoDefensiveResponsibilityV4080R8;
    doublePressRisk: 'BAIXO' | 'MEDIO' | 'ALTO';
    instruction: string;
    secondaryInstruction: string;
    drill: string[];
  };
  skillPortfolio: Array<{
    name: string;
    role: 'IDENTIDADE' | 'ATAQUE' | 'TRANSICAO_DEFESA' | 'ROBUSTEZ' | 'DIFERENCIAL';
    marginalGain: number;
    reason: string;
  }>;
  finalSkills: string[];
  impetoInvestment: {
    decision: RealPerformance2027V4080R7Analysis['impetoPolicy']['decision'];
    current: string | null;
    ideal: string | null;
    gain: number;
    priority: 'NAO_GASTAR' | 'BAIXA' | 'MEDIA' | 'ALTA';
    reason: string;
  };
  catalog: {
    standardAdditionalSkills: number;
    effectiveAdditionalSkills: number;
    recognizedSpecialSkills: number;
    effectiveSpecialSkills: number;
    provisionalSpecialSkills: number;
    offensivePlaystyles: number;
    confirmedDefensivePlaystyles: number;
    teamPlaystyles: number;
    playerDefensiveStyleStatus: 'CONFIRMADO' | 'PROVISORIO' | 'AUSENTE';
  };
  manager: {
    teamStyle: string;
    primaryStyle: string | null;
    secondaryStyle: string | null;
    combinationSlotsSupported: 2;
    observedCombinations: string[];
    status: 'CONFIGURADO' | 'PARCIAL' | 'SEM_DADOS';
  };
  environment: {
    connectionProfile: ConnectionProfile;
    reliabilityWeight: number;
    graphicsPolicy: 'ESTABILIDADE_PRIMEIRO';
    savedGraphicsMode: string;
    targetFps: number;
    stadiumQuality: string;
    diagnosis: string;
  };
  learning: {
    currentEpochWeight: 1;
    legacyWeight: 0.35;
    minimumAbMatchesPerArm: 5;
    poorConnectionMatchesDownweighted: true;
    recommendation: string;
  };
  guarantees: {
    gerIsNotOptimizationTarget: true;
    doesNotClaimToFixNetwork: true;
    unknownSkillsAreNotWeighted: true;
    unknownDefensiveStylesAreNotWeighted: true;
    existingImpetoIsNeverAutoReplaced: true;
    attackAndDefenceAreJointlyEvaluated: true;
    doublePressureGuardEnabled: true;
  };
  reasons: string[];
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
  structuralPrecision?: StructuralPrecisionAnalysis;
  advancedMotorV3750?: AdvancedMotorV3750Analysis;
  powerBuildV3850?: PowerBuildEngineV3850Analysis;
  maxMatchV3860?: MaxMatchPerformanceV3860Analysis;
  supremeV3870?: SupremePerformanceV3870Analysis;
  cardFirstV3880?: CardFirstAiV3880Analysis;
  canonicalCardV3890?: CanonicalCardV3890Analysis;
  globalProV3900?: GlobalProBenchmarkV3900Analysis;
  eliteDominanceV3910?: EliteDominanceV3910Analysis;
  unifiedPerformanceV3920?: UnifiedPerformanceV3920Analysis;
  adaptivePositionV3930?: AdaptivePositionV3930Analysis;
  performanceFunctionV3940?: PerformanceFunctionV3940Analysis;
  adaptiveMaximumV4030?: AdaptiveMaximumV4030Analysis;
  maximumPerformanceV4040?: MaximumPerformanceV4040Analysis;
  gameplayValidationMemoryV4050?: GameplayValidationMemoryV4050;
  longitudinalGameplayMemoryV4060?: LongitudinalGameplayMemoryV4060;
  maximumPerformanceV4080?: MaximumPerformanceV4080Analysis;
  efootballV600?: EfootballV600PerformanceAnalysis;
  realPerformance2027V4080R7?: RealPerformance2027V4080R7Analysis;
  metaVivo2027V4080R8?: MetaVivo2027V4080R8Analysis;
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

