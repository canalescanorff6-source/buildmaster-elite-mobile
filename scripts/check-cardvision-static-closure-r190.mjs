import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R190 = 179;
const MAX_SOURCE_BYTES_R190 = 2_405_000;

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
const settingsBoundary = path.resolve(path.join(srcRoot, 'components', 'settings', 'CardVisionSettingsWorkspaceR190.tsx'));
const resultBoundary = path.resolve(path.join(srcRoot, 'modules', 'result', 'cardVisionResultActionsR188.ts'));
if (seen.has(settingsBoundary)) throw new Error('R190: workspace de Ajustes voltou à árvore estática inicial.');
if (seen.has(resultBoundary)) throw new Error('R190: ações de resultado voltaram à árvore estática inicial.');
if (seen.size > MAX_MODULES_R190) throw new Error(`R190: árvore estática cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R190}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R190) throw new Error(`R190: árvore estática cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R190}).`);
console.log(`R190 static closure aprovado: ${seen.size} módulos, ${sourceBytes} bytes; Ajustes e ações de resultado permanecem lazy.`);
