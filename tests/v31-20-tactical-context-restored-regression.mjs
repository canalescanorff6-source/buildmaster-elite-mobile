import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/components/CardVisionApp.tsx', import.meta.url), 'utf8');
const managerField = fs.readFileSync(new URL('../src/components/ManagerSelectionField.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

assert.match(app, /creation-advanced-details creation-tactical-details" open/,
  'O contexto tático deve abrir por padrão em Nova Ficha e Usar Imagem.');
assert.match(app, /Estilo do técnico e calibração/,
  'A opção v35 deve identificar claramente estilo do técnico e calibração.');
assert.match(app, /Formação automática/,
  'A criação individual deve deixar a formação automática.');
assert.doesNotMatch(app.slice(app.indexOf('creation-advanced-details creation-tactical-details'), app.indexOf('creation-action-dock')), /<span>Sistema tático<\/span>/,
  'O fluxo de criação não deve exigir formação na v35.');
assert.match(app, /<span>Modelo de jogo<\/span>/,
  'O seletor de estilo coletivo deve permanecer disponível.');
assert.match(`${app}\n${managerField}`, /<span>Técnico e versão<\/span>/,
  'O seletor de técnico deve permanecer disponível.');
assert.match(app, /A posição escolhida nunca é trocada|Posição soberana|A posição escolhida permanece soberana/,
  'A regra de posição soberana deve ser explicitada na interface.');
assert.match(css, /\.mode-basic \.creation-advanced-details\.creation-tactical-details\{display:block\}/,
  'O modo básico não pode ocultar o contexto tático restaurado.');

console.log('Contexto v35 aprovado: formação automática, estilo coletivo e técnico visíveis nos dois fluxos de criação.');
