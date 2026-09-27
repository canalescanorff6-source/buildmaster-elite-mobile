import { collectDirectorEvidenceR500, detectDirectorConflictsR500, directorConfidenceR500 } from './tacticalDirectorEvidenceR500';
import { buildContextFingerprintR500, buildPlanFingerprintR500 } from './tacticalDirectorFingerprintR500';
import { buildTacticalMemoryR500 } from './tacticalDirectorMemoryR500';
import type {
  TacticalDirectorAuthorityR500,
  TacticalDirectorInputR500,
  TacticalDirectorPhaseR500,
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

function uniqueR500(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function hasMaterialMatchSignalR500(input: TacticalDirectorInputR500): boolean {
  return Boolean(
    input.matchVision?.evidence.confirmedMarkers &&
    input.matchVision.recurringPatterns.some((item) => item.occurrences >= 2 && item.impact >= 70)
  );
}

function selectScenarioR500(input: TacticalDirectorInputR500): TacticalDirectorScenarioR500 {
  if (input.currentScenario) return input.currentScenario;
  const scenarios = input.tacticalTwin?.scenarios ?? [];
  if (!scenarios.length) return input.previousPlan?.scenario ?? 'base';
  const candidate = [...scenarios].sort((left, right) => right.readiness - left.readiness || left.id.localeCompare(right.id))[0];
  const previousId = input.previousPlan?.scenario;
  if (!previousId) return candidate?.id ?? 'base';
  const previousScenario = scenarios.find((item) => item.id === previousId);
  if (!candidate || !previousScenario || candidate.id === previousScenario.id) return previousId;
  if (hasMaterialMatchSignalR500(input)) return candidate.id;
  return candidate.readiness >= previousScenario.readiness + 8 ? candidate.id : previousId;
}

function phaseForR500(input: TacticalDirectorInputR500): TacticalDirectorPhaseR500 {
  const requested = (input as TacticalDirectorInputR500 & { phase?: TacticalDirectorPhaseR500 }).phase;
  return requested ?? 'PRE_MATCH';
}

function phaseSummaryR500(
  phase: TacticalDirectorPhaseR500,
  baseSummary: string,
  input: TacticalDirectorInputR500
): string {
  if (phase === 'IN_MATCH_PREPARED') {
    return `Plano condicional preparado: ${baseSummary} O R500 não afirma receber telemetria ao vivo.`;
  }
  if (phase === 'POST_MATCH') {
    const confirmedRisk = input.matchVision?.evidence.confirmedMarkers && input.matchVision.risks.length > 0;
    if (confirmedRisk) return `Auditoria pós-jogo: o plano foi comparado com evidência confirmada da partida; há sinais de execução problemática a revisar.`;
    return 'Auditoria pós-jogo: ainda não há evidência confirmada suficiente para separar falha do plano de falha de execução.';
  }
  return baseSummary;
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario = selectScenarioR500(input);
  const phase = phaseForR500(input);
  const effectiveInput: TacticalDirectorInputR500 = { ...input, currentScenario: scenario };
  const activeScenario = input.tacticalTwin?.scenarios.find((item) => item.id === scenario) ?? null;
  const contextFingerprint = buildContextFingerprintR500({
    officialDecisionFingerprint: input.officialDecisionFingerprint,
    formation: input.formation,
    teamStyle: input.teamStyle,
    lineup: []
  });

  const evidence = collectDirectorEvidenceR500(effectiveInput);
  const conflicts = detectDirectorConflictsR500(effectiveInput);
  const confidence = directorConfidenceR500(effectiveInput, evidence, conflicts);
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
    evidenceFingerprints: evidence.map((item) => item.fingerprint),
    proMetaDigest: null,
    previousPlanFingerprint: input.previousPlan?.planFingerprint ?? null
  });

  const patternTag = input.matchVision?.recurringPatterns[0]?.kind ?? null;
  const memory = buildTacticalMemoryR500(input.confirmedMatchRecords, {
    formation: input.formation,
    teamStyle: input.teamStyle,
    cardFingerprints: Array.from(new Set(input.confirmedMatchRecords.map((record) => record.cardFingerprint))),
    patternTag
  });
  const explanations = (input.explanations ?? []).map((item) => ({
    decisionFingerprint: item.fingerprint,
    kind: item.kind,
    verdict: item.verdict
  }));
  const recommendedActions = activeScenario
    ? activeScenario.actions.slice(0, 4).map((label, index) => ({
        id: `R500:${scenario}:action:${index + 1}`,
        label,
        rationale: activeScenario.summary,
        priority: Math.max(1, 100 - index * 10),
        evidenceIds: evidence.filter((item) => item.source === 'R480').map((item) => item.id)
      }))
    : [];
  const contingencies = (input.tacticalTwin?.scenarios ?? []).map((item) => ({
    scenario: item.id,
    label: item.label,
    summary: item.summary,
    actionIds: item.id === scenario ? recommendedActions.map((action) => action.id) : []
  }));
  const priorities = activeScenario ? activeScenario.actions.slice(0, 2) : [];
  const risks = uniqueR500([
    ...(input.tacticalTwin?.risks ?? []),
    ...(input.matchVision?.risks ?? [])
  ]).slice(0, 5);
  const availability: TacticalDirectorPlanR500['availability'] = evidence.length === 0
    ? 'INSUFFICIENT'
    : confidence.planConfidence >= 70 && evidence.some((item) => item.family === 'MATCH_CONFIRMED')
      ? 'READY'
      : 'PARTIAL';
  const baseSummary = activeScenario?.summary ?? 'Ainda não há evidência suficiente para uma recomendação forte.';

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability,
    phase,
    contextFingerprint,
    planFingerprint,
    scenario,
    title: activeScenario?.label ?? 'Diretor Tático',
    summary: phaseSummaryR500(phase, baseSummary, input),
    priorities,
    risks,
    recommendedActions,
    contingencies,
    conflicts,
    confidence,
    evidence,
    proMeta: {
      available: false,
      datasetVersion: input.proMetaDataset?.version ?? null,
      datasetDigest: null,
      applicableObservationIds: [],
      compatibility: 0,
      notes: input.proMetaDataset?.observations.length ? ['Dataset presente; contexto Pro Meta ainda não foi fornecido ao diretor.'] : []
    },
    memory,
    explanations,
    limitations: availability === 'READY' ? [] : ['Evidência insuficiente para promover um plano forte.'],
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica alterações automaticamente.',
      'R489 explica, mas não adiciona confiança ao plano.',
      phase === 'IN_MATCH_PREPARED' ? 'Modo durante a partida é condicional e não afirma telemetria em tempo real.' : '',
      'Sem evidência suficiente, o plano permanece degradado e conservador.'
    ].filter(Boolean)
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
