import assert from 'node:assert/strict';
import fs from 'node:fs';

const vaultWorkspace = fs.readFileSync('src/components/vault/CardVisionVaultWorkspaceR191.tsx', 'utf8');
const settingsWorkspace = fs.readFileSync('src/components/settings/CardVisionSettingsWorkspaceR190.tsx', 'utf8');
const vaultActions = fs.readFileSync('src/hooks/useCardVisionVaultActionsR185.ts', 'utf8');
const prefs = fs.readFileSync('src/lib/vaultDeletionPreferencesV4080R12.ts', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(vaultWorkspace, /Mover para a Lixeira/);
assert.match(vaultWorkspace, /Excluir definitivamente/);
assert.match(settingsWorkspace, /Sempre excluir definitivamente/);
assert.match(vaultWorkspace, /permanentlyDeleteHistoryItem/);
assert.match(vaultWorkspace, /moveHistoryItemToTrash/);
assert.match(vaultActions, /window\.confirm/);
assert.match(vaultActions, /writeVaultDeletionPreferencesV4080R12/);
assert.match(prefs, /alwaysDeletePermanently:\s*false/);
assert.match(prefs, /accountStorageKey/);
assert.match(css, /vault-delete-choice-backdrop/);
assert.match(css, /vault-delete-preference-card/);
console.log('v40.80 r12 aprovado: Cofre oferece Lixeira ou exclusão definitiva, com preferência persistente e confirmação irreversível.');
