import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PREFINAL_AUTOFILL_R20_MARKER = 'BM_PREFINAL_AUTOFILL_R20';

function replaceRequired(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) {
    throw new Error(`[r20] ${label}: contrato de origem não encontrado.`);
  }
  return source.replace(needle, replacement);
}

export function transformPreFinalAutofillR20(input) {
  let source = input;
  if (source.includes(PREFINAL_AUTOFILL_R20_MARKER)) return source;

  const oldBlock = `      setPreFinalConfirmation({
        playerName: autoResult.parsed.playerName || '',
        level: String(autoResult.parsed.level ?? ''),
        points: String(autoResult.trainingPointsTotal ?? autoResult.parsed.trainingPointsTotal ?? '')
      });`;

  const newBlock = `      // ${PREFINAL_AUTOFILL_R20_MARKER}
      // Preenche automaticamente a conferência usando a leitura real da carta.
      const detectedPlayerName = String(
        autoResult.parsed.playerName || manualFields.playerName || ''
      ).trim();

      const parsedLevel = Number(autoResult.parsed.level ?? manualFields.level ?? 0);
      const levelMatch = rawText.match(
        /(?:nível|nivel|level)\\s*(?:máx(?:imo)?|max(?:imo)?|maximum)?\\s*[:\\-]?\\s*(\\d{1,3})/i
      );
      const detectedLevel = parsedLevel > 0
        ? parsedLevel
        : Number(levelMatch?.[1] ?? 0);

      const explicitProgress = Number(
        autoResult.trainingPointsTotal
        ?? autoResult.parsed.trainingPointsTotal
        ?? manualFields.trainingPointsTotal
        ?? 0
      );

      // No eFootball cada subida de nível concede 2 pontos de progressão.
      // Nível 1 = 0, nível 31 = 60, etc. Quando o nível foi lido,
      // ele vira a referência canônica para impedir OCR incorreto nos pontos.
      const calculatedProgress = detectedLevel > 0
        ? Math.max(0, (detectedLevel - 1) * 2)
        : 0;

      const detectedProgress = calculatedProgress > 0 || detectedLevel === 1
        ? calculatedProgress
        : Math.max(0, explicitProgress);

      setPreFinalConfirmation({
        playerName: detectedPlayerName,
        level: detectedLevel > 0 ? String(detectedLevel) : '',
        points: detectedLevel > 0 || explicitProgress >= 0 ? String(detectedProgress) : ''
      });`;

  source = replaceRequired(
    source,
    oldBlock,
    newBlock,
    'preenchimento automático de Nome/Nível/Pontos'
  );

  source = source.replace(
    "Confira Nome, Nível máximo e Pontos antes de gerar a ficha",
    "Nome, Nível máximo e Pontos foram preenchidos automaticamente; confira antes de gerar a ficha"
  );

  source = source.replace(
    "O restante da carta já foi analisado. Corrija somente estes dados se o OCR tiver lido algo errado.",
    "Nome, nível e progressão já vêm preenchidos pela leitura. Só altere algum campo se o OCR tiver identificado algo errado."
  );

  return source;
}

export function applyPreFinalAutofillR20(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/components/CardVisionApp.tsx');
  if (!existsSync(target)) throw new Error('[r20] CardVisionApp.tsx não encontrado.');

  const before = readFileSync(target, 'utf8');
  const after = transformPreFinalAutofillR20(before);

  if (after === before) {
    console.log('v40.80 r20: preenchimento automático pré-ficha já aplicado.');
    return { changed: false, target };
  }

  writeFileSync(target, after, 'utf8');
  console.log('v40.80 r20 aplicada: Nome + Nível + Pontos preenchidos automaticamente após o OCR.');
  return { changed: true, target };
}
