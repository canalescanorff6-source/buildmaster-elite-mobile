import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyR414CiContractConvergence } from './apply-r414-ci-contract-convergence.mjs';
import { applyR418UnboundedCapacity } from './apply-r418-unbounded-capacity.mjs';
import { applyR418Fix2HistoricalCapacityContracts } from './apply-r418-fix2-historical-contracts.mjs';
import { applyR419ReaderMasterEngineClosure } from './apply-r419-reader-master-engine-closure.mjs';
import { applyR420PersistenceRecoveryClosure } from './apply-r420-persistence-recovery-closure.mjs';
import { applyR421SquadVideoTacticalClosure } from './apply-r421-squad-video-tactical-closure.mjs';
import { applyR422SecurityObservabilityClosure } from './apply-r422-security-observability-closure.mjs';
import { applyR423AndroidPerformanceUxClosure } from './apply-r423-android-performance-ux-closure.mjs';
import { applyR425SupabaseSecurityChain } from './apply-r425-supabase-security-chain.mjs';
import { assertR426SupabaseForwardSecurityMigration } from './check-r426-supabase-forward-security-migration.mjs';
import { auditR424FinalRequirementsClosure } from './audit-r424-final-requirements-closure.mjs';

export const R448_CI_FOUNDATION_ORDER_VERSION = '40.80-r448-ci-foundation-order-v1';
const FOUNDATION_IDS = new Set([
  'r417-permanent-card-authority','r418-capacity-network-mobility','r419-reader-master-engine',
  'r420-persistence-recovery','r421-functional-modules','r422-security-observability',
  'r423-android-performance-ux','r425-supabase-security-chain','r426-supabase-forward-security'
]);

export function auditHistoricalFoundationR448(rootDirectory = process.cwd()) {
  const report = auditR424FinalRequirementsClosure(rootDirectory);
  const failures = report.items.filter((item) => FOUNDATION_IDS.has(item.id) && item.blockingCode && item.status === 'FALHOU');
  return { ok: failures.length === 0, failures, report };
}

export function convergeHistoricalFoundationR448(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const before = auditHistoricalFoundationR448(root);
  if (before.ok) return { changed: false, steps: [], audit: before, version: R448_CI_FOUNDATION_ORDER_VERSION };
  const steps = [];
  const run = (label, fn) => { const result = fn(root); steps.push({ label, changed: Boolean(result?.changed ?? result?.sourceChanged), result }); return result; };
  run('R414/R415/R416/R417', applyR414CiContractConvergence);
  run('R418', applyR418UnboundedCapacity);
  run('R418-fix2', applyR418Fix2HistoricalCapacityContracts);
  run('R419', applyR419ReaderMasterEngineClosure);
  run('R420', applyR420PersistenceRecoveryClosure);
  run('R421', applyR421SquadVideoTacticalClosure);
  run('R422', applyR422SecurityObservabilityClosure);
  run('R423', applyR423AndroidPerformanceUxClosure);
  run('R425', applyR425SupabaseSecurityChain);
  assertR426SupabaseForwardSecurityMigration(root);
  const after = auditHistoricalFoundationR448(root);
  if (!after.ok) throw new Error(`R448: fundação histórica incompleta — ${after.failures.map((item) => `${item.id}: ${item.details.join(' | ')}`).join('; ')}`);
  return { changed: steps.some((step) => step.changed), steps, audit: after, version: R448_CI_FOUNDATION_ORDER_VERSION };
}

export function patchRepairRootR448(source) {
  if (source.includes('R448_FOUNDATION_BEFORE_POST_CATALOG')) return source;
  const importAnchor = "import { auditPostCatalogFinalConvergenceR447 } from './apply-r447-final-post-catalog-convergence.mjs';";
  if (!source.includes(importAnchor)) throw new Error('R448: import R447 ausente em repair-root-tsconfig.');
  let next = source.replace(importAnchor, `${importAnchor}\nimport { convergeHistoricalFoundationR448 } from './apply-r448-ci-foundation-order.mjs';`);
  next = next.replace("const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r447';", "const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r448';");
  const marker = '  // R447_FINAL_POST_CATALOG_REPAIR_ROOT';
  if (!next.includes(marker)) throw new Error('R448: gate R447 ausente em repair-root-tsconfig.');
  const block = `  // R448_FOUNDATION_BEFORE_POST_CATALOG\n  const foundationR448 = convergeHistoricalFoundationR448(projectRoot);\n  console.log(foundationR448.changed\n    ? \`R448 pré-CI convergiu a fundação histórica em \${foundationR448.steps.filter((step) => step.changed).length} etapa(s).\`\n    : 'R448 pré-CI: fundação histórica já estava íntegra.');\n`;
  return next.replace(marker, `${block}${marker}`);
}

export function patchRepairRoutesR448(source) {
  if (source.includes('R448_FOUNDATION_ROUTE_GATE')) return source;
  const importAnchor = "import { auditPostCatalogFinalConvergenceR447 } from './apply-r447-final-post-catalog-convergence.mjs';";
  if (!source.includes(importAnchor)) throw new Error('R448: import R447 ausente em repair-critical-routes.');
  let next = source.replace(importAnchor, `${importAnchor}\nimport { convergeHistoricalFoundationR448 } from './apply-r448-ci-foundation-order.mjs';`);
  const startMarker = '    const capacity = applyR418UnboundedCapacity(options.projectRoot);';
  const endMarker = '    const r426 = assertR426SupabaseForwardSecurityMigration(options.projectRoot);';
  const start = next.indexOf(startMarker);
  const end = next.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error('R448: bloco histórico R418-R425 não encontrado em repair-critical-routes.');
  const historic = next.slice(start, end);
  const wrapped = `    // R448_FOUNDATION_ROUTE_GATE\n    if (postCatalogR447.ok) {\n      const foundationR448 = convergeHistoricalFoundationR448(options.projectRoot);\n      console.log(foundationR448.changed\n        ? \`R448 routes convergiu fundação histórica em \${foundationR448.steps.filter((step) => step.changed).length} etapa(s).\`\n        : 'R448 routes: fundação histórica íntegra; reparos R418-R425 não serão reaplicados.');\n      const postCatalogAfterR448 = auditPostCatalogFinalConvergenceR447(options.projectRoot);\n      if (!postCatalogAfterR448.ok) throw new Error(\`R448: fundação histórica alterou a camada moderna — \${postCatalogAfterR448.issues.join(' | ')}\`);\n    } else {\n${historic.split('\n').map((line) => `  ${line}`).join('\n')}    }\n`;
  return next.slice(0, start) + wrapped + next.slice(end);
}

export function patchR424DiagnosticsR448(source) {
  if (source.includes('R448_R417_DETAILED_DIAGNOSTICS')) return source;
  const pattern = /function evaluateR417\(root\)\{[\s\S]*?\n\}\nfunction evaluateR418/;
  if (!pattern.test(source)) throw new Error('R448: evaluateR417 não encontrado no auditor R424.');
  const replacement = `function evaluateR417(root){\n // R448_R417_DETAILED_DIAGNOSTICS\n const actions=read(root,'src/hooks/useCardVisionVaultActionsR185.ts')||'',mut=read(root,'src/modules/vault/vaultHistoryMutationsR129.ts')||'',auto=read(root,'src/lib/autonomousCardR417.ts')||'',pipe=read(root,'src/lib/cardIntelligencePipeline.ts')||'',clean=read(root,'src/lib/cleanSlatePerformance2027V4080R119.ts')||'',sel=read(root,'src/modules/vault/cardVisionVaultSelectorsR151.ts')||'',ui=read(root,'src/components/CleanVaultV3800.tsx')||'';\n const checks=[\n  ['R417: batchHistoryR417 ausente',actions.includes('batchHistoryR417')],\n  [\"R417: ramo action === 'delete' ausente\",actions.includes(\"action === 'delete'\")],\n  ['R417: helper legado removeHistoryEntryAfterDelete ainda presente',!actions.includes('removeHistoryEntryAfterDelete')],\n  ['R417: batchRemoveHistoryR417 ausente',mut.includes('batchRemoveHistoryR417')],\n  ['R417: autonomousCardR417/version ausente',auto.includes('AUTONOMOUS_CARD_R417_VERSION')],\n  ['R417: Top 3 autônomo ausente',auto.includes('slice(0,3)')],\n  ['R417: buildPositionUsageR416 ausente',auto.includes('buildPositionUsageR416')],\n  ['R417: Overall/GER reapareceu como autoridade autônoma',!/parsed\\.(?:overall|maxOverall)/.test(auto)],\n  ['R417: seed autônomo ausente do pipeline',pipe.includes('applyAutonomousRoleSeedR417(current)')],\n  ['R417: âncora automática R184 ausente',clean.includes('usageContext.targetPosition !== autonomousPrimaryR417')],\n  ['R417: lixeira ausente dos seletores',sel.includes(\"index.folderId === 'lixeira'\")],\n  ['R417: selecionar tudo ausente da UI',ui.includes('Selecionar tudo')],\n  ['R417: lixeira ausente da UI',ui.includes('Lixeira')],\n ];\n const missing=checks.filter(([,ok])=>!ok).map(([label])=>label);\n const ok=missing.length===0;\n return item('r417-permanent-card-authority','R417 — ficha permanente, função autônoma e ações estáveis do Cofre',ok,ok?'Contrato semântico R417 presente.':['Contrato semântico R417 incompleto.',...missing]);\n}\nfunction evaluateR418`;
  return source.replace(pattern, replacement);
}

function patchPackageR448(source) {
  const pkg = JSON.parse(source);
  const command = 'node tests/v40-80-r448-ci-foundation-order-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R448: script test:r200 ausente.');
  if (!current.includes(command)) pkg.scripts['test:r200'] = `${current} && ${command}`;
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function applyR448CiFoundationOrder(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const targets = [
    ['scripts/repair-root-tsconfig.mjs', patchRepairRootR448],
    ['scripts/repair-critical-routes.mjs', patchRepairRoutesR448],
    ['scripts/audit-r424-final-requirements-closure.mjs', patchR424DiagnosticsR448],
    ['package.json', patchPackageR448],
  ];
  const patched=[];
  for(const [relative,patcher] of targets){const file=path.resolve(root,relative);if(!fs.existsSync(file))throw new Error(`R448: arquivo obrigatório ausente: ${relative}`);const before=fs.readFileSync(file,'utf8'),after=patcher(before);if(after!==before){fs.writeFileSync(file,after,'utf8');patched.push(relative);}}
  return { changed: patched.length>0, patched, version:R448_CI_FOUNDATION_ORDER_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) { const result=applyR448CiFoundationOrder(process.cwd()); console.log(result.changed?`R448: ordem determinística aplicada em ${result.patched.length} arquivo(s).`:'R448: ordem determinística já aplicada.'); }
