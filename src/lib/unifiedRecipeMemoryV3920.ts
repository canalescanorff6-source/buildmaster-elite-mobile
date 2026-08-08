import type { AnalysisResult, AttributeKey, TrainingKey, TrainingPlan } from './analyzerDomain';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_KEYS, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';

export const UNIFIED_RECIPE_MEMORY_V3920_KEY = 'unified_recipe_memory_v3920';
const MEMORY_VERSION = '39.20.0';
const MEMORY_LIMIT = 180;

export type UnifiedRecipeMemoryStatusV3920 = 'NOVA' | 'RECUPERADA' | 'ATUALIZADA' | 'IGNORADA';

type AttributeSnapshot = Partial<Record<AttributeKey, number>>;

type RecipeMemoryEntryV3920 = {
  version: typeof MEMORY_VERSION;
  identityKey: string;
  familyKey: string;
  canonicalCardId: string;
  playerName: string;
  mainPosition: string;
  playstyle: string;
  cardType: string;
  specialTag: string;
  level: number | null;
  overall: number | null;
  maxOverall: number | null;
  points: number;
  attributes: AttributeSnapshot;
  nativeSkills: string[];
  additionalSkills: string[];
  specialSkills: string[];
  training: TrainingPlan;
  recommendedSkills: string[];
  recommendedImpetos: AnalysisResult['recommendedImpetos'];
  primaryImpeto: string | null;
  lockSignature: string;
  evidenceScore: number;
  updatedAt: string;
};

type RecipeMemoryEnvelopeV3920 = {
  version: typeof MEMORY_VERSION;
  entries: RecipeMemoryEntryV3920[];
};

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function skillKeys(values: string[]): string[] {
  return Array.from(new Set(values.map(skillIdentityKey).filter(Boolean))).sort();
}

function safeAttributes(result: AnalysisResult): AttributeSnapshot {
  return Object.fromEntries(
    Object.entries(result.parsed.attributes)
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Math.round(Number(value))])
  ) as AttributeSnapshot;
}

function identityParts(result: AnalysisResult): string[] {
  return [
    normalize(result.parsed.playerName),
    normalize(result.parsed.cardType),
    normalize(result.parsed.specialTag),
    result.parsed.mainPosition,
    normalize(result.parsed.playstyle),
    String(result.parsed.level ?? ''),
    String(result.parsed.maxOverall ?? result.parsed.overall ?? ''),
    String(result.trainingPointsTotal),
    skillKeys(result.parsed.specialSkills).join(','),
    skillKeys(result.parsed.nativeSkills).slice(0, 12).join(',')
  ];
}

/**
 * Chave estável da versão. Ela não contém posição escolhida, formação, técnico,
 * nome do arquivo ou contexto da partida.
 */
export function unifiedRecipeIdentityKeyV3920(result: AnalysisResult): string {
  return `recipe-card-v3920-${stableHash(identityParts(result).join('::'))}`;
}

function familyKey(result: AnalysisResult): string {
  return `recipe-family-v3920-${stableHash([
    normalize(result.parsed.playerName),
    result.parsed.mainPosition,
    normalize(result.parsed.playstyle),
    String(result.trainingPointsTotal)
  ].join('::'))}`;
}

function evidenceScore(result: AnalysisResult): number {
  const structural = Number(result.structuralPrecision?.canonical.confidence ?? 0);
  const parsed = Number(result.parsed.confidence ?? 0);
  const attributes = Math.min(100, Number(result.parsed.evidence.attributeCount ?? 0) * 4.25);
  const manual = result.parsed.manualConfirmed ? 100 : 0;
  return Math.round(Math.max(0, Math.min(100, structural * .46 + parsed * .24 + attributes * .2 + manual * .1)));
}

function readMemory(): RecipeMemoryEnvelopeV3920 {
  try {
    const raw = readAccountStorage(UNIFIED_RECIPE_MEMORY_V3920_KEY, { migrateLegacy: false });
    if (!raw) return { version: MEMORY_VERSION, entries: [] };
    const parsed = JSON.parse(raw) as Partial<RecipeMemoryEnvelopeV3920>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter((entry): entry is RecipeMemoryEntryV3920 => Boolean(entry && entry.version === MEMORY_VERSION && entry.identityKey && entry.training))
      : [];
    return { version: MEMORY_VERSION, entries: entries.slice(0, MEMORY_LIMIT) };
  } catch {
    return { version: MEMORY_VERSION, entries: [] };
  }
}

function writeMemory(entries: RecipeMemoryEntryV3920[]): void {
  try {
    writeAccountStorage(UNIFIED_RECIPE_MEMORY_V3920_KEY, JSON.stringify({
      version: MEMORY_VERSION,
      entries: entries.slice(0, MEMORY_LIMIT)
    } satisfies RecipeMemoryEnvelopeV3920));
  } catch {
    // A memória é uma proteção complementar; nunca pode bloquear a análise.
  }
}

function attributeSimilarity(left: AttributeSnapshot, right: AttributeSnapshot): number {
  const common = (Object.keys(left) as AttributeKey[]).filter((key) => Number.isFinite(left[key]) && Number.isFinite(right[key]));
  if (common.length < 10) return 0;
  const closeness = common.map((key) => {
    const distance = Math.abs(Number(left[key]) - Number(right[key]));
    if (distance === 0) return 1;
    if (distance === 1) return .96;
    if (distance === 2) return .86;
    if (distance === 3) return .68;
    return Math.max(0, 1 - distance / 12);
  });
  const average = closeness.reduce((sum, value) => sum + value, 0) / closeness.length;
  const coverage = Math.min(1, common.length / 14);
  return Math.round(average * coverage * 1000) / 1000;
}

function setSimilarity(left: string[], right: string[]): number {
  if (!left.length || !right.length) return .82;
  const a = new Set(left);
  const b = new Set(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / Math.max(a.size, b.size, 1);
}

function compatibleVersion(current: AnalysisResult, entry: RecipeMemoryEntryV3920): boolean {
  if (normalize(current.parsed.playerName) !== normalize(entry.playerName)) return false;
  if (current.parsed.mainPosition !== entry.mainPosition) return false;
  if (normalize(current.parsed.playstyle) !== normalize(entry.playstyle)) return false;
  if (current.trainingPointsTotal !== entry.points) return false;
  const currentType = normalize(current.parsed.cardType);
  const storedType = normalize(entry.cardType);
  if (currentType && storedType && currentType !== storedType) return false;
  const currentTag = normalize(current.parsed.specialTag);
  const storedTag = normalize(entry.specialTag);
  if (currentTag && storedTag && currentTag !== storedTag) return false;
  const currentLevel = numberOrNull(current.parsed.level);
  if (currentLevel != null && entry.level != null && Math.abs(currentLevel - entry.level) > 1) return false;
  const currentOverall = numberOrNull(current.parsed.maxOverall ?? current.parsed.overall);
  const storedOverall = entry.maxOverall ?? entry.overall;
  if (currentOverall != null && storedOverall != null && Math.abs(currentOverall - storedOverall) > 1) return false;
  const nativeSimilarity = setSimilarity(skillKeys(current.parsed.nativeSkills), entry.nativeSkills);
  const specialSimilarity = setSimilarity(skillKeys(current.parsed.specialSkills), entry.specialSkills);
  return nativeSimilarity >= .62 && specialSimilarity >= .62;
}

function createEntry(result: AnalysisResult): RecipeMemoryEntryV3920 | null {
  const unified = result.unifiedPerformanceV3920;
  if (!unified || trainingPlanTotalCost(unified.canonicalTraining) !== result.trainingPointsTotal) return null;
  return {
    version: MEMORY_VERSION,
    identityKey: unifiedRecipeIdentityKeyV3920(result),
    familyKey: familyKey(result),
    canonicalCardId: unified.canonicalCardId,
    playerName: result.parsed.playerName,
    mainPosition: result.parsed.mainPosition,
    playstyle: result.parsed.playstyle ?? '',
    cardType: result.parsed.cardType ?? '',
    specialTag: result.parsed.specialTag ?? '',
    level: numberOrNull(result.parsed.level),
    overall: numberOrNull(result.parsed.overall),
    maxOverall: numberOrNull(result.parsed.maxOverall),
    points: result.trainingPointsTotal,
    attributes: safeAttributes(result),
    nativeSkills: skillKeys(result.parsed.nativeSkills),
    additionalSkills: skillKeys(result.parsed.additionalSkills ?? []),
    specialSkills: skillKeys(result.parsed.specialSkills),
    training: { ...unified.canonicalTraining },
    recommendedSkills: [...result.recommendedSkills],
    recommendedImpetos: result.recommendedImpetos.map((item) => ({ ...item, attributes: [...item.attributes], evidence: item.evidence ? [...item.evidence] : undefined, warnings: item.warnings ? [...item.warnings] : undefined })),
    primaryImpeto: unified.primaryImpeto,
    lockSignature: unified.lockSignature,
    evidenceScore: evidenceScore(result),
    updatedAt: new Date().toISOString()
  };
}

function candidateMatch(result: AnalysisResult, entries: RecipeMemoryEntryV3920[]): { entry: RecipeMemoryEntryV3920; score: number } | null {
  const currentCanonicalId = result.unifiedPerformanceV3920?.canonicalCardId;
  const canonicalExact = currentCanonicalId ? entries.find((entry) => entry.canonicalCardId === currentCanonicalId) : undefined;
  if (canonicalExact) return { entry: canonicalExact, score: 100 };

  const identityKey = unifiedRecipeIdentityKeyV3920(result);
  const currentAttributes = safeAttributes(result);
  const currentAdditional = skillKeys(result.parsed.additionalSkills ?? []);
  const family = familyKey(result);
  const candidates = entries
    .filter((entry) => (entry.identityKey === identityKey || entry.familyKey === family) && compatibleVersion(result, entry))
    .map((entry) => {
      const attrs = attributeSimilarity(currentAttributes, entry.attributes);
      const additional = setSimilarity(currentAdditional, entry.additionalSkills);
      const identityBonus = entry.identityKey === identityKey ? .025 : 0;
      const score = Math.round(Math.min(1, attrs * .88 + additional * .12 + identityBonus) * 100);
      return { entry, score };
    })
    .filter((item) => item.score >= 86)
    .sort((left, right) => right.score - left.score || right.entry.evidenceScore - left.entry.evidenceScore);
  return candidates[0] ?? null;
}

function overlayMemory(result: AnalysisResult, entry: RecipeMemoryEntryV3920, matchScore: number): AnalysisResult {
  const analysis = result.unifiedPerformanceV3920;
  if (!analysis || trainingPlanTotalCost(entry.training) !== result.trainingPointsTotal) return result;
  const pointsUsed = trainingPlanTotalCost(entry.training);
  const canonicalSkills = entry.recommendedSkills.map((name) => analysis.canonicalSkills.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name)) ?? {
    name,
    score: 80,
    priority: 'complementar' as const,
    category: 'mental' as const,
    gameplayImpact: 'Preservada pela memória canônica para impedir variação causada por ruído de leitura.',
    reasons: ['Receita confirmada anteriormente para esta versão exata da carta.'],
    supportedBy: ['memória canônica v39.20'],
    identityBoost: 90
  });
  const memoryNote = `Receita recuperada da memória canônica com correspondência ${matchScore}%. A posição atual alterou somente o diagnóstico tático.`;
  const updatedAnalysis = {
    ...analysis,
    canonicalCardId: entry.canonicalCardId,
    lockSignature: entry.lockSignature,
    canonicalTraining: { ...entry.training },
    canonicalSkills,
    canonicalImpetos: entry.recommendedImpetos.map((item) => ({ ...item })),
    primaryImpeto: entry.primaryImpeto,
    resourceSafety: {
      ...analysis.resourceSafety,
      lockSignature: entry.lockSignature,
      recipeLocked: true,
      reasons: [memoryNote, ...analysis.resourceSafety.reasons].filter((item, index, all) => all.indexOf(item) === index)
    },
    recipeMemory: {
      status: 'RECUPERADA' as const,
      matchScore,
      previousSignature: entry.lockSignature,
      note: memoryNote
    },
    deterministicChecks: [memoryNote, ...analysis.deterministicChecks].filter((item, index, all) => all.indexOf(item) === index),
    summary: `${result.parsed.playerName}: ${memoryNote} ${analysis.positionFit.recommendedUse}`
  };
  const firstVariant = result.buildVariants[0];
  return {
    ...result,
    training: { ...entry.training },
    trainingCost: trainingPlanCost(entry.training),
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - pointsUsed,
    recommendedSkills: [...entry.recommendedSkills],
    recommendedImpetos: entry.recommendedImpetos.map((item) => ({ ...item })),
    buildVariants: firstVariant ? [{ ...firstVariant, training: { ...entry.training }, pointsUsed, note: memoryNote }] : result.buildVariants,
    recommendationExplanation: [memoryNote, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    unifiedPerformanceV3920: updatedAnalysis
  };
}

/**
 * Torna a repetição da mesma carta tolerante a pequenas diferenças do OCR.
 * Em ambientes sem `window` (testes/SSR), a função é deliberadamente neutra.
 */
export function stabilizeUnifiedRecipeFromMemoryV3920(result: AnalysisResult): AnalysisResult {
  if (typeof window === 'undefined' || !result.unifiedPerformanceV3920) return result;
  const memory = readMemory();
  const match = candidateMatch(result, memory.entries);
  const currentEvidence = evidenceScore(result);

  if (match && match.entry.evidenceScore >= currentEvidence - 6) {
    const recovered = overlayMemory(result, match.entry, match.score);
    const refreshed = createEntry(recovered);
    if (refreshed) {
      refreshed.identityKey = match.entry.identityKey;
      refreshed.familyKey = match.entry.familyKey;
      refreshed.evidenceScore = Math.max(match.entry.evidenceScore, currentEvidence);
      const next = [refreshed, ...memory.entries.filter((entry) => entry.identityKey !== match.entry.identityKey)];
      writeMemory(next);
    }
    return recovered;
  }

  const entry = createEntry(result);
  const canRemember = entry && (result.parsed.manualConfirmed || currentEvidence >= 78) && result.unifiedPerformanceV3920.resourceSafety.status !== 'NAO_GASTAR_RECURSOS';
  if (!entry || !canRemember) {
    return {
      ...result,
      unifiedPerformanceV3920: {
        ...result.unifiedPerformanceV3920,
        recipeMemory: {
          status: 'IGNORADA',
          matchScore: 0,
          note: 'A leitura ainda não possui confiança suficiente para travar esta versão na memória canônica.'
        }
      }
    };
  }

  const existing = memory.entries.find((item) => item.identityKey === entry.identityKey);
  const nextEntry = existing && existing.evidenceScore > entry.evidenceScore ? existing : entry;
  writeMemory([nextEntry, ...memory.entries.filter((item) => item.identityKey !== nextEntry.identityKey)]);
  return {
    ...result,
    unifiedPerformanceV3920: {
      ...result.unifiedPerformanceV3920,
      recipeMemory: {
        status: existing ? 'ATUALIZADA' : 'NOVA',
        matchScore: existing ? 100 : 0,
        previousSignature: existing?.lockSignature,
        note: existing
          ? 'A memória canônica foi confirmada novamente sem alterar a receita.'
          : 'Receita registrada na memória canônica desta conta para impedir variações em novas leituras.'
      }
    }
  };
}

export function clearUnifiedRecipeMemoryV3920(): void {
  if (typeof window === 'undefined') return;
  writeMemory([]);
}

export function trainingSignatureV3920(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key: TrainingKey) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}
