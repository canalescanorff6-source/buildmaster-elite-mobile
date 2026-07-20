import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './safeLocalStorage';

export type NativeInstallInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  canInstallPackages: boolean;
  platform: 'android';
};

export type ApkDownloadProgress = {
  phase: 'connecting' | 'downloading' | 'downloading-system' | 'downloading-http' | 'verifying' | 'ready';
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
};

export type ApkInstallResult = {
  verified: boolean;
  checksum?: string;
  needsPermission?: boolean;
  versionCode?: number;
  versionName?: string;
  finalUrl?: string;
  responseHost?: string;
  contentType?: string;
  contentEncoding?: string;
  contentLength?: number;
  etag?: string;
  transport?: 'android-download-manager' | 'http-automatic-redirect' | 'http-manual-redirect' | string;
};

type SecureStoragePlugin = {
  set(options: { key: string; value: string }): Promise<void>;
  get(options: { key: string }): Promise<{ value: string | null }>;
  remove(options: { key: string }): Promise<void>;
  clear(): Promise<void>;
  getDeviceIdentity(): Promise<{ deviceId: string; publicKey: string; algorithm: string }>;
  signDeviceMessage(options: { message: string }): Promise<{ signature: string; algorithm: string }>;
  getAppInstallInfo(): Promise<NativeInstallInfo>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstallApk(options: {
    url: string;
    checksum: string;
    expectedPackageName: string;
    expectedVersionCode: number;
    expectedVersionName: string;
    expectedSizeBytes?: number;
    maxAttempts?: number;
  }): Promise<ApkInstallResult>;
  addListener(eventName: 'apkDownloadProgress', listener: (event: ApkDownloadProgress) => void): Promise<PluginListenerHandle>;
};

const BuildMasterSecurity = registerPlugin<SecureStoragePlugin>('BuildMasterSecurity');

function requireWebStorage() {
  if (typeof window === 'undefined') throw new Error('Armazenamento local indisponível.');
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await BuildMasterSecurity.set({ key, value });
    return;
  }
  requireWebStorage();
  if (!safeStorageSet(key, value)) throw new Error('Armazenamento local indisponível ou sem espaço.');
}

export async function secureGet(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await BuildMasterSecurity.get({ key });
    return result.value ?? null;
  }
  requireWebStorage();
  return safeStorageGet(key);
}

export async function secureRemove(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await BuildMasterSecurity.remove({ key });
    return;
  }
  safeStorageRemove(key);
}

export async function migrateLegacyValueToSecureStorage(key: string): Promise<string | null> {
  const secure = await secureGet(key);
  if (secure != null) return secure;
  if (typeof window === 'undefined') return null;
  const legacy = safeStorageGet(key);
  if (legacy == null) return null;
  await secureSet(key, legacy);
  safeStorageRemove(key);
  return legacy;
}

export async function getNativeDeviceIdentity(): Promise<{ deviceId: string; publicKey: string; algorithm: string } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return BuildMasterSecurity.getDeviceIdentity();
}

export async function signNativeDeviceMessage(message: string): Promise<{ signature: string; algorithm: string } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return BuildMasterSecurity.signDeviceMessage({ message });
}

export async function getNativeInstallInfo(): Promise<NativeInstallInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return BuildMasterSecurity.getAppInstallInfo();
}

export async function openInstallPermissionSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) throw new Error('A permissão de instalação existe somente no Android.');
  await BuildMasterSecurity.openInstallPermissionSettings();
}

export async function onApkDownloadProgress(listener: (event: ApkDownloadProgress) => void): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return BuildMasterSecurity.addListener('apkDownloadProgress', listener);
}

export async function downloadVerifyAndInstallApk(options: {
  url: string;
  checksum: string;
  expectedPackageName: string;
  expectedVersionCode: number;
  expectedVersionName: string;
  expectedSizeBytes?: number;
  maxAttempts?: number;
}): Promise<ApkInstallResult> {
  if (!Capacitor.isNativePlatform()) throw new Error('A instalação verificada está disponível somente no APK Android.');
  return BuildMasterSecurity.downloadAndInstallApk(options);
}
