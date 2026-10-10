import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const resultActions = read('src/modules/result/cardVisionResultActionsR188.ts');
const readerFacade = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const readerActions = read('src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts');
const readerRuntime = read('src/modules/card-reader/readerAnalysisRuntimeR163.ts');
const historyStore = read('src/modules/vault/cardHistoryStore.ts');
const productionVault = read('src/modules/vault/productionVaultR128.ts');
const vaultLifecycle = read('src/modules/vault/vaultProductionLifecycleR139.ts');
const pkg = JSON.parse(read('package.json'));

assert.match(readerFacade,/card-reader-v2\/cardVisionReaderActionsR542/,'R542/R198: caminho público do leitor deve permanecer facade do Reader V2.');

// R198: resultado final e prévia devem ser atualizados pela mesma autoridade R138
// quando regras/pesquisa/correções exigem refresh do cálculo.
assert.match(app, /const refreshProductionAnalysesR198 = async \(\) => \{[\s\S]{0,220}await import\('@\/modules\/analysis\/productionOrchestratorR138'\)[\s\S]{0,220}setResult\(\(current\) => current \? rebuildProductionAnalysisR138\(current\) : current\);[\s\S]{0,220}setDraftResult\(\(current\) => current \? rebuildProductionAnalysisR138\(current\) : current\);/, 'R198/R200: shell deve reconstruir result e draftResult pela mesma autoridade R138 carregada sob demanda.');
assert.match(app, /CREATOR_BUILD_RESEARCH_EVENT[\s\S]{0,360}const listener = \(\) => \{ void refreshProductionAnalysesR198\(\); \};[\s\S]{0,180}window\.addEventListener\(eventName, listener\)/, 'R198/R200: eventos de pesquisa devem atualizar resultado e prévia pelo refresh canônico lazy.');
assert.ok((app.match(/refreshProductionAnalysesR198\(\);/g) ?? []).length >= 2, 'R198: ativação/restauração de regras deve usar o refresh canônico compartilhado.');
assert.doesNotMatch(app, /applyLocalCorrectionsToResult/, 'R198: CardVisionApp não pode manter caminho parcial de correções para draftResult.');

// R188: preferências locais também não podem deixar a prévia em uma autoridade menor.
assert.match(resultActions, /function refreshResultWithCorrections[\s\S]{0,320}setResult\(\(current\) => current \? rebuildProductionAnalysisR138\(current\) : current\);[\s\S]{0,220}setDraftResult\(\(current\) => current \? rebuildProductionAnalysisR138\(current\) : current\);/, 'R198: R188 deve reconstruir final e prévia de modo simétrico.');
assert.doesNotMatch(resultActions, /applyLocalCorrectionsToResult/, 'R198: R188 não deve manter refresh parcial somente da prévia.');

// Allowlist de criação de uma nova análise de produção. Novos writers diretos exigem revisão explícita.
const approvedCreateCallers = new Set([
  'src/components/CardVisionApp.tsx',
  'src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts', // fallback/finalização clássica atrás da facade R542
  'src/modules/card-reader/readerAnalysisRuntimeR163.ts',
  'src/modules/vault/cardHistoryStore.ts',
  'src/modules/analysis/productionOrchestratorR138.ts',
  'src/modules/card-catalog/masterCardAnalysisRequestR438.ts',
]);
const createCallers = [];
const stack = ['src'];
while (stack.length) {
  const current = stack.pop();
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) stack.push(target);
    else if (/\.(?:ts|tsx)$/.test(target) && read(target).includes('createProductionAnalysisR138(')) createCallers.push(target.replace(/\\/g, '/'));
  }
}
assert.deepEqual(new Set(createCallers), approvedCreateCallers, `R198: novos criadores diretos de análise detectados: ${createCallers.join(', ')}`);

// O leitor único deve continuar em prévia antes da confirmação; o leitor total só finaliza com certificação R501.
assert.match(readerRuntime, /setDraftResult\(autoResult\);[\s\S]{0,80}setResult\(null\);/, 'R198: OCR único clássico deve continuar gerando prévia antes da confirmação final.');
assert.match(readerRuntime, /deriveTotalReadingFinalizationR501\(session\)[\s\S]{0,180}totalFinalization\.canFinalize[\s\S]{0,360}setDraftResult\(null\);\s*setResult\(autoResult\);/, 'R198/R501: Leitura Total clássica só pode promover automaticamente quando a autoridade R501 liberar.');
assert.match(readerRuntime, /setDraftResult\(autoResult\);\s*setResult\(null\);/, 'R198/R501: Leitura Total não certificada deve permanecer prévia.');
assert.match(readerActions, /if \(confirmed\)[\s\S]*?setDraftResult\(null\);\s*setResult\(nextResult\);/, 'R542/R198: confirmação do fallback clássico deve continuar sendo o ponto de promoção da prévia para resultado.');

// Persistência deve normalizar/selar a análise antes de entrar no Cofre.
assert.match(productionVault, /ensureProductionAnalysisR138\(item\.result\)/, 'R198: productionVault deve validar a análise pela autoridade R138.');
assert.ok((vaultLifecycle.match(/ensureProductionAnalysisR138\(input\.result\)/g) ?? []).length >= 2, 'R198: lifecycle do Cofre deve validar criação/atualização pela autoridade R138.');
assert.match(historyStore, /createProductionAnalysisR138\(\{ rawText: source/, 'R198: migração histórica deve entrar pelo orquestrador de produção.');

const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '02208171c61e6576107ebb3a22a94357755fb07f5b752b20dda78ca12b2ccadb', 'R198/R504: R119 deve permanecer no fingerprint aprovado após centralizar o estado pós-build.');

const appBytes = fs.statSync('src/components/CardVisionApp.tsx').size;
const r200Boundary = fs.existsSync('src/modules/vault/cardHistoryStartupModelR200.ts');
const postCatalogBoundary = fs.existsSync('scripts/apply-r442-known-catalog-acquisition.mjs');
assert.ok(appBytes <= (postCatalogBoundary ? 114_688 : r200Boundary ? 107_800 : 107_350), `R198/R200: CardVisionApp excedeu a fronteira aprovada: ${appBytes} B.`);
let sourceBytes = 0;
const sourceStack = ['src'];
while (sourceStack.length) {
  const current = sourceStack.pop();
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) sourceStack.push(target);
    else if (/\.(?:ts|tsx)$/.test(target)) sourceBytes += fs.statSync(target).size;
  }
}
assert.ok(sourceBytes <= (postCatalogBoundary ? 6_275_072 : r200Boundary ? 5_360_000 : 5_335_350), `R198/R200: orçamento de fonte excedeu a fronteira aprovada; src=${sourceBytes} B.`);

const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(v4080.endsWith('npm run test:r197 && npm run test:r198') || v4080.endsWith('npm run test:r197 && npm run test:r198 && npm run test:r199') || v4080.endsWith('npm run test:r197 && npm run test:r198 && npm run test:r199 && npm run test:r200'), 'R198: cadeia v40.80 deve preservar R197 -> R198 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R198: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R198/R504/R542 aprovada: Reader V2 por facade, writer clássico isolado e OCR→análise→prévia/final→Cofre sob autoridades explícitas; CardVisionApp=${appBytes} B; src=${sourceBytes} B.`);