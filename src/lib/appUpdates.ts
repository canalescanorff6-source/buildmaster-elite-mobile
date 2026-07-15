export const APP_RELEASE_VERSION = '26.73.0';
export const APP_NATIVE_VERSION = '26.73.0';
export const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILDMASTER_BUILD_ID || 'local-build';
export const DEFAULT_UPDATE_MANIFEST_URL = process.env.NEXT_PUBLIC_BUILDMASTER_UPDATE_MANIFEST_URL || '';

export type UpdateKind = 'apk' | 'ota' | 'hybrid';

export type AppUpdateManifest = {
  appId: 'com.buildmaster.elitetatico';
  version: string;
  buildId: string;
  publishedAt: string;
  channel: 'stable' | 'beta';
  updateType: UpdateKind;
  apkUrl?: string;
  otaUrl?: string;
  notes: string[];
  mandatory?: boolean;
  minNativeVersion?: string;
  checksum?: string;
};

export type UpdateCheckResult = {
  valid: boolean;
  available: boolean;
  reason: string;
  manifest: AppUpdateManifest | null;
};

function isSafeUpdateUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

function versionParts(value: string): number[] {
  return String(value || '0')
    .replace(/^v/i, '')
    .split(/[.-]/)
    .slice(0, 4)
    .map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0);
}

export function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  const size = Math.max(a.length, b.length, 3);
  for (let index = 0; index < size; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

export function validateUpdateManifest(input: unknown): AppUpdateManifest | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<AppUpdateManifest>;
  if (raw.appId !== 'com.buildmaster.elitetatico') return null;
  if (!raw.version || !raw.buildId || !raw.publishedAt || Number.isNaN(Date.parse(String(raw.publishedAt)))) return null;
  if (!['stable', 'beta'].includes(String(raw.channel))) return null;
  if (!['apk', 'ota', 'hybrid'].includes(String(raw.updateType))) return null;
  if ((raw.updateType === 'apk' || raw.updateType === 'hybrid') && !isSafeUpdateUrl(raw.apkUrl)) return null;
  if (raw.updateType === 'ota' && !isSafeUpdateUrl(raw.otaUrl)) return null;
  if (raw.updateType === 'hybrid' && raw.otaUrl && !isSafeUpdateUrl(raw.otaUrl)) return null;
  return {
    appId: 'com.buildmaster.elitetatico',
    version: String(raw.version),
    buildId: String(raw.buildId),
    publishedAt: String(raw.publishedAt),
    channel: raw.channel as 'stable' | 'beta',
    updateType: raw.updateType as UpdateKind,
    apkUrl: raw.apkUrl ? String(raw.apkUrl) : undefined,
    otaUrl: raw.otaUrl ? String(raw.otaUrl) : undefined,
    notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 20) : [],
    mandatory: Boolean(raw.mandatory),
    minNativeVersion: raw.minNativeVersion ? String(raw.minNativeVersion) : undefined,
    checksum: raw.checksum ? String(raw.checksum) : undefined
  };
}

export function evaluateUpdateManifest(
  input: unknown,
  currentVersion = APP_RELEASE_VERSION,
  currentBuildId = CURRENT_BUILD_ID,
  ignoredBuildId = ''
): UpdateCheckResult {
  const manifest = validateUpdateManifest(input);
  if (!manifest) return { valid: false, available: false, reason: 'Manifesto de atualização inválido.', manifest: null };
  if (manifest.minNativeVersion && compareVersions(APP_NATIVE_VERSION, manifest.minNativeVersion) < 0) {
    return { valid: true, available: true, reason: 'Esta atualização exige um APK nativo mais novo.', manifest };
  }
  if (ignoredBuildId && manifest.buildId === ignoredBuildId && !manifest.mandatory) {
    return { valid: true, available: false, reason: 'Esta versão foi ignorada neste aparelho.', manifest };
  }
  if (compareVersions(manifest.version, currentVersion) > 0) {
    return { valid: true, available: true, reason: 'Uma versão mais nova está disponível.', manifest };
  }
  if (manifest.version === currentVersion && manifest.buildId !== currentBuildId) {
    return { valid: true, available: true, reason: 'Há uma revisão mais recente desta versão.', manifest };
  }
  return { valid: true, available: false, reason: 'O aplicativo já está atualizado.', manifest };
}
