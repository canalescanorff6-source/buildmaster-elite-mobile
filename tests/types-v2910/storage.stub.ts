export function safeStorageGet(key: string): string | null { void key; return null; }
export function safeStorageSet(key: string, value: string): void { void key; void value; }
