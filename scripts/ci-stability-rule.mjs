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

console.log('\n[ZERO-RED] Passagem 1 — convergência determinística');
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'ci:repair-safe']);
const first = snapshot();

console.log('\n[ZERO-RED] Passagem 2 — prova de idempotência');
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'ci:repair-safe']);
const second = snapshot();

if (first.digest !== second.digest) {
  console.error('::error title=Regra Zero-Red::Um reparador mudou a árvore novamente na segunda passagem. O reparo não é idempotente e não pode chegar ao APK.');
  console.error('Passagem 1:', first.files.join(', ') || '(limpa)');
  console.error('Passagem 2:', second.files.join(', ') || '(limpa)');
  process.exit(1);
}

writeFileSync(reportFile, second.files.join('\n') + (second.files.length ? '\n' : ''), 'utf8');

if (second.files.length) {
  console.warn(`::warning title=Regra Zero-Red::${second.files.length} arquivo(s) precisaram de convergência e devem ser gravados no repositório antes do APK.`);
  for (const file of second.files) console.log(`ZERO_RED_CHANGED ${file}`);
} else {
  console.log('Regra Zero-Red: fonte já convergida; duas passagens produziram árvore idêntica.');
}
