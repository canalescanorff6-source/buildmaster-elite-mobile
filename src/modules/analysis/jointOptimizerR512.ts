import type { FinalAdditionalSkillSetR457 } from '../../lib/finalAdditionalSkillSetR457';
import type { FinalImpetoDecisionR457 } from '../../lib/finalImpetoDecisionR457';
import type { ProjectedPlayerStateR504 } from './projectedPlayerStateR504';
import {
  analyzePossessionR511,
  POSSESSION_ACTION_IDS_R511,
  type PossessionEngineResultR511,
  type PossessionUsageFunctionR511,
} from './possessionEngineR511';

export const JOINT_OPTIMIZER_R512_VERSION = '40.80-r512-joint-optimizer-v2-shadow-v1' as const;

export const JOINT_OPTIMIZER_R512_CALIBRATION = {
  status: 'SHADOW_UNCALIBRATED',
  provenance: 'R457_FRONTIER_PLUS_R510_R511_DIAGNOSTICS',
  officialGameData: false,
  certifiedForFinalWrite: false,
  productionAuthority: 'UNCHANGED_R507_CLEAN_SLATE_SINGLE_WRITER',
  calibrationRequired: ['GOLDEN_CARD_LAB', 'PERTURBATION_MATRIX', 'REAL_MATCH_DATA'],
} as const;

export type JointOptimizerCandidateR512 = {
  id: string;
  trainingCacheKey: number | null;
  baseScore: number;
  rankedScore: number;
  state: ProjectedPlayerStateR504;
  usageFunction: PossessionUsageFunctionR511;
  skills: FinalAdditionalSkillSetR457;
  impeto: FinalImpetoDecisionR457;
};

export type JointOptimizerInputR512 = {
  candidates: JointOptimizerCandidateR512[];
  equivalenceBand: number;
  topN: number;
};

export type JointResidualBottleneckR512 = {
  action: typeof POSSESSION_ACTION_IDS_R511[number];
  priority: number;
  score: number;
  coverage: number;
  residualGap: number;
  severity: number;
};

export type JointCandidateAuditR512 = {
  id: string;
  trainingCacheKey: number | null;
  baseScore: number;
  baseScoreDelta: number;
  rankedScore: number;
  possessionScore: number;
  possessionCoverage: number;
  residualSeverity: number;
  residualBottlenecks: JointResidualBottleneckR512[];
  skillSetScore: number;
  skillAverage: number;
  skillsPostBuild: boolean;
  skillIntegrity: boolean;
  impetoScore: number;
  impetoPostBuild: boolean;
  impetoAmbiguous: boolean;
  automaticSpendAuthorized: false;
  withinEquivalenceBand: boolean;
  frontierEligible: boolean;
  possession: PossessionEngineResultR511;
};

export type JointOptimizerResultR512 = {
  version: typeof JOINT_OPTIMIZER_R512_VERSION;
  mode: 'SHADOW_READ_ONLY';
  calibration: typeof JOINT_OPTIMIZER_R512_CALIBRATION;
  certification: 'OPTIMAL_WITHIN_MODEL_FRONTIER_UNCALIBRATED' | 'NOT_RUN';
  productionAuthorityChanged: false;
  globalRealGameOptimality: false;
  equivalenceBand: number;
  exactBaseWinnerId: string | null;
  shadowWinnerId: string | null;
  equivalentCandidates: number;
  paretoCandidates: number;
  topN: JointCandidateAuditR512[];
  stability: {
    level: 'HIGH_SINGLE_FRONTIER' | 'LOW_EQUIVALENT_FRONTIER' | 'NOT_RUN';
    equivalentCandidateIds: string[];
    winnerBaseGap: number | null;
    shadowVsExactBaseDelta: number | null;
    reason: string;
  };
  limitation: string;
};

function finite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function skillAverageR512(skills: FinalAdditionalSkillSetR457): number {
  const count = Math.max(1, skills.finalSkills.length);
  return finite(skills.finalSetScore) / count;
}

function skillsPostBuildR512(skills: FinalAdditionalSkillSetR457): boolean {
  return skills.actionStateSource === 'PROJECTED_POST_BUILD_ACTIONS';
}

function skillIntegrityR512(skills: FinalAdditionalSkillSetR457): boolean {
  return Boolean(
    skillsPostBuildR512(skills)
    && skills.exactFive
    && skills.officialOnly
    && skills.roleCompatible
    && skills.nativeSpecialDuplicatesBlocked
    && skills.deterministic,
  );
}

function impetoPostBuildR512(impeto: FinalImpetoDecisionR457): boolean {
  return impeto.attributeSource === 'PROJECTED_POST_BUILD';
}

function residualBottlenecksR512(
  possession: PossessionEngineResultR511,
): JointResidualBottleneckR512[] {
  return POSSESSION_ACTION_IDS_R511.map((action) => {
    const row = possession.actionScores[action];
    const residualGap = Math.max(0, 100 - clamp(row.score));
    const priorityShare = clamp(row.priority, 0, 5) / 5;
    const coverage = clamp(row.coverage, 0, 1);
    const severity = residualGap * priorityShare * coverage;
    return {
      action,
      priority: row.priority,
      score: round3(row.score),
      coverage: round3(row.coverage),
      residualGap: round3(residualGap),
      severity: round3(severity),
    };
  }).sort((left, right) =>
    right.severity - left.severity
    || right.priority - left.priority
    || left.action.localeCompare(right.action),
  );
}

function residualSeverityR512(rows: JointResidualBottleneckR512[]): number {
  if (!rows.length) return 0;
  const relevant = rows.slice(0, Math.min(5, rows.length));
  return round3(relevant.reduce((sum, row) => sum + row.severity, 0) / relevant.length);
}

function dominatesR512(left: JointCandidateAuditR512, right: JointCandidateAuditR512): boolean {
  if (!left.frontierEligible || !right.frontierEligible) return false;

  const noWorse =
    left.baseScore >= right.baseScore
    && left.rankedScore >= right.rankedScore
    && left.possessionScore >= right.possessionScore
    && left.skillAverage >= right.skillAverage
    && left.impetoScore >= right.impetoScore
    && left.residualSeverity <= right.residualSeverity;

  if (!noWorse) return false;

  return left.baseScore > right.baseScore
    || left.rankedScore > right.rankedScore
    || left.possessionScore > right.possessionScore
    || left.skillAverage > right.skillAverage
    || left.impetoScore > right.impetoScore
    || left.residualSeverity < right.residualSeverity;
}

function shadowOrderR512(left: JointCandidateAuditR512, right: JointCandidateAuditR512): number {
  return left.residualSeverity - right.residualSeverity
    || right.possessionScore - left.possessionScore
    || right.rankedScore - left.rankedScore
    || right.skillAverage - left.skillAverage
    || right.impetoScore - left.impetoScore
    || right.baseScore - left.baseScore
    || left.id.localeCompare(right.id);
}

function topNAuditOrderR512(left: JointCandidateAuditR512, right: JointCandidateAuditR512): number {
  if (left.withinEquivalenceBand !== right.withinEquivalenceBand) {
    return left.withinEquivalenceBand ? -1 : 1;
  }
  return shadowOrderR512(left, right);
}

export function analyzeJointFrontierR512(input: JointOptimizerInputR512): JointOptimizerResultR512 {
  const equivalenceBand = Math.max(0, finite(input.equivalenceBand));
  const topN = Math.max(1, Math.floor(finite(input.topN, 5)));
  const candidates = [...input.candidates];

  if (!candidates.length) {
    return {
      version: JOINT_OPTIMIZER_R512_VERSION,
      mode: 'SHADOW_READ_ONLY',
      calibration: JOINT_OPTIMIZER_R512_CALIBRATION,
      certification: 'NOT_RUN',
      productionAuthorityChanged: false,
      globalRealGameOptimality: false,
      equivalenceBand,
      exactBaseWinnerId: null,
      shadowWinnerId: null,
      equivalentCandidates: 0,
      paretoCandidates: 0,
      topN: [],
      stability: {
        level: 'NOT_RUN',
        equivalentCandidateIds: [],
        winnerBaseGap: null,
        shadowVsExactBaseDelta: null,
        reason: 'Nenhuma configuração completa foi fornecida ao shadow R512.',
      },
      limitation: 'R512 permanece read-only e não altera a autoridade final de produção.',
    };
  }

  const exactBaseWinner = [...candidates].sort((left, right) =>
    right.baseScore - left.baseScore || left.id.localeCompare(right.id),
  )[0];
  const exactBestScore = finite(exactBaseWinner.baseScore);

  const audits = candidates.map((candidate): JointCandidateAuditR512 => {
    const possession = analyzePossessionR511(candidate.state, {
      usageFunction: candidate.usageFunction,
    });
    const residualBottlenecks = residualBottlenecksR512(possession);
    const skillsPostBuild = skillsPostBuildR512(candidate.skills);
    const impetoPostBuild = impetoPostBuildR512(candidate.impeto);
    const withinEquivalenceBand = exactBestScore - finite(candidate.baseScore) <= equivalenceBand + 1e-12;
    const integrity = skillIntegrityR512(candidate.skills)
      && impetoPostBuild
      && candidate.impeto.automaticSpendAuthorized === false;

    return {
      id: candidate.id,
      trainingCacheKey: candidate.trainingCacheKey,
      baseScore: round3(finite(candidate.baseScore)),
      baseScoreDelta: round3(Math.max(0, exactBestScore - finite(candidate.baseScore))),
      rankedScore: round3(finite(candidate.rankedScore)),
      possessionScore: round3(possession.possessionScore),
      possessionCoverage: round3(possession.coverage),
      residualSeverity: residualSeverityR512(residualBottlenecks),
      residualBottlenecks,
      skillSetScore: round3(finite(candidate.skills.finalSetScore)),
      skillAverage: round3(skillAverageR512(candidate.skills)),
      skillsPostBuild,
      skillIntegrity: skillIntegrityR512(candidate.skills),
      impetoScore: round3(finite(candidate.impeto.technicalIdealScore)),
      impetoPostBuild,
      impetoAmbiguous: Boolean(candidate.impeto.ambiguity),
      automaticSpendAuthorized: false,
      withinEquivalenceBand,
      frontierEligible: withinEquivalenceBand && integrity,
      possession,
    };
  });

  const eligible = audits.filter((candidate) => candidate.frontierEligible);
  const frontier = eligible.filter((candidate) =>
    !eligible.some((other) => other !== candidate && dominatesR512(other, candidate)),
  );
  const shadowWinner = [...frontier].sort(shadowOrderR512)[0] ?? null;
  const equivalent = audits
    .filter((candidate) => candidate.withinEquivalenceBand)
    .sort((left, right) => right.baseScore - left.baseScore || left.id.localeCompare(right.id));
  const auditTopN = [...audits].sort(topNAuditOrderR512).slice(0, topN);
  const runnerUp = equivalent[1] ?? null;
  const winnerBaseGap = runnerUp ? Math.abs(exactBestScore - runnerUp.baseScore) : null;
  const shadowVsExactBaseDelta = shadowWinner
    ? Math.max(0, exactBestScore - shadowWinner.baseScore)
    : null;

  return {
    version: JOINT_OPTIMIZER_R512_VERSION,
    mode: 'SHADOW_READ_ONLY',
    calibration: JOINT_OPTIMIZER_R512_CALIBRATION,
    certification: shadowWinner ? 'OPTIMAL_WITHIN_MODEL_FRONTIER_UNCALIBRATED' : 'NOT_RUN',
    productionAuthorityChanged: false,
    globalRealGameOptimality: false,
    equivalenceBand,
    exactBaseWinnerId: exactBaseWinner.id,
    shadowWinnerId: shadowWinner?.id ?? null,
    equivalentCandidates: equivalent.length,
    paretoCandidates: frontier.length,
    topN: auditTopN,
    stability: {
      level: equivalent.length > 1 ? 'LOW_EQUIVALENT_FRONTIER' : 'HIGH_SINGLE_FRONTIER',
      equivalentCandidateIds: equivalent.map((candidate) => candidate.id),
      winnerBaseGap: winnerBaseGap === null ? null : round3(winnerBaseGap),
      shadowVsExactBaseDelta: shadowVsExactBaseDelta === null ? null : round3(shadowVsExactBaseDelta),
      reason: equivalent.length > 1
        ? 'Há configurações praticamente equivalentes na ficha-base; o R512 preserva a incerteza e usa gargalo residual apenas como desempate shadow auditável.'
        : 'Há um único candidato dentro da faixa de equivalência informada; estabilidade estrutural maior, ainda sem certificação prática.',
    },
    limitation: 'O R512 compara ficha, Top 5 e Ímpeto no frontier do modelo e re-simula Posse/gargalos, mas permanece shadow. Skills e Ímpeto não recebem bônus numéricos inventados e nenhuma promoção/gasto automático é autorizado antes de Golden Lab e calibração real.',
  };
}
