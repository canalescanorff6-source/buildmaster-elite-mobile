import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const lightHistory = read('src/modules/vault/cardHistoryStartupModelR200.ts');
const vaultCommit = read('src/modules/vault/vaultHistoryCommitR172.ts');
const vaultActions = read('src/hooks/useCardVisionVaultActionsR185.ts');
const comparison = read('src/lib/playerComparisonR171.ts');
const ruleContracts = read('src/lib/remoteCatalogV3770.ts');
const dynamicRules = read('src/modules/builds/dynamicRules.ts');
const creator = read('src/lib/creatorBuildResearch.ts');
const fusion = read('src/lib/competitiveBuildFusion.ts');
const pro = read('src/lib/globalProBenchmarkV3900.ts');

assert.match(app, /from '@\/lib\/analyzerDomain'/, 'R200: shell deve usar domínio leve para tipos/constantes.');
assert.doesNotMatch(app, /from '@\/modules\/analysis'/, 'R200: barrel pesado de análise não pode voltar ao startup.');
assert.match(app, /await import\('@\/modules\/analysis\/productionOrchestratorR138'\)/, 'R200: criação manual/refresh devem carregar R138 sob demanda.');
assert.doesNotMatch(app, /from '@\/modules\/vault\/cardHistoryStore';\nexport/, 'R200: shell não deve reexportar store pesado do Cofre.');
assert.match(app, /from '@\/modules\/vault\/cardHistoryStartupModelR200'/, 'R200: shell deve usar modelo leve do Cofre.');
assert.match(app, /CREATOR_BUILD_RESEARCH_EVENT, COMPETITIVE_FUSION_EVENT, GLOBAL_PRO_BUILD_EVENT \} from '@\/lib\/appEvolution'/, 'R200: eventos de pesquisa devem reutilizar o contrato app-level já carregado.');
assert.match(app, /DEFAULT_DYNAMIC_RULE_PACK, RULE_PACK_KEY, type DynamicRulePack \} from '@\/lib\/remoteCatalogV3770'/, 'R200: pacote default de regras deve reutilizar o contrato de catálogo já carregado.');
assert.doesNotMatch(app, /from '@\/modules\/builds\/dynamicRules'/, 'R200: motor completo de regras não pode ser import estático do shell.');

assert.match(vaultCommit, /await import\('\.\/cardHistoryStore'\)/, 'R200: writer do Cofre deve ser carregado apenas quando houver commit.');
assert.doesNotMatch(vaultCommit, /import \{[^}]*persistHistoryStore[^}]*\} from/, 'R200: persistência pesada não pode voltar ao startup R172.');
assert.match(vaultActions, /await import\('@\/modules\/vault\/cardHistoryStore'\)/, 'R200: reparo pesado da Lixeira deve continuar disponível sob demanda.');
assert.match(vaultActions, /sanitizeRuntimeHistoryR200/, 'R200: estado já canônico deve usar sanitização leve no render.');
assert.match(comparison, /from '\.\/analyzerDomain'/, 'R200: comparador leve não pode puxar analyzer.ts por labels/tipos.');

assert.match(lightHistory, /CARD_HISTORY_STARTUP_MODEL_R200_VERSION/);
assert.doesNotMatch(lightHistory, /createProductionAnalysis|rebuildProductionAnalysis|indexedDB|localStorage|persistHistoryStore/, 'R200: modelo leve não pode virar nova autoridade/persistência.');
assert.match(ruleContracts, /DYNAMIC_RULE_CONTRACTS_R200_VERSION/);
assert.match(dynamicRules, /from '@\/lib\/remoteCatalogV3770'/, 'R200: motor de regras deve consumir o contrato compartilhado existente.');
assert.match(creator, /from '\.\/appEvolution'/);
assert.match(fusion, /from '\.\/appEvolution'/);
assert.match(pro, /from '\.\/appEvolution'/);

const r119 = read('src/lib/cleanSlatePerformance2027V4080R119.ts');
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5', 'R200: R119 não pode mudar no trabalho de startup.');
const srcFiles = [];
function walk(dir) { for (const name of fs.readdirSync(dir)) { const p = path.join(dir, name); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(name)) srcFiles.push(p); } }
walk('src');
const sourceBytes = srcFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
assert.ok(sourceBytes <= 5_360_000, `R200: troca startup/fonte excedeu orçamento aprovado (${sourceBytes} B).`);
const pkg = JSON.parse(read('package.json'));
assert.ok(String(pkg.scripts?.['test:v4080'] ?? '').endsWith('npm run test:r199 && npm run test:r200'), 'R200: cadeia v40.80 deve fechar R199 -> R200.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R200: test:all continua fechando pela bateria v40.80.');
console.log(`R200 estrutural aprovada: produção/Cofre/pesquisa/regras pesados ficam lazy; src=${sourceBytes} B; R119 intacto.`);
