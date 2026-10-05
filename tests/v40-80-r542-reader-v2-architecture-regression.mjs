import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const readerDir = path.resolve('src/modules/card-reader-v2');
const typesFile = path.join(readerDir, 'readerV2Types.ts');

assert.equal(
  fs.existsSync(readerDir),
  true,
  'R542-A: src/modules/card-reader-v2 precisa existir antes de qualquer implementação do Reader V2.'
);
assert.equal(
  fs.existsSync(typesFile),
  true,
  'R542-A: readerV2Types.ts precisa definir os contratos mínimos do Reader V2.'
);

function collectSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(full);
    return /\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name) ? [full] : [];
  });
}

const forbiddenImportTokens = [
  '@/modules/analysis',
  'build',
  'skills',
  'impeto',
  'ímpeto',
  'match-vision',
  'squad-brain',
  'tactical-twin',
];

for (const file of collectSourceFiles(readerDir)) {
  const source = fs.readFileSync(file, 'utf8');
  const imports = [
    ...source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g),
  ].map((match) => match[1].toLowerCase());

  for (const importedPath of imports) {
    for (const token of forbiddenImportTokens) {
      assert.equal(
        importedPath.includes(token.toLowerCase()),
        false,
        `R542-A: ${path.relative(process.cwd(), file)} não pode importar '${importedPath}' porque contém boundary proibido '${token}'.`
      );
    }
  }
}

const typesSource = fs.readFileSync(typesFile, 'utf8');
const requiredContracts = [
  'ReaderV2Mode',
  'ReaderV2Stage',
  'ReaderV2Progress',
  'ReaderV2FieldEvidence',
  'ReaderV2Evidence',
  'ReaderV2ReviewDraft',
  'ReaderV2SessionSnapshot',
  'ReaderV2Zone',
];

for (const contract of requiredContracts) {
  assert.match(typesSource, new RegExp(`export\\s+(?:type|interface)\\s+${contract}\\b`), `R542-A: contrato ${contract} ausente.`);
}

for (const field of ['playerName', 'level', 'points', 'mainPosition', 'rawText', 'fields', 'uncertainKeys', 'preview']) {
  assert.match(typesSource, new RegExp(`\\b${field}\\??\\s*:`), `R542-A: ReaderV2ReviewDraft precisa expor '${field}'.`);
}

console.log('R542-A aprovado: Reader V2 isolado e contratos mínimos presentes.');
