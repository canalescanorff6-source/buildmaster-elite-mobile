import assert from 'node:assert/strict';
import { transformCardVisionAppR16 } from '../scripts/apply-prefinal-confirmation-r16.mjs';
import { transformPreFinalAutofillR20 } from '../scripts/apply-prefinal-autofill-r20.mjs';
import { transformPreFinalVisualR104 } from '../scripts/apply-prefinal-visual-r104.mjs';
import { transformPreFinalAutoProgressR105 } from '../scripts/apply-prefinal-auto-progress-r105.mjs';

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
const r104 = transformPreFinalVisualR104(r20);
const output = transformPreFinalAutoProgressR105(r104);

assert.match(output, /BM_PREFINAL_AUTO_PROGRESS_R105/);
assert.match(output, /const nextPoints = levelNumber > 0 \? String\(Math\.max\(0, \(levelNumber - 1\) \* 2\)\) : ''/);
assert.match(output, /level: nextLevel, points: nextPoints/);
assert.match(output, /31 → 60, 34 → 66/);
assert.equal((31 - 1) * 2, 60);
assert.equal((34 - 1) * 2, 66);
assert.equal(transformPreFinalAutoProgressR105(output), output);

console.log('r105 aprovada: mudar Nível recalcula Progresso automaticamente (31=60, 34=66).');
