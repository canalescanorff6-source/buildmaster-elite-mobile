import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const derived = fs.readFileSync('src/hooks/useCardVisionDerivedStateR179.ts', 'utf8');
const lazy = fs.readFileSync('src/components/lazy/CardVisionConditionalFieldsR179.tsx', 'utf8');

assert.match(app, /useCardVisionDerivedStateR179\(\{/, 'R179: CardVision deve delegar leituras derivadas ao hook dedicado.');
for (const fragment of [
  "safeViewComputationR130('history-render-sanitizer'",
  "safeViewComputationR130('vault-filtering'",
  "safeViewComputationR130('dashboard-stats'",
  "safeViewComputationR130('clean-vault-summary'",
  "safeViewComputationR130('smart-home-summary'",
  "safeViewComputationR130('local-integrity'",
  "safeViewComputationR130('player-comparison'",
]) {
  assert.doesNotMatch(app, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `R179: leitura derivada não deve voltar ao shell: ${fragment}`);
  assert.match(derived, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `R179: hook deve preservar a leitura derivada: ${fragment}`);
}
for (const canonicalCall of ['sanitizeRuntimeHistoryR200', 'filterVaultHistoryR151', 'buildDashboardStats', 'buildVaultBootstrapSummaryR173', 'buildSmartHomeSummary', 'inspectDataIntegrity', 'listVaultPlaystylesR151', 'listVaultSkillsR151', 'comparePlayers', 'countActiveVaultFiltersR151']) {
  assert.match(derived, new RegExp(canonicalCall), `R179: hook deve reutilizar a autoridade existente ${canonicalCall}.`);
}
assert.doesNotMatch(derived, /setHistory|persistHistoryStore|commitVault|runCanonicalVaultMutation|moveToVaultTrash|clearVaultTrash/, 'R179: hook derivado não pode virar writer do Cofre.');

for (const name of ['CalibrationProfileFields', 'ManagerSelectionField', 'EfootballV600PreviewV4070', 'UnifiedCreationFlowV3790', 'UnifiedCreationResumeCardV3790']) {
  assert.match(lazy, new RegExp(`export const ${name} = dynamic\\(`), `R179: ${name} deve permanecer atrás do registro lazy.`);
}
assert.doesNotMatch(app, /from '@\/components\/CalibrationProfileFields'/, 'R179: calibração não deve voltar ao import estático do shell.');
assert.doesNotMatch(app, /from '@\/components\/ManagerSelectionField'/, 'R179: técnico não deve voltar ao import estático do shell.');
assert.doesNotMatch(app, /from '@\/components\/EfootballV600PreviewV4070'/, 'R179: preview v6 não deve voltar ao import estático do shell.');
assert.doesNotMatch(app, /from '@\/components\/UnifiedCreationFlowV3790'/, 'R179: criação unificada não deve voltar ao import estático do shell.');
assert.ok(app.split('\n').length <= 2530, 'R179: CardVision deve permanecer abaixo de 2530 linhas de fonte.');

console.log('R179 aprovada: estado derivado saiu do shell e UI condicional de criação/time ficou lazy, sem criar writer paralelo.');
