import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
export const COMMERCIALIZATION_VERSION = '29.80.0';
export type CommercialPlanId = 'essential' | 'pro' | 'elite' | 'administrator';
export type CommercialFeature = 'ocr' | 'player_lab' | 'tactical_studio' | 'opponent_assistant' | 'anti_delay' | 'smart_coach' | 'community_publish' | 'cloud_sync' | 'admin';
export type CommercialPlan = { id: CommercialPlanId; name: string; priceLabel: string; description: string; features: CommercialFeature[]; limits: { devices: number; communityPublications: number; cloudVersions: number } };
export type CommercialLicense = { id: string; plan: CommercialPlanId; status: 'trial' | 'active' | 'suspended' | 'expired'; startedAt: string; expiresAt: string | null; source: 'local_trial' | 'server' | 'administrator' };
export type CommercialLedgerEntry = { id: string; type: 'trial_started' | 'license_created' | 'license_renewed' | 'plan_changed' | 'coupon_applied' | 'manual_payment_recorded' | 'refund_recorded'; description: string; amountCents: number | null; currency: 'BRL'; createdAt: string };
export type LgpdRequest = { id: string; type: 'access' | 'correction' | 'export' | 'deletion'; status: 'requested' | 'processing' | 'completed' | 'rejected'; reason: string; createdAt: string; updatedAt: string };
export type CommercialState = { schema: 1; license: CommercialLicense | null; ledger: CommercialLedgerEntry[]; lgpdRequests: LgpdRequest[]; acceptedTermsVersion: string | null; acceptedTermsAt: string | null; couponCodes: string[] };
export type CommercialEntitlements = { plan: CommercialPlanId; planName: string; active: boolean; trial: boolean; expiresAt: string | null; features: Record<CommercialFeature, boolean>; limits: CommercialPlan['limits'] };

const STORAGE_KEY = 'buildmaster.commercial.v2980';
const TERMS_VERSION = '2026.07';
const ALL_STANDARD: CommercialFeature[] = ['ocr','player_lab','tactical_studio','opponent_assistant','anti_delay','smart_coach','cloud_sync'];
export const COMMERCIAL_PLANS: Record<CommercialPlanId, CommercialPlan> = {
  essential: { id: 'essential', name: 'Essencial', priceLabel: 'Preço definido pelo administrador', description: 'Acesso principal ao leitor, fichas e recursos pessoais.', features: ['ocr','player_lab'], limits: { devices: 1, communityPublications: 0, cloudVersions: 1 } },
  pro: { id: 'pro', name: 'Pro', priceLabel: 'Preço definido pelo administrador', description: 'Laboratório, Estúdio Tático, adversários e sincronização ampliada.', features: [...ALL_STANDARD.filter((f) => !['smart_coach'].includes(f)), 'community_publish'], limits: { devices: 2, communityPublications: 10, cloudVersions: 3 } },
  elite: { id: 'elite', name: 'Elite', priceLabel: 'Preço definido pelo administrador', description: 'Todos os recursos competitivos e limites superiores.', features: [...ALL_STANDARD, 'community_publish'], limits: { devices: 4, communityPublications: 50, cloudVersions: 8 } },
  administrator: { id: 'administrator', name: 'Administrador', priceLabel: 'Acesso administrativo', description: 'Governança do produto e todos os recursos.', features: [...ALL_STANDARD, 'community_publish', 'admin'], limits: { devices: 20, communityPublications: 1000, cloudVersions: 20 } }
};
function now(): string { return new Date().toISOString(); }
function id(prefix: string): string { return `${prefix}-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`; }
function clean(value: unknown, limit = 500): string { return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, limit); }
export function createDefaultCommercialState(): CommercialState { return { schema: 1, license: null, ledger: [], lgpdRequests: [], acceptedTermsVersion: null, acceptedTermsAt: null, couponCodes: [] }; }
export function normalizeCommercialState(input: unknown): CommercialState {
  const base = createDefaultCommercialState(); if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const raw = input as Partial<CommercialState>;
  return { schema: 1, license: raw.license && COMMERCIAL_PLANS[raw.license.plan] ? { ...raw.license } : null, ledger: Array.isArray(raw.ledger) ? raw.ledger.slice(0, 200) : [], lgpdRequests: Array.isArray(raw.lgpdRequests) ? raw.lgpdRequests.slice(0, 50) : [], acceptedTermsVersion: raw.acceptedTermsVersion || null, acceptedTermsAt: raw.acceptedTermsAt || null, couponCodes: Array.isArray(raw.couponCodes) ? raw.couponCodes.map((c) => clean(c, 30)).slice(0, 20) : [] };
}
export function readCommercialState(): CommercialState { return normalizeCommercialState(safeStorageGetJson<unknown>(STORAGE_KEY, null)); }
export function writeCommercialState(state: CommercialState): CommercialState { const normalized = normalizeCommercialState(state); safeStorageSetJson(STORAGE_KEY, normalized); return normalized; }
export function beginCommercialTrial(plan: Exclude<CommercialPlanId, 'administrator'> = 'pro', days = 7): CommercialState {
  const state = readCommercialState(); const startedAt = now(); const expiresAt = new Date(Date.now() + Math.max(1, Math.min(30, days)) * 86_400_000).toISOString();
  state.license = { id: id('license'), plan, status: 'trial', startedAt, expiresAt, source: 'local_trial' };
  state.ledger.unshift({ id: id('ledger'), type: 'trial_started', description: `Período de teste local do plano ${COMMERCIAL_PLANS[plan].name}.`, amountCents: null, currency: 'BRL', createdAt: startedAt });
  return writeCommercialState(state);
}
export function resolveCommercialEntitlements(profile?: { role?: string; plan?: string; licenseExpiresAt?: string | null; active?: boolean } | null, state = readCommercialState()): CommercialEntitlements {
  let plan: CommercialPlanId = 'essential'; let active = true; let trial = false; let expiresAt: string | null = null;
  if (profile?.role === 'admin') plan = 'administrator';
  else if (profile?.plan && profile.plan in COMMERCIAL_PLANS) { plan = profile.plan as CommercialPlanId; active = profile.active !== false; expiresAt = profile.licenseExpiresAt || null; }
  else if (state.license) { plan = state.license.plan; active = state.license.status === 'active' || state.license.status === 'trial'; trial = state.license.status === 'trial'; expiresAt = state.license.expiresAt; if (expiresAt && Date.parse(expiresAt) <= Date.now()) active = false; }
  const config = COMMERCIAL_PLANS[plan]; const features = Object.fromEntries((['ocr','player_lab','tactical_studio','opponent_assistant','anti_delay','smart_coach','community_publish','cloud_sync','admin'] as CommercialFeature[]).map((feature) => [feature, active && config.features.includes(feature)])) as Record<CommercialFeature, boolean>;
  return { plan, planName: config.name, active, trial, expiresAt, features, limits: config.limits };
}
export function acceptCommercialTerms(version = TERMS_VERSION): CommercialState { const state = readCommercialState(); state.acceptedTermsVersion = clean(version, 40); state.acceptedTermsAt = now(); return writeCommercialState(state); }
export function createLgpdRequest(type: LgpdRequest['type'], reason = ''): CommercialState { const state = readCommercialState(); const date = now(); state.lgpdRequests.unshift({ id: id('lgpd'), type, status: 'requested', reason: clean(reason), createdAt: date, updatedAt: date }); state.lgpdRequests = state.lgpdRequests.slice(0, 50); return writeCommercialState(state); }
export function validateCouponCode(code: string): { valid: boolean; normalized: string; message: string } { const normalized = clean(code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, ''); return normalized.length >= 5 ? { valid: true, normalized, message: 'Cupom registrado para validação pelo servidor.' } : { valid: false, normalized, message: 'Cupom inválido ou curto demais.' }; }
export function registerCouponCode(code: string): CommercialState { const checked = validateCouponCode(code); if (!checked.valid) throw new Error(checked.message); const state = readCommercialState(); state.couponCodes = [checked.normalized, ...state.couponCodes.filter((item) => item !== checked.normalized)].slice(0, 20); state.ledger.unshift({ id: id('ledger'), type: 'coupon_applied', description: `Cupom ${checked.normalized} aguardando validação administrativa.`, amountCents: null, currency: 'BRL', createdAt: now() }); return writeCommercialState(state); }
export function exportCommercialState(): CommercialState { return readCommercialState(); }
export function importCommercialState(input: unknown): CommercialState { return writeCommercialState(normalizeCommercialState(input)); }
export function createCommercialDataExport(): { version: string; generatedAt: string; state: CommercialState; plans: CommercialPlan[]; notice: string } { return { version: COMMERCIALIZATION_VERSION, generatedAt: now(), state: readCommercialState(), plans: Object.values(COMMERCIAL_PLANS), notice: 'Este módulo não processa pagamentos. Valores e cobranças dependem de provedor externo e confirmação administrativa.' }; }
