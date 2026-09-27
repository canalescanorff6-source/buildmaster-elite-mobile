import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R502_STRUCTURAL_CARD_TRUTH_CERTIFICATION_VERSION = '40.80-r502-structural-card-truth-certification-v2-r504';

const CLEAN_SLATE_FILE = 'src/lib/cleanSlatePerformance2027V4080R119.ts';

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R502: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function applyR502StructuralCardTruthCertification(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, CLEAN_SLATE_FILE);
  if (!fs.existsSync(file)) throw new Error(`R502: Clean Slate ausente: ${CLEAN_SLATE_FILE}`);

  const source = fs.readFileSync(file, 'utf8');
  let next = source;

  const evidenceImport = "import { applyCriticalEvidenceR419 } from '../modules/analysis/cardEvidenceAuthorityR419';";
  const truthImport = "import { deriveCardTruthCertificationR501, type CardTruthCertificationR501 } from '../modules/analysis/cardTruthLayerR501';";
  if (!next.includes(truthImport)) {
    if (!next.includes(evidenceImport)) throw new Error('R502: import R419 do Clean Slate ausente.');
    next = next.replace(evidenceImport, `${evidenceImport}\n${truthImport}`);
  }

  next = replaceOnce(
    next,
    "  status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';",
    "  status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';\n  cardTruthCertificationR501: CardTruthCertificationR501;",
    'tipo CleanSlate2027R119',
  );

  const parsedAnchor = "  const parsed:ParsedCard=applyCriticalEvidenceR419(rawSnapshot ? JSON.parse(JSON.stringify(rawSnapshot)) as ParsedCard : JSON.parse(JSON.stringify(input.parsed)) as ParsedCard);";
  const parsedWithCertification = `${parsedAnchor}\n  const cardTruthCertificationR501=deriveCardTruthCertificationR501(parsed);`;
  next = replaceOnce(next, parsedAnchor, parsedWithCertification, 'derivação pós-R419');

  if (!next.includes("status:'BLOCKED_INSUFFICIENT_DATA',\n      cardTruthCertificationR501,")) {
    const blockedPattern = /status:'BLOCKED_INSUFFICIENT_DATA',\n(\s*)cardKey:/;
    const blockedMatches = [...next.matchAll(new RegExp(blockedPattern.source, 'g'))];
    if (blockedMatches.length !== 1) throw new Error(`R502: caminho BLOCKED inesperado; ocorrências=${blockedMatches.length}.`);
    next = next.replace(blockedPattern, (_match, indent) => `status:'BLOCKED_INSUFFICIENT_DATA',\n${indent}cardTruthCertificationR501,\n${indent}cardKey:`);
  }

  if (!next.includes("status:'READY',\n    cardTruthCertificationR501,")) {
    const readyPattern = /status:'READY',\n(\s*)cardKey:/;
    const readyMatches = [...next.matchAll(new RegExp(readyPattern.source, 'g'))];
    if (readyMatches.length !== 1) throw new Error(`R502: caminho READY inesperado; ocorrências=${readyMatches.length}.`);
    next = next.replace(readyPattern, (_match, indent) => `status:'READY',\n${indent}cardTruthCertificationR501,\n${indent}cardKey:`);
  }

  if (!next.includes(truthImport)) throw new Error('R502: import da autoridade R501 não foi materializado.');
  if (!next.includes('cardTruthCertificationR501: CardTruthCertificationR501;')) throw new Error('R502: tipo estrutural ausente.');
  if (!next.includes('const cardTruthCertificationR501=deriveCardTruthCertificationR501(parsed);')) throw new Error('R502: derivação estrutural ausente.');
  // R504 pode inserir sua autoridade pós-build entre a certificação e cardKey.
  // A certificação R502 continua obrigatória exatamente uma vez em cada um dos dois resultados.
  const objectBindings = (next.match(/\n\s*cardTruthCertificationR501,\n(?:\s*projectedPlayerStateR504,\n)?\s*cardKey:/g) ?? []).length;
  if (objectBindings !== 2) throw new Error(`R502/R504: esperado vínculo estrutural nos dois resultados Clean Slate; encontrados=${objectBindings}.`);
  if (!next.includes("status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';")) throw new Error('R502: status legado READY/BLOCKED foi alterado indevidamente.');

  const changed = next !== source;
  if (changed) fs.writeFileSync(file, next, 'utf8');
  return {
    changed,
    patched: changed ? [CLEAN_SLATE_FILE] : [],
    version: R502_STRUCTURAL_CARD_TRUTH_CERTIFICATION_VERSION,
    structuralCertification: true,
    legacyStatusPreserved: true,
    r504SuccessorAware: true,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR502StructuralCardTruthCertification(process.cwd());
  console.log(result.changed
    ? 'R502: certificação estrutural materializada no Clean Slate.'
    : 'R502: certificação estrutural já estava materializada.');
}
