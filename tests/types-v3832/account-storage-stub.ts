const memory = new Map<string, string>();
export function readAccountStorage(key: string): string | null { return memory.get(key) ?? null; }
export function writeAccountStorage(key: string, value: string): boolean { memory.set(key, value); return true; }
