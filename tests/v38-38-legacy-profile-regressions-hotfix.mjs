import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));

assert.equal(pkg.version, '40.20.0');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').includes('npm run test:v3838'));
assert.ok(read('scripts/ci-doctor.mjs').includes('Regressões v38.39'));
assert.equal(manifest.name, 'BuildMaster Elite Tático v40.20');
assert.ok(read('public/sw.js').includes('buildmaster-v40-20-progress-1'));
assert.ok(read('src/components/RegisterServiceWorker.tsx').includes('40.20.0-progress-runtime-1'));

const v3500 = read('tests/v35-00-official-additional-skills-meta-regression.ts');
assert.ok(
  v3500.includes('Automática v38\\.(?:37|38|39|40)') || v3500.includes('Automática v(?:38\\.(?:37|38|39|40)|40\\.(?:00|10))'),
  'A regressão v35.00 precisa aceitar a calibração automática atual, incluindo a linha v40.20.'
);
assert.ok(v3500.includes('Perfil da carta'), 'A regressão v35.00 precisa validar o novo rótulo automático.');

const v3520 = read('tests/v35-20-gameplay-dna-solid-theme-regression.ts');
assert.ok(v3520.includes('38\\.37-automatic-card-gameplay-1'), 'A regressão v35.20 precisa aceitar o motor automático sem restaurar seleção manual.');


const v3771 = read('tests/v37-71-ci-hotfix-regression.mjs');
const v3831 = read('tests/v38-31-ci-regression-hotfix.mjs');
assert.ok(v3771.includes('contrato de cache sem duplicar a lista'), 'A v37.71 não pode voltar a copiar uma lista incompleta de versões.');
assert.ok(v3831.includes("const [major, minor] = pkg.version.split('.')"), 'A v38.31 precisa derivar o cache da versão real do pacote.');
assert.ok(v3831.includes('escapedCacheVersion'), 'A v38.31 precisa validar o service worker com a versão real.');

const fields = read('src/components/CalibrationProfileFields.tsx');
assert.ok(fields.includes('Automático pela carta'));
for (const removed of ['Equilibrado', 'Passe e tabelas', 'Drible e condução', 'Vertical e direto']) {
  assert.ok(!fields.includes(`>${removed}</option>`), `Opção manual restaurada por engano: ${removed}`);
}

console.log('v38.40 aprovada: regressões v35.00/v35.20 atualizadas sem restaurar perfis manuais e mantendo o perfil automático pela carta.');
