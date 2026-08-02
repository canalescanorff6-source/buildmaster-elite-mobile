import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.doesNotMatch(
  workspace,
  /<button\s+type="button"\s+onClick=\{onExportImage\}>\s*<ImagePlus/,
  'A função de exportação com parâmetro de formato não pode ser passada diretamente ao onClick do botão.',
);
assert.match(
  workspace,
  /<button\s+type="button"\s+onClick=\{\(\)\s*=>\s*onExportImage\?\.\(\)\}>\s*<ImagePlus/,
  'O botão precisa adaptar o evento de clique para uma chamada sem parâmetros do exportador.',
);
assert.match(pkg.scripts.typecheck, /--noUnusedLocals --noUnusedParameters/,
  'O TypeScript completo deve continuar rigoroso.');
assert.equal(typeof pkg.scripts['test:v3822'], 'string');
assert.match(pkg.scripts['test:all'], /test:v3822/);
assert.ok(doctor.includes('Regressões v38.22'), 'O diagnóstico consolidado precisa executar a regressão v38.22.');

console.log('v38.22 hotfix aprovado: botão de exportação adaptado ao MouseEventHandler sem alterar o formato premium.');
