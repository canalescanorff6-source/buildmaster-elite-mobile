import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EXPECTED_FULL_GROUPS,
  quickChecks,
  fullChecks,
  selectChecksForShard,
  parseShardArgs,
} from '../scripts/ci-doctor-config.mjs';

assert.equal(EXPECTED_FULL_GROUPS, 98, 'R534 deve preservar exatamente 98 grupos no diagnóstico full');
const allChecks = [...quickChecks, ...fullChecks];
assert.equal(allChecks.length, EXPECTED_FULL_GROUPS, 'lista canônica deve conter 98 grupos');

const shards = Array.from({ length: 4 }, (_, shardIndex) =>
  selectChecksForShard(allChecks, shardIndex, 4),
);
const allLabels = allChecks.map(([label]) => label);
const shardLabels = shards.map((checks) => checks.map(([label]) => label));
const union = shardLabels.flat();

assert.equal(union.length, EXPECTED_FULL_GROUPS, 'união dos 4 shards deve executar 98 grupos');
assert.equal(new Set(union).size, EXPECTED_FULL_GROUPS, 'nenhum grupo pode ser duplicado entre shards');

const doctorSource = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const legacyMirrorLabels = [...doctorSource.matchAll(/^\s*\['([^']+)',\s*\['run',\s*'[^']+'\]\],?\s*$/gm)].map((match) => match[1]);
assert.equal(legacyMirrorLabels.length, EXPECTED_FULL_GROUPS, 'espelho histórico do ci-doctor deve manter 98 grupos');
assert.deepEqual(legacyMirrorLabels, allLabels, 'espelho histórico deve refletir exatamente a lista canônica, na mesma ordem');
assert.match(doctorSource, /const\s+EXPECTED_FULL_GROUPS\s*=\s*98\s*;/, 'contrato histórico deve continuar expondo EXPECTED_FULL_GROUPS=98');
assert.deepEqual([...new Set(union)].sort(), [...allLabels].sort(), 'nenhum grupo pode ser omitido');

for (let a = 0; a < shardLabels.length; a += 1) {
  for (let b = a + 1; b < shardLabels.length; b += 1) {
    const intersection = shardLabels[a].filter((label) => shardLabels[b].includes(label));
    assert.deepEqual(intersection, [], `shards ${a} e ${b} devem ser disjuntos`);
  }
}

const shardsAgain = Array.from({ length: 4 }, (_, shardIndex) =>
  selectChecksForShard(allChecks, shardIndex, 4).map(([label]) => label),
);
assert.deepEqual(shardsAgain, shardLabels, 'partição deve ser determinística');

assert.deepEqual(parseShardArgs(['node', 'ci-doctor.mjs']), { shardIndex: null, shardCount: null });
assert.deepEqual(parseShardArgs(['node', 'ci-doctor.mjs', '--shard-index', '2', '--shard-count', '4']), { shardIndex: 2, shardCount: 4 });

for (const argv of [
  ['node', 'ci-doctor.mjs', '--shard-index', '0'],
  ['node', 'ci-doctor.mjs', '--shard-count', '4'],
  ['node', 'ci-doctor.mjs', '--shard-index', '-1', '--shard-count', '4'],
  ['node', 'ci-doctor.mjs', '--shard-index', '4', '--shard-count', '4'],
  ['node', 'ci-doctor.mjs', '--shard-index', '1.5', '--shard-count', '4'],
  ['node', 'ci-doctor.mjs', '--shard-index', '1', '--shard-count', '0'],
]) {
  assert.throws(() => parseShardArgs(argv), /shard/i, `argumentos inválidos devem falhar fechado: ${argv.join(' ')}`);
}

console.log('R534 sharding aprovado: 98 grupos preservados, 4 shards disjuntos/determinísticos e argumentos inválidos fail-closed.');
