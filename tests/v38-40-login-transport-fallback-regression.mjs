import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const auth = read('src/lib/accountAuth.ts');
const gate = read('src/components/AuthGate.tsx');
const storage = read('src/lib/secureStorage.ts');
const capacitor = read('capacitor.config.ts');
const androidInstaller = read('scripts/install-android-security-plugin.mjs');
const directWorkflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');

assert.match(auth, /nativeSecureHttpRequest\(/, 'ponte HTTPS própria do BuildMaster ausente');
assert.match(auth, /CapacitorHttp\.request\(/, 'transporte oficial do Capacitor precisa continuar como reserva');
assert.match(auth, /performWebFetch\(url, init, headers, 30_000\)/, 'fallback web independente ausente');
assert.match(auth, /nativeRequestData\(init\.body, headers\)/, 'corpo JSON não está normalizado para o Capacitor');
assert.match(auth, /NATIVE=.*CAP=.*WEB=/s, 'diagnóstico dos três transportes ausente');
assert.match(auth, /path\.startsWith\('\/functions\/v1\/'\).*X-BuildMaster-Version/s, 'cabeçalho de versão deve ficar restrito às Edge Functions');
assert.match(auth, /restoreCachedAccessForUsername/, 'fallback da licença local por usuário ausente');
assert.doesNotMatch(auth, /catch \{\s*throw new Error\('Não consegui conectar ao Supabase/, 'login ainda apaga a causa real da falha');
assert.match(storage, /nativeHttpRequest/, 'contrato TypeScript da ponte HTTPS própria ausente');
assert.match(androidInstaller, /public void nativeHttpRequest\(PluginCall call\)/, 'método Java de rede nativa ausente');
assert.match(androidInstaller, /HttpsURLConnection|HttpURLConnection/, 'ponte Java não usa transporte HTTPS nativo');
assert.match(androidInstaller, /NATIVE_HTTP_DNS/, 'diagnóstico nativo de DNS ausente');
assert.match(androidInstaller, /NATIVE_HTTP_TLS/, 'diagnóstico nativo de TLS ausente');
assert.match(androidInstaller, /NATIVE_HTTP_TIMEOUT/, 'diagnóstico nativo de timeout ausente');
assert.match(androidInstaller, /catch \(SSLException error\)/, 'diagnóstico TLS precisa cobrir todas as exceções SSL');
assert.match(gate, /restoreCachedAccessForUsername\(cleanUser\)/, 'tela de login não tenta a licença offline válida');
assert.doesNotMatch(gate, /if \(!online\) throw new Error/, 'navigator.onLine ainda bloqueia uma conexão funcional');
assert.doesNotMatch(gate, /disabled=\{loading \|\| !online/, 'botão de login ainda depende do indicador impreciso navigator.onLine');
assert.doesNotMatch(gate, /desligue VPN|DNS privado temporariamente/i, 'a interface ainda acusa VPN ou DNS sem diagnóstico');
assert.match(capacitor, /CapacitorHttp:[\s\S]*enabled: false/, 'fetch web precisa permanecer independente da ponte nativa');
for (const permission of ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE']) {
  assert.ok(androidInstaller.includes(permission), `instalador Android sem ${permission}`);
  assert.ok(directWorkflow.includes(permission), `workflow direto sem validação de ${permission}`);
  assert.ok(playWorkflow.includes(permission), `workflow Play sem validação de ${permission}`);
}
assert.match(directWorkflow, /auth\/v1\/health/, 'workflow direto não testa o Supabase antes do APK');
assert.match(playWorkflow, /auth\/v1\/health/, 'workflow Play não testa o Supabase antes do AAB');
for (const [label, workflow] of [['direto', directWorkflow], ['Play', playWorkflow]]) {
  assert.match(workflow, /payload\?\.name !== 'GoTrue'/, `workflow ${label} não confirma que a resposta é do Supabase Auth`);
  assert.match(workflow, /typeof payload\?\.version !== 'string'/, `workflow ${label} não confirma a versão do GoTrue`);
}
assert.match(playWorkflow, /NEXT_PUBLIC_SUPABASE_URL.*URL válida do Supabase/s, 'workflow Play não valida o formato da URL');
assert.match(playWorkflow, /sb_publishable_\*/, 'workflow Play não aceita explicitamente a Publishable key');
assert.match(androidInstaller, /validateNativeHttpUrl\(url\)/, 'ponte nativa não valida o host antes de conectar');
assert.match(androidInstaller, /setInstanceFollowRedirects\(false\)/, 'ponte de login não bloqueia redirecionamentos inesperados');

const secureIndex = auth.indexOf('nativeSecureHttpRequest');
const capacitorIndex = auth.indexOf('CapacitorHttp.request');
const webIndex = auth.indexOf('performWebFetch(url, init, headers, 30_000)');
assert.ok(secureIndex >= 0 && capacitorIndex > secureIndex && webIndex > capacitorIndex, 'ordem de fallback deve ser ponte própria, Capacitor e Web');

console.log('v38.40 login resiliente aprovado: três transportes independentes, CORS limpo, licença offline e preflight do Supabase.');
