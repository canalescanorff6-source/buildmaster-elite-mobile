import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sessão ausente.');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const body = await request.json().catch(() => ({}));
    const deviceId = String(body.deviceId || '').trim();
    if (!deviceId) throw new Error('Identificador do aparelho ausente.');

    const { data, error } = await client.rpc('buildmaster_validate_license_and_register_device', {
      p_device_id: deviceId,
      p_device_name: String(body.deviceName || 'Aparelho'),
      p_platform: String(body.platform || 'unknown')
    });
    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ profile: data, validatedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha ao validar a licença.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
