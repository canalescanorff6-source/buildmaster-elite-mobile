import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PREFINAL_AUTO_PROGRESS_R105_MARKER = 'BM_PREFINAL_AUTO_PROGRESS_R105';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r105] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

export function transformPreFinalAutoProgressR105(input) {
  let source = input;
  if (source.includes(PREFINAL_AUTO_PROGRESS_R105_MARKER)) return source;

  source = replaceRequired(
    source,
    `                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) } : current)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />`,
    `                    onChange={(event) => {
                      const nextLevel = event.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                      const levelNumber = Number(nextLevel || 0);
                      const nextPoints = levelNumber > 0 ? String(Math.max(0, (levelNumber - 1) * 2)) : '';
                      setPreFinalConfirmation((current) => current ? { ...current, level: nextLevel, points: nextPoints } : current);
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                  {/* ${PREFINAL_AUTO_PROGRESS_R105_MARKER} */}
                  <small style={{ opacity: .68 }}>
                    O progresso é recalculado automaticamente pelo nível: 31 → 60, 34 → 66.
                  </small>`,
    'sincronização Nível → Progresso'
  );

  return source;
}

export function applyPreFinalAutoProgressR105(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/components/CardVisionApp.tsx');
  if (!existsSync(target)) throw new Error('[r105] CardVisionApp.tsx não encontrado.');
  const before = readFileSync(target, 'utf8');
  const after = transformPreFinalAutoProgressR105(before);
  if (after === before) {
    console.log('v40.80 r105: progresso automático já aplicado.');
    return { changed: false, target };
  }
  writeFileSync(target, after, 'utf8');
  console.log('v40.80 r105 aplicada: Nível atualiza Pontos de progressão automaticamente.');
  return { changed: true, target };
}
