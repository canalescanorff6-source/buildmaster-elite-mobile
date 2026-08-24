import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R115_CARD_SIGNATURE_MARKER = 'BM_R115_CARD_SIGNATURE';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r115] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

function patchLayout(input) {
  let source = input;
  if (source.includes('10. Habilidade especial')) return source;
  source = replaceRequired(source,
    ` * As nove áreas visuais seguem exatamente o mapa 1400 × 1600 enviado como`,
    ` * As dez áreas visuais seguem exatamente o mapa 1400 × 1600 enviado como`,
    'comentário de 10 áreas');
  source = replaceRequired(source,
    `  box('progression', '9. Pontos distribuídos', 650, 472, 1385, 555)\n];`,
    `  box('progression', '9. Pontos distribuídos', 650, 472, 1385, 555),\n  box('specialSkill', '10. Habilidade especial', 15, 1425, 1385, 1590)\n];`,
    'décimo macro quadrado');
  source = replaceRequired(source,
    `  box('skills', 'Habilidades • bloco completo', 18, 1427, 1382, 1595),`,
    `  box('specialSkill', 'Habilidade especial • área exclusiva', 15, 1425, 1385, 1590),\n  box('skills', 'Habilidades • bloco completo', 18, 1427, 1382, 1595),`,
    'OCR exclusivo especial');
  return source;
}

function patchManualCalibration(input) {
  let source = input;
  if (source.includes(`| 'specialSkill';`)) return source;
  source = replaceRequired(source,
    `  | 'skills'\n  | 'progression';`,
    `  | 'skills'\n  | 'progression'\n  | 'specialSkill';`,
    'tipo especial');
  source = replaceRequired(source,
    `  { id: 'progression', key: 'progression', shortLabel: 'Pontos distribuídos', color: '#ffcf4a' }\n];`,
    `  { id: 'progression', key: 'progression', shortLabel: 'Pontos distribuídos', color: '#ffcf4a' },\n  { id: 'specialSkill', key: 'specialSkill', shortLabel: 'Habilidade especial', color: '#ff65c5' }\n];`,
    'meta especial');
  source = replaceRequired(source,
    `  physicalModel: 'physical',\n  skills: 'skills'\n};`,
    `  physicalModel: 'physical',\n  skills: 'skills',\n  specialSkill: 'specialSkill'\n};`,
    'mapa OCR especial');
  source = replaceRequired(source,
    ` * Gera os recortes internos a partir dos nove quadrados movidos pelo usuário.`,
    ` * Gera os recortes internos a partir dos dez quadrados movidos pelo usuário.`,
    'comentário dez quadrados');
  source = replaceRequired(source,
    `  return safe.length === 9 && safe.every((zone) => zone.enabled && zone.w >= 0.015 && zone.h >= 0.015);`,
    `  return safe.length === 10 && safe.every((zone) => zone.enabled && zone.w >= 0.015 && zone.h >= 0.015);`,
    'completude 10');
  return source;
}

function patchPremiumReading(input) {
  let source = input;
  if (source.includes(`zoneKeys: ['skills', 'specialSkill']`)) return source;
  return replaceRequired(source,
    `    description: 'Confirme apenas as habilidades que estiverem visíveis.',\n    zoneKeys: ['skills'],`,
    `    description: 'Confirme as habilidades visíveis e, quando existir, a habilidade especial da carta.',\n    zoneKeys: ['skills', 'specialSkill'],`,
    'etapa skills especial');
}

function patchDetailedReader(input) {
  let source = input;
  if (source.includes(`sourceTextWithRawPasses(readings, ['skills', 'specialSkill'])`)) return source;
  source = replaceRequired(source,
    `  const skillZoneText = sourceTextWithRawPasses(readings, ['skills']);`,
    `  const skillZoneText = sourceTextWithRawPasses(readings, ['skills', 'specialSkill']);`,
    'fonte specialSkill');
  source = replaceRequired(source,
    `.filter((reading) => reading.key === 'skills')`,
    `.filter((reading) => reading.key === 'skills' || reading.key === 'specialSkill')`,
    'raw passes specialSkill');
  return source;
}

function patchR108(input) {
  let source = input;
  if (source.includes('BM_R115_SPECIAL_SKILL_ACTIVATION')) return source;

  const helper = `
function specialSkillTextR115(result: AnalysisResult) {
  return normalize((result.parsed.specialSkills ?? []).join(' | '));
}

function applySpecialSkillSupportR115(result: AnalysisResult, rules: Partial<Record<AttributeKey, AttrRule>>) {
  const special = specialSkillTextR115(result);
  if (!special) return;
  const add = (pattern: RegExp, entries: Array<[AttributeKey, number, number?, number?, number?]>) => {
    if (!pattern.test(special)) return;
    for (const [key, weight, floor, peak, ceiling] of entries) bump(rules, key, weight, floor, peak, ceiling);
  };

  add(/curva descendente|blitz curler/, [
    ['curl',1.75,84,93,97], ['finishing',1.35,82,91,95], ['kickingPower',1.05,80,90,94],
    ['ballControl',.72,78,88,92], ['acceleration',.78,80,90,94], ['balance',.72,79,89,93]
  ]);
  add(/drible explosivo|drible de impulso/, [
    ['dribbling',1.6,83,93,97], ['tightPossession',1.35,82,92,96], ['acceleration',1.25,82,92,96],
    ['balance',1.05,80,90,94], ['ballControl',.9,81,91,95]
  ]);
  add(/pes magneticos/, [
    ['ballControl',1.65,84,94,97], ['tightPossession',1.45,83,93,97], ['balance',1.1,81,91,95], ['dribbling',.95,81,91,95]
  ]);
  add(/impulso ofensivo|sombra veloz/, [
    ['offensiveAwareness',1.4,84,94,97], ['acceleration',1.35,83,93,97], ['speed',1.05,81,91,95], ['balance',.65,78,88,92]
  ]);
  add(/desencadeador de ataques|passe decisivo|passador nato|passe visionario/, [
    ['lowPass',1.55,83,93,96], ['loftedPass',1.0,80,90,94], ['ballControl',1.05,81,91,95], ['tightPossession',.9,80,90,94]
  ]);
  add(/finalizacao fenomenal|chute rasteiro fulminante/, [
    ['finishing',1.7,85,95,98], ['offensiveAwareness',1.25,84,94,97], ['kickingPower',1.15,82,92,96], ['balance',.6,78,88,92]
  ]);
  add(/cabecada fulminante|fortaleza aerea/, [
    ['heading',1.55,84,93,97], ['jump',1.25,82,92,96], ['physicalContact',1.05,81,91,95], ['offensiveAwareness',.65,80,90,94]
  ]);
  add(/cruzamento cortante/, [
    ['loftedPass',1.55,83,93,96], ['curl',1.3,82,92,96], ['speed',.8,80,90,94], ['stamina',.72,80,89,93]
  ]);
  add(/fortaleza|garra/, [
    ['physicalContact',1.25,82,91,95], ['balance',.9,80,89,93], ['stamina',.9,81,90,94], ['aggression',.6,78,88,92]
  ]);
  add(/esticada de perna/, [
    ['tackling',1.5,84,93,96], ['defensiveAwareness',1.25,83,92,96], ['defensiveEngagement',1.15,82,92,95], ['speed',.65,78,88,92]
  ]);
  add(/comandante da defesa.*go|rugido do goleiro/, [
    ['goalkeeperAwareness',1.55,89,95,98], ['goalkeeperReflexes',1.35,89,95,98], ['goalkeeperReach',1.15,88,94,97], ['goalkeeperParrying',.8,84,91,95]
  ]);
}

function specialSkillActivationScoreR115(result: AnalysisResult, plan: TrainingPlan) {
  const special = specialSkillTextR115(result);
  if (!special) return 100;
  const p = (key: AttributeKey) => projectedAttribute(result, plan, key);
  const scores: number[] = [];
  const add = (pattern: RegExp, values: Array<[AttributeKey, number]>) => {
    if (pattern.test(special)) scores.push(weakLink(values.map(([key,target]) => [p(key),target] as [number,number])));
  };
  add(/curva descendente|blitz curler/, [['curl',93],['finishing',90],['kickingPower',88],['ballControl',86],['acceleration',88],['balance',87]]);
  add(/drible explosivo|drible de impulso/, [['dribbling',92],['tightPossession',91],['acceleration',92],['balance',90],['ballControl',90]]);
  add(/pes magneticos/, [['ballControl',93],['tightPossession',92],['balance',90],['dribbling',90]]);
  add(/impulso ofensivo|sombra veloz/, [['offensiveAwareness',92],['acceleration',92],['speed',90],['balance',87]]);
  add(/desencadeador de ataques|passe decisivo|passador nato|passe visionario/, [['lowPass',92],['ballControl',90],['tightPossession',89],['loftedPass',88]]);
  add(/finalizacao fenomenal|chute rasteiro fulminante/, [['finishing',94],['offensiveAwareness',93],['kickingPower',91],['balance',86]]);
  add(/cabecada fulminante|fortaleza aerea/, [['heading',92],['jump',91],['physicalContact',89],['offensiveAwareness',90]]);
  add(/cruzamento cortante/, [['loftedPass',92],['curl',91],['speed',89],['stamina',87]]);
  add(/fortaleza|garra/, [['physicalContact',90],['balance',88],['stamina',89]]);
  add(/esticada de perna/, [['tackling',92],['defensiveAwareness',91],['defensiveEngagement',91],['speed',86]]);
  add(/comandante da defesa.*go|rugido do goleiro/, [['goalkeeperAwareness',95],['goalkeeperReflexes',95],['goalkeeperReach',94]]);
  return scores.length ? scores.reduce((sum,value)=>sum+value,0)/scores.length : 92;
}

function actionGroupAffinityR115(result: AnalysisResult, key: TrainingKey) {
  const groups: Record<TrainingKey, AttributeKey[]> = {
    shooting:['offensiveAwareness','finishing','kickingPower','curl'],
    passing:['lowPass','loftedPass','ballControl','tightPossession'],
    dribbling:['ballControl','dribbling','tightPossession','balance'],
    dexterity:['offensiveAwareness','acceleration','balance'],
    lowerBodyStrength:['speed','kickingPower','stamina'],
    aerialStrength:['heading','jump','physicalContact'],
    defending:['defensiveAwareness','defensiveEngagement','tackling','aggression'],
    gk1:['goalkeeperAwareness','jump'], gk2:['goalkeeperParrying','goalkeeperReach'], gk3:['goalkeeperCatching','goalkeeperReflexes']
  };
  const values = groups[key].map((attr)=>attribute(result,attr)).filter((value)=>value>0);
  return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : 0;
}

function cardIdentityFitR115(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan) {
  const allowed = identity.naturalPosition === 'GK'
    ? (['gk1','gk2','gk3','aerialStrength'] as TrainingKey[])
    : (['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'] as TrainingKey[]);
  const signals = allowed.map((key) => {
    const base = actionGroupAffinityR115(result,key);
    let dna = 0;
    if (key==='dribbling') dna=Number(identity.dna.technical??0);
    else if (key==='passing') dna=Number(identity.dna.creation??0);
    else if (key==='shooting') dna=Number(identity.dna.finishing??0);
    else if (key==='dexterity'||key==='lowerBodyStrength') dna=Number(identity.dna.mobility??0);
    else if (key==='aerialStrength') dna=Number(identity.dna.aerial??0);
    else if (key==='defending') dna=Number(identity.dna.defending??0);
    else if (key.startsWith('gk')) dna=Number(identity.dna.goalkeeper??0);
    const signal=Math.max(2,Math.pow(Math.max(0,base-58)/42,1.35)*72+dna*.28);
    return {key,signal};
  });
  const targetTotal=signals.reduce((sum,item)=>sum+item.signal,0)||1;
  const budget=trainingPlanTotalCost(plan)||1;
  let distance=0;
  for (const item of signals) {
    const targetShare=item.signal/targetTotal;
    const actualShare=trainingTotalCost(Number(plan[item.key]??0))/budget;
    distance+=Math.abs(actualShare-targetShare);
  }
  const top=[...signals].sort((a,b)=>b.signal-a.signal).slice(0,2);
  const topShare=top.reduce((sum,item)=>sum+trainingTotalCost(Number(plan[item.key]??0)),0)/budget;
  return clamp(100-distance*72+(topShare>=.38?4:topShare>=.30?2:0));
}

// BM_R115_SPECIAL_SKILL_ACTIVATION: posição/estilo orientam, mas a assinatura individual da carta decide.
`;

  source = replaceRequired(source,
    `function buildRules(result: AnalysisResult, identity: CanonicalCardIdentityR60) {`,
    helper + `\nfunction buildRules(result: AnalysisResult, identity: CanonicalCardIdentityR60) {`,
    'helper assinatura');
  source = replaceRequired(source,
    `  applyGameplayTruthRulesR114(result, identity, rules);\n\n  for (const [key, current] of Object.entries(rules) as Array<[AttributeKey, AttrRule]>) {`,
    `  applyGameplayTruthRulesR114(result, identity, rules);\n  applySpecialSkillSupportR115(result, rules);\n\n  for (const [key, current] of Object.entries(rules) as Array<[AttributeKey, AttrRule]>) {`,
    'aplicar especial');
  source = replaceRequired(source,
    `) {\n  let score =\n    candidate.totalScore * .36 +\n    candidate.synergyScore * .27 +\n    candidate.responseScore * .25 +\n    candidate.impactScore * .07 +\n    candidate.floorCoverage * .03 +\n    candidate.staminaScore * .02;`,
    `) {\n  const specialActivation = specialSkillActivationScoreR115(result, candidate.training);\n  const identityFit = cardIdentityFitR115(result, identity, candidate.training);\n  let score =\n    candidate.responseScore * .27 +\n    candidate.synergyScore * .24 +\n    identityFit * .18 +\n    candidate.totalScore * .12 +\n    specialActivation * .11 +\n    candidate.impactScore * .05 +\n    candidate.floorCoverage * .02 +\n    candidate.staminaScore * .01;`,
    'ranking card signature');
  source = replaceRequired(source,
    `      \`Gameplay Truth r114: \${winner.totalScore}/100 • \${winner.profile} • sinergia \${winner.synergyScore}/100 • resposta \${winner.responseScore}/100 • busca direta entre \${generated.length} candidatas.\`,`,
    `      \`Card Signature r115: \${winner.totalScore}/100 • sinergia \${winner.synergyScore}/100 • resposta \${winner.responseScore}/100 • especial \${specialSkillActivationScoreR115(input,winner.training).toFixed(1)}/100 • identidade \${cardIdentityFitR115(input,identity,winner.training).toFixed(1)}/100.\`,\n      \`Gameplay Truth r114: busca direta entre \${generated.length} candidatas; posição e estilo não podem clonar a ficha.\`,`,
    'explicação r115');
  return source;
}

function patchSkills(input) {
  let source = input;
  if (source.includes('BM_R115_SPECIAL_COMPLEMENT')) return source;
  const helper = `
function specialSkillComplementR115(result: AnalysisResult, skill: string) {
  const special = norm((result.parsed.specialSkills ?? []).join(' | '));
  if (!special) return { score: 0, reasons: [] as string[] };
  let score=0; const reasons:string[]=[];
  const add=(condition:boolean,points:number,reason:string)=>{ if(condition){score+=points;reasons.push(reason);} };
  const shooting=/curva descendente|blitz curler|finalizacao fenomenal|chute rasteiro fulminante|cabecada fulminante/.test(special);
  const dribble=/drible explosivo|drible de impulso|pes magneticos/.test(special);
  const pass=/desencadeador de ataques|passe decisivo|passador nato|passe visionario|cruzamento cortante/.test(special);
  const defensive=/esticada de perna|fortaleza|garra|comandante da defesa|rugido do goleiro/.test(special);
  add(shooting&&['Controle com a sola','Toque duplo','Passe de primeira','Chute de primeira','Espírito guerreiro'].includes(skill),22,'Complementa a especial de finalização com domínio e execução frequente.');
  add(shooting&&SITUATIONAL_SHOOTING_R114.has(skill),-26,'A especial já cobre uma arma de chute; evita redundância situacional.');
  add(dribble&&['Passe de primeira','Passe em profundidade','Chute de primeira','Precisão à distância','Espírito guerreiro'].includes(skill),18,'Converte o drible especial em passe ou conclusão.');
  add(pass&&['Controle com a sola','Toque duplo','Passe de primeira','Espírito guerreiro'].includes(skill),18,'Dá suporte de domínio à especial de criação.');
  add(defensive&&['Interceptação','Bloqueador','Marcação individual','Passe de primeira','Espírito guerreiro'].includes(skill),16,'Amplifica a especial defensiva em ações repetidas.');
  return {score,reasons};
}
// BM_R115_SPECIAL_COMPLEMENT: Top 5 complementa a especial e evita cinco vagas da mesma função.
`;
  source = replaceRequired(source,
    `function candidateFor(result: AnalysisResult, position: PositionCode, skill: string, poolRank: number): Candidate {`,
    helper + `\nfunction candidateFor(result: AnalysisResult, position: PositionCode, skill: string, poolRank: number): Candidate {`,
    'helper top5');
  source = replaceRequired(source,
    `  const frequency = highFrequencyBonusR114(result, position, skill);\n  const categoryBase = BASE_CATEGORY[position][category];`,
    `  const frequency = highFrequencyBonusR114(result, position, skill);\n  const specialComplement = specialSkillComplementR115(result, skill);\n  const categoryBase = BASE_CATEGORY[position][category];`,
    'score especial top5');
  source = replaceRequired(source,
    `  const raw = 30 + categoryBase + style.score + attr.score + meta.score + role.score + frequency.score + Math.max(0, 12 - poolRank) + stable;`,
    `  const raw = 30 + categoryBase + style.score + attr.score + meta.score + role.score + frequency.score + specialComplement.score + Math.max(0, 12 - poolRank) + stable;`,
    'raw especial top5');
  source = replaceRequired(source,
    `  return { name: skill, category, score, tier, reasons: [...frequency.reasons, ...role.reasons, ...style.reasons, ...attr.reasons, ...meta.reasons].slice(0, 3) };`,
    `  return { name: skill, category, score, tier, reasons: [...specialComplement.reasons, ...frequency.reasons, ...role.reasons, ...style.reasons, ...attr.reasons, ...meta.reasons].slice(0, 3) };`,
    'motivos top5');
  return source;
}

function patchR80(input) {
  let source=input;
  if(source.includes('BM_R115_IMPETO_SPECIAL_SUPPORT')) return source;
  const helper=`
function specialImpetoSupportR115(result: AnalysisResult, item: ImpetoRecommendation) {
  const special=norm((result.parsed.specialSkills??[]).join(' | '));
  if(!special) return 0;
  const attrs=norm((item.attributes??[]).join(' | '));
  let bonus=0; const matches=(pattern:RegExp)=>pattern.test(attrs);
  if(/curva descendente|blitz curler/.test(special)&&matches(/finaliza|curva|forca do chute|acelera|equilibr|controle/)) bonus+=14;
  if(/drible explosivo|drible de impulso|pes magneticos/.test(special)&&matches(/drible|controle|acelera|equilibr|veloc/)) bonus+=13;
  if(/finalizacao fenomenal|chute rasteiro fulminante|cabecada fulminante/.test(special)&&matches(/finaliza|talento ofensivo|forca do chute|cabec|salto/)) bonus+=13;
  if(/passe decisivo|passador nato|passe visionario|desencadeador de ataques|cruzamento cortante/.test(special)&&matches(/passe|controle|curva/)) bonus+=12;
  if(/esticada de perna|fortaleza|garra/.test(special)&&matches(/defens|desarme|contato|resistencia|veloc/)) bonus+=12;
  if(/comandante da defesa|rugido do goleiro/.test(special)&&matches(/goleiro|reflex|alcance|firmeza|defesa/)) bonus+=14;
  return bonus;
}
function withSpecialImpetoSupportR115(result: AnalysisResult, item: ImpetoRecommendation, base: ResourceCandidate) {
  const bonus=specialImpetoSupportR115(result,item); if(!bonus) return base;
  const stability=clamp(base.stability+bonus*.55); const regretRisk=clamp(100-stability);
  return {...base,score:+clamp(base.score+bonus).toFixed(1),stability:+stability.toFixed(1),regretRisk:+regretRisk.toFixed(1),reasons:[\`Habilidade especial: +\${bonus} compatibilidade funcional.\`,...base.reasons]};
}
// BM_R115_IMPETO_SPECIAL_SUPPORT: Ímpeto resolve gargalo real da carta, não overall.
`;
  source=replaceRequired(source,
    `export function applyPermanentResources2027R80(result:AnalysisResult):WithR80{`,
    helper+`\nexport function applyPermanentResources2027R80(result:AnalysisResult):WithR80{`,
    'helper ímpeto');
  source=replaceRequired(source,
    `  const impetos=(result.recommendedImpetos??[]).filter(i=>i.tier!=='evitar').map(i=>impetoCandidate(i,attack,defence)).sort((x,y)=>y.score-x.score);`,
    `  const impetos=(result.recommendedImpetos??[]).filter(i=>i.tier!=='evitar').map(i=>withSpecialImpetoSupportR115(result,i,impetoCandidate(i,attack,defence))).sort((x,y)=>y.score-x.score);`,
    'ranking ímpeto especial');
  return source;
}

function patchPipeline(input) {
  let source=input;
  if(source.includes('BM_R115_PIPELINE_CARD_SIGNATURE')) return source;
  source=replaceRequired(source,
    `      'Gameplay Truth r114: prioridade absoluta para resposta, sinergia, DNA e ações de alta frequência; overall não participa da distribuição.',`,
    `      'Card Signature r115: cada carta usa atributos, DNA, físico, habilidades nativas/especiais e frequência de ações; posição/estilo não podem gerar receita clonada.',\n      'Gameplay Truth r114: prioridade absoluta para resposta, sinergia, DNA e ações de alta frequência; overall não participa da distribuição.',`,
    'explicação final');
  source=replaceRequired(source,
    `  // BM_R114_PIPELINE_TRUTH: a ficha final declara a política de gameplay real.`,
    `  // BM_R115_PIPELINE_CARD_SIGNATURE: identidade completa da carta é a política final.\n  // BM_R114_PIPELINE_TRUTH: a ficha final declara a política de gameplay real.`,
    'marcador pipeline');
  return source;
}

export function applyR115CardSignature(rootDirectory=process.cwd()) {
  const root=resolve(rootDirectory);
  const files={
    layout:resolve(root,'src/modules/card-reader/efhubLayoutGeometry.ts'),
    calibration:resolve(root,'src/modules/card-reader/efhubManualCalibration.ts'),
    premium:resolve(root,'src/lib/premiumReading.ts'),
    detailed:resolve(root,'src/modules/card-reader/detailedPrintReader.ts'),
    r108:resolve(root,'src/lib/performanceEngine2027V4080R108.ts'),
    skills:resolve(root,'src/lib/definitiveAdditionalSkillsV600R15.ts'),
    r80:resolve(root,'src/lib/permanentResources2027V4080R80.ts'),
    pipeline:resolve(root,'src/lib/cardIntelligencePipeline.ts')
  };
  for(const path of Object.values(files)) if(!existsSync(path)) throw new Error(`[r115] arquivo obrigatório ausente: ${path}`);
  const transforms={layout:patchLayout,calibration:patchManualCalibration,premium:patchPremiumReading,detailed:patchDetailedReader,r108:patchR108,skills:patchSkills,r80:patchR80,pipeline:patchPipeline};
  let changed=false;
  for(const [key,path] of Object.entries(files)) { const before=readFileSync(path,'utf8'); const after=transforms[key](before); if(after!==before){writeFileSync(path,after,'utf8');changed=true;} }
  console.log('v40.80 r115 aplicada: 10º quadrado especial + Card Signature + Top5/Ímpeto por carta.');
  return {changed};
}
