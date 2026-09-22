import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R200 = 90;
// R455.1: R454 adiciona um módulo contextual de scouting ao caminho central.
// O teto absoluto foi rebaselinado sem afrouxar a meta estrutural:
// a guarda de >=70% de redução vs R199 abaixo continua obrigatória.
const MAX_SOURCE_BYTES_R200 = 675_000;

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
const parentByFile = new Map();
const stack = [entry];
while (stack.length) {
  const file = path.resolve(stack.pop());
  if (seen.has(file)) continue;
  seen.add(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const specifier of staticRuntimeImports(source)) {
    const resolved = resolveSource(specifier, file);
    if (resolved && !seen.has(path.resolve(resolved))) {
      const absoluteResolved = path.resolve(resolved);
      if (!parentByFile.has(absoluteResolved)) parentByFile.set(absoluteResolved, { importer: file, specifier });
      stack.push(resolved);
    }
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
if (sourceBytes > MAX_SOURCE_BYTES_R200) {
  const appEvolutionFile = path.resolve(path.join(srcRoot, 'lib/appEvolution.ts'));
  if (seen.has(appEvolutionFile)) {
    const chain = [];
    let cursor = appEvolutionFile;
    while (cursor) {
      chain.push(path.relative(root, cursor));
      const parent = parentByFile.get(cursor);
      if (!parent) break;
      cursor = parent.importer;
    }
    console.error(`R200 diagnóstico: appEvolution.ts entrou pela cadeia ${chain.reverse().join(' -> ')}`);
  }
  throw new Error(`R200: closure inicial cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R200}).`);
}
const r199Bytes = 2_377_217;
if (sourceBytes > Math.floor(r199Bytes * 0.30)) throw new Error(`R200: redução de startup ficou abaixo de 70% vs R199 (${sourceBytes} B).`);
console.log(`R200 static closure aprovada: ${seen.size} módulos, ${sourceBytes} bytes; redução ${(100 * (1 - sourceBytes / r199Bytes)).toFixed(1)}% vs R199.`);
