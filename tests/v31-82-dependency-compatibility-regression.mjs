import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const runtimeCheck = fs.readFileSync('scripts/check-runtime-exports.mjs', 'utf8');
const installedCheck = fs.readFileSync('scripts/check-installed-dependencies.mjs', 'utf8');

assert.match(pkg.scripts['quality:dependencies'], /check-installed-dependencies\.mjs/);
assert.match(pkg.scripts['quality:dependencies'], /check-runtime-exports\.mjs/);
assert.match(runtimeCheck, /\(\[\^\{\}\]\*\)/);
assert.doesNotMatch(runtimeCheck, /const importPattern\s*=\s*\/[^\n]*\[\\s\\S\]\*\?/);
assert.match(runtimeCheck, /--scan-only/);
assert.match(installedCheck, /package-lock\.json/);
assert.match(installedCheck, /React e React DOM/);
assert.match(installedCheck, /Capacitor Core, Android e CLI/);

function walk(root) {
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...walk(target));
    else if (/\.(?:ts|tsx)$/.test(target)) output.push(target);
  }
  return output;
}

const imports = new Set();
const strictPattern = /\bimport\s*\{([^{}]*)\}\s*from\s*['"]lucide-react['"]\s*;?/g;
for (const file of walk('src')) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(strictPattern)) {
    for (const entry of match[1].split(',')) {
      const name = entry.trim().replace(/^type\s+/, '').split(/\s+as\s+/i)[0].trim();
      if (name) imports.add(name);
    }
  }
}

assert.ok(imports.size >= 100, `Poucos ícones encontrados: ${imports.size}`);
for (const falsePositive of ['useState', 'useEffect', 'CSSProperties', 'PointerEvent', 'ReactNode', 'ChangeEvent']) {
  assert.equal(imports.has(falsePositive), false, `${falsePositive} foi capturado como ícone.`);
}
for (const name of imports) assert.match(name, /^[A-Za-z_$][\w$]*$/);

const scan = spawnSync(process.execPath, ['scripts/check-runtime-exports.mjs', '--scan-only'], { encoding: 'utf8' });
assert.equal(scan.status, 0, scan.stderr || scan.stdout);
assert.match(scan.stdout, /Scanner lucide-react aprovado:/);

console.log(`v31.82 compatibilidade de dependências aprovada sem falsos imports do React (${imports.size} ícones reais).`);
