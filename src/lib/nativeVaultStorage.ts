export type NativeVaultStorageInfo = {
  available: boolean;
  usedBytes: number;
  freeBytes: number;
  path: string;
};

type NativeVaultStoragePlugin = {
  write(options: { key: string; value: string }): Promise<{ bytes: number }>;
  read(options: { key: string; maxBytes?: number }): Promise<{ value: string | null; bytes: number }>;
  remove(options: { key: string }): Promise<void>;
  info(options: { key?: string }): Promise<NativeVaultStorageInfo>;
};

type CapacitorRuntime = {
  isNativePlatform?: () => boolean;
  registerPlugin?: <T>(name: string) => T;
  Plugins?: Record<string, unknown>;
};

type NativeWindow = Window & { Capacitor?: CapacitorRuntime };

let cachedPlugin: NativeVaultStoragePlugin | null = null;

function capacitorRuntime(): CapacitorRuntime | null {
  if (typeof window === 'undefined') return null;
  return (window as NativeWindow).Capacitor ?? null;
}

function nativeVaultPlugin(): NativeVaultStoragePlugin {
  if (cachedPlugin) return cachedPlugin;
  const runtime = capacitorRuntime();
  const exposed = runtime?.Plugins?.BuildMasterVaultStorage as NativeVaultStoragePlugin | undefined;
  const registered = exposed ?? runtime?.registerPlugin?.<NativeVaultStoragePlugin>('BuildMasterVaultStorage');
  if (!registered) throw new Error('Plugin de armazenamento interno não foi registrado neste APK.');
  cachedPlugin = registered;
  return registered;
}

// Contrato legado equivalente a Capacitor.isNativePlatform, sem importar o pacote no boot.
export function isNativeVaultStorageAvailable(): boolean {
  const runtime = capacitorRuntime();
  if (!runtime) return false;
  try {
    return Boolean(runtime.isNativePlatform?.())
      || window.location.protocol === 'capacitor:'
      || window.location.protocol === 'file:';
  } catch {
    return false;
  }
}

export async function nativeVaultWrite(key: string, value: string): Promise<{ bytes: number }> {
  if (!isNativeVaultStorageAvailable()) throw new Error('Armazenamento interno nativo indisponível fora do APK.');
  return nativeVaultPlugin().write({ key, value });
}

export async function nativeVaultRead(key: string, maxBytes?: number): Promise<string | null> {
  if (!isNativeVaultStorageAvailable()) return null;
  const plugin = nativeVaultPlugin();
  const result = await plugin.read(maxBytes ? { key, maxBytes } : { key });
  return result.value ?? null;
}

export async function nativeVaultRemove(key: string): Promise<void> {
  if (!isNativeVaultStorageAvailable()) return;
  await nativeVaultPlugin().remove({ key });
}

export async function nativeVaultInfo(key?: string): Promise<NativeVaultStorageInfo | null> {
  if (!isNativeVaultStorageAvailable()) return null;
  return nativeVaultPlugin().info(key ? { key } : {});
}
