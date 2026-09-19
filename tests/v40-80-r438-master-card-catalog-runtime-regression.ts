import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438, masterCardTrainingPointsR438, mergeMasterCardCatalogEntryR438, sameMasterCardEditionR438 } from '../src/modules/card-catalog/masterCardCatalogR438';
import { searchMasterCardsR438 } from '../src/modules/card-catalog/masterCardSearchIndexR438';

const attributes = {
  offensiveAwareness:92,ballControl:88,dribbling:85,tightPossession:86,lowPass:80,loftedPass:75,finishing:94,heading:86,placeKicking:78,curl:82,
  defensiveAwareness:44,defensiveEngagement:52,tackling:45,aggression:65,goalkeeperAwareness:40,goalkeeperCatching:40,goalkeeperParrying:40,goalkeeperReflexes:40,goalkeeperReach:40,
  speed:90,acceleration:88,kickingPower:91,jump:84,physicalContact:86,balance:80,stamina:82
};
const base = createMasterCardCatalogEntryR438({
  playerName:'Cristiano Ronaldo', cardLabel:'Show Time • 23 Jun 2026', cardFingerprint:'card-r126-cr7-showtime', playerFingerprint:'player-r126-cr7', mainPosition:'CF', positions:['CF','SS'],
  playstyle:'Artilheiro', offensivePlaystyle:'Artilheiro', level:32, attributes, nativeSkills:['Chute de primeira','Cabeçada'], skillInventoryConfirmed:true, impetos:[{name:'Finalização +3'}], sourceHash:'hash-showtime', confidence:98, sources:['CATALOG_PATCH']
});
assert.equal(masterCardTrainingPointsR438(base),62);
assert.equal(base.trainingPointsTotal,62);
assert.equal(base.completeness,'COMPLETE');
assert.deepEqual(base.missingFields,[]);

const incomplete = createMasterCardCatalogEntryR438({ playerName:'Cristiano Ronaldo', cardLabel:'Epic', cardFingerprint:'provisional-x', mainPosition:'CF', positions:['CF'], level:null, attributes:{}, nativeSkills:[], sourceHash:'hash-epic', sources:['OCR_IMPORT'] });
assert.equal(incomplete.completeness,'IDENTITY_ONLY');
assert.ok(incomplete.missingFields.includes('nível'));
assert.ok(incomplete.missingFields.includes('26 atributos'));

const other = createMasterCardCatalogEntryR438({ ...base, catalogCardId:undefined, cardFingerprint:'card-r126-cr7-epic', cardLabel:'Epic Portugal', sourceHash:'hash-epic-2' });
assert.equal(sameMasterCardEditionR438(base,other),false,'Duas edições do mesmo jogador não podem colidir.');
const results=searchMasterCardsR438([base,other],'Cristiano Ronaldo');
assert.equal(results.length,2,'Busca pelo atleta deve retornar todas as versões.');
assert.notEqual(results[0].catalogCardId,results[1].catalogCardId);

const reread = createMasterCardCatalogEntryR438({ ...base, catalogCardId:base.catalogCardId, attributes:{...attributes,finishing:95}, confidence:99 });
const merged=mergeMasterCardCatalogEntryR438(base,reread);
assert.equal(merged.attributes.finishing,95);
assert.equal(merged.catalogCardId,base.catalogCardId);
console.log('R438 runtime aprovado: catálogo mestre separa edições, deriva PP e bloqueia dados incompletos.');
