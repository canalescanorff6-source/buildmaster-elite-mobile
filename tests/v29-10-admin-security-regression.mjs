import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const pass = (condition, message) => condition ? console.log(`✓ ${message}`) : failures.push(message);

const account = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const migration = read('supabase/migrations/202607240001_blocks12_13_admin_update.sql');
const panel = read('src/modules/administration/AdministrationSecurityCenter.tsx');

for (const action of ['overview', 'list_devices', 'revoke_device', 'list_audit', 'get_security_settings', 'update_security_settings', 'rate_limit_status']) {
  pass(account.includes(`action: '${action}'`) && edge.includes(`'${action}'`), `Ação ${action} existe no cliente e no servidor`);
}
pass(edge.includes("appId !== APP_ID"), 'Servidor rejeita aplicativo administrativo desconhecido');
pass(edge.includes("compareVersions(appVersion") && edge.includes("UPDATE_REQUIRED"), 'Servidor bloqueia APK administrativo abaixo da versão mínima');
pass(edge.includes("jwtClaims(token).aal !== 'aal2'") && edge.includes('MFA_REQUIRED'), 'MFA AAL2 é exigido no servidor');
pass(edge.includes('buildmaster_take_admin_rate_limit') && edge.includes('RATE_LIMITED'), 'Rate limit é aplicado no servidor');
pass(edge.includes('require_device_proof: true') && edge.includes('admin_mfa_required: true'), 'MFA e prova criptográfica não podem ser desligados pelo painel');
pass(edge.includes("outcome: error instanceof HttpError") && edge.includes("'denied' : 'error'"), 'Ações negadas e erros entram na auditoria');
pass(edge.includes('passwordChanged: true') && !edge.includes("details: { password"), 'Senha não é gravada em detalhes de auditoria');
pass(panel.includes('Controle individual de aparelhos') && panel.includes("action: 'revoke_device'"), 'Painel desconecta um aparelho sem revogar todos');
pass(panel.includes('MFA obrigatório e bloqueado') && panel.includes('Prova criptográfica obrigatória e bloqueada'), 'Interface mostra proteções obrigatórias como bloqueadas');
pass(panel.includes('Rate limit administrativo') && panel.includes('Eventos auditados'), 'Painel exibe limites e auditoria');
pass(migration.includes('buildmaster_release_governance') && migration.includes('buildmaster_release_history'), 'Migração inclui governança e histórico de releases');
pass(migration.includes('enable row level security') && migration.includes('revoke all'), 'Tabelas de governança não ficam abertas ao cliente');
pass(migration.includes('request_id') && migration.includes('buildmaster_admin_audit_request_idx'), 'Auditoria possui identificador de requisição deduplicável');

if (failures.length) {
  console.error(`\n${failures.length} falha(s) no Bloco 12:`);
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('\nBloco 12: administração, contas e segurança aprovados.');
