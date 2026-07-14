import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const USERNAME_DOMAIN = 'accounts.buildmaster.app';

function normalizeUsername(value: unknown) {
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '').slice(0, 20);
}

function safeAuditDetails(action: string, body: Record<string, unknown>) {
  if (action === 'renew') return { durationDays: Number(body.durationDays || 30) };
  if (action === 'set_status') return { status: String(body.status || '') };
  if (action === 'reset_password') return { passwordChanged: true };
  if (action === 'set_devices') return { maxDevices: Number(body.maxDevices || 1) };
  if (action === 'revoke_devices') return { devicesRevoked: true };
  return {};
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sessão administrativa ausente.');
    const token = authorization.replace(/^Bearer\s+/i, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await service.auth.getUser(token);
    if (authError || !authData.user) throw new Error('Sessão inválida.');

    const { data: adminProfile, error: adminError } = await service.from('buildmaster_profiles').select('id, role, status').eq('id', authData.user.id).single();
    if (adminError || !adminProfile || adminProfile.role !== 'admin' || adminProfile.status !== 'active') throw new Error('Somente o administrador pode realizar esta ação.');

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const action = String(body.action || '');

    if (action === 'list') {
      const { data: profiles, error } = await service.from('buildmaster_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      const { data: devices, error: deviceError } = await service.from('buildmaster_devices').select('user_id').is('revoked_at', null);
      if (deviceError) throw new Error(deviceError.message);
      const counts = new Map<string, number>();
      for (const device of devices || []) counts.set(device.user_id, (counts.get(device.user_id) || 0) + 1);
      return respond({ users: (profiles || []).map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        role: row.role,
        status: row.expires_at && Date.parse(row.expires_at) <= Date.now() ? 'expired' : row.status,
        plan: row.plan,
        expiresAt: row.expires_at,
        maxDevices: row.max_devices,
        offlineGraceHours: row.offline_grace_hours,
        lastAccessAt: row.last_access_at,
        createdAt: row.created_at,
        deviceCount: counts.get(row.id) || 0
      })) });
    }

    if (action === 'create') {
      const username = normalizeUsername(body.username);
      const password = String(body.password || '');
      const durationDays = Math.max(1, Math.min(3650, Number(body.durationDays || 30)));
      const maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1)));
      if (username.length < 3) throw new Error('Nome de usuário inválido.');
      if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) throw new Error('Comece e termine o usuário com letra ou número.');
      if (password.length < 8) throw new Error('A senha temporária precisa ter pelo menos 8 caracteres.');
      const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
      const displayName = String(body.displayName || username).trim().slice(0, 80) || username;
      const plan = String(body.plan || 'premium').trim().slice(0, 40) || 'premium';
      const { data: created, error } = await service.auth.admin.createUser({
        email: `${username}@${USERNAME_DOMAIN}`,
        password,
        email_confirm: true,
        app_metadata: { buildmaster_managed: true },
        user_metadata: {
          username,
          display_name: displayName,
          plan,
          expires_at: expiresAt,
          max_devices: maxDevices,
          offline_grace_hours: 24
        }
      });
      if (error || !created.user) throw new Error(error?.message || 'Não foi possível criar o usuário.');

      const { error: profileError } = await service.from('buildmaster_profiles').upsert({
        id: created.user.id,
        username,
        display_name: displayName,
        role: 'user', status: 'active', plan, expires_at: expiresAt,
        max_devices: maxDevices, offline_grace_hours: 24, created_by: authData.user.id
      });
      if (profileError) {
        await service.auth.admin.deleteUser(created.user.id, false);
        throw new Error(profileError.message);
      }
      const { error: auditError } = await service.from('buildmaster_admin_audit').insert({ admin_id: authData.user.id, target_user_id: created.user.id, action: 'create_user', details: { username, durationDays, maxDevices, plan } });
      if (auditError) throw new Error(auditError.message);
      return respond({ success: true, userId: created.user.id });
    }

    const userId = String(body.userId || '');
    if (!userId) throw new Error('Usuário alvo ausente.');
    const { data: target, error: targetError } = await service.from('buildmaster_profiles').select('*').eq('id', userId).single();
    if (targetError || !target) throw new Error('Usuário não encontrado.');

    if (action === 'renew') {
      const days = Math.max(1, Math.min(3650, Number(body.durationDays || 30)));
      const current = target.expires_at && Date.parse(target.expires_at) > Date.now() ? Date.parse(target.expires_at) : Date.now();
      const { error } = await service.from('buildmaster_profiles').update({ expires_at: new Date(current + days * 86400000).toISOString(), status: 'active' }).eq('id', userId);
      if (error) throw new Error(error.message);
    } else if (action === 'set_status') {
      const status = String(body.status || '');
      if (!['active', 'suspended', 'blocked'].includes(status)) throw new Error('Status inválido.');
      if (target.role === 'admin' && status !== 'active') throw new Error('A conta principal de administrador não pode ser bloqueada por este painel.');
      const { error } = await service.from('buildmaster_profiles').update({ status }).eq('id', userId);
      if (error) throw new Error(error.message);
    } else if (action === 'reset_password') {
      const password = String(body.password || '');
      if (password.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.');
      const { error } = await service.auth.admin.updateUserById(userId, { password });
      if (error) throw new Error(error.message);
    } else if (action === 'set_devices') {
      const maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1)));
      const { error } = await service.from('buildmaster_profiles').update({ max_devices: maxDevices }).eq('id', userId);
      if (error) throw new Error(error.message);
    } else if (action === 'revoke_devices') {
      const { error } = await service.from('buildmaster_devices').update({ revoked_at: new Date().toISOString() }).eq('user_id', userId).is('revoked_at', null);
      if (error) throw new Error(error.message);
    } else if (action === 'delete') {
      if (target.role === 'admin' || target.id === authData.user.id) throw new Error('A conta principal de administrador não pode ser excluída.');
      const { error: auditError } = await service.from('buildmaster_admin_audit').insert({ admin_id: authData.user.id, target_user_id: userId, action: 'delete', details: { username: target.username } });
      if (auditError) throw new Error(auditError.message);
      const { error } = await service.auth.admin.deleteUser(userId, false);
      if (error) throw new Error(error.message);
      return respond({ success: true });
    } else {
      throw new Error('Ação administrativa desconhecida.');
    }

    const { error: auditError } = await service.from('buildmaster_admin_audit').insert({
      admin_id: authData.user.id,
      target_user_id: userId,
      action,
      details: safeAuditDetails(action, body)
    });
    if (auditError) throw new Error(auditError.message);
    return respond({ success: true });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : 'Falha administrativa.' }, 403);
  }
});
