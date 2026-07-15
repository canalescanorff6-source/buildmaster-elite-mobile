import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { clearActiveAccountIdentity, setActiveAccountIdentity } from '@/lib/accountStorage';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'buildmaster_cloud_auth_session_v1';
const LICENSE_CACHE_KEY = 'buildmaster_license_cache_v1';
const DEVICE_ID_KEY = 'buildmaster_device_id_v1';
const USERNAME_DOMAIN = 'accounts.buildmaster.app';

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

function storageAvailable() {
  return typeof window !== 'undefined';
}

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

export function getOrCreateDeviceId(): string {
  if (!storageAvailable()) return 'server-render';
  const current = localStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function deviceName() {
  if (typeof navigator === 'undefined') return 'Aparelho desconhecido';
  const platform = navigator.platform || 'Android';
  const agent = navigator.userAgent.match(/Android[^;)]*/i)?.[0] || '';
  return `${platform}${agent ? ` • ${agent}` : ''}`.slice(0, 120);
}

function saveSession(session: AccountSession) {
  if (!storageAvailable()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readSession(): AccountSession | null {
  if (!storageAvailable()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Partial<AccountSession> | null;
    if (!value?.accessToken || !value.refreshToken || !value.userId || !Number.isFinite(value.expiresAt)) return null;
    return value as AccountSession;
  } catch {
    return null;
  }
}

function clearSessionStorage() {
  if (!storageAvailable()) return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LICENSE_CACHE_KEY);
  clearActiveAccountIdentity();
}

async function supabaseFetch(path: string, init: RequestInit = {}, accessToken?: string) {
  if (!isCloudAccountsConfigured()) throw new Error('Supabase ainda não foi configurado no projeto.');
  const headers = new Headers(init.headers || {});
  headers.set('apikey', SUPABASE_ANON_KEY);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const url = `${SUPABASE_URL}${path}`;
  try {
    return await fetch(url, { ...init, headers, cache: 'no-store' });
  } catch (webError) {
    if (!Capacitor.isNativePlatform()) throw webError;

    const nativeResponse = await CapacitorHttp.request({
      url,
      method: String(init.method || 'GET'),
      headers: Object.fromEntries(headers.entries()),
      data: typeof init.body === 'string' ? init.body : undefined,
      connectTimeout: 20_000,
      readTimeout: 30_000,
      responseType: 'text'
    });

    const responseBody = typeof nativeResponse.data === 'string'
      ? nativeResponse.data
      : JSON.stringify(nativeResponse.data ?? null);
    return new Response(responseBody, {
      status: nativeResponse.status,
      headers: nativeResponse.headers
    });
  }
}

async function refreshSession(current: AccountSession): Promise<AccountSession> {
  const response = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: current.refreshToken })
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !payload?.access_token || !payload.refresh_token) {
    clearSessionStorage();
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  const next: AccountSession = {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token),
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    userId: String((payload.user as { id?: string } | undefined)?.id || current.userId)
  };
  saveSession(next);
  return next;
}

export async function getValidAccountSession(): Promise<AccountSession | null> {
  const session = readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;
  return refreshSession(session);
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
    offlineGraceHours: Math.max(0, Number(input.offlineGraceHours ?? input.offline_grace_hours ?? 24) || 0),
    lastAccessAt: input.lastAccessAt || input.last_access_at ? String(input.lastAccessAt ?? input.last_access_at) : null
  };
}

function cacheLicense(validation: LicenseValidation) {
  if (!storageAvailable()) return;
  localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(validation));
  setActiveAccountIdentity({
    id: validation.profile.id,
    username: validation.profile.username,
    role: validation.profile.role,
    expiresAt: validation.profile.expiresAt,
    mode: 'cloud'
  });
}

function readCachedLicense(): LicenseValidation | null {
  if (!storageAvailable()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) || 'null') as LicenseValidation | null;
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
    response = await supabaseFetch(`/functions/v1/${name}`, {
      method: 'POST',
      body: JSON.stringify(body)
    }, accessToken);
  } catch {
    throw new Error(`Não consegui conectar ao serviço ${name}. Confira a internet e tente novamente.`);
  }
  const payload = await response.json().catch(() => null) as T & { error?: string; message?: string } | null;
  if (!response.ok) {
    const serverMessage = payload?.error || payload?.message;
    if (response.status === 404) throw new Error(`O serviço de licença ${name} não foi encontrado no Supabase.`);
    if (response.status === 401) throw new Error('Sua sessão não é mais válida. Entre novamente.');
    if (response.status === 403) throw new Error('Esta conta não tem permissão para concluir essa operação.');
    if (response.status === 429) throw new Error('Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.');
    if (response.status >= 500) throw new Error('O servidor de licenças está temporariamente indisponível. Tente novamente em instantes.');
    throw new Error(serverMessage || `Não foi possível concluir a validação no serviço ${name}.`);
  }
  return payload as T;
}

export async function validateOnlineLicense(session?: AccountSession): Promise<LicenseValidation> {
  const active = session || await getValidAccountSession();
  if (!active) throw new Error('Entre com seu usuário e senha.');
  const payload = await invokeFunction<{ profile: Record<string, unknown>; validatedAt?: string }>('license-session', {
    action: 'validate',
    deviceId: getOrCreateDeviceId(),
    deviceName: deviceName(),
    platform: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent
  }, active.accessToken);
  const validation: LicenseValidation = {
    profile: normalizeProfile(payload.profile),
    deviceId: getOrCreateDeviceId(),
    validatedAt: payload.validatedAt || new Date().toISOString(),
    offline: false
  };
  cacheLicense(validation);
  return validation;
}

function explainAuthFailure(payload: Record<string, unknown> | null, status: number): string {
  const code = String(payload?.error_code ?? payload?.code ?? '').toLowerCase();
  const rawMessage = String(payload?.message ?? payload?.msg ?? payload?.error_description ?? payload?.error ?? '').trim();
  const message = rawMessage.toLowerCase();

  if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) {
    return 'A conta existe, mas ainda não foi confirmada no Supabase.';
  }
  if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) {
    return 'Usuário ou senha incorretos.';
  }
  if (message.includes('invalid api key') || message.includes('no api key') || code.includes('invalid_api_key')) {
    return 'Este APK foi gerado com uma chave incorreta do Supabase. Gere e instale um APK novo.';
  }
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
  if (!response.ok || !payload?.access_token || !payload.refresh_token) {
    throw new Error(explainAuthFailure(payload, response.status));
  }
  const session: AccountSession = {
    accessToken: String(payload.access_token),
    refreshToken: String(payload.refresh_token),
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    userId: String((payload.user as { id?: string } | undefined)?.id || '')
  };
  saveSession(session);
  try {
    return await validateOnlineLicense(session);
  } catch (error) {
    clearSessionStorage();
    throw error;
  }
}

function isNetworkFailure(error: unknown) {
  const message = String(error).toLowerCase();
  return error instanceof TypeError || message.includes('fetch') || message.includes('network') || message.includes('failed to connect');
}

function restoreCachedLicenseOrThrow(error: unknown): LicenseValidation {
  const cached = readCachedLicense();
  if (cached) {
    const status = evaluateCachedLicense(cached);
    if (status.valid) {
      const offline = { ...cached, offline: true };
      cacheLicense(offline);
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
    if (isNetworkFailure(error)) return restoreCachedLicenseOrThrow(error);
    throw error;
  }
}

export async function signOutAccount() {
  const session = readSession();
  try {
    if (session && isCloudAccountsConfigured()) await supabaseFetch('/auth/v1/logout', { method: 'POST' }, session.accessToken);
  } catch {
    // A sessão local será removida mesmo sem conexão.
  }
  clearSessionStorage();
}

export async function adminAccountRequest<T = { users?: AdminUserRow[]; success?: boolean }>(action: AdminUserAction): Promise<T> {
  const session = await getValidAccountSession();
  if (!session) throw new Error('Sessão administrativa ausente.');
  return invokeFunction<T>('admin-users', action, session.accessToken);
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
