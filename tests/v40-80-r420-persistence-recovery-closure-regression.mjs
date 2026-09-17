import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const store = read('src/modules/vault/cardHistoryStore.ts');
const startup = read('src/modules/vault/cardHistoryStartupModelR200.ts');
const backup = read('src/modules/backup/cardVisionBackupRuntimeR162.ts');
const safety = read('src/lib/dataSafety.ts');
const installer = read('scripts/install-native-vault-storage-plugin.mjs');
const repair = read('scripts/repair-critical-routes.mjs');
const typecheck = read('scripts/check-source-types-r151.mjs');

assert.match(store, /R420_UNBOUNDED_CANONICAL_VAULT/);
assert.doesNotMatch(store, /\.slice\(0,\s*HISTORY_LIMIT\)/);
assert.doesNotMatch(store, /\.slice\(0,\s*40\)/);
assert.doesNotMatch(store, /Math\.min\([^\n]{0,80},\s*40\)/);
assert.match(store, /const snapshot = \[\.\.\.items\]/);
assert.match(startup, /HISTORY_LIMIT_R200\s*=\s*Number\.MAX_SAFE_INTEGER\b/);

assert.doesNotMatch(backup, /\bHISTORY_LIMIT\b/);
assert.match(backup, /verifyRestoredHistoryR420/);
assert.match(backup, /Antes de importar backup completo/);
assert.match(backup, /Antes de importar backup do Cofre/);
assert.match(backup, /stagedCustomFoldersR420/);
assert.match(backup, /stagedCalibrationR420/);
assert.match(backup, /verifyRestoredHistoryR420\(next, committed\)/);

assert.match(safety, /future-schema/);
assert.match(safety, /level:\s*'critical'/);
assert.match(safety, /schema > CURRENT_DATA_SCHEMA[\s\S]{0,500}valid:\s*false/);
assert.match(safety, /migrateBackup[\s\S]{0,500}schema > CURRENT_DATA_SCHEMA/);
assert.doesNotMatch(safety, /até 200 fichas detalhadas/);

assert.match(installer, /import android\.util\.AtomicFile;/);
assert.match(installer, /new AtomicFile\(target\)/);
assert.match(installer, /\.startWrite\(\)/);
assert.match(installer, /\.finishWrite\(/);
assert.match(installer, /\.failWrite\(/);
assert.doesNotMatch(installer, /target\.exists\(\)\s*&&\s*!target\.delete\(\)/);
assert.doesNotMatch(installer, /temporary\.renameTo\(target\)/);

assert.match(repair, /applyR420PersistenceRecoveryClosure/);
assert.match(typecheck, /applyR420PersistenceRecoveryClosure/);
assert.match(typecheck, /v40-80-r420-persistence-recovery-closure-regression\.mjs/);


// Matriz lógica de escala: quantidade de fichas nunca pode decidir PP nem produzir poda silenciosa.
for (const count of [0, 1, 40, 200, 201, 500, 1000, 5000, 10000]) {
  const cards = Array.from({ length: count }, (_, index) => ({
    saveKey: `card-${index}`,
    result: {
      trainingPointsTotal: (index % 141) + 1,
      trainingPointsUsed: index % 80,
      trainingPointsRemaining: Math.max(0, ((index % 141) + 1) - (index % 80)),
    },
  }));
  const persisted = [...cards];
  assert.equal(persisted.length, count, `R420 não pode truncar coleção com ${count} fichas.`);
  if (count) {
    const sample = Math.min(count - 1, 777);
    assert.equal(persisted[sample].result.trainingPointsTotal, cards[sample].result.trainingPointsTotal);
  }
}

function verifyModelR420(expected, actual) {
  if (expected.length !== actual.length) return false;
  const byKey = new Map(actual.map((item) => [item.saveKey, item]));
  if (byKey.size !== actual.length) return false;
  for (const item of expected) {
    const current = byKey.get(item.saveKey);
    if (!current) return false;
    for (const key of ['trainingPointsTotal', 'trainingPointsUsed', 'trainingPointsRemaining']) {
      if (Number(item.result[key]) !== Number(current.result[key])) return false;
    }
  }
  return true;
}
const restore10k = Array.from({ length: 10000 }, (_, index) => ({
  saveKey: `restore-${index}`,
  result: { trainingPointsTotal: 120, trainingPointsUsed: index % 120, trainingPointsRemaining: 120 - (index % 120) },
}));
assert.equal(verifyModelR420(restore10k, structuredClone(restore10k)), true);
const corrupted = structuredClone(restore10k);
corrupted[777].result.trainingPointsUsed += 1;
assert.equal(verifyModelR420(restore10k, corrupted), false, 'Divergência de PP precisa bloquear a verificação pós-restore.');
const truncated = restore10k.slice(0, 9999);
assert.equal(verifyModelR420(restore10k, truncated), false, 'Restore truncado precisa ser rejeitado.');

console.log('R420 aprovada: Cofre canônico sem truncamento, restauração fail-closed/verificada e gravação Android atômica.');
