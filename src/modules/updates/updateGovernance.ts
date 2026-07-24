import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  DEFAULT_UPDATE_PRIMARY_URL,
  DEFAULT_UPDATE_BETA_URL,
  type AppUpdateManifest,
  type UpdateEvaluationOptions,
  updateAudienceBucket
} from '@/lib/appUpdates';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import { createStableId } from '@/lib/stableId';
import type { UpdateManifestFetchResult } from '@/lib/updateChannel';

export type UpdateChannelPreference = 'stable' | 'beta';

export type ReleaseHistoryEntry = {
  version: string;
  versionCode: number;
  buildId: string;
  channel: UpdateChannelPreference;
  rolloutPercentage: number;
  status: 'testing' | 'published' | 'paused' | 'rolled_back' | 'failed';
  publishedAt: string;
  releaseTag: string;
  checksum: string;
  notes: string[];
};

export type UpdateHealthReport = {
  score: number;
  status: 'saudável' | 'atenção' | 'crítico';
  checks: Array<{ id: string; label: string; ok: boolean; detail: string }>;
};

const CHANNEL_KEY = 'buildmaster_update_preferred_channel_v2910';
const AUDIENCE_KEY = 'buildmaster_update_audience_key_v2910';
function historyUrl(channel: UpdateChannelPreference) {
  const manifestUrl = channel === 'beta' ? DEFAULT_UPDATE_BETA_URL : DEFAULT_UPDATE_PRIMARY_URL;
  return manifestUrl.replace(/update-manifest\.json(?:\?.*)?$/i, 'release-history.json');
}

export function readUpdateChannelPreference(): UpdateChannelPreference {
  return safeStorageGet(CHANNEL_KEY) === 'beta' ? 'beta' : 'stable';
}

export function writeUpdateChannelPreference(channel: UpdateChannelPreference) {
  safeStorageSet(CHANNEL_KEY, channel);
}

export function getUpdateAudienceKey(): string {
  const existing = safeStorageGet(AUDIENCE_KEY);
  if (existing && existing.length >= 12) return existing;
  const created = createStableId('update-audience');
  safeStorageSet(AUDIENCE_KEY, created);
  return created;
}

export function getUpdateEvaluationOptions(channel = readUpdateChannelPreference()): UpdateEvaluationOptions {
  return { preferredChannel: channel, audienceKey: getUpdateAudienceKey() };
}

export function audienceBucketForManifest(manifest: AppUpdateManifest): number {
  return updateAudienceBucket(getUpdateAudienceKey(), manifest.rolloutSalt || manifest.buildId);
}

function parseHistory(input: unknown): ReleaseHistoryEntry[] {
  const rows = Array.isArray(input) ? input : input && typeof input === 'object' && Array.isArray((input as { releases?: unknown[] }).releases) ? (input as { releases: unknown[] }).releases : [];
  return rows.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const row = entry as Partial<ReleaseHistoryEntry>;
    if (!row.version || !Number.isSafeInteger(row.versionCode) || Number(row.versionCode) <= 0 || !row.buildId || !row.publishedAt || Number.isNaN(Date.parse(String(row.publishedAt)))) return [];
    if (!['stable', 'beta'].includes(String(row.channel))) return [];
    const status = ['testing', 'published', 'paused', 'rolled_back', 'failed'].includes(String(row.status)) ? row.status as ReleaseHistoryEntry['status'] : 'published';
    return [{
      version: String(row.version),
      versionCode: Number(row.versionCode),
      buildId: String(row.buildId),
      channel: row.channel as UpdateChannelPreference,
      rolloutPercentage: Math.max(1, Math.min(100, Number(row.rolloutPercentage || 100))),
      status,
      publishedAt: String(row.publishedAt),
      releaseTag: String(row.releaseTag || ''),
      checksum: /^[a-f0-9]{64}$/i.test(String(row.checksum || '')) ? String(row.checksum).toLowerCase() : '',
      notes: Array.isArray(row.notes) ? row.notes.map(String).slice(0, 12) : []
    }];
  }).sort((left, right) => right.versionCode - left.versionCode).slice(0, 30);
}

async function fetchText(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  const target = `${url}${separator}history=${Date.now()}`;
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url: target, headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, responseType: 'text', connectTimeout: 20_000, readTimeout: 30_000 });
    if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  }
  const response = await fetch(target, { cache: 'no-store', headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function fetchReleaseHistory(channel: UpdateChannelPreference = 'stable'): Promise<ReleaseHistoryEntry[]> {
  try {
    const raw = await fetchText(historyUrl(channel));
    return parseHistory(JSON.parse(raw.replace(/^\uFEFF/, '').trim()) as unknown);
  } catch {
    return [];
  }
}

export function buildUpdateHealthReport(result: UpdateManifestFetchResult | null, history: ReleaseHistoryEntry[]): UpdateHealthReport {
  const manifest = result?.manifest;
  const checks = [
    { id: 'manifest', label: 'Manifesto válido', ok: Boolean(manifest), detail: manifest ? `v${manifest.version} • code ${manifest.versionCode}` : 'Nenhum manifesto válido foi retornado.' },
    { id: 'routes', label: 'Rotas redundantes', ok: (result?.alternatives.length || 0) >= 2, detail: `${result?.alternatives.length || 0} rota(s) instalável(is) reconhecida(s).` },
    { id: 'checksum', label: 'SHA-256 publicado', ok: Boolean(manifest?.checksum && /^[a-f0-9]{64}$/i.test(manifest.checksum)), detail: manifest?.checksum ? manifest.checksum.slice(0, 16) + '…' : 'Checksum ausente.' },
    { id: 'size', label: 'Tamanho conhecido', ok: Boolean(manifest?.sizeBytes && manifest.sizeBytes > 1024 * 1024), detail: manifest?.sizeBytes ? `${(manifest.sizeBytes / 1024 / 1024).toFixed(1)} MB` : 'Será confirmado apenas após o download.' },
    { id: 'rollout', label: 'Rollout configurado', ok: Boolean(manifest && (manifest.rolloutPercentage || 100) >= 1), detail: `${manifest?.rolloutPercentage || 100}% • ${manifest?.paused ? 'pausado' : 'ativo'}` },
    { id: 'history', label: 'Histórico publicado', ok: history.length > 0, detail: history.length ? `${history.length} versão(ões) registrada(s).` : 'O arquivo release-history.json ainda não foi publicado.' },
    { id: 'errors', label: 'Rotas sem erro crítico', ok: !(result?.previousErrors || []).some((item) => /sha|integridade|inválid|diferente/i.test(item)), detail: result?.previousErrors.length ? `${result.previousErrors.length} aviso(s) de rota.` : 'Nenhum aviso retornado.' }
  ];
  const score = Math.round(checks.reduce((sum, check) => sum + (check.ok ? 100 : 0), 0) / checks.length);
  return { score, status: score >= 85 ? 'saudável' : score >= 60 ? 'atenção' : 'crítico', checks };
}

export function rollbackCandidate(history: ReleaseHistoryEntry[], currentVersionCode: number, channel: UpdateChannelPreference = 'stable'): ReleaseHistoryEntry | null {
  return history.find((entry) => entry.status === 'published' && entry.channel === channel && entry.versionCode < currentVersionCode) || null;
}
