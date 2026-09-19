import assert from 'node:assert/strict';
import {
  createResolutionQueueItemR439,
  mergeResolutionQueueItemR439,
  resolveQueueCandidateR439,
  resolutionQueueSummaryR439
} from '../src/modules/card-catalog/cardResolutionQueueR439';

const a = createResolutionQueueItemR439({
  sourceHash: 'hash-a', sourceFileName: 'a.png', observation: { sourceHash: 'hash-a', playerName: 'Cristiano Ronaldo', mainPosition: 'CF' },
  resolution: { status: 'AMBIGUOUS', action: 'CHOOSE_CANDIDATE', reason: 'MULTIPLE_CANDIDATES', selectedCatalogCardId: null, confidence: 60,
    candidates: [
      { catalogCardId: 'cr7-a', score: 60, reasons: ['nome exato'], completeness: 'COMPLETE' },
      { catalogCardId: 'cr7-b', score: 60, reasons: ['nome exato'], completeness: 'COMPLETE' }
    ] }
});
assert.equal(a.status, 'PENDING');
assert.equal(a.candidateIds.length, 2);

const same = createResolutionQueueItemR439({
  sourceHash: 'hash-a', sourceFileName: 'a-novo.png', observation: { sourceHash: 'hash-a', playerName: 'Cristiano Ronaldo', mainPosition: 'CF' }, resolution: a.resolution
});
const merged = mergeResolutionQueueItemR439(a, same);
assert.equal(merged.id, a.id);
assert.equal(merged.sourceFileName, 'a-novo.png');

const selected = resolveQueueCandidateR439(merged, 'cr7-b');
assert.equal(selected.status, 'RESOLVED');
assert.equal(selected.selectedCatalogCardId, 'cr7-b');

const b = createResolutionQueueItemR439({ sourceHash: 'hash-b', sourceFileName: 'b.png', observation: { sourceHash: 'hash-b', playerName: '', mainPosition: null }, resolution: { status: 'NEEDS_REVIEW', action: 'REVIEW_IDENTITY', reason: 'IDENTITY_INSUFFICIENT', selectedCatalogCardId: null, confidence: 0, candidates: [] } });
const summary = resolutionQueueSummaryR439([selected, b]);
assert.deepEqual(summary, { total: 2, pending: 1, resolved: 1, newCards: 0, needsReview: 1 });

console.log('R439 fila aprovada: ambiguidade persiste por hash, seleção manual é auditável e resumo é determinístico.');
