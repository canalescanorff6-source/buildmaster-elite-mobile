import fs from 'node:fs';
import assert from 'node:assert/strict';

const required = [
  'src/modules/card-catalog/masterCardCatalogR438.ts',
  'src/modules/card-catalog/masterCardSearchIndexR438.ts',
  'src/modules/card-catalog/masterCardCatalogStorageR438.ts',
  'src/modules/card-catalog/ownedCardCollectionR438.ts',
  'src/modules/card-catalog/masterCardMigrationR438.ts',
  'src/modules/card-catalog/masterCardToSquadMappingR438.ts',
  'src/modules/card-catalog/masterCardAnalysisRequestR438.ts',
  'scripts/apply-r438-master-card-catalog.mjs'
];
for (const file of required) assert.ok(fs.existsSync(file), `${file} deve existir.`);
const storage = fs.readFileSync('src/modules/card-catalog/masterCardCatalogStorageR438.ts','utf8');
const owned = fs.readFileSync('src/modules/card-catalog/ownedCardCollectionR438.ts','utf8');
const migration = fs.readFileSync('src/modules/card-catalog/masterCardMigrationR438.ts','utf8');
const analysis = fs.readFileSync('src/modules/card-catalog/masterCardAnalysisRequestR438.ts','utf8');
const apply = fs.readFileSync('scripts/apply-r438-master-card-catalog.mjs','utf8');
const repair = fs.readFileSync('scripts/repair-root-tsconfig.mjs','utf8');
assert.match(storage,/runtimeList<[^>]+>\('cards', Number\.MAX_SAFE_INTEGER\)/);
assert.match(storage,/master-card:v1:/);
assert.match(owned,/owned-card:v1:/);
assert.match(migration,/MIGRATED_SQUAD_MAPPING/);
assert.match(migration,/unclassifiedSkills/);
assert.match(analysis,/createProductionAnalysisR138/,'Motor Mestre deve continuar como autoridade única.');
assert.match(analysis,/completeness !== 'COMPLETE'/);
assert.match(apply,/Catálogo Geral/);
assert.match(apply,/Revisar/);
assert.match(apply,/migrateSquadMappingToMasterCatalogR438/);
assert.match(apply,/masterCardToSquadMappingPlayerR438/);
assert.match(apply,/upsertOwnedMasterCardFromSquadMappingR438/);
assert.match(apply,/onGenerateMasterCard/);
assert.match(repair,/applyR438MasterCardCatalog/);
assert.doesNotMatch(storage,/slice\(0,\s*500\)/);
console.log('R438 integração aprovada: Catálogo Mestre separado, Meu Elenco projetado e Motor Mestre preservado.');
