import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));

const tsconfig = readJson('tsconfig.json');
const appTsconfig = readJson('tsconfig.app.json');
const packageJson = readJson('package.json');
const v3130 = read('tests/v31-30-supreme-gameplay-regression.ts');
const repair = read('scripts/repair-root-tsconfig.mjs');

assert.ok(Array.isArray(tsconfig.include), 'O tsconfig raiz precisa declarar include do aplicativo.');
assert.ok(tsconfig.include.includes('src/**/*.ts'));
assert.ok(tsconfig.include.includes('src/**/*.tsx'));
assert.ok(Array.isArray(tsconfig.exclude));
assert.ok(tsconfig.exclude.includes('tests'), 'O tsconfig raiz precisa excluir fixtures de testes.');
assert.ok(tsconfig.exclude.includes('android'));
assert.deepEqual(tsconfig.compilerOptions?.paths?.['@/*'], ['./src/*']);
assert.equal(tsconfig.compilerOptions?.baseUrl, undefined, 'O tsconfig raiz não pode herdar baseUrl de fixture direcionada.');
assert.equal(tsconfig.files, undefined, 'O tsconfig raiz não pode apontar para stubs de uma regressão específica.');
assert.ok(Array.isArray(appTsconfig.exclude) && appTsconfig.exclude.includes('tests'));
assert.match(String(packageJson.scripts?.typecheck ?? ''), /-p tsconfig\.app\.json/);
assert.ok(v3130.includes('40\\.(?:00|10|20)'), 'A regressão v31.30 deve aceitar as fichas públicas da linha v40.');
assert.doesNotMatch(v3130, /Ficha Automática v38\\\.\(\?:37\|38\)/);


assert.match(String(packageJson.scripts?.['preci:verify'] ?? ''), /types:repair/);
assert.match(String(packageJson.scripts?.pretypecheck ?? ''), /types:repair/);
assert.match(String(packageJson.scripts?.['quality:root-tsconfig'] ?? ''), /--check/);
assert.match(String(packageJson.scripts?.['test:v3839'] ?? ''), /root-tsconfig-self-healing-regression/);
assert.match(repair, /BUILDMASTER_PROJECT_ROOT/);
assert.match(repair, /restaurada automaticamente/);

console.log('v38.39 hotfix raiz aprovado: tsconfig principal restaurado e contrato v31.30 compatível com versões atuais.');
