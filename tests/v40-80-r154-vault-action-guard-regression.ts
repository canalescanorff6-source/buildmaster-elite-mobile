import assert from 'node:assert/strict';
import {
  createVaultActionGuardR154,
  VAULT_ACTION_GUARD_R154_VERSION,
} from '../src/modules/vault/vaultActionGuardR154';

assert.equal(VAULT_ACTION_GUARD_R154_VERSION, '40.80-r154-vault-action-guard-v1');

const guard = createVaultActionGuardR154();
assert.equal(guard.snapshot().activeCount, 0);

assert.equal(guard.tryAcquire('favorite:player-a'), true, 'Primeiro toque deve adquirir a ação.');
assert.equal(guard.tryAcquire('favorite:player-a'), false, 'Segundo toque idêntico deve ser bloqueado enquanto o primeiro está ativo.');
assert.equal(guard.isActive('favorite:player-a'), true);
assert.deepEqual(guard.snapshot(), { activeKeys: ['favorite:player-a'], activeCount: 1 });

assert.equal(guard.tryAcquire('status:player-a'), true, 'Ações semanticamente diferentes podem continuar entrando na fila canônica.');
assert.deepEqual(guard.snapshot(), {
  activeKeys: ['favorite:player-a', 'status:player-a'],
  activeCount: 2,
});

guard.release('favorite:player-a');
assert.equal(guard.isActive('favorite:player-a'), false);
assert.equal(guard.tryAcquire('favorite:player-a'), true, 'Depois da confirmação, a mesma ação deve poder ser executada novamente.');

guard.release('favorite:player-a');
guard.release('status:player-a');
assert.equal(guard.snapshot().activeCount, 0);

assert.throws(() => guard.tryAcquire('   '), /chave estável/i, 'Chave vazia não pode criar uma trava global acidental.');

console.log('R154 aprovado: ações idênticas são bloqueadas durante o commit sem impedir ações diferentes nem criar nova autoridade de persistência.');
