import type { AnalysisResult, ImpetoRecommendation, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceEngine2027R108, PerformanceCandidateR108 } from './performanceEngine2027V4080R108';
import type { PermanentResources2027R80 } from './permanentResources2027V4080R80';
import { applyFinalCardAuthorityV4080R45 } from './finalCardAuthorityV4080R45';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';

export const FINAL_DECISION_AUTHORITY_2027_R118_VERSION = '40.80-r118-single-final-authority' as const;

export type FinalDecisionSourceR118 = 'CARD_SIGNATURE_R115' | 'EMERGENCY_R45';

export type FinalDecisionAuthority2027R118 = {
  version: typeof FINAL_DECISION_AUTHORITY_2027_R118_VERSION;
  authority: 'FINAL_SINGLE_WRITER';
  finalEngineLabel: 'Card Signature' | 'Emergency r45';
  trainingSource: FinalDecisionSourceR118;
  training: TrainingPlan;
  recommendedSkills: string[];
  currentImpeto: string | null;
  recommendedImpeto: string | null;
  impetoDecision: 'KEEP_CURRENT' | 'APPLY_RECOMMENDED' | 'NONE_SAFE';
  responseScore: number | null;
  synergyScore: number | null;
  confidence: number;
  dominantDna: string[];
  specialSkills: string[];
  fallbackReason: string | null;
  legacyPattern: {
    similarity: number;
    adjusted: boolean;
    reference: '8/8/8/12';
  };
  guards: {
    cardSignatureAvailable: boolean;
    readingCompleteEnough: boolean;
    exactBudget: boolean;
    r45EmergencyOnly: boolean;
    legacyMetricsReadOnly: true;
    r80OwnsTop5: boolean;
    r80OwnsImpeto: boolean;
    postAuthorityRewriteBlocked: true;
  };
};

type Carrier = AnalysisResult & {
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceEngine2027R108?: PerformanceEngine2027R108;
  permanentResources2027R80?: PermanentResources2027R80;
  finalDecisionAuthority2027R118?: FinalDecisionAuthority2027R118;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function attributeCoverage(result: AnalysisResult) {
  return Object.values(result.parsed.attributes ?? {}).map(Number).filter((value) => Number.isFinite(value) && value > 0).length;
}

function cardSignatureReady(result: Carrier) {
  const identity = result.canonicalCardIdentity2027R60;
  const extreme = result.performanceEngine2027R108;
  const budget = Number(result.trainingPointsTotal ?? result.parsed.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const minimumAttributes = result.parsed.mainPosition === 'GK' ? 5 : 10;
  return Boolean(
    identity &&
    extreme &&
    Number.isFinite(budget) && budget > 0 &&
    identity.identityConfidence >= 50 &&
    attributeCoverage(result) >= minimumAttributes &&
    extreme.winner.exactBudget &&
    trainingPlanTotalCost(extreme.winner.training) === budget
  );
}

function legacySimilarity(plan: TrainingPlan) {
  const reference = { shooting: 8, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 12 } as const;
  const distance =
    Math.abs(Number(plan.shooting ?? 0) - reference.shooting) +
    Math.abs(Number(plan.dexterity ?? 0) - reference.dexterity) +
    Math.abs(Number(plan.lowerBodyStrength ?? 0) - reference.lowerBodyStrength) +
    Math.abs(Number(plan.aerialStrength ?? 0) - reference.aerialStrength);
  return Math.round(clamp(100 - distance * 7.5) * 10) / 10;
}

function samePlan(left: TrainingPlan, right: TrainingPlan) {
  return TRAINING_KEYS.every((key) => Number(left[key] ?? 0) === Number(right[key] ?? 0));
}

function pickCardSignatureCandidate(extreme: PerformanceEngine2027R108) {
  const winner = extreme.winner;
  const similarity = legacySimilarity(winner.training);
  if (similarity < 92 || extreme.improvementVsIncoming >= 0.5) {
    return { candidate: winner, adjusted: false };
  }

  const alternative = extreme.alternatives
    .filter((item) =>
      item.exactBudget &&
      legacySimilarity(item.training) < 85 &&
      item.responseScore >= winner.responseScore - 2 &&
      item.synergyScore >= winner.synergyScore - 2 &&
      item.totalScore >= winner.totalScore - 1.5
    )
    .sort((a, b) =>
      b.totalScore - a.totalScore ||
      b.responseScore - a.responseScore ||
      b.synergyScore - a.synergyScore
    )[0];

  return { candidate: alternative ?? winner, adjusted: Boolean(alternative) };
}

function top5FromR80(result: Carrier) {
  const resources = result.permanentResources2027R80;
  if (!resources) return [];
  const owned = new Set([
    ...(result.parsed.nativeSkills ?? []),
    ...(result.parsed.additionalSkills ?? []),
    ...(result.parsed.specialSkills ?? [])
  ].map(skillIdentityKey));
  const seen = new Set<string>();
  return resources.permanentTop5.filter((skill) => {
    const key = skillIdentityKey(skill);
    if (!key || owned.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function activeImpetoName(result: Carrier) {
  return result.parsed.impetos?.find((item) => item.active !== false && !/^sem\s+(?:ímpeto|impeto|booster)/i.test(item.name))?.name ?? null;
}

function impetoFromR80(result: Carrier): ImpetoRecommendation[] {
  const resources = result.permanentResources2027R80;
  const winner = resources?.permanentImpeto;
  const active = activeImpetoName(result);
  // Recurso já aplicado pertence à identidade da carta, mas não é uma nova recomendação.
  if (!winner || active || !resources?.shouldSpendImpeto) return [];

  const existing = result.recommendedImpetos.find((item) => normalize(item.name) === normalize(winner.name));
  if (existing) return [{ ...existing, score: winner.score, confidence: resources.confidence }];

  return [{
    name: winner.name,
    tier: 'ideal',
    attributes: [],
    reason: winner.reasons[0] ?? 'Ímpeto permanente aprovado pelo r80 para a identidade completa da carta.',
    score: winner.score,
    confidence: resources.confidence,
    official: true,
    evidence: winner.reasons
  }];
}

function emergencyReason(result: Carrier) {
  if (!result.canonicalCardIdentity2027R60) return 'Identidade canônica r60 indisponível.';
  if (!result.performanceEngine2027R108) return 'Card Signature indisponível para esta leitura.';
  const minimumAttributes = result.parsed.mainPosition === 'GK' ? 5 : 10;
  if (attributeCoverage(result) < minimumAttributes) return `Leitura incompleta: apenas ${attributeCoverage(result)} atributos utilizáveis.`;
  if (result.canonicalCardIdentity2027R60.identityConfidence < 50) return `Identidade abaixo do mínimo seguro (${Math.round(result.canonicalCardIdentity2027R60.identityConfidence)}%).`;
  return 'Card Signature não fechou o orçamento confirmado; fallback de emergência acionado.';
}

/**
 * BM_R118_SINGLE_FINAL_AUTHORITY
 * Esta camada NÃO otimiza uma nova ficha. Ela apenas sela uma decisão já calculada:
 * r60 define identidade; Card Signature/r108 calcula a progressão; r80 decide Top 5/Ímpeto.
 * Motores v38/v39/v40, r70/r107/r109 e r45 permanecem diagnósticos; r45 só executa em leitura incompleta.
 */
export function applyFinalDecisionAuthority2027R118(input: AnalysisResult): AnalysisResult {
  const carrier = input as Carrier;
  const ready = cardSignatureReady(carrier);
  const extreme = carrier.performanceEngine2027R108;
  const identity = carrier.canonicalCardIdentity2027R60;
  const resources = carrier.permanentResources2027R80;
  const budget = Number(input.trainingPointsTotal ?? input.parsed.trainingPointsTotal ?? trainingPlanTotalCost(input.training));

  let working: AnalysisResult = input;
  let source: FinalDecisionSourceR118 = 'CARD_SIGNATURE_R115';
  let finalCandidate: PerformanceCandidateR108 | null = null;
  let legacyAdjusted = false;
  let fallbackReason: string | null = null;

  if (ready && extreme) {
    const selected = pickCardSignatureCandidate(extreme);
    finalCandidate = selected.candidate;
    legacyAdjusted = selected.adjusted;
  } else {
    source = 'EMERGENCY_R45';
    fallbackReason = emergencyReason(carrier);
    working = applyFinalCardAuthorityV4080R45(input);
  }

  const finalTraining = finalCandidate?.training ?? working.training;
  const recommendedSkills = top5FromR80(carrier);
  const currentImpeto = activeImpetoName(carrier);
  const recommendedImpetos = impetoFromR80(carrier);
  const impetoDecision: FinalDecisionAuthority2027R118['impetoDecision'] = currentImpeto
    ? 'KEEP_CURRENT'
    : recommendedImpetos.length
      ? 'APPLY_RECOMMENDED'
      : 'NONE_SAFE';
  const used = trainingPlanTotalCost(finalTraining);
  const exactBudget = Number.isFinite(budget) && used === budget;
  const confidence = Math.round(clamp(
    (identity?.identityConfidence ?? 45) * .55 +
    (extreme?.confidence ?? 45) * .3 +
    (resources?.confidence ?? 45) * .15
  ) * 10) / 10;

  const analysis: FinalDecisionAuthority2027R118 = {
    version: FINAL_DECISION_AUTHORITY_2027_R118_VERSION,
    authority: 'FINAL_SINGLE_WRITER',
    finalEngineLabel: source === 'CARD_SIGNATURE_R115' ? 'Card Signature' : 'Emergency r45',
    trainingSource: source,
    training: { ...finalTraining },
    recommendedSkills,
    currentImpeto,
    recommendedImpeto: recommendedImpetos[0]?.name ?? null,
    impetoDecision,
    responseScore: finalCandidate?.responseScore ?? extreme?.winner.responseScore ?? null,
    synergyScore: finalCandidate?.synergyScore ?? extreme?.winner.synergyScore ?? null,
    confidence,
    dominantDna: identity?.dominantDna.map(String) ?? [],
    specialSkills: [...(input.parsed.specialSkills ?? [])],
    fallbackReason,
    legacyPattern: {
      similarity: legacySimilarity(finalTraining),
      adjusted: legacyAdjusted,
      reference: '8/8/8/12'
    },
    guards: {
      cardSignatureAvailable: Boolean(extreme),
      readingCompleteEnough: ready,
      exactBudget,
      r45EmergencyOnly: source === 'CARD_SIGNATURE_R115' || !ready,
      legacyMetricsReadOnly: true,
      r80OwnsTop5: Boolean(resources) && recommendedSkills.every((skill, index) => skillIdentityKey(skill) === skillIdentityKey(resources?.permanentTop5[index] ?? '')),
      r80OwnsImpeto: currentImpeto
        ? resources?.shouldSpendImpeto === false && normalize(resources?.permanentImpeto?.name) === normalize(currentImpeto)
        : (recommendedImpetos[0]?.name ?? null) === (resources?.shouldSpendImpeto ? resources?.permanentImpeto?.name ?? null : null),
      postAuthorityRewriteBlocked: true
    }
  };

  const result: AnalysisResult = {
    ...working,
    training: { ...finalTraining },
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, Number.isFinite(budget) ? budget - used : 0),
    recommendedSkills,
    recommendedImpetos,
    finalDecisionAuthority2027R118: analysis,
    recommendationExplanation: [
      source === 'CARD_SIGNATURE_R115'
        ? `Autoridade Final r118: Card Signature selou a ficha; nenhum motor legado pode reescrever result.training.`
        : `Autoridade Final r118: Emergency r45 usado somente porque a leitura está incompleta. ${fallbackReason ?? ''}`.trim(),
      `Top 5 final vem exclusivamente do r80 (${recommendedSkills.length}/5).`,
      currentImpeto
        ? `Ímpeto atual preservado pelo r80: ${currentImpeto}; ele não é repetido como nova recomendação.`
        : recommendedImpetos[0]
          ? `Ímpeto final vem exclusivamente do r80: ${recommendedImpetos[0].name}.`
          : 'Ímpeto final: nenhum recurso seguro aprovado pelo r80; recomendações antigas foram bloqueadas.',
      legacyAdjusted
        ? 'Trava anti-receita histórica: o padrão 8/8/8/12 foi rejeitado porque não provou ganho suficiente; uma alternativa Card Signature equivalente foi escolhida.'
        : `Trava anti-receita histórica: similaridade ${analysis.legacyPattern.similarity}/100; nenhuma receita antiga recebeu autoridade automática.`,
      'Motores v38/v39/v40, r70, r107 e r109 permanecem somente como diagnóstico/benchmark após a decisão final.',
      ...working.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 120)
  } as AnalysisResult;

  if (samePlan(result.training, finalTraining)) return result;
  return result;
}
