import {
  buildContextFingerprintR500,
  buildPlanFingerprintR500
} from './tacticalDirectorFingerprintR500';
import { PRO_META_DATASET_R500 } from './proMetaDatasetR500';
import {
  proMetaDatasetDigestR500,
  selectApplicableProMetaR500
} from './tacticalDirectorProMetaR500';
import { buildTacticalMemoryR500 } from './tacticalDirectorMemoryR500';
import {
  buildDirectorConflictsR500,
  buildDirectorEvidenceR500,
  directorConfidenceR500
} from './tacticalDirectorEvidenceR500';
import type {
  TacticalDirectorActionR500,
  TacticalDirectorAuthorityR500,
  TacticalDirectorContingencyR500,
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

function sourceVersionsR500(input: TacticalDirectorInputR500): string[] {
  const versions: string[] = [];
  if (input.tacticalTwin?.version) versions.push(`R480:${input.tacticalTwin.version}`);
  if (input.squadBrain?.version) versions.push(`R481:${input.squadBrain.version}`);
  if (input.matchVision?.version) versions.push(`R482:${input.matchVision.version}`);
  if (input.buildSimulator?.version) versions.push(`R483:${input.buildSimulator.version}`);
  if (input.chemistry?.version) versions.push(`R484:${input.chemistry.version}`);
  return versions;
}

function uniqueStringsR500(items: string[]) {
  return Array.from(new Set(items.map((item) => String(item ?? '').trim()).filter(Boolean)));
}

function resolveScenarioR500(input: TacticalDirectorInputR500): TacticalDirectorScenarioR500 {
  const available = input.tacticalTwin?.scenarios ?? [];
  const requested = input.currentScenario ?? 'base';
  if (available.some((item) => item.id === requested)) return requested;
  if (available.some((item) => item.id === 'base')) return 'base';
  return available[0]?.id ?? 'base';
}

function phaseR500(input: TacticalDirectorInputR500): TacticalDirectorPhaseR500 {
  return input.phase ?? 'PRE_MATCH';
}

function scenarioEvidenceIdR500(scenario: TacticalDirectorScenarioR500) {
  return `R480:scenario:${scenario}`;
}

function buildActionsR500(
  input: TacticalDirectorInputR500,
  scenario: TacticalDirectorScenarioR500,
  evidenceIds: Set<string>
): TacticalDirectorActionR500[] {
  const selected = input.tacticalTwin?.scenarios.find((item) => item.id === scenario) ?? null;
  if (!selected) return [];
  const scenarioEvidence = scenarioEvidenceIdR500(scenario);
  const actions: TacticalDirectorActionR500[] = selected.actions
    .map((description, index) => ({
      id: `scenario:${scenario}:${index + 1}`,
      title: index === 0 ? selected.label : `Ajuste ${index + 1} • ${selected.label}`,
      description,
      priority: 100 - index * 5,
      evidenceIds: evidenceIds.has(scenarioEvidence) ? [scenarioEvidence] : []
    }))
    .filter((item) => item.evidenceIds.length > 0);

  const bench = input.squadBrain?.scenarioBench.find((item) => item.scenario === scenario) ?? null;
  const squadEvidence = 'R481:squad:coverage';
  if (bench && evidenceIds.has(squadEvidence)) {
    for (const reserveId of bench.reserveIds) {
      const rotation = input.squadBrain?.rotations.find((item) => item.reserveId === reserveId) ?? null;
      if (!rotation) continue;
      const chemistryImpact = input.chemistry?.rotations.find((item) =>
        item.reserveId === rotation.reserveId && item.replaces === rotation.replaces
      ) ?? null;
      const linked = [squadEvidence];
      if (chemistryImpact && evidenceIds.has('R484:chemistry:team')) linked.push('R484:chemistry:team');
      const chemistryNote = chemistryImpact
        ? ` Impacto químico: ${chemistryImpact.delta >= 0 ? '+' : ''}${chemistryImpact.delta}.`
        : '';
      actions.push({
        id: `rotation:${rotation.reserveId}:${rotation.replaces}`,
        title: `${rotation.reserveName} por ${rotation.replaces}`,
        description: `${rotation.reason}${chemistryNote}`,
        priority: Math.max(60, rotation.readiness),
        evidenceIds: linked
      });
    }
  }

  return actions
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
    .slice(0, 6);
}

function buildContingenciesR500(input: TacticalDirectorInputR500): TacticalDirectorContingencyR500[] {
  return (input.tacticalTwin?.scenarios ?? [])
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((item) => ({
      scenario: item.id,
      label: item.label,
      summary: item.summary,
      actionIds: item.actions.map((_, index) => `scenario:${item.id}:${index + 1}`)
    }));
}

function phaseSummaryR500(
  phase: TacticalDirectorPhaseR500,
  scenarioLabel: string,
  scenarioSummary: string,
  input: TacticalDirectorInputR500,
  conflicts: TacticalDirectorPlanR500['conflicts']
) {
  if (phase === 'IN_MATCH_PREPARED') {
    return `${scenarioLabel}: plano condicional preparado antes da decisão do usuário. ${scenarioSummary}`;
  }
  if (phase === 'POST_MATCH') {
    const confirmed = input.matchVision?.evidence.confirmedMarkers ?? 0;
    const matchConflict = conflicts.some((item) => item.level === 'MATERIAL' && item.sourceIds.includes('R482'));
    if (confirmed > 0 && matchConflict) {
      return `Pós-jogo: o plano tinha base estrutural, mas a execução apresentou riscos confirmados na partida. ${scenarioSummary}`;
    }
    if (confirmed > 0) {
      return `Pós-jogo: o plano foi auditado contra ${confirmed} evento(s) confirmado(s) da partida. ${scenarioSummary}`;
    }
    return 'Pós-jogo sem evidência confirmada suficiente para separar qualidade do plano e qualidade da execução.';
  }
  return `${scenarioLabel}: ${scenarioSummary}`;
}

function applyHysteresisR500(
  candidate: TacticalDirectorPlanR500,
  previous: TacticalDirectorPlanR500 | null | undefined
): TacticalDirectorPlanR500 {
  if (!previous) return candidate;
  if (previous.contextFingerprint !== candidate.contextFingerprint) return candidate;
  if (previous.phase !== candidate.phase) return candidate;
  if (previous.scenario !== candidate.scenario) return candidate;
  if (candidate.conflicts.some((item) => item.level === 'BLOCKING')) return candidate;
  if (candidate.conflicts.some((item) => item.level === 'MATERIAL' && item.sourceIds.includes('R482'))) return candidate;
  const gain = candidate.confidence.planConfidence - previous.confidence.planConfidence;
  if (gain >= 8) return candidate;

  return {
    ...candidate,
    title: previous.title,
    summary: previous.summary,
    priorities: [...previous.priorities],
    risks: [...previous.risks],
    recommendedActions: previous.recommendedActions.map((item) => ({ ...item, evidenceIds: [...item.evidenceIds] })),
    contingencies: previous.contingencies.map((item) => ({ ...item, actionIds: [...item.actionIds] })),
    scenario: previous.scenario,
    limitations: uniqueStringsR500([
      ...candidate.limitations,
      `Histerese: plano anterior mantido porque o ganho calculado foi ${gain} ponto(s), abaixo do mínimo de 8.`
    ])
  };
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario = resolveScenarioR500(input);
  const phase = phaseR500(input);
  const contextFingerprint = buildContextFingerprintR500(input);
  const proMetaDataset = input.proMetaDataset ?? PRO_META_DATASET_R500;
  const proMetaDigest = proMetaDatasetDigestR500(proMetaDataset);
  const applicableProMeta = input.proMetaContext
    ? selectApplicableProMetaR500(proMetaDataset, input.proMetaContext)
    : [];
  const cardFingerprints = (input.lineupContext ?? [])
    .map((item) => item.cardFingerprint)
    .filter((item): item is string => Boolean(item));
  const memory = buildTacticalMemoryR500(
    input.confirmedMatchRecords,
    {
      formation: input.formation,
      teamStyle: input.teamStyle,
      cardFingerprints
    },
    input.matchVision ? { sessionId: null, snapshot: input.matchVision } : null
  );
  const evidence = buildDirectorEvidenceR500({ ...input, currentScenario: scenario }, { memory, applicableProMeta });
  const conflicts = buildDirectorConflictsR500(evidence, { ...input, currentScenario: scenario });
  const confidence = directorConfidenceR500({ input: { ...input, currentScenario: scenario }, evidence, conflicts, memory });
  const blocking = conflicts.some((item) => item.level === 'BLOCKING');
  const hasUsableEvidence = evidence.some((item) => item.family === 'STRUCTURAL_TEAM' || item.family === 'MATCH_CONFIRMED' || item.family === 'PRO_META');
  const selectedScenario = input.tacticalTwin?.scenarios.find((item) => item.id === scenario) ?? null;
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const recommendedActions = blocking ? [] : buildActionsR500(input, scenario, evidenceIds);
  const contingencies = blocking ? [] : buildContingenciesR500(input);
  const priorities = blocking || !selectedScenario
    ? []
    : uniqueStringsR500([
        ...selectedScenario.actions.slice(0, 2),
        ...(input.tacticalTwin?.strengths ?? []).slice(0, 2)
      ]).slice(0, 4);
  const risks = blocking
    ? conflicts.map((item) => item.description).slice(0, 4)
    : uniqueStringsR500([
        ...(input.tacticalTwin?.risks ?? []),
        ...conflicts.filter((item) => item.level === 'MATERIAL').map((item) => item.description),
        ...(selectedScenario && selectedScenario.transitionRisk >= 35
          ? [`Risco de transição elevado no cenário ${selectedScenario.label}: ${selectedScenario.transitionRisk}/100.`]
          : [])
      ]).slice(0, 5);
  const planFingerprint = buildPlanFingerprintR500({
    contextFingerprint,
    scenario,
    sourceVersions: sourceVersionsR500(input),
    evidenceFingerprints: evidence.map((item) => item.fingerprint),
    proMetaDigest,
    previousPlanFingerprint: input.previousPlan?.planFingerprint ?? null
  });
  const proMetaPatterns = uniqueStringsR500(
    applicableProMeta.flatMap((item) => item.observation.tacticalTags)
  ).slice(0, 5);
  const proMetaLimitations = input.proMetaContext
    ? applicableProMeta.length
      ? []
      : ['Nenhuma observação Pro Meta curada é aplicável ao contexto atual.']
    : ['Contexto competitivo Pro Meta não informado; nenhuma equivalência externa foi presumida.'];
  const limitations = uniqueStringsR500([
    ...conflicts.filter((item) => item.level === 'BLOCKING').map((item) => item.description),
    ...memory.limitations,
    ...proMetaLimitations,
    ...(!hasUsableEvidence && !blocking ? ['Evidência insuficiente para promover um plano forte.'] : []),
    ...(phase === 'POST_MATCH' && !(input.matchVision?.evidence.confirmedMarkers ?? 0)
      ? ['Pós-jogo sem marcador confirmado: nenhuma conclusão forte de execução foi produzida.']
      : [])
  ]);
  const scenarioLabel = selectedScenario?.label ?? 'Plano base';
  const scenarioSummary = selectedScenario?.summary ?? 'Sem cenário tático confirmado.';
  const availability: TacticalDirectorPlanR500['availability'] = blocking
    ? 'BLOCKED'
    : selectedScenario && recommendedActions.length && confidence.planConfidence > 0
      ? 'READY'
      : hasUsableEvidence ? 'PARTIAL' : 'INSUFFICIENT';

  const candidate: TacticalDirectorPlanR500 = {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability,
    phase,
    contextFingerprint,
    planFingerprint,
    scenario,
    title: blocking ? 'Diretor Tático • contexto bloqueado' : `Diretor Tático • ${scenarioLabel}`,
    summary: blocking
      ? 'O contexto contém fontes incompatíveis; o plano forte foi bloqueado sem corrigir a origem silenciosamente.'
      : selectedScenario
        ? phaseSummaryR500(phase, scenarioLabel, scenarioSummary, input, conflicts)
        : 'Ainda não há evidência suficiente para uma recomendação tática forte.',
    priorities,
    risks,
    recommendedActions,
    contingencies,
    conflicts,
    confidence,
    evidence,
    proMeta: {
      datasetVersion: proMetaDataset.version,
      datasetDigest: proMetaDigest,
      applicableObservations: applicableProMeta.length,
      strongestCompatibility: applicableProMeta[0]?.compatibility.finalCompatibility ?? 0,
      patterns: proMetaPatterns,
      limitations: proMetaLimitations
    },
    memory,
    explanations: (input.explanations ?? []).map((item) => ({
      kind: item.kind,
      fingerprint: item.fingerprint,
      verdict: item.verdict
    })),
    limitations,
    authority: { ...AUTHORITY_R500 },
    guardrails: [
      'R119 → R126 → R128 permanece a autoridade final.',
      'R500 recomenda e nunca aplica mudanças automaticamente.',
      'Durante a partida, o R500 usa cenários preparados e não presume telemetria ao vivo.',
      'Pro Meta só participa quando plataforma, patch, formato e ruleset têm compatibilidade explícita.',
      'R489 explica decisões existentes e não adiciona confiança ao R500.'
    ]
  };

  return applyHysteresisR500(candidate, input.previousPlan);
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
