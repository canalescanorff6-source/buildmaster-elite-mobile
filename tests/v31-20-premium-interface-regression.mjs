import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(path.join(projectRoot, relativePath), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

const app = read('src/components/CardVisionApp.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const appearance = read('src/components/IdentityAppearancePanel.tsx');
const css = read('src/app/globals.css');
const identityCss = read('src/app/v35-identity-themes.css');
const prefs = read('src/lib/easyExperience.ts');
const pkg = JSON.parse(read('package.json'));

assert.match(pkg.version, /^(?:3[1-9]|[4-9]\d)\.\d+\.0$/, `Versão incompatível com a linha evolutiva: ${pkg.version}`);

const requiredPresets = ['obsidian-gold', 'elite-blue', 'future-purple'];
for (const preset of requiredPresets) {
  assert.ok(
    appearance.includes(`id: '${preset}'`) || app.includes(preset),
    `O seletor premium não declara o preset ${preset}.`
  );
  assert.ok(
    css.includes(`visual-${preset}`) || identityCss.includes(`visual-${preset}`),
    `O CSS não contém a superfície visual do preset ${preset}.`
  );
  assert.ok(
    prefs.includes(`'${preset}'`),
    `As preferências não persistem o preset ${preset}.`
  );
}

assert.match(app, /visual-\$\{visualPreset\}/, 'A classe do modelo precisa ser aplicada ao shell principal.');
assert.match(appearance, />Temas</, 'Aparência deve exibir a seção Temas.');
assert.match(appearance, /premium-preset-grid/, 'Aparência deve manter a grade de temas premium.');

for (const marker of ['bm-premium-reader-hero', 'bm-premium-feature-grid', 'bm-premium-mini-pitch']) {
  assert.ok(home.includes(marker), `A home premium perdeu o marcador estrutural ${marker}.`);
}
for (const label of ['Habilidades', 'Ímpetos', 'Formações']) {
  assert.ok(home.includes(label), `A home premium não apresenta a função essencial ${label}.`);
}

console.log(`v${pkg.version.split('.').slice(0, 2).join('.')} interface premium validada por contrato determinístico.`);
