import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import {
  enforceHardTrainingIdentity,
  fitTrainingToExactBudget,
  trainingTemplate
} from '@/modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  trainingPlanTotalCost
} from './trainingPlanCore';

export const INDIVIDUAL_IDENTITY_ENGINE_V4080_R39 = '40.80-r39-individual-card-identity' as const;

const ATTRIBUTES: AttributeKey[] = [
  'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading',
  'placeKicking','curl','defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness',
  'goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach','speed','acceleration','kickingPower',
  'jump','physicalContact','balance','stamina'
];

const GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
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

const POSITION_ROLE: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 2.4, dexterity: 2.0, lowerBodyStrength: 1.15, dribbling: .9, passing: .35, aerialStrength: .55, defending: -20 },
  SS: { dexterity: 2.1, dribbling: 1.8, shooting: 1.5, passing: 1.35, lowerBodyStrength: .75, aerialStrength: .2, defending: -20 },
  LWF: { dribbling: 2.2, dexterity: 2.05, lowerBodyStrength: 1.25, shooting: 1.15, passing: .75, aerialStrength: -.25, defending: -20 },
  RWF: { dribbling: 2.2, dexterity: 2.05, lowerBodyStrength: 1.25, shooting: 1.15, passing: .75, aerialStrength: -.25, defending: -20 },
  AMF: { passing: 2.25, dribbling: 1.9, dexterity: 1.35, shooting: .85, lowerBodyStrength: .45, aerialStrength: -.4, defending: -10 },
  LMF: { passing: 1.55, dribbling: 1.2, dexterity: 1.35, lowerBodyStrength: 1.35, defending: .9, shooting: .35, aerialStrength: .2 },
  RMF: { passing: 1.55, dribbling: 1.2, dexterity: 1.35, lowerBodyStrength: 1.35, defending: .9, shooting: .35, aerialStrength: .2 },
  CMF: { passing: 1.8, lowerBodyStrength: 1.35, defending: 1.25, dexterity: 1.0, dribbling: .85, shooting: .35, aerialStrength: .25 },
  DMF: { defending: 2.4, passing: 1.4, lowerBodyStrength: 1.5, dexterity: .75, aerialStrength: .8, dribbling: .3, shooting: -.8 },
  CB: { defending: 2.75, aerialStrength: 1.65, lowerBodyStrength: 1.45, dexterity: .9, passing: .55, dribbling: -1.3, shooting: -20 },
  LB: { defending: 1.8, lowerBodyStrength: 1.55, dexterity: 1.25, passing: 1.15, dribbling: .7, aerialStrength: .4, shooting: -.8 },
  RB: { defending: 1.8, lowerBodyStrength: 1.55, dexterity: 1.25, passing: 1.15, dribbling: .7, aerialStrength: .4, shooting: -.8 },
  GK: { gk2: 2.8, gk3: 2.55, gk1: 2.45, aerialStrength: .7, lowerBodyStrength: .25 }
};

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function mean(values: number[]) {
  const safe = values.filter((v) => Number.isFinite(v) && v > 0);
  return safe.length ? safe.reduce((a,b) => a+b, 0) / safe.length : 0;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function complete(input: Attributes): Required<Attributes> {
  const out = {} as Required<Attributes>;
  for (const key of ATTRIBUTES) out[key] = Number(input[key] ?? 0);
  return out;
}
function groupAverage(a: Required<Attributes>, key: TrainingKey) {
  return mean((Object.keys(GAINS[key]) as AttributeKey[]).map((attr) => Number(a[attr] ?? 0)));
}
function reconstruct(result: AnalysisResult) {
  const current = complete(result.parsed.attributes);
  const allocation = result.parsed.autoTrainingPlan;
  const used = Number(result.parsed.trainingPointsUsed ?? result.parsed.autoTrainingPoints ?? 0);
  if (!allocation || used <= 0) return current;
  const natural = { ...current };
  for (const key of TRAINING_KEYS) {
    const level = Math.max(0, Number(allocation[key] ?? 0));
    if (!level) continue;
    for (const [attribute, gain] of Object.entries(GAINS[key]) as Array<[AttributeKey, number]>) {
      if (natural[attribute] > 0) natural[attribute] = Math.max(1, natural[attribute] - level * Number(gain));
    }
  }
  return natural;
}

function styleWeight(position: PositionCode, key: TrainingKey, raw: string, a: Required<Attributes>) {
  const style = normalize(raw);
  let value = 0;
  const add = (x: Partial<Record<TrainingKey, number>>) => { value += Number(x[key] ?? 0); };
  const aerial = mean([a.heading,a.jump,a.physicalContact]);
  const technique = mean([a.ballControl,a.dribbling,a.tightPossession,a.balance]);

  if (/artilheiro|goal poacher/.test(style)) add({ shooting: 1.9, dexterity: 1.45, lowerBodyStrength: .65, dribbling: technique >= 82 ? .9 : .3, aerialStrength: aerial >= 80 ? .6 : -.8, defending: -20 });
  if (/homem de area|fox in the box/.test(style)) add({ shooting: 1.8, aerialStrength: 1.45, lowerBodyStrength: .8, dexterity: .6, defending: -20 });
  if (/pivo|pivô|target man/.test(style)) add({ lowerBodyStrength: 1.6, aerialStrength: 1.2, passing: 1.0, shooting: .8, dribbling: .4, defending: -20 });
  if (/puxa marcacao|deep lying forward/.test(style)) add({ passing: 1.45, dribbling: 1.1, dexterity: .9, shooting: .6, defending: -20 });
  if (/armador criativo|creative playmaker/.test(style)) add({ passing: 1.8, dribbling: 1.4, dexterity: .65, shooting: .35 });
  if (/classico|clássico/.test(style)) add({ passing: 1.9, dribbling: 1.4, shooting: .4, lowerBodyStrength: -.3 });
  if (/infiltracao|infiltração|hole player|atacante surpresa/.test(style)) add({ dexterity: 1.6, shooting: 1.2, lowerBodyStrength: .6, dribbling: .55 });
  if (/meia versatil|meia versátil|box-to-box/.test(style)) add({ lowerBodyStrength: 1.2, passing: 1.0, defending: .95, dexterity: .7 });
  if (/orquestrador/.test(style)) add({ passing: 1.9, dribbling: .7, lowerBodyStrength: .55, defending: .4 });
  if (/primeiro volante|anchor man|ancora|âncora/.test(style)) add({ defending: 2.0, passing: .85, lowerBodyStrength: 1.05, aerialStrength: .6, shooting: -10 });
  if (/destruidor|destroyer/.test(style)) add({ defending: 2.05, lowerBodyStrength: 1.2, aerialStrength: .75, dexterity: .45 });
  if (/defensor criativo|build up|construtor/.test(style)) add({ defending: 1.8, passing: 1.05, aerialStrength: .65, lowerBodyStrength: .55 });
  if (/lateral defensivo|defensive full/.test(style)) add({ defending: 1.8, lowerBodyStrength: 1.05, passing: .55, shooting: -10 });
  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) add({ lowerBodyStrength: 1.25, passing: 1.2, dexterity: 1.05, dribbling: .7, defending: .45 });
  if (/ala produtivo|prolific winger/.test(style)) add({ dribbling: 1.5, dexterity: 1.35, lowerBodyStrength: .85, shooting: .65 });
  if (/lateral movel|lateral móvel|roaming flank/.test(style)) add({ dexterity: 1.35, lowerBodyStrength: 1.15, dribbling: 1.1, shooting: .45 });
  if (/perito em cruzamento|cross specialist/.test(style)) add({ passing: 1.7, lowerBodyStrength: .95, dexterity: .65, dribbling: .35 });
  if (/goleiro ofensivo|offensive goalkeeper/.test(style)) add({ gk2: .9, gk3: .75, lowerBodyStrength: .25 });
  if (/goleiro defensivo|defensive goalkeeper/.test(style)) add({ gk1: .8, gk2: .8, gk3: .65 });

  if (['CF','SS','LWF','RWF','AMF'].includes(position) && key === 'defending') return -30;
  if (position === 'CB' && key === 'shooting') return -30;
  return value;
}

function fingerprint(result: AnalysisResult, natural: Required<Attributes>) {
  const body = ATTRIBUTES.map((key) => Math.round(Number(natural[key] ?? 0))).join(',');
  const raw = `${result.parsed.playerName}|${result.parsed.cardType}|${result.parsed.mainPosition}|${result.parsed.playstyle}|${body}`;
  let h = 2166136261;
  for (let i=0;i<raw.length;i++) { h ^= raw.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function identitySignals(result: AnalysisResult, natural: Required<Attributes>) {
  const position = result.bestPosition.code;
  const validKeys = position === 'GK'
    ? (['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'] as TrainingKey[])
    : (['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'] as TrainingKey[]);
  const groups = Object.fromEntries(TRAINING_KEYS.map((key) => [key, groupAverage(natural,key)])) as Record<TrainingKey,number>;
  const baseline = mean(validKeys.map((key) => groups[key]));
  const signal = Object.fromEntries(TRAINING_KEYS.map((key) => [key, -10])) as Record<TrainingKey,number>;

  for (const key of validKeys) {
    const relative = baseline > 0 ? clamp((groups[key]-baseline)/5.5, -2.6, 2.6) : 0;
    const role = Number(POSITION_ROLE[position]?.[key] ?? 0);
    const style = styleWeight(position,key,result.parsed.playstyle ?? '',natural);
    const saturation = groups[key] >= 96 ? -1.6 : groups[key] >= 93 ? -.9 : groups[key] >= 90 ? -.35 : 0;
    const severeWeakness = groups[key] > 0 && groups[key] < baseline - 12 ? -.9 : 0;
    signal[key] = relative * 1.45 + role + style + saturation + severeWeakness;
  }
  return { groups, signal };
}

function projectedGroup(natural: Required<Attributes>, plan: TrainingPlan, key: TrainingKey) {
  const attrs = Object.keys(GAINS[key]) as AttributeKey[];
  return mean(attrs.map((attr) => Number(natural[attr] ?? 0) + Number(plan[key] ?? 0) * Number(GAINS[key][attr] ?? 0)));
}

function candidateScore(result: AnalysisResult, natural: Required<Attributes>, plan: TrainingPlan, signal: Record<TrainingKey,number>) {
  const position = result.bestPosition.code;
  const keys = position === 'GK'
    ? (['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'] as TrainingKey[])
    : (['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'] as TrainingKey[]);
  let total = 0, weightTotal = 0;
  for (const key of keys) {
    if (signal[key] <= -9) continue;
    const projected = projectedGroup(natural, plan, key);
    const role = Math.max(.15, Number(POSITION_ROLE[position]?.[key] ?? .2) + Math.max(0, styleWeight(position,key,result.parsed.playstyle ?? '',natural))*.5);
    const identity = 1 + clamp(signal[key], -2, 4) * .12;
    const ceilingPenalty = projected > 98 ? (projected-98)*2 : projected > 95 ? (projected-95)*.5 : 0;
    total += (projected * role * identity) - ceilingPenalty;
    weightTotal += role;
  }
  return weightTotal ? total/weightTotal : 0;
}

function mutate(base: TrainingPlan, signal: Record<TrainingKey,number>) {
  const plans: TrainingPlan[] = [{...base}];
  const rankedUp = [...TRAINING_KEYS].sort((a,b) => signal[b]-signal[a]).slice(0,5);
  const rankedDown = [...TRAINING_KEYS].sort((a,b) => signal[a]-signal[b]).slice(0,5);
  for (const up of rankedUp) for (const down of rankedDown) {
    if (up === down || Number(base[down] ?? 0) <= 0) continue;
    for (const step of [1,2]) {
      const p = {...base};
      p[up] = Math.min(16, Number(p[up] ?? 0) + step);
      p[down] = Math.max(0, Number(p[down] ?? 0) - step);
      plans.push(p);
    }
  }
  return plans;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((k) => `${k}:${Number(plan[k] ?? 0)}`).join('|');
}

export function applyIndividualIdentityEngineV4080R39(result: AnalysisResult): AnalysisResult {
  const coverage = Number(result.parsed.evidence.attributeCount ?? 0);
  if (coverage < 10) return result;

  const natural = reconstruct(result);
  const { signal } = identitySignals(result,natural);
  const position = result.bestPosition.code;
  const priority = trainingTemplate(position,'COMPETITIVE',natural,result.parsed).priority;
  const safeBase = enforceHardTrainingIdentity(result.training,position,result.parsed);
  const fp = fingerprint(result,natural);

  const unique = new Map<string,TrainingPlan>();
  for (const target of mutate(safeBase,signal)) {
    const exact = fitTrainingToExactBudget(target,priority,result.trainingPointsTotal,position,result.parsed);
    const safe = enforceHardTrainingIdentity(exact,position,result.parsed);
    if (trainingPlanTotalCost(safe) !== result.trainingPointsTotal) continue;
    unique.set(signature(safe),safe);
  }

  const candidates = [...unique.values()].map((plan) => ({
    plan,
    score: candidateScore(result,natural,plan,signal)
  })).sort((a,b) => {
    const delta = b.score-a.score;
    if (Math.abs(delta) > .18) return delta;
    const ah = (fp ^ signature(a.plan).length ^ Number(a.plan.dexterity ?? 0)*31 ^ Number(a.plan.passing ?? 0)*17) >>> 0;
    const bh = (fp ^ signature(b.plan).length ^ Number(b.plan.dexterity ?? 0)*31 ^ Number(b.plan.passing ?? 0)*17) >>> 0;
    return ah-bh;
  });

  const winner = candidates[0]?.plan ?? safeBase;
  const used = trainingPlanTotalCost(winner);
  const changed = signature(winner) !== signature(safeBase);

  return {
    ...result,
    training: winner,
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0,result.trainingPointsTotal-used),
    recommendationExplanation: [
      `Identidade Individual r39: ${result.parsed.playerName} foi otimizado pela carta específica, não por receita de ${result.bestPosition.code} + ${result.parsed.playstyle ?? 'estilo'}.`,
      changed
        ? 'A ficha foi diferenciada porque os atributos naturais desta carta indicaram retorno marginal superior em outra distribuição.'
        : 'A ficha anterior foi mantida porque a auditoria individual não encontrou distribuição superior com o mesmo orçamento.',
      'Mesma posição e mesmo estilo só podem resultar em ficha idêntica quando o DNA numérico das cartas justificar.',
      ...result.recommendationExplanation
    ].filter((item,index,all) => all.indexOf(item) === index).slice(0,64)
  };
}
