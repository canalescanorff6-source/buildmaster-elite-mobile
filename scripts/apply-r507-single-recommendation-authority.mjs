import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R507_SINGLE_RECOMMENDATION_AUTHORITY_VERSION = '40.80-r507-single-recommendation-authority-convergence-v1';
const CLEAN_SLATE_FILE = 'src/lib/cleanSlatePerformance2027V4080R119.ts';

function replaceOnce(source, from, to, label) {
  if(source.includes('parsed:{...parsed,attributes:displayedAttributes}')){
    from=from.replace('...input,parsed,training:zero','...input,parsed:{...parsed,attributes:displayedAttributes},training:zero');
    to=to.replace('...input,parsed,training:zero','...input,parsed:{...parsed,attributes:displayedAttributes},training:zero');
  }
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R507: contrato inesperado em ${label}; ocorrências=${count}.`);
  return source.replace(from, to);
}

export function applyR507SingleRecommendationAuthority(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const file = path.resolve(root, CLEAN_SLATE_FILE);
  if (!fs.existsSync(file)) throw new Error(`R507: Clean Slate ausente: ${CLEAN_SLATE_FILE}`);

  const source = fs.readFileSync(file, 'utf8');
  let next = source;

  const impetoImport = "import { evaluateFinalImpetoDecisionR457, type FinalImpetoDecisionR457 } from './finalImpetoDecisionR457';";
  const r507Import = "import { projectFinalRecommendationsR507 } from './finalRecommendationAuthorityR507';";
  if (!next.includes(r507Import)) {
    if (!next.includes(impetoImport)) throw new Error('R507: import da autoridade R505 não encontrado.');
    next = next.replace(impetoImport, `${impetoImport}\n${r507Import}`);
  }

  const blockedImpeto = 'const blockedFinalImpetoR457=evaluateFinalImpetoDecisionR457(parsed,actions,usageContext.targetPosition,projectedPlayerStateR504.finalAttributes);';
  const blockedProjection = `${blockedImpeto}\n    const blockedPublicRecommendationsR507=projectFinalRecommendationsR507(blockedFinalSkillSetR457,blockedFinalImpetoR457,{actionable:false});`;
  next = replaceOnce(next, blockedImpeto, blockedProjection, 'projeção BLOCKED');

  const readyImpeto = 'const finalImpetoDecisionR457=evaluateFinalImpetoDecisionR457(parsed,recommendationActions,recommendationContext.targetPosition,projectedPlayerStateR504.finalAttributes);';
  const readyProjection = `${readyImpeto}\n  const publicRecommendationsR507=projectFinalRecommendationsR507(finalAdditionalSkillSetR457,finalImpetoDecisionR457);`;
  next = replaceOnce(next, readyImpeto, readyProjection, 'projeção READY');

  next = replaceOnce(
    next,
    'const skillIntegrity=skillIntegrityR119(input,parsed,top5,usageContext.targetPosition);',
    'const skillIntegrity=skillIntegrityR119(input,parsed,blockedPublicRecommendationsR507.skills,usageContext.targetPosition);',
    'skillIntegrity BLOCKED',
  );
  next = replaceOnce(
    next,
    'const skillIntegrity=skillIntegrityR119(input,parsed,top5,recommendationContext.targetPosition);',
    'const skillIntegrity=skillIntegrityR119(input,parsed,publicRecommendationsR507.skills,recommendationContext.targetPosition);',
    'skillIntegrity READY',
  );

  next = replaceOnce(
    next,
    'actions,top5,finalAdditionalSkillSetR457:blockedFinalSkillSetR457,finalImpetoDecisionR457:blockedFinalImpetoR457,',
    'actions,top5:blockedPublicRecommendationsR507.skills,finalAdditionalSkillSetR457:blockedFinalSkillSetR457,finalImpetoDecisionR457:blockedFinalImpetoR457,',
    'top5 estrutural BLOCKED',
  );
  next = replaceOnce(
    next,
    "currentImpeto:parsed.impetos?.[0]?.name??null,\n      impetoDecision:parsed.impetos?.length?'KEEP_CURRENT':'NO_SAFE_IMPETO',\n      recommendedImpeto:null,\n      impetoIdeal:parsed.impetos?.[0]?.name??null,\n      impetoIdealScore:parsed.impetos?.length?100:0,\n      impetoIdealConfidence:parsed.impetos?.length?round1(confidence):0,\n      impetoReason:parsed.impetos?.length?`Ímpeto atual ${parsed.impetos?.[0]?.name} preservado.`:'A leitura ainda não tem atributos suficientes para classificar um Ímpeto ideal com segurança.',\n      impetoSlotStatus:String(parsed.evidence?.impetoSlotStatus??'DESCONHECIDO'),",
    "currentImpeto:blockedPublicRecommendationsR507.impeto.current,\n      impetoDecision:blockedPublicRecommendationsR507.impeto.decision,\n      recommendedImpeto:blockedPublicRecommendationsR507.impeto.recommendedImpeto,\n      impetoIdeal:blockedPublicRecommendationsR507.impeto.ideal,\n      impetoIdealScore:blockedPublicRecommendationsR507.impeto.idealScore,\n      impetoIdealConfidence:blockedPublicRecommendationsR507.impeto.idealConfidence,\n      impetoReason:blockedPublicRecommendationsR507.impeto.reason,\n      impetoSlotStatus:blockedPublicRecommendationsR507.impeto.slotStatus,",
    'campos públicos BLOCKED',
  );
  next = replaceOnce(
    next,
    'return {...input,parsed,training:zero,trainingCost:trainingPlanCost(zero),trainingPointsUsed:0,trainingPointsTotal:budget,trainingPointsRemaining:budget,recommendedSkills:top5,recommendedImpetos:[],skillIntegrity,',
    'return {...input,parsed,training:zero,trainingCost:trainingPlanCost(zero),trainingPointsUsed:0,trainingPointsTotal:budget,trainingPointsRemaining:budget,recommendedSkills:blockedPublicRecommendationsR507.skills,recommendedImpetos:blockedPublicRecommendationsR507.impeto.recommendations,skillIntegrity,',
    'retorno público BLOCKED',
  );

  next = replaceOnce(
    next,
    'dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,finalAdditionalSkillSetR457,finalImpetoDecisionR457,currentImpeto:impeto.current,\n    impetoDecision:impeto.decision,recommendedImpeto:impeto.recommendations[0]?.name??null,impetoIdeal:impeto.ideal,\n    impetoIdealScore:impeto.idealScore,impetoIdealConfidence:impeto.idealConfidence,impetoReason:impeto.reason,impetoSlotStatus:impeto.slotStatus,',
    'dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5:publicRecommendationsR507.skills,finalAdditionalSkillSetR457,finalImpetoDecisionR457,currentImpeto:publicRecommendationsR507.impeto.current,\n    impetoDecision:publicRecommendationsR507.impeto.decision,recommendedImpeto:publicRecommendationsR507.impeto.recommendedImpeto,impetoIdeal:publicRecommendationsR507.impeto.ideal,\n    impetoIdealScore:publicRecommendationsR507.impeto.idealScore,impetoIdealConfidence:publicRecommendationsR507.impeto.idealConfidence,impetoReason:publicRecommendationsR507.impeto.reason,impetoSlotStatus:publicRecommendationsR507.impeto.slotStatus,',
    'campos públicos READY',
  );
  next = replaceOnce(
    next,
    'existingImpetoNeverRepeated:!impeto.current||!impeto.recommendations.some(x=>norm(x.name)===norm(impeto.current))',
    'existingImpetoNeverRepeated:publicRecommendationsR507.impeto.existingImpetoNeverRepeated',
    'guard Ímpeto READY',
  );
  next = replaceOnce(
    next,
    'recommendedSkills:top5,\n    recommendedImpetos:impeto.recommendations,',
    'recommendedSkills:publicRecommendationsR507.skills,\n    recommendedImpetos:publicRecommendationsR507.impeto.recommendations,',
    'retorno público READY',
  );

  const required = [
    r507Import,
    'blockedPublicRecommendationsR507=projectFinalRecommendationsR507(blockedFinalSkillSetR457,blockedFinalImpetoR457,{actionable:false})',
    'publicRecommendationsR507=projectFinalRecommendationsR507(finalAdditionalSkillSetR457,finalImpetoDecisionR457)',
    'recommendedSkills:blockedPublicRecommendationsR507.skills',
    'recommendedSkills:publicRecommendationsR507.skills',
    'recommendedImpetos:publicRecommendationsR507.impeto.recommendations',
    'top5:publicRecommendationsR507.skills',
    'impetoDecision:publicRecommendationsR507.impeto.decision',
    'existingImpetoNeverRepeated:publicRecommendationsR507.impeto.existingImpetoNeverRepeated',
  ];
  for (const fragment of required) {
    if (!next.includes(fragment)) throw new Error(`R507: convergência incompleta: ${fragment}`);
  }

  const changed = next !== source;
  if (changed) fs.writeFileSync(file, next, 'utf8');
  return {
    changed,
    patched: changed ? [CLEAN_SLATE_FILE] : [],
    version: R507_SINGLE_RECOMMENDATION_AUTHORITY_VERSION,
    singlePublicWriter: true,
    blockedFailClosed: true,
  };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR507SingleRecommendationAuthority(process.cwd());
  console.log(result.changed
    ? 'R507: autoridade pública única materializada no Clean Slate.'
    : 'R507: autoridade pública única já estava convergida.');
}
