import { LOCAL_CARD_RULES, type LocalCardRule } from './cardDatabase';
import { isImpossibleByCoreStyle } from './positionRules';
import { TRAINING_LABELS, type BuildVariant, type TrainingComparisonItem } from './trainingEngine';

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
  | 'GOALKEEPER';

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
  'Clássico nº 10',
  'Jogador de infiltração',
  'Meia versátil',
  'Primeiro volante',
  'O destruidor',
  'Orquestrador',
  'Defensor criativo',
  'Atacante surpresa',
  'Lateral ofensivo',
  'Lateral defensivo',
  'Lateral atacante',
  'Goleiro ofensivo',
  'Goleiro defensivo',
  'Homem de área',
  'Artilheiro',
  'Puxa marcação',
  'Pivô',
  'Armador criativo',
  'Ala produtivo',
  'Lateral móvel',
  'Perito em cruzamento',
  'Atacante matador'
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

const ALL_POSITIONS = Object.keys(POSITION_PT) as PositionCode[];



function findLocalCardRule(playerName: string, text: string): LocalCardRule | null {
  const haystack = normalize(`${playerName}\n${text}`).toLowerCase();
  return LOCAL_CARD_RULES.find((rule) => rule.match.some((name) => haystack.includes(normalize(name).toLowerCase()))) ?? null;
}

function hasManualConfirmation(text: string) {
  return /CONFIRMA(?:CAO|ÇÃO)\s+MANUAL\s*[:=\-]?\s*SIM/i.test(normalize(text));
}

function hasPositionLock(text: string) {
  return /POSI(?:CAO|ÇÃO)\s+PRINCIPAL\s*[:=\-]/i.test(normalize(text));
}

function hasPlaystyleLock(text: string) {
  return /ESTILO\s+DE\s+JOGO\s*[:=\-]/i.test(normalize(text));
}

function listLabels(codes: PositionCode[]) {
  return codes.map((code) => POSITION_PT[code]).join(', ');
}

const POSITION_ALIASES: Record<PositionCode, string[]> = {
  CF: ['CF', 'CA', 'CENTROAVANTE', 'CENTRE FORWARD', 'CENTER FORWARD', 'STRIKER'],
  SS: ['SS', 'SA', 'SEGUNDO ATACANTE', 'SECOND STRIKER', 'SUPPORT STRIKER'],
  LWF: ['LWF', 'PE', 'PTE', 'PONTA ESQUERDA', 'LEFT WING FORWARD', 'LEFT WINGER'],
  RWF: ['RWF', 'PD', 'PTD', 'PONTA DIREITA', 'RIGHT WING FORWARD', 'RIGHT WINGER'],
  LMF: ['LMF', 'ME', 'MLE', 'MEIA ESQUERDA', 'LEFT MIDFIELDER', 'LEFT MIDFIELD'],
  RMF: ['RMF', 'MD', 'MLD', 'MEIA DIREITA', 'RIGHT MIDFIELDER', 'RIGHT MIDFIELD'],
  AMF: ['AMF', 'MAT', 'MEIA ATACANTE', 'MEIA OFENSIVO', 'ATTACKING MIDFIELDER', 'ATTACKING MIDFIELD'],
  CMF: ['CMF', 'MLG', 'MC', 'MEIA DE LIGACAO', 'MEIA DE LIGAÇÃO', 'MEIA CENTRAL', 'CENTRAL MIDFIELDER', 'CENTRE MIDFIELDER', 'CENTER MIDFIELDER'],
  DMF: ['DMF', 'VOL', 'VOLANTE', 'DEFENSIVE MIDFIELDER', 'DEFENSIVE MIDFIELD'],
  CB: ['CB', 'ZAG', 'ZC', 'ZAGUEIRO', 'CENTRE BACK', 'CENTER BACK', 'CENTRAL BACK'],
  LB: ['LB', 'LE', 'LATERAL ESQUERDO', 'LEFT BACK'],
  RB: ['RB', 'LD', 'LATERAL DIREITO', 'RIGHT BACK'],
  GK: ['GK', 'GO', 'GOL', 'GOLEIRO', 'GOALKEEPER']
};

const POSITION_ALIAS_ENTRIES = Object.entries(POSITION_ALIASES) as Array<[PositionCode, string[]]>;

const SHORT_POSITION_ALIASES: Record<PositionCode, string[]> = {
  CF: ['CF', 'CA'],
  SS: ['SS', 'SA'],
  LWF: ['LWF', 'PE', 'PTE'],
  RWF: ['RWF', 'PD', 'PTD'],
  LMF: ['LMF', 'ME', 'MLE'],
  RMF: ['RMF', 'MD', 'MLD'],
  AMF: ['AMF', 'MAT'],
  CMF: ['CMF', 'MLG', 'MC'],
  DMF: ['DMF', 'VOL'],
  CB: ['CB', 'ZAG', 'ZC'],
  LB: ['LB', 'LE'],
  RB: ['RB', 'LD'],
  GK: ['GK', 'GO', 'GOL']
};

const SHORT_POSITION_ALIAS_ENTRIES = Object.entries(SHORT_POSITION_ALIASES) as Array<[PositionCode, string[]]>;

function shortPositionPattern() {
  return SHORT_POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function positionAliasPattern(aliases: string[]) {
  return aliases.map(escapeRegex).join('|');
}

function attr(overrides: Attributes = {}): Required<Attributes> {
  const base: Required<Attributes> = {
    offensiveAwareness: 68,
    ballControl: 68,
    dribbling: 68,
    tightPossession: 68,
    lowPass: 68,
    loftedPass: 68,
    finishing: 68,
    heading: 68,
    placeKicking: 60,
    curl: 64,
    defensiveAwareness: 50,
    defensiveEngagement: 50,
    tackling: 50,
    aggression: 52,
    goalkeeperAwareness: 40,
    goalkeeperCatching: 40,
    goalkeeperParrying: 40,
    goalkeeperReflexes: 40,
    goalkeeperReach: 40,
    speed: 70,
    acceleration: 70,
    kickingPower: 70,
    jump: 68,
    physicalContact: 68,
    balance: 68,
    stamina: 70
  };
  return { ...base, ...overrides };
}

const BASE_BY_POSITION: Record<PositionCode, Required<Attributes>> = {
  CF: attr({ offensiveAwareness: 86, finishing: 86, heading: 78, kickingPower: 84, speed: 80, acceleration: 78, physicalContact: 78, balance: 74, stamina: 78 }),
  SS: attr({ offensiveAwareness: 84, ballControl: 86, dribbling: 86, tightPossession: 84, finishing: 82, lowPass: 80, speed: 82, acceleration: 84, balance: 84, stamina: 78 }),
  LWF: attr({ offensiveAwareness: 80, ballControl: 84, dribbling: 88, tightPossession: 84, finishing: 78, lowPass: 76, loftedPass: 74, speed: 88, acceleration: 88, curl: 82, balance: 84, stamina: 80 }),
  RWF: attr({ offensiveAwareness: 80, ballControl: 84, dribbling: 88, tightPossession: 84, finishing: 78, lowPass: 76, loftedPass: 74, speed: 88, acceleration: 88, curl: 82, balance: 84, stamina: 80 }),
  LMF: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 72, tackling: 74, lowPass: 78, loftedPass: 82, dribbling: 82, ballControl: 82 }),
  RMF: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 72, tackling: 74, lowPass: 78, loftedPass: 82, dribbling: 82, ballControl: 82 }),
  AMF: attr({ offensiveAwareness: 82, ballControl: 88, dribbling: 84, tightPossession: 88, lowPass: 88, loftedPass: 84, finishing: 76, curl: 82, balance: 82, stamina: 78 }),
  CMF: attr({ ballControl: 82, dribbling: 78, lowPass: 84, loftedPass: 82, defensiveAwareness: 72, tackling: 72, defensiveEngagement: 74, aggression: 74, stamina: 86, physicalContact: 76 }),
  DMF: attr({ ballControl: 78, lowPass: 82, loftedPass: 78, defensiveAwareness: 86, tackling: 86, defensiveEngagement: 86, aggression: 84, physicalContact: 84, stamina: 86 }),
  CB: attr({ defensiveAwareness: 88, tackling: 88, defensiveEngagement: 86, aggression: 84, physicalContact: 88, heading: 84, jump: 84, speed: 72, stamina: 80 }),
  LB: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 76, tackling: 76, lowPass: 76, loftedPass: 80, dribbling: 76 }),
  RB: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 76, tackling: 76, lowPass: 76, loftedPass: 80, dribbling: 76 }),
  GK: attr({ goalkeeperAwareness: 88, goalkeeperCatching: 84, goalkeeperParrying: 84, goalkeeperReflexes: 88, goalkeeperReach: 86, jump: 78, physicalContact: 80 })
};

const ATTRIBUTE_LABELS: Array<[AttributeKey, RegExp[]]> = [
  ['offensiveAwareness', [/talento\s+ofensivo\s*(\d{2,3})/i, /consci[eê]ncia\s+ofensiva\s*(\d{2,3})/i, /offensive\s+awareness\s*(\d{2,3})/i]],
  ['ballControl', [/controle\s+de\s+bola\s*(\d{2,3})/i, /ball\s+control\s*(\d{2,3})/i]],
  ['dribbling', [/(?:^|\s)drible\s*(\d{2,3})/i, /dribbling\s*(\d{2,3})/i]],
  ['tightPossession', [/condu[cç][aã]o\s+firme\s*(\d{2,3})/i, /tight\s+possession\s*(\d{2,3})/i]],
  ['lowPass', [/passe\s+rasteiro\s*(\d{2,3})/i, /low\s+pass\s*(\d{2,3})/i]],
  ['loftedPass', [/passe\s+alto\s*(\d{2,3})/i, /lofted\s+pass\s*(\d{2,3})/i]],
  ['finishing', [/finaliza[cç][aã]o\s*(\d{2,3})/i, /finishing\s*(\d{2,3})/i]],
  ['heading', [/cabe[cç]ada\s*(\d{2,3})/i, /heading\s*(\d{2,3})/i]],
  ['placeKicking', [/cobran[cç]a\s+de\s+bola\s+parada\s*(\d{2,3})/i, /bola\s+parada\s*(\d{2,3})/i, /place\s+kicking\s*(\d{2,3})/i]],
  ['curl', [/curva\s*(\d{2,3})/i, /curl\s*(\d{2,3})/i]],
  ['defensiveAwareness', [/talento\s+defensivo\s*(\d{2,3})/i, /consci[eê]ncia\s+defensiva\s*(\d{2,3})/i, /defensive\s+awareness\s*(\d{2,3})/i]],
  ['defensiveEngagement', [/dedica[cç][aã]o\s+defensiva\s*(\d{2,3})/i, /engajamento\s+defensivo\s*(\d{2,3})/i, /defensive\s+engagement\s*(\d{2,3})/i]],
  ['tackling', [/desarme\s*(\d{2,3})/i, /tackling\s*(\d{2,3})/i]],
  ['aggression', [/agressividade\s*(\d{2,3})/i, /aggression\s*(\d{2,3})/i]],
  ['goalkeeperAwareness', [/talento\s+de\s+go\s*(\d{2,3})/i, /talento\s+de\s+gol\s*(\d{2,3})/i, /goalkeeper\s+awareness\s*(\d{2,3})/i]],
  ['goalkeeperCatching', [/firmeza\s+do\s+go\s*(\d{2,3})/i, /firmeza\s+do\s+gol\s*(\d{2,3})/i, /catching\s*(\d{2,3})/i]],
  ['goalkeeperParrying', [/defesa\s+do\s+go\s*(\d{2,3})/i, /defesa\s+do\s+gol\s*(\d{2,3})/i, /parrying\s*(\d{2,3})/i]],
  ['goalkeeperReflexes', [/reflexos\s+do\s+go\s*(\d{2,3})/i, /reflexos\s+do\s+gol\s*(\d{2,3})/i, /reflexes\s*(\d{2,3})/i]],
  ['goalkeeperReach', [/alcance\s+do\s+go\s*(\d{2,3})/i, /alcance\s+do\s+gol\s*(\d{2,3})/i, /reach\s*(\d{2,3})/i]],
  ['speed', [/velocidade\s*(\d{2,3})/i, /speed\s*(\d{2,3})/i]],
  ['acceleration', [/acelera[cç][aã]o\s*(\d{2,3})/i, /acceleration\s*(\d{2,3})/i]],
  ['kickingPower', [/for[cç]a\s+do\s+chute\s*(\d{2,3})/i, /kicking\s+power\s*(\d{2,3})/i]],
  ['jump', [/salto\s*(\d{2,3})/i, /jump\s*(\d{2,3})/i]],
  ['physicalContact', [/contato\s+f[ií]sico\s*(\d{2,3})/i, /physical\s+contact\s*(\d{2,3})/i]],
  ['balance', [/equil[ií]brio\s*(\d{2,3})/i, /balance\s*(\d{2,3})/i]],
  ['stamina', [/resist[eê]ncia\s*(\d{2,3})/i, /stamina\s*(\d{2,3})/i]]
];

const SKILL_PROFILES: Record<string, { category: string; boosts: Partial<Record<string, number>>; aliases?: string[] }> = {
  'Pedalada simples': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Scissors Feint', 'Pedalada'] },
  'Toque duplo': { category: 'DRIBLE', boosts: { dribbling: 4, mobility: 2 }, aliases: ['Double Touch', 'Toque Duplo'] },
  'Elástico': { category: 'DRIBLE', boosts: { dribbling: 3, mobility: 1 }, aliases: ['Flip Flap', 'Elastico'] },
  'Giro 360°': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Marseille Turn', 'Giro 360'] },
  'Chapéu': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Sombrero', 'Chaleira'] },
  'Corte com virada': { category: 'DRIBLE', boosts: { dribbling: 3, mobility: 1 }, aliases: ['Cut Behind & Turn', 'Corte com virada'] },
  'Puxada de letra': { category: 'DRIBLE', boosts: { dribbling: 2, creation: 1 }, aliases: ['Scotch Move'] },
  'Finta de letra': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Step On Skill Control'] },
  'Controle com a sola': { category: 'DRIBLE', boosts: { dribbling: 4, creation: 1 }, aliases: ['Sole Control', 'Controle com sola', 'Controle de sola'] },
  'Cabeçada': { category: 'FINALIZAÇÃO', boosts: { finishing: 2, aerial: 2 }, aliases: ['Heading'] },
  'Efeito de longe': { category: 'FINALIZAÇÃO', boosts: { finishing: 3, creation: 1 }, aliases: ['Long-Range Curler'] },
  'Controle da cavadinha': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Chip Shot Control'] },
  'Chute com o peito do pé': { category: 'FINALIZAÇÃO', boosts: { finishing: 3 }, aliases: ['Knuckle Shot'] },
  'Folha seca': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Dipping Shot'] },
  'Chute ascendente': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Rising Shot'] },
  'Precisão à distância': { category: 'FINALIZAÇÃO', boosts: { finishing: 3 }, aliases: ['Long-Range Shooting', 'Precisao a distancia', 'Precisão a distância'] },
  'Finalização acrobática': { category: 'FINALIZAÇÃO', boosts: { finishing: 3, mobility: 1 }, aliases: ['Acrobatic Finishing', 'Finaliz. acrobática', 'Finaliz acrobática', 'Finaliz. acrobatica'] },
  'Toque de calcanhar': { category: 'PASSE', boosts: { creation: 2, dribbling: 1 }, aliases: ['Heel Trick'] },
  'Chute de primeira': { category: 'FINALIZAÇÃO', boosts: { finishing: 4 }, aliases: ['First-time Shot', 'First Time Shot'] },
  'Passe de primeira': { category: 'PASSE', boosts: { creation: 4, pressure: 1 }, aliases: ['One-touch Pass', 'One Touch Pass', 'Passe primeira'] },
  'Passe em profundidade': { category: 'PASSE', boosts: { creation: 4 }, aliases: ['Through Passing', 'Passe Profundidade'] },
  'Passe na medida': { category: 'PASSE', boosts: { creation: 3 }, aliases: ['Weighted Pass'] },
  'Cruzamento preciso': { category: 'PASSE', boosts: { creation: 3 }, aliases: ['Pinpoint Crossing'] },
  'Curva para fora': { category: 'PASSE', boosts: { creation: 2, finishing: 1 }, aliases: ['Outside Curler'] },
  'De letra': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['Rabona'] },
  'Passe sem olhar': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['No Look Pass'] },
  'Passe aéreo baixo': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['Low Lofted Pass'] },
  'Arremesso lateral longo': { category: 'PASSE', boosts: { creation: 1 }, aliases: ['Long Throw'] },
  'Especialista em pênalti': { category: 'FINALIZAÇÃO', boosts: { finishing: 1 }, aliases: ['Penalty Specialist'] },
  'Malícia': { category: 'MENTAL', boosts: { pressure: 2 }, aliases: ['Gamesmanship'] },
  'Marcação individual': { category: 'DEFESA', boosts: { defense: 4, pressure: 2 }, aliases: ['Man Marking', 'Marcação ind.', 'Marcacao ind.', 'Marcação indiv.', 'Marcacao indiv.'] },
  'Volta para marcar': { category: 'DEFESA', boosts: { defense: 3, pressure: 4 }, aliases: ['Track Back'] },
  'Interceptação': { category: 'DEFESA', boosts: { defense: 4, pressure: 2 }, aliases: ['Interception'] },
  'Bloqueador': { category: 'DEFESA', boosts: { defense: 4, physical: 1 }, aliases: ['Blocker', 'Bloqueio'] },
  'Superioridade aérea': { category: 'DEFESA', boosts: { aerial: 4, physical: 2 }, aliases: ['Aerial Superiority'] },
  'Carrinho': { category: 'DEFESA', boosts: { defense: 2 }, aliases: ['Sliding Tackle', 'Carrinho preciso'] },
  'Afastamento acrobático': { category: 'DEFESA', boosts: { defense: 2, aerial: 1 }, aliases: ['Acrobatic Clearance'] },
  'Liderança': { category: 'MENTAL', boosts: { stamina: 2, pressure: 2 }, aliases: ['Captaincy'] },
  'Super substituto': { category: 'MENTAL', boosts: { finishing: 2, mobility: 2 }, aliases: ['Super-sub', 'Super Sub'] },
  'Espírito guerreiro': { category: 'MENTAL', boosts: { stamina: 4, pressure: 2 }, aliases: ['Fighting Spirit', 'Espirito guerreiro'] },
  'Pegador de pênalti': { category: 'GOLEIRO', boosts: { goalkeeper: 5, pressure: 2 }, aliases: ['Penalty Saver', 'Defesa de pênalti', 'Pegador de penalti', 'Defesa de penalti'] },
  'Arremesso longo do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 2, creation: 2 }, aliases: ['GK Long Throw', 'Arremesso longo de goleiro'] },
  'Reposição alta do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 3, creation: 2 }, aliases: ['GK High Punt', 'Reposicao alta do goleiro', 'Reposição alta de goleiro'] },
  'Reposição baixa do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 3, creation: 2 }, aliases: ['GK Low Punt', 'Reposicao baixa do goleiro', 'Reposição baixa de goleiro'] },
  'Esticada de Perna': { category: 'ÍMPETO', boosts: { defense: 2, physical: 1 }, aliases: ['Long Legs', 'Esticada da Perna', 'Esticada de perna'] },
  'Sombra veloz': { category: 'ÍMPETO', boosts: { mobility: 2, pressure: 1 }, aliases: ['Speeding Bullet', 'Sombra Veloz'] },
};

export const OFFICIAL_ADDITIONAL_SKILL_NAMES = [
  'Pedalada simples', 'Toque duplo', 'Elástico', 'Giro 360°', 'Chapéu', 'Corte com virada',
  'Puxada de letra', 'Finta de letra', 'Controle com a sola', 'Cabeçada', 'Efeito de longe',
  'Controle da cavadinha', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente',
  'Precisão à distância', 'Finalização acrobática', 'Toque de calcanhar', 'Chute de primeira',
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
  'Curva para fora', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo', 'Arremesso lateral longo',
  'Especialista em pênalti', 'Malícia', 'Marcação individual', 'Volta para marcar', 'Interceptação',
  'Bloqueador', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Liderança',
  'Super substituto', 'Espírito guerreiro', 'Pegador de pênalti', 'Arremesso longo do goleiro',
  'Reposição alta do goleiro', 'Reposição baixa do goleiro'
] as const;

const OFFICIAL_ADDITIONAL_SKILLS = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);

function isOfficialAdditionalSkill(skill: string) {
  return OFFICIAL_ADDITIONAL_SKILLS.has(skill);
}

const SPECIAL_SKILL_NAMES = ['Esticada de Perna', 'Sombra veloz'];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(value: string): string {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cleanLine(line: string) {
  return line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min = 1, max = 110) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampDecimal(value: number, min = 1, max = 110) {
  return Math.max(min, Math.min(max, Number(value.toFixed(1))));
}

function avg(...values: Array<number | undefined>) {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function readNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number(String(match[1]).replace(',', '.'));
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

function textHas(text: string, candidate: string): boolean {
  return normalize(text).toLowerCase().includes(normalize(candidate).toLowerCase());
}

function skillKey(skill: string): string {
  return slug(skill).replace(/-/g, '');
}

function uniqueSkillList(skills: string[]) {
  const map = new Map<string, string>();
  for (const skill of skills) {
    if (SKILL_PROFILES[skill]) map.set(skillKey(skill), skill);
  }
  return Array.from(map.values());
}

function detectPositions(text: string): PositionCode[] {
  const normalized = ` ${normalize(text).toUpperCase()} `;
  const detected: PositionCode[] = [];
  for (const [code, aliases] of POSITION_ALIAS_ENTRIES) {
    const pattern = positionAliasPattern(aliases);
    if (new RegExp(`\\b(${pattern})\\b`, 'i').test(normalized)) detected.push(code);
  }
  return Array.from(new Set(detected));
}


function codeFromPositionToken(token: string): PositionCode | null {
  const value = normalize(token).toUpperCase().replace(/[^A-ZÀ-Ÿ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [code, aliases] of POSITION_ALIAS_ENTRIES) {
    if (aliases.some((alias) => value === normalize(alias).toUpperCase())) return code;
  }
  return null;
}

function extractOcrSection(text: string, label: string): string | null {
  const lines = text.split(/\r?\n/);
  const labelKey = normalize(label).toUpperCase();
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = normalize(lines[index]).toUpperCase();
    if (line.startsWith('###') && line.includes(labelKey)) {
      start = index + 1;
      break;
    }
  }
  if (start < 0) return null;
  const collected: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*###\s+/.test(line)) break;
    collected.push(line);
  }
  const block = collected.join('\n').trim();
  return block.length ? block : null;
}

function identityScope(text: string): string {
  const identity = extractOcrSection(text, 'IDENTIDADE DA CARTA');
  const top = extractOcrSection(text, 'TOPO DA CARTA');
  const firstLines = text.split(/\r?\n/).slice(0, 70).join('\n');
  return [identity, top, firstLines].filter(Boolean).join('\n');
}

function styleText(playstyle?: string | null) {
  return normalize(playstyle ?? '').toLowerCase();
}

function hasAnyPosition(positions: PositionCode[], code: PositionCode) {
  return positions.length === 0 || positions.includes(code);
}

function preferredPositionsByPlaystyle(playstyle?: string | null): PositionCode[] {
  const style = styleText(playstyle);

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|atacante matador|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) return ['CF', 'SS'];
  if (/destruidor|destroyer/.test(style)) return ['DMF', 'CMF', 'CB'];
  if (/primeiro volante|ancora|anchor man/.test(style)) return ['DMF', 'CMF', 'CB'];
  if (/meia versatil|box-to-box|todo campo/.test(style)) return ['CMF', 'DMF', 'AMF', 'LMF', 'RMF'];
  if (/orquestrador|orchestrator/.test(style)) return ['CMF', 'DMF', 'AMF'];
  if (/defensor criativo|construtor|build up/.test(style)) return ['CB', 'DMF', 'CMF'];
  if (/lateral defensivo|defensive full/.test(style)) return ['LB', 'RB', 'CB', 'DMF'];
  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) return ['LB', 'RB', 'LMF', 'RMF'];
  if (/ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento/.test(style)) return ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'];
  if (/armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10/.test(style)) return ['AMF', 'CMF', 'SS'];
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) return ['AMF', 'SS', 'CMF', 'CF'];
  if (/goleiro ofensivo|goleiro defensivo/.test(style)) return ['GK'];
  return [];
}

function midfieldPriority(mainPosition: PositionCode, style: string): PositionCode[] {
  // MLG/VOL/MAT/ME/MD podem vir com vários estilos. O estilo orienta a função, mas a posição da carta continua forte.
  if (/destruidor|destroyer/.test(style)) {
    if (mainPosition === 'CB') return ['CB', 'DMF', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'CB'];
    if (mainPosition === 'AMF') return ['CMF', 'AMF', 'DMF'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'CMF', 'DMF'];
  }
  if (/primeiro volante|ancora|anchor man/.test(style)) {
    if (mainPosition === 'CB') return ['CB', 'DMF', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    return ['DMF', 'CMF', 'CB'];
  }
  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'CMF', 'AMF', 'DMF'];
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'AMF'];
    return ['CMF', 'AMF', 'DMF', 'LMF', 'RMF'];
  }
  if (/orquestrador|orchestrator/.test(style)) {
    if (mainPosition === 'DMF') return ['DMF', 'CMF', 'CB'];
    return ['CMF', 'DMF', 'AMF'];
  }
  if (/armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10/.test(style)) {
    if (mainPosition === 'CMF') return ['CMF', 'AMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'AMF', 'CMF'];
    return ['AMF', 'CMF', 'SS'];
  }
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (mainPosition === 'CMF') return ['CMF', 'AMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, 'AMF', 'CMF'];
    return ['AMF', 'SS', 'CMF', 'CF'];
  }
  return [];
}

function gameplayPriorityByMainPosition(mainPosition: PositionCode, playstyle?: string | null): PositionCode[] {
  const style = styleText(playstyle);

  const midfield = midfieldPriority(mainPosition, style);
  if (midfield.length) return midfield;

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|puxa marcacao|puxa marcação|atacante matador|artilheiro|goal poacher/.test(style)) {
    if (mainPosition === 'SS') return ['SS', 'CF', 'AMF'];
    return ['CF', 'SS'];
  }

  if (/defensor criativo|construtor|build up/.test(style)) {
    if (mainPosition === 'DMF') return ['DMF', 'CB', 'CMF'];
    if (mainPosition === 'CMF') return ['CMF', 'DMF', 'CB'];
    return ['CB', 'DMF', 'CMF'];
  }

  if (/lateral defensivo|defensive full/.test(style)) {
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, 'CB', 'DMF'];
    return [mainPosition, 'DMF', 'CB'];
  }

  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) {
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, mainPosition === 'LB' ? 'LMF' : 'RMF', 'CMF'];
    return [mainPosition, 'LMF', 'RMF', 'LB', 'RB'];
  }

  if (/ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento/.test(style)) {
    if (mainPosition === 'LWF' || mainPosition === 'RWF') return [mainPosition, mainPosition === 'LWF' ? 'LMF' : 'RMF', 'SS'];
    if (mainPosition === 'LMF' || mainPosition === 'RMF') return [mainPosition, mainPosition === 'LMF' ? 'LWF' : 'RWF', mainPosition === 'LMF' ? 'LB' : 'RB'];
    if (mainPosition === 'LB' || mainPosition === 'RB') return [mainPosition, mainPosition === 'LB' ? 'LMF' : 'RMF'];
  }

  if (/goleiro ofensivo|goleiro defensivo/.test(style)) return ['GK'];

  return preferredPositionsByPlaystyle(playstyle);
}

function lockMainPositionByGameplay(candidate: PositionCode, positions: PositionCode[], playstyle?: string | null): PositionCode {
  const preferred = gameplayPriorityByMainPosition(candidate, playstyle);
  if (preferred.includes(candidate)) return candidate;
  for (const code of preferred) {
    if (hasAnyPosition(positions, code)) return code;
  }
  return candidate;
}

function gameplayPositionWeight(position: PositionCode, mainPosition: PositionCode, playstyle?: string | null) {
  const preferred = gameplayPriorityByMainPosition(mainPosition, playstyle);
  const primaryBonus = position === mainPosition ? 135 : 0;
  const preferredIndex = preferred.indexOf(position);
  const functionBonus = preferredIndex >= 0 ? 110 - preferredIndex * 24 : 0;
  const style = styleText(playstyle);

  let penalty = 0;
  const centralPositions: PositionCode[] = ['DMF', 'CMF', 'AMF', 'CB'];
  const widePositions: PositionCode[] = ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'];

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) {
    if ((position === 'LB' || position === 'RB') && mainPosition !== 'LB' && mainPosition !== 'RB') penalty -= 95;
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') penalty -= 95;
  }

  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if ((position === 'LB' || position === 'RB') && mainPosition !== 'LB' && mainPosition !== 'RB') penalty -= 55;
    if (position === 'CF' || position === 'GK') penalty -= 90;
  }

  if (/orquestrador|armador criativo|criador de jogadas|classico n[oº]?\s*10/.test(style)) {
    if (position === 'LB' || position === 'RB' || position === 'CB' || position === 'GK') penalty -= 70;
    if (position === 'CF' && mainPosition !== 'CF') penalty -= 55;
  }

  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (position === 'LB' || position === 'RB' || position === 'CB' || position === 'GK') penalty -= 80;
  }

  if (/homem de area|fox in the box|pivo|atacante pivo|target man|atacante matador|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) {
    if (widePositions.includes(position) && mainPosition !== 'LWF' && mainPosition !== 'RWF') penalty -= 65;
    if (['LB', 'RB', 'CB', 'DMF', 'GK'].includes(position)) penalty -= 90;
  }

  if (/lateral ofensivo|lateral defensivo|lateral atacante|ala produtivo|lateral movel|perito em cruzamento/.test(style)) {
    if (centralPositions.includes(position) && mainPosition !== 'CMF' && mainPosition !== 'DMF') penalty -= 35;
    if (position === 'CF' || position === 'GK') penalty -= 85;
  }

  return primaryBonus + functionBonus + penalty;
}

function detectExplicitMainPosition(text: string): PositionCode | null {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const tokenGroup = POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');
  const patterns = [
    new RegExp(`(?:posi[cç][aã]o\\s+principal|posição\\s+principal|main\\s*position|primary\\s*position|posicao)\\s*[:=\\-]?\\s*(${tokenGroup})\\b`, 'i'),
    new RegExp(`(?:overall|ovr)\\s*[:=\\-]?\\s*\\d{2,3}\\s*(${tokenGroup})\\b`, 'i')
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      const code = codeFromPositionToken(match[1]);
      if (code) return code;
    }
  }
  return null;
}


function detectCardBadgePosition(text: string): PositionCode | null {
  const lines = normalize(text)
    .toUpperCase()
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 60);

  const shortPattern = shortPositionPattern();
  const isPurePosition = (line: string) => {
    const direct = line.match(new RegExp(`^(${shortPattern})$`, 'i'));
    return direct?.[1] ? codeFromPositionToken(direct[1]) : null;
  };

  // Regra mais confiável para o card: overall grande e sigla da posição logo abaixo/acima.
  // Ex.: "104" + "CB" ou "107 AMF" no recorte da carta.
  for (let index = 0; index < Math.min(lines.length, 28); index += 1) {
    const line = lines[index];
    const numberMatch = line.match(/\b(8\d|9\d|10\d|11\d)\b/);
    const sameLineAfter = line.match(new RegExp(`\\b(8\\d|9\\d|10\\d|11\\d)\\s*(${shortPattern})\\b`, 'i'));
    if (sameLineAfter?.[2]) {
      const code = codeFromPositionToken(sameLineAfter[2]);
      if (code) return code;
    }
    const sameLineBefore = line.match(new RegExp(`\\b(${shortPattern})\\s*(8\\d|9\\d|10\\d|11\\d)\\b`, 'i'));
    if (sameLineBefore?.[1]) {
      const code = codeFromPositionToken(sameLineBefore[1]);
      if (code) return code;
    }

    if (numberMatch) {
      for (let offset = 1; offset <= 6; offset += 1) {
        const below = lines[index + offset];
        if (!below) continue;
        const code = isPurePosition(below);
        if (code) return code;
      }
      for (let offset = 1; offset <= 3; offset += 1) {
        const above = lines[index - offset];
        if (!above) continue;
        const code = isPurePosition(above);
        if (code) return code;
      }
    }
  }

  // Fallback: primeira sigla curta isolada no recorte de identidade. Não usa nomes longos
  // para evitar confundir "Atacante surpresa" ou menus com posição.
  for (const line of lines.slice(0, 28)) {
    const code = isPurePosition(line);
    if (code) return code;
  }

  return null;
}

function detectPrimaryPositionFromTop(text: string): PositionCode | null {
  const lines = normalize(text).toUpperCase().split(/\r?\n/).map(cleanLine).filter(Boolean).slice(0, 40);
  const positionAliases = POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');

  // Formato comum da carta recortada: overall grande e posição logo abaixo. Ex.: "104" na linha anterior e "CA" na linha atual.
  for (let index = 1; index < lines.length; index += 1) {
    const previousNumber = lines[index - 1].match(/\b(8\d|9\d|10\d|11\d)\b/);
    const currentPosition = lines[index].match(new RegExp(`^(${positionAliases})$`, 'i'));
    if (previousNumber && currentPosition) {
      const code = codeFromPositionToken(currentPosition[1]);
      if (code) return code;
    }
  }

  // Formato em uma linha só. Em grades como "CA 102 PE 100", a primeira posição da linha é a principal.
  for (const line of lines.slice(0, 25)) {
    const leadingPositionThenNumber = line.match(new RegExp(`^(${positionAliases})\\s*(8\\d|9\\d|10\\d|11\\d)\\b`, 'i'));
    if (leadingPositionThenNumber) {
      const code = codeFromPositionToken(leadingPositionThenNumber[1]);
      if (code) return code;
    }

    const leadingNumberThenPosition = line.match(new RegExp(`^(8\\d|9\\d|10\\d|11\\d)\\s*(${positionAliases})\\b`, 'i'));
    if (leadingNumberThenPosition) {
      const code = codeFromPositionToken(leadingNumberThenPosition[2]);
      if (code) return code;
    }
  }

  return null;
}

function detectPositionRatings(text: string): PositionRatings {
  const ratings: PositionRatings = {};
  const normalized = normalize(text).toUpperCase();
  const lines = normalized.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const setRating = (code: PositionCode, value: number) => {
    if (value >= 40 && value <= 110 && ratings[code] === undefined) ratings[code] = value;
  };

  const ptMap = POSITION_ALIAS_ENTRIES;

  // 1) Leitura clássica: CA 101, CF 101, VOL 97 etc.
  for (const [code, aliases] of ptMap) {
    for (const alias of aliases) {
      const escaped = escapeRegex(alias);
      const match = normalized.match(new RegExp(`\\b${escaped}\\s*[:\\-]?\\s*(\\d{2,3})\\b`, 'i'));
      if (match?.[1]) setRating(code, Number(match[1]));
    }
  }

  // 2) Leitura quando o OCR separa posição e número em linhas diferentes.
  // Exemplo: linha "CA" e na linha seguinte "101".
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const [code, aliases] of ptMap) {
      if (ratings[code] !== undefined) continue;
      const hasPosition = aliases.some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').test(line));
      if (!hasPosition) continue;
      const nearby = [line, lines[index + 1] ?? '', lines[index + 2] ?? ''].join(' ');
      const number = nearby.match(/\b(\d{2,3})\b/);
      if (number?.[1]) setRating(code, Number(number[1]));
    }
  }

  // 3) Leitura de grades em duas linhas: uma linha com posições, outra com números.
  for (let index = 0; index < lines.length - 1; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];
    const positionTokens: PositionCode[] = [];
    for (const [code, aliases] of ptMap) {
      if (aliases.some((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').test(current))) {
        positionTokens.push(code);
      }
    }
    const numbers = [...next.matchAll(/\b(\d{2,3})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 40 && value <= 110);
    if (positionTokens.length >= 2 && numbers.length >= 2) {
      positionTokens.slice(0, numbers.length).forEach((code, posIndex) => setRating(code, numbers[posIndex]));
    }
  }

  return ratings;
}

function detectCardType(text: string) {
  const normalized = normalize(text).toLowerCase();
  if (/show\s*time/.test(normalized)) return 'Show Time';
  if (/big\s*time/.test(normalized)) return 'Big Time';
  if (/epic|epico/.test(normalized)) return 'Epic';
  if (/potw|player\s+of\s+the\s+week/.test(normalized)) return 'POTW';
  if (/featured|destaque/.test(normalized)) return 'Featured';
  if (/legend|lenda/.test(normalized)) return 'Legend';
  if (/highlight/.test(normalized)) return 'Highlight';
  if (/standard|padrao|padrão/.test(normalized)) return 'Standard';
  return 'Carta analisada';
}

function detectSpecialTag(text: string) {
  const tags = ['Blitz Curler', 'Momentum Dribbling', 'Phenomenal Finishing', 'Phenomenal Pass', 'Game-changing Pass', 'Fortress', 'Edged Crossing', 'Bullet Header', 'Duelo', 'Sem Impulso'];
  return tags.find((tag) => textHas(text, tag)) ?? null;
}

const PLAYSTYLE_PATTERNS: Array<[RegExp, string]> = [
  [/classico\s*n[oº]?\s*10|classic\s*no\.?\s*10/i, 'Clássico nº 10'],
  [/jogador\s+de\s+infiltra[cç][aã]o|jogador\s+sem\s+bola|hole\s+player/i, 'Jogador de infiltração'],
  [/meia\s+vers[aá]til|box\s*to\s*box|todo\s+campo/i, 'Meia versátil'],
  [/primeiro\s+volante|(?:^|\s)(ancora|âncora|anchor\s+man)(?:\s|$)/i, 'Primeiro volante'],
  [/destruidor|destroyer/i, 'O destruidor'],
  [/orquestrador|orchestrator/i, 'Orquestrador'],
  [/defensor\s+criativo|construtor|build\s+up/i, 'Defensor criativo'],
  [/atacante\s+surpresa|extra\s+frontman/i, 'Atacante surpresa'],
  [/lateral\s+ofensivo|offensive\s+full/i, 'Lateral ofensivo'],
  [/lateral\s+defensivo|defensive\s+full/i, 'Lateral defensivo'],
  [/lateral\s+atacante|full\s*back\s*finisher/i, 'Lateral atacante'],
  [/goleiro\s+ofensivo|offensive\s+goalkeeper/i, 'Goleiro ofensivo'],
  [/goleiro\s+defensivo|defensive\s+goalkeeper/i, 'Goleiro defensivo'],
  [/homem\s+de\s+[aá]rea|fox\s+in\s+the\s+box/i, 'Homem de área'],
  [/artilheiro|goal\s+poacher/i, 'Artilheiro'],
  [/puxa\s+marca[cç][aã]o|deep\s+lying\s+forward/i, 'Puxa marcação'],
  [/atacante\s+piv[oô]|piv[oô]|target\s+man/i, 'Pivô'],
  [/armador\s+criativo|criador\s+de\s+jogadas|creative\s+playmaker/i, 'Armador criativo'],
  [/ala\s+produtivo|ponta\s+prol[ií]fico|prolific\s+winger/i, 'Ala produtivo'],
  [/lateral\s+m[oó]vel|flanco\s+m[oó]vel|roaming\s+flank/i, 'Lateral móvel'],
  [/perito\s+em\s+cruzamento|cross\s+specialist/i, 'Perito em cruzamento'],
  [/atacante\s+matador/i, 'Atacante matador']
];

function findPlaystyleInText(text: string): string | null {
  const normalizedText = normalize(text);
  const found = PLAYSTYLE_PATTERNS.find(([regex]) => regex.test(normalizedText));
  return found?.[1] ?? null;
}


function findPlaystylesInText(text: string): string[] {
  const normalizedText = normalize(text);
  const found: string[] = [];
  for (const [regex, label] of PLAYSTYLE_PATTERNS) {
    if (regex.test(normalizedText) && !found.includes(label)) found.push(label);
  }
  return found;
}

function playstyleFitsPosition(playstyle: string | null | undefined, position: PositionCode): boolean {
  const style = styleText(playstyle);
  if (!style) return true;

  const isGoalkeeper = /goleiro/.test(style);
  const isCentralDefender = /destruidor|defensor criativo|construtor|build up|atacante surpresa|extra frontman/.test(style);
  const isDefensiveMid = /destruidor|primeiro volante|ancora|anchor man|orquestrador|meia versatil|box-to-box|todo campo/.test(style);
  const isCreator = /armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10|orquestrador|jogador de infiltracao|hole player/.test(style);
  const isForward = /homem de area|artilheiro|pivo|atacante pivo|target man|puxa marcacao|puxa marcação|atacante matador|goal poacher|fox in the box/.test(style);
  const isWide = /ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento|cross specialist/.test(style);
  const isFullback = /lateral ofensivo|lateral defensivo|lateral atacante|offensive full|defensive full|full\s*back/.test(style);

  if (position === 'GK') return isGoalkeeper;
  if (isGoalkeeper) return false;

  if (position === 'CB') return isCentralDefender || /primeiro volante|ancora|anchor man/.test(style);
  if (position === 'DMF') return isDefensiveMid || isCentralDefender;
  if (position === 'CMF') return isDefensiveMid || isCreator || /jogador de infiltracao|hole player/.test(style);
  if (position === 'AMF') return isCreator || /jogador de infiltracao|hole player|meia versatil|box-to-box/.test(style);
  if (position === 'CF' || position === 'SS') return isForward || isCreator || /jogador de infiltracao|hole player/.test(style);
  if (position === 'LWF' || position === 'RWF') return isWide || isForward || /jogador de infiltracao|hole player/.test(style);
  if (position === 'LMF' || position === 'RMF') return isWide || isFullback || /meia versatil|box-to-box|jogador de infiltracao|hole player/.test(style);
  if (position === 'LB' || position === 'RB') return isFullback || /destruidor|defensor criativo|construtor|perito em cruzamento|cross specialist/.test(style);

  return true;
}

function resolvePlaystyleForCard(rawPlaystyle: string | null, mainPosition: PositionCode, searchText: string): string | null {
  if (rawPlaystyle && playstyleFitsPosition(rawPlaystyle, mainPosition)) return rawPlaystyle;

  const candidates = findPlaystylesInText(searchText);
  const fitted = candidates.find((candidate) => playstyleFitsPosition(candidate, mainPosition));
  if (fitted) return fitted;

  // Quando a leitura local só encontrou um estilo incompatível com a posição principal
  // (ex.: ZAG lido como "Lateral defensivo" por ruído de OCR), é mais seguro não exibir
  // estilo do que trocar a identidade da carta por uma informação errada.
  return null;
}

function detectPlaystyle(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const topLines = lines.slice(0, 28);
  const attributeOrMenuLine = /talento|controle|drible|passe|finaliza|cabe[cç]ada|velocidade|acelera|for[cç]a|salto|contato|equil|resist|habilidades|modelo|impetos|aumenta os atributos|qualificado|posi[cç][aã]o alvo|objetivo/i;

  // Primeiro procura no topo da carta, porque o estilo verdadeiro fica logo abaixo do nome.
  // Isso evita que textos auxiliares/listas do app sejam confundidos como estilo do jogador.
  for (const line of topLines) {
    if (attributeOrMenuLine.test(line)) continue;
    const direct = findPlaystyleInText(line);
    if (direct) return direct;
  }

  // Depois tenta uma janela um pouco maior, ainda antes da zona de atributos.
  const topBlock = topLines.join('\n');
  const fromTop = findPlaystyleInText(topBlock);
  if (fromTop) return fromTop;

  // Não procura no texto inteiro para não confundir menu/lista/recomendação com o estilo real da carta.
  return null;
}

function detectName(rawText: string, fileName?: string | null) {
  const ignored = /^(show time|big time|epic|potw|featured|legend|standard|arilheiro|artilheiro|destruidor|criador|altura|peso|idade|nivel|nível|talento|controle|drible|passe|finaliza|cabe[cç]ada|velocidade|acelera|for[cç]a|salto|contato|equil[ií]brio|resist[eê]ncia|habilidades|skills|modelo|jogador|ca|cf|sa|ss|pd|pe|mat|amf|cmf|dmf|cb|gk|gol)$/i;
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => line.length <= 46)
    .filter((line) => /[A-Za-zÀ-ÿ]/.test(line))
    .filter((line) => !/\d{2,3}/.test(line))
    .filter((line) => !ignored.test(line));
  const strongName = lines.find((line) => /^[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+){1,3}$/.test(line));
  if (strongName) return strongName;
  const explicit = rawText.match(/(?:jogador|player|nome)\s*[:\-]\s*([A-Za-zÀ-ÿ.'\-\s]{3,50})/i)?.[1]?.trim();
  if (explicit) return explicit;
  if (lines[0]) return lines[0];
  if (fileName) return cleanLine(fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
  return 'Jogador não identificado';
}

function parseAttributes(text: string): Attributes {
  const attributes: Attributes = {};
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  for (const [key, patterns] of ATTRIBUTE_LABELS) {
    const value = readNumber(compact, patterns);
    if (value !== null && value >= 1 && value <= 110) attributes[key] = value;
  }
  return attributes;
}

function detectSkills(text: string) {
  const found: string[] = [];
  for (const [skill, profile] of Object.entries(SKILL_PROFILES)) {
    const candidates = [skill, ...(profile.aliases ?? [])];
    if (candidates.some((candidate) => textHas(text, candidate))) found.push(skill);
  }
  return Array.from(new Set(found));
}

function parseImpetos(text: string): Impetus[] {
  const impetos: Impetus[] = [];
  const normalized = normalize(text);
  const patterns = [
    /(duelo|instinto\s+artilheiro|velocidade|finaliza[cç][aã]o|passe|drible|defesa|f[ií]sico|agilidade|for[cç]a|chute)\s*\+\s*(\d+)/i
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) impetos.push({ name: cleanLine(match[1]), value: match[2] ? Number(match[2]) : null, active: true });
  }
  if (/sem\s+impulso|sem\s+impeto|sem\s+ímpeto/i.test(normalized)) impetos.push({ name: 'Sem Impulso', value: null, active: false });

  for (const name of IMPETO_NAMES) {
    if (textHas(text, name)) impetos.push({ name, value: null, active: true });
  }

  return Array.from(new Map(impetos.map((item) => [`${skillKey(item.name)}-${item.value ?? ''}`, item])).values());
}

function parseCondition(text: string): PlayerCondition {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const weakFreq = compact.match(/pior\s+p[eé]\s*\(?frequ[eê]ncia\)?\s*(raramente|ocasionalmente|frequentemente|muito\s+frequentemente|baixo|m[eé]dio|alto|alta)/i)?.[1] ?? null;
  const weakAcc = compact.match(/pior\s+p[eé]\s*\(?precis[aã]o\)?\s*(baixa|m[eé]dia|alta|muito\s+alta)/i)?.[1] ?? null;
  const form = compact.match(/condi[cç][aã]o\s+f[ií]sica\s*(est[aá]vel|inconsistente|normal|alta|baixo|m[eé]dio)/i)?.[1] ?? null;
  const injury = compact.match(/resist[eê]ncia\s+a\s+les[aã]o\s*(baixo|baixa|m[eé]dio|m[eé]dia|alto|alta)/i)?.[1] ?? null;
  return {
    weakFootFrequency: weakFreq ? cleanLine(weakFreq) : null,
    weakFootAccuracy: weakAcc ? cleanLine(weakAcc) : null,
    form: form ? cleanLine(form) : null,
    injuryResistance: injury ? cleanLine(injury) : null
  };
}

function parsePhysicalProfile(text: string): PhysicalProfile {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  return {
    armLength: readNumber(compact, [/comprimento\s+do\s+bra[cç]o\s*(\d+(?:[,.]\d+)?)/i]),
    shoulderWidth: readNumber(compact, [/largura\s+dos\s+ombros\s*(\d+(?:[,.]\d+)?)/i]),
    neckLength: readNumber(compact, [/comprimento\s+do\s+pesco[cç]o\s*(\d+(?:[,.]\d+)?)/i]),
    chest: readNumber(compact, [/chest\s*(\d+(?:[,.]\d+)?)/i, /peito\s*(\d+(?:[,.]\d+)?)/i]),
    neckSize: readNumber(compact, [/tamanho\s+do\s+pesco[cç]o\s*(\d+(?:[,.]\d+)?)/i]),
    shoulderHeight: readNumber(compact, [/altura\s+do\s+ombro\s*(\d+(?:[,.]\d+)?)/i]),
    legLength: readNumber(compact, [/comprimento\s+da\s+perna\s*(\d+(?:[,.]\d+)?)/i]),
    thighSize: readNumber(compact, [/tamanho\s+da\s+coxa\s*(\d+(?:[,.]\d+)?)/i]),
    waistSize: readNumber(compact, [/tamanho\s+da\s+cintura\s*(\d+(?:[,.]\d+)?)/i]),
    armSize: readNumber(compact, [/tamanho\s+do\s+bra[cç]o\s*(\d+(?:[,.]\d+)?)/i]),
    calfSize: readNumber(compact, [/tamanho\s+da\s+panturrilha\s*(\d+(?:[,.]\d+)?)/i]),
    legCoverageRadius: readNumber(compact, [/raio\s+de\s+cobertura\s+das\s+pernas\s*(\d+(?:[,.]\d+)?)/i]),
    armCoverageRadius: readNumber(compact, [/raio\s+de\s+cobertura\s+dos\s+bra[cç]os\s*(\d+(?:[,.]\d+)?)/i]),
    jumpHeight: readNumber(compact, [/altura\s+de\s+salto\s*(\d+(?:[,.]\d+)?)/i]),
    trunkCollision: readNumber(compact, [/colis[aã]o\s+do\s+tronco\s*(\d+(?:[,.]\d+)?)/i]),
    baseHeight: readNumber(compact, [/altura\s+com\s+base\s+no\s+comprimento\S*\s*(\d+(?:[,.]\d+)?)/i])
  };
}

function fillAttributes(parsed: Pick<ParsedCard, 'mainPosition' | 'maxOverall' | 'overall' | 'attributes'>): Required<Attributes> {
  const target = parsed.maxOverall ?? parsed.overall ?? 90;
  const base = BASE_BY_POSITION[parsed.mainPosition];
  const readCount = Object.keys(parsed.attributes ?? {}).length;

  // GER não pode mandar na ficha. Ele só corrige levemente a base quando o OCR
  // leu poucos atributos; atributos reais lidos sempre têm prioridade total.
  const overallDeltaLimit = readCount >= 10 ? 2 : 5;
  const delta = Math.max(-3, Math.min(overallDeltaLimit, (target - 90) * 0.45));
  const scaled = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, clamp(Number(value) + delta)])) as Required<Attributes>;
  return { ...scaled, ...parsed.attributes } as Required<Attributes>;
}

function applySkillBoosts(scores: Record<string, number>, skills: string[]) {
  const boosted = { ...scores };
  for (const skill of skills) {
    const boosts = SKILL_PROFILES[skill]?.boosts ?? {};
    for (const [key, value] of Object.entries(boosts)) {
      boosted[key] = clampDecimal((boosted[key] ?? 0) + Number(value), 1, 110);
    }
  }
  return boosted;
}


function playstylePositionBonus(position: PositionCode, playstyle?: string | null) {
  const style = normalize(playstyle ?? '').toLowerCase();
  if (!style) return 0;

  // O motor local não pode jogar um centroavante de área para PE só porque o OCR confundiu a grade.
  if (/homem de area|atacante matador|pivo|target man|fox/.test(style)) {
    if (position === 'CF') return 26;
    if (position === 'SS') return 10;
    if (position === 'LWF' || position === 'RWF' || position === 'LMF' || position === 'RMF') return -20;
    return -8;
  }

  if (/artilheiro|goal poacher/.test(style)) {
    if (position === 'CF') return 18;
    if (position === 'SS') return 8;
    if (position === 'LWF' || position === 'RWF') return -8;
  }

  if (/ponta prolifico|flanco movel|roaming flank|prolific winger/.test(style)) {
    if (position === 'LWF' || position === 'RWF') return 18;
    if (position === 'LMF' || position === 'RMF') return 10;
    if (position === 'CF') return -8;
  }

  if (/criador de jogadas|jogador sem bola|creative|hole player/.test(style)) {
    if (position === 'AMF' || position === 'SS') return 16;
    if (position === 'CMF') return 8;
  }

  if (/orquestrador|ancora|anchor|box-to-box|todo campo/.test(style)) {
    if (position === 'CMF' || position === 'DMF') return 16;
    if (position === 'AMF') return 5;
  }

  if (/destruidor|destroyer/.test(style)) {
    if (position === 'DMF') return 22;
    if (position === 'CMF') return 22;
    if (position === 'CB') return 12;
    if (position === 'LB' || position === 'RB') return -10;
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') return -20;
  }

  if (/construtor|build up/.test(style)) {
    if (position === 'CB') return 18;
    if (position === 'DMF') return 8;
  }

  if (/lateral ofensivo|lateral defensivo|full/.test(style)) {
    if (position === 'LB' || position === 'RB') return 18;
    if (position === 'LMF' || position === 'RMF') return 6;
  }

  return 0;
}

function preferredPositionFromPlaystyle(playstyle: string | null | undefined, ratings: PositionRatings, attributes: Attributes): PositionCode | null {
  const style = normalize(playstyle ?? '').toLowerCase();
  const hasGoodRating = (code: PositionCode) => Number(ratings[code] ?? 0) >= 75;
  const rating = (code: PositionCode) => Number(ratings[code] ?? 0);

  // Esta função só é usada quando o OCR não conseguiu ler claramente a posição grande da carta.
  // Por isso ela prefere FUNÇÃO REAL antes do maior overall da grade. Ex.: Gattuso/Tchouaméni
  // podem ter CB/LE com nota maior, mas DMF/VOL continua sendo a função principal de gameplay.
  if (/homem de area|atacante matador|pivo|target man|fox|artilheiro|goal poacher|puxa marcacao|puxa marcação/.test(style)) return 'CF';

  if (/destruidor|destroyer/.test(style)) {
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('CB')) return 'CB';
    return 'DMF';
  }

  if (/primeiro volante|ancora|anchor/.test(style)) {
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('CB')) return 'CB';
    return 'DMF';
  }

  if (/meia versatil|box-to-box|todo campo/.test(style)) {
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('DMF')) return 'DMF';
    if (hasGoodRating('AMF')) return 'AMF';
    return 'CMF';
  }

  if (/orquestrador|orchestrator/.test(style)) {
    if (hasGoodRating('DMF') && rating('DMF') >= rating('CMF') - 3) return 'DMF';
    if (hasGoodRating('CMF')) return 'CMF';
    if (hasGoodRating('AMF')) return 'AMF';
    return 'CMF';
  }

  if (/armador criativo|criador de jogadas|creative|classico n[oº]?\s*10/.test(style)) {
    if (hasGoodRating('AMF')) return 'AMF';
    if (hasGoodRating('SS')) return 'SS';
    if (hasGoodRating('CMF')) return 'CMF';
    return 'AMF';
  }

  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) {
    if (hasGoodRating('AMF')) return 'AMF';
    if (hasGoodRating('SS')) return 'SS';
    if (hasGoodRating('CMF')) return 'CMF';
    return 'AMF';
  }

  if (/ala produtivo|lateral movel|ponta prolifico|flanco movel|roaming flank|prolific winger/.test(style)) {
    if (hasGoodRating('RWF') && rating('RWF') >= rating('LWF')) return 'RWF';
    if (hasGoodRating('LWF')) return 'LWF';
    if (hasGoodRating('RMF') && rating('RMF') >= rating('LMF')) return 'RMF';
    if (hasGoodRating('LMF')) return 'LMF';
    return 'RWF';
  }

  if (/perito em cruzamento|cross specialist/.test(style)) {
    if (hasGoodRating('RMF') && rating('RMF') >= rating('LMF')) return 'RMF';
    if (hasGoodRating('LMF')) return 'LMF';
    if (hasGoodRating('RWF') && rating('RWF') >= rating('LWF')) return 'RWF';
    if (hasGoodRating('LWF')) return 'LWF';
    return 'RMF';
  }

  if (/lateral ofensivo|lateral atacante|offensive full|full\s*back\s*finisher/.test(style)) return hasGoodRating('RB') && rating('RB') >= rating('LB') ? 'RB' : 'LB';
  if (/lateral defensivo|defensive full/.test(style)) return hasGoodRating('RB') && rating('RB') >= rating('LB') ? 'RB' : 'LB';
  if (/goleiro/.test(style)) return 'GK';
  if ((attributes.finishing ?? 0) >= 82 && (attributes.defensiveAwareness ?? 0) < 70) return 'CF';
  return null;
}

function positionScore(position: PositionCode, a: Required<Attributes>, skills: string[], positionRatings: PositionRatings) {
  const skillBonus = (names: string[]) => names.reduce((sum, skill) => sum + (skills.includes(skill) ? 1.5 : 0), 0);
  const scores: Record<PositionCode, number> = {
    CF: avg(a.offensiveAwareness, a.finishing, a.kickingPower, a.heading, a.physicalContact, a.speed) + skillBonus(['Chute de primeira', 'Precisão à distância', 'Cabeçada', 'Superioridade aérea', 'Finalização acrobática']),
    SS: avg(a.offensiveAwareness, a.ballControl, a.dribbling, a.tightPossession, a.finishing, a.acceleration, a.balance, a.lowPass) + skillBonus(['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Chute de primeira']),
    LWF: avg(a.speed, a.acceleration, a.dribbling, a.ballControl, a.tightPossession, a.curl, a.finishing, a.balance) + skillBonus(['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso']),
    RWF: avg(a.speed, a.acceleration, a.dribbling, a.ballControl, a.tightPossession, a.curl, a.finishing, a.balance) + skillBonus(['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso']),
    LMF: avg(a.speed, a.acceleration, a.stamina, a.dribbling, a.loftedPass, a.lowPass, a.defensiveAwareness) + skillBonus(['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar']),
    RMF: avg(a.speed, a.acceleration, a.stamina, a.dribbling, a.loftedPass, a.lowPass, a.defensiveAwareness) + skillBonus(['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar']),
    AMF: avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession, a.dribbling, a.offensiveAwareness, a.curl) + skillBonus(['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar']),
    CMF: avg(a.lowPass, a.loftedPass, a.ballControl, a.stamina, a.defensiveAwareness, a.tackling, a.physicalContact) + skillBonus(['Passe de primeira', 'Interceptação', 'Espírito guerreiro']),
    DMF: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact, a.stamina, a.lowPass) + skillBonus(['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar']),
    CB: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.physicalContact, a.heading, a.jump, a.aggression) + skillBonus(['Bloqueador', 'Interceptação', 'Superioridade aérea', 'Marcação individual']),
    LB: avg(a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.tackling, a.loftedPass, a.dribbling) + skillBonus(['Cruzamento preciso', 'Interceptação', 'Volta para marcar']),
    RB: avg(a.speed, a.acceleration, a.stamina, a.defensiveAwareness, a.tackling, a.loftedPass, a.dribbling) + skillBonus(['Cruzamento preciso', 'Interceptação', 'Volta para marcar']),
    GK: avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach, a.jump) + skillBonus(['Liderança', 'Espírito guerreiro'])
  };
  const cardRating = positionRatings[position];
  // GER por posição é apenas desempate leve. O ranking principal vem de atributos + função.
  const ratingBlend = cardRating ? (scores[position] * 0.88 + cardRating * 0.12) : scores[position];
  return clampDecimal(ratingBlend, 1, 100);
}

function roleName(position: PositionCode, a: Required<Attributes>) {
  if (position === 'CF') return a.heading >= 80 && a.physicalContact >= 78 ? 'finalizador de área' : 'atacante móvel';
  if (position === 'SS') return a.lowPass >= 80 ? 'segundo atacante criativo' : 'segundo atacante agressivo';
  if (position === 'AMF') return 'armador ofensivo';
  if (position === 'CMF') return a.defensiveAwareness >= 75 ? 'meia box-to-box' : 'meia de distribuição';
  if (position === 'DMF') return a.tackling >= 80 ? 'volante destruidor' : 'volante construtor';
  if (position === 'CB') return a.speed >= 78 ? 'zagueiro de cobertura' : 'zagueiro físico';
  if (position === 'LB' || position === 'RB') return a.loftedPass >= 80 ? 'lateral de apoio' : 'lateral marcador';
  if (position === 'LMF' || position === 'RMF') return 'meia lateral intenso';
  if (position === 'LWF' || position === 'RWF') return a.finishing >= 80 ? 'ponta finalizador' : 'ponta criador';
  return 'goleiro';
}

function calculatePri(position: PositionCode, a: Required<Attributes>, skills: string[]) {
  const scores = {
    finishing: avg(a.finishing, a.offensiveAwareness, a.kickingPower, a.heading, a.curl),
    creation: avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession, a.curl),
    dribbling: avg(a.dribbling, a.ballControl, a.tightPossession, a.balance),
    mobility: avg(a.speed, a.acceleration, a.balance, a.stamina),
    pressure: avg(a.stamina, a.aggression, a.defensiveEngagement, a.speed),
    defense: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact),
    physical: avg(a.physicalContact, a.jump, a.balance, a.stamina),
    stamina: a.stamina,
    aerial: avg(a.heading, a.jump, a.physicalContact)
  };
  const boosted = applySkillBoosts(scores, skills);
  const weights: Record<PositionCode, Record<string, number>> = {
    CF: { finishing: 2, aerial: 1.15, physical: 1, mobility: .8, creation: .45 },
    SS: { finishing: 1.2, creation: 1.1, dribbling: 1.25, mobility: 1 },
    LWF: { dribbling: 1.3, mobility: 1.25, finishing: .95, creation: .85 },
    RWF: { dribbling: 1.3, mobility: 1.25, finishing: .95, creation: .85 },
    LMF: { mobility: 1.15, creation: 1.05, pressure: 1, defense: .8, stamina: 1 },
    RMF: { mobility: 1.15, creation: 1.05, pressure: 1, defense: .8, stamina: 1 },
    AMF: { creation: 1.7, dribbling: 1.15, finishing: .8, mobility: .75 },
    CMF: { creation: 1.05, defense: 1.0, pressure: 1, stamina: 1.2, physical: .75 },
    DMF: { defense: 1.8, pressure: 1.25, physical: 1, creation: .6, stamina: 1 },
    CB: { defense: 2, physical: 1.1, aerial: 1, mobility: .55, pressure: .8 },
    LB: { mobility: 1.15, defense: 1.0, creation: .95, pressure: .95, stamina: 1.05 },
    RB: { mobility: 1.15, defense: 1.0, creation: .95, pressure: .95, stamina: 1.05 },
    GK: { defense: 1 }
  };
  const weight = weights[position];
  const totalWeight = Object.values(weight).reduce((sum, value) => sum + value, 0);
  const overall = Object.entries(weight).reduce((sum, [key, value]) => sum + (boosted[key] ?? 0) * value, 0) / Math.max(1, totalWeight);
  return Object.fromEntries([...Object.entries(boosted), ['overall', clampDecimal(overall)]].map(([key, value]) => [key, clampDecimal(Number(value))]));
}

function calculateTacticalFit(position: PositionCode, a: Required<Attributes>, pri: Record<string, number>) {
  return {
    possession: clampDecimal(avg(pri.creation, pri.dribbling, a.lowPass, a.ballControl) / 10, 1, 10),
    quickCounter: clampDecimal(avg(pri.mobility, pri.finishing, a.speed, a.acceleration) / 10, 1, 10),
    longBallCounter: clampDecimal(avg(pri.physical, pri.aerial, pri.defense, a.speed) / 10, 1, 10),
    outWide: clampDecimal(avg(position === 'CF' ? pri.aerial : pri.creation, a.loftedPass, a.speed, a.stamina) / 10, 1, 10),
    longBall: clampDecimal(avg(pri.physical, pri.aerial, a.kickingPower, a.loftedPass) / 10, 1, 10)
  };
}


const TRAINING_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending', 'gk1', 'gk2', 'gk3'];

const SAFE_DEFAULT_TRAINING_BUDGET = 64;
const MIN_AUTO_TRAINING_BUDGET = 20;
const MAX_AUTO_TRAINING_BUDGET = 80;
// Cartas especiais/booster do eFHUB/eFootBase normalmente ficam nessa faixa.
// Se o OCR ler 116, 140 etc. vindo de outro número da tela, o app descarta e usa fallback seguro.

function normalizeTrainingBudget(value: number | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < MIN_AUTO_TRAINING_BUDGET || n > MAX_AUTO_TRAINING_BUDGET) return SAFE_DEFAULT_TRAINING_BUDGET;
  return Math.round(n);
}

function emptyTraining(): TrainingPlan {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function normalizeTrainingPlan(plan: TrainingPlan): TrainingPlan {
  const clean = emptyTraining();
  for (const key of TRAINING_KEYS) clean[key] = Math.max(0, Math.min(16, Math.round(Number(plan[key] ?? 0))));
  return clean;
}

function trainingLevelCost(level: number): number {
  if (level <= 0) return 0;
  return Math.ceil(level / 4);
}

function trainingTotalCost(level: number): number {
  let cost = 0;
  for (let current = 1; current <= Math.max(0, level); current += 1) cost += trainingLevelCost(current);
  return cost;
}

function trainingPlanCost(plan: TrainingPlan): TrainingPlan {
  const costs = emptyTraining();
  for (const key of TRAINING_KEYS) costs[key] = trainingTotalCost(plan[key] ?? 0);
  return costs;
}

function trainingPlanTotalCost(plan: TrainingPlan): number {
  return Object.values(trainingPlanCost(plan)).reduce((sum, value) => sum + value, 0);
}


const TRAINING_ALIASES: Record<TrainingKey, string[]> = {
  shooting: ['finalizacao', 'finalização', 'chute', 'chutes', 'tiro', 'tiros', 'shooting'],
  passing: ['passe', 'passes', 'passing'],
  dribbling: ['drible treino', 'drible', 'dribbling'],
  dexterity: ['destreza', 'dexterity'],
  lowerBodyStrength: ['forca nas pernas', 'força nas pernas', 'forca pernas', 'força pernas', 'forca de pernas', 'força de pernas', 'forca inferior', 'lower body strength'],
  aerialStrength: ['forca em bola aerea', 'força em bola aérea', 'forca bola aerea', 'força bola aérea', 'bola aerea', 'bola aérea', 'jogo aereo', 'jogo aéreo', 'aerial strength'],
  defending: ['defesa', 'defending'],
  gk1: ['go 1', 'gol 1', 'goleiro 1', 'gk 1', 'gk1'],
  gk2: ['go 2', 'gol 2', 'goleiro 2', 'gk 2', 'gk2'],
  gk3: ['go 3', 'gol 3', 'goleiro 3', 'gk 3', 'gk3']
};

function aliasToRegex(alias: string): string {
  return normalize(alias)
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
}

function parseTrainingAllocation(text: string): { plan: TrainingPlan; points: number; keysRead: number } | null {
  const normalized = normalize(text)
    .replace(/\r/g, '\n')
    .replace(/[=:+]/g, ' ')
    .replace(/\s+/g, ' ');
  const plan = emptyTraining();
  const found = new Set<TrainingKey>();

  for (const key of TRAINING_KEYS) {
    for (const alias of TRAINING_ALIASES[key]) {
      const pattern = new RegExp(`(?:^|[\\s,;|•])${aliasToRegex(alias)}\\s*(\\d{1,2})(?=\\b)`, 'gi');
      for (const match of normalized.matchAll(pattern)) {
        const value = Number(match[1]);
        if (!Number.isFinite(value) || value < 0 || value > 16) continue;
        plan[key] = Math.max(plan[key] ?? 0, value);
        found.add(key);
      }
    }
  }

  const points = trainingPlanTotalCost(plan);
  const nonZero = TRAINING_KEYS.filter((key) => (plan[key] ?? 0) > 0).length;

  // Só confia quando parece mesmo a seção de treino da ficha automática.
  // Isso impede que atributos como "Finalização 91" ou "Passe rasteiro 80" virem pontos.
  if (found.size < 4 || nonZero < 2) return null;
  if (points < MIN_AUTO_TRAINING_BUDGET || points > MAX_AUTO_TRAINING_BUDGET) return null;
  return { plan, points, keysRead: found.size };
}

function addTrainingLevel(plan: TrainingPlan, key: TrainingKey, maxLevel = 16): boolean {
  if ((plan[key] ?? 0) >= maxLevel) return false;
  plan[key] = (plan[key] ?? 0) + 1;
  return true;
}

function removeTrainingLevel(plan: TrainingPlan, key: TrainingKey): boolean {
  if ((plan[key] ?? 0) <= 0) return false;
  plan[key] = (plan[key] ?? 0) - 1;
  return true;
}

function trainingBudgetFromCard(parsed: ParsedCard): number {
  const fromTraining = Number(parsed.autoTrainingPoints ?? NaN);
  if (Number.isFinite(fromTraining) && fromTraining >= MIN_AUTO_TRAINING_BUDGET && fromTraining <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(fromTraining);

  const inferred = inferTrainingPointsFromLevel(parsed.level);
  if (inferred && inferred >= MIN_AUTO_TRAINING_BUDGET && inferred <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(inferred);

  const total = Number(parsed.trainingPointsTotal ?? NaN);
  if (Number.isFinite(total) && total >= MIN_AUTO_TRAINING_BUDGET && total <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(total);

  return SAFE_DEFAULT_TRAINING_BUDGET;
}

function applyPlanEntries(entries: Partial<TrainingPlan>): TrainingPlan {
  return { ...emptyTraining(), ...entries };
}

function isGoalkeeperStyle(playstyle?: string | null) {
  return /goleiro ofensivo|goleiro defensivo|offensive goalkeeper|defensive goalkeeper/i.test(normalize(playstyle ?? ''));
}

function goalkeeperProfile(parsed: ParsedCard, a: Required<Attributes>) {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const height = Number(parsed.height ?? 0);
  const shortGk = height > 0 && height < 190;
  const offensive = /goleiro ofensivo|offensive goalkeeper/.test(style);
  const defensive = /goleiro defensivo|defensive goalkeeper/.test(style);
  const weakReach = a.goalkeeperReach < 82 || shortGk;
  const weakReflex = a.goalkeeperReflexes < 82;
  const weakCatch = a.goalkeeperCatching < 82;
  return { shortGk, offensive, defensive, weakReach, weakReflex, weakCatch };
}

function goalkeeperTrainingTemplate(objective: Objective, a: Required<Attributes>, parsed: ParsedCard): { target: TrainingPlan; priority: TrainingKey[] } {
  const profile = goalkeeperProfile(parsed, a);
  let target = applyPlanEntries({ gk1: 10, gk2: 10, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 });
  let priority: TrainingKey[] = ['gk2', 'gk3', 'gk1', 'aerialStrength', 'lowerBodyStrength'];

  if (profile.defensive) {
    target = applyPlanEntries({ gk1: 11, gk2: 10, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 });
    priority = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];
  }

  if (profile.offensive) {
    target = applyPlanEntries({ gk1: 9, gk2: 11, gk3: 9, aerialStrength: 2, lowerBodyStrength: 3 });
    priority = ['gk2', 'gk3', 'gk1', 'lowerBodyStrength', 'aerialStrength'];
  }

  if (profile.weakReach) {
    target.gk3 = Math.max(target.gk3, 11);
    target.aerialStrength = Math.max(target.aerialStrength, 4);
    priority = ['gk3', 'gk2', 'gk1', 'aerialStrength', 'lowerBodyStrength'];
  }

  if (profile.weakReflex) {
    target.gk2 = Math.max(target.gk2, 11);
    priority = ['gk2', ...priority.filter((key) => key !== 'gk2')];
  }

  if (profile.weakCatch) {
    target.gk1 = Math.max(target.gk1, 11);
    priority = ['gk1', ...priority.filter((key) => key !== 'gk1')];
  }

  if (objective === 'GOALKEEPER' || objective === 'COMPETITIVE') {
    target.gk1 = Math.max(target.gk1, 10);
    target.gk2 = Math.max(target.gk2, 11);
    target.gk3 = Math.max(target.gk3, 10);
  }

  if (objective === 'AERIAL') {
    target.gk3 = Math.max(target.gk3, 11);
    target.aerialStrength = Math.max(target.aerialStrength, 5);
    priority = ['gk3', 'aerialStrength', 'gk2', 'gk1', 'lowerBodyStrength'];
  }

  return { target: normalizeTrainingPlan(target), priority: Array.from(new Set(priority)) };
}


type TrainingRoleProfile = {
  label: string;
  target?: Partial<TrainingPlan>;
  priority?: TrainingKey[];
  capAdjust?: Partial<TrainingPlan>;
  weightAdjust?: Partial<Record<TrainingKey, number>>;
};

function styleContains(playstyle: string, pattern: RegExp) {
  return pattern.test(normalize(playstyle).toLowerCase());
}

function trainingRoleProfile(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): TrainingRoleProfile | null {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const highAerial = a.heading >= 78 || a.jump >= 78 || a.physicalContact >= 82;
  const strongFinisher = a.finishing >= 86 || a.kickingPower >= 86;
  const strongCreator = a.lowPass >= 84 || a.loftedPass >= 84 || a.ballControl >= 84;
  const strongDefender = a.defensiveAwareness >= 82 || a.tackling >= 82 || a.defensiveEngagement >= 82;
  const fastPlayer = a.speed >= 84 || a.acceleration >= 84;

  if (position === 'GK') {
    if (styleContains(style, /goleiro ofensivo|offensive goalkeeper/)) {
      return {
        label: 'GOL ofensivo de cobertura e reposição',
        target: { gk1: 9, gk2: 11, gk3: 10, lowerBodyStrength: 3, aerialStrength: 2 },
        priority: ['gk2', 'gk3', 'gk1', 'lowerBodyStrength', 'aerialStrength'],
        capAdjust: { gk2: 1, gk3: 1, lowerBodyStrength: 1 },
        weightAdjust: { gk2: 1.6, gk3: 1.1, lowerBodyStrength: .7 }
      };
    }
    if (styleContains(style, /goleiro defensivo|defensive goalkeeper/)) {
      return {
        label: 'GOL defensivo de segurança e reflexo',
        target: { gk1: 11, gk2: 11, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 },
        priority: ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'],
        capAdjust: { gk1: 1, gk2: 1, gk3: 1 },
        weightAdjust: { gk1: 1.6, gk2: 1.4, gk3: .8 }
      };
    }
    return null;
  }

  if (position === 'CF') {
    if (styleContains(style, /artilheiro|goal poacher|atacante matador/)) {
      return {
        label: 'CA artilheiro finalizador',
        target: { shooting: strongFinisher ? 10 : 11, dexterity: fastPlayer ? 8 : 9, lowerBodyStrength: 8, aerialStrength: highAerial ? 6 : 3, dribbling: 3, passing: 0, defending: 0 },
        priority: ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'],
        capAdjust: { shooting: 2, dexterity: 1, lowerBodyStrength: 1, defending: -4 },
        weightAdjust: { shooting: 2.5, dexterity: 1.2, lowerBodyStrength: .9, aerialStrength: highAerial ? .9 : -.4, passing: -.7, defending: -4 }
      };
    }
    if (styleContains(style, /homem de area|homem de área|fox in the box/)) {
      return {
        label: 'CA homem de área',
        target: { shooting: 10, dexterity: 7, lowerBodyStrength: 8, aerialStrength: 8, dribbling: 2, passing: 0, defending: 0 },
        priority: ['shooting', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'dribbling'],
        capAdjust: { shooting: 1, aerialStrength: 3, lowerBodyStrength: 1, defending: -4 },
        weightAdjust: { shooting: 2.1, aerialStrength: 2.1, lowerBodyStrength: 1.1, dexterity: .6, defending: -4, passing: -.5 }
      };
    }
    if (styleContains(style, /pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/)) {
      return {
        label: 'CA pivô / apoio de costas',
        target: { shooting: 8, passing: 5, dribbling: 3, dexterity: 6, lowerBodyStrength: 9, aerialStrength: highAerial ? 7 : 4, defending: 0 },
        priority: ['lowerBodyStrength', 'passing', 'shooting', 'aerialStrength', 'dexterity', 'dribbling'],
        capAdjust: { passing: 2, lowerBodyStrength: 2, aerialStrength: 2, shooting: 1, defending: -3 },
        weightAdjust: { lowerBodyStrength: 2.0, passing: 1.5, aerialStrength: 1.2, shooting: .9, defending: -3 }
      };
    }
  }

  if (position === 'SS') {
    if (styleContains(style, /puxa marcacao|puxa marcação|deep lying forward|armador criativo|creative playmaker/)) {
      return {
        label: 'SA de apoio e criação',
        target: { shooting: 6, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 5, aerialStrength: 1 },
        priority: ['dexterity', 'passing', 'dribbling', 'shooting', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 1, shooting: 1 },
        weightAdjust: { passing: 1.8, dribbling: 1.1, dexterity: .8, shooting: .6 }
      };
    }
    if (styleContains(style, /jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/)) {
      return {
        label: 'SA infiltrador',
        target: { shooting: 8, dribbling: 6, dexterity: 9, passing: 4, lowerBodyStrength: 6, aerialStrength: 1 },
        priority: ['dexterity', 'shooting', 'lowerBodyStrength', 'dribbling', 'passing'],
        capAdjust: { dexterity: 2, shooting: 1, lowerBodyStrength: 1 },
        weightAdjust: { dexterity: 1.8, shooting: 1.4, lowerBodyStrength: .8, passing: .4 }
      };
    }
  }

  if (position === 'LWF' || position === 'RWF') {
    if (styleContains(style, /ala produtivo|prolific winger|ponta prolifico|ponta prolífico/)) {
      return {
        label: `${POSITION_PT[position]} produtivo de ataque`,
        target: { dribbling: 9, dexterity: 9, lowerBodyStrength: 7, shooting: 6, passing: 3, aerialStrength: 0, defending: 0 },
        priority: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
        capAdjust: { dribbling: 2, dexterity: 2, shooting: 1, defending: -2 },
        weightAdjust: { dribbling: 1.8, dexterity: 1.5, lowerBodyStrength: .8, shooting: .7, defending: -2 }
      };
    }
    if (styleContains(style, /lateral movel|lateral móvel|roaming flank|flanco movel|flanco móvel/)) {
      return {
        label: `${POSITION_PT[position]} diagonal / lateral móvel`,
        target: { dribbling: 8, dexterity: 9, lowerBodyStrength: 8, shooting: 5, passing: 4, aerialStrength: 0 },
        priority: ['dexterity', 'lowerBodyStrength', 'dribbling', 'shooting', 'passing'],
        capAdjust: { dexterity: 2, lowerBodyStrength: 2, dribbling: 1 },
        weightAdjust: { dexterity: 1.6, lowerBodyStrength: 1.4, dribbling: 1.1, shooting: .6 }
      };
    }
  }

  if (position === 'AMF') {
    if (styleContains(style, /classico n[oº]? 10|clássico n[oº]? 10|classic/)) {
      return {
        label: 'MAT clássico 10 de criação',
        target: { passing: 10, dribbling: 8, dexterity: 5, shooting: 4, lowerBodyStrength: 2, defending: 0 },
        priority: ['passing', 'dribbling', 'shooting', 'dexterity', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 2, defending: -4, lowerBodyStrength: -1 },
        weightAdjust: { passing: 2.0, dribbling: 1.3, shooting: .7, defending: -3, lowerBodyStrength: -.5 }
      };
    }
    if (styleContains(style, /armador criativo|creative playmaker|criador de jogadas/)) {
      return {
        label: 'MAT armador criativo',
        target: { passing: 10, dribbling: 7, dexterity: 6, shooting: 4, lowerBodyStrength: 3, defending: 0 },
        priority: ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 1, dexterity: 1, defending: -3 },
        weightAdjust: { passing: 2.2, dribbling: 1.0, dexterity: .7, shooting: .5, defending: -3 }
      };
    }
    if (styleContains(style, /jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/)) {
      return {
        label: 'MAT de infiltração',
        target: { shooting: 6, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 5, defending: 0 },
        priority: ['dexterity', 'passing', 'shooting', 'dribbling', 'lowerBodyStrength'],
        capAdjust: { dexterity: 2, shooting: 2, passing: 1 },
        weightAdjust: { dexterity: 1.5, shooting: 1.4, passing: 1.1, dribbling: .7 }
      };
    }
  }

  if (position === 'CMF') {
    if (styleContains(style, /orquestrador|orchestrator/)) {
      return {
        label: 'MLG orquestrador',
        target: { passing: 10, dribbling: 5, dexterity: 5, lowerBodyStrength: 6, defending: 6, aerialStrength: 1, shooting: 0 },
        priority: ['passing', 'dexterity', 'dribbling', 'defending', 'lowerBodyStrength', 'aerialStrength'],
        capAdjust: { passing: 3, dribbling: 1, defending: -1, shooting: -3 },
        weightAdjust: { passing: 2.3, dribbling: .9, dexterity: .7, defending: -.2, shooting: -2 }
      };
    }
    if (styleContains(style, /meia versatil|meia versátil|box-to-box|todo campo/)) {
      return {
        label: 'MLG box-to-box',
        target: { passing: 7, dribbling: 4, dexterity: 6, lowerBodyStrength: 8, defending: 8, aerialStrength: 2, shooting: strongFinisher ? 3 : 1 },
        priority: ['lowerBodyStrength', 'defending', 'passing', 'dexterity', 'dribbling', 'shooting'],
        capAdjust: { lowerBodyStrength: 2, defending: 2, passing: 1, dexterity: 1 },
        weightAdjust: { lowerBodyStrength: 1.7, defending: 1.5, passing: 1.0, dexterity: .7, shooting: strongFinisher ? .7 : -.5 }
      };
    }
  }

  if (position === 'DMF') {
    if (styleContains(style, /primeiro volante|ancora|âncora|anchor/)) {
      return {
        label: 'VOL primeiro volante protetor',
        target: { passing: 6, dribbling: 2, dexterity: 4, lowerBodyStrength: 8, aerialStrength: 5, defending: 14, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'aerialStrength', 'passing', 'dexterity', 'dribbling'],
        capAdjust: { defending: 2, aerialStrength: 2, lowerBodyStrength: 1, shooting: -4 },
        weightAdjust: { defending: 2.4, lowerBodyStrength: 1.1, aerialStrength: 1.0, passing: .5, shooting: -3 }
      };
    }
    if (styleContains(style, /destruidor|destroyer/)) {
      return {
        label: 'VOL destruidor agressivo',
        target: { passing: 7, dribbling: 3, dexterity: 5, lowerBodyStrength: 8, aerialStrength: 4, defending: 13, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'passing', 'dexterity', 'aerialStrength', 'dribbling'],
        capAdjust: { defending: 2, lowerBodyStrength: 1, passing: 1, shooting: -4 },
        weightAdjust: { defending: 2.2, lowerBodyStrength: 1.1, passing: .8, dexterity: .5, shooting: -3 }
      };
    }
    if (styleContains(style, /orquestrador|orchestrator/)) {
      return {
        label: 'VOL orquestrador de saída',
        target: { passing: 10, dribbling: 4, dexterity: 4, lowerBodyStrength: 6, aerialStrength: 2, defending: strongDefender ? 8 : 6, shooting: 0 },
        priority: ['passing', 'defending', 'lowerBodyStrength', 'dribbling', 'dexterity', 'aerialStrength'],
        capAdjust: { passing: 3, defending: -1, dribbling: 1, shooting: -4 },
        weightAdjust: { passing: 2.5, dribbling: .7, dexterity: .6, defending: strongDefender ? .6 : -.7, shooting: -3 }
      };
    }
  }

  if (position === 'CB') {
    if (styleContains(style, /defensor criativo|build up|construtor/)) {
      return {
        label: 'ZAG defensor criativo / saída limpa',
        target: { defending: 13, aerialStrength: 7, lowerBodyStrength: 6, dexterity: 3, passing: strongCreator ? 5 : 4, dribbling: 0, shooting: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'passing', 'dexterity'],
        capAdjust: { passing: 3, defending: 1, shooting: -4, dribbling: -2 },
        weightAdjust: { defending: 1.7, aerialStrength: 1.2, passing: 1.6, lowerBodyStrength: .7, shooting: -3, dribbling: -1 }
      };
    }
    if (styleContains(style, /destruidor|destroyer/)) {
      return {
        label: 'ZAG destruidor de combate',
        target: { defending: 15, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 3, passing: 1, shooting: 0, dribbling: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'],
        capAdjust: { defending: 2, aerialStrength: 1, lowerBodyStrength: 1, shooting: -5, passing: -1 },
        weightAdjust: { defending: 2.5, aerialStrength: 1.3, lowerBodyStrength: .8, passing: -.4, shooting: -4, dribbling: -2 }
      };
    }
    if (styleContains(style, /atacante surpresa|extra frontman/)) {
      return {
        label: 'ZAG atacante surpresa controlado',
        target: { defending: 13, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 4, passing: 3, shooting: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'passing', 'dexterity'],
        capAdjust: { passing: 1, dexterity: 1, defending: 1, shooting: -3 },
        weightAdjust: { defending: 1.8, aerialStrength: 1.3, passing: .7, dexterity: .5, shooting: -2.5 }
      };
    }
  }

  if (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') {
    const sideLabel = POSITION_PT[position];
    if (styleContains(style, /lateral defensivo|defensive full/)) {
      return {
        label: `${sideLabel} lateral defensivo seguro`,
        target: { defending: 10, lowerBodyStrength: 8, passing: 6, dexterity: 6, dribbling: 2, aerialStrength: 3, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'aerialStrength', 'dribbling'],
        capAdjust: { defending: 2, lowerBodyStrength: 1, shooting: -4, dribbling: -1 },
        weightAdjust: { defending: 2.0, lowerBodyStrength: 1.1, dexterity: .8, passing: .6, shooting: -3 }
      };
    }
    if (styleContains(style, /perito em cruzamento|cross specialist/)) {
      return {
        label: `${sideLabel} perito em cruzamento`,
        target: { passing: 9, dribbling: 5, dexterity: 7, lowerBodyStrength: 7, defending: 5, aerialStrength: 1, shooting: 0 },
        priority: ['passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'defending', 'aerialStrength'],
        capAdjust: { passing: 3, lowerBodyStrength: 1, shooting: -3 },
        weightAdjust: { passing: 2.1, lowerBodyStrength: 1.0, dexterity: .9, dribbling: .7, shooting: -2 }
      };
    }
    if (styleContains(style, /lateral ofensivo|lateral atacante|offensive full|full back finisher/)) {
      return {
        label: `${sideLabel} apoio ofensivo`,
        target: { passing: 7, dribbling: 5, dexterity: 7, lowerBodyStrength: 8, defending: 7, aerialStrength: 1, shooting: 0 },
        priority: ['lowerBodyStrength', 'passing', 'dexterity', 'defending', 'dribbling', 'aerialStrength'],
        capAdjust: { lowerBodyStrength: 2, passing: 1, dexterity: 1, defending: 1, shooting: -2 },
        weightAdjust: { lowerBodyStrength: 1.6, passing: 1.2, dexterity: 1.0, defending: .7, shooting: -1.5 }
      };
    }
  }

  return null;
}

function mergeTrainingTarget(base: TrainingPlan, role?: TrainingRoleProfile | null): TrainingPlan {
  if (!role?.target) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(role.target) as Array<[TrainingKey, number | undefined]>) {
    if (typeof value === 'number') merged[key] = Math.max(0, Math.min(16, Math.round(value)));
  }
  return merged;
}

function mergeTrainingPriority(base: TrainingKey[], role?: TrainingRoleProfile | null): TrainingKey[] {
  if (!role?.priority?.length) return Array.from(new Set(base));
  return Array.from(new Set([...role.priority, ...base]));
}

function applyCapAdjustments(caps: TrainingPlan, role?: TrainingRoleProfile | null): TrainingPlan {
  if (!role?.capAdjust) return caps;
  const adjusted = { ...caps };
  for (const [key, delta] of Object.entries(role.capAdjust) as Array<[TrainingKey, number | undefined]>) {
    adjusted[key] = Math.max(0, Math.min(16, Math.round((adjusted[key] ?? 0) + Number(delta ?? 0))));
  }
  return adjusted;
}

function trainingTemplate(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): { target: TrainingPlan; priority: TrainingKey[] } {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const role = trainingRoleProfile(position, objective, a, parsed);
  const isDestroyer = /destruidor|destroyer/.test(playstyle);
  const isFullback = position === 'LB' || position === 'RB';
  const highAerial = a.heading >= 76 || a.jump >= 76 || a.physicalContact >= 80;

  let target: TrainingPlan = emptyTraining();
  let priority: TrainingKey[] = ['dexterity', 'lowerBodyStrength', 'passing', 'dribbling', 'defending', 'shooting', 'aerialStrength'];

  if (position === 'CF') {
    target = applyPlanEntries({ shooting: 10, dexterity: 8, lowerBodyStrength: 8, aerialStrength: highAerial ? 6 : 3, dribbling: 3 });
    priority = ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'];
  } else if (position === 'SS') {
    target = applyPlanEntries({ shooting: 7, dribbling: 7, dexterity: 8, passing: 5, lowerBodyStrength: 5 });
    priority = ['dexterity', 'dribbling', 'shooting', 'passing', 'lowerBodyStrength'];
  } else if (position === 'LWF' || position === 'RWF') {
    target = applyPlanEntries({ dribbling: 9, dexterity: 9, lowerBodyStrength: 6, shooting: 5, passing: 3 });
    priority = ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'];
  } else if (position === 'LMF' || position === 'RMF') {
    target = applyPlanEntries({ passing: 7, dribbling: 5, dexterity: 6, lowerBodyStrength: 7, defending: 6, aerialStrength: 2 });
    priority = ['lowerBodyStrength', 'passing', 'dexterity', 'defending', 'dribbling', 'aerialStrength'];
  } else if (position === 'AMF') {
    target = applyPlanEntries({ passing: 9, dribbling: 7, dexterity: 6, shooting: 4, lowerBodyStrength: 3 });
    priority = ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'];
  } else if (position === 'CMF') {
    target = applyPlanEntries({ passing: 8, dribbling: 4, dexterity: 4, lowerBodyStrength: 7, defending: 8, aerialStrength: 2 });
    priority = ['passing', 'defending', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength'];
  } else if (position === 'DMF') {
    // Modelo competitivo inspirado no próprio eFHUB: em 64 pontos vira 8/4/4/8/4/13.
    target = isDestroyer
      ? applyPlanEntries({ passing: 8, dribbling: 4, dexterity: 4, lowerBodyStrength: 8, aerialStrength: 4, defending: 13 })
      : applyPlanEntries({ passing: 7, dribbling: 3, dexterity: 4, lowerBodyStrength: 7, aerialStrength: 3, defending: 12 });
    priority = ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength'];
  } else if (position === 'CB') {
    target = applyPlanEntries({ defending: 14, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 3, passing: 2 });
    priority = ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'];
  } else if (isFullback) {
    target = isDestroyer
      ? applyPlanEntries({ defending: 10, lowerBodyStrength: 8, passing: 6, dexterity: 6, dribbling: 3, aerialStrength: 3 })
      : applyPlanEntries({ defending: 8, lowerBodyStrength: 8, passing: 7, dexterity: 6, dribbling: 4, aerialStrength: 2 });
    priority = ['lowerBodyStrength', 'defending', 'dexterity', 'passing', 'dribbling', 'aerialStrength'];
  } else if (position === 'GK') {
    const gkBase = goalkeeperTrainingTemplate(objective, a, parsed);
    return { target: mergeTrainingTarget(gkBase.target, role), priority: mergeTrainingPriority(gkBase.priority, role) };
  }

  if (objective === 'FINISHER') priority = ['shooting', 'dexterity', ...priority.filter((key) => !['shooting', 'dexterity'].includes(key))];
  if (objective === 'CREATOR' || objective === 'POSSESSION') priority = ['passing', 'dribbling', ...priority.filter((key) => !['passing', 'dribbling'].includes(key))];
  if (objective === 'DRIBBLER') priority = ['dribbling', 'dexterity', ...priority.filter((key) => !['dribbling', 'dexterity'].includes(key))];
  if (objective === 'PRESSING' || objective === 'DEFENSIVE') priority = ['defending', 'lowerBodyStrength', ...priority.filter((key) => !['defending', 'lowerBodyStrength'].includes(key))];
  if (objective === 'QUICK_COUNTER') priority = ['lowerBodyStrength', 'dexterity', ...priority.filter((key) => !['lowerBodyStrength', 'dexterity'].includes(key))];
  if (objective === 'AERIAL') priority = ['aerialStrength', 'defending', ...priority.filter((key) => !['aerialStrength', 'defending'].includes(key))];

  target = mergeTrainingTarget(target, role);
  priority = mergeTrainingPriority(priority, role);

  return { target, priority: Array.from(new Set(priority)) };
}

function fitTrainingToBudget(target: TrainingPlan, priority: TrainingKey[], budget: number): TrainingPlan {
  budget = normalizeTrainingBudget(budget);
  const plan = { ...target };
  const cleanPriority = priority.length ? priority : TRAINING_KEYS;

  // Se passou do orçamento real do eFootball, remove primeiro das prioridades menores.
  let guard = 0;
  while (trainingPlanTotalCost(plan) > budget && guard < 500) {
    guard += 1;
    const removable = [...cleanPriority].reverse().find((key) => (plan[key] ?? 0) > 0) ?? TRAINING_KEYS.find((key) => (plan[key] ?? 0) > 0);
    if (!removable) break;
    removeTrainingLevel(plan, removable);
  }

  // Se ainda sobrar ponto, coloca onde tem mais impacto, respeitando custo progressivo.
  guard = 0;
  while (guard < 500) {
    guard += 1;
    const current = trainingPlanTotalCost(plan);
    if (current >= budget) break;
    let added = false;
    for (const key of cleanPriority) {
      const nextLevel = (plan[key] ?? 0) + 1;
      const nextCost = trainingLevelCost(nextLevel);
      if (current + nextCost <= budget && nextLevel <= 16) {
        addTrainingLevel(plan, key);
        added = true;
        break;
      }
    }
    if (!added) break;
  }

  return plan;
}

const TRAINING_ATTRIBUTE_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
  shooting: { finishing: 1, placeKicking: 1, curl: 1 },
  passing: { lowPass: 1, loftedPass: 1 },
  dribbling: { ballControl: 1, dribbling: 1, tightPossession: 1 },
  dexterity: { offensiveAwareness: 1, acceleration: 1, balance: 1 },
  lowerBodyStrength: { speed: 1, kickingPower: 1, stamina: 1 },
  aerialStrength: { heading: 1, jump: 1, physicalContact: 1 },
  defending: { defensiveAwareness: 1, defensiveEngagement: 1, tackling: 1, aggression: 1 },
  gk1: { goalkeeperAwareness: 1, goalkeeperCatching: 1 },
  gk2: { goalkeeperParrying: 1, goalkeeperReflexes: 1 },
  gk3: { goalkeeperReach: 1, jump: 1 }
};

function applyTrainingToAttributes(base: Required<Attributes>, plan: TrainingPlan): Required<Attributes> {
  const boosted = { ...base } as Required<Attributes>;
  for (const key of TRAINING_KEYS) {
    const level = plan[key] ?? 0;
    const gains = TRAINING_ATTRIBUTE_GAINS[key] ?? {};
    for (const [attribute, gain] of Object.entries(gains) as Array<[AttributeKey, number]>) {
      boosted[attribute] = clamp((boosted[attribute] ?? 0) + level * gain, 1, 110);
    }
  }
  return boosted;
}

function trainingCaps(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): TrainingPlan {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const role = trainingRoleProfile(position, objective, a, parsed);
  const isAreaStriker = position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(playstyle);
  const highAerial = a.heading >= 78 || a.physicalContact >= 82 || isAreaStriker;
  const caps = emptyTraining();

  const set = (entries: Partial<TrainingPlan>) => Object.assign(caps, entries);

  if (position === 'CF') {
    set({ shooting: 13, dexterity: 11, lowerBodyStrength: 11, aerialStrength: highAerial ? 10 : 6, dribbling: 7, passing: 5 });
  } else if (position === 'SS') {
    set({ shooting: 10, passing: 8, dribbling: 10, dexterity: 11, lowerBodyStrength: 8, aerialStrength: 3 });
  } else if (position === 'LWF' || position === 'RWF') {
    set({ shooting: 8, passing: 6, dribbling: 11, dexterity: 11, lowerBodyStrength: 10, aerialStrength: 2 });
  } else if (position === 'LMF' || position === 'RMF') {
    set({ shooting: 4, passing: 9, dribbling: 8, dexterity: 9, lowerBodyStrength: 10, aerialStrength: 4, defending: 8 });
  } else if (position === 'AMF') {
    set({ shooting: 7, passing: 11, dribbling: 10, dexterity: 9, lowerBodyStrength: 6, aerialStrength: 2, defending: 2 });
  } else if (position === 'CMF') {
    set({ shooting: 4, passing: 10, dribbling: 7, dexterity: 7, lowerBodyStrength: 10, aerialStrength: 5, defending: 10 });
  } else if (position === 'DMF') {
    set({ shooting: 2, passing: 9, dribbling: 6, dexterity: 7, lowerBodyStrength: 9, aerialStrength: 6, defending: 14 });
  } else if (position === 'CB') {
    set({ passing: 5, dribbling: 2, dexterity: 6, lowerBodyStrength: 8, aerialStrength: 10, defending: 15 });
  } else if (position === 'LB' || position === 'RB') {
    set({ shooting: 2, passing: 8, dribbling: 7, dexterity: 9, lowerBodyStrength: 10, aerialStrength: 5, defending: 11 });
  } else if (position === 'GK') {
    set({ aerialStrength: 6, lowerBodyStrength: 5, gk1: 14, gk2: 14, gk3: 14 });
  }

  if (position === 'GK') {
    if (objective === 'AERIAL') {
      caps.aerialStrength = Math.min(8, caps.aerialStrength + 2);
      caps.gk3 = Math.min(16, caps.gk3 + 1);
    }
    return applyCapAdjustments(caps, role);
  }

  if (objective === 'FINISHER') {
    caps.shooting = Math.min(16, caps.shooting + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }
  if (objective === 'CREATOR' || objective === 'POSSESSION') {
    caps.passing = Math.min(16, caps.passing + 2);
    caps.dribbling = Math.min(16, caps.dribbling + 1);
  }
  if (objective === 'DRIBBLER') {
    caps.dribbling = Math.min(16, caps.dribbling + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }
  if (objective === 'DEFENSIVE' || objective === 'PRESSING') {
    caps.defending = Math.min(16, caps.defending + 2);
    caps.lowerBodyStrength = Math.min(16, caps.lowerBodyStrength + 1);
  }
  if (objective === 'AERIAL') caps.aerialStrength = Math.min(16, caps.aerialStrength + 3);
  if (objective === 'QUICK_COUNTER') {
    caps.lowerBodyStrength = Math.min(16, caps.lowerBodyStrength + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }

  return applyCapAdjustments(caps, role);
}

function objectiveBonus(objective: Objective, position: PositionCode, a: Required<Attributes>) {
  if (position === 'GK') {
    const base = avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach);
    const command = avg(a.jump, a.physicalContact, a.kickingPower);
    if (objective === 'AERIAL') return avg(a.goalkeeperReach, a.jump, a.physicalContact, base);
    return avg(base, base, command);
  }

  const values: Record<Objective, number> = {
    COMPETITIVE: avg(a.stamina, a.balance, a.physicalContact, position === 'CF' ? a.finishing : a.lowPass),
    FINISHER: avg(a.finishing, a.offensiveAwareness, a.kickingPower, a.curl),
    CREATOR: avg(a.lowPass, a.loftedPass, a.ballControl, a.tightPossession),
    DRIBBLER: avg(a.dribbling, a.ballControl, a.tightPossession, a.balance, a.acceleration),
    PRESSING: avg(a.stamina, a.aggression, a.defensiveEngagement, a.speed),
    POSSESSION: avg(a.lowPass, a.ballControl, a.tightPossession, a.balance),
    QUICK_COUNTER: avg(a.speed, a.acceleration, a.finishing, a.kickingPower),
    DEFENSIVE: avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.physicalContact),
    AERIAL: avg(a.heading, a.jump, a.physicalContact),
    GOALKEEPER: avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach)
  };
  return values[objective] ?? values.COMPETITIVE;
}

function eliteBuildScore(position: PositionCode, objective: Objective, base: Required<Attributes>, plan: TrainingPlan, parsed: ParsedCard): number {
  const a = applyTrainingToAttributes(base, plan);
  const pri = calculatePri(position, a, parsed.nativeSkills).overall;
  let score = pri * 1.85 + objectiveBonus(objective, position, a) * 0.85;

  // Thresholds de gameplay real. O motor prefere passar de cortes úteis em campo, não inflar overall.
  if (position === 'CF') {
    score += Math.min(8, Math.max(0, a.finishing - 88) * 0.6);
    score += Math.min(6, Math.max(0, a.offensiveAwareness - 88) * 0.45);
    score += Math.min(5, Math.max(0, a.kickingPower - 86) * 0.35);
    if (/homem de area|pivo|target man|fox/.test(normalize(parsed.playstyle ?? '').toLowerCase())) {
      score += Math.min(7, Math.max(0, avg(a.heading, a.jump, a.physicalContact) - 82) * 0.45);
    }
    if (a.lowPass < 68) score -= 3;
  }
  if (position === 'DMF' || position === 'CB') {
    score += Math.min(10, Math.max(0, avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement) - 86) * 0.55);
    score += Math.min(5, Math.max(0, a.physicalContact - 82) * 0.35);
    if (position === 'DMF') score += Math.min(4, Math.max(0, a.lowPass - 78) * 0.25);
  }
  if (position === 'AMF' || position === 'CMF' || position === 'SS') {
    score += Math.min(8, Math.max(0, avg(a.lowPass, a.ballControl, a.tightPossession) - 84) * 0.45);
  }
  if (position === 'LWF' || position === 'RWF' || position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') {
    score += Math.min(8, Math.max(0, avg(a.speed, a.acceleration, a.stamina) - 86) * 0.4);
  }

  // Penaliza gastar ponto em atributo que não conversa com a função.
  if (position !== 'GK' && (plan.gk1 || plan.gk2 || plan.gk3)) score -= 100;
  if (position === 'CF' && plan.defending > 0) score -= plan.defending * 3;
  if ((position === 'CB' || position === 'DMF') && plan.shooting > 4) score -= (plan.shooting - 4) * 2;
  return score;
}

function trainingKeyWeight(key: TrainingKey, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): number {
  const role = trainingRoleProfile(position, objective, a, parsed);
  const baseByPosition: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
    CF: { shooting: 9.6, dexterity: 7.4, lowerBodyStrength: 7.8, aerialStrength: 5.6, dribbling: 3.4, passing: 2.4, defending: -2, gk1: -20, gk2: -20, gk3: -20 },
    SS: { shooting: 7, passing: 5.5, dribbling: 7.6, dexterity: 8.2, lowerBodyStrength: 5.6, aerialStrength: 1.6, defending: .4, gk1: -20, gk2: -20, gk3: -20 },
    LWF: { shooting: 5.8, passing: 4.2, dribbling: 8.8, dexterity: 9.2, lowerBodyStrength: 7.8, aerialStrength: .8, defending: .7, gk1: -20, gk2: -20, gk3: -20 },
    RWF: { shooting: 5.8, passing: 4.2, dribbling: 8.8, dexterity: 9.2, lowerBodyStrength: 7.8, aerialStrength: .8, defending: .7, gk1: -20, gk2: -20, gk3: -20 },
    LMF: { shooting: 1.8, passing: 7.5, dribbling: 5.4, dexterity: 6.7, lowerBodyStrength: 8.2, aerialStrength: 2, defending: 5.8, gk1: -20, gk2: -20, gk3: -20 },
    RMF: { shooting: 1.8, passing: 7.5, dribbling: 5.4, dexterity: 6.7, lowerBodyStrength: 8.2, aerialStrength: 2, defending: 5.8, gk1: -20, gk2: -20, gk3: -20 },
    AMF: { shooting: 4.7, passing: 9.3, dribbling: 8.2, dexterity: 6.4, lowerBodyStrength: 3.8, aerialStrength: .6, defending: .8, gk1: -20, gk2: -20, gk3: -20 },
    CMF: { shooting: 2.3, passing: 8.2, dribbling: 4.8, dexterity: 5.3, lowerBodyStrength: 7.8, aerialStrength: 2.4, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    DMF: { shooting: .7, passing: 7.3, dribbling: 3.5, dexterity: 4.9, lowerBodyStrength: 7.8, aerialStrength: 4.1, defending: 10.2, gk1: -20, gk2: -20, gk3: -20 },
    CB: { shooting: -2, passing: 3.2, dribbling: .8, dexterity: 4.5, lowerBodyStrength: 6.5, aerialStrength: 8.8, defending: 10.8, gk1: -20, gk2: -20, gk3: -20 },
    LB: { shooting: .8, passing: 6.5, dribbling: 4.8, dexterity: 7.2, lowerBodyStrength: 8.6, aerialStrength: 2.3, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    RB: { shooting: .8, passing: 6.5, dribbling: 4.8, dexterity: 7.2, lowerBodyStrength: 8.6, aerialStrength: 2.3, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    GK: { gk1: 9.6, gk2: 9.8, gk3: 9.4, aerialStrength: 4.8, lowerBodyStrength: 2.2, shooting: -20, passing: -20, dribbling: -20, dexterity: -20, defending: -20 }
  };

  const objectiveBoost: Record<Objective, Partial<Record<TrainingKey, number>>> = {
    COMPETITIVE: { dexterity: .7, lowerBodyStrength: .7, passing: .4, defending: .4 },
    FINISHER: { shooting: 2.2, dexterity: .9, aerialStrength: .8 },
    CREATOR: { passing: 2.2, dribbling: .9 },
    DRIBBLER: { dribbling: 2.1, dexterity: 1.2 },
    PRESSING: { defending: 1.5, lowerBodyStrength: 1.2, dexterity: .5 },
    POSSESSION: { passing: 1.7, dribbling: 1.1, dexterity: .5 },
    QUICK_COUNTER: { lowerBodyStrength: 2.1, dexterity: 1.3, shooting: .6 },
    DEFENSIVE: { defending: 2.2, aerialStrength: .7, lowerBodyStrength: .9 },
    AERIAL: { aerialStrength: 2.4, shooting: position === 'CF' ? .8 : 0, defending: position === 'CB' ? .8 : 0 },
    GOALKEEPER: { gk1: 1.8, gk2: 2.2, gk3: 1.8, aerialStrength: .4, lowerBodyStrength: .3 }
  };

  let weight = (baseByPosition[position][key] ?? 0) + (objectiveBoost[objective][key] ?? 0) + (role?.weightAdjust?.[key] ?? 0);
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  if (position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(style)) {
    if (key === 'shooting') weight += 1.5;
    if (key === 'aerialStrength') weight += 1.4;
    if (key === 'dexterity') weight += .7;
  }
  if (/destruidor|destroyer|ancora|anchor/.test(style)) {
    if (key === 'defending') weight += 1.8;
    if (key === 'lowerBodyStrength') weight += .8;
  }
  if ((a.finishing < 84 && key === 'shooting') || (a.lowPass < 76 && key === 'passing') || (a.speed < 80 && key === 'lowerBodyStrength')) weight += .6;
  return weight;
}

function trainingLevelValue(key: TrainingKey, level: number, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): number {
  const weight = trainingKeyWeight(key, position, objective, a, parsed);
  if (weight <= -10) return -999;
  const phase = level <= 4 ? 1.05 : level <= 8 ? .94 : level <= 12 ? .72 : .48;
  const cost = trainingLevelCost(level);
  return (weight * phase) / Math.max(1, cost);
}

function solveTrainingDp(position: PositionCode, objective: Objective, base: Required<Attributes>, parsed: ParsedCard, budget: number, caps: TrainingPlan): TrainingPlan | null {
  type State = { value: number; plan: TrainingPlan };
  let states: Array<State | null> = Array.from({ length: budget + 1 }, () => null);
  states[0] = { value: 0, plan: emptyTraining() };

  for (const key of TRAINING_KEYS) {
    const next: Array<State | null> = Array.from({ length: budget + 1 }, () => null);
    const cap = Math.max(0, Math.min(16, caps[key] ?? 0));
    const levelValues = Array.from({ length: cap + 1 }, (_, level) => {
      let value = 0;
      for (let current = 1; current <= level; current += 1) value += trainingLevelValue(key, current, position, objective, base, parsed);
      return { level, cost: trainingTotalCost(level), value };
    });

    for (let currentBudget = 0; currentBudget <= budget; currentBudget += 1) {
      const state = states[currentBudget];
      if (!state) continue;
      for (const option of levelValues) {
        const totalCost = currentBudget + option.cost;
        if (totalCost > budget) continue;
        const candidateValue = state.value + option.value;
        const previous = next[totalCost];
        if (!previous || candidateValue > previous.value) {
          next[totalCost] = { value: candidateValue, plan: { ...state.plan, [key]: option.level } as TrainingPlan };
        }
      }
    }
    states = next;
  }

  return states[budget]?.plan ?? null;
}

function loosenTrainingCaps(position: PositionCode, caps: TrainingPlan): TrainingPlan {
  const loose = { ...caps };
  if (position === 'GK') {
    loose.gk1 = Math.max(loose.gk1, 12);
    loose.gk2 = Math.max(loose.gk2, 12);
    loose.gk3 = Math.max(loose.gk3, 12);
    loose.aerialStrength = Math.max(loose.aerialStrength, 6);
    loose.lowerBodyStrength = Math.max(loose.lowerBodyStrength, 4);
    return loose;
  }

  for (const key of TRAINING_KEYS) {
    if (key === 'gk1' || key === 'gk2' || key === 'gk3') {
      loose[key] = 0;
    } else {
      loose[key] = Math.max(loose[key] ?? 0, 6);
    }
  }
  return loose;
}

function optimizeEliteTraining(position: PositionCode, objective: Objective, base: Required<Attributes>, parsed: ParsedCard): TrainingPlan {
  const budget = normalizeTrainingBudget(trainingBudgetFromCard(parsed));
  const caps = trainingCaps(position, objective, base, parsed);
  const exact = solveTrainingDp(position, objective, base, parsed, budget, caps);
  if (exact) return exact;

  const loose = solveTrainingDp(position, objective, base, parsed, budget, loosenTrainingCaps(position, caps));
  if (loose) return loose;

  const { target, priority } = trainingTemplate(position, objective, base, parsed);
  return fitTrainingToBudget(target, priority, budget);
}

function trainingFor(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): TrainingPlan {
  return optimizeEliteTraining(position, objective, a, parsed);
}

function trainingCostRuleText() {
  return 'Motor Adaptativo Elite v24.39: qualquer jogador de linha pode receber ficha para qualquer posição de linha escolhida. A posição-alvo manda; posição original, estilo e atributos servem apenas para preservar qualidades úteis, sem limitar a conversão, mantendo custo progressivo e orçamento real.';
}

function skillPriority(position: PositionCode, objective: Objective) {
  const byPosition: Record<PositionCode, string[]> = {
    CF: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', 'Cabeçada', 'Controle da cavadinha', 'Toque de calcanhar', 'Passe de primeira', 'Super substituto'],
    SS: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Passe em profundidade', 'Chute de primeira', 'Precisão à distância', 'Toque de calcanhar'],
    LWF: ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora', 'Precisão à distância', 'Passe de primeira'],
    RWF: ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora', 'Precisão à distância', 'Passe de primeira'],
    LMF: ['Cruzamento preciso', 'Passe de primeira', 'Passe na medida', 'Interceptação', 'Volta para marcar', 'Curva para fora'],
    RMF: ['Cruzamento preciso', 'Passe de primeira', 'Passe na medida', 'Interceptação', 'Volta para marcar', 'Curva para fora'],
    AMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Controle com a sola', 'Curva para fora', 'Toque duplo'],
    CMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Interceptação', 'Espírito guerreiro', 'Volta para marcar'],
    DMF: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira', 'Espírito guerreiro'],
    CB: ['Bloqueador', 'Interceptação', 'Marcação individual', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Espírito guerreiro'],
    LB: ['Cruzamento preciso', 'Passe de primeira', 'Interceptação', 'Volta para marcar', 'Bloqueador', 'Curva para fora'],
    RB: ['Cruzamento preciso', 'Passe de primeira', 'Interceptação', 'Volta para marcar', 'Bloqueador', 'Curva para fora'],
    GK: ['Liderança', 'Espírito guerreiro']
  };
  if (position === 'GK') return byPosition.GK;
  const extras: Record<Objective, string[]> = {
    COMPETITIVE: ['Espírito guerreiro', 'Passe de primeira'],
    FINISHER: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe'],
    CREATOR: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida'],
    DRIBBLER: ['Toque duplo', 'Controle com a sola', 'Elástico'],
    PRESSING: ['Volta para marcar', 'Interceptação', 'Espírito guerreiro'],
    POSSESSION: ['Passe de primeira', 'Controle com a sola', 'Passe na medida'],
    QUICK_COUNTER: ['Passe em profundidade', 'Chute de primeira', 'Toque duplo'],
    DEFENSIVE: ['Interceptação', 'Bloqueador', 'Marcação individual'],
    AERIAL: ['Cabeçada', 'Superioridade aérea', 'Afastamento acrobático'],
    GOALKEEPER: ['Liderança', 'Espírito guerreiro']
  };
  return Array.from(new Set([...(extras[objective] ?? []), ...(byPosition[position] ?? [])]));
}

const DEFENSIVE_FIELD_SKILLS = ['Volta para marcar', 'Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Afastamento acrobático'];
const CROSSING_SIDE_SKILLS = ['Cruzamento preciso', 'Passe aéreo baixo', 'Arremesso lateral longo'];
const PURE_CF_FINISHER_STYLES = /artilheiro|goal poacher|homem de area|homem de área|atacante matador|fox in the box/;
const TARGET_CF_STYLES = /pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/;
const PRESSING_WING_STYLES = /ala produtivo|lateral movel|lateral móvel|ponta prolifico|ponta prolífico|flanco movel|flanco móvel|atacante surpresa|jogador de infiltracao|jogador de infiltração/;

function isPureFinisherCf(position: PositionCode, playstyle: string) {
  return position === 'CF' && PURE_CF_FINISHER_STYLES.test(playstyle) && !TARGET_CF_STYLES.test(playstyle);
}

function shouldRecommendTrackBack(position: PositionCode, playstyle: string, objective: Objective, attributes: Required<Attributes>) {
  if (position === 'GK' || position === 'CB') return false;
  if (isPureFinisherCf(position, playstyle)) return false;
  if (position === 'CF') {
    return objective === 'PRESSING' && TARGET_CF_STYLES.test(playstyle) && attributes.stamina >= 82 && attributes.aggression >= 76;
  }
  if (position === 'LWF' || position === 'RWF' || position === 'SS' || position === 'LMF' || position === 'RMF') {
    return objective === 'PRESSING' || PRESSING_WING_STYLES.test(playstyle) || attributes.stamina >= 83;
  }
  return position === 'DMF' || position === 'CMF' || position === 'LB' || position === 'RB' || objective === 'PRESSING';
}

type SkillBlueprint = {
  label: string;
  essentials: string[];
  alternatives: string[];
  avoid: string[];
};

function knownStyleBlueprint(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): SkillBlueprint | null {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const isAerial = attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80;
  const isCreatorPos = selectedPosition === 'AMF' || selectedPosition === 'CMF' || selectedPosition === 'SS' || selectedPosition === 'DMF';

  if (!style) return null;

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || /goleiro/.test(style)) return null;

  if (selectedPosition === 'CB') {
    if (/atacante surpresa|extra frontman/.test(style)) {
      return {
        label: 'ZAG atacante surpresa com segurança',
        essentials: ['Interceptação', 'Bloqueador', 'Superioridade aérea', 'Passe de primeira', 'Afastamento acrobático'],
        alternatives: ['Marcação individual', 'Cabeçada', 'Passe na medida', 'Espírito guerreiro'],
        avoid: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Controle da cavadinha', 'Volta para marcar']
      };
    }
    if (/defensor criativo|construtor|build up/.test(style)) {
      return {
        label: 'ZAG defensor criativo / saída de bola',
        essentials: ['Interceptação', 'Bloqueador', 'Passe de primeira', 'Passe na medida', 'Superioridade aérea'],
        alternatives: ['Marcação individual', 'Afastamento acrobático', 'Espírito guerreiro', 'Cabeçada'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Volta para marcar', 'Toque duplo']
      };
    }
    if (/destruidor|destroyer/.test(style)) {
      return {
        label: 'ZAG destruidor de combate',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Superioridade aérea'],
        alternatives: ['Afastamento acrobático', 'Espírito guerreiro', 'Cabeçada', 'Passe de primeira'],
        avoid: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Controle da cavadinha', 'Cruzamento preciso']
      };
    }
  }

  if (selectedPosition === 'LB' || selectedPosition === 'RB' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    if (/lateral defensivo|defensive full/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral defensivo de recomposição`,
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira'],
        alternatives: ['Cruzamento preciso', 'Passe na medida', 'Espírito guerreiro', 'Carrinho'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha']
      };
    }
    if (/perito em cruzamento|cross specialist/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} especialista em cruzamento`,
        essentials: ['Cruzamento preciso', 'Passe na medida', 'Passe aéreo baixo', 'Curva para fora', 'Passe de primeira'],
        alternatives: ['Volta para marcar', 'Interceptação', 'Controle com a sola', 'Espírito guerreiro'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Marcação individual', 'Carrinho']
      };
    }
    if (/lateral ofensivo|lateral atacante|offensive full|full back finisher/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral de apoio ofensivo`,
        essentials: ['Cruzamento preciso', 'Passe de primeira', 'Volta para marcar', 'Interceptação', 'Curva para fora'],
        alternatives: ['Passe na medida', 'Controle com a sola', 'Toque duplo', 'Bloqueador'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha']
      };
    }
  }

  if (selectedPosition === 'DMF' || selectedPosition === 'CMF') {
    if (/primeiro volante|ancora|âncora|anchor/.test(style)) {
      return {
        label: '1º volante protetor da zaga',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Passe de primeira', 'Espírito guerreiro'],
        alternatives: ['Volta para marcar', 'Carrinho', 'Passe em profundidade', 'Passe na medida'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Elástico']
      };
    }
    if (/destruidor|destroyer/.test(style)) {
      return {
        label: selectedPosition === 'DMF' ? 'VOL destruidor de contenção' : 'MLG marcador agressivo',
        essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira'],
        alternatives: ['Carrinho', 'Espírito guerreiro', 'Passe em profundidade', 'Passe na medida'],
        avoid: ['Chute de primeira', 'Finalização acrobática', 'Controle da cavadinha', 'Cruzamento preciso']
      };
    }
    if (/orquestrador|orchestrator/.test(style)) {
      return {
        label: selectedPosition === 'DMF' ? 'VOL orquestrador de saída' : 'MLG orquestrador',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Interceptação'],
        alternatives: ['Passe sem olhar', 'Espírito guerreiro', 'Volta para marcar', 'Toque de calcanhar'],
        avoid: ['Carrinho', 'Chute de primeira', 'Finalização acrobática', 'Cruzamento preciso']
      };
    }
    if (/meia versatil|box-to-box|todo campo/.test(style)) {
      return {
        label: 'Meia versátil box-to-box',
        essentials: ['Passe de primeira', 'Interceptação', 'Volta para marcar', 'Passe em profundidade', 'Espírito guerreiro'],
        alternatives: ['Passe na medida', 'Controle com a sola', 'Precisão à distância', 'Toque de calcanhar'],
        avoid: ['Controle da cavadinha', 'Cruzamento preciso', 'Carrinho']
      };
    }
  }

  if (isCreatorPos) {
    if (/classico n[oº]? 10|clássico n[oº]? 10|classic/.test(style)) {
      return {
        label: 'Clássico 10 criador técnico',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Precisão à distância'],
        alternatives: ['Passe sem olhar', 'Toque de calcanhar', 'Chute de primeira', 'Efeito de longe'],
        avoid: ['Volta para marcar', 'Carrinho', 'Bloqueador', 'Marcação individual']
      };
    }
    if (/armador criativo|criador de jogadas|creative playmaker/.test(style)) {
      return {
        label: 'Armador criativo de último passe',
        essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Controle com a sola'],
        alternatives: ['Toque de calcanhar', 'Precisão à distância', 'Chute de primeira', 'Toque duplo'],
        avoid: ['Carrinho', 'Bloqueador', 'Marcação individual', 'Superioridade aérea']
      };
    }
    if (/jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/.test(style)) {
      return {
        label: 'Meia de infiltração / chegada',
        essentials: ['Chute de primeira', 'Passe de primeira', 'Passe em profundidade', 'Precisão à distância', 'Toque duplo'],
        alternatives: ['Finalização acrobática', 'Efeito de longe', 'Controle com a sola', 'Toque de calcanhar'],
        avoid: ['Carrinho', 'Bloqueador', 'Marcação individual', 'Afastamento acrobático']
      };
    }
  }

  if (selectedPosition === 'LWF' || selectedPosition === 'RWF' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    if (/ala produtivo|ponta prolifico|ponta prolífico|prolific winger/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} ala produtivo`,
        essentials: ['Toque duplo', 'Controle com a sola', 'Chute de primeira', 'Cruzamento preciso', 'Passe de primeira'],
        alternatives: ['Precisão à distância', 'Elástico', 'Curva para fora', 'Volta para marcar'],
        avoid: ['Carrinho', 'Marcação individual', 'Bloqueador', 'Afastamento acrobático']
      };
    }
    if (/lateral movel|lateral móvel|flanco movel|flanco móvel|roaming flank/.test(style)) {
      return {
        label: `${POSITION_PT[selectedPosition]} lateral móvel / diagonal`,
        essentials: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Precisão à distância', 'Cruzamento preciso'],
        alternatives: ['Chute de primeira', 'Passe em profundidade', 'Volta para marcar', 'Curva para fora'],
        avoid: ['Carrinho', 'Marcação individual', 'Superioridade aérea', 'Afastamento acrobático']
      };
    }
  }

  if (selectedPosition === 'CF' || selectedPosition === 'SS') {
    if (/atacante pivo|atacante pivô|pivo|pivô|target man/.test(style)) {
      return {
        label: selectedPosition === 'CF' ? 'CA pivô / referência' : 'SA pivô de apoio',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', ...(isAerial ? ['Cabeçada'] : ['Controle com a sola']), 'Espírito guerreiro'],
        alternatives: ['Precisão à distância', 'Superioridade aérea', 'Finalização acrobática', ...(shouldRecommendTrackBack(selectedPosition, style, objective, attributes) ? ['Volta para marcar'] : [])],
        avoid: ['Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso']
      };
    }
    if (/homem de area|homem de área|fox in the box/.test(style)) {
      return {
        label: 'Homem de área',
        essentials: ['Chute de primeira', 'Cabeçada', 'Superioridade aérea', 'Finalização acrobática', 'Controle da cavadinha'],
        alternatives: ['Precisão à distância', 'Efeito de longe', 'Toque de calcanhar', 'Passe de primeira'],
        avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador']
      };
    }
    if (/puxa marcacao|puxa marcação|deep lying forward/.test(style)) {
      return {
        label: 'Atacante que puxa marcação',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', 'Controle com a sola', 'Precisão à distância'],
        alternatives: ['Espírito guerreiro', 'Finalização acrobática', 'Volta para marcar', 'Passe em profundidade'],
        avoid: ['Marcação individual', 'Carrinho', 'Bloqueador', 'Interceptação']
      };
    }
    if (/artilheiro|goal poacher|atacante matador/.test(style)) {
      return {
        label: selectedPosition === 'SS' ? 'SA artilheiro de ruptura' : 'CA artilheiro finalizador',
        essentials: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', isAerial ? 'Cabeçada' : 'Controle da cavadinha'],
        alternatives: ['Passe de primeira', 'Toque de calcanhar', 'Super substituto', ...(isAerial ? ['Superioridade aérea'] : [])],
        avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso']
      };
    }
  }

  return null;
}

function skillBlueprint(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): SkillBlueprint {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const isAerial = attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80;
  const highPass = attributes.lowPass >= 78 || attributes.loftedPass >= 78;
  const highDribble = attributes.dribbling >= 80 || attributes.tightPossession >= 80 || attributes.ballControl >= 82;
  const highSpeed = attributes.speed >= 82 || attributes.acceleration >= 82;
  const pressingContext = objective === 'PRESSING' || attributes.stamina >= 84 || attributes.aggression >= 82;
  const styleBlueprint = knownStyleBlueprint(parsed, selectedPosition, objective, attributes);
  if (styleBlueprint) return styleBlueprint;

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    const isOffensiveKeeper = /ofensivo|offensive/i.test(playstyle);
    return {
      label: isOffensiveKeeper ? 'Goleiro de saída rápida' : 'Goleiro seguro',
      essentials: isOffensiveKeeper
        ? ['Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Pegador de pênalti', 'Liderança']
        : ['Pegador de pênalti', 'Reposição baixa do goleiro', 'Reposição alta do goleiro', 'Arremesso longo do goleiro', 'Liderança'],
      alternatives: ['Espírito guerreiro'],
      avoid: ['Chute de primeira', 'Passe de primeira', 'Toque duplo', 'Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Carrinho']
    };
  }

  if (selectedPosition === 'CF') {
    if (TARGET_CF_STYLES.test(playstyle)) {
      return {
        label: 'CA pivô / referência',
        essentials: ['Passe de primeira', 'Toque de calcanhar', 'Chute de primeira', ...(isAerial ? ['Cabeçada', 'Superioridade aérea'] : ['Finalização acrobática'])],
        alternatives: ['Precisão à distância', 'Efeito de longe', 'Controle da cavadinha', 'Espírito guerreiro', ...(shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes) ? ['Volta para marcar'] : [])],
        avoid: ['Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso', 'Arremesso lateral longo']
      };
    }
    return {
      label: 'CA finalizador',
      essentials: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', ...(isAerial ? ['Cabeçada'] : ['Controle da cavadinha'])],
      alternatives: ['Passe de primeira', 'Toque de calcanhar', 'Super substituto', ...(isAerial ? ['Superioridade aérea'] : ['Controle da cavadinha'])],
      avoid: ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador', 'Cruzamento preciso', 'Arremesso lateral longo', 'Passe aéreo baixo']
    };
  }

  if (selectedPosition === 'SS') {
    return {
      label: 'SA de apoio e ruptura',
      essentials: ['Passe de primeira', 'Chute de primeira', 'Passe em profundidade', ...(highDribble ? ['Toque duplo'] : ['Controle com a sola']), 'Toque de calcanhar'],
      alternatives: ['Precisão à distância', 'Finalização acrobática', 'Passe sem olhar', ...(pressingContext ? ['Volta para marcar'] : [])],
      avoid: ['Carrinho', 'Marcação individual', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'LWF' || selectedPosition === 'RWF') {
    return {
      label: 'Ponta de aceleração',
      essentials: ['Toque duplo', 'Controle com a sola', ...(highDribble ? ['Elástico'] : ['Pedalada simples']), ...(highPass ? ['Cruzamento preciso'] : ['Curva para fora']), 'Passe de primeira'],
      alternatives: ['Precisão à distância', 'Passe em profundidade', 'Finalização acrobática', ...(pressingContext ? ['Volta para marcar'] : [])],
      avoid: ['Carrinho', 'Marcação individual', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'AMF') {
    return {
      label: 'MAT criador',
      essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', ...(highDribble ? ['Controle com a sola'] : ['Toque de calcanhar'])],
      alternatives: ['Curva para fora', 'Toque duplo', 'Precisão à distância', 'De letra'],
      avoid: ['Carrinho', 'Marcação individual', 'Bloqueador', 'Afastamento acrobático', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'CMF') {
    return {
      label: /orquestrador|armador|classico|clássico/i.test(playstyle) ? 'MLG organizador' : 'MLG ida e volta',
      essentials: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', ...(attributes.defensiveAwareness >= 76 ? ['Interceptação'] : ['Controle com a sola']), 'Espírito guerreiro'],
      alternatives: ['Volta para marcar', 'Marcação individual', 'Passe sem olhar', 'Toque de calcanhar'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Chute ascendente', 'Folha seca', 'Arremesso lateral longo']
    };
  }

  if (selectedPosition === 'DMF') {
    return {
      label: /destruidor|primeiro volante|ancora|âncora|anchor/i.test(playstyle) ? 'VOL marcador' : 'VOL construtor',
      essentials: ['Interceptação', 'Bloqueador', 'Marcação individual', ...(shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes) ? ['Volta para marcar'] : ['Espírito guerreiro']), 'Passe de primeira'],
      alternatives: ['Passe em profundidade', 'Passe na medida', 'Superioridade aérea', 'Carrinho'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente']
    };
  }

  if (selectedPosition === 'CB') {
    return {
      label: 'ZAG de segurança',
      essentials: ['Bloqueador', 'Interceptação', 'Marcação individual', ...(isAerial ? ['Superioridade aérea'] : ['Afastamento acrobático']), 'Espírito guerreiro'],
      alternatives: ['Carrinho', 'Cabeçada', 'Passe de primeira', 'Passe na medida'],
      avoid: ['Toque duplo', 'Elástico', 'Controle da cavadinha', 'Precisão à distância', 'Finalização acrobática', 'Chute de primeira', 'Efeito de longe']
    };
  }

  if (selectedPosition === 'LB' || selectedPosition === 'RB' || selectedPosition === 'LMF' || selectedPosition === 'RMF') {
    const defensiveSide = selectedPosition === 'LB' || selectedPosition === 'RB';
    return {
      label: defensiveSide ? 'Lateral equilibrado' : 'Meia aberto',
      essentials: ['Cruzamento preciso', 'Passe de primeira', ...(defensiveSide ? ['Interceptação'] : ['Passe na medida']), ...(pressingContext ? ['Volta para marcar'] : ['Curva para fora']), highSpeed ? 'Controle com a sola' : 'Espírito guerreiro'],
      alternatives: ['Passe aéreo baixo', 'Bloqueador', 'Marcação individual', 'Toque duplo'],
      avoid: ['Controle da cavadinha', 'Finalização acrobática', 'Chute de primeira', 'Carrinho']
    };
  }

  return {
    label: 'Função híbrida',
    essentials: skillPriority(selectedPosition, objective).slice(0, 5),
    alternatives: skillPriority(selectedPosition, objective).slice(5),
    avoid: []
  };
}

function buildAvoidSkills(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): string[] {
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);
  return uniqueSkillList(blueprint.avoid).slice(0, 6);
}

function skillTierReason(skill: string, tier: SkillRecommendation['tier'], blueprint: SkillBlueprint) {
  if (tier === 'essencial') return `prioridade para ${blueprint.label}: combina diretamente com posição, estilo e função real`;
  if (tier === 'alternativa') return `boa alternativa se você quiser variar a função sem fugir do desempenho em campo`;
  return `evite para ${blueprint.label}: gasta habilidade e entrega pouco para a função principal`;
}

function buildSkillRecommendations(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>, recommendedSkills: string[]): SkillRecommendation[] {
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);
  const result: SkillRecommendation[] = [];
  for (const skill of recommendedSkills) {
    const key = skillKey(skill);
    const essential = blueprint.essentials.some((item) => skillKey(item) === key);
    result.push({ name: skill, tier: essential ? 'essencial' : 'alternativa', reason: skillTierReason(skill, essential ? 'essencial' : 'alternativa', blueprint) });
  }
  for (const skill of buildAvoidSkills(parsed, selectedPosition, objective, attributes)) {
    if (result.some((item) => skillKey(item.name) === skillKey(skill))) continue;
    result.push({ name: skill, tier: 'evitar', reason: skillTierReason(skill, 'evitar', blueprint) });
  }
  return result;
}

function contextualSkillBans(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>) {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const banned = new Set<string>();
  const ban = (skills: string[]) => skills.forEach((skill) => banned.add(skillKey(skill)));
  ban(skillBlueprint(parsed, selectedPosition, objective, attributes).avoid);

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    ban(Object.keys(SKILL_PROFILES).filter((skill) => SKILL_PROFILES[skill].category !== 'GOLEIRO' && !['Liderança', 'Espírito guerreiro'].includes(skill)));
    return banned;
  }

  if (isPureFinisherCf(selectedPosition, playstyle)) {
    ban(DEFENSIVE_FIELD_SKILLS);
    ban(CROSSING_SIDE_SKILLS);
  }

  if ((selectedPosition === 'CF' || selectedPosition === 'SS') && !shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) {
    banned.add(skillKey('Volta para marcar'));
  }

  if (selectedPosition === 'CB') {
    ban(['Toque duplo', 'Elástico', 'Controle da cavadinha', 'Efeito de longe', 'Precisão à distância', 'Finalização acrobática', 'Chute de primeira']);
  }

  if (selectedPosition === 'DMF' && /destruidor|primeiro volante|anchor|ancora|âncora/.test(playstyle)) {
    ban(['Controle da cavadinha', 'Finalização acrobática', 'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente']);
  }

  return banned;
}

function finalSkillScoreAdjustments(skill: string, parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>) {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  let bonus = 0;

  if (selectedPosition === 'CF') {
    if (PURE_CF_FINISHER_STYLES.test(playstyle)) {
      if (['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', 'Controle da cavadinha'].includes(skill)) bonus += 24;
      if (skill === 'Cabeçada' && (attributes.heading >= 74 || attributes.jump >= 76 || attributes.physicalContact >= 78)) bonus += 18;
      if (skill === 'Passe de primeira' && attributes.lowPass >= 74) bonus += 10;
      if (skill === 'Toque de calcanhar' && attributes.ballControl >= 75) bonus += 8;
    }
    if (TARGET_CF_STYLES.test(playstyle)) {
      if (['Passe de primeira', 'Toque de calcanhar', 'Cabeçada', 'Superioridade aérea', 'Chute de primeira'].includes(skill)) bonus += 18;
    }
  }

  if ((selectedPosition === 'LWF' || selectedPosition === 'RWF') && ['Toque duplo', 'Controle com a sola', 'Elástico', 'Cruzamento preciso', 'Curva para fora'].includes(skill)) bonus += 14;
  if ((selectedPosition === 'DMF' || selectedPosition === 'CB') && ['Interceptação', 'Bloqueador', 'Marcação individual', 'Superioridade aérea'].includes(skill)) bonus += 16;
  if (skill === 'Volta para marcar' && !shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) bonus -= 200;
  return bonus;
}



const IMPETO_NAMES = [
  'Chute', 'Cobrança de falta', 'Disputa aérea', 'Passe', 'Condução de bola', 'Técnica', 'Defesa', 'Duelo',
  'Agilidade', 'Fisicalidade', 'Goleiro', 'Instinto artilheiro', 'Guardião', 'Motor do time', 'Defesaça',
  'Cruzamento', 'Fantasista', 'Volante criativo', 'Reconstrução', 'Precisão', 'Criador ofensivo',
  'Proteção de Posse', 'Equilibrado', 'Transição ofensiva', 'Bloqueio Aéreo', 'Rompe-barreira', 'Força',
  'Movimento sem a bola', 'Roubo de bola'
];

const IMPETO_DB: Record<string, { attributes: string[]; groups: string[] }> = {
  'Chute': { attributes: ['Controle de bola', 'Finalização', 'Força do chute', 'Contato físico'], groups: ['finalizador', 'segundo-atacante'] },
  'Cobrança de falta': { attributes: ['Finalização', 'Bola parada', 'Curva', 'Força do chute'], groups: ['batedor', 'criador'] },
  'Disputa aérea': { attributes: ['Finalização', 'Cabeceio', 'Salto', 'Contato físico'], groups: ['finalizador-aereo', 'zagueiro-aereo'] },
  'Passe': { attributes: ['Passe rasteiro', 'Passe alto', 'Curva', 'Força do chute'], groups: ['criador', 'meia', 'volante-criador'] },
  'Condução de bola': { attributes: ['Drible', 'Condução firme', 'Velocidade', 'Equilíbrio'], groups: ['driblador', 'ponta', 'meia-ofensivo'] },
  'Técnica': { attributes: ['Controle de bola', 'Drible', 'Condução firme', 'Passe rasteiro'], groups: ['criador', 'meia', 'posse'] },
  'Defesa': { attributes: ['Talento defensivo', 'Desarme', 'Aceleração', 'Salto'], groups: ['defensor', 'volante-defensivo', 'lateral-defensivo'] },
  'Duelo': { attributes: ['Talento defensivo', 'Desarme', 'Velocidade', 'Resistência'], groups: ['defensor', 'volante-defensivo', 'lateral-defensivo'] },
  'Agilidade': { attributes: ['Velocidade', 'Aceleração', 'Equilíbrio', 'Resistência'], groups: ['ponta', 'lateral', 'pressao', 'meia-versatil'] },
  'Fisicalidade': { attributes: ['Salto', 'Contato físico', 'Equilíbrio', 'Resistência'], groups: ['defensor', 'pivo', 'volante-defensivo'] },
  'Goleiro': { attributes: ['Talento de GO', 'Firmeza do GO', 'Defesa do GO', 'Reflexos do GO'], groups: ['goleiro'] },
  'Instinto artilheiro': { attributes: ['Talento ofensivo', 'Controle de bola', 'Finalização', 'Aceleração'], groups: ['finalizador', 'segundo-atacante'] },
  'Guardião': { attributes: ['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Velocidade'], groups: ['defensor', 'volante-defensivo'] },
  'Motor do time': { attributes: ['Agressividade', 'Aceleração', 'Contato físico', 'Resistência'], groups: ['meia-versatil', 'pressao', 'volante-defensivo'] },
  'Defesaça': { attributes: ['Talento de GO', 'Defesa do GO', 'Reflexos do GO', 'Alcance do GO'], groups: ['goleiro'] },
  'Cruzamento': { attributes: ['Passe alto', 'Curva', 'Velocidade', 'Resistência'], groups: ['lateral', 'ponta', 'ala'] },
  'Fantasista': { attributes: ['Controle de bola', 'Drible', 'Finalização', 'Equilíbrio'], groups: ['meia-ofensivo', 'driblador', 'segundo-atacante'] },
  'Volante criativo': { attributes: ['Condução firme', 'Passe rasteiro', 'Talento defensivo', 'Desarme'], groups: ['volante-criador', 'meia', 'posse'] },
  'Reconstrução': { attributes: ['Passe rasteiro', 'Talento defensivo', 'Agressividade', 'Dedicação defensiva'], groups: ['volante-defensivo', 'zagueiro-construtor'] },
  'Precisão': { attributes: ['Passe rasteiro', 'Passe alto', 'Finalização', 'Força do chute'], groups: ['criador', 'batedor', 'finalizador'] },
  'Criador ofensivo': { attributes: ['Talento ofensivo', 'Controle de bola', 'Passe rasteiro', 'Força do chute'], groups: ['criador', 'meia-ofensivo'] },
  'Proteção de Posse': { attributes: ['Controle de bola', 'Condução firme', 'Contato físico', 'Equilíbrio'], groups: ['posse', 'pivo', 'meia'] },
  'Equilibrado': { attributes: ['Talento ofensivo', 'Talento defensivo', 'Aceleração', 'Resistência'], groups: ['meia-versatil', 'coringa'] },
  'Transição ofensiva': { attributes: ['Passe rasteiro', 'Desarme', 'Dedicação defensiva', 'Contato físico'], groups: ['pressao', 'volante-defensivo', 'meia-versatil'] },
  'Bloqueio Aéreo': { attributes: ['Cabeceio', 'Talento defensivo', 'Salto', 'Contato físico'], groups: ['zagueiro-aereo', 'defensor'] },
  'Rompe-barreira': { attributes: ['Drible', 'Velocidade', 'Força do chute', 'Contato físico'], groups: ['ponta', 'driblador', 'finalizador-fisico'] },
  'Força': { attributes: ['Velocidade', 'Força do chute', 'Salto', 'Contato físico'], groups: ['finalizador-fisico', 'pivo', 'defensor'] },
  'Movimento sem a bola': { attributes: ['Talento ofensivo', 'Velocidade', 'Aceleração', 'Resistência'], groups: ['infiltrador', 'ponta', 'finalizador'] },
  'Roubo de bola': { attributes: ['Desarme', 'Agressividade', 'Aceleração', 'Contato físico'], groups: ['volante-defensivo', 'defensor', 'pressao'] }
};

function desiredImpetoGroups(position: PositionCode, playstyle?: string | null, objective: Objective = 'COMPETITIVE') {
  const style = styleText(playstyle);
  const groups: string[] = [];

  if (position === 'GK') return ['goleiro'];
  if (position === 'CB') groups.push('defensor', 'zagueiro-aereo');
  if (position === 'DMF') groups.push('volante-defensivo', 'volante-criador', 'pressao');
  if (position === 'CMF') groups.push('meia-versatil', 'meia', 'volante-criador');
  if (position === 'AMF') groups.push('criador', 'meia-ofensivo', 'posse');
  if (position === 'LMF' || position === 'RMF') groups.push('ala', 'lateral', 'meia-versatil', 'ponta');
  if (position === 'LB' || position === 'RB') groups.push('lateral', 'lateral-defensivo', 'defensor');
  if (position === 'LWF' || position === 'RWF') groups.push('ponta', 'driblador', 'finalizador');
  if (position === 'SS') groups.push('segundo-atacante', 'criador', 'infiltrador');

  if (position === 'CF') {
    if (/homem de area|homem de área|pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/.test(style)) {
      groups.push('pivo', 'finalizador-aereo', 'finalizador-fisico', 'finalizador');
    } else {
      // CA artilheiro/finalizador não deve puxar grupos de pressão ou defesa.
      groups.push('finalizador', 'infiltrador', 'finalizador-fisico');
    }
  }

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) groups.unshift('volante-defensivo', 'defensor', 'pressao');
  if (/meia versatil|box-to-box|todo campo/.test(style)) groups.unshift('meia-versatil', 'pressao');
  if (/orquestrador|armador criativo|criador de jogadas|classico/.test(style)) groups.unshift('criador', 'posse', 'meia');
  if (/jogador de infiltracao|jogador sem bola|hole player|atacante surpresa/.test(style)) groups.unshift('infiltrador', 'finalizador');
  if (/homem de area|homem de área|pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/.test(style)) groups.unshift('pivo', 'finalizador-aereo', 'finalizador-fisico');
  if (/artilheiro|goal poacher|atacante matador/.test(style)) groups.unshift('finalizador', 'infiltrador');
  if (/lateral ofensivo|lateral atacante|perito em cruzamento/.test(style)) groups.unshift('lateral', 'ala');
  if (/ala produtivo|lateral movel|lateral móvel|ponta prolifico|ponta prolífico|flanco movel|flanco móvel/.test(style)) groups.unshift('ponta', 'ala', 'driblador');

  if (objective === 'DEFENSIVE' || (objective === 'PRESSING' && !isPureFinisherCf(position, style))) groups.unshift('volante-defensivo', 'defensor', 'pressao');
  if (objective === 'CREATOR' || objective === 'POSSESSION') groups.unshift('criador', 'posse', 'meia');
  if (objective === 'FINISHER' || objective === 'AERIAL') groups.unshift('finalizador', 'finalizador-aereo');
  if (objective === 'DRIBBLER') groups.unshift('driblador', 'ponta');
  if (objective === 'QUICK_COUNTER') groups.unshift(position === 'CF' ? 'infiltrador' : 'ponta', 'driblador');

  return Array.from(new Set(groups));
}

function recommendImpetos(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective): ImpetoRecommendation[] {
  const groups = desiredImpetoGroups(selectedPosition, parsed.playstyle, objective);
  const owned = new Set(parsed.impetos.filter((i) => i.active !== false).map((i) => skillKey(i.name)));
  const scored = Object.entries(IMPETO_DB).map(([name, info]) => {
    let score = 0;
    for (const group of groups) {
      const idx = info.groups.indexOf(group);
      if (idx >= 0) score += 120 - Math.min(80, groups.indexOf(group) * 7 + idx * 4);
    }
    if (owned.has(skillKey(name))) score += 15;
    return { name, info, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored.filter((item) => item.score > 0).slice(0, 5).map((item, index) => ({
    name: item.name,
    tier: index === 0 ? 'ideal' as const : 'alternativo' as const,
    attributes: item.info.attributes,
    reason: index === 0
      ? 'melhor impacto para a posição, estilo e função real da carta'
      : 'boa alternativa se você quiser variar a função sem fugir da gameplay da carta'
  }));

  const avoid = scored.filter((item) => item.score <= 0).slice(-3).reverse().map((item) => ({
    name: item.name,
    tier: 'evitar' as const,
    attributes: item.info.attributes,
    reason: 'não conversa bem com a posição principal e o estilo fixo desta carta'
  }));

  return [...best, ...avoid];
}

function topRatedPositions(positionRatings: PositionRatings): PositionCode[] {
  return Object.entries(positionRatings)
    .filter((entry): entry is [PositionCode, number] => Number.isFinite(entry[1]))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([position]) => position);
}

function recommendAdditionalSkills(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective, attributes: Required<Attributes>): string[] {
  const candidateScores = new Map<string, number>();
  const ownedSkillKeys = new Set([
    ...parsed.nativeSkills.map(skillKey),
    ...parsed.specialSkills.map(skillKey),
    ...parsed.impetos.map((item) => skillKey(item.name))
  ]);
  const bannedAdditional = new Set(SPECIAL_SKILL_NAMES.map(skillKey));
  const contextualBans = contextualSkillBans(parsed, selectedPosition, objective, attributes);
  const blueprint = skillBlueprint(parsed, selectedPosition, objective, attributes);

  const add = (skill: string, score: number) => {
    if (!SKILL_PROFILES[skill]) return;
    if (!isOfficialAdditionalSkill(skill)) return;
    const key = skillKey(skill);
    if (ownedSkillKeys.has(key)) return;
    if (bannedAdditional.has(key)) return;
    if (contextualBans.has(key)) return;
    const adjusted = score + finalSkillScoreAdjustments(skill, parsed, selectedPosition, objective, attributes);
    if (adjusted <= 0) return;
    candidateScores.set(skill, Math.max(candidateScores.get(skill) ?? 0, adjusted));
  };

  if (selectedPosition === 'GK' || parsed.mainPosition === 'GK' || isGoalkeeperStyle(parsed.playstyle)) {
    const profile = goalkeeperProfile(parsed, attributes);
    blueprint.essentials.forEach((skill, index) => add(skill, 130 - index * 8));
    blueprint.alternatives.forEach((skill, index) => add(skill, 82 - index * 5));
    return Array.from(candidateScores.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([skill]) => skill)
      .slice(0, 5);
  }

  // 1) Função principal escolhida pelo motor local: a lista é separada em essenciais e alternativas.
  blueprint.essentials.forEach((skill, index) => add(skill, 145 - index * 7));
  blueprint.alternatives.forEach((skill, index) => add(skill, 96 - index * 5));

  // 1.1) Herança segura por posição, com peso menor que a função real.
  skillPriority(selectedPosition, objective).forEach((skill, index) => add(skill, 84 - index * 5));

  // 2) Posições reais da carta lidas no grid do eFHUB/eFootBase.
  // Isso evita recomendar só por "LE" quando a carta também rende como VOL/MC/ZAG etc.
  const ratedPositions = topRatedPositions(parsed.positionRatings);
  const cardPositions = ratedPositions.length ? ratedPositions : parsed.positions;
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const useCrossPositionHints = !isPureFinisherCf(selectedPosition, playstyle);
  if (useCrossPositionHints) {
    cardPositions.slice(0, 3).forEach((position, posIndex) => {
      skillPriority(position, objective).forEach((skill, index) => add(skill, 66 - posIndex * 8 - index * 4));
    });
  }

  const isDestroyer = /destruidor|destroyer/.test(playstyle);
  const isFullback = selectedPosition === 'LB' || selectedPosition === 'RB' || cardPositions.includes('LB') || cardPositions.includes('RB');
  const isMidfielder = selectedPosition === 'DMF' || selectedPosition === 'CMF' || selectedPosition === 'AMF' || cardPositions.some((p) => ['DMF', 'CMF', 'AMF'].includes(p));
  const isForward = ['CF', 'SS', 'LWF', 'RWF'].includes(selectedPosition) || cardPositions.some((p) => ['CF', 'SS', 'LWF', 'RWF'].includes(p));

  // 3) Ajuste por estilo de jogo.
  if (isDestroyer) {
    add('Interceptação', 112);
    add('Bloqueador', 108);
    add('Marcação individual', 104);
    if (shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) add('Volta para marcar', 98);
    add('Passe de primeira', 92);
    add('Espírito guerreiro', 88);
    add('Passe em profundidade', 84);
    add('Passe na medida', 78);
    add('Superioridade aérea', 70);
  }

  if (/criador|orquestrador|creative|orchestrator/.test(playstyle)) {
    add('Passe de primeira', 112);
    add('Passe em profundidade', 108);
    add('Passe na medida', 102);
    add('Passe sem olhar', 86);
    add('Controle com a sola', 82);
  }

  if (/artilheiro|goal poacher|homem de area|homem de área|atacante matador|pivo|pivô|target man|fox/.test(playstyle)) {
    add('Chute de primeira', 116);
    add('Precisão à distância', 106);
    add('Finalização acrobática', 98);
    add('Efeito de longe', 94);
    add('Controle da cavadinha', 84);
    if (attributes.heading >= 74 || attributes.jump >= 76 || attributes.physicalContact >= 78) add('Cabeçada', 90);
    if (attributes.heading >= 76 || attributes.jump >= 78 || attributes.physicalContact >= 80) add('Superioridade aérea', 84);
  }

  // 4) Ajuste por atributos. Aqui é onde a recomendação fica mais "gameplay real".
  if (attributes.defensiveAwareness >= 78 || attributes.tackling >= 78 || attributes.defensiveEngagement >= 78) {
    add('Interceptação', 106);
    add('Bloqueador', 102);
    add('Marcação individual', 96);
  }
  if (attributes.aggression >= 78 || attributes.stamina >= 80) {
    if (shouldRecommendTrackBack(selectedPosition, playstyle, objective, attributes)) add('Volta para marcar', 92);
    add('Espírito guerreiro', 84);
  }
  if (attributes.lowPass >= 76 || isMidfielder) {
    add('Passe de primeira', 96);
    add('Passe em profundidade', 90);
  }
  if (attributes.loftedPass >= 74 || isFullback) {
    add('Passe na medida', 84);
    add('Cruzamento preciso', isFullback ? 88 : 74);
    add('Passe aéreo baixo', 66);
  }
  if (attributes.ballControl >= 76 || attributes.tightPossession >= 76 || attributes.dribbling >= 76) {
    add('Controle com a sola', 78);
    add('Toque duplo', 74);
  }
  if (attributes.speed >= 82 || attributes.acceleration >= 82) {
    add('Toque duplo', 82);
    if (isForward) add('Elástico', 74);
  }
  if (attributes.finishing >= 78 || isForward) {
    add('Chute de primeira', 96);
    add('Precisão à distância', 86);
    add('Finalização acrobática', 78);
    if (attributes.curl >= 72 || attributes.kickingPower >= 78) add('Efeito de longe', 76);
  }
  if (attributes.heading >= 76 || attributes.jump >= 76 || attributes.physicalContact >= 80) {
    add('Superioridade aérea', 86);
    add('Cabeçada', 78);
  }
  if (selectedPosition === 'CB') {
    add('Afastamento acrobático', 80);
    add('Carrinho', 76);
  }
  return Array.from(candidateScores.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([skill]) => skill)
    .slice(0, 5);
}

function strengthsWeaknesses(a: Required<Attributes>, pri: Record<string, number>, position: PositionCode = 'CF') {
  if (position === 'GK') {
    const ranked = Object.entries({
      'Reflexos de GO': a.goalkeeperReflexes,
      'Alcance de GO': a.goalkeeperReach,
      'Talento de GO': a.goalkeeperAwareness,
      'Firmeza de GO': a.goalkeeperCatching,
      'Defesa de GO': a.goalkeeperParrying,
      Salto: a.jump,
      'Contato físico': a.physicalContact,
      'Força do chute': a.kickingPower
    }).sort((left, right) => Number(right[1]) - Number(left[1]));
    return {
      strengths: ranked.slice(0, 4).map(([name, value]) => `${name} forte (${Number(value).toFixed(1)})`),
      weaknesses: ranked.slice(-3).reverse().map(([name, value]) => `${name} precisa de cuidado (${Number(value).toFixed(1)})`)
    };
  }

  const ranked = Object.entries({
    Finalização: pri.finishing,
    Criação: pri.creation,
    Drible: pri.dribbling,
    Mobilidade: pri.mobility,
    Defesa: pri.defense,
    Físico: pri.physical,
    Resistência: pri.stamina,
    'Jogo aéreo': pri.aerial,
    'Passe curto': a.lowPass,
    Velocidade: a.speed,
    Aceleração: a.acceleration,
    Equilíbrio: a.balance
  }).sort((left, right) => Number(right[1]) - Number(left[1]));
  const strengths = ranked.slice(0, 4).map(([name, value]) => `${name} forte (${Number(value).toFixed(1)})`);
  const weaknesses = ranked.slice(-3).reverse().map(([name, value]) => `${name} precisa de cuidado (${Number(value).toFixed(1)})`);
  return { strengths, weaknesses };
}

function usageTips(position: PositionCode, objective: Objective, a: Required<Attributes>) {
  const tips: string[] = [];
  if (position === 'CF') {
    tips.push('Use como referência no último terço: procure finalizar de primeira e atacar o espaço entre zagueiros.');
    if (a.heading >= 80 || a.physicalContact >= 80) tips.push('Valorize cruzamentos, pivôs curtos e bolas aéreas; o físico e a cabeçada sustentam o contato.');
    if (a.balance < 72) tips.push('Evite conduções longas sob pressão; solte a bola rápido e finalize em poucos toques.');
  } else if (position === 'SS') {
    tips.push('Use como SA entre linhas: receba no giro, combine com o CA e ataque o espaço para finalizar.');
    tips.push('Funciona melhor com passe rápido e triangulações, não preso na ponta o tempo todo.');
  } else if (position === 'AMF') {
    tips.push('Use como MAT por dentro: acione passes em profundidade e chute de média distância quando sobrar espaço.');
    tips.push('Evite gastar pontos demais em defesa; o valor dele é criação e último passe.');
  } else if (position === 'LWF' || position === 'RWF') {
    tips.push('Use aberto para atrair marcação e cortar para dentro; aceleração e drible são o foco.');
    tips.push('Se tiver Cruzamento preciso, alterne entre infiltrar e cruzar para não ficar previsível.');
  } else if (position === 'LMF' || position === 'RMF') {
    tips.push('Use pelo corredor lateral como apoio intenso: ajuda na recomposição e acelera a transição.');
  } else if (position === 'DMF') {
    tips.push('Use como VOL fixo: bloqueie linha de passe, antecipe e solte passe curto seguro.');
    tips.push('Para extrair máximo gameplay, pressione só no timing certo; esta função rende mais protegendo a entrada da área.');
  } else if (position === 'CMF') {
    tips.push('Use como MC de ida e volta: acelere transições, encurte passes e pressione após perda da bola.');
  } else if (position === 'CB') {
    tips.push('Use como ZAG de cobertura: não dê bote desnecessário; priorize interceptar e bloquear chutes.');
    tips.push('Combine com outro zagueiro mais veloz se a velocidade estiver abaixo de 75.');
  } else if (position === 'GK') {
    tips.push('Use como GOL puro: mantenha a linha defensiva protegida, evite sair manualmente sem necessidade e valorize reflexo, alcance e firmeza.');
    tips.push('Para goleiro ofensivo, use reposição rápida e saída curta; para goleiro defensivo, prefira posicionamento, alcance e segurança em chutes próximos.');
    tips.push('Não use habilidades de jogador de linha no plano de goleiro; a recomendação mantém somente habilidades próprias de GOL e habilidades universais úteis, sem nomes inventados.');
  } else {
    tips.push('Use na posição recomendada e foque nas ações que aparecem como pontos fortes no PRI.');
  }
  if (objective === 'QUICK_COUNTER') tips.push('No contra-ataque rápido, procure passes verticais cedo e evite prender a bola no meio.');
  if (objective === 'POSSESSION') tips.push('Na posse de bola, mantenha aproximação curta e use Passe de primeira para acelerar triangulações.');
  if (objective === 'PRESSING') tips.push('Em pressão alta, controle o fôlego: use pressão manual em gatilhos, não o tempo todo.');
  return tips;
}

function detectMainPosition(positions: PositionCode[], positionRatings: PositionRatings, attributes: Attributes, playstyle?: string | null): PositionCode {
  const preferred = preferredPositionFromPlaystyle(playstyle, positionRatings, attributes);
  const validRatings = Object.entries(positionRatings)
    .filter((entry): entry is [PositionCode, number] => Number.isFinite(entry[1]) && Number(entry[1]) >= 40 && Number(entry[1]) <= 110)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  const bestRating = validRatings[0]?.[1] ?? 0;

  // Se a função real indica uma posição e ela aparece com nota plausível, usamos ela antes do maior overall.
  // Isso impede casos como DMF/VOL destruidor ir para LE/ZAG só porque a grade deu rating maior.
  if (preferred) {
    const preferredRating = Number(positionRatings[preferred] ?? 0);
    if (!positions.length || positions.includes(preferred) || preferredRating >= 70) {
      if (!bestRating || preferredRating >= bestRating - 16) return preferred;
    }
  }

  const stylePriority = gameplayPriorityByMainPosition(preferred ?? (positions[0] ?? 'SS'), playstyle);
  for (const code of stylePriority) {
    const rating = Number(positionRatings[code] ?? 0);
    if (rating >= 70 && (!bestRating || rating >= bestRating - 14)) return code;
  }

  const fromRatings = validRatings[0]?.[0];
  if (fromRatings) return fromRatings;
  if (positions[0]) return positions[0];
  if (preferred) return preferred;
  if ((attributes.defensiveAwareness ?? 0) >= 76 && (attributes.lowPass ?? 0) >= 72) return 'DMF';
  if ((attributes.finishing ?? 0) >= 80) return 'CF';
  return 'SS';
}


type TrainingPointCandidate = { used: number | null; total: number; source: string };

function parseLevel(text: string): number | null {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const candidates: number[] = [];
  const patterns = [
    /(?:n[ií]vel|nivel|level)(?:\s*(?:m[aá]ximo|max|maximo))?[^0-9]{0,18}(\d{1,3})/gi,
    /(?:lv|lvl)[^0-9]{0,8}(\d{1,3})/gi
  ];

  for (const pattern of patterns) {
    for (const match of compact.matchAll(pattern)) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) candidates.push(value);
    }
  }

  // Erro comum: OCR lê "Nível 32" como "Nível 2".
  // Nível 1–9 não deve virar orçamento 2/2, 4/4 etc.
  const plausible = candidates.filter((value) => value >= 10 && value <= 99);
  if (plausible.length) return plausible[0];
  return null;
}

function collectTrainingPointCandidates(text: string): TrainingPointCandidate[] {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const candidates: TrainingPointCandidate[] = [];

  const directPatterns = [
    /(?:pontos|points)\s*(?:usados|used|da\s*ficha|ficha)?\s*[:\-]?\s*(\d{1,3})\s*[\/\\]\s*(\d{1,3})/gi,
    /(?:training\s*points|progression\s*points)\s*[:\-]?\s*(\d{1,3})\s*[\/\\]\s*(\d{1,3})/gi
  ];

  for (const pattern of directPatterns) {
    for (const match of compact.matchAll(pattern)) {
      const used = Number(match[1]);
      const total = Number(match[2]);
      if (Number.isFinite(total)) candidates.push({ used: Number.isFinite(used) ? used : null, total, source: 'OCR_RATIO' });
    }
  }

  const totalPatterns = [
    /(?:pontos|points)\s*(?:totais|total|dispon[ií]veis|da\s*ficha|ficha)?\s*[:\-]?\s*(\d{1,3})/gi,
    /(?:training\s*points|progression\s*points)\s*[:\-]?\s*(\d{1,3})/gi
  ];

  for (const pattern of totalPatterns) {
    for (const match of compact.matchAll(pattern)) {
      const total = Number(match[1]);
      if (Number.isFinite(total)) candidates.push({ used: null, total, source: 'OCR_TOTAL' });
    }
  }

  return candidates;
}

function parseTrainingPoints(text: string, inferredPoints: number | null): { used: number | null; total: number | null; ignoredReason?: string } {
  const candidates = collectTrainingPointCandidates(text);
  if (!candidates.length) return { used: null, total: null };

  // Correção definitiva do 2/2: nenhum valor abaixo de 20 é orçamento real de ficha.
  // Esses números pequenos quase sempre vêm de boosters, estrelas, ícones ou OCR quebrado.
  const hardMinimum = MIN_AUTO_TRAINING_BUDGET;
  const hardMaximum = MAX_AUTO_TRAINING_BUDGET;
  const valid = candidates
    .filter((candidate) => candidate.total >= hardMinimum && candidate.total <= hardMaximum)
    .filter((candidate) => {
      if (!inferredPoints || inferredPoints < hardMinimum) return true;
      const minimumPlausible = Math.max(hardMinimum, Math.floor(inferredPoints * 0.55));
      const maximumPlausible = Math.ceil(inferredPoints * 1.45);
      return candidate.total >= minimumPlausible && candidate.total <= maximumPlausible;
    })
    .sort((a, b) => b.total - a.total);

  if (!valid.length) {
    const first = candidates[0];
    return {
      used: null,
      total: null,
      ignoredReason: `Pontos OCR ${first.used ?? first.total}/${first.total} descartados; valor inválido para ficha de jogador.`
    };
  }

  const selected = valid[0];
  const safeUsed = Number.isFinite(selected.used ?? NaN) && selected.used !== null && selected.used >= 0 && selected.used <= selected.total
    ? selected.used
    : null;
  return { used: safeUsed, total: selected.total };
}

function inferTrainingPointsFromLevel(level?: number | null): number | null {
  if (!Number.isFinite(level ?? NaN)) return null;
  const safeLevel = Number(level);
  // Níveis muito baixos ou muito altos quase sempre são ruído do OCR.
  // Para eFHUB/eFootBase, cartas de jogador lidas por print normalmente ficam nessa faixa.
  if (safeLevel < 10 || safeLevel > 45) return null;
  const points = (safeLevel - 1) * 2;
  if (points < MIN_AUTO_TRAINING_BUDGET || points > MAX_AUTO_TRAINING_BUDGET) return null;
  return points;
}


type ManualBudgetOverride = { total: number; sourceText: string } | null;

function manualBlockScope(text: string): string {
  const match = text.match(/\[AJUSTES MANUAIS\]([\s\S]*?)\[FIM AJUSTES\]/i);
  if (match?.[1]) return match[1];
  return text.split(/\r?\n/).slice(0, 24).join('\n');
}

function parseManualTrainingBudget(text: string): ManualBudgetOverride {
  const scope = normalize(manualBlockScope(text)).replace(/\r?\n/g, ' ');
  const totalPatterns = [
    /(?:pontos\s*(?:totais|total|dispon[ií]veis|de\s*progresso|progressao|progressão)|progression\s*points|training\s*points)\s*[:=\-]?\s*(\d{1,3})/i,
    /(?:or[cç]amento\s*(?:manual|de\s*pontos))\s*[:=\-]?\s*(\d{1,3})/i
  ];
  for (const pattern of totalPatterns) {
    const match = scope.match(pattern);
    if (!match?.[1]) continue;
    const total = Number(match[1]);
    if (Number.isFinite(total) && total >= MIN_AUTO_TRAINING_BUDGET && total <= MAX_AUTO_TRAINING_BUDGET) {
      return { total: Math.round(total), sourceText: `pontos informados manualmente: ${Math.round(total)}` };
    }
  }

  const levelMatch = scope.match(/(?:n[ií]vel|nivel|level)(?:\s*(?:m[aá]ximo|max|maximo))?\s*[:=\-]?\s*(\d{1,3})/i);
  if (levelMatch?.[1]) {
    const level = Number(levelMatch[1]);
    const inferred = inferTrainingPointsFromLevel(level);
    if (inferred && inferred >= MIN_AUTO_TRAINING_BUDGET && inferred <= MAX_AUTO_TRAINING_BUDGET) {
      return { total: inferred, sourceText: `nível máximo manual ${level}: ${inferred} pontos` };
    }
  }

  return null;
}

function resolveTrainingPointBudget(
  parsedPoints: { used: number | null; total: number | null; ignoredReason?: string },
  inferredPoints: number | null,
  trainingAllocationPoints: number | null,
  manualBudget: ManualBudgetOverride
): { used: number; total: number; source: 'MANUAL' | 'TRAINING_READ' | 'OCR' | 'LEVEL_INFERRED' | 'FALLBACK'; warning?: string } {
  // Prioridade máxima: o que o usuário digitou na Auditoria Elite.
  // Se o usuário informou nível máximo ou pontos de progresso, o app deve recalcular a ficha por esse orçamento,
  // mesmo que o OCR tenha lido uma ficha automática diferente no print.
  if (manualBudget && manualBudget.total >= MIN_AUTO_TRAINING_BUDGET && manualBudget.total <= MAX_AUTO_TRAINING_BUDGET) {
    return { used: manualBudget.total, total: manualBudget.total, source: 'MANUAL', warning: parsedPoints.ignoredReason };
  }

  // Regra v6 local: se o print trouxe a ficha automática já distribuída, o app soma o custo real dela.
  // Esse é o orçamento mais confiável porque usa os próprios níveis de treino visíveis no print.
  if (trainingAllocationPoints && trainingAllocationPoints >= MIN_AUTO_TRAINING_BUDGET && trainingAllocationPoints <= MAX_AUTO_TRAINING_BUDGET) {
    return {
      used: trainingAllocationPoints,
      total: trainingAllocationPoints,
      source: 'TRAINING_READ',
      warning: parsedPoints.ignoredReason
    };
  }

  if (inferredPoints && inferredPoints >= MIN_AUTO_TRAINING_BUDGET && inferredPoints <= MAX_AUTO_TRAINING_BUDGET) {
    return {
      used: inferredPoints,
      total: inferredPoints,
      source: 'LEVEL_INFERRED',
      warning: parsedPoints.ignoredReason
    };
  }

  // OCR de pontos diretos fica como terceira opção. Nunca aceita 2/2, 116/116 ou número fora do teto.
  if (parsedPoints.total && parsedPoints.total >= MIN_AUTO_TRAINING_BUDGET && parsedPoints.total <= MAX_AUTO_TRAINING_BUDGET) {
    const safeTotal = normalizeTrainingBudget(parsedPoints.total);
    const safeUsed = parsedPoints.used !== null && Number.isFinite(parsedPoints.used) && parsedPoints.used >= MIN_AUTO_TRAINING_BUDGET && parsedPoints.used <= safeTotal
      ? parsedPoints.used
      : safeTotal;
    return { used: safeUsed, total: safeTotal, source: 'OCR', warning: parsedPoints.ignoredReason };
  }

  return {
    used: SAFE_DEFAULT_TRAINING_BUDGET,
    total: SAFE_DEFAULT_TRAINING_BUDGET,
    source: 'FALLBACK',
    warning: parsedPoints.ignoredReason ?? 'Não encontrei plano distribuído nem nível máximo com segurança; usando orçamento competitivo padrão de 64 pontos.'
  };
}

export function parseCard(rawText: string, imageFileName?: string | null): ParsedCard {
  const text = rawText || '';
  const identitySection = extractOcrSection(text, 'IDENTIDADE DA CARTA') ?? '';
  const badgeSection = extractOcrSection(text, 'CARD BADGE') ?? '';
  const topSection = extractOcrSection(text, 'TOPO DA CARTA') ?? '';
  const firstLines = text.split(/\r?\n/).slice(0, 60).join('\n');
  const manualLockText = text.split(/\r?\n/).slice(0, 12).join('\n');
  const identityText = [manualLockText, badgeSection, identitySection, firstLines].filter(Boolean).join('\n');
  const headerOnlyText = [manualLockText, badgeSection, identitySection].filter(Boolean).join('\n') || identityScope(text);
  const attributes = parseAttributes(text);
  const positionRatings = detectPositionRatings(text);
  const positions = Array.from(new Set([...detectPositions(text), ...(Object.keys(positionRatings) as PositionCode[])]));
  const allNumbers = [...text.matchAll(/\b(\d{2,3})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 40 && value <= 110);
  const ratingValues = Object.values(positionRatings).filter((v): v is number => Number.isFinite(v));
  const readOverallValue = readNumber(text, [/overall\s*(?:base|inicial)?\s*(\d{2,3})/i, /\bovr\s*(\d{2,3})/i]);
  const safeReadOverall = readOverallValue && readOverallValue >= 40 && readOverallValue <= 110 ? readOverallValue : null;
  const overall = safeReadOverall ?? (ratingValues.sort((a, b) => b - a)[0] ?? allNumbers.find((value) => value >= 80 && value <= 110) ?? null);
  const readMaxOverallValue = readNumber(text, [/overall\s*(?:m[aá]x(?:imo)?|max)\s*(\d{2,3})/i, /max\s*overall\s*(\d{2,3})/i]);
  const safeReadMaxOverall = readMaxOverallValue && readMaxOverallValue >= 40 && readMaxOverallValue <= 110 ? readMaxOverallValue : null;
  const maxOverall = safeReadMaxOverall ?? (ratingValues.sort((a, b) => b - a)[0] ?? allNumbers.filter((value) => value >= 80 && value <= 110).sort((a, b) => b - a)[0] ?? overall);
  const identityName = detectName(identityText, imageFileName);
  const playerName = identityName !== 'Jogador não identificado' ? identityName : detectName(text, imageFileName);
  const localRule = findLocalCardRule(playerName, text);
  const rawPlaystyle = detectPlaystyle(headerOnlyText) ?? detectPlaystyle(topSection) ?? localRule?.playstyle ?? null;
  const explicitMainPosition = detectExplicitMainPosition(headerOnlyText);
  const primaryPositionFromCard = detectCardBadgePosition(badgeSection) ?? detectCardBadgePosition(identitySection) ?? detectPrimaryPositionFromTop(headerOnlyText);
  const manualPositionLocked = hasPositionLock(manualLockText);
  const manualPlaystyleLocked = hasPlaystyleLock(manualLockText);
  const manualConfirmed = hasManualConfirmation(text);
  const mainCandidate = explicitMainPosition ?? (!manualPositionLocked ? localRule?.mainPosition : null) ?? primaryPositionFromCard ?? detectMainPosition(positions, positionRatings, attributes, rawPlaystyle);
  // Identidade da carta: a posição mostrada no card nunca deve ser trocada pelo motor de gameplay.
  // A melhor posição recomendada pode mudar abaixo, mas a arte/resumo da carta preserva o que veio no print.
  const mainPosition = mainCandidate;
  const playstyle = resolvePlaystyleForCard(rawPlaystyle, mainPosition, headerOnlyText + '\n' + topSection + '\n' + identityText) ?? (!manualPlaystyleLocked && localRule?.playstyle && playstyleFitsPosition(localRule.playstyle, mainPosition) ? localRule.playstyle : null);
  const detectedPositions = Array.from(new Set([mainPosition, ...positions]));
  const nativeSkills = detectSkills(text);
  const specialSkills = nativeSkills.filter((skill) => SPECIAL_SKILL_NAMES.includes(skill));
  const height = readNumber(text, [/altura\s*(\d{3})\s*cm/i, /height\s*(\d{3})\s*cm/i]);
  const weight = readNumber(text, [/peso\s*(\d{2,3})\s*kg/i, /weight\s*(\d{2,3})\s*kg/i]);
  const age = readNumber(text, [/idade\s*(\d{1,2})/i, /age\s*(\d{1,2})/i]);
  const level = parseLevel(text);
  const autoTraining = parseTrainingAllocation(text);
  const inferredPoints = inferTrainingPointsFromLevel(level);
  const parsedPoints = parseTrainingPoints(text, inferredPoints);
  const manualBudget = parseManualTrainingBudget(text);
  const pointBudget = resolveTrainingPointBudget(parsedPoints, inferredPoints, autoTraining?.points ?? null, manualBudget);
  const trainingPointsTotal = pointBudget.total;
  const trainingPointsUsed = pointBudget.used;
  const trainingPointSource: ParsedCard['trainingPointSource'] = pointBudget.source;
  const specialTag = detectSpecialTag(text);
  const cardType = detectCardType(text);
  const country = text.match(/\b(Argentina|Brasil|Brazil|França|France|Portugal|Espanha|Spain|Inglaterra|England|Alemanha|Germany|Itália|Italy|Holanda|Netherlands|Países Baixos|Uruguai|Uruguay)\b/i)?.[1] ?? null;
  const dominantFoot = /p[eé]\s+esquerdo|left\s+foot/i.test(text) ? 'Esquerdo' : /p[eé]\s+direito|right\s+foot/i.test(text) ? 'Direito' : null;
  const condition = parseCondition(text);
  const physicalProfile = parsePhysicalProfile(text);
  const impetos = parseImpetos(text);
  const attributeCount = Object.keys(attributes).length;
  const modelCount = Object.values(physicalProfile).filter((value) => Number.isFinite(value)).length;
  let confidence = 18;
  if (playerName !== 'Jogador não identificado') confidence += 14;
  if (detectedPositions.length > 0) confidence += 10;
  if (ratingValues.length >= 3) confidence += 12;
  if (overall || maxOverall) confidence += 8;
  if (playstyle) confidence += 8;
  confidence += Math.min(24, attributeCount * 1.6);
  confidence += Math.min(8, nativeSkills.length);
  confidence += Math.min(8, modelCount);
  confidence += Math.min(6, impetos.length * 2);
  const warnings: string[] = [];
  warnings.push('Posições convertidas automaticamente para PT-BR: CF→CA, DMF→VOL, CMF→MLG, CB→ZAG, LB→LE, RB→LD, AMF→MAT, LWF→PE, RWF→PD.');
  warnings.push(`Identidade preservada: a arte da carta usa ${POSITION_PT[mainPosition]}${playstyle ? ` + ${playstyle}` : ''} lidos do print. Recomendações de desempenho em campo aparecem separadas abaixo.`);
  if (localRule && !manualPositionLocked) warnings.push(`${localRule.note} Banco local aplicado: melhores posições ${listLabels(localRule.bestPositions)}; evitar ${listLabels(localRule.avoidPositions)}.`);
  if (manualConfirmed) warnings.push('Conferência manual marcada como SIM: o app gerou a ficha final com os dados revisados pelo usuário.');
  if (attributeCount < 12) warnings.push('O OCR local leu poucos atributos. O app usou motor seguro por posição, mas quanto mais atributos lidos, melhor fica a ficha.');
  if (!explicitMainPosition && !primaryPositionFromCard) warnings.push('A posição original não foi lida com alta confiança no badge da carta. O app usou fallback seguro; confirme no campo Dados lidos antes de copiar a ficha.');
  if (!playstyle && rawPlaystyle) warnings.push(`Estilo OCR "${rawPlaystyle}" descartado porque não combina com a posição original ${POSITION_PT[mainPosition]}. A carta não foi alterada com estilo suspeito.`);
  if (!playstyle) warnings.push('O estilo de jogo não foi lido com alta confiança no topo da carta. A recomendação foi gerada sem alterar a identidade visual.');
  if (Object.keys(positionRatings).length < 4) warnings.push('A grade de posições não foi lida por completo. O app preservou a identidade lida no topo da carta e usou a função real só para recomendar a melhor posição abaixo.');
  if (!overall && !maxOverall) warnings.push('GER não identificado. O programa estimou a análise pela posição e atributos lidos.');
  if (trainingPointSource === 'MANUAL') warnings.push(`Orçamento manual aplicado pela Auditoria Elite: ${trainingPointsTotal} pontos. A ficha foi recalculada usando esse limite.`);
  if (trainingPointSource === 'TRAINING_READ') warnings.push(`Orçamento de pontos identificado pela ficha automática visível no print: ${trainingPointsTotal} pontos.`);
  if (trainingPointSource === 'LEVEL_INFERRED') warnings.push(`Orçamento de pontos calculado pelo nível máximo ${level}: ${trainingPointsTotal} pontos.`);
  if (trainingPointSource === 'FALLBACK') warnings.push(pointBudget.warning ?? 'Pontos e nível não foram lidos com segurança; usando orçamento competitivo padrão de 64 pontos.');
  if (pointBudget.warning && trainingPointSource !== 'FALLBACK') warnings.push(pointBudget.warning);
  const id = `${slug(playerName)}-${slug(cardType)}-${slug(specialTag ?? playstyle ?? mainPosition)}-${maxOverall ?? overall ?? 'sem-ovr'}`;
  const bestRating = Math.max(0, ...Object.values(positionRatings).filter((value): value is number => Number.isFinite(value)));
  const usablePositions = detectedPositions.length
    ? Array.from(new Set([mainPosition, ...detectedPositions]))
        .filter((position) => {
          if (position === mainPosition) return true;
          const rating = Number(positionRatings[position] ?? 0);
          if (position === 'GK' && mainPosition !== 'GK') return false;
          if (rating > 0) return rating >= 75 && (!bestRating || rating >= bestRating - 18);
          return false;
        })
        .sort((left, right) => {
          const leftWeight = gameplayPositionWeight(left, mainPosition, playstyle) + Number(positionRatings[left] ?? 0) * 0.15;
          const rightWeight = gameplayPositionWeight(right, mainPosition, playstyle) + Number(positionRatings[right] ?? 0) * 0.15;
          return rightWeight - leftWeight;
        })
    : [mainPosition];

  return {
    playerName,
    cardType,
    specialTag,
    country,
    mainPosition,
    mainPositionPt: POSITION_PT[mainPosition],
    positions: usablePositions,
    positionsPt: usablePositions.map((position) => POSITION_PT[position]),
    positionRatings,
    playstyle,
    dominantFoot,
    overall,
    maxOverall,
    height,
    weight,
    age,
    level,
    trainingPointsTotal,
    trainingPointsUsed,
    trainingPointSource,
    autoTrainingPlan: autoTraining?.plan ?? null,
    autoTrainingPoints: autoTraining?.points ?? null,
    condition,
    impetos,
    nativeSkills,
    specialSkills,
    attributes,
    physicalProfile,
    manualConfirmed,
    evidence: {
      positionLocked: manualPositionLocked,
      playstyleLocked: manualPlaystyleLocked,
      attributeCount,
      positionRatingsCount: Object.keys(positionRatings).length,
      localRuleMatched: localRule?.id ?? null
    },
    internalId: id,
    confidence: Math.max(1, Math.min(100, Math.round(confidence))),
    warnings
  };
}


function impossiblePositionReason(position: PositionCode, parsed: ParsedCard, a: Required<Attributes>): string | null {
  const style = styleText(parsed.playstyle);
  const main = parsed.mainPosition;
  const localRule = findLocalCardRule(parsed.playerName, '');
  const coreStyleReason = isImpossibleByCoreStyle(position, main, parsed.playstyle);
  if (coreStyleReason) return coreStyleReason;

  if (localRule?.avoidPositions.includes(position)) return `Banco local recomenda evitar para esta carta; melhores opções: ${listLabels(localRule.bestPositions)}.`;
  if (main !== 'GK' && position === 'GK') return 'Jogador de linha não deve ser tratado como goleiro.';
  if (main === 'GK' && position !== 'GK') return 'Goleiro não deve ser tratado como jogador de linha.';

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) {
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') return 'Estilo defensivo/volante não combina com ataque aberto ou centroavante.';
    if ((position === 'LB' || position === 'RB') && main !== 'LB' && main !== 'RB') return 'Destruidor central costuma render melhor como VOL/MLG/ZAG do que lateral.';
  }

  if (/homem de area|fox in the box|pivo|target man|atacante matador|artilheiro|goal poacher/.test(style)) {
    if (position === 'CB' || position === 'DMF' || position === 'LB' || position === 'RB') return 'Estilo de atacante de área não combina com posição defensiva.';
  }

  if (/lateral ofensivo|lateral defensivo|lateral atacante|full/.test(style)) {
    if (position === 'CF' || position === 'SS' || position === 'GK') return 'Lateral não deve ser convertido para atacante/goleiro por erro de OCR.';
  }

  if (position === 'CF' && a.finishing < 72 && a.offensiveAwareness < 74) return 'Atributos ofensivos baixos para centroavante.';
  if ((position === 'CB' || position === 'DMF') && a.defensiveAwareness < 70 && a.tackling < 70) return 'Atributos defensivos baixos para função defensiva.';
  if ((position === 'LWF' || position === 'RWF') && a.dribbling < 72 && a.speed < 76) return 'Falta drible/velocidade para ponta.';
  return null;
}

function buildAvoidPositions(parsed: ParsedCard, attributes: Required<Attributes>) {
  return ALL_POSITIONS
    .map((code) => ({ code, label: POSITION_PT[code], reason: impossiblePositionReason(code, parsed, attributes) }))
    .filter((item): item is { code: PositionCode; label: string; reason: string } => Boolean(item.reason))
    .slice(0, 8);
}

function buildPermittedPositions(parsed: ParsedCard, scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>) {
  return scored.map((item, index) => ({
    code: item.code,
    label: item.label,
    rating: item.cardRating ?? null,
    reason: index === 0
      ? 'Melhor posição de rendimento real calculada por função, atributos e estilo.'
      : item.cardRating
        ? `Compatível no print, com nota lida ${item.cardRating}.`
        : 'Compatível por função/estilo, sem depender de GER.'
  }));
}

function validateAnalysis(
  parsed: ParsedCard,
  selected: { code: PositionCode; label: string; score: number; role: string; cardRating?: number | null },
  scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>,
  attributes: Required<Attributes>,
  avoidPositions: Array<{ code: PositionCode; label: string; reason: string }>,
  explicitTarget = false
): PrecisionValidation {
  const issues: PrecisionIssue[] = [];
  const confirmed = parsed.manualConfirmed;
  const push = (severity: PrecisionIssue['severity'], code: string, message: string) => issues.push({ severity, code, message });

  if (!parsed.evidence.positionLocked && parsed.confidence < 70) push('block', 'POSITION_REVIEW', 'Confiança baixa/média: confirme a posição principal antes da ficha final.');
  if (!parsed.playstyle && !parsed.evidence.playstyleLocked) push('block', 'PLAYSTYLE_REVIEW', 'Estilo de jogo não foi lido com segurança: confirme manualmente para evitar ficha errada.');
  if (parsed.evidence.attributeCount < 8) push('block', 'ATTRIBUTES_REVIEW', 'Poucos atributos foram lidos: revise/corrija atributos importantes antes de confirmar.');
  else if (parsed.evidence.attributeCount < 12) push('review', 'ATTRIBUTES_PARTIAL', 'Atributos parcialmente lidos: a ficha fica melhor se você revisar os valores principais.');
  if (parsed.trainingPointSource === 'FALLBACK') push('block', 'POINTS_REVIEW', 'Pontos/nível máximo não foram confirmados; revise o orçamento de pontos antes da ficha final.');
  if (parsed.evidence.positionRatingsCount < 2) push('review', 'POSITION_GRID_PARTIAL', 'Grade de posições pouco lida; o ranking usa regras de rendimento real e deve ser conferido.');

  const avoid = avoidPositions.find((item) => item.code === selected.code);
  if (avoid) {
    if (explicitTarget) push('review', 'TARGET_CONVERSION', `Você escolheu ${POSITION_PT[selected.code]}. A ficha foi recalculada para essa posição. Avaliação da adaptação: ${avoid.reason} A decisão final é sempre sua.`);
    else push('review', 'POSITION_ADVISORY', `O motor recomenda cautela em ${POSITION_PT[selected.code]}: ${avoid.reason}`);
  }
  if (scored.length === 0) push('block', 'NO_POSITION', 'Nenhuma posição válida foi calculada com segurança.');

  const hasBlocking = issues.some((issue) => issue.severity === 'block');
  const hasReview = issues.some((issue) => issue.severity === 'review');
  return {
    confirmed,
    canGenerate: confirmed || !hasBlocking,
    level: confirmed || !hasBlocking ? (hasReview ? 'review' : 'safe') : 'blocked',
    issues: issues.length ? issues : [{ severity: 'ok', code: 'SAFE', message: 'Dados suficientes para gerar ficha com segurança.' }]
  };
}


function chooseGameplaySelectedPosition(parsed: ParsedCard, scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>): PositionCode {
  const best = scored[0];
  if (!best) return parsed.mainPosition;

  const preferred = gameplayPriorityByMainPosition(parsed.mainPosition, parsed.playstyle)
    .filter((code) => parsed.positions.includes(code))
    .map((code) => scored.find((item) => item.code === code))
    .filter((item): item is { code: PositionCode; label: string; score: number; role: string; cardRating?: number | null } => Boolean(item));

  // O estilo orienta, mas não prende cegamente. Se outra posição tiver desempenho real maior, ela vence.
  const strongPreferred = preferred.find((item) => item.score >= best.score - 4);
  if (strongPreferred) return strongPreferred.code;
  return best.code;
}

function tacticalScoreBonus(position: PositionCode, profile: TacticalProfile, a: Required<Attributes>) {
  let bonus = 0;
  const managerFactor = profile.managerProficiency ? Math.max(0.92, Math.min(1.12, 1 + (profile.managerProficiency - 85) * 0.018)) : 1;
  if (profile.formation === '4-2-2-2') {
    if (position === 'DMF') bonus += 6;
    if (position === 'CMF') bonus += 4;
    if (position === 'AMF' || position === 'SS') bonus += 3;
    if (position === 'LWF' || position === 'RWF') bonus -= 4;
  }
  if (profile.formation === '4-3-3') {
    if (position === 'LWF' || position === 'RWF') bonus += 5;
    if (position === 'CF') bonus += 3;
    if (position === 'CMF' || position === 'DMF') bonus += 3;
  }
  if (profile.formation === '4-1-2-3') {
    if (position === 'DMF') bonus += 5;
    if (position === 'AMF' || position === 'CMF') bonus += 4;
    if (position === 'LWF' || position === 'RWF') bonus += 3;
  }
  if (profile.formation === '4-2-1-3') {
    if (position === 'DMF' || position === 'CMF') bonus += 5;
    if (position === 'AMF') bonus += 4;
    if (position === 'LWF' || position === 'RWF' || position === 'CF') bonus += 3;
  }
  if (profile.formation === '4-2-3-1') {
    if (position === 'DMF' || position === 'CMF') bonus += 5;
    if (position === 'AMF' || position === 'LMF' || position === 'RMF') bonus += 4;
    if (position === 'CF') bonus += 3;
  }
  if (profile.formation === '4-3-1-2') {
    if (position === 'AMF') bonus += 5;
    if (position === 'CMF' || position === 'DMF') bonus += 4;
    if (position === 'CF' || position === 'SS') bonus += 3;
    if (position === 'LWF' || position === 'RWF') bonus -= 3;
  }
  if (profile.formation === '4-1-3-2') {
    if (position === 'DMF') bonus += 5;
    if (position === 'AMF' || position === 'LMF' || position === 'RMF') bonus += 4;
    if (position === 'CF' || position === 'SS') bonus += 3;
  }
  if (profile.formation === '4-4-2') {
    if (position === 'CMF' || position === 'DMF') bonus += 4;
    if (position === 'LMF' || position === 'RMF') bonus += 4;
    if (position === 'CF' || position === 'SS') bonus += 3;
  }
  if (profile.formation === '4-1-4-1') {
    if (position === 'DMF') bonus += 6;
    if (position === 'CMF' || position === 'LMF' || position === 'RMF') bonus += 4;
    if (position === 'CF') bonus += 2;
  }
  if (profile.formation === '3-2-4-1') {
    if (position === 'CB' || position === 'DMF') bonus += 5;
    if (position === 'LMF' || position === 'RMF' || position === 'AMF') bonus += 4;
  }
  if (profile.formation === '3-4-3') {
    if (position === 'CB') bonus += 5;
    if (position === 'LMF' || position === 'RMF') bonus += 5;
    if (position === 'LWF' || position === 'RWF' || position === 'CF') bonus += 3;
  }
  if (profile.formation === '3-5-2') {
    if (position === 'CB' || position === 'DMF' || position === 'CMF') bonus += 5;
    if (position === 'LMF' || position === 'RMF') bonus += 4;
    if (position === 'CF' || position === 'SS') bonus += 3;
  }
  if (profile.formation === '5-3-2') {
    if (position === 'CB' || position === 'LB' || position === 'RB') bonus += 5;
    if (position === 'DMF' || position === 'CMF') bonus += 4;
    if (position === 'CF' || position === 'SS') bonus += 2;
  }
  if (profile.formation === '5-2-3') {
    if (position === 'LB' || position === 'RB' || position === 'CB') bonus += 5;
    if (position === 'DMF' || position === 'CMF') bonus += 3;
    if (position === 'LWF' || position === 'RWF' || position === 'CF') bonus += 4;
  }

  if (profile.style === 'POSSE_DE_BOLA') bonus += Math.max(0, Math.max(a.lowPass, a.ballControl) - 75) * 0.06;
  if (profile.style === 'CONTRA_ATAQUE') bonus += Math.max(0, Math.max(a.loftedPass, a.physicalContact) - 74) * 0.05 + Math.max(0, a.stamina - 74) * 0.03;
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO') bonus += Math.max(0, Math.max(a.speed, a.acceleration) - 76) * 0.07 + Math.max(0, a.lowPass - 74) * 0.03;
  if (profile.style === 'POR_FORA') bonus += Math.max(0, Math.max(a.loftedPass, a.speed) - 74) * 0.06 + Math.max(0, a.stamina - 74) * 0.03;
  if (profile.style === 'PASSE_LONGO') bonus += Math.max(0, a.loftedPass - 74) * 0.07 + Math.max(0, Math.max(a.heading, a.physicalContact) - 74) * 0.04;
  if (profile.managerProficiency) bonus *= managerFactor;
  return bonus;
}

function tacticalProfileTips(profile: TacticalProfile, selected: PositionCode) {
  const tips: string[] = [];
  if (profile.managerName && profile.managerProficiency) tips.push(`Técnico selecionado: ${profile.managerName} (${profile.managerProficiency}). A proficiência refina a ficha, mas nunca substitui a posição escolhida por você.`);
  if (profile.formation === '4-2-2-2') tips.push('Formação 4-2-2-2: dois meias por dentro e dupla de ataque; valoriza VOL/MLG fortes para roubar, tocar rápido e proteger a defesa.');
  if (profile.formation === '4-3-3') tips.push('Formação 4-3-3: usa pontas abertos, centroavante de referência e meio com boa cobertura para acelerar pelos lados.');
  if (profile.formation === '4-1-2-3') tips.push('Formação 4-1-2-3: exige um VOL confiável e dois meias com passe/giro para ligar defesa e ataque.');
  if (profile.formation === '4-2-1-3') tips.push('Formação 4-2-1-3: dois volantes protegem, o MAT acelera a transição e os três atacantes atacam espaço.');
  if (profile.formation === '4-2-3-1') tips.push('Formação 4-2-3-1: segura por dentro, cria com três meias e precisa de CA forte para prender zagueiros.');
  if (profile.formation === '4-3-1-2') tips.push('Formação 4-3-1-2: compacta por dentro, com MAT servindo dois atacantes; laterais precisam dar amplitude.');
  if (profile.formation === '4-1-3-2') tips.push('Formação 4-1-3-2: boa para pressionar e atacar em dupla; o VOL precisa cobrir as costas dos meias.');
  if (profile.formation === '4-4-2') tips.push('Formação 4-4-2: equilibrada, boa para bloco médio, cruzamentos e ataque com dois homens na área.');
  if (profile.formation === '4-1-4-1') tips.push('Formação 4-1-4-1: forte para posse segura e pressão organizada; o CA precisa finalizar poucas chances.');
  if (profile.formation === '3-2-4-1') tips.push('Formação 3-2-4-1: pede cobertura forte por dentro e alas/meias que voltem para marcar.');
  if (profile.formation === '3-4-3') tips.push('Formação 3-4-3: agressiva pelos lados; alas precisam de fôlego e os três zagueiros precisam cobrir profundidade.');
  if (profile.formation === '3-5-2') tips.push('Formação 3-5-2: domina o meio e joga com dois atacantes; alas são essenciais para abrir campo.');
  if (profile.formation === '5-3-2') tips.push('Formação 5-3-2: segura defensivamente, boa para contra-atacar e proteger vantagem.');
  if (profile.formation === '5-2-3') tips.push('Formação 5-2-3: defesa de cinco com saída rápida para três atacantes; exige pontas velozes e laterais resistentes.');
  if (profile.style === 'POSSE_DE_BOLA') tips.push('Estilo do técnico — Posse de bola: prioriza passe curto, controle, paciência e triangulações; evite forçar bola longa sem necessidade.');
  if (profile.style === 'CONTRA_ATAQUE') tips.push('Estilo do técnico — Contra-ataque: prioriza bloco organizado, roubo e passe direto com segurança; bom para atacar quando o rival se expõe.');
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO') tips.push('Estilo do técnico — Contra-ataque rápido: aceleração, velocidade e passe vertical pesam mais na recomendação; ataque o espaço logo após recuperar.');
  if (profile.style === 'POR_FORA') tips.push('Estilo do técnico — Por fora: use laterais/alas e pontas para abrir campo, cruzar e inverter jogadas.');
  if (profile.style === 'PASSE_LONGO') tips.push('Estilo do técnico — Passe longo: valoriza passe alto, físico e jogo aéreo; use pivô, segunda bola e atacantes fortes.');
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO' && (selected === 'CF' || selected === 'SS' || selected === 'LWF' || selected === 'RWF')) tips.push('Dica prática: no contra-ataque rápido, o primeiro passe precisa achar o atacante já de frente; use Chute de primeira e Passe em profundidade antes de pensar em recomposição.');
  if (profile.style === 'POSSE_DE_BOLA' && (selected === 'CMF' || selected === 'AMF' || selected === 'SS')) tips.push('Dica prática: na posse, a carta precisa oferecer linha curta; Passe de primeira, Controle com a sola e Passe na medida valem mais que correria isolada.');
  if (profile.style === 'POR_FORA' && (selected === 'LB' || selected === 'RB' || selected === 'LWF' || selected === 'RWF' || selected === 'LMF' || selected === 'RMF')) tips.push('Dica prática: por fora rende melhor com amplitude; force 2 contra 1 no corredor, cruze rasteiro/alto e tenha um CA atacando a primeira trave.');
  if (profile.style === 'PASSE_LONGO' && (selected === 'CF' || selected === 'CB' || selected === 'DMF')) tips.push('Dica prática: no passe longo, use zagueiros/volantes com lançamento e CA com físico; priorize segunda bola e não tente driblar no meio congestionado.');
  if (selected === 'CF') tips.push('Para CA, escolha habilidade de finalização primeiro; pressão só entra como plano alternativo se o atleta for pivô ou atacante de desgaste.');
  if (selected === 'DMF') tips.push('Para VOL, proteja a entrada da área: Interceptação, Bloqueador e Passe de primeira costumam render mais que subir demais.');
  if (!tips.length) tips.push(`Perfil tático automático: a ficha foi feita para o melhor rendimento da posição ${POSITION_PT[selected]}.`);
  return tips;
}

function compareTraining(autoPlan: TrainingPlan | null | undefined, recommended: TrainingPlan): TrainingComparisonItem[] {
  return (Object.keys(TRAINING_LABELS) as TrainingKey[]).map((key) => {
    const auto = Number(autoPlan?.[key] ?? 0);
    const rec = Number(recommended[key] ?? 0);
    return { key, label: TRAINING_LABELS[key], auto, recommended: rec, difference: rec - auto };
  }).filter((item) => item.auto > 0 || item.recommended > 0 || item.difference !== 0);
}

function softenTraining(plan: TrainingPlan, position: PositionCode): TrainingPlan {
  const next = { ...plan };
  if (position === 'GK') {
    next.gk1 += 1;
    next.gk2 += 1;
    if (next.lowerBodyStrength > 0) next.lowerBodyStrength -= 1;
    next.shooting = 0;
    next.passing = 0;
    next.dribbling = 0;
    next.defending = 0;
  } else if (position === 'DMF' || position === 'CMF') {
    next.defending += 1;
    next.passing += 1;
    if (next.dribbling > 0) next.dribbling -= 1;
  } else if (position === 'CB') {
    next.defending += 1;
    next.aerialStrength += 1;
    if (next.shooting > 0) next.shooting -= 1;
  } else if (position === 'CF') {
    next.shooting += 1;
    if (next.defending > 0) next.defending -= 1;
  } else {
    next.dexterity += 1;
    if (next.aerialStrength > 0) next.aerialStrength -= 1;
  }
  return normalizeTrainingPlan(next);
}

function aggressiveTraining(plan: TrainingPlan, position: PositionCode): TrainingPlan {
  const next = { ...plan };
  if (position === 'GK') {
    next.gk2 += 1;
    next.gk3 += 1;
    if (next.aerialStrength > 0) next.aerialStrength -= 1;
    next.shooting = 0;
    next.passing = 0;
    next.dribbling = 0;
    next.defending = 0;
  } else if (position === 'DMF' || position === 'CMF') {
    next.lowerBodyStrength += 1;
    next.passing += 1;
    if (next.aerialStrength > 0) next.aerialStrength -= 1;
  } else if (position === 'CB') {
    next.lowerBodyStrength += 1;
    next.defending += 1;
    if (next.dribbling > 0) next.dribbling -= 1;
  } else if (position === 'CF' || position === 'LWF' || position === 'RWF') {
    next.shooting += 1;
    next.dexterity += 1;
    if (next.defending > 0) next.defending -= 1;
  } else {
    next.dribbling += 1;
    next.passing += 1;
    if (next.defending > 0) next.defending -= 1;
  }
  return normalizeTrainingPlan(next);
}

function adaptiveTrainingWeights(position: PositionCode, objective: Objective, a: Required<Attributes>): Record<TrainingKey, number> {
  const weights: Record<TrainingKey, number> = { shooting: .3, passing: .5, dribbling: .5, dexterity: .6, lowerBodyStrength: .6, aerialStrength: .3, defending: .3, gk1: 0, gk2: 0, gk3: 0 };
  const add = (key: TrainingKey, value: number) => { weights[key] += value; };
  if (position === 'GK') return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: .45, aerialStrength: .35, defending: 0, gk1: 2.2, gk2: 2.35, gk3: 2.1 };
  if (position === 'CB') { add('defending', 2.4); add('aerialStrength', a.heading < 80 || a.jump < 80 ? 1.4 : .8); add('lowerBodyStrength', a.speed < 80 ? 1.35 : .85); add('passing', a.lowPass >= 76 ? .55 : .15); }
  if (position === 'DMF') { add('defending', 2.0); add('passing', 1.25); add('lowerBodyStrength', 1.15); add('dexterity', .35); }
  if (position === 'CMF') { add('passing', 1.8); add('lowerBodyStrength', 1.0); add('dexterity', .8); add('dribbling', .65); add('defending', .65); }
  if (position === 'AMF') { add('passing', 1.8); add('dribbling', 1.35); add('dexterity', 1.1); add('shooting', .75); }
  if (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') { add('lowerBodyStrength', 1.5); add('passing', 1.05); add('dexterity', 1.0); add('defending', position === 'LB' || position === 'RB' ? .95 : .4); add('dribbling', .7); }
  if (position === 'LWF' || position === 'RWF') { add('dribbling', 1.75); add('dexterity', 1.55); add('lowerBodyStrength', 1.2); add('shooting', .9); add('passing', .55); }
  if (position === 'SS') { add('dexterity', 1.5); add('shooting', 1.25); add('dribbling', 1.15); add('passing', 1.0); add('lowerBodyStrength', .75); }
  if (position === 'CF') { add('shooting', 2.15); add('dexterity', 1.3); add('lowerBodyStrength', 1.15); add('aerialStrength', a.heading >= 78 || a.physicalContact >= 82 ? .95 : .35); add('dribbling', .45); }
  if (objective === 'DEFENSIVE') { add('defending', .55); add('aerialStrength', .2); }
  if (objective === 'CREATOR') { add('passing', .55); add('dribbling', .35); }
  return weights;
}

function adaptivePlanScore(plan: TrainingPlan, position: PositionCode, objective: Objective, a: Required<Attributes>, budget: number) {
  const weights = adaptiveTrainingWeights(position, objective, a);
  const used = trainingPlanTotalCost(plan);
  let value = 0;
  let waste = 0;
  for (const key of Object.keys(plan) as TrainingKey[]) {
    const level = plan[key];
    const saturationStart = key === 'defending' && (position === 'CB' || position === 'DMF') ? 12 : key === 'shooting' && position === 'CF' ? 12 : 10;
    const effectiveLevel = Math.min(level, saturationStart) + Math.max(0, level - saturationStart) * 0.35;
    value += effectiveLevel * weights[key];
    if (weights[key] <= .35 && level > 3) waste += (level - 3) * 1.4;
    if (level > saturationStart) waste += (level - saturationStart) * 1.15;
  }
  const unused = Math.max(0, budget - used);
  const efficiency = used > 0 ? value / used : 0;
  return value * 5.2 + efficiency * 18 - waste * 4 - unused * .18;
}

function adaptationAssessment(position: PositionCode, parsed: ParsedCard, a: Required<Attributes>) {
  const score = clampDecimal(positionScore(position, a, parsed.nativeSkills, parsed.positionRatings), 1, 100);
  if (score >= 82) return { label: 'Adaptação excelente', risk: 'Poucas limitações estruturais para a posição escolhida.' };
  if (score >= 72) return { label: 'Adaptação boa', risk: 'A ficha corrige as principais lacunas sem descaracterizar o jogador.' };
  if (score >= 60) return { label: 'Adaptação razoável', risk: 'Pode render bem, mas ainda terá limitações naturais em alguns confrontos.' };
  return { label: 'Adaptação difícil', risk: 'A posição foi respeitada, porém existem limitações naturais que treino nenhum elimina por completo.' };
}

function planBalanceScore(plan: TrainingPlan, keys: TrainingKey[]) {
  const active = keys.map((key) => plan[key]).filter((value) => value > 0);
  if (!active.length) return 1;
  const average = active.reduce((sum, value) => sum + value, 0) / active.length;
  const variance = active.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / active.length;
  return Math.round(clampDecimal(100 - Math.sqrt(variance) * 8.5, 1, 99));
}

function scenarioScores(plan: TrainingPlan, position: PositionCode, objective: Objective) {
  const n = (key: TrainingKey) => Number(plan[key] ?? 0);
  const scale = (raw: number) => Math.round(clampDecimal(42 + raw * 4.6, 1, 99));
  const goalkeeper = position === 'GK';
  if (goalkeeper) {
    return {
      possession: scale(n('gk1') * .45 + n('lowerBodyStrength') * .25 + n('gk3') * .3),
      counterAttack: scale(n('gk2') * .4 + n('gk3') * .35 + n('lowerBodyStrength') * .25),
      pressing: scale(n('gk2') * .55 + n('gk1') * .25 + n('lowerBodyStrength') * .2),
      physicalDuels: scale(n('gk1') * .35 + n('gk3') * .35 + n('aerialStrength') * .3),
      consistency: scale(n('gk1') * .34 + n('gk2') * .33 + n('gk3') * .33)
    };
  }
  const defensive = position === 'CB' || position === 'DMF' || position === 'LB' || position === 'RB';
  const attacking = position === 'CF' || position === 'SS' || position === 'LWF' || position === 'RWF' || position === 'AMF';
  return {
    possession: scale(n('passing') * .38 + n('dribbling') * .25 + n('dexterity') * .2 + n('lowerBodyStrength') * .1 + n('defending') * .07),
    counterAttack: scale(n('lowerBodyStrength') * .32 + n('dexterity') * .28 + n('shooting') * (attacking ? .24 : .08) + n('passing') * .16),
    pressing: scale(n('lowerBodyStrength') * .28 + n('dexterity') * .2 + n('defending') * (defensive ? .38 : .18) + n('passing') * .08 + n('dribbling') * .06),
    physicalDuels: scale(n('aerialStrength') * .36 + n('lowerBodyStrength') * .32 + n('defending') * (defensive ? .25 : .1) + n('shooting') * (position === 'CF' ? .12 : 0)),
    consistency: scale(n('passing') * .17 + n('dribbling') * .14 + n('dexterity') * .19 + n('lowerBodyStrength') * .2 + n('defending') * (defensive ? .2 : .1) + n('shooting') * (attacking ? .1 : .03) + n('aerialStrength') * .07)
  };
}

function buildTrainingVariants(selected: PositionCode, selectedLabel: string, training: TrainingPlan, scored: Array<{ code: PositionCode; label: string; score: number }>, budget: number, objective: Objective, parsed: ParsedCard): BuildVariant[] {
  const attributes = fillAttributes(parsed);
  const basePriority = trainingTemplate(selected, objective, attributes, parsed).priority;
  const candidates: TrainingPlan[] = [];
  const seen = new Set<string>();
  const push = (plan: TrainingPlan) => {
    const fitted = fitTrainingToBudget(normalizeTrainingPlan(plan), basePriority, budget);
    const key = JSON.stringify(fitted);
    if (!seen.has(key)) { seen.add(key); candidates.push(fitted); }
  };
  push(training); push(softenTraining(training, selected)); push(aggressiveTraining(training, selected));
  const keys = (selected === 'GK' ? ['gk1','gk2','gk3','lowerBodyStrength','aerialStrength'] : ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending']) as TrainingKey[];
  for (const plus of keys) for (const minus of keys) {
    if (plus === minus) continue;
    for (const amount of [1, 2, 3]) {
      const shifted = { ...training };
      shifted[plus] += amount;
      shifted[minus] = Math.max(0, shifted[minus] - amount);
      push(shifted);
    }
  }
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    for (const minus of keys) {
      if (minus === keys[i] || minus === keys[j]) continue;
      const mixed = { ...training };
      mixed[keys[i]] += 1;
      mixed[keys[j]] += 1;
      mixed[minus] = Math.max(0, mixed[minus] - 2);
      push(mixed);
    }
  }
  const ranked = candidates.map((plan) => ({ plan, score: adaptivePlanScore(plan, selected, objective, attributes, budget) })).sort((a,b) => b.score-a.score);
  const recommended = ranked[0]?.plan ?? training;
  const balanced = [...ranked].sort((a,b) => (planBalanceScore(b.plan, keys) - planBalanceScore(a.plan, keys)) || (b.score-a.score))[0]?.plan ?? recommended;
  const weights = adaptiveTrainingWeights(selected, objective, attributes);
  const specialistKey = [...keys].sort((a,b)=>weights[b]-weights[a])[0];
  const specialist = ranked.find(({plan}) => plan[specialistKey] >= recommended[specialistKey] + 1)?.plan ?? ranked[1]?.plan ?? recommended;
  const maxScore = Math.max(1, ranked[0]?.score ?? 1);
  const quality = (plan: TrainingPlan) => Math.round(clampDecimal(76 + (adaptivePlanScore(plan, selected, objective, attributes, budget) / maxScore) * 22, 1, 99));
  const efficiency = (plan: TrainingPlan) => {
    const used = Math.max(1, trainingPlanTotalCost(plan));
    const relative = adaptivePlanScore(plan, selected, objective, attributes, budget) / used;
    const bestRelative = Math.max(...ranked.map(({plan: item}) => adaptivePlanScore(item, selected, objective, attributes, budget) / Math.max(1, trainingPlanTotalCost(item))));
    return Math.round(clampDecimal(70 + (relative / Math.max(.01, bestRelative)) * 29, 1, 99));
  };
  const adapt = adaptationAssessment(selected, parsed, attributes);
  const label = (key: TrainingKey) => TRAINING_LABELS[key];
  const topKeys = [...keys].sort((a,b)=>weights[b]-weights[a]).slice(0,3);
  const make = (kind: BuildVariant['kind'], title: string, plan: TrainingPlan, highlights: string[], risks: string[], note: string, verdict: string): BuildVariant => ({
    kind, title, positionLabel: selectedLabel, training: plan, pointsUsed: trainingPlanTotalCost(plan), qualityScore: quality(plan), adaptationLabel: adapt.label,
    efficiencyScore: efficiency(plan), balanceScore: planBalanceScore(plan, keys), scenarioScores: scenarioScores(plan, selected, objective), simulationsTested: candidates.length,
    highlights, risks, note, verdict,
    tradeOffs: kind === 'alternative' ? [`Ganha mais ${label(specialistKey)}, mas pode perder regularidade em outros setores.`] : kind === 'safe' ? ['Entrega menos pico de desempenho, porém reduz os pontos fracos.'] : ['É a melhor média geral; uma ficha especialista ainda pode ser superior em uma necessidade muito específica.']
  });
  return [
    make('competitive', 'Ficha recomendada Elite', recommended, topKeys.map(key=>`Prioridade inteligente em ${label(key)}`), [adapt.risk], 'Selecionada após comparar diversas distribuições e penalizar pontos com pouco retorno para a função escolhida.', 'Melhor escolha geral para rendimento competitivo e aproveitamento do orçamento.'),
    make('alternative', `Ficha especialista em ${label(specialistKey)}`, specialist, [`Maximiza ${label(specialistKey)} sem ultrapassar o orçamento`, `Mantém a posição escolhida: ${selectedLabel}`], ['Pode abrir mão de um pouco de equilíbrio para aumentar a característica principal.'], 'Versão agressiva para destacar a maior necessidade competitiva da função.', `Indicada quando você quer que o jogador se destaque principalmente em ${label(specialistKey).toLowerCase()}.`),
    make('safe', 'Ficha equilibrada', balanced, ['Reduz fraquezas graves', 'Distribuição mais estável para partidas ranqueadas'], [adapt.risk], 'Versão conservadora para manter consistência técnica, física e tática.', 'Indicada para quem prefere regularidade e menos vulnerabilidades durante a partida.')
  ];
}

function positionFamily(position: PositionCode) {
  if (position === 'GK') return 'goleiro';
  if (position === 'CB') return 'zagueiro';
  if (position === 'LB' || position === 'RB') return 'lateral';
  if (position === 'DMF') return 'volante';
  if (position === 'CMF') return 'meia de ligação';
  if (position === 'AMF') return 'meia atacante';
  if (position === 'LMF' || position === 'RMF') return 'meia lateral';
  if (position === 'LWF' || position === 'RWF') return 'ponta';
  if (position === 'SS') return 'segundo atacante';
  return 'centroavante';
}

function realFunctionLabel(parsed: ParsedCard, selected: PositionCode, objective: Objective, a: Required<Attributes>) {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  if (selected === 'GK') {
    if (/ofensivo/.test(style) || a.lowPass >= 72 || a.kickingPower >= 82) return 'GOL de reposição e saída rápida';
    if (a.goalkeeperReflexes >= a.goalkeeperReach + 3) return 'GOL de reflexo';
    return 'GOL seguro de posicionamento';
  }
  if (selected === 'CB') {
    if (/atacante surpresa|extra frontman/.test(style)) return 'ZAG atacante surpresa com avanço controlado';
    if (/defensor criativo|construtor|build up/.test(style) || a.lowPass >= 76 || a.loftedPass >= 76) return 'ZAG defensor criativo / saída de bola';
    if (/destruidor|destroyer/.test(style)) return 'ZAG destruidor de combate';
    if (a.speed >= 78 || a.acceleration >= 78) return 'ZAG de cobertura';
    return 'ZAG de combate e bloqueio';
  }
  if (selected === 'LB' || selected === 'RB') {
    if (/lateral defensivo/.test(style) || objective === 'DEFENSIVE' || a.defensiveAwareness >= 78) return `${POSITION_PT[selected]} defensivo de recomposição`;
    if (/perito em cruzamento/.test(style)) return `${POSITION_PT[selected]} especialista em cruzamentos`;
    if (/lateral ofensivo|lateral atacante|ala produtivo/.test(style) || a.loftedPass >= 78 || a.speed >= 82) return `${POSITION_PT[selected]} ofensivo de amplitude`;
    return `${POSITION_PT[selected]} equilibrado`;
  }
  if (selected === 'DMF') {
    if (/primeiro volante|ancora|âncora|anchor/.test(style)) return '1º VOL protetor da zaga';
    if (/destruidor|destroyer/.test(style) || a.tackling >= 80 || a.aggression >= 80) return 'VOL destruidor de contenção';
    if (/orquestrador|defensor criativo|construtor/.test(style) || a.lowPass >= 80 || a.loftedPass >= 78) return 'VOL construtor de saída';
    return 'VOL híbrido de proteção';
  }
  if (selected === 'CMF') {
    if (/orquestrador/.test(style) || a.lowPass >= 82) return 'MLG orquestrador';
    if (/armador|criativo/.test(style)) return 'MLG armador de apoio';
    if (/meia versatil|box-to-box|todo campo/.test(style) || a.stamina >= 83) return 'MLG box-to-box';
    if (a.defensiveAwareness >= 77) return 'MLG marcador de apoio';
    return 'MLG de ligação';
  }
  if (selected === 'AMF') {
    if (/jogador de infiltracao|jogador de infiltração|atacante surpresa|hole/.test(style) || a.finishing >= 76) return 'MAT infiltrador';
    if (/classico|clássico/.test(style)) return 'MAT clássico 10 de criação';
    if (/armador criativo/.test(style)) return 'MAT armador criativo';
    return 'MAT criador de último passe';
  }
  if (selected === 'LWF' || selected === 'RWF') {
    if (/perito em cruzamento/.test(style) || a.loftedPass >= 78) return `${POSITION_PT[selected]} cruzador`;
    if (/ala produtivo/.test(style)) return `${POSITION_PT[selected]} ala produtivo`;
    if (/lateral movel|lateral móvel|flanco|roaming/.test(style) || a.finishing >= 78) return `${POSITION_PT[selected]} finalizador diagonal`;
    if (objective === 'PRESSING' || a.stamina >= 84) return `${POSITION_PT[selected]} de pressão e recomposição`;
    return `${POSITION_PT[selected]} driblador/velocista`;
  }
  if (selected === 'SS') {
    if (/armador|criativo/.test(style) || a.lowPass >= 80) return 'SA criador entre linhas';
    if (objective === 'PRESSING' || a.stamina >= 84) return 'SA de pressão e apoio';
    return 'SA de ruptura';
  }
  if (/puxa marcacao|puxa marcação/.test(style)) return 'CA que puxa marcação e abre espaço';
  if (/homem de area|homem de área/.test(style)) return 'CA homem de área';
  if (TARGET_CF_STYLES.test(style)) return 'CA pivô/referência';
  if (/artilheiro|goal poacher|atacante matador/.test(style)) return 'CA artilheiro finalizador';
  if (objective === 'PRESSING' && a.stamina >= 85 && a.aggression >= 78) return 'CA de pressão situacional';
  return 'CA finalizador de máximo rendimento';
}

function buildSectorScores(position: PositionCode, a: Required<Attributes>, pri: Record<string, number>, objective: Objective, profile: TacticalProfile): TeamMapPhaseScores {
  const defenseBase = avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact);
  const passBase = avg(a.lowPass, a.loftedPass, a.ballControl);
  const creationBase = avg(a.lowPass, a.ballControl, a.tightPossession, a.dribbling, a.curl);
  const speedBase = avg(a.speed, a.acceleration, a.balance);
  const finishBase = avg(a.finishing, a.offensiveAwareness, a.kickingPower, a.curl);
  const aerialBase = avg(a.heading, a.jump, a.physicalContact);
  const gkBase = avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach);

  const roleBoost = (roles: PositionCode[], amount: number) => roles.includes(position) ? amount : 0;
  const styleBoost = profile.style === 'CONTRA_ATAQUE_RAPIDO' ? 3 : profile.style === 'POSSE_DE_BOLA' ? 2 : profile.style === 'POR_FORA' ? 2 : 0;
  const pressureBoost = objective === 'PRESSING' ? 5 : 0;

  if (position === 'GK') {
    return {
      marcacao: Math.round(clampDecimal(gkBase, 1, 100)),
      cobertura: Math.round(clampDecimal(avg(a.goalkeeperReach, a.goalkeeperAwareness, a.jump), 1, 100)),
      saidaDeBola: Math.round(clampDecimal(avg(a.kickingPower, a.lowPass, a.loftedPass, a.goalkeeperAwareness), 1, 100)),
      passe: Math.round(clampDecimal(avg(a.kickingPower, a.loftedPass, a.lowPass), 1, 100)),
      criacao: Math.round(clampDecimal(avg(a.kickingPower, a.loftedPass), 1, 100)),
      aceleracao: Math.round(clampDecimal(avg(a.goalkeeperReflexes, a.jump), 1, 100)),
      finalizacao: 1,
      jogoAereo: Math.round(clampDecimal(avg(a.goalkeeperReach, a.jump, a.goalkeeperAwareness), 1, 100)),
      fisico: Math.round(clampDecimal(avg(a.physicalContact, a.jump, a.balance), 1, 100))
    };
  }

  return {
    marcacao: Math.round(clampDecimal(defenseBase + roleBoost(['CB', 'DMF', 'LB', 'RB'], 7) + pressureBoost, 1, 100)),
    cobertura: Math.round(clampDecimal(avg(defenseBase, speedBase, a.stamina) + roleBoost(['CB', 'LB', 'RB', 'DMF'], 5), 1, 100)),
    saidaDeBola: Math.round(clampDecimal(passBase + roleBoost(['DMF', 'CMF', 'CB'], 5) + (profile.style === 'POSSE_DE_BOLA' ? 4 : 0), 1, 100)),
    passe: Math.round(clampDecimal(passBase + roleBoost(['CMF', 'AMF', 'DMF', 'SS'], 5), 1, 100)),
    criacao: Math.round(clampDecimal(creationBase + roleBoost(['AMF', 'CMF', 'SS', 'LWF', 'RWF'], 5), 1, 100)),
    aceleracao: Math.round(clampDecimal(speedBase + roleBoost(['LWF', 'RWF', 'CF', 'SS', 'LB', 'RB'], 4) + styleBoost, 1, 100)),
    finalizacao: Math.round(clampDecimal(finishBase + roleBoost(['CF', 'SS', 'LWF', 'RWF', 'AMF'], 6), 1, 100)),
    jogoAereo: Math.round(clampDecimal(aerialBase + roleBoost(['CB', 'CF'], 5), 1, 100)),
    fisico: Math.round(clampDecimal(avg(a.physicalContact, a.balance, a.stamina, a.jump) + roleBoost(['CB', 'DMF', 'CF'], 4), 1, 100))
  };
}

function buildTeamMapAnalysis(parsed: ParsedCard, selected: PositionCode, objective: Objective, a: Required<Attributes>, pri: Record<string, number>, profile: TacticalProfile, skills: string[], impetos: ImpetoRecommendation[]): TeamMapAnalysis {
  const functionLabel = realFunctionLabel(parsed, selected, objective, a);
  const family = positionFamily(selected);
  const scores = buildSectorScores(selected, a, pri, objective, profile);
  const styleName: Record<TacticalStyle, string> = {
    AUTO: 'Automático inteligente', POSSE_DE_BOLA: 'Posse de bola', CONTRA_ATAQUE: 'Contra-ataque normal', CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido', POR_FORA: 'Por fora', PASSE_LONGO: 'Passe longo'
  };

  let defensiveJob = 'Manter posição, proteger zona próxima e evitar sair no bote sem cobertura.';
  let buildupJob = 'Dar opção de passe seguro e acelerar quando encontrar linha limpa.';
  let attackingJob = 'Apoiar a fase ofensiva sem perder a função principal.';
  let pressingJob = 'Pressionar por gatilhos: passe fraco, domínio de costas ou adversário sem linha de passe.';
  let idealPartners: string[] = [];
  let riskAlerts: string[] = [];
  let matchPlan: string[] = [];

  if (selected === 'GK') {
    defensiveJob = 'Ficar seguro na meta: priorizar reflexo, alcance, firmeza e posicionamento em finalizações curtas.';
    buildupJob = 'Repor rápido quando o adversário estiver aberto; se o passe não estiver limpo, prefira reposição segura.';
    attackingJob = 'Não participar como jogador de linha; o valor ofensivo é acelerar a saída com reposição.';
    pressingJob = 'Sair manualmente só quando a bola estiver longa e o zagueiro não alcançar.';
    idealPartners = ['ZAG veloz para cobertura', 'ZAG forte no alto', 'VOL que bloqueia chute frontal'];
    riskAlerts = ['Evite habilidades de linha no goleiro.', 'Se a defesa joga alta, use GOL com alcance/reflexo alto.'];
    matchPlan = ['Defesa: proteger a entrada da área.', 'Saída: usar reposição rápida só com alvo livre.', 'Ataque: iniciar contra-ataque após defesa segura.'];
  } else if (selected === 'CB') {
    defensiveJob = 'Cobrir profundidade, bloquear chute e cortar passe antes do atacante girar.';
    buildupJob = a.lowPass >= 76 || a.loftedPass >= 76 ? 'Iniciar saída com passe curto/longo sem forçar condução.' : 'Tocar simples no VOL/MLG e evitar conduzir sob pressão.';
    attackingJob = 'Subir apenas em bola parada; em jogo corrido, manter cobertura.';
    pressingJob = 'Não quebrar linha à toa; só dar bote quando o VOL atrasar o portador.';
    idealPartners = ['VOL destruidor na frente', 'ZAG complementar veloz/forte', 'Laterais que recomponham'];
    riskAlerts = ['Se velocidade for baixa, não use linha defensiva muito alta.', 'Evite gastar habilidade ofensiva em ZAG de combate.'];
    matchPlan = ['Marcação: fechar corredor central.', 'Passe: primeira bola no VOL/MLG.', 'Ataque: ficar pronto para segunda bola.'];
  } else if (selected === 'DMF') {
    defensiveJob = 'Ser a trava do time: cortar passe central, proteger zagueiros e impedir chute frontal.';
    buildupJob = 'Receber dos zagueiros e soltar passe limpo no MLG/MAT; evitar girar pressionado.';
    attackingJob = 'Apoiar atrás da jogada para rebote e cobertura, não invadir área sem necessidade.';
    pressingJob = 'Pressionar só quando houver cobertura; o valor é bloquear linha de passe.';
    idealPartners = ['MLG construtor', 'ZAG de cobertura', 'MAT com passe vertical'];
    riskAlerts = ['Se subir demais, o meio abre buraco.', 'Não priorize drible se a função é contenção.'];
    matchPlan = ['Defesa: proteger a meia-lua.', 'Construção: passe curto seguro.', 'Ataque: ficar no rebote e cortar contra-ataque.'];
  } else if (selected === 'CMF') {
    defensiveJob = 'Ajudar o VOL na pressão e cobrir corredor central quando o lateral subir.';
    buildupJob = 'Ligar defesa e ataque com passe rápido, condução curta e inversão quando houver espaço.';
    attackingJob = 'Chegar como segunda linha, sem abandonar o equilíbrio do meio.';
    pressingJob = 'Pressionar após perda com fôlego; se não roubar, atrasar a jogada.';
    idealPartners = ['VOL fixo', 'MAT criador', 'Lateral que dê amplitude'];
    riskAlerts = ['Se tiver pouca defesa, use ao lado de VOL forte.', 'Se tiver pouco passe, não use como organizador principal.'];
    matchPlan = ['Marcação: encurtar no meio.', 'Passe: triangular com VOL/MAT.', 'Ataque: chegar de trás.'];
  } else if (selected === 'AMF') {
    defensiveJob = 'Fechar primeira linha de passe do volante rival, sem virar marcador principal.';
    buildupJob = 'Receber entre linhas, girar rápido e achar passe em profundidade.';
    attackingJob = 'Ser o cérebro do último passe e finalizar quando sobrar espaço na entrada da área.';
    pressingJob = 'Pressionar o volante rival quando ele dominar de costas.';
    idealPartners = ['CA finalizador', 'Ponta veloz', 'MLG que proteja suas costas'];
    riskAlerts = ['Não transforme MAT criador em volante.', 'Se for lento, evite condução longa.'];
    matchPlan = ['Criação: passe entre linhas.', 'Ataque: tabela curta com CA/SA.', 'Defesa: fechar o volante adversário.'];
  } else if (selected === 'LB' || selected === 'RB' || selected === 'LMF' || selected === 'RMF') {
    defensiveJob = 'Recompor corredor lateral e impedir cruzamento fácil.';
    buildupJob = 'Dar amplitude, receber aberto e tocar por dentro quando pressionado.';
    attackingJob = 'Criar superioridade pelo lado com cruzamento, tabela ou passe rasteiro para trás.';
    pressingJob = 'Pressionar lateral/ponta adversário com cobertura do MLG/VOL.';
    idealPartners = ['MLG que cubra o corredor', 'Ponta que puxe marcação', 'CA que ataque a área'];
    riskAlerts = ['Se os dois laterais sobem juntos, o contra-ataque adversário fica perigoso.', 'Não use lateral ofensivo sem VOL de cobertura.'];
    matchPlan = ['Marcação: fechar lado forte.', 'Construção: abrir campo.', 'Ataque: cruzar ou tocar para trás.'];
  } else if (selected === 'LWF' || selected === 'RWF') {
    defensiveJob = 'Pressionar saída adversária pelo lado e acompanhar lateral quando necessário.';
    buildupJob = 'Receber aberto para carregar ou cortar por dentro, sempre com opção de passe curto.';
    attackingJob = 'Atacar 1 contra 1, cruzar ou finalizar diagonal conforme o pé e atributos.';
    pressingJob = 'Pressionar lateral/zagueiro no primeiro toque; Volta para marcar só se for ponta de recomposição.';
    idealPartners = ['Lateral de apoio', 'CA finalizador', 'MLG que inverta jogo'];
    riskAlerts = ['Se usar ponta sem recomposição, proteja o lado com lateral defensivo.', 'Não priorize habilidade defensiva em ponta finalizador.'];
    matchPlan = ['Ataque: isolar no 1 contra 1.', 'Passe: diagonal no CA/SA.', 'Defesa: recompor quando o lateral subir.'];
  } else if (selected === 'SS') {
    defensiveJob = 'Fechar o primeiro passe no meio e ajudar a pressionar sem perder posição entre linhas.';
    buildupJob = 'Aproximar do CA/MAT para tabela e passe de primeira.';
    attackingJob = 'Atacar espaço nas costas do volante/zagueiro e finalizar como segundo homem.';
    pressingJob = 'Pressionar com o CA em dupla quando o rival sair curto.';
    idealPartners = ['CA pivô ou finalizador', 'MAT criador', 'Ponta que abra espaço'];
    riskAlerts = ['Se virar ponta fixo, perde parte da função entre linhas.', 'Não coloque habilidades só defensivas em SA criativo.'];
    matchPlan = ['Criação: tabela curta.', 'Ataque: ruptura por dentro.', 'Marcação: pressão coordenada com CA.'];
  } else {
    defensiveJob = 'Fechar linha de passe inicial e orientar a saída adversária para o lado, sem abandonar a área.';
    buildupJob = 'Servir de apoio para tabela/pivô e devolver rápido para quem vem de frente.';
    attackingJob = 'Atacar espaço, finalizar em poucos toques e ocupar a área na hora certa.';
    pressingJob = TARGET_CF_STYLES.test(normalize(parsed.playstyle ?? '').toLowerCase()) ? 'Pressionar zagueiro quando houver cobertura, sem sair demais da referência.' : 'Pressionar só em gatilhos; o foco é finalizar, não virar marcador.';
    idealPartners = ['SA/MAT de passe', 'Ponta com cruzamento ou diagonal', 'MLG que ache passe vertical'];
    riskAlerts = ['Não priorize habilidade defensiva em CA finalizador.', 'Se o CA sair demais para marcar, falta presença na área.'];
    matchPlan = ['Ataque: receber e finalizar rápido.', 'Construção: pivô curto se tiver físico.', 'Defesa: orientar pressão, sem abandonar a zona de gol.'];
  }

  const coachFit = profile.style === 'AUTO'
    ? `Função ajustada para ${family}; escolha o estilo do técnico para refinar ainda mais.`
    : `${profile.managerName ? `${profile.managerName} (${profile.managerProficiency ?? '—'}) • ` : ''}${functionLabel} combina com ${styleName[profile.style]} quando a ficha respeita a posição escolhida e não força habilidade fora de contexto.`;

  const bestImpetoNames = impetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => item.name);
  if (bestImpetoNames.length) matchPlan.push(`Ímpetos prioritários: ${bestImpetoNames.join(', ')}.`);
  if (skills.length) matchPlan.push(`Habilidades prioritárias: ${skills.slice(0, 3).join(', ')}.`);

  return {
    functionLabel,
    tacticalIdentity: `${POSITION_PT[selected]} • ${functionLabel}`,
    defensiveJob,
    buildupJob,
    attackingJob,
    pressingJob,
    idealPartners,
    riskAlerts,
    matchPlan,
    sectorScores: scores,
    coachFit
  };
}

function recommendationExplanation(parsed: ParsedCard, selected: PositionCode, attributes: Required<Attributes>, pri: Record<string, number>, avoidPositions: Array<{ code: PositionCode; label: string; reason: string }>, profile: TacticalProfile) {
  const lines: string[] = [];
  const style = parsed.playstyle ? `estilo ${parsed.playstyle}` : 'estilo não confirmado';
  const role = trainingRoleProfile(selected, 'COMPETITIVE', attributes, parsed);
  lines.push(`Recomendei ${POSITION_PT[selected]} porque a carta é ${POSITION_PT[parsed.mainPosition]}, tem ${style} e o motor priorizou função real, não o maior GER da grade.`);
  if (role?.label) lines.push(`A ficha foi calibrada como ${role.label}: os pontos sobem nos atributos que mais aparecem nas ações reais dessa função e caem onde haveria desperdício.`);
  if (selected === 'GK') lines.push(`Como GOL, pesaram talento de GO ${attributes.goalkeeperAwareness}, firmeza ${attributes.goalkeeperCatching}, defesa ${attributes.goalkeeperParrying}, reflexos ${attributes.goalkeeperReflexes}, alcance ${attributes.goalkeeperReach}, salto ${attributes.jump} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'DMF') lines.push(`Como VOL, pesaram defesa ${attributes.defensiveAwareness}, desarme ${attributes.tackling}, agressividade ${attributes.aggression}, passe rasteiro ${attributes.lowPass} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'CMF') lines.push(`Como MLG, pesaram passe ${attributes.lowPass}, condução ${attributes.tightPossession}, fôlego ${attributes.stamina} e capacidade de recomposição.`);
  if (selected === 'CB') lines.push(`Como ZAG, pesaram defesa ${attributes.defensiveAwareness}, desarme ${attributes.tackling}, contato físico ${attributes.physicalContact}, salto ${attributes.jump} e leitura de cobertura.`);
  if (selected === 'CF') lines.push(`Como CA, pesaram finalização ${attributes.finishing}, talento ofensivo ${attributes.offensiveAwareness}, força do chute ${attributes.kickingPower} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'LWF' || selected === 'RWF') lines.push(`Como ponta, pesaram drible ${attributes.dribbling}, aceleração ${attributes.acceleration}, equilíbrio ${attributes.balance} e finalização ${attributes.finishing}.`);
  if (pri.defense >= 78) lines.push('A defesa teve peso alto no PRI, por isso posições ofensivas são tratadas com cuidado mesmo quando aparecem com GER alto.');
  if (avoidPositions.length) lines.push(`Evitei ${avoidPositions.slice(0, 3).map((item) => item.label).join(', ')} por regra anti-posição impossível ou baixa aderência ao estilo.`);
  if (profile.formation !== 'AUTO' || profile.style !== 'AUTO') lines.push('A formação/tática escolhida também ajustou o peso de passe, pressão, velocidade ou cobertura conforme seu modo de jogo.');
  return lines;
}



function positionPriorityLabels(position: PositionCode): string[] {
  const map: Record<PositionCode, string[]> = {
    CF: ['Finalização', 'Talento ofensivo', 'Contato físico', 'Aceleração'],
    SS: ['Controle de bola', 'Drible', 'Passe rasteiro', 'Finalização'],
    LWF: ['Drible', 'Aceleração', 'Velocidade', 'Finalização'],
    RWF: ['Drible', 'Aceleração', 'Velocidade', 'Finalização'],
    LMF: ['Resistência', 'Passe alto', 'Velocidade', 'Dedicação defensiva'],
    RMF: ['Resistência', 'Passe alto', 'Velocidade', 'Dedicação defensiva'],
    AMF: ['Passe rasteiro', 'Controle de bola', 'Condução firme', 'Talento ofensivo'],
    CMF: ['Passe rasteiro', 'Passe alto', 'Resistência', 'Controle de bola'],
    DMF: ['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Passe rasteiro'],
    CB: ['Talento defensivo', 'Desarme', 'Contato físico', 'Salto'],
    LB: ['Velocidade', 'Resistência', 'Passe alto', 'Desarme'],
    RB: ['Velocidade', 'Resistência', 'Passe alto', 'Desarme'],
    GK: ['Talento de GO', 'Reflexos de GO', 'Alcance de GO', 'Defesa de GO']
  };
  return map[position];
}

function buildAdvancedTacticalFunction(parsed: ParsedCard, selected: PositionCode, selectedScore: number): AdvancedTacticalFunction {
  const official = parsed.playstyle && PLAYSTYLE_OPTIONS.includes(parsed.playstyle as typeof PLAYSTYLE_OPTIONS[number]) ? parsed.playstyle : null;
  const preferred = official ? preferredPositionsByPlaystyle(official) : [];
  const activates = official ? preferred.includes(selected) : false;
  const native = parsed.positions.includes(selected) || parsed.mainPosition === selected;
  const score = clamp(Math.round(selectedScore * .72 + (activates ? 18 : 5) + (native ? 10 : 2)), 1, 100);
  const fitLabel: AdvancedTacticalFunction['fitLabel'] = score >= 88 ? 'excelente' : score >= 76 ? 'boa' : score >= 62 ? 'razoável' : 'difícil';
  return {
    position: selected,
    officialPlaystyle: official,
    status: official ? 'oficial_confirmado' : 'nao_identificado',
    activationNote: !official
      ? 'Estilo de Jogo não confirmado. A ficha usa a posição escolhida e os atributos, sem inventar um nome.'
      : activates
        ? `${official} é considerado na posição escolhida conforme o cadastro oficial local do app.`
        : `${official} foi preservado como estilo oficial da carta, mas pode não ativar nessa posição. A ficha continua obedecendo à sua escolha.`,
    priorities: positionPriorityLabels(selected),
    compatibilityScore: score,
    fitLabel,
    officialNameGuard: 'Somente nomes presentes em PLAYSTYLE_OPTIONS podem aparecer como Estilo de Jogo oficial.'
  };
}

function skillImpactText(skill: string, position: PositionCode): string {
  const profile = SKILL_PROFILES[skill];
  if (!profile) return 'Habilidade oficial preservada no cadastro.';
  const boosts = Object.entries(profile.boosts).sort((a,b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0,2).map(([key]) => ({
    defense:'defesa', pressure:'pressão', creation:'criação', finishing:'finalização', dribbling:'drible', mobility:'mobilidade', physical:'físico', aerial:'jogo aéreo', stamina:'resistência', goalkeeper:'goleiro'
  } as Record<string,string>)[key] ?? key);
  return `Ajuda em ${boosts.join(' e ')} para atuar como ${POSITION_PT[position]}.`;
}

function buildSpecialSkillsAnalysis(parsed: ParsedCard, selected: PositionCode, recommended: string[], avoid: string[]): SpecialSkillsAnalysis {
  const officialSet = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);
  const ownedOfficial = uniqueSkillList(parsed.nativeSkills).filter((skill) => officialSet.has(skill));
  const usefulOwned = ownedOfficial.map((name) => ({ name, impact: skillImpactText(name, selected), score: 70 + Math.min(25, Object.values(SKILL_PROFILES[name]?.boosts ?? {}).reduce<number>((sum, value) => sum + (value ?? 0), 0) * 2) })).sort((a,b)=>b.score-a.score);
  const missingRecommended = recommended.filter((name) => officialSet.has(name) && !ownedOfficial.includes(name)).slice(0,8).map((name,index) => ({ name, impact: skillImpactText(name, selected), score: Math.max(70, 96-index*4) }));
  const redundant = ownedOfficial.filter((name) => avoid.includes(name)).map((name) => ({ name, reason: `É oficial, mas tem retorno baixo para ${POSITION_PT[selected]} nesta ficha.` }));
  const usefulCount = usefulOwned.filter((item) => !redundant.some((r)=>r.name===item.name)).length;
  const coverageScore = clamp(45 + usefulCount*8 + Math.min(20, missingRecommended.length ? 20-missingRecommended.length*2 : 20), 1, 100);
  return {
    ownedOfficial,
    usefulOwned,
    missingRecommended,
    redundant,
    coverageScore,
    officialCatalogOnly: [...ownedOfficial, ...missingRecommended.map(i=>i.name), ...redundant.map(i=>i.name)].every((name)=>officialSet.has(name)),
    validationNotes: [
      'Nenhuma habilidade fora de OFFICIAL_ADDITIONAL_SKILL_NAMES é tratada como oficial.',
      'Habilidades já existentes são removidas das recomendações adicionais.',
      'A posição escolhida por você define a utilidade; o estilo oficial nunca é renomeado.'
    ]
  };
}


const ATTRIBUTE_GOAL_LABELS: Record<AttributeKey, string> = {
  offensiveAwareness:'Consciência ofensiva', ballControl:'Controle de bola', dribbling:'Drible', tightPossession:'Condução precisa', lowPass:'Passe rasteiro', loftedPass:'Passe alto', finishing:'Finalização', heading:'Cabeceio', placeKicking:'Bola parada', curl:'Curva', defensiveAwareness:'Consciência defensiva', defensiveEngagement:'Engajamento defensivo', tackling:'Desarme', aggression:'Agressividade', goalkeeperAwareness:'Consciência do goleiro', goalkeeperCatching:'Segurar bola', goalkeeperParrying:'Espalmar', goalkeeperReflexes:'Reflexos', goalkeeperReach:'Alcance', speed:'Velocidade', acceleration:'Aceleração', kickingPower:'Força do chute', jump:'Impulsão', physicalContact:'Contato físico', balance:'Equilíbrio', stamina:'Resistência'
};

function buildPhysicalEngine(parsed: ParsedCard, selected: PositionCode, a: Required<Attributes>): PhysicalEngineAnalysis {
  const h=parsed.height ?? null, w=parsed.weight ?? null;
  const mobility=Math.round(clampDecimal((a.speed+a.acceleration+a.balance)/3,1,99));
  const strength=Math.round(clampDecimal((a.physicalContact+a.balance+a.stamina)/3,1,99));
  const aerial=Math.round(clampDecimal((a.heading+a.jump+a.physicalContact)/3,1,99));
  const stamina=Math.round(clampDecimal(a.stamina,1,99));
  let body: PhysicalEngineAnalysis['bodyProfile']='não confirmado';
  if(h && w){ if(h>=188) body='alto'; else if(w>=82 || a.physicalContact>=85) body='forte'; else if(w<=68 && mobility>=80) body='leve'; else body='equilibrado'; }
  const needAerial=['CB','CF','GK'].includes(selected), needMobility=['LWF','RWF','LMF','RMF','LB','RB','SS'].includes(selected);
  const suitability=Math.round(clampDecimal((needAerial?aerial*.35:strength*.25)+(needMobility?mobility*.45:mobility*.25)+stamina*.2+strength*.2,1,99));
  const advantages=[] as string[], limitations=[] as string[];
  if(mobility>=80) advantages.push('Boa mobilidade para acelerar, recuperar e mudar de direção.'); else if(needMobility) limitations.push('Mobilidade abaixo do ideal para a posição escolhida.');
  if(strength>=80) advantages.push('Contato, equilíbrio e resistência sustentam duelos.'); else if(['CB','DMF','CF'].includes(selected)) limitations.push('Pode sofrer em contato físico contra jogadores fortes.');
  if(aerial>=80) advantages.push('Boa base para disputas aéreas.'); else if(needAerial) limitations.push('Jogo aéreo é uma limitação natural que o treino apenas reduz.');
  if(stamina<72) limitations.push('Resistência pode cair antes do fim da partida.');
  return {heightCm:h,weightKg:w,dominantFoot:parsed.dominantFoot ?? null,bodyProfile:body,mobilityScore:mobility,strengthScore:strength,aerialScore:aerial,staminaScore:stamina,suitabilityScore:suitability,advantages,limitations,notes:['A posição escolhida não é bloqueada pelo perfil físico.','Dados não lidos aparecem como não confirmados; o app não inventa altura, peso ou perna dominante.']};
}

function goalsForPosition(position: PositionCode): Array<[AttributeKey,number,number,string]> {
 const G: Record<PositionCode,Array<[AttributeKey,number,number,string]>>={
 CF:[['offensiveAwareness',78,86,'Movimentação para receber e atacar a área.'],['finishing',78,88,'Converter as chances criadas.'],['acceleration',74,82,'Ganhar o primeiro passo.'],['physicalContact',70,80,'Proteger a bola e disputar com zagueiros.']],
 SS:[['ballControl',78,86,'Receber entre linhas.'],['dribbling',76,85,'Criar vantagem curta.'],['lowPass',74,82,'Associar com o ataque.'],['finishing',74,84,'Também concluir jogadas.']],
 LWF:[['speed',78,88,'Atacar espaço no corredor.'],['acceleration',78,88,'Explodir no primeiro passo.'],['dribbling',78,87,'Vencer o duelo individual.'],['finishing',72,82,'Finalizar quando entra por dentro.']],
 RWF:[['speed',78,88,'Atacar espaço no corredor.'],['acceleration',78,88,'Explodir no primeiro passo.'],['dribbling',78,87,'Vencer o duelo individual.'],['finishing',72,82,'Finalizar quando entra por dentro.']],
 LMF:[['stamina',76,86,'Sustentar ida e volta.'],['lowPass',74,83,'Circular e criar pelo lado.'],['speed',74,84,'Dar amplitude e recuperação.'],['defensiveEngagement',68,78,'Ajudar a recomposição.']],
 RMF:[['stamina',76,86,'Sustentar ida e volta.'],['lowPass',74,83,'Circular e criar pelo lado.'],['speed',74,84,'Dar amplitude e recuperação.'],['defensiveEngagement',68,78,'Ajudar a recomposição.']],
 AMF:[['ballControl',80,88,'Receber sob pressão.'],['lowPass',78,87,'Criar a última bola.'],['dribbling',76,85,'Romper linhas.'],['offensiveAwareness',74,84,'Aparecer em zonas perigosas.']],
 CMF:[['lowPass',76,86,'Conectar os setores.'],['stamina',76,86,'Participar das duas fases.'],['ballControl',74,83,'Girar e proteger a posse.'],['defensiveEngagement',68,78,'Reagir após a perda.']],
 DMF:[['defensiveAwareness',78,88,'Proteger a frente da zaga.'],['tackling',76,86,'Recuperar a bola.'],['physicalContact',74,84,'Vencer duelos centrais.'],['lowPass',72,82,'Dar saída segura.']],
 CB:[['defensiveAwareness',80,90,'Manter posicionamento defensivo.'],['tackling',78,88,'Interromper jogadas.'],['physicalContact',78,88,'Disputar com atacantes.'],['speed',68,78,'Cobrir espaço sem comprometer a defesa.']],
 LB:[['stamina',76,86,'Sustentar o corredor.'],['speed',76,86,'Acompanhar pontas.'],['defensiveAwareness',70,80,'Fechar o lado.'],['loftedPass',70,82,'Apoiar com cruzamentos e inversões.']],
 RB:[['stamina',76,86,'Sustentar o corredor.'],['speed',76,86,'Acompanhar pontas.'],['defensiveAwareness',70,80,'Fechar o lado.'],['loftedPass',70,82,'Apoiar com cruzamentos e inversões.']],
 GK:[['goalkeeperAwareness',80,90,'Posicionamento e leitura.'],['goalkeeperReflexes',80,90,'Responder a finalizações.'],['goalkeeperReach',78,88,'Cobrir maior área do gol.'],['goalkeeperParrying',76,86,'Controlar rebotes.']]
 }; return G[position];
}

function buildAttributeGoals(selected: PositionCode, a: Required<Attributes>): AttributeGoalsAnalysis {
 const goals=goalsForPosition(selected).map(([attribute,min,ideal,reason])=>{const current=Math.round(a[attribute]); const gap=Math.max(0,min-current); const status:AttributeGoalItem['status']=current>=ideal?'atingida':current>=min?'próxima':'prioritária'; return {attribute,label:ATTRIBUTE_GOAL_LABELS[attribute],current,targetMin:min,targetIdeal:ideal,status,gap,reason};});
 const achieved=goals.filter(g=>g.status==='atingida').length, priority=goals.filter(g=>g.status==='prioritária').length;
 const readiness=Math.round(clampDecimal(goals.reduce((s,g)=>s+Math.min(100,(g.current/g.targetIdeal)*100),0)/goals.length,1,99));
 return {position:selected,goals,achievedCount:achieved,priorityCount:priority,readinessScore:readiness,summary:priority?`${priority} meta(s) ainda exigem prioridade para ${POSITION_PT[selected]}.`:`As metas principais de ${POSITION_PT[selected]} estão em faixa funcional.`};
}


function nextTrainingPointCost(level: number) {
  if (level < 4) return 1;
  if (level < 8) return 2;
  if (level < 12) return 3;
  return 4;
}

function buildCorrectionLimit(selected: PositionCode, objective: Objective, a: Required<Attributes>, plan: TrainingPlan): CorrectionLimitAnalysis {
  const weights = adaptiveTrainingWeights(selected, objective, a);
  const keys = Object.keys(plan) as TrainingKey[];
  const protectedStrengths: string[] = [];
  const caps = keys.filter(k => plan[k] > 0).map(k => {
    const max = weights[k] >= 2 ? 13 : weights[k] >= 1.2 ? 11 : weights[k] >= .7 ? 9 : 6;
    if (plan[k] > max) return { training:k, label:TRAINING_LABELS[k], currentLevel:plan[k], recommendedMax:max, reason:'O retorno cai depois desta faixa e pode descaracterizar qualidades úteis.' };
    return null;
  }).filter(Boolean) as CorrectionLimitAnalysis['correctionCaps'];
  if (a.lowPass >= 82) protectedStrengths.push('Passe natural protegido contra cortes excessivos.');
  if (a.speed >= 84) protectedStrengths.push('Velocidade natural preservada; não precisa consumir o orçamento inteiro.');
  if (a.finishing >= 84) protectedStrengths.push('Finalização forte preservada mesmo em adaptação de posição.');
  if (a.defensiveAwareness >= 84) protectedStrengths.push('Base defensiva forte preservada.');
  const naturalLimits: string[] = [];
  if ((selected === 'CB' || selected === 'CF') && a.heading < 68 && a.jump < 70) naturalLimits.push('Jogo aéreo é limitação natural; o motor evita gastar pontos demais tentando anulá-la.');
  if (a.speed < 68) naturalLimits.push('Velocidade muito baixa não é tratada como totalmente corrigível apenas com treino.');
  if (a.physicalContact < 68 && (selected === 'CB' || selected === 'DMF' || selected === 'CF')) naturalLimits.push('Contato físico baixo continua sendo risco estrutural da adaptação.');
  const score = Math.max(1, 100 - caps.length * 12 - naturalLimits.length * 5);
  return { score, protectedStrengths, correctionCaps:caps, naturalLimits, summary:caps.length ? 'Há grupos acima da faixa de melhor retorno; a ficha limita correções exageradas.' : 'Nenhuma correção exagerada foi detectada na ficha recomendada.' };
}

function buildMarginalReturn(selected: PositionCode, objective: Objective, a: Required<Attributes>, plan: TrainingPlan): MarginalReturnItem[] {
  const weights = adaptiveTrainingWeights(selected, objective, a);
  return (Object.keys(plan) as TrainingKey[]).filter(k => selected === 'GK' ? ['gk1','gk2','gk3','lowerBodyStrength','aerialStrength'].includes(k) : !k.startsWith('gk')).map(k => {
    const level=plan[k]; const cost=nextTrainingPointCost(level); const saturation=level >= 12 ? .35 : level >= 10 ? .6 : 1;
    const gain=Math.round(Math.max(1, weights[k] * saturation * 18 / cost));
    const returnLabel = gain >= 20 ? 'alto' : gain >= 10 ? 'médio' : 'baixo';
    return { training:k,label:TRAINING_LABELS[k],currentLevel:level,nextPointCost:cost,marginalGain:gain,returnLabel,recommendation:returnLabel==='alto'?'Próximo investimento recomendado.':returnLabel==='médio'?'Só investir se combinar com sua prioridade.':'Evitar por enquanto; o custo supera o ganho provável.' } as MarginalReturnItem;
  }).sort((x,y)=>y.marginalGain-x.marginalGain);
}

function shiftForTolerance(plan: TrainingPlan, selected: PositionCode, direction: 'conservative'|'optimistic'): TrainingPlan {
  const p={...plan}; const main = selected==='GK'?'gk2':selected==='CB'||selected==='DMF'?'defending':selected==='CF'?'shooting':selected==='AMF'||selected==='CMF'?'passing':'dexterity';
  const secondary = selected==='GK'?'gk1':selected==='CB'?'lowerBodyStrength':selected==='CF'?'dexterity':'lowerBodyStrength';
  if(direction==='conservative'){ p[main]=Math.max(0,p[main]-1); p[secondary]+=1; }
  else { p[main]+=1; p[secondary]=Math.max(0,p[secondary]-1); }
  return normalizeTrainingPlan(p);
}

function buildErrorTolerance(parsed: ParsedCard, selected: PositionCode, plan: TrainingPlan, budget:number, priority: TrainingKey[]): ErrorToleranceAnalysis {
  const confidence = parsed.confidence >= 85 && parsed.evidence.attributeCount >= 18 ? 'alta' : parsed.confidence >= 60 && parsed.evidence.attributeCount >= 8 ? 'média' : 'baixa';
  const probable=fitTrainingToBudget(plan,priority,budget);
  const conservative=fitTrainingToBudget(shiftForTolerance(probable,selected,'conservative'),priority,budget);
  const optimistic=fitTrainingToBudget(shiftForTolerance(probable,selected,'optimistic'),priority,budget);
  const sensitiveGroups = confidence==='alta'?[]:['Atributos não confirmados podem mudar a ordem entre os dois principais grupos de treino.'];
  const stableGroups=(Object.keys(probable) as TrainingKey[]).filter(k=>probable[k]>=6).map(k=>TRAINING_LABELS[k]).slice(0,4);
  return { confidence, conservative, probable, optimistic, sensitiveGroups, stableGroups, note:'Os três cenários respeitam o mesmo orçamento e a posição escolhida. Eles existem para reduzir o risco de um dado lido incorretamente.' };
}

function buildSkillPriority(parsed: ParsedCard, selected: PositionCode, analysis: SpecialSkillsAnalysis): SkillPriorityAnalysis {
  const official = new Set(OFFICIAL_ADDITIONAL_SKILL_NAMES);
  const ordered=analysis.missingRecommended.filter(x=>official.has(x.name as any)).map((x,index)=>({name:x.name,score:Math.max(1,Math.min(100,x.score + (index<2?8:0))),tier:(index===0?'prioridade máxima':index<3?'alta':'útil') as 'prioridade máxima'|'alta'|'útil',reasons:[x.impact,`Compatível com ${POSITION_PT[selected]}.`, parsed.playstyle?`Considera o estilo oficial ${parsed.playstyle}.`:'Sem estilo confirmado: prioridade calculada pela posição e atributos.']})).sort((a,b)=>b.score-a.score).slice(0,8);
  return { ordered, ownedCoverage:analysis.coverageScore, officialOnly:ordered.every(x=>official.has(x.name as any)), context:[`Posição escolhida: ${POSITION_PT[selected]}.`, parsed.playstyle?`Estilo oficial: ${parsed.playstyle}.`:'Estilo oficial não confirmado.', 'Habilidades já existentes foram removidas da fila.'] };
}

function buildAdvancedOptimizer(variants: BuildVariant[], training: TrainingPlan, budget:number, selected:PositionCode, objective: Objective, a: Required<Attributes>): AdvancedOptimizerAnalysis {
 const winner=[...variants].sort((a,b)=>(b.qualityScore??0)-(a.qualityScore??0))[0] ?? variants[0];
 const used=trainingPlanTotalCost(winner?.training ?? training); const inactive=(Object.keys(winner?.training??training) as TrainingKey[]).filter(k=>(winner?.training??training)[k]>=5 && adaptiveTrainingWeights(selected,objective,a)[k]<=.35);
 return {combinationsTested:Math.max(...variants.map(v=>v.simulationsTested??0),0),winnerTitle:winner?.title??'Ficha recomendada Elite',winnerScore:winner?.qualityScore??0,efficiencyScore:winner?.efficiencyScore??0,wasteScore:Math.max(0,100-(winner?.efficiencyScore??0)),unusedPoints:Math.max(0,budget-used),usefulInvestment:(winner?.highlights??[]).slice(0,4),detectedWaste:inactive.length?inactive.map(k=>`${TRAINING_LABELS[k]} recebeu investimento acima do retorno estimado.`):['Nenhum desperdício crítico detectado na ficha vencedora.'],decisionReasons:[winner?.verdict??'Melhor média geral.',winner?.note??'Selecionada pelo motor adaptativo.',`A posição ${POSITION_PT[selected]} foi preservada em todas as simulações.`],positionPreserved:true,budgetRespected:used<=budget};
}

export function analyzeCard(rawText: string, objective: Objective = 'COMPETITIVE', targetPosition: PositionCode | 'AUTO' = 'AUTO', imageFileName?: string | null, tacticalProfile: TacticalProfile = { formation: 'AUTO', style: 'AUTO' }): AnalysisResult {
  const parsed = parseCard(rawText, imageFileName);
  const attributes = fillAttributes(parsed);
  const allowedPositions = parsed.positions.length ? parsed.positions : [parsed.mainPosition];
  const nativePositionScores = allowedPositions
    .map((code) => {
      const rawScore = positionScore(code, attributes, parsed.nativeSkills, parsed.positionRatings) + playstylePositionBonus(code, parsed.playstyle) + gameplayPositionWeight(code, parsed.mainPosition, parsed.playstyle) * 0.18 + tacticalScoreBonus(code, tacticalProfile, attributes);
      return { code, label: POSITION_PT[code], score: clampDecimal(rawScore, 1, 100), role: roleName(code, attributes), cardRating: parsed.positionRatings[code] ?? null };
    })
    .sort((left, right) => {
      const leftRank = left.score + gameplayPositionWeight(left.code, parsed.mainPosition, parsed.playstyle) * 0.18;
      const rightRank = right.score + gameplayPositionWeight(right.code, parsed.mainPosition, parsed.playstyle) * 0.18;
      return rightRank - leftRank;
    });
  const autoSelectedCode = chooseGameplaySelectedPosition(parsed, nativePositionScores);
  const explicitTarget = targetPosition !== 'AUTO';
  const requestedCode = explicitTarget ? targetPosition as PositionCode : autoSelectedCode;
  // Quando o usuário escolhe uma posição, a decisão é soberana.
  // O motor pode avaliar a adaptação, mas nunca troca ou bloqueia silenciosamente a escolha.
  const selectedCode = explicitTarget ? requestedCode : autoSelectedCode;
  const targetScore = positionScore(selectedCode, attributes, parsed.nativeSkills, parsed.positionRatings) + tacticalScoreBonus(selectedCode, tacticalProfile, attributes);
  const selected = nativePositionScores.find((item) => item.code === selectedCode) ?? {
    code: selectedCode,
    label: POSITION_PT[selectedCode],
    score: clampDecimal(targetScore, 1, 100),
    role: roleName(selectedCode, attributes),
    cardRating: parsed.positionRatings[selectedCode] ?? null
  };
  const positionScores = [selected, ...nativePositionScores.filter((item) => item.code !== selected.code)];
  const pri = calculatePri(selected.code, attributes, parsed.nativeSkills);
  const tacticalFit = calculateTacticalFit(selected.code, attributes, pri);
  const trainingPointsTotal = trainingBudgetFromCard(parsed);
  const training = trainingFor(selected.code, objective, attributes, parsed);
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = Math.min(trainingPlanTotalCost(training), trainingPointsTotal);
  const trainingPointsRemaining = Math.max(0, trainingPointsTotal - trainingPointsUsed);
  const recommendedSkills = recommendAdditionalSkills(parsed, selected.code, objective, attributes);
  const skillRecommendations = buildSkillRecommendations(parsed, selected.code, objective, attributes, recommendedSkills);
  const avoidSkills = skillRecommendations.filter((item) => item.tier === 'evitar').map((item) => item.name);
  const recommendedImpetos = recommendImpetos(parsed, selected.code, objective);
  const teamMap = buildTeamMapAnalysis(parsed, selected.code, objective, attributes, pri, tacticalProfile, recommendedSkills, recommendedImpetos);
  const { strengths, weaknesses } = strengthsWeaknesses(attributes, pri, selected.code);
  const tips = usageTips(selected.code, objective, attributes);
  const buildName = `${POSITION_PT[selected.code]} ${selected.role}`;
  const visiblePositionScores = positionScores.slice(0, 10);
  const permittedPositions = buildPermittedPositions(parsed, visiblePositionScores);
  const avoidPositions = buildAvoidPositions(parsed, attributes);
  const validation = validateAnalysis(parsed, selected, visiblePositionScores, attributes, avoidPositions, explicitTarget);
  const trainingComparison = compareTraining(parsed.autoTrainingPlan, training);
  const buildVariants = buildTrainingVariants(selected.code, POSITION_PT[selected.code], training, visiblePositionScores, trainingPointsTotal, objective, parsed);
  const advancedTacticalFunction = buildAdvancedTacticalFunction(parsed, selected.code, selected.score);
  const specialSkillsAnalysis = buildSpecialSkillsAnalysis(parsed, selected.code, recommendedSkills, avoidSkills);
  const physicalEngine = buildPhysicalEngine(parsed, selected.code, attributes);
  const attributeGoals = buildAttributeGoals(selected.code, attributes);
  const advancedOptimizer = buildAdvancedOptimizer(buildVariants, training, trainingPointsTotal, selected.code, objective, attributes);
  const correctionLimit = buildCorrectionLimit(selected.code, objective, attributes, buildVariants[0]?.training ?? training);
  const marginalReturn = buildMarginalReturn(selected.code, objective, attributes, buildVariants[0]?.training ?? training);
  const errorTolerance = buildErrorTolerance(parsed, selected.code, buildVariants[0]?.training ?? training, trainingPointsTotal, trainingTemplate(selected.code, objective, attributes, parsed).priority);
  const skillPriority = buildSkillPriority(parsed, selected.code, specialSkillsAnalysis);
  const profileTips = tacticalProfileTips(tacticalProfile, selected.code);
  const explanation = recommendationExplanation(parsed, selected.code, attributes, pri, avoidPositions, tacticalProfile);
  if (explicitTarget) explanation.unshift(`Posição escolhida por você: ${POSITION_PT[selected.code]}. Toda a ficha foi recalculada para essa função. O app apenas avalia a adaptação; a decisão final é sua.`);
  const note = validation.level === 'blocked'
    ? 'Conferência obrigatória: revise posição, estilo, atributos e pontos antes de gerar a ficha final.'
    : parsed.confidence >= 85
      ? 'Alta confiança. A identidade da carta foi preservada e a ficha foi gerada para desempenho real em campo, sem buscar GER máximo.'
      : parsed.confidence >= 60
        ? 'Confiança média. O motor local preservou a identidade provável da carta e compensou dados faltantes com regras de rendimento real.'
        : 'Confiança baixa. O motor local usou fallback seguro; revise os dados lidos para aumentar a precisão.';
  const confidenceLevel: DeepAnalysis['confidenceLevel'] = parsed.confidence >= 85 ? 'alta' : parsed.confidence >= 60 ? 'media' : 'baixa';
  const readingItems: DeepReadingItem[] = [
    { field: 'Nome', value: parsed.playerName, source: parsed.playerName !== 'Jogador não identificado' ? (parsed.manualConfirmed ? 'confirmado' : 'lido') : 'fallback', confidence: parsed.playerName !== 'Jogador não identificado' ? 'alta' : 'baixa', note: parsed.playerName !== 'Jogador não identificado' ? 'Identidade encontrada no cabeçalho/ajuste manual.' : 'Nome não identificado com segurança.' },
    { field: 'Posição original', value: parsed.mainPositionPt, source: parsed.manualConfirmed || parsed.evidence.positionLocked ? 'confirmado' : parsed.evidence.positionRatingsCount > 0 ? 'lido' : 'inferido', confidence: parsed.evidence.positionLocked ? 'alta' : parsed.confidence >= 70 ? 'media' : 'baixa', note: 'Mantida apenas como identidade original da carta.' },
    { field: 'Posição escolhida para a ficha', value: POSITION_PT[selected.code], source: targetPosition === 'AUTO' ? 'inferido' : 'confirmado', confidence: targetPosition === 'AUTO' ? 'media' : 'alta', note: targetPosition === 'AUTO' ? 'Sugestão automática do motor.' : 'Escolhida por você; o aplicativo não substitui nem bloqueia esta decisão.' },
    { field: 'Estilo original', value: parsed.playstyle ?? 'Não identificado', source: parsed.playstyle ? (parsed.manualConfirmed || parsed.evidence.playstyleLocked ? 'confirmado' : 'lido') : 'fallback', confidence: parsed.playstyle ? (parsed.evidence.playstyleLocked ? 'alta' : 'media') : 'baixa', note: parsed.playstyle ? 'Usado para calibrar a função real.' : 'A ficha foi calculada sem inventar estilo.' },
    { field: 'Pontos disponíveis', value: String(trainingPointsTotal), source: parsed.trainingPointSource === 'MANUAL' ? 'confirmado' : parsed.trainingPointSource === 'FALLBACK' ? 'fallback' : parsed.trainingPointSource === 'LEVEL_INFERRED' ? 'inferido' : 'lido', confidence: parsed.trainingPointSource === 'FALLBACK' ? 'baixa' : parsed.trainingPointSource === 'LEVEL_INFERRED' ? 'media' : 'alta', note: `Origem: ${parsed.trainingPointSource ?? 'FALLBACK'}.` },
    { field: 'Atributos', value: `${parsed.evidence.attributeCount} lidos`, source: parsed.evidence.attributeCount >= 12 ? 'lido' : 'inferido', confidence: parsed.evidence.attributeCount >= 18 ? 'alta' : parsed.evidence.attributeCount >= 8 ? 'media' : 'baixa', note: 'Atributos ausentes recebem apenas estimativa segura por posição e estilo.' }
  ];
  const uncertainFields = readingItems.filter((item) => item.confidence === 'baixa').map((item) => item.field);
  const deepAnalysis: DeepAnalysis = {
    confidenceLevel,
    originalIdentity: `${parsed.mainPositionPt}${parsed.playstyle ? ` • ${parsed.playstyle}` : ''}`,
    recommendedFunction: `${POSITION_PT[selected.code]} • ${teamMap.functionLabel || selected.role}`,
    readingItems,
    uncertainFields,
    safeguards: [
      targetPosition === 'AUTO' ? 'A posição e o estilo originais permanecem separados da recomendação.' : `A ficha foi calculada diretamente para ${POSITION_PT[selected.code]}. O app apenas informa o nível de adaptação em relação à posição original ${parsed.mainPositionPt}.`,
      'Nenhum valor ausente é exibido como se tivesse sido lido do print.',
      'A ficha não ultrapassa o orçamento de pontos.',
      'O motor reduz pontos em grupos que não ajudam a função real.',
      validation.level === 'blocked' ? 'A geração final exige revisão manual.' : 'A análise passou pelas travas principais de precisão.'
    ],
    pointRationale: explanation.slice(0, 5)
  };
  return { parsed, bestPosition: selected, positionScores: visiblePositionScores, pri, tacticalFit, training, trainingCost, trainingPointsUsed, trainingPointsTotal, trainingPointsRemaining, trainingCostRule: trainingCostRuleText(), trainingComparison, buildVariants, recommendationExplanation: explanation, tacticalProfile, teamMap, profileTips, validation, permittedPositions, avoidPositions, recommendedSkills, skillRecommendations, avoidSkills, recommendedImpetos, buildName, strengths, weaknesses, usageTips: [...tips, ...profileTips, ...teamMap.matchPlan.slice(0, 2)], note, deepAnalysis, advancedTacticalFunction, specialSkillsAnalysis, physicalEngine, attributeGoals, advancedOptimizer, correctionLimit, marginalReturn, errorTolerance, skillPriority };
}
