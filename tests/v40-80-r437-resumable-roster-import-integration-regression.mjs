import assert from 'node:assert/strict';
import fs from 'node:fs';

const center = fs.readFileSync('src/modules/squad-mapping/SquadMappingCenter.tsx', 'utf8');
const helper = fs.readFileSync('src/modules/squad-mapping/batchRosterImportR437.ts', 'utf8');
const pkg = fs.readFileSync('package.json', 'utf8');

assert.match(center, /findImportedRosterCardBySourceHashR437/);
assert.match(center, /preflightSourceHashR437/);
assert.match(center, /importCancelRequestedRef/);
assert.match(center, /readMappingImage\(file, nextPlayers, sourceHash\)/);
assert.match(center, /Pausar após esta carta/);
assert.match(center, /const selected = Array\.from\(files\);/);
assert.doesNotMatch(center, /Array\.from\(files\)\.slice\(0,\s*120\)/);
assert.match(center, /Meu Elenco — Banco Mestre/);
assert.match(center, /batchRosterImportSummaryR437\(stats\)|intelligentImportSummaryR439\(/, 'R437: o resumo retomável pode ser servido pelo sucessor inteligente R439 após a convergência final.');
assert.match(helper, /já existente\(s\) pulada\(s\) sem OCR/);
assert.match(pkg, /v40-80-r437-resumable-roster-import-runtime-regression\.ts/);
assert.match(pkg, /v40-80-r437-resumable-roster-import-integration-regression\.mjs/);

// R436 continua obrigatório: R437 melhora a entrada em lote, não substitui a geração direta.
assert.match(center, /Gerar ficha sem OCR/);
assert.match(center, /onGenerateFicha/);

console.log('R437 integração aprovada: Meu Elenco retoma lote sem repetir OCR e preserva geração direta R436.');
