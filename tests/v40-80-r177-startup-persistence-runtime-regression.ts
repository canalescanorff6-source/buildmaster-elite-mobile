import assert from 'node:assert/strict';
import {
  persistCardVisionOcrZonesR177,
  persistCardVisionUiPreferencesR177,
  persistCardVisionVaultFoldersR177,
  readCardVisionProfileAvatarR177,
} from '../src/modules/runtime/cardVisionStartupPersistenceR177';
import { accountStorageKey } from '../src/lib/accountStorage';
import { CALIBRATION_KEY, VAULT_FOLDERS_KEY } from '../src/modules/architecture/appOptions';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const storage = new MemoryStorage();
(globalThis as any).window = { localStorage: storage, dispatchEvent: () => true };

persistCardVisionUiPreferencesR177({
  visualPreset: 'midnight-navy', appTheme: 'dark', accentTheme: 'gold', advancedMode: true,
  textScale: 'standard', densityMode: 'comfortable', motionPreference: 'reduced', highContrast: false, performanceMode: 'economy',
});
const ui = JSON.parse(storage.getItem(accountStorageKey('buildmaster_ui_prefs_v24_24')) || '{}');
assert.equal(ui.visualPreset, 'midnight-navy');
assert.equal(ui.advancedMode, true);
assert.equal(ui.performanceMode, 'economy');

persistCardVisionOcrZonesR177([{ key: 'name', label: 'Nome', x: 0, y: 0, w: 1, h: 1, enabled: true } as any]);
assert.equal(JSON.parse(storage.getItem(accountStorageKey(CALIBRATION_KEY)) || '[]')[0]?.key, 'name');

persistCardVisionVaultFoldersR177([
  { id: 'all', name: 'Todos', kind: 'system' } as any,
  { id: 'custom-1', name: 'Favoritos manuais', kind: 'custom' } as any,
]);
const folders = JSON.parse(storage.getItem(accountStorageKey(VAULT_FOLDERS_KEY)) || '[]');
assert.equal(folders.length, 1);
assert.equal(folders[0].id, 'custom-1');

storage.setItem(accountStorageKey('buildmaster_profile_avatar_v1'), 'data:image/png;base64,AAA');
assert.equal(readCardVisionProfileAvatarR177(), 'data:image/png;base64,AAA');

console.log('R177 runtime: persistência de UI/OCR/pastas e leitura de avatar continuam account-scoped e equivalentes.');
