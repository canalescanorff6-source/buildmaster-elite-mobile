import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function expect(condition, message) { if (!condition) throw new Error(message); }

const panel = read('src/components/AccountAdminPanel.tsx');
const auth = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const migration = read('supabase/migrations/202607280001_account_recovery_v3171.sql');
const workflow = read('.github/workflows/deploy-supabase.yml');

expect(panel.includes("useState<AccountExpiryMode>('days')"), 'Modo de validade não foi adicionado à interface.');
expect(panel.includes('Sem vencimento'), 'Opção sem vencimento ausente.');
expect(panel.includes('getAdminBackendHealth'), 'Diagnóstico do backend ausente.');
expect(panel.includes('adminUnlocked'), 'Painel administrativo ainda não usa o estado consolidado.');
expect(auth.includes("action: 'health'"), 'Contrato health ausente no cliente.');
expect(auth.includes("expiryMode: AccountExpiryMode"), 'Contrato de validade flexível ausente.');
expect(edge.includes("if (action === 'health')"), 'Health check ausente no servidor.');
expect(edge.includes("expiryMode === 'never'" ) || edge.includes("['days', 'date', 'never']"), 'Servidor não aceita conta sem vencimento.');
expect(edge.indexOf("if (action === 'health')") < edge.indexOf("MFA_REQUIRED"), 'Health check continua bloqueado pelo MFA.');
expect(edge.includes('USERNAME_EXISTS'), 'Mensagem de usuário duplicado ausente.');
expect(migration.includes('profile_count = 1'), 'Recuperação do primeiro administrador ausente.');
expect(migration.includes("factor.status::text = 'verified'"), 'Migração não detecta MFA verificado.');
expect(workflow.includes("- 'supabase/**'"), 'Deploy automático do backend ausente.');
expect(workflow.includes("grep -q 'admin-users'"), 'Workflow não confirma a função admin-users.');

console.log('v31.71 contas: diagnóstico, criação flexível, recuperação admin e deploy automático aprovados.');
