import type {
  AttributeKey,
  Attributes,
  Objective,
  ParsedCard,
  PositionCode,
  TacticalProfile,
  TrainingKey,
  TrainingPlan
} from './analyzer';
import type { BuildVariant } from './trainingEngine';

export type CardVersionIdentity = {
  signature: string;
  detectedVersion: string;
  confidence: number;
  differentiators: string[];
  samePlayerDifferentVersionWarning: string;
};

export type FinalAttributeProjection = {
  attribute: AttributeKey;
  label: string;
  before: number;
  after: number;
  gain: number;
  functionalMin: number;
  personalizedIdeal: number;
  usefulCeiling: number;
  status: 'abaixo' | 'funcional' | 'ideal' | 'acima do útil';
  note: string;
};

export type SignatureProtection = {
  protectedAttributes: Array<{ attribute: AttributeKey; label: string; value: number; reason: string }>;
  identityRetentionScore: number;
  destructiveChangesBlocked: string[];
};

export type PositionConversionPrecision = {
  level: 'natural' | 'possível' | 'difícil';
  score: number;
  budgetForAdaptation: number;
  preservedQualities: string[];
  correctedNeeds: string[];
  persistentLimits: string[];
  verdict: string;
};

export type DeepSkillPrecision = {
  name: string;
  expectedUse: 'alta' | 'média' | 'baixa';
  supportBefore: number;
  supportAfter: number;
  gain: number;
  costBenefit: 'alto' | 'médio' | 'baixo';
  positionImpact: string;
  recommendation: string;
};

export type ActionProjection = {
  action: string;
  before: number;
  after: number;
  gain: number;
  status: 'forte' | 'funcional' | 'limitada';
  explanation: string;
};

export type PointAudit = {
  training: TrainingKey;
  label: string;
  level: number;
  realCost: number;
  affectedAttributes: string[];
  usefulGain: number;
  marginalReturn: 'alto' | 'médio' | 'baixo';
  verdict: string;
};

export type PrecisionAlternative = {
  title: string;
  source: 'DNA híbrida' | 'Identidade' | 'Adaptação' | 'Habilidade especial' | 'Meta 2026';
  training: TrainingPlan;
  score: number;
  identityScore: number;
  adaptationScore: number;
  skillScore: number;
  metaScore: number;
  wasteScore: number;
  why: string;
};

export type Meta2026Analysis = {
  patchReference: 'v5.5.0';
  updatedAt: string;
  classification: 'tendência competitiva editável';
  officialMechanics: string[];
  competitiveTrends: Array<{ name: string; confidence: 'alta' | 'média'; note: string }>;
  playerMetaFit: number;
  fitLabel: 'excelente' | 'bom' | 'situacional' | 'baixo';
  strongestMetaTraits: string[];
  missingMetaTraits: string[];
  recommendedMetaUse: string;
  disclaimer: string;
};

export type MaxPrecisionAnalysis = {
  versionIdentity: CardVersionIdentity;
  recommendedVariantTitle: string;
  finalAttributes: FinalAttributeProjection[];
  signatureProtection: SignatureProtection;
  conversion: PositionConversionPrecision;
  deepSkills: DeepSkillPrecision[];
  actions: ActionProjection[];
  pointAudit: PointAudit[];
  alternatives: PrecisionAlternative[];
  antiCloneDistance: number;
  explanation: string[];
  meta2026: Meta2026Analysis;
  calibratedLearningStatus: string;
};

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  offensiveAwareness: 'Talento ofensivo', ballControl: 'Controle de bola', dribbling: 'Drible', tightPossession: 'Condução firme',
  lowPass: 'Passe rasteiro', loftedPass: 'Passe alto', finishing: 'Finalização', heading: 'Cabeçada', placeKicking: 'Bola parada', curl: 'Curva',
  defensiveAwareness: 'Talento defensivo', defensiveEngagement: 'Dedicação defensiva', tackling: 'Desarme', aggression: 'Agressividade',
  goalkeeperAwareness: 'Talento de GO', goalkeeperCatching: 'Firmeza de GO', goalkeeperParrying: 'Defesa de GO', goalkeeperReflexes: 'Reflexos de GO', goalkeeperReach: 'Alcance de GO',
  speed: 'Velocidade', acceleration: 'Aceleração', kickingPower: 'Força do chute', jump: 'Salto', physicalContact: 'Contato físico', balance: 'Equilíbrio', stamina: 'Resistência'
};

const TRAINING_LABELS: Record<TrainingKey, string> = {
  shooting: 'Finalização', passing: 'Passe', dribbling: 'Drible', dexterity: 'Destreza', lowerBodyStrength: 'Força pernas', aerialStrength: 'Bola aérea', defending: 'Defesa', gk1: 'Goleiro 1', gk2: 'Goleiro 2', gk3: 'Goleiro 3'
};

const TRAINING_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
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

const POSITION_CORE: Record<PositionCode, AttributeKey[]> = {
  CF: ['offensiveAwareness','finishing','acceleration','kickingPower','balance','physicalContact'],
  SS: ['offensiveAwareness','ballControl','dribbling','lowPass','finishing','acceleration','balance'],
  LWF: ['dribbling','tightPossession','acceleration','speed','finishing','curl','balance'],
  RWF: ['dribbling','tightPossession','acceleration','speed','finishing','curl','balance'],
  LMF: ['lowPass','loftedPass','dribbling','speed','stamina','defensiveEngagement'],
  RMF: ['lowPass','loftedPass','dribbling','speed','stamina','defensiveEngagement'],
  AMF: ['ballControl','tightPossession','lowPass','dribbling','offensiveAwareness','finishing','balance'],
  CMF: ['lowPass','loftedPass','ballControl','stamina','defensiveEngagement','balance'],
  DMF: ['defensiveAwareness','tackling','defensiveEngagement','physicalContact','lowPass','stamina'],
  CB: ['defensiveAwareness','tackling','defensiveEngagement','physicalContact','heading','jump','speed'],
  LB: ['speed','acceleration','stamina','defensiveAwareness','tackling','loftedPass'],
  RB: ['speed','acceleration','stamina','defensiveAwareness','tackling','loftedPass'],
  GK: ['goalkeeperAwareness','goalkeeperReflexes','goalkeeperReach','goalkeeperParrying','goalkeeperCatching','jump']
};

const POSITION_BANDS: Record<PositionCode, Partial<Record<AttributeKey, [number, number, number]>>> = {
  CF: { offensiveAwareness:[80,88,96], finishing:[80,89,97], acceleration:[74,84,93], kickingPower:[76,86,96], balance:[70,82,92], physicalContact:[68,80,91] },
  SS: { offensiveAwareness:[76,85,94], ballControl:[78,87,96], dribbling:[76,86,96], lowPass:[74,84,94], finishing:[72,83,93], acceleration:[76,86,96], balance:[75,85,95] },
  LWF: { dribbling:[80,89,98], tightPossession:[77,87,97], acceleration:[80,90,99], speed:[78,88,97], finishing:[72,83,94], curl:[72,84,95], balance:[76,86,96] },
  RWF: { dribbling:[80,89,98], tightPossession:[77,87,97], acceleration:[80,90,99], speed:[78,88,97], finishing:[72,83,94], curl:[72,84,95], balance:[76,86,96] },
  LMF: { lowPass:[72,82,92], loftedPass:[74,84,94], dribbling:[72,82,92], speed:[76,86,96], stamina:[80,89,98], defensiveEngagement:[66,77,88] },
  RMF: { lowPass:[72,82,92], loftedPass:[74,84,94], dribbling:[72,82,92], speed:[76,86,96], stamina:[80,89,98], defensiveEngagement:[66,77,88] },
  AMF: { ballControl:[80,89,98], tightPossession:[78,88,97], lowPass:[80,89,98], dribbling:[76,86,96], offensiveAwareness:[74,84,94], finishing:[70,81,92], balance:[74,84,94] },
  CMF: { lowPass:[78,87,96], loftedPass:[75,85,95], ballControl:[75,84,94], stamina:[80,89,98], defensiveEngagement:[68,78,89], balance:[72,82,92] },
  DMF: { defensiveAwareness:[80,89,98], tackling:[78,88,97], defensiveEngagement:[80,89,98], physicalContact:[76,86,96], lowPass:[72,82,92], stamina:[80,89,98] },
  CB: { defensiveAwareness:[82,91,99], tackling:[80,90,99], defensiveEngagement:[80,89,98], physicalContact:[80,89,98], heading:[76,86,96], jump:[76,86,96], speed:[68,79,90] },
  LB: { speed:[78,88,97], acceleration:[76,86,96], stamina:[80,90,99], defensiveAwareness:[72,82,92], tackling:[72,82,92], loftedPass:[70,81,92] },
  RB: { speed:[78,88,97], acceleration:[76,86,96], stamina:[80,90,99], defensiveAwareness:[72,82,92], tackling:[72,82,92], loftedPass:[70,81,92] },
  GK: { goalkeeperAwareness:[82,91,99], goalkeeperReflexes:[82,92,99], goalkeeperReach:[80,90,99], goalkeeperParrying:[78,88,98], goalkeeperCatching:[76,86,96], jump:[72,82,92] }
};

const SPECIAL_RULES: Record<string, { attrs: AttributeKey[]; groups: TrainingKey[]; positions: PositionCode[]; use: string }> = {
  'Blitz Curler': { attrs:['finishing','curl','kickingPower','ballControl'], groups:['shooting','dribbling','dexterity'], positions:['LWF','RWF','SS','AMF','CF'], use:'finalização com curva após preparar o corpo' },
  'Esticada de Perna': { attrs:['tackling','defensiveEngagement','aggression','physicalContact'], groups:['defending','lowerBodyStrength'], positions:['CB','DMF','CMF','LB','RB'], use:'interceptar e alcançar a bola sem desmontar a linha' },
  'Momentum Dribbling': { attrs:['dribbling','tightPossession','balance','acceleration'], groups:['dribbling','dexterity'], positions:['LWF','RWF','SS','AMF'], use:'ganhar duelos curtos com mudança de direção' },
  'Phenomenal Finishing': { attrs:['finishing','offensiveAwareness','kickingPower','balance'], groups:['shooting','dexterity'], positions:['CF','SS','LWF','RWF','AMF'], use:'finalizar em posições corporais difíceis' },
  'Phenomenal Pass': { attrs:['lowPass','loftedPass','ballControl','tightPossession'], groups:['passing','dribbling'], positions:['AMF','CMF','DMF','SS','LMF','RMF'], use:'soltar passes de alta dificuldade sob pressão' },
  'Game-changing Pass': { attrs:['lowPass','loftedPass','ballControl','stamina'], groups:['passing','lowerBodyStrength'], positions:['AMF','CMF','DMF','SS'], use:'criar a jogada decisiva em momentos de pressão' },
  'Fortress': { attrs:['defensiveAwareness','tackling','physicalContact','defensiveEngagement'], groups:['defending','aerialStrength'], positions:['CB','DMF','LB','RB'], use:'proteger a área e vencer confrontos defensivos' },
  'Bullet Header': { attrs:['heading','jump','physicalContact','offensiveAwareness'], groups:['aerialStrength','shooting'], positions:['CF','SS','CB'], use:'atacar cruzamentos com potência' },
  'Edged Crossing': { attrs:['loftedPass','curl','kickingPower','stamina'], groups:['passing','lowerBodyStrength'], positions:['LWF','RWF','LMF','RMF','LB','RB'], use:'cruzar com trajetória agressiva' }
};

function clamp(value: number, min = 1, max = 99) { return Math.max(min, Math.min(max, Math.round(value))); }
function avg(...values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function hash(input: string) { let h = 2166136261; for (let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(36).toUpperCase().slice(0,8); }
function trainingLevelCost(level: number) { return level <= 0 ? 0 : Math.ceil(level / 4); }
function trainingTotalCost(level: number) { let total=0; for(let i=1;i<=Math.max(0,level);i++) total+=trainingLevelCost(i); return total; }
function planCost(plan: TrainingPlan) { return (Object.keys(plan) as TrainingKey[]).reduce((sum,key)=>sum+trainingTotalCost(plan[key]??0),0); }

function applyPlan(base: Required<Attributes>, plan: TrainingPlan): Required<Attributes> {
  const next = { ...base };
  for (const [group, gains] of Object.entries(TRAINING_GAINS) as Array<[TrainingKey, Partial<Record<AttributeKey, number>>]>) {
    const level = plan[group] ?? 0;
    for (const [attribute, amount] of Object.entries(gains) as Array<[AttributeKey, number]>) next[attribute] = Math.min(110, (next[attribute] ?? 0) + level * amount);
  }
  return next;
}

function playerMean(a: Required<Attributes>, position: PositionCode) { return avg(...POSITION_CORE[position].map((key)=>a[key])); }

function personalizedBand(position: PositionCode, key: AttributeKey, value: number, mean: number, parsed: ParsedCard, meta: boolean): [number,number,number] {
  const fallback: [number,number,number] = [70,80,92];
  const [baseMin,baseIdeal,baseCeiling] = POSITION_BANDS[position][key] ?? fallback;
  const standout = value - mean;
  let min = baseMin, ideal = baseIdeal, ceiling = baseCeiling;
  if (standout >= 8) { min = Math.max(min, value - 2); ideal = Math.max(ideal, value + 2); ceiling = Math.max(ceiling, value + 5); }
  if (standout <= -8) { ideal = Math.min(ideal, min + 6); ceiling = Math.min(ceiling, ideal + 7); }
  if (parsed.height && (key === 'heading' || key === 'jump') && parsed.height < 178) { ideal -= 3; ceiling -= 4; }
  if (meta) {
    if (['dribbling','acceleration','balance','defensiveAwareness','finishing','kickingPower','curl'].includes(key)) ideal += 1;
    if (key === 'speed' && (position === 'CB' || position === 'DMF')) ideal -= 1;
  }
  return [clamp(min,45,104),clamp(ideal,50,106),clamp(ceiling,55,108)];
}

function actionScores(a: Required<Attributes>) {
  return {
    'Receber pressionado': avg(a.ballControl,a.tightPossession,a.balance,a.lowPass),
    'Girar com a bola': avg(a.ballControl,a.dribbling,a.tightPossession,a.balance,a.acceleration),
    'Passe curto': avg(a.lowPass,a.ballControl,a.tightPossession),
    'Lançamento': avg(a.loftedPass,a.kickingPower,a.ballControl),
    'Atacar espaço': avg(a.offensiveAwareness,a.acceleration,a.speed,a.stamina),
    'Finalização colocada': avg(a.finishing,a.curl,a.balance,a.offensiveAwareness),
    'Chute de longe': avg(a.finishing,a.kickingPower,a.curl),
    'Recuperar a bola': avg(a.defensiveAwareness,a.tackling,a.defensiveEngagement,a.aggression),
    'Interceptar': avg(a.defensiveAwareness,a.defensiveEngagement,a.tackling),
    'Duelo físico': avg(a.physicalContact,a.balance,a.jump,a.aggression),
    'Defender cruzamentos': avg(a.heading,a.jump,a.physicalContact,a.defensiveAwareness),
    'Manter desempenho': avg(a.stamina,a.balance,a.defensiveEngagement,a.offensiveAwareness)
  };
}

function metaFit(position: PositionCode, a: Required<Attributes>) {
  const components: Array<[string, number, number]> = position === 'GK'
    ? [['Leitura e reflexo',avg(a.goalkeeperAwareness,a.goalkeeperReflexes),88],['Alcance',a.goalkeeperReach,86],['Controle de rebote',a.goalkeeperParrying,84]]
    : position === 'CB' || position === 'DMF'
      ? [['Leitura defensiva',avg(a.defensiveAwareness,a.defensiveEngagement),86],['Desarme',a.tackling,84],['Resposta',avg(a.acceleration,a.speed),76],['Físico',a.physicalContact,82]]
      : position === 'LWF' || position === 'RWF' || position === 'SS' || position === 'AMF'
        ? [['1 contra 1',avg(a.dribbling,a.tightPossession,a.balance),86],['Mudança de ritmo',avg(a.acceleration,a.speed),86],['Ação decisiva',avg(a.finishing,a.lowPass,a.curl),82]]
        : position === 'CF'
          ? [['Movimentação',avg(a.offensiveAwareness,a.acceleration),86],['Finalização',avg(a.finishing,a.kickingPower),87],['Saída do duelo',avg(a.balance,a.physicalContact),80]]
          : [['Controle e passe',avg(a.ballControl,a.lowPass,a.tightPossession),84],['Consistência',a.stamina,84],['Resposta',avg(a.acceleration,a.balance),80],['Proteção',avg(a.defensiveEngagement,a.physicalContact),76]];
  const normalized = components.map(([name,value,target])=>({name,value,score:Math.min(100,value/target*100)}));
  const score = clamp(avg(...normalized.map((item)=>item.score)));
  return {score, strengths:normalized.filter(x=>x.score>=96).map(x=>x.name), missing:normalized.filter(x=>x.score<88).map(x=>x.name)};
}

function variantScore(variant: BuildVariant, final: Required<Attributes>, position: PositionCode, parsed: ParsedCard, metaScore: number) {
  const core = avg(...POSITION_CORE[position].map((key)=>final[key]));
  const identityBase = avg(...POSITION_CORE[position].map((key)=>Math.min(100, final[key])));
  const skills = [...(parsed.specialSkills??[]),...(parsed.nativeSkills??[])];
  const skillScore = skills.length ? clamp(60 + skills.length * 4 + avg(...skills.map((name)=>SPECIAL_RULES[name]?.positions.includes(position)?18:5))) : 55;
  const waste = clamp(100-(variant.efficiencyScore??75));
  const identity = clamp((variant.title.toLowerCase().includes('identidade')?94:82)+(identityBase-core)*.2);
  const adaptation = clamp((variant.qualityScore??80)+(variant.title.toLowerCase().includes('adaptação')?8:0));
  const total = clamp((variant.qualityScore??80)*.28 + (variant.efficiencyScore??80)*.18 + identity*.18 + adaptation*.18 + skillScore*.09 + metaScore*.09 - waste*.08);
  return {total,identity,adaptation,skillScore,waste};
}

function shiftedPlan(base: TrainingPlan, preferred: TrainingKey[], avoid: TrainingKey[], budget: number): TrainingPlan {
  const plan = {...base};
  for (let i=0;i<3;i++) {
    const plus = preferred[i % Math.max(1,preferred.length)];
    const minus = avoid.find((key)=>(plan[key]??0)>1 && !preferred.includes(key));
    if (!plus || !minus) break;
    plan[plus] = Math.min(16,(plan[plus]??0)+1);
    plan[minus] = Math.max(0,(plan[minus]??0)-1);
  }
  while(planCost(plan)>budget){const key=(Object.keys(plan) as TrainingKey[]).sort((a,b)=>(plan[b]??0)-(plan[a]??0)).find(k=>!preferred.includes(k)&&plan[k]>0)??(Object.keys(plan) as TrainingKey[]).find(k=>plan[k]>0);if(!key)break;plan[key]-=1;}
  return plan;
}

export function buildMaxPrecisionAnalysis(args: {
  parsed: ParsedCard;
  position: PositionCode;
  selectedScore: number;
  objective: Objective;
  tacticalProfile: TacticalProfile;
  baseAttributes: Required<Attributes>;
  variants: BuildVariant[];
  trainingPointsTotal: number;
}): MaxPrecisionAnalysis {
  const {parsed,position,selectedScore,objective,tacticalProfile,baseAttributes,variants,trainingPointsTotal}=args;
  const winner = variants[0];
  const final = applyPlan(baseAttributes,winner.training);
  const mean = playerMean(baseAttributes,position);
  const metaMode = objective === 'META_2026';
  const important = POSITION_CORE[position];
  const finalAttributes: FinalAttributeProjection[] = important.map((attribute)=>{
    const before=Math.round(baseAttributes[attribute]); const after=Math.round(final[attribute]); const [functionalMin,personalizedIdeal,usefulCeiling]=personalizedBand(position,attribute,before,mean,parsed,metaMode);
    const status:FinalAttributeProjection['status']=after<functionalMin?'abaixo':after<personalizedIdeal?'funcional':after<=usefulCeiling?'ideal':'acima do útil';
    return {attribute,label:ATTRIBUTE_LABELS[attribute],before,after,gain:after-before,functionalMin,personalizedIdeal,usefulCeiling,status,note:status==='acima do útil'?'O próximo ponto tende a ter retorno menor.':status==='abaixo'?'Ainda é uma limitação funcional da conversão.':status==='ideal'?'Atingiu a faixa personalizada desta carta.':'Já cumpre a função, mas ainda pode evoluir se for sua prioridade.'};
  });

  const allValues = (Object.keys(baseAttributes) as AttributeKey[]).map((key)=>({key,value:baseAttributes[key]})).sort((a,b)=>b.value-a.value);
  const protectedAttributes = allValues.slice(0,5).map(({key,value})=>({attribute:key,label:ATTRIBUTE_LABELS[key],value:Math.round(value),reason:`Está entre as maiores qualidades desta versão e não deve ser sacrificada para copiar um molde de ${position}.`}));
  const blocked = protectedAttributes.filter((item)=>!TRAINING_GAINS[winner.training?('passing' as TrainingKey):'passing']).slice(0,0).map(()=> '');
  const signatureProtection:SignatureProtection={
    protectedAttributes,
    identityRetentionScore:clamp(78+protectedAttributes.filter(x=>final[x.attribute]>=x.value).length*4),
    destructiveChangesBlocked:[...blocked, ...protectedAttributes.slice(0,3).map(x=>`${x.label} foi preservado como assinatura da carta.`)]
  };

  const originalFamily = parsed.mainPosition === position ? 100 : parsed.positions.includes(position) ? 82 : 58;
  const conversionScore = clamp(selectedScore*.62+originalFamily*.25+signatureProtection.identityRetentionScore*.13);
  const conversionLevel:PositionConversionPrecision['level']=conversionScore>=80?'natural':conversionScore>=64?'possível':'difícil';
  const adaptationGroups = variants.find(v=>v.title.toLowerCase().includes('adaptação'))?.training ?? winner.training;
  const budgetForAdaptation = Math.max(0,planCost(adaptationGroups)-Math.min(...variants.map(v=>planCost(v.training))));
  const conversion:PositionConversionPrecision={
    level:conversionLevel,score:conversionScore,budgetForAdaptation,
    preservedQualities:protectedAttributes.slice(0,4).map(x=>x.label),
    correctedNeeds:finalAttributes.filter(x=>x.gain>0&&x.before<x.personalizedIdeal).slice(0,5).map(x=>`${x.label}: ${x.before} → ${x.after}`),
    persistentLimits:finalAttributes.filter(x=>x.status==='abaixo').map(x=>`${x.label} continua abaixo da faixa funcional.`),
    verdict:conversionLevel==='natural'?'A carta já possui base forte para a posição escolhida.':conversionLevel==='possível'?'A conversão é viável com correções seletivas, preservando a identidade.':'A posição foi respeitada, mas algumas limitações naturais continuarão existindo.'
  };

  const skills = Array.from(new Set([parsed.specialTag ?? '', ...(parsed.specialSkills??[]), ...(parsed.nativeSkills??[]), ...(parsed.impetos??[]).map((item)=>item.name)])).filter(Boolean);
  const deepSkills:DeepSkillPrecision[]=skills.map((name)=>{
    const rule=SPECIAL_RULES[name]; const attrs=rule?.attrs??important.slice(0,4); const before=clamp(avg(...attrs.map(k=>baseAttributes[k]))); const after=clamp(avg(...attrs.map(k=>final[k]))); const positionFit=rule?rule.positions.includes(position):true;
    const expectedUse:DeepSkillPrecision['expectedUse']=positionFit?(after>=84?'alta':'média'):'baixa';
    const gain=after-before; const costBenefit:DeepSkillPrecision['costBenefit']=positionFit&&gain>=3?'alto':positionFit?'médio':'baixo';
    return {name,expectedUse,supportBefore:before,supportAfter:after,gain,costBenefit,positionImpact:positionFit?`A posição escolhida cria situações para ${rule?.use??'usar a habilidade'}.`:`A habilidade existe, mas ${position} oferece poucas situações naturais de uso.`,recommendation:positionFit?`A ficha sustenta ${name} sem concentrar todo o orçamento nela.`:`Preservar a habilidade, mas não construir a ficha inteira ao redor dela.`};
  });

  const beforeActions=actionScores(baseAttributes), afterActions=actionScores(final);
  const actions:ActionProjection[]=Object.keys(beforeActions).map((action)=>{const before=clamp(beforeActions[action as keyof typeof beforeActions]);const after=clamp(afterActions[action as keyof typeof afterActions]);const status:ActionProjection['status']=after>=86?'forte':after>=76?'funcional':'limitada';return {action,before,after,gain:after-before,status,explanation:status==='forte'?'Ação projetada como diferencial desta ficha.':status==='funcional'?'Cumpre a função sem exigir investimento exagerado.':'Continua sendo uma limitação a administrar em campo.'};});

  const pointAudit:PointAudit[]=(Object.keys(winner.training) as TrainingKey[]).filter(k=>winner.training[k]>0).map((training)=>{
    const affected=Object.keys(TRAINING_GAINS[training]??{}) as AttributeKey[]; const useful=affected.filter(k=>important.includes(k)); const usefulGain=useful.reduce((sum,key)=>sum+(final[key]-baseAttributes[key]),0); const cost=trainingTotalCost(winner.training[training]); const ratio=cost?usefulGain/cost:0; const marginalReturn:PointAudit['marginalReturn']=ratio>=1.25?'alto':ratio>=.65?'médio':'baixo';
    return {training,label:TRAINING_LABELS[training],level:winner.training[training],realCost:cost,affectedAttributes:affected.map(k=>ATTRIBUTE_LABELS[k]),usefulGain,marginalReturn,verdict:marginalReturn==='alto'?'Investimento eficiente para esta carta.':marginalReturn==='médio'?'Investimento funcional, mas depende da prioridade escolhida.':'O próximo nível deve ser evitado se houver outro grupo com retorno maior.'};
  }).sort((a,b)=>b.usefulGain/Math.max(1,b.realCost)-a.usefulGain/Math.max(1,a.realCost));

  const meta = metaFit(position,final);
  const meta2026:Meta2026Analysis={
    patchReference:'v5.5.0',updatedAt:'2026-07-13',classification:'tendência competitiva editável',
    officialMechanics:[
      'Drible em velocidade e Sharp Touch ficaram mais responsivos; Drible, Aceleração e Equilíbrio ganharam valor prático no 1 contra 1.',
      'Dar bote agressivo tem punição maior quando o atacante gira; leitura, Match-up e momento do desarme são mais importantes que correr no portador.',
      'Talento defensivo passou a contribuir mais na resposta da marcação, reduzindo a necessidade de transformar todo defensor em velocista.',
      'Chutes de longe ganharam viabilidade; Finalização, Força do chute e Curva podem criar uma rota real contra bloco baixo.',
      'Goleiros avançam melhor no 1 contra 1; atacante precisa de decisão e execução, não apenas velocidade.',
      'Resistência e condição continuam importantes para consistência e rotação, mas o declínio da Aceleração foi suavizado em atualizações recentes.'
    ],
    competitiveTrends:[
      {name:'4-2-1-3 equilibrado',confidence:'média',note:'Tendência comunitária pela cobertura do duplo pivô, MAT entre linhas e três atacantes.'},
      {name:'4-2-2-2 vertical',confidence:'média',note:'Muito usada com Contra-Ataque Rápido por oferecer tabelas curtas e duas referências.'},
      {name:'4-3-3 de posse/amplitude',confidence:'média',note:'Continua forte quando meio e pontas mantêm largura, passe e controle.'},
      {name:'4-2-3-1 como plano alternativo',confidence:'média',note:'Ajuda contra pressão central e dá mais linhas de passe entre os setores.'}
    ],
    playerMetaFit:meta.score,fitLabel:meta.score>=90?'excelente':meta.score>=80?'bom':meta.score>=68?'situacional':'baixo',
    strongestMetaTraits:meta.strengths.length?meta.strengths:['Nenhum diferencial meta confirmado acima da faixa alta.'],
    missingMetaTraits:meta.missing.length?meta.missing:['A carta já cobre as exigências principais do recorte atual.'],
    recommendedMetaUse:position==='CB'||position==='DMF'?'Priorize leitura defensiva, cobertura e desarme; não gaste todo o orçamento apenas em velocidade.':position==='LWF'||position==='RWF'||position==='SS'||position==='AMF'?'Explore mudança de direção, aceleração curta e uma ação decisiva de passe ou chute.':position==='CF'?'Crie duas rotas de gol: movimentação na área e finalização de média distância quando o bloco fechar.':'Mantenha controle, passe e resistência suficientes para não quebrar o ritmo do time.',
    disclaimer:'A versão atual considerada é a v5.5.0; as mudanças de gameplay mais recentes usadas no motor vêm principalmente da v5.4.0. Meta não é regra oficial nem garantia de vitória: é uma tendência competitiva datada e editável.'
  };

  const skillGroups=Array.from(new Set(deepSkills.flatMap(item=>SPECIAL_RULES[item.name]?.groups??[])));
  const metaGroups:TrainingKey[]=position==='CB'||position==='DMF'?['defending','lowerBodyStrength']:position==='LWF'||position==='RWF'||position==='SS'||position==='AMF'?['dribbling','dexterity','shooting']:position==='CF'?['shooting','dexterity','lowerBodyStrength']:['passing','dribbling','lowerBodyStrength'];
  const avoid=(Object.keys(winner.training) as TrainingKey[]).sort((a,b)=>(winner.training[b]??0)-(winner.training[a]??0));
  const specialPlan=shiftedPlan(winner.training,skillGroups,avoid,trainingPointsTotal);
  const metaPlan=shiftedPlan(winner.training,metaGroups,avoid,trainingPointsTotal);
  const sourceVariants:[string,PrecisionAlternative['source'],TrainingPlan,string][]=[
    [variants[0]?.title??'Ficha híbrida DNA','DNA híbrida',variants[0]?.training??winner.training,'Melhor equilíbrio entre identidade, adaptação e eficiência.'],
    [variants[1]?.title??'Ficha identidade','Identidade',variants[1]?.training??winner.training,'Preserva os diferenciais naturais da versão da carta.'],
    [variants[2]?.title??'Ficha adaptação','Adaptação',variants[2]?.training??winner.training,'Corrige as lacunas mais importantes da posição escolhida.'],
    ['Ficha focada na habilidade especial','Habilidade especial',specialPlan,deepSkills.length?'Aumenta o suporte das habilidades confirmadas sem ultrapassar o orçamento.':'Sem habilidade especial confirmada; fica próxima da híbrida.'],
    ['Ficha Meta 2026','Meta 2026',metaPlan,'Ajusta a distribuição às mecânicas atuais e às tendências competitivas, sem tratá-las como regra oficial.']
  ];
  const alternatives:PrecisionAlternative[]=sourceVariants.map(([title,source,training,why])=>{const f=applyPlan(baseAttributes,training);const baseVariant=variants.find(v=>v.training===training)??variants[0];const scores=variantScore(baseVariant,f,position,parsed,metaFit(position,f).score);return {title,source,training,score:scores.total,identityScore:scores.identity,adaptationScore:scores.adaptation,skillScore:scores.skillScore,metaScore:metaFit(position,f).score,wasteScore:scores.waste,why};}).sort((a,b)=>b.score-a.score);

  const generic=[...alternatives].sort((a,b)=>b.score-a.score);
  const antiCloneDistance=clamp((parsed.evidence.attributeCount*2)+(parsed.playstyle?12:0)+skills.length*3+(parsed.height?5:0)+(parsed.weight?4:0));
  const versionParts=[parsed.playerName,parsed.cardType,parsed.specialTag??'',parsed.playstyle??'',parsed.overall??'',parsed.level??'',parsed.trainingPointsTotal??'',skills.sort().join(','),...important.map(k=>`${k}:${baseAttributes[k]}`)];
  const differentiators=[parsed.cardType&&`Tipo: ${parsed.cardType}`,parsed.specialTag&&`Tag: ${parsed.specialTag}`,parsed.playstyle&&`Estilo oficial: ${parsed.playstyle}`,skills.length&&`${skills.length} habilidades confirmadas`,parsed.height&&`${parsed.height} cm`,parsed.trainingPointsTotal&&`${parsed.trainingPointsTotal} pontos disponíveis`].filter(Boolean) as string[];
  const versionIdentity:CardVersionIdentity={signature:`VER-${hash(versionParts.join('|'))}`,detectedVersion:[parsed.cardType,parsed.specialTag].filter(Boolean).join(' • ')||'Versão identificada pelos atributos',confidence:clamp(45+parsed.evidence.attributeCount*2+(parsed.playstyle?10:0)+skills.length*2),differentiators,samePlayerDifferentVersionWarning:'O nome do jogador não é suficiente: atributos, habilidades, pacote, nível e pontos formam uma versão única.'};

  return {
    versionIdentity,
    recommendedVariantTitle:generic[0]?.title??winner.title,
    finalAttributes,signatureProtection,conversion,deepSkills,actions,pointAudit,alternatives,
    antiCloneDistance,
    explanation:[
      `A ficha foi calculada para ${position}, mas os pesos vieram da versão ${versionIdentity.signature}.`,
      `${signatureProtection.protectedAttributes.length} características naturais receberam proteção contra cortes destrutivos.`,
      `${finalAttributes.filter(x=>x.status==='ideal').length} atributo(s) atingiram a faixa ideal personalizada.`,
      `${pointAudit.filter(x=>x.marginalReturn==='baixo').length} grupo(s) chegaram a retorno baixo e devem parar de receber pontos.`,
      `O modo Meta 2026 é separado, datado e opcional; a ficha principal continua priorizando a identidade real da carta.`
    ],
    meta2026,
    calibratedLearningStatus:'O aprendizado específico desta versão continua separado por jogador, posição, ficha, técnico e formação. Uma nova recomendação calibrada só deve ganhar peso após padrões repetidos em várias partidas.'
  };
}
