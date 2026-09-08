import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const actions = read('src/modules/result/cardVisionResultActionsR188.ts');
const navigation = read('src/hooks/useCardVisionNavigationControllerR176.ts');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const appLines = app.split(/\r?\n/).length;
const appBytes = fs.statSync('src/components/CardVisionApp.tsx').size;
assert.ok(appLines <= 1930, `R188: CardVisionApp voltou a ${appLines} linhas.`);
assert.ok(appBytes <= 150_000, `R188: CardVisionApp voltou a ${appBytes} bytes.`);
assert.match(app, /import type \{ CardVisionResultActionsInputR188, createCardVisionResultActionsR188 \}/, 'R188: shell deve consumir somente o contrato de tipo no startup.');
assert.doesNotMatch(app, /^\s*import\s+\{[^\n]*createCardVisionResultActionsR188[^\n]*\}\s+from/m, 'R188: controlador de resultado não pode voltar a import runtime estático.');
assert.match(app, /await import\('@\/modules\/result\/cardVisionResultActionsR188'\)/, 'R188: ações do resultado devem ser adquiridas por import dinâmico.');
assert.match(navigation, /section === 'resultado'[\s\S]{0,240}import\('@\/modules\/result\/cardVisionResultActionsR188'\)/, 'R188: abrir Resultado deve antecipar o chunk após intenção do usuário.');
assert.match(actions, /CARDVISION_RESULT_ACTIONS_R188_VERSION/, 'R188: fronteira precisa de versão explícita.');
for (const marker of [
  'exportCurrentReport',
  'exportCurrentMarkdownReport',
  'exportCurrentVisualCard',
  'printCurrentReport',
  'applyGameplayProfile',
  'replaceOwnedSkillIntelligently',
  'rejectSkillLocally',
  'promoteSkillLocally',
  'rejectImpetoLocally',
  'promoteImpetoLocally',
  'resetLocalCorrectionsForCurrent',
  'runCanonicalVaultMutationR153',
  'regenerateSkillAfterOwnedConfirmation',
  'loadCardVisionExportRuntimeR168',
]) assert.ok(actions.includes(marker), `R188: fronteira de resultado sem ${marker}.`);
for (const movedMarker of [
  'regenerateSkillAfterOwnedConfirmation(base, skill)',
  'premiumCleanSvgToPngBlob(svg',
  "upsertCorrectionForResult(base, { blockedImpetos",
  "buildProfessionalReportHtml(result",
]) assert.ok(!app.includes(movedMarker), `R188: implementação de resultado voltou ao shell: ${movedMarker}`);
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R188: R119 não pode mudar durante modularização de resultado.',
);
assert.ok(String(pkg.scripts?.['test:v4080'] ?? '').includes('npm run test:r188'), 'R188: cadeia v40.80 deve preservar o gate R188.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R188: test:all deve continuar fechando pela bateria v40.80.');
console.log(`R188 aprovada: CardVisionApp=${appLines} linhas/${appBytes} B; ações de resultado lazy e R119 intacto.`);
