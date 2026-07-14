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

assert.equal(pkg.version, '26.72.0', 'package.json precisa estar na v26.72.0');
assert.equal(lock.version, pkg.version, 'package-lock.json precisa ter a mesma versão do package.json');
assert.equal(lock.packages[''].version, pkg.version, 'raiz do package-lock precisa ter a mesma versão');
assert.ok(workflow.includes('v26.72'), 'Workflow antigo detectado: substitua também a pasta .github pelo arquivo desta versão.');
assert.ok(workflow.includes('BuildMaster-Elite-Tatico-v26.72.apk'), 'Nome do APK no workflow não corresponde à v26.72.');
assert.ok(workflow.includes("VERSION: '26.72.0'"), 'Manifesto de atualização do workflow não corresponde à v26.72.0.');
assert.ok(layout.includes('v26.72'), 'Metadados da interface não correspondem à v26.72.');
assert.ok(manifest.includes('v26.72'), 'manifest.webmanifest não corresponde à v26.72.');
assert.ok(sw.includes('26-72'), 'Cache do service worker não corresponde à v26.72.');
assert.doesNotMatch(workflow, /BuildMaster-Elite-Tatico-v26\.70|VERSION:\s*'26\.70\.0'/, 'Workflow v26.70 antigo ainda está presente.');
assert.ok(fs.existsSync('src/app/error.tsx'));
assert.ok(fs.existsSync('src/app/global-error.tsx'));
console.log('release integrity v26.72: workflow, APK, manifesto e cache alinhados.');
