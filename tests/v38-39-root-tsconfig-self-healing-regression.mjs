import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repairScript = path.join(root, 'scripts', 'repair-root-tsconfig.mjs');
const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'buildmaster-tsconfig-repair-'));

const contaminatedRoot = {
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    strict: true,
    noEmit: true,
    jsx: 'react-jsx',
    baseUrl: '../..',
    paths: {
      '@/lib/analyzer': ['tests/types-v3170-ui/analyzer-stub.ts'],
      '@/*': ['src/*'],
    },
    types: [],
  },
  files: ['stubs.d.ts', '../../src/modules/matches/MatchTrainerCenter.tsx'],
};

try {
  writeFileSync(path.join(fixtureRoot, 'tsconfig.json'), `${JSON.stringify(contaminatedRoot, null, 2)}\n`);
  writeFileSync(path.join(fixtureRoot, 'tsconfig.app.json'), '{"extends":"./tsconfig.json"}\n');

  const repaired = spawnSync(process.execPath, [repairScript], {
    encoding: 'utf8',
    env: { ...process.env, BUILDMASTER_PROJECT_ROOT: fixtureRoot },
  });
  assert.equal(repaired.status, 0, repaired.stderr || repaired.stdout);
  assert.match(`${repaired.stdout}\n${repaired.stderr}`, /restaurada automaticamente/i);

  const rootConfig = JSON.parse(readFileSync(path.join(fixtureRoot, 'tsconfig.json'), 'utf8'));
  const appConfig = JSON.parse(readFileSync(path.join(fixtureRoot, 'tsconfig.app.json'), 'utf8'));
  assert.equal(rootConfig.compilerOptions.baseUrl, undefined);
  assert.equal(rootConfig.files, undefined);
  assert.deepEqual(rootConfig.compilerOptions.paths['@/*'], ['./src/*']);
  assert.ok(rootConfig.include.includes('src/**/*.tsx'));
  assert.ok(rootConfig.exclude.includes('tests'));
  assert.equal(appConfig.extends, './tsconfig.json');
  assert.ok(appConfig.exclude.includes('tests'));

  const checked = spawnSync(process.execPath, [repairScript, '--check'], {
    encoding: 'utf8',
    env: { ...process.env, BUILDMASTER_PROJECT_ROOT: fixtureRoot },
  });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.match(checked.stdout, /Configuração TypeScript raiz aprovada/);
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('v38.39 autorreparo aprovado: tsconfig contaminado por fixture é restaurado antes do diagnóstico e do build.');
