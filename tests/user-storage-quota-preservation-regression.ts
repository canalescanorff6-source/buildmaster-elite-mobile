import assert from 'node:assert/strict';
import { safeStorageSet } from '../src/lib/safeLocalStorage';

// A preference write must never evict saved cards or other irreplaceable history.
const preservedEntries: Array<[string, string]> = [
  ['buildmaster_history_v24_6_cofre_persistente', '["current legacy vault"]'],
  ['buildmaster_history_v24_5_fichario_elite', '["older vault awaiting migration"]'],
  ['buildmaster_account_first__buildmaster_history_v24_6_cofre_persistente', '["first account vault"]'],
  ['buildmaster_account_second__buildmaster_history_v24_6_cofre_persistente', '["second account vault"]'],
  ['buildmaster_account_first__buildmaster_ocr_scan_history_v27', '["original scan history"]'],
  ['buildmaster_account_first__buildmaster_full_backup_snapshots_v2900', '["restore point"]'],
  ['buildmaster_account_first__buildmaster_update_audit_v2', '["installed update history"]'],
  ['buildmaster_account_first__buildmaster_diagnostics_v27', '["recorded diagnostic evidence"]'],
];

function fixture(entries: Array<[string, string]>) {
  const rows = new Map(entries);
  const size = () => [...rows].reduce((sum, [key, value]) => sum + key.length + value.length, 0);
  const capacity = size();
  (globalThis as any).CustomEvent = class { constructor(public type: string, public options: unknown) {} };
  (globalThis as any).window = {
    dispatchEvent: () => true,
    localStorage: {
      get length() { return rows.size; },
      key: (index: number) => [...rows.keys()][index] ?? null,
      getItem: (key: string) => rows.get(key) ?? null,
      removeItem: (key: string) => rows.delete(key),
      setItem: (key: string, value: string) => {
        const oldSize = rows.has(key) ? key.length + rows.get(key)!.length : 0;
        if (size() - oldSize + key.length + value.length > capacity) throw new DOMException('Fixture storage is full', 'QuotaExceededError');
        rows.set(key, value);
      },
    },
  };
  return rows;
}

const cacheKey = 'buildmaster_account_first__buildmaster_ocr_cache_fixture';
const rows = fixture([...preservedEntries, [cacheKey, 'x'.repeat(200)]]);
assert.equal(safeStorageSet('buildmaster_account_first__preference', 'new-value'), true,
  'A disposable cache may free space for a preference write.');
for (const [key, value] of preservedEntries) assert.equal(rows.get(key), value, `Quota recovery must preserve ${key}.`);
assert.equal(rows.has(cacheKey), false, 'Only regenerable cache data should be evicted.');

const noCaches = fixture(preservedEntries);
assert.equal(safeStorageSet('buildmaster_account_first__preference', 'new-value'), false,
  'Without disposable cache space, the write must report failure.');
assert.deepEqual([...noCaches], preservedEntries, 'A refused write must leave every saved record intact.');

console.log('Storage quota preservation: current, legacy and scoped vaults, scans and restore points stay intact.');
