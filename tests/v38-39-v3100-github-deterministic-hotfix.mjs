import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

const pkg = JSON.parse(read('package.json'));
const regression = read('tests/v31-10-unified-intelligence-regression.ts');

assert.match(pkg.version, /^(?:38\.(?:39|40)\.0|40\.(?:00|10)\.0)$/);
assert.match(pkg.scripts['test:v3100'], /--max-old-space-size=4096/);
assert.match(regression, /path\.resolve\(__dirname, '\.\.'\)/);
assert.match(regression, /readProjectFile/);
assert.match(regression, /38\\\.\(\?:37\|38\|39\|40\)-automatic-card-gameplay-/);
assert.match(regression, /buildVariants\.length >= 1 && result\.buildVariants\.length <= 5/);
assert.match(regression, /\[v31\.00\] Cenário que falhou/);
assert.doesNotMatch(regression, /fs\.readFileSync\('src\//);

const externalCwd = mkdtempSync(path.join(tmpdir(), 'buildmaster-v3100-'));
try {
  const hook = path.join(root, 'tests', '_ts-require.cjs');
  const test = path.join(root, 'tests', 'v31-10-unified-intelligence-regression.ts');
  const run = spawnSync(process.execPath, ['--max-old-space-size=4096', '-r', hook, test], {
    cwd: externalCwd,
    encoding: 'utf8',
    env: { ...process.env, BUILDMASTER_CI: '1' },
    timeout: 180_000,
  });
  if (run.status !== 0) {
    process.stderr.write(run.stdout || '');
    process.stderr.write(run.stderr || '');
  }
  assert.equal(run.status, 0, 'A regressão v31.00 precisa passar mesmo quando executada fora da raiz do repositório.');
  assert.match(run.stdout, /inteligência personalizada.*aprovados|inteligência e habilidades personalizadas aprovados|simulador profundo.*aprovados/i);
} finally {
  rmSync(externalCwd, { recursive: true, force: true });
}

console.log('v38.39 hotfix aprovado: regressão v31.00 independente do diretório, compatível com o perfil automático e com diagnósticos completos.');
