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
  trainingPlanTotalCost
} from './trainingPlanCore';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';
import { skillIdentityKey } from './officialSkillIdentity';
import { isRoleCompatibleAdditionalSkill } from './skillIntelligenceV31';
import { IMPETO_FUNCTIONAL_MATRIX_R119, type ImpetoFunctionalDomainR119 } from './impetoFunctionalMatrixR119';

export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r123-competitive-lab-saturation-confidence-authority' as const;
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
  budget: number;
  training: TrainingPlan;
  candidateCount: number;
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
  };
  reasons: string[];
};

type WithR119 = AnalysisResult & { cleanSlate2027R119: CleanSlate2027R119 };
type ActionDef = {
  id: string;
  label: string;
  attrs: AttributeKey[];
  positions: Partial<Record<PositionCode, number>>;
  tags: string[];
};

type BeamState = { plan: TrainingPlan; score: number; signature: string };

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

const FIELD_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
const GK_KEYS: TrainingKey[] = ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];

const ACTIONS: ActionDef[] = [
  { id:'attack_space', label:'Ataque ao espaço', attrs:['offensiveAwareness','acceleration','speed','balance'], positions:{CF:1,SS:.92,LWF:.84,RWF:.84,AMF:.66,LMF:.42,RMF:.42,CMF:.24}, tags:['movement','finishing'] },
  { id:'finish_box', label:'Finalização na área', attrs:['offensiveAwareness','finishing','kickingPower','balance'], positions:{CF:1,SS:.88,LWF:.66,RWF:.66,AMF:.58,CMF:.18}, tags:['finishing'] },
  { id:'turn_finish', label:'Giro + chute', attrs:['ballControl','tightPossession','balance','finishing','acceleration'], positions:{CF:.9,SS:1,AMF:.82,LWF:.7,RWF:.7,CMF:.25}, tags:['technical','finishing','control'] },
  { id:'long_finish', label:'Finalização de média distância', attrs:['finishing','kickingPower','curl','ballControl'], positions:{CF:.68,SS:.78,LWF:.76,RWF:.76,AMF:.9,CMF:.55,LMF:.45,RMF:.45}, tags:['finishing','technical'] },
  { id:'close_control', label:'Controle sob pressão', attrs:['ballControl','dribbling','tightPossession','balance'], positions:{CF:.55,SS:1,LWF:1,RWF:1,AMF:1,CMF:.84,DMF:.52,LMF:.78,RMF:.78,LB:.42,RB:.42}, tags:['technical','control'] },
  { id:'carry', label:'Condução progressiva', attrs:['dribbling','tightPossession','speed','acceleration','balance'], positions:{SS:.82,LWF:1,RWF:1,AMF:.9,CMF:.72,LMF:.92,RMF:.92,LB:.62,RB:.62,CF:.4}, tags:['technical','movement','control'] },
  { id:'short_creation', label:'Tabela e passe curto', attrs:['lowPass','ballControl','tightPossession','offensiveAwareness'], positions:{SS:.9,AMF:1,CMF:1,DMF:.76,LMF:.88,RMF:.88,CF:.45,LB:.48,RB:.48}, tags:['creation','technical'] },
  { id:'through_creation', label:'Passe de ruptura', attrs:['lowPass','loftedPass','curl','ballControl'], positions:{AMF:1,CMF:.96,SS:.88,DMF:.64,LMF:.78,RMF:.78,LWF:.56,RWF:.56,LB:.52,RB:.52}, tags:['creation'] },
  { id:'hold_up', label:'Proteção e apoio', attrs:['physicalContact','balance','ballControl','offensiveAwareness'], positions:{CF:1,SS:.58,AMF:.35,DMF:.4,CB:.3}, tags:['physical','control'] },
  { id:'aerial_finish', label:'Disputa aérea ofensiva', attrs:['heading','jump','physicalContact','offensiveAwareness'], positions:{CF:1,SS:.3,CB:.22,AMF:.12}, tags:['aerial','physical','finishing'] },
  { id:'aerial_defend', label:'Defesa aérea', attrs:['heading','jump','physicalContact','defensiveAwareness'], positions:{CB:1,DMF:.72,LB:.4,RB:.4,CMF:.2}, tags:['aerial','defending','physical'] },
  { id:'press_recover', label:'Pressão e recuperação', attrs:['stamina','defensiveEngagement','aggression','speed','acceleration'], positions:{DMF:.9,CMF:.9,LMF:.82,RMF:.82,LB:.78,RB:.78,AMF:.5,SS:.48,CF:.34,CB:.58}, tags:['defending','stamina','movement'] },
  { id:'intercept', label:'Interceptação', attrs:['defensiveAwareness','defensiveEngagement','tackling','speed'], positions:{DMF:1,CB:1,CMF:.78,LB:.86,RB:.86,LMF:.48,RMF:.48,AMF:.2}, tags:['defending'] },
  { id:'defensive_duel', label:'Duelo defensivo', attrs:['tackling','physicalContact','aggression','balance'], positions:{CB:1,DMF:.94,LB:.84,RB:.84,CMF:.66,LMF:.42,RMF:.42}, tags:['defending','physical'] },
  { id:'cover_space', label:'Cobertura de espaço', attrs:['defensiveAwareness','speed','acceleration','stamina'], positions:{CB:1,LB:1,RB:1,DMF:.9,CMF:.58,LMF:.5,RMF:.5}, tags:['defending','movement','stamina'] },
  { id:'build_out', label:'Saída de bola', attrs:['lowPass','ballControl','defensiveAwareness','tightPossession'], positions:{CB:.78,DMF:1,CMF:.86,LB:.72,RB:.72,GK:.12}, tags:['creation','defending','control'] },
  { id:'cross_support', label:'Apoio e cruzamento', attrs:['loftedPass','curl','speed','stamina'], positions:{LB:.86,RB:.86,LMF:.78,RMF:.78,LWF:.52,RWF:.52}, tags:['creation','movement'] },
  { id:'gk_position', label:'Posicionamento do goleiro', attrs:['goalkeeperAwareness','goalkeeperReach','goalkeeperReflexes'], positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_reflex', label:'Defesa por reflexo', attrs:['goalkeeperReflexes','goalkeeperReach','goalkeeperParrying'], positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_secure', label:'Controle de rebote', attrs:['goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying'], positions:{GK:1}, tags:['goalkeeper'] }
];

const clamp = (v:number,min=0,max=100) => Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const norm = (v:unknown) => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const average = (values:number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
const attr = (attrs:Attributes,key:AttributeKey) => clamp(Number(attrs[key] ?? 50),1,99);
const round1 = (v:number) => Number(v.toFixed(1));

function cardKey(parsed:ParsedCard) {
  return `${norm(parsed.playerName)}|${norm(parsed.cardType)}|${parsed.mainPosition}|${norm(parsed.specialTag)}`;
}

function normalizedConfidence(parsed:ParsedCard) {
  const raw=Number(parsed.confidence ?? 0);
  const conf=raw<=1 ? raw*100 : raw;
  const coverage=clamp(Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length)*4,0,100);
  return clamp(conf*.7+coverage*.3);
}

function positionRelevance(action:ActionDef, parsed:ParsedCard) {
  const main=action.positions[parsed.mainPosition] ?? 0;
  const alternates=(parsed.positions??[]).filter(p=>p!==parsed.mainPosition).map(p=>(action.positions[p]??0)*.62);
  return Math.max(main,...alternates,0);
}

function skillText(parsed:ParsedCard) {
  return norm([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].join(' | '));
}

function actionEvidence(action:ActionDef,parsed:ParsedCard) {
  const skills=skillText(parsed);
  const style=norm(`${parsed.playstyle??''} ${parsed.offensivePlaystyle??''} ${parsed.defensivePlaystyle??''}`);
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
  // O estilo oficial é somente um sinal fraco de uso. Capacidade alta, sozinha, não prova frequência.
  if(action.tags.includes('finishing') && /artilheiro|homem de area|pivo|puxa marcacao/.test(style)) proof+=.06;
  if(action.tags.includes('creation') && /orquestrador|armador|classico|criativo/.test(style)) proof+=.06;
  if(action.tags.includes('defending') && /destruidor|primeiro volante|defensor|lateral defensivo/.test(style)) proof+=.06;
  if(action.tags.includes('aerial') && /pivo/.test(style)) proof+=.05;
  return clamp(proof,0,1);
}

function actionQuality(attrs:Attributes, action:ActionDef) {
  const values=action.attrs.map(key=>attr(attrs,key));
  if(!values.length) return 0;
  const mean=average(values);
  const weakest=Math.min(...values);
  // Gargalo só existe dentro da ação analisada; não tenta "consertar" fraqueza global da carta.
  return mean*.84+weakest*.16;
}

function naturalActionFrequency(action:ActionDef,parsed:ParsedCard) {
  const relevance=positionRelevance(action,parsed);
  if(relevance<=0) return 0;
  const natural=actionQuality(parsed.attributes,action);
  const capability=Math.pow(clamp((natural-54)/45,0,1),1.3);
  const proof=actionEvidence(action,parsed);
  // Separa capacidade de frequência: atributo alto ajuda, mas não transforma sozinho uma ação em identidade.
  let frequency=relevance*(.18+.42*capability+.40*proof);
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
  if(action.id==='press_recover' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle))) frequency*=1.14;
  if(action.id==='cover_space' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle))) frequency*=1.06;
  return clamp(frequency,0,1);
}

function projectedAttributes(parsed:ParsedCard,plan:TrainingPlan):Attributes {
  const out:Attributes={...parsed.attributes};
  for(const [group,keys] of Object.entries(TRAINING_ATTRIBUTES) as Array<[TrainingKey,AttributeKey[]]>) {
    const level=Number(plan[group]??0);
    if(!level) continue;
    for(const key of keys) out[key]=clamp(attr(parsed.attributes,key)+level,1,99);
  }
  return out;
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

function pressureReliabilityScore(projected:Attributes, actionFrequencies:Map<string,number>) {
  let weighted=0, total=0;
  for(const action of ACTIONS) {
    const frequency=actionFrequencies.get(action.id)??0;
    if(frequency<=.01) continue;
    const keys=[...new Set(actionPressureKeys(action))];
    const values=keys.map(key=>attr(projected,key));
    if(!values.length) continue;
    const mean=average(values);
    const weakest=Math.min(...values);
    const natural=actionQuality(projected,action);
    // Online: gargalos de controle/reação pesam mais que no treino livre.
    const reliable=natural*.55+mean*.25+weakest*.20;
    weighted+=reliable*frequency; total+=frequency;
  }
  return total?clamp(weighted/total):0;
}

function identityPreservationScore(parsed:ParsedCard, plan:TrainingPlan, actionFrequencies:Map<string,number>) {
  let weighted=0,total=0;
  for(const key of Object.keys(plan) as TrainingKey[]) {
    const level=Number(plan[key]??0);
    if(!level) continue;
    const natural=groupNaturalStrength(parsed,key);
    const impacted=ACTIONS
      .filter(action=>TRAINING_ATTRIBUTES[key].some(attribute=>action.attrs.includes(attribute)))
      .reduce((sum,action)=>sum+(actionFrequencies.get(action.id)??0),0);
    const evidenceFit=clamp(impacted*43,0,100);
    const fit=clamp(natural*.58+evidenceFit*.42);
    weighted+=fit*level; total+=level;
  }
  return total?clamp(weighted/total):100;
}

function onlineMetrics(parsed:ParsedCard, plan:TrainingPlan, actionFrequencies:Map<string,number>, actionScore:number) {
  const projected=projectedAttributes(parsed,plan);
  const staminaActionIds=['press_recover','cover_space','cross_support','attack_space','carry'];
  const staminaDemand=clamp(average(staminaActionIds.map(id=>actionFrequencies.get(id)??0)),0,1);
  const projectedStamina=attr(projected,'stamina');
  const staminaFloor=68+staminaDemand*20;
  const staminaSustainability=clamp(100-Math.max(0,staminaFloor-projectedStamina)*(2.4+staminaDemand*1.8));
  const pressureReliability=pressureReliabilityScore(projected,actionFrequencies);
  const identityPreservation=identityPreservationScore(parsed,plan,actionFrequencies);
  const matchConsistency=clamp(
    actionScore*.42+pressureReliability*.28+staminaSustainability*.18+identityPreservation*.12
  );
  const rankedScore=clamp(
    actionScore*.48+pressureReliability*.24+staminaSustainability*.16+identityPreservation*.12
  );
  const friendsScore=clamp(
    actionScore*.58+pressureReliability*.17+staminaSustainability*.12+identityPreservation*.13
  );
  return { rankedScore, friendsScore, pressureReliability, matchConsistency, staminaSustainability, identityPreservation };
}

function evaluatePlan(parsed:ParsedCard,plan:TrainingPlan, actionFrequencies:Map<string,number>) {
  const projected=projectedAttributes(parsed,plan);
  let weighted=0, weightTotal=0, improvement=0;
  const details:CleanSlateActionR119[]=[];
  for(const action of ACTIONS) {
    const frequency=actionFrequencies.get(action.id)??0;
    if(frequency<=.01) continue;
    const natural=actionQuality(parsed.attributes,action);
    const projectedScore=actionQuality(projected,action);
    weighted+=projectedScore*frequency;
    improvement+=(projectedScore-natural)*frequency;
    weightTotal+=frequency;
    details.push({id:action.id,label:action.label,naturalScore:round1(natural),projectedScore:round1(projectedScore),frequency:round1(frequency*100),contribution:round1(projectedScore*frequency)});
  }
  const actionScore=weightTotal?weighted/weightTotal:0;
  const actionGain=weightTotal?improvement/weightTotal:0;
  let identityBonus=0, weakRepairPenalty=0, excessPenalty=0;
  // v6.0: resistência passa a ser tratada como sustentabilidade de ações reais.
  // A exigência cresce com a carga funcional da própria carta; não existe alvo
  // fixo por posição nem bônus simplesmente por ser VOL/ZAG/CA.
  const staminaActionIds=['press_recover','cover_space','cross_support','attack_space','carry'];
  const staminaDemand=clamp(average(staminaActionIds.map(id=>actionFrequencies.get(id)??0)),0,1);
  const projectedStamina=attr(projected,'stamina');
  const staminaFloor=68+staminaDemand*20;
  const fatiguePenalty=Math.max(0,staminaFloor-projectedStamina)*staminaDemand*.12;
  for(const key of Object.keys(plan) as TrainingKey[]) {
    const level=Number(plan[key]??0); if(!level) continue;
    const strength=groupNaturalStrength(parsed,key);
    const impacted=ACTIONS.filter(a=>TRAINING_ATTRIBUTES[key].some(attrKey=>a.attrs.includes(attrKey))).reduce((sum,a)=>sum+(actionFrequencies.get(a.id)??0),0);
    identityBonus += level*Math.pow(strength/100,1.8)*Math.min(1.25,impacted*.22)*.12;
    if(strength<60 && impacted<1.05) weakRepairPenalty += level*(60-strength)*.018;
    // Concentração alta precisa provar retorno em várias ações, não apenas existir como grupo forte.
    if(level>10) {
      const support=Math.min(1,impacted/1.8);
      excessPenalty += (level-10)*(.12+(1-support)*.42);
    }
    const saturated=TRAINING_ATTRIBUTES[key].filter(attribute=>attr(parsed.attributes,attribute)+level>=99).length/TRAINING_ATTRIBUTES[key].length;
    if(saturated>0) excessPenalty+=level*saturated*.055;
  }
  const aerialLevel=plan.aerialStrength??0;
  const aerialSupport=Math.max(actionFrequencies.get('aerial_finish')??0,actionFrequencies.get('aerial_defend')??0);
  // Bola aérea exige evidência de uso, não apenas atributos razoáveis. Evita transformar capacidade secundária em prioridade de treino.
  if(aerialLevel>4 && aerialSupport<.5) excessPenalty+=(aerialLevel-4)*.9;
  if(aerialLevel>7 && aerialSupport<.72) excessPenalty+=(aerialLevel-7)*.7;
  if(aerialLevel>=10 && aerialSupport<.82) excessPenalty+=(aerialLevel-9)*1.05;
  const online=onlineMetrics(parsed,plan,actionFrequencies,actionScore);
  // r123: a decisão final passa a otimizar o uso online real. Ranked pesa mais,
  // mas amistoso online continua no objetivo para evitar uma build artificialmente extrema.
  const onlineCompetitive=online.rankedScore*.65+online.friendsScore*.35;
  const score=onlineCompetitive+actionGain*.52+identityBonus-weakRepairPenalty-excessPenalty-fatiguePenalty;
  return { score, actionScore, actionGain, online, details:details.sort((a,b)=>b.contribution-a.contribution) };
}

function planSignature(plan:TrainingPlan) {
  return Object.entries(plan).map(([k,v])=>`${k}:${v}`).join('|');
}

function insertBeam(list:BeamState[],state:BeamState,width:number) {
  const previous=list.findIndex(x=>x.signature===state.signature);
  if(previous>=0) { if(state.score>list[previous].score) list[previous]=state; }
  else list.push(state);
  list.sort((a,b)=>b.score-a.score || a.signature.localeCompare(b.signature));
  if(list.length>width) list.length=width;
}

function optimizeTraining(parsed:ParsedCard,budget:number) {
  const frequencies=new Map(ACTIONS.map(a=>[a.id,naturalActionFrequency(a,parsed)]));
  const allowed=parsed.mainPosition==='GK'?GK_KEYS:FIELD_KEYS;
  const byCost:Array<BeamState[]>=Array.from({length:budget+1},()=>[]);
  const zero=emptyTraining();
  byCost[0].push({plan:zero,score:evaluatePlan(parsed,zero,frequencies).score,signature:planSignature(zero)});
  let candidates=1;
  const BEAM=20;
  for(let cost=0;cost<=budget;cost++) {
    const states=byCost[cost];
    if(!states.length) continue;
    for(const state of states) {
      for(const key of allowed) {
        const current=state.plan[key]??0;
        if(current>=16) continue;
        const next=current+1;
        const step=trainingLevelCost(next);
        const target=cost+step;
        if(target>budget) continue;
        const plan={...state.plan,[key]:next};
        const evaluated=evaluatePlan(parsed,plan,frequencies);
        insertBeam(byCost[target],{plan,score:evaluated.score,signature:planSignature(plan)},BEAM);
        candidates++;
      }
    }
  }
  let chosen=byCost[budget][0];
  if(!chosen) {
    for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  }
  const plan=chosen?.plan??zero;
  const finalistStates=(byCost[budget]?.length ? byCost[budget] : chosen ? [chosen] : []).slice(0,12);
  return {plan,candidates,frequencies,evaluation:evaluatePlan(parsed,plan,frequencies),finalistStates};
}

function pointRationaleR122(parsed:ParsedCard, plan:TrainingPlan, frequencies:Map<string,number>) {
  const current=evaluatePlan(parsed,plan,frequencies);
  return (Object.keys(plan) as TrainingKey[])
    .filter(key=>Number(plan[key]??0)>0)
    .map(key=>{
      const level=Number(plan[key]??0);
      const previous={...plan,[key]:Math.max(0,level-1)};
      const previousEval=evaluatePlan(parsed,previous,frequencies);
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


function localSaturationProfileR123(parsed:ParsedCard, plan:TrainingPlan, frequencies:Map<string,number>):CleanSlateSaturationR123[] {
  return (Object.keys(plan) as TrainingKey[])
    .filter(key=>Number(plan[key]??0)>0)
    .map(key=>{
      const level=Number(plan[key]??0);
      const curve:number[]=[];
      for(let step=1;step<=level;step++) {
        const previous={...plan,[key]:step-1};
        const current={...plan,[key]:step};
        const previousEval=evaluatePlan(parsed,previous,frequencies);
        const currentEval=evaluatePlan(parsed,current,frequencies);
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

function planDistanceR123(a:TrainingPlan,b:TrainingPlan) {
  return (Object.keys(a) as TrainingKey[]).reduce((sum,key)=>sum+Math.abs(Number(a[key]??0)-Number(b[key]??0)),0);
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
  parsed:ParsedCard,
  primaryPlan:TrainingPlan,
  frequencies:Map<string,number>,
  finalistStates:BeamState[]
):CleanSlateCompetitiveLabR123 {
  const primaryEval=evaluatePlan(parsed,primaryPlan,frequencies);
  const candidates=finalistStates
    .filter(state=>state.signature!==planSignature(primaryPlan))
    .map(state=>({state,distance:planDistanceR123(primaryPlan,state.plan)}))
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
    const evaluation=evaluatePlan(parsed,meaningful.state.plan,frequencies);
    arms.push({
      id:'CLEAN_SLATE_R123_B',
      label:'B • Alternativa controlada',
      rank:2,
      isPrimary:false,
      score:round1(clamp(evaluation.score)),
      rankedScore:round1(evaluation.online.rankedScore),
      friendsScore:round1(evaluation.online.friendsScore),
      distanceFromPrimary:meaningful.distance,
      training:{...meaningful.state.plan},
      hypothesis:labHypothesisR123(primaryPlan,meaningful.state.plan)
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
  const longitudinal=input.longitudinalGameplayMemoryV4060;
  const provisional=input.gameplayValidationMemoryV4050;
  const realMatchEvidence=longitudinal?.applied
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

function naturalActionDetails(parsed:ParsedCard):CleanSlateActionR119[] {
  return ACTIONS
    .map((action)=>{
      const frequency=naturalActionFrequency(action,parsed);
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

function recommendTop5(parsed:ParsedCard,actions:CleanSlateActionR119[]) {
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const cats=categoryScores(actions);
  const gk=parsed.mainPosition==='GK';
  const position=parsed.mainPosition;
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


function skillIntegrityR119(input:AnalysisResult, parsed:ParsedCard, top5:string[]) {
  const ownedSkills=[...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])];
  const owned=new Set(ownedSkills.map(skillIdentityKey));
  const available=OFFICIAL_ADDITIONAL_SKILL_NAMES
    .filter(name=>isRoleCompatibleAdditionalSkill(name,parsed.mainPosition))
    .filter(name=>!owned.has(skillIdentityKey(name))).length;
  const expected=Math.min(5,available);
  const officialOnly=top5.every(name=>OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(name as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
  const unique=new Set(top5.map(skillIdentityKey)).size===top5.length;
  const noOwned=top5.every(name=>!owned.has(skillIdentityKey(name)));
  const roleCompatible=top5.every(name=>isRoleCompatibleAdditionalSkill(name,parsed.mainPosition));
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
      roleCompatible?`Compatibilidade validada pela posição natural ${parsed.mainPosition}.`:`Há habilidade incompatível com ${parsed.mainPosition}.`,
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

function recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[]) {
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
      const positionFit=clamp((profile.positions[parsed.mainPosition]??0.04)*100);
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
    evidence:['DNA natural da carta','ações funcionais priorizadas',`posição natural ${parsed.mainPosition}`,`natureza ${item.profile.nature}`,'Ímpeto atual ausente',slot==='DISPONIVEL'?'vaga de Ímpeto confirmada':'vaga de Ímpeto ainda não confirmada']
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
  const budgetCandidate=Number(parsed.trainingPointsTotal ?? input.trainingPointsTotal ?? 0);
  const budget=Number.isFinite(budgetCandidate)&&budgetCandidate>0?Math.round(budgetCandidate):0;
  const confidence=normalizedConfidence(parsed);
  const attributeCount=Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length);
  const minimum=parsed.mainPosition==='GK'?4:10;
  if(!budget || attributeCount<minimum) {
    const zero=emptyTraining();
    // Ficha e Top 5 têm requisitos de evidência diferentes. Uma leitura curta
    // pode ser insuficiente para distribuir pontos com segurança, mas ainda
    // conter posição, habilidades já possuídas e atributos suficientes para
    // ordenar habilidades adicionais oficiais sem recorrer a receita legada.
    const actions=naturalActionDetails(parsed);
    const top5=recommendTop5(parsed,actions);
    const skillIntegrity=skillIntegrityR119(input,parsed,top5);
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
      version:CLEAN_SLATE_2027_R119_VERSION,authority:'CLEAN_SLATE_SINGLE_WRITER',source:'RAW_CARD_SNAPSHOT',status:'BLOCKED_INSUFFICIENT_DATA',cardKey:cardKey(parsed),positionAnchor:parsed.mainPosition,budget,training:zero,candidateCount:0,score:0,responseScore:0,synergyScore:0,confidence:round1(confidence),decisionConfidence:blockedDecisionConfidence,saturationProfile:blockedSaturation,competitiveLab:blockedLab,onlinePerformance:{objective:'MAX_ONLINE_PERFORMANCE',rankedScore:0,friendsScore:0,pressureReliability:0,matchConsistency:0,staminaSustainability:0,identityPreservation:0,pointEfficiency:0,notes:['Leitura insuficiente para medir desempenho online com segurança.']},pointRationale:[],dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,currentImpeto:parsed.impetos?.[0]?.name??null,impetoDecision:parsed.impetos?.length?'KEEP_CURRENT':'NO_SAFE_IMPETO',recommendedImpeto:null,impetoIdeal:parsed.impetos?.[0]?.name??null,impetoIdealScore:parsed.impetos?.length?100:0,impetoIdealConfidence:parsed.impetos?.length?round1(confidence):0,impetoReason:parsed.impetos?.length?`Ímpeto atual ${parsed.impetos?.[0]?.name} preservado.`:'A leitura ainda não tem atributos suficientes para classificar um Ímpeto ideal com segurança.',impetoSlotStatus:String(parsed.evidence?.impetoSlotStatus??'DESCONHECIDO'),guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget:false,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:true,selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true,onlineObjectiveActive:true,nameAgnosticScoring:true,marginalReturnAudited:true,saturationAudited:true,confidenceSeparatedFromOverall:true,abLabReadOnly:true},reasons:['Leitura insuficiente para gerar uma ficha Clean Slate segura; a ficha antiga não foi usada como fallback.','Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']};
    return {...input,parsed,training:zero,trainingCost:trainingPlanCost(zero),trainingPointsUsed:0,trainingPointsTotal:budget,trainingPointsRemaining:budget,recommendedSkills:top5,recommendedImpetos:[],skillIntegrity,cleanSlate2027R119:analysis,recommendationExplanation:[`r119 bloqueou apenas a ficha por dados insuficientes; Top 5 seguro: ${top5.join(', ')||'indisponível'}.`,'Nenhum motor legado foi usado como fallback.',...input.recommendationExplanation]} as WithR119;
  }
  const optimized=optimizeTraining(parsed,budget);
  const training=optimized.plan;
  const spent=trainingPlanTotalCost(training);
  const actions=optimized.evaluation.details.slice(0,12);
  const top5=recommendTop5(parsed,actions);
  const impeto=recommendImpetosR119(parsed,actions);
  const skillIntegrity=skillIntegrityR119(input,parsed,top5);
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const duplicatesBlocked=top5.every(s=>!owned.has(skillIdentityKey(s)))&&new Set(top5.map(skillIdentityKey)).size===top5.length;
  const exactBudget=spent===budget;
  const score=round1(clamp(optimized.evaluation.score));
  const response=round1(clamp(optimized.evaluation.actionScore));
  const synergy=round1(clamp(score*.62+confidence*.38));
  const dna=dominantDna(actions);
  const pointRationale=pointRationaleR122(parsed,training,optimized.frequencies);
  const saturationProfile=localSaturationProfileR123(parsed,training,optimized.frequencies);
  const competitiveLab=competitiveLabR123(parsed,training,optimized.frequencies,optimized.finalistStates);
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
      'Pressão online valoriza gargalos de controle, reação, equilíbrio e execução sem criar pisos fixos por posição.'
    ]
  };
  const analysis:CleanSlate2027R119={
    version:CLEAN_SLATE_2027_R119_VERSION,authority:'CLEAN_SLATE_SINGLE_WRITER',source:'RAW_CARD_SNAPSHOT',status:'READY',cardKey:cardKey(parsed),positionAnchor:parsed.mainPosition,budget,training,candidateCount:optimized.candidates,score,responseScore:response,synergyScore:synergy,confidence:round1(confidence),decisionConfidence,saturationProfile,competitiveLab,onlinePerformance,pointRationale,dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,currentImpeto:impeto.current,impetoDecision:impeto.decision,recommendedImpeto:impeto.recommendations[0]?.name??null,impetoIdeal:impeto.ideal,impetoIdealScore:impeto.idealScore,impetoIdealConfidence:impeto.idealConfidence,impetoReason:impeto.reason,impetoSlotStatus:impeto.slotStatus,guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:!impeto.current||!impeto.recommendations.some(x=>norm(x.name)===norm(impeto.current)),selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true,onlineObjectiveActive:true,nameAgnosticScoring:true,marginalReturnAudited:true,saturationAudited:true,confidenceSeparatedFromOverall:true,abLabReadOnly:true},reasons:[
      `Clean Slate r123 avaliou ${optimized.candidates} estados com beam limitado e orçamento ${spent}/${budget}.`,
      'Capacidade natural e frequência provável são avaliadas separadamente; atributo alto sozinho não transforma uma ação em identidade.',
      'Contexto v6.0/r123: resistência responde à carga funcional; Interceptação/Pressão no Ataque só pesam quando existem; pressão online aumenta o valor dos gargalos reais de controle e reação.',
      `DNA dominante: ${dna.join(' + ')||'em revisão'}.`,
      'A pontuação favorece ações naturais, consistência online e retorno marginal; não tenta elevar o atributo mais fraco só porque ele está abaixo de um alvo.',
      `Confiança da decisão r123: ${decisionConfidence.level} (${Math.round(decisionConfidence.score)}/100); laboratório A/B ${competitiveLab.canCompare?'pronto':'sem contraste suficiente'}.`,
      'Posição selecionada, overall, ficha recebida e pesos floor/peak/ceiling não participam da assinatura permanente.'
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
      `Motor final: Clean Slate r123 • online ${Math.round(onlinePerformance.rankedScore)}/100 • resposta ${response}/100 • sinergia ${synergy}/100.`,
      `Ficha calculada do zero pelo snapshot cru da carta: ${spent}/${budget} pontos.`,
      `Top 5 Clean Slate: ${top5.join(', ')||'leitura insuficiente'}.`,
      impeto.current?`Ímpeto atual preservado: ${impeto.current}.`:impeto.recommendations[0]?`Ímpeto Clean Slate: ${impeto.recommendations[0].name}.`:impeto.ideal?`Ímpeto ideal Clean Slate: ${impeto.ideal} • ${impeto.decision==='REVIEW_SLOT'?'confirmar vaga antes de gastar':'referência sem autorização de gasto'}.`:'Ímpeto r119: nenhum candidato seguro confirmado.',
      ...analysis.reasons,
      ...input.recommendationExplanation
    ].filter((x,i,a)=>a.indexOf(x)===i).slice(0,112)
  } as WithR119;
}
