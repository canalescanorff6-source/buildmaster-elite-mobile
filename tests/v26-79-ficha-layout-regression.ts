import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const panel = fs.readFileSync('src/components/PrecisionBuildPanel.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(app, /Build Studio • Ficha Flow/);
assert.match(app, /Crie a ficha em blocos simples/);
assert.match(app, /label: 'Entrada'/);
assert.match(app, /label: 'Identidade'/);
assert.match(app, /label: 'Revisão'/);
assert.match(app, /label: 'Resultado'/);
assert.doesNotMatch(app, /label: 'Método'/);

assert.match(panel, /type FichaWorkspaceView/);
assert.match(panel, /Resumo/);
assert.match(panel, /3 propostas/);
assert.match(panel, /Ajustar/);
assert.match(panel, /Pós-jogo/);
assert.match(panel, /Auditoria/);
assert.match(panel, /ficha-workspace-nav/);
assert.match(panel, /ficha-recommended-card/);
assert.match(panel, /Transforme sensação em correção objetiva/);
assert.match(panel, /Nenhuma ficha final com incoerência/);

assert.match(css, /v26\.79 — Fichas organizadas/);
assert.match(css, /\.ficha-workspace-nav/);
assert.match(css, /\.ficha-overview-layout/);
assert.match(css, /Result navigation: readable on phones/);
assert.match(css, /\.creation-blueprint \{ display: none; \}/);
assert.match(css, /position: sticky;\n    bottom: calc\(78px \+ var\(--safe-bottom\)\)/);
assert.match(css, /result-primary-tabs button strong \{ font-size: 8\.5px !important; \}/);

console.log('✓ v26.79: criação em quatro etapas, ficha por áreas e navegação móvel legível aprovadas.');
