const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
  });
}

function clean(value: unknown, limit: number) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'METHOD_NOT_ALLOWED' }, 405);
  try {
    const apiKey = Deno.env.get('YOUTUBE_DATA_API_KEY') || '';
    if (!apiKey) return respond({ videos: [], message: 'YOUTUBE_DATA_API_KEY não configurada no Supabase.' }, 503);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const query = clean(body.query, 220);
    const gamerTag = clean(body.gamerTag, 60);
    const limit = Math.max(1, Math.min(8, Number(body.limit) || 6));
    if (!query || query.length < 8) return respond({ error: 'QUERY_INVALID' }, 400);
    const search = new URL('https://www.googleapis.com/youtube/v3/search');
    search.searchParams.set('part', 'snippet');
    search.searchParams.set('type', 'video');
    search.searchParams.set('safeSearch', 'strict');
    search.searchParams.set('order', 'relevance');
    search.searchParams.set('maxResults', String(limit));
    search.searchParams.set('q', query);
    search.searchParams.set('key', apiKey);
    const response = await fetch(search, { headers: { Accept: 'application/json' } });
    if (!response.ok) return respond({ videos: [], message: `YouTube API indisponível (${response.status}).` }, 502);
    const payload = await response.json() as { items?: Array<Record<string, unknown>> };
    const videos = (payload.items || []).map((item) => {
      const id = clean((item.id as Record<string, unknown> | undefined)?.videoId, 40);
      const snippet = (item.snippet || {}) as Record<string, unknown>;
      const thumbnails = (snippet.thumbnails || {}) as Record<string, Record<string, unknown>>;
      return {
        id,
        title: clean(snippet.title, 180),
        channel: clean(snippet.channelTitle, 100),
        url: id ? `https://www.youtube.com/watch?v=${id}` : '',
        publishedAt: clean(snippet.publishedAt, 40),
        thumbnail: clean(thumbnails.medium?.url || thumbnails.default?.url, 500),
        gamerTag
      };
    }).filter((item) => item.id && item.url);
    return respond({ videos, message: `${videos.length} vídeo(s) encontrado(s).` });
  } catch {
    return respond({ videos: [], message: 'Falha segura ao pesquisar vídeos.' }, 500);
  }
});
