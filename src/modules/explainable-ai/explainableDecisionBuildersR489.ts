import type {
  EvidenceFamilyR489,
  EvidenceSourceR489,
  ExplainableDecisionInputR489,
  ExplainableEvidenceR489,
  ExplainableReasonR489
} from './explainableDecisionTypesR489';
import {
  effectiveWeightR489,
  independenceForR489,
  type EvidenceOriginR489
} from './explainableEvidenceR489';

export type ExplainablePiecesR489 = {
  evidence: ExplainableEvidenceR489[];
  reasons: ExplainableReasonR489[];
  benefits: string[];
  tradeOffs: string[];
  risks: string[];
  alternatives: string[];
  limitations: string[];
};

const EMPTY_PIECES_R489: ExplainablePiecesR489 = {
  evidence: [], reasons: [], benefits: [], tradeOffs: [], risks: [], alternatives: [], limitations: []
};

function cleanIdR489(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'sem-id';
}

function evidenceR489(args: {
  id: string;
  source: EvidenceSourceR489;
  family: EvidenceFamilyR489;
  claim: string;
  nativeConfidence: number;
  relevance?: number;
  origin?: EvidenceOriginR489;
  completeness?: number;
  fingerprint: string;
}): ExplainableEvidenceR489 {
  const relevance = args.relevance ?? 1;
  const independence = independenceForR489(args.source, args.origin ?? 'INDEPENDENT');
  const completeness = args.completeness ?? 1;
  return {
    id: args.id,
    source: args.source,
    family: args.family,
    claim: args.claim,
    nativeConfidence: args.nativeConfidence,
    relevance,
    independence,
    completeness,
    effectiveWeight: effectiveWeightR489({
      nativeConfidence: args.nativeConfidence,
      relevance,
      independence,
      completeness
    }),
    fingerprint: args.fingerprint
  };
}

function reasonR489(
  type: ExplainableReasonR489['type'],
  title: string,
  explanation: string,
  evidenceIds: string[],
  impact: number
): ExplainableReasonR489 {
  return { rank: 0, type, title, explanation, evidenceIds, impact };
}

function buildBuildPiecesR489(input: Extract<ExplainableDecisionInputR489, { kind: 'BUILD' }>): ExplainablePiecesR489 {
  const simulator = input.buildSimulator;
  if (!simulator || input.availability.r483 !== 'AVAILABLE') {
    return simulator?.blockedReason
      ? { ...EMPTY_PIECES_R489, limitations: [simulator.blockedReason] }
      : { ...EMPTY_PIECES_R489 };
  }
  if (simulator.blockedReason) {
    return { ...EMPTY_PIECES_R489, limitations: [simulator.blockedReason] };
  }

  const variants = simulator.variants.filter((variant) => variant.id !== 'official');
  const evidence = variants.map((variant) => evidenceR489({
    id: `R483:variant:${variant.id}`,
    source: 'R483',
    family: 'BUILD_ALTERNATIVES',
    claim: `${variant.label}: ${variant.explanation}`,
    nativeConfidence: 0,
    fingerprint: `R483:${simulator.baselineFingerprint ?? 'sem-fingerprint'}:${variant.id}`
  }));
  const alternatives = variants.map((variant) => `${variant.label}: ${variant.explanation}`);
  const tradeOffs = variants.map((variant) => {
    const gains = variant.strengths.length ? variant.strengths.join(', ') : 'ganho funcional localizado';
    const losses = variant.sacrifices.length ? variant.sacrifices.join(', ') : 'sem sacrifício adicional descrito';
    return `${variant.label}: ${gains}; troca: ${losses}.`;
  });
  const reasons = evidence.map((item, index) => reasonR489(
    'TRADE_OFF',
    `Alternativa ${variants[index]?.label ?? 'comparável'}`,
    tradeOffs[index] ?? item.claim,
    [item.id],
    Math.max(1, Math.abs(Number(variants[index]?.score ?? 0)))
  ));

  return { ...EMPTY_PIECES_R489, evidence, reasons, alternatives, tradeOffs };
}

function buildStarterPiecesR489(input: Extract<ExplainableDecisionInputR489, { kind: 'STARTER' }>): ExplainablePiecesR489 {
  const evidence: ExplainableEvidenceR489[] = [];
  const reasons: ExplainableReasonR489[] = [];
  const benefits: string[] = [];
  const risks: string[] = [];
  const starter = input.starter;
  const brain = input.squadBrain;

  const realStarter = starter && brain?.core?.some((item) => item.playerId === starter.playerId && item.playerName === starter.playerName);
  if (input.availability.r481 === 'AVAILABLE' && starter && brain && realStarter) {
    const id = `R481:starter:${cleanIdR489(starter.playerId)}`;
    const claim = `${starter.playerName}: importância ${starter.importance}/100 e diferença para reposição ${starter.replacementGap}.`;
    evidence.push(evidenceR489({
      id,
      source: 'R481',
      family: 'SQUAD_STRUCTURE',
      claim,
      nativeConfidence: brain.confidence,
      fingerprint: `${brain.version}:${starter.playerId}`
    }));
    benefits.push(starter.reason || claim);
    reasons.push(reasonR489('BENEFIT', 'Importância para a titularidade', starter.reason || claim, [id], starter.importance));
    if (starter.replacementGap > 0) {
      risks.push(`A melhor reposição está ${starter.replacementGap} ponto(s) abaixo no diagnóstico R481.`);
    }
  }

  const chemistry = input.chemistry;
  if (input.availability.r484 === 'AVAILABLE' && starter && chemistry) {
    const links = chemistry.links.filter((link) =>
      link.leftId === starter.playerId || link.rightId === starter.playerId
      || link.leftName === starter.playerName || link.rightName === starter.playerName
    );
    if (links.length) {
      const link = links.slice().sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))[0];
      const id = `R484:link:${cleanIdR489(link.id)}`;
      const partner = link.leftId === starter.playerId || link.leftName === starter.playerName ? link.rightName : link.leftName;
      const claim = `Entrosamento com ${partner}: ${link.score}/100 (${link.label}).`;
      evidence.push(evidenceR489({
        id,
        source: 'R484',
        family: 'CHEMISTRY',
        claim,
        nativeConfidence: link.confidence,
        origin: 'CHEMISTRY_ONLY',
        fingerprint: `${chemistry.version}:${link.id}`
      }));
      benefits.push(claim);
      reasons.push(reasonR489('BENEFIT', 'Entrosamento confirmado', claim, [id], link.score));
    }
  }

  return { ...EMPTY_PIECES_R489, evidence, reasons, benefits, risks };
}

function buildRotationPiecesR489(input: Extract<ExplainableDecisionInputR489, { kind: 'ROTATION' }>): ExplainablePiecesR489 {
  const evidence: ExplainableEvidenceR489[] = [];
  const reasons: ExplainableReasonR489[] = [];
  const benefits: string[] = [];
  const risks: string[] = [];
  const rotation = input.rotation;
  const scenario = input.scenario;

  const realScenario = scenario && input.tacticalTwin?.scenarios?.some((item) => item.id === scenario.id);
  if (input.availability.r480 === 'AVAILABLE' && scenario && input.tacticalTwin && realScenario) {
    const id = `R480:scenario:${scenario.id}`;
    evidence.push(evidenceR489({
      id, source: 'R480', family: 'TACTICAL_STRUCTURE', claim: scenario.summary,
      nativeConfidence: scenario.confidence, fingerprint: `${input.tacticalTwin.version}:${scenario.id}`
    }));
    reasons.push(reasonR489('BENEFIT', scenario.label, scenario.summary, [id], scenario.readiness));
  }

  const realRotation = rotation && input.squadBrain?.rotations?.some((item) =>
    item.reserveId === rotation.reserveId && item.replaces === rotation.replaces
  );
  if (input.availability.r481 === 'AVAILABLE' && rotation && input.squadBrain && realRotation) {
    const id = `R481:rotation:${cleanIdR489(rotation.reserveId)}:${cleanIdR489(rotation.replaces)}`;
    evidence.push(evidenceR489({
      id, source: 'R481', family: 'SQUAD_STRUCTURE', claim: rotation.reason,
      nativeConfidence: input.squadBrain.confidence, origin: 'SAME_R480_CLAIM',
      fingerprint: `${input.squadBrain.version}:${rotation.reserveId}:${rotation.replaces}`
    }));
    benefits.push(rotation.reason);
    reasons.push(reasonR489('BENEFIT', 'Rotação real do Squad Brain', rotation.reason, [id], rotation.readiness));
  }

  const chemistryImpact = rotation && input.chemistry?.rotations?.find((item) =>
    item.reserveId === rotation.reserveId && item.replaces === rotation.replaces
  );
  if (input.availability.r484 === 'AVAILABLE' && input.chemistry && chemistryImpact) {
    const id = `R484:rotation:${cleanIdR489(chemistryImpact.reserveId)}:${cleanIdR489(chemistryImpact.replaces)}`;
    const claim = `${chemistryImpact.summary} Variação química ${chemistryImpact.delta >= 0 ? '+' : ''}${chemistryImpact.delta}.`;
    evidence.push(evidenceR489({
      id, source: 'R484', family: 'CHEMISTRY', claim,
      nativeConfidence: chemistryImpact.confidence, origin: 'R481_ROTATION_DERIVED',
      fingerprint: `${input.chemistry.version}:${chemistryImpact.reserveId}:${chemistryImpact.replaces}`
    }));
    const type = chemistryImpact.delta < 0 ? 'TRADE_OFF' : 'BENEFIT';
    reasons.push(reasonR489(type, 'Impacto no entrosamento', claim, [id], Math.abs(chemistryImpact.delta)));
    if (chemistryImpact.delta < 0) risks.push(claim); else benefits.push(claim);
  }

  return { ...EMPTY_PIECES_R489, evidence, reasons, benefits, risks };
}

function buildTacticalPiecesR489(input: Extract<ExplainableDecisionInputR489, { kind: 'TACTICAL' }>): ExplainablePiecesR489 {
  const evidence: ExplainableEvidenceR489[] = [];
  const reasons: ExplainableReasonR489[] = [];
  const benefits: string[] = [];
  const risks: string[] = [];
  const scenario = input.scenario;
  const realScenario = scenario && input.tacticalTwin?.scenarios?.some((item) => item.id === scenario.id);

  if (input.availability.r480 === 'AVAILABLE' && scenario && input.tacticalTwin && realScenario) {
    const id = `R480:scenario:${scenario.id}`;
    evidence.push(evidenceR489({
      id, source: 'R480', family: 'TACTICAL_STRUCTURE', claim: scenario.summary,
      nativeConfidence: scenario.confidence, fingerprint: `${input.tacticalTwin.version}:${scenario.id}`
    }));
    benefits.push(scenario.summary);
    reasons.push(reasonR489('BENEFIT', `Cenário ${scenario.label}`, scenario.summary, [id], scenario.readiness));
    if (scenario.transitionRisk >= 50) risks.push(`Risco de transição ${scenario.transitionRisk}/100 no R480.`);
  }

  const bench = scenario && input.squadBrain?.scenarioBench?.find((item) => item.scenario === scenario.id);
  if (input.availability.r481 === 'AVAILABLE' && input.squadBrain && bench) {
    const id = `R481:scenario:${scenario?.id ?? 'sem-cenario'}`;
    evidence.push(evidenceR489({
      id, source: 'R481', family: 'SQUAD_STRUCTURE', claim: bench.rationale,
      nativeConfidence: input.squadBrain.confidence, origin: 'SAME_R480_CLAIM',
      fingerprint: `${input.squadBrain.version}:${bench.scenario}`
    }));
    reasons.push(reasonR489('BENEFIT', 'Cobertura do elenco', bench.rationale, [id], 60));
  }

  if (input.availability.r484 === 'AVAILABLE' && input.chemistry) {
    const graph = input.chemistry;
    const score = Number.isFinite(graph.score) ? graph.score : null;
    const claim = score == null
      ? `R484 confirma ${graph.evidence.links} ligação(ões) estruturais no desenho atual.`
      : `Química estrutural R484: ${score}/100.`;
    const id = `R484:graph:${cleanIdR489(graph.formation ?? input.decisionId)}`;
    evidence.push(evidenceR489({
      id, source: 'R484', family: 'CHEMISTRY', claim,
      nativeConfidence: graph.confidence, origin: 'CHEMISTRY_ONLY',
      fingerprint: `${graph.version}:${graph.formation ?? input.decisionId}`
    }));
    reasons.push(reasonR489('BENEFIT', 'Química da estrutura', claim, [id], score ?? 50));
  }

  return { ...EMPTY_PIECES_R489, evidence, reasons, benefits, risks };
}

function buildMatchPiecesR489(input: Extract<ExplainableDecisionInputR489, { kind: 'MATCH' }>): ExplainablePiecesR489 {
  const vision = input.matchVision;
  if (input.availability.r482 !== 'AVAILABLE' || !vision) return { ...EMPTY_PIECES_R489 };

  const limitations = vision.evidence.suggestedMarkers > 0
    ? [`${vision.evidence.suggestedMarkers} candidato(s) pendente(s) no R482 não foram usados como prova confirmada.`]
    : [];
  if (vision.evidence.confirmedMarkers <= 0) {
    return { ...EMPTY_PIECES_R489, limitations };
  }

  const evidence: ExplainableEvidenceR489[] = [];
  const reasons: ExplainableReasonR489[] = [];
  const risks: string[] = [];

  for (const window of vision.criticalWindows.filter((item) => item.confirmedEvents > 0)) {
    const id = `R482:window:${cleanIdR489(window.id)}`;
    const claim = `${window.title}: ${window.reason}`;
    evidence.push(evidenceR489({
      id, source: 'R482', family: 'MATCH_EVIDENCE', claim,
      nativeConfidence: vision.confidence, origin: 'CONFIRMED_MATCH',
      completeness: vision.evidence.reviewedCoverage / 100,
      fingerprint: `${vision.version}:${window.id}`
    }));
    risks.push(claim);
    reasons.push(reasonR489('RISK', window.title, window.reason, [id], window.score));
  }

  for (const pattern of vision.recurringPatterns.filter((item) => item.occurrences > 0)) {
    const id = `R482:pattern:${cleanIdR489(pattern.kind)}`;
    const claim = `${pattern.label}: ${pattern.occurrences} ocorrência(s) confirmada(s).`;
    evidence.push(evidenceR489({
      id, source: 'R482', family: 'MATCH_EVIDENCE', claim,
      nativeConfidence: vision.confidence, origin: 'CONFIRMED_MATCH',
      completeness: vision.evidence.reviewedCoverage / 100,
      fingerprint: `${vision.version}:${pattern.kind}:${pattern.occurrences}`
    }));
    risks.push(claim);
    reasons.push(reasonR489('RISK', pattern.label, claim, [id], pattern.impact));
  }

  return { ...EMPTY_PIECES_R489, evidence, reasons, risks, limitations };
}

export function buildExplainablePiecesR489(input: ExplainableDecisionInputR489): ExplainablePiecesR489 {
  if (input.kind === 'BUILD') return buildBuildPiecesR489(input);
  if (input.kind === 'STARTER') return buildStarterPiecesR489(input);
  if (input.kind === 'ROTATION') return buildRotationPiecesR489(input);
  if (input.kind === 'TACTICAL') return buildTacticalPiecesR489(input);
  if (input.kind === 'MATCH') return buildMatchPiecesR489(input);
  return { ...EMPTY_PIECES_R489 };
}
