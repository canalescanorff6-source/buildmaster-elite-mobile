import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/components/CardVisionApp.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

assert.match(app, /creation-advanced-details creation-tactical-details" open/,
  'O contexto tático deve abrir por padrão em Nova Ficha e Usar Imagem.');
assert.match(app, /Formação, estilo do técnico e técnico/,
  'A opção restaurada deve identificar claramente formação, estilo e técnico.');
assert.match(app, /<span>Sistema tático<\/span>/,
  'O seletor de formação deve permanecer disponível.');
assert.match(app, /FORMATION_BLUEPRINTS\.map/,
  'O seletor de criação deve usar todo o catálogo de formações base, meta e personalizadas do app.');
assert.match(app, /<span>Modelo de jogo<\/span>/,
  'O seletor de estilo coletivo deve permanecer disponível.');
assert.match(app, /<span>Técnico e versão<\/span>/,
  'O seletor de técnico deve permanecer disponível.');
assert.match(app, /A posição escolhida continua soberana e nunca é trocada automaticamente/,
  'A regra de posição soberana deve ser explicitada na interface.');
assert.match(css, /\.mode-basic \.creation-advanced-details\.creation-tactical-details\{display:block\}/,
  'O modo básico não pode ocultar o contexto tático restaurado.');

console.log('Contexto tático restaurado: formação, estilo e técnico visíveis nos dois fluxos de criação.');
