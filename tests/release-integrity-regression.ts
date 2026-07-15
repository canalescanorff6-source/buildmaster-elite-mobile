import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const workflowPath = '.github/workflows/build-apk.yml';
assert.ok(fs.existsSync(workflowPath), 'ERRO: a pasta .github e o workflow build-apk.yml precisam estar no projeto enviado ao GitHub.');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const manifest = fs.readFileSync('public/manifest.webmanifest', 'utf8');
const sw = fs.readFileSync('public/sw.js', 'utf8');

assert.equal(pkg.version, '26.73.0', 'package.json precisa estar na v26.73.0');
assert.equal(lock.version, pkg.version, 'package-lock.json precisa ter a mesma versão do package.json');
assert.equal(lock.packages[''].version, pkg.version, 'raiz do package-lock precisa ter a mesma versão');
assert.ok(workflow.includes('v26.73'), 'Workflow antigo detectado: substitua também a pasta .github pelo arquivo desta versão.');
assert.ok(workflow.includes('BuildMaster-Elite-Tatico-v26.73.apk'), 'Nome do APK no workflow não corresponde à v26.73.');
assert.ok(workflow.includes("VERSION: '26.73.0'"), 'Manifesto de atualização do workflow não corresponde à v26.73.0.');
assert.ok(layout.includes('v26.73'), 'Metadados da interface não correspondem à v26.73.');
assert.ok(manifest.includes('v26.73'), 'manifest.webmanifest não corresponde à v26.73.');
assert.ok(sw.includes('26-73'), 'Cache do service worker não corresponde à v26.73.');
assert.doesNotMatch(workflow, /BuildMaster-Elite-Tatico-v26\.70|VERSION:\s*'26\.70\.0'/, 'Workflow v26.70 antigo ainda está presente.');

assert.ok(workflow.includes('ANDROID_SIGNING_BUNDLE'), 'Workflow precisa usar o Secret único de assinatura permanente.');
assert.ok(workflow.includes('assembleRelease'), 'APK distribuído precisa ser build release.');
assert.ok(workflow.includes('zipalign'), 'APK release precisa ser alinhado antes da assinatura.');
assert.ok(workflow.includes('apksigner'), 'APK release precisa ser assinado e verificado.');
assert.ok(workflow.includes('gh release upload'), 'A release estável precisa ser atualizada automaticamente.');
assert.match(workflow, /name: Publicar atualização estável[\s\S]*?if: steps\.signing\.outputs\.enabled == 'true'/, 'A release pública só pode ser atualizada quando a assinatura permanente estiver disponível.');
assert.ok(workflow.includes("if: steps.signing.outputs.enabled != 'true'"), 'APK de teste só pode existir como fallback quando a assinatura permanente não estiver configurada.');
assert.ok(workflow.includes('assembleDebug'), 'O fallback instalável de teste precisa permanecer disponível.');
assert.doesNotMatch(workflow, /gh release delete buildmaster-latest/, 'Não apague a última release antes de a nova estar pronta.');

assert.ok(fs.existsSync('src/app/error.tsx'));
assert.ok(fs.existsSync('src/app/global-error.tsx'));
console.log('release integrity v26.73: workflow, APK, manifesto e cache alinhados.');
