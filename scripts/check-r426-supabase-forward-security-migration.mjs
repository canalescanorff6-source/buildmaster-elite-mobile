import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R426_SUPABASE_FORWARD_SECURITY_VERSION = '40.80-r426-forward-security-finalization-v1';
export const R426_MIGRATION = 'supabase/migrations/202609160001_r426_security_finalization.sql';

const REQUIRED_PATTERNS = [
  [/R426_FORWARD_SECURITY_FINALIZATION/, 'marcador R426'],
  [/admin_mfa_required\s*=\s*true/i, 'MFA administrativo fail-closed'],
  [/check\s*\(\s*admin_mfa_required\s+is\s+true\s*\)/i, 'constraint MFA=true'],
  [/check\s*\(\s*require_device_proof\s+is\s+true\s*\)/i, 'constraint device-proof=true'],
  [/check\s*\(\s*allow_legacy_clients\s+is\s+false\s*\)/i, 'constraint legacy=false'],
  [/create\s+or\s+replace\s+function\s+public\.buildmaster_handle_new_auth_user/i, 'trigger de perfil seguro'],
  [/revoke\s+all\s+on\s+table[\s\S]*buildmaster_security_settings[\s\S]*from\s+anon\s*,\s*authenticated/i, 'revoke explícito Data API'],
  [/grant\s+select\s+on\s+table[\s\S]*buildmaster_profiles[\s\S]*buildmaster_devices[\s\S]*to\s+authenticated/i, 'grants mínimos de leitura'],
  [/grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table[\s\S]*user_vault_snapshots[\s\S]*to\s+authenticated/i, 'grant mínimo do Cofre'],
  [/grant\s+execute\s+on\s+function\s+public\.buildmaster_register_secure_device[\s\S]*to\s+service_role/i, 'registro seguro apenas por service_role'],
  [/commit\s*;/i, 'commit transacional'],
];

const FORBIDDEN_IN_R426 = [
  [/raw_user_meta_data->>'(?:plan|expires_at|max_devices|offline_grace_hours)'/i, 'metadata privilegiada do usuário'],
  [/admin_mfa_required\s*=\s*false/i, 'MFA=false'],
  [/require_device_proof\s*=\s*false/i, 'device-proof=false'],
  [/allow_legacy_clients\s*=\s*true/i, 'legacy_clients=true'],
  [/grant\s+all[\s\S]*to\s+(?:anon|authenticated)/i, 'GRANT ALL para cliente'],
];

const FORBIDDEN_AFTER_R426 = [
  [/admin_mfa_required\s*=\s*false/i, 'migration posterior tenta desligar MFA'],
  [/require_device_proof\s*=\s*false/i, 'migration posterior tenta desligar prova de aparelho'],
  [/allow_legacy_clients\s*=\s*true/i, 'migration posterior tenta reativar cliente legado'],
  [/raw_user_meta_data->>'(?:plan|expires_at|max_devices|offline_grace_hours)'/i, 'migration posterior reintroduz metadata privilegiada'],
  [/drop\s+constraint\s+(?:if\s+exists\s+)?buildmaster_security_(?:admin_mfa_fail_closed|device_proof_fail_closed|no_legacy_clients)/i, 'migration posterior remove constraint fail-closed'],
];

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

export function auditR426SupabaseForwardSecurityMigration(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const migrationFile = path.resolve(root, R426_MIGRATION);
  const migration = readIfExists(migrationFile);
  const issues = [];

  if (!migration) {
    issues.push(`${R426_MIGRATION}: ausente.`);
  } else {
    for (const [pattern, label] of REQUIRED_PATTERNS) {
      if (!pattern.test(migration)) issues.push(`${R426_MIGRATION}: contrato ausente — ${label}.`);
    }
    for (const [pattern, label] of FORBIDDEN_IN_R426) {
      if (pattern.test(migration)) issues.push(`${R426_MIGRATION}: contrato inseguro — ${label}.`);
    }
  }

  const migrationsDir = path.resolve(root, 'supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationName = path.basename(R426_MIGRATION);
    const later = fs.readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql') && name > migrationName)
      .sort();
    for (const name of later) {
      const source = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
      for (const [pattern, label] of FORBIDDEN_AFTER_R426) {
        if (pattern.test(source)) issues.push(`supabase/migrations/${name}: ${label}.`);
      }
    }
  }

  return {
    version: R426_SUPABASE_FORWARD_SECURITY_VERSION,
    ok: issues.length === 0,
    issues,
    migration: R426_MIGRATION,
    liveRuntimeVerified: false,
  };
}

export function assertR426SupabaseForwardSecurityMigration(rootDirectory = process.cwd()) {
  const report = auditR426SupabaseForwardSecurityMigration(rootDirectory);
  if (!report.ok) throw new Error(`R426: migration forward-only reprovada — ${report.issues.join(' | ')}`);
  return report;
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const report = assertR426SupabaseForwardSecurityMigration(process.cwd());
  console.log(`R426 aprovada — ${report.migration}; implantação remota continua sendo gate externo.`);
}
