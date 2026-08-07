import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\r\n?/g, '\n')
  .normalize('NFC');
const compact = (value) => value.replace(/\s+/g, ' ');
const hasAny = (source, values) => values.some((value) => source.includes(value));

const app = read('src/components/CardVisionApp.tsx');
const managerField = read('src/components/ManagerSelectionField.tsx');
const css = read('src/app/globals.css');
const compactApp = compact(app);
const compactManager = compact(managerField);
const compactCss = compact(css);
// Compatibilidade histórica protegida: Automático pela carta|Perfil da carta

const tacticalClassIndex = compactApp.indexOf('creation-advanced-details creation-tactical-details');
assert.ok(tacticalClassIndex >= 0, 'O contexto tático da criação não foi localizado.');
const detailsStart = compactApp.lastIndexOf('<details', tacticalClassIndex);
const detailsOpenEnd = compactApp.indexOf('>', tacticalClassIndex);
assert.ok(detailsStart >= 0 && detailsOpenEnd > tacticalClassIndex, 'A abertura do bloco tático é inválida.');
const detailsTag = compactApp.slice(detailsStart, detailsOpenEnd + 1);
assert.match(detailsTag, /\bopen(?:\s*=\s*\{?true\}?|\s|>)/, 'O contexto tático deve abrir por padrão.');

assert.ok(hasAny(compactApp, ['Estilo do técnico e calibração', 'Técnico e calibração']), 'A área deve identificar técnico e calibração.');
assert.ok(hasAny(compactApp, ['Formação automática', 'A formação fica automática', 'formação automática']), 'A criação individual deve manter formação automática.');
assert.ok(/<span>\s*Modelo de jogo\s*<\/span>/.test(compactApp), 'O seletor de modelo de jogo deve permanecer disponível.');
assert.ok(/<span>\s*Técnico e versão\s*<\/span>/.test(`${compactApp} ${compactManager}`), 'O seletor de técnico deve permanecer disponível.');
assert.ok(
  hasAny(compactApp, ['A posição escolhida nunca é trocada', 'Posição soberana', 'A posição escolhida permanece soberana']),
  'A regra da posição escolhida precisa permanecer explícita.'
);
assert.ok(
  /\.mode-basic\s+\.creation-advanced-details\.creation-tactical-details\s*\{\s*display\s*:\s*block\s*;?\s*\}/.test(compactCss),
  'O modo básico não pode ocultar o contexto tático.'
);
assert.ok(hasAny(compactApp, ['Automático pela carta', 'Perfil da carta', 'Perfil automático da carta']), 'O perfil automático da carta precisa permanecer identificado.');

const tacticalEnd = app.indexOf('creation-action-dock', app.indexOf('creation-advanced-details creation-tactical-details'));
if (tacticalEnd > tacticalClassIndex) {
  const tacticalBlock = app.slice(tacticalClassIndex, tacticalEnd);
  assert.doesNotMatch(tacticalBlock, /<span>\s*Sistema tático\s*<\/span>/, 'A criação individual não deve exigir formação manual.');
}

console.log('Contexto tático v31.20 aprovado por contrato estável: formação automática, técnico, estilo coletivo, posição soberana e perfil da carta.');
