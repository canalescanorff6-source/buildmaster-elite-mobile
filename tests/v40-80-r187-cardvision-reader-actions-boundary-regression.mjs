import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const readerActions = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const navigation = read('src/hooks/useCardVisionNavigationControllerR176.ts');
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

assert.ok(app.split(/\r?\n/).length <= 2050, `R187: CardVisionApp voltou a ${app.split(/\r?\n/).length} linhas.`);
assert.ok(fs.statSync('src/components/CardVisionApp.tsx').size <= 158_000, 'R187: CardVisionApp voltou a crescer além da fronteira do leitor.');
assert.match(app, /import type \{[^}]*CardVisionReaderActionsInputR187[^}]*createCardVisionReaderActionsR187[^}]*\}/, 'R187: shell deve depender apenas de contratos de tipo no startup.');
assert.doesNotMatch(app, /^\s*import\s+\{[^\n]*createCardVisionReaderActionsR187[^\n]*\}\s+from/m, 'R187: controlador do leitor não pode voltar ao import runtime estático.');
assert.match(app, /await import\('@\/modules\/card-reader\/cardVisionReaderActionsR187'\)/, 'R187: ações devem adquirir o controlador por import dinâmico.');
assert.match(navigation, /if \(section === 'leitor'\)[\s\S]*import\('@\/modules\/card-reader\/cardVisionReaderActionsR187'\)/, 'R187: entrada no leitor deve antecipar o controlador após intenção do usuário.');
assert.match(readerActions, /CARDVISION_READER_ACTIONS_R187_VERSION/, 'R187: controlador deve possuir versão explícita.');
for (const marker of [
  'loadOcrQueueRuntimeR160()',
  'loadReaderEvidenceRuntimeR161()',
  'loadReaderAnalysisRuntimeR163()',
  'loadReaderInteractionRuntimeR164()',
  'createCardVisionReaderAnalysisOperationsR163(buildReaderAnalysisContextR187())',
  'createCardVisionReaderInteractionOperationsR164(buildReaderInteractionContextR187())',
  'confirmedOcrSkillsForLearningR131',
  'learnOcrTemplateCalibration',
  'createProductionAnalysisR138',
]) assert.ok(readerActions.includes(marker), `R187: fronteira do leitor sem ${marker}.`);
for (const movedMarker of ['confirmedOcrSkillsForLearningR131', 'createCorrectionRecord(singlePrintSession', 'loadReaderAnalysisRuntimeR163()', 'loadReaderInteractionRuntimeR164()']) {
  assert.ok(!app.includes(movedMarker), `R187: implementação do leitor voltou ao shell: ${movedMarker}`);
}
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96', 'R187: R119 não pode mudar durante modularização do leitor.');
assert.ok(String(pkg.scripts?.['test:v4080'] ?? '').includes('npm run test:r187'), 'R187: cadeia v40.80 deve preservar o gate R187.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R187: test:all deve continuar fechando pela bateria v40.80.');
console.log(`R187 aprovada: CardVisionApp=${app.split(/\r?\n/).length} linhas/${fs.statSync('src/components/CardVisionApp.tsx').size} B; controlador do leitor lazy e R119 intacto.`);
