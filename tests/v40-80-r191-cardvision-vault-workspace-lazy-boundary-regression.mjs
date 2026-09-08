import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const appPath = 'src/components/CardVisionApp.tsx';
const workspacePath = 'src/components/vault/CardVisionVaultWorkspaceR191.tsx';
const app = read(appPath);
const workspace = read(workspacePath);
const lazy = read('src/components/lazy/CardVisionLazyPanelsR174.tsx');
const actions = read('src/hooks/useCardVisionVaultActionsR185.ts');
const coordinator = read('src/modules/vault/useCardVisionVaultCoordinatorR153.ts');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const appLines = app.split(/\r?\n/).length;
const appBytes = fs.statSync(appPath).size;
const workspaceBytes = fs.statSync(workspacePath).size;
assert.ok(appLines <= 1720, `R191: CardVisionApp voltou a ${appLines} linhas.`);
assert.ok(appBytes <= 113_000, `R191: CardVisionApp voltou a ${appBytes} bytes.`);
assert.ok(workspaceBytes <= 26_000, `R191: workspace do Cofre cresceu para ${workspaceBytes} bytes.`);
assert.match(app, /<CardVisionVaultWorkspaceR191\b/, 'R191: shell deve montar a fronteira própria do Cofre.');
assert.match(lazy, /export const CardVisionVaultWorkspaceR191 = dynamic\(/, 'R191: workspace do Cofre deve permanecer dynamic/lazy.');
assert.match(lazy, /import\('@\/components\/vault\/CardVisionVaultWorkspaceR191'\)/, 'R191: registry precisa adquirir o Cofre por import dinâmico.');

for (const moved of ['<CleanVaultV3800', 'Cofre Clean', 'vault-folder-catalog', 'player-comparison-hub', 'vault-trash-panel', 'vault-delete-choice-dialog']) {
  assert.ok(!app.includes(moved), `R191: implementação do Cofre voltou ao shell: ${moved}`);
  assert.ok(workspace.includes(moved), `R191: fronteira do Cofre perdeu ${moved}`);
}
for (const required of ['actions: VaultActionsR191', 'coordinator: VaultCoordinatorR191', 'backup: BackupControllerR191', 'activeVaultActionKeysR154', 'requestVaultCloudSyncR154', 'requestVaultCloudPullR154']) {
  assert.ok(workspace.includes(required), `R191: contrato do Cofre sem ${required}.`);
}
for (const forbidden of ['commitVaultHistoryR140', 'localStorage.setItem', 'indexedDB', 'nativeVaultWrite', 'createClient(', 'supabase.from(']) {
  assert.ok(!workspace.includes(forbidden), `R191: workspace visual adquiriu autoridade de persistência proibida: ${forbidden}`);
}
assert.match(actions, /runCanonicalVaultMutationR153/, 'R191: mutações do Cofre devem continuar delegadas a R153.');
assert.match(coordinator, /runCanonicalVaultMutationR153/, 'R191: coordenador canônico R153 deve continuar presente.');
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R191: R119 não pode mudar durante modularização do Cofre.',
);
assert.match(String(pkg.scripts?.['test:v4080'] ?? ''), /npm run test:r191(?: && npm run test:r192)?(?: && npm run test:r193)?(?: && npm run test:r194)?(?: && npm run test:r195)?(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/, 'R191: cadeia v40.80 deve preservar R191 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R191: test:all deve continuar fechando pela bateria v40.80.');
console.log(`R191 aprovada: CardVisionApp=${appLines} linhas/${appBytes} B; Cofre=${workspaceBytes} B lazy, sem writer paralelo e R119 intacto.`);
