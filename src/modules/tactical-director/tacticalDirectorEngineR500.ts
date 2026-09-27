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

function minimalContextFingerprintR500(input: TacticalDirectorInputR500): string {
  return [
    'R500CTX',
    String(input.formation || 'SEM_FORMACAO'),
    String(input.teamStyle || 'SEM_ESTILO'),
    String(input.officialDecisionFingerprint || 'SEM_DECISAO')
  ].join(':');
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario = input.currentScenario ?? 'base';
  const contextFingerprint = minimalContextFingerprintR500(input);
  const planFingerprint = `R500PLAN:${contextFingerprint}:${scenario}:INSUFFICIENT`;

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
