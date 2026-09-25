import fs from 'node:fs';
import path from 'node:path';

const TEST_ROOT = 'tests';
const SUPPORTED = /\.(?:mjs|cjs|js|ts|tsx)$/;
const failures = [];
let scanned = 0;
let checkedReferences = 0;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(target));
    else if (SUPPORTED.test(entry.name)) out.push(target);
  }
  return out;
}

function collectReadAliases(source) {
  const aliases = new Set();
  const aliasPatterns = [
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*fs\.readFileSync\s*\(/g,
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*[A-Za-z_$][\w$]*\s*=>\s*fs\.readFileSync\s*\(/g,
    /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{[^{}]{0,260}fs\.readFileSync\s*\(/g,
  ];
  for (const pattern of aliasPatterns) {
    for (const match of source.matchAll(pattern)) aliases.add(match[1]);
  }
  return aliases;
}

function collectLiteralReads(source) {
  const refs = new Set();
  const directPatterns = [
    /(?:fs\.)?readFileSync\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:fs\.promises\.)?readFile\s*\(\s*['"]([^'"]+)['"]/g,
  ];
  for (const pattern of directPatterns) {
    for (const match of source.matchAll(pattern)) refs.add(match[1]);
  }
  for (const alias of collectReadAliases(source)) {
    const escaped = alias.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('\\b' + escaped + '\\s*\\(\\s*[\\\'"]([^\\\'"]+)[\\\'"]', 'g');
    for (const match of source.matchAll(pattern)) refs.add(match[1]);
  }
  return refs;
}

for (const testFile of walk(TEST_ROOT)) {
  scanned += 1;
  const source = fs.readFileSync(testFile, 'utf8');
  for (const ref of collectLiteralReads(source)) {
    checkedReferences += 1;
    if (/^(?:https?:|data:)/i.test(ref)) continue;
    const normalized = ref.replaceAll('\\\\', '/');
    const resolved = path.resolve(normalized);
    if (!fs.existsSync(resolved)) failures.push({ testFile, ref: normalized });
  }
}

if (failures.length) {
  console.error('R473 CI: testes apontam para arquivo(s) inexistente(s):');
  for (const failure of failures) console.error('- ' + failure.testFile + ' -> ' + failure.ref);
  process.exit(1);
}

console.log('R473 CI aprovado: ' + scanned + ' teste(s), ' + checkedReferences + ' leitura(s) literal(is) sem referência obsoleta.');
