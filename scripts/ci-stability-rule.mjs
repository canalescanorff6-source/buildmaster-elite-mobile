import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, '.ci-stability');
const reportFile = path.join(reportDir, 'changed-files.txt');
const assertClean = process.argv.includes('--assert-clean');

const ignored = [
  '.ci-reports/',
  '.ci-stability/',
  '.next/',
  'node_modules/',
  'out/',
  'android/app/src/main/assets/public/update-manifest.json',
  'public/update-manifest.json',
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}

function statusEntries() {
  const raw = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: root, encoding: 'utf8' });
  return raw.split('\0').filter(Boolean).map((row) => {
    const body = row.slice(3);
    const renamed = body.includes(' -> ') ? body.split(' -> ').pop() : body;
    return String(renamed || '').replace(/^"|"$/g, '');
  }).filter((file) => file && !ignored.some((prefix) => file === prefix.replace(/\/$/, '') || file.startsWith(prefix)));
}

function snapshot() {
  const files = statusEntries().sort();
  const hash = createHash('sha256');
  hash.update(JSON.stringify(files));
  for (const file of files) {
    const absolute = path.join(root, file);
    if (existsSync(absolute)) hash.update(readFileSync(absolute));
    else hash.update('<deleted>');
  }
  return { files, digest: hash.digest('hex') };
}

mkdirSync(reportDir, { recursive: true });

if (assertClean) {
  const state = snapshot();
  if (state.files.length) {
    console.error('::error title=Regra Zero-Red::O CI alterou arquivos rastreados depois da estabilização.');
    console.error(state.files.join('\n'));
    process.exit(1);
  }
  console.log('Regra Zero-Red: árvore permaneceu imutável durante validação/build.');
  process.exit(0);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const MAX_PASSES = 5;
let previous = null;
let stable = null;

for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
  console.log(`\n[ZERO-RED] Passagem ${pass}/${MAX_PASSES} — convergência determinística`);
  run(npmCommand, ['run', 'ci:repair-safe']);
  const current = snapshot();
  console.log(`[ZERO-RED] Passagem ${pass}: ${current.files.length} arquivo(s) divergente(s) do HEAD.`);

  if (previous && current.digest === previous.digest) {
    stable = current;
    console.log(`[ZERO-RED] Ponto fixo atingido na passagem ${pass}.`);
    break;
  }
  previous = current;
}

if (!stable) {
  console.error(`::error title=Regra Zero-Red::Os reparadores não atingiram ponto fixo em ${MAX_PASSES} passagens. Há oscilação ou convergência não determinística.`);
  console.error('Últimos arquivos alterados:', previous?.files.join(', ') || '(nenhum)');
  process.exit(1);
}

writeFileSync(reportFile, stable.files.join('\n') + (stable.files.length ? '\n' : ''), 'utf8');

if (stable.files.length) {
  console.warn(`::warning title=Regra Zero-Red::${stable.files.length} arquivo(s) convergiram para um estado estável e devem ser gravados no repositório antes do APK.`);
  for (const file of stable.files) console.log(`ZERO_RED_CHANGED ${file}`);
} else {
  console.log('Regra Zero-Red: fonte já convergida e idempotente.');
}
