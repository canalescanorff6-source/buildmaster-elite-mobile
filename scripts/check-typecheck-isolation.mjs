import fs from 'node:fs';
import path from 'node:path';

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const pkg = readJson('package.json');
const root = readJson('tsconfig.json');
const app = readJson('tsconfig.app.json');

if (!String(pkg.scripts?.typecheck || '').includes('-p tsconfig.app.json')) {
  fail('O typecheck principal precisa usar tsconfig.app.json.');
}
for (const [label, config] of [['tsconfig.json', root], ['tsconfig.app.json', app]]) {
  const include = config.include || [];
  const exclude = new Set(config.exclude || []);
  if (include.some((item) => item === '**/*.ts' || item === '**/*.tsx' || item.startsWith('tests'))) {
    fail(`${label} possui include amplo que pode carregar stubs de testes.`);
  }
  if (!exclude.has('tests')) {
    fail(`${label} precisa excluir a pasta tests por inteiro.`);
  }
}

const testStubs = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/stubs?\.d\.ts$/i.test(entry.name)) testStubs.push(target);
  }
};
walk('tests');
if (!testStubs.length) fail('Nenhum stub de teste foi localizado para validar o isolamento.');
const contaminated = testStubs.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return /declare module ['"](?:react|lucide-react|@\/lib\/analyzer)['"]/.test(text);
});
if (!contaminated.length) fail('Os stubs críticos de React/Lucide/analyzer não foram encontrados.');

console.log(`Isolamento TypeScript aprovado: ${contaminated.length} fixture(s) permanecem exclusivas dos typechecks direcionados.`);
