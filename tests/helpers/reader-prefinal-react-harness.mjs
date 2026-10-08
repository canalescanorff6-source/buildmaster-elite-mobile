import path from 'node:path';
import { build } from 'esbuild';

const componentPath = path.resolve('src/components/PreFinalCardReviewR548.tsx');

export async function buildReaderReviewHarness() {
  const source = `
    import { useState } from 'react';
    import { PreFinalCardReviewR548 } from ${JSON.stringify(componentPath)};
    import { createRoot } from 'react-dom/client';
    function Harness() {
      const [preFinalConfirmation, setPreFinalConfirmation] = useState(window.__reviewFixture.confirmation);
      const [manualFields, setManualFields] = useState(window.__reviewFixture.manualFields);
      const [cardPositionOverride, setCardPositionOverride] = useState(window.__reviewFixture.position);
      const [targetPosition, setTargetPosition] = useState('AUTO');
      const [status, setStatus] = useState('Confira os dados antes de gerar a ficha.');
      window.__reviewControl.closeReview = () => { window.__reviewControl.skipHydration=true; setPreFinalConfirmation(null); };
      window.__reviewControl.openReview = input => { setManualFields(input.manualFields); setCardPositionOverride(input.position); setPreFinalConfirmation(input.confirmation); setStatus('Nova carta em conferência.'); };
      async function runAnalysis(fields, confirmed) {
        setManualFields(fields);
        window.__reviewControl.requests.push({ fields: structuredClone(fields), confirmed, naturalPosition: cardPositionOverride, targetPosition });
        setStatus('Gerando ficha com os dados conferidos...');
        const outcome = await new Promise((resolve, reject) => Object.assign(window.__reviewControl, {resolve, reject}));
        if (!window.__reviewControl.skipHydration) {
          if (outcome?.status === 'review') setManualFields({ ...fields, playerName: 'Nome substituído pela análise', level:'99', trainingPointsTotal:'196' });
          setStatus(outcome?.status === 'review' ? 'A ficha precisa de revisão. Confira os dados e tente novamente.' : outcome?.status === 'failed' ? 'Falha ao gerar. Os dados foram preservados.' : outcome?.status === 'preview' ? 'Prévia gerada.' : 'Ficha gerada.');
        }
        return outcome;
      }
      return <>{preFinalConfirmation ? <PreFinalCardReviewR548
        preFinalConfirmation={preFinalConfirmation} setPreFinalConfirmation={setPreFinalConfirmation}
        manualFields={manualFields} setManualFields={setManualFields}
        cardPositionOverride={cardPositionOverride} setCardPositionOverride={setCardPositionOverride}
        targetPosition={targetPosition} setTargetPosition={setTargetPosition}
        status={status} setStatus={setStatus} onGenerate={runAnalysis}
        onCompleted={() => setPreFinalConfirmation(current => current === preFinalConfirmation ? null : current)}
      /> : <p>{status === 'Prévia gerada.' ? 'Prévia da ficha' : 'Ficha gerada'}</p>}<output aria-label="Estado da análise">{status}</output></>;
    }
    createRoot(document.getElementById('root')).render(<Harness />);
  `;
  const compiled = await build({
    stdin: {contents:source,resolveDir:process.cwd(),sourcefile:'reader-review-harness.tsx',loader:'tsx'},
    bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',
    define:{'process.env.NODE_ENV':'"production"'},
  });
  return compiled.outputFiles[0].text;
}
