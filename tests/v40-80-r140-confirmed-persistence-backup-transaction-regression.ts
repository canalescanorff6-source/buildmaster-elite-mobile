import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import type { SavedAnalysis, HistoryPersistenceResult } from '../src/modules/vault/cardHistoryStore';
import {
  commitCriticalVaultRestoreR140,
  commitVaultHistoryR140
} from '../src/modules/vault/vaultPersistenceCoordinatorR140';

async function main() {
  const fakeHistory = [{ id: 'h1' } as SavedAnalysis];
  const nextHistory = [{ id: 'h2' } as SavedAnalysis];
  const previousMatch = {
    id: 'm-old', cardFingerprint: 'card-a', playerName: 'Teste', targetPosition: 'CB', formation: 'AUTO', teamStyle: 'AUTO',
    buildName: 'A', buildSignature: 'a', playedAt: '2026-09-04T10:00:00.000Z', minutes: 90,
    overallRating: 3, passing: 3, movement: 3, finishing: 3, defending: 3, physical: 3, stamina: 3, tags: [], note: ''
  } as MatchValidationRecord;
  const nextMatch = { ...previousMatch, id: 'm-new', buildSignature: 'b', playedAt: '2026-09-04T11:00:00.000Z' } as MatchValidationRecord;

  const savedOk: HistoryPersistenceResult = { saved: true, backend: 'indexeddb', items: 1 };
  const savedFail: HistoryPersistenceResult = { saved: false, backend: 'none', items: 0, error: 'storage recusou' };

  const normalCommit = await commitVaultHistoryR140(nextHistory, async () => savedOk);
  assert.equal(normalCommit.ok, true);
  assert.equal(normalCommit.history[0]?.id, 'h2');

  const rejectedCommit = await commitVaultHistoryR140(nextHistory, async () => savedFail);
  assert.equal(rejectedCommit.ok, false);
  assert.match(rejectedCommit.error ?? '', /storage recusou/);

  let historyWrites = 0;
  let matchWrites: MatchValidationRecord[][] = [];
  const matchRejected = await commitCriticalVaultRestoreR140({
    currentHistory: fakeHistory,
    nextHistory,
    nextMatchValidation: [nextMatch]
  }, {
    persistHistory: async () => { historyWrites += 1; return savedOk; },
    readMatches: () => [previousMatch],
    writeMatches: (records) => {
      matchWrites.push(records);
      return { version: '40.80-r137-account-scoped-match-repository-v1', records, persisted: false, revision: 'x' };
    }
  });
  assert.equal(matchRejected.ok, false);
  assert.equal(historyWrites, 0, 'Cofre não pode ser alterado se a restauração de partidas falhar primeiro.');
  assert.equal(matchWrites.length, 1);

  historyWrites = 0;
  matchWrites = [];
  const rollback = await commitCriticalVaultRestoreR140({
    currentHistory: fakeHistory,
    nextHistory,
    nextMatchValidation: [nextMatch]
  }, {
    persistHistory: async () => { historyWrites += 1; return savedFail; },
    readMatches: () => [previousMatch],
    writeMatches: (records) => {
      matchWrites.push(records);
      return { version: '40.80-r137-account-scoped-match-repository-v1', records, persisted: true, revision: `r${matchWrites.length}` };
    }
  });
  assert.equal(rollback.ok, false);
  assert.equal(historyWrites, 1);
  assert.equal(rollback.rolledBackMatches, true, 'Falha do Cofre deve restaurar as partidas anteriores.');
  assert.equal(matchWrites.length, 2, 'Deve haver commit novo + rollback.');
  assert.equal(matchWrites[0]?.[0]?.id, 'm-new');
  assert.equal(matchWrites[1]?.[0]?.id, 'm-old');

  historyWrites = 0;
  matchWrites = [];
  const success = await commitCriticalVaultRestoreR140({
    currentHistory: fakeHistory,
    nextHistory,
    nextMatchValidation: [nextMatch]
  }, {
    persistHistory: async (items) => { historyWrites += 1; assert.equal(items[0]?.id, 'h2'); return savedOk; },
    readMatches: () => [previousMatch],
    writeMatches: (records) => {
      matchWrites.push(records);
      return { version: '40.80-r137-account-scoped-match-repository-v1', records, persisted: true, revision: 'ok' };
    }
  });
  assert.equal(success.ok, true);
  assert.equal(success.history[0]?.id, 'h2');
  assert.equal(success.matches[0]?.id, 'm-new');
  assert.equal(historyWrites, 1);
  assert.equal(matchWrites.length, 1);

  const root = path.resolve(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
  const backupRuntime = fs.readFileSync(path.join(root, 'src/modules/backup/cardVisionBackupRuntimeR162.ts'), 'utf8');
  assert.match(backupRuntime, /commitCriticalVaultRestoreR140/);
  assert.match(backupRuntime, /commitVaultHistoryR140/);
  assert.doesNotMatch(app, /replaceMatchValidationRepositoryR137/);
  assert.doesNotMatch(app, /setHistory\(transaction\.nextHistory\);\s*setStatus\('Salvando a ficha/,
    'Salvar ficha não pode anunciar estado no Cofre antes da persistência confirmada.');
  assert.doesNotMatch(app, /const next = mergeHistoryLists\(cloudItems, current\);\s*void persistHistoryStore\(next\)/,
    'Pull da nuvem não pode adotar history antes da gravação local.');
  assert.match(backupRuntime, /const criticalRestore = await commitCriticalVaultRestoreR140\([\s\S]*?if \(!criticalRestore\.ok\) throw new Error/,
    'Restore integral deve passar por commit crítico antes das demais mutações.');

  console.log('r140 aprovada: Cofre só é adotado após persistência confirmada e restore crítico faz rollback de partidas quando a gravação do Cofre falha.');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
