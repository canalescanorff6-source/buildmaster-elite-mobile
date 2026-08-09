import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const auth = read('src/lib/accountAuth.ts');
const gate = read('src/components/AuthGate.tsx');
const capacitor = read('capacitor.config.ts');
const androidInstaller = read('scripts/install-android-security-plugin.mjs');
const directWorkflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');

assert.match(auth, /CapacitorHttp\.request\(/, 'transporte HTTP nativo precisa continuar como rota principal');
assert.match(auth, /return await performWebFetch\(url, init, headers, 28_000\)/, 'fallback web independente ausente');
assert.match(auth, /nativeRequestData\(init\.body, headers\)/, 'corpo JSON não está normalizado para o Android');
assert.match(auth, /Transporte nativo:.*transporte web:/s, 'diagnóstico dos dois transportes ausente');
assert.match(auth, /restoreCachedAccessForUsername/, 'fallback da licença local por usuário ausente');
assert.doesNotMatch(auth, /catch \{\s*throw new Error\('Não consegui conectar ao Supabase/, 'login ainda apaga a causa real da falha');
assert.match(gate, /restoreCachedAccessForUsername\(cleanUser\)/, 'tela de login não tenta a licença offline válida');
assert.doesNotMatch(gate, /if \(!online\) throw new Error/, 'navigator.onLine ainda bloqueia uma conexão funcional');
assert.match(capacitor, /CapacitorHttp:[\s\S]*enabled: false/, 'fetch web precisa permanecer independente da ponte nativa');
for (const permission of ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']) {
  assert.ok(androidInstaller.includes(permission), `instalador Android sem ${permission}`);
  assert.ok(directWorkflow.includes(permission), `workflow direto sem validação de ${permission}`);
  assert.ok(playWorkflow.includes(permission), `workflow Play sem validação de ${permission}`);
}

const nativeIndex = auth.indexOf('CapacitorHttp.request');
const webIndex = auth.indexOf('return await fetch(url');
assert.ok(nativeIndex >= 0 && webIndex > nativeIndex, 'Android deve tentar o transporte nativo antes do web');
assert.ok(webIndex - nativeIndex > 400, 'fallback web não pode ficar acoplado como repetição imediata da criação de conta');

console.log('v38.40 login resiliente aprovado: HTTP nativo, fallback web independente, licença offline e permissões Android.');
