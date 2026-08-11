import type {
  AdaptivePositionV3930Analysis,
  AnalysisResult,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';

export const ADAPTIVE_POSITION_V3930_VERSION = '39.30.0' as const;

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 1.35, dexterity: 1.08, lowerBodyStrength: .82, aerialStrength: .58, dribbling: .44, passing: .2 },
  SS: { shooting: .9, dribbling: 1.08, dexterity: 1.05, passing: .84, lowerBodyStrength: .5 },
  LWF: { dribbling: 1.2, dexterity: 1.08, lowerBodyStrength: .8, shooting: .72, passing: .45 },
  RWF: { dribbling: 1.2, dexterity: 1.08, lowerBodyStrength: .8, shooting: .72, passing: .45 },
  LMF: { passing: .96, dribbling: .72, lowerBodyStrength: .9, dexterity: .78, defending: .58 },
  RMF: { passing: .96, dribbling: .72, lowerBodyStrength: .9, dexterity: .78, defending: .58 },
  AMF: { passing: 1.2, dribbling: 1.04, dexterity: .88, shooting: .6, lowerBodyStrength: .34 },
  CMF: { passing: 1.1, lowerBodyStrength: .82, defending: .72, dribbling: .62, dexterity: .7, shooting: .25 },
  DMF: { defending: 1.28, passing: .88, lowerBodyStrength: .86, aerialStrength: .48, dexterity: .45 },
  CB: { defending: 1.42, aerialStrength: 1.0, lowerBodyStrength: .82, dexterity: .44, passing: .3 },
  LB: { defending: 1.05, lowerBodyStrength: .96, dexterity: .78, passing: .7, dribbling: .42 },
  RB: { defending: 1.05, lowerBodyStrength: .96, dexterity: .78, passing: .7, dribbling: .42 },
  GK: { gk2: 1.28, gk3: 1.2, gk1: 1.08, aerialStrength: .32, lowerBodyStrength: .2 }
};

function clamp(value: number, min = 0, max = 100): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, Math.round(safe * 10) / 10));
}

function normalize(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function signature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function l1Distance(left: TrainingPlan, right: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(left[key] ?? 0) - Number(right[key] ?? 0)), 0);
}

function corePreservation(base: TrainingPlan, candidate: TrainingPlan): number {
  const total = TRAINING_KEYS.reduce((sum, key) => sum + Number(base[key] ?? 0), 0);
  if (!total) return 100;
  return clamp(100 - (l1Distance(base, candidate) / total) * 100);
}

function positionUtility(plan: TrainingPlan, position: PositionCode): number {
  const weights = POSITION_WEIGHTS[position];
  const entries = Object.entries(weights) as Array<[TrainingKey, number]>;
  const max = entries.reduce((sum, [, weight]) => sum + 16 * weight, 0);
  if (!max) return 0;
  return clamp(entries.reduce((sum, [key, weight]) => sum + Number(plan[key] ?? 0) * weight, 0) / max * 100);
}

function positionFamiliarity(result: AnalysisResult, position: PositionCode): number {
  if (position === result.parsed.mainPosition) return 100;
  const rating = Number(result.parsed.positionRatings[position] ?? 0);
  if (rating > 0) return clamp(rating, 40, 99);
  if (result.parsed.positions.includes(position)) return 84;
  return 55;
}

function adaptationMode(result: AnalysisResult, position: PositionCode): AdaptivePositionV3930Analysis['adaptationMode'] {
  if (position === result.parsed.mainPosition) return 'NATURAL';
  if (result.parsed.positions.includes(position) || Number(result.parsed.positionRatings[position] ?? 0) >= 70) return 'COMPATIVEL';
  return 'FORA_DA_POSICAO';
}

function protectedKeys(base: TrainingPlan): TrainingKey[] {
  return [...TRAINING_KEYS]
    .sort((left, right) => Number(base[right] ?? 0) - Number(base[left] ?? 0) || left.localeCompare(right))
    .slice(0, 2);
}

function candidateAllowed(base: TrainingPlan, candidate: TrainingPlan, maxShift: number, protectedCore: TrainingKey[], minCorePreservation = 72): boolean {
  const distance = l1Distance(base, candidate);
  if (distance > maxShift) return false;
  if (corePreservation(base, candidate) < minCorePreservation) return false;
  if (TRAINING_KEYS.some((key) => Number(candidate[key] ?? 0) < 0 || Number(candidate[key] ?? 0) > 16)) return false;
  if (TRAINING_KEYS.some((key) => Number(candidate[key] ?? 0) < Number(base[key] ?? 0) - 2)) return false;
  if (protectedCore.some((key) => Number(candidate[key] ?? 0) < Number(base[key] ?? 0) - 1)) return false;
  return true;
}

function generateCandidates(base: TrainingPlan, position: PositionCode, maxShift: number, minCorePreservation = 72, protectedCount = 2): TrainingPlan[] {
  const budget = trainingPlanTotalCost(base);
  const protectedCore = protectedKeys(base).slice(0, Math.max(0, protectedCount));
  const seen = new Set<string>([signature(base)]);
  const queue: Array<{ plan: TrainingPlan; depth: number }> = [{ plan: clone(base), depth: 0 }];
  const output: TrainingPlan[] = [clone(base)];
  while (queue.length && output.length < 96) {
    const current = queue.shift()!;
    if (current.depth >= 2) continue;
    for (const donor of TRAINING_KEYS) {
      if (Number(current.plan[donor] ?? 0) <= 0) continue;
      for (const receiver of TRAINING_KEYS) {
        if (receiver === donor || Number(current.plan[receiver] ?? 0) >= 16) continue;
        for (let remove = 1; remove <= 2; remove += 1) {
          for (let add = 1; add <= 2; add += 1) {
            if (Number(current.plan[donor] ?? 0) < remove || Number(current.plan[receiver] ?? 0) + add > 16) continue;
            const next = clone(current.plan);
            next[donor] -= remove;
            next[receiver] += add;
            if (trainingPlanTotalCost(next) !== budget) continue;
            if (!candidateAllowed(base, next, maxShift, protectedCore, minCorePreservation)) continue;
            const key = signature(next);
            if (seen.has(key)) continue;
            seen.add(key);
            output.push(next);
            queue.push({ plan: next, depth: current.depth + 1 });
            if (output.length >= 96) break;
          }
          if (output.length >= 96) break;
        }
        if (output.length >= 96) break;
      }
      if (output.length >= 96) break;
    }
  }
  const baseUtility = positionUtility(base, position);
  return output.sort((left, right) => {
    const leftDistance = l1Distance(base, left);
    const rightDistance = l1Distance(base, right);
    const leftScore = positionUtility(left, position) * .78 + corePreservation(base, left) * .22 - leftDistance * .08;
    const rightScore = positionUtility(right, position) * .78 + corePreservation(base, right) * .22 - rightDistance * .08;
    const leftGain = positionUtility(left, position) - baseUtility;
    const rightGain = positionUtility(right, position) - baseUtility;
    return rightScore - leftScore || rightGain - leftGain || signature(left).localeCompare(signature(right));
  });
}

function chooseAdaptedTraining(result: AnalysisResult, base: TrainingPlan): { plan: TrainingPlan; maxShift: number; gain: number } {
  const position = result.bestPosition.code;
  if (position === result.parsed.mainPosition) return { plan: clone(base), maxShift: 0, gain: 0 };
  const mode = adaptationMode(result, position);
  // A posição escolhida pelo usuário é soberana. Para uma carta usada fora da
  // posição nativa, preservar 72% da receita antiga impedia adaptações reais
  // (ex.: MLE usado como MLG/VOL/MAT). Mantemos o DNA, mas abrimos espaço
  // determinístico suficiente para a função escolhida.
  const maxShift = mode === 'COMPATIVEL' ? 11 : 16;
  const minCorePreservation = mode === 'COMPATIVEL' ? 66 : 56;
  const protectedCount = mode === 'COMPATIVEL' ? 2 : 1;
  const candidates = generateCandidates(base, position, maxShift, minCorePreservation, protectedCount);
  const baseUtility = positionUtility(base, position);
  const winner = candidates.find((candidate) => positionUtility(candidate, position) >= baseUtility + .25) ?? candidates[0] ?? base;
  return { plan: clone(winner), maxShift, gain: clamp(positionUtility(winner, position) - baseUtility, -100, 100) };
}

function mergeSkills(core: UnifiedSkillDecision[], positional: UnifiedSkillDecision[], _mode: AdaptivePositionV3930Analysis['adaptationMode']): UnifiedSkillDecision[] {
  const selected: UnifiedSkillDecision[] = [];
  const seen = new Set<string>();
  const add = (item: UnifiedSkillDecision | undefined) => {
    if (!item) return;
    const key = skillIdentityKey(item.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.push(item);
  };
  const coreSlots = 3;
  core.slice(0, coreSlots).forEach(add);
  positional.forEach((item) => { if (selected.length < 5) add(item); });
  core.forEach((item) => { if (selected.length < 5) add(item); });
  return selected.slice(0, 5).map((item, index) => ({
    ...item,
    priority: index === 0 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
    reasons: [index < coreSlots ? 'Núcleo preservado pela identidade da carta.' : 'Complemento determinístico para a posição escolhida.', ...item.reasons].slice(0, 4)
  }));
}

function statusFor(result: AnalysisResult, fit: number): Pick<AdaptivePositionV3930Analysis, 'status' | 'statusLabel' | 'canApplyTraining' | 'canApplySkills' | 'canUseImpeto'> {
  const confidence = Number(result.structuralPrecision?.canonical.confidence ?? result.parsed.confidence ?? 0);
  const blocked = Boolean(result.structuralPrecision?.blocked || result.validation?.level === 'blocked');
  if (blocked || confidence < 52) return {
    status: 'REVISAR_LEITURA',
    statusLabel: 'Confirme a leitura antes de aplicar',
    canApplyTraining: false,
    canApplySkills: false,
    canUseImpeto: false
  };
  if (fit < 68) return {
    status: 'TESTE_RECOMENDADO',
    statusLabel: 'Adaptação pronta; teste o comportamento em campo',
    canApplyTraining: true,
    canApplySkills: true,
    canUseImpeto: true
  };
  return {
    status: 'PRONTO',
    statusLabel: 'Ficha adaptada e liberada',
    canApplyTraining: true,
    canApplySkills: true,
    canUseImpeto: true
  };
}

export function buildAdaptivePositionV3930(result: AnalysisResult): AdaptivePositionV3930Analysis {
  const unified = result.unifiedPerformanceV3920;
  const coreTraining = clone(unified?.canonicalTraining ?? result.training);
  const selected = result.bestPosition.code;
  const selectedLabel = POSITION_PT[selected];
  const natural = result.parsed.mainPosition;
  const mode = adaptationMode(result, selected);
  const adapted = chooseAdaptedTraining(result, coreTraining);
  const adaptationApplied = signature(adapted.plan) !== signature(coreTraining);
  const coreSkills = [...(unified?.canonicalSkills ?? [])];
  const positionalSkills = buildPersonalizedSkillPlan(result, adapted.plan, {
    label: `adaptação ${selectedLabel}`,
    positionOverride: selected
  });
  const finalSkills = mergeSkills(coreSkills, positionalSkills, mode);
  const impetos = [...(unified?.canonicalImpetos ?? result.recommendedImpetos)];
  const primaryImpeto = unified?.primaryImpeto ?? impetos[0]?.name ?? null;
  const familiarity = positionFamiliarity(result, selected);
  const identityPreservation = corePreservation(coreTraining, adapted.plan);
  const fit = clamp(familiarity * .42 + identityPreservation * .3 + Math.min(100, 72 + adapted.gain * 4) * .28);
  const safety = statusFor(result, fit);
  const canonicalId = unified?.canonicalCardId ?? result.parsed.internalId;
  const coreSignature = unified?.lockSignature ?? `core-v3930-${stableHash(`${canonicalId}::${signature(coreTraining)}::${normalize(primaryImpeto)}`)}`;
  const positionSignature = `position-v3930-${stableHash([
    coreSignature,
    selected,
    signature(adapted.plan),
    finalSkills.map((item) => skillIdentityKey(item.name)).join(','),
    normalize(primaryImpeto)
  ].join('::'))}`;
  const changes = TRAINING_KEYS
    .filter((key) => Number(coreTraining[key] ?? 0) !== Number(adapted.plan[key] ?? 0))
    .map((key) => ({ key, label: TRAINING_LABELS[key], from: Number(coreTraining[key] ?? 0), to: Number(adapted.plan[key] ?? 0) }));
  const warnings: string[] = [];
  if (mode === 'FORA_DA_POSICAO') warnings.push('A posição não está entre as proficiências confirmadas da carta; o motor adaptou a execução sem apagar o DNA original.');
  if (result.unifiedPerformanceV3920?.positionFit.conflicts?.length) warnings.push(...result.unifiedPerformanceV3920.positionFit.conflicts.slice(0, 2));
  if (!adaptationApplied && selected !== natural) warnings.push('A ficha-base já era a opção mais eficiente dentro do limite seguro; nenhuma troca artificial de pontos foi forçada.');
  const reasons = [
    `Núcleo preservado em ${Math.round(identityPreservation)}%.`,
    adaptationApplied ? `${changes.length} grupo(s) ajustado(s) com orçamento idêntico.` : 'A receita-base foi mantida porque nenhuma troca segura aumentou a utilidade da posição.',
    `Três habilidades centrais da identidade foram preservadas e até duas vagas podem complementar a função em ${selectedLabel}.`,
    `O Ímpeto ${primaryImpeto ?? 'a confirmar'} permanece fixo para esta versão da carta e não muda ao trocar a posição.`,
    'A mesma carta na mesma posição sempre repete exatamente esta receita.'
  ];
  const summary = `${result.parsed.playerName}: núcleo fixo da carta + adaptação determinística para ${selectedLabel}. ${safety.statusLabel}.`;
  return {
    engineVersion: ADAPTIVE_POSITION_V3930_VERSION,
    philosophy: 'NUCLEO_DA_CARTA_FIXO_ADAPTACAO_DETERMINISTICA_POR_POSICAO',
    canonicalCardId: canonicalId,
    coreSignature,
    positionSignature,
    selectedPosition: selected,
    selectedPositionLabel: selectedLabel,
    naturalPosition: natural,
    naturalPositionLabel: POSITION_PT[natural],
    selectedPositionAffectsCoreRecipe: false,
    selectedPositionAffectsAppliedRecipe: true,
    deterministic: true,
    adaptationApplied,
    adaptationMode: mode,
    coreTraining,
    adaptedTraining: adapted.plan,
    exactBudget: trainingPlanTotalCost(adapted.plan) === trainingPlanTotalCost(coreTraining),
    corePreservation: identityPreservation,
    positionalGain: adapted.gain,
    maxShiftLevels: adapted.maxShift,
    changes,
    coreSkills,
    positionalSkills,
    finalSkills,
    primaryImpeto,
    impetoLockedByCard: true,
    impetos,
    positionFit: fit,
    ...safety,
    warnings: [...new Set(warnings)],
    reasons,
    summary
  };
}

export function applyAdaptivePositionV3930(result: AnalysisResult): AnalysisResult {
  const analysis = buildAdaptivePositionV3930(result);
  const training = analysis.adaptedTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const skills = analysis.finalSkills.map((item) => item.name);
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.20 — Motor Adaptativo por Carta v39.30 — ${result.parsed.playerName}`,
    positionLabel: `${analysis.selectedPositionLabel}: núcleo da carta preservado e adaptação controlada`,
    training,
    pointsUsed,
    note: analysis.summary,
    qualityScore: analysis.positionFit,
    adaptationLabel: 'DNA FIXO • POSIÇÃO ADAPTADA • ÍMPETO FIXO • SEM ALEATORIEDADE',
    highlights: [
      `Núcleo preservado: ${Math.round(analysis.corePreservation)}%.`,
      `Assinatura da posição: ${analysis.positionSignature}.`,
      `Ímpeto fixo: ${analysis.primaryImpeto ?? 'revisar leitura'}.`,
      analysis.statusLabel
    ],
    risks: analysis.warnings.slice(0, 4),
    efficiencyScore: analysis.positionFit,
    balanceScore: analysis.corePreservation,
    verdict: analysis.summary,
    tradeOffs: analysis.warnings,
    simulationsTested: Math.max(1, analysis.changes.length + analysis.finalSkills.length)
  };
  return {
    ...result,
    training,
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    recommendedSkills: skills.length ? skills : result.recommendedSkills,
    recommendedImpetos: analysis.impetos,
    buildVariants: [variant],
    buildName: variant.title,
    recommendationExplanation: [
      analysis.summary,
      ...analysis.reasons,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    strengths: [
      'A ficha agora se enquadra na posição escolhida sem destruir a essência da carta.',
      'O Ímpeto permanece fixo por versão da carta, evitando perda de giros por troca de posição.',
      'Repetir a mesma carta na mesma posição entrega exatamente o mesmo resultado.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    weaknesses: [
      ...analysis.warnings,
      ...result.weaknesses
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    note: `${analysis.summary} A posição pode alterar somente a camada adaptativa; o núcleo e o Ímpeto continuam presos à identidade da carta.`,
    adaptivePositionV3930: analysis
  };
}

export function restoreCanonicalInputBeforeV3930(result: AnalysisResult): AnalysisResult {
  const adaptive = result.adaptivePositionV3930;
  if (!adaptive) return result;
  return {
    ...result,
    training: clone(adaptive.coreTraining),
    recommendedSkills: adaptive.coreSkills.map((item) => item.name),
    recommendedImpetos: adaptive.impetos,
    adaptivePositionV3930: undefined
  };
}
