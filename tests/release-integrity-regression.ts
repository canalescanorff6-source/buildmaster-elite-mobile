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

assert.equal(pkg.version, '27.22.0', 'package.json precisa estar na v27.22.0');
assert.equal(lock.version, pkg.version, 'package-lock.json precisa ter a mesma versão do package.json');
assert.equal(lock.packages[''].version, pkg.version, 'raiz do package-lock precisa ter a mesma versão');
assert.ok(workflow.includes("json.loads(pathlib.Path('package.json')"), 'Workflow precisa ler a versão do package.json.');
assert.ok(workflow.includes('BuildMaster-Elite-Tatico-v$BUILDMASTER_VERSION.apk'), 'Nome do APK precisa acompanhar automaticamente a versão.');
assert.ok(workflow.includes('BUILDMASTER_VERSION=') || workflow.includes('BUILDMASTER_VERSION'), 'Versão dinâmica não foi preparada.');
assert.ok(layout.includes('v27.22'), 'Metadados da interface não correspondem à v27.22.');
assert.ok(manifest.includes('v27.22'), 'manifest.webmanifest não corresponde à v27.22.');
assert.ok(sw.includes('27-22'), 'Cache do service worker não corresponde à v27.22.');

assert.ok(workflow.includes('ANDROID_SIGNING_BUNDLE'), 'Workflow precisa usar o Secret de assinatura permanente.');
assert.match(workflow, /ANDROID_SIGNING_BUNDLE é obrigatório/, 'Workflow oficial não pode publicar APK de teste.');
assert.ok(workflow.includes('assembleRelease'), 'APK distribuído precisa ser build release.');
assert.doesNotMatch(workflow, /assembleDebug/, 'Workflow oficial não deve produzir APK debug como atualização.');
assert.ok(workflow.includes('zipalign'), 'APK release precisa ser alinhado.');
assert.ok(workflow.includes('apksigner'), 'APK release precisa ser assinado e verificado.');
assert.ok(workflow.includes('APK_ASSET_NAME'), 'APK publicado precisa usar nome único por build.');
assert.ok(workflow.includes('gh release upload'), 'A release estável precisa ser atualizada automaticamente.');
assert.ok(workflow.includes('Publicar APK e manifesto imutáveis'), 'APK e manifesto imutáveis precisam ser publicados juntos na release isolada.');
assert.ok(workflow.includes('Validar release imutável publicamente'), 'A release precisa ser baixada e conferida antes de virar latest.');
assert.ok(workflow.includes('Validar a ponte automática da v27.00'), 'O canal de compatibilidade da v27.00 precisa ser verificado após a publicação.');
assert.doesNotMatch(workflow, /gh release delete buildmaster-latest/, 'Não apague a release anterior antes de a nova estar pronta.');

assert.ok(fs.existsSync('src/app/error.tsx'));
assert.ok(fs.existsSync('src/app/global-error.tsx'));
console.log('release integrity v27.22: assinatura, APK único, manifesto e verificação pós-publicação alinhados.');
