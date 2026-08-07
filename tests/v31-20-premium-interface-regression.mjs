import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (relativePath) => path.join(projectRoot, relativePath);
const read = (relativePath) => {
  const absolute = file(relativePath);
  assert.ok(existsSync(absolute), `Arquivo obrigatório ausente: ${relativePath}`);
  return readFileSync(absolute, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .normalize('NFC');
};
const compact = (value) => value.replace(/\s+/g, ' ');
const contains = (source, value) => source.includes(value.normalize('NFC'));

const app = read('src/components/CardVisionApp.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const appearance = read('src/components/IdentityAppearancePanel.tsx');
const css = read('src/app/globals.css');
const identityCss = read('src/app/v35-identity-themes.css');
const prefs = read('src/lib/easyExperience.ts');
const pkg = JSON.parse(read('package.json'));

const version = String(pkg.version || '0.0.0').split('.').map((item) => Number.parseInt(item, 10) || 0);
assert.ok(
  version[0] > 31 || (version[0] === 31 && version[1] >= 20),
  `Versão incompatível com a linha evolutiva premium: ${pkg.version}`
);

const visualSurface = `${appearance}\n${app}\n${prefs}\n${css}\n${identityCss}`;
for (const preset of ['obsidian-gold', 'elite-blue', 'future-purple']) {
  assert.ok(contains(visualSurface, preset), `A identidade premium perdeu o preset ${preset}.`);
  assert.ok(
    contains(`${css}\n${identityCss}`, `visual-${preset}`) || contains(appearance, `preset-${preset.split('-').at(-1)}`),
    `O preset ${preset} não possui superfície visual reconhecível.`
  );
}

assert.ok(
  /visual-\$\{\s*visualPreset\s*\}/.test(app) || /[`'"]visual-[`'"]\s*\+\s*visualPreset/.test(app),
  'A classe do preset visual precisa ser aplicada ao shell principal.'
);
assert.ok(/>\s*Temas\s*</.test(appearance), 'Aparência deve exibir a seção Temas.');
assert.ok(contains(appearance, 'premium-preset-grid'), 'Aparência deve manter a grade de temas premium.');

const compactHome = compact(home);
for (const marker of ['bm-premium-reader-hero', 'bm-premium-feature-grid', 'bm-premium-mini-pitch']) {
  assert.ok(contains(compactHome, marker), `A home premium perdeu o marcador estrutural ${marker}.`);
}
assert.ok(contains(compactHome, 'Habilidades'), 'A home premium não apresenta Habilidades.');
assert.ok(contains(compactHome, 'Ímpetos') || contains(compactHome, 'Impeto'), 'A home premium não apresenta Ímpetos.');
assert.ok(contains(compactHome, 'Formações') || contains(compactHome, 'Tática'), 'A home premium não apresenta Formações/Tática.');

console.log(`v${pkg.version} interface premium validada por contrato estável e independente do ambiente.`);
