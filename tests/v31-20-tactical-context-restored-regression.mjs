import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const compact = (value) => value.replace(/\s+/g, ' ');

const app = read('src/components/CardVisionApp.tsx');
const managerField = read('src/components/ManagerSelectionField.tsx');
const css = read('src/app/globals.css');
const compactApp = compact(app);
const compactManager = compact(managerField);
const compactCss = compact(css);

assert.match(
  compactApp,
  /<details[^>]*className=["'][^"']*creation-advanced-details[^"']*creation-tactical-details[^"']*["'][^>]*\bopen\b[^>]*>/,
  'O contexto tático deve abrir por padrão em Nova Ficha e Usar Imagem.'
);
assert.match(compactApp, /Estilo do técnico e calibração/, 'A área deve identificar estilo do técnico e calibração.');
assert.match(compactApp, /Formação automática/, 'A criação individual deve manter a formação automática.');

const tacticalStart = app.indexOf('creation-advanced-details creation-tactical-details');
const tacticalEnd = app.indexOf('creation-action-dock', tacticalStart);
assert.ok(tacticalStart >= 0 && tacticalEnd > tacticalStart, 'O bloco tático da criação não foi localizado de forma segura.');
assert.doesNotMatch(
  app.slice(tacticalStart, tacticalEnd),
  /<span>\s*Sistema tático\s*<\/span>/,
  'O fluxo de criação não deve exigir formação manual.'
);

assert.match(compactApp, /<span>\s*Modelo de jogo\s*<\/span>/, 'O seletor de estilo coletivo deve permanecer disponível.');
assert.match(
  `${compactApp} ${compactManager}`,
  /<span>\s*Técnico e versão\s*<\/span>/,
  'O seletor de técnico deve permanecer disponível.'
);
assert.match(
  compactApp,
  /A posição escolhida nunca é trocada|Posição soberana|A posição escolhida permanece soberana/,
  'A regra de posição soberana deve ser explicitada na interface.'
);
assert.match(
  compactCss,
  /\.mode-basic \.creation-advanced-details\.creation-tactical-details\s*\{\s*display\s*:\s*block\s*;?\s*\}/,
  'O modo básico não pode ocultar o contexto tático restaurado.'
);

// A v38.37+ removeu os quatro perfis manuais. O contexto tático continua visível,
// mas o jeito de jogar é calculado automaticamente pela carta.
assert.match(compactApp, /Automático pela carta|Perfil da carta/, 'O perfil automático pela carta precisa permanecer identificado.');

console.log('Contexto tático aprovado: formação automática, estilo coletivo, técnico e perfil automático pela carta preservados.');
