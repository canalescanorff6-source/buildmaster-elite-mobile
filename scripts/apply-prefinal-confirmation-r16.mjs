import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PREFINAL_CONFIRMATION_R16_MARKER = 'BM_PREFINAL_CONFIRMATION_R16';

function replaceRequired(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) {
    throw new Error(`[r16] Não foi possível aplicar ${label}: contrato de origem não encontrado.`);
  }
  return source.replace(needle, replacement);
}

export function transformCardVisionAppR16(input) {
  let source = input;
  if (source.includes(PREFINAL_CONFIRMATION_R16_MARKER)) return source;

  source = replaceRequired(
    source,
    "  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);\n  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());",
    `  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  // ${PREFINAL_CONFIRMATION_R16_MARKER}
  const [preFinalConfirmation, setPreFinalConfirmation] = useState<{ playerName: string; level: string; points: string } | null>(null);
  const [preFinalGenerateRequested, setPreFinalGenerateRequested] = useState(false);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());`,
    'estado da confirmação pré-ficha'
  );

  source = replaceRequired(
    source,
    "      setOcrDone(false); setRawText(''); setResult(null); setDraftResult(null); setManualFields(emptyManualFields()); setManualMode(false);",
    "      setOcrDone(false); setRawText(''); setResult(null); setDraftResult(null); setPreFinalConfirmation(null); setPreFinalGenerateRequested(false); setManualFields(emptyManualFields()); setManualMode(false);",
    'limpeza da confirmação ao iniciar nova ficha'
  );

  const flowLogic = `  function confirmPreFinalCardDataR16() {
    if (!preFinalConfirmation) return;
    const playerName = preFinalConfirmation.playerName.trim();
    const level = preFinalConfirmation.level.replace(/[^0-9]/g, '').slice(0, 3);
    const points = preFinalConfirmation.points.replace(/[^0-9]/g, '').slice(0, 4);
    if (!playerName) {
      setStatus('Confira o nome do jogador antes de gerar a ficha.');
      return;
    }
    if (!level || Number(level) <= 0) {
      setStatus('Informe o nível máximo correto da carta antes de gerar a ficha.');
      return;
    }
    if (!points || Number(points) < 0) {
      setStatus('Informe os pontos de progressão disponíveis antes de gerar a ficha.');
      return;
    }
    setManualFields((current) => ({
      ...current,
      playerName,
      level,
      trainingPointsTotal: points
    }));
    setPreFinalGenerateRequested(true);
    setStatus('Dados confirmados. Recalculando a ficha com o nível e o orçamento informados...');
  }
  useEffect(() => {
    if (!preFinalGenerateRequested) return;
    setPreFinalGenerateRequested(false);
    setPreFinalConfirmation(null);
    runAnalysis(true);
  }, [preFinalGenerateRequested, manualFields.playerName, manualFields.level, manualFields.trainingPointsTotal]);
`;
  source = replaceRequired(
    source,
    "  function openMainSection(section: MainSection, options: { track?: boolean; skipManualBootstrap?: boolean } = {}) {",
    `${flowLogic}  function openMainSection(section: MainSection, options: { track?: boolean; skipManualBootstrap?: boolean } = {}) {`,
    'confirmação e geração final'
  );

  source = replaceRequired(
    source,
    "      hydrateReviewFields(autoResult);\n      setDraftResult(null); setResult(autoResult);",
    `      hydrateReviewFields(autoResult);
      // A leitura terminou, mas a ficha definitiva só nasce depois da confirmação
      // de Nome, Nível máximo e Pontos de progressão.
      setDraftResult(autoResult);
      setResult(null);
      setPreFinalConfirmation({
        playerName: autoResult.parsed.playerName || '',
        level: String(autoResult.parsed.level ?? ''),
        points: String(autoResult.trainingPointsTotal ?? autoResult.parsed.trainingPointsTotal ?? '')
      });`,
    'pausa obrigatória entre OCR e ficha final'
  );

  source = source.replace(
    "      setStatus(`OCR v40.70 concluído com ${visionAudit.score}/100. Ficha de Desempenho Máximo gerada automaticamente${autoWarnings}${discoveryStatus}.`);",
    "      setStatus(`OCR v40.70 concluído com ${visionAudit.score}/100. Confira Nome, Nível máximo e Pontos antes de gerar a ficha${autoWarnings}${discoveryStatus}.`);"
  ).replace(
    "      reportReaderProgress(100, 'Ficha gerada', 'Leitura concluída sem etapa obrigatória de confirmação.', readerTotal, readerTotal);",
    "      reportReaderProgress(100, 'Leitura concluída', 'Confira Nome, Nível máximo e Pontos de progressão para gerar a ficha.', readerTotal, readerTotal);"
  );

  const resultNeedle = ") : result ? (            <ResultSafetyBoundary";
  const preFinalUi = `) : preFinalConfirmation ? (
              <section className="luxury-panel" aria-label="Confirmação antes da ficha" style={{ maxWidth: 620, width: '100%', margin: '0 auto', padding: 22, display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <p className="kicker"><CheckCircle2 size={15} /> Leitura concluída</p>
                  <h2 style={{ margin: 0 }}>Confira antes de gerar a ficha</h2>
                  <p style={{ margin: 0, opacity: .78 }}>O restante da carta já foi analisado. Corrija somente estes dados se o OCR tiver lido algo errado.</p>
                </div>
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nome do jogador</strong>
                  <input
                    value={preFinalConfirmation.playerName}
                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, playerName: event.target.value } : current)}
                    autoComplete="off"
                    inputMode="text"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nível máximo da carta</strong>
                  <input
                    value={preFinalConfirmation.level}
                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) } : current)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Pontos de progressão disponíveis</strong>
                  <input
                    value={preFinalConfirmation.points}
                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, points: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) } : current)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                </label>
                <button
                  type="button"
                  className="elite-button"
                  onClick={confirmPreFinalCardDataR16}
                  disabled={preFinalGenerateRequested}
                  style={{ minHeight: 54, width: '100%', justifyContent: 'center' }}
                >
                  {preFinalGenerateRequested ? <><Loader2 className="spin" size={17} /> Gerando ficha...</> : <><Sparkles size={17} /> Gerar ficha</>}
                </button>
              </section>
            ) : result ? (            <ResultSafetyBoundary`;
  source = replaceRequired(source, resultNeedle, preFinalUi, 'tela compacta antes da ficha');

  return source;
}

export function applyPreFinalConfirmationR16(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/components/CardVisionApp.tsx');
  if (!existsSync(target)) throw new Error('[r16] CardVisionApp.tsx não encontrado.');
  const original = readFileSync(target, 'utf8');
  const source = transformCardVisionAppR16(original);
  if (source === original) {
    console.log('v40.80 r16: confirmação pré-ficha já aplicada.');
    return { changed: false, target };
  }
  writeFileSync(target, source, 'utf8');
  console.log('v40.80 r16 aplicada: OCR -> Nome/Nível/Pontos -> Gerar ficha -> Resultado.');
  return { changed: true, target };
}
