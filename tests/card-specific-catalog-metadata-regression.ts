import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438 } from '../src/modules/card-catalog/masterCardCatalogR438';
import { buildMasterCardAnalysisRawTextR438 } from '../src/modules/card-catalog/masterCardAnalysisRequestR438';
import { parseCard } from '../src/modules/analysis/analyzerCardEvidenceR186';
import { detectCardType } from '../src/modules/analysis/cardEvidenceParserR130';

const card = createMasterCardCatalogEntryR438({
  playerName: 'Cristiano Ronaldo', mainPosition: 'CF', cardType: 'Big Time',
  cardLabel: 'Big Time — Manchester United 07-08', cardFingerprint: 'card-r126-cr7-big-time',
  level: 33, trainingPointsTotal: 64, height: 187, weight: 83, age: 23,
  nativeSkills: ['Cabeçada', 'Finalização de primeira'], additionalSkills: ['Passe de primeira'],
  specialSkills: [], positions: ['CF', 'LWF'], skillInventoryConfirmed: true,
  playstyle: 'Artilheiro', condition: {weakFootAccuracy:'Muito alta',form:'Estável'},
  physicalProfile: {legLength:9,legCoverageRadius:186.2},
  impetos: [{name:'Finalização',value:2}],
  attributes: {ballControl:76,finishing:82,speed:86,acceleration:83,stamina:80},
});
const parsed = parseCard(buildMasterCardAnalysisRawTextR438(card));
assert.equal(parsed.cardType, 'Big Time', 'O tipo confirmado da edição precisa chegar à análise.');
assert.equal(parsed.height, 187, 'A altura do catálogo não pode desaparecer ao gerar a ficha.');
assert.equal(parsed.weight, 83);
assert.equal(parsed.age, 23);
assert.ok(parsed.nativeSkills.includes('Cabeçada'));
assert.ok(parsed.additionalSkills?.includes('Passe de primeira'), 'Adicionais instaladas devem conservar a categoria.');
assert.ok(!parsed.nativeSkills.includes('Passe de primeira'));
assert.equal(parsed.condition.form?.toLowerCase(), 'estavel');
assert.equal(parsed.condition.weakFootAccuracy?.toLowerCase(), 'muito alta');
assert.equal(parsed.physicalProfile.legLength, 9);
assert.equal(parsed.physicalProfile.legCoverageRadius, 186.2);
assert.equal(parsed.trainingPointsTotal, 64);
assert.equal(detectCardType('TIPO DA CARTA: Highlight\nReferências de pesquisa: Epic e Show Time'), 'Highlight', 'O tipo explícito vence menções incidentais.');
assert.equal(detectCardType('TIPO DA CARTA: Distinguido'), 'Highlight');
assert.equal(detectCardType('Básico\nGoleiro defensivo'), 'Carta analisada', 'Básico é estilo defensivo; não prova raridade.');
console.log('Card-specific catalogue metadata: PASS');
