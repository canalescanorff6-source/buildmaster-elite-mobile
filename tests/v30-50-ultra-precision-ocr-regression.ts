import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeOcrText, precisionAccuracyEstimate, precisionBlockingReasons, textSimilarity } from '../src/modules/card-reader/highPrecisionOcr';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import { buildSinglePrintSession } from '../src/modules/card-reader/singlePrintPro';
import { buildOcrVisionAudit } from '../src/modules/card-reader/ocrVisionEngine';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import { assertInternalVersionAtLeast } from './_internal-version';

assert.ok(textSimilarity('Cristiano RonaIdo', 'Cristiano Ronaldo') >= 0.88);
assert.equal(normalizeOcrText('  Cristiano   Ronaldo \n  CF  '), 'Cristiano Ronaldo\nCF');

const noisyText = `Crístiano RonaIdo
Artilheiro
GER 105
CF
Nível 31
Pontos 60
Talento ofenslvo 94
Controle de boIa 87
Finalizaçâo 97
Aceleraçao 89
Forca do chute 93
Contato fisico 84
Equilibrio 79
Resistencia 82
HABILIDADES
Chute de primeira
Precisao a distancia
Finalizacao acrobatica
Chute +3`;

const readings: PremiumZoneReading[] = [
  {
    key: 'name', label: 'Nome', text: 'Cristiano Ronaldo', confidence: 96, status: 'confirmed', originPreview: null,
    enhancement: 'contrast', passCount: 3, agreement: 3, consistency: 100,
    alternatives: [
      { text: 'Cristiano RonaIdo', confidence: 91, enhancement: 'sharp' },
      { text: 'Cristiano Ronaldo', confidence: 94, enhancement: 'color' }
    ]
  },
  { key: 'playstyle', label: 'Estilo', text: 'Artilheiro', confidence: 94, status: 'confirmed', originPreview: null, enhancement: 'contrast', passCount: 2, agreement: 2, consistency: 100 },
  { key: 'overall', label: 'GER', text: '105', confidence: 95, status: 'confirmed', originPreview: null, enhancement: 'binary', passCount: 2, agreement: 2, consistency: 100 },
  { key: 'mainPosition', label: 'Posição', text: 'CF', confidence: 95, status: 'confirmed', originPreview: null, enhancement: 'contrast', passCount: 2, agreement: 2, consistency: 100 },
  { key: 'level', label: 'Nível', text: '31', confidence: 94, status: 'confirmed', originPreview: null, enhancement: 'binary', passCount: 2, agreement: 2, consistency: 100 },
  { key: 'points', label: 'Pontos', text: '60', confidence: 93, status: 'confirmed', originPreview: null, enhancement: 'binary', passCount: 2, agreement: 2, consistency: 100 },
  { key: 'attributes', label: 'Atributos', text: noisyText, confidence: 88, status: 'confirmed', originPreview: null, enhancement: 'contrast', passCount: 3, agreement: 2, consistency: 67 },
  { key: 'skills', label: 'Habilidades', text: noisyText, confidence: 87, status: 'confirmed', originPreview: null, enhancement: 'sharp', passCount: 3, agreement: 2, consistency: 67 },
  { key: 'impetos', label: 'Ímpetos', text: 'Chute +3', confidence: 90, status: 'confirmed', originPreview: null, enhancement: 'contrast', passCount: 2, agreement: 2, consistency: 100 }
];

const detailed = readDetailedPrint(noisyText, readings, ['Cristiano Ronaldo']);
assert.equal(detailed.identity.playerName?.value, 'Cristiano Ronaldo');
assert.equal(detailed.identity.overall?.numericValue, 105);
assert.equal(detailed.identity.mainPosition?.value, 'CF');
assert.ok(detailed.attributes.some((item) => item.label === 'Talento ofensivo' && item.numericValue === 94));
assert.ok(detailed.attributes.some((item) => item.label === 'Finalização' && item.numericValue === 97));
assert.ok(detailed.attributes.some((item) => item.label === 'Aceleração' && item.numericValue === 89));
assert.ok(detailed.skills.some((item) => item.value === 'Precisão à distância'));
assert.ok(detailed.impetos.some((item) => item.value === 'Chute +3'));

assert.deepEqual(precisionBlockingReasons(readings), []);
assert.ok(precisionAccuracyEstimate(readings) >= 88);

const session = buildSinglePrintSession({
  imageHash: 'precision-test',
  template: 'detailed-profile',
  width: 1148,
  height: 1300,
  readings,
  fullText: noisyText,
  knownPlayerNames: ['Cristiano Ronaldo']
});
assert.equal(session.fields.find((field) => field.key === 'playerName')?.value, 'Cristiano Ronaldo');
assert.equal(session.fields.find((field) => field.key === 'playerName')?.status, 'confirmed');
assert.equal(session.precisionAudit.blockingReasons.length, 0);
assert.ok(session.precisionAudit.totalPasses >= 18);
assert.match(session.canonicalText, /NOME DO JOGADOR: Cristiano Ronaldo/);

const uncertainReadings = readings.map((reading) => reading.key === 'name'
  ? { ...reading, status: 'review' as const, agreement: 1, confidence: 87 }
  : reading);
assert.ok(precisionBlockingReasons(uncertainReadings).some((reason) => reason.includes('Nome')));
const uncertainSession = buildSinglePrintSession({
  imageHash: 'precision-review', template: 'detailed-profile', width: 1148, height: 1300,
  readings: uncertainReadings, fullText: noisyText
});
assert.equal(uncertainSession.fields.find((field) => field.key === 'playerName')?.status, 'review');
assert.ok(uncertainSession.blockingFields.some((field) => field.includes('Nome')));
const uncertainAudit = buildOcrVisionAudit(uncertainSession, noisyText);
assertInternalVersionAtLeast(uncertainAudit.version, 32, 0, 'Auditoria OCR');
assert.equal(uncertainAudit.state, 'blocked');
assert.ok(uncertainAudit.blockingFields.some((field) => field.includes('Nome')));


const invalidIdentity = readDetailedPrint(`NOME DO JOGADOR: Teste Jogador
GER: 999
ALTURA: 999 cm
PESO: 999 kg
IDADE: 99
NÍVEL: 99`, [], ['Teste Jogador']);
assert.equal(invalidIdentity.identity.overall, null);
assert.equal(invalidIdentity.identity.height, null);
assert.equal(invalidIdentity.identity.weight, null);
assert.equal(invalidIdentity.identity.age, null);
assert.equal(invalidIdentity.identity.level?.numericValue, 99);
assert.ok(invalidIdentity.warnings.some((warning) => warning.includes('GER descartado')));

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /recognizeZoneWithHighPrecision/);
assert.match(app, /knownPlayerNames/);
assert.match(app, /LOCAL_CARD_RULES/);
assert.match(app, /Leitura Ultraprecisa em/);
const engine = fs.readFileSync('src/modules/card-reader/highPrecisionOcr.ts', 'utf8');
assert.match(engine, /binary/);
assert.match(engine, /inverted/);
assert.match(engine, /nameSparse/);
assert.match(engine, /O app não força uma resposta errada|Nome mantido para revisão/);
const panel = fs.readFileSync('src/components/SinglePrintEvidencePanel.tsx', 'utf8');
assert.match(panel, /(?:Leitura Dinâmica|Perfil padronizado|Leitura detalhada) v(?:31\.\d+|32\.\d+)/i);
assert.match(panel, /precisão estimada/);

console.log('v31.10 leitura ultraprécisa, consenso de nome e bloqueio seguro aprovados.');
