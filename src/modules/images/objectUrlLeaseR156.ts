export const OBJECT_URL_LEASE_R156_VERSION = '40.80-r156-object-url-lease-v1' as const;

export type ObjectUrlRuntimeR156 = {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
};

export type ObjectUrlLeaseR156 = {
  replace(blob: Blob): string;
  release(): void;
  current(): string | null;
};

function runtimeUrlR156(): ObjectUrlRuntimeR156 {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof URL.revokeObjectURL !== 'function') {
    throw new Error('Object URL não está disponível neste ambiente.');
  }
  return URL;
}

export function createObjectUrlLeaseR156(runtime?: ObjectUrlRuntimeR156): ObjectUrlLeaseR156 {
  let active: string | null = null;
  const port = runtime ?? runtimeUrlR156();
  return {
    replace(blob) {
      if (active) port.revokeObjectURL(active);
      active = port.createObjectURL(blob);
      return active;
    },
    release() {
      if (!active) return;
      const url = active;
      active = null;
      port.revokeObjectURL(url);
    },
    current() {
      return active;
    }
  };
}
