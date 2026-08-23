import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PREFINAL_VISUAL_R104_MARKER = 'BM_PREFINAL_VISUAL_R104';
const STATE_MARKER = 'BM_PREFINAL_VISUAL_R104_STATE';
const DATA_MARKER = 'BM_PREFINAL_VISUAL_R104_DATA';
const UI_MARKER = 'BM_PREFINAL_VISUAL_R104_UI';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r104] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

export function transformPreFinalVisualR104(input) {
  let source = input;
  if (source.includes(PREFINAL_VISUAL_R104_MARKER)) return source;

  if (!source.includes(STATE_MARKER)) {
    source = replaceRequired(
      source,
      "  const [preFinalConfirmation, setPreFinalConfirmation] = useState<{ playerName: string; level: string; points: string } | null>(null);",
      `  // ${STATE_MARKER}
  const [preFinalConfirmation, setPreFinalConfirmation] = useState<{ playerName: string; level: string; points: string; preview: string | null } | null>(null);`,
      'tipo da confirmação pré-ficha'
    );
  }

  if (!source.includes(DATA_MARKER)) {
    source = replaceRequired(
      source,
      "      setPreFinalConfirmation({ playerName: detectedPlayerName, level: detectedLevel > 0 ? String(detectedLevel) : '', points: detectedLevel > 0 || explicitProgress > 0 ? String(detectedProgress) : '' });",
      `      // ${DATA_MARKER}
      const inferredMaximumLevel =
        detectedLevel <= 0 &&
        detectedProgress > 0 &&
        detectedProgress % 2 === 0
          ? Math.floor(detectedProgress / 2) + 1
          : 0;
      setPreFinalConfirmation({
        playerName: detectedPlayerName,
        level: detectedLevel > 0 ? String(detectedLevel) : inferredMaximumLevel > 0 ? String(inferredMaximumLevel) : '',
        points: detectedLevel > 0 || explicitProgress > 0 ? String(detectedProgress) : '',
        preview: preview ?? null
      });`,
      'persistência do print e inferência do nível'
    );
  }

  if (!source.includes(UI_MARKER)) {
    source = replaceRequired(
      source,
      `                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nome do jogador</strong>`,
      `                {/* ${UI_MARKER} */}
                {preFinalConfirmation.preview ? (
                  <div
                    aria-label="Print original para conferência"
                    style={{
                      display: 'grid',
                      gap: 10,
                      padding: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(96,165,250,.32)',
                      background: 'rgba(5,15,29,.78)'
                    }}
                  >
                    <div style={{ display: 'grid', gap: 3 }}>
                      <strong>Print original da carta</strong>
                      <span style={{ fontSize: 12, opacity: .72, lineHeight: 1.4 }}>
                        Confira o nível máximo e os pontos de progressão no mesmo print usado no scan.
                      </span>
                    </div>
                    <a
                      href={preFinalConfirmation.preview}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Abrir print original em tamanho maior"
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: '46vh',
                        overflow: 'auto',
                        borderRadius: 13,
                        background: '#050b14',
                        border: '1px solid rgba(255,255,255,.08)'
                      }}
                    >
                      <img
                        src={preFinalConfirmation.preview}
                        alt="Print original usado na leitura"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 'auto',
                          maxHeight: '46vh',
                          objectFit: 'contain',
                          objectPosition: 'top center'
                        }}
                      />
                    </a>
                    <small style={{ opacity: .68 }}>
                      Toque na imagem para abrir maior. Ela fica presa a esta leitura até você gerar a ficha.
                    </small>
                  </div>
                ) : (
                  <div
                    role="status"
                    style={{
                      padding: 11,
                      borderRadius: 13,
                      border: '1px solid rgba(245,158,11,.28)',
                      background: 'rgba(120,72,8,.12)',
                      fontSize: 12,
                      lineHeight: 1.45
                    }}
                  >
                    O print desta leitura não está disponível. Volte à leitura e selecione a imagem novamente.
                  </div>
                )}
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nome do jogador</strong>`,
      'imagem na tela real Nome/Nível/Progresso'
    );
  }

  return `${source}\n/* ${PREFINAL_VISUAL_R104_MARKER} */\n`;
}

export function applyPreFinalVisualR104(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/components/CardVisionApp.tsx');
  if (!existsSync(target)) throw new Error('[r104] CardVisionApp.tsx não encontrado.');
  const before = readFileSync(target, 'utf8');
  const after = transformPreFinalVisualR104(before);
  if (after === before) {
    console.log('v40.80 r104: print/nível pré-ficha já aplicados.');
    return { changed: false, target };
  }
  writeFileSync(target, after, 'utf8');
  console.log('v40.80 r104 aplicada: print visível + nível inferido na tela real pré-ficha.');
  return { changed: true, target };
}
