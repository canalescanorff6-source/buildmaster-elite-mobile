import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function expect(condition, message) { if (!condition) throw new Error(message); }

const panel = read('src/components/AccountAdminPanel.tsx');
const auth = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const migration = read('supabase/migrations/202607280002_restore_account_creation_v3173.sql');
const security = read('src/modules/administration/AdministrationSecurityCenter.tsx');
const workflow = read('.github/workflows/deploy-supabase.yml');

expect(panel.includes('Restaurar criação de contas agora'), 'Botão de recuperação do painel ausente.');
expect(panel.includes("action: 'restore_account_creation'"), 'Painel não chama a recuperação do servidor.');
expect(panel.includes('Quantidade de dias') && panel.includes('Data específica') && panel.includes('Sem vencimento'), 'Modos de validade não estão completos.');
expect(panel.includes('1 dia') && panel.includes('7 dias') && panel.includes('15 dias') && panel.includes('30 dias') && panel.includes('60 dias') && panel.includes('90 dias') && panel.includes('1 ano'), 'Períodos tradicionais não foram preservados.');
expect(panel.includes('Limite de aparelhos'), 'Controle de aparelhos ausente.');
expect(auth.includes("| { action: 'restore_account_creation' }"), 'Contrato de recuperação ausente.');
expect(edge.includes("action === 'restore_account_creation'"), 'Edge Function não restaura o painel.');
expect(edge.indexOf("action === 'restore_account_creation'") < edge.indexOf("MFA_REQUIRED"), 'Recuperação continua bloqueada pelo MFA.');
expect(edge.includes("admin_mfa_required: false"), 'Servidor ainda usa MFA obrigatório como fallback.');
expect(edge.indexOf("buildmaster_take_admin_rate_limit") < edge.indexOf(".update({ admin_mfa_required: false"), 'Recuperação do painel não está protegida por limite de tentativas.');
expect(migration.includes('admin_mfa_required = false'), 'Migração não desativa o bloqueio antigo.');
expect(security.includes('checked={settings.adminMfaRequired}'), 'MFA não está configurável como opção.');
expect(security.includes('adminMfaRequired: settings.adminMfaRequired'), 'Painel de segurança não salva a escolha do administrador.');
expect(workflow.includes("- 'supabase/**'"), 'Migração e Edge Function não serão publicadas automaticamente.');

console.log('v31.73: criação de contas, prazos, renovação e MFA opcional restaurados.');
