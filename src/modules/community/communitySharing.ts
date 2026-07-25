import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
export const COMMUNITY_SHARING_VERSION = '29.80.0';

export type CommunityShareKind = 'player_build' | 'formation' | 'training_plan' | 'opponent_plan' | 'tactical_sequence';
export type CommunityVisibility = 'private' | 'unlisted' | 'community';
export type CommunityModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type CommunityProfile = {
  id: string;
  displayName: string;
  bio: string;
  creator: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunitySharePackage = {
  schema: 1;
  app: 'BuildMaster Elite Tático';
  version: string;
  id: string;
  code: string;
  kind: CommunityShareKind;
  title: string;
  description: string;
  visibility: CommunityVisibility;
  moderation: CommunityModerationStatus;
  author: { id: string; displayName: string };
  tags: string[];
  payload: unknown;
  createdAt: string;
  expiresAt: string | null;
  checksum: string;
};

export type CommunityImportReview = {
  id: string;
  package: CommunitySharePackage;
  importedAt: string;
  status: 'review' | 'accepted' | 'rejected';
  warnings: string[];
};

export type CommunityRating = { id: string; packageId: string; score: number; note: string; createdAt: string };
export type CommunityComment = { id: string; packageId: string; message: string; createdAt: string; status: 'visible' | 'reported' };
export type CommunityReport = { id: string; packageId: string; reason: string; createdAt: string; status: 'open' | 'reviewed' };

export type CommunityState = {
  schema: 1;
  profile: CommunityProfile;
  packages: CommunitySharePackage[];
  reviews: CommunityImportReview[];
  ratings: CommunityRating[];
  comments: CommunityComment[];
  reports: CommunityReport[];
};

const STORAGE_KEY = 'buildmaster.community.v2980';
const MAX_PACKAGES = 50;
const MAX_REVIEWS = 30;
const MAX_TEXT = 240;
const SENSITIVE_KEY = /(password|senha|token|secret|segredo|session|sess[aã]o|email|e-mail|authorization|cookie|imageData|previewUrl)/i;

function now(): string { return new Date().toISOString(); }
function id(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${random}`;
}
function cleanText(value: unknown, limit = MAX_TEXT): string { return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, limit); }
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
function checksum(value: unknown): string {
  const text = stableStringify(value); let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 12) return null;
  if (value == null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value.slice(0, 200_000);
  if (Array.isArray(value)) return value.slice(0, 2_000).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 2_000)) {
      if (SENSITIVE_KEY.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) continue;
      output[key] = sanitize(item, depth + 1);
    }
    return output;
  }
  return null;
}
function defaultProfile(): CommunityProfile {
  const date = now(); return { id: id('profile'), displayName: 'Jogador BuildMaster', bio: '', creator: false, verified: false, createdAt: date, updatedAt: date };
}
export function createDefaultCommunityState(): CommunityState {
  return { schema: 1, profile: defaultProfile(), packages: [], reviews: [], ratings: [], comments: [], reports: [] };
}
function normalizePackage(input: CommunitySharePackage): CommunitySharePackage {
  return { ...input, title: cleanText(input.title, 100), description: cleanText(input.description, 500), tags: (input.tags || []).map((tag) => cleanText(tag, 30)).filter(Boolean).slice(0, 8), payload: sanitize(input.payload) };
}
function packageCore(pkg: Omit<CommunitySharePackage, 'checksum'>): Omit<CommunitySharePackage, 'checksum'> { return pkg; }

export function createCommunitySharePackage(input: {
  kind: CommunityShareKind; title: string; description?: string; visibility?: CommunityVisibility;
  author?: Partial<CommunitySharePackage['author']>; tags?: string[]; payload: unknown; expiresInDays?: number | null;
}): CommunitySharePackage {
  const createdAt = now();
  const expires = input.expiresInDays && input.expiresInDays > 0 ? new Date(Date.now() + Math.min(90, input.expiresInDays) * 86_400_000).toISOString() : null;
  const pkgId = id('share');
  const core: Omit<CommunitySharePackage, 'checksum'> = {
    schema: 1, app: 'BuildMaster Elite Tático', version: COMMUNITY_SHARING_VERSION,
    id: pkgId, code: `BM-${pkgId.replace(/[^a-z0-9]/gi, '').slice(-10).toUpperCase()}`,
    kind: input.kind, title: cleanText(input.title || 'Compartilhamento BuildMaster', 100), description: cleanText(input.description, 500),
    visibility: input.visibility || 'private', moderation: input.visibility === 'community' ? 'pending' : 'approved',
    author: { id: cleanText(input.author?.id || 'local', 80), displayName: cleanText(input.author?.displayName || 'Jogador BuildMaster', 80) },
    tags: (input.tags || []).map((tag) => cleanText(tag, 30)).filter(Boolean).slice(0, 8), payload: sanitize(input.payload), createdAt, expiresAt: expires
  };
  return { ...core, checksum: checksum(packageCore(core)) };
}

export function verifyCommunitySharePackage(input: unknown): { valid: boolean; package: CommunitySharePackage | null; warnings: string[] } {
  const warnings: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid: false, package: null, warnings: ['Arquivo de compartilhamento inválido.'] };
  const raw = input as CommunitySharePackage;
  if (raw.app !== 'BuildMaster Elite Tático' || raw.schema !== 1 || !raw.id || !raw.kind || !raw.checksum) return { valid: false, package: null, warnings: ['O pacote não pertence ao BuildMaster ou está incompleto.'] };
  const { checksum: supplied, ...core } = raw;
  if (checksum(packageCore(core)) !== supplied) return { valid: false, package: null, warnings: ['A integridade do pacote não confere.'] };
  if (raw.expiresAt && Date.parse(raw.expiresAt) < Date.now()) return { valid: false, package: null, warnings: ['O código de compartilhamento expirou.'] };
  if (raw.version !== COMMUNITY_SHARING_VERSION) warnings.push(`Pacote criado na versão ${raw.version}; revise antes de aceitar.`);
  if (raw.moderation === 'rejected') warnings.push('Este conteúdo foi marcado como rejeitado.');
  return { valid: true, package: normalizePackage(raw), warnings };
}

export function readCommunityState(): CommunityState {
  return normalizeCommunityState(safeStorageGetJson<unknown>(STORAGE_KEY, null));
}
export function writeCommunityState(state: CommunityState): CommunityState {
  const clean = normalizeCommunityState(state); safeStorageSetJson(STORAGE_KEY, clean); return clean;
}
export function normalizeCommunityState(input: unknown): CommunityState {
  const base = createDefaultCommunityState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const raw = input as Partial<CommunityState>;
  return {
    schema: 1,
    profile: { ...base.profile, ...(raw.profile || {}), displayName: cleanText(raw.profile?.displayName || base.profile.displayName, 80), bio: cleanText(raw.profile?.bio, 300), updatedAt: now() },
    packages: Array.isArray(raw.packages) ? raw.packages.slice(0, MAX_PACKAGES).map(normalizePackage) : [],
    reviews: Array.isArray(raw.reviews) ? raw.reviews.slice(0, MAX_REVIEWS) : [],
    ratings: Array.isArray(raw.ratings) ? raw.ratings.slice(0, 200) : [], comments: Array.isArray(raw.comments) ? raw.comments.slice(0, 300) : [], reports: Array.isArray(raw.reports) ? raw.reports.slice(0, 100) : []
  };
}
export function addCommunityPackage(pkg: CommunitySharePackage): CommunityState {
  const state = readCommunityState(); state.packages = [pkg, ...state.packages.filter((item) => item.id !== pkg.id)].slice(0, MAX_PACKAGES); return writeCommunityState(state);
}
export function queueCommunityImport(input: unknown): CommunityImportReview {
  const checked = verifyCommunitySharePackage(input); if (!checked.valid || !checked.package) throw new Error(checked.warnings[0] || 'Pacote inválido.');
  const review: CommunityImportReview = { id: id('review'), package: checked.package, importedAt: now(), status: 'review', warnings: checked.warnings };
  const state = readCommunityState(); state.reviews = [review, ...state.reviews].slice(0, MAX_REVIEWS); writeCommunityState(state); return review;
}
export function decideCommunityImport(reviewId: string, accepted: boolean): CommunityState {
  const state = readCommunityState();
  state.reviews = state.reviews.map((review) => review.id === reviewId ? { ...review, status: accepted ? 'accepted' : 'rejected' } : review);
  if (accepted) { const review = state.reviews.find((item) => item.id === reviewId); if (review) state.packages = [review.package, ...state.packages.filter((item) => item.id !== review.package.id)].slice(0, MAX_PACKAGES); }
  return writeCommunityState(state);
}
export function updateCommunityProfile(input: Partial<CommunityProfile>): CommunityState {
  const state = readCommunityState(); state.profile = { ...state.profile, ...input, id: state.profile.id, displayName: cleanText(input.displayName || state.profile.displayName, 80), bio: cleanText(input.bio ?? state.profile.bio, 300), verified: state.profile.verified, updatedAt: now() }; return writeCommunityState(state);
}
export function addCommunityRating(packageId: string, score: number, note = ''): CommunityState {
  const state = readCommunityState(); state.ratings.unshift({ id: id('rating'), packageId, score: Math.max(1, Math.min(5, Math.round(score))), note: cleanText(note, 240), createdAt: now() }); state.ratings = state.ratings.slice(0, 200); return writeCommunityState(state);
}
export function addCommunityComment(packageId: string, message: string): CommunityState {
  const state = readCommunityState(); state.comments.unshift({ id: id('comment'), packageId, message: cleanText(message, 500), createdAt: now(), status: 'visible' }); state.comments = state.comments.slice(0, 300); return writeCommunityState(state);
}
export function reportCommunityPackage(packageId: string, reason: string): CommunityState {
  const state = readCommunityState(); state.reports.unshift({ id: id('report'), packageId, reason: cleanText(reason, 300), createdAt: now(), status: 'open' }); state.reports = state.reports.slice(0, 100); return writeCommunityState(state);
}
export function exportCommunityState(): CommunityState { return readCommunityState(); }
export function importCommunityState(input: unknown): CommunityState { return writeCommunityState(normalizeCommunityState(input)); }
