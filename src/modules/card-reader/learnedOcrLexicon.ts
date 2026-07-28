import { runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { textSimilarity } from './highPrecisionOcr';

export const LEARNED_OCR_LEXICON_VERSION = '31.60-adaptive-lexicon-2';

export type LearnedOcrCategory = 'playerName' | 'skill';

export type LearnedOcrTerm = {
  id: string;
  category: LearnedOcrCategory;
  canonical: string;
  normalized: string;
  aliases: string[];
  confirmations: number;
  independentScans: number;
  firstSeenAt: string;
  lastSeenAt: string;
  sourceImageHashes: string[];
  status: 'pending' | 'trusted';
  version: string;
};

function normalized(value: string) {
  return value
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value: string) {
  const particles = new Set(['da', 'de', 'do', 'das', 'dos', 'del', 'della', 'di', 'van', 'von', 'le', 'la']);
  return value.trim().toLowerCase().split(/\s+/).filter(Boolean).map((word, index) => index > 0 && particles.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function canonicalTerm(category: LearnedOcrCategory, value: string) {
  const clean = value.replace(/\s+/g, ' ').replace(/^[•|,;:\-\s]+|[•|,;:\-\s]+$/g, '').trim();
  return category === 'playerName' ? titleCase(clean) : clean.charAt(0).toUpperCase() + clean.slice(1);
}

function termId(category: LearnedOcrCategory, value: string) {
  return `${category}:${normalized(value).replace(/\s+/g, '-')}`;
}

function validTerm(category: LearnedOcrCategory, value: string) {
  const clean = value.trim();
  if (clean.length < 3 || clean.length > 54 || /\d{2,}/.test(clean)) return false;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > (category === 'playerName' ? 6 : 8)) return false;
  const letters = (clean.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  return letters / Math.max(1, clean.length) >= 0.62;
}

export async function loadLearnedOcrTerms(category?: LearnedOcrCategory, trustedOnly = true): Promise<LearnedOcrTerm[]> {
  const entries = await runtimeList<LearnedOcrTerm>('ocr-lexicon', 500).catch(() => []);
  return entries
    .map((entry) => entry.value)
    .filter((term) => (!category || term.category === category) && (!trustedOnly || term.status === 'trusted'))
    .sort((left, right) => right.confirmations - left.confirmations || right.independentScans - left.independentScans);
}

export async function learnConfirmedOcrTerm(input: {
  category: LearnedOcrCategory;
  value: string;
  imageHash: string;
  alias?: string;
  manuallyConfirmed?: boolean;
}): Promise<LearnedOcrTerm | null> {
  if (!validTerm(input.category, input.value)) return null;
  const canonical = canonicalTerm(input.category, input.value);
  const norm = normalized(canonical);
  const all = await loadLearnedOcrTerms(input.category, false);
  const exact = all.find((term) => term.normalized === norm);
  const nearest = exact ?? all
    .map((term) => ({ term, similarity: textSimilarity(term.canonical, canonical) }))
    .sort((left, right) => right.similarity - left.similarity)
    .find((item) => item.similarity >= (input.category === 'playerName' ? 0.94 : 0.91))?.term;
  const now = new Date().toISOString();
  const sourceHashes = Array.from(new Set([...(nearest?.sourceImageHashes ?? []), input.imageHash].filter(Boolean))).slice(-24);
  const aliases = Array.from(new Set([...(nearest?.aliases ?? []), input.alias?.trim() ?? '', canonical].filter(Boolean))).slice(-16);
  const confirmations = (nearest?.confirmations ?? 0) + 1;
  const independentScans = sourceHashes.length;
  const trusted = Boolean(input.manuallyConfirmed) || confirmations >= 2 || independentScans >= 2;
  const term: LearnedOcrTerm = {
    id: nearest?.id ?? termId(input.category, canonical),
    category: input.category,
    canonical: nearest?.canonical && textSimilarity(nearest.canonical, canonical) >= 0.94 ? nearest.canonical : canonical,
    normalized: nearest?.normalized ?? norm,
    aliases,
    confirmations,
    independentScans,
    firstSeenAt: nearest?.firstSeenAt ?? now,
    lastSeenAt: now,
    sourceImageHashes: sourceHashes,
    status: trusted ? 'trusted' : 'pending',
    version: LEARNED_OCR_LEXICON_VERSION
  };
  await runtimePut('ocr-lexicon', term.id, term);
  void runtimeTrimStore('ocr-lexicon', 420).catch(() => undefined);
  return term;
}

export async function learnConfirmedOcrBatch(input: {
  imageHash: string;
  playerName?: string | null;
  skills?: string[];
  manuallyConfirmed?: boolean;
}) {
  const saved: LearnedOcrTerm[] = [];
  if (input.playerName) {
    const name = await learnConfirmedOcrTerm({ category: 'playerName', value: input.playerName, imageHash: input.imageHash, manuallyConfirmed: input.manuallyConfirmed });
    if (name) saved.push(name);
  }
  for (const skill of Array.from(new Set(input.skills ?? []))) {
    const savedSkill = await learnConfirmedOcrTerm({ category: 'skill', value: skill, imageHash: input.imageHash, manuallyConfirmed: input.manuallyConfirmed });
    if (savedSkill) saved.push(savedSkill);
  }
  return saved;
}

export function learnedCanonicalValues(terms: LearnedOcrTerm[]) {
  return Array.from(new Set(terms.map((term) => term.canonical).filter(Boolean)));
}
