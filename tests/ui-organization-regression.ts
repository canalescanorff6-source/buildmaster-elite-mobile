import fs from 'node:fs';
import assert from 'node:assert/strict';

const component = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(component, /Elite Tático v26\.70/);
assert.match(component, /const RESULT_GROUPS/);
assert.match(component, /label: 'Geral'/);
assert.match(component, /label: 'Treino'/);
assert.match(component, /type VaultView = 'jogadores' \| 'organizar' \| 'comparar' \| 'backup'/);
assert.match(component, /type SettingsView = 'aparencia' \| 'desempenho' \| 'seguranca' \| 'atualizacoes'/);
assert.match(component, /section-segmented-tabs/);
assert.match(component, /result-head-compact/);
assert.match(component, /result-more-actions/);
assert.match(component, /Como deseja criar a ficha\?/);
assert.doesNotMatch(component, /className="sticky-player-summary"/);
assert.doesNotMatch(component, /className="floating-premium-dock"/);
assert.match(css, /v25\.82 — Polimento Premium guiado por inspeção completa em vídeo/);
assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.result-subtab-shell,[\s\S]*\.review-actions[\s\S]*position: static !important/);
assert.match(css, /\.section-segmented-tabs/);

assert.match(component, /label: 'Comunidade'/);
assert.match(component, /CommunityIntelligencePanel/);
console.log('UI v26.70 organizada: resultado, Cofre, Ajustes e navegação aprovados.');
