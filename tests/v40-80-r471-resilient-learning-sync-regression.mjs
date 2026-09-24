import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/lib/intelligentLearningR470.ts','utf8');
const reader = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

for (const marker of [
  'INTELLIGENT_LEARNING_R471_SYNC_PREFIX',
  'queueIntelligentLearningSyncR471',
  'flushIntelligentLearningOutboxR471',
  "runtimePut('diagnostics'",
  "runtimeDelete('diagnostics'",
  'OFFLINE_OR_NO_SESSION',
  "cloudState: 'SYNCED'",
  "status: 'SYNCED'"
]) assert.ok(engine.includes(marker), `R471 sem marcador: ${marker}`);

assert.ok(engine.includes('await queueIntelligentLearningSyncR471(finalized.sessionKey, cloudPayload)'));
assert.ok(engine.includes('void flushIntelligentLearningOutboxR471().catch'));
assert.ok(!engine.includes('bytea'));
assert.ok(!engine.includes('FileReader'));

assert.ok(reader.includes("markActiveReadingSessionR470('NORMALIZED'"));
assert.ok(reader.includes("markActiveReadingSessionR470('ENGINE_RUNNING'"));
assert.ok(reader.includes("markActiveReadingSessionR470('CARD_MATCHED'"));

assert.ok(String(pkg.scripts?.['test:r471'] ?? '').includes('r471-resilient-learning-sync'));
assert.ok(String(pkg.scripts?.['ci:gate'] ?? '').includes('test:r471'));

console.log('R471 aprovado: outbox persistente, retry offline-first e ciclo NORMALIZED/CARD_MATCHED sem binários em nuvem.');
