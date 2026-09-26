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

function tokenR500(value: unknown, fallback: string) {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function baseContextFingerprintR500(input: TacticalDirectorInputR500) {
  return [
    'R500CTX',
    tokenR500(input.formation, 'SEM_FORMACAO'),
    tokenR500(input.teamStyle, 'SEM_ESTILO'),
    tokenR500(input.officialDecisionFingerprint, 'SEM_DECISAO')
  ].join(':');
}

function basePlanFingerprintR500(contextFingerprint: string, scenario: TacticalDirectorScenarioR500) {
  return `R500PLAN:${contextFingerprint}:${scenario}:${TACTICAL_DIRECTOR_R500_VERSION}`;
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario: TacticalDirectorScenarioR500 = input.currentScenario ?? 'base';
  const contextFingerprint = baseContextFingerprintR500(input);
  const planFingerprint = basePlanFingerprintR500(contextFingerprint, scenario);

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability: 'INSUFFICIENT',
    phase: 'PRE_MATCH',
    contextFingerprint,
    planFingerprint,
    scenario,
    title: 'Diretor Tático',
    summary: 'Ainda não há evidência suficiente para uma recomendação tática forte.',
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
    explanations: [],
    limitations: ['Evidência insuficiente para promover um plano forte.'],
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica mudanças automaticamente.',
      'Sem evidência suficiente, o plano permanece degradado.'
    ]
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
