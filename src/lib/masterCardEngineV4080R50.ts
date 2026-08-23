import type { AnalysisResult, PositionCode, TrainingPlan } from './analyzerDomain';
import { trainingPlanTotalCost } from './trainingPlanCore';
import { applyFinalCardAuthorityV4080R45 } from './finalCardAuthorityV4080R45';
import { enforceComplementarySkillIntegrity, synchronizeFinalSkillIntegrity } from './skillIntegrity';
import { applyDefinitiveAdditionalSkillsV600R15 } from './definitiveAdditionalSkillsV600R15';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceFoundation2027R60 } from './performanceFoundation2027V4080R60';
import type { PerformanceEngine2027R70 } from './performanceEngine2027V4080R70';
import type { PerformanceEngine2027R107 } from './performanceEngine2027V4080R107';
import type { PerformanceEngine2027R108 } from './performanceEngine2027V4080R108';

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
};

type WithMaster = AnalysisResult & {
  masterCardV4080R50: MasterCardR50;
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceFoundation2027R60?: PerformanceFoundation2027R60;
  performanceEngine2027R70?: PerformanceEngine2027R70;
  performanceEngine2027R107?: PerformanceEngine2027R107;
  performanceEngine2027R108?: PerformanceEngine2027R108;
};

function clean(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function canonicalIdentity(result: AnalysisResult): CanonicalCardIdentityR60 | null {
  return (result as AnalysisResult & { canonicalCardIdentity2027R60?: CanonicalCardIdentityR60 }).canonicalCardIdentity2027R60 ?? null;
}

function cardKey(result: AnalysisResult) {
  const canonical = canonicalIdentity(result);
  if (canonical) return canonical.cardKey;
  const p = result.parsed;
  return [clean(p.playerName), clean(p.cardType), p.mainPosition, p.level ?? '', p.maxOverall ?? p.overall ?? ''].join('|');
}

function attackPosition(result: AnalysisResult): PositionCode {
  return canonicalIdentity(result)?.attackPosition ?? result.bestPosition.code;
}

function defencePosition(result: AnalysisResult): PositionCode {
  return canonicalIdentity(result)?.defencePosition ?? result.bestPosition.code;
}

function stableImpeto(result: AnalysisResult): PermanentResource {
  const current = result.parsed.impetos.find((item) => item.active !== false)?.name ?? null;
  if (current) return { name: current, score: 100, reason: 'Ímpeto já aplicado à carta é preservado; recurso raro não é trocado automaticamente por posição.' };
  const ranked = [...result.recommendedImpetos].filter((item) => item.tier !== 'evitar')
    .sort((a,b) => Number(b.score ?? 0) - Number(a.score ?? 0));
  const winner = ranked[0];
  return winner
    ? { name: winner.name, score: Number(winner.score ?? 0), reason: 'Melhor Ímpeto global da carta após ficha Mestre e integridade das habilidades.' }
    : { name: null, score: 0, reason: 'Nenhum Ímpeto confirmado com segurança; não gastar recurso raro.' };
}

function collisionFingerprint(result: AnalysisResult, plan: TrainingPlan) {
  const a = result.parsed.attributes;
  const p = result.parsed.physicalProfile;
  return [
    cardKey(result), result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? '', result.parsed.defensivePlaystyle ?? '',
    a.speed ?? 0, a.acceleration ?? 0, a.stamina ?? 0, a.ballControl ?? 0, a.lowPass ?? 0,
    a.finishing ?? 0, a.defensiveAwareness ?? 0, a.physicalContact ?? 0,
    p.legCoverageRadius ?? 0, p.armCoverageRadius ?? 0, p.jumpHeight ?? 0,
    JSON.stringify(plan)
  ].join('|');
}

function average(values: Array<number | null | undefined>) {
  const safe = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
}

function preservesPermanentCardDNA(result: AnalysisResult, plan: TrainingPlan) {
  const a = result.parsed.attributes;
  const technicalCarry = average([
    a.ballControl,
    a.dribbling,
    a.tightPossession,
    a.balance,
    a.acceleration
  ]);
  const finishing = average([
    a.finishing,
    a.offensiveAwareness,
    a.kickingPower
  ]);
  const creation = average([
    a.lowPass,
    a.loftedPass,
    a.ballControl
  ]);

  const technicalDNA =
    technicalCarry >= 88 &&
    technicalCarry >= Math.max(finishing, creation) + 3;

  if (technicalDNA) {
    const technicalInvestment =
      Number(plan.dribbling ?? 0) + Number(plan.dexterity ?? 0);
    const creationInvestment =
      Number(plan.shooting ?? 0) + Number(plan.passing ?? 0);
    const physicalFinishInvestment =
      Number(plan.shooting ?? 0) + Number(plan.aerialStrength ?? 0);

    if (
      technicalInvestment < creationInvestment ||
      technicalInvestment < physicalFinishInvestment
    ) return false;
  }

  return true;
}


function applyR108WinnerInsideMaster(result: AnalysisResult): { result: AnalysisResult; applied: boolean } {
  const analysis = (result as AnalysisResult & { performanceEngine2027R108?: PerformanceEngine2027R108 }).performanceEngine2027R108;
  if (!analysis) return { result, applied: false };
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const candidate = analysis.winner.training;
  const canApply =
    analysis.guards.exactBudget &&
    analysis.guards.masterEngineIsOnlyWriter &&
    analysis.guards.overallIgnored &&
    analysis.guards.formationIndependent &&
    analysis.guards.positionSelectionDoesNotRewriteCore &&
    analysis.guards.fatalBottlenecksControlled &&
    analysis.guards.staminaProtected &&
    analysis.guards.wasteControlled &&
    analysis.guards.synergyFirst &&
    analysis.guards.antiOverallSpread &&
    analysis.confidence >= 50 &&
    analysis.winner.synergyScore >= 68 &&
    analysis.winner.responseScore >= 66 &&
    trainingPlanTotalCost(candidate) === budget;
  if (!canApply) return { result, applied: false };
  return {
    applied: true,
    result: {
      ...result,
      training: { ...candidate },
      trainingPointsUsed: trainingPlanTotalCost(candidate),
      trainingPointsRemaining: 0,
      recommendationExplanation: [
        `Motor Mestre aplicou Extreme Gameplay r108 (${analysis.winner.totalScore}/100; sinergia ${analysis.winner.synergyScore}; resposta ${analysis.winner.responseScore}).`,
        ...result.recommendationExplanation
      ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,110)
    }
  };
}


function applyR107WinnerInsideMaster(result: AnalysisResult): { result: AnalysisResult; applied: boolean } {
  const analysis = (result as AnalysisResult & { performanceEngine2027R107?: PerformanceEngine2027R107 }).performanceEngine2027R107;
  if (!analysis) return { result, applied: false };
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const candidate = analysis.winner.training;
  const canApply =
    analysis.guards.exactBudget &&
    analysis.guards.masterEngineIsOnlyWriter &&
    analysis.guards.overallIgnored &&
    analysis.guards.formationIndependent &&
    analysis.guards.correctGkMapping &&
    analysis.guards.dnaProtected &&
    analysis.guards.staminaBalanced &&
    analysis.confidence >= 54 &&
    analysis.winner.totalScore >= 70 &&
    trainingPlanTotalCost(candidate) === budget;
  if (!canApply) return { result, applied: false };
  return {
    applied: true,
    result: {
      ...result,
      training: { ...candidate },
      trainingPointsUsed: trainingPlanTotalCost(candidate),
      trainingPointsRemaining: 0,
      recommendationExplanation: [
        `Motor Mestre aplicou Ficha Quality r107 (${analysis.winner.totalScore}/100; ${analysis.winner.profile}; ${analysis.winner.projectedStamina} stamina projetada).`,
        ...result.recommendationExplanation
      ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,96)
    }
  };
}

function applyR70WinnerInsideMaster(result: AnalysisResult): AnalysisResult {
  const analysis = (result as AnalysisResult & { performanceEngine2027R70?: PerformanceEngine2027R70 }).performanceEngine2027R70;
  if (!analysis) return result;
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const candidate = analysis.winner.training;
  const canApply =
    analysis.guards.exactBudget &&
    analysis.guards.staminaProtected &&
    analysis.confidence >= 62 &&
    trainingPlanTotalCost(candidate) === budget &&
    preservesPermanentCardDNA(result, candidate) &&
    analysis.improvementVsIncoming >= 0.3;
  if (!canApply) return result;
  return {
    ...result,
    training: { ...candidate },
    trainingPointsUsed: trainingPlanTotalCost(candidate),
    trainingPointsRemaining: 0,
    recommendationExplanation: [
      `Motor Mestre aplicou a candidata r70 (${analysis.winner.totalScore}/100; +${analysis.improvementVsIncoming} estimado).`,
      ...result.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,88)
  };
}

/**
 * r50 é a ÚNICA autoridade mutável no final do pipeline.
 * Motores históricos anteriores continuam apenas como sinais/benchmark.
 */
export function applyMasterCardEngineV4080R50(input: AnalysisResult): AnalysisResult {
  let result = applyFinalCardAuthorityV4080R45(input);
  const extremeR108 = applyR108WinnerInsideMaster(result);
  result = extremeR108.result;
  if (!extremeR108.applied) {
    const qualityR107 = applyR107WinnerInsideMaster(result);
    result = qualityR107.result;
    if (!qualityR107.applied) result = applyR70WinnerInsideMaster(result);
  }
  result = applyDefinitiveAdditionalSkillsV600R15(result);
  result = enforceComplementarySkillIntegrity(result);
  result = synchronizeFinalSkillIntegrity(result);

  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const permanentSkills = result.recommendedSkills.slice(0, 5);
  const impeto = stableImpeto(result);
  const master: MasterCardR50 = {
    engineVersion: MASTER_CARD_ENGINE_V4080_R50,
    cardKey: cardKey(result),
    naturalPosition: result.parsed.mainPosition,
    attackPosition: attackPosition(result),
    defencePosition: defencePosition(result),
    offensivePlaystyle: canonicalIdentity(result)?.offensivePlaystyle ?? result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null,
    defensivePlaystyle: canonicalIdentity(result)?.defensivePlaystyle ?? result.parsed.defensivePlaystyle ?? null,
    masterTraining: result.training,
    permanentSkills,
    permanentImpeto: impeto,
    resourcePolicy: 'PERMANENTE_POR_CARTA',
    collisionFingerprint: collisionFingerprint(result, result.training),
    guarantees: {
      singleTrainingAuthority: true,
      positionChangeDoesNotRegenerateRareResources: true,
      exactBudget: trainingPlanTotalCost(result.training) === budget,
      nativeSkillDuplicationBlocked: true,
      dualPhasePreserved: true
    }
  };

  return {
    ...result,
    masterCardV4080R50: master,
    recommendationExplanation: [
      'Motor Mestre r50 + Fundação r60: uma carta = uma identidade canônica permanente.',
      canonicalIdentity(result) ? `Fundação 2027 ativa com confiança ${Math.round(canonicalIdentity(result)?.identityConfidence ?? 0)}%.` : 'Fundação 2027 ainda indisponível para esta leitura.',
      `Ficha Mestre travada em ${trainingPlanTotalCost(result.training)}/${budget} pontos.`,
      (result as AnalysisResult & { performanceEngine2027R108?: PerformanceEngine2027R108 }).performanceEngine2027R108 ? `Extreme Gameplay r108 integrado: ${(result as AnalysisResult & { performanceEngine2027R108?: PerformanceEngine2027R108 }).performanceEngine2027R108?.winner.totalScore}/100.` : ((result as AnalysisResult & { performanceEngine2027R107?: PerformanceEngine2027R107 }).performanceEngine2027R107 ? `Ficha Quality r107 fallback: ${(result as AnalysisResult & { performanceEngine2027R107?: PerformanceEngine2027R107 }).performanceEngine2027R107?.winner.totalScore}/100.` : ((result as AnalysisResult & { performanceEngine2027R70?: PerformanceEngine2027R70 }).performanceEngine2027R70 ? `Performance r70 fallback: ${(result as AnalysisResult & { performanceEngine2027R70?: PerformanceEngine2027R70 }).performanceEngine2027R70?.winner.totalScore}/100.` : 'Performance especializada ainda indisponível.')),
      `Ataque: ${master.attackPosition} • ${master.offensivePlaystyle ?? 'estilo não confirmado'}.`,
      `Defesa: ${master.defencePosition} • ${master.defensivePlaystyle ?? 'estilo defensivo ainda não confirmado'}.`,
      impeto.name ? `Ímpeto permanente: ${impeto.name}; não trocar automaticamente por mudança de posição.` : 'Ímpeto: aguardar confirmação segura antes de gastar recurso raro.',
      ...result.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,64)
  } as WithMaster;
}
