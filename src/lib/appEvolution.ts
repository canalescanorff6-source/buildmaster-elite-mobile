import type { AnalysisResult, PositionCode, TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import { createStableId } from './stableId';

export const ONBOARDING_STORAGE_KEY = 'buildmaster_onboarding_v2680';
export const CARD_REGISTRY_STORAGE_KEY = 'buildmaster_verified_card_registry_v2680';
export const MATCH_VALIDATION_STORAGE_KEY = 'buildmaster_match_validation_v2680';

export type ExperienceMode = 'simple' | 'advanced';

export type OnboardingProfile = {
  version: 1;
  completedAt: string;
  experienceMode: ExperienceMode;
  favoriteFormation: TacticalFormation;
  teamStyle: TacticalStyle;
  goal: 'fichas' | 'elenco' | 'formacoes' | 'treino';
};

export type DecisionWeight = {
  key: 'position' | 'function' | 'style' | 'attributes' | 'skills' | 'context';
  label: string;
  weight: number;
  confidence: number;
  reason: string;
};

export type CardRegistrySource = 'print' | 'manual' | 'imported' | 'official_source';
export type CardRegistryStatus = 'confirmed' | 'review';

export type CardRegistryEntry = {
  id: string;
  fingerprint: string;
  playerName: string;
  mainPosition: string;
  targetPosition: string;
  playstyle: string;
  level: number | null;
  points: number;
  nativeSkills: string[];
  attributeSignature: string;
  source: CardRegistrySource;
  sourceLabel: string;
  sourceUrl: string;
  cardVersion: string;
  observedAt: string;
  status: CardRegistryStatus;
  confirmedAt: string;
  updatedAt: string;
  note: string;
  canonicalId?: string;
  canonicalVersionKey?: string;
  structuralConfidence?: number;
  fieldConfidence?: Array<{ key: string; confidence: number; status: string }>;
  additionalSkills?: string[];
  specialSkills?: string[];
};

export type MatchValidationRating = 1 | 2 | 3 | 4 | 5;
export type MatchValidationMode = 'ranked' | 'events' | 'friendly' | 'offline';
export type MatchConnectionState = 'stable' | 'variable' | 'high_delay';

export type MatchPerformanceMetrics = {
  goals: number;
  assists: number;
  passErrors: number;
  tackles: number;
  interceptions: number;
  ballLosses: number;
  dribblesCompleted: number;
  shots: number;
  saves?: number;
  goalsConceded?: number;
  clearances?: number;
  blocks?: number;
  aerialDuelsWon?: number;
  duelsWon?: number;
  recoveries?: number;
  progressivePasses?: number;
  keyPasses?: number;
  shotsOnTarget?: number;
  runsBehind?: number;
  successfulPressures?: number;
};

export type MatchValidationRecord = {
  id: string;
  cardFingerprint: string;
  playerName: string;
  targetPosition: PositionCode;
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  buildName: string;
  buildSignature: string;
  playedAt: string;
  minutes: number;
  overallRating: MatchValidationRating;
  passing: MatchValidationRating;
  movement: MatchValidationRating;
  finishing: MatchValidationRating;
  defending: MatchValidationRating;
  physical: MatchValidationRating;
  stamina: MatchValidationRating;
  tags: string[];
  note: string;
  mode?: MatchValidationMode;
  connection?: MatchConnectionState;
  gameplayProfileId?: string;
  secondHalfDrop?: boolean;
  metrics?: MatchPerformanceMetrics;
  testedBuildId?: string;
  testedBuildTitle?: string;
  testedBoosterName?: string;
  experimentArm?: 'A' | 'B' | 'NONE';
  controlStyle?: 'quick-pass' | 'carry-dribble' | 'mixed' | 'manual-defense';
  inputDelayRating?: 1 | 2 | 3 | 4 | 5;
};

export type MatchValidationSummary = {
  totalMatches: number;
  average: number;
  consistency: number;
  strongestAreas: string[];
  weakestAreas: string[];
  repeatedProblems: Array<{ tag: string; count: number }>;
  recommendation: string;
  confidence: 'baixa' | 'média' | 'alta';
  evidence?: {
    goals: number;
    assists: number;
    passErrors: number;
    tackles: number;
    interceptions: number;
    ballLosses: number;
    dribblesCompleted: number;
    shots: number;
    rankedMatches: number;
    delayedMatches: number;
    secondHalfDrops: number;
  };
};

const normalize = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function roundedAttributes(result: AnalysisResult) {
  return Object.entries(result.parsed.attributes)
    .filter(([, value]) => Number.isFinite(value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${Math.round(Number(value))}`)
    .join('|');
}

export function cardFingerprint(result: AnalysisResult) {
  const payload = [
    normalize(result.parsed.playerName),
    result.parsed.mainPosition,
    normalize(result.parsed.playstyle),
    result.parsed.level ?? 0,
    result.trainingPointsTotal,
    roundedAttributes(result),
    [...result.parsed.nativeSkills].map(normalize).sort().join(','),
    [...(result.parsed.additionalSkills ?? [])].map(normalize).sort().join(','),
    [...result.parsed.specialSkills].map(normalize).sort().join(',')
  ].join('::');
  return `card-${stableHash(payload)}`;
}

export function buildSignature(result: AnalysisResult) {
  const training = Object.entries(result.training)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${Number(value)}`)
    .join('|');
  return `build-${stableHash(`${cardFingerprint(result)}::${result.bestPosition.code}::${normalize(result.buildName)}::${training}`)}`;
}

export function createCardRegistryEntry(result: AnalysisResult, source: CardRegistrySource, note = '', metadata: { sourceLabel?: string; sourceUrl?: string; cardVersion?: string; observedAt?: string } = {}): CardRegistryEntry {
  const now = new Date().toISOString();
  const fingerprint = cardFingerprint(result);
  const registryId = result.structuralPrecision?.canonical.canonicalId ?? fingerprint;
  return {
    id: registryId,
    fingerprint,
    playerName: result.parsed.playerName,
    mainPosition: result.parsed.mainPositionPt,
    targetPosition: result.bestPosition.label,
    playstyle: result.parsed.playstyle || 'Não informado',
    level: Number.isFinite(result.parsed.level) ? Number(result.parsed.level) : null,
    points: result.trainingPointsTotal,
    nativeSkills: [...result.parsed.nativeSkills],
    additionalSkills: [...(result.parsed.additionalSkills ?? [])],
    specialSkills: [...result.parsed.specialSkills],
    attributeSignature: roundedAttributes(result),
    source,
    sourceLabel: metadata.sourceLabel?.trim() || (source === 'official_source' ? 'Fonte oficial informada pelo usuário' : source === 'print' ? 'Print revisado' : source === 'manual' ? 'Preenchimento manual' : 'Registro importado'),
    sourceUrl: metadata.sourceUrl?.trim() || '',
    cardVersion: metadata.cardVersion?.trim() || '',
    observedAt: metadata.observedAt || now,
    status: result.parsed.confidence >= 85 && result.validation.level !== 'blocked' ? 'confirmed' : 'review',
    confirmedAt: now,
    updatedAt: now,
    note: note.trim(),
    canonicalId: result.structuralPrecision?.canonical.canonicalId,
    canonicalVersionKey: result.structuralPrecision?.canonical.versionKey,
    structuralConfidence: result.structuralPrecision?.criticalConfidence,
    fieldConfidence: result.structuralPrecision?.fields.map((item) => ({ key: item.key, confidence: item.confidence, status: item.status }))
  };
}

export function compareRegistryEntry(entry: CardRegistryEntry, result: AnalysisResult) {
  const differences: string[] = [];
  if (entry.canonicalId && result.structuralPrecision?.canonical.canonicalId) {
    if (entry.canonicalId !== result.structuralPrecision.canonical.canonicalId) differences.push('A identidade canônica desta versão não coincide com o registro salvo.');
  } else if (entry.fingerprint !== cardFingerprint(result)) differences.push('Os atributos, nível, pontos ou habilidades mudaram em relação ao registro salvo.');
  if (normalize(entry.playstyle) !== normalize(result.parsed.playstyle || 'Não informado')) differences.push('O estilo de jogo atual difere do registro salvo.');
  if (entry.mainPosition !== result.parsed.mainPositionPt) differences.push('A posição original atual difere do registro salvo.');
  return {
    matches: differences.length === 0,
    differences
  };
}

function normalizeWeights(items: Array<Omit<DecisionWeight, 'weight'> & { raw: number }>): DecisionWeight[] {
  const total = items.reduce((sum, item) => sum + item.raw, 0) || 1;
  let assigned = 0;
  return items.map((item, index) => {
    const weight = index === items.length - 1 ? 100 - assigned : Math.max(1, Math.round((item.raw / total) * 100));
    assigned += weight;
    return { key: item.key, label: item.label, weight, confidence: item.confidence, reason: item.reason };
  });
}

export function buildDecisionWeights(result: AnalysisResult): DecisionWeight[] {
  const selectedIsNative = result.parsed.positions.includes(result.bestPosition.code) || result.parsed.mainPosition === result.bestPosition.code;
  const styleKnown = Boolean(result.parsed.playstyle);
  const skillEvidence = (result.specialSkillsAnalysis?.ownedOfficial?.length ?? 0) + (result.specialSkillsAnalysis?.missingRecommended?.length ?? 0) || result.parsed.nativeSkills.length;
  const contextKnown = result.tacticalProfile.formation !== 'AUTO' || result.tacticalProfile.style !== 'AUTO' || Boolean(result.tacticalProfile.managerId);
  const attributeCount = Object.values(result.parsed.attributes).filter((value) => Number.isFinite(value)).length;
  const confidence = Math.max(0, Math.min(100, Number(result.parsed.confidence) || 0));

  return normalizeWeights([
    {
      key: 'position', label: 'Posição escolhida', raw: selectedIsNative ? 34 : 39, confidence: 100,
      reason: selectedIsNative ? 'A posição escolhida é compatível com a carta e direciona as metas de atributos.' : 'A adaptação para a posição escolhida exige peso maior para corrigir limites sem trocar sua decisão.'
    },
    {
      key: 'function', label: 'Função em campo', raw: 25, confidence: 94,
      reason: `A função “${result.teamMap?.functionLabel ?? result.buildName}” define quais ações precisam aparecer com mais frequência.`
    },
    {
      key: 'style', label: 'Estilo de jogo', raw: styleKnown ? 18 : 9, confidence: styleKnown ? confidence : 35,
      reason: styleKnown ? `O estilo ${result.parsed.playstyle} ajusta movimentação, prioridades e combinações.` : 'O estilo não foi confirmado; por segurança, sua influência foi reduzida.'
    },
    {
      key: 'attributes', label: 'Base de atributos', raw: attributeCount >= 20 ? 17 : 11, confidence: Math.min(100, confidence + (attributeCount >= 20 ? 4 : -12)),
      reason: `${attributeCount} atributos foram considerados para evitar copiar uma ficha genérica de outra carta.`
    },
    {
      key: 'skills', label: 'Habilidades e ímpetos', raw: skillEvidence ? 12 : 5, confidence: skillEvidence ? Math.max(65, confidence) : 35,
      reason: skillEvidence ? `${skillEvidence} evidência(s) de habilidade influenciam sinergia e desperdício de pontos.` : 'Sem habilidades confirmadas, o motor evita depender delas para decidir a ficha.'
    },
    {
      key: 'context', label: 'Formação e contexto', raw: contextKnown ? 9 : 4, confidence: contextKnown ? 85 : 30,
      reason: contextKnown ? 'Formação, estilo coletivo ou técnico foram usados como ajuste fino, sem mudar a posição escolhida.' : 'O contexto tático está automático e recebeu apenas influência mínima.'
    }
  ]);
}

export function createMatchValidationRecord(result: AnalysisResult, input: Omit<MatchValidationRecord, 'id' | 'cardFingerprint' | 'playerName' | 'targetPosition' | 'formation' | 'teamStyle' | 'buildName' | 'buildSignature' | 'playedAt'>): MatchValidationRecord {
  const playedAt = new Date().toISOString();
  return {
    id: createStableId('match'),
    cardFingerprint: cardFingerprint(result),
    playerName: result.parsed.playerName,
    targetPosition: result.bestPosition.code,
    formation: result.tacticalProfile.formation,
    teamStyle: result.tacticalProfile.style,
    buildName: result.buildName,
    buildSignature: buildSignature(result),
    playedAt,
    ...input
  };
}

const AREA_LABELS: Array<[keyof Pick<MatchValidationRecord, 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina'>, string]> = [
  ['passing', 'Passe'],
  ['movement', 'Movimentação'],
  ['finishing', 'Finalização'],
  ['defending', 'Defesa'],
  ['physical', 'Físico'],
  ['stamina', 'Resistência']
];

export function summarizeMatchValidation(records: MatchValidationRecord[]): MatchValidationSummary {
  if (!records.length) {
    return {
      totalMatches: 0,
      average: 0,
      consistency: 0,
      strongestAreas: [],
      weakestAreas: [],
      repeatedProblems: [],
      recommendation: 'Registre pelo menos três partidas com a mesma ficha para gerar uma recomendação confiável.',
      confidence: 'baixa',
      evidence: {
        goals: 0,
        assists: 0,
        passErrors: 0,
        tackles: 0,
        interceptions: 0,
        ballLosses: 0,
        dribblesCompleted: 0,
        shots: 0,
        rankedMatches: 0,
        delayedMatches: 0,
        secondHalfDrops: 0
      }
    };
  }

  const areaAverages = AREA_LABELS.map(([key, label]) => ({
    label,
    average: records.reduce((sum, record) => sum + Number(record[key]), 0) / records.length
  })).sort((a, b) => b.average - a.average);
  const average = records.reduce((sum, record) => sum + record.overallRating, 0) / records.length;
  const variance = records.reduce((sum, record) => sum + ((record.overallRating - average) ** 2), 0) / records.length;
  const consistency = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 24)));
  const tagCounts = new Map<string, number>();
  records.flatMap((record) => record.tags).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  const repeatedProblems = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'pt-BR'));
  const weakest = areaAverages.slice(-2).reverse();
  const confidence: MatchValidationSummary['confidence'] = records.length >= 8 ? 'alta' : records.length >= 3 ? 'média' : 'baixa';
  const evidence = records.reduce((acc, record) => {
    const metrics = record.metrics;
    acc.goals += Number(metrics?.goals || 0);
    acc.assists += Number(metrics?.assists || 0);
    acc.passErrors += Number(metrics?.passErrors || 0);
    acc.tackles += Number(metrics?.tackles || 0);
    acc.interceptions += Number(metrics?.interceptions || 0);
    acc.ballLosses += Number(metrics?.ballLosses || 0);
    acc.dribblesCompleted += Number(metrics?.dribblesCompleted || 0);
    acc.shots += Number(metrics?.shots || 0);
    if (record.mode === 'ranked') acc.rankedMatches += 1;
    if (record.connection === 'high_delay') acc.delayedMatches += 1;
    if (record.secondHalfDrop) acc.secondHalfDrops += 1;
    return acc;
  }, {
    goals: 0,
    assists: 0,
    passErrors: 0,
    tackles: 0,
    interceptions: 0,
    ballLosses: 0,
    dribblesCompleted: 0,
    shots: 0,
    rankedMatches: 0,
    delayedMatches: 0,
    secondHalfDrops: 0
  });
  const recommendation = repeatedProblems[0]
    ? `O problema “${repeatedProblems[0].tag}” apareceu em ${repeatedProblems[0].count} partidas. Compare a ficha segura antes de alterar a recomendada.`
    : weakest[0].average < 3.2
      ? `${weakest[0].label} é a área mais fraca (${weakest[0].average.toFixed(1)}/5). Faça um teste controlado mudando apenas um grupo de treino.`
      : 'A ficha está consistente. Preserve a construção e continue registrando partidas contra adversários e contextos diferentes.';

  return {
    totalMatches: records.length,
    average: Number(average.toFixed(1)),
    consistency,
    strongestAreas: areaAverages.slice(0, 2).map((item) => `${item.label} ${item.average.toFixed(1)}/5`),
    weakestAreas: weakest.map((item) => `${item.label} ${item.average.toFixed(1)}/5`),
    repeatedProblems,
    recommendation,
    confidence,
    evidence
  };
}

export const MATCH_PROBLEM_TAGS = [
  'Jogador pesado',
  'Passe lento',
  'Errou finalizações',
  'Perdeu divididas',
  'Cansou cedo',
  'Não conseguiu girar',
  'Avançou demais',
  'Ficou fora de posição',
  'Marcou bem',
  'Criou boas linhas de passe'
] as const;
