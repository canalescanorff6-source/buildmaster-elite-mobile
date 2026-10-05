import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const engine = read('src/lib/intelligentLearningR470.ts');
const domain = read('src/lib/analyzerDomain.ts');
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const readerFacade = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const readerV2 = read('src/modules/card-reader-v2/cardVisionReaderActionsR542.ts');
const readerLegacy = read('src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts');
const auth = read('src/lib/accountAuth.ts');
const ui = read('src/components/result/ProfessionalIntelligenceCenter.tsx');
const migration = read('supabase/migrations/202609240001_r470_intelligent_learning.sql');
const pkg = JSON.parse(read('package.json'));

assert.match(engine, /LOCAL_STATISTICAL_FREE/);
assert.match(engine, /externalApiRequired:\s*false/);
assert.match(engine, /scopeProfile\('CARD'/);
assert.match(engine, /scopeProfile\('FUNCTION'/);
assert.match(engine, /scopeProfile\('GLOBAL'/);
assert.match(engine, /evaluateAbExperimentRowsR470/);
assert.match(engine, /driftForRows/);
assert.match(engine, /decideEvidenceRetentionR470/);
assert.match(engine, /HASH_ONLY/);
assert.match(engine, /KEEP_COMPRESSED/);
assert.match(engine, /beginReadingSessionR470/);
assert.match(engine, /persistConfirmedAnalysisR470/);
assert.doesNotMatch(engine, /result\.training\s*=/);
assert.doesNotMatch(engine, /result\.recommendedSkills\s*=/);
assert.doesNotMatch(engine, /result\.recommendedImpetos\s*=/);

assert.match(domain, /intelligentLearningR470\?:/);
const r126 = pipeline.indexOf('sealProductionAuthorityR126(current)');
const r470 = pipeline.indexOf('attachIntelligentLearningR470(current)');
const r128 = pipeline.indexOf('sealProductionAuthorityR128(current)');
assert.ok(r126 >= 0 && r470 > r126 && r128 > r470, 'R470 precisa ser read-only depois do R126 e antes do selo de integridade R128.');

// R542 mantém a fachada pública leve e move o fluxo clássico para um módulo
// carregado somente quando necessário. A telemetria/aprendizado R470 continua
// preservada no caminho clássico e na finalização confirmada do V2, mas não
// pode voltar a ser carregada durante o OCR isolado do Reader V2.
assert.match(readerFacade, /cardVisionReaderActionsR542/);
assert.match(readerLegacy, /beginReadingSessionR470/);
assert.match(readerLegacy, /markActiveReadingSessionR470\('OCR_RUNNING'/);
assert.match(readerLegacy, /markActiveReadingSessionR470\('OCR_COMPLETE'/);
assert.match(readerLegacy, /persistConfirmedAnalysisR470/);
assert.match(readerV2, /loadLegacyActions/);
assert.match(readerV2, /legacy\.runAnalysis\(true\)/);
assert.doesNotMatch(readerV2, /markActiveReadingSessionR470\('OCR_RUNNING'/,
  'R542: o Reader V2 não pode carregar/aplicar R470 durante a fase OCR isolada.');

assert.match(auth, /syncIntelligentLearningR470/);
for (const table of ['card_reading_sessions_r470','card_build_history_r470','learning_models_r470']) {
  assert.match(auth, new RegExp(table));
  assert.match(migration, new RegExp(table));
}
assert.match(migration, /enable row level security/);
assert.doesNotMatch(migration, /\bbytea\b/i);
assert.doesNotMatch(migration, /\bblob\b/i);

assert.match(ui, /IA local grátis/);
assert.match(ui, /API paga/);
assert.match(String(pkg.scripts?.['test:r470'] ?? ''), /r470-intelligent-learning/);
assert.match(String(pkg.scripts?.['ci:gate'] ?? ''), /test:r470/);

console.log('R470/R542 aprovado: aprendizado preservado no clássico/finalização e ausente do OCR isolado do Reader V2.');
