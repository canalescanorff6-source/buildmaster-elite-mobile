import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const review = read('src/components/result/ResultReviewPanelR189.tsx');
const calibration = read('src/components/result/RealMatchCalibrationPanelR189.tsx');
const advancedR192 = read('src/components/result/ResultAdvancedWorkspaceR192.tsx');
const lazyRegistry = read('src/components/lazy/CardVisionLazyPanelsR174.tsx');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const workspaceLines = workspace.split(/\r?\n/).length;
const workspaceBytes = fs.statSync('src/components/result/ResultWorkspace.tsx').size;
assert.ok(workspaceLines <= 1760, `R189: ResultWorkspace voltou a ${workspaceLines} linhas.`);
assert.ok(workspaceBytes <= 122_000, `R189: ResultWorkspace voltou a ${workspaceBytes} bytes.`);

assert.match(workspace, /import dynamic from ['"]next\/dynamic['"]/, 'R189: ResultWorkspace precisa manter carregamento dinâmico das superfícies opcionais.');
assert.match(workspace, /import\('@\/components\/result\/ResultAdvancedWorkspaceR192'\)/, 'R189/R192: superfícies opcionais devem permanecer adquiridas por import dinâmico.');
assert.match(advancedR192, /import\('@\/components\/result\/RealMatchCalibrationPanelR189'\)/, 'R189: calibração deve permanecer adquirida por import dinâmico dentro da fronteira avançada.');
assert.doesNotMatch(workspace, /function RealMatchCalibrationPanel\(/, 'R189: implementação da calibração não pode voltar ao workspace.');
assert.doesNotMatch(workspace, /export function ReviewPanel\(/, 'R189: implementação de revisão não pode voltar ao workspace.');
assert.doesNotMatch(workspace, /buildCalibrationReport|attributeEvidenceR132|listProvisionalSpecialSkillsV4070/, 'R189: dependências específicas das superfícies extraídas não podem voltar ao workspace.');
assert.doesNotMatch(workspace, /buildReliabilityCenter|compareBuildVariants|detectInconsistencies/, 'R192: diagnósticos avançados não podem voltar ao workspace inicial.');

assert.match(lazyRegistry, /export const ReviewPanel = dynamic\([\s\S]{0,180}ResultReviewPanelR189/, 'R189: ReviewPanel do shell deve apontar diretamente para sua fronteira própria.');
assert.doesNotMatch(lazyRegistry, /export const ReviewPanel = dynamic\([\s\S]{0,180}ResultWorkspace/, 'R189: abrir revisão não pode carregar ResultWorkspace apenas para obter ReviewPanel.');

for (const marker of ['attributeEvidenceR132', 'PhasePlaystyleSelectorR124', 'SinglePrintEvidencePanel', 'OFFICIAL_ADDITIONAL_SKILL_NAMES', 'Aplicar ajustes e gerar ficha']) {
  assert.ok(review.includes(marker), `R189: fronteira de revisão sem ${marker}.`);
}
for (const marker of ['buildCalibrationReport', 'buildAdvancedCalibration', 'CALIBRATION_STORAGE_KEY', 'COMPETITIVE_FUSION_EVENT', 'Salvar resultado da partida']) {
  assert.ok(calibration.includes(marker), `R189: fronteira de calibração sem ${marker}.`);
}

assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R189: R119 não pode mudar durante modularização do workspace.',
);
assert.ok(String(pkg.scripts?.['test:v4080'] ?? '').includes('npm run test:r189'), 'R189: cadeia v40.80 deve preservar o gate R189.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R189: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R189 aprovada: ResultWorkspace=${workspaceLines} linhas/${workspaceBytes} B; revisão e calibração isoladas sem alterar R119.`);
