import type { TacticalDirectorConflictR500, TacticalDirectorEvidenceR500, TacticalDirectorInputR500 } from './tacticalDirectorTypesR500';

export type WeightPartsR500 = {
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  contextCompatibility: number;
};

function clamp01R500(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp100R500(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function effectiveWeightR500(parts: WeightPartsR500): number {
  const value = clamp01R500(parts.nativeConfidence / 100)
    * clamp01R500(parts.relevance)
    * clamp01R500(parts.independence)
    * clamp01R500(parts.completeness)
    * clamp01R500(parts.contextCompatibility);
  return Number(value.toFixed(4));
}

function evidenceR500(
  item: Omit<TacticalDirectorEvidenceR500, 'effectiveWeight'>
): TacticalDirectorEvidenceR500 {
  return {
    ...item,
    effectiveWeight: effectiveWeightR500(item)
  };
}

function scenarioForInputR500(input: TacticalDirectorInputR500) {
  const id = input.currentScenario ?? 'base';
  return input.tacticalTwin?.scenarios.find((item) => item.id === id) ?? null;
}

export function collectDirectorEvidenceR500(input: TacticalDirectorInputR500): TacticalDirectorEvidenceR500[] {
  const result: TacticalDirectorEvidenceR500[] = [];
  const scenario = scenarioForInputR500(input);

  if (input.tacticalTwin && scenario) {
    result.push(evidenceR500({
      id: `R480:scenario:${scenario.id}`,
      family: 'STRUCTURAL_TEAM',
      source: 'R480',
      claim: `${scenario.label}: ${scenario.summary}`,
      nativeConfidence: scenario.confidence,
      relevance: 1,
      independence: 1,
      completeness: 1,
      contextCompatibility: 1,
      fingerprint: `R480:${input.tacticalTwin.version}:${scenario.id}`
    }));
  }

  const rotation = input.squadBrain?.rotations[0] ?? null;
  if (input.squadBrain && rotation) {
    result.push(evidenceR500({
      id: `R481:rotation:${rotation.reserveId}:${rotation.replaces}`,
      family: 'STRUCTURAL_TEAM',
      source: 'R481',
      claim: `${rotation.reserveName} pode substituir ${rotation.replaces}: ${rotation.reason}`,
      nativeConfidence: input.squadBrain.confidence,
      relevance: 0.9,
      independence: 0.75,
      completeness: 1,
      contextCompatibility: 1,
      fingerprint: `R481:${input.squadBrain.version}:${rotation.reserveId}:${rotation.replaces}`
    }));
  }

  if (input.chemistry) {
    result.push(evidenceR500({
      id: 'R484:chemistry:team',
      family: 'STRUCTURAL_TEAM',
      source: 'R484',
      claim: `Química estrutural ${input.chemistry.score}/100.`,
      nativeConfidence: input.chemistry.confidence,
      relevance: 0.9,
      independence: 0.65,
      completeness: input.chemistry.evidence.links > 0 ? 1 : 0.6,
      contextCompatibility: 1,
      fingerprint: `R484:${input.chemistry.version}:${input.chemistry.formation}:${input.chemistry.teamStyle}`
    }));
  }

  if (input.matchVision && input.matchVision.evidence.confirmedMarkers > 0) {
    const recurring = input.matchVision.recurringPatterns[0];
    result.push(evidenceR500({
      id: `R482:match:${recurring?.kind ?? 'confirmed'}`,
      family: 'MATCH_CONFIRMED',
      source: 'R482',
      claim: recurring
        ? `${recurring.label}: ${recurring.occurrences} ocorrência(s) confirmada(s).`
        : `${input.matchVision.evidence.confirmedMarkers} marcador(es) confirmado(s) na partida.`,
      nativeConfidence: input.matchVision.confidence,
      relevance: 1,
      independence: 1,
      completeness: clamp01R500(input.matchVision.evidence.reviewedCoverage / 100),
      contextCompatibility: 1,
      fingerprint: `R482:${input.matchVision.version}:${input.matchVision.configuredContext.formation}:${input.matchVision.configuredContext.teamStyle}`
    }));
  }

  if (input.buildSimulator && !input.buildSimulator.blockedReason && input.buildSimulator.variants.length > 1) {
    result.push(evidenceR500({
      id: 'R483:build:alternatives',
      family: 'BUILD_ALTERNATIVE',
      source: 'R483',
      claim: `${input.buildSimulator.variants.length - 1} alternativa(s) reais de ficha disponíveis para comparação.`,
      nativeConfidence: 80,
      relevance: 0.6,
      independence: 1,
      completeness: 1,
      contextCompatibility: 1,
      fingerprint: `R483:${input.buildSimulator.version}:${input.buildSimulator.baselineFingerprint ?? 'SEM_BASELINE'}`
    }));
  }

  return result;
}

export function detectDirectorConflictsR500(input: TacticalDirectorInputR500): TacticalDirectorConflictR500[] {
  const conflicts: TacticalDirectorConflictR500[] = [];
  const rotation = input.squadBrain?.rotations[0] ?? null;
  if (rotation && input.chemistry) {
    const impact = input.chemistry.rotations.find((item) => item.reserveId === rotation.reserveId && item.replaces === rotation.replaces);
    if (impact && impact.delta <= -3) {
      conflicts.push({
        id: `conflict:rotation-chemistry:${rotation.reserveId}:${rotation.replaces}`,
        level: 'MATERIAL',
        title: 'Rotação com custo de química',
        description: `${rotation.reserveName} tem prontidão de rotação, mas a química varia ${impact.delta} ponto(s).`,
        sourceIds: [`R481:rotation:${rotation.reserveId}:${rotation.replaces}`, 'R484:chemistry:team'],
        penalty: Math.min(18, Math.abs(impact.delta) * 2)
      });
    }
  }

  const scenario = scenarioForInputR500(input);
  const recurringRisk = input.matchVision?.recurringPatterns.find((item) =>
    item.occurrences >= 2 && (item.kind === 'dangerous-turnover' || item.kind === 'late-recomposition')
  );
  if (scenario && scenario.defensiveSecurity >= 75 && recurringRisk && input.matchVision?.evidence.confirmedMarkers) {
    conflicts.push({
      id: `conflict:structure-match:${recurringRisk.kind}`,
      level: 'MATERIAL',
      title: 'Estrutura segura, execução de partida vulnerável',
      description: `R480 estima segurança defensiva ${scenario.defensiveSecurity}/100, mas a partida confirmou ${recurringRisk.occurrences} ocorrência(s) de ${recurringRisk.label.toLocaleLowerCase('pt-BR')}.`,
      sourceIds: [`R480:scenario:${scenario.id}`, `R482:match:${recurringRisk.kind}`],
      penalty: 10
    });
  }

  return conflicts;
}

export function directorConfidenceR500(
  input: TacticalDirectorInputR500,
  evidence: TacticalDirectorEvidenceR500[],
  conflicts: TacticalDirectorConflictR500[]
) {
  const structural = evidence.filter((item) => item.family === 'STRUCTURAL_TEAM');
  const match = evidence.filter((item) => item.family === 'MATCH_CONFIRMED');
  const build = evidence.filter((item) => item.family === 'BUILD_ALTERNATIVE');
  const structuralStrength = structural.length ? Math.max(...structural.map((item) => item.effectiveWeight)) : 0;
  const matchStrength = match.length ? Math.max(...match.map((item) => item.effectiveWeight)) : 0;
  const buildStrength = build.length ? Math.max(...build.map((item) => item.effectiveWeight)) : 0;
  const conflictPenalty = conflicts.reduce((sum, item) => sum + item.penalty, 0);

  let planConfidence = clamp100R500(structuralStrength * 35 + matchStrength * 30 + buildStrength * 5 + 10 - conflictPenalty);
  if (!match.length) planConfidence = Math.min(65, planConfidence);

  const evidenceConfidence = evidence.length
    ? clamp100R500((evidence.reduce((sum, item) => sum + item.effectiveWeight, 0) / evidence.length) * 100 - conflictPenalty)
    : 0;
  const executionValues = [input.squadBrain?.confidence, input.chemistry?.confidence].filter((item): item is number => typeof item === 'number');
  const executionConfidence = executionValues.length
    ? clamp100R500(executionValues.reduce((sum, item) => sum + item, 0) / executionValues.length - conflictPenalty / 2)
    : 0;

  return { planConfidence, evidenceConfidence, executionConfidence };
}
