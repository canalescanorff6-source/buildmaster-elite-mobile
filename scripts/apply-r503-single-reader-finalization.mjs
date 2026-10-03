import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R503_SINGLE_READER_FINALIZATION_VERSION = '40.80-r503-single-reader-finalization-patch-v1';

const READER_FILE = 'src/modules/card-reader/cardVisionReaderActionsR187.ts';

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R503: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function applyR503SingleReaderFinalization(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, READER_FILE);
  if (!fs.existsSync(file)) throw new Error(`R503: reader actions ausente: ${READER_FILE}`);

  const source = fs.readFileSync(file, 'utf8');
  let next = source;

  const runtimeImport = "import { loadOcrQueueRuntimeR160, loadReaderAnalysisRuntimeR163, loadReaderInteractionRuntimeR164, loadReaderRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';";
  const finalizationImport = "import { deriveSingleReaderFinalizationR503 } from '@/modules/card-reader/singleReaderFinalizationR503';";
  const truthTypeImport = "import type { CardTruthCertificationR501 } from '@/modules/analysis/cardTruthLayerR501';";
  if (!next.includes(finalizationImport)) {
    if (!next.includes(runtimeImport)) throw new Error('R503: âncora de import do reader runtime ausente.');
    next = next.replace(runtimeImport, `${runtimeImport}\n${finalizationImport}\n${truthTypeImport}`);
  } else if (!next.includes(truthTypeImport)) {
    next = next.replace(finalizationImport, `${finalizationImport}\n${truthTypeImport}`);
  }

  const renderGuard = "      if (!isRenderableAnalysisResult(nextResult)) throw new Error('Resultado incompleto para renderização');";
  const decisionBlock = `${renderGuard}\n      const cardTruthCertificationR501 = (nextResult as AnalysisResult & { cleanSlate2027R119?: { cardTruthCertificationR501?: CardTruthCertificationR501 } }).cleanSlate2027R119?.cardTruthCertificationR501 ?? null;\n      const confirmationDecisionR503=deriveSingleReaderFinalizationR503(cardTruthCertificationR501);`;
  if (!next.includes('const confirmationDecisionR503=deriveSingleReaderFinalizationR503(cardTruthCertificationR501);')
      && !next.includes('const confirmationDecisionR503 = deriveSingleReaderFinalizationR503(cardTruthCertificationR501);')) {
    next = replaceOnce(next, renderGuard, decisionBlock, 'decisão pós-análise');
  }

  const confirmedAnchor = "      if (confirmed) {\n        const edition = nextResult.parsed.editionIdentity;";
  const confirmedGuard = "      if (confirmed) {\n        if (!confirmationDecisionR503.canPersistConfirmed) {\n          await hydrateReviewFields(nextResult, singlePrintSession);\n          setDraftResult(nextResult);\n          setResult(null);\n          setManualMode(true);\n          setStatus(confirmationDecisionR503.reason);\n          return;\n        }\n        const edition = nextResult.parsed.editionIdentity;";
  if (!next.includes('if (!confirmationDecisionR503.canPersistConfirmed)')) {
    next = replaceOnce(next, confirmedAnchor, confirmedGuard, 'gate antes da persistência confirmada');
  }

  if (!next.includes(finalizationImport)) throw new Error('R503: autoridade de finalização não foi importada.');
  if (!next.includes('deriveSingleReaderFinalizationR503(cardTruthCertificationR501)')) throw new Error('R503: decisão de certificação não foi materializada.');
  const gateIndex = next.indexOf('if (!confirmationDecisionR503.canPersistConfirmed)');
  const persistIndex = next.indexOf('persistConfirmedAnalysisR470(nextResult');
  const promoteIndex = next.indexOf('setResult(nextResult);');
  if (gateIndex < 0 || persistIndex < 0 || promoteIndex < 0 || gateIndex >= persistIndex || gateIndex >= promoteIndex) {
    throw new Error('R503: gate precisa ocorrer antes da persistência e promoção final.');
  }

  const changed = next !== source;
  if (changed) fs.writeFileSync(file, next, 'utf8');
  return {
    changed,
    patched: changed ? [READER_FILE] : [],
    version: R503_SINGLE_READER_FINALIZATION_VERSION,
    manualConfirmationCannotOverrideCardTruth: true,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR503SingleReaderFinalization(process.cwd());
  console.log(result.changed
    ? 'R503: gate de certificação do leitor unitário materializado.'
    : 'R503: gate de certificação do leitor unitário já estava materializado.');
}
