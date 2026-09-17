import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R425_SUPABASE_SECURITY_CHAIN_VERSION = '40.80-r425-supabase-security-chain-v1';

const TARGETS = Object.freeze({
  initial: 'supabase/migrations/202607140001_buildmaster_accounts.sql',
  hardening: 'supabase/migrations/202607160001_security_hardening_v2675.sql',
  commercial: 'supabase/migrations/202607250001_blocks25_27_community_commercial.sql',
  publication: 'supabase/migrations/202607250002_block28_play_publication.sql',
  recovery: 'supabase/migrations/202607280001_account_recovery_v3171.sql',
  restore: 'supabase/migrations/202607280002_restore_account_creation_v3173.sql',
  adminFunction: 'supabase/functions/admin-users/index.ts',
});

const PRIVILEGED_METADATA_FIELDS = ['plan', 'expires_at', 'max_devices', 'offline_grace_hours'];
const COMMUNITY_GRANT_MARKER = 'R425_DATA_API_GRANTS_EXPLICIT';
const MFA_MARKER = 'R425_MFA_FAIL_CLOSED';

function absolute(root, relative) {
  return path.resolve(root, relative);
}

function requiredRead(root, relative) {
  const file = absolute(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R425: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeChanged(file, before, after, root, patched) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  patched.push(path.relative(root, file).replaceAll('\\', '/'));
  return true;
}

function patchPrivilegedProfileDefaults(source, label) {
  let next = source;
  const block = /coalesce\(nullif\(new\.raw_user_meta_data->>'plan', ''\), 'premium'\),\s*\n?\s*nullif\(new\.raw_user_meta_data->>'expires_at', ''\)::timestamptz,\s*\n?\s*greatest\(1,\s*least\(10,\s*coalesce\(\(new\.raw_user_meta_data->>'max_devices'\)::integer,\s*1\)\)\),\s*\n?\s*greatest\(0,\s*least\((?:24|168),\s*coalesce\(\(new\.raw_user_meta_data->>'offline_grace_hours'\)::integer,\s*(?:4|24)\)\)\)/g;
  next = next.replace(block, "'premium',\n    null,\n    1,\n    4");

  const remaining = PRIVILEGED_METADATA_FIELDS.filter((field) => next.includes(`raw_user_meta_data->>'${field}'`));
  if (remaining.length) {
    throw new Error(`R425: ${label} ainda contém metadata privilegiada não convergida: ${remaining.join(', ')}`);
  }
  if (!next.includes('R425_AUTHORIZATION_METADATA_FAIL_CLOSED')) {
    next = `-- R425_AUTHORIZATION_METADATA_FAIL_CLOSED: autorização/licença nunca nasce de raw_user_meta_data.\n${next}`;
  }
  return next;
}

function patchRecoveryMfa(source) {
  let next = source;
  const legacyBlock = /do\s*\$\$\s*declare\s+has_verified_admin_factor\b[\s\S]*?end\s*\$\$;/i;
  if (legacyBlock.test(next)) {
    next = next.replace(legacyBlock, `-- ${MFA_MARKER}: a ausência de fator cadastrado não pode desligar a política administrativa.\nupdate public.buildmaster_security_settings\nset admin_mfa_required = true, updated_at = now()\nwhere id = 1;`);
  }
  next = next.replace(/admin_mfa_required\s*=\s*has_verified_admin_factor/gi, 'admin_mfa_required = true');
  next = next.replace(/admin_mfa_required\s*=\s*false/gi, 'admin_mfa_required = true');
  if (!next.includes(MFA_MARKER)) next = `-- ${MFA_MARKER}: MFA administrativo permanece fail-closed.\n${next}`;
  return next;
}

function patchRestoreMfa(source) {
  let next = source;
  next = next.replace(/sem exigir MFA para abrir o painel\. O MFA continua disponível como opção\./g, 'mantendo MFA obrigatório para ações administrativas sensíveis.');
  next = next.replace(/admin_mfa_required\s*=\s*false/gi, 'admin_mfa_required = true');
  next = next.replace(/false\s*,\s*true\s*,\s*false\s*,\s*4\s*,\s*12/gi, 'false,\n  true,\n  true,\n  4,\n  12');
  if (!next.includes(MFA_MARKER)) next = `-- ${MFA_MARKER}: recuperação de conta não pode desativar MFA administrativo.\n${next}`;
  return next;
}

function patchAdminFunction(source) {
  let next = source;
  next = next.replace(/^\s*if \(action === 'restore_account_creation'\) return \{[^\n]*\};\r?\n/gm, '');
  next = next.replace(/\n\s*if \(action === 'restore_account_creation'\) \{[\s\S]*?\n\s*\}\n(?=\s*if \(settings\.admin_mfa_required)/g, '\n');
  next = next.replace(/if \(action === 'restore_account_creation'\) \{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*/g, '');
  next = next.replace(/,\s*'restore_account_creation'/g, '');
  next = next.replace(/'restore_account_creation',\s*/g, '');
  next = next.replace(/admin_mfa_required:\s*false/g, 'admin_mfa_required: true');
  next = next.replace(/admin_mfa_required\s*:\s*false/g, 'admin_mfa_required: true');
  next = next.replace(
    'Confirme o código do aplicativo autenticador ou restaure o modo normal de criação de contas.',
    'Confirme o código do aplicativo autenticador para continuar.'
  );
  return next;
}

const COMMUNITY_GRANTS = `\n-- ${COMMUNITY_GRANT_MARKER}: RLS e privilégios do Data API são camadas independentes.\n-- Primeiro removemos privilégios herdados; depois liberamos somente operações cobertas pelas policies acima.\nrevoke all on table\n  public.buildmaster_commercial_plans,\n  public.buildmaster_commercial_licenses,\n  public.buildmaster_commercial_coupons,\n  public.buildmaster_commercial_ledger,\n  public.buildmaster_terms_acceptances,\n  public.buildmaster_lgpd_requests,\n  public.buildmaster_community_profiles,\n  public.buildmaster_community_packages,\n  public.buildmaster_community_ratings,\n  public.buildmaster_community_comments,\n  public.buildmaster_community_reports\nfrom anon, authenticated;\n\ngrant select on table\n  public.buildmaster_commercial_plans,\n  public.buildmaster_commercial_licenses,\n  public.buildmaster_commercial_ledger\nto authenticated;\n\ngrant select, insert, update, delete on table\n  public.buildmaster_terms_acceptances,\n  public.buildmaster_community_profiles,\n  public.buildmaster_community_packages,\n  public.buildmaster_community_ratings\nto authenticated;\n\ngrant select, insert on table\n  public.buildmaster_lgpd_requests,\n  public.buildmaster_community_comments,\n  public.buildmaster_community_reports\nto authenticated;\n`;

const PUBLICATION_GRANTS = `\n-- ${COMMUNITY_GRANT_MARKER}: leitura autenticada explícita; escrita permanece somente no serviço privilegiado.\nrevoke all on table\n  public.buildmaster_public_deletion_requests,\n  public.buildmaster_public_request_limits,\n  public.buildmaster_play_integrity_audit\nfrom anon, authenticated;\n\ngrant select on table\n  public.buildmaster_public_deletion_requests,\n  public.buildmaster_play_integrity_audit\nto authenticated;\n`;

function appendGrantContract(source, block) {
  if (source.includes(COMMUNITY_GRANT_MARKER)) return source;
  return `${source.trimEnd()}\n${block}`;
}

function migrationFiles(root) {
  const dir = absolute(root, 'supabase/migrations');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, file: path.join(dir, name), source: fs.readFileSync(path.join(dir, name), 'utf8') }));
}

export function auditR425SupabaseSecurityChain(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const issues = [];
  const migrations = migrationFiles(root);
  if (!migrations.length) issues.push('MIGRATIONS: cadeia Supabase ausente.');

  for (const { name, source } of migrations) {
    for (const field of PRIVILEGED_METADATA_FIELDS) {
      if (source.includes(`raw_user_meta_data->>'${field}'`)) issues.push(`${name}: raw_user_meta_data privilegiada (${field}).`);
    }
    if (/admin_mfa_required\s*=\s*false/i.test(source)) issues.push(`${name}: MFA administrativo explicitamente desligado.`);
    if (/admin_mfa_required\s*=\s*has_verified_admin_factor/i.test(source)) issues.push(`${name}: MFA administrativo pode falhar aberto sem fator cadastrado.`);
  }

  for (const relative of [TARGETS.initial, TARGETS.hardening, TARGETS.commercial, TARGETS.publication, TARGETS.recovery, TARGETS.restore, TARGETS.adminFunction]) {
    if (!fs.existsSync(absolute(root, relative))) issues.push(`${relative}: arquivo obrigatório ausente.`);
  }

  const commercial = fs.existsSync(absolute(root, TARGETS.commercial)) ? fs.readFileSync(absolute(root, TARGETS.commercial), 'utf8') : '';
  const publication = fs.existsSync(absolute(root, TARGETS.publication)) ? fs.readFileSync(absolute(root, TARGETS.publication), 'utf8') : '';
  const recovery = fs.existsSync(absolute(root, TARGETS.recovery)) ? fs.readFileSync(absolute(root, TARGETS.recovery), 'utf8') : '';
  const restore = fs.existsSync(absolute(root, TARGETS.restore)) ? fs.readFileSync(absolute(root, TARGETS.restore), 'utf8') : '';
  const admin = fs.existsSync(absolute(root, TARGETS.adminFunction)) ? fs.readFileSync(absolute(root, TARGETS.adminFunction), 'utf8') : '';
  const hardening = fs.existsSync(absolute(root, TARGETS.hardening)) ? fs.readFileSync(absolute(root, TARGETS.hardening), 'utf8') : '';

  if (!recovery.includes(MFA_MARKER)) issues.push(`${TARGETS.recovery}: marcador de MFA fail-closed ausente.`);
  if (!restore.includes(MFA_MARKER)) issues.push(`${TARGETS.restore}: recuperação ainda não prova MFA fail-closed.`);
  if (/restore_account_creation/.test(admin)) issues.push(`${TARGETS.adminFunction}: bypass restore_account_creation ainda exposto.`);
  if (/admin_mfa_required:\s*false/.test(admin)) issues.push(`${TARGETS.adminFunction}: fallback MFA ainda fail-open.`);
  if (!commercial.includes(COMMUNITY_GRANT_MARKER)
      || !/grant\s+select\s+on\s+table[\s\S]*buildmaster_commercial_plans[\s\S]*to\s+authenticated/i.test(commercial)
      || !/grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+table[\s\S]*buildmaster_terms_acceptances[\s\S]*to\s+authenticated/i.test(commercial)) {
    issues.push(`${TARGETS.commercial}: GRANT explícito do Data API não converge com as policies autenticadas.`);
  }
  if (!publication.includes(COMMUNITY_GRANT_MARKER)
      || !/grant\s+select\s+on\s+table[\s\S]*buildmaster_public_deletion_requests[\s\S]*buildmaster_play_integrity_audit[\s\S]*to\s+authenticated/i.test(publication)) {
    issues.push(`${TARGETS.publication}: GRANT explícito para leitura autenticada ausente.`);
  }
  for (const marker of [
    'revoke all on function public.buildmaster_take_admin_rate_limit',
    'grant execute on function public.buildmaster_take_admin_rate_limit',
    'revoke all on function public.buildmaster_register_secure_device',
    'grant execute on function public.buildmaster_register_secure_device',
  ]) {
    if (!hardening.toLowerCase().includes(marker)) issues.push(`${TARGETS.hardening}: contrato SECURITY DEFINER incompleto (${marker}).`);
  }

  return {
    version: R425_SUPABASE_SECURITY_CHAIN_VERSION,
    ok: issues.length === 0,
    issues,
    migrationCount: migrations.length,
    liveRuntimeVerified: false,
  };
}

export function applyR425SupabaseSecurityChain(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  for (const [key, relative] of Object.entries(TARGETS)) {
    const { file, source } = requiredRead(root, relative);
    let next = source;
    if (key === 'initial' || key === 'hardening') next = patchPrivilegedProfileDefaults(source, relative);
    else if (key === 'recovery') next = patchRecoveryMfa(source);
    else if (key === 'restore') next = patchRestoreMfa(source);
    else if (key === 'commercial') next = appendGrantContract(source, COMMUNITY_GRANTS);
    else if (key === 'publication') next = appendGrantContract(source, PUBLICATION_GRANTS);
    else if (key === 'adminFunction') next = patchAdminFunction(source);
    changed = writeChanged(file, source, next, root, patched) || changed;
  }

  const audit = auditR425SupabaseSecurityChain(root);
  if (!audit.ok) throw new Error(`R425: cadeia Supabase ainda insegura: ${audit.issues.join(' | ')}`);
  return { changed, patched, audit };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR425SupabaseSecurityChain(process.cwd());
  console.log(result.changed
    ? `R425 aplicada em ${result.patched.length} arquivo(s); estado estático Supabase fail-closed.`
    : 'R425: cadeia estática Supabase já estava convergida.');
  console.log('R425: implantação remota continua exigindo projeto Supabase conectado + advisors/RLS/grants reais.');
}
