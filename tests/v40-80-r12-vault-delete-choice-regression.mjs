import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const prefs = fs.readFileSync('src/lib/vaultDeletionPreferencesV4080R12.ts', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(app, /Mover para a Lixeira/);
assert.match(app, /Excluir definitivamente/);
assert.match(app, /Sempre excluir definitivamente/);
assert.match(app, /permanentlyDeleteHistoryItem/);
assert.match(app, /moveHistoryItemToTrash/);
assert.match(app, /window\.confirm/);
assert.match(app, /writeVaultDeletionPreferencesV4080R12/);
assert.match(prefs, /alwaysDeletePermanently:\s*false/);
assert.match(prefs, /accountStorageKey/);
assert.match(css, /vault-delete-choice-backdrop/);
assert.match(css, /vault-delete-preference-card/);
console.log('v40.80 r12 aprovado: Cofre oferece Lixeira ou exclusão definitiva, com preferência persistente e confirmação irreversível.');
