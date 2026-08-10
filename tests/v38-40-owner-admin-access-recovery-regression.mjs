import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const auth = read('src/lib/accountAuth.ts');
const gate = read('src/components/AuthGate.tsx');
const license = read('supabase/functions/license-session/index.ts');
const migration = read('supabase/migrations/202608100002_owner_admin_access_recovery_v3840.sql');
const workflow = read('.github/workflows/deploy-supabase.yml');

assert(auth.includes("raw.endsWith(internalSuffix)"), 'Login não aceita o e-mail interno completo.');
assert(auth.includes('tiago@accounts.buildmaster.app') === false, 'accountAuth não deve privilegiar uma conta específica.');
assert(gate.includes('Conta principal precisa de reparo'), 'AuthGate não explica PROFILE_MISSING.');
assert(gate.includes('Vínculo de aparelho precisa ser renovado'), 'AuthGate não explica DEVICE_LIMIT.');
assert(gate.includes('tiago@accounts.buildmaster.app'), 'Campo de login não informa que o e-mail interno também é aceito.');

assert(migration.includes("owner_email constant text := 'tiago@accounts.buildmaster.app'"), 'Migração não fixa o e-mail proprietário.');
assert(migration.includes("owner_id constant uuid := 'e0064cae-da5d-45a4-af74-439a9b66b503'"), 'Migração não protege o UID proprietário.');
assert(migration.includes("role = 'admin'"), 'Migração não restaura o papel admin.');
assert(migration.includes("status = 'active'"), 'Migração não reativa a conta.');
assert(migration.includes('expires_at = null'), 'Migração não remove expiração da conta principal.');
assert(migration.includes('max_devices = 10'), 'Migração não libera novo vínculo de aparelho.');
assert(migration.includes('update public.buildmaster_devices'), 'Migração não revoga vínculos antigos.');
assert(!migration.includes('delete from public.user_vault_snapshots'), 'Migração jamais deve apagar o Cofre.');
assert(!migration.includes('delete from auth.users'), 'Migração jamais deve excluir a conta Auth.');

assert(license.includes("const OWNER_EMAIL = 'tiago@accounts.buildmaster.app'"), 'license-session não reconhece o proprietário.');
assert(license.includes("const OWNER_ID = 'e0064cae-da5d-45a4-af74-439a9b66b503'"), 'license-session não exige UID exato do proprietário.');
assert(license.includes('OWNER_PROFILE_REPAIR_FAILED'), 'license-session não possui autorreparo controlado.');
assert(license.includes("role: 'admin'"), 'autorreparo não restaura admin.');
assert(license.includes('max_devices: 10'), 'autorreparo não restaura limite do proprietário.');

assert(workflow.includes('supabase db push'), 'Workflow não aplica a migração automaticamente.');
assert(workflow.includes('supabase functions deploy'), 'Workflow não republica license-session automaticamente.');

console.log('v38.40 hotfix proprietário aprovado: login por usuário/e-mail, perfil admin recuperável e vínculos antigos liberados sem apagar fichas.');
