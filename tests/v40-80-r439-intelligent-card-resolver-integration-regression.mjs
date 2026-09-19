import fs from 'node:fs';
import assert from 'node:assert/strict';

const resolver = fs.readFileSync('src/modules/card-catalog/cardIdentityResolverR439.ts', 'utf8');
const queue = fs.readFileSync('src/modules/card-catalog/cardResolutionQueueR439.ts', 'utf8');
const storage = fs.readFileSync('src/modules/card-catalog/cardResolutionQueueStorageR439.ts', 'utf8');
const quick = fs.readFileSync('src/modules/card-catalog/quickCardIdentityReaderR439.ts', 'utf8');
const reconcile = fs.readFileSync('src/modules/card-catalog/masterCardResolutionBridgeR439.ts', 'utf8');
const center = fs.readFileSync('src/modules/squad-mapping/SquadMappingCenter.tsx', 'utf8');
const repair = fs.readFileSync('scripts/repair-root-tsconfig.mjs', 'utf8');
const apply = fs.readFileSync('scripts/apply-r439-intelligent-card-resolver.mjs', 'utf8');

assert.ok(resolver.includes("'RESOLVED' | 'AMBIGUOUS' | 'NEW_CARD' | 'NEEDS_REVIEW'"));
assert.ok(resolver.includes("'USE_CATALOG' | 'FULL_OCR' | 'CHOOSE_CANDIDATE' | 'REVIEW_IDENTITY'"));
assert.ok(queue.includes('candidateIds'));
assert.ok(storage.includes("runtimeList<CardResolutionQueueItemR439>('cards', Number.MAX_SAFE_INTEGER)"));
assert.ok(storage.includes("CARD_RESOLUTION_PREFIX_R439"));
assert.ok(quick.includes("new Set(['name', 'playstyle', 'mainPosition', 'overall', 'identityMeta'])"));
assert.ok(quick.includes("readingMode: 'fast'"));
assert.doesNotMatch(quick, /recognizeWithOcrWorker/);
assert.ok(reconcile.includes('squadMappingCardToMasterCardR438'));
assert.ok(reconcile.includes('saveMasterCardCatalogEntryR438'));
assert.ok(reconcile.includes('setOwnedCardR438'));
assert.ok(center.includes('readQuickCardIdentityR439'));
assert.ok(center.includes('resolveMasterCardObservationR439') || center.includes('resolveMasterCardObservationR440'), 'R439: o resolvedor inteligente pode ser atendido pelo sucessor visual R440 após a convergência final.');
assert.ok(center.includes('saveCardResolutionQueueItemR439'));
assert.ok(center.includes('Selecionar esta versão'));
assert.ok(center.includes('Identificada sem OCR completo'));
assert.ok(center.includes('OCR completo necessário'));
assert.ok(repair.includes("applyR439IntelligentCardResolver"));
assert.ok(repair.includes("R439 pré-CI"));
assert.ok(apply.includes('v40-80-r439-intelligent-card-resolver-runtime-regression.ts'));

console.log('R439 integração aprovada: leitura rápida antes do OCR completo, fila persistente e seleção de versão conectadas ao Catálogo Mestre.');
