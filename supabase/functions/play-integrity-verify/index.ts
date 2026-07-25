import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_ID = 'com.buildmaster.elitetatico';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-buildmaster-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };
type IntegrityPayload = {
  requestDetails?: { requestPackageName?: string; requestHash?: string; timestampMillis?: string };
  appIntegrity?: { appRecognitionVerdict?: string; packageName?: string; certificateSha256Digest?: string[]; versionCode?: string };
  deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
  accountDetails?: { appLicensingVerdict?: string };
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function base64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToBytes(pem: string): Uint8Array {
  const begin = '-----BEGIN ' + 'PRIVATE KEY-----';
  const end = '-----END ' + 'PRIVATE KEY-----';
  const normalized = pem.replace(begin, '').replace(end, '').replace(/\s+/g, '');
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function serviceAccessToken(account: ServiceAccount): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/playintegrity',
    aud: tokenUri,
    iat: issuedAt,
    exp: issuedAt + 3600
  }));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToBytes(account.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch(tokenUri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const payload = await response.json().catch(() => null) as { access_token?: string; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) throw new Error(payload?.error_description || 'Não foi possível autenticar no Play Integrity.');
  return payload.access_token;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ message: 'Método não permitido.' }, 405);
  let service: ReturnType<typeof createClient> | null = null;
  let userId: string | null = null;
  let action = 'unknown';
  let requestHash = '';
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return respond({ message: 'Sessão ausente.' }, 401);
    const token = authorization.replace(/^Bearer\s+/i, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await service.auth.getUser(token);
    if (authError || !authData.user) return respond({ message: 'Sessão inválida.' }, 401);
    userId = authData.user.id;

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const integrityToken = String(body.integrityToken || '').trim();
    requestHash = String(body.requestHash || '').trim();
    action = String(body.action || 'protected_action').replace(/[^a-z0-9._-]/gi, '').slice(0, 80);
    if (integrityToken.length < 100 || integrityToken.length > 50_000) return respond({ message: 'Token de integridade inválido.' }, 400);
    if (!/^[A-Za-z0-9_-]{16,500}$/.test(requestHash)) return respond({ message: 'Hash da solicitação inválido.' }, 400);

    const rawAccount = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
    if (!rawAccount) throw new Error('Credencial do Play Integrity não configurada.');
    const account = JSON.parse(rawAccount) as ServiceAccount;
    const accessToken = await serviceAccessToken(account);
    const decode = await fetch(`https://playintegrity.googleapis.com/v1/${APP_ID}:decodeIntegrityToken`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ integrity_token: integrityToken })
    });
    const decoded = await decode.json().catch(() => null) as { tokenPayloadExternal?: IntegrityPayload; error?: { message?: string } } | null;
    if (!decode.ok || !decoded?.tokenPayloadExternal) throw new Error(decoded?.error?.message || 'O Google não validou o token.');

    const payload = decoded.tokenPayloadExternal;
    const app = payload.appIntegrity || {};
    const details = payload.requestDetails || {};
    const verdicts = Array.isArray(payload.deviceIntegrity?.deviceRecognitionVerdict) ? payload.deviceIntegrity?.deviceRecognitionVerdict || [] : [];
    const licensing = payload.accountDetails?.appLicensingVerdict || '';
    const reasons: string[] = [];
    if (details.requestPackageName !== APP_ID) reasons.push('package_name');
    if (details.requestHash !== requestHash) reasons.push('request_hash');
    if (app.packageName !== APP_ID || app.appRecognitionVerdict !== 'PLAY_RECOGNIZED') reasons.push('app_integrity');
    if (!verdicts.includes('MEETS_DEVICE_INTEGRITY')) reasons.push('device_integrity');
    if (licensing !== 'LICENSED') reasons.push('app_licensing');
    const allowed = reasons.length === 0;
    await service.from('buildmaster_play_integrity_audit').insert({
      user_id: userId,
      action,
      request_hash: requestHash,
      app_recognition: app.appRecognitionVerdict || '',
      app_licensing: licensing,
      device_verdicts: verdicts,
      version_code: app.versionCode ? Number(app.versionCode) : null,
      allowed,
      reason: reasons.join(',')
    });
    return respond({
      allowed,
      action,
      verdict: {
        appRecognition: app.appRecognitionVerdict || 'UNEVALUATED',
        appLicensing: licensing || 'UNEVALUATED',
        deviceIntegrity: verdicts,
        versionCode: app.versionCode || null
      },
      reason: allowed ? 'INTEGRITY_OK' : 'INTEGRITY_REJECTED'
    }, allowed ? 200 : 403);
  } catch (cause) {
    console.error('play-integrity-verify', cause);
    if (service) {
      try { await service.from('buildmaster_play_integrity_audit').insert({ user_id: userId, action, request_hash: requestHash || 'missing', allowed: false, reason: 'server_error' }); }
      catch { /* falha de auditoria não substitui o erro principal */ }
    }
    return respond({ message: 'Não foi possível confirmar a integridade do aplicativo.' }, 500);
  }
});
