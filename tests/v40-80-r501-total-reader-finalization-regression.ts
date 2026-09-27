import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveTotalReadingFinalizationR501,
  type TotalReadingSession,
} from '../src/lib/totalCardReader';

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

const trusted = deriveTotalReadingFinalizationR501(session());
assert.equal(trusted.state, 'FINAL_READY');
assert.equal(trusted.canFinalize, true, 'R501: somente leitura total completa e confiável pode virar resultado final automaticamente.');

const mismatch = deriveTotalReadingFinalizationR501(session({ mismatchRisk: 'block', mismatchReasons: ['Nome divergente entre os prints.'] }));
assert.equal(mismatch.state, 'BLOCKED');
assert.equal(mismatch.canFinalize, false, 'R501: prints divergentes nunca podem promover resultado final.');

const missingScreen = deriveTotalReadingFinalizationR501(session({ missingCriticalScreens: ['Progressão e pontos'] }));
assert.equal(missingScreen.state, 'BLOCKED');
assert.equal(missingScreen.canFinalize, false, 'R501: tela obrigatória ausente deve bloquear finalização automática.');

const missingField = deriveTotalReadingFinalizationR501(session({
  criticalFields: session().criticalFields.map((field) => field.key === 'points' ? { ...field, status: 'missing' as const } : field),
}));
assert.equal(missingField.state, 'BLOCKED');
assert.equal(missingField.canFinalize, false, 'R501: campo crítico ausente não pode virar ficha final.');

const reviewField = deriveTotalReadingFinalizationR501(session({
  criticalFields: session().criticalFields.map((field) => field.key === 'skills' ? { ...field, status: 'review' as const } : field),
}));
assert.equal(reviewField.state, 'REVIEW_REQUIRED');
assert.equal(reviewField.canFinalize, false, 'R501: habilidade não confirmada deve manter a análise em prévia para evitar duplicata inventada.');

const lowConfidence = deriveTotalReadingFinalizationR501(session({ mergedConfidence: 72 }));
assert.equal(lowConfidence.state, 'REVIEW_REQUIRED');
assert.equal(lowConfidence.canFinalize, false, 'R501: média OCR baixa não pode parecer leitura total definitiva.');

const reviewMismatch = deriveTotalReadingFinalizationR501(session({ mismatchRisk: 'review', mismatchReasons: ['Posição divergente.'] }));
assert.equal(reviewMismatch.state, 'REVIEW_REQUIRED');
assert.equal(reviewMismatch.canFinalize, false);

const runtime = fs.readFileSync('src/modules/card-reader/readerAnalysisRuntimeR163.ts', 'utf8');
assert.match(runtime, /deriveTotalReadingFinalizationR501\(session\)/,
  'R501: runtime do Leitor Total precisa consultar a autoridade de finalização.');
assert.match(runtime, /totalFinalization\.canFinalize[\s\S]{0,520}setDraftResult\(null\);\s*setResult\(autoResult\);/,
  'R501: promoção automática deve existir somente no ramo canFinalize.');
assert.match(runtime, /setDraftResult\(autoResult\);\s*setResult\(null\);/,
  'R501: leitura não certificada deve permanecer como prévia.');

console.log('R501 Total Reader: finalização automática agora é fail-closed e preserva prévia quando há dúvida.');
