export const CLEAN_VAULT_VERSION = '38.00.0' as const;

export type CleanVaultStatus = 'completo' | 'pendente' | 'revisar';

export type CleanVaultEntry = {
  id: string;
  saveKey: string;
  savedAt: string;
  updatedAt: string;
  playerImage?: string | null;
  favorite?: boolean;
  folderId?: string;
  statusTag?: CleanVaultStatus;
  notes?: string;
  personalTags?: string[];
  skillProgress?: Record<string, boolean>;
  result: {
    parsed: {
      playerName: string;
      playstyle?: string | null;
      cardType?: string | null;
      mainPosition?: string;
      level?: number | null;
      overall?: number | null;
      maxOverall?: number | null;
      confidence?: number | null;
      nativeSkills?: string[];
    };
    bestPosition: { code: string; label: string };
    buildName: string;
    training: Record<string, number>;
    trainingPointsUsed: number;
    trainingPointsTotal: number;
    recommendedSkills: string[];
    recommendedImpetos?: Array<{ name: string }>;
    structuralPrecision?: {
      canonical: {
        canonicalId: string;
        versionKey: string;
      };
    };
    advancedMotorV3750?: {
      winner?: {
        boosterName?: string;
      };
    };
    powerBuildV3850?: {
      impetos?: Array<{ name?: string }>;
    };
    maxMatchV3860?: {
      impetoCombinations?: Array<{ impeto?: { name?: string } }>;
    };
    supremeV3870?: {
      impetoStressTests?: Array<{ name?: string }>;
    };
  };
};

export type CleanVaultPlayerGroup<T extends CleanVaultEntry = CleanVaultEntry> = {
  key: string;
  playerName: string;
  entries: T[];
  primary: T;
  cardVersionCount: number;
  buildCount: number;
  favorite: boolean;
  archived: boolean;
  status: CleanVaultStatus;
  updatedAt: string;
};

export type CleanVaultDuplicateGroup<T extends CleanVaultEntry = CleanVaultEntry> = {
  signature: string;
  keeper: T;
  duplicates: T[];
  entryIds: string[];
};

export type CleanVaultSummary = {
  players: number;
  fichas: number;
  favorites: number;
  archived: number;
  review: number;
  duplicateGroups: number;
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseDate(value: string) {
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return direct;
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return 0;
  return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0));
}

function stableTrainingSignature(training: Record<string, number>) {
  return Object.entries(training)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${Math.round(Number(value))}`)
    .join('|');
}

function cleanSkillList(skills: string[]) {
  return Array.from(new Set(skills.map((skill) => normalize(skill)).filter(Boolean))).sort().join('|');
}

export function cleanVaultPlayerKey(entry: CleanVaultEntry) {
  return normalize(entry.result.parsed.playerName) || `sem-nome-${entry.id}`;
}

export function cleanVaultCardVersionKey(entry: CleanVaultEntry) {
  const canonical = entry.result.structuralPrecision?.canonical;
  if (canonical?.canonicalId) return canonical.canonicalId;
  const parsed = entry.result.parsed;
  return [
    cleanVaultPlayerKey(entry),
    normalize(parsed.cardType),
    normalize(parsed.mainPosition),
    parsed.level ?? 'nivel',
    parsed.maxOverall ?? parsed.overall ?? 'overall'
  ].join('::');
}

export function cleanVaultVersionLabel(entry: CleanVaultEntry) {
  const parsed = entry.result.parsed;
  const canonical = entry.result.structuralPrecision?.canonical.versionKey;
  if (canonical) return canonical;
  const cardType = parsed.cardType?.trim() || 'Carta';
  const overall = parsed.maxOverall ?? parsed.overall;
  const level = parsed.level;
  return [cardType, overall ? `GER ${overall}` : '', level ? `Nv. ${level}` : ''].filter(Boolean).join(' · ');
}

export function cleanVaultStatus(entry: CleanVaultEntry): CleanVaultStatus {
  if (entry.statusTag) return entry.statusTag;
  const skills = Array.from(new Set(entry.result.recommendedSkills ?? [])).slice(0, 5);
  if (!skills.length) return 'revisar';
  const done = skills.filter((skill) => Boolean(entry.skillProgress?.[skill])).length;
  return done >= skills.length ? 'completo' : 'pendente';
}

export function cleanVaultIsArchived(entry: CleanVaultEntry) {
  return entry.folderId === 'arquivados';
}

export function cleanVaultIsIntentionalVariant(entry: CleanVaultEntry) {
  return (entry.personalTags ?? []).some((tag) => normalize(tag) === 'variante');
}

export function cleanVaultBuildSignature(entry: CleanVaultEntry) {
  const booster = entry.result.supremeV3870?.impetoStressTests?.[0]?.name
    ?? entry.result.maxMatchV3860?.impetoCombinations?.[0]?.impeto?.name
    ?? entry.result.powerBuildV3850?.impetos?.[0]?.name
    ?? entry.result.advancedMotorV3750?.winner?.boosterName
    ?? entry.result.recommendedImpetos?.[0]?.name
    ?? 'sem-booster';
  return [
    cleanVaultCardVersionKey(entry),
    entry.result.bestPosition.code,
    entry.result.trainingPointsTotal,
    stableTrainingSignature(entry.result.training),
    cleanSkillList(entry.result.recommendedSkills ?? []),
    normalize(booster)
  ].join('::');
}

export function findExactVaultDuplicateByResult<T extends CleanVaultEntry>(entries: T[], candidate: T['result']): T | null {
  const probe: CleanVaultEntry = {
    id: 'probe',
    saveKey: 'probe',
    savedAt: '',
    updatedAt: '',
    result: candidate
  };
  const signature = cleanVaultBuildSignature(probe);
  return entries.find((entry) => !cleanVaultIsArchived(entry) && !cleanVaultIsIntentionalVariant(entry) && cleanVaultBuildSignature(entry) === signature) ?? null;
}

export function detectExactVaultDuplicates<T extends CleanVaultEntry>(entries: T[]): CleanVaultDuplicateGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    if (cleanVaultIsArchived(entry) || cleanVaultIsIntentionalVariant(entry)) continue;
    const signature = cleanVaultBuildSignature(entry);
    const list = groups.get(signature) ?? [];
    list.push(entry);
    groups.set(signature, list);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([signature, list]) => {
      const ordered = [...list].sort((left, right) => Number(Boolean(right.favorite)) - Number(Boolean(left.favorite)) || parseDate(right.updatedAt) - parseDate(left.updatedAt));
      return { signature, keeper: ordered[0], duplicates: ordered.slice(1), entryIds: ordered.map((entry) => entry.id) };
    })
    .sort((left, right) => right.entryIds.length - left.entryIds.length);
}

function groupStatus<T extends CleanVaultEntry>(entries: T[]): CleanVaultStatus {
  const statuses = entries.map(cleanVaultStatus);
  if (statuses.includes('revisar')) return 'revisar';
  if (statuses.includes('pendente')) return 'pendente';
  return 'completo';
}

function choosePrimary<T extends CleanVaultEntry>(entries: T[]) {
  return [...entries].sort((left, right) => {
    const archiveDiff = Number(cleanVaultIsArchived(left)) - Number(cleanVaultIsArchived(right));
    if (archiveDiff) return archiveDiff;
    const favoriteDiff = Number(Boolean(right.favorite)) - Number(Boolean(left.favorite));
    if (favoriteDiff) return favoriteDiff;
    return parseDate(right.updatedAt) - parseDate(left.updatedAt);
  })[0];
}

export function groupVaultPlayersV3800<T extends CleanVaultEntry>(entries: T[]): CleanVaultPlayerGroup<T>[] {
  const byPlayer = new Map<string, T[]>();
  for (const entry of entries) {
    const key = cleanVaultPlayerKey(entry);
    byPlayer.set(key, [...(byPlayer.get(key) ?? []), entry]);
  }
  return [...byPlayer.entries()].map(([key, list]) => {
    const ordered = [...list].sort((left, right) => parseDate(right.updatedAt) - parseDate(left.updatedAt));
    const primary = choosePrimary(ordered);
    return {
      key,
      playerName: primary.result.parsed.playerName,
      entries: ordered,
      primary,
      cardVersionCount: new Set(ordered.map(cleanVaultCardVersionKey)).size,
      buildCount: ordered.length,
      favorite: ordered.some((entry) => entry.favorite),
      archived: ordered.every(cleanVaultIsArchived),
      status: groupStatus(ordered),
      updatedAt: primary.updatedAt
    };
  }).sort((left, right) => Number(right.favorite) - Number(left.favorite) || parseDate(right.updatedAt) - parseDate(left.updatedAt) || left.playerName.localeCompare(right.playerName, 'pt-BR'));
}

export function cleanVaultMatchesSearch(entry: CleanVaultEntry, query: string) {
  const normalized = normalize(query);
  if (!normalized) return true;
  const text = [
    entry.result.parsed.playerName,
    entry.result.parsed.playstyle,
    entry.result.parsed.cardType,
    entry.result.parsed.mainPosition,
    entry.result.bestPosition.code,
    entry.result.bestPosition.label,
    entry.result.buildName,
    ...(entry.result.parsed.nativeSkills ?? []),
    ...(entry.result.recommendedSkills ?? []),
    entry.notes
  ].map(normalize).join(' ');
  return text.includes(normalized);
}

export function buildCleanVaultSummaryV3800<T extends CleanVaultEntry>(entries: T[]): CleanVaultSummary {
  const duplicates = detectExactVaultDuplicates(entries);
  return {
    players: groupVaultPlayersV3800(entries.filter((entry) => !cleanVaultIsArchived(entry))).length,
    fichas: entries.filter((entry) => !cleanVaultIsArchived(entry)).length,
    favorites: entries.filter((entry) => entry.favorite && !cleanVaultIsArchived(entry)).length,
    archived: entries.filter(cleanVaultIsArchived).length,
    review: entries.filter((entry) => cleanVaultStatus(entry) === 'revisar' && !cleanVaultIsArchived(entry)).length,
    duplicateGroups: duplicates.length
  };
}
