import assert from 'node:assert/strict';
import { createObjectUrlLeaseR156 } from '../src/modules/images/objectUrlLeaseR156';

const created: string[] = [];
const revoked: string[] = [];
let sequence = 0;
const runtime = {
  createObjectURL(_blob: Blob) {
    const value = `blob:r156-${++sequence}`;
    created.push(value);
    return value;
  },
  revokeObjectURL(url: string) {
    revoked.push(url);
  }
};

const lease = createObjectUrlLeaseR156(runtime);
const first = lease.replace(new Blob(['first']));
assert.equal(lease.current(), first);
assert.deepEqual(revoked, []);

const second = lease.replace(new Blob(['second']));
assert.equal(lease.current(), second);
assert.deepEqual(revoked, [first], 'Trocar a imagem deve revogar imediatamente a URL anterior.');

lease.release();
assert.equal(lease.current(), null);
assert.deepEqual(revoked, [first, second], 'Release deve revogar a URL ativa.');
lease.release();
assert.deepEqual(revoked, [first, second], 'Release repetido deve ser idempotente.');

const third = lease.replace(new Blob(['third']));
assert.equal(lease.current(), third);
lease.release();
assert.deepEqual(revoked, [first, second, third]);
assert.equal(new Set(revoked).size, revoked.length, 'Nenhuma URL deve ser revogada duas vezes pela lease R156.');
assert.equal(created.length, 3);

console.log('R156 aprovado: lease de object URLs revoga exatamente a posse ativa e é idempotente.');
