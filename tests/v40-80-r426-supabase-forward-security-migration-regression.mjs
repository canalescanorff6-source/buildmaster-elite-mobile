import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/202609160001_r426_security_finalization.sql';
assert.equal(fs.existsSync(migrationPath), true, 'R426: migration forward-only de segurança ainda não existe.');
const sql = fs.readFileSync(migrationPath, 'utf8');

assert.match(sql, /R426_FORWARD_SECURITY_FINALIZATION/);
assert.match(sql, /admin_mfa_required\s*=\s*true/i);
assert.match(sql, /check\s*\(\s*admin_mfa_required\s+is\s+true\s*\)/i);
assert.match(sql, /check\s*\(\s*require_device_proof\s+is\s+true\s*\)/i);
assert.match(sql, /check\s*\(\s*allow_legacy_clients\s+is\s+false\s*\)/i);
assert.doesNotMatch(sql, /raw_user_meta_data->>'(?:plan|expires_at|max_devices|offline_grace_hours)'/i);
assert.match(sql, /create\s+or\s+replace\s+function\s+public\.buildmaster_handle_new_auth_user/i);
assert.match(sql, /'premium'\s*,\s*null\s*,\s*1\s*,\s*4/s);
assert.match(sql, /revoke\s+all\s+on\s+table[\s\S]*buildmaster_security_settings[\s\S]*from\s+anon\s*,\s*authenticated/i);
assert.match(sql, /grant\s+select\s+on\s+table[\s\S]*buildmaster_profiles[\s\S]*buildmaster_devices[\s\S]*to\s+authenticated/i);
assert.match(sql, /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table[\s\S]*user_vault_snapshots[\s\S]*to\s+authenticated/i);
assert.doesNotMatch(sql, /grant\s+all[\s\S]*to\s+(?:anon|authenticated)/i);
assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.buildmaster_register_secure_device/i);
assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.buildmaster_register_secure_device[\s\S]*to\s+service_role/i);
assert.match(sql, /commit\s*;/i);


const { auditR426SupabaseForwardSecurityMigration } = await import(new URL('../scripts/check-r426-supabase-forward-security-migration.mjs', import.meta.url));
const os = await import('node:os');
const path = await import('node:path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r426-later-'));
fs.mkdirSync(path.join(tmp, 'supabase/migrations'), { recursive: true });
fs.copyFileSync(migrationPath, path.join(tmp, migrationPath));
let report = auditR426SupabaseForwardSecurityMigration(tmp);
assert.equal(report.ok, true, report.issues.join('\n'));
fs.writeFileSync(path.join(tmp, 'supabase/migrations/202609170001_regression.sql'), 'update public.buildmaster_security_settings set admin_mfa_required = false where id = 1;\n');
report = auditR426SupabaseForwardSecurityMigration(tmp);
assert.equal(report.ok, false, 'R426 precisa reprovar downgrade em migration posterior.');
assert.ok(report.issues.some((issue) => issue.includes('desligar MFA')));

console.log('R426 aprovada: migration forward-only impede downgrade de MFA/device-proof, fixa defaults seguros e reasserta grants mínimos.');
