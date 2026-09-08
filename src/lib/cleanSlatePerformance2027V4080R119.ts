import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  ImpetoRecommendation,
  ParsedCard,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import {
  emptyTraining,
  trainingLevelCost,
  trainingPlanCost,
  trainingPlanTotalCost,
  TRAINING_KEYS
} from './trainingPlanCore';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';
import { skillIdentityKey } from './officialSkillIdentity';
import { isRoleCompatibleAdditionalSkill } from './skillIntelligenceV31';
import { IMPETO_FUNCTIONAL_MATRIX_R119, type ImpetoFunctionalDomainR119 } from './impetoFunctionalMatrixR119';
import { inspectPlaystyleActivationR124 } from './efootball2027PhaseCatalogR124';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';

export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r125-role-aware-card-specific-performance-authority' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R143_VERSION = '40.80-r143-equivalent-state-cache-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R144_VERSION = '40.80-r144-frontier-dedup-diagnostic-memo-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R145_VERSION = '40.80-r145-incremental-state-key-beam-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R146_VERSION = '40.80-r146-compiled-evaluation-kernel-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R147_VERSION = '40.80-r147-compact-search-state-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R148_VERSION = '40.80-r148-fused-evaluation-pass-v1' as const;
export const CLEAN_SLATE_SEARCH_OPTIMIZATION_R149_VERSION = '40.80-r149-scalar-score-hot-path-v1' as const;
export const POSITION_STABILITY_R184_VERSION = '40.80-r184-material-position-gain-stability-v1' as const;
const POSITION_STABILITY_GAIN_THRESHOLD_R184 = .25;
const POSITION_STABILITY_MAX_DISTANCE_R184 = 4;
// BM_R123_ONLINE_OBJECTIVE: Ranked + amistoso online são o objetivo de desempenho, nunca Overall/GER.
// BM_R123_NAME_AGNOSTIC: nome do jogador não participa da pontuação; identidade vem da evidência da carta.
// BM_R123_MARGINAL_RETURN: cada grupo usado expõe retorno marginal e ações sustentadas.
// BM_R123_SATURATION_AUDIT: saturação é medida por retorno local dos níveis, sem pisos/limites fixos por posição.
// BM_R123_CONFIDENCE_PROFILE: confiança separa qualidade da leitura, estabilidade da decisão e evidência real.
// BM_R123_AB_LAB_READ_ONLY: alternativas A/B são apenas experimento; nunca sobrescrevem a autoridade final automaticamente.

export type CleanSlateActionR119 = {
  id: string;
  label: string;
  naturalScore: number;
  projectedScore: number;
  frequency: number;
  contribution: number;
  matchNeedMultiplier?: number;
};

export type CleanSlateConfidenceR123 = {
  score: number;
  level: 'ALTA' | 'MODERADA' | 'BAIXA';
  dataQuality: number;
  attributeCoverage: number;
  skillEvidence: number;
  styleCertainty: number;
  decisionStability: number;
  marginalSafety: number;
  realMatchEvidence: number;
  reasons: string[];
};

export type CleanSlateSaturationR123 = {
  training: TrainingKey;
  label: string;
  level: number;
  status: 'EFICIENTE' | 'ATENCAO' | 'SATURADO';
  peakReturnPerCost: number;
  recentReturnPerCost: number;
  lastReturnPerCost: number;
  lowReturnSteps: number;
  reason: string;
};

export type CleanSlateCompetitiveLabArmR123 = {
  id: string;
  label: string;
  rank: 1 | 2;
  isPrimary: boolean;
  score: number;
  rankedScore: number;
  friendsScore: number;
  distanceFromPrimary: number;
  training: TrainingPlan;
  hypothesis: string;
};

export type CleanSlateCompetitiveLabR123 = {
  mode: 'READ_ONLY_AB';
  minMatchesPerArm: 5;
  canCompare: boolean;
  arms: CleanSlateCompetitiveLabArmR123[];
  protocol: string[];
  safeguards: {
    readOnly: true;
    neverAutoPromotes: true;
    sameCardRequired: true;
    similarConditionsPreferred: true;
    highDelayMustBeMarked: true;
  };
};

export type CleanSlate2027R119 = {
  version: typeof CLEAN_SLATE_2027_R119_VERSION;
  authority: 'CLEAN_SLATE_SINGLE_WRITER';
  source: 'RAW_CARD_SNAPSHOT';
  status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';
  cardKey: string;
  positionAnchor: PositionCode;
  usagePosition: PositionCode;
  usagePositionChanged: boolean;
  positionStabilityR184?: {
    version: typeof POSITION_STABILITY_R184_VERSION;
    decision: 'NATURAL_ANCHOR' | 'TARGET_ADAPTATION';
    targetGain: number;
    planDistance: number;
    gainThreshold: number;
    maxNoiseDistance: number;
    reason: string;
  };
  playstyleContext: {
    offensive: { style: string | null; status: string; activeWeight: number };
    defensive: { style: string | null; status: string; activeWeight: number };
    neutralRoleMode: boolean;
    note: string;
  };
  budget: number;
  training: TrainingPlan;
  candidateCount: number;
  searchOptimizationR143?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R143_VERSION;
    generatedStates: number;
    uniqueEvaluations: number;
    cacheHits: number;
    beamWidth: 20;
    heuristicChanged: false;
    scoreOnlySearch: true;
    projectedAttributesReused: true;
  };
  searchOptimizationR144?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R144_VERSION;
    generatedStates: number;
    duplicateStatesSkipped: number;
    uniqueFrontierStates: number;
    orderedBeamInsertions: number;
    orderedBeamRejections: number;
    diagnosticUniqueEvaluations: number;
    diagnosticCacheHits: number;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    earlyDuplicateSuppression: true;
    orderedBeamInsertion: true;
    sharedDiagnosticMemo: true;
  };
  searchOptimizationR145?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R145_VERSION;
    generatedStates: number;
    duplicateStatesSkipped: number;
    uniqueFrontierStates: number;
    incrementalKeyDerivations: number;
    fullKeyRecomputations: number;
    redundantBeamDuplicateScans: number;
    textualSignaturesAllocated: number;
    tieBreakComparisons: number;
    searchScoreCacheEntries: number;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    incrementalStateKey: true;
    preBeamDedupAuthoritative: true;
    lazyTieBreak: true;
    scoreCacheElided: true;
  };
  searchOptimizationR146?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R146_VERSION;
    generatedStates: number;
    uniqueFrontierStates: number;
    compiledActionAttributes: number;
    compiledPressureAttributes: number;
    compiledGroupLevelProfiles: number;
    projectedScoreMapsAllocated: number;
    repeatedAttributeGroupLookups: number;
    repeatedStaticGroupMath: number;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    compiledEvaluationKernel: true;
    actionProjectionCompiled: true;
    pressureProjectionCompiled: true;
    groupLevelProfilesCompiled: true;
    projectedScoreArrayAligned: true;
  };
  searchOptimizationR147?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R147_VERSION;
    generatedStates: number;
    uniqueFrontierStates: number;
    compactStateWidth: 10;
    scratchVectorsAllocated: number;
    beamStateVectorsMaterialized: number;
    rejectedCandidatesWithoutStateCopy: number;
    perSuccessorTrainingPlanObjectsAllocated: 0;
    planPropertyLookupsInSearchKernel: 0;
    winnerTrainingPlanMaterializations: 1;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    compactSearchState: true;
    scoreBeforeStateMaterialization: true;
    finalistPlansRemainLazy: true;
  };
  searchOptimizationR148?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R148_VERSION;
    generatedStates: number;
    uniqueFrontierStates: number;
    projectedScoreArraysAllocatedInSearch: 0;
    actionPassesPerCandidate: 1;
    separatePressureActionPasses: 0;
    groupPassesPerCandidate: 1;
    separateIdentityGroupPasses: 0;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    fusedActionPressurePass: true;
    fusedPenaltyIdentityPass: true;
    arithmeticOrderPreserved: true;
  };
  searchOptimizationR149?: {
    version: typeof CLEAN_SLATE_SEARCH_OPTIMIZATION_R149_VERSION;
    generatedStates: number;
    uniqueFrontierStates: number;
    scoreOnlyEvaluations: number;
    searchResultObjectsAllocated: 0;
    searchDetailArraysAllocated: 0;
    searchOnlineObjectsAllocated: 0;
    winnerFullEvaluations: 1;
    beamWidth: 20;
    heuristicChanged: false;
    beamReduced: false;
    scalarScoreHotPath: true;
    singleEvaluationKernel: true;
    diagnosticEvaluationPreserved: true;
  };
  score: number;
  responseScore: number;
  synergyScore: number;
  confidence: number;
  decisionConfidence: CleanSlateConfidenceR123;
  saturationProfile: CleanSlateSaturationR123[];
  competitiveLab: CleanSlateCompetitiveLabR123;
  onlinePerformance: {
    objective: 'MAX_ONLINE_PERFORMANCE';
    rankedScore: number;
    friendsScore: number;
    pressureReliability: number;
    matchConsistency: number;
    staminaSustainability: number;
    identityPreservation: number;
    pointEfficiency: number;
    notes: string[];
  };
  pointRationale: Array<{
    training: TrainingKey;
    label: string;
    level: number;
    lastStepCost: number;
    marginalReturn: number;
    returnPerCost: number;
    actions: string[];
    reason: string;
  }>;
  dominantDna: string[];
  specialSkills: string[];
  actions: CleanSlateActionR119[];
  top5: string[];
  currentImpeto: string | null;
  impetoDecision: 'KEEP_CURRENT' | 'RECOMMEND_NEW' | 'REVIEW_SLOT' | 'NO_SAFE_IMPETO' | 'SLOT_NOT_AVAILABLE';
  recommendedImpeto: string | null;
  impetoIdeal: string | null;
  impetoIdealScore: number;
  impetoIdealConfidence: number;
  impetoReason: string;
  impetoSlotStatus: string;
  guards: {
    ignoresIncomingTraining: true;
    ignoresOverall: true;
    noFloorPeakCeiling: true;
    rawSnapshotProtected: true;
    exactBudget: boolean;
    ownedSkillDuplicatesBlocked: boolean;
    existingImpetoNeverRepeated: boolean;
    selectedPositionDoesNotRewriteSignature: true;
    legacyEnginesReadOnly: true;
    onlineObjectiveActive: true;
    nameAgnosticScoring: true;
    marginalReturnAudited: true;
    saturationAudited: true;
    confidenceSeparatedFromOverall: true;
    abLabReadOnly: true;
    usagePositionAffectsBuildNotCardIdentity: true;
    inactivePlaystyleDoesNotForceRecipe: true;
    actionAttributesHaveFunctionalWeights: true;
    matchEvidenceCalibrated: true;
  };
  reasons: string[];
};

type WithR119 = AnalysisResult & { cleanSlate2027R119: CleanSlate2027R119 };
type ActionDef = {
  id: string;
  label: string;
  attrs: AttributeKey[];
  weights?: Partial<Record<AttributeKey, number>>;
  positions: Partial<Record<PositionCode, number>>;
  tags: string[];
};

type UsageContextR125 = {
  targetPosition: PositionCode;
  naturalPosition: PositionCode;
  usagePositionChanged: boolean;
  offensiveStyle: string | null;
  defensiveStyle: string | null;
  offensiveActivation: ReturnType<typeof inspectPlaystyleActivationR124>;
  defensiveActivation: ReturnType<typeof inspectPlaystyleActivationR124>;
  offensiveStyleWeight: number;
  defensiveStyleWeight: number;
  defensiveStyleConfirmed: boolean;
  neutralRoleMode: boolean;
};

type CompactPlanR147 = number[];
type BeamState = { levels: CompactPlanR147; score: number; cacheKey: number };
type CompiledAttributeR146 = { base:number; groupIndex:number };
type CompiledActionAttributeR146 = CompiledAttributeR146 & { weight:number; primary:boolean };
type EvaluationActionR143 = {
  action:ActionDef;
  frequency:number;
  natural:number;
  matchNeedMultiplier:number;
  decisionWeight:number;
  pressureKeys:AttributeKey[];
  compiledAttributes:CompiledActionAttributeR146[];
  compiledPressureAttributes:CompiledAttributeR146[];
};
type EvaluationGroupR143 = {
  naturalStrength:number;
  impacted:number;
  identityFit:number;
  identityBonusByLevel:number[];
  weakRepairPenaltyByLevel:number[];
  excessPenaltyByLevel:number[];
};
type EvaluationContextR143 = {
  actions:EvaluationActionR143[];
  groupProfiles:EvaluationGroupR143[];
  attributeBases:Partial<Record<AttributeKey,number>>;
  stamina:CompiledAttributeR146;
  staminaDemand:number;
  staminaFloor:number;
  aerialSupport:number;
  compiledActionAttributeCount:number;
  compiledPressureAttributeCount:number;
};

const TRAINING_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing', 'placeKicking', 'curl'],
  passing: ['lowPass', 'loftedPass'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach']
};

const ATTRIBUTE_TRAINING_GROUP_R144: Partial<Record<AttributeKey,TrainingKey>> = (()=>{
  const mapping:Partial<Record<AttributeKey,TrainingKey>>={};
  for(const [group,attributes] of Object.entries(TRAINING_ATTRIBUTES) as Array<[TrainingKey,AttributeKey[]]>) {
    for(const attribute of attributes) mapping[attribute]=group;
  }
  return mapping;
})();

const PLAN_KEY_FACTOR_R145: Record<TrainingKey,number> = (()=>{
  const factors={} as Record<TrainingKey,number>;
  let factor=1;
  for(const key of TRAINING_KEYS) {
    factors[key]=factor;
    factor*=17;
  }
  return factors;
})();
const TRAINING_LEVEL_TEXT_R145 = Array.from({length:17},(_,level)=>String(level));
const TRAINING_KEY_INDEX_R147: Record<TrainingKey,number> = (()=>{
  const indexes={} as Record<TrainingKey,number>;
  TRAINING_KEYS.forEach((key,index)=>{ indexes[key]=index; });
  return indexes;
})();
const AERIAL_STRENGTH_INDEX_R147 = TRAINING_KEY_INDEX_R147.aerialStrength;

const FIELD_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
const GK_KEYS: TrainingKey[] = ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];

const ACTIONS: ActionDef[] = [
  { id:'attack_space', label:'Ataque ao espaço', attrs:['offensiveAwareness','acceleration','speed','balance'], weights:{offensiveAwareness:1.35,acceleration:1.2,speed:1,balance:.45}, positions:{CF:1,SS:.92,LWF:.84,RWF:.84,AMF:.66,LMF:.42,RMF:.42,CMF:.24}, tags:['movement','finishing'] },
  { id:'finish_box', label:'Finalização na área', attrs:['offensiveAwareness','finishing','kickingPower','balance'], weights:{offensiveAwareness:1.3,finishing:1.55,kickingPower:.55,balance:.35}, positions:{CF:1,SS:.88,LWF:.66,RWF:.66,AMF:.58,CMF:.18}, tags:['finishing'] },
  { id:'turn_finish', label:'Giro + chute', attrs:['ballControl','tightPossession','balance','finishing','acceleration'], weights:{ballControl:1,tightPossession:1,balance:.55,finishing:1.25,acceleration:.65}, positions:{CF:.9,SS:1,AMF:.82,LWF:.7,RWF:.7,CMF:.25}, tags:['technical','finishing','control'] },
  { id:'long_finish', label:'Finalização de média distância', attrs:['finishing','kickingPower','curl','ballControl'], weights:{finishing:1.25,kickingPower:1,curl:.7,ballControl:.45}, positions:{CF:.68,SS:.78,LWF:.76,RWF:.76,AMF:.9,CMF:.55,LMF:.45,RMF:.45}, tags:['finishing','technical'] },
  { id:'close_control', label:'Controle sob pressão', attrs:['ballControl','dribbling','tightPossession','balance'], weights:{ballControl:1.2,dribbling:1,tightPossession:1.35,balance:.75}, positions:{CF:.55,SS:1,LWF:1,RWF:1,AMF:1,CMF:.84,DMF:.52,LMF:.78,RMF:.78,LB:.42,RB:.42}, tags:['technical','control'] },
  { id:'carry', label:'Condução progressiva', attrs:['dribbling','tightPossession','speed','acceleration','balance'], weights:{dribbling:1.15,tightPossession:1,speed:.8,acceleration:1,balance:.55}, positions:{SS:.82,LWF:1,RWF:1,AMF:.9,CMF:.72,LMF:.92,RMF:.92,LB:.62,RB:.62,CF:.4}, tags:['technical','movement','control'] },
  { id:'short_creation', label:'Tabela e passe curto', attrs:['lowPass','ballControl','tightPossession','offensiveAwareness'], weights:{lowPass:1.45,ballControl:.7,tightPossession:.65,offensiveAwareness:.55}, positions:{SS:.9,AMF:1,CMF:1,DMF:.76,LMF:.88,RMF:.88,CF:.45,LB:.48,RB:.48}, tags:['creation','technical'] },
  { id:'through_creation', label:'Passe de ruptura', attrs:['lowPass','loftedPass','curl','ballControl'], weights:{lowPass:1.3,loftedPass:.85,curl:.45,ballControl:.5}, positions:{AMF:1,CMF:.96,SS:.88,DMF:.64,LMF:.78,RMF:.78,LWF:.56,RWF:.56,LB:.52,RB:.52}, tags:['creation'] },
  { id:'hold_up', label:'Proteção e apoio', attrs:['physicalContact','balance','ballControl','offensiveAwareness'], weights:{physicalContact:1.3,balance:1,ballControl:.65,offensiveAwareness:.45}, positions:{CF:1,SS:.58,AMF:.35,DMF:.4,CB:.3}, tags:['physical','control'] },
  { id:'aerial_finish', label:'Disputa aérea ofensiva', attrs:['heading','jump','physicalContact','offensiveAwareness'], weights:{heading:1.35,jump:1.1,physicalContact:1,offensiveAwareness:.8}, positions:{CF:1,SS:.3,CB:.22,AMF:.12}, tags:['aerial','physical','finishing'] },
  { id:'aerial_defend', label:'Defesa aérea', attrs:['heading','jump','physicalContact','defensiveAwareness'], weights:{heading:.85,jump:1,physicalContact:1.15,defensiveAwareness:1.4}, positions:{CB:1,DMF:.72,LB:.4,RB:.4,CMF:.2}, tags:['aerial','defending','physical'] },
  { id:'press_recover', label:'Pressão e recuperação', attrs:['stamina','defensiveEngagement','aggression','speed','acceleration'], weights:{stamina:.9,defensiveEngagement:1.3,aggression:.85,speed:.6,acceleration:.75}, positions:{DMF:.9,CMF:.9,LMF:.82,RMF:.82,LB:.78,RB:.78,AMF:.5,SS:.48,CF:.34,CB:.58}, tags:['defending','stamina','movement'] },
  { id:'intercept', label:'Interceptação', attrs:['defensiveAwareness','defensiveEngagement','tackling','speed'], weights:{defensiveAwareness:1.55,defensiveEngagement:1.3,tackling:1.05,speed:.45}, positions:{DMF:1,CB:1,CMF:.78,LB:.86,RB:.86,LMF:.48,RMF:.48,AMF:.2}, tags:['defending'] },
  { id:'defensive_duel', label:'Duelo defensivo', attrs:['tackling','physicalContact','aggression','balance'], weights:{tackling:1.3,physicalContact:1.15,aggression:1,balance:.55}, positions:{CB:1,DMF:.94,LB:.84,RB:.84,CMF:.66,LMF:.42,RMF:.42}, tags:['defending','physical'] },
  { id:'cover_space', label:'Cobertura de espaço', attrs:['defensiveAwareness','speed','acceleration','stamina'], weights:{defensiveAwareness:1.5,speed:.8,acceleration:.8,stamina:.7}, positions:{CB:1,LB:1,RB:1,DMF:.9,CMF:.58,LMF:.5,RMF:.5}, tags:['defending','movement','stamina'] },
  { id:'build_out', label:'Saída de bola', attrs:['lowPass','ballControl','defensiveAwareness','tightPossession'], weights:{lowPass:1.25,ballControl:.7,defensiveAwareness:.85,tightPossession:.55}, positions:{CB:.78,DMF:1,CMF:.86,LB:.72,RB:.72,GK:.12}, tags:['creation','defending','control'] },
  { id:'cross_support', label:'Apoio e cruzamento', attrs:['loftedPass','curl','speed','stamina'], weights:{loftedPass:1.35,curl:1,speed:.55,stamina:.55}, positions:{LB:.86,RB:.86,LMF:.78,RMF:.78,LWF:.52,RWF:.52}, tags:['creation','movement'] },
  { id:'gk_position', label:'Posicionamento do goleiro', attrs:['goalkeeperAwareness','goalkeeperReach','goalkeeperReflexes'], weights:{goalkeeperAwareness:1.45,goalkeeperReach:1.15,goalkeeperReflexes:1}, positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_reflex', label:'Defesa por reflexo', attrs:['goalkeeperReflexes','goalkeeperReach','goalkeeperParrying'], weights:{goalkeeperReflexes:1.5,goalkeeperReach:1.1,goalkeeperParrying:.9}, positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_secure', label:'Controle de rebote', attrs:['goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying'], weights:{goalkeeperAwareness:1.1,goalkeeperCatching:1.25,goalkeeperParrying:1.15}, positions:{GK:1}, tags:['goalkeeper'] }
];

const clamp = (v:number,min=0,max=100) => Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const norm = (v:unknown) => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const average = (values:number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
const attr = (attrs:Attributes,key:AttributeKey) => clamp(Number(attrs[key] ?? 50),1,99);
const round1 = (v:number) => Number(v.toFixed(1));

function cardKey(parsed:ParsedCard) {
  return cardIdentityFingerprintR126(parsed);
}

function normalizedConfidence(parsed:ParsedCard) {
  const raw=Number(parsed.confidence ?? 0);
  const conf=raw<=1 ? raw*100 : raw;
  const coverage=clamp(Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length)*4,0,100);
  return clamp(conf*.7+coverage*.3);
}

function activationWeight(status:string) {
  if(status==='LIKELY_ACTIVE') return 1;
  if(status==='UNVERIFIED_POSITION') return .55;
  if(status==='CHECK_POSITION') return .15;
  if(status==='LIKELY_INACTIVE') return 0;
  return .2;
}

function buildUsageContextR125(input:AnalysisResult, parsed:ParsedCard, targetOverride?:PositionCode):UsageContextR125 {
  const targetPosition=targetOverride ?? input.bestPosition?.code ?? parsed.mainPosition;
  const offensiveStyle=parsed.offensivePlaystyle ?? parsed.playstyle ?? null;
  const defensiveStyle=parsed.defensivePlaystyle ?? null;
  const offensiveActivation=inspectPlaystyleActivationR124(offensiveStyle,'OFFENSIVE',targetPosition);
  const defensiveActivation=inspectPlaystyleActivationR124(defensiveStyle,'DEFENSIVE',targetPosition);
  const offensiveStyleWeight=activationWeight(offensiveActivation.status);
  const defensiveStyleConfirmed=defensiveStyle==='Básico' || Boolean(parsed.defensivePlaystyleConfirmed);
  const defensiveStyleWeight=defensiveStyleConfirmed ? activationWeight(defensiveActivation.status) : 0;
  const usagePositionChanged=targetPosition!==parsed.mainPosition;
  const neutralRoleMode=usagePositionChanged && (
    (Boolean(offensiveStyle) && offensiveStyleWeight<=.15) ||
    (Boolean(defensiveStyle) && defensiveStyleWeight<=.15)
  );
  return {targetPosition,naturalPosition:parsed.mainPosition,usagePositionChanged,offensiveStyle,defensiveStyle,offensiveActivation,defensiveActivation,offensiveStyleWeight,defensiveStyleWeight,defensiveStyleConfirmed,neutralRoleMode};
}

function publicPlaystyleContextR125(context:UsageContextR125):CleanSlate2027R119['playstyleContext'] {
  const note=!context.defensiveStyleConfirmed && context.defensiveStyle && context.defensiveStyle!=='Básico'
    ? `O estilo defensivo ${context.defensiveStyle} ainda é provisório e recebe peso zero. A ficha usa função + atributos + habilidades até a confirmação.`
    : context.neutralRoleMode
      ? `A carta está sendo usada em ${context.targetPosition}; pelo menos um estilo não tem ativação confiável nessa posição. O motor usa função + atributos + habilidades e não força a receita do estilo cinza/inativo.`
      : `A carta está sendo otimizada para ${context.targetPosition}; estilos só entram como evidência proporcional quando a ativação é compatível.`;
  return {
    offensive:{style:context.offensiveStyle,status:context.offensiveActivation.status,activeWeight:round1(context.offensiveStyleWeight)},
    defensive:{style:context.defensiveStyle,status:context.defensiveActivation.status,activeWeight:round1(context.defensiveStyleWeight)},
    neutralRoleMode:context.neutralRoleMode,
    note
  };
}

function positionRelevance(action:ActionDef, parsed:ParsedCard, context:UsageContextR125) {
  const target=action.positions[context.targetPosition] ?? 0;
  const natural=action.positions[parsed.mainPosition] ?? 0;
  const alternates=(parsed.positions??[])
    .filter(p=>p!==parsed.mainPosition && p!==context.targetPosition)
    .map(p=>action.positions[p]??0);
  if(!context.usagePositionChanged) return Math.max(target,natural,...alternates.map(value=>value*.34),0);
  // A função escolhida manda no uso em campo. A posição natural continua apenas
  // como resíduo de DNA, para uma adaptação não transformar a carta em outro jogador.
  return Math.max(target,natural*.18,...alternates.map(value=>value*.10),0);
}

function skillText(parsed:ParsedCard) {
  return norm([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].join(' | '));
}

function skillActionEvidence(action:ActionDef,parsed:ParsedCard) {
  const skills=skillText(parsed);
  let proof=0;
  if(action.tags.includes('finishing') && /chute|finaliza|efeito de longe|curva descendente|blitz|fenomenal|garra/.test(skills)) proof=Math.max(proof,.68);
  if(action.tags.includes('technical') && /toque duplo|elastico|giro|sola|drible|pes magneticos|impulso/.test(skills)) proof=Math.max(proof,.72);
  if(action.tags.includes('creation') && /passe|visionario|passador|cruzamento|toque de calcanhar/.test(skills)) proof=Math.max(proof,.68);
  if(action.tags.includes('defending') && /intercept|bloqueador|marcacao|carrinho|esticada|fortaleza/.test(skills)) proof=Math.max(proof,.74);
  if(action.tags.includes('aerial') && /cabec|superioridade aerea|fortaleza aerea/.test(skills)) proof=Math.max(proof,.92);
  if(action.tags.includes('goalkeeper') && /goleiro|penalti|comandante|rugido/.test(skills)) proof=Math.max(proof,.82);
  if(action.tags.includes('stamina') && /espirito guerreiro|lideranca|garra/.test(skills)) proof=Math.max(proof,.58);
  if(action.tags.includes('movement') && /drible explosivo|impulso ofensivo|sombra veloz|super substituto/.test(skills)) proof=Math.max(proof,.58);
  if(action.tags.includes('physical') && /espirito guerreiro|fortaleza|garra|superioridade aerea/.test(skills)) proof=Math.max(proof,.54);
  return clamp(proof,0,1);
}

const OFFENSIVE_STYLE_ACTION_EVIDENCE_R125: Record<string, Partial<Record<string,number>>> = {
  'artilheiro': {attack_space:.27,finish_box:.30,turn_finish:.10,long_finish:.07},
  'homem de area': {finish_box:.30,aerial_finish:.28,hold_up:.12,attack_space:.07},
  'pivo': {hold_up:.31,aerial_finish:.24,short_creation:.16,finish_box:.12},
  'puxa marcacao': {attack_space:.29,short_creation:.15,finish_box:.14,turn_finish:.08},
  'atacante pivo': {hold_up:.25,short_creation:.27,through_creation:.15,finish_box:.10},
  'infiltracao': {attack_space:.30,finish_box:.21,carry:.13,long_finish:.10},
  'classico 10': {short_creation:.28,through_creation:.25,close_control:.23,long_finish:.12},
  'armador criativo': {short_creation:.29,through_creation:.29,close_control:.19,carry:.12},
  'perito em cruzamento': {cross_support:.33,through_creation:.12},
  'lateral movel': {carry:.27,close_control:.17,cross_support:.19,attack_space:.12},
  'ala produtivo': {carry:.25,attack_space:.23,cross_support:.19,close_control:.14},
  'orquestrador': {short_creation:.29,through_creation:.27,build_out:.25,close_control:.12},
  '1 volante': {build_out:.25,intercept:.22,cover_space:.21,defensive_duel:.13},
  'meia versatil': {press_recover:.25,short_creation:.16,carry:.14,cover_space:.13},
  'lateral ofensivo': {cross_support:.28,carry:.17,attack_space:.13,press_recover:.08},
  'lateral defensivo': {cover_space:.27,intercept:.25,defensive_duel:.19,build_out:.11},
  'lateral atacante': {attack_space:.21,carry:.19,cross_support:.19,long_finish:.14},
  'defensor criativo': {build_out:.31,intercept:.16,cover_space:.13,aerial_defend:.10},
  'atacante surpresa': {aerial_finish:.21,finish_box:.17,attack_space:.14,carry:.09},
  'high line gk': {gk_position:.29,gk_reflex:.18,build_out:.10}
};

const DEFENSIVE_STYLE_ACTION_EVIDENCE_R125: Record<string, Partial<Record<string,number>>> = {
  'pressao no ataque': {press_recover:.31,cover_space:.13,intercept:.10},
  'front line poacher': {press_recover:.27,intercept:.11},
  'attack outlet': {hold_up:.18,attack_space:.15},
  'pass disruptor': {intercept:.29,press_recover:.19,cover_space:.10},
  'meia versatil': {press_recover:.27,cover_space:.19,intercept:.13},
  'all action defender': {press_recover:.25,intercept:.23,cover_space:.21,defensive_duel:.19},
  '1 volante': {intercept:.29,cover_space:.26,defensive_duel:.18,build_out:.12},
  'covering role': {cover_space:.33,intercept:.19,aerial_defend:.11},
  'high line master': {cover_space:.29,intercept:.21,build_out:.10},
  'destruidor': {defensive_duel:.31,press_recover:.23,intercept:.19,aerial_defend:.12},
  'sweeper gk': {gk_position:.29,gk_reflex:.18,build_out:.13},
  'goleiro ofensivo': {gk_position:.26,gk_reflex:.15,build_out:.11},
  'goleiro defensivo': {gk_secure:.28,gk_position:.23,gk_reflex:.19}
};

function styleActionEvidence(action:ActionDef,context:UsageContextR125) {
  const offensiveCanonical=norm(context.offensiveActivation.canonical ?? context.offensiveStyle);
  const defensiveCanonical=norm(context.defensiveActivation.canonical ?? context.defensiveStyle);
  const offensiveProof=Number(OFFENSIVE_STYLE_ACTION_EVIDENCE_R125[offensiveCanonical]?.[action.id]??0)*context.offensiveStyleWeight;
  const defensiveProof=Number(DEFENSIVE_STYLE_ACTION_EVIDENCE_R125[defensiveCanonical]?.[action.id]??0)*context.defensiveStyleWeight;
  // Estilo é evidência comportamental, nunca receita. A ação ainda precisa provar
  // relevância de posição, capacidade da carta e/ou habilidades reais.
  return clamp(Math.max(offensiveProof,defensiveProof),0,1);
}

function actionQuality(attrs:Attributes, action:ActionDef) {
  const weighted=action.attrs.map(key=>({value:attr(attrs,key),weight:Math.max(.05,Number(action.weights?.[key]??1))}));
  if(!weighted.length) return 0;
  const totalWeight=weighted.reduce((sum,item)=>sum+item.weight,0);
  const mean=weighted.reduce((sum,item)=>sum+item.value*item.weight,0)/Math.max(.01,totalWeight);
  const primary=weighted.filter(item=>item.weight>=.95);
  const bottleneck=Math.min(...(primary.length?primary:weighted).map(item=>item.value));
  // Um atributo secundário (ex.: equilíbrio numa finalização) não vale o mesmo que
  // Finalização/Consciência ofensiva. Isso remove a vantagem matemática artificial
  // de grupos que elevam vários atributos apenas periféricos de uma ação.
  return mean*.88+bottleneck*.12;
}

function naturalActionFrequency(action:ActionDef,parsed:ParsedCard,context:UsageContextR125) {
  const relevance=positionRelevance(action,parsed,context);
  if(relevance<=0) return 0;
  const targetDuty=action.positions[context.targetPosition] ?? 0;
  const naturalDuty=action.positions[parsed.mainPosition] ?? 0;
  const natural=actionQuality(parsed.attributes,action);
  const capability=Math.pow(clamp((natural-54)/45,0,1),1.3);
  const skillProof=skillActionEvidence(action,parsed);
  const styleProof=styleActionEvidence(action,context);
  // A posição de uso define quais ações aparecem; atributos e habilidades definem
  // o quão natural é executá-las. Estilo inativo/cinza não impõe receita.
  const roleFloor=context.usagePositionChanged
    ? targetDuty*.27 + naturalDuty*.025
    : targetDuty*.14;
  let frequency=roleFloor+relevance*(.41*capability+.34*skillProof+.08*styleProof);
  if(action.tags.includes('aerial')) {
    const aerial=average(['heading','jump','physicalContact'].map(k=>attr(parsed.attributes,k as AttributeKey)));
    const aerialProof=/cabec|superioridade aerea|fortaleza aerea/.test(skillText(parsed));
    if(!aerialProof) frequency*=aerial>=84?.78:.55;
    else frequency*=1.08;
  }
  // v6.0: a Konami reduziu parte da correção automática de linhas e passou a
  // diferenciar mais a reação defensiva por Talento/Dedicação defensiva e
  // pela habilidade Interceptação. Isso é contexto de frequência, não receita.
  if(action.id==='intercept' && /interceptacao/.test(skillText(parsed))) frequency*=1.12;
  if(action.id==='press_recover' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle)) && context.defensiveStyleWeight>.5) frequency*=1.14;
  if(action.id==='cover_space' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle)) && context.defensiveStyleWeight>.5) frequency*=1.06;
  return clamp(frequency,0,1);
}

function activeMatchCalibration(input:AnalysisResult) {
  return input.matchEvidenceCalibrationR136 ?? input.matchEvidenceCalibrationR135;
}

function matchNeedMultiplierR135(input:AnalysisResult, actionId:string) {
  const calibration=activeMatchCalibration(input);
  if(!calibration || calibration.status!=='ACTIVE') return 1;
  const adjustment=clamp(Number(calibration.actionNeedAdjustments?.[actionId]??0),0,.12);
  return 1+adjustment;
}

function compactPlanFromTrainingR147(plan:TrainingPlan):CompactPlanR147 {
  const levels=new Array<number>(TRAINING_KEYS.length);
  for(let index=0;index<TRAINING_KEYS.length;index++) levels[index]=Number(plan[TRAINING_KEYS[index]]??0);
  return levels;
}

function trainingPlanDistanceR184(a:TrainingPlan,b:TrainingPlan) {
  return TRAINING_KEYS.reduce((sum,key)=>sum+Math.abs(Number(a[key]??0)-Number(b[key]??0)),0);
}

function materializeTrainingPlanR147(levels:CompactPlanR147):TrainingPlan {
  const plan=emptyTraining();
  for(let index=0;index<TRAINING_KEYS.length;index++) plan[TRAINING_KEYS[index]]=Number(levels[index]??0);
  return plan;
}

function projectedCompiledAttributeR147(levels:CompactPlanR147,attribute:CompiledAttributeR146) {
  return clamp(attribute.base+(attribute.groupIndex>=0?Number(levels[attribute.groupIndex]??0):0),1,99);
}

function projectedActionQualityR147(levels:CompactPlanR147,item:EvaluationActionR143) {
  if(!item.compiledAttributes.length) return 0;
  let totalWeight=0;
  let weightedSum=0;
  let primaryMin=Infinity;
  let allMin=Infinity;
  let hasPrimary=false;
  for(const attribute of item.compiledAttributes) {
    const value=projectedCompiledAttributeR147(levels,attribute);
    totalWeight+=attribute.weight;
    weightedSum+=value*attribute.weight;
    allMin=Math.min(allMin,value);
    if(attribute.primary) { hasPrimary=true; primaryMin=Math.min(primaryMin,value); }
  }
  const mean=weightedSum/Math.max(.01,totalWeight);
  const bottleneck=hasPrimary?primaryMin:allMin;
  return mean*.88+bottleneck*.12;
}

function groupNaturalStrength(parsed:ParsedCard,key:TrainingKey) {
  return average(TRAINING_ATTRIBUTES[key].map(a=>attr(parsed.attributes,a)));
}

const TRAINING_REASON_LABELS: Record<TrainingKey,string> = {
  shooting:'Finalização', passing:'Passe', dribbling:'Drible', dexterity:'Destreza',
  lowerBodyStrength:'Força nas pernas', aerialStrength:'Bola aérea', defending:'Defesa',
  gk1:'Goleiro 1', gk2:'Goleiro 2', gk3:'Goleiro 3'
};

function actionPressureKeys(action:ActionDef): AttributeKey[] {
  if(action.tags.includes('goalkeeper')) return ['goalkeeperAwareness','goalkeeperReflexes','goalkeeperReach'];
  if(action.tags.includes('defending')) return ['defensiveAwareness','defensiveEngagement','speed','acceleration','balance','stamina'];
  if(action.tags.includes('creation')) return ['ballControl','tightPossession','lowPass','balance','acceleration'];
  if(action.tags.includes('technical')) return ['ballControl','dribbling','tightPossession','balance','acceleration'];
  if(action.tags.includes('finishing')) return ['offensiveAwareness','finishing','ballControl','balance','acceleration'];
  if(action.tags.includes('movement')) return ['speed','acceleration','balance','stamina'];
  if(action.tags.includes('physical')) return ['physicalContact','balance','stamina'];
  return action.attrs;
}

function buildEvaluationContextR143(input:AnalysisResult,parsed:ParsedCard,actionFrequencies:Map<string,number>):EvaluationContextR143 {
  const actionSeeds=ACTIONS
    .map(action=>{
      const frequency=actionFrequencies.get(action.id)??0;
      const matchNeedMultiplier=matchNeedMultiplierR135(input,action.id);
      return {action,frequency,natural:actionQuality(parsed.attributes,action),matchNeedMultiplier,decisionWeight:frequency*matchNeedMultiplier,pressureKeys:[...new Set(actionPressureKeys(action))]};
    })
    .filter(item=>item.frequency>.01);
  const attributeBases:Partial<Record<AttributeKey,number>>={};
  const requiredAttributes=new Set<AttributeKey>();
  for(const item of actionSeeds) {
    for(const key of item.action.attrs) requiredAttributes.add(key);
    for(const key of item.pressureKeys) requiredAttributes.add(key);
  }
  for(const attributes of Object.values(TRAINING_ATTRIBUTES)) for(const key of attributes) requiredAttributes.add(key);
  for(const key of requiredAttributes) attributeBases[key]=attr(parsed.attributes,key);
  const compileAttribute=(key:AttributeKey):CompiledAttributeR146=>{
    const group=ATTRIBUTE_TRAINING_GROUP_R144[key];
    return {base:attributeBases[key]??50,groupIndex:group===undefined?-1:TRAINING_KEY_INDEX_R147[group]};
  };
  const actions:EvaluationActionR143[]=actionSeeds.map(item=>({
    ...item,
    compiledAttributes:item.action.attrs.map(key=>{
      const weight=Math.max(.05,Number(item.action.weights?.[key]??1));
      return {...compileAttribute(key),weight,primary:weight>=.95};
    }),
    compiledPressureAttributes:item.pressureKeys.map(compileAttribute)
  }));
  const groupProfiles:EvaluationGroupR143[]=[];
  for(const key of TRAINING_KEYS) {
    const naturalStrength=groupNaturalStrength(parsed,key);
    const impacted=ACTIONS.filter(action=>TRAINING_ATTRIBUTES[key].some(attribute=>action.attrs.includes(attribute))).reduce((sum,action)=>sum+(actionFrequencies.get(action.id)??0),0);
    const evidenceFit=clamp(impacted*43,0,100);
    const identityFit=clamp(naturalStrength*.58+evidenceFit*.42);
    const identityBonusByLevel=Array.from({length:17},(_,level)=>level?level*Math.pow(naturalStrength/100,1.8)*Math.min(1.25,impacted*.22)*.12:0);
    const weakRepairPenaltyByLevel=Array.from({length:17},(_,level)=>level && naturalStrength<60 && impacted<1.05?level*(60-naturalStrength)*.018:0);
    const excessPenaltyByLevel=Array.from({length:17},(_,level)=>{
      if(!level) return 0;
      let excessPenalty=0;
      if(level>10) {
        const support=Math.min(1,impacted/1.8);
        excessPenalty+=(level-10)*(.12+(1-support)*.42);
      }
      const saturated=TRAINING_ATTRIBUTES[key].filter(attribute=>attr(parsed.attributes,attribute)+level>=99).length/TRAINING_ATTRIBUTES[key].length;
      if(saturated>0) excessPenalty+=level*saturated*.055;
      return excessPenalty;
    });
    groupProfiles.push({naturalStrength,impacted,identityFit,identityBonusByLevel,weakRepairPenaltyByLevel,excessPenaltyByLevel});
  }
  const staminaActionIds=['press_recover','cover_space','cross_support','attack_space','carry'];
  const staminaDemand=clamp(average(staminaActionIds.map(id=>actionFrequencies.get(id)??0)),0,1);
  return {
    actions,groupProfiles,attributeBases,stamina:compileAttribute('stamina'),staminaDemand,staminaFloor:68+staminaDemand*20,
    aerialSupport:Math.max(actionFrequencies.get('aerial_finish')??0,actionFrequencies.get('aerial_defend')??0),
    compiledActionAttributeCount:actions.reduce((sum,item)=>sum+item.compiledAttributes.length,0),
    compiledPressureAttributeCount:actions.reduce((sum,item)=>sum+item.compiledPressureAttributes.length,0)
  };
}

type CompactEvaluationR148 = {
  score:number;
  actionScore:number;
  actionGain:number;
  online:{
    rankedScore:number;
    friendsScore:number;
    pressureReliability:number;
    matchConsistency:number;
    staminaSustainability:number;
    identityPreservation:number;
  };
  details:CleanSlateActionR119[];
};

type EvaluationModeR149 = 'SCORE_ONLY' | 'SUMMARY' | 'FULL';

function evaluateCompactKernelR149(levels:CompactPlanR147,context:EvaluationContextR143,mode:'SCORE_ONLY'):number;
function evaluateCompactKernelR149(levels:CompactPlanR147,context:EvaluationContextR143,mode:'SUMMARY'|'FULL'):CompactEvaluationR148;
function evaluateCompactKernelR149(levels:CompactPlanR147,context:EvaluationContextR143,mode:EvaluationModeR149):number|CompactEvaluationR148 {
  const includeDetails=mode==='FULL';
  let weighted=0,weightTotal=0,improvement=0;
  let pressureWeighted=0,pressureTotal=0;
  const details:CleanSlateActionR119[]|null=includeDetails?[]:null;
  for(let index=0;index<context.actions.length;index++) {
    const item=context.actions[index];
    const projectedScore=projectedActionQualityR147(levels,item);
    weighted+=projectedScore*item.decisionWeight;
    improvement+=(projectedScore-item.natural)*item.decisionWeight;
    weightTotal+=item.decisionWeight;
    if(item.compiledPressureAttributes.length) {
      let pressureSum=0;
      let weakest=Infinity;
      for(const attribute of item.compiledPressureAttributes) {
        const value=projectedCompiledAttributeR147(levels,attribute);
        pressureSum+=value;
        weakest=Math.min(weakest,value);
      }
      const mean=pressureSum/item.compiledPressureAttributes.length;
      const reliable=projectedScore*.55+mean*.25+weakest*.20;
      pressureWeighted+=reliable*item.frequency;
      pressureTotal+=item.frequency;
    }
    if(details) details.push({id:item.action.id,label:item.action.label,naturalScore:round1(item.natural),projectedScore:round1(projectedScore),frequency:round1(item.frequency*100),contribution:round1(projectedScore*item.decisionWeight),matchNeedMultiplier:round1(item.matchNeedMultiplier)});
  }
  const actionScore=weightTotal?weighted/weightTotal:0;
  const actionGain=weightTotal?improvement/weightTotal:0;
  let identityBonus=0,weakRepairPenalty=0,excessPenalty=0;
  let identityWeighted=0,identityTotal=0;
  const projectedStamina=projectedCompiledAttributeR147(levels,context.stamina);
  const fatiguePenalty=Math.max(0,context.staminaFloor-projectedStamina)*context.staminaDemand*.12;
  for(let index=0;index<TRAINING_KEYS.length;index++) {
    const level=Number(levels[index]??0); if(!level) continue;
    const group=context.groupProfiles[index];
    identityBonus+=group?.identityBonusByLevel[level]??0;
    weakRepairPenalty+=group?.weakRepairPenaltyByLevel[level]??0;
    excessPenalty+=group?.excessPenaltyByLevel[level]??0;
    identityWeighted+=(group?.identityFit??0)*level;
    identityTotal+=level;
  }
  const aerialLevel=Number(levels[AERIAL_STRENGTH_INDEX_R147]??0);
  if(aerialLevel>4 && context.aerialSupport<.5) excessPenalty+=(aerialLevel-4)*.9;
  if(aerialLevel>7 && context.aerialSupport<.72) excessPenalty+=(aerialLevel-7)*.7;
  if(aerialLevel>=10 && context.aerialSupport<.82) excessPenalty+=(aerialLevel-9)*1.05;
  const pressureReliability=pressureTotal?clamp(pressureWeighted/pressureTotal):0;
  const identityPreservation=identityTotal?clamp(identityWeighted/identityTotal):100;
  const staminaSustainability=clamp(100-Math.max(0,context.staminaFloor-projectedStamina)*(2.4+context.staminaDemand*1.8));
  const rankedScore=clamp(actionScore*.48+pressureReliability*.24+staminaSustainability*.16+identityPreservation*.12);
  const friendsScore=clamp(actionScore*.58+pressureReliability*.17+staminaSustainability*.12+identityPreservation*.13);
  const onlineCompetitive=rankedScore*.65+friendsScore*.35;
  const score=onlineCompetitive+actionGain*.52+identityBonus-weakRepairPenalty-excessPenalty-fatiguePenalty;
  if(mode==='SCORE_ONLY') return score;
  const matchConsistency=clamp(actionScore*.42+pressureReliability*.28+staminaSustainability*.18+identityPreservation*.12);
  const online={rankedScore,friendsScore,pressureReliability,matchConsistency,staminaSustainability,identityPreservation};
  const outputDetails=details??[];
  return {score,actionScore,actionGain,online,details:includeDetails?outputDetails.sort((a,b)=>b.contribution-a.contribution):outputDetails};
}

function evaluateCompactPlanR148(levels:CompactPlanR147,context:EvaluationContextR143,includeDetails=true) {
  return evaluateCompactKernelR149(levels,context,includeDetails?'FULL':'SUMMARY');
}

function evaluatePlan(input:AnalysisResult,parsed:ParsedCard,plan:TrainingPlan,actionFrequencies:Map<string,number>,includeDetails=true,evaluationContext?:EvaluationContextR143) {
  const context=evaluationContext??buildEvaluationContextR143(input,parsed,actionFrequencies);
  return evaluateCompactPlanR148(compactPlanFromTrainingR147(plan),context,includeDetails);
}

function planCacheKeyR144(plan:TrainingPlan) {
  let value=0;
  let factor=1;
  for(const key of TRAINING_KEYS) {
    value+=Number(plan[key]??0)*factor;
    factor*=17;
  }
  return value;
}

function compareCompactSignatureEquivalentR147(a:CompactPlanR147,b:CompactPlanR147) {
  for(let index=0;index<TRAINING_KEYS.length;index++) {
    const left=Number(a[index]??0);
    const right=Number(b[index]??0);
    if(left===right) continue;
    return TRAINING_LEVEL_TEXT_R145[left].localeCompare(TRAINING_LEVEL_TEXT_R145[right]);
  }
  return 0;
}

function compareCompactCandidateR147(scoreA:number,levelsA:CompactPlanR147,scoreB:number,levelsB:CompactPlanR147,onTie:()=>void) {
  const scoreOrder=scoreB-scoreA;
  if(scoreOrder!==0) return scoreOrder;
  onTie();
  return compareCompactSignatureEquivalentR147(levelsA,levelsB);
}

function insertCompactBeamR147(list:BeamState[],levels:CompactPlanR147,score:number,cacheKey:number,width:number,onTie:()=>void) {
  if(list.length>=width && compareCompactCandidateR147(score,levels,list[list.length-1].score,list[list.length-1].levels,onTie)>=0) return 'REJECTED' as const;
  let insertion=-1;
  for(let index=0;index<list.length;index++) {
    if(compareCompactCandidateR147(score,levels,list[index].score,list[index].levels,onTie)<0) { insertion=index; break; }
  }
  const state:BeamState={levels:levels.slice(),score,cacheKey};
  if(insertion<0) list.push(state);
  else list.splice(insertion,0,state);
  if(list.length>width) list.length=width;
  return 'INSERTED' as const;
}

type PlanEvaluationR144 = ReturnType<typeof evaluatePlan>;
type DiagnosticEvaluatorR144 = {
  evaluate:(plan:TrainingPlan)=>PlanEvaluationR144;
  stats:()=>{uniqueEvaluations:number;cacheHits:number};
};

function createDiagnosticEvaluatorR144(
  input:AnalysisResult,
  parsed:ParsedCard,
  frequencies:Map<string,number>,
  evaluationContext:EvaluationContextR143,
  seedPlan?:TrainingPlan,
  seedEvaluation?:PlanEvaluationR144
):DiagnosticEvaluatorR144 {
  const cache=new Map<number,PlanEvaluationR144>();
  let uniqueEvaluations=0;
  let cacheHits=0;
  if(seedPlan && seedEvaluation) cache.set(planCacheKeyR144(seedPlan),seedEvaluation);
  return {
    evaluate(plan) {
      const cacheKey=planCacheKeyR144(plan);
      const cached=cache.get(cacheKey);
      if(cached) { cacheHits++; return cached; }
      const evaluation=evaluatePlan(input,parsed,plan,frequencies,false,evaluationContext);
      cache.set(cacheKey,evaluation);
      uniqueEvaluations++;
      return evaluation;
    },
    stats:()=>({uniqueEvaluations,cacheHits})
  };
}

function optimizeTraining(input:AnalysisResult,parsed:ParsedCard,budget:number,context:UsageContextR125) {
  const frequencies=new Map(ACTIONS.map(a=>[a.id,naturalActionFrequency(a,parsed,context)]));
  const allowed=context.targetPosition==='GK'?GK_KEYS:FIELD_KEYS;
  const allowedIndexes=allowed.map(key=>TRAINING_KEY_INDEX_R147[key]);
  const byCost:Array<BeamState[]>=Array.from({length:budget+1},()=>[]);
  const seenByCost:Array<Set<number>>=Array.from({length:budget+1},()=>new Set<number>());
  const evaluationContext=buildEvaluationContextR143(input,parsed,frequencies);
  let uniqueEvaluations=0;
  let cacheHits=0;
  let duplicateStatesSkipped=0;
  let orderedBeamInsertions=0;
  let orderedBeamRejections=0;
  let incrementalKeyDerivations=0;
  let tieBreakComparisons=0;
  let scratchVectorsAllocated=0;
  let beamStateVectorsMaterialized=1;
  let rejectedCandidatesWithoutStateCopy=0;
  const scoreForLevels=(levels:CompactPlanR147) => {
    uniqueEvaluations++;
    return evaluateCompactKernelR149(levels,evaluationContext,'SCORE_ONLY');
  };
  const zeroLevels=new Array<number>(TRAINING_KEYS.length).fill(0);
  const zeroCacheKey=0;
  seenByCost[0].add(zeroCacheKey);
  byCost[0].push({levels:zeroLevels,score:scoreForLevels(zeroLevels),cacheKey:zeroCacheKey});
  let candidates=1;
  const BEAM=20;
  const onTie=()=>{ tieBreakComparisons++; };
  for(let cost=0;cost<=budget;cost++) {
    const states=byCost[cost];
    if(!states.length) continue;
    for(const state of states) {
      const scratch=state.levels.slice();
      scratchVectorsAllocated++;
      for(let allowedIndex=0;allowedIndex<allowed.length;allowedIndex++) {
        const key=allowed[allowedIndex];
        const keyIndex=allowedIndexes[allowedIndex];
        const current=state.levels[keyIndex]??0;
        if(current>=16) continue;
        const next=current+1;
        const step=trainingLevelCost(next);
        const target=cost+step;
        if(target>budget) continue;
        scratch[keyIndex]=next;
        const cacheKey=state.cacheKey+PLAN_KEY_FACTOR_R145[key];
        incrementalKeyDerivations++;
        candidates++;
        if(seenByCost[target].has(cacheKey)) {
          duplicateStatesSkipped++;
          cacheHits++;
          scratch[keyIndex]=current;
          continue;
        }
        seenByCost[target].add(cacheKey);
        const score=scoreForLevels(scratch);
        const insertion=insertCompactBeamR147(byCost[target],scratch,score,cacheKey,BEAM,onTie);
        if(insertion==='INSERTED') { orderedBeamInsertions++; beamStateVectorsMaterialized++; }
        else { orderedBeamRejections++; rejectedCandidatesWithoutStateCopy++; }
        scratch[keyIndex]=current;
      }
    }
  }
  let chosen=byCost[budget][0];
  if(!chosen) {
    for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  }
  const chosenLevels=chosen?.levels??zeroLevels;
  const plan=materializeTrainingPlanR147(chosenLevels);
  const finalistStates=(byCost[budget]?.length ? byCost[budget] : chosen ? [chosen] : []).slice(0,12);
  return {
    plan,candidates,frequencies,
    evaluation:evaluateCompactPlanR148(chosenLevels,evaluationContext,true),
    evaluationContext,finalistStates,
    searchOptimizationR143:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R143_VERSION,generatedStates:candidates,uniqueEvaluations,cacheHits,beamWidth:20 as const,heuristicChanged:false as const,scoreOnlySearch:true as const,projectedAttributesReused:true as const},
    searchOptimizationR144:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R144_VERSION,generatedStates:candidates,duplicateStatesSkipped,uniqueFrontierStates:candidates-duplicateStatesSkipped,orderedBeamInsertions,orderedBeamRejections,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,earlyDuplicateSuppression:true as const,orderedBeamInsertion:true as const,sharedDiagnosticMemo:true as const},
    searchOptimizationR145:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R145_VERSION,generatedStates:candidates,duplicateStatesSkipped,uniqueFrontierStates:candidates-duplicateStatesSkipped,incrementalKeyDerivations,fullKeyRecomputations:1,redundantBeamDuplicateScans:0,textualSignaturesAllocated:0,tieBreakComparisons,searchScoreCacheEntries:0,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,incrementalStateKey:true as const,preBeamDedupAuthoritative:true as const,lazyTieBreak:true as const,scoreCacheElided:true as const},
    searchOptimizationR146:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R146_VERSION,generatedStates:candidates,uniqueFrontierStates:candidates-duplicateStatesSkipped,compiledActionAttributes:evaluationContext.compiledActionAttributeCount,compiledPressureAttributes:evaluationContext.compiledPressureAttributeCount,compiledGroupLevelProfiles:TRAINING_KEYS.length*17,projectedScoreMapsAllocated:0,repeatedAttributeGroupLookups:0,repeatedStaticGroupMath:0,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,compiledEvaluationKernel:true as const,actionProjectionCompiled:true as const,pressureProjectionCompiled:true as const,groupLevelProfilesCompiled:true as const,projectedScoreArrayAligned:true as const},
    searchOptimizationR147:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R147_VERSION,generatedStates:candidates,uniqueFrontierStates:candidates-duplicateStatesSkipped,compactStateWidth:10 as const,scratchVectorsAllocated,beamStateVectorsMaterialized,rejectedCandidatesWithoutStateCopy,perSuccessorTrainingPlanObjectsAllocated:0 as const,planPropertyLookupsInSearchKernel:0 as const,winnerTrainingPlanMaterializations:1 as const,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,compactSearchState:true as const,scoreBeforeStateMaterialization:true as const,finalistPlansRemainLazy:true as const},
    searchOptimizationR148:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R148_VERSION,generatedStates:candidates,uniqueFrontierStates:candidates-duplicateStatesSkipped,projectedScoreArraysAllocatedInSearch:0 as const,actionPassesPerCandidate:1 as const,separatePressureActionPasses:0 as const,groupPassesPerCandidate:1 as const,separateIdentityGroupPasses:0 as const,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,fusedActionPressurePass:true as const,fusedPenaltyIdentityPass:true as const,arithmeticOrderPreserved:true as const},
    searchOptimizationR149:{version:CLEAN_SLATE_SEARCH_OPTIMIZATION_R149_VERSION,generatedStates:candidates,uniqueFrontierStates:candidates-duplicateStatesSkipped,scoreOnlyEvaluations:uniqueEvaluations,searchResultObjectsAllocated:0 as const,searchDetailArraysAllocated:0 as const,searchOnlineObjectsAllocated:0 as const,winnerFullEvaluations:1 as const,beamWidth:20 as const,heuristicChanged:false as const,beamReduced:false as const,scalarScoreHotPath:true as const,singleEvaluationKernel:true as const,diagnosticEvaluationPreserved:true as const}
  };
}

function pointRationaleR122(parsed:ParsedCard, plan:TrainingPlan, frequencies:Map<string,number>, evaluator:DiagnosticEvaluatorR144) {
  const current=evaluator.evaluate(plan);
  return (Object.keys(plan) as TrainingKey[])
    .filter(key=>Number(plan[key]??0)>0)
    .map(key=>{
      const level=Number(plan[key]??0);
      const previous={...plan,[key]:Math.max(0,level-1)};
      const previousEval=evaluator.evaluate(previous);
      const lastStepCost=trainingLevelCost(level);
      const marginalReturn=round1(current.score-previousEval.score);
      const returnPerCost=round1(marginalReturn/Math.max(1,lastStepCost));
      const actions=ACTIONS
        .filter(action=>TRAINING_ATTRIBUTES[key].some(attribute=>action.attrs.includes(attribute)))
        .map(action=>({label:action.label,frequency:frequencies.get(action.id)??0}))
        .filter(item=>item.frequency>.08)
        .sort((a,b)=>b.frequency-a.frequency)
        .slice(0,3)
        .map(item=>item.label);
      const natural=Math.round(groupNaturalStrength(parsed,key));
      const reason=actions.length
        ? `${TRAINING_REASON_LABELS[key]} +${level}: sustenta ${actions.join(', ')}; base natural ${natural}/99 e retorno marginal online ${marginalReturn>=0?'+':''}${marginalReturn}.`
        : `${TRAINING_REASON_LABELS[key]} +${level}: investimento mantido pelo retorno combinado da carta; base natural ${natural}/99.`;
      return {training:key,label:TRAINING_REASON_LABELS[key],level,lastStepCost,marginalReturn,returnPerCost,actions,reason};
    })
    .sort((a,b)=>b.returnPerCost-a.returnPerCost || b.level-a.level);
}


function localSaturationProfileR123(plan:TrainingPlan, evaluator:DiagnosticEvaluatorR144):CleanSlateSaturationR123[] {
  return (Object.keys(plan) as TrainingKey[])
    .filter(key=>Number(plan[key]??0)>0)
    .map(key=>{
      const level=Number(plan[key]??0);
      const curve:number[]=[];
      for(let step=1;step<=level;step++) {
        const previous={...plan,[key]:step-1};
        const current={...plan,[key]:step};
        const previousEval=evaluator.evaluate(previous);
        const currentEval=evaluator.evaluate(current);
        const cost=Math.max(1,trainingLevelCost(step));
        curve.push((currentEval.score-previousEval.score)/cost);
      }
      const peak=Math.max(...curve,0);
      const last=curve[curve.length-1]??0;
      const recentValues=curve.slice(-Math.min(3,curve.length));
      const recent=average(recentValues);
      const usefulThreshold=Math.max(.018,peak*.34);
      let lowReturnSteps=0;
      for(let index=curve.length-1;index>=0;index--) {
        if(curve[index] < usefulThreshold) lowReturnSteps++;
        else break;
      }
      const ratio=peak>0?last/peak:0;
      const status:CleanSlateSaturationR123['status'] =
        last<=0 || lowReturnSteps>=3 || ratio<.22 ? 'SATURADO'
        : lowReturnSteps>=1 || ratio<.48 ? 'ATENCAO'
        : 'EFICIENTE';
      const reason=status==='SATURADO'
        ? `${TRAINING_REASON_LABELS[key]} chegou a uma zona de retorno local baixo nos últimos níveis; isso é um alerta de redistribuição, não um teto fixo.`
        : status==='ATENCAO'
          ? `${TRAINING_REASON_LABELS[key]} ainda contribui, mas os níveis finais já rendem menos que o pico deste mesmo grupo.`
          : `${TRAINING_REASON_LABELS[key]} mantém retorno competitivo consistente até o nível atual.`;
      return {
        training:key,
        label:TRAINING_REASON_LABELS[key],
        level,
        status,
        peakReturnPerCost:Number(peak.toFixed(3)),
        recentReturnPerCost:Number(recent.toFixed(3)),
        lastReturnPerCost:Number(last.toFixed(3)),
        lowReturnSteps,
        reason
      };
    })
    .sort((a,b)=>{
      const order={SATURADO:0,ATENCAO:1,EFICIENTE:2} as const;
      return order[a.status]-order[b.status] || a.lastReturnPerCost-b.lastReturnPerCost;
    });
}

function labHypothesisR123(primary:TrainingPlan, alternative:TrainingPlan) {
  const changes=(Object.keys(primary) as TrainingKey[])
    .map(key=>({key,delta:Number(alternative[key]??0)-Number(primary[key]??0)}))
    .filter(item=>item.delta!==0)
    .sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))
    .slice(0,3);
  if(!changes.length) return 'Alternativa praticamente idêntica; não há contraste suficiente para um teste A/B útil.';
  const formatted=changes.map(item=>`${item.delta>0?'+':''}${item.delta} ${TRAINING_REASON_LABELS[item.key]}`).join(' • ');
  return `Testa uma redistribuição controlada (${formatted}) mantendo a mesma carta, posição e objetivo competitivo.`;
}

function competitiveLabR123(
  primaryPlan:TrainingPlan,
  finalistStates:BeamState[],
  evaluator:DiagnosticEvaluatorR144
):CleanSlateCompetitiveLabR123 {
  const primaryEval=evaluator.evaluate(primaryPlan);
  const primaryCacheKey=planCacheKeyR144(primaryPlan);
  const primaryLevels=compactPlanFromTrainingR147(primaryPlan);
  const candidates=finalistStates
    .filter(state=>state.cacheKey!==primaryCacheKey)
    .map(state=>({state,distance:state.levels.reduce((sum,level,index)=>sum+Math.abs(Number(primaryLevels[index]??0)-Number(level??0)),0)}))
    .sort((a,b)=>b.state.score-a.state.score || b.distance-a.distance);
  const meaningful=candidates.find(item=>item.distance>=4) ?? candidates.find(item=>item.distance>=2) ?? candidates[0];
  const arms:CleanSlateCompetitiveLabArmR123[]=[
    {
      id:'CLEAN_SLATE_R123_A',
      label:'A • Ficha principal r123',
      rank:1,
      isPrimary:true,
      score:round1(clamp(primaryEval.score)),
      rankedScore:round1(primaryEval.online.rankedScore),
      friendsScore:round1(primaryEval.online.friendsScore),
      distanceFromPrimary:0,
      training:{...primaryPlan},
      hypothesis:'Referência oficial da autoridade única Clean Slate r123.'
    }
  ];
  if(meaningful) {
    const alternativePlan=materializeTrainingPlanR147(meaningful.state.levels);
    const evaluation=evaluator.evaluate(alternativePlan);
    arms.push({
      id:'CLEAN_SLATE_R123_B',
      label:'B • Alternativa controlada',
      rank:2,
      isPrimary:false,
      score:round1(clamp(evaluation.score)),
      rankedScore:round1(evaluation.online.rankedScore),
      friendsScore:round1(evaluation.online.friendsScore),
      distanceFromPrimary:meaningful.distance,
      training:{...alternativePlan},
      hypothesis:labHypothesisR123(primaryPlan,alternativePlan)
    });
  }
  return {
    mode:'READ_ONLY_AB',
    minMatchesPerArm:5,
    canCompare:arms.length===2,
    arms,
    protocol:[
      'Alternar A e B em condições parecidas, priorizando partidas ranqueadas e conexão estável.',
      'Registrar pelo menos 5 partidas por braço antes de considerar qualquer vencedor.',
      'Marcar delay, minutos e queda de rendimento no segundo tempo para reduzir falsos positivos.',
      'O laboratório nunca muda ficha, Top 5 ou Ímpeto sozinho; ele apenas produz evidência para uma revisão futura.'
    ],
    safeguards:{
      readOnly:true,
      neverAutoPromotes:true,
      sameCardRequired:true,
      similarConditionsPreferred:true,
      highDelayMustBeMarked:true
    }
  };
}

function decisionConfidenceR123(
  input:AnalysisResult,
  parsed:ParsedCard,
  saturation:CleanSlateSaturationR123[],
  lab:CleanSlateCompetitiveLabR123,
  baseConfidence:number
):CleanSlateConfidenceR123 {
  const attributeCount=Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length);
  const attributeCoverage=clamp(attributeCount/26*100);
  const rawSkillConfidence=Number(parsed.evidence?.skillConfidence ?? 0);
  const skillEvidence=rawSkillConfidence>0
    ? clamp(rawSkillConfidence<=1?rawSkillConfidence*100:rawSkillConfidence)
    : clamp((parsed.nativeSkills?.length??0)*12+(parsed.additionalSkills?.length??0)*5,25,88);
  const offensiveKnown=Boolean(parsed.offensivePlaystyle ?? parsed.playstyle);
  const defensiveKnown=parsed.defensivePlaystyle==='Básico' || Boolean(parsed.defensivePlaystyleConfirmed);
  const styleCertainty=clamp((parsed.evidence?.playstyleLocked?48:30)+(offensiveKnown?26:8)+(defensiveKnown?26:12));
  const alt=lab.arms.find(arm=>!arm.isPrimary);
  const gap=alt?Math.max(0,lab.arms[0].score-alt.score):5;
  const decisionStability=clamp(58+gap*13+(alt?Math.min(12,alt.distanceFromPrimary*1.2):14));
  const saturated=saturation.filter(item=>item.status==='SATURADO').length;
  const attention=saturation.filter(item=>item.status==='ATENCAO').length;
  const marginalSafety=clamp(96-saturated*18-attention*7);
  const calibrated=activeMatchCalibration(input);
  const longitudinal=input.longitudinalGameplayMemoryV4060;
  const provisional=input.gameplayValidationMemoryV4050;
  const realMatchEvidence=calibrated?.rawMatches
    ? clamp(calibrated.confidenceScore)
    : longitudinal?.applied
      ? clamp(longitudinal.confidenceScore)
      : provisional?.applied
        ? clamp(provisional.confidenceScore*.86)
        : 38;
  const dataQuality=clamp(baseConfidence*.68+attributeCoverage*.32);
  const score=clamp(
    dataQuality*.31+
    attributeCoverage*.17+
    skillEvidence*.10+
    styleCertainty*.10+
    decisionStability*.16+
    marginalSafety*.10+
    realMatchEvidence*.06
  );
  const level:CleanSlateConfidenceR123['level']=score>=82?'ALTA':score>=65?'MODERADA':'BAIXA';
  const reasons=[
    `Qualidade dos dados ${Math.round(dataQuality)}/100 e cobertura de atributos ${Math.round(attributeCoverage)}/100.`,
    `Estabilidade da decisão ${Math.round(decisionStability)}/100${alt?` diante de uma alternativa a ${round1(gap)} ponto(s) da principal`:''}.`,
    `Segurança marginal ${Math.round(marginalSafety)}/100: ${saturated} grupo(s) saturado(s) e ${attention} em atenção.`,
    realMatchEvidence>40
      ? `Evidência de partidas já disponível: ${Math.round(realMatchEvidence)}/100.`
      : 'Ainda falta evidência suficiente de partidas reais; a confiança atual é majoritariamente técnica.'
  ];
  return {
    score:round1(score),
    level,
    dataQuality:round1(dataQuality),
    attributeCoverage:round1(attributeCoverage),
    skillEvidence:round1(skillEvidence),
    styleCertainty:round1(styleCertainty),
    decisionStability:round1(decisionStability),
    marginalSafety:round1(marginalSafety),
    realMatchEvidence:round1(realMatchEvidence),
    reasons
  };
}

function naturalActionDetails(parsed:ParsedCard,context:UsageContextR125):CleanSlateActionR119[] {
  return ACTIONS
    .map((action)=>{
      const frequency=naturalActionFrequency(action,parsed,context);
      const natural=actionQuality(parsed.attributes,action);
      return {
        id:action.id,
        label:action.label,
        naturalScore:round1(natural),
        projectedScore:round1(natural),
        frequency:round1(frequency*100),
        contribution:round1(natural*frequency)
      };
    })
    .filter(action=>action.frequency>1)
    .sort((a,b)=>b.contribution-a.contribution)
    .slice(0,12);
}

function categoryScores(actions:CleanSlateActionR119[]) {
  const map=new Map<string,number>();
  const put=(key:string,value:number)=>map.set(key,Math.max(map.get(key)??0,value));
  for(const action of actions) {
    const value=action.frequency;
    if(['attack_space'].includes(action.id)) put('movement',value);
    if(['finish_box','turn_finish','long_finish'].includes(action.id)) put('finishing',value);
    if(['close_control','carry','turn_finish'].includes(action.id)) put('dribble',value);
    if(['short_creation','through_creation','build_out','cross_support'].includes(action.id)) put('passing',value);
    if(['hold_up','defensive_duel','aerial_defend'].includes(action.id)) put('physical',value);
    if(action.id==='aerial_finish') { put('aerial',value); put('aerial_attack',value); }
    if(action.id==='aerial_defend') { put('aerial',value); put('aerial_defense',value); }
    if(['press_recover','intercept','defensive_duel','cover_space','aerial_defend'].includes(action.id)) put('defense',value);
    if(['press_recover','cover_space','cross_support'].includes(action.id)) put('stamina',value);
    if(['gk_position','gk_reflex','gk_secure'].includes(action.id)) put('goalkeeper',value);
  }
  return map;
}

function skillCategory(name:string):string[] {
  const s=norm(name);
  if(/pegador de penalti|arremesso longo do goleiro|reposicao alta do goleiro|reposicao baixa do goleiro/.test(s)) return ['goalkeeper'];
  if(/toque duplo|elastico|giro|chapeu|corte|puxada|finta|sola|malicia/.test(s)) return ['dribble'];
  if(/cabecada|superioridade aerea/.test(s)) return ['aerial'];
  if(/efeito de longe|cavadinha|chute com o peito|folha seca|chute ascendente|precisao a distancia|finalizacao acrobatica|chute de primeira|penalti/.test(s)) return ['finishing'];
  if(/passe|cruzamento|curva para fora|de letra|sem olhar|arremesso lateral/.test(s)) return ['passing'];
  if(/marcacao|volta para marcar|interceptacao|bloqueador|carrinho|afastamento/.test(s)) return ['defense'];
  if(/espirito guerreiro/.test(s)) return ['stamina','physical'];
  if(/lideranca/.test(s)) return ['stamina'];
  if(/super substituto/.test(s)) return ['movement','finishing'];
  if(/toque de calcanhar/.test(s)) return ['dribble','passing'];
  return ['dribble','passing'];
}

function contextualSkillPenalty(name:string) {
  const s=norm(name);
  if(/super substituto/.test(s)) return 36;
  if(/especialista em penalti|arremesso lateral longo/.test(s)) return 14;
  if(/malicia/.test(s)) return 9;
  if(/lideranca/.test(s)) return 7;
  if(/controle da cavadinha/.test(s)) return 5;
  return 0;
}

function recommendTop5(parsed:ParsedCard,actions:CleanSlateActionR119[],position:PositionCode) {
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const cats=categoryScores(actions);
  const gk=position==='GK';
  const style=norm(`${parsed.playstyle??''} ${parsed.offensivePlaystyle??''} ${parsed.defensivePlaystyle??''}`);
  const scored=OFFICIAL_ADDITIONAL_SKILL_NAMES
    .filter(name=>!owned.has(skillIdentityKey(name)))
    .filter(name=>isRoleCompatibleAdditionalSkill(name,position))
    .filter(name=>gk ? /goleiro|pegador|lideranca|espirito guerreiro/i.test(norm(name)) : !/goleiro|pegador de penalti/i.test(norm(name)))
    .map((name,index)=>{
      const categories=skillCategory(name);
      let score=average(categories.map(c=>cats.get(c)??18));
      if(name==='Passe de primeira') score+=(cats.get('passing')??0)*.1;
      if(name==='Chute de primeira') score+=(cats.get('finishing')??0)*.12;
      if(name==='Toque duplo' || name==='Controle com a sola') score+=(cats.get('dribble')??0)*.11;
      if(name==='Interceptação' || name==='Bloqueador') score+=(cats.get('defense')??0)*.12;
      if(name==='Cabeçada' || name==='Superioridade aérea') score+=(cats.get('aerial')??0)*.12;
      score-=contextualSkillPenalty(name);

      // O estilo oficial atua apenas como desempate secundário do Top 5.
      // Ele nunca altera a ficha de progressão nem substitui o DNA natural.
      if(/goleiro ofensivo/.test(style)) {
        if(/Reposição baixa do goleiro|Reposição alta do goleiro|Arremesso longo do goleiro/.test(name)) score+=7;
      } else if(/goleiro defensivo/.test(style)) {
        if(/Pegador de pênalti|Liderança|Espírito guerreiro/.test(name)) score+=7;
      }
      if(/defensor criativo/.test(style)) {
        if(skillCategory(name).includes('passing')) score+=9;
        if(name==='Passe de primeira' || name==='Passe em profundidade') score+=3;
      } else if(/destruidor/.test(style)) {
        if(skillCategory(name).includes('defense') || skillCategory(name).includes('physical')) score+=9;
        if(name==='Bloqueador' || name==='Marcação individual' || name==='Carrinho' || name==='Afastamento acrobático') score+=3;
      }
      if(/primeiro volante/.test(style)) {
        if(skillCategory(name).includes('defense') || name==='Passe de primeira' || name==='Passe em profundidade') score+=3.5;
      }
      if(/orquestrador|armador criativo|classico/.test(style)) {
        if(skillCategory(name).includes('passing')) score+=3;
      }
      return {name,score,index};
    })
    .sort((a,b)=>b.score-a.score || a.index-b.index);
  if(gk) return scored.slice(0,5).map(x=>x.name);

  // Diversidade suave: evita cinco habilidades idênticas em função, mas não empurra
  // uma habilidade situacional só para cumprir cota artificial de categoria.
  const selected:typeof scored=[];
  const familyCount=new Map<string,number>();
  const target=Math.min(5,scored.length);
  while(selected.length<target){
    const remaining=scored.filter(candidate=>!selected.some(item=>item.name===candidate.name));
    if(!remaining.length) break;
    remaining.sort((a,b)=>{
      const familyA=skillCategory(a.name)[0]??'other';
      const familyB=skillCategory(b.name)[0]??'other';
      const adjustedA=a.score-(familyCount.get(familyA)??0)*4.5;
      const adjustedB=b.score-(familyCount.get(familyB)??0)*4.5;
      return adjustedB-adjustedA || a.index-b.index;
    });
    const picked=remaining[0];
    selected.push(picked);
    const family=skillCategory(picked.name)[0]??'other';
    familyCount.set(family,(familyCount.get(family)??0)+1);
  }
  // Se uma única família dominou tudo, troca apenas a última vaga por uma segunda
  // dimensão compatível; nunca força uma terceira família de baixo valor.
  const families=new Set(selected.map(item=>skillCategory(item.name)[0]??'other'));
  if(selected.length>=2 && families.size===1){
    const primary=[...families][0];
    const alternative=scored.find(item=>(skillCategory(item.name)[0]??'other')!==primary && !selected.some(sel=>sel.name===item.name));
    if(alternative) selected[selected.length-1]=alternative;
  }
  return selected.map(x=>x.name);
}


function skillIntegrityR119(input:AnalysisResult, parsed:ParsedCard, top5:string[],position:PositionCode) {
  const ownedSkills=[...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])];
  const owned=new Set(ownedSkills.map(skillIdentityKey));
  const available=OFFICIAL_ADDITIONAL_SKILL_NAMES
    .filter(name=>isRoleCompatibleAdditionalSkill(name,position))
    .filter(name=>!owned.has(skillIdentityKey(name))).length;
  const expected=Math.min(5,available);
  const officialOnly=top5.every(name=>OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(name as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
  const unique=new Set(top5.map(skillIdentityKey)).size===top5.length;
  const noOwned=top5.every(name=>!owned.has(skillIdentityKey(name)));
  const roleCompatible=top5.every(name=>isRoleCompatibleAdditionalSkill(name,position));
  const complete=top5.length===expected;
  const approved=officialOnly&&unique&&noOwned&&roleCompatible&&complete&&input.validation.level!=='blocked';
  return {
    version:'40.80-r119-clean-slate-final-skill-integrity',
    status:approved?'approved' as const:'review' as const,
    ownedSkills:[...new Set(ownedSkills)],
    recommendedSkills:[...top5],
    removedDuplicates:[],
    missingSlots:Math.max(0,expected-top5.length),
    checks:[
      officialOnly?'Somente habilidades adicionais oficiais foram usadas.':'Há habilidade fora do catálogo oficial.',
      noOwned?'Nenhuma habilidade recomendada já existe na carta.':'Foi detectada habilidade já possuída.',
      unique?'Top 5 sem duplicatas internas.':'Há duplicata interna no Top 5.',
      roleCompatible?`Compatibilidade validada pela posição de uso ${position}.`:`Há habilidade incompatível com ${position}.`,
      complete?`Foram entregues ${top5.length}/${expected} opções oficiais disponíveis.`:`Foram entregues ${top5.length}/${expected}; revisar leitura/catálogo.`,
      'Ímpetos foram avaliados em trilhas separadas das habilidades adicionais.',
      'A formação e a posição selecionada não reescrevem as habilidades permanentes da carta.'
    ]
  };
}

function weightedScoreR119(values:Array<{value:number;weight:number}>) {
  const valid=values.filter(item=>item.weight>0);
  const weight=valid.reduce((sum,item)=>sum+item.weight,0);
  return weight>0?valid.reduce((sum,item)=>sum+item.value*item.weight,0)/weight:0;
}

function recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[],position:PositionCode) {
  const current=parsed.impetos?.find(i=>i.active!==false)?.name ?? parsed.impetos?.[0]?.name ?? null;
  const slot=String(parsed.evidence?.impetoSlotStatus??'DESCONHECIDO');
  const cats=categoryScores(actions);
  const actionMap=new Map(actions.map(action=>[action.id,action.frequency]));
  const confidenceBase=normalizedConfidence(parsed);
  const scored=IMPETO_FUNCTIONAL_MATRIX_R119
    .filter(profile=>!current || norm(profile.name)!==norm(current))
    .map((profile,catalogIndex)=>{
      const domainScore=weightedScoreR119(Object.entries(profile.domains).map(([key,weight])=>({value:cats.get(key as ImpetoFunctionalDomainR119)??0,weight:Number(weight??0)})));
      const actionScore=weightedScoreR119(Object.entries(profile.actions).map(([key,weight])=>({value:actionMap.get(key)??0,weight:Number(weight??0)})));
      const positionFit=clamp((profile.positions[position]??0.04)*100);
      const attributeScore=profile.attributes.length?average(profile.attributes.map(key=>attr(parsed.attributes,key))):50;
      let score=domainScore*.36+actionScore*.30+positionFit*.24+attributeScore*.10;
      // Compatibilidade posicional baixa não pode ser mascarada por um atributo alto.
      if(positionFit<30) score*=.62;
      else if(positionFit<50) score*=.82;
      const functionalFit=domainScore*.48+actionScore*.52;
      const confidence=clamp(score*.58+confidenceBase*.30+Math.min(100,functionalFit)*.12);
      return {name:profile.name,score:round1(score),confidence:round1(confidence),functionalFit:round1(functionalFit),positionFit:round1(positionFit),domainScore:round1(domainScore),actionScore:round1(actionScore),attributeScore:round1(attributeScore),profile,catalogIndex};
    })
    .sort((a,b)=>b.score-a.score || b.functionalFit-a.functionalFit || b.positionFit-a.positionFit || b.confidence-a.confidence || a.catalogIndex-b.catalogIndex);

  const best=scored[0];
  const second=scored[1];
  const ambiguous=Boolean(best&&second&&Math.abs(best.score-second.score)<.35&&Math.abs(best.functionalFit-second.functionalFit)<.35);
  const ideal=best&&best.score>=48&&!ambiguous?best:null;
  const reasonFor=(prefix:string)=>ideal
    ? `${prefix} ${ideal.name} venceu por função: encaixe ${Math.round(ideal.score)}/100, função ${Math.round(ideal.functionalFit)}/100 e compatibilidade posicional ${Math.round(ideal.positionFit)}/100. ${ideal.profile.explanation}`
    : ambiguous&&best&&second
      ? `${prefix} ${best.name} e ${second.name} ficaram tecnicamente empatados; o motor não escolhe por ordem alfabética nem autoriza gasto sem vantagem funcional.`
      : `${prefix} Nenhum Ímpeto superou o limiar funcional mínimo com a leitura atual.`;

  if(current) return {
    current,decision:'KEEP_CURRENT' as const,recommendations:[] as ImpetoRecommendation[],ideal:current,idealScore:100,idealConfidence:round1(confidenceBase),slotStatus:slot,
    reason:`Ímpeto atual ${current} foi identificado na carta e é preservado; o motor não recomenda gastar recurso para repetir ou substituir automaticamente.`
  };
  if(!ideal) return {current:null,decision:'NO_SAFE_IMPETO' as const,recommendations:[] as ImpetoRecommendation[],ideal:null,idealScore:0,idealConfidence:0,slotStatus:slot,reason:reasonFor('Sem candidato seguro.')};

  const toRecommendation=(item:typeof scored[number],index:number):ImpetoRecommendation=>({
    name:item.name,
    tier:index===0?'ideal':'alternativo',
    attributes:[...Object.keys(item.profile.domains),...item.profile.attributes.slice(0,3)],
    reason:`Clean Slate r123: ${item.profile.explanation} Score funcional ${Math.round(item.functionalFit)}/100; posição ${Math.round(item.positionFit)}/100; total ${Math.round(item.score)}/100.`,
    score:round1(item.score),
    confidence:round1(item.confidence),
    official:true,
    evidence:['DNA natural da carta','ações funcionais priorizadas',`posição de uso ${position}`,`natureza ${item.profile.nature}`,'Ímpeto atual ausente',slot==='DISPONIVEL'?'vaga de Ímpeto confirmada':'vaga de Ímpeto ainda não confirmada']
  });

  const safeAlternatives=scored.filter(item=>item.score>=45&&item.positionFit>=28).slice(0,3);
  if(slot==='DISPONIVEL') return {
    current:null,decision:'RECOMMEND_NEW' as const,recommendations:safeAlternatives.map(toRecommendation),ideal:ideal.name,idealScore:round1(ideal.score),idealConfidence:round1(ideal.confidence),slotStatus:slot,
    reason:reasonFor('Vaga confirmada.')
  };
  if(slot==='OCUPADO'||slot==='SEM_VAGA') return {
    current:null,decision:'SLOT_NOT_AVAILABLE' as const,recommendations:[] as ImpetoRecommendation[],ideal:ideal.name,idealScore:round1(ideal.score),idealConfidence:round1(ideal.confidence),slotStatus:slot,
    reason:reasonFor('O candidato ideal foi calculado, mas não deve ser aplicado porque a leitura indica que não há vaga disponível.')
  };
  return {
    current:null,decision:'REVIEW_SLOT' as const,recommendations:[] as ImpetoRecommendation[],ideal:ideal.name,idealScore:round1(ideal.score),idealConfidence:round1(ideal.confidence),slotStatus:slot,
    reason:reasonFor('O candidato ideal foi calculado; confirme a vaga de Ímpeto antes de gastar o recurso.')
  };
}

function dominantDna(actions:CleanSlateActionR119[]) {
  const cats=categoryScores(actions);
  const labels:Record<string,string>={finishing:'finalização',movement:'mobilidade',dribble:'controle/condução',passing:'criação',physical:'físico',aerial:'jogo aéreo',defense:'defesa',stamina:'resistência',goalkeeper:'goleiro'};
  return [...cats.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>labels[k]??k);
}

export function applyCleanSlatePerformance2027R119(input:AnalysisResult, rawSnapshot?:ParsedCard):WithR119 {
  const parsed:ParsedCard=rawSnapshot ? JSON.parse(JSON.stringify(rawSnapshot)) as ParsedCard : JSON.parse(JSON.stringify(input.parsed)) as ParsedCard;
  const usageContext=buildUsageContextR125(input,parsed);
  const playstyleContext=publicPlaystyleContextR125(usageContext);
  const budgetCandidate=Number(parsed.trainingPointsTotal ?? input.trainingPointsTotal ?? 0);
  const budget=Number.isFinite(budgetCandidate)&&budgetCandidate>0?Math.round(budgetCandidate):0;
  const confidence=normalizedConfidence(parsed);
  const attributeCount=Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length);
  const minimum=usageContext.targetPosition==='GK'?4:10;
  if(!budget || attributeCount<minimum) {
    const zero=emptyTraining();
    // Ficha e Top 5 têm requisitos de evidência diferentes. Uma leitura curta
    // pode ser insuficiente para distribuir pontos com segurança, mas ainda
    // conter posição, habilidades já possuídas e atributos suficientes para
    // ordenar habilidades adicionais oficiais sem recorrer a receita legada.
    const actions=naturalActionDetails(parsed,usageContext);
    const top5=recommendTop5(parsed,actions,usageContext.targetPosition);
    const skillIntegrity=skillIntegrityR119(input,parsed,top5,usageContext.targetPosition);
    const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
    const duplicatesBlocked=top5.every(s=>!owned.has(skillIdentityKey(s)))&&new Set(top5.map(skillIdentityKey)).size===top5.length;
    const dna=dominantDna(actions);
    const blockedLab:CleanSlateCompetitiveLabR123={
      mode:'READ_ONLY_AB',
      minMatchesPerArm:5,
      canCompare:false,
      arms:[],
      protocol:['Complete a leitura antes de iniciar um teste A/B de ficha.'],
      safeguards:{readOnly:true,neverAutoPromotes:true,sameCardRequired:true,similarConditionsPreferred:true,highDelayMustBeMarked:true}
    };
    const blockedSaturation:CleanSlateSaturationR123[]=[];
    const blockedDecisionConfidence=decisionConfidenceR123(input,parsed,blockedSaturation,blockedLab,confidence);
    const analysis:CleanSlate2027R119={
      version:CLEAN_SLATE_2027_R119_VERSION,
      authority:'CLEAN_SLATE_SINGLE_WRITER',
      source:'RAW_CARD_SNAPSHOT',
      status:'BLOCKED_INSUFFICIENT_DATA',
      cardKey:cardKey(parsed),
      positionAnchor:parsed.mainPosition,
      usagePosition:usageContext.targetPosition,
      usagePositionChanged:usageContext.usagePositionChanged,
      playstyleContext,
      budget,
      training:zero,
      candidateCount:0,
      score:0,
      responseScore:0,
      synergyScore:0,
      confidence:round1(confidence),
      decisionConfidence:blockedDecisionConfidence,
      saturationProfile:blockedSaturation,
      competitiveLab:blockedLab,
      onlinePerformance:{objective:'MAX_ONLINE_PERFORMANCE',rankedScore:0,friendsScore:0,pressureReliability:0,matchConsistency:0,staminaSustainability:0,identityPreservation:0,pointEfficiency:0,notes:['Leitura insuficiente para medir desempenho online com segurança.']},
      pointRationale:[],dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,
      currentImpeto:parsed.impetos?.[0]?.name??null,
      impetoDecision:parsed.impetos?.length?'KEEP_CURRENT':'NO_SAFE_IMPETO',
      recommendedImpeto:null,
      impetoIdeal:parsed.impetos?.[0]?.name??null,
      impetoIdealScore:parsed.impetos?.length?100:0,
      impetoIdealConfidence:parsed.impetos?.length?round1(confidence):0,
      impetoReason:parsed.impetos?.length?`Ímpeto atual ${parsed.impetos?.[0]?.name} preservado.`:'A leitura ainda não tem atributos suficientes para classificar um Ímpeto ideal com segurança.',
      impetoSlotStatus:String(parsed.evidence?.impetoSlotStatus??'DESCONHECIDO'),
      guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget:false,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:true,selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true,onlineObjectiveActive:true,nameAgnosticScoring:true,marginalReturnAudited:true,saturationAudited:true,confidenceSeparatedFromOverall:true,abLabReadOnly:true,usagePositionAffectsBuildNotCardIdentity:true,inactivePlaystyleDoesNotForceRecipe:true,actionAttributesHaveFunctionalWeights:true,matchEvidenceCalibrated:true},
      reasons:['Leitura insuficiente para gerar uma ficha Clean Slate segura; a ficha antiga não foi usada como fallback.',playstyleContext.note,'Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']
    };
    return {...input,parsed,training:zero,trainingCost:trainingPlanCost(zero),trainingPointsUsed:0,trainingPointsTotal:budget,trainingPointsRemaining:budget,recommendedSkills:top5,recommendedImpetos:[],skillIntegrity,cleanSlate2027R119:analysis,recommendationExplanation:[`r119 bloqueou apenas a ficha por dados insuficientes; Top 5 seguro: ${top5.join(', ')||'indisponível'}.`,'Nenhum motor legado foi usado como fallback.',...input.recommendationExplanation]} as WithR119;
  }
  let optimized=optimizeTraining(input,parsed,budget,usageContext);
  let recommendationContext=usageContext;
  let recommendationEvaluation=optimized.evaluation;
  let positionStabilityR184: CleanSlate2027R119['positionStabilityR184'];
  if (usageContext.usagePositionChanged) {
    const naturalContext=buildUsageContextR125(input,parsed,parsed.mainPosition);
    const naturalOptimized=optimizeTraining(input,parsed,budget,naturalContext);
    const naturalUnderTarget=evaluatePlan(input,parsed,naturalOptimized.plan,optimized.frequencies,true,optimized.evaluationContext);
    const targetGain=optimized.evaluation.score-naturalUnderTarget.score;
    const planDistance=trainingPlanDistanceR184(optimized.plan,naturalOptimized.plan);
    const stableTie=targetGain<=POSITION_STABILITY_GAIN_THRESHOLD_R184 && planDistance<=POSITION_STABILITY_MAX_DISTANCE_R184;
    positionStabilityR184={
      version:POSITION_STABILITY_R184_VERSION,
      decision:stableTie?'NATURAL_ANCHOR':'TARGET_ADAPTATION',
      targetGain:round1(targetGain),
      planDistance,
      gainThreshold:POSITION_STABILITY_GAIN_THRESHOLD_R184,
      maxNoiseDistance:POSITION_STABILITY_MAX_DISTANCE_R184,
      reason:stableTie
        ? `A adaptação para ${usageContext.targetPosition} ficou em empate funcional (${round1(targetGain)} ponto de ganho; distância ${planDistance}); a ficha canônica de ${parsed.mainPosition} foi preservada contra ruído marginal.`
        : `A adaptação para ${usageContext.targetPosition} provou mudança funcional material (${round1(targetGain)} ponto de ganho; distância ${planDistance}) e permaneceu ativa.`
    };
    if(stableTie) {
      optimized={...optimized,plan:naturalOptimized.plan,evaluation:naturalUnderTarget};
      recommendationContext=naturalContext;
      recommendationEvaluation=naturalOptimized.evaluation;
    }
  }
  const training=optimized.plan;
  const spent=trainingPlanTotalCost(training);
  const actions=optimized.evaluation.details.slice(0,12);
  const recommendationActions=recommendationEvaluation.details.slice(0,12);
  const top5=recommendTop5(parsed,recommendationActions,recommendationContext.targetPosition);
  const impeto=recommendImpetosR119(parsed,recommendationActions,recommendationContext.targetPosition);
  const skillIntegrity=skillIntegrityR119(input,parsed,top5,recommendationContext.targetPosition);
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const duplicatesBlocked=top5.every(s=>!owned.has(skillIdentityKey(s)))&&new Set(top5.map(skillIdentityKey)).size===top5.length;
  const exactBudget=spent===budget;
  const score=round1(clamp(optimized.evaluation.score));
  const response=round1(clamp(optimized.evaluation.actionScore));
  const synergy=round1(clamp(score*.62+confidence*.38));
  const dna=dominantDna(actions);
  const diagnosticEvaluator=createDiagnosticEvaluatorR144(input,parsed,optimized.frequencies,optimized.evaluationContext,training,optimized.evaluation);
  const pointRationale=pointRationaleR122(parsed,training,optimized.frequencies,diagnosticEvaluator);
  const saturationProfile=localSaturationProfileR123(training,diagnosticEvaluator);
  const competitiveLab=competitiveLabR123(training,optimized.finalistStates,diagnosticEvaluator);
  const diagnosticStatsR144=diagnosticEvaluator.stats();
  const searchOptimizationR144={...optimized.searchOptimizationR144,diagnosticUniqueEvaluations:diagnosticStatsR144.uniqueEvaluations,diagnosticCacheHits:diagnosticStatsR144.cacheHits};
  const searchOptimizationR145=optimized.searchOptimizationR145;
  const searchOptimizationR146=optimized.searchOptimizationR146;
  const searchOptimizationR147=optimized.searchOptimizationR147;
  const searchOptimizationR148=optimized.searchOptimizationR148;
  const searchOptimizationR149=optimized.searchOptimizationR149;
  const decisionConfidence=decisionConfidenceR123(input,parsed,saturationProfile,competitiveLab,confidence);
  const marginalReturns=pointRationale.map(item=>item.returnPerCost);
  const pointEfficiency=clamp(average(marginalReturns)*32+58);
  const onlinePerformance={
    objective:'MAX_ONLINE_PERFORMANCE' as const,
    rankedScore:round1(optimized.evaluation.online.rankedScore),
    friendsScore:round1(optimized.evaluation.online.friendsScore),
    pressureReliability:round1(optimized.evaluation.online.pressureReliability),
    matchConsistency:round1(optimized.evaluation.online.matchConsistency),
    staminaSustainability:round1(optimized.evaluation.online.staminaSustainability),
    identityPreservation:round1(optimized.evaluation.online.identityPreservation),
    pointEfficiency:round1(pointEfficiency),
    notes:[
      'Objetivo final: máximo desempenho em partidas online, com maior peso para ranqueada e sem usar Overall/GER.',
      'O DNA é inferido de atributos, habilidades, estilos e frequência provável das ações; o nome do jogador não entra na pontuação.',
      'Pressão online valoriza gargalos de controle, reação, equilíbrio e execução sem criar pisos fixos por posição.',
      activeMatchCalibration(input)?.status==='ACTIVE'
        ? `R136 reponderou retorno marginal com evidência temporal/contextual de ${activeMatchCalibration(input)?.rawMatches ?? 0} partida(s), limitada a ${Math.round((activeMatchCalibration(input)?.calibrationStrength ?? 0)*100)}% de força de calibração.`
        : 'R136 ainda não possui evidência recente/contextual suficiente para reponderar a ficha.'
    ]
  };
  const analysis:CleanSlate2027R119={
    version:CLEAN_SLATE_2027_R119_VERSION,
    authority:'CLEAN_SLATE_SINGLE_WRITER',
    source:'RAW_CARD_SNAPSHOT',
    status:'READY',
    cardKey:cardKey(parsed),
    positionAnchor:parsed.mainPosition,
    usagePosition:usageContext.targetPosition,
    usagePositionChanged:usageContext.usagePositionChanged,
    positionStabilityR184,
    playstyleContext,
    budget,training,candidateCount:optimized.candidates,searchOptimizationR143:optimized.searchOptimizationR143,searchOptimizationR144,searchOptimizationR145,searchOptimizationR146,searchOptimizationR147,searchOptimizationR148,searchOptimizationR149,score,responseScore:response,synergyScore:synergy,
    confidence:round1(confidence),decisionConfidence,saturationProfile,competitiveLab,onlinePerformance,pointRationale,
    dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,currentImpeto:impeto.current,
    impetoDecision:impeto.decision,recommendedImpeto:impeto.recommendations[0]?.name??null,impetoIdeal:impeto.ideal,
    impetoIdealScore:impeto.idealScore,impetoIdealConfidence:impeto.idealConfidence,impetoReason:impeto.reason,impetoSlotStatus:impeto.slotStatus,
    guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:!impeto.current||!impeto.recommendations.some(x=>norm(x.name)===norm(impeto.current)),selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true,onlineObjectiveActive:true,nameAgnosticScoring:true,marginalReturnAudited:true,saturationAudited:true,confidenceSeparatedFromOverall:true,abLabReadOnly:true,usagePositionAffectsBuildNotCardIdentity:true,inactivePlaystyleDoesNotForceRecipe:true,actionAttributesHaveFunctionalWeights:true,matchEvidenceCalibrated:true},
    reasons:[
      `Clean Slate r149 avaliou ${searchOptimizationR149.generatedStates} estados com hot path escalar de score no mesmo kernel de avaliação, sem objetos de resultado/online/detalhes por candidato; preservou r148, beam 20 e orçamento ${spent}/${budget}.`,
      `Posição natural ${parsed.mainPosition}; posição real de uso ${usageContext.targetPosition}. A posição de uso muda a demanda funcional sem trocar a identidade da carta.`,
      ...(positionStabilityR184?[positionStabilityR184.reason]:[]),
      playstyleContext.note,
      'Capacidade natural e frequência provável são avaliadas separadamente; atributo alto sozinho não transforma uma ação em identidade.',
      'Contexto v6.0/r125: estilos ofensivo/defensivo são avaliados por fase e só influenciam a ficha quando a ativação na posição de uso é compatível.',
      'Os atributos de cada ação têm pesos funcionais diferentes; grupos que elevam vários atributos periféricos não ganham vantagem matemática só por quantidade.',
      `DNA dominante: ${dna.join(' + ')||'em revisão'}.`,
      'A pontuação favorece ações naturais, consistência online e retorno marginal; não tenta elevar o atributo mais fraco só porque ele está abaixo de um alvo.',
      `Confiança da decisão r125: ${decisionConfidence.level} (${Math.round(decisionConfidence.score)}/100); laboratório A/B ${competitiveLab.canCompare?'pronto':'sem contraste suficiente'}.`,
      activeMatchCalibration(input)?.status==='ACTIVE'
        ? `Evidência real R136 ativa: ${activeMatchCalibration(input)?.distinctSessions ?? 0} sessão(ões), confiança ${Math.round(activeMatchCalibration(input)?.confidenceScore ?? 0)}/100; tempo, patch e contexto limitam o peso sem definir níveis diretamente.`
        : 'Evidência real R136 permanece observacional até haver repetição recente e contextual suficiente em sessões comparáveis.',
      'Overall, ficha recebida e pesos floor/peak/ceiling não participam da decisão; a posição escolhida só altera a função de uso, não a assinatura-base da carta.'
    ]
  };
  return {
    ...input,
    parsed,
    training,
    trainingCost:trainingPlanCost(training),
    trainingPointsUsed:spent,
    trainingPointsTotal:budget,
    trainingPointsRemaining:Math.max(0,budget-spent),
    recommendedSkills:top5,
    recommendedImpetos:impeto.recommendations,
    skillIntegrity,
    cleanSlate2027R119:analysis,
    recommendationExplanation:[
      `Motor final: Clean Slate r125 • ${usageContext.targetPosition} • online ${Math.round(onlinePerformance.rankedScore)}/100 • resposta ${response}/100 • sinergia ${synergy}/100.`,
      `Ficha calculada do zero pelo snapshot cru da carta: ${spent}/${budget} pontos.`,
      `Top 5 Clean Slate: ${top5.join(', ')||'leitura insuficiente'}.`,
      impeto.current?`Ímpeto atual preservado: ${impeto.current}.`:impeto.recommendations[0]?`Ímpeto Clean Slate: ${impeto.recommendations[0].name}.`:impeto.ideal?`Ímpeto ideal Clean Slate: ${impeto.ideal} • ${impeto.decision==='REVIEW_SLOT'?'confirmar vaga antes de gastar':'referência sem autorização de gasto'}.`:'Ímpeto r119: nenhum candidato seguro confirmado.',
      ...analysis.reasons,
      ...input.recommendationExplanation
    ].filter((x,i,a)=>a.indexOf(x)===i).slice(0,112)
  } as WithR119;
}
