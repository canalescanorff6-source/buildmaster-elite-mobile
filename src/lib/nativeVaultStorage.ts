import { Capacitor, registerPlugin } from '@capacitor/core';

export type NativeVaultStorageInfo = {
  available: boolean;
  usedBytes: number;
  freeBytes: number;
  path: string;
};

type NativeVaultStoragePlugin = {
  write(options: { key: string; value: string }): Promise<{ bytes: number }>;
  read(options: { key: string }): Promise<{ value: string | null; bytes: number }>;
  remove(options: { key: string }): Promise<void>;
  info(options: { key?: string }): Promise<NativeVaultStorageInfo>;
};

const NativeVaultStorage = registerPlugin<NativeVaultStoragePlugin>('BuildMasterVaultStorage');

export function isNativeVaultStorageAvailable(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export async function nativeVaultWrite(key: string, value: string): Promise<{ bytes: number }> {
  if (!isNativeVaultStorageAvailable()) throw new Error('Armazenamento interno nativo indisponível fora do APK.');
  return NativeVaultStorage.write({ key, value });
}

export async function nativeVaultRead(key: string): Promise<string | null> {
  if (!isNativeVaultStorageAvailable()) return null;
  const result = await NativeVaultStorage.read({ key });
  return result.value ?? null;
}

export async function nativeVaultRemove(key: string): Promise<void> {
  if (!isNativeVaultStorageAvailable()) return;
  await NativeVaultStorage.remove({ key });
}

export async function nativeVaultInfo(key?: string): Promise<NativeVaultStorageInfo | null> {
  if (!isNativeVaultStorageAvailable()) return null;
  return NativeVaultStorage.info(key ? { key } : {});
}
