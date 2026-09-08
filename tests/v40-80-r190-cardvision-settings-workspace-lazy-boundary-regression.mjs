import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const settings = read('src/components/settings/CardVisionSettingsWorkspaceR190.tsx');
const lazy = read('src/components/lazy/CardVisionLazyPanelsR174.tsx');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

const appLines = app.split(/\r?\n/).length;
const appBytes = fs.statSync('src/components/CardVisionApp.tsx').size;
assert.ok(appLines <= 1820, `R190: CardVisionApp voltou a ${appLines} linhas.`);
assert.ok(appBytes <= 130_000, `R190: CardVisionApp voltou a ${appBytes} bytes.`);
assert.match(app, /<CardVisionSettingsWorkspaceR190\b/, 'R190: shell deve montar a fronteira própria de Ajustes.');
assert.match(lazy, /export const CardVisionSettingsWorkspaceR190 = dynamic\([\s\S]{0,220}CardVisionSettingsWorkspaceR190/, 'R190: workspace de Ajustes deve permanecer dynamic/lazy.');
assert.match(lazy, /import\('@\/components\/settings\/CardVisionSettingsWorkspaceR190'\)/, 'R190: registry precisa adquirir Ajustes por import dinâmico.');
for (const moved of ['<PremiumSettingsOverview', '<IdentityAppearancePanel', '<CloudSyncCenter', '<PlayStorePublicationCenter', 'backup-password-panel', 'settings-navigation-rail']) {
  assert.ok(!app.includes(moved), `R190: implementação de Ajustes voltou ao shell: ${moved}`);
  assert.ok(settings.includes(moved), `R190: fronteira de Ajustes perdeu ${moved}`);
}
for (const marker of ['PremiumSettingsOverview', 'IdentityAppearancePanel', 'ArchitectureHealthPanel', 'CloudSyncCenter', 'UpdateCenterPanel', 'AdministrationSecurityCenter', 'prepareBackupForUpdate']) {
  assert.ok(settings.includes(marker), `R190: workspace de Ajustes sem ${marker}.`);
}
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96',
  'R190: R119 não pode mudar durante modularização de Ajustes.',
);
assert.match(String(pkg.scripts?.['test:v4080'] ?? ''), /npm run test:r190(?: && npm run test:r191)?(?: && npm run test:r192)?(?: && npm run test:r193)?(?: && npm run test:r194)?(?: && npm run test:r195)?(?: && npm run test:r196)?(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/, 'R190: cadeia v40.80 deve preservar R190 → R191 → R192 em ordem.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R190: test:all deve continuar fechando pela bateria v40.80.');
console.log(`R190 aprovada: CardVisionApp=${appLines} linhas/${appBytes} B; Ajustes lazy e R119 intacto.`);
