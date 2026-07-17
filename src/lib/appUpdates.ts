export const APP_RELEASE_VERSION = process.env.NEXT_PUBLIC_BUILDMASTER_VERSION || '27.10.0';
export const APP_NATIVE_VERSION = process.env.NEXT_PUBLIC_BUILDMASTER_NATIVE_VERSION || '27.10.0';
export const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILDMASTER_BUILD_ID || 'local-build';
export const DEFAULT_UPDATE_MANIFEST_URL = process.env.NEXT_PUBLIC_BUILDMASTER_UPDATE_MANIFEST_URL || 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json';

export type AppUpdateManifest = {
  appId: 'com.buildmaster.elitetatico';
  version: string;
  versionCode: number;
  buildId: string;
  publishedAt: string;
  channel: 'stable' | 'beta';
  updateType: 'apk';
  apkUrl: string;
  notes: string[];
  mandatory?: boolean;
  minNativeVersion?: string;
  checksum: string;
  sizeBytes?: number;
};

export type InstalledAppInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  canInstallPackages: boolean;
  platform: 'android' | 'web';
};

export type UpdateCheckResult = {
  valid: boolean;
  available: boolean;
  mandatory: boolean;
  reason: string;
  manifest: AppUpdateManifest | null;
};

function trustedRepositoryFromManifestUrl(): string | null {
  try {
    const url = new URL(DEFAULT_UPDATE_MANIFEST_URL);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`.toLowerCase();
  } catch {
    return null;
  }
}

export function isTrustedManifestUrl(value = DEFAULT_UPDATE_MANIFEST_URL): boolean {
  try {
    const url = new URL(value);
    const repository = trustedRepositoryFromManifestUrl();
    if (!repository || url.protocol !== 'https:' || url.hostname !== 'github.com') return false;
    return url.pathname.toLowerCase() === `/${repository}/releases/download/buildmaster-latest/update-manifest.json`;
  } catch {
    return false;
  }
}

export function isTrustedApkUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    const repository = trustedRepositoryFromManifestUrl();
    if (!repository || url.protocol !== 'https:' || url.hostname !== 'github.com') return false;
    const expectedPrefix = `/${repository}/releases/download/buildmaster-latest/`;
    if (!url.pathname.toLowerCase().startsWith(expectedPrefix)) return false;
    const fileName = decodeURIComponent(url.pathname.slice(expectedPrefix.length));
    return /^BuildMaster-Elite-Tatico-v\d+\.\d+\.\d+-\d+-[a-f0-9]{7,12}\.apk$/i.test(fileName)
      || fileName === 'BuildMaster-Elite-Tatico-latest.apk';
  } catch {
    return false;
  }
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim());
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function versionParts(value: string): number[] {
  return String(value || '0').replace(/^v/i, '').split(/[.-]/).slice(0, 4).map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0);
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
  if (!input || typeof input !== 'object' || !isTrustedManifestUrl()) return null;
  const raw = input as Partial<AppUpdateManifest>;
  if (raw.appId !== 'com.buildmaster.elitetatico') return null;
  if (!raw.version || !isPositiveInteger(raw.versionCode) || !raw.buildId || !raw.publishedAt || Number.isNaN(Date.parse(String(raw.publishedAt)))) return null;
  if (!['stable', 'beta'].includes(String(raw.channel))) return null;
  if (raw.updateType !== 'apk') return null;
  if (!isTrustedApkUrl(raw.apkUrl) || !isSha256(raw.checksum)) return null;
  if (raw.sizeBytes !== undefined && (!isPositiveInteger(raw.sizeBytes) || raw.sizeBytes > 300 * 1024 * 1024)) return null;
  return {
    appId: 'com.buildmaster.elitetatico',
    version: String(raw.version),
    versionCode: raw.versionCode,
    buildId: String(raw.buildId),
    publishedAt: String(raw.publishedAt),
    channel: raw.channel as 'stable' | 'beta',
    updateType: 'apk',
    apkUrl: String(raw.apkUrl),
    notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 20) : [],
    mandatory: Boolean(raw.mandatory),
    minNativeVersion: raw.minNativeVersion ? String(raw.minNativeVersion) : undefined,
    checksum: String(raw.checksum).toLowerCase(),
    sizeBytes: raw.sizeBytes
  };
}

export function evaluateUpdateManifest(
  input: unknown,
  installed: Partial<InstalledAppInfo> = { versionName: APP_RELEASE_VERSION, versionCode: 0 },
  currentBuildId = CURRENT_BUILD_ID,
  ignoredBuildId = ''
): UpdateCheckResult {
  const manifest = validateUpdateManifest(input);
  if (!manifest) return { valid: false, available: false, mandatory: false, reason: 'Manifesto inválido, origem não confiável ou dados de integridade ausentes.', manifest: null };
  if (manifest.minNativeVersion && compareVersions(APP_NATIVE_VERSION, manifest.minNativeVersion) < 0) {
    return { valid: true, available: true, mandatory: true, reason: 'Esta atualização contém uma base Android obrigatória.', manifest };
  }

  const installedCode = Number(installed.versionCode || 0);
  const installedVersion = String(installed.versionName || APP_RELEASE_VERSION);
  const newerByCode = installedCode > 0 && manifest.versionCode > installedCode;
  const newerByVersion = compareVersions(manifest.version, installedVersion) > 0;
  const sameInstalledBuild = manifest.versionCode === installedCode && manifest.buildId === currentBuildId;

  if (ignoredBuildId && manifest.buildId === ignoredBuildId && !manifest.mandatory) {
    return { valid: true, available: false, mandatory: false, reason: 'Esta revisão foi ignorada neste aparelho.', manifest };
  }
  if (newerByCode || (installedCode <= 0 && newerByVersion)) {
    return { valid: true, available: true, mandatory: Boolean(manifest.mandatory), reason: 'Uma versão mais nova está disponível.', manifest };
  }
  if (manifest.versionCode < installedCode || compareVersions(manifest.version, installedVersion) < 0) {
    return { valid: true, available: false, mandatory: false, reason: 'O aplicativo instalado é mais novo que o canal publicado.', manifest };
  }
  if (sameInstalledBuild || (manifest.versionCode === installedCode && compareVersions(manifest.version, installedVersion) === 0)) {
    return { valid: true, available: false, mandatory: false, reason: 'O aplicativo já está atualizado.', manifest };
  }
  return { valid: true, available: false, mandatory: false, reason: 'O canal não contém um pacote instalável mais novo.', manifest };
}
