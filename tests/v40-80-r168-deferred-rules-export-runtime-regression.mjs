import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const runtime = fs.readFileSync('src/modules/runtime/cardVisionDeferredActionsR168.ts', 'utf8');
const vaultActionsR185 = fs.readFileSync('src/hooks/useCardVisionVaultActionsR185.ts', 'utf8');
const resultActionsR188 = fs.readFileSync('src/modules/result/cardVisionResultActionsR188.ts', 'utf8');

for (const forbidden of [
  '@/lib/continuousRulesV3770',
  '@/modules/builds/buildReportExport',
  '@/modules/export/clientTextExportR129',
]) {
  const escaped = forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(app, new RegExp(`^\\s*import\\s+(?!type\\b)[^\\n]+from ['\"]${escaped}['\"]`, 'm'), `${forbidden} não pode voltar como import estático do CardVisionApp.`);
}
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/lib\/premiumCleanResultV3810['"]/m, 'Resultado premium clean deve permanecer fora do runtime inicial.');
assert.match(app, /^import type \{ PremiumCleanExportFormat \} from ['"]@\/lib\/premiumCleanResultV3810['"];$/m, 'O formato de exportação pode permanecer apenas como contrato de tipo.');

assert.match(app, /loadContinuousRulesRuntimeR168/, 'CardVisionApp deve usar a fronteira lazy R168 para regras contínuas.');
assert.match(app, /loadCardVisionExportRuntimeR168/, 'CardVisionApp deve usar a fronteira lazy R168 para exportações.');

assert.match(runtime, /continuousRulesRuntimePromiseR168/, 'Runtime de regras deve ser memoizado.');
assert.match(runtime, /cardVisionExportRuntimePromiseR168/, 'Runtime de exportação deve ser memoizado.');
assert.match(runtime, /import\(['"]@\/lib\/continuousRulesV3770['"]\)/, 'Regras contínuas devem ser importadas dinamicamente.');
assert.match(runtime, /import\(['"]@\/modules\/builds\/buildReportExport['"]\)/, 'Relatório profissional deve ser importado dinamicamente.');
assert.match(runtime, /import\(['"]@\/lib\/premiumCleanResultV3810['"]\)/, 'Exportação premium clean deve ser importada dinamicamente.');
assert.match(runtime, /import\(['"]@\/modules\/export\/clientTextExportR129['"]\)/, 'Exportador R129 deve ser importado dinamicamente.');

assert.match(app, /const activation = continuousRules\.activateContinuousRulePackV3770\(pack\)/, 'Ativação R37.70 deve continuar usando a autoridade original.');
assert.match(app, /continuousRules\.sanitizeContinuousRulePackV3770\(payload\)/, 'Pacote remoto deve continuar sendo sanitizado pela autoridade original.');
assert.match(app, /continuousRules\.computeRulePackChecksumV3770\(base\)/, 'Exportação do pacote deve manter checksum R37.70.');
assert.match(app, /continuousRules\.restoreRulePackVersionV3770\(version\)/, 'Restauração deve continuar usando o histórico R37.70.');
assert.match(app, /await applyRulePackAndRefresh\(pack,/, 'Ativação remota deve aguardar a fronteira lazy antes de atualizar a UI.');

assert.match(vaultActionsR185, /clientTextExport\.downloadClientTextExportR129\(exportRuntime\.clientTextExport\.buildSavedAnalysisHtmlExportR129\(item\)\)/, 'Export individual R129 deve manter API nomeada anti-inversão na fronteira R185.');
assert.match(resultActionsR188, /premiumCleanResult\.buildPremiumCleanCardSvg\(input\.result, \{/, 'Ficha visual deve continuar usando o gerador premium clean original na fronteira R188.');
assert.match(resultActionsR188, /premiumCleanResult\.premiumCleanSvgToPngBlob\(svg, dimensions\.width, dimensions\.height\)/, 'Conversão PNG deve continuar usando o conversor premium clean original na fronteira R188.');
assert.match(resultActionsR188, /buildReportExport\.buildProfessionalReportHtml\(/, 'Impressão deve continuar usando o relatório profissional original na fronteira R188.');

console.log('R168 aprovada: regras e exportações ficaram lazy sem alterar autoridades R37.70, R129 ou Premium Clean.');
