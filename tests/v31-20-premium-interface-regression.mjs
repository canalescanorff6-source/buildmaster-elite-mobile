import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const home = readFileSync('src/modules/core/IntegratedHomePanel.tsx', 'utf8');
const css = readFileSync('src/app/globals.css', 'utf8');
const prefs = readFileSync('src/lib/easyExperience.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.match(pkg.version, /^31\.\d+\.0$/);
for (const preset of ['obsidian-gold', 'elite-blue', 'future-purple']) {
  assert.ok(app.includes(preset), `O seletor deve incluir ${preset}.`);
  assert.ok(css.includes(`visual-${preset}`), `O CSS deve incluir ${preset}.`);
  assert.ok(prefs.includes(preset), `As preferências devem persistir ${preset}.`);
}
assert.ok(app.includes('visual-${visualPreset}'), 'A classe do modelo precisa ser aplicada ao shell principal.');
assert.ok(app.includes('Interface premium'), 'Aparência deve exibir o seletor premium.');
assert.ok(home.includes('bm-premium-reader-hero'), 'A home deve destacar o leitor de cartas.');
assert.ok(home.includes('bm-premium-feature-grid'), 'A home deve mostrar as funções principais.');
assert.ok(home.includes('bm-premium-mini-pitch'), 'A home deve mostrar a formação ativa.');
assert.ok(home.includes('Habilidades') && home.includes('Ímpetos') && home.includes('Formações'), 'As funções essenciais devem estar visíveis.');
console.log(`v${pkg.version.split('.').slice(0, 2).join('.')} premium interface regression: ok`);
