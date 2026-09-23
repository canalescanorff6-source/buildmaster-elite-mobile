import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cardIdentityAliasesR457, cardIdentityFingerprintR126, legacyStructuralCardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';

const base:any={playerName:'Jogador R457',cardType:'Epic',specialTag:'Teste',country:'Brasil',mainPosition:'CMF',positions:['CMF','DMF'],offensivePlaystyle:'Orquestrador',defensivePlaystyle:'Básico',dominantFoot:'Direito',level:30,height:180,weight:76,age:28,nativeSkills:['Passe de primeira'],specialSkills:[],additionalSkills:[],impetos:[],attributes:{lowPass:88},positionRatings:{CMF:100},trainingPointsTotal:64,evidence:{attributeCount:1,positionRatingsCount:1},manualConfirmed:true};
const legacy=legacyStructuralCardIdentityFingerprintR126(base);
assert.equal(cardIdentityFingerprintR126(base),legacy);
const catalog={...base,editionIdentity:{schemaVersion:1,catalogCardId:'bm-card-001',officialCardId:null,officialCardIdVerified:false,releaseDate:'2026-09-01',source:'MASTER_CATALOG',confidence:98}};
assert.notEqual(cardIdentityFingerprintR126(catalog),legacy,'catalogCardId resolvido deve ganhar identidade canônica própria.');
assert.ok(cardIdentityAliasesR457(catalog).includes(legacy),'fingerprint estrutural antigo precisa permanecer como alias de migração.');
const unverifiedOfficial={...catalog,editionIdentity:{...catalog.editionIdentity,officialCardId:'external-7',officialCardIdVerified:false}};
assert.equal(cardIdentityFingerprintR126(unverifiedOfficial),cardIdentityFingerprintR126(catalog),'ID externo não verificado não pode superar o catálogo canônico.');
const verifiedOfficial={...catalog,editionIdentity:{...catalog.editionIdentity,officialCardId:'external-7',officialCardIdVerified:true,source:'OFFICIAL'}};
assert.notEqual(cardIdentityFingerprintR126(verifiedOfficial),cardIdentityFingerprintR126(catalog),'ID oficial verificado deve ter prioridade.');

const production=fs.readFileSync('src/lib/productionAnalysisR128.ts','utf8');
const master=fs.readFileSync('src/modules/card-catalog/masterCardAnalysisRequestR438.ts','utf8');
const scout=fs.existsSync('src/modules/scouting/gameplayScoutingRepositoryR454.ts') ? fs.readFileSync('src/modules/scouting/gameplayScoutingRepositoryR454.ts','utf8') : null;
const vault=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
assert.match(production,/const identified = editionIdentity/);
assert.ok(production.indexOf('const identified = editionIdentity') >= 0 && production.indexOf('const identified = editionIdentity') < production.indexOf('applyCompleteCardIntelligence('),'A identidade da edição precisa ser resolvida antes do motor de inteligência, com ou sem escopo de função intermediário.');
assert.match(master,/editionIdentity:[\s\S]*catalogCardId: card\.catalogCardId/);
if (scout) {
  assert.match(scout,/::game:/);
  assert.match(scout,/scoutingStoreKeyR457\(normalized\.cardId, normalized\.gameVersion\)/);
}
assert.match(vault,/function historyUsageIdentityTokensR457\(item: SavedAnalysis\): string\[\]/);
assert.match(vault,/tokens\.push\(`usage:\$\{alias\}\|\$\{position\}\|\$\{usageFunction\}`\)/);
assert.match(vault,/cardIdentityAliasesR457/);
assert.match(vault,/const tokens = historyUsageIdentityTokensR457\(item\)/);
const evolution=fs.readFileSync('src/lib/appEvolution.ts','utf8');
const r135=fs.readFileSync('src/modules/matches/matchEvidenceCalibrationR135.ts','utf8');
const r137=fs.readFileSync('src/modules/matches/matchValidationRepositoryR137.ts','utf8');
const longitudinal=fs.readFileSync('src/lib/longitudinalGameplayLearningV4060.ts','utf8');
assert.match(evolution,/cardFingerprintAliasesR457/);
assert.match(r135,/fingerprints\.has\(record\.cardFingerprint\)/);
assert.match(r137,/fingerprints\.has\(record\.cardFingerprint\)/);
assert.match(longitudinal,/cardFingerprintAliasesR457/);
console.log('R457 Stage 2 aprovada: edição oficial/catalog/fallback, aliases de Cofre e Scouting por card+gameVersion.');
