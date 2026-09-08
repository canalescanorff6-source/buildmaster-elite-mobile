import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import {
  buildPreFinalConfirmationR133,
  buildProductionOcrEvidenceTextR133,
  buildReviewHydrationR133,
  progressionCostR133,
  trustedPositionRatingsR133,
  trustedProgressionSequenceR133
} from '../src/modules/card-reader/cardStructuredEvidenceBoundaryR133';
import type { DetailedPrintReading, DetailedValue } from '../src/modules/card-reader/detailedPrintReader';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import type { SingleFieldEvidence, SinglePrintSession } from '../src/modules/card-reader/singlePrintPro';

const makeValue = (label: string, value: string, confidence: number, status: DetailedValue['status']): DetailedValue => ({
  label, value, numericValue: Number(value), confidence, status, source: 'teste-r133'
});

const progressionGood = [
  makeValue('Finalização', '8', 91, 'confirmed'),
  makeValue('Passe', '8', 91, 'confirmed'),
  makeValue('Drible', '4', 91, 'confirmed'),
  makeValue('Destreza', '8', 91, 'confirmed'),
  makeValue('Força nas pernas', '8', 91, 'confirmed'),
  makeValue('Bola aérea', '4', 91, 'confirmed'),
  makeValue('Defesa', '4', 91, 'confirmed')
];
assert.equal(progressionCostR133(progressionGood), 60, 'controle: sequência coerente deve custar 60 pontos');

const baseDetailed = {
  identity: {
    playerName: { label: 'Nome do jogador', value: 'R133 Teste', confidence: 95, status: 'confirmed', source: 'teste' },
    playstyle: { label: 'Estilo de jogo', value: 'Defensor Criativo', confidence: 67, status: 'review', source: 'teste' },
    offensivePlaystyle: { label: 'Estilo de jogo ofensivo', value: 'Defensor Criativo', confidence: 67, status: 'review', source: 'teste' },
    defensivePlaystyle: null,
    overall: { label: 'GER', value: '103', numericValue: 103, confidence: 93, status: 'confirmed', source: 'teste' },
    mainPosition: { label: 'Posição principal', value: 'CB', confidence: 68, status: 'review', source: 'teste' },
    height: null, weight: null, age: null,
    level: { label: 'Nível máximo', value: '31', numericValue: 31, confidence: 68, status: 'review', source: 'teste' }
  },
  attributes: [
    makeValue('Talento defensivo', '90', 92, 'confirmed'),
    makeValue('Dedicação defensiva', '88', 90, 'confirmed'),
    makeValue('Desarme', '89', 90, 'confirmed'),
    makeValue('Agressividade', '87', 88, 'confirmed'),
    makeValue('Velocidade', '82', 87, 'confirmed'),
    makeValue('Aceleração', '80', 87, 'confirmed'),
    makeValue('Contato físico', '91', 90, 'confirmed'),
    makeValue('Resistência', '86', 88, 'confirmed')
  ],
  positionRatings: [makeValue('CB', '103', 90, 'confirmed'), makeValue('DMF', '99', 67, 'review')],
  progressionSequence: progressionGood,
  physicalModel: [], skills: [], skillCandidates: [], condition: [], impetos: [],
  manager: { name: null, boosts: [], confidence: 0 },
  warnings: [],
  coverage: { recognized: 0, totalExpected: 0, score: 70, attributeCount: 8, positionCount: 2, skillCount: 0, physicalCount: 0, missing: [] },
  canonicalText: '',
  profileAudit: { detected: false, ready: false, id: 'test', score: 0, gates: [], missing: [], confidence: 0 }
} as unknown as DetailedPrintReading;

const fieldsReview: SingleFieldEvidence[] = [
  { key: 'playerName', label: 'Nome', value: 'R133 Teste', confidence: 95, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'position', label: 'Posição', value: 'CB', confidence: 68, status: 'review', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'playstyle', label: 'Estilo', value: 'Defensor Criativo', confidence: 67, status: 'review', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'overall', label: 'GER', value: '103', numericValue: 103, confidence: 93, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'level', label: 'Nível', value: '31', numericValue: 31, confidence: 68, status: 'review', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'points', label: 'Pontos', value: '60', numericValue: 60, confidence: 66, status: 'review', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'cardType', label: 'Carta', value: 'Epic', confidence: 67, status: 'review', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'specialSkill', label: 'Especial', value: null, confidence: 0, status: 'missing', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'attributes', label: 'Atributos', value: 'ok', confidence: 90, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'skills', label: 'Skills', value: null, confidence: 0, status: 'missing', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] }
];

const poisonedCanonical = `[LEITURA PRINT ÚNICO PRO]
${baseDetailed.canonicalText}
NOME DO JOGADOR: R133 Teste
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor Criativo
GER: 103
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 60
TIPO DA CARTA: Epic
CB: 103
DMF: 99
Talento defensivo: 90
Dedicação defensiva: 88
Desarme: 89
Agressividade: 87
Velocidade: 82
Aceleração: 80
Contato físico: 91
Resistência: 86
PROGRESSÃO AUTOMÁTICA LIDA:
Finalização: 8
Passe: 8
Drible: 4
Destreza: 8
Força nas pernas: 8
Bola aérea: 4
Defesa: 4
[FIM LEITURA PRINT ÚNICO PRO]`;

const sessionReview = {
  fields: fieldsReview,
  canonicalText: poisonedCanonical,
  detailedReading: baseDetailed
} as unknown as SinglePrintSession;

const reviewZones: PremiumZoneReading[] = [
  { key: 'positionGrid', label: 'Posições', text: 'CB 103 DMF 99', confidence: 69, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'playstyle', label: 'Estilo', text: 'Defensor Criativo', confidence: 67, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'progression', label: 'Progressão', text: '8 8 4 8 8 4 4', confidence: 68, status: 'review', originPreview: null, enhancement: 'sharp' }
];

const protectedReviewText = buildProductionOcrEvidenceTextR133(sessionReview, reviewZones);
assert.match(protectedReviewText, /NOME DO JOGADOR: R133 Teste/i, 'nome confirmado pode entrar');
assert.match(protectedReviewText, /GER: 103/i, 'GER confirmado pode permanecer como dado de apresentação');
assert.doesNotMatch(protectedReviewText, /POSIÇÃO PRINCIPAL: CB/i, 'posição em review não pode entrar no motor');
assert.doesNotMatch(protectedReviewText, /ESTILO DE JOGO[^\n]*Defensor Criativo/i, 'estilo em review não pode entrar no motor');
assert.doesNotMatch(protectedReviewText, /NÍVEL MÁXIMO: 31/i, 'nível em review não pode virar orçamento');
assert.doesNotMatch(protectedReviewText, /PONTOS TOTAIS: 60/i, 'pontos em review não podem virar orçamento');
assert.doesNotMatch(protectedReviewText, /TIPO DA CARTA: Epic/i, 'tipo da carta em review não pode contaminar identidade canônica');
assert.doesNotMatch(protectedReviewText, /^CB:\s*103$/im, 'grade em review não entra');
assert.doesNotMatch(protectedReviewText, /PROGRESSÃO AUTOMÁTICA LIDA/i, 'progressão em review não entra');

const reviewResult = analyzeCardForProductionR128(protectedReviewText, 'COMPETITIVE', 'CB');
assert.equal(reviewResult.parsed.trainingPointSource, 'FALLBACK', 'sem nível/pontos/progressão confiáveis o motor pode usar fallback interno');
const preFinal = buildPreFinalConfirmationR133({
  result: reviewResult,
  session: sessionReview,
  manualFields: { playerName: '', level: '', trainingPointsTotal: '', attributes: {}, nativeSkills: [] },
  preview: null
});
assert.equal(preFinal.points, '', 'fallback 64 nunca pode ser apresentado como pontos detectados no print');
assert.equal(preFinal.level, '', 'nível em review não pode ser pré-confirmado');

const hydrationReview = buildReviewHydrationR133(reviewResult, sessionReview);
assert.equal(hydrationReview.suggestedCardPosition, 'AUTO');
assert.equal(hydrationReview.suggestedOffensivePlaystyle, 'AUTO');
assert.equal(hydrationReview.manualFields.level, '');
assert.equal(hydrationReview.manualFields.trainingPointsTotal, '');

const confirmedDetailed = {
  ...baseDetailed,
  identity: {
    ...baseDetailed.identity,
    playstyle: { ...baseDetailed.identity.playstyle!, confidence: 92, status: 'confirmed' as const },
    offensivePlaystyle: { ...baseDetailed.identity.offensivePlaystyle!, confidence: 92, status: 'confirmed' as const },
    mainPosition: { ...baseDetailed.identity.mainPosition!, confidence: 92, status: 'confirmed' as const },
    level: { ...baseDetailed.identity.level!, confidence: 92, status: 'confirmed' as const }
  }
} as DetailedPrintReading;
const fieldsConfirmed = fieldsReview.map((field) => ['position', 'playstyle', 'level', 'points', 'cardType'].includes(field.key)
  ? { ...field, confidence: 92, status: 'confirmed' as const }
  : field);
const sessionConfirmed = { ...sessionReview, fields: fieldsConfirmed, detailedReading: confirmedDetailed } as SinglePrintSession;
const confirmedZones: PremiumZoneReading[] = [
  { key: 'positionGrid', label: 'Posições', text: 'CB 103 DMF 99', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'sharp' },
  { key: 'playstyle', label: 'Estilo', text: 'Defensor Criativo', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'sharp' },
  { key: 'progression', label: 'Progressão', text: '8 8 4 8 8 4 4', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'sharp' }
];

const trustedRatings = trustedPositionRatingsR133(sessionConfirmed, confirmedZones);
assert.deepEqual(trustedRatings.map((item) => [item.code, item.value]), [['CB', 103]], 'só rating individual confirmado entra mesmo com zona confirmada');
assert.equal(trustedProgressionSequenceR133(sessionConfirmed, confirmedZones).length, 7, 'progressão completa e coerente com 60 pontos pode entrar');
const confirmedText = buildProductionOcrEvidenceTextR133(sessionConfirmed, confirmedZones);
assert.match(confirmedText, /POSIÇÃO PRINCIPAL: CB/i);
assert.match(confirmedText, /ESTILO DE JOGO OFENSIVO: Defensor Criativo/i);
assert.match(confirmedText, /NÍVEL MÁXIMO: 31/i);
assert.match(confirmedText, /PONTOS TOTAIS: 60/i);
assert.match(confirmedText, /^CB:\s*103$/im);
assert.doesNotMatch(confirmedText, /^DMF:\s*99$/im, 'rating individual em review continua fora');
assert.match(confirmedText, /PROGRESSÃO AUTOMÁTICA LIDA/i);

const mismatchedDetailed = { ...confirmedDetailed, progressionSequence: progressionGood.map((item) => ({ ...item, value: '4', numericValue: 4 })) } as DetailedPrintReading;
const mismatchSession = { ...sessionConfirmed, detailedReading: mismatchedDetailed } as SinglePrintSession;
assert.equal(trustedProgressionSequenceR133(mismatchSession, confirmedZones).length, 0, 'sequência confirmada visualmente mas incoerente com orçamento 60 deve ser rejeitada');

const absurdPointsFields = fieldsConfirmed.map((field) => field.key === 'points' ? { ...field, value: '2', numericValue: 2 } : field);
const absurdPointsSession = { ...sessionConfirmed, fields: absurdPointsFields } as SinglePrintSession;
const absurdText = buildProductionOcrEvidenceTextR133(absurdPointsSession, confirmedZones);
assert.doesNotMatch(absurdText, /PONTOS TOTAIS:\s*2\b/i, '2/2 confirmado pela zona ainda é implausível como orçamento de jogador e deve ficar fora');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const readerRuntimeR163 = fs.readFileSync(path.join(root, 'src/modules/card-reader/readerAnalysisRuntimeR163.ts'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/components/SinglePrintEvidencePanel.tsx'), 'utf8');
const boundary = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts'), 'utf8');
assert.match(readerRuntimeR163, /buildProductionOcrEvidenceTextR134\(session, zoneResults\)/, 'Print Único precisa usar a fronteira externa R134, que preserva a R133 internamente');
assert.match(readerRuntimeR163, /buildPreFinalConfirmationR134/, 'pré-final deve distinguir fallback interno de leitura OCR');
assert.match(readerRuntimeR163, /const reviewHydration = await hydrateReviewFields\(autoResult, session\);[\s\S]{0,500}manualFields: reviewHydration\.manualFields/, 'pré-final deve usar a hidratação recém-criada, não o estado React anterior');
assert.match(panel, /Usar \{field\.value\}/, 'melhor candidato escalar em review deve poder ser aceito explicitamente');
assert.match(panel, /não entram automaticamente no motor/i, 'UI deve explicar a fronteira estruturada');
assert.doesNotMatch(boundary, /cleanSlate|recommendedSkills\s*=|recommendedImpetos\s*=/i, 'boundary R133 não pode virar escritor de gameplay');

console.log('r133 aprovada: identidade, posição, grade e progressão só entram com evidência confirmada/coerente; fallback interno não se disfarça de OCR.');
