import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function expect(condition, message) { if (!condition) throw new Error(message); }

const panel = read('src/components/AccountAdminPanel.tsx');
const auth = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const migration = read('supabase/migrations/202607280002_restore_account_creation_v3173.sql');
const security = read('src/modules/administration/AdministrationSecurityCenter.tsx');
const workflow = read('.github/workflows/deploy-supabase.yml');

expect(panel.includes('Quantidade de dias') && panel.includes('Data específica') && panel.includes('Sem vencimento'), 'Modos de validade não estão completos.');
expect(panel.includes('1 dia') && panel.includes('7 dias') && panel.includes('15 dias') && panel.includes('30 dias') && panel.includes('60 dias') && panel.includes('90 dias') && panel.includes('1 ano'), 'Períodos tradicionais não foram preservados.');
expect(panel.includes('Limite de aparelhos'), 'Controle de aparelhos ausente.');
expect(panel.includes('MFA obrigatório'), 'Painel administrativo não expõe o gate MFA fail-closed.');
expect(!panel.includes('restore_account_creation') && !panel.includes('Restaurar criação de contas agora'), 'Painel ainda expõe bypass para desligar MFA.');
expect(!auth.includes("| { action: 'restore_account_creation' }"), 'Cliente ainda expõe contrato inseguro de recuperação.');
expect(!edge.includes("action === 'restore_account_creation'"), 'Edge Function ainda expõe bypass de MFA.');
expect(!edge.includes('admin_mfa_required: false'), 'Servidor ainda possui fallback MFA fail-open.');
expect(migration.includes('R425_MFA_FAIL_CLOSED') && migration.includes('admin_mfa_required = true'), 'Migração de recuperação não foi convergida para MFA obrigatório.');
expect(!migration.includes('admin_mfa_required = false'), 'Migração ainda desativa MFA.');
expect(security.includes('adminMfaRequired: true'), 'Central de segurança não inicia fail-closed.');
expect(security.includes('MFA administrativo obrigatório'), 'Central de segurança ainda permite desligar MFA.');
expect(security.includes('Clientes legados bloqueados'), 'Central de segurança ainda permite downgrade para cliente legado.');
expect(workflow.includes("- 'supabase/**'"), 'Migração e Edge Function não serão publicadas automaticamente.');

console.log('v31.73 convergida: criação/renovação preservadas sem bypass de MFA; política administrativa permanece fail-closed.');
