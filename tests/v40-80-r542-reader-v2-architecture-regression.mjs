import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/modules/card-reader-v2');
assert.ok(fs.existsSync(root), 'R542-A: src/modules/card-reader-v2 precisa existir antes de liberar o Reader V2.');

const required = path.join(root, 'readerV2Types.ts');
assert.ok(fs.existsSync(required), 'R542-A: readerV2Types.ts precisa existir.');

const files = fs.readdirSync(root).filter((name) => /\.(ts|tsx|mjs|js)$/.test(name));
const forbidden = [
  /@\/modules\/analysis/,
  /@\/.*build/i,
  /@\/.*skills/i,
  /@\/.*impeto/i,
  /match-vision/i,
  /squad-brain/i,
  /tactical-twin/i,
];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern, `R542-A: ${file} não pode importar runtime pesado proibido (${pattern}).`);
  }
}

const types = fs.readFileSync(required, 'utf8');
for (const symbol of [
  'ReaderV2Mode',
  'ReaderV2Stage',
  'ReaderV2Progress',
  'ReaderV2FieldEvidence',
  'ReaderV2Evidence',
  'ReaderV2ReviewDraft',
  'ReaderV2SessionSnapshot',
  'ReaderV2Zone',
]) {
  assert.match(types, new RegExp(`export\\s+(?:type|interface)\\s+${symbol}\\b`), `R542-A: contrato ${symbol} precisa ser exportado.`);
}

for (const field of ['playerName', 'level', 'points', 'mainPosition', 'rawText', 'fields', 'uncertainKeys', 'preview']) {
  assert.match(types, new RegExp(`\\b${field}\\??\\s*:`), `R542-A: ReaderV2ReviewDraft precisa expor ${field}.`);
}

console.log('R542-A GREEN: Reader V2 isolado e contratos arquiteturais presentes.');
