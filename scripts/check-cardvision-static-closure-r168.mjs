import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R168 = 194;
const MAX_SOURCE_BYTES_R168 = 2_790_000;

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
  'src/lib/continuousRulesV3770.ts',
  'src/modules/builds/buildReportExport.ts',
  'src/lib/premiumCleanResultV3810.ts',
  'src/modules/export/clientTextExportR129.ts',
  'src/modules/coaching/smartCoachEngine.ts',
  'src/modules/matches/competitivePerformanceEngine.ts',
  'src/modules/training/trainingEvolutionEngine.ts',
]) {
  if (seen.has(path.join(root, forbidden))) throw new Error(`R168: ${forbidden} voltou à árvore estática.`);
}
if (seen.size > MAX_MODULES_R168) throw new Error(`R168: árvore estática cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R168}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R168) throw new Error(`R168: árvore estática cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R168}).`);
console.log(`R168 static closure aprovado: ${seen.size} módulos, ${sourceBytes} bytes de fonte estática.`);
