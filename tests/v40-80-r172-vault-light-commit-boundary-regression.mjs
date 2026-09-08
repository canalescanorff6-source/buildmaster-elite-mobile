import assert from 'node:assert/strict';
import fs from 'node:fs';

const coordinator = fs.readFileSync('src/modules/vault/useCardVisionVaultCoordinatorR153.ts', 'utf8');
const queue = fs.readFileSync('src/modules/vault/vaultCanonicalMutationQueueR153.ts', 'utf8');
const lightCommit = fs.readFileSync('src/modules/vault/vaultHistoryCommitR172.ts', 'utf8');
const r140 = fs.readFileSync('src/modules/vault/vaultPersistenceCoordinatorR140.ts', 'utf8');

assert.match(lightCommit, /VAULT_HISTORY_COMMIT_R172_VERSION/, 'R172: fronteira leve deve possuir versão explícita.');
assert.match(lightCommit, /export async function commitVaultHistoryR140\(/, 'R172: commit confirmado R140 deve existir na fronteira leve.');
assert.match(lightCommit, /const snapshot = nextHistory\.slice\(\);/, 'R172: commit deve preservar snapshot defensivo antes da persistência.');
assert.match(lightCommit, /const writer = persist \?\? \(await import\('\.\/cardHistoryStore'\)\)\.persistHistoryStore;/, 'R172/R200: writer local deve continuar sendo cardHistoryStore, agora carregável sob demanda.');
assert.match(lightCommit, /const persistence = await writer\(snapshot\);/, 'R172: UI só pode adotar após confirmação do writer local.');
assert.match(lightCommit, /persistence\.saved[\s\S]*?ok: true[\s\S]*?ok: false/, 'R172: sucesso e falha devem continuar dependentes do resultado real da persistência.');
assert.match(coordinator, /import \{ commitVaultHistoryR140 \} from ['"]\.\/vaultHistoryCommitR172['"]/, 'R172: coordenador R153 deve consumir a autoridade leve diretamente.');
assert.doesNotMatch(coordinator, /from ['"]\.\/vaultPersistenceCoordinatorR140['"]/, 'R172: restauração crítica R140 completa não pode voltar ao startup do coordenador.');
assert.match(coordinator, /queueRef\.current\.run\(input\.history, mutate, commitVaultHistoryR140\)/, 'R172: fila R153 continua delegando o único commit local a commitVaultHistoryR140.');
assert.match(queue, /import type \{ VaultHistoryCommitR140 \} from ['"]\.\/vaultHistoryCommitR172['"]/, 'R172: fila deve depender apenas do contrato leve de commit.');
assert.match(r140, /export \{ commitVaultHistoryR140, type VaultHistoryCommitR140 \} from ['"]\.\/vaultHistoryCommitR172['"]/, 'R172: API histórica R140 deve continuar disponível por reexport.');
assert.match(r140, /export async function commitCriticalVaultRestoreR140\(/, 'R172: restauração crítica R140 não pode ser removida nem simplificada.');
assert.match(r140, /persistMatchValidationRepositoryR137/, 'R172: rollback crítico de partidas deve continuar na autoridade R140 completa.');

console.log('R172 aprovada: commit local confirmado saiu da restauração crítica pesada sem alterar fila R153, writer R140 ou rollback de partidas.');
