import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const doctor = readFileSync(path.join(projectRoot, 'scripts/ci-doctor.mjs'), 'utf8');
assert.match(doctor, /Regressões v31\.20[^\n]+test:v3120/);
assert.match(doctor, /Regressões v38\.70[^\n]+test:v3870/);
const result = spawnSync(npmCommand, ['run', 'test:v3120', '--silent'], {
  cwd: projectRoot,
  encoding: 'utf8',
  env: process.env,
  shell: false
});
assert.equal(result.status, 0, `A regressão v31.20 ainda falhou.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
assert.match(result.stdout, /interface premium validada/);
assert.match(result.stdout, /Contexto tático v31\.20 aprovado/);
console.log('v38.70 hotfix final aprovado: regressão v31.20 estável no mesmo processo usado pelo GitHub Actions.');
