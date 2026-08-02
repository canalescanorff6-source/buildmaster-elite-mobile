import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-buildmaster-version',
};
const USERNAME_DOMAIN = 'accounts.buildmaster.app';
const APP_ID = 'com.buildmaster.elitetatico';

class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function normalizeUsername(value: unknown) {
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '').slice(0, 20);
}

function versionParts(value: string) {
  return String(value || '0').replace(/^v/i, '').split(/[.-]/).slice(0, 4).map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0);
}

function compareVersions(left: string, right: string) {
  const a = versionParts(left); const b = versionParts(right);
  for (let index = 0; index < Math.max(a.length, b.length, 3); index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

function jwtClaims(token: string): Record<string, unknown> {
  try {
    const encoded = token.split('.')[1];
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function safeAuditDetails(action: string, body: Record<string, unknown>) {
  if (action === 'create') return { username: normalizeUsername(body.username), expiryMode: String(body.expiryMode || 'days'), durationDays: Number(body.durationDays || 0), expiresAt: body.expiresAt || null, maxDevices: Number(body.maxDevices || 1) };
  if (action === 'renew') return { durationDays: Number(body.durationDays || 30) };
  if (action === 'set_status') return { status: String(body.status || '') };
  if (action === 'reset_password') return { passwordChanged: true, sessionsRevoked: true };
  if (action === 'set_devices') return { maxDevices: Number(body.maxDevices || 1) };
  if (action === 'revoke_devices') return { devicesRevoked: true };
  if (action === 'revoke_device') return { deviceId: String(body.deviceId || '').slice(0, 80) };
  if (action === 'update_security_settings') return { settings: body.settings || {} };
  if (action === 'restore_account_creation') return { adminMfaRequired: false, restored: true };
  return {};
}

function ratePolicy(action: string) {
  if (['health', 'list', 'overview', 'list_devices', 'list_audit', 'get_security_settings', 'rate_limit_status'].includes(action)) return { limit: 40, window: 60 };
  if (['create', 'reset_password', 'delete', 'update_security_settings', 'restore_account_creation'].includes(action)) return { limit: 12, window: 300 };
  return { limit: 15, window: 60 };
}

function mapProfile(row: Record<string, unknown>, deviceCount = 0) {
  const expiresAt = row.expires_at ? String(row.expires_at) : null;
  return {
    id: String(row.id || ''),
    username: String(row.username || ''),
    displayName: String(row.display_name || row.username || ''),
    role: row.role === 'admin' ? 'admin' : 'user',
    status: expiresAt && Date.parse(expiresAt) <= Date.now() ? 'expired' : String(row.status || 'active'),
    plan: String(row.plan || 'premium'),
    expiresAt,
    maxDevices: Number(row.max_devices || 1),
    offlineGraceHours: Number(row.offline_grace_hours || 4),
    lastAccessAt: row.last_access_at ? String(row.last_access_at) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    deviceCount
  };
}

function mapDevice(row: Record<string, unknown>, username = '') {
  return {
    id: String(row.id || ''),
    userId: String(row.user_id || ''),
    username,
    deviceId: String(row.device_id || ''),
    deviceName: String(row.device_name || 'Aparelho'),
    platform: String(row.platform || 'unknown'),
    firstSeenAt: String(row.first_seen_at || ''),
    lastSeenAt: String(row.last_seen_at || ''),
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    securityVersion: Number(row.security_version || 1),
    protected: Number(row.security_version || 1) >= 2 && Boolean(row.device_public_key)
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let service: ReturnType<typeof createClient> | null = null;
  let adminId = '';
  let action = '';
  let appVersion = '';
  let targetUserId: string | null = null;
  let requestId: string = crypto.randomUUID();
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new HttpError(401, 'SESSION_MISSING', 'Sessão administrativa ausente.');
    const token = authorization.replace(/^Bearer\s+/i, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await service.auth.getUser(token);
    if (authError || !authData.user) throw new HttpError(401, 'SESSION_INVALID', 'Sessão inválida.');
    adminId = authData.user.id;

    const { data: adminProfile, error: adminError } = await service.from('buildmaster_profiles').select('id, role, status').eq('id', adminId).single();
    if (adminError || !adminProfile || adminProfile.role !== 'admin' || adminProfile.status !== 'active') {
      throw new HttpError(403, 'ADMIN_ONLY', 'Somente o administrador ativo pode realizar esta ação.');
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const clientRequestId = String(body.clientRequestId || '').trim();
    if (clientRequestId && /^[a-zA-Z0-9._:-]{12,120}$/.test(clientRequestId)) requestId = clientRequestId;
    action = String(body.action || '');
    targetUserId = body.userId ? String(body.userId) : null;
    const appId = String(body.appId || '');
    appVersion = String(body.appVersion || request.headers.get('X-BuildMaster-Version') || '').trim();
    const { data: settingsRow } = await service.from('buildmaster_security_settings').select('*').eq('id', 1).maybeSingle();
    const settings = settingsRow || { min_app_version: '29.10.0', allow_legacy_clients: false, admin_mfa_required: false, user_offline_grace_hours: 4, admin_offline_grace_hours: 12, require_device_proof: true, updated_at: new Date().toISOString() };

    if (appId !== APP_ID) throw new HttpError(403, 'APP_ID_INVALID', 'Aplicativo administrativo não reconhecido.');
    if ((!appVersion && !settings.allow_legacy_clients) || (appVersion && compareVersions(appVersion, String(settings.min_app_version)) < 0)) {
      throw new HttpError(426, 'UPDATE_REQUIRED', `O painel deste APK foi desativado. Instale a versão ${settings.min_app_version} ou superior.`);
    }

    if (action === 'health') {
      const { count: profileCount, error: profileCountError } = await service.from('buildmaster_profiles').select('id', { count: 'exact', head: true });
      const { count: userCount, error: userCountError } = await service.from('buildmaster_profiles').select('id', { count: 'exact', head: true }).eq('role', 'user');
      if (profileCountError || userCountError) throw new HttpError(500, 'ACCOUNT_SCHEMA_MISSING', profileCountError?.message || userCountError?.message || 'As tabelas de contas ainda não foram aplicadas.');
      const currentLevel = jwtClaims(token).aal === 'aal2' ? 'aal2' : 'aal1';
      const mfaRequired = Boolean(settings.admin_mfa_required);
      return respond({ ready: !mfaRequired || currentLevel === 'aal2', databaseReady: true, functionReady: true, adminRoleReady: true, mfaRequired, currentLevel, profileCount: Number(profileCount || 0), userCount: Number(userCount || 0), minAppVersion: String(settings.min_app_version || '31.73.0'), message: mfaRequired && currentLevel !== 'aal2' ? 'Servidor pronto. Confirme o MFA para criar contas.' : 'Servidor de contas pronto para criar e gerenciar acessos.' });
    }

    const allowedActions = [
      'health', 'restore_account_creation', 'list', 'overview', 'list_devices', 'revoke_device', 'list_audit', 'get_security_settings',
      'update_security_settings', 'rate_limit_status', 'create', 'renew', 'set_status',
      'reset_password', 'set_devices', 'revoke_devices', 'delete'
    ];
    if (!allowedActions.includes(action)) throw new HttpError(400, 'ACTION_INVALID', 'Ação administrativa desconhecida.');

    const policy = ratePolicy(action);
    const { data: allowed, error: rateError } = await service.rpc('buildmaster_take_admin_rate_limit', {
      p_admin_id: adminId,
      p_action: action,
      p_limit: policy.limit,
      p_window_seconds: policy.window
    });
    if (rateError) throw new HttpError(500, 'RATE_LIMIT_FAILURE', rateError.message);
    if (!allowed) throw new HttpError(429, 'RATE_LIMITED', 'Limite de ações administrativas atingido. Aguarde antes de tentar novamente.');

    if (action === 'restore_account_creation') {
      const { data, error } = await service.from('buildmaster_security_settings')
        .update({ admin_mfa_required: false, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select('*')
        .single();
      if (error || !data) throw new HttpError(500, 'ACCOUNT_PANEL_RESTORE_FAILED', error?.message || 'Não foi possível restaurar o painel de contas.');
      await service.from('buildmaster_admin_audit').insert({
        admin_id: adminId,
        action: 'restore_account_creation',
        outcome: 'success',
        app_version: appVersion,
        request_id: requestId,
        details: safeAuditDetails(action, body)
      });
      return respond({
        success: true,
        restored: true,
        mfaRequired: false,
        message: 'Criação e gerenciamento de contas restaurados.'
      });
    }

    if (settings.admin_mfa_required && jwtClaims(token).aal !== 'aal2' && action !== 'get_security_settings') {
      throw new HttpError(428, 'MFA_REQUIRED', 'Confirme o código do aplicativo autenticador ou restaure o modo normal de criação de contas.');
    }

    const loadProfiles = async () => {
      const { data: profiles, error } = await service!.from('buildmaster_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw new HttpError(500, 'LIST_FAILED', error.message);
      const { data: devices, error: deviceError } = await service!.from('buildmaster_devices').select('user_id').is('revoked_at', null);
      if (deviceError) throw new HttpError(500, 'DEVICE_LIST_FAILED', deviceError.message);
      const counts = new Map<string, number>();
      for (const device of devices || []) counts.set(String(device.user_id), (counts.get(String(device.user_id)) || 0) + 1);
      return (profiles || []).map((row) => mapProfile(row as Record<string, unknown>, counts.get(String(row.id)) || 0));
    };

    const loadDevices = async (userId?: string, includeRevoked = true) => {
      let query = service!.from('buildmaster_devices').select('*').order('last_seen_at', { ascending: false }).limit(200);
      if (userId) query = query.eq('user_id', userId);
      if (!includeRevoked) query = query.is('revoked_at', null);
      const { data, error } = await query;
      if (error) throw new HttpError(500, 'DEVICE_LIST_FAILED', error.message);
      const userIds = [...new Set((data || []).map((row) => String(row.user_id)))];
      const usernameMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profiles } = await service!.from('buildmaster_profiles').select('id, username').in('id', userIds);
        for (const profile of profiles || []) usernameMap.set(String(profile.id), String(profile.username));
      }
      return (data || []).map((row) => mapDevice(row as Record<string, unknown>, usernameMap.get(String(row.user_id)) || ''));
    };

    const loadAudit = async (limit = 80, userId?: string) => {
      let query = service!.from('buildmaster_admin_audit').select('*').order('created_at', { ascending: false }).limit(Math.max(1, Math.min(200, limit)));
      if (userId) query = query.eq('target_user_id', userId);
      const { data, error } = await query;
      if (error) throw new HttpError(500, 'AUDIT_LIST_FAILED', error.message);
      const ids = [...new Set((data || []).flatMap((row) => [row.admin_id, row.target_user_id]).filter(Boolean).map(String))];
      const names = new Map<string, string>();
      if (ids.length) {
        const { data: profiles } = await service!.from('buildmaster_profiles').select('id, username').in('id', ids);
        for (const profile of profiles || []) names.set(String(profile.id), String(profile.username));
      }
      return (data || []).map((row) => ({
        id: String(row.id),
        adminId: row.admin_id ? String(row.admin_id) : null,
        adminUsername: row.admin_id ? names.get(String(row.admin_id)) || 'administrador' : 'sistema',
        targetUserId: row.target_user_id ? String(row.target_user_id) : null,
        targetUsername: row.target_user_id ? names.get(String(row.target_user_id)) || null : null,
        action: String(row.action || ''),
        outcome: ['denied', 'error'].includes(String(row.outcome)) ? String(row.outcome) : 'success',
        appVersion: row.app_version ? String(row.app_version) : null,
        details: row.details && typeof row.details === 'object' ? row.details : {},
        createdAt: String(row.created_at || '')
      }));
    };

    const mappedSettings = () => ({
      minAppVersion: String(settings.min_app_version || '29.10.0'),
      allowLegacyClients: Boolean(settings.allow_legacy_clients),
      requireDeviceProof: Boolean(settings.require_device_proof),
      adminMfaRequired: Boolean(settings.admin_mfa_required),
      userOfflineGraceHours: Number(settings.user_offline_grace_hours || 4),
      adminOfflineGraceHours: Number(settings.admin_offline_grace_hours || 12),
      updatedAt: String(settings.updated_at || new Date().toISOString())
    });

    if (action === 'list') return respond({ users: await loadProfiles() });
    if (action === 'list_devices') return respond({ devices: await loadDevices(targetUserId || undefined, body.includeRevoked !== false) });
    if (action === 'list_audit') return respond({ audit: await loadAudit(Number(body.limit || 80), body.targetUserId ? String(body.targetUserId) : undefined) });
    if (action === 'get_security_settings') return respond({ settings: mappedSettings() });
    if (action === 'rate_limit_status') {
      const { data, error } = await service.from('buildmaster_admin_rate_limits').select('action, request_count, window_started_at, updated_at').eq('admin_id', adminId).order('updated_at', { ascending: false });
      if (error) throw new HttpError(500, 'RATE_STATUS_FAILED', error.message);
      return respond({ rateLimits: (data || []).map((row) => ({ action: row.action, requestCount: row.request_count, windowStartedAt: row.window_started_at, updatedAt: row.updated_at })) });
    }
    if (action === 'overview') {
      const [users, devices, audit, rateResponse] = await Promise.all([
        loadProfiles(),
        loadDevices(undefined, true),
        loadAudit(Number(body.auditLimit || 50)),
        service.from('buildmaster_admin_rate_limits').select('action, request_count, window_started_at, updated_at').eq('admin_id', adminId).order('updated_at', { ascending: false })
      ]);
      if (rateResponse.error) throw new HttpError(500, 'RATE_STATUS_FAILED', rateResponse.error.message);
      return respond({
        users,
        devices,
        audit,
        settings: mappedSettings(),
        rateLimits: (rateResponse.data || []).map((row) => ({ action: row.action, requestCount: row.request_count, windowStartedAt: row.window_started_at, updatedAt: row.updated_at })),
        generatedAt: new Date().toISOString()
      });
    }

    if (action === 'update_security_settings') {
      const proposed = body.settings && typeof body.settings === 'object' ? body.settings as Record<string, unknown> : {};
      const minAppVersion = String(proposed.minAppVersion || settings.min_app_version || '29.10.0').replace(/^v/i, '').trim();
      if (!/^\d+\.\d+\.\d+$/.test(minAppVersion)) throw new HttpError(400, 'MIN_VERSION_INVALID', 'Informe a versão mínima no formato 29.10.0.');
      const payload = {
        min_app_version: minAppVersion,
        allow_legacy_clients: Boolean(proposed.allowLegacyClients),
        require_device_proof: true,
        admin_mfa_required: proposed.adminMfaRequired === undefined ? Boolean(settings.admin_mfa_required) : Boolean(proposed.adminMfaRequired),
        user_offline_grace_hours: Math.max(0, Math.min(24, Number(proposed.userOfflineGraceHours ?? settings.user_offline_grace_hours ?? 4))),
        admin_offline_grace_hours: Math.max(0, Math.min(24, Number(proposed.adminOfflineGraceHours ?? settings.admin_offline_grace_hours ?? 12))),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await service.from('buildmaster_security_settings').update(payload).eq('id', 1).select('*').single();
      if (error || !data) throw new HttpError(500, 'SECURITY_SETTINGS_FAILED', error?.message || 'Não foi possível salvar a política.');
      await service.from('buildmaster_admin_audit').insert({ admin_id: adminId, action: 'update_security_settings', outcome: 'success', app_version: appVersion, request_id: requestId, details: safeAuditDetails(action, body) });
      return respond({ success: true, settings: {
        minAppVersion: data.min_app_version,
        allowLegacyClients: data.allow_legacy_clients,
        requireDeviceProof: data.require_device_proof,
        adminMfaRequired: data.admin_mfa_required,
        userOfflineGraceHours: data.user_offline_grace_hours,
        adminOfflineGraceHours: data.admin_offline_grace_hours,
        updatedAt: data.updated_at
      } });
    }

    if (action === 'revoke_device') {
      const userId = String(body.userId || '');
      const deviceId = String(body.deviceId || '');
      if (!userId || !deviceId) throw new HttpError(400, 'DEVICE_TARGET_MISSING', 'Aparelho alvo ausente.');
      const { error } = await service.from('buildmaster_devices').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).eq('device_id', deviceId).is('revoked_at', null);
      if (error) throw new HttpError(500, 'REVOKE_DEVICE_FAILED', error.message);
      await service.from('buildmaster_admin_audit').insert({ admin_id: adminId, target_user_id: userId, action, outcome: 'success', app_version: appVersion, request_id: requestId, details: safeAuditDetails(action, body) });
      return respond({ success: true });
    }

    if (action === 'create') {
      const username = normalizeUsername(body.username);
      const { data: previousAudit } = await service.from('buildmaster_admin_audit')
        .select('target_user_id, details')
        .eq('admin_id', adminId)
        .eq('action', 'create_user')
        .eq('outcome', 'success')
        .eq('request_id', requestId)
        .maybeSingle();
      if (previousAudit?.target_user_id) {
        const reusedUserId = String(previousAudit.target_user_id);
        const { data: reusedAuth } = await service.auth.admin.getUserById(reusedUserId);
        const { data: reusedProfile } = await service.from('buildmaster_profiles').select('id, username, status, expires_at').eq('id', reusedUserId).maybeSingle();
        if (reusedAuth?.user?.id && reusedProfile?.id) {
          return respond({ success: true, userId: reusedUserId, username: String(reusedProfile.username || username), requestId, authConfirmed: true, profileConfirmed: true, expiryConfirmed: reusedProfile.expires_at === null || Number.isFinite(Date.parse(String(reusedProfile.expires_at))), duplicateBlocked: true });
        }
      }
      const password = String(body.password || '');
      const expiryMode = ['days', 'date', 'never'].includes(String(body.expiryMode)) ? String(body.expiryMode) : 'days';
      const durationDays = Math.max(1, Math.min(3650, Number(body.durationDays || 30)));
      const maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1)));
      if (username.length < 3 || !/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) throw new HttpError(400, 'USERNAME_INVALID', 'Nome de usuário inválido.');
      if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) throw new HttpError(400, 'PASSWORD_WEAK', 'A senha temporária precisa ter 10 caracteres, letra maiúscula, minúscula e número.');
      let expiresAt: string | null = null;
      if (expiryMode === 'days') expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
      if (expiryMode === 'date') {
        const requestedExpiry = Date.parse(String(body.expiresAt || ''));
        const maximumExpiry = Date.now() + 3650 * 86400000;
        if (!Number.isFinite(requestedExpiry) || requestedExpiry <= Date.now() + 60_000) throw new HttpError(400, 'EXPIRY_INVALID', 'Escolha uma data de vencimento futura.');
        if (requestedExpiry > maximumExpiry) throw new HttpError(400, 'EXPIRY_TOO_FAR', 'O vencimento não pode ultrapassar 10 anos.');
        expiresAt = new Date(requestedExpiry).toISOString();
      }
      const displayName = String(body.displayName || username).trim().slice(0, 80) || username;
      const plan = String(body.plan || 'premium').trim().slice(0, 40) || 'premium';
      const offlineGrace = Number(settings.user_offline_grace_hours || 4);
      const { data: existingProfile } = await service.from('buildmaster_profiles').select('id').eq('username', username).maybeSingle();
      if (existingProfile?.id) throw new HttpError(409, 'USERNAME_EXISTS', 'Esse nome de usuário já está cadastrado.');
      const { data: created, error } = await service.auth.admin.createUser({
        email: `${username}@${USERNAME_DOMAIN}`,
        password,
        email_confirm: true,
        app_metadata: { buildmaster_managed: true },
        user_metadata: { username, display_name: displayName, plan, expires_at: expiresAt, max_devices: maxDevices, offline_grace_hours: offlineGrace }
      });
      if (error || !created.user) {
        const rawMessage = String(error?.message || 'Não foi possível criar o usuário.');
        if (/already registered|already exists|duplicate|unique/i.test(rawMessage)) {
          throw new HttpError(409, 'USERNAME_EXISTS', 'Esse nome de usuário já está cadastrado. Escolha outro nome.');
        }
        if (/password/i.test(rawMessage)) {
          throw new HttpError(400, 'PASSWORD_REJECTED', 'A senha foi recusada pelo servidor. Use “Gerar senha segura” no aplicativo.');
        }
        throw new HttpError(400, 'CREATE_FAILED', rawMessage);
      }
      const { data: persistedProfile, error: profileError } = await service.from('buildmaster_profiles').upsert({
        id: created.user.id, username, display_name: displayName, role: 'user', status: 'active', plan,
        expires_at: expiresAt, max_devices: maxDevices, offline_grace_hours: offlineGrace, created_by: adminId
      }).select('id, username, status').single();
      if (profileError || !persistedProfile?.id) {
        const cleanup = await service.auth.admin.deleteUser(created.user.id, false);
        const cleanupDetail = cleanup.error ? ' A limpeza automática também falhou; consulte a referência desta operação.' : '';
        throw new HttpError(500, 'PROFILE_CREATE_FAILED', `${profileError?.message || 'O perfil do usuário não foi confirmado no banco.'}${cleanupDetail}`);
      }
      const { data: confirmedAuth, error: confirmedAuthError } = await service.auth.admin.getUserById(created.user.id);
      if (confirmedAuthError || !confirmedAuth?.user?.id) {
        await service.auth.admin.deleteUser(created.user.id, false).catch(() => undefined);
        throw new HttpError(500, 'AUTH_CONFIRMATION_FAILED', 'O usuário não foi confirmado no Auth do Supabase.');
      }
      const { data: confirmedProfile, error: confirmedProfileError } = await service.from('buildmaster_profiles')
        .select('id, username, status, expires_at, max_devices')
        .eq('id', created.user.id)
        .single();
      if (confirmedProfileError || !confirmedProfile?.id || confirmedProfile.username !== username || confirmedProfile.status !== 'active') {
        await service.auth.admin.deleteUser(created.user.id, false).catch(() => undefined);
        throw new HttpError(500, 'PROFILE_CONFIRMATION_FAILED', 'Perfil não gravado ou não confirmado no banco.');
      }
      const expiryConfirmed = expiryMode === 'never'
        ? confirmedProfile.expires_at === null
        : Boolean(confirmedProfile.expires_at && Math.abs(Date.parse(String(confirmedProfile.expires_at)) - Date.parse(String(expiresAt))) < 90_000);
      if (!expiryConfirmed) {
        await service.auth.admin.deleteUser(created.user.id, false).catch(() => undefined);
        throw new HttpError(500, 'EXPIRY_CONFIRMATION_FAILED', 'O prazo de ativação não foi confirmado.');
      }
      const { error: createAuditError } = await service.from('buildmaster_admin_audit').insert({ admin_id: adminId, target_user_id: created.user.id, action: 'create_user', outcome: 'success', app_version: appVersion, request_id: requestId, details: { username, expiryMode, durationDays: expiryMode === 'days' ? durationDays : null, expiresAt, maxDevices, plan, authConfirmed: true, profileConfirmed: true, expiryConfirmed: true } });
      if (createAuditError) throw new HttpError(500, 'AUDIT_FAILED', createAuditError.message);
      return respond({ success: true, userId: created.user.id, username, requestId, authConfirmed: true, profileConfirmed: true, expiryConfirmed: true, duplicateBlocked: false });
    }

    const userId = String(body.userId || '');
    if (!userId) throw new HttpError(400, 'TARGET_MISSING', 'Usuário alvo ausente.');
    const { data: target, error: targetError } = await service.from('buildmaster_profiles').select('*').eq('id', userId).single();
    if (targetError || !target) throw new HttpError(404, 'TARGET_NOT_FOUND', 'Usuário não encontrado.');

    if (action === 'renew') {
      const days = Math.max(1, Math.min(3650, Number(body.durationDays || 30)));
      const current = target.expires_at && Date.parse(target.expires_at) > Date.now() ? Date.parse(target.expires_at) : Date.now();
      const { error } = await service.from('buildmaster_profiles').update({ expires_at: new Date(current + days * 86400000).toISOString(), status: 'active' }).eq('id', userId);
      if (error) throw new HttpError(500, 'RENEW_FAILED', error.message);
    } else if (action === 'set_status') {
      const status = String(body.status || '');
      if (!['active', 'suspended', 'blocked'].includes(status)) throw new HttpError(400, 'STATUS_INVALID', 'Status inválido.');
      if (target.role === 'admin' && status !== 'active') throw new HttpError(403, 'ADMIN_PROTECTED', 'A conta principal de administrador não pode ser bloqueada por este painel.');
      const { error } = await service.from('buildmaster_profiles').update({ status }).eq('id', userId);
      if (error) throw new HttpError(500, 'STATUS_FAILED', error.message);
    } else if (action === 'reset_password') {
      const password = String(body.password || '');
      if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) throw new HttpError(400, 'PASSWORD_WEAK', 'A nova senha precisa ter 10 caracteres, letra maiúscula, minúscula e número.');
      const { error } = await service.auth.admin.updateUserById(userId, { password });
      if (error) throw new HttpError(500, 'PASSWORD_FAILED', error.message);
      await service.from('buildmaster_devices').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null);
    } else if (action === 'set_devices') {
      const maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1)));
      const { error } = await service.from('buildmaster_profiles').update({ max_devices: maxDevices }).eq('id', userId);
      if (error) throw new HttpError(500, 'DEVICE_LIMIT_FAILED', error.message);
    } else if (action === 'revoke_devices') {
      const { error } = await service.from('buildmaster_devices').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null);
      if (error) throw new HttpError(500, 'REVOKE_FAILED', error.message);
    } else if (action === 'delete') {
      if (target.role === 'admin' || target.id === adminId) throw new HttpError(403, 'ADMIN_PROTECTED', 'A conta principal de administrador não pode ser excluída.');
      await service.from('buildmaster_admin_audit').insert({ admin_id: adminId, target_user_id: userId, action: 'delete', outcome: 'success', app_version: appVersion, request_id: requestId, details: { username: target.username } });
      const { error } = await service.auth.admin.deleteUser(userId, false);
      if (error) throw new HttpError(500, 'DELETE_FAILED', error.message);
      return respond({ success: true });
    }

    const { error: auditError } = await service.from('buildmaster_admin_audit').insert({
      admin_id: adminId,
      target_user_id: userId,
      action,
      outcome: 'success',
      app_version: appVersion,
      request_id: requestId,
      details: safeAuditDetails(action, body)
    });
    if (auditError) throw new HttpError(500, 'AUDIT_FAILED', auditError.message);
    return respond({ success: true });
  } catch (error) {
    if (service && adminId && action) {
      try {
        await service.from('buildmaster_admin_audit').insert({
          admin_id: adminId,
          target_user_id: targetUserId,
          action,
          outcome: error instanceof HttpError && error.status < 500 ? 'denied' : 'error',
          app_version: appVersion || null,
          request_id: requestId,
          details: { code: error instanceof HttpError ? error.code : 'ADMIN_FAILURE', message: error instanceof Error ? error.message.slice(0, 300) : 'Falha administrativa' }
        });
      } catch {
        // A falha da auditoria não pode esconder a resposta original.
      }
    }
    if (error instanceof HttpError) return respond({ error: error.message, code: error.code, requestId }, error.status);
    return respond({ error: error instanceof Error ? error.message : 'Falha administrativa.', code: 'ADMIN_FAILURE', requestId }, 500);
  }
});
