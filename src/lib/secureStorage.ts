import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type NativeInstallInfo = {
  packageName: string;
  versionName: string;
  versionCode: number;
  canInstallPackages: boolean;
  platform: 'android';
};

export type ApkDownloadProgress = {
  phase: 'connecting' | 'downloading' | 'verifying' | 'ready';
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
};

type ApkInstallResult = {
  verified: boolean;
  checksum?: string;
  needsPermission?: boolean;
  versionCode?: number;
  versionName?: string;
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
  }): Promise<ApkInstallResult>;
  addListener(eventName: 'apkDownloadProgress', listener: (event: ApkDownloadProgress) => void): Promise<PluginListenerHandle>;
};

const BuildMasterSecurity = registerPlugin<SecureStoragePlugin>('BuildMasterSecurity');

function webStorageAvailable() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function requireWebStorage() {
  if (!webStorageAvailable()) throw new Error('Armazenamento local indisponível.');
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await BuildMasterSecurity.set({ key, value });
    return;
  }
  requireWebStorage();
  localStorage.setItem(key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await BuildMasterSecurity.get({ key });
    return result.value ?? null;
  }
  requireWebStorage();
  return localStorage.getItem(key);
}

export async function secureRemove(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await BuildMasterSecurity.remove({ key });
    return;
  }
  if (webStorageAvailable()) localStorage.removeItem(key);
}

export async function migrateLegacyValueToSecureStorage(key: string): Promise<string | null> {
  const secure = await secureGet(key);
  if (secure != null) return secure;
  if (!webStorageAvailable()) return null;
  const legacy = localStorage.getItem(key);
  if (legacy == null) return null;
  await secureSet(key, legacy);
  localStorage.removeItem(key);
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
}): Promise<ApkInstallResult> {
  if (!Capacitor.isNativePlatform()) throw new Error('A instalação verificada está disponível somente no APK Android.');
  return BuildMasterSecurity.downloadAndInstallApk(options);
}
