import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R501_TOTAL_READER_FINALIZATION_VERSION = '40.80-r501-total-reader-finalization-v1';

const RUNTIME = 'src/modules/card-reader/readerAnalysisRuntimeR163.ts';
const R198 = 'tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs';

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R501 Total Reader: contrato inesperado em ${label}; ocorrências=${count}`);
  return source.replace(from, to);
}

function patchRuntime(source) {
  let next = source;
  const importLine = "import { deriveTotalReadingFinalizationR501 } from './totalReaderFinalizationR501';";
  if (!next.includes(importLine)) {
    const anchor = "import { readPositionProficiencyGridR416 } from './positionProficiencyVisionR416';";
    if (!next.includes(anchor)) throw new Error('R501 Total Reader: âncora de import do runtime ausente.');
    next = next.replace(anchor, `${anchor}\n${importLine}`);
  }

  const legacy = `      await hydrateReviewFields(autoResult, null);\n      setDraftResult(null); setResult(autoResult);\n      const totalWarning = session.mismatchRisk === 'block'\n        ? ' Há divergência entre os prints; o app não inventou os campos conflitantes.'\n        : session.missingCriticalScreens.length\n          ? \` Campos ausentes foram mantidos nulos: \${session.missingCriticalScreens.join(', ')}.\`\n          : '';\n      setStatus(\`Leitura Total concluída e ficha de Desempenho Máximo gerada automaticamente.\${totalWarning}\`);\n      reportTotalProgress(100, 'Ficha gerada', 'Todos os prints foram processados sem etapa obrigatória de confirmação.', captures.length, captures.length);\n      openMainSection('resultado');`;

  const guarded = `      await hydrateReviewFields(autoResult, null);\n      const totalFinalization = deriveTotalReadingFinalizationR501(session);\n      if (totalFinalization.canFinalize) {\n        setDraftResult(null); setResult(autoResult);\n        setStatus('Leitura Total concluída e ficha de Desempenho Máximo certificada automaticamente.');\n        reportTotalProgress(100, 'Ficha certificada', 'Todos os prints e campos críticos atenderam ao contrato R501.', captures.length, captures.length);\n      } else {\n        setDraftResult(autoResult); setResult(null);\n        const reason = totalFinalization.reasons.join(' ');\n        setStatus(\`Leitura Total concluída como prévia. Revise os campos antes da ficha final. \${reason}\`);\n        reportTotalProgress(100, 'Revisão necessária', 'A análise foi preservada como prévia; dados incertos não foram promovidos como finais.', captures.length, captures.length);\n      }\n      openMainSection('resultado');`;

  if (!next.includes('const totalFinalization = deriveTotalReadingFinalizationR501(session);')) {
    next = replaceOnce(next, legacy, guarded, 'readerAnalysisRuntimeR163');
  }
  return next;
}

function patchR198(source) {
  const legacyComment = '// O leitor único deve continuar em prévia antes da confirmação; o leitor total mantém seu contrato explícito.';
  const newComment = '// O leitor único e o Leitor Total R501 usam promoção explícita; leitura total incompleta permanece prévia.';
  let next = source.replace(legacyComment, newComment);
  const legacyAssert = "assert.match(readerRuntime, /setDraftResult\\(null\\);\\s*setResult\\(autoResult\\);/, 'R198: Leitura Total deve manter contrato explícito de finalização automática.');";
  const guardedAssert = "assert.match(readerRuntime, /deriveTotalReadingFinalizationR501\\(session\\)[\\s\\S]{0,180}totalFinalization\\.canFinalize[\\s\\S]{0,360}setDraftResult\\(null\\);\\s*setResult\\(autoResult\\);/, 'R198/R501: Leitura Total só pode promover automaticamente quando a autoridade R501 liberar.');\nassert.match(readerRuntime, /setDraftResult\\(autoResult\\);\\s*setResult\\(null\\);/, 'R198/R501: Leitura Total não certificada deve permanecer prévia.');";
  if (!next.includes('R198/R501: Leitura Total só pode promover automaticamente')) {
    next = replaceOnce(next, legacyAssert, guardedAssert, 'R198 finalização do Leitor Total');
  }
  return next;
}

export function applyTotalReaderFinalizationR501(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  for (const [relative, patcher] of [[RUNTIME, patchRuntime], [R198, patchR198]]) {
    const file = path.resolve(root, relative);
    if (!fs.existsSync(file)) throw new Error(`R501 Total Reader: arquivo obrigatório ausente: ${relative}`);
    const source = fs.readFileSync(file, 'utf8');
    const next = patcher(source);
    if (next !== source) {
      fs.writeFileSync(file, next, 'utf8');
      patched.push(relative);
    }
  }

  const runtime = fs.readFileSync(path.resolve(root, RUNTIME), 'utf8');
  const r198 = fs.readFileSync(path.resolve(root, R198), 'utf8');
  const issues = [];
  if (!runtime.includes("deriveTotalReadingFinalizationR501 } from './totalReaderFinalizationR501'")) issues.push('import R501 ausente no runtime');
  if (!runtime.includes('const totalFinalization = deriveTotalReadingFinalizationR501(session);')) issues.push('autoridade R501 não consultada');
  if (!/if \(totalFinalization\.canFinalize\)[\s\S]{0,420}setDraftResult\(null\); setResult\(autoResult\);/.test(runtime)) issues.push('promoção final não está protegida por canFinalize');
  if (!runtime.includes('setDraftResult(autoResult); setResult(null);')) issues.push('ramo de prévia fail-closed ausente');
  if (!r198.includes('R198/R501: Leitura Total só pode promover automaticamente')) issues.push('R198 ainda protege finalização incondicional');
  if (issues.length) throw new Error(`R501 Total Reader: convergência incompleta — ${issues.join(' | ')}`);

  return { changed: patched.length > 0, patched, version: R501_TOTAL_READER_FINALIZATION_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyTotalReaderFinalizationR501(process.cwd());
  console.log(result.changed
    ? `R501 Total Reader convergido em ${result.patched.length} arquivo(s).`
    : 'R501 Total Reader já estava convergido.');
}
