import type { AnalysisResult, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS } from './trainingPlanCore';

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stableEntries(value: Record<string, unknown> | null | undefined) {
  return Object.entries(value ?? {})
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, item]) => `${key}:${typeof item === 'string' ? normalizeText(item) : String(item ?? '')}`)
    .join(',');
}

function trainingSignature(plan: TrainingPlan | null | undefined) {
  return TRAINING_KEYS.map((key) => Number(plan?.[key] ?? 0)).join('-');
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

/**
 * Identifica todos os dados capazes de alterar ficha, habilidades ou Ímpeto.
 * O cache só pode ser reutilizado quando a entrada funcional for realmente igual.
 */
export function cardAnalysisInputFingerprint(result: AnalysisResult, extra = '') {
  const parsed = result.parsed;
  const skills = [...parsed.nativeSkills, ...parsed.specialSkills]
    .map(normalizeText)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const impetos = parsed.impetos
    .map((item) => `${normalizeText(item.name)}:${item.value ?? ''}:${item.active === false ? 0 : 1}`)
    .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  const learning = result.unifiedIntelligence?.learning;
  const learningSignature = learning
    ? [
        learning.samples,
        learning.confidence,
        stableEntries(learning.learnedWeights as Record<string, unknown>),
        learning.patterns.map((item) => `${normalizeText(item.signal)}:${item.training}:${item.rate}`).sort().join(','),
        learning.testedPlans.map((item) => `${item.signature}:${item.samples}:${item.averageRating}:${item.issueRate}:${item.performanceScore}`).sort().join(',')
      ].join('~')
    : '';

  const source = [
    parsed.internalId,
    normalizeText(parsed.playerName),
    normalizeText(parsed.cardType),
    parsed.mainPosition,
    result.bestPosition.code,
    normalizeText(parsed.playstyle),
    parsed.level ?? '',
    parsed.height ?? '',
    parsed.weight ?? '',
    parsed.confidence,
    stableEntries(parsed.attributes as Record<string, unknown>),
    skills.join(','),
    impetos.join(','),
    result.trainingPointsTotal,
    trainingSignature(result.training),
    result.tacticalProfile.formation,
    result.tacticalProfile.style,
    normalizeText(result.tacticalProfile.managerId),
    normalizeText(result.tacticalProfile.managerName),
    result.tacticalProfile.managerProficiency ?? '',
    result.tacticalProfile.managerBooster ?? '',
    result.validation.level,
    parsed.manualConfirmed ? 1 : 0,
    result.validation.confirmed ? 1 : 0,
    result.competitiveFusion?.exactCardCount ?? 0,
    result.competitiveFusion?.personalMatchSamples ?? 0,
    learningSignature,
    extra
  ].join('|');

  return fnv1a(source);
}

export function feedbackFingerprint(items: Array<Record<string, unknown>>) {
  const source = items.map((item) => {
    const trainingPlan = item.trainingPlan as TrainingPlan | undefined;
    return [
      item.createdAt ?? item.updatedAt ?? item.date ?? '',
      item.rating ?? '',
      item.abVariant ?? '',
      trainingSignature(trainingPlan),
      stableEntries(item)
    ].join(':');
  }).sort().join('|');
  return fnv1a(source);
}
