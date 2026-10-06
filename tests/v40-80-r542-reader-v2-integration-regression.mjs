import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const exists=(path)=>fs.existsSync(path);
const gatePath='src/modules/card-reader-v2/readerV2FeatureGate.ts';
const workerPath='src/modules/card-reader-v2/readerV2TesseractWorker.ts';
const runtimePath='src/modules/card-reader-v2/readerV2AppRuntime.ts';
const boundaryPath='src/modules/card-reader-v2/cardVisionReaderActionsR542.ts';
const entryFacadePath='src/modules/card-reader/cardVisionReaderActionsR187.ts';
const legacyPath='src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts';

for (const path of [gatePath, workerPath, runtimePath, boundaryPath, entryFacadePath, legacyPath]) {
  assert.equal(exists(path), true, `R542 integração: ${path} precisa existir.`);
}

const gate=read(gatePath),worker=read(workerPath),runtime=read(runtimePath),boundary=read(boundaryPath),entryFacade=read(entryFacadePath),legacy=read(legacyPath),app=read('src/components/CardVisionApp.tsx');

assert.match(gate,/ReaderV2Backend\s*=\s*['"]classic['"]\s*\|\s*['"]v2['"]/, 'R542 gate: classic e v2 precisam coexistir.');
assert.match(gate,/readReaderV2Backend\s*\(/, 'R542 gate: backend precisa ser legível.');
assert.match(gate,/writeReaderV2Backend\s*\(/, 'R542 gate: rollback local precisa ser gravável.');
assert.match(gate,/return\s+['"]v2['"]/, 'R542 gate: APK de aceitação precisa usar V2 por padrão.');

// R542 usa uma fachada real no caminho histórico, em vez de depender de alias especial no tsconfig.
assert.match(entryFacade,/export\s+\{\s*createCardVisionReaderActionsR187\s*\}\s+from\s+['"]@\/modules\/card-reader-v2\/cardVisionReaderActionsR542['"]/, 'R542 integração: o caminho histórico do reader precisa encaminhar para a facade V2.');
assert.match(entryFacade,/export\s+type\s+\{[^}]*CardVisionReaderActionsInputR187[^}]*CardVisionReadingModeR187[^}]*\}\s+from\s+['"]@\/modules\/card-reader-v2\/cardVisionReaderActionsR542['"]/, 'R542 integração: os tipos públicos do reader precisam continuar compatíveis pelo caminho histórico.');
assert.match(app,/@\/modules\/card-reader\/cardVisionReaderActionsR187/, 'R542 integração: CardVisionApp deve continuar consumindo o caminho público estável do reader.');
assert.match(legacy,/createProductionAnalysisR138/, 'R542 integração: leitor clássico deve continuar preservado como fallback, sem rollback destrutivo.');
assert.doesNotMatch(boundary,/from\s+['"]@\/modules\/analysis['"]/, 'R542 integração: boundary V2 não pode materializar o barrel pesado de análise durante OCR.');
assert.doesNotMatch(boundary,/createProductionAnalysisR138/, 'R542 integração: produção não pode ser carregada diretamente pelo boundary OCR V2.');

assert.match(worker,/import\(['"]tesseract\.js['"]\)/, 'R542 worker: Tesseract deve ser carregado somente de forma dinâmica.');
assert.match(worker,/workerPath:\s*['"]\/tesseract\/worker\.min\.js['"]/, 'R542 worker: asset local do worker precisa ser preservado.');
assert.match(worker,/corePath:\s*['"]\/tesseract\/core['"]/, 'R542 worker: core local precisa ser preservado.');
assert.match(worker,/langPath:\s*['"]\/tesseract\/lang['"]/, 'R542 worker: idioma local precisa ser preservado.');
assert.doesNotMatch(worker,/prewarm/i, 'R542 worker: V2 não pode ter prewarm.');

assert.match(runtime,/createReaderV2Orchestrator/, 'R542 runtime: app precisa usar o orquestrador validado.');
assert.match(runtime,/createReaderV2OcrWorkerSession/, 'R542 runtime: app precisa usar lifecycle validado.');
assert.match(runtime,/createReaderV2TesseractWorkerFactory/, 'R542 runtime: app precisa usar worker real do V2.');

assert.match(boundary,/readReaderV2Backend\(\)/, 'R542 boundary: decisão classic/v2 precisa acontecer antes do leitor legado.');
assert.match(boundary,/async function handleFile[\s\S]{0,2200}if\(isV2\(\)\)[\s\S]{0,1800}return/, 'R542 boundary: seleção V2 precisa encerrar antes de delegar ao clássico.');
const handleBlock=boundary.match(/async function handleFile[\s\S]*?\n\s*async function analyzeSelectedImage/)?.[0]??'';
assert.doesNotMatch(handleBlock,/loadReaderRuntimeR160/, 'R542 boundary: seleção V2 não pode carregar runtime OCR clássico.');

const analyzeBlock=boundary.match(/async function analyzeSelectedImage[\s\S]*?\n\s*async function runAnalysis/)?.[0]??'';
const loadingIndex=analyzeBlock.indexOf('setLoading(true)');
const progressIndex=analyzeBlock.indexOf('setReaderProgress(');
const runtimeImportIndex=analyzeBlock.indexOf("import('./readerV2AppRuntime')");
assert.ok(loadingIndex>=0 && progressIndex>loadingIndex && runtimeImportIndex>progressIndex, 'R542 boundary: loading e barra de progresso precisam aparecer antes de carregar worker/runtime V2.');
assert.match(analyzeBlock,/mapLegacyCalibrationToReaderV2\([\s\S]{0,300}efhubCalibrationZonesRef\.current/, 'R542 boundary: modo quadrados deve usar calibração atual.');
assert.match(analyzeBlock,/setPreFinalConfirmation\(/, 'R542 boundary: resultado OCR deve alimentar a tela pré-final existente.');
assert.match(boundary, /HABILIDADES JÁ POSSUI:/, 'R549 RED: bridge textual precisa emitir Skills canônicas como posse explícita para o parser existente.');
assert.match(boundary, /ÍMPETO:/, 'R549 RED: bridge textual precisa emitir Ímpeto canônico em formato explícito para o parser existente.');
assert.doesNotMatch(analyzeBlock,/runAnalysis\s*\(/, 'R542 boundary: análise final não pode ocorrer automaticamente ao terminar OCR.');

const finalBlock=boundary.match(/async function runAnalysis[\s\S]*?\n\s*async function cancelCurrentOcr/)?.[0]??'';
assert.match(finalBlock,/readerV2BridgeR542[\s\S]{0,1800}\.forward\(/, 'R542 boundary: confirmação V2 precisa passar pelo bridge fail-closed.');
assert.match(finalBlock,/loadLegacyActions[\s\S]{0,1200}runAnalysis\(true\)/, 'R542 boundary: motor atual só é carregado depois da autorização do bridge.');

console.log('R542 integração aprovada: facade pública, feature gate, Tesseract real, V2 antes do legado e análise somente pós-review.');
