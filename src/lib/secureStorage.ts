import { Capacitor, registerPlugin } from '@capacitor/core';

type SecureStoragePlugin = {
  set(options: { key: string; value: string }): Promise<void>;
  get(options: { key: string }): Promise<{ value: string | null }>;
  remove(options: { key: string }): Promise<void>;
  clear(): Promise<void>;
  getDeviceIdentity(): Promise<{ deviceId: string; publicKey: string; algorithm: string }>;
  signDeviceMessage(options: { message: string }): Promise<{ signature: string; algorithm: string }>;
  downloadAndInstallApk(options: { url: string; checksum: string }): Promise<{ verified: boolean; checksum: string }>;
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

export async function downloadVerifyAndInstallApk(url: string, checksum: string): Promise<{ verified: boolean; checksum: string }> {
  if (!Capacitor.isNativePlatform()) throw new Error('A instalação verificada está disponível somente no APK Android.');
  return BuildMasterSecurity.downloadAndInstallApk({ url, checksum });
}
