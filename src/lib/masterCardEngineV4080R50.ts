import type { AnalysisResult, PositionCode, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceEngine2027R108 } from './performanceEngine2027V4080R108';
import { trainingPlanTotalCost } from './trainingPlanCore';

export const MASTER_CARD_ENGINE_V4080_R50 = '40.80-r50-master-card-single-authority' as const;

type PermanentResource = { name: string | null; score: number; reason: string };

type MasterCardR50 = {
  engineVersion: typeof MASTER_CARD_ENGINE_V4080_R50;
  cardKey: string;
  naturalPosition: PositionCode;
  attackPosition: PositionCode;
  defencePosition: PositionCode;
  offensivePlaystyle: string | null;
  defensivePlaystyle: string | null;
  masterTraining: TrainingPlan;
  permanentSkills: string[];
  permanentImpeto: PermanentResource;
  resourcePolicy: 'PERMANENTE_POR_CARTA';
  collisionFingerprint: string;
  guarantees: {
    singleTrainingAuthority: true;
    positionChangeDoesNotRegenerateRareResources: true;
    exactBudget: boolean;
    nativeSkillDuplicationBlocked: true;
    dualPhasePreserved: true;
  };
  authorityMode: 'LEGACY_READ_ONLY';
};

type WithMaster = AnalysisResult & {
  masterCardV4080R50: MasterCardR50;
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceEngine2027R108?: PerformanceEngine2027R108;
};

function clean(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function canonicalIdentity(result: AnalysisResult): CanonicalCardIdentityR60 | null {
  return (result as WithMaster).canonicalCardIdentity2027R60 ?? null;
}

function extreme(result: AnalysisResult): PerformanceEngine2027R108 | null {
  return (result as WithMaster).performanceEngine2027R108 ?? null;
}

function cardKey(result: AnalysisResult) {
  const canonical = canonicalIdentity(result);
  if (canonical) return canonical.cardKey;
  const p = result.parsed;
  return [clean(p.playerName), clean(p.cardType), p.mainPosition, p.level ?? '', p.maxOverall ?? p.overall ?? ''].join('|');
}

function collisionFingerprint(result: AnalysisResult, plan: TrainingPlan) {
  const a = result.parsed.attributes;
  const p = result.parsed.physicalProfile;
  return [
    cardKey(result),
    result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? '',
    result.parsed.defensivePlaystyle ?? '',
    a.speed ?? 0,
    a.acceleration ?? 0,
    a.stamina ?? 0,
    a.ballControl ?? 0,
    a.finishing ?? 0,
    a.defensiveAwareness ?? 0,
    a.physicalContact ?? 0,
    p.legCoverageRadius ?? 0,
    p.armCoverageRadius ?? 0,
    p.jumpHeight ?? 0,
    JSON.stringify(plan)
  ].join('|');
}

/**
 * BM_R118_MASTER_READ_ONLY
 * BM_R109_MASTER
 * BM_R111_MASTER_DNA_GUARDS
 * r50 permanece por compatibilidade histórica e auditoria, mas NÃO escreve mais
 * result.training, recommendedSkills ou recommendedImpetos. A única escrita final
 * é feita por Final Decision Authority r118 depois do r80.
 */
export function applyMasterCardEngineV4080R50(input: AnalysisResult): AnalysisResult {
  const identity = canonicalIdentity(input);
  const signature = extreme(input);
  const advisoryTraining = signature?.winner.training ?? input.training;
  const budget = Number(input.trainingPointsTotal ?? trainingPlanTotalCost(advisoryTraining));
  const activeImpeto = input.parsed.impetos.find((item) => item.active !== false)?.name ?? null;

  const master: MasterCardR50 = {
    engineVersion: MASTER_CARD_ENGINE_V4080_R50,
    cardKey: cardKey(input),
    naturalPosition: input.parsed.mainPosition,
    attackPosition: identity?.attackPosition ?? input.bestPosition.code,
    defencePosition: identity?.defencePosition ?? input.bestPosition.code,
    offensivePlaystyle: identity?.offensivePlaystyle ?? input.parsed.offensivePlaystyle ?? input.parsed.playstyle ?? null,
    defensivePlaystyle: identity?.defensivePlaystyle ?? input.parsed.defensivePlaystyle ?? null,
    masterTraining: { ...advisoryTraining },
    permanentSkills: input.recommendedSkills.slice(0, 5),
    permanentImpeto: activeImpeto
      ? { name: activeImpeto, score: 100, reason: 'Ímpeto já aplicado à carta; preservado apenas como estado da carta.' }
      : { name: null, score: 0, reason: 'r50 não decide mais Ímpeto; decisão exclusiva do r80/r118.' },
    resourcePolicy: 'PERMANENTE_POR_CARTA',
    collisionFingerprint: collisionFingerprint(input, advisoryTraining),
    guarantees: {
      singleTrainingAuthority: true,
      positionChangeDoesNotRegenerateRareResources: true,
      exactBudget: trainingPlanTotalCost(advisoryTraining) === budget,
      nativeSkillDuplicationBlocked: true,
      dualPhasePreserved: true
    },
    authorityMode: 'LEGACY_READ_ONLY'
  };

  return {
    ...input,
    masterCardV4080R50: master,
    recommendationExplanation: [
      'Motor Mestre r50 está em modo somente-leitura: não pode mais reescrever ficha, Top 5 ou Ímpeto.',
      signature
        ? `Card Signature disponível como candidata final: resposta ${signature.winner.responseScore}/100 • sinergia ${signature.winner.synergyScore}/100.`
        : 'Card Signature ainda indisponível; r50 preserva apenas metadados para auditoria.',
      'Autoridade de escrita definitiva reservada ao r118 após a decisão permanente do r80.',
      ...input.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 96)
  } as WithMaster;
}
