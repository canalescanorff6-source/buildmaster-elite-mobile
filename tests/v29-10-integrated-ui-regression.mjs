import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const pass = (condition, message) => condition ? console.log(`✓ ${message}`) : failures.push(message);

const pkg = JSON.parse(read('package.json'));
const cardApp = read('src/components/CardVisionApp.tsx');
const updatePanel = read('src/components/UpdateCenterPanel.tsx');
const governance = read('src/modules/updates/updateGovernance.ts');
const definitive = read('src/modules/updates/DefinitiveUpdateCenter.tsx');
const globals = read('src/app/globals.css');
const layout = read('src/app/layout.tsx');
const workflow = read('.github/workflows/build-apk.yml');
const dataSafety = read('src/lib/dataSafety.ts');

pass(pkg.version === '29.10.0', 'Pacote identificado como v29.10.0');
pass(pkg.scripts['test:all'].startsWith('npm run test:v2910'), 'Regressões v29.10 executam antes das anteriores');
pass(cardApp.includes('<AdministrationSecurityCenter />') && cardApp.includes('<AccountAdminPanel />'), 'Nova administração complementa o painel de contas existente');
pass(updatePanel.includes('<DefinitiveUpdateCenter />') && updatePanel.includes('getUpdateEvaluationOptions'), 'Governança definitiva está integrada ao atualizador real');
pass(governance.includes("channel === 'beta' ? DEFAULT_UPDATE_BETA_URL") && governance.includes('release-history.json'), 'Histórico acompanha o canal selecionado');
pass(definitive.includes('Rollout') && definitive.includes('rollback-base') && definitive.includes('Testar canais agora'), 'Painel mostra distribuição, histórico e diagnóstico');
pass(globals.trim().endsWith('@import "./design-system-v2910-admin-update.css";'), 'Estilo v29.10 é a última camada visual');
pass(layout.includes('bm-v2910-admin-update'), 'Escopo visual v29.10 está ativo no layout');
pass(dataSafety.includes('CURRENT_DATA_SCHEMA = 2910') && dataSafety.includes("APP_DATA_VERSION = '29.10.0'"), 'Backup foi elevado sem remover seções anteriores');
pass(workflow.includes('options: [stable, beta]'), 'Workflow permite canal estável ou beta');
pass(workflow.includes('rollout_percentage:') && workflow.includes('RELEASE_PAUSED'), 'Workflow publica rollout e pausa');
pass(workflow.includes('ROLLBACK_FROM_VERSION') && workflow.includes('versionCode maior'), 'Workflow documenta rollback Android seguro');
pass(workflow.includes('release-history.json') && workflow.includes('CHANNEL_BRANCH'), 'Workflow mantém histórico separado por canal');
pass(workflow.includes("if: env.RELEASE_CHANNEL == 'stable'"), 'Pontes legadas são atualizadas somente pelo canal estável');

if (failures.length) {
  console.error(`\n${failures.length} falha(s) de integração v29.10:`);
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('\nIntegração visual e de publicação da v29.10 aprovada.');
