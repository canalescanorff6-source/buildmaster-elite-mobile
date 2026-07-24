import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  DEFAULT_UPDATE_PRIMARY_URL,
  DEFAULT_UPDATE_BETA_URL,
  DEFAULT_UPDATE_MANIFEST_URL,
  DEFAULT_UPDATE_RELEASE_API_URL,
  compareVersions,
  isTrustedManifestUrl,
  isTrustedReleaseApiUrl,
  selectManifestAssetFromRelease,
  validateUpdateManifest,
  type AppUpdateManifest
} from '@/lib/appUpdates';

export type UpdateChannelSource = 'primary-channel' | 'beta-channel' | 'legacy-manifest' | 'release-api';

export type UpdateManifestCandidate = {
  payload: unknown;
  manifest: AppUpdateManifest;
  source: UpdateChannelSource;
  endpoint: string;
};

export type UpdateManifestFetchResult = UpdateManifestCandidate & {
  checkedAt: string;
  previousErrors: string[];
  candidates: Array<{
    source: UpdateChannelSource;
    endpoint: string;
    version: string;
    versionCode: number;
    apkUrl: string;
    channel: 'stable' | 'beta';
  }>;
  alternatives: UpdateManifestCandidate[];
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
        connectTimeout: 25_000,
        readTimeout: 45_000,
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

function sourcePriority(source: UpdateChannelSource): number {
  if (source === 'beta-channel') return 4;
  if (source === 'primary-channel') return 3;
  if (source === 'release-api') return 2;
  return 1;
}

/**
 * Seleciona a publicação mais nova entre todas as rotas válidas. Uma rota que
 * responda com um manifesto antigo não pode esconder uma versão mais nova
 * publicada em outra rota.
 */
export function chooseBestUpdateCandidate(candidates: UpdateManifestCandidate[]): UpdateManifestCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((left, right) => {
    const codeDelta = right.manifest.versionCode - left.manifest.versionCode;
    if (codeDelta !== 0) return codeDelta;
    const versionDelta = compareVersions(right.manifest.version, left.manifest.version);
    if (versionDelta !== 0) return versionDelta;
    const dateDelta = Date.parse(right.manifest.publishedAt) - Date.parse(left.manifest.publishedAt);
    if (dateDelta !== 0) return dateDelta;
    return sourcePriority(right.source) - sourcePriority(left.source);
  })[0] ?? null;
}

async function loadDirectManifest(source: 'primary-channel' | 'beta-channel' | 'legacy-manifest', endpoint: string): Promise<UpdateManifestCandidate> {
  const payload = await fetchJsonUrl(endpoint);
  const manifest = validateUpdateManifest(payload);
  if (!manifest) throw new Error(source === 'primary-channel'
    ? 'O manifesto do canal principal é inválido.'
    : source === 'beta-channel'
      ? 'O manifesto do canal de testes é inválido.'
      : 'O manifesto de compatibilidade é inválido.');
  return { payload, manifest, source, endpoint };
}

async function loadLatestReleaseManifest(): Promise<UpdateManifestCandidate> {
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
  return { payload, manifest, source: 'release-api', endpoint: asset.url };
}

/**
 * Consulta três rotas independentes e escolhe a publicação com maior
 * versionCode. A rota principal usa raw.githubusercontent.com; a release fixa
 * mantém compatibilidade com APKs antigos; a API Latest é a terceira defesa.
 */
export async function fetchUpdateManifest(preferredChannel: 'stable' | 'beta' = 'stable'): Promise<UpdateManifestFetchResult> {
  const jobs: Array<Promise<{ candidate?: UpdateManifestCandidate; error?: string }>> = [];

  if (isTrustedManifestUrl(DEFAULT_UPDATE_PRIMARY_URL)) {
    jobs.push(loadDirectManifest('primary-channel', DEFAULT_UPDATE_PRIMARY_URL)
      .then((candidate) => ({ candidate }))
      .catch((cause) => ({ error: `Canal principal: ${cause instanceof Error ? cause.message : String(cause)}` })));
  }

  if (preferredChannel === 'beta' && isTrustedManifestUrl(DEFAULT_UPDATE_BETA_URL)) {
    jobs.push(loadDirectManifest('beta-channel', DEFAULT_UPDATE_BETA_URL)
      .then((candidate) => ({ candidate }))
      .catch((cause) => ({ error: `Canal de testes: ${cause instanceof Error ? cause.message : String(cause)}` })));
  }

  if (isTrustedManifestUrl(DEFAULT_UPDATE_MANIFEST_URL)) {
    jobs.push(loadDirectManifest('legacy-manifest', DEFAULT_UPDATE_MANIFEST_URL)
      .then((candidate) => ({ candidate }))
      .catch((cause) => ({ error: `Ponte de compatibilidade: ${cause instanceof Error ? cause.message : String(cause)}` })));
  }

  if (isTrustedReleaseApiUrl()) {
    jobs.push(loadLatestReleaseManifest()
      .then((candidate) => ({ candidate }))
      .catch((cause) => ({ error: `Release de reserva: ${cause instanceof Error ? cause.message : String(cause)}` })));
  }

  if (!jobs.length) throw new Error('Nenhum canal oficial de atualização está configurado neste APK.');

  const settled = await Promise.all(jobs);
  const allCandidates = settled.flatMap((item) => item.candidate ? [item.candidate] : []);
  const candidates = allCandidates.filter((candidate) => preferredChannel === 'beta' || candidate.manifest.channel === 'stable');
  const errors = settled.flatMap((item) => item.error ? [item.error] : []);
  const selected = chooseBestUpdateCandidate(candidates);
  if (!selected) throw new Error(errors.filter(Boolean).join(' | ') || 'Nenhuma rota oficial retornou um manifesto válido.');

  const staleRoutes = candidates
    .filter((candidate) => candidate !== selected && candidate.manifest.versionCode < selected.manifest.versionCode)
    .map((candidate) => `${candidate.source} respondeu code ${candidate.manifest.versionCode} e foi ignorada por estar atrás do code ${selected.manifest.versionCode}.`);

  const ordered = [...candidates].sort((left, right) => {
    const codeDelta = right.manifest.versionCode - left.manifest.versionCode;
    if (codeDelta !== 0) return codeDelta;
    const versionDelta = compareVersions(right.manifest.version, left.manifest.version);
    if (versionDelta !== 0) return versionDelta;
    return sourcePriority(right.source) - sourcePriority(left.source);
  });
  // Cada manifesto pode publicar espelhos oficiais do mesmo APK. Eles são
  // transformados em rotas reais para que uma URL/CDN com comportamento ruim
  // não seja repetida como se fosse uma alternativa diferente.
  const expandedAlternatives = ordered.flatMap((candidate) => {
    const mirrors = candidate.manifest.mirrors ?? [];
    return [candidate, ...mirrors.map((apkUrl) => ({
      ...candidate,
      endpoint: `${candidate.endpoint}#mirror`,
      manifest: {
        ...candidate.manifest,
        apkUrl,
        releaseTag: undefined,
        assetName: apkUrl.split('/').pop()?.split('?')[0] || 'APK espelho'
      }
    }))];
  });
  const uniqueAlternatives = expandedAlternatives.filter((candidate, index, all) =>
    all.findIndex((other) => other.manifest.apkUrl === candidate.manifest.apkUrl
      && other.manifest.checksum === candidate.manifest.checksum
      && other.manifest.versionCode === candidate.manifest.versionCode) === index);

  return {
    ...selected,
    checkedAt: new Date().toISOString(),
    previousErrors: [...errors, ...staleRoutes],
    candidates: candidates.map((candidate) => ({
      source: candidate.source,
      endpoint: candidate.endpoint,
      version: candidate.manifest.version,
      versionCode: candidate.manifest.versionCode,
      apkUrl: candidate.manifest.apkUrl,
      channel: candidate.manifest.channel
    })),
    alternatives: uniqueAlternatives
  };
}
