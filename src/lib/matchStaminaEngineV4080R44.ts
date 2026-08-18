import type { AnalysisResult, AttributeKey, Attributes, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const MATCH_STAMINA_ENGINE_V4080_R44 = '40.80-r44-match-stamina-90m' as const;

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

const FIELD_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
const GK_KEYS: TrainingKey[] = ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
function complete(input: Attributes): Required<Attributes> {
  const output = {} as Required<Attributes>;
  for (const key of ATTRIBUTES) output[key] = Number(input[key] ?? 0);
  return output;
}
function reconstructNatural(result: AnalysisResult) {
  const current = complete(result.parsed.attributes);
  const auto = result.parsed.autoTrainingPlan;
  const used = Number(result.parsed.trainingPointsUsed ?? result.parsed.autoTrainingPoints ?? 0);
  if (!auto || used <= 0) return current;
  const natural = { ...current };
  for (const key of TRAINING_KEYS) {
    const level = Math.max(0, Number(auto[key] ?? 0));
    if (!level) continue;
    for (const [attribute, gain] of Object.entries(GAINS[key]) as Array<[AttributeKey, number]>) {
      if (natural[attribute] > 0) natural[attribute] = Math.max(1, natural[attribute] - level * Number(gain));
    }
  }
  return natural;
}

function baseTarget(position: PositionCode) {
  const targets: Record<PositionCode, number> = {
    GK: 74, CB: 80, CF: 82, SS: 85, AMF: 85,
    LWF: 86, RWF: 86, CMF: 88, DMF: 88,
    LMF: 89, RMF: 89, LB: 89, RB: 89
  };
  return targets[position];
}

function workloadAdjustment(result: AnalysisResult) {
  const style = normalize(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
  let adjust = 0;
  if (/meia versatil|meia versátil|box.to.box/.test(style)) adjust += 3;
  if (/destruidor|destroyer/.test(style)) adjust += 2;
  if (/lateral ofensivo|lateral atacante|lateral movel|lateral móvel|roaming flank|offensive full/.test(style)) adjust += 2;
  if (/lateral defensivo|defensive full/.test(style)) adjust += 1;
  if (/infiltracao|infiltração|hole player|atacante surpresa/.test(style)) adjust += 1;
  if (/ala produtivo|prolific winger/.test(style)) adjust += 1;

  const fluid = result.gameplayMetaV600R10?.formation.recommendation;
  if (fluid === 'FLUIDA_COMPLETA') adjust += 3;
  else if (fluid === 'FLUIDA_LEVE') adjust += 1;
  return adjust;
}

function workloadLabel(target: number): 'BAIXA' | 'MEDIA' | 'ALTA' | 'EXTREMA' {
  if (target >= 91) return 'EXTREMA';
  if (target >= 88) return 'ALTA';
  if (target >= 84) return 'MEDIA';
  return 'BAIXA';
}

function rolePriority(position: PositionCode, key: TrainingKey) {
  const table: Partial<Record<PositionCode, Partial<Record<TrainingKey, number>>>> = {
    GK: { gk2: 2.8, gk3: 2.6, gk1: 2.5, aerialStrength: .7, lowerBodyStrength: .35 },
    CB: { defending: 2.8, aerialStrength: 1.7, lowerBodyStrength: 1.5, dexterity: .8, passing: .6 },
    LB: { defending: 1.9, lowerBodyStrength: 1.7, dexterity: 1.35, passing: 1.2, dribbling: .7, aerialStrength: .4 },
    RB: { defending: 1.9, lowerBodyStrength: 1.7, dexterity: 1.35, passing: 1.2, dribbling: .7, aerialStrength: .4 },
    DMF: { defending: 2.5, lowerBodyStrength: 1.7, passing: 1.5, aerialStrength: .8, dexterity: .8, dribbling: .3 },
    CMF: { passing: 1.9, lowerBodyStrength: 1.6, defending: 1.25, dexterity: 1.0, dribbling: .9, shooting: .35, aerialStrength: .25 },
    LMF: { passing: 1.55, lowerBodyStrength: 1.65, dexterity: 1.4, dribbling: 1.2, defending: .8, shooting: .35 },
    RMF: { passing: 1.55, lowerBodyStrength: 1.65, dexterity: 1.4, dribbling: 1.2, defending: .8, shooting: .35 },
    AMF: { passing: 2.2, dribbling: 1.9, dexterity: 1.4, shooting: .8, lowerBodyStrength: .65 },
    SS: { dexterity: 2.1, dribbling: 1.8, shooting: 1.5, passing: 1.25, lowerBodyStrength: .95, aerialStrength: .25 },
    CF: { shooting: 2.4, dexterity: 2.0, lowerBodyStrength: 1.3, dribbling: .9, aerialStrength: .7, passing: .35 },
    LWF: { dribbling: 2.2, dexterity: 2.05, lowerBodyStrength: 1.55, shooting: 1.1, passing: .7 },
    RWF: { dribbling: 2.2, dexterity: 2.05, lowerBodyStrength: 1.55, shooting: 1.1, passing: .7 }
  };
  return Number(table[position]?.[key] ?? .1);
}

function stylePriority(result: AnalysisResult, key: TrainingKey) {
  const style = normalize(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
  let value = 0;
  const add = (pattern: RegExp, weights: Partial<Record<TrainingKey, number>>) => {
    if (pattern.test(style)) value += Number(weights[key] ?? 0);
  };
  add(/artilheiro|goal poacher/, { shooting: 1.8, dexterity: 1.3, lowerBodyStrength: .7 });
  add(/puxa marcacao|puxa marcação|deep lying forward/, { passing: 1.2, dribbling: 1.1, dexterity: .9, lowerBodyStrength: .7 });
  add(/armador criativo|creative playmaker/, { passing: 1.7, dribbling: 1.4, dexterity: .6 });
  add(/meia versatil|meia versátil|box.to.box/, { lowerBodyStrength: 1.5, passing: 1.0, defending: .9, dexterity: .7 });
  add(/destruidor|destroyer/, { defending: 1.9, lowerBodyStrength: 1.45, aerialStrength: .7 });
  add(/primeiro volante|anchor man/, { defending: 1.9, lowerBodyStrength: 1.25, passing: .8 });
  add(/lateral defensivo|defensive full/, { defending: 1.8, lowerBodyStrength: 1.35, passing: .55 });
  add(/lateral ofensivo|lateral atacante|lateral movel|lateral móvel|roaming flank|offensive full/, { lowerBodyStrength: 1.5, dexterity: 1.1, passing: 1.0, dribbling: .7 });
  add(/ala produtivo|prolific winger/, { dribbling: 1.5, dexterity: 1.35, lowerBodyStrength: 1.15, shooting: .55 });
  return value;
}

function candidateLevels(current: number, key: TrainingKey, minimumLowerBody: number) {
  const min = key === 'lowerBodyStrength'
    ? Math.max(minimumLowerBody, Math.max(0, current - 1))
    : Math.max(0, current - 4);
  const max = key === 'lowerBodyStrength'
    ? Math.min(16, Math.max(current + 6, minimumLowerBody))
    : Math.min(16, current + 4);
  const output: number[] = [];
  for (let level = min; level <= max; level += 1) output.push(level);
  return output;
}

function rebalanceExact(result: AnalysisResult, minimumLowerBody: number): TrainingPlan | null {
  const current = result.training;
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(current));
  const keys = result.bestPosition.code === 'GK' ? GK_KEYS : FIELD_KEYS;
  type Node = { score: number; plan: TrainingPlan };
  let dp: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
  dp[0] = { score: 0, plan: { ...current, ...Object.fromEntries(keys.map((key) => [key, 0])) } as TrainingPlan };

  for (const key of keys) {
    const next: Array<Node | null> = Array.from({ length: budget + 1 }, () => null);
    const currentLevel = Number(current[key] ?? 0);
    for (let spent = 0; spent <= budget; spent += 1) {
      const previous = dp[spent];
      if (!previous) continue;
      for (const level of candidateLevels(currentLevel, key, minimumLowerBody)) {
        const total = spent + trainingTotalCost(level);
        if (total > budget) continue;
        const deviation = Math.abs(level - currentLevel);
        const identityWeight = rolePriority(result.bestPosition.code, key) + stylePriority(result, key);
        const preserve = -deviation * (2.6 + identityWeight * .55);
        const staminaBonus = key === 'lowerBodyStrength' ? level * 1.25 : 0;
        const score = previous.score + preserve + staminaBonus;
        if (!next[total] || score > (next[total]?.score ?? -Infinity)) {
          next[total] = { score, plan: { ...previous.plan, [key]: level } };
        }
      }
    }
    dp = next;
  }
  return dp[budget]?.plan ?? null;
}

function projectedMinute(stamina: number, target: number) {
  if (stamina >= target) return 90;
  return Math.round(clamp(90 * (stamina / Math.max(1, target)), 45, 89));
}

export function applyMatchStaminaEngineV4080R44(result: AnalysisResult): AnalysisResult {
  const natural = reconstructNatural(result);
  const naturalStamina = Number(natural.stamina ?? 0);
  if (!Number.isFinite(naturalStamina) || naturalStamina <= 0) return result;

  const target = Math.round(clamp(baseTarget(result.bestPosition.code) + workloadAdjustment(result), 74, 92));
  const currentLowerBody = Number(result.training.lowerBodyStrength ?? 0);
  const currentProjected = naturalStamina + currentLowerBody;
  const requiredLowerBody = Math.max(currentLowerBody, Math.ceil(target - naturalStamina));

  let winner = result.training;
  if (currentProjected < target && requiredLowerBody <= 16) {
    for (let floor = requiredLowerBody; floor >= currentLowerBody + 1; floor -= 1) {
      const candidate = rebalanceExact(result, floor);
      if (candidate && trainingPlanTotalCost(candidate) === result.trainingPointsTotal) {
        winner = candidate;
        break;
      }
    }
  }

  const finalProjected = naturalStamina + Number(winner.lowerBodyStrength ?? 0);
  const enduranceScore = Math.round(clamp((finalProjected / target) * 100, 0, 100));
  const minute = projectedMinute(finalProjected, target);
  const risk: 'BAIXO' | 'MEDIO' | 'ALTO' = enduranceScore >= 100 ? 'BAIXO' : enduranceScore >= 90 ? 'MEDIO' : 'ALTO';
  const adjusted = trainingPlanTotalCost(winner) === result.trainingPointsTotal && Number(winner.lowerBodyStrength ?? 0) > currentLowerBody;
  const label = workloadLabel(target);

  return {
    ...result,
    training: winner,
    trainingPointsUsed: trainingPlanTotalCost(winner),
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - trainingPlanTotalCost(winner)),
    matchStaminaV4080R44: {
      engineVersion: MATCH_STAMINA_ENGINE_V4080_R44,
      workload: label,
      naturalStamina: Math.round(naturalStamina),
      projectedStamina: Math.round(finalProjected),
      targetStamina: target,
      enduranceScore,
      projectedMinute: minute,
      risk,
      adjusted,
      note: risk === 'BAIXO'
        ? 'Ficha protegida para sustentar intensidade de partida inteira.'
        : risk === 'MEDIO'
          ? 'A carta deve sustentar boa parte da partida, mas pode pedir gestão de sprint/pressão no fim.'
          : 'A carta tem risco físico alto; o app preservou o orçamento e o DNA, mas recomenda substituição/gestão de carga.'
    },
    recommendationExplanation: [
      `Resistência 90 min r44: carga ${label} • alvo ${target} • projetada ${Math.round(finalProjected)} • sustentação ${enduranceScore}/100.`,
      adjusted
        ? `Proteção anti-cansaço aplicada: Força das pernas ${currentLowerBody} → ${Number(winner.lowerBodyStrength ?? 0)} sem alterar o orçamento total.`
        : currentProjected >= target
          ? 'A ficha já tinha resistência suficiente; nenhum ponto foi movido apenas para aumentar stamina.'
          : 'Não foi possível aumentar mais a resistência sem quebrar orçamento/DNA; o risco físico foi mantido visível.',
      `Janela estimada de intensidade: até ~${minute} min antes de queda física relevante no perfil atual.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 64),
    strengths: [
      `Motor 90 min r44: resistência ${enduranceScore}/100 (${label.toLowerCase()}); alvo ${target}.`,
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32)
  } as AnalysisResult;
}
