import assert from 'node:assert/strict';
import { transformCardVisionAppR16 } from '../scripts/apply-prefinal-confirmation-r16.mjs';

const source = `
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
      setOcrDone(false); setRawText(''); setResult(null); setDraftResult(null); setManualFields(emptyManualFields()); setManualMode(false);
  function openMainSection(section: MainSection, options: { track?: boolean; skipManualBootstrap?: boolean } = {}) {
      hydrateReviewFields(autoResult);
      setDraftResult(null); setResult(autoResult);
      setStatus(\`OCR v40.70 concluído com \${visionAudit.score}/100. Ficha de Desempenho Máximo gerada automaticamente\${autoWarnings}\${discoveryStatus}.\`);
      reportReaderProgress(100, 'Ficha gerada', 'Leitura concluída sem etapa obrigatória de confirmação.', readerTotal, readerTotal);
) : result ? (            <ResultSafetyBoundary
`;

const output = transformCardVisionAppR16(source);
assert.ok(output.includes('BM_PREFINAL_CONFIRMATION_R16'));
assert.ok(output.includes('Nome do jogador'));
assert.ok(output.includes('Nível máximo da carta'));
assert.ok(output.includes('Pontos de progressão disponíveis'));
assert.ok(output.includes('Gerar ficha'));
assert.ok(output.includes('setDraftResult(autoResult);'));
assert.ok(output.includes('setResult(null);'));
assert.ok(output.includes('runAnalysis(true);'));
assert.ok(!output.includes("setDraftResult(null); setResult(autoResult);"));
assert.ok(output.includes('preFinalConfirmation ? ('));
assert.equal(transformCardVisionAppR16(output), output, 'a transformação precisa ser idempotente');
console.log('v40.80 r16 pré-ficha aprovada: Nome + Nível + Pontos antes do resultado final.');
