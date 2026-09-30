import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/vault/CardVisionVaultWorkspaceR191.tsx');
const vault = read('src/components/CleanVaultV3800.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r527-vault',
  'bm-r527-vault-hero',
  'bm-r527-vault-metrics',
  'bm-r527-vault-tabs',
  'bm-r527-vault-organize',
  'bm-r527-vault-compare',
  'bm-r527-vault-protection',
]) assert.ok(workspace.includes(marker), `R527: workspace sem hook ${marker}`);

for (const marker of [
  'bm-r527-catalog',
  'bm-r527-catalog-intro',
  'bm-r527-search',
  'bm-r527-quick-filters',
  'bm-r527-bulk-actions',
  'bm-r527-advanced-filters',
  'bm-r527-player-grid',
  'bm-r527-player-card',
  'bm-r527-player-meta',
  'bm-r527-empty',
]) assert.ok(vault.includes(marker), `R527: catálogo sem hook ${marker}`);

for (const selector of [
  '.bm-r527-vault',
  '.bm-r527-vault-hero',
  '.bm-r527-vault-metrics',
  '.bm-r527-vault-tabs',
  '.bm-r527-catalog',
  '.bm-r527-search',
  '.bm-r527-quick-filters',
  '.bm-r527-player-grid',
  '.bm-r527-player-card',
  '.bm-r527-vault-organize',
  '.bm-r527-vault-compare',
  '.bm-r527-vault-protection',
]) assert.ok(css.includes(selector), `R527: CSS não cobre ${selector}`);

assert.match(vault, /groupVaultPlayersV3800\(props\.visibleEntries\)/,
  'R527: agrupamento deve continuar usando a autoridade existente do Cofre.');
assert.match(vault, /detectExactVaultDuplicates\(props\.entries\)/,
  'R527: detecção de duplicidade deve continuar na autoridade existente.');
assert.match(workspace, /useProgressiveVaultWorkspaceR413\(vaultView, renderHistory\)/,
  'R527: render progressivo deve continuar vindo do R413.');
assert.match(vault, /props\.onToggleFavorite\(primary\.id\)/,
  'R527: favorito deve continuar chamando a mutação recebida do workspace.');
assert.match(vault, /props\.onBatch\(action,ids\)/,
  'R527: ações em lote devem continuar chamando o contrato canônico existente.');

for (const forbidden of [
  "from '@/modules/vault/productionVaultR128'",
  "from '@/modules/vault/vaultCanonicalMutationQueueR153'",
  "from '@/modules/analysis/jointOptimizerR512'",
  "from '@/modules/analysis/engineCertificationR517'",
]) {
  assert.ok(!vault.includes(forbidden), `R527: catálogo não deve importar autoridade/writer diretamente: ${forbidden}`);
}

console.log('R527 aprovada: Cofre/Coleção recebe experiência premium sem criar writer paralelo nem dados fictícios.');
