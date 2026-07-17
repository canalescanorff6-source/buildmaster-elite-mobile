import { runtimeList, runtimePut, runtimeTrimStore, type RuntimeStoreName } from '@/lib/localDatabase';

type Identifiable = { id?: string; fingerprint?: string; saveKey?: string; updatedAt?: string; playedAt?: string };

function recordKey(value: Identifiable, index: number) {
  return String(value.id || value.fingerprint || value.saveKey || `${value.updatedAt || value.playedAt || Date.now()}-${index}`);
}

async function syncCollection(store: Extract<RuntimeStoreName, 'cards' | 'builds' | 'formations' | 'matches'>, items: unknown[], keep: number) {
  await Promise.all(items.slice(0, keep).map((item, index) => runtimePut(store, recordKey((item || {}) as Identifiable, index), item)));
  await runtimeTrimStore(store, keep).catch(() => undefined);
}

export async function syncStructuredRepository(input: {
  cards: unknown[];
  builds: unknown[];
  formations: unknown[];
  matches: unknown[];
}) {
  await Promise.all([
    syncCollection('cards', input.cards, 800),
    syncCollection('builds', input.builds, 500),
    syncCollection('formations', input.formations, 100),
    syncCollection('matches', input.matches, 1200)
  ]);
}

export async function listStructuredPage<T>(store: Extract<RuntimeStoreName, 'cards' | 'builds' | 'formations' | 'matches'>, page = 0, pageSize = 30) {
  const safeSize = Math.max(1, Math.min(100, pageSize));
  const all = await runtimeList<T>(store, (Math.max(0, page) + 1) * safeSize);
  return all.slice(Math.max(0, page) * safeSize, (Math.max(0, page) + 1) * safeSize).map((entry) => entry.value);
}
