import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const navigation = fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/card-reader/readerRuntimeR160.ts', 'utf8');
const readerActionsR187 = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts', 'utf8');
const analysisRuntimeR163 = fs.readFileSync('src/modules/card-reader/readerAnalysisRuntimeR163.ts', 'utf8');
const structuredEvidence = fs.readFileSync('src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts', 'utf8');

const deferredTargets = [
  '@/lib/totalCardReader',
  '@/modules/card-reader/singlePrintPro',
  '@/modules/card-reader/cardArtCrop',
  '@/modules/card-reader/cardPreviewServiceR130',
  '@/modules/card-reader/ocrVisionEngine',
  '@/modules/card-reader/highPrecisionOcr',
  '@/modules/card-reader/manualCalibrationFastReader',
  '@/modules/card-reader/learnedOcrLexicon',
  '@/modules/card-reader/forensicConsensus',
  '@/modules/card-reader/efhubCanonicalNormalizer',
  '@/modules/card-reader/efhubDeterministicZones',
  '@/modules/card-reader/templateCalibration',
  '@/modules/images/imageSafety',
  '@/modules/card-reader/ocrQueue',
  '@/modules/card-reader/imageProcessing',
];

for (const target of deferredTargets) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(app, new RegExp(`^\\s*import\\s+(?!type\\b)[^\\n]+from ['\"]${escaped}['\"]`, 'm'), `R160 não pode reintroduzir import runtime estático de ${target}.`);
  assert.ok(runtime.includes(`import('${target}')`), `R160 deve manter ${target} atrás do runtime lazy.`);
}

assert.doesNotMatch(structuredEvidence, /import\s*\{[^}]*fieldByKey[^}]*\}\s*from\s*['"]\.\/singlePrintPro['"]/, 'R133 não deve puxar singlePrintPro em runtime apenas para fieldByKey.');
assert.match(structuredEvidence, /import type \{ SingleFieldEvidence, SinglePrintSession \} from '\.\/singlePrintPro';/, 'R133 deve preservar somente os contratos de tipo de singlePrintPro.');
assert.match(structuredEvidence, /function fieldByKey\(session: SinglePrintSession \| null, key: SingleFieldEvidence\['key'\]\)/, 'R133 deve manter helper local semanticamente equivalente.');

assert.match(navigation, /if \(section === 'leitor'\)[\s\S]*preloadReaderRuntimeR160\(\);/, 'Entrada no Leitor deve antecipar o chunk em resposta à intenção do usuário.');
assert.match(app, /loadBackgroundOcrRuntimeR160\(\)[\s\S]*readBackgroundOcrCheckpoint/, 'Retomada de OCR no startup deve usar loader granular de background.');
assert.match(readerActionsR187, /async function refreshOcrQueue\(\) \{[\s\S]*loadOcrQueueRuntimeR160\(\)/, 'Fila OCR deve usar loader granular pela fronteira R187 e não acordar todo o leitor.');
assert.match(analysisRuntimeR163, /const \{[\s\S]*singlePrint,[\s\S]*ocrWorker,[\s\S]*imageProcessing[\s\S]*\} = await loadReaderRuntimeR160\(\);/, 'Execução real do print deve adquirir o runtime completo sob demanda.');
assert.match(runtime, /let runtimePromise:[^\n]+null/, 'Runtime completo deve ser memoizado entre operações do leitor.');
assert.match(runtime, /let backgroundPromise:[^\n]+null/, 'Background OCR deve ter memoização granular.');
assert.match(runtime, /let queuePromise:[^\n]+null/, 'Fila OCR deve ter memoização granular.');

console.log('R160 aprovada: OCR/leitor pesado saiu do startup, com preload por intenção e loaders granulares para retomada/fila.');
