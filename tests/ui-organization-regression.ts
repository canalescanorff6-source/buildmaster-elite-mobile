import fs from 'node:fs';
import assert from 'node:assert/strict';

const component = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(component, /Elite Tático v25\.80/);
assert.match(component, /const RESULT_GROUPS/);
assert.match(component, /Visão geral/);
assert.match(component, /Desenvolvimento/);
assert.match(component, /mobileLauncher/);
assert.match(component, /Como deseja criar a ficha\?/);
assert.match(component, /mainSection !== 'resultado'/);
assert.doesNotMatch(component, /className="sticky-player-summary"/);
assert.doesNotMatch(component, /className="floating-premium-dock"/);
assert.match(css, /v25\.80 — Reorganização visual premium completa/);
assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.control-panel \{[\s\S]*position: static !important/);
assert.match(css, /\.result-subtab-shell \{[\s\S]*position: static !important/);

console.log('UI v25.80 organizada: navegação, páginas e resultado aprovados.');
