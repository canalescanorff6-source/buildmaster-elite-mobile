import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R505_POST_BUILD_IMPETO_VERSION = '40.80-r505-post-build-impeto-convergence-v1';

const CLEAN_SLATE_FILE = 'src/lib/cleanSlatePerformance2027V4080R119.ts';
const FINAL_IMPETO_FILE = 'src/lib/finalImpetoDecisionR457.ts';

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R505: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function applyR505PostBuildImpeto(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const cleanFile = path.resolve(root, CLEAN_SLATE_FILE);
  const finalFile = path.resolve(root, FINAL_IMPETO_FILE);
  if (!fs.existsSync(cleanFile)) throw new Error(`R505: Clean Slate ausente: ${CLEAN_SLATE_FILE}`);
  if (!fs.existsSync(finalFile)) throw new Error(`R505: autoridade final de Ímpeto ausente: ${FINAL_IMPETO_FILE}`);

  const finalImpeto = fs.readFileSync(finalFile, 'utf8');
  for (const required of [
    "import type { Attributes, ParsedCard, PositionCode } from './analyzerDomain';",
    "attributeSource:'BASE_CARD'|'PROJECTED_POST_BUILD';",
    'projectedAttributes?:Attributes',
    'const attributes=projectedAttributes??parsed.attributes;',
    "projectedAttributes?'PROJECTED_POST_BUILD':'BASE_CARD'",
    'attr(attributes,key)',
  ]) {
    if (!finalImpeto.includes(required)) throw new Error(`R505: finalImpetoDecisionR457 ainda não está pós-build: ${required}`);
  }
  if (finalImpeto.includes('attr(parsed,key)')) throw new Error('R505: autoridade final ainda lê atributos-base diretamente.');

  const source = fs.readFileSync(cleanFile, 'utf8');
  let next = source;

  next = replaceOnce(
    next,
    'function recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[],position:PositionCode) {',
    'function recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[],position:PositionCode,projectedAttributes:Attributes=parsed.attributes) {',
    'assinatura recommendImpetosR119',
  );
  next = replaceOnce(
    next,
    'average(profile.attributes.map(key=>attr(parsed.attributes,key)))',
    'average(profile.attributes.map(key=>attr(projectedAttributes,key)))',
    'atributos do recommendImpetosR119',
  );

  const jointLegacy = `    const actions=evaluation.details.slice(0,12);\n    const skill=optimizeFinalAdditionalSkillSetR457(parsed,actions,position);\n    const impeto=evaluateFinalImpetoDecisionR457(parsed,actions,position);`;
  const jointProjected = `    const actions=evaluation.details.slice(0,12);\n    const projectedState=deriveProjectedPlayerStateR504(parsed,materializeTrainingPlanR147(state.levels));\n    const skill=optimizeFinalAdditionalSkillSetR457(parsed,actions,position);\n    const impeto=evaluateFinalImpetoDecisionR457(parsed,actions,position,projectedState.finalAttributes);`;
  next = replaceOnce(next, jointLegacy, jointProjected, 'Joint Optimizer R457');

  next = replaceOnce(
    next,
    'const blockedFinalImpetoR457=evaluateFinalImpetoDecisionR457(parsed,actions,usageContext.targetPosition);',
    'const blockedFinalImpetoR457=evaluateFinalImpetoDecisionR457(parsed,actions,usageContext.targetPosition,projectedPlayerStateR504.finalAttributes);',
    'Ímpeto bloqueado',
  );
  next = replaceOnce(
    next,
    'const finalImpetoDecisionR457=evaluateFinalImpetoDecisionR457(parsed,recommendationActions,recommendationContext.targetPosition);',
    'const finalImpetoDecisionR457=evaluateFinalImpetoDecisionR457(parsed,recommendationActions,recommendationContext.targetPosition,projectedPlayerStateR504.finalAttributes);',
    'Ímpeto final READY',
  );
  next = replaceOnce(
    next,
    'const impeto=recommendImpetosR119(parsed,recommendationActions,recommendationContext.targetPosition);',
    'const impeto=recommendImpetosR119(parsed,recommendationActions,recommendationContext.targetPosition,projectedPlayerStateR504.finalAttributes);',
    'Ímpeto legado READY',
  );

  const requiredClean = [
    'recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[],position:PositionCode,projectedAttributes:Attributes=parsed.attributes)',
    'average(profile.attributes.map(key=>attr(projectedAttributes,key)))',
    'const projectedState=deriveProjectedPlayerStateR504(parsed,materializeTrainingPlanR147(state.levels));',
    'evaluateFinalImpetoDecisionR457(parsed,actions,position,projectedState.finalAttributes)',
    'evaluateFinalImpetoDecisionR457(parsed,recommendationActions,recommendationContext.targetPosition,projectedPlayerStateR504.finalAttributes)',
    'recommendImpetosR119(parsed,recommendationActions,recommendationContext.targetPosition,projectedPlayerStateR504.finalAttributes)',
  ];
  for (const required of requiredClean) {
    if (!next.includes(required)) throw new Error(`R505: Clean Slate não convergiu: ${required}`);
  }
  if (/evaluateFinalImpetoDecisionR457\(parsed,recommendationActions,recommendationContext\.targetPosition\);/.test(next)) {
    throw new Error('R505: decisão final READY voltou a usar carta-base.');
  }

  const changed = next !== source;
  if (changed) fs.writeFileSync(cleanFile, next, 'utf8');
  return {
    changed,
    patched: changed ? [CLEAN_SLATE_FILE] : [],
    version: R505_POST_BUILD_IMPETO_VERSION,
    projectedImpeto: true,
    jointOptimizerProjectedImpeto: true,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR505PostBuildImpeto(process.cwd());
  console.log(result.changed
    ? 'R505: Ímpeto pós-build materializado no Clean Slate.'
    : 'R505: Ímpeto pós-build já estava convergido.');
}
