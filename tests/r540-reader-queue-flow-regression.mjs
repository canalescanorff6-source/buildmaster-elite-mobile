import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/modules/card-reader/readerInteractionRuntimeR164.ts', 'utf8');

assert.match(source, /async function handleFile\(file: File\): Promise<boolean>/,
  'R540: carregamento de arquivo precisa informar sucesso/falha ao chamador.');
assert.match(source, /validateImageFile\(file\)[\s\S]{0,500}return false;/,
  'R540: validação recusada precisa retornar falha explícita.');
assert.match(source, /const loaded = await handleFile\(file\);[\s\S]{0,300}if \(!loaded\) throw new Error/,
  'R540: item da fila só pode prosseguir para remoção se o arquivo realmente foi carregado.');
assert.match(source, /if \(!restoredOk\)[\s\S]{0,500}return;/,
  'R540: retomada interrompida não pode executar OCR após falha de restauração.');

const openQueued = source.match(/async function openQueuedPrint[\s\S]*?(?=\n\s*async function discardQueuedPrint)/)?.[0] ?? '';
const handleIndex = openQueued.indexOf('await handleFile(file)');
const removeIndex = openQueued.indexOf('await removeOcrQueueJob(job.id)');
assert.ok(handleIndex >= 0 && removeIndex > handleIndex,
  'R540: remoção da fila deve ocorrer somente depois do carregamento validado.');

console.log('R540 fila OCR: item inválido não é tratado como carregado nem removido silenciosamente.');
