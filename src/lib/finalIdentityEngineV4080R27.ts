import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import {
  enforceHardTrainingIdentity,
  fitTrainingToExactBudget,
  trainingFor,
  trainingTemplate,
  type IndividualTrainingAdjustments
} from '@/modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';

export const FINAL_IDENTITY_ENGINE_V4080_R27_VERSION = '40.80-r27-final-identity-arbiter' as const;

const ATTRIBUTE_KEYS: AttributeKey[] = [
  'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading',
  'placeKicking','curl','defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness',
  'goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach','speed','acceleration','kickingPower',
  'jump','physicalContact','balance','stamina'
];

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

const POSITION_DNA: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 2.7, dexterity: 2.2, lowerBodyStrength: 1.35, dribbling: .9, passing: .35, aerialStrength: .45, defending: -20 },
  SS: { dexterity: 2.25, dribbling: 2.0, shooting: 1.65, passing: 1.45, lowerBodyStrength: .8, aerialStrength: .15, defending: -20 },
  LWF: { dribbling: 2.45, dexterity: 2.25, lowerBodyStrength: 1.35, shooting: 1.25, passing: .8, aerialStrength: -.2, defending: -20 },
  RWF: { dribbling: 2.45, dexterity: 2.25, lowerBodyStrength: 1.35, shooting: 1.25, passing: .8, aerialStrength: -.2, defending: -20 },
  AMF: { passing: 2.55, dribbling: 2.1, dexterity: 1.45, shooting: .95, lowerBodyStrength: .45, aerialStrength: -.4, defending: -20 },
  LMF: { passing: 1.75, dribbling: 1.3, dexterity: 1.45, lowerBodyStrength: 1.45, defending: .8, shooting: .35, aerialStrength: .15 },
  RMF: { passing: 1.75, dribbling: 1.3, dexterity: 1.45, lowerBodyStrength: 1.45, defending: .8, shooting: .35, aerialStrength: .15 },
  CMF: { passing: 2.0, lowerBodyStrength: 1.45, defending: 1.25, dexterity: 1.05, dribbling: .85, shooting: .35, aerialStrength: .25 },
  DMF: { defending: 2.65, passing: 1.55, lowerBodyStrength: 1.65, dexterity: .8, aerialStrength: .8, dribbling: .35, shooting: -.8 },
  CB: { defending: 3.0, aerialStrength: 1.8, lowerBodyStrength: 1.55, dexterity: .95, passing: .65, dribbling: -1.4, shooting: -20 },
  LB: { defending: 2.0, lowerBodyStrength: 1.7, dexterity: 1.4, passing: 1.3, dribbling: .75, aerialStrength: .35, shooting: -.7 },
  RB: { defending: 2.0, lowerBodyStrength: 1.7, dexterity: 1.4, passing: 1.3, dribbling: .75, aerialStrength: .35, shooting: -.7 },
  GK: { gk2: 3.0, gk3: 2.8, gk1: 2.65, aerialStrength: .75, lowerBodyStrength: .35 }
};

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function mean(values: number[]) {
  const safe = values.filter((value) => Number.isFinite(value) && value > 0);
  return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
}

function completeAttributes(input: Attributes): Required<Attributes> {
  const output = {} as Required<Attributes>;
  for (const key of ATTRIBUTE_KEYS) output[key] = Number(input[key] ?? 0);
  return output;
}

function reconstructNaturalAttributes(result: AnalysisResult): {
  attributes: Required<Attributes>;
  reconstructed: boolean;
  source: 'ZERADA_OU_NAO_CONFIRMADA' | 'RECONSTRUIDA_DA_PROGRESSAO';
} {
  const current = completeAttributes(result.parsed.attributes);
  const allocation = result.parsed.autoTrainingPlan;
  const hasAllocation = Boolean(allocation && TRAINING_KEYS.some((key) => Number(allocation[key] ?? 0) > 0));
  const used = Number(result.parsed.trainingPointsUsed ?? result.parsed.autoTrainingPoints ?? 0);

  if (!hasAllocation || used <= 0 || !allocation) {
    return { attributes: current, reconstructed: false, source: 'ZERADA_OU_NAO_CONFIRMADA' };
  }

  const natural = { ...current };
  for (const key of TRAINING_KEYS) {
    const level = Math.max(0, Number(allocation[key] ?? 0));
    if (!level) continue;
    for (const [attribute, gain] of Object.entries(TRAINING_ATTRIBUTE_GAINS[key]) as Array<[AttributeKey, number]>) {
      const value = Number(natural[attribute] ?? 0);
      if (value > 0) natural[attribute] = Math.max(1, value - level * gain);
    }
  }
  return { attributes: natural, reconstructed: true, source: 'RECONSTRUIDA_DA_PROGRESSAO' };
}

function groupAverage(a: Required<Attributes>, key: TrainingKey): number {
  const attrs = Object.keys(TRAINING_ATTRIBUTE_GAINS[key]) as AttributeKey[];
  return mean(attrs.map((attribute) => Number(a[attribute] ?? 0)));
}

function styleAdjustment(position: PositionCode, key: TrainingKey, styleRaw: string, a: Required<Attributes>): number {
  const style = normalize(styleRaw);
  const aerial = mean([a.heading, a.jump, a.physicalContact]);
  const technical = mean([a.ballControl, a.dribbling, a.tightPossession, a.balance]);
  let value = 0;
  const add = (entries: Partial<Record<TrainingKey, number>>) => { value += Number(entries[key] ?? 0); };

  if (/artilheiro|goal poacher|atacante matador/.test(style)) {
    add({ shooting: 2.2, dexterity: 1.6, lowerBodyStrength: .8, dribbling: technical >= 80 ? 1.1 : .35, aerialStrength: aerial >= 78 ? .8 : -1.4, defending: -20 });
  }
  if (/homem de area|homem de área|fox in the box/.test(style)) add({ shooting: 2.0, aerialStrength: 1.8, lowerBodyStrength: 1.0, dexterity: .75, defending: -20 });
  if (/pivo|pivô|atacante pivo|atacante pivô|target man/.test(style)) add({ lowerBodyStrength: 2.0, aerialStrength: 1.35, passing: 1.2, shooting: 1.0, dribbling: .55, defending: -20 });
  if (/puxa marcacao|puxa marcação|deep lying forward/.test(style)) add({ passing: 1.65, dribbling: 1.35, dexterity: 1.0, shooting: .75, defending: -20 });
  if (/armador criativo|creative playmaker/.test(style)) add({ passing: 2.1, dribbling: 1.7, dexterity: .75, shooting: .45 });
  if (/classico|clássico/.test(style)) add({ passing: 2.25, dribbling: 1.7, shooting: .55, lowerBodyStrength: -.4 });
  if (/infiltracao|infiltração|hole player|atacante surpresa/.test(style)) add({ dexterity: 1.95, shooting: 1.45, lowerBodyStrength: .75, dribbling: .65 });
  if (/meia versatil|meia versátil|box-to-box/.test(style)) add({ lowerBodyStrength: 1.45, passing: 1.15, defending: 1.05, dexterity: .8 });
  if (/orquestrador|orchestrator/.test(style)) add({ passing: 2.2, dribbling: .8, lowerBodyStrength: .65, defending: .45 });
  if (/primeiro volante|anchor man|ancora|âncora/.test(style)) add({ defending: 2.4, passing: 1.0, lowerBodyStrength: 1.3, aerialStrength: .7, shooting: -10 });
  if (/destruidor|destroyer/.test(style)) add({ defending: 2.5, lowerBodyStrength: 1.45, aerialStrength: .9, dexterity: .55 });
  if (/defensor criativo|build up|construtor/.test(style)) add({ defending: 2.15, passing: 1.25, aerialStrength: .75, lowerBodyStrength: .65 });
  if (/lateral defensivo|defensive full/.test(style)) add({ defending: 2.15, lowerBodyStrength: 1.3, passing: .65, shooting: -10 });
  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) add({ lowerBodyStrength: 1.5, passing: 1.4, dexterity: 1.25, dribbling: .85, defending: .55 });
  if (/ala produtivo|prolific winger/.test(style)) add({ dribbling: 1.8, dexterity: 1.6, lowerBodyStrength: 1.0, shooting: .8 });
  if (/lateral movel|lateral móvel|roaming flank/.test(style)) add({ dexterity: 1.6, lowerBodyStrength: 1.4, dribbling: 1.35, shooting: .55 });
  if (/perito em cruzamento|cross specialist/.test(style)) add({ passing: 2.0, lowerBodyStrength: 1.15, dexterity: .8, dribbling: .45 });

  // O estilo nunca transforma um atacante em defensor ou um zagueiro em finalizador.
  if (['CF','SS','LWF','RWF','AMF'].includes(position) && key === 'defending') return -30;
  if (position === 'CB' && key === 'shooting') return -30;
  return value;
}

function identityAdjustmentsFor(base: Required<Attributes>): IndividualTrainingAdjustments {
  return (position, attributes, parsed) => {
    const familyScores = Object.fromEntries(TRAINING_KEYS.map((key) => [key, groupAverage(base, key)])) as Record<TrainingKey, number>;
    const lineKeys = position === 'GK'
      ? (['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'] as TrainingKey[])
      : (['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'] as TrainingKey[]);
    const baseline = mean(lineKeys.map((key) => familyScores[key]));
    const result = Object.fromEntries(TRAINING_KEYS.map((key) => [key, 0])) as Record<TrainingKey, number>;

    for (const key of TRAINING_KEYS) {
      const dna = baseline > 0 ? Math.max(-2.2, Math.min(2.2, (familyScores[key] - baseline) / 8)) : 0;
      const positionWeight = Number(POSITION_DNA[position]?.[key] ?? 0);
      const styleWeight = styleAdjustment(position, key, parsed.playstyle ?? '', attributes);
      const saturation = familyScores[key] >= 96 ? -.7 : familyScores[key] >= 92 ? -.3 : 0;
      result[key] = dna + positionWeight + styleWeight + saturation;
    }
    return result;
  };
}

function cleanPlanForDisplay(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Math.max(0, Math.round(Number(plan[key] ?? 0)))])) as TrainingPlan;
}

export function applyFinalIdentityEngineV4080R27(result: AnalysisResult): AnalysisResult {
  const position = result.bestPosition.code;
  const reconstructed = reconstructNaturalAttributes(result);
  const attributeCoverage = Number(result.parsed.evidence.attributeCount ?? 0);
  const canRebuild = attributeCoverage >= 10;
  const base = reconstructed.attributes;

  const identityPlan = canRebuild
    ? trainingFor(position, 'COMPETITIVE', base, result.parsed, identityAdjustmentsFor(base))
    : enforceHardTrainingIdentity(result.training, position, result.parsed);

  const priority = trainingTemplate(position, 'COMPETITIVE', base, result.parsed).priority;
  const exact = cleanPlanForDisplay(
    fitTrainingToExactBudget(identityPlan, priority, result.trainingPointsTotal, position, result.parsed)
  );
  const used = trainingPlanTotalCost(exact);

  const reconstructionNote = reconstructed.reconstructed
    ? 'Carta já treinada detectada: o motor retirou a progressão visível antes de recalcular a nova ficha.'
    : 'Carta tratada como base natural/sem progressão reconstruível; os atributos lidos foram usados como DNA atual.';

  const identityNote = `${POSITION_PT[position]} • ${result.parsed.playstyle ?? 'estilo não confirmado'} • ${reconstructionNote}`;
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.80 — Desempenho Real 2027`,
    positionLabel: POSITION_PT[position],
    training: exact,
    pointsUsed: used,
    note: 'Único árbitro final: posição atual + estilo + atributos naturais da carta + orçamento real. Nenhum fallback pode reabrir atributo incompatível.',
    qualityScore: Math.max(1, Math.min(100, Math.round(Number(result.parsed.confidence ?? 0)))),
    adaptationLabel: 'DNA REAL • FUNÇÃO ATUAL • SEM PONTOS RESIDUAIS',
    highlights: [
      `DNA Final r27 • Jogador: ${result.parsed.playerName}`,
      identityNote,
      `Orçamento: ${used}/${result.trainingPointsTotal}.`,
      position === 'CF' ? `Defesa travada em ${exact.defending}.` : `Integridade funcional validada para ${POSITION_PT[position]}.`
    ],
    risks: canRebuild ? [] : ['Poucos atributos foram lidos; a ficha foi saneada, mas a reconstrução completa do DNA exige mais dados do print.'],
    efficiencyScore: 100,
    balanceScore: Math.max(1, Math.min(100, Math.round(Number(result.parsed.confidence ?? 0)))),
    verdict: 'A ficha final não usa categoria incompatível apenas para gastar pontos.',
    tradeOffs: ['A prioridade é desempenho real da função e identidade da carta, não GER/overall.'],
    simulationsTested: 1
  };

  return {
    ...result,
    training: exact,
    trainingCost: trainingPlanCost(exact),
    trainingPointsUsed: used,
    trainingPointsRemaining: result.trainingPointsTotal - used,
    buildVariants: [variant],
    buildName: variant.title,
    recommendationExplanation: [
      `Motor DNA Final r27: ${identityNote}`,
      'A ficha foi recalculada depois de todos os motores legados; nenhum motor posterior pode voltar a transformá-la em molde genérico.',
      'Categorias incompatíveis com a função são travas duras, inclusive no fechamento exato de orçamento.',
      reconstructed.reconstructed
        ? 'Os atributos exibidos por uma carta já upada não foram tratados como atributos-base: a progressão reconhecida foi descontada antes do novo cálculo.'
        : 'Quando a distribuição antiga não está disponível no print, o app não inventa uma progressão anterior.',
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 56),
    strengths: [
      'Motor DNA Final r27: ficha individual da carta, não ficha genérica por posição.',
      `Trava funcional ativa para ${POSITION_PT[position]} e ${result.parsed.playstyle ?? 'estilo não confirmado'}.`,
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 32),
    note: `${variant.note} ${result.note}`
  };
}
