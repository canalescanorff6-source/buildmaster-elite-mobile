import { validateDirectorContextR500 } from './tacticalDirectorContextR500';
import { collectDirectorEvidenceR500, detectDirectorConflictsR500, directorConfidenceR500, materializeEvidenceR500 } from './tacticalDirectorEvidenceR500';
import { buildContextFingerprintR500, buildPlanFingerprintR500 } from './tacticalDirectorFingerprintR500';
import { buildTacticalMemoryR500 } from './tacticalDirectorMemoryR500';
import { selectApplicableProMetaR500 } from './tacticalDirectorProMetaR500';
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
  return input.phase ?? 'PRE_MATCH';
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
    if (confirmedRisk) return 'Auditoria pós-jogo: o plano foi comparado com evidência confirmada da partida; há sinais de execução problemática a revisar.';
    return 'Auditoria pós-jogo: ainda não há evidência confirmada suficiente para separar falha do plano de falha de execução.';
  }
  return baseSummary;
}

function safeInputR500(input: TacticalDirectorInputR500, blocked: Set<'R480' | 'R482' | 'R483' | 'R484'>): TacticalDirectorInputR500 {
  return {
    ...input,
    tacticalTwin: blocked.has('R480') ? null : input.tacticalTwin,
    squadBrain: blocked.has('R480') ? null : input.squadBrain,
    matchVision: blocked.has('R482') ? null : input.matchVision,
    buildSimulator: blocked.has('R483') ? null : input.buildSimulator,
    chemistry: blocked.has('R484') ? null : input.chemistry
  };
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const validation = validateDirectorContextR500(input);
  const safeBase = safeInputR500(input, validation.blockedSources);
  const scenario = selectScenarioR500(safeBase);
  const phase = phaseForR500(input);
  const effectiveInput: TacticalDirectorInputR500 = { ...safeBase, currentScenario: scenario };
  const activeScenario = effectiveInput.tacticalTwin?.scenarios.find((item) => item.id === scenario) ?? null;
  const contextFingerprint = buildContextFingerprintR500({
    officialDecisionFingerprint: input.officialDecisionFingerprint,
    formation: input.formation,
    teamStyle: input.teamStyle,
    lineup: input.lineupContext?.lineup ?? [],
    expectedSlots: input.lineupContext?.expectedSlots
  });

  const proMetaSelection = input.proMetaDataset && input.proMetaContext
    ? selectApplicableProMetaR500(input.proMetaDataset, input.proMetaContext)
    : null;
  const applicableProMeta = (proMetaSelection?.observations ?? []).filter((item) => item.compatibility.finalCompatibility >= 0.5).slice(0, 5);
  const proMetaEvidence = applicableProMeta.map(({ observation, compatibility }) => materializeEvidenceR500({
    id: `PRO_META:${observation.id}`,
    family: 'PRO_META',
    source: 'PRO_META',
    claim: observation.observations[0] || `Padrão profissional verificado em ${observation.competition}.`,
    nativeConfidence: observation.confidence,
    relevance: 1,
    independence: 1,
    completeness: observation.sourceUrl && observation.sourceFingerprint ? 1 : 0.5,
    contextCompatibility: compatibility.finalCompatibility,
    fingerprint: `PRO_META:${observation.id}:${observation.sourceFingerprint}:${observation.gameVersion}:${observation.matchFormat}:${observation.rulesetFingerprint}`
  }));

  const evidence = [...collectDirectorEvidenceR500(effectiveInput), ...proMetaEvidence];
  const conflicts = [...validation.conflicts, ...detectDirectorConflictsR500(effectiveInput)];
  const confidence = directorConfidenceR500(effectiveInput, evidence, conflicts);
  const sourceVersions = [
    effectiveInput.tacticalTwin?.version ? `R480:${effectiveInput.tacticalTwin.version}` : null,
    effectiveInput.squadBrain?.version ? `R481:${effectiveInput.squadBrain.version}` : null,
    effectiveInput.matchVision?.version ? `R482:${effectiveInput.matchVision.version}` : null,
    effectiveInput.buildSimulator?.version ? `R483:${effectiveInput.buildSimulator.version}` : null,
    effectiveInput.chemistry?.version ? `R484:${effectiveInput.chemistry.version}` : null,
    ...(input.explanations ?? []).map((item) => `R489:${item.version}`)
  ].filter((item): item is string => Boolean(item));
  const planFingerprint = buildPlanFingerprintR500({
    contextFingerprint,
    scenario,
    sourceVersions,
    evidenceFingerprints: evidence.map((item) => item.fingerprint),
    proMetaDigest: proMetaSelection?.digest ?? null,
    previousPlanFingerprint: input.previousPlan?.planFingerprint ?? null
  });

  const patternTag = effectiveInput.matchVision?.recurringPatterns[0]?.kind ?? null;
  const memory = buildTacticalMemoryR500(input.confirmedMatchRecords, {
    formation: input.formation,
    teamStyle: input.teamStyle,
    cardFingerprints: input.lineupContext?.lineup.map((item) => item.cardFingerprint).filter((item): item is string => Boolean(item))
      ?? Array.from(new Set(input.confirmedMatchRecords.map((record) => record.cardFingerprint))),
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
  const contingencies = (effectiveInput.tacticalTwin?.scenarios ?? []).map((item) => ({
    scenario: item.id,
    label: item.label,
    summary: item.summary,
    actionIds: item.id === scenario ? recommendedActions.map((action) => action.id) : []
  }));
  const priorities = activeScenario ? activeScenario.actions.slice(0, 2) : [];
  const risks = uniqueR500([
    ...(effectiveInput.tacticalTwin?.risks ?? []),
    ...(effectiveInput.matchVision?.risks ?? [])
  ]).slice(0, 5);
  const hasBlocking = validation.conflicts.some((item) => item.level === 'BLOCKING');
  const availability: TacticalDirectorPlanR500['availability'] = evidence.length === 0
    ? (hasBlocking ? 'BLOCKED' : 'INSUFFICIENT')
    : confidence.planConfidence >= 70 && evidence.some((item) => item.family === 'MATCH_CONFIRMED') && !hasBlocking
      ? 'READY'
      : 'PARTIAL';
  const baseSummary = activeScenario?.summary ?? 'Ainda não há evidência suficiente para uma recomendação forte.';
  const limitations = uniqueR500([
    ...validation.limitations,
    ...(availability === 'READY' ? [] : ['Evidência insuficiente para promover um plano forte.'])
  ]);

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability,
    phase,
    contextFingerprint,
    planFingerprint,
    scenario,
    title: activeScenario?.label ?? 'Diretor Tático',
    summary: phaseSummaryR500(phase, baseSummary, effectiveInput),
    priorities,
    risks,
    recommendedActions,
    contingencies,
    conflicts,
    confidence,
    evidence,
    proMeta: {
      available: applicableProMeta.length > 0,
      datasetVersion: input.proMetaDataset?.version ?? null,
      datasetDigest: proMetaSelection?.digest ?? null,
      applicableObservationIds: applicableProMeta.map((item) => item.observation.id),
      compatibility: applicableProMeta.length ? Math.round(Math.max(...applicableProMeta.map((item) => item.compatibility.finalCompatibility)) * 100) : 0,
      notes: input.proMetaDataset && !input.proMetaContext
        ? ['Dataset Pro Meta presente, mas sem contexto de plataforma/patch/formato/ruleset; evidência externa não foi usada.']
        : []
    },
    memory,
    explanations,
    limitations,
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica alterações automaticamente.',
      'R489 explica, mas não adiciona confiança ao plano.',
      'Pro Meta complementa o contexto pessoal e nunca substitui evidência real do usuário.',
      phase === 'IN_MATCH_PREPARED' ? 'Modo durante a partida é condicional e não afirma telemetria em tempo real.' : '',
      'Sem evidência suficiente, o plano permanece degradado e conservador.'
    ].filter(Boolean)
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
