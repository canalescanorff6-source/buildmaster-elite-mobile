import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CloudFichaPayload = Record<string, unknown> & {
  id?: string;
  saveKey?: string;
  updatedAt?: string;
  result?: {
    parsed?: {
      playerName?: string;
    };
  };
};

type NeonSql = ReturnType<typeof neon>;

const CLOUD_LIMIT = 200;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function getOwnerKey() {
  return process.env.BUILDMASTER_CLOUD_OWNER || 'buildmaster-main';
}

function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('Neon não configurado. Adicione DATABASE_URL nas variáveis de ambiente do Vercel.');
  }
  return neon(databaseUrl);
}

async function ensureSchema(sql: NeonSql) {
  await sql`
    CREATE TABLE IF NOT EXISTS buildmaster_fichas (
      owner_key TEXT NOT NULL,
      save_key TEXT NOT NULL,
      ficha_id TEXT NOT NULL,
      player_name TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (owner_key, save_key)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS buildmaster_fichas_owner_updated_idx
    ON buildmaster_fichas (owner_key, updated_at DESC)
  `;
}

function normalizeCloudItem(item: unknown, index: number): CloudFichaPayload | null {
  if (!item || typeof item !== 'object') return null;
  const payload = item as CloudFichaPayload;
  const playerName = payload.result?.parsed?.playerName;
  if (!playerName || typeof playerName !== 'string') return null;

  const saveKey = typeof payload.saveKey === 'string' && payload.saveKey.trim()
    ? payload.saveKey.trim()
    : `ficha-${Date.now()}-${index}`;
  const id = typeof payload.id === 'string' && payload.id.trim()
    ? payload.id.trim()
    : saveKey;

  return { ...payload, id, saveKey };
}

function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : 'Falha inesperada no Cofre Neon.';
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET() {
  try {
    const sql = getSql();
    const ownerKey = getOwnerKey();
    await ensureSchema(sql);

    const rows = await sql`
      SELECT payload
      FROM buildmaster_fichas
      WHERE owner_key = ${ownerKey}
      ORDER BY updated_at DESC
      LIMIT ${CLOUD_LIMIT}
    `;

    return NextResponse.json({ ok: true, items: rows.map((row) => row.payload) });
  } catch (error) {
    return errorResponse(error, 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as { items?: unknown[] } | null;
    const entries = Array.isArray(body?.items) ? body.items : [];
    const items = entries
      .slice(0, CLOUD_LIMIT)
      .map((entry, index) => normalizeCloudItem(entry, index))
      .filter((entry): entry is CloudFichaPayload => Boolean(entry));

    if (!items.length) {
      return NextResponse.json({ ok: true, count: 0, message: 'Nenhuma ficha válida enviada para o Neon.' });
    }

    const sql = getSql();
    const ownerKey = getOwnerKey();
    await ensureSchema(sql);

    for (const item of items) {
      const saveKey = String(item.saveKey);
      const fichaId = String(item.id ?? saveKey);
      const playerName = item.result?.parsed?.playerName ? String(item.result.parsed.playerName) : null;
      const payload = JSON.stringify(item);

      await sql`
        INSERT INTO buildmaster_fichas (owner_key, save_key, ficha_id, player_name, payload, updated_at)
        VALUES (${ownerKey}, ${saveKey}, ${fichaId}, ${playerName}, ${payload}::jsonb, NOW())
        ON CONFLICT (owner_key, save_key)
        DO UPDATE SET
          ficha_id = EXCLUDED.ficha_id,
          player_name = EXCLUDED.player_name,
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `;
    }

    return NextResponse.json({ ok: true, count: items.length });
  } catch (error) {
    return errorResponse(error, 503);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')?.trim();
    if (!id) return NextResponse.json({ ok: false, message: 'Informe a ficha para apagar.' }, { status: 400 });

    const sql = getSql();
    const ownerKey = getOwnerKey();
    await ensureSchema(sql);

    await sql`
      DELETE FROM buildmaster_fichas
      WHERE owner_key = ${ownerKey}
      AND (save_key = ${id} OR ficha_id = ${id})
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 503);
  }
}
