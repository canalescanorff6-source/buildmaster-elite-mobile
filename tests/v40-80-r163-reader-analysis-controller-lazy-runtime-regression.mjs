import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const loader = fs.readFileSync('src/modules/card-reader/readerRuntimeR160.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/card-reader/readerAnalysisRuntimeR163.ts', 'utf8');
const navigationControllerR176 = fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8');
const readerActionsR187 = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts', 'utf8');

assert.ok(app.split(/\r?\n/).length <= 2900, 'R163 deve manter CardVisionApp abaixo de 2.900 linhas.');
assert.match(app, /createCardVisionReaderActionsR187/, 'CardVisionApp deve delegar a orquestração do leitor à fronteira R187.');
assert.match(readerActionsR187, /loadReaderAnalysisRuntimeR163/, 'R187 deve adquirir o runtime R163 de forma lazy.');
assert.match(readerActionsR187, /buildReaderAnalysisContextR187/, 'R187 deve montar o contrato de estado canônico para o runtime.');
assert.match(readerActionsR187, /createCardVisionReaderAnalysisOperationsR163\(buildReaderAnalysisContextR187\(\)\)/, 'Operações devem receber o snapshot/setters canônicos pela fronteira R187.');

for (const movedMarker of [
  'reportReaderProgress',
  'buildOcrVisionAudit(session, calibratedZoneText)',
  'buildProductionOcrEvidenceTextR134(session, zoneResults)',
  'const calibratedZoneText = calibratedFastPath',
  'const allReadings: PremiumZoneReading[] = []',
]) {
  assert.ok(!app.includes(movedMarker), `R163 não pode devolver ao CardVisionApp a orquestração pesada: ${movedMarker}`);
  assert.ok(runtime.includes(movedMarker), `Runtime R163 deve continuar responsável por: ${movedMarker}`);
}

assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+readerAnalysisRuntimeR163/m, 'Runtime pesado R163 não pode ser importado estaticamente pelo shell.');
assert.match(loader, /let analysisRuntimePromiseR163:[^\n]+null/, 'Runtime R163 deve ser memoizado.');
assert.match(loader, /import\('\.\/readerAnalysisRuntimeR163'\)/, 'Runtime R163 deve carregar por import dinâmico.');
assert.match(navigationControllerR176, /if \(section === 'leitor'\) \{[\s\S]*preloadReaderAnalysisRuntimeR163\(\)/, 'Entrada no Leitor deve antecipar R163 somente após intenção do usuário pela autoridade de navegação R176.');

assert.match(runtime, /READER_ANALYSIS_RUNTIME_R163_VERSION/, 'Runtime R163 precisa de versão explícita.');
assert.match(runtime, /loadReaderRuntimeR160\(\)/, 'R163 deve reutilizar a fronteira lazy OCR R160 em vez de duplicar motores.');
assert.match(runtime, /loadReaderEvidenceRuntimeR161\(\)/, 'R163 deve reutilizar a fronteira de evidência R161.');
assert.match(runtime, /physicalEvidence\.buildProductionOcrEvidenceTextR134\(session, zoneResults\)/, 'R134 continua sendo fronteira física/permanente da leitura unitária.');
assert.match(runtime, /const reviewHydration = await hydrateReviewFields\(autoResult, session\)/, 'Leitura unitária deve hidratar com a sessão recém-criada.');
assert.match(runtime, /hydrateReviewFields\(autoResult, null\)/, 'Leitor Total não pode herdar evidência Single anterior.');
assert.match(runtime, /createProductionAnalysisR138\(\{ rawText: lockedText, objective: 'COMPETITIVE'/, 'Produção final continua entrando pela fachada R138.');
assert.match(runtime, /setDraftResult\(autoResult\);\s*setResult\(null\)/, 'Print Único continua em pré-final antes de virar resultado definitivo.');
assert.match(readerActionsR187, /reviewWorkflow\.confirmedOcrSkillsForLearningR131/, 'Confirmação final continua aprendendo somente skills permitidas pela R131.');

console.log('R163 aprovada: orquestração pesada do Leitor saiu do CardVisionApp, continua lazy e preserva R131/R134/R138 sem duplicar estado.');
