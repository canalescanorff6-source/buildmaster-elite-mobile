import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const engine = read('src/lib/intelligentLearningR470.ts');
const domain = read('src/lib/analyzerDomain.ts');
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const reader = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
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

assert.match(reader, /beginReadingSessionR470/);
assert.match(reader, /markActiveReadingSessionR470\('OCR_RUNNING'/);
assert.match(reader, /markActiveReadingSessionR470\('OCR_COMPLETE'/);
assert.match(reader, /persistConfirmedAnalysisR470/);

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

console.log('R470 aprovado: memória leve, IA local grátis, A-B, drift e cloud estruturada sem alterar a autoridade da ficha.');
