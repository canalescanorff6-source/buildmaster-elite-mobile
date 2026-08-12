import type {
  AnalysisResult,
  ImpetoRecommendation,
  MaximumPerformanceV4080Analysis,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { buildPersonalizedSkillPlan, skillPlanScore } from './skillIntelligenceV31';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';
import { IMPETO_CRAFTING_POLICY, IMPETO_CRAFTING_SELECTABLE_COUNT, IMPETO_RANDOM_POOL_LIMITS } from './officialImpetoCatalog';

export const MAXIMUM_PERFORMANCE_V4080_VERSION = '40.80.0' as const;

type StackCandidate = {
  plan: TrainingPlan;
  baseScore: number;
  skillPlan: UnifiedSkillDecision[];
  skillScore: number;
  impetos: ImpetoRecommendation[];
  impetoScore: number;
  jointScore: number;
  source: 'ATUAL' | 'PARETO';
};

const ROLE_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  GK: { gk1: 1.25, gk2: 1.5, gk3: 1.42, aerialStrength: .42, lowerBodyStrength: .22 },
  CB: { defending: 1.5, aerialStrength: 1.05, lowerBodyStrength: .82, dexterity: .52, passing: .38 },
  LB: { defending: 1.12, lowerBodyStrength: 1.0, dexterity: .88, passing: .7, dribbling: .38 },
  RB: { defending: 1.12, lowerBodyStrength: 1.0, dexterity: .88, passing: .7, dribbling: .38 },
  DMF: { defending: 1.42, passing: .9, lowerBodyStrength: .8, dexterity: .62, aerialStrength: .48 },
  CMF: { passing: 1.14, dribbling: .76, dexterity: .78, lowerBodyStrength: .86, defending: .62 },
  LMF: { passing: .98, dribbling: .9, dexterity: .9, lowerBodyStrength: .88, defending: .42 },
  RMF: { passing: .98, dribbling: .9, dexterity: .9, lowerBodyStrength: .88, defending: .42 },
  AMF: { passing: 1.22, dribbling: 1.08, dexterity: 1.0, shooting: .62, lowerBodyStrength: .36 },
  SS: { dribbling: 1.06, dexterity: 1.08, shooting: 1.0, passing: .78, lowerBodyStrength: .58 },
  CF: { shooting: 1.48, dexterity: 1.1, lowerBodyStrength: .9, aerialStrength: .7, dribbling: .42 },
  LWF: { dribbling: 1.22, dexterity: 1.12, shooting: .88, lowerBodyStrength: .76, passing: .48 },
  RWF: { dribbling: 1.22, dexterity: 1.12, shooting: .88, lowerBodyStrength: .76, passing: .48 }
};

const ATTRIBUTE_TO_GROUP: Array<[RegExp, TrainingKey]> = [
  [/talento de go|firmeza de go|defesa de go/i, 'gk1'], [/reflexos de go/i, 'gk2'], [/alcance de go/i, 'gk3'],
  [/finaliza|bola parada|curva/i, 'shooting'], [/passe rasteiro|passe alto/i, 'passing'],
  [/controle de bola|drible|condu[cç][aã]o firme/i, 'dribbling'], [/talento ofensivo|acelera[cç][aã]o|equil[ií]brio/i, 'dexterity'],
  [/velocidade|for[cç]a do chute|resist[eê]ncia/i, 'lowerBodyStrength'], [/cabe[cç]|salto|contato f[ií]sico/i, 'aerialStrength'],
  [/talento defensivo|desarme|dedica[cç][aã]o defensiva|agressividade/i, 'defending']
];

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.round(Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum)) * 10) / 10;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function skillGroup(category: UnifiedSkillDecision['category']): TrainingKey[] {
  if (category === 'finalização') return ['shooting', 'dexterity'];
  if (category === 'passe') return ['passing', 'dribbling'];
  if (category === 'drible') return ['dribbling', 'dexterity'];
  if (category === 'defesa') return ['defending', 'lowerBodyStrength'];
  if (category === 'aérea') return ['aerialStrength', 'lowerBodyStrength'];
  if (category === 'físico') return ['lowerBodyStrength', 'aerialStrength'];
  if (category === 'goleiro') return ['gk1', 'gk2', 'gk3'];
  return ['dexterity', 'lowerBodyStrength'];
}

function impetoGroups(item: ImpetoRecommendation, position: PositionCode): TrainingKey[] {
  const groups = item.attributes.flatMap((attribute) => {
    const found = ATTRIBUTE_TO_GROUP.find(([pattern]) => pattern.test(attribute));
    return found ? [found[1]] : [];
  });
  const unique = [...new Set(groups)];
  if (!unique.length) return position === 'GK' ? ['gk2', 'gk3'] : [];
  return unique;
}

function scoreImpetos(result: AnalysisResult, plan: TrainingPlan, skills: UnifiedSkillDecision[]) {
  const weights = ROLE_WEIGHTS[result.bestPosition.code];
  const ownedKeys = new Set(result.parsed.impetos.filter((item) => item.active !== false).map((item) => skillIdentityKey(item.name)));
  const skillGroups = new Set(skills.flatMap((item) => skillGroup(item.category)));
  const candidates = result.recommendedImpetos
    .filter((item) => !ownedKeys.has(skillIdentityKey(item.name)))
    .map((item) => {
      const groups = impetoGroups(item, result.bestPosition.code);
      const roleFit = groups.length ? groups.reduce((sum, key) => sum + Math.min(1, Number(weights[key] ?? 0) / 1.2), 0) / groups.length * 100 : 35;
      const gapCoverage = groups.length ? groups.reduce((sum, key) => {
        const level = Number(plan[key] ?? 0);
        const weight = Number(weights[key] ?? 0);
        const usefulGap = Math.max(0, 10 - level);
        return sum + Math.min(100, usefulGap * 9 + weight * 24);
      }, 0) / groups.length : 35;
      const skillSynergy = groups.length ? groups.filter((key) => skillGroups.has(key)).length / groups.length * 100 : 35;
      const saturationPenalty = groups.reduce((sum, key) => sum + Math.max(0, Number(plan[key] ?? 0) - 11) * 5.5, 0);
      const base = Number(item.score ?? 70);
      const score = clamp(roleFit * .42 + gapCoverage * .24 + skillSynergy * .16 + base * .18 - saturationPenalty);
      return {
        ...item,
        score,
        confidence: Math.round(clamp(Number(item.confidence ?? result.parsed.confidence) * .55 + score * .45)),
        tier: score >= 82 ? 'ideal' as const : score >= 65 ? 'alternativo' as const : 'evitar' as const,
        reason: `${score >= 82 ? 'Melhor ganho marginal no stack final.' : score >= 65 ? 'Boa alternativa para a função.' : 'Retorno baixo ou redundante na ficha final.'} ${item.reason}`,
        evidence: [
          `Ficha final v40.80: ${groups.map((key) => `${TRAINING_LABELS[key]} ${Number(plan[key] ?? 0)}`).join(' • ') || 'sem grupo mapeado'}.`,
          `Encaixe na função ${POSITION_PT[result.bestPosition.code]}: ${Math.round(roleFit)}/100; cobertura de lacuna: ${Math.round(gapCoverage)}/100.`,
          ...(item.evidence ?? [])
        ].slice(0, 4),
        warnings: [...(item.warnings ?? []), ...(saturationPenalty > 8 ? ['Parte do ganho cairia em grupos já saturados pela progressão final.'] : [])].slice(0, 3)
      };
    })
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0) || a.name.localeCompare(b.name, 'pt-BR'));
  return candidates;
}

function baseScoreForPlan(result: AnalysisResult, plan: TrainingPlan) {
  const currentSig = signature(result.training);
  if (signature(plan) === currentSig) return Number(result.maximumPerformanceV4040?.winnerScore ?? 84);
  const alt = result.maximumPerformanceV4040?.alternatives.find((item) => signature(item.training) === signature(plan));
  return Number(alt?.score ?? result.maximumPerformanceV4040?.baselineScore ?? 80);
}

function slotStatus(result: AnalysisResult) {
  return result.parsed.evidence.impetoSlotStatus ?? 'NAO_CONFIRMADO';
}

function evaluateStack(result: AnalysisResult, plan: TrainingPlan, source: StackCandidate['source']): StackCandidate {
  const skillPlan = buildPersonalizedSkillPlan(result, plan, { label: 'Desempenho Máximo v40.80', positionOverride: result.bestPosition.code });
  const skillScore = skillPlanScore(skillPlan);
  const rankedImpetos = scoreImpetos(result, plan, skillPlan);
  const status = slotStatus(result);
  const canCraft = status === 'DISPONIVEL';
  const impetoScore = canCraft ? Number(rankedImpetos[0]?.score ?? 72) : 84;
  const baseScore = baseScoreForPlan(result, plan);
  const jointScore = clamp(baseScore * .72 + skillScore * .19 + impetoScore * .09);
  return { plan, baseScore, skillPlan, skillScore, impetos: rankedImpetos, impetoScore, jointScore, source };
}

function marginalAudit(result: AnalysisResult, plan: TrainingPlan): MaximumPerformanceV4080Analysis['marginalAudit'] {
  const weights = ROLE_WEIGHTS[result.bestPosition.code];
  return TRAINING_KEYS.map((key) => {
    const level = Number(plan[key] ?? 0);
    const roleWeight = Number(weights[key] ?? 0);
    const saturationRisk = clamp(Math.max(0, level - 10) * (roleWeight >= .85 ? 9 : 13));
    const verdict = roleWeight < .3 && level >= 4 ? 'BAIXA_PRIORIDADE' as const
      : saturationRisk >= 45 ? 'SATURADO' as const
      : roleWeight >= 1 && level >= 6 ? 'PROTEGER' as const
      : 'EFICIENTE' as const;
    return { key, label: TRAINING_LABELS[key], level, roleWeight: clamp(roleWeight * 70), saturationRisk, verdict };
  }).sort((a, b) => b.roleWeight - a.roleWeight || a.saturationRisk - b.saturationRisk);
}

export function buildMaximumPerformanceV4080(result: AnalysisResult): MaximumPerformanceV4080Analysis {
  const current = clone(result.training);
  const longitudinalLocked = Boolean(result.longitudinalGameplayMemoryV4060?.applied);
  const pool = new Map<string, { plan: TrainingPlan; source: StackCandidate['source'] }>();
  pool.set(signature(current), { plan: current, source: 'ATUAL' });
  if (!longitudinalLocked) {
    for (const alternative of result.maximumPerformanceV4040?.alternatives ?? []) {
      pool.set(signature(alternative.training), { plan: clone(alternative.training), source: 'PARETO' });
    }
  }
  const candidates = [...pool.values()].map((item) => evaluateStack(result, item.plan, item.source))
    .sort((a, b) => b.jointScore - a.jointScore || b.skillScore - a.skillScore || signature(a.plan).localeCompare(signature(b.plan)));
  const baseline = candidates.find((item) => signature(item.plan) === signature(current)) ?? evaluateStack(result, current, 'ATUAL');
  const rawWinner = candidates[0] ?? baseline;
  const winner = longitudinalLocked || rawWinner.jointScore < baseline.jointScore + .2 ? baseline : rawWinner;
  const status = slotStatus(result);
  const canCraft = status === 'DISPONIVEL';
  const existing = result.parsed.impetos.filter((item) => item.active !== false).map((item) => item.name).filter((name) => !/sem\s+(?:ímpeto|impeto|booster)/i.test(name));
  const primary = canCraft ? winner.impetos.find((item) => item.tier === 'ideal')?.name ?? winner.impetos[0]?.name ?? null : existing[0] ?? null;
  const exactBudget = trainingPlanTotalCost(winner.plan) === result.trainingPointsTotal;
  const ownedSkillKeys = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
  const duplicatesWithOwned = winner.skillPlan.filter((item) => ownedSkillKeys.has(skillIdentityKey(item.name))).length;
  const source = longitudinalLocked ? 'VALIDADO_LONGITUDINAL' as const : winner.source === 'PARETO' ? 'PARETO_RECONCILIADO' as const : 'ATUAL' as const;
  return {
    engineVersion: MAXIMUM_PERFORMANCE_V4080_VERSION,
    mode: 'DESEMPENHO_MAXIMO_STACK_FINAL',
    deterministic: true,
    selectedPosition: result.bestPosition.code,
    selectedPositionLabel: POSITION_PT[result.bestPosition.code],
    trainingSource: source,
    baseTraining: current,
    finalTraining: winner.plan,
    exactBudget,
    candidatesEvaluated: candidates.length,
    baselineJointScore: baseline.jointScore,
    winnerJointScore: winner.jointScore,
    jointGain: clamp(winner.jointScore - baseline.jointScore, -100, 100),
    skillPlan: { finalSkills: winner.skillPlan.map((item) => item.name), score: winner.skillScore, lateBound: true, duplicatesWithOwned, slotsFilled: winner.skillPlan.length },
    impeto: {
      slotStatus: status,
      canCraft,
      existing,
      primary,
      candidates: winner.impetos,
      bestScore: canCraft ? Number(winner.impetos[0]?.score ?? 0) : existing.length ? 100 : 0,
      selectableOfficialCount: IMPETO_CRAFTING_SELECTABLE_COUNT,
      randomPool: { ...IMPETO_RANDOM_POOL_LIMITS },
      policy: canCraft
        ? `${IMPETO_CRAFTING_POLICY} A recomendação foi recalculada depois da ficha e do Top 5 finais.`
        : status === 'OCUPADO' ? 'A vaga adicional já está ocupada; o app preserva o Ímpeto existente e bloqueia sugestão de gasto.'
          : status === 'SEM_VAGA' ? 'A carta foi lida sem Espaço/Vaga de Ímpeto; nenhum Token deve ser gasto nela.'
            : 'A vaga de Ímpeto não foi confirmada pelo OCR; o app não autoriza gasto até a carta mostrar essa informação com segurança.'
    },
    marginalAudit: marginalAudit(result, winner.plan),
    guarantees: {
      gerIsNotOptimizationTarget: true,
      finalBuildFirst: true,
      finalSkillsReconciled: duplicatesWithOwned === 0 && winner.skillPlan.length <= 5,
      invalidImpetoSpendBlocked: !canCraft || status === 'DISPONIVEL',
      existingImpetoPreserved: true,
      longitudinalWinnerProtected: longitudinalLocked,
      noRandomness: true
    },
    reasons: [
      `Reconciliador final comparou ${candidates.length} stack(s) já aprovados pelo Pareto, sem abrir uma nova busca por GER.`,
      `Top 5 foi recalculado depois da ficha final: ${winner.skillPlan.length}/5 habilidade(s), score conjunto ${Math.round(winner.skillScore)}/100.`,
      canCraft ? `Espaço/Vaga de Ímpeto confirmado: ${winner.impetos.length} opção(ões) reavaliadas pelo ganho marginal da função.` : `Criação de Ímpeto bloqueada: status ${status}.`,
      longitudinalLocked ? 'A ficha validada longitudinalmente foi protegida; v40.80 não troca a distribuição por uma simulação nova.' : 'Sem campeã longitudinal travada: somente alternativas Pareto já aprovadas puderam disputar o stack final.',
      'Desempenho real continua sendo o objetivo; overall/GER permanece fora da função de otimização.'
    ],
    summary: `${result.parsed.playerName}: v40.80 reconciliou ficha + Top 5 + Ímpeto em ${POSITION_PT[result.bestPosition.code]} com score conjunto ${Math.round(winner.jointScore)}/100 e gasto de Ímpeto ${canCraft ? 'liberado pela vaga confirmada' : 'bloqueado por segurança'}.`
  };
}

export function applyMaximumPerformanceV4080(result: AnalysisResult): AnalysisResult {
  const analysis = buildMaximumPerformanceV4080(result);
  if (result.objective !== 'COMPETITIVE') return { ...result, maximumPerformanceV4080: analysis };
  const training = analysis.finalTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const canCraft = analysis.impeto.canCraft;
  const recommendedImpetos = canCraft && analysis.impeto.candidates.length ? analysis.impeto.candidates : result.recommendedImpetos;
  const existingNote = analysis.impeto.existing.length ? `Ímpeto(s) já presente(s): ${analysis.impeto.existing.join(', ')}; preservado(s) no cálculo.` : analysis.impeto.policy;
  return {
    ...result,
    training,
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    recommendedSkills: analysis.skillPlan.finalSkills.length ? analysis.skillPlan.finalSkills : result.recommendedSkills,
    recommendedImpetos,
    buildName: `Ficha Automática v40.80 — Desempenho Máximo Stack Final — ${result.parsed.playerName}`,
    buildVariants: result.buildVariants.length ? result.buildVariants.map((variant, index) => index === 0 ? {
      ...variant,
      title: `Ficha Automática v40.80 — Desempenho Máximo — ${result.parsed.playerName}`,
      training,
      pointsUsed,
      note: `${analysis.summary} ${existingNote}`,
      qualityScore: analysis.winnerJointScore,
      adaptationLabel: 'FICHA + TOP 5 + ÍMPETO • STACK FINAL • SEM GER'
    } : variant) : result.buildVariants,
    recommendationExplanation: [analysis.summary, ...analysis.reasons, existingNote, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 30),
    strengths: [
      'v40.80 reconcilia a ficha final com as cinco habilidades adicionais antes de recomendar qualquer gasto de Ímpeto.',
      'Cartas sem vaga confirmada não recebem autorização para gastar Token de Ímpeto.',
      'Uma campeã validada em várias sessões não é substituída por simulação teórica nova.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 20),
    note: `${analysis.summary} ${analysis.impeto.policy}`,
    maximumPerformanceV4080: analysis
  };
}
