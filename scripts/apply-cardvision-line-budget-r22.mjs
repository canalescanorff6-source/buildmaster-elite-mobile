import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const CARDVISION_LINE_BUDGET_R22 = 'BM_CARDVISION_LINE_BUDGET_R22';
const SAFE_LINE_BUDGET = 5000;

export function applyCardVisionLineBudgetR22(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/components/CardVisionApp.tsx');
  if (!existsSync(target)) throw new Error('[r22] CardVisionApp.tsx não encontrado.');

  let source = readFileSync(target, 'utf8');
  const beforeLines = source.split('\n').length;

  if (!source.includes(CARDVISION_LINE_BUDGET_R22)) {
    source = source.replace(
      "// A Central de Backup é informativa e nunca pode impedir a abertura do app.",
      `// A Central de Backup é informativa e nunca pode impedir a abertura do app. ${CARDVISION_LINE_BUDGET_R22}`
    );
  }

  // r35: não mutilar código funcional apenas para satisfazer um orçamento antigo.
  // A compactação continua sendo permitida somente em linhas em branco duplicadas.
  let lines = source.split('\n');
  while (lines.length >= SAFE_LINE_BUDGET) {
    let removed = false;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '' && lines[i - 1].trim() === '') {
        lines.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (!removed) {
      console.warn(`[r35] CardVisionApp possui ${lines.length} linhas e não há linhas em branco duplicadas seguras. Preservando o código.`);
      break;
    }
  }

  source = lines.join('\n');
  writeFileSync(target, source, 'utf8');
  const afterLines = source.split('\n').length;

  console.log(`v40.80 r35 aplicada: CardVisionApp ${beforeLines} -> ${afterLines} linhas; lógica preservada.`);
  return { changed: source !== readFileSync(target, 'utf8'), beforeLines, afterLines, target };
}
