import type { AnalysisResult, AttributeKey, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const FINAL_CARD_AUTHORITY_V4080_R45 = '40.80-r45-final-card-authority' as const;

const ATTRIBUTE_GROUPS: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing','placeKicking','curl'],
  passing: ['lowPass','loftedPass'],
  dribbling: ['ballControl','dribbling','tightPossession'],
  dexterity: ['offensiveAwareness','acceleration','balance'],
  lowerBodyStrength: ['speed','kickingPower','stamina'],
  aerialStrength: ['heading','jump','physicalContact'],
  defending: ['defensiveAwareness','defensiveEngagement','tackling','aggression'],
  gk1: ['goalkeeperAwareness','goalkeeperCatching'],
  gk2: ['goalkeeperParrying','goalkeeperReflexes'],
  gk3: ['goalkeeperReach','jump']
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  const safe = values.filter((value) => Number.isFinite(value) && value > 0);
  return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function emptyPlan(): TrainingPlan {
  return { shooting:0, passing:0, dribbling:0, dexterity:0, lowerBodyStrength:0, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 };
}

function activeKeys(position: PositionCode): TrainingKey[] {
  if (position === 'GK') return ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];
  if (position === 'CB') return ['passing','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if (position === 'LB' || position === 'RB' || position === 'DMF') return ['passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if (position === 'CMF' || position === 'LMF' || position === 'RMF') return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if (position === 'CF' || position === 'SS') return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength'];
  return ['shooting','passing','dribbling','dexterity','lowerBodyStrength'];
}

function groupAverage(result: AnalysisResult, key: TrainingKey) {
  return mean(ATTRIBUTE_GROUPS[key].map((attribute) => Number(result.parsed.attributes[attribute] ?? 0)));
}

function positionWeight(position: PositionCode, key: TrainingKey) {
  const table: Partial<Record<PositionCode, Partial<Record<TrainingKey, number>>>> = {
    GK:{gk1:2.6,gk2:3,gk3:2.8,aerialStrength:.7,lowerBodyStrength:.3},
    CB:{defending:3,aerialStrength:1.85,lowerBodyStrength:1.55,dexterity:.9,passing:.7},
    LB:{defending:2.0,lowerBodyStrength:1.7,dexterity:1.35,passing:1.25,dribbling:.7,aerialStrength:.45},
    RB:{defending:2.0,lowerBodyStrength:1.7,dexterity:1.35,passing:1.25,dribbling:.7,aerialStrength:.45},
    DMF:{defending:2.65,lowerBodyStrength:1.65,passing:1.55,aerialStrength:.85,dexterity:.8,dribbling:.3},
    CMF:{passing:1.95,lowerBodyStrength:1.45,defending:1.3,dexterity:1.1,dribbling:.95,shooting:.35,aerialStrength:.3},
    LMF:{passing:1.65,lowerBodyStrength:1.5,dexterity:1.4,dribbling:1.25,defending:.85,shooting:.35,aerialStrength:.2},
    RMF:{passing:1.65,lowerBodyStrength:1.5,dexterity:1.4,dribbling:1.25,defending:.85,shooting:.35,aerialStrength:.2},
    AMF:{passing:2.35,dribbling:2.0,dexterity:1.5,shooting:.85,lowerBodyStrength:.6},
    SS:{dexterity:2.2,dribbling:1.9,shooting:1.55,passing:1.3,lowerBodyStrength:.95,aerialStrength:.3},
    CF:{shooting:2.5,dexterity:2.05,lowerBodyStrength:1.35,dribbling:.9,passing:.4,aerialStrength:.75},
    LWF:{dribbling:2.35,dexterity:2.2,lowerBodyStrength:1.45,shooting:1.1,passing:.75},
    RWF:{dribbling:2.35,dexterity:2.2,lowerBodyStrength:1.45,shooting:1.1,passing:.75}
  };
  return Number(table[position]?.[key] ?? .1);
}

function styleWeight(result: AnalysisResult, key: TrainingKey) {
  const style = normalize(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
  let score = 0;
  const add = (pattern: RegExp, weights: Partial<Record<TrainingKey, number>>) => {
    if (pattern.test(style)) score += Number(weights[key] ?? 0);
  };
  add(/artilheiro|goal poacher/,{shooting:1.8,dexterity:1.4,lowerBodyStrength:.65});
  add(/puxa marcacao|deep lying forward/,{passing:1.25,dribbling:1.1,dexterity:.9});
  add(/armador criativo|creative playmaker/,{passing:1.8,dribbling:1.45,dexterity:.65});
  add(/meia versatil|box.to.box/,{lowerBodyStrength:1.35,passing:1.0,defending:1.0,dexterity:.7});
  add(/orquestrador|orchestrator/,{passing:1.9,dribbling:.7,lowerBodyStrength:.5,defending:.4});
  add(/primeiro volante|anchor man/,{defending:2.0,lowerBodyStrength:1.15,passing:.85,aerialStrength:.55});
  add(/destruidor|destroyer/,{defending:2.05,lowerBodyStrength:1.25,aerialStrength:.75,dexterity:.45});
  add(/defensor criativo|build up/,{defending:1.8,passing:1.05,aerialStrength:.65,lowerBodyStrength:.55});
  add(/lateral defensivo|defensive full/,{defending:1.8,lowerBodyStrength:1.1,passing:.65});
  add(/lateral ofensivo|lateral atacante|lateral movel|roaming flank|offensive full/,{lowerBodyStrength:1.35,dexterity:1.1,passing:1.15,dribbling:.7});
  add(/ala produtivo|prolific winger/,{dribbling:1.55,dexterity:1.4,lowerBodyStrength:1.0,shooting:.55});
  return score;
}

function physicalBias(result: AnalysisResult, key: TrainingKey) {
  const p = result.parsed.physicalProfile;
  const position = result.bestPosition.code;
  let score = 0;
  const longLegs = Number(p.legLength ?? 0) >= 8 || Number(p.legCoverageRadius ?? 0) >= 176;
  const longArms = Number(p.armLength ?? 0) >= 8 || Number(p.armCoverageRadius ?? 0) >= 152;
  const strongFrame = Number(p.shoulderWidth ?? 0) >= 7 || Number(p.thighSize ?? 0) >= 9 || Number(p.calfSize ?? 0) >= 11 || Number(p.trunkCollision ?? 0) >= 49;
  const highJump = Number(p.jumpHeight ?? 0) >= 250;
  const compactFrame = Number(p.baseHeight ?? 0) > 0 && Number(p.baseHeight ?? 0) <= 176;

  if (longLegs) {
    if (key === 'defending' && ['CB','DMF','LB','RB'].includes(position)) score += 1.8;
    if (key === 'lowerBodyStrength') score += .7;
    if (key === 'aerialStrength') score += .55;
  }
  if (longArms) {
    if (key === 'gk3' && position === 'GK') score += 2.0;
    if (key === 'defending' && ['CB','LB','RB'].includes(position)) score += .45;
  }
  if (strongFrame) {
    if (key === 'lowerBodyStrength') score += 1.6;
    if (key === 'aerialStrength') score += 1.0;
  }
  if (highJump && key === 'aerialStrength') score += 1.7;
  if (compactFrame && ['SS','AMF','LWF','RWF','LMF','RMF'].includes(position)) {
    if (key === 'dexterity') score += 1.0;
    if (key === 'dribbling') score += .75;
    if (key === 'aerialStrength') score -= .55;
  }
  return score;
}

function physicalSignals(result: AnalysisResult) {
  const p = result.parsed.physicalProfile;
  const entries = Object.entries(p).filter(([,value]) => Number.isFinite(Number(value)) && Number(value) > 0);
  return entries.map(([key,value]) => `${key}:${Number(value)}`);
}

function levelUtility(result: AnalysisResult, key: TrainingKey, level: number, baseline: number) {
  const natural = groupAverage(result,key);
  const dna = clamp((natural-baseline)/8,-1.6,1.8);
  const fit = Math.max(.05, positionWeight(result.bestPosition.code,key) + styleWeight(result,key) + physicalBias(result,key));
  let score = 0;
  for (let current=1; current<=level; current+=1) {
    const projected = natural + current - 1;
    const saturation = projected>=97 ? .08 : projected>=95 ? .28 : projected>=92 ? .62 : 1;
    score += fit * (1 + dna*.38) * saturation;
  }
  return score;
}

function exactIndividualPlan(result: AnalysisResult): TrainingPlan | null {
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  if (!Number.isFinite(budget) || budget <= 0) return null;
  const keys = activeKeys(result.bestPosition.code);
  const baseline = mean(keys.map((key)=>groupAverage(result,key)));
  type Node = { score:number; plan:TrainingPlan };
  let dp: Array<Node|null> = Array.from({length:budget+1},()=>null);
  dp[0] = {score:0,plan:emptyPlan()};

  for (const key of keys) {
    const next: Array<Node|null> = Array.from({length:budget+1},()=>null);
    for (let spent=0; spent<=budget; spent+=1) {
      const previous = dp[spent];
      if (!previous) continue;
      for (let level=0; level<=16; level+=1) {
        const total = spent + trainingTotalCost(level);
        if (total>budget) break;
        const score = previous.score + levelUtility(result,key,level,baseline);
        if (!next[total] || score > (next[total]?.score ?? -Infinity) + 1e-9) {
          next[total] = {score,plan:{...previous.plan,[key]:level}};
        }
      }
    }
    dp = next;
  }
  return dp[budget]?.plan ?? null;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key)=>`${key}:${Number(plan[key]??0)}`).join('|');
}

export function applyFinalCardAuthorityV4080R45(result: AnalysisResult): AnalysisResult {
  const signals = physicalSignals(result);
  const candidate = exactIndividualPlan(result);
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const winner = candidate && trainingPlanTotalCost(candidate) === budget ? candidate : result.training;
  const changed = signature(winner) !== signature(result.training);

  return {
    ...result,
    training:winner,
    trainingPointsUsed:trainingPlanTotalCost(winner),
    trainingPointsRemaining:Math.max(0,budget-trainingPlanTotalCost(winner)),
    finalCardAuthorityV4080R45:{
      engineVersion:FINAL_CARD_AUTHORITY_V4080_R45,
      changed,
      physicalSignalsUsed:signals.length,
      physicalFingerprint:signals.join('|') || 'sem-modelo-fisico',
      authority:'result.training',
      reason: signals.length
        ? `Ficha final recalculada com ${signals.length} sinais do modelo físico, atributos naturais, posição e estilo.`
        : 'Ficha final recalculada por atributos naturais, posição e estilo; modelo físico não foi confirmado no OCR.'
    },
    recommendationExplanation:[
      `Autoridade Final r45: a ficha exibida e usada pelo app agora é sempre result.training.` ,
      signals.length ? `Modelo físico entrou na decisão com ${signals.length} sinal(is): ${signals.slice(0,5).join(' • ')}.` : 'Modelo físico sem dados suficientes; nenhuma medida corporal foi inventada.',
      changed ? 'A distribuição anterior foi substituída pela otimização individual final.' : 'A distribuição anterior venceu também a auditoria individual final.',
      ...result.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,64)
  } as AnalysisResult;
}
