import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyR428R424R425FixtureRepair, patchR424R425FixtureR428 } from '../scripts/apply-r428-r424-r425-fixture-repair.mjs';

const legacy = "w('supabase/migrations/202607160001_security_hardening_v2675.sql','R425_AUTHORIZATION_METADATA_FAIL_CLOSED');";
const repaired = patchR424R425FixtureR428(`before\n${legacy}\nafter\n`);
assert.doesNotMatch(repaired, /security_hardening_v2675\.sql','R425_AUTHORIZATION_METADATA_FAIL_CLOSED'\);/);
for (const marker of [
  'revoke all on function public.buildmaster_take_admin_rate_limit',
  'grant execute on function public.buildmaster_take_admin_rate_limit',
  'revoke all on function public.buildmaster_register_secure_device',
  'grant execute on function public.buildmaster_register_secure_device',
]) assert.match(repaired, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r428-'));
fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
const target = path.join(root, 'tests/v40-80-r424-final-requirements-closure-regression.mjs');
fs.writeFileSync(target, `seed();\n${legacy}\n`, 'utf8');

const first = applyR428R424R425FixtureRepair(root);
assert.equal(first.changed, true);
assert.deepEqual(first.patched, ['tests/v40-80-r424-final-requirements-closure-regression.mjs']);
const fixed = fs.readFileSync(target, 'utf8');
assert.match(fixed, /R425_AUTHORIZATION_METADATA_FAIL_CLOSED revoke all on function public\.buildmaster_take_admin_rate_limit/);

const second = applyR428R424R425FixtureRepair(root);
assert.equal(second.changed, false, 'R428 deve ser idempotente');
assert.deepEqual(second.patched, []);

console.log('R428 aprovada: a fixture R424 representa os quatro contratos SECURITY DEFINER exigidos pela auditoria R425.');
