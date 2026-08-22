import assert from 'node:assert/strict';
import { transformCardVisionAppR16 } from '../scripts/apply-prefinal-confirmation-r16.mjs';
import { transformPreFinalAutofillR20 } from '../scripts/apply-prefinal-autofill-r20.mjs';
import { transformPreFinalVisualR104 } from '../scripts/apply-prefinal-visual-r104.mjs';

const clean = `
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

const r16 = transformCardVisionAppR16(clean);
const r20 = transformPreFinalAutofillR20(r16);
const output = transformPreFinalVisualR104(r20);

assert.match(output, /BM_PREFINAL_VISUAL_R104/);
assert.match(output, /Print original da carta/);
assert.match(output, /src=\{preFinalConfirmation\.preview\}/);
assert.match(output, /href=\{preFinalConfirmation\.preview\}/);
assert.match(output, /preview: preview \?\? null/);
assert.match(output, /Math\.floor\(detectedProgress \/ 2\) \+ 1/);
assert.match(output, /objectFit: 'contain'/);
assert.ok(output.indexOf('Print original da carta') < output.indexOf('Nome do jogador'));
assert.equal(transformPreFinalVisualR104(output), output);

console.log('r104 aprovada: print e nível estão na tela real gerada por r16+r20.');
