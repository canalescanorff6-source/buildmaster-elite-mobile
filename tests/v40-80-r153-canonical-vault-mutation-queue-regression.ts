import assert from 'node:assert/strict';
import {
  createVaultCanonicalMutationQueueR153,
  VAULT_CANONICAL_MUTATION_QUEUE_R153_VERSION,
} from '../src/modules/vault/vaultCanonicalMutationQueueR153';
import type { SavedAnalysis } from '../src/modules/vault/cardHistoryStore';
import type { VaultHistoryCommitR140 } from '../src/modules/vault/vaultPersistenceCoordinatorR140';

(async () => {
const saved = (id: string): SavedAnalysis => ({
  id,
  saveKey: `key-${id}`,
  savedAt: '04/09/2026, 22:00:00',
  updatedAt: '04/09/2026, 22:00:00',
  rawText: '',
  playerImage: null,
  fullPreview: null,
  result: {} as SavedAnalysis['result'],
  skillProgress: {},
  notes: '',
  favorite: false,
  personalTags: [],
  tacticalRoleNote: '',
  changeLog: [],
});

assert.equal(VAULT_CANONICAL_MUTATION_QUEUE_R153_VERSION, '40.80-r153-canonical-local-mutation-v1');

const initial = [saved('a'), saved('b')];
const coordinator = createVaultCanonicalMutationQueueR153(initial);
const committedSnapshots: SavedAnalysis[][] = [];
let commitIndex = 0;

async function commit(items: SavedAnalysis[]): Promise<VaultHistoryCommitR140> {
  const index = commitIndex++;
  if (index === 0) await new Promise((resolve) => setTimeout(resolve, 20));
  const snapshot = items.map((item) => ({ ...item }));
  committedSnapshots.push(snapshot);
  return {
    ok: true,
    history: snapshot,
    persistence: { saved: true, backend: 'indexeddb', items: snapshot.length },
    error: null,
  };
}

const first = coordinator.run(
  initial,
  (current) => ({
    nextHistory: current.map((item) => item.id === 'a' ? { ...item, favorite: true } : item),
    value: 'favorite',
  }),
  commit,
);

const second = coordinator.run(
  initial,
  (current) => ({
    nextHistory: current.map((item) => item.id === 'a' ? { ...item, folderId: 'zagueiros' } : item),
    value: 'folder',
  }),
  commit,
);

const [firstResult, secondResult] = await Promise.all([first, second]);
assert.equal(firstResult.ok, true);
assert.equal(secondResult.ok, true);
assert.equal(committedSnapshots.length, 2);
assert.equal(committedSnapshots[0][0].favorite, true, 'Primeira mutação precisa ser confirmada.');
assert.equal(committedSnapshots[1][0].favorite, true, 'Segunda mutação não pode apagar a primeira por snapshot antigo.');
assert.equal(committedSnapshots[1][0].folderId, 'zagueiros', 'Segunda mutação deve ser recalculada sobre o último estado confirmado.');
assert.equal(coordinator.readCanonical()[0].favorite, true);
assert.equal(coordinator.readCanonical()[0].folderId, 'zagueiros');

let shouldFail = true;
async function commitWithFailure(items: SavedAnalysis[]): Promise<VaultHistoryCommitR140> {
  if (shouldFail) {
    shouldFail = false;
    return {
      ok: false,
      history: items,
      persistence: { saved: false, backend: 'none', items: 0, error: 'falha simulada' },
      error: 'falha simulada',
    };
  }
  return {
    ok: true,
    history: items,
    persistence: { saved: true, backend: 'indexeddb', items: items.length },
    error: null,
  };
}

const failed = await coordinator.run(
  initial,
  (current) => ({ nextHistory: current.map((item) => item.id === 'a' ? { ...item, notes: 'não deve virar canônico' } : item) }),
  commitWithFailure,
);
assert.equal(failed.ok, false);
assert.equal(coordinator.readCanonical()[0].notes, '', 'Commit recusado não pode contaminar o snapshot canônico.');

const recovered = await coordinator.run(
  initial,
  (current) => ({ nextHistory: current.map((item) => item.id === 'a' ? { ...item, statusTag: 'completo' as const } : item) }),
  commitWithFailure,
);
assert.equal(recovered.ok, true, 'Fila deve continuar funcionando após uma falha.');
assert.equal(coordinator.readCanonical()[0].favorite, true, 'Recuperação deve preservar alterações anteriores confirmadas.');
assert.equal(coordinator.readCanonical()[0].folderId, 'zagueiros');
assert.equal(coordinator.readCanonical()[0].statusTag, 'completo');

console.log('R153 aprovado: transformação + commit do Cofre são serializados sobre o último snapshot canônico confirmado.');

})().catch((error) => { console.error(error); process.exitCode = 1; });
