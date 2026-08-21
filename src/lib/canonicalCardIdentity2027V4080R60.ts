import type { AnalysisResult, PositionCode } from './analyzerDomain';

export const CANONICAL_CARD_IDENTITY_2027_R60_VERSION = '40.80-r60-canonical-card-identity-2027' as const;

export type CardDnaScoresR60 = {
  technical: number;
  creation: number;
  finishing: number;
  mobility: number;
  physical: number;
  aerial: number;
  defending: number;
  stamina: number;
  goalkeeper: number;
};

export type PositionCompatibilityR60 = {
  position: PositionCode;
  score: number;
  source: 'NATURAL' | 'CARD_COMPATIBLE' | 'SELECTED' | 'FUNCTIONAL_FAMILY' | 'OUTSIDE_DNA';
};

export type CanonicalCardIdentityR60 = {
  version: typeof CANONICAL_CARD_IDENTITY_2027_R60_VERSION;
  cardKey: string;
  playerKey: string;
  naturalPosition: PositionCode;
  attackPosition: PositionCode;
  defencePosition: PositionCode;
  defencePositionSource: 'EXPLICIT' | 'FALLBACK_SELECTED';
  offensivePlaystyle: string | null;
  defensivePlaystyle: string | null;
  defensivePlaystyleConfirmed: boolean;
  dualPhaseReady: boolean;
  dna: CardDnaScoresR60;
  dominantDna: Array<keyof CardDnaScoresR60>;
  positionCompatibility: PositionCompatibilityR60[];
  physicalFingerprint: string;
  identityConfidence: number;
  rareResourceLock: 'PERMANENT_BY_CARD';
};

export type WithCanonicalCardIdentityR60 = AnalysisResult & {
  canonicalCardIdentity2027R60: CanonicalCardIdentityR60;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mean(values: Array<number | null | undefined>) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function family(position: PositionCode): 'GK' | 'DEF' | 'MID' | 'ATT' {
  if (position === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(position)) return 'DEF';
  if (['DMF', 'CMF', 'LMF', 'RMF', 'AMF'].includes(position)) return 'MID';
  return 'ATT';
}

function explicitDefencePosition(result: AnalysisResult): PositionCode | null {
  const record = result as AnalysisResult & {
    phasePositions2027?: { defence?: PositionCode | null; defensive?: PositionCode | null };
    defensivePosition?: PositionCode | null;
  };
  const candidate = record.phasePositions2027?.defence ?? record.phasePositions2027?.defensive ?? record.defensivePosition ?? null;
  const valid: PositionCode[] = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'];
  return candidate && valid.includes(candidate) ? candidate : null;
}

function cardKey(result: AnalysisResult) {
  const parsed = result.parsed;
  const intrinsicId = clean(parsed.internalId);
  const base = [
    clean(parsed.playerName),
    clean(parsed.cardType),
    parsed.mainPosition,
    parsed.maxOverall ?? parsed.overall ?? '',
    parsed.level ?? '',
    clean(parsed.specialTag)
  ].join('|');
  return intrinsicId ? `${base}|${intrinsicId}` : base;
}

function dnaScores(result: AnalysisResult): CardDnaScoresR60 {
  const a = result.parsed.attributes;
  const p = result.parsed.physicalProfile;
  const physicalModel = mean([
    a.physicalContact,
    a.balance,
    p.trunkCollision ? clamp(Number(p.trunkCollision) * 8) : null,
    p.legCoverageRadius ? clamp(55 + Number(p.legCoverageRadius) * 5) : null
  ]);
  return {
    technical: clamp(mean([a.ballControl, a.dribbling, a.tightPossession, a.balance])),
    creation: clamp(mean([a.lowPass, a.loftedPass, a.ballControl, a.tightPossession])),
    finishing: clamp(mean([a.offensiveAwareness, a.finishing, a.kickingPower, a.curl])),
    mobility: clamp(mean([a.speed, a.acceleration, a.balance, a.stamina])),
    physical: clamp(physicalModel),
    aerial: clamp(mean([a.heading, a.jump, a.physicalContact])),
    defending: clamp(mean([a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression])),
    stamina: clamp(mean([a.stamina, a.speed, a.acceleration])),
    goalkeeper: clamp(mean([a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach]))
  };
}

function compatibility(result: AnalysisResult, attack: PositionCode, defence: PositionCode): PositionCompatibilityR60[] {
  const parsed = result.parsed;
  const positions = new Set<PositionCode>([parsed.mainPosition, ...parsed.positions, attack, defence]);
  const all: PositionCode[] = ['GK','CB','LB','RB','DMF','CMF','LMF','RMF','AMF','SS','CF','LWF','RWF'];
  const out: PositionCompatibilityR60[] = [];
  for (const position of all) {
    let source: PositionCompatibilityR60['source'] = 'OUTSIDE_DNA';
    let score = 18;
    if (position === parsed.mainPosition) {
      source = 'NATURAL'; score = 100;
    } else if (parsed.positions.includes(position)) {
      source = 'CARD_COMPATIBLE'; score = 94;
    } else if (position === attack || position === defence) {
      source = 'SELECTED'; score = family(position) === family(parsed.mainPosition) ? 88 : 67;
    } else if (family(position) === family(parsed.mainPosition)) {
      source = 'FUNCTIONAL_FAMILY'; score = 72;
    }
    if (positions.has(position) && source === 'OUTSIDE_DNA') { source = 'SELECTED'; score = 62; }
    out.push({ position, score, source });
  }
  return out.sort((a,b) => b.score - a.score || a.position.localeCompare(b.position));
}

function physicalFingerprint(result: AnalysisResult) {
  const p = result.parsed.physicalProfile;
  return [
    result.parsed.height ?? '', result.parsed.weight ?? '',
    p.baseHeight ?? '', p.legLength ?? '', p.armSize ?? '', p.shoulderWidth ?? '',
    p.thighSize ?? '', p.calfSize ?? '', p.legCoverageRadius ?? '', p.armCoverageRadius ?? '',
    p.jumpHeight ?? '', p.trunkCollision ?? ''
  ].join('|');
}

function confidence(result: AnalysisResult, dualReady: boolean) {
  const parsed = result.parsed;
  const evidence = parsed.evidence;
  const attrCoverage = clamp((Number(evidence.attributeCount ?? 0) / 24) * 100);
  const skillConfidence = clamp(Number(evidence.skillConfidence ?? 0) <= 1 ? Number(evidence.skillConfidence ?? 0) * 100 : Number(evidence.skillConfidence ?? 0));
  const base = clamp(Number(parsed.confidence ?? 0) <= 1 ? Number(parsed.confidence ?? 0) * 100 : Number(parsed.confidence ?? 0));
  return clamp(
    base * .34 +
    attrCoverage * .28 +
    skillConfidence * .18 +
    (parsed.manualConfirmed ? 100 : 68) * .1 +
    (dualReady ? 100 : 60) * .1
  );
}

export function buildCanonicalCardIdentity2027R60(result: AnalysisResult): CanonicalCardIdentityR60 {
  const attackPosition = result.bestPosition.code;
  const explicitDefence = explicitDefencePosition(result);
  const defencePosition = explicitDefence ?? attackPosition;
  const offensivePlaystyle = result.parsed.offensivePlaystyle ?? result.parsed.playstyle ?? null;
  const defensivePlaystyle = result.parsed.defensivePlaystyle ?? null;
  const dualPhaseReady = Boolean(offensivePlaystyle && defensivePlaystyle);
  const dna = dnaScores(result);
  const dominantDna = (Object.entries(dna) as Array<[keyof CardDnaScoresR60, number]>)
    .filter(([key]) => key !== 'goalkeeper' || result.parsed.mainPosition === 'GK')
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);

  return {
    version: CANONICAL_CARD_IDENTITY_2027_R60_VERSION,
    cardKey: cardKey(result),
    playerKey: clean(result.parsed.playerName),
    naturalPosition: result.parsed.mainPosition,
    attackPosition,
    defencePosition,
    defencePositionSource: explicitDefence ? 'EXPLICIT' : 'FALLBACK_SELECTED',
    offensivePlaystyle,
    defensivePlaystyle,
    defensivePlaystyleConfirmed: Boolean(result.parsed.defensivePlaystyleConfirmed),
    dualPhaseReady,
    dna,
    dominantDna,
    positionCompatibility: compatibility(result, attackPosition, defencePosition),
    physicalFingerprint: physicalFingerprint(result),
    identityConfidence: confidence(result, dualPhaseReady),
    rareResourceLock: 'PERMANENT_BY_CARD'
  };
}

/**
 * r60 não altera a ficha. Ele fixa a identidade canônica que os especialistas
 * podem consultar. A escrita da progressão continua exclusiva do Motor Mestre.
 */
export function applyCanonicalCardIdentity2027R60(result: AnalysisResult): AnalysisResult {
  const identity = buildCanonicalCardIdentity2027R60(result);
  return {
    ...result,
    canonicalCardIdentity2027R60: identity,
    recommendationExplanation: [
      `Fundação 2027 r60: identidade canônica ${identity.cardKey}.`,
      `DNA dominante: ${identity.dominantDna.join(' + ')}; confiança ${Math.round(identity.identityConfidence)}%.`,
      `Fase ofensiva: ${identity.attackPosition} • ${identity.offensivePlaystyle ?? 'estilo ainda não confirmado'}.`,
      `Fase defensiva: ${identity.defencePosition} • ${identity.defensivePlaystyle ?? 'estilo ainda não confirmado'}.`,
      identity.defencePositionSource === 'FALLBACK_SELECTED'
        ? 'Posição defensiva ainda não foi informada explicitamente; r60 preserva a posição selecionada sem inventar uma nova.'
        : 'Posição defensiva explícita incorporada à identidade canônica.',
      ...result.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,72)
  } as WithCanonicalCardIdentityR60;
}
