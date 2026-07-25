import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function cleanUsername(value: unknown): string {
  return String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '').slice(0, 20);
}

function cleanReason(value: unknown): string {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 500);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ message: 'Método não permitido.' }, 405);
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const username = cleanUsername(body.username);
    const confirmation = String(body.confirmation || '').trim().toUpperCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/.test(username)) return respond({ message: 'Nome de usuário inválido.' }, 400);
    if (confirmation !== 'EXCLUIR') return respond({ message: 'Confirmação obrigatória ausente.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const privacySalt = Deno.env.get('BUILDMASTER_PRIVACY_HASH_SALT') || serviceKey.slice(0, 24);
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = await sha256(`${privacySalt}:ip:${forwarded}`);
    const rateKey = `delete:${ipHash}`;
    const { data: rate } = await service.from('buildmaster_public_request_limits').select('*').eq('rate_key', rateKey).maybeSingle();
    const windowStarted = rate?.window_started_at ? Date.parse(String(rate.window_started_at)) : 0;
    const activeWindow = Number.isFinite(windowStarted) && Date.now() - windowStarted < 15 * 60 * 1000;
    const count = activeWindow ? Number(rate?.request_count || 0) : 0;
    if (count >= 5) return respond({ message: 'Muitas solicitações neste período. Aguarde alguns minutos.' }, 429);
    await service.from('buildmaster_public_request_limits').upsert({ rate_key: rateKey, request_count: count + 1, window_started_at: activeWindow ? rate.window_started_at : new Date().toISOString(), updated_at: new Date().toISOString() });

    let userId: string | null = null;
    const authorization = request.headers.get('Authorization');
    if (authorization) {
      const token = authorization.replace(/^Bearer\s+/i, '');
      const { data } = await service.auth.getUser(token);
      userId = data.user?.id || null;
    }
    if (!userId) {
      const { data: profile } = await service.from('buildmaster_profiles').select('id').eq('username', username).maybeSingle();
      userId = profile?.id ? String(profile.id) : null;
    }

    const requestKey = `BM-DEL-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const usernameHash = await sha256(`${privacySalt}:username:${username}`);
    const usernameHint = `${username.slice(0, 2)}${'*'.repeat(Math.max(3, username.length - 2))}`.slice(0, 20);
    const { error } = await service.from('buildmaster_public_deletion_requests').insert({
      request_key: requestKey,
      user_id: userId,
      username_hash: usernameHash,
      username_hint: usernameHint,
      reason: cleanReason(body.reason),
      source: authorization ? 'authenticated_app' : 'public_web',
      ip_hash: ipHash
    });
    if (error) throw error;
    return respond({ ok: true, requestId: requestKey, message: 'Solicitação registrada para análise.' });
  } catch (cause) {
    console.error('account-deletion-request', cause);
    return respond({ message: 'Não foi possível registrar a solicitação agora.' }, 500);
  }
});
