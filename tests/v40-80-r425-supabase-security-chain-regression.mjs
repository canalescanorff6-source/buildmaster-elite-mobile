import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = path.resolve('scripts/apply-r425-supabase-security-chain.mjs');
assert.equal(fs.existsSync(modulePath), true, 'R425: rotina de convergência da cadeia Supabase ainda não existe.');
const { applyR425SupabaseSecurityChain, auditR425SupabaseSecurityChain } = await import(pathToFileURL(modulePath).href);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r425-'));
const write = (relative, content) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

write('supabase/migrations/202607140001_buildmaster_accounts.sql', `
create or replace function public.buildmaster_handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$ begin
insert into public.buildmaster_profiles(id,plan,expires_at,max_devices,offline_grace_hours) values (
new.id,
coalesce(nullif(new.raw_user_meta_data->>'plan', ''), 'premium'),
nullif(new.raw_user_meta_data->>'expires_at', '')::timestamptz,
greatest(1, least(10, coalesce((new.raw_user_meta_data->>'max_devices')::integer, 1))),
greatest(0, least(168, coalesce((new.raw_user_meta_data->>'offline_grace_hours')::integer, 24)))
); return new; end; $$;
`);
write('supabase/migrations/202607160001_security_hardening_v2675.sql', `
create table public.buildmaster_security_settings(admin_mfa_required boolean not null default true);
create or replace function public.buildmaster_handle_new_auth_user() returns trigger language plpgsql security definer set search_path = public as $$ begin
insert into public.buildmaster_profiles(id,plan,expires_at,max_devices,offline_grace_hours) values (
new.id,
coalesce(nullif(new.raw_user_meta_data->>'plan', ''), 'premium'),
nullif(new.raw_user_meta_data->>'expires_at', '')::timestamptz,
greatest(1, least(10, coalesce((new.raw_user_meta_data->>'max_devices')::integer, 1))),
greatest(0, least(24, coalesce((new.raw_user_meta_data->>'offline_grace_hours')::integer, 4)))
); return new; end; $$;
revoke all on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) to service_role;
revoke all on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) from public, anon, authenticated;
grant execute on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) to service_role;
`);
write('supabase/migrations/202607250001_blocks25_27_community_commercial.sql', `
alter table public.buildmaster_commercial_plans enable row level security;
alter table public.buildmaster_commercial_licenses enable row level security;
alter table public.buildmaster_commercial_ledger enable row level security;
alter table public.buildmaster_terms_acceptances enable row level security;
alter table public.buildmaster_lgpd_requests enable row level security;
alter table public.buildmaster_community_profiles enable row level security;
alter table public.buildmaster_community_packages enable row level security;
alter table public.buildmaster_community_ratings enable row level security;
alter table public.buildmaster_community_comments enable row level security;
alter table public.buildmaster_community_reports enable row level security;
create policy p1 on public.buildmaster_commercial_plans for select to authenticated using (true);
create policy p2 on public.buildmaster_terms_acceptances for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
`);
write('supabase/migrations/202607250002_block28_play_publication.sql', `
alter table public.buildmaster_public_deletion_requests enable row level security;
alter table public.buildmaster_play_integrity_audit enable row level security;
create policy p3 on public.buildmaster_public_deletion_requests for select to authenticated using (user_id=auth.uid());
create policy p4 on public.buildmaster_play_integrity_audit for select to authenticated using (user_id=auth.uid());
`);
write('supabase/migrations/202607280001_account_recovery_v3171.sql', `
do $$ declare has_verified_admin_factor boolean := false; begin update public.buildmaster_security_settings set admin_mfa_required = has_verified_admin_factor, updated_at = now() where id = 1; end $$;
`);
write('supabase/migrations/202607280002_restore_account_creation_v3173.sql', `
insert into public.buildmaster_security_settings(id,min_app_version,allow_legacy_clients,require_device_proof,admin_mfa_required,user_offline_grace_hours,admin_offline_grace_hours,updated_at)
values (1,'29.00.0',false,true,false,4,12,now())
on conflict (id) do update set admin_mfa_required = false, require_device_proof = true, updated_at = now();
`);
write('supabase/functions/admin-users/index.ts', `const settings={admin_mfa_required: false};\nconst allowedActions=['health','restore_account_creation','list'];\nif (action === 'restore_account_creation') { await service.from('buildmaster_security_settings').update({admin_mfa_required:false}); }\nif(settings.admin_mfa_required && aal!=='aal2') throw new Error('MFA');`);

const before = auditR425SupabaseSecurityChain(root);
assert.equal(before.ok, false, 'R425: fixture insegura precisa reprovar antes da convergência.');
assert.ok(before.issues.some((issue) => issue.includes('raw_user_meta_data')));
assert.ok(before.issues.some((issue) => issue.includes('MFA')));
assert.ok(before.issues.some((issue) => issue.includes('GRANT')));

const first = applyR425SupabaseSecurityChain(root);
assert.equal(first.changed, true);
const after = auditR425SupabaseSecurityChain(root);
assert.equal(after.ok, true, after.issues.join('\n'));

for (const migration of ['202607140001_buildmaster_accounts.sql','202607160001_security_hardening_v2675.sql']) {
  const source = read(`supabase/migrations/${migration}`);
  for (const field of ['plan','expires_at','max_devices','offline_grace_hours']) {
    assert.doesNotMatch(source, new RegExp(`raw_user_meta_data->>'${field}'`));
  }
}
assert.doesNotMatch(read('supabase/migrations/202607280001_account_recovery_v3171.sql'), /admin_mfa_required\s*=\s*has_verified_admin_factor/);
assert.doesNotMatch(read('supabase/migrations/202607280002_restore_account_creation_v3173.sql'), /admin_mfa_required\s*=\s*false/);
assert.doesNotMatch(read('supabase/functions/admin-users/index.ts'), /restore_account_creation/);
assert.doesNotMatch(read('supabase/functions/admin-users/index.ts'), /admin_mfa_required:\s*false/);
assert.match(read('supabase/migrations/202607250001_blocks25_27_community_commercial.sql'), /R425_DATA_API_GRANTS_EXPLICIT/);
assert.match(read('supabase/migrations/202607250002_block28_play_publication.sql'), /R425_DATA_API_GRANTS_EXPLICIT/);

const second = applyR425SupabaseSecurityChain(root);
assert.equal(second.changed, false, 'R425 precisa ser idempotente.');

console.log('R425 aprovada: cadeia Supabase estática converge MFA fail-closed, metadata sem privilégios e grants explícitos sem fingir implantação remota.');
