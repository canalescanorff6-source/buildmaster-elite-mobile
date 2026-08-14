import { accountStorageKey } from './accountStorage';
import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

const VAULT_DELETE_PREFS_KEY = 'vault_delete_preferences_v4080_r12';

export type VaultDeletionPreferencesV4080R12 = {
  alwaysDeletePermanently: boolean;
};

const DEFAULTS: VaultDeletionPreferencesV4080R12 = {
  alwaysDeletePermanently: false
};

function key() {
  return accountStorageKey(VAULT_DELETE_PREFS_KEY);
}

export function readVaultDeletionPreferencesV4080R12(): VaultDeletionPreferencesV4080R12 {
  const stored = safeStorageGetJson<Partial<VaultDeletionPreferencesV4080R12>>(key(), DEFAULTS);
  return {
    alwaysDeletePermanently: stored?.alwaysDeletePermanently === true
  };
}

export function writeVaultDeletionPreferencesV4080R12(value: VaultDeletionPreferencesV4080R12) {
  safeStorageSetJson(key(), {
    alwaysDeletePermanently: value.alwaysDeletePermanently === true
  });
}
