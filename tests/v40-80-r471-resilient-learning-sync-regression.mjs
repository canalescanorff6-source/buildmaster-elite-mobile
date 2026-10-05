import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/lib/intelligentLearningR470.ts','utf8');
const readerFacade = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts','utf8');
const readerV2 = fs.readFileSync('src/modules/card-reader-v2/cardVisionReaderActionsR542.ts','utf8');
const readerLegacy = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts','utf8');
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
assert.ok(engine.includes('left.attempts-right.attempts||left.createdAt.localeCompare(right.createdAt)'), 'R471 deve priorizar pendências com menos falhas para evitar starvation.');
assert.ok(!engine.includes('bytea'));
assert.ok(!engine.includes('FileReader'));
assert.ok(!engine.includes("import('./accountAuth')"), 'R471 não pode puxar accountAuth para closures históricas');
assert.ok(engine.includes('__bmR471Sync'));
const auth = fs.readFileSync('src/lib/accountAuth.ts','utf8');
assert.match(auth, /__bmR471Sync\s*=\s*syncIntelligentLearningR470/);
const authGate = fs.readFileSync('src/components/AuthGate.tsx','utf8');
assert.ok(authGate.includes("import('@/lib/intelligentLearningR470')"), 'R471 precisa carregar o flush lazy ao reconectar.');
assert.ok(authGate.includes('flushIntelligentLearningOutboxR471'), 'R471 precisa drenar a fila no evento online.');

// R542 transformou a ação pública em fachada e isolou o OCR V2. O ciclo
// persistente R470/R471 deve permanecer no fluxo clássico/finalização, depois
// que o Reader V2 já encerrou o worker e atravessou o bridge de conferência.
assert.ok(readerFacade.includes('cardVisionReaderActionsR542'));
assert.ok(readerLegacy.includes("markActiveReadingSessionR470('NORMALIZED'"));
assert.ok(readerLegacy.includes("markActiveReadingSessionR470('ENGINE_RUNNING'"));
assert.ok(readerLegacy.includes("markActiveReadingSessionR470('CARD_MATCHED'"));
assert.ok(readerV2.includes('legacy.runAnalysis(true)'), 'R542 precisa entregar a finalização confirmada ao fluxo que preserva R470/R471.');
assert.ok(!readerV2.includes("markActiveReadingSessionR470('NORMALIZED'"), 'R471 não pode reintroduzir lifecycle cloud/aprendizado durante OCR V2.');

assert.ok(String(pkg.scripts?.['test:r471'] ?? '').includes('r471-resilient-learning-sync'));
assert.ok(String(pkg.scripts?.['ci:gate'] ?? '').includes('test:r471'));

console.log('R471/R542 aprovado: outbox offline-first preservada após a conferência e ausente do OCR isolado.');
