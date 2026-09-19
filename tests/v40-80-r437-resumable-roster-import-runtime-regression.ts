import assert from 'node:assert/strict';
import {
  batchRosterImportRemainingR437,
  batchRosterImportSummaryR437,
  createBatchRosterImportStatsR437,
  findImportedRosterCardBySourceHashR437,
  pauseBatchRosterImportR437,
  recordBatchRosterImportOutcomeR437
} from '../src/modules/squad-mapping/batchRosterImportR437';

const players = [
  { id: 'a', sourceHash: 'HASH-001' },
  { id: 'b', sourceHash: 'hash-002' },
  { id: 'c', sourceHash: '' }
];

assert.equal(findImportedRosterCardBySourceHashR437(players, 'hash-001')?.id, 'a');
assert.equal(findImportedRosterCardBySourceHashR437(players, ' HASH-002 ')?.id, 'b');
assert.equal(findImportedRosterCardBySourceHashR437(players, 'hash-003'), null);
assert.equal(findImportedRosterCardBySourceHashR437(players, ''), null);

let stats = createBatchRosterImportStatsR437(222);
for (let index = 0; index < 120; index += 1) stats = recordBatchRosterImportOutcomeR437(stats, 'created');
for (let index = 0; index < 95; index += 1) stats = recordBatchRosterImportOutcomeR437(stats, 'skipped');
for (let index = 0; index < 5; index += 1) stats = recordBatchRosterImportOutcomeR437(stats, 'updated');
for (let index = 0; index < 2; index += 1) stats = recordBatchRosterImportOutcomeR437(stats, 'failed');

assert.equal(stats.processed, 222);
assert.equal(stats.created, 120);
assert.equal(stats.skipped, 95);
assert.equal(stats.updated, 5);
assert.equal(stats.failed, 2);
assert.equal(batchRosterImportRemainingR437(stats), 0);
assert.match(batchRosterImportSummaryR437(stats), /95 já existente\(s\) pulada\(s\) sem OCR/);

let partial = createBatchRosterImportStatsR437(222);
for (let index = 0; index < 71; index += 1) partial = recordBatchRosterImportOutcomeR437(partial, 'created');
partial = pauseBatchRosterImportR437(partial);
assert.equal(partial.paused, true);
assert.equal(batchRosterImportRemainingR437(partial), 151);
assert.match(batchRosterImportSummaryR437(partial), /Selecione os mesmos arquivos novamente para continuar/);
assert.match(batchRosterImportSummaryR437(partial), /151 restante\(s\)/);

console.log('R437 runtime aprovado: lote 222 retomável por hash, pausa segura e duplicatas puladas antes do OCR.');
