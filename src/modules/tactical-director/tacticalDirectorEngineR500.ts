import {
  buildContextFingerprintR500,
  buildPlanFingerprintR500,
  validateContextCoherenceR500
} from './tacticalDirectorFingerprintR500';
import type {
  TacticalDirectorAuthorityR500,
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500,
  TacticalDirectorScenarioR500
} from './tacticalDirectorTypesR500';

export const TACTICAL_DIRECTOR_R500_VERSION = '40.80-r500-autonomous-tactical-director-v1' as const;

const AUTHORITY_R500: TacticalDirectorAuthorityR500 = {
  readOnly: true,
  canWriteTraining: false,
  canWriteSkills: false,
  canWriteImpetus: false,
  canChangePosition: false,
  canChangeLineupAutomatically: false,
  canConfirmMatchMarkersAutomatically: false,
  canWriteVault: false,
  canPersistTacticalMemory: false,
  canOverrideR119: false,
  canOverrideR126: false,
  canOverrideR128: false,
  optimizeOverall: false
};

function sourceVersionsR500(input: TacticalDirectorInputR500): string[] {
  const versions: string[] = [];
  if (input.tacticalTwin?.version) versions.push(`R480:${input.tacticalTwin.version}`);
  if (input.squadBrain?.version) versions.push(`R481:${input.squadBrain.version}`);
  if (input.matchVision?.version) versions.push(`R482:${input.matchVision.version}`);
  if (input.buildSimulator?.version) versions.push(`R483:${input.buildSimulator.version}`);
  if (input.chemistry?.version) versions.push(`R484:${input.chemistry.version}`);
  for (const explanation of input.explanations ?? []) {
    if (explanation.version) versions.push(`R489:${explanation.version}:${explanation.kind}`);
  }
  return versions;
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario: TacticalDirectorScenarioR500 = input.currentScenario ?? 'base';
  const contextFingerprint = buildContextFingerprintR500(input);
  const contextIssues = validateContextCoherenceR500(input);
  const blockingIssues = contextIssues.filter((issue) => issue.level === 'BLOCKING');
  const planFingerprint = buildPlanFingerprintR500({
    contextFingerprint,
    scenario,
    sourceVersions: sourceVersionsR500(input),
    evidenceFingerprints: (input.explanations ?? []).map((item) => item.fingerprint).filter(Boolean),
    proMetaDigest: null,
    previousPlanFingerprint: input.previousPlan?.planFingerprint ?? null
  });
  const blocked = blockingIssues.length > 0;

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability: blocked ? 'BLOCKED' : 'INSUFFICIENT',
    phase: 'PRE_MATCH',
    contextFingerprint,
    planFingerprint,
    scenario,
    title: 'Diretor Tático',
    summary: blocked
      ? 'O contexto contém fontes incompatíveis; o plano forte foi bloqueado sem corrigir a origem silenciosamente.'
      : 'Ainda não há evidência suficiente para uma recomendação tática forte.',
    priorities: [],
    risks: [],
    recommendedActions: [],
    contingencies: [],
    conflicts: contextIssues.map((issue, index) => ({
      id: `context-${index + 1}-${issue.code}`,
      level: issue.level,
      title: 'Contexto incompatível',
      description: issue.message,
      sourceIds: [issue.source],
      penalty: issue.level === 'BLOCKING' ? 100 : 20
    })),
    confidence: {
      planConfidence: 0,
      evidenceConfidence: 0,
      executionConfidence: 0
    },
    evidence: [],
    proMeta: {
      datasetVersion: null,
      datasetDigest: null,
      applicableObservations: 0,
      strongestCompatibility: 0,
      patterns: [],
      limitations: []
    },
    memory: {
      state: 'SEM_EVIDENCIA',
      compatibleMatches: 0,
      confirmedSessions: 0,
      patterns: [],
      limitations: []
    },
    explanations: (input.explanations ?? []).map((item) => ({
      kind: item.kind,
      fingerprint: item.fingerprint,
      verdict: item.verdict
    })),
    limitations: contextIssues.length
      ? contextIssues.map((issue) => issue.message)
      : ['Evidência insuficiente para promover um plano forte.'],
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica mudanças automaticamente.',
      'Incompatibilidade de contexto bloqueia a fonte afetada em vez de ser corrigida por inferência.'
    ]
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
