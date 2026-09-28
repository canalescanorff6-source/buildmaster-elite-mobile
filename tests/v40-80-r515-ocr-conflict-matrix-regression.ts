import assert from 'node:assert/strict';
import type { ParsedCard } from '../src/lib/analyzerDomain';
import type { TotalReadingSession } from '../src/lib/totalCardReader';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import { deriveTotalReadingFinalizationR501 } from '../src/modules/card-reader/totalReaderFinalizationR501';
import { deriveTrainingBudgetEvidenceR419 } from '../src/modules/analysis/cardEvidenceAuthorityR419';

function session(overrides: Partial<TotalReadingSession> = {}): TotalReadingSession {
  return {
    captures: [],
    coverage: [
      { type: 'overview', label: 'Visão geral', present: true, required: true },
      { type: 'attributes', label: 'Atributos', present: true, required: true },
      { type: 'progression', label: 'Progressão e pontos', present: true, required: true },
    ],
    missingCriticalScreens: [],
    mismatchRisk: 'none',
    mismatchReasons: [],
    mergedConfidence: 94,
    criticalFields: [
      { key: 'name', label: 'Nome', status: 'confirmed', reason: 'ok' },
      { key: 'position', label: 'Posição principal', status: 'confirmed', reason: 'ok' },
      { key: 'style', label: 'Estilo de jogo', status: 'confirmed', reason: 'ok' },
      { key: 'points', label: 'Pontos disponíveis', status: 'confirmed', reason: 'ok' },
      { key: 'attributes', label: 'Atributos', status: 'confirmed', reason: 'ok' },
      { key: 'skills', label: 'Habilidades', status: 'confirmed', reason: 'ok' },
    ],
    ...overrides,
  };
}

const control = deriveTotalReadingFinalizationR501(session());
assert.equal(control.state, 'FINAL_READY');
assert.equal(control.canFinalize, true, 'R515: controle confiável precisa continuar finalizável.');

const wrongPoints = deriveTrainingBudgetEvidenceR419({
  trainingPointsTotal: 56,
  trainingPointsUsed: 60,
  trainingPointSource: 'TRAINING_READ',
  confidence: 96,
} as ParsedCard);
assert.equal(wrongPoints.state, 'CONFLICTING', 'R515: PP usado maior que o total deve ser conflito.');

const wrongLevel = deriveTrainingBudgetEvidenceR419({
  trainingPointsTotal: 56,
  trainingPointSource: 'LEVEL_INFERRED',
  level: 1,
  confidence: 96,
} as ParsedCard);
assert.equal(wrongLevel.state, 'CONFLICTING', 'R515: PP inferido incompatível com o nível lido deve ser conflito.');

const impossibleAttribute = readDetailedPrint([
  'NOME DO JOGADOR: Carta Sintética R515',
  'POSIÇÃO PRINCIPAL: CMF',
  'ESTILO DE JOGO: Orquestrador',
  'Controle de bola: 999',
  'Passe rasteiro: 84',
].join('\n'), []);
assert.ok(
  impossibleAttribute.attributes.every((item) => Number(item.numericValue ?? item.value) <= 110),
  'R515: atributo OCR impossível não pode atravessar o parser detalhado como evidência ativa.',
);
assert.ok(
  !impossibleAttribute.attributes.some((item) => item.label === 'Controle de bola' && Number(item.numericValue ?? item.value) === 999),
  'R515: 999 precisa ser descartado, não normalizado silenciosamente.',
);

const partialName = deriveTotalReadingFinalizationR501(session({
  criticalFields: session().criticalFields.map((field) => field.key === 'name'
    ? { ...field, status: 'review' as const, reason: 'Nome parcial/incompleto no OCR.' }
    : field),
}));
assert.equal(partialName.canFinalize, false, 'R515: nome parcial não pode virar ficha final.');
assert.notEqual(partialName.state, 'FINAL_READY');

const missingSkills = deriveTotalReadingFinalizationR501(session({
  criticalFields: session().criticalFields.map((field) => field.key === 'skills'
    ? { ...field, status: 'missing' as const, reason: 'Lista de habilidades não lida.' }
    : field),
}));
assert.equal(missingSkills.state, 'BLOCKED');
assert.equal(missingSkills.canFinalize, false, 'R515: skills críticas ausentes precisam bloquear finalização.');

const wrongPosition = deriveTotalReadingFinalizationR501(session({
  mismatchRisk: 'block',
  mismatchReasons: ['Posição principal divergente entre capturas.'],
}));
assert.equal(wrongPosition.state, 'BLOCKED');
assert.equal(wrongPosition.canFinalize, false, 'R515: posição divergente não pode ser aceita silenciosamente.');

for (const result of [partialName, missingSkills, wrongPosition]) {
  assert.equal(result.canFinalize, false, 'R515: todo conflito OCR da matriz deve permanecer fail-closed.');
}

console.log('R515 aprovado: PP, nível, atributo impossível, nome parcial, skills ausentes e posição divergente permanecem fail-closed.');
