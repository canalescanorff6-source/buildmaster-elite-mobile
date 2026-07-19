import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { clearActiveAccountIdentity, setActiveAccountIdentity } from '@/lib/accountStorage';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import {
  getNativeDeviceIdentity,
  migrateLegacyValueToSecureStorage,
  secureGet,
  secureRemove,
  secureSet,
  signNativeDeviceMessage
} from '@/lib/secureStorage';
import { createStableId } from './stableId';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'buildmaster_cloud_auth_session_v2_secure';
const LICENSE_CACHE_KEY = 'buildmaster_license_cache_v2_secure';
const DEVICE_ID_KEY = 'buildmaster_device_id_v2_secure';
const LEGACY_SESSION_KEY = 'buildmaster_cloud_auth_session_v1';
const LEGACY_LICENSE_CACHE_KEY = 'buildmaster_license_cache_v1';
const LEGACY_DEVICE_ID_KEY = 'buildmaster_device_id_v1';
const USERNAME_DOMAIN = 'accounts.buildmaster.app';
const APP_ID = 'com.buildmaster.elitetatico';
let lastDeviceProofTimestamp = 0;

export type AccountRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'blocked' | 'expired';

export type AccountProfile = {
  id: string;
  username: string;
  displayName: string;
  role: AccountRole;
  status: AccountStatus;
  plan: string;
  expiresAt: string | null;
  maxDevices: number;
  offlineGraceHours: number;
  lastAccessAt?: string | null;
};

export type AccountSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
};

export type LicenseValidation = {
  profile: AccountProfile;
  deviceId: string;
  validatedAt: string;
  offline: boolean;
  minimumVersion?: string;
};

export type AdminUserRow = AccountProfile & {
  createdAt?: string;
  deviceCount?: number;
};

export type AdminUserAction =
  | { action: 'list' }
  | { action: 'create'; username: string; password: string; displayName?: string; durationDays: number; maxDevices: number; plan?: string }
  | { action: 'renew'; userId: string; durationDays: number }
  | { action: 'set_status'; userId: string; status: Exclude<AccountStatus, 'expired'> }
  | { action: 'reset_password'; userId: string; password: string }
  | { action: 'set_devices'; userId: string; maxDevices: number }
  | { action: 'revoke_devices'; userId: string }
  | { action: 'delete'; userId: string };

export type AdminMfaFactor = {
  id: string;
  status: 'verified' | 'unverified';
  friendlyName: string;
  createdAt?: string;
};

export type AdminMfaStatus = {
  currentLevel: 'aal1' | 'aal2';
  factors: AdminMfaFactor[];
  verifiedFactor: AdminMfaFactor | null;
  protected: boolean;
};

export type AdminMfaEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export function isSupabaseConfigurationValid(url = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY) {
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = anonKey.trim();
  const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cleanUrl)
    && !/example|seu_project_ref/i.test(cleanUrl);
  const validKey = (cleanKey.startsWith('sb_publishable_') || cleanKey.startsWith('eyJ'))
    && !/test|sua_chave/i.test(cleanKey);
  return validUrl && validKey;
}

export function isCloudAccountsConfigured() {
  return isSupabaseConfigurationValid();
}

export function normalizeUsername(input: string): string {
  return input.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '').slice(0, 20);
}

export function validateUsername(input: string): string | null {
  const normalized = normalizeUsername(input);
  if (normalized.length < 3) return 'Use pelo menos 3 caracteres.';
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(normalized) && normalized.length > 1) return 'Comece e termine com letra ou número.';
  return null;
}

export function usernameToInternalEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_DOMAIN}`;
}

function decodeJwtClaims(token: string): Record<string, unknown> {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return {};
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function saveSession(session: AccountSession) {
  await secureSet(SESSION_KEY, JSON.stringify(session));
  await secureRemove(LEGACY_SESSION_KEY).catch(() => undefined);
}

async function readSession(): Promise<AccountSession | null> {
  try {
    let raw = await secureGet(SESSION_KEY);
    if (!raw) {
      raw = await migrateLegacyValueToSecureStorage(LEGACY_SESSION_KEY);
      if (raw) await secureSet(SESSION_KEY, raw);
    }
    const value = JSON.parse(raw || 'null') as Partial<AccountSession> | null;
    if (!value?.accessToken || !value.refreshToken || !value.userId || !Number.isFinite(value.expiresAt)) return null;
    return value as AccountSession;
  } catch {
    return null;
  }
}

async function clearSessionStorage() {
  await Promise.allSettled([
    secureRemove(SESSION_KEY),
    secureRemove(LICENSE_CACHE_KEY),
    secureRemove(LEGACY_SESSION_KEY),
    secureRemove(LEGACY_LICENSE_CACHE_KEY)
  ]);
  clearActiveAccountIdentity();
}

async function getLegacyWebDeviceId(): Promise<string> {
  let current = await secureGet(DEVICE_ID_KEY);
  if (current) return current;
  current = await migrateLegacyValueToSecureStorage(LEGACY_DEVICE_ID_KEY);
  if (current) {
    await secureSet(DEVICE_ID_KEY, current);
    return current;
  }
  const id = createStableId('device');
  await secureSet(DEVICE_ID_KEY, id);
  return id;
}

async function buildDeviceProof(userId: string) {
  const nativeIdentity = await getNativeDeviceIdentity();
  if (!nativeIdentity) {
    const deviceId = await getLegacyWebDeviceId();
    return {
      deviceId,
      publicKey: '',
      proofTimestamp: Date.now(),
      proofSignature: '',
      proofAlgorithm: 'WEB_FALLBACK',
      securityVersion: 1
    };
  }
  const proofTimestamp = Math.max(Date.now(), lastDeviceProofTimestamp + 1);
  lastDeviceProofTimestamp = proofTimestamp;
  const message = `${nativeIdentity.deviceId}|${proofTimestamp}|${APP_RELEASE_VERSION}|${userId}`;
  const proof = await signNativeDeviceMessage(message);
  if (!proof) throw new Error('Não foi possível confirmar a identidade segura deste aparelho.');
  return {
    deviceId: nativeIdentity.deviceId,
    publicKey: nativeIdentity.publicKey,
    proofTimestamp,
    proofSignature: proof.signature,
    proofAlgorithm: proof.algorithm,
    securityVersion: 2
  };
}

function deviceName() {
  if (typeof navigator === 'undefined') return 'Aparelho desconhecido';
  const platform = navigator.platform || 'Android';
  const agent = navigator.userAgent.match(/Android[^;)]*/i)?.[0] || '';
  return `${platform}${agent ? ` • ${agent}` : ''}`.slice(0, 120);
}

async function supabaseFetch(path: string, init: RequestInit = {}, accessToken?: string) {
  if (!isCloudAccountsConfigured()) throw new Error('Supabase ainda não foi configurado no projeto.');
  const headers = new Headers(init.headers || {});
  headers.set('apikey', SUPABASE_ANON_KEY);
  headers.set('X-BuildMaster-Version', APP_RELEASE_VERSION);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const url = `${SUPABASE_URL}${path}`;
  const timeoutController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = timeoutController ? globalThis.setTimeout(() => timeoutController.abort(), 18_000) : null;
  try {
    return await fetch(url, { ...init, headers, cache: 'no-store', signal: init.signal || timeoutController?.signal });
  } catch (webError) {
    if (!Capacitor.isNativePlatform()) {
      if (webError instanceof DOMException && webError.name === 'AbortError') throw new Error('Tempo limite ao conectar ao servidor de contas.');
      throw webError;
    }
    try {
      const nativeResponse = await CapacitorHttp.request({
        url,
        method: String(init.method || 'GET'),
        headers: Object.fromEntries(headers.entries()),
        data: typeof init.body === 'string' ? init.body : undefined,
        connectTimeout: 18_000,
        readTimeout: 28_000,
        responseType: 'text'
      });
      const responseBody = typeof nativeResponse.data === 'string' ? nativeResponse.data : JSON.stringify(nativeResponse.data ?? null);
      return new Response(responseBody, { status: nativeResponse.status, headers: nativeResponse.headers });
    } catch (nativeError) {
      const message = String(nativeError instanceof Error ? nativeError.message : nativeError);
      if (/timeout|timed out|abort/i.test(message)) throw new Error('Tempo limite ao conectar ao servidor de contas.');
      throw nativeError;
    }
  } finally {
    if (timeout !== null) globalThis.clearTimeout(timeout);
  }
}

async function refreshSession(current: AccountSession): Promise<AccountSession> {
  const response = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: current.refreshToken })
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      await clearSessionStorage();
      throw new Error('Sua sessão expirou. Entre novamente.');
    }
    if (response.status === 429) throw new Error('O servidor recebeu muitas tentativas. A sessão será mantida e validada novamente em instantes.');
    if (response.status >= 500) throw new Error('O servidor de contas está temporariamente indisponível.');
    throw new Error(String(payload?.message || payload?.error || 'Não foi possível renovar a sessão agora.'));
  }
  if (!payload?.access_token || !payload.refresh_token) throw new Error('O servidor não concluiu a renovação da sessão. Tente novamente em instantes.');
  const next: AccountSession = {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token),
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    userId: String((payload.user as { id?: string } | undefined)?.id || current.userId)
  };
  await saveSession(next);
  return next;
}

export async function getValidAccountSession(): Promise<AccountSession | null> {
  const session = await readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;
  return refreshSession(session);
}

export async function getCurrentSessionForSecurity(): Promise<AccountSession | null> {
  return getValidAccountSession();
}

function normalizeProfile(input: Record<string, unknown>): AccountProfile {
  const expiresAt = input.expiresAt ?? input.expires_at ?? null;
  return {
    id: String(input.id || ''),
    username: String(input.username || ''),
    displayName: String(input.displayName ?? input.display_name ?? input.username ?? ''),
    role: input.role === 'admin' ? 'admin' : 'user',
    status: ['active', 'suspended', 'blocked', 'expired'].includes(String(input.status)) ? String(input.status) as AccountStatus : 'active',
    plan: String(input.plan || 'premium'),
    expiresAt: expiresAt ? String(expiresAt) : null,
    maxDevices: Math.max(1, Number(input.maxDevices ?? input.max_devices ?? 1) || 1),
    offlineGraceHours: Math.max(0, Number(input.offlineGraceHours ?? input.offline_grace_hours ?? 4) || 0),
    lastAccessAt: input.lastAccessAt || input.last_access_at ? String(input.lastAccessAt ?? input.last_access_at) : null
  };
}

async function cacheLicense(validation: LicenseValidation) {
  await secureSet(LICENSE_CACHE_KEY, JSON.stringify(validation));
  await secureRemove(LEGACY_LICENSE_CACHE_KEY).catch(() => undefined);
  setActiveAccountIdentity({
    id: validation.profile.id,
    username: validation.profile.username,
    role: validation.profile.role,
    expiresAt: validation.profile.expiresAt,
    mode: 'cloud'
  });
}

async function readCachedLicense(): Promise<LicenseValidation | null> {
  try {
    let raw = await secureGet(LICENSE_CACHE_KEY);
    if (!raw) {
      raw = await migrateLegacyValueToSecureStorage(LEGACY_LICENSE_CACHE_KEY);
      if (raw) await secureSet(LICENSE_CACHE_KEY, raw);
    }
    const value = JSON.parse(raw || 'null') as LicenseValidation | null;
    if (!value?.profile?.id || !value.validatedAt) return null;
    return value;
  } catch {
    return null;
  }
}

export function evaluateCachedLicense(validation: LicenseValidation, now = Date.now()): { valid: boolean; reason?: string } {
  const profile = validation.profile;
  if (profile.status !== 'active') return { valid: false, reason: `Conta ${profile.status}.` };
  if (profile.expiresAt && Date.parse(profile.expiresAt) <= now) return { valid: false, reason: 'Seu prazo de acesso terminou.' };
  const validatedAt = Date.parse(validation.validatedAt);
  const graceMs = profile.offlineGraceHours * 60 * 60 * 1000;
  if (!Number.isFinite(validatedAt)) return { valid: false, reason: 'A validação local está corrompida.' };
  if (now + 5 * 60 * 1000 < validatedAt) return { valid: false, reason: 'O relógio do aparelho parece ter sido alterado. Conecte-se para validar novamente.' };
  if (now - validatedAt > graceMs) return { valid: false, reason: 'Conecte-se à internet para validar novamente sua licença.' };
  return { valid: true };
}

async function invokeFunction<T>(name: string, body: unknown, accessToken: string): Promise<T> {
  let response: Response;
  try {
    response = await supabaseFetch(`/functions/v1/${name}`, { method: 'POST', body: JSON.stringify(body) }, accessToken);
  } catch {
    throw new Error(`Não consegui conectar ao serviço ${name}. Confira a internet e tente novamente.`);
  }
  const payload = await response.json().catch(() => null) as T & { error?: string; message?: string; code?: string; minimumVersion?: string } | null;
  if (!response.ok) {
    const serverMessage = payload?.error || payload?.message;
    if (response.status === 404) throw new Error(`O serviço de licença ${name} não foi encontrado no Supabase.`);
    if (response.status === 401) throw new Error('Sua sessão não é mais válida. Entre novamente.');
    if (response.status === 426) throw new Error(serverMessage || `Este APK foi bloqueado. Instale a versão ${payload?.minimumVersion || 'mais recente'}.`);
    if (response.status === 428 || payload?.code === 'MFA_REQUIRED') throw new Error('MFA_REQUIRED: confirme o código do aplicativo autenticador para usar o painel administrativo.');
    if (response.status === 403) throw new Error(serverMessage || 'Esta conta não tem permissão para concluir essa operação.');
    if (response.status === 429) throw new Error(serverMessage || 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.');
    if (response.status >= 500) throw new Error('O servidor de licenças está temporariamente indisponível. Tente novamente em instantes.');
    throw new Error(serverMessage || `Não foi possível concluir a validação no serviço ${name}.`);
  }
  return payload as T;
}

export async function validateOnlineLicense(session?: AccountSession): Promise<LicenseValidation> {
  const active = session || await getValidAccountSession();
  if (!active) throw new Error('Entre com seu usuário e senha.');
  const device = await buildDeviceProof(active.userId);
  const payload = await invokeFunction<{ profile: Record<string, unknown>; validatedAt?: string; minimumVersion?: string }>('license-session', {
    action: 'validate',
    appId: APP_ID,
    appVersion: APP_RELEASE_VERSION,
    deviceId: device.deviceId,
    deviceName: deviceName(),
    platform: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
    devicePublicKey: device.publicKey,
    proofTimestamp: device.proofTimestamp,
    proofSignature: device.proofSignature,
    proofAlgorithm: device.proofAlgorithm,
    securityVersion: device.securityVersion
  }, active.accessToken);
  const validation: LicenseValidation = {
    profile: normalizeProfile(payload.profile),
    deviceId: device.deviceId,
    validatedAt: payload.validatedAt || new Date().toISOString(),
    offline: false,
    minimumVersion: payload.minimumVersion
  };
  await cacheLicense(validation);
  return validation;
}

function explainAuthFailure(payload: Record<string, unknown> | null, status: number): string {
  const code = String(payload?.error_code ?? payload?.code ?? '').toLowerCase();
  const rawMessage = String(payload?.message ?? payload?.msg ?? payload?.error_description ?? payload?.error ?? '').trim();
  const message = rawMessage.toLowerCase();
  if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) return 'A conta existe, mas ainda não foi confirmada no Supabase.';
  if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) return 'Usuário ou senha incorretos.';
  if (message.includes('invalid api key') || message.includes('no api key') || code.includes('invalid_api_key')) return 'Este APK foi gerado com uma chave incorreta do Supabase. Gere e instale um APK novo.';
  if (status === 429) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.';
  if (status === 404) return 'O serviço de autenticação não foi encontrado neste projeto Supabase.';
  if (status >= 500) return 'O servidor de contas está temporariamente indisponível. Tente novamente em instantes.';
  if (rawMessage) return `O servidor recusou o acesso: ${rawMessage}`;
  return `Não foi possível entrar no servidor de contas (código ${status}).`;
}

export async function signInWithUsername(username: string, password: string): Promise<LicenseValidation> {
  const usernameError = validateUsername(username);
  if (usernameError) throw new Error(usernameError);
  if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
  let response: Response;
  try {
    response = await supabaseFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: usernameToInternalEmail(username), password })
    });
  } catch {
    throw new Error('Não consegui conectar ao Supabase. Verifique a internet ou instale um APK novo com a URL correta.');
  }
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload?.access_token || !payload.refresh_token) throw new Error(explainAuthFailure(payload, response.status));
  const session: AccountSession = {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token),
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    userId: String((payload.user as { id?: string } | undefined)?.id || '')
  };
  await saveSession(session);
  try {
    return await validateOnlineLicense(session);
  } catch (error) {
    if (!isTransientAccountError(error) && !String(error).includes('APK foi bloqueado')) await clearSessionStorage();
    throw error;
  }
}

export function isTransientAccountError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return error instanceof TypeError
    || message.includes('fetch')
    || message.includes('network')
    || message.includes('failed to connect')
    || message.includes('não consegui conectar')
    || message.includes('não foi possível alcançar')
    || message.includes('temporariamente indisponível')
    || message.includes('tente novamente em instantes')
    || message.includes('timeout')
    || message.includes('timed out')
    || message.includes('tempo limite')
    || message.includes('connection')
    || message.includes('offline')
    || message.includes('abort')
    || message.includes('muitas tentativas')
    || message.includes('servidor recebeu muitas tentativas')
    || message.includes('não concluiu a renovação');
}

async function restoreCachedLicenseOrThrow(error: unknown): Promise<LicenseValidation> {
  const cached = await readCachedLicense();
  if (cached) {
    const status = evaluateCachedLicense(cached);
    if (status.valid) {
      const offline = { ...cached, offline: true };
      await cacheLicense(offline);
      return offline;
    }
    throw new Error(status.reason || 'Sua licença precisa ser validada novamente.');
  }
  throw error;
}

export async function restoreAccountAccess(): Promise<LicenseValidation | null> {
  if (!isCloudAccountsConfigured()) return null;
  try {
    const session = await getValidAccountSession();
    if (!session) return null;
    return await validateOnlineLicense(session);
  } catch (error) {
    if (isTransientAccountError(error)) return restoreCachedLicenseOrThrow(error);
    throw error;
  }
}

export async function signOutAccount() {
  const session = await readSession();
  try {
    if (session && isCloudAccountsConfigured()) await supabaseFetch('/auth/v1/logout', { method: 'POST' }, session.accessToken);
  } catch {
    // A sessão protegida do aparelho será removida mesmo sem conexão.
  }
  await clearSessionStorage();
}

export async function adminAccountRequest<T = { users?: AdminUserRow[]; success?: boolean }>(action: AdminUserAction): Promise<T> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Sessão administrativa ausente.');
  return invokeFunction<T>('admin-users', { ...action, appId: APP_ID, appVersion: APP_RELEASE_VERSION }, session.accessToken);
}

async function authUser(accessToken: string): Promise<Record<string, unknown>> {
  const response = await supabaseFetch('/auth/v1/user', { method: 'GET' }, accessToken);
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload) throw new Error('Não foi possível consultar a proteção MFA da conta.');
  return payload;
}

function factorRows(user: Record<string, unknown>): AdminMfaFactor[] {
  const factors = Array.isArray(user.factors) ? user.factors : [];
  return factors.map((factor) => {
    const row = factor as Record<string, unknown>;
    return {
      id: String(row.id || ''),
      status: (row.status === 'verified' ? 'verified' : 'unverified') as AdminMfaFactor['status'],
      friendlyName: String(row.friendly_name || row.friendlyName || 'BuildMaster Admin'),
      createdAt: row.created_at ? String(row.created_at) : undefined
    };
  }).filter((factor) => Boolean(factor.id));
}

export async function getAdminMfaStatus(): Promise<AdminMfaStatus> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Entre novamente para verificar o MFA.');
  const factors = factorRows(await authUser(session.accessToken));
  const claims = decodeJwtClaims(session.accessToken);
  const currentLevel = claims.aal === 'aal2' ? 'aal2' : 'aal1';
  const verifiedFactor = factors.find((factor) => factor.status === 'verified') || null;
  return { currentLevel, factors, verifiedFactor, protected: currentLevel === 'aal2' };
}

export async function beginAdminMfaEnrollment(): Promise<AdminMfaEnrollment> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Entre novamente para ativar o MFA.');
  const response = await supabaseFetch('/auth/v1/factors', {
    method: 'POST',
    body: JSON.stringify({ factor_type: 'totp', friendly_name: 'BuildMaster Administrador', issuer: 'BuildMaster Elite Tático' })
  }, session.accessToken);
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload?.id) throw new Error(String(payload?.message || payload?.error || 'Não foi possível iniciar o MFA.'));
  const totp = (payload.totp || {}) as Record<string, unknown>;
  const qrRaw = String(totp.qr_code || '');
  return {
    factorId: String(payload.id),
    qrCode: qrRaw.startsWith('data:') ? qrRaw : `data:image/svg+xml;utf-8,${encodeURIComponent(qrRaw)}`,
    secret: String(totp.secret || ''),
    uri: String(totp.uri || '')
  };
}

export async function verifyAdminMfa(factorId: string, code: string): Promise<AdminMfaStatus> {
  const cleanCode = code.replace(/\D/g, '').slice(0, 8);
  if (cleanCode.length !== 6) throw new Error('Digite o código de 6 números do aplicativo autenticador.');
  const session = await getValidAccountSession();
  if (!session) throw new Error('Entre novamente para confirmar o MFA.');
  const challengeResponse = await supabaseFetch(`/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`, {
    method: 'POST',
    body: JSON.stringify({ factorId })
  }, session.accessToken);
  const challenge = await challengeResponse.json().catch(() => null) as Record<string, unknown> | null;
  if (!challengeResponse.ok || !challenge?.id) throw new Error(String(challenge?.message || challenge?.error || 'Não foi possível criar o desafio MFA.'));
  const verifyResponse = await supabaseFetch(`/auth/v1/factors/${encodeURIComponent(factorId)}/verify`, {
    method: 'POST',
    body: JSON.stringify({ challenge_id: String(challenge.id), code: cleanCode })
  }, session.accessToken);
  const verified = await verifyResponse.json().catch(() => null) as Record<string, unknown> | null;
  if (!verifyResponse.ok || !verified?.access_token || !verified.refresh_token) throw new Error(String(verified?.message || verified?.error || 'Código MFA inválido.'));
  await saveSession({
    accessToken: String(verified.access_token),
    refreshToken: String(verified.refresh_token),
    expiresAt: Date.now() + Number(verified.expires_in || 3600) * 1000,
    userId: String((verified.user as { id?: string } | undefined)?.id || session.userId)
  });
  return getAdminMfaStatus();
}

export async function syncAccountVault(payload: unknown): Promise<void> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Entre novamente para sincronizar.');
  const response = await supabaseFetch('/rest/v1/user_vault_snapshots?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: session.userId, payload, updated_at: new Date().toISOString() })
  }, session.accessToken);
  if (!response.ok) throw new Error('Não consegui salvar seu Cofre na nuvem.');
}

export async function loadAccountVault<T>(): Promise<T | null> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Entre novamente para sincronizar.');
  const response = await supabaseFetch(`/rest/v1/user_vault_snapshots?user_id=eq.${encodeURIComponent(session.userId)}&select=payload&limit=1`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  }, session.accessToken);
  const payload = await response.json().catch(() => []) as Array<{ payload?: T }>;
  if (!response.ok) throw new Error('Não consegui baixar seu Cofre da nuvem.');
  return payload[0]?.payload ?? null;
}

export async function deleteAccountVault(): Promise<void> {
  const session = await getValidAccountSession();
  if (!session) return;
  const response = await supabaseFetch(`/rest/v1/user_vault_snapshots?user_id=eq.${encodeURIComponent(session.userId)}`, { method: 'DELETE' }, session.accessToken);
  if (!response.ok) throw new Error('Não consegui apagar o Cofre da nuvem.');
}
