import type { ImpetoRecommendation } from './analyzerDomain';
import type { FinalAdditionalSkillSetR457 } from './finalAdditionalSkillSetR457';
import type { FinalImpetoDecisionR457, ImpetoActionR457 } from './finalImpetoDecisionR457';

export const FINAL_RECOMMENDATION_AUTHORITY_R507_VERSION = '40.80-r507-single-public-recommendation-authority-v1' as const;

export type PublicImpetoDecisionR507 =
  | 'KEEP_CURRENT'
  | 'RECOMMEND_NEW'
  | 'REVIEW_SLOT'
  | 'NO_SAFE_IMPETO'
  | 'SLOT_NOT_AVAILABLE';

export type PublicImpetoProjectionR507 = {
  current: string | null;
  decision: PublicImpetoDecisionR507;
  recommendedImpeto: string | null;
  ideal: string | null;
  idealScore: number;
  idealConfidence: number;
  reason: string;
  slotStatus: string;
  recommendations: ImpetoRecommendation[];
  existingImpetoNeverRepeated: boolean;
  automaticSpendAuthorized: false;
  attributeSource: FinalImpetoDecisionR457['attributeSource'];
};

export type FinalRecommendationProjectionR507 = {
  version: typeof FINAL_RECOMMENDATION_AUTHORITY_R507_VERSION;
  skills: string[];
  impeto: PublicImpetoProjectionR507;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function publicDecision(action: ImpetoActionR457): PublicImpetoDecisionR507 {
  if (action === 'KEEP_CURRENT') return 'KEEP_CURRENT';
  if (action === 'ADD_IF_AVAILABLE' || action === 'REPLACE_IF_ALLOWED') return 'RECOMMEND_NEW';
  if (action === 'REVIEW_SLOT') return 'REVIEW_SLOT';
  if (action === 'SLOT_NOT_AVAILABLE') return 'SLOT_NOT_AVAILABLE';
  return 'NO_SAFE_IMPETO';
}

function candidateConfidence(decision: FinalImpetoDecisionR457, name: string | null) {
  if (!name) return 0;
  return decision.candidates.find((item) => normalize(item.name) === normalize(name))?.confidence ?? 0;
}

function actionableRecommendations(decision: FinalImpetoDecisionR457): ImpetoRecommendation[] {
  const actionable = decision.action === 'ADD_IF_AVAILABLE' || decision.action === 'REPLACE_IF_ALLOWED';
  if (!actionable || !decision.technicalIdeal) return [];

  const currentKey = normalize(decision.current);
  const idealKey = normalize(decision.technicalIdeal);
  const candidates = decision.candidates.filter((item) => normalize(item.name) !== currentKey);
  const ordered = [
    ...candidates.filter((item) => normalize(item.name) === idealKey),
    ...candidates.filter((item) => normalize(item.name) !== idealKey),
  ];

  return ordered.slice(0, 3).map((item, index) => ({
    name: item.name,
    tier: index === 0 ? 'ideal' : 'alternativo',
    attributes: [],
    reason: item.explanation,
    score: item.totalScore,
    confidence: item.confidence,
    official: true,
    evidence: [
      `Fonte: ${decision.attributeSource}.`,
      `Encaixe funcional ${item.functionalFit}; posição ${item.positionFit}; suporte de atributos ${item.attributeSupport}.`,
    ],
    warnings: [
      'Nenhum gasto é autorizado automaticamente.',
      'O BuildMaster não inventa efeito numérico oficial de Ímpeto quando esse efeito não está verificado.',
    ],
  }));
}

export function projectFinalRecommendationsR507(
  skills: FinalAdditionalSkillSetR457,
  impetoDecision: FinalImpetoDecisionR457,
): FinalRecommendationProjectionR507 {
  const recommendations = actionableRecommendations(impetoDecision);
  const decision = publicDecision(impetoDecision.action);
  const ideal = impetoDecision.technicalIdeal;
  const recommendedImpeto = decision === 'RECOMMEND_NEW' ? ideal : null;
  const currentKey = normalize(impetoDecision.current);
  const existingImpetoNeverRepeated = !currentKey || recommendations.every((item) => normalize(item.name) !== currentKey);

  return {
    version: FINAL_RECOMMENDATION_AUTHORITY_R507_VERSION,
    skills: [...skills.finalSkills],
    impeto: {
      current: impetoDecision.current,
      decision,
      recommendedImpeto,
      ideal,
      idealScore: impetoDecision.technicalIdealScore,
      idealConfidence: candidateConfidence(impetoDecision, ideal),
      reason: impetoDecision.reason,
      slotStatus: impetoDecision.slotStatus,
      recommendations,
      existingImpetoNeverRepeated,
      automaticSpendAuthorized: false,
      attributeSource: impetoDecision.attributeSource,
    },
  };
}
