import { buildContextFingerprintR500, buildPlanFingerprintR500 } from './tacticalDirectorFingerprintR500';
import type {
  TacticalDirectorAuthorityR500,
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
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

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario = input.currentScenario ?? 'base';
  const contextFingerprint = buildContextFingerprintR500({
    officialDecisionFingerprint: input.officialDecisionFingerprint,
    formation: input.formation,
    teamStyle: input.teamStyle,
    lineup: []
  });
  const sourceVersions = [
    input.tacticalTwin?.version ? `R480:${input.tacticalTwin.version}` : null,
    input.squadBrain?.version ? `R481:${input.squadBrain.version}` : null,
    input.matchVision?.version ? `R482:${input.matchVision.version}` : null,
    input.buildSimulator?.version ? `R483:${input.buildSimulator.version}` : null,
    input.chemistry?.version ? `R484:${input.chemistry.version}` : null,
    ...(input.explanations ?? []).map((item) => `R489:${item.version}`)
  ].filter((item): item is string => Boolean(item));
  const planFingerprint = buildPlanFingerprintR500({
    contextFingerprint,
    scenario,
    sourceVersions,
    evidenceFingerprints: [],
    proMetaDigest: null,
    previousPlanFingerprint: input.previousPlan?.planFingerprint ?? null
  });

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability: 'INSUFFICIENT',
    phase: 'PRE_MATCH',
    contextFingerprint,
    planFingerprint,
    scenario,
    title: 'Diretor Tático',
    summary: 'Ainda não há evidência suficiente para uma recomendação forte.',
    priorities: [],
    risks: [],
    recommendedActions: [],
    contingencies: [],
    conflicts: [],
    confidence: {
      planConfidence: 0,
      evidenceConfidence: 0,
      executionConfidence: 0
    },
    evidence: [],
    proMeta: {
      available: false,
      datasetVersion: input.proMetaDataset?.version ?? null,
      datasetDigest: null,
      applicableObservationIds: [],
      compatibility: 0,
      notes: []
    },
    memory: {
      state: 'SEM_EVIDENCIA',
      compatibleMatches: 0,
      confirmedPatternRate: null,
      notes: []
    },
    explanations: [],
    limitations: ['Evidência insuficiente para promover um plano forte.'],
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica alterações automaticamente.',
      'Sem evidência suficiente, o plano permanece degradado e conservador.'
    ]
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
