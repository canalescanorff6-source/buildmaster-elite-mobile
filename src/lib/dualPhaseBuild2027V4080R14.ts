import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';
import { getAttributeMetaTrainingBias } from './attributeMeta2027V600';

export const DUAL_PHASE_BUILD_2027_R14_VERSION = '40.80-r14-dual-phase-build-2027' as const;

type PhaseWeights = Partial<Record<TrainingKey, number>>;

const ATTACK_WEIGHTS: Record<PositionCode, PhaseWeights> = {
  GK: { passing: 1.0, gk1: .75, gk2: .72, gk3: .82, lowerBodyStrength: .28 },
  CB: { passing: 1.12, lowerBodyStrength: .75, dexterity: .58, defending: .42, aerialStrength: .38 },
  LB: { passing: 1.02, dribbling: .58, dexterity: .92, lowerBodyStrength: .94, defending: .5 },
  RB: { passing: 1.02, dribbling: .58, dexterity: .92, lowerBodyStrength: .94, defending: .5 },
  DMF: { passing: 1.24, defending: .78, dexterity: .72, lowerBodyStrength: .76, dribbling: .3 },
  CMF: { passing: 1.38, dribbling: .76, dexterity: .94, lowerBodyStrength: .72, defending: .38 },
  LMF: { passing: 1.08, dribbling: .92, dexterity: 1.04, lowerBodyStrength: .88, shooting: .42 },
  RMF: { passing: 1.08, dribbling: .92, dexterity: 1.04, lowerBodyStrength: .88, shooting: .42 },
  AMF: { passing: 1.38, dribbling: 1.08, dexterity: 1.12, shooting: .72, lowerBodyStrength: .38 },
  SS: { passing: 1.12, dribbling: 1.02, dexterity: 1.24, shooting: 1.02, lowerBodyStrength: .62 },
  CF: { shooting: 1.42, dexterity: 1.2, lowerBodyStrength: .84, dribbling: .58, passing: .5, aerialStrength: .48 },
  LWF: { dribbling: 1.16, dexterity: 1.18, shooting: .84, passing: .78, lowerBodyStrength: .78 },
  RWF: { dribbling: 1.16, dexterity: 1.18, shooting: .84, passing: .78, lowerBodyStrength: .78 }
};

const DEFENCE_WEIGHTS: Record<PositionCode, PhaseWeights> = {
  GK: { gk1: 1.34, gk2: 1.62, gk3: 1.54, aerialStrength: .34, lowerBodyStrength: .22 },
  CB: { defending: 1.82, lowerBodyStrength: 1.02, dexterity: .82, aerialStrength: .86, passing: .34 },
  LB: { defending: 1.58, lowerBodyStrength: 1.04, dexterity: .98, passing: .48, dribbling: .2 },
  RB: { defending: 1.58, lowerBodyStrength: 1.04, dexterity: .98, passing: .48, dribbling: .2 },
  DMF: { defending: 1.76, lowerBodyStrength: .98, dexterity: .8, passing: .68, aerialStrength: .42 },
  CMF: { defending: 1.14, lowerBodyStrength: .96, dexterity: .96, passing: .62, dribbling: .28 },
  LMF: { defending: .86, lowerBodyStrength: 1.02, dexterity: 1.02, passing: .56, dribbling: .32 },
  RMF: { defending: .86, lowerBodyStrength: 1.02, dexterity: 1.02, passing: .56, dribbling: .32 },
  AMF: { defending: .58, lowerBodyStrength: .92, dexterity: 1.06, passing: .72, dribbling: .42 },
  SS: { defending: .52, lowerBodyStrength: .98, dexterity: 1.12, passing: .72, dribbling: .38 },
  CF: { defending: .34, lowerBodyStrength: 1.04, dexterity: 1.08, passing: .56, aerialStrength: .44 },
  LWF: { defending: .62, lowerBodyStrength: 1.02, dexterity: 1.1, passing: .58, dribbling: .36 },
  RWF: { defending: .62, lowerBodyStrength: 1.02, dexterity: 1.1, passing: .58, dribbling: .36 }
};

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function mergedWeights(base: PhaseWeights, extra: PhaseWeights): Record<TrainingKey, number> {
  const output = Object.fromEntries(TRAINING_KEYS.map((key) => [key, .03])) as Record<TrainingKey, number>;
  for (const key of TRAINING_KEYS) output[key] += Number(base[key] ?? 0) + Number(extra[key] ?? 0);
  return output;
}

function attackContextWeights(result: AnalysisResult): PhaseWeights {
  const extra: PhaseWeights = {};
  const style = result.tacticalProfile.style;
  if (result.bestPosition.code !== 'GK') Object.assign(extra, { passing: .10, dribbling: .08, dexterity: .06 });
  if (style === 'POSSE_DE_BOLA') Object.assign(extra, { passing: .24, dribbling: .18, dexterity: .12 });
  if (style === 'CONTRA_ATAQUE_RAPIDO') Object.assign(extra, { dexterity: .24, lowerBodyStrength: .2, passing: .1 });
  if (style === 'CONTRA_ATAQUE') Object.assign(extra, { passing: .14, lowerBodyStrength: .16, dexterity: .12 });
  if (style === 'POR_FORA') Object.assign(extra, { passing: .16, dribbling: .14, lowerBodyStrength: .12 });

  if (result.bestPosition.code === 'CF') {
    const attrs = result.parsed.attributes;
    const aerial = (Number(attrs.heading ?? 0) + Number(attrs.jump ?? 0) + Number(attrs.physicalContact ?? 0)) / 3;
    if (aerial >= 82 || Number(result.parsed.height ?? 0) >= 185) extra.aerialStrength = Number(extra.aerialStrength ?? 0) + .28;
  }
  return extra;
}

function defenceContextWeights(result: AnalysisResult): PhaseWeights {
  const extra: PhaseWeights = {};
  const responsibility = result.metaVivo2027V4080R8?.phaseRole.responsibility;
  if (responsibility === 'ANCORA' || responsibility === 'PROTETOR_AREA') {
    Object.assign(extra, { defending: .34, lowerBodyStrength: .16, aerialStrength: .12 });
  } else if (responsibility === 'PRESSOR_PRIMARIO' || responsibility === 'RASTREADOR') {
    Object.assign(extra, { dexterity: .28, lowerBodyStrength: .24, defending: .16 });
  } else if (responsibility === 'FECHADOR_LINHA' || responsibility === 'COBERTURA') {
    Object.assign(extra, { defending: .28, dexterity: .14, passing: .08 });
  }

  if (result.parsed.defensivePlaystyleConfirmed && /press[aã]o no ataque/i.test(result.parsed.defensivePlaystyle ?? '')) {
    extra.defending = Number(extra.defending ?? 0) + .2;
    extra.dexterity = Number(extra.dexterity ?? 0) + .18;
    extra.lowerBodyStrength = Number(extra.lowerBodyStrength ?? 0) + .18;
  }
  return extra;
}

function trainingUtility(plan: TrainingPlan, weights: Record<TrainingKey, number>) {
  let numerator = 0;
  let denominator = 0;
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    const weight = Number(weights[key] ?? 0);
    const useful = level <= 8 ? level * 10.5 : 84 + Math.min(20, level - 8) * 3.1;
    const saturation = Math.max(0, level - 12) * (weight < .55 ? 3.5 : 1.2);
    numerator += Math.max(0, useful - saturation) * weight;
    denominator += 100 * weight;
  }
  return clamp(denominator ? numerator / denominator * 100 : 0);
}

function stabilityScore(seed: TrainingPlan, candidate: TrainingPlan) {
  const movement = TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(seed[key] ?? 0) - Number(candidate[key] ?? 0)), 0);
  return clamp(100 - movement * 7.5);
}

function candidateScore(seed: TrainingPlan, candidate: TrainingPlan, weights: Record<TrainingKey, number>) {
  return clamp(trainingUtility(candidate, weights) * .96 + stabilityScore(seed, candidate) * .04);
}

function sameBudgetCandidates(seed: TrainingPlan, budget: number): TrainingPlan[] {
  const found = new Map<string, TrainingPlan>();
  const add = (plan: TrainingPlan) => {
    if (trainingPlanTotalCost(plan) !== budget) return;
    found.set(signature(plan), clone(plan));
  };
  add(seed);

  for (const from of TRAINING_KEYS) {
    for (let removeCount = 1; removeCount <= 2; removeCount += 1) {
      if (Number(seed[from] ?? 0) < removeCount) continue;
      const reduced = clone(seed);
      reduced[from] -= removeCount;
      for (const to of TRAINING_KEYS) {
        if (to === from) continue;
        for (let addCount = 1; addCount <= 3; addCount += 1) {
          if (Number(reduced[to] ?? 0) + addCount > 16) break;
          const candidate = clone(reduced);
          candidate[to] += addCount;
          const cost = trainingPlanTotalCost(candidate);
          if (cost === budget) add(candidate);
          if (cost > budget) break;
        }
      }
    }
  }
  return [...found.values()].slice(0, 180);
}

function bestForPhase(seed: TrainingPlan, candidates: TrainingPlan[], weights: Record<TrainingKey, number>) {
  return candidates
    .map((training) => ({ training, score: candidateScore(seed, training, weights) }))
    .sort((a, b) => b.score - a.score || signature(a.training).localeCompare(signature(b.training)))[0] ?? { training: seed, score: candidateScore(seed, seed, weights) };
}

function skillNamesForPhase(result: AnalysisResult, phase: 'attack' | 'defence') {
  const portfolio = result.metaVivo2027V4080R8?.skillPortfolio ?? [];
  const filtered = portfolio.filter((item) => phase === 'attack'
    ? item.role === 'IDENTIDADE' || item.role === 'ATAQUE' || item.role === 'DIFERENCIAL'
    : item.role === 'TRANSICAO_DEFESA' || item.role === 'ROBUSTEZ' || item.role === 'IDENTIDADE');
  const names = filtered.map((item) => item.name);
  for (const skill of result.recommendedSkills) if (!names.includes(skill)) names.push(skill);
  return names.slice(0, 3);
}

function contextualPhaseScore(result: AnalysisResult, raw: number, phase: 'attack' | 'defence') {
  const meta = result.metaVivo2027V4080R8?.scores;
  if (!meta) return raw;
  const context = phase === 'attack'
    ? meta.firstTouch * .34 + meta.commandResponse * .28 + meta.transition * .24 + meta.phaseBalance * .14
    : meta.manualDefence * .42 + meta.coverageDiscipline * .36 + meta.transition * .12 + meta.phaseBalance * .1;
  return clamp(raw * .62 + context * .38);
}

export function applyDualPhaseBuild2027V4080R14(result: AnalysisResult): AnalysisResult {
  if (result.objective !== 'COMPETITIVE') return result;

  const seed = clone(result.training);
  const budget = trainingPlanTotalCost(seed);
  const candidates = sameBudgetCandidates(seed, budget);
  const attributeBias = getAttributeMetaTrainingBias(result);
  const withAttributeBias = (context: PhaseWeights): PhaseWeights => {
    const merged: PhaseWeights = { ...context };
    for (const key of TRAINING_KEYS) merged[key] = Number(merged[key] ?? 0) + Number(attributeBias[key] ?? 0) * .72;
    return merged;
  };
  const attackWeights = mergedWeights(ATTACK_WEIGHTS[result.bestPosition.code], withAttributeBias(attackContextWeights(result)));
  const defenceWeights = mergedWeights(DEFENCE_WEIGHTS[result.bestPosition.code], withAttributeBias(defenceContextWeights(result)));
  const attack = bestForPhase(seed, candidates, attackWeights);
  const defence = bestForPhase(seed, candidates, defenceWeights);
  const attackScore = contextualPhaseScore(result, attack.score, 'attack');
  const defenceScore = contextualPhaseScore(result, defence.score, 'defence');
  const hybridScore = clamp(result.metaVivo2027V4080R8?.scores.finalFunctional ?? (attackScore + defenceScore) / 2);
  const attackRole = result.metaVivo2027V4080R8?.phaseRole.attack ?? result.teamMap.attackingJob;
  const defenceRole = result.metaVivo2027V4080R8?.phaseRole.defence ?? result.teamMap.defensiveJob;
  const responsibility = result.metaVivo2027V4080R8?.phaseRole.responsibility?.replaceAll('_', ' ') ?? 'COBERTURA DA FUNÇÃO';
  const attackSkills = skillNamesForPhase(result, 'attack');
  const defenceSkills = skillNamesForPhase(result, 'defence');

  const variants = [
    {
      kind: 'competitive' as const,
      title: `Ficha FINAL DUPLA FASE — ${result.parsed.playerName}`,
      positionLabel: result.bestPosition.label,
      training: seed,
      pointsUsed: budget,
      qualityScore: hybridScore,
      adaptationLabel: 'RECOMENDADA • ATAQUE + DEFESA • FORMAÇÃO FLUÍDA v6.0',
      highlights: [
        `Atacando: ${attackRole}.`,
        `Defendendo: ${defenceRole}.`,
        `Top 5 permanece único para a carta: ${result.recommendedSkills.slice(0, 5).join(', ')}.`
      ],
      risks: ['A progressão da carta não muda automaticamente quando a formação troca de ataque para defesa; por isso esta é a ficha principal recomendada.'],
      verdict: 'Use esta ficha no jogador quando ele participa das duas táticas da Formação Fluída.',
      note: `Equilibra as duas fases sem perseguir GER. Ataque especializado ${Math.round(attackScore)}/100; defesa especializada ${Math.round(defenceScore)}/100; equilíbrio final ${Math.round(hybridScore)}/100.`
    },
    {
      kind: 'alternative' as const,
      title: `Ficha ATAQUE — ${result.parsed.playerName}`,
      positionLabel: result.bestPosition.label,
      training: attack.training,
      pointsUsed: trainingPlanTotalCost(attack.training),
      qualityScore: attackScore,
      adaptationLabel: 'FASE OFENSIVA • COM BOLA • ESPECIALIZADA',
      highlights: [
        `Papel ofensivo: ${attackRole}.`,
        `Prioridades de habilidade: ${attackSkills.join(', ') || 'DNA ofensivo da carta'}.`,
        `Mesmo orçamento de ${budget} pontos da ficha final.`
      ],
      risks: ['É uma referência ofensiva especializada; pode perder equilíbrio quando a equipe entra na tática defensiva.'],
      verdict: 'Use para comparação e A/B quando o jogador tem responsabilidade defensiva pequena.',
      note: 'Otimiza a distribuição para construção, primeiro toque, criação, ruptura ou finalização conforme a posição e o DNA da carta.'
    },
    {
      kind: 'safe' as const,
      title: `Ficha DEFESA — ${result.parsed.playerName}`,
      positionLabel: result.bestPosition.label,
      training: defence.training,
      pointsUsed: trainingPlanTotalCost(defence.training),
      qualityScore: defenceScore,
      adaptationLabel: 'FASE DEFENSIVA • SEM BOLA • MARCAÇÃO MANUAL',
      highlights: [
        `Papel defensivo: ${defenceRole}.`,
        `Responsabilidade: ${responsibility}.`,
        `Prioridades de habilidade: ${defenceSkills.join(', ') || 'cobertura e reação defensiva'}.`
      ],
      risks: ['É uma referência defensiva especializada; pode sacrificar parte do teto ofensivo da carta.'],
      verdict: 'Use para comparação e A/B quando a nova tática defensiva exige muita recomposição, pressão ou cobertura.',
      note: 'Otimiza marcação manual, recomposição, cobertura e reação sem transformar atacantes em defensores artificiais.'
    }
  ];

  const summary = `Dupla Fase 2027: ${result.parsed.playerName} agora recebe Ficha ATAQUE, Ficha DEFESA e Ficha FINAL DUPLA FASE. A final continua sendo a recomendada porque a mesma progressão e o mesmo Top 5 permanecem ativos nas duas táticas durante a partida.`;

  return {
    ...result,
    buildName: `Ficha Automática v40.80 r14 — Meta Vivo 2027 • Ficha FINAL DUPLA FASE — ${result.parsed.playerName}`,
    buildVariants: variants,
    recommendationExplanation: [
      summary,
      `Ataque: ${attackRole}.`,
      `Defesa: ${defenceRole}; responsabilidade ${responsibility.toLowerCase()}.`,
      `As três fichas respeitam exatamente o mesmo orçamento de ${budget} pontos; a especializada de ataque e a de defesa servem para comparação A/B, enquanto a Dupla Fase é a escolha de uso real.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 44),
    strengths: [
      'A ficha agora é mostrada explicitamente em ATAQUE, DEFESA e FINAL DUPLA FASE para a Formação Fluída do eFootball 2027.',
      'A Ficha Final mantém um único Top 5 e um único Ímpeto, porque a carta não troca habilidades ou progressão quando a tática muda durante a partida.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 30),
    note: `${summary} ${result.note}`
  };
}
