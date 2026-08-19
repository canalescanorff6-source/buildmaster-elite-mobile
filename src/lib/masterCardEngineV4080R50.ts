import type { AnalysisResult, PositionCode, TrainingPlan } from './analyzerDomain';
import { trainingPlanTotalCost } from './trainingPlanCore';
import { applyFinalCardAuthorityV4080R45 } from './finalCardAuthorityV4080R45';
import { enforceComplementarySkillIntegrity, synchronizeFinalSkillIntegrity } from './skillIntegrity';
import { applyDefinitiveAdditionalSkillsV600R15 } from './definitiveAdditionalSkillsV600R15';

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

type WithMaster = AnalysisResult & { masterCardV4080R50: MasterCardR50 };

function clean(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function cardKey(result: AnalysisResult) {
  const p = result.parsed;
  return [clean(p.playerName), clean(p.cardType), p.mainPosition, p.level ?? '', p.maxOverall ?? p.overall ?? ''].join('|');
}

function attackPosition(result: AnalysisResult): PositionCode {
  return result.bestPosition.code;
}

function defencePosition(result: AnalysisResult): PositionCode {
  // Até a UI fornecer uma posição defensiva explícita, preserva a posição escolhida.
  // O estilo defensivo já é independente e entra no DNA sem inventar deslocamento de posição.
  return result.bestPosition.code;
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

/**
 * r50 é a ÚNICA autoridade mutável no final do pipeline.
 * Motores históricos anteriores continuam apenas como sinais/benchmark.
 */
export function applyMasterCardEngineV4080R50(input: AnalysisResult): AnalysisResult {
  let result = applyFinalCardAuthorityV4080R45(input);
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
    offensivePlaystyle: result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null,
    defensivePlaystyle: result.parsed.defensivePlaystyle ?? null,
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
      'Motor Mestre r50: uma carta = uma identidade permanente.',
      `Ficha Mestre travada em ${trainingPlanTotalCost(result.training)}/${budget} pontos.`,
      `Ataque: ${master.attackPosition} • ${master.offensivePlaystyle ?? 'estilo não confirmado'}.`,
      `Defesa: ${master.defencePosition} • ${master.defensivePlaystyle ?? 'estilo defensivo ainda não confirmado'}.`,
      impeto.name ? `Ímpeto permanente: ${impeto.name}; não trocar automaticamente por mudança de posição.` : 'Ímpeto: aguardar confirmação segura antes de gastar recurso raro.',
      ...result.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,64)
  } as WithMaster;
}
