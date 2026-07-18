import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  DEFAULT_UPDATE_MANIFEST_URL,
  DEFAULT_UPDATE_RELEASE_API_URL,
  isTrustedManifestUrl,
  isTrustedReleaseApiUrl,
  selectManifestAssetFromRelease,
  validateUpdateManifest,
  type AppUpdateManifest
} from '@/lib/appUpdates';

export type UpdateChannelSource = 'release-api' | 'legacy-manifest';

export type UpdateManifestFetchResult = {
  payload: unknown;
  manifest: AppUpdateManifest;
  source: UpdateChannelSource;
  endpoint: string;
  checkedAt: string;
  previousErrors: string[];
};

function parseJsonPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object') return payload;
  if (typeof payload !== 'string') throw new Error('O servidor não retornou dados JSON válidos.');
  const normalized = payload.replace(/^\uFEFF/, '').trim();
  if (!normalized) throw new Error('O servidor retornou uma resposta vazia.');
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    throw new Error('O servidor retornou um arquivo que não é um manifesto JSON válido.');
  }
}

function withCacheNonce(url: string, label: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${label}=${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchJsonUrl(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const target = withCacheNonce(url, 'buildmasterCache');
  const requestHeaders = {
    Accept: 'application/json, application/vnd.github+json, application/octet-stream;q=0.9',
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
    ...headers
  };

  if (Capacitor.isNativePlatform()) {
    try {
      const nativeHeaders = { ...requestHeaders, 'Accept-Encoding': 'identity' };
      const native = await CapacitorHttp.get({
        url: target,
        headers: nativeHeaders,
        connectTimeout: 30_000,
        readTimeout: 60_000,
        responseType: 'text'
      });
      if (native.status >= 200 && native.status < 300) return parseJsonPayload(native.data as unknown);
      throw new Error(`HTTP ${native.status} ao consultar o canal oficial.`);
    } catch (nativeError) {
      try {
        const response = await fetch(target, { cache: 'no-store', headers: requestHeaders, redirect: 'follow' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return parseJsonPayload(await response.text());
      } catch {
        throw nativeError;
      }
    }
  }

  const response = await fetch(target, { cache: 'no-store', headers: requestHeaders, redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status} ao consultar o canal oficial.`);
  return parseJsonPayload(await response.text());
}

/**
 * Consulta primeiro a release imutável marcada como Latest. Se a API estiver
 * indisponível, usa o manifesto fixo de compatibilidade das versões antigas.
 * O retorno já contém um manifesto validado e informa qual rota respondeu.
 */
export async function fetchUpdateManifest(): Promise<UpdateManifestFetchResult> {
  const errors: string[] = [];

  if (isTrustedReleaseApiUrl()) {
    try {
      const release = await fetchJsonUrl(DEFAULT_UPDATE_RELEASE_API_URL, {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      });
      const asset = selectManifestAssetFromRelease(release);
      if (!asset) throw new Error('A release mais recente não contém um manifesto oficial.');
      const payload = await fetchJsonUrl(asset.url);
      const manifest = validateUpdateManifest(payload);
      if (!manifest) throw new Error('O manifesto da release mais recente é inválido.');
      if (manifest.releaseTag && manifest.releaseTag !== asset.tag) {
        throw new Error('O manifesto não pertence à release indicada pelo GitHub.');
      }
      return {
        payload,
        manifest,
        source: 'release-api',
        endpoint: asset.url,
        checkedAt: new Date().toISOString(),
        previousErrors: errors
      };
    } catch (cause) {
      errors.push(cause instanceof Error ? cause.message : String(cause));
    }
  }

  if (isTrustedManifestUrl()) {
    try {
      const payload = await fetchJsonUrl(DEFAULT_UPDATE_MANIFEST_URL);
      const manifest = validateUpdateManifest(payload);
      if (!manifest) throw new Error('O manifesto de compatibilidade é inválido.');
      return {
        payload,
        manifest,
        source: 'legacy-manifest',
        endpoint: DEFAULT_UPDATE_MANIFEST_URL,
        checkedAt: new Date().toISOString(),
        previousErrors: errors
      };
    } catch (cause) {
      errors.push(cause instanceof Error ? cause.message : String(cause));
    }
  }

  throw new Error(errors.filter(Boolean).join(' | ') || 'Nenhum canal oficial de atualização está configurado neste APK.');
}
