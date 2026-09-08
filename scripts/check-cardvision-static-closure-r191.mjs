import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'CardVisionApp.tsx');
const MAX_MODULES_R191 = 178;
const MAX_SOURCE_BYTES_R191 = 2_390_000;

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
const vaultBoundary = path.resolve(path.join(srcRoot, 'components', 'vault', 'CardVisionVaultWorkspaceR191.tsx'));
const settingsBoundary = path.resolve(path.join(srcRoot, 'components', 'settings', 'CardVisionSettingsWorkspaceR190.tsx'));
const resultBoundary = path.resolve(path.join(srcRoot, 'modules', 'result', 'cardVisionResultActionsR188.ts'));
for (const [file, label] of [[vaultBoundary, 'Cofre R191'], [settingsBoundary, 'Ajustes R190'], [resultBoundary, 'ações de resultado R188']]) {
  if (seen.has(file)) throw new Error(`R191: ${label} voltou à árvore estática inicial.`);
}
if (seen.size > MAX_MODULES_R191) throw new Error(`R191: árvore estática cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R191}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R191) throw new Error(`R191: árvore estática cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R191}).`);
console.log(`R191 static closure aprovado: ${seen.size} módulos, ${sourceBytes} bytes; Cofre, Ajustes e ações de resultado permanecem lazy.`);
