import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const appUpdates = read('src/lib/appUpdates.ts');
const bootstrap = read('src/modules/observability/ObservabilityBootstrap.tsx');
const reader = read('src/components/TotalCardReaderPanel.tsx');
const result = read('src/components/result/ResultWorkspace.tsx');
const updater = read('src/components/UpdateCenterPanel.tsx');
const convergence = read('scripts/check-android-release-convergence-r183.mjs');
const retiredFormationRoleLab = 'src/components/FormationRoleLabPanel.tsx';
const currentFormationRoleLab = 'src/components/FormationRoleLabPanelV4080.tsx';

const releaseFallback = (appUpdates.match(/APP_RELEASE_VERSION\s*=\s*[^\n]*\|\|\s*'([^']+)'/) || [])[1] || '';
const nativeFallback = (appUpdates.match(/APP_NATIVE_VERSION\s*=\s*[^\n]*\|\|\s*'([^']+)'/) || [])[1] || '';
assert.equal(releaseFallback, String(pkg.version), 'R423: versão package e fallback web precisam ser idênticas.');
assert.equal(nativeFallback, String(pkg.version), 'R423: versão package e fallback nativo precisam ser idênticas.');
assert.match(convergence, /appUpdatesFallbackReleaseR423/, 'R423: preflight Android precisa validar a versão do appUpdates contra package.json.');
assert.match(convergence, /appUpdatesFallbackNativeR423/, 'R423: preflight Android precisa validar a versão nativa contra package.json.');
assert.equal(fs.existsSync(retiredFormationRoleLab), false, 'R423: painel de formação legado sem uso deve sair do source budget.');
assert.equal(fs.existsSync(currentFormationRoleLab), true, 'R423: substituto V4080 precisa permanecer presente.');

assert.match(bootstrap, /visibilitychange/, 'R423: lifecycle precisa observar retorno/background da WebView.');
assert.match(bootstrap, /app-resume/, 'R423: retorno ao foreground precisa ficar diagnosticável.');
assert.match(bootstrap, /app-background/, 'R423: ida ao background precisa ficar diagnosticável.');
assert.match(bootstrap, /stage:\s*'app-lifecycle'/, 'R423: lifecycle precisa usar contexto estruturado da R422.');

assert.match(reader, /total-read-complete/, 'R423: leitura completa precisa registrar duração real até terminar.');
assert.match(reader, /total-read-failed/, 'R423: falha da leitura precisa registrar duração e estágio.');
assert.match(reader, /90_000/, 'R423: meta histórica de 1,5 min precisa ser mensurável como limiar, não promessa.');
assert.match(reader, /performance\.now\(\)/, 'R423: duração da leitura precisa usar relógio monotônico.');
assert.match(reader, /URL\.revokeObjectURL/, 'R423: previews precisam liberar Object URLs para evitar pressão de memória.');
assert.match(reader, /loading="lazy"/, 'R423: previews devem permanecer lazy.');
assert.match(reader, /decoding="async"/, 'R423: decode de preview deve permanecer assíncrono.');

for (const marker of ['Pontos usados', 'Disponíveis', 'trainingPointsRemaining', 'Top 5', 'Ímpeto']) {
  assert.ok(result.includes(marker), `R423: ficha final precisa manter informação crítica visível: ${marker}`);
}

for (const marker of ['expectedPackageName', 'expectedVersionCode', 'expectedVersionName', 'visibilitychange']) {
  assert.ok(updater.includes(marker), `R423: fluxo de atualização perdeu proteção/retomada: ${marker}`);
}

console.log('R423 aprovada: lifecycle diagnosticável, leitura cronometrada, versão Android coerente e UX/integridade final preservadas.');
