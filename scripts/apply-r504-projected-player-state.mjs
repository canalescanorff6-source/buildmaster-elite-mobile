import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R504_PROJECTED_PLAYER_STATE_VERSION = '40.80-r504-projected-player-state-convergence-v1';

const CLEAN_SLATE_FILE = 'src/lib/cleanSlatePerformance2027V4080R119.ts';

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R504: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function applyR504ProjectedPlayerState(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, CLEAN_SLATE_FILE);
  if (!fs.existsSync(file)) throw new Error(`R504: Clean Slate ausente: ${CLEAN_SLATE_FILE}`);

  const source = fs.readFileSync(file, 'utf8');
  let next = source;

  const truthImport = "import { deriveCardTruthCertificationR501, type CardTruthCertificationR501 } from '../modules/analysis/cardTruthLayerR501';";
  const projectedImport = "import { deriveProjectedPlayerStateR504, TRAINING_ATTRIBUTE_GROUPS_R504, type ProjectedPlayerStateR504 } from '../modules/analysis/projectedPlayerStateR504';";
  if (!next.includes(projectedImport)) {
    if (!next.includes(truthImport)) throw new Error('R504: import R501 do Clean Slate ausente.');
    next = next.replace(truthImport, `${truthImport}\n${projectedImport}`);
  }

  next = replaceOnce(
    next,
    '  cardTruthCertificationR501: CardTruthCertificationR501;',
    '  cardTruthCertificationR501: CardTruthCertificationR501;\n  projectedPlayerStateR504: ProjectedPlayerStateR504;',
    'tipo CleanSlate2027R119',
  );

  const legacyTrainingAttributes = `const TRAINING_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {\n  shooting: ['finishing', 'placeKicking', 'curl'],\n  passing: ['lowPass', 'loftedPass'],\n  dribbling: ['ballControl', 'dribbling', 'tightPossession'],\n  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],\n  lowerBodyStrength: ['speed', 'kickingPower', 'stamina'],\n  aerialStrength: ['heading', 'jump', 'physicalContact'],\n  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],\n  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],\n  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],\n  gk3: ['goalkeeperReach']\n};`;
  const canonicalTrainingAttributes = 'const TRAINING_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = TRAINING_ATTRIBUTE_GROUPS_R504;';
  next = replaceOnce(next, legacyTrainingAttributes, canonicalTrainingAttributes, 'mapa de atributos por treino');

  const blockedZero = '    const zero=emptyTraining();';
  const blockedProjected = `${blockedZero}\n    const projectedPlayerStateR504=deriveProjectedPlayerStateR504(parsed,zero);`;
  next = replaceOnce(next, blockedZero, blockedProjected, 'estado bloqueado');

  const readyTraining = '  const training=optimized.plan;';
  const readyProjected = `${readyTraining}\n  const projectedPlayerStateR504=deriveProjectedPlayerStateR504(parsed,training);`;
  next = replaceOnce(next, readyTraining, readyProjected, 'estado READY');

  if (!next.includes("cardTruthCertificationR501,\n      projectedPlayerStateR504,")) {
    const blockedPattern = /cardTruthCertificationR501,\n(\s*)cardKey:/;
    const blockedMatches = [...next.matchAll(new RegExp(blockedPattern.source, 'g'))];
    if (blockedMatches.length < 1) throw new Error('R504: vínculo BLOCKED após certificação R501 ausente.');
    next = next.replace(blockedPattern, (_match, indent) => `cardTruthCertificationR501,\n${indent}projectedPlayerStateR504,\n${indent}cardKey:`);
  }

  if (!next.includes("cardTruthCertificationR501,\n    projectedPlayerStateR504,")) {
    const readyPattern = /cardTruthCertificationR501,\n(\s*)cardKey:/;
    const readyMatches = [...next.matchAll(new RegExp(readyPattern.source, 'g'))];
    if (readyMatches.length < 1) throw new Error('R504: vínculo READY após certificação R501 ausente.');
    next = next.replace(readyPattern, (_match, indent) => `cardTruthCertificationR501,\n${indent}projectedPlayerStateR504,\n${indent}cardKey:`);
  }

  if (!next.includes(projectedImport)) throw new Error('R504: import da autoridade pós-build ausente.');
  if (!next.includes('projectedPlayerStateR504: ProjectedPlayerStateR504;')) throw new Error('R504: tipo estrutural pós-build ausente.');
  if (!next.includes('const TRAINING_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = TRAINING_ATTRIBUTE_GROUPS_R504;')) throw new Error('R504: Clean Slate ainda possui mapa de treino paralelo.');
  if (!next.includes('const projectedPlayerStateR504=deriveProjectedPlayerStateR504(parsed,training);')) throw new Error('R504: estado READY não nasce da ficha final.');
  if (!next.includes('deriveProjectedPlayerStateR504(parsed,zero)')) throw new Error('R504: caminho bloqueado não expõe estado base.');
  const objectBindings = (next.match(/\n\s*projectedPlayerStateR504,\n\s*cardKey:/g) ?? []).length;
  if (objectBindings !== 2) throw new Error(`R504: esperado estado pós-build nos dois resultados Clean Slate; encontrados=${objectBindings}.`);

  const changed = next !== source;
  if (changed) fs.writeFileSync(file, next, 'utf8');
  return {
    changed,
    patched: changed ? [CLEAN_SLATE_FILE] : [],
    version: R504_PROJECTED_PLAYER_STATE_VERSION,
    projectedPlayerState: true,
    singleTrainingMap: true,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR504ProjectedPlayerState(process.cwd());
  console.log(result.changed
    ? 'R504: Projected Player State materializado no Clean Slate.'
    : 'R504: Projected Player State já estava materializado.');
}
