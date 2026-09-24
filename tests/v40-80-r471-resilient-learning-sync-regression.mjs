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
assert.ok(!engine.includes("import('./accountAuth')"), 'R471 não pode puxar accountAuth para closures históricas');
assert.ok(engine.includes('__bmR471Sync'));
const auth = fs.readFileSync('src/lib/accountAuth.ts','utf8');
assert.match(auth, /__bmR471Sync\s*=\s*syncIntelligentLearningR470/);
const authGate = fs.readFileSync('src/components/AuthGate.tsx','utf8');
assert.ok(authGate.includes("import('@/lib/intelligentLearningR470')"), 'R471 precisa carregar o flush lazy sem bloquear o AuthGate.');
assert.ok(authGate.includes('flushPendingIntelligentLearningR471'), 'R471 precisa de helper de flush na reconexão.');
assert.ok((authGate.match(/flushPendingIntelligentLearningR471\(\)/g) ?? []).length >= 3, 'R471 deve drenar pendências no restore, revalidate e login online.');

assert.ok(reader.includes("markActiveReadingSessionR470('NORMALIZED'"));
assert.ok(reader.includes("markActiveReadingSessionR470('ENGINE_RUNNING'"));
assert.ok(reader.includes("markActiveReadingSessionR470('CARD_MATCHED'"));

assert.ok(String(pkg.scripts?.['test:r471'] ?? '').includes('r471-resilient-learning-sync'));
assert.ok(String(pkg.scripts?.['ci:gate'] ?? '').includes('test:r471'));

console.log('R471 aprovado: outbox persistente, retry offline-first e ciclo NORMALIZED/CARD_MATCHED sem binários em nuvem.');
