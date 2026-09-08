import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const entry = path.join(srcRoot, 'components', 'result', 'ResultWorkspace.tsx');
const MAX_MODULES_R192 = 125;
const MAX_SOURCE_BYTES_R192 = 2_135_000;

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
const advancedBoundary = path.resolve(path.join(srcRoot, 'components', 'result', 'ResultAdvancedWorkspaceR192.tsx'));
const reviewBoundary = path.resolve(path.join(srcRoot, 'components', 'result', 'ResultReviewPanelR189.tsx'));
const calibrationBoundary = path.resolve(path.join(srcRoot, 'components', 'result', 'RealMatchCalibrationPanelR189.tsx'));

if (seen.has(advancedBoundary)) throw new Error('R192: ferramentas avançadas voltaram à árvore estática do ResultWorkspace.');
if (seen.has(reviewBoundary)) throw new Error('R192: ReviewPanel voltou à árvore estática do ResultWorkspace.');
if (seen.has(calibrationBoundary)) throw new Error('R192: calibração pós-partida voltou à árvore estática do ResultWorkspace.');
if (seen.size > MAX_MODULES_R192) throw new Error(`R192: closure do ResultWorkspace cresceu para ${seen.size} módulos (limite ${MAX_MODULES_R192}).`);
if (sourceBytes > MAX_SOURCE_BYTES_R192) throw new Error(`R192: closure do ResultWorkspace cresceu para ${sourceBytes} bytes (limite ${MAX_SOURCE_BYTES_R192}).`);

console.log(`R192 result closure aprovado: ${seen.size} módulos, ${sourceBytes} bytes; ferramentas avançadas, revisão e calibração permanecem fora do carregamento inicial.`);
