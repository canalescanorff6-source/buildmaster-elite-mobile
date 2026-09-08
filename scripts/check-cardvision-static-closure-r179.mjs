import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R179 = 188;
const MAX_SOURCE_BYTES_R179 = 2_687_000;

function resolveSource(specifier, importer) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(srcRoot, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(importer), specifier);
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}
function staticRuntimeImports(source) {
  const imports = [];
  const regex = /^\s*import\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"];?/gm;
  let match;
  while ((match = regex.exec(source))) imports.push(match[1]);
  return imports;
}
const seen = new Set();
const stack = [entry];
while (stack.length) {
  const file = path.resolve(stack.pop());
  if (seen.has(file)) continue;
  seen.add(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const specifier of staticRuntimeImports(source)) {
    const resolved = resolveSource(specifier, file);
    if (resolved && !seen.has(path.resolve(resolved))) stack.push(resolved);
  }
}
const sourceBytes = [...seen].reduce((sum, file) => sum + fs.statSync(file).size, 0);
for (const forbidden of [
  'src/lib/confidenceComparison.ts',
  'src/lib/cleanVaultV3800.ts',
  'src/modules/vault/vaultPersistenceCoordinatorR140.ts',
  'src/modules/backup/syncBackupEngine.ts',
  'src/modules/vault/vaultProductionLifecycleR139.ts',
  'src/modules/vault/vaultHistoryMutationsR129.ts',
  'src/lib/continuousRulesV3770.ts',
  'src/modules/builds/buildReportExport.ts',
  'src/lib/premiumCleanResultV3810.ts',
  'src/modules/export/clientTextExportR129.ts',
  'src/modules/coaching/smartCoachEngine.ts',
  'src/modules/matches/competitivePerformanceEngine.ts',
  'src/modules/training/trainingEvolutionEngine.ts',
  'src/components/lazy/AppLazyPanels.tsx',
  'src/components/lazy/AppPanelPreloadR174.ts',
  'src/modules/commercial/commercialization.ts',
  'src/lib/appRefinement.ts',
  'src/lib/easyExperience.ts',
  'src/lib/profileAvatar.ts',
  'src/modules/observability/useObservabilityFeatureFlag.ts',
  'src/modules/observability/observabilityEngine.ts',
  'src/modules/runtime/cardVisionStartupRuntimeR177.ts',
  'src/components/CalibrationProfileFields.tsx',
  'src/components/ManagerSelectionField.tsx',
  'src/components/EfootballV600PreviewV4070.tsx',
  'src/components/UnifiedCreationFlowV3790.tsx',
]) {
  if (seen.has(path.join(root, forbidden))) throw new Error(`R179: ${forbidden} voltou à árvore estática.`);
}
for (const required of [
  'src/lib/playerComparisonR171.ts',
  'src/modules/vault/vaultBootstrapSummaryR173.ts',
  'src/modules/vault/vaultHistoryCommitR172.ts',
  'src/modules/vault/vaultDeferredRuntimeR169.ts',
  'src/modules/vault/vaultNoteMutationR169.ts',
  'src/components/lazy/CardVisionLazyPanelsR174.tsx',
  'src/hooks/useCardVisionCentralWorkspaceR175.ts',
  'src/hooks/useCardVisionNavigationControllerR176.ts',
  'src/lib/appNavigationR127.ts',
  'src/hooks/useCardVisionStartupLifecycleR177.ts',
  'src/modules/experience/cardVisionExperienceControllerR178.ts',
  'src/hooks/useCardVisionDerivedStateR179.ts',
  'src/components/lazy/CardVisionConditionalFieldsR179.tsx',
]) {
  if (!seen.has(path.join(root, required))) throw new Error(`R179: contrato leve ausente da árvore estática: ${required}.`);
}
if (seen.size > MAX_MODULES_R179) throw new Error(`R179: árvore estática cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R179}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R179) throw new Error(`R179: árvore estática cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R179}).`);
console.log(`R179 static closure aprovado: ${seen.size} módulos, ${sourceBytes} bytes de fonte estática.`);
