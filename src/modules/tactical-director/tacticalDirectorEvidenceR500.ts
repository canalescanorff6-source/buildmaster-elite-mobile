import { validateContextCoherenceR500 } from './tacticalDirectorFingerprintR500';
import type { ApplicableProMetaR500 } from './tacticalDirectorProMetaR500';
import type {
  TacticalDirectorConfidenceR500,
  TacticalDirectorConflictR500,
  TacticalDirectorEvidenceR500,
  TacticalDirectorEvidenceFamilyR500,
  TacticalDirectorInputR500,
  TacticalDirectorMemoryR500
} from './tacticalDirectorTypesR500';

export type DirectorEvidenceContextR500 = {
  memory: TacticalDirectorMemoryR500;
  applicableProMeta: ApplicableProMetaR500[];
};

export type DirectorConfidenceInputR500 = {
  input: TacticalDirectorInputR500;
  evidence: TacticalDirectorEvidenceR500[];
  conflicts: TacticalDirectorConflictR500[];
  memory: TacticalDirectorMemoryR500;
};

function clamp01R500(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clamp100R500(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function round6R500(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function normalizedConfidenceR500(value: number) {
  return clamp01R500(value / 100);
}

function effectiveWeightR500(parts: {
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  contextCompatibility: number;
}) {
  return round6R500(
    normalizedConfidenceR500(parts.nativeConfidence) *
      clamp01R500(parts.relevance) *
      clamp01R500(parts.independence) *
      clamp01R500(parts.completeness) *
      clamp01R500(parts.contextCompatibility)
  );
}

function evidenceR500(
  item: Omit<TacticalDirectorEvidenceR500, 'effectiveWeight'>
): TacticalDirectorEvidenceR500 {
  return {
    ...item,
    effectiveWeight: effectiveWeightR500(item)
  };
}

function sourceBlockedR500(input: TacticalDirectorInputR500, source: string) {
  return validateContextCoherenceR500(input).some((issue) => issue.source === source && issue.level === 'BLOCKING');
}

function proMetaNativeConfidenceR500(sourceType: ApplicableProMetaR500['observation']['sourceType']) {
  if (sourceType === 'OFFICIAL_MATCH') return 100;
  if (sourceType === 'OFFICIAL_EVENT') return 95;
  if (sourceType === 'VERIFIED_PRO_CONTENT') return 85;
  return 75;
}

export function buildDirectorEvidenceR500(
  input: TacticalDirectorInputR500,
  context: DirectorEvidenceContextR500
): TacticalDirectorEvidenceR500[] {
  const evidence: TacticalDirectorEvidenceR500[] = [];

  if (String(input.officialDecisionFingerprint || '').trim()) {
    evidence.push(evidenceR500({
      id: `R128:context:${input.officialDecisionFingerprint}`,
      family: 'OFFICIAL_CONTEXT',
      source: 'R128',
      claim: 'Contexto oficial identificado e preservado como autoridade soberana.',
      nativeConfidence: 100,
      relevance: 1,
      independence: 1,
      completeness: 1,
      contextCompatibility: 1,
      fingerprint: String(input.officialDecisionFingerprint)
    }));
  }

  if (input.tacticalTwin && !sourceBlockedR500(input, 'R480')) {
    const scenario = input.tacticalTwin.scenarios.find((item) => item.id === (input.currentScenario ?? 'base')) ?? null;
    if (scenario) {
      evidence.push(evidenceR500({
        id: `R480:scenario:${scenario.id}`,
        family: 'STRUCTURAL_TEAM',
        source: 'R480',
        claim: `${scenario.label}: segurança ${scenario.defensiveSecurity}, controle ${scenario.control}, risco de transição ${scenario.transitionRisk}.`,
        nativeConfidence: scenario.confidence,
        relevance: 1,
        independence: 1,
        completeness: input.tacticalTwin.structure.totalSlots
          ? input.tacticalTwin.structure.filledSlots / input.tacticalTwin.structure.totalSlots
          : 0,
        contextCompatibility: 1,
        fingerprint: `${input.tacticalTwin.version}:${input.tacticalTwin.formation}:${input.tacticalTwin.teamStyle}:${scenario.id}`
      }));
    }
  }

  if (input.squadBrain && !sourceBlockedR500(input, 'R480')) {
    const confirmed = input.squadBrain.evidence.totalPlayers
      ? input.squadBrain.evidence.confirmedPlayers / input.squadBrain.evidence.totalPlayers
      : 0;
    evidence.push(evidenceR500({
      id: 'R481:squad:coverage',
      family: 'STRUCTURAL_TEAM',
      source: 'R481',
      claim: `${input.squadBrain.rotations.length} rotação(ões) e ${input.squadBrain.coverage.length} linha(s) de cobertura avaliadas.`,
      nativeConfidence: input.squadBrain.confidence,
      relevance: 0.9,
      independence: 0.65,
      completeness: confirmed,
      contextCompatibility: 1,
      fingerprint: `${input.squadBrain.version}:${input.squadBrain.evidence.totalPlayers}:${input.squadBrain.evidence.confirmedPlayers}`
    }));
  }

  if (input.chemistry && !sourceBlockedR500(input, 'R484')) {
    evidence.push(evidenceR500({
      id: 'R484:chemistry:team',
      family: 'STRUCTURAL_TEAM',
      source: 'R484',
      claim: `Química estrutural ${input.chemistry.score}/100 com confiança ${input.chemistry.confidence}/100.`,
      nativeConfidence: input.chemistry.confidence,
      relevance: 0.9,
      independence: 0.55,
      completeness: Math.min(1, input.chemistry.evidence.links / 10),
      contextCompatibility: 1,
      fingerprint: `${input.chemistry.version}:${input.chemistry.formation}:${input.chemistry.teamStyle}:${input.chemistry.score}`
    }));
  }

  if (input.matchVision && !sourceBlockedR500(input, 'R482') && input.matchVision.evidence.confirmedMarkers > 0) {
    const recurring = input.matchVision.recurringPatterns
      .filter((item) => item.occurrences > 0)
      .slice()
      .sort((left, right) => right.impact - left.impact || right.occurrences - left.occurrences || left.kind.localeCompare(right.kind));
    const patternClaim = recurring[0]
      ? ` Padrão principal: ${recurring[0].label} (${recurring[0].occurrences} ocorrência(s)).`
      : '';
    evidence.push(evidenceR500({
      id: 'R482:match:confirmed',
      family: 'MATCH_CONFIRMED',
      source: 'R482',
      claim: `${input.matchVision.evidence.confirmedMarkers} marcador(es) confirmado(s).${patternClaim}`,
      nativeConfidence: input.matchVision.confidence,
      relevance: 1,
      independence: 1,
      completeness: clamp01R500(input.matchVision.evidence.reviewedCoverage / 100),
      contextCompatibility: 1,
      fingerprint: `${input.matchVision.version}:${input.matchVision.configuredContext.formation}:${input.matchVision.configuredContext.teamStyle}:${input.matchVision.evidence.confirmedMarkers}`
    }));
  }

  if (input.buildSimulator && !sourceBlockedR500(input, 'R483')) {
    const alternatives = input.buildSimulator.variants.filter((item) => item.id !== 'official' && item.validBudget);
    if (alternatives.length) {
      evidence.push(evidenceR500({
        id: 'R483:build:alternatives',
        family: 'BUILD_ALTERNATIVE',
        source: 'R483',
        claim: `${alternatives.length} alternativa(s) válida(s) de build disponíveis apenas para comparação.`,
        nativeConfidence: 100,
        relevance: 0.5,
        independence: 1,
        completeness: 1,
        contextCompatibility: 1,
        fingerprint: `${input.buildSimulator.version}:${input.buildSimulator.baselineFingerprint}:${alternatives.map((item) => item.id).sort().join(',')}`
      }));
    }
  }

  for (const item of context.applicableProMeta.slice(0, 3)) {
    evidence.push(evidenceR500({
      id: `PRO_META:${item.observation.id}`,
      family: 'PRO_META',
      source: 'PRO_META',
      claim: item.observation.observations[0] || item.observation.tacticalTags[0] || 'Padrão competitivo verificado.',
      nativeConfidence: proMetaNativeConfidenceR500(item.observation.sourceType),
      relevance: 1,
      independence: 1,
      completeness: item.observation.tacticalTags.length || item.observation.observations.length ? 1 : 0.5,
      contextCompatibility: item.compatibility.finalCompatibility,
      fingerprint: `${item.observation.sourceFingerprint}:${item.observation.gameVersion}:${item.observation.matchFormat}:${item.observation.rulesetFingerprint}`
    }));
  }

  return evidence.sort((left, right) => left.family.localeCompare(right.family) || left.id.localeCompare(right.id));
}

function conflictR500(
  id: string,
  level: TacticalDirectorConflictR500['level'],
  title: string,
  description: string,
  sourceIds: string[],
  penalty: number
): TacticalDirectorConflictR500 {
  return { id, level, title, description, sourceIds, penalty };
}

export function buildDirectorConflictsR500(
  _evidence: TacticalDirectorEvidenceR500[],
  input: TacticalDirectorInputR500
): TacticalDirectorConflictR500[] {
  const conflicts: TacticalDirectorConflictR500[] = validateContextCoherenceR500(input).map((issue) =>
    conflictR500(
      `context:${issue.code}`,
      issue.level,
      'Contexto incompatível',
      issue.message,
      [issue.source],
      issue.level === 'BLOCKING' ? 100 : 20
    )
  );

  if (input.squadBrain && input.chemistry && !sourceBlockedR500(input, 'R484')) {
    for (const rotation of input.squadBrain.rotations) {
      const impact = input.chemistry.rotations.find((item) =>
        item.reserveId === rotation.reserveId && item.replaces === rotation.replaces
      );
      if (!impact || impact.delta > -3) continue;
      conflicts.push(conflictR500(
        `rotation-chemistry:${rotation.reserveId}:${rotation.replaces}`,
        'MATERIAL',
        'Rotação com custo de química',
        `${rotation.reserveName} tem readiness ${rotation.readiness}, mas a troca reduz a química em ${Math.abs(impact.delta)} ponto(s).`,
        ['R481', 'R484'],
        Math.min(20, 6 + Math.abs(impact.delta) * 2)
      ));
    }
  }

  const scenario = input.tacticalTwin?.scenarios.find((item) => item.id === (input.currentScenario ?? 'base')) ?? null;
  if (scenario && scenario.defensiveSecurity >= 80 && input.matchVision?.evidence.confirmedMarkers) {
    const riskyPattern = input.matchVision.recurringPatterns.find((item) =>
      item.occurrences >= 2 && ['dangerous-turnover', 'late-recomposition', 'central-corridor-open'].includes(item.kind)
    );
    if (riskyPattern) {
      conflicts.push(conflictR500(
        `structure-match:${riskyPattern.kind}`,
        'MATERIAL',
        'Segurança estrutural com risco real de transição',
        `R480 aponta segurança ${scenario.defensiveSecurity}, enquanto R482 confirmou ${riskyPattern.occurrences} ocorrência(s) de ${riskyPattern.label}.`,
        ['R480', 'R482'],
        12
      ));
    }
  }

  return conflicts.sort((left, right) => {
    const rank = { BLOCKING: 0, MATERIAL: 1, LOW: 2, NONE: 3 } as const;
    return rank[left.level] - rank[right.level] || left.id.localeCompare(right.id);
  });
}

function familyStrengthR500(evidence: TacticalDirectorEvidenceR500[], family: TacticalDirectorEvidenceFamilyR500) {
  return evidence
    .filter((item) => item.family === family)
    .reduce((best, item) => Math.max(best, item.effectiveWeight), 0);
}

function executionConfidenceR500(input: TacticalDirectorInputR500) {
  const values: number[] = [];
  if (input.squadBrain?.coverage.length) {
    const statusScore = { forte: 90, adequada: 75, fraca: 45, critica: 20 } as const;
    values.push(
      input.squadBrain.coverage.reduce((sum, item) => sum + statusScore[item.status], 0) /
        input.squadBrain.coverage.length
    );
  }
  if (input.squadBrain?.rotations.length) {
    values.push(
      input.squadBrain.rotations.reduce((sum, item) => sum + item.readiness, 0) /
        input.squadBrain.rotations.length
    );
  }
  if (input.chemistry) {
    values.push(input.chemistry.score, input.chemistry.confidence);
  }
  return values.length ? clamp100R500(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export function directorConfidenceR500({
  input,
  evidence,
  conflicts,
  memory
}: DirectorConfidenceInputR500): TacticalDirectorConfidenceR500 {
  const structural = familyStrengthR500(evidence, 'STRUCTURAL_TEAM');
  const match = familyStrengthR500(evidence, 'MATCH_CONFIRMED');
  const proMeta = familyStrengthR500(evidence, 'PRO_META');
  const build = familyStrengthR500(evidence, 'BUILD_ALTERNATIVE');
  const blocking = conflicts.some((item) => item.level === 'BLOCKING');
  const materialPenalty = conflicts
    .filter((item) => item.level === 'MATERIAL')
    .reduce((sum, item) => sum + item.penalty, 0);
  const integrity = blocking ? 0 : Math.max(0, 1 - Math.min(0.5, materialPenalty / 100));

  const rawPlan = structural * 35 + match * 30 + proMeta * 20 + integrity * 10 + build * 5;
  const independentFamilies = [
    structural > 0 ? 'STRUCTURAL_TEAM' : null,
    match > 0 ? 'MATCH_CONFIRMED' : null,
    proMeta > 0 ? 'PRO_META' : null,
    build > 0 ? 'BUILD_ALTERNATIVE' : null
  ].filter(Boolean).length;
  const hasRealMatch = match > 0 || memory.confirmedSessions > 0;
  const cap = !hasRealMatch
    ? 65
    : memory.state === 'CONFIRMADO' && independentFamilies >= 3
      ? 100
      : 85;
  const planConfidence = blocking ? 0 : clamp100R500(Math.min(cap, rawPlan));

  const substantiveStrengths = [structural, match, proMeta, build].filter((value) => value > 0);
  const evidenceBase = substantiveStrengths.length
    ? substantiveStrengths.reduce((sum, value) => sum + value, 0) / substantiveStrengths.length * 100
    : 0;
  const evidenceConfidence = blocking
    ? 0
    : clamp100R500(evidenceBase - Math.min(30, materialPenalty * 0.6));

  return {
    planConfidence,
    evidenceConfidence,
    executionConfidence: blocking ? 0 : executionConfidenceR500(input)
  };
}
