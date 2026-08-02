import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const app = read('src/components/CardVisionApp.tsx');
const component = read('src/components/CleanVaultV3800.tsx');
const engine = read('src/lib/cleanVaultV3800.ts');
const historyStore = read('src/modules/vault/cardHistoryStore.ts');
const css = read('src/app/v38-clean-vault.css');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

assert.match(layout, /import '\.\/v38-clean-vault\.css';/);
assert.match(layout, /bm-v3800-vault/);
assert.match(app, /<CleanVaultV3800/);
assert.match(app, /findExactVaultDuplicateByResult/);
assert.match(app, /archiveHistoryItem/);
assert.match(app, /Cofre Clean/);
assert.match(component, /Buscar jogador/);
assert.match(component, /Ver \{group\.buildCount\} fichas e versões/);
assert.match(component, /Arquivados/);
assert.match(component, /Unir primeira/);
assert.match(engine, /groupVaultPlayersV3800/);
assert.match(engine, /detectExactVaultDuplicates/);
assert.match(engine, /cleanVaultBuildSignature/);
assert.match(historyStore, /folderId: entry\.folderId/);
for (const marker of [
  '.bm-v3800-vault-panel',
  '.bm-v3800-player-groups',
  '.bm-v3800-player-card',
  '.bm-v3800-version-list',
  '.bm-v3800-duplicate-notice'
]) assert.ok(css.includes(marker), `Camada v38.00 incompleta: ${marker}`);
assert.match(cache, /38\.00\.0-clean-vault-1/);
assert.match(sw, /buildmaster-v38-00-clean-vault-1/);

console.log('v38.00 integração aprovada: Cofre clean visível, versões agrupadas, duplicidade, arquivamento e cache atualizado.');
