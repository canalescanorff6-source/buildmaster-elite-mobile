import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const hook = read('src/hooks/useActiveSessionAutosaveR157.ts');
const repo = read('src/modules/session/activeSessionRepositoryR137.ts');
const db = read('src/lib/localDatabase.ts');
const pkg = JSON.parse(read('package.json'));

assert.match(hook, /const mediaPersistedRef = useRef\(true\)/, 'R199: autosave deve rastrear confirmação real da mídia.');
assert.match(hook, /const mediaOk = mediaPersistedRef\.current \|\| persistMediaNow\(\)/, 'R199: flush deve tentar novamente mídia que falhou.');
assert.match(hook, /writeActiveSessionMetadataR157\(storageKey, current\) && mediaOk/, 'R199: estado saved exige metadados e mídia persistidos.');
assert.match(hook, /if \(!persistMediaNow\(\)\) onState\('error'\)/, 'R199: falha de mídia não pode ser silenciosa.');

assert.match(repo, /parsed\.repositoryVersion && parsed\.repositoryVersion !== ACTIVE_SESSION_REPOSITORY_R157_VERSION/, 'R199: versão split desconhecida deve ter caminho explícito de rejeição.');
assert.match(repo, /clearActiveSessionSnapshotR157\(storageKey\); return \{ version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'INVALID'/, 'R199: sessão split incompatível deve ser limpa antes do fallback legado.');

const trimStart = db.indexOf('export async function runtimeTrimStore');
const trimEnd = db.indexOf('export async function migrateLegacyRuntimeData');
assert.ok(trimStart >= 0 && trimEnd > trimStart, 'R199: runtimeTrimStore deve existir.');
const trim = db.slice(trimStart, trimEnd);
assert.match(trim, /db\.transaction\(storeName, 'readwrite'\)/, 'R199: trim deve usar uma única transação readwrite.');
assert.match(trim, /openCursor\(null, 'prev'\)/, 'R199: trim deve percorrer o store na própria transação.');
assert.match(trim, /if \(\+\+seen > safeKeep\) cursor\.delete\(\)/, 'R199: trim deve excluir exatamente tudo além do limite.');
assert.doesNotMatch(trim, /runtimeList|runtimeDelete|Promise\.all/, 'R199: trim não pode reabrir o banco para cada exclusão.');
assert.ok((db.match(/transactionGuard\(/g) ?? []).length >= 5, 'R199: get/mutate/list/trim devem compartilhar o mesmo lifecycle de timeout/close.');

const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96', 'R199: R119 não pode mudar na auditoria de persistência.');

let sourceBytes = 0;
const stack = ['src'];
while (stack.length) {
  const current = stack.pop();
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = `${current}/${entry.name}`;
    if (entry.isDirectory()) stack.push(target);
    else if (/\.(?:ts|tsx)$/.test(target)) sourceBytes += fs.statSync(target).size;
  }
}
const r200Boundary = fs.existsSync('src/modules/vault/cardHistoryStartupModelR200.ts');
assert.ok(sourceBytes <= (r200Boundary ? 5_341_000 : 5_335_307), `R199/R200: orçamento de fonte excedeu a margem aprovada (${sourceBytes} B).`);

const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(v4080.endsWith('npm run test:r198 && npm run test:r199') || v4080.endsWith('npm run test:r198 && npm run test:r199 && npm run test:r200'), 'R199: cadeia v40.80 deve preservar R198 -> R199 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R199: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R199 aprovada: sessão, cache IndexedDB e lifecycle de persistência endurecidos; src=${sourceBytes} B; R119 intacto.`);
