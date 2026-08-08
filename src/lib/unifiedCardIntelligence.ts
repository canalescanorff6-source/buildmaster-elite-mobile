import type {
  AnalysisResult,
  MatchLearningV31,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedCardIntelligenceAnalysis
} from './analyzerDomain';
import { readAccountStorage } from './accountStorage';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import type { MatchFeedback } from './realMatchCalibration';
import { TRAINING_LABELS } from './trainingEngine';
import {
  TRAINING_KEYS,
  emptyTraining,
  normalizeTrainingPlan,
  trainingLevelCost,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import { buildPersonalizedSkillPlan, skillPlanScore } from './skillIntelligenceV31';
import { cardAnalysisInputFingerprint, feedbackFingerprint } from './cardAnalysisFingerprint';

const ENGINE_VERSION = '31.10-unified-intelligence-1';
const SIMULATION_COUNT = 520;
const CACHE_LIMIT = 0;

const ACTIVE_LINE: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
const ACTIVE_GK: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 10, dexterity: 8.5, lowerBodyStrength: 7.5, aerialStrength: 5.5, dribbling: 4.5, passing: 2.5 },
  SS: { dexterity: 9, dribbling: 8, passing: 7, shooting: 6.5, lowerBodyStrength: 4.5 },
  LWF: { dribbling: 9.5, dexterity: 9, lowerBodyStrength: 7, shooting: 6.5, passing: 4.5 },
  RWF: { dribbling: 9.5, dexterity: 9, lowerBodyStrength: 7, shooting: 6.5, passing: 4.5 },
  LMF: { passing: 8, lowerBodyStrength: 8, dexterity: 6.5, dribbling: 5.5, defending: 5 },
  RMF: { passing: 8, lowerBodyStrength: 8, dexterity: 6.5, dribbling: 5.5, defending: 5 },
  AMF: { passing: 9.5, dribbling: 8.5, dexterity: 8, shooting: 5.5, lowerBodyStrength: 3.5 },
  CMF: { passing: 9, lowerBodyStrength: 7.5, dexterity: 6.5, defending: 5.5, dribbling: 5 },
  DMF: { defending: 10, passing: 7.5, lowerBodyStrength: 7.5, dexterity: 5, aerialStrength: 4.5 },
  CB: { defending: 10, aerialStrength: 8.5, lowerBodyStrength: 7.5, dexterity: 5.5, passing: 2.5 },
  LB: { defending: 8.5, lowerBodyStrength: 8.5, passing: 6.5, dexterity: 5.5, dribbling: 3.5 },
  RB: { defending: 8.5, lowerBodyStrength: 8.5, passing: 6.5, dexterity: 5.5, dribbling: 3.5 },
  GK: { gk2: 10, gk3: 9, gk1: 8.5, aerialStrength: 5.5, lowerBodyStrength: 4.5 }
};

type PatternRule = { signal: keyof MatchFeedback; label: string; training: TrainingKey; impact: string };
const PATTERN_RULES: PatternRule[] = [
  { signal: 'feltSlow', label: 'Lentidão e giro', training: 'dexterity', impact: 'Prioriza resposta corporal, aceleração e mudança de direção.' },
  { signal: 'missedPasses', label: 'Erros de passe', training: 'passing', impact: 'Aumenta segurança na circulação e no passe vertical.' },
  { signal: 'finishedPoorly', label: 'Finalização inconsistente', training: 'shooting', impact: 'Reforça conclusão e presença ofensiva sem exagerar o investimento.' },
  { signal: 'tiredEarly', label: 'Cansaço precoce', training: 'lowerBodyStrength', impact: 'Aumenta sustentação de velocidade e resistência ao longo da partida.' },
  { signal: 'lackedPhysical', label: 'Perda de duelos', training: 'aerialStrength', impact: 'Reforça contato, salto e proteção em disputas físicas.' },
  { signal: 'outOfPosition', label: 'Posicionamento irregular', training: 'defending', impact: 'Reforça leitura e engajamento em funções defensivas.' },
  { signal: 'createdLittle', label: 'Criação baixa', training: 'passing', impact: 'Aumenta participação na construção e no último passe.' }
];

type SimulatedCandidate = {
  plan: TrainingPlan;
  source: string;
  baseScore: number;
  jointScore: number;
  skillScore: number;
  impetoScore: number;
};

const cache = new Map<string, { result: AnalysisResult; analysis: UnifiedCardIntelligenceAnalysis }>();

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value * 10) / 10)); }
function activeKeys(position: PositionCode) { return position === 'GK' ? ACTIVE_GK : ACTIVE_LINE; }
function signature(plan: TrainingPlan) { return TRAINING_KEYS.map((key) => plan[key] ?? 0).join('-'); }
function hash(value: string) { let output = 2166136261; for (let index = 0; index < value.length; index += 1) { output ^= value.charCodeAt(index); output = Math.imul(output, 16777619); } return output >>> 0; }
function createRng(seed: number) { let state = seed || 1; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }

function cacheKey(result: AnalysisResult) {
  const feedbacks = loadFeedbacks(result);
  return cardAnalysisInputFingerprint(result, feedbackFingerprint(feedbacks as unknown as Array<Record<string, unknown>>));
}

function loadFeedbacks(result: AnalysisResult): MatchFeedback[] {
  try {
    const raw = readAccountStorage(CALIBRATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, MatchFeedback[]> : {};
    const key = `${result.parsed.internalId}:${result.bestPosition.code}`;
    return Array.isArray(parsed[key]) ? parsed[key].slice(0, 30) : [];
  } catch { return []; }
}

function buildLearning(result: AnalysisResult): MatchLearningV31 {
  const feedbacks = loadFeedbacks(result);
  const learnedWeights: Partial<Record<TrainingKey, number>> = {};
  const patterns = PATTERN_RULES.map((rule) => {
    const matches = feedbacks.filter((item) => Boolean(item[rule.signal])).length;
    const rate = feedbacks.length ? matches / feedbacks.length : 0;
    return { rule, rate };
  }).filter((item) => item.rate >= 0.34 && feedbacks.length >= 3)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)
    .map(({ rule, rate }) => {
      learnedWeights[rule.training] = Math.min(2.4, (learnedWeights[rule.training] ?? 0) + rate * 2.2);
      return { signal: rule.label, rate: Math.round(rate * 100), training: rule.training, impact: rule.impact };
    });

  const issueSignals: Array<keyof MatchFeedback> = ['feltSlow', 'tiredEarly', 'missedPasses', 'lackedPhysical', 'createdLittle', 'finishedPoorly', 'outOfPosition'];
  const planGroups = new Map<string, MatchFeedback[]>();
  for (const feedback of feedbacks) {
    if (!feedback.trainingPlan) continue;
    const plan = normalizeTrainingPlan(feedback.trainingPlan);
    const key = signature(plan);
    const group = planGroups.get(key) ?? [];
    group.push({ ...feedback, trainingPlan: plan });
    planGroups.set(key, group);
  }
  const testedPlans = Array.from(planGroups.entries()).map(([planSignature, items]) => {
    const ratings = items.map((item) => Number(item.rating)).filter((value) => Number.isFinite(value));
    const averageRating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
    const issues = items.filter((item) => issueSignals.some((signal) => Boolean(item[signal]))).length;
    const issueRate = Math.round(issues / Math.max(1, items.length) * 100);
    const positiveRate = items.filter((item) => item.workedWell || item.defendedWell).length / Math.max(1, items.length);
    const performanceScore = clamp(averageRating * 9 + positiveRate * 18 - issueRate * 0.18, 0, 100);
    return { signature: planSignature, plan: normalizeTrainingPlan(items[0].trainingPlan ?? emptyTraining()), samples: items.length, averageRating: Math.round(averageRating * 10) / 10, issueRate, performanceScore };
  }).sort((a, b) => b.performanceScore - a.performanceScore || b.samples - a.samples).slice(0, 8);

  const byVariant = (variant: 'A' | 'B') => feedbacks.filter((item) => item.abVariant === variant);
  const variantScore = (items: MatchFeedback[]) => {
    const ratings = items.map((item) => Number(item.rating)).filter((value) => Number.isFinite(value));
    if (!ratings.length) return null;
    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    const issues = items.filter((item) => issueSignals.some((signal) => Boolean(item[signal]))).length / Math.max(1, items.length);
    return { average: Math.round(average * 10) / 10, score: average * 10 - issues * 18 };
  };
  const variantA = byVariant('A');
  const variantB = byVariant('B');
  const scoreA = variantScore(variantA);
  const scoreB = variantScore(variantB);
  const ready = variantA.length >= 5 && variantB.length >= 5 && Boolean(scoreA && scoreB);
  const provisionalWinner: 'A' | 'B' | null = ready && scoreA && scoreB && Math.abs(scoreA.score - scoreB.score) >= 2
    ? scoreA.score > scoreB.score ? 'A' : 'B'
    : null;
  const abComparison = {
    variantASamples: variantA.length,
    variantBSamples: variantB.length,
    averageA: scoreA?.average ?? null,
    averageB: scoreB?.average ?? null,
    provisionalWinner,
    ready,
    note: !variantA.length && !variantB.length
      ? 'O teste A/B ainda não começou.'
      : !ready
        ? `Faltam partidas comparáveis: A ${variantA.length}/5 • B ${variantB.length}/5.`
        : provisionalWinner
          ? `A variante ${provisionalWinner} apresentou melhor combinação de nota e menor taxa de problemas.`
          : 'As variantes ficaram muito próximas; continue testando antes de trocar a ficha principal.'
  };

  const confidence: MatchLearningV31['confidence'] = feedbacks.length >= 10 ? 'alta' : feedbacks.length >= 6 ? 'moderada' : feedbacks.length >= 3 ? 'inicial' : 'sem dados';
  const appliedInfluence = confidence === 'alta' ? 18 : confidence === 'moderada' ? 12 : confidence === 'inicial' ? 6 : 0;
  return {
    samples: feedbacks.length,
    confidence,
    patterns,
    learnedWeights,
    appliedInfluence,
    testedPlans,
    abComparison,
    recommendation: !feedbacks.length
      ? 'Registre partidas para o motor aprender como a carta responde no seu aparelho e estilo de jogo.'
      : patterns.length
        ? `${patterns.length} padrão(ões) recorrente(s) entraram como desempate controlado da ficha.`
        : 'O histórico ainda não confirmou uma fraqueza recorrente; a identidade da ficha foi preservada.'
  };
}

function cardNeed(result: AnalysisResult, key: TrainingKey) {
  const goal = result.cardDna?.individualGoals.find((item) => item.training === key);
  if (!goal) return 0;
  const gap = Math.max(0, goal.personalizedIdeal - goal.current);
  const priority = goal.priority === 'corrigir' ? 3.4 : goal.priority === 'especializar' ? 2.7 : goal.priority === 'proteger' ? 1.2 : 1.7;
  return Math.min(12, gap * 0.35 + priority);
}

function physicalAdjustment(result: AnalysisResult, key: TrainingKey) {
  const profile = result.parsed.physicalProfile;
  const attributes = result.parsed.attributes;
  let score = 0;
  if (key === 'aerialStrength' && ((profile.legLength ?? 0) >= 8 || (profile.jumpHeight ?? 0) >= 255 || (attributes.jump ?? 0) >= 82)) score += 2.8;
  if (key === 'lowerBodyStrength' && ((profile.trunkCollision ?? 0) >= 48 || (attributes.physicalContact ?? 0) >= 80 || (attributes.stamina ?? 0) < 78)) score += 2.2;
  if (key === 'dexterity' && ((attributes.balance ?? 100) < 82 || (attributes.acceleration ?? 100) < 84)) score += 2.6;
  if (key === 'dribbling' && ((attributes.ballControl ?? 0) >= 78 || (attributes.dribbling ?? 0) >= 78)) score += 1.5;
  return score;
}

function marginalAdjustment(result: AnalysisResult, key: TrainingKey) {
  const item = result.marginalReturn.find((entry) => entry.training === key);
  if (!item) return 0;
  return item.returnLabel === 'alto' ? 3.4 : item.returnLabel === 'médio' ? 1.4 : -2.7;
}

function levelUtility(result: AnalysisResult, learning: MatchLearningV31, key: TrainingKey, currentLevel: number, variant: number, rng: () => number) {
  const base = POSITION_WEIGHTS[result.bestPosition.code][key] ?? -4;
  const saturation = currentLevel >= 13 ? -6.5 : currentLevel >= 11 ? -3.4 : currentLevel >= 9 ? -1.1 : currentLevel <= 4 ? 1.8 : 0;
  const ceiling = result.correctionLimit.correctionCaps.find((item) => item.training === key)?.recommendedMax;
  const ceilingPenalty = ceiling != null && currentLevel >= ceiling ? -5.5 * (currentLevel - ceiling + 1) : 0;
  const learningBoost = Number(learning.learnedWeights[key] ?? 0) * (learning.appliedInfluence / 8);
  const identityNoise = (rng() - 0.5) * (2.4 + (variant % 7) * 0.18);
  return base + cardNeed(result, key) + physicalAdjustment(result, key) + marginalAdjustment(result, key) + learningBoost + saturation + ceilingPenalty + identityNoise;
}

function allocateCandidate(result: AnalysisResult, learning: MatchLearningV31, variant: number, seed: number): TrainingPlan {
  const keys = activeKeys(result.bestPosition.code);
  const plan = emptyTraining();
  const rng = createRng(seed + variant * 7919);
  const budget = result.trainingPointsTotal;
  let guard = 0;
  while (guard < 180) {
    guard += 1;
    const used = trainingPlanTotalCost(plan);
    const remaining = budget - used;
    const options = keys
      .filter((key) => plan[key] < 16 && trainingLevelCost(plan[key] + 1) <= remaining)
      .map((key) => ({ key, utility: levelUtility(result, learning, key, plan[key], variant, rng) / Math.max(1, trainingLevelCost(plan[key] + 1)) }))
      .sort((a, b) => b.utility - a.utility);
    const selected = options[0];
    if (!selected || selected.utility < -2) break;
    plan[selected.key] += 1;
  }
  return normalizeTrainingPlan(plan);
}

function planDistance(left: TrainingPlan, right: TrainingPlan) {
  return activeKeys('CF').concat(ACTIVE_GK).filter((key, index, all) => all.indexOf(key) === index).reduce((sum, key) => sum + Math.abs((left[key] ?? 0) - (right[key] ?? 0)), 0);
}

function synergyScore(result: AnalysisResult, plan: TrainingPlan) {
  const synergies = result.deepCardIntelligence?.synergies ?? [];
  if (!synergies.length) return 70;
  const priorityKeys = POSITION_WEIGHTS[result.bestPosition.code];
  const weighted = activeKeys(result.bestPosition.code).reduce((sum, key) => sum + Number(plan[key] ?? 0) * Math.max(0, priorityKeys[key] ?? 0), 0);
  const max = activeKeys(result.bestPosition.code).reduce((sum, key) => sum + 12 * Math.max(0, priorityKeys[key] ?? 0), 0);
  return max ? clamp(weighted / max * 100) : 70;
}

function professionalCloseness(result: AnalysisResult, plan: TrainingPlan) {
  const reference = result.competitiveFusion?.finalTraining;
  if (!reference || !(result.competitiveFusion?.exactCardCount ?? 0)) return 70;
  return clamp(100 - planDistance(plan, reference) * 4.2);
}

function identityPreservation(result: AnalysisResult, plan: TrainingPlan) {
  const base = result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? 76;
  const distance = planDistance(plan, result.training);
  const overCaps = result.correctionLimit.correctionCaps.reduce((sum, cap) => sum + Math.max(0, plan[cap.training] - cap.recommendedMax), 0);
  return clamp(base - Math.max(0, distance - 9) * 1.15 - overCaps * 4.5, 20, 100);
}

function budgetScore(result: AnalysisResult, plan: TrainingPlan) {
  const used = trainingPlanTotalCost(plan);
  const missing = Math.max(0, result.trainingPointsTotal - used);
  return clamp(100 - missing * 4.5 - (used > result.trainingPointsTotal ? 100 : 0));
}

function impetoFit(result: AnalysisResult, plan: TrainingPlan) {
  const candidates = result.recommendedImpetos.filter((item) => item.tier !== 'evitar');
  const scored = candidates.map((item) => {
    const text = `${item.name} ${item.attributes.join(' ')}`.toLowerCase();
    let support = 0;
    if (/chute|final|ofens|movimento/.test(text)) support += plan.shooting * 0.7 + plan.dexterity * 0.45;
    if (/passe|tecnica|controle/.test(text)) support += plan.passing * 0.65 + plan.dribbling * 0.5;
    if (/agil|veloc|movimento/.test(text)) support += plan.dexterity * 0.75 + plan.lowerBodyStrength * 0.55;
    if (/defes|duelo|fisic|aereo/.test(text)) support += plan.defending * 0.7 + plan.aerialStrength * 0.55 + plan.lowerBodyStrength * 0.35;
    if (/goleiro|go /.test(text)) support += (plan.gk1 + plan.gk2 + plan.gk3) * 0.5;
    return { item, score: clamp((item.score ?? 60) * 0.72 + support * 1.25) };
  }).sort((a, b) => b.score - a.score);
  return scored[0] ?? { item: null, score: 0 };
}

function scoreCandidate(result: AnalysisResult, plan: TrainingPlan, learning: MatchLearningV31, source: string): SimulatedCandidate | null {
  const used = trainingPlanTotalCost(plan);
  if (used > result.trainingPointsTotal) return null;
  const skills = buildPersonalizedSkillPlan(result, plan);
  const skillScore = skillPlanScore(skills);
  const impeto = impetoFit(result, plan);
  const baseScore = clamp(
    synergyScore(result, plan) * 0.27
    + identityPreservation(result, plan) * 0.24
    + budgetScore(result, plan) * 0.18
    + professionalCloseness(result, plan) * 0.12
    + skillScore * 0.12
    + impeto.score * 0.07
  );
  const learningBonus = learning.patterns.reduce((sum, pattern) => sum + (plan[pattern.training] ?? 0) * (pattern.rate / 100) * 0.18, 0);
  const tested = learning.testedPlans.find((item) => item.signature === signature(plan));
  const testedBonus = tested && tested.samples >= 3
    ? Math.min(9, Math.max(-5, (tested.performanceScore - 55) * 0.16) * Math.min(1, tested.samples / 7))
    : 0;
  return { plan, source, baseScore, skillScore, impetoScore: impeto.score, jointScore: clamp(baseScore + learningBonus + testedBonus) };
}

function generateCandidates(result: AnalysisResult, learning: MatchLearningV31) {
  const bySignature = new Map<string, { plan: TrainingPlan; source: string }>();
  const add = (plan: TrainingPlan, source: string) => {
    const normalized = normalizeTrainingPlan(plan);
    const key = signature(normalized);
    if (!bySignature.has(key)) bySignature.set(key, { plan: normalized, source });
  };
  add(result.training, 'Ficha atual integrada');
  for (const variant of result.buildVariants) add(variant.training, variant.title);
  if (result.competitiveFusion) add(result.competitiveFusion.finalTraining, 'Consenso profissional controlado');
  add(result.errorTolerance.conservative, 'Cenário conservador');
  add(result.errorTolerance.probable, 'Cenário provável');
  add(result.errorTolerance.optimistic, 'Cenário agressivo controlado');
  for (const tested of learning.testedPlans) {
    if (tested.samples >= 2) add(tested.plan, `Ficha testada em ${tested.samples} partida(s) • desempenho ${tested.performanceScore}/100`);
  }
  const seed = hash(`${result.parsed.internalId}|${result.parsed.playerName}|${result.parsed.cardType}|${result.bestPosition.code}`);
  for (let index = 0; index < SIMULATION_COUNT; index += 1) add(allocateCandidate(result, learning, index, seed), `Simulação profunda ${index + 1}`);
  return Array.from(bySignature.values());
}

function gameplayChanges(result: AnalysisResult, plan: TrainingPlan) {
  const changes: string[] = [];
  const delta = (key: TrainingKey) => (plan[key] ?? 0) - (result.competitiveFusion?.baseTraining[key] ?? result.training[key] ?? 0);
  if (delta('dexterity') > 0) changes.push('Mais resposta no giro, aceleração curta e ataque ao espaço.');
  if (delta('passing') > 0) changes.push('Passe mais seguro sob pressão e maior participação na criação.');
  if (delta('shooting') > 0) changes.push('Conclusão mais rápida e consistente nas chances claras.');
  if (delta('dribbling') > 0) changes.push('Domínio e condução mais limpos no primeiro duelo.');
  if (delta('defending') > 0) changes.push('Melhor leitura de linhas de passe, marcação e recuperação.');
  if (delta('aerialStrength') > 0) changes.push('Mais presença em duelos físicos e bolas aéreas.');
  if (delta('lowerBodyStrength') > 0) changes.push('Maior sustentação de velocidade, força e resistência durante a partida.');
  return changes.length ? changes.slice(0, 5) : ['A ficha preservou a identidade porque nenhuma redistribuição mostrou ganho real suficiente.'];
}

function protectedTraits(result: AnalysisResult) {
  return Array.from(new Set([
    ...(result.cardDna?.protectedStrengths ?? []),
    ...(result.playerIdentity?.protectedCharacteristics ?? []),
    ...(result.correctionLimit?.protectedStrengths ?? [])
  ])).slice(0, 6);
}

function buildAnalysis(result: AnalysisResult): { result: AnalysisResult; analysis: UnifiedCardIntelligenceAnalysis } {
  const started = Date.now();
  const learning = buildLearning(result);
  const generated = generateCandidates(result, learning);
  const scored = generated
    .map((candidate) => scoreCandidate(result, candidate.plan, learning, candidate.source))
    .filter((candidate): candidate is SimulatedCandidate => candidate !== null)
    .sort((a, b) => b.jointScore - a.jointScore || b.baseScore - a.baseScore);
  const winner = scored[0] ?? scoreCandidate(result, result.training, learning, 'Ficha atual')!;
  const runnerUp = scored.find((candidate) => signature(candidate.plan) !== signature(winner.plan) && planDistance(candidate.plan, winner.plan) <= 6) ?? scored[1] ?? winner;
  const skillPlan = buildPersonalizedSkillPlan(result, winner.plan);
  const bestImpeto = impetoFit(result, winner.plan);
  const used = trainingPlanTotalCost(winner.plan);
  const differences = TRAINING_KEYS.filter((key) => winner.plan[key] !== runnerUp.plan[key]).map((key) => ({ key, label: TRAINING_LABELS[key], a: winner.plan[key], b: runnerUp.plan[key] }));
  const confidence = clamp(
    result.parsed.confidence * 0.35
    + winner.jointScore * 0.31
    + identityPreservation(result, winner.plan) * 0.18
    + Math.min(10, (result.competitiveFusion?.exactCardCount ?? 0) * 2.5)
    + Math.min(6, learning.samples * 0.65)
    - (result.validation.level === 'blocked' ? 28 : result.validation.level === 'review' ? 8 : 0),
    20,
    98
  );
  const analysis: UnifiedCardIntelligenceAnalysis = {
    engineVersion: ENGINE_VERSION,
    stages: { dna: '30.60 DNA Competitivo 2.0', simulator: '30.70 Simulador Profundo', integration: '30.80 Ficha + habilidades + Ímpeto', learning: '30.90 Aprendizado por partidas', refinement: '31.10 Refinamento final' },
    confidence,
    finalTraining: winner.plan,
    skillPlan,
    impetoPlan: {
      name: bestImpeto.item?.name ?? null,
      score: bestImpeto.score,
      confidence: bestImpeto.item?.confidence ?? confidence,
      reason: bestImpeto.item?.reason ?? 'Não houve evidência suficiente para selecionar um Ímpeto com segurança.'
    },
    simulation: {
      generatedCandidates: SIMULATION_COUNT + 6,
      validCandidates: scored.length,
      finalists: Math.min(12, scored.length),
      winnerScore: winner.jointScore,
      runnerUpScore: runnerUp.jointScore,
      scoreGap: clamp(winner.jointScore - runnerUp.jointScore, 0, 100),
      exactBudget: used === result.trainingPointsTotal,
      evaluationDimensions: ['DNA e modelo corporal', 'sinergia de atributos', 'retorno por ponto', 'habilidades adicionais', 'Ímpeto', 'fontes profissionais', 'partidas reais'],
      abTest: {
        available: differences.length > 0 && runnerUp !== winner,
        minimumMatchesPerVariant: 5,
        variantA: winner.plan,
        variantB: runnerUp.plan,
        differences,
        instruction: 'Use cada variante em pelo menos 5 partidas com a mesma posição, formação e estilo. Marque giro, passe, finalização, físico e posicionamento.'
      }
    },
    learning,
    gameplayChanges: gameplayChanges(result, winner.plan),
    protectedTraits: protectedTraits(result),
    safeguards: [
      'A posição escolhida pelo usuário é preservada.',
      'Nenhuma habilidade já identificada na carta pode entrar novamente.',
      'Somente habilidades da lista oficial local são consideradas.',
      'O conjunto de habilidades usa atributos, estilo, ficha final e desempate individual da carta para evitar listas genéricas iguais.',
      'O aprendizado por partidas só influencia após padrões repetidos e nunca ultrapassa o orçamento.',
      'O teste A/B só declara vencedor depois de pelo menos 5 partidas em cada variante.',
      'O Ímpeto é recalculado junto com a ficha e as habilidades.'
    ],
    performance: { computeMs: Math.max(1, Date.now() - started), cacheHit: false, modulesLoadedOnDemand: ['OCR avançado', 'fontes de criadores', 'laboratório A/B', 'auditoria técnica'] },
    summary: `A inteligência v31.10 avaliou ${scored.length} distribuições válidas, escolheu uma ficha única com ${winner.jointScore}/100 e calculou habilidades e Ímpeto no mesmo processo.`
  };
  const recommendedSkills = skillPlan.map((item) => item.name);
  const skillRecommendations = [
    ...skillPlan.map((item) => ({ name: item.name, tier: item.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const, reason: `${item.gameplayImpact} ${item.reasons[0] ?? ''}`.trim() })),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !recommendedSkills.includes(item.name))
  ];
  const reorderedImpetos = bestImpeto.item
    ? [bestImpeto.item, ...result.recommendedImpetos.filter((item) => item.name !== bestImpeto.item?.name)]
    : result.recommendedImpetos;
  const finalResult: AnalysisResult = {
    ...result,
    training: winner.plan,
    trainingCost: trainingPlanCost(winner.plan),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos: reorderedImpetos,
    buildName: 'Ficha Competitiva Definitiva — Inteligência v31',
    buildVariants: [{
      kind: 'competitive',
      title: 'Ficha Competitiva Definitiva — Inteligência v31',
      positionLabel: result.bestPosition.label,
      training: winner.plan,
      pointsUsed: used,
      note: analysis.summary,
      qualityScore: winner.jointScore,
      efficiencyScore: budgetScore(result, winner.plan),
      adaptationLabel: confidence >= 86 ? 'muito alta' : confidence >= 72 ? 'alta' : confidence >= 58 ? 'média' : 'controlada',
      highlights: analysis.gameplayChanges.slice(0, 3),
      risks: result.weaknesses.slice(0, 3),
      verdict: `Ficha única com confiança ${Math.round(confidence)}%.`
    }],
    recommendationExplanation: [analysis.summary, ...analysis.gameplayChanges, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 10),
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      engineVersion: '31.10-deep-card-2',
      candidatesEvaluated: generated.length,
      validCandidates: scored.length,
      winnerScore: winner.jointScore,
      winnerSource: winner.source,
      finalTraining: winner.plan,
      skillPlan: skillPlan.map((item) => ({ name: item.name, priority: item.priority === 'essencial' ? 'máxima' : item.priority === 'alta' ? 'alta' : 'útil', reason: `${item.gameplayImpact} ${item.reasons[0] ?? ''}`.trim() })),
      impetoPlan: { name: analysis.impetoPlan.name, score: analysis.impetoPlan.score, reason: analysis.impetoPlan.reason },
      learning: { samples: learning.samples, state: learning.confidence === 'alta' ? 'confiável' : learning.samples >= 3 ? 'aprendendo' : 'sem dados', recommendation: learning.recommendation },
      summary: analysis.summary
    } : result.deepCardIntelligence,
    unifiedIntelligence: analysis
  };
  return { result: finalResult, analysis };
}

export function applyUnifiedCardIntelligence(result: AnalysisResult): AnalysisResult {
  const key = cacheKey(result);
  const cached = cache.get(key);
  if (cached) return { ...cached.result, unifiedIntelligence: { ...cached.analysis, performance: { ...cached.analysis.performance, cacheHit: true } } };
  const built = buildAnalysis(result);
  cache.set(key, built);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  return built.result;
}
