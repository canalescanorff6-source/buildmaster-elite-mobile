import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R200 = 90;
const MAX_SOURCE_BYTES_R200 = 640_000;

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
const forbidden = [
  ['lib/analyzer.ts', 'analyzer pesado'],
  ['lib/cleanSlatePerformance2027V4080R119.ts', 'R119'],
  ['modules/analysis/productionOrchestratorR138.ts', 'orquestrador de produção R138'],
  ['modules/vault/cardHistoryStore.ts', 'store/migração pesada do Cofre'],
  ['lib/creatorBuildResearch.ts', 'pesquisa de criadores'],
  ['lib/competitiveBuildFusion.ts', 'competitive fusion'],
  ['lib/globalProBenchmarkV3900.ts', 'Global Pro'],
  ['modules/builds/dynamicRules.ts', 'motor completo de regras'],
  ['components/vault/CardVisionVaultWorkspaceR191.tsx', 'Cofre R191'],
  ['components/settings/CardVisionSettingsWorkspaceR190.tsx', 'Ajustes R190'],
  ['modules/result/cardVisionResultActionsR188.ts', 'ações de resultado R188'],
];
for (const [relative, label] of forbidden) {
  if (seen.has(path.resolve(path.join(srcRoot, relative)))) throw new Error(`R200: ${label} voltou à closure inicial.`);
}
if (seen.size > MAX_MODULES_R200) throw new Error(`R200: closure inicial cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R200}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R200) throw new Error(`R200: closure inicial cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R200}).`);
const r199Bytes = 2_377_217;
if (sourceBytes > Math.floor(r199Bytes * 0.30)) throw new Error(`R200: redução de startup ficou abaixo de 70% vs R199 (${sourceBytes} B).`);
console.log(`R200 static closure aprovada: ${seen.size} módulos, ${sourceBytes} bytes; redução ${(100 * (1 - sourceBytes / r199Bytes)).toFixed(1)}% vs R199.`);
