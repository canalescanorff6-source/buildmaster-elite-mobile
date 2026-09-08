import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// 1) Sanitizador moderno: patchers textuais históricos não podem reescrever a árvore r119+.
const sanitizer = read('scripts/sanitize-update-source.mjs');
const detectIndex = sanitizer.indexOf("BM_R119_CLEAN_SLATE_SINGLE_WRITER");
const skipIndex = sanitizer.indexOf("patchers históricos r16-r116 ignorados");
const firstHistoricalCall = sanitizer.indexOf('applyPreFinalConfirmationR16(root)');
assert.ok(detectIndex >= 0 && skipIndex > detectIndex && firstHistoricalCall > skipIndex,
  'R180: o sanitizador precisa detectar r119+ antes de qualquer patcher histórico.');
assert.match(sanitizer, /return \{ modernTree: true, sourcePatched: false \}/,
  'R180: árvore moderna precisa sair do sanitizador sem reescrita de source/tests.');

// 2) O bridge OCR pode reexportar DEFAULT_OCR_ZONES, mas não deve importá-lo como valor não usado.
const ocr = read('src/lib/ocr.ts');
assert.doesNotMatch(ocr, /import \{\s*DEFAULT_OCR_ZONES/,
  'R180: DEFAULT_OCR_ZONES não pode voltar como import de valor morto em ocr.ts.');
assert.match(ocr, /export \{ DEFAULT_OCR_ZONES \} from '.\/ocrZonesModelR164'/,
  'R180: compatibilidade pública de DEFAULT_OCR_ZONES deve continuar preservada por reexport.');

// 3) Cadeia canônica: evidência temporal -> single writer -> diagnósticos read-only -> selos R126/R128.
const pipeline = read('src/lib/cardIntelligencePipeline.ts');
const markers = [
  'attachMatchEvidenceCalibrationR136(current)',
  'applyCleanSlatePerformance2027R119(current, protectedRawCard)',
  'applyPostAuthorityReadOnly(current, applyProduction2027R100)',
  'applyPostAuthorityReadOnly(current, applyPlayerGenerationFinalizerV4080R13)',
  'sealProductionAuthorityR126(current)',
  'sealProductionAuthorityR128(current)'
];
let previous = -1;
for (const marker of markers) {
  const index = pipeline.indexOf(marker);
  assert.ok(index > previous, `R180: ordem canônica inválida ou ausente: ${marker}`);
  previous = index;
}
assert.match(pipeline, /BM_R119_CLEAN_SLATE_SINGLE_WRITER/);
assert.match(pipeline, /BM_R128_OUTPUT_INTEGRITY/);

// Nenhum outro arquivo pode materializar cleanSlate2027R119 como writer de objeto.
const tsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name)) tsFiles.push(full);
  }
}
walk(srcRoot);
const writerFiles = new Set();
for (const file of tsFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/cleanSlate2027R119\s*:/.test(source)) writerFiles.add(path.relative(root, file).replaceAll('\\', '/'));
}
assert.deepEqual([...writerFiles], ['src/lib/cleanSlatePerformance2027V4080R119.ts'],
  'R180: cleanSlate2027R119 deve continuar materializado em um único arquivo writer.');

// 4) Integridade do output cobre os quatro recursos decisórios.
const outputIntegrity = read('src/lib/productionAuthorityR128.ts');
for (const required of ['trainingFingerprint(result)', 'result.recommendedSkills', 'impetoFingerprint(result)', 'result.trainingPointsRemaining']) {
  assert.ok(outputIntegrity.includes(required), `R180: R128 deixou de proteger ${required}.`);
}

// 5) Regressões históricas devem apontar para a autoridade modular atual, não para o shell antigo.
const v3030 = read('tests/v30-30-detailed-print-intelligence-regression.ts');
const v3040 = read('tests/v30-40-smart-card-crop-regression.ts');
const v3050 = read('tests/v30-50-ultra-precision-ocr-regression.ts');
const v3140 = read('tests/v31-40-rigid-adaptive-ocr-regression.ts');
const v3500 = read('tests/v35-00-official-additional-skills-meta-regression.ts');
assert.match(v3030, /readerAnalysisRuntimeR163\.ts/);
assert.match(v3040, /readerAnalysisRuntimeR163\.ts/);
assert.match(v3050, /readerAnalysisRuntimeR163\.ts/);
assert.match(v3140, /readerAnalysisRuntimeR163\.ts/);
assert.match(v3500, /assert\.notDeepEqual\(asCF\.training, dribbler\.training/,
  'R180: v35 precisa validar ficha adaptável por posição, não receita imutável.');
assert.match(v3500, /assert\.equal\(asCF\.cleanSlate2027R119\?\.cardKey, dribbler\.cleanSlate2027R119\?\.cardKey/,
  'R180: identidade permanente da mesma carta precisa continuar fixa.');

// 6) Grafo runtime: todos os módulos src precisam ser alcançáveis por entrypoint Next, inclusive global-error.
const fileSet = new Set(tsFiles.map((file) => path.resolve(file)));
function resolveSource(specifier, importer) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(srcRoot, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(importer), specifier);
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
  return candidates.map((candidate) => path.resolve(candidate)).find((candidate) => fileSet.has(candidate)) ?? null;
}
const graph = new Map();
const patterns = [
  // Imports/exports estáticos podem ocupar várias linhas. O lazy modifier evita
  // atravessar mais código do que o necessário até o primeiro specifier literal.
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  /require\(\s*['"]([^'"]+)['"]\s*\)/g
];
for (const file of fileSet) {
  const source = fs.readFileSync(file, 'utf8');
  const edges = new Set();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      const target = resolveSource(match[1], file);
      if (target) edges.add(target);
    }
  }
  graph.set(file, edges);
}
const appEntrypointNames = new Set(['page.tsx','layout.tsx','route.ts','loading.tsx','error.tsx','not-found.tsx','global-error.tsx']);
const roots = [...fileSet].filter((file) => {
  const rel = path.relative(srcRoot, file).replaceAll('\\', '/');
  return rel.startsWith('app/') && appEntrypointNames.has(path.basename(file));
});
const reachable = new Set();
const stack = [...roots];
while (stack.length) {
  const file = stack.pop();
  if (reachable.has(file)) continue;
  reachable.add(file);
  for (const target of graph.get(file) ?? []) if (!reachable.has(target)) stack.push(target);
}
const unreachable = [...fileSet].filter((file) => !reachable.has(file)).map((file) => path.relative(root, file).replaceAll('\\','/')).sort();
assert.deepEqual(unreachable, [], `R180: módulos src órfãos do runtime: ${unreachable.join(', ')}`);

// 7) A cadeia oficial de release preserva R180 e avança para R181.
const pkg = JSON.parse(read('package.json'));
assert.match(pkg.scripts['test:v4080'] ?? '', /npm run test:r180 && npm run test:r181 && npm run test:r182 && npm run test:r183/);
assert.match(pkg.scripts['test:all'] ?? '', /npm run test:v4080\s*$/);

console.log(`R180 auditoria global aprovada: ${fileSet.size} módulos src alcançáveis, single writer preservado e regressões históricas alinhadas.`);
