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
  return versions;
}

function uniqueStringsR500(items: string[]) {
  return Array.from(new Set(items.map((item) => String(item ?? '').trim()).filter(Boolean)));
}

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500 {
  const scenario: TacticalDirectorScenarioR500 = input.currentScenario ?? 'base';
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
  const evidence = buildDirectorEvidenceR500(input, { memory, applicableProMeta });
  const conflicts = buildDirectorConflictsR500(evidence, input);
  const confidence = directorConfidenceR500({ input, evidence, conflicts, memory });
  const blocking = conflicts.some((item) => item.level === 'BLOCKING');
  const hasUsableEvidence = evidence.some((item) => item.family === 'STRUCTURAL_TEAM' || item.family === 'MATCH_CONFIRMED' || item.family === 'PRO_META');
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
    ...(!hasUsableEvidence && !blocking ? ['Evidência insuficiente para promover um plano forte.'] : [])
  ]);

  return {
    version: TACTICAL_DIRECTOR_R500_VERSION,
    availability: blocking ? 'BLOCKED' : hasUsableEvidence ? 'PARTIAL' : 'INSUFFICIENT',
    phase: 'PRE_MATCH',
    contextFingerprint,
    planFingerprint,
    scenario,
    title: 'Diretor Tático',
    summary: blocking
      ? 'O contexto contém fontes incompatíveis; o plano forte foi bloqueado sem corrigir a origem silenciosamente.'
      : hasUsableEvidence
        ? 'Há evidência suficiente para uma leitura preliminar, mas o plano completo ainda depende das próximas camadas do R500.'
        : 'Ainda não há evidência suficiente para uma recomendação tática forte.',
    priorities: [],
    risks: [],
    recommendedActions: [],
    contingencies: [],
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
      'Pro Meta só participa quando plataforma, patch, formato e ruleset têm compatibilidade explícita.',
      'R489 explica decisões existentes e não adiciona confiança ao R500.'
    ]
  };
}

export type {
  TacticalDirectorInputR500,
  TacticalDirectorPlanR500
} from './tacticalDirectorTypesR500';
