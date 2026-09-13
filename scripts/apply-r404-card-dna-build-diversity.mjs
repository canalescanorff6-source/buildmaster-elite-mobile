import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const TEST='tests/v40-80-r125-role-aware-card-specific-build-regression.ts';
const VERSION_OLD="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r125-role-aware-card-specific-performance-authority' as const;";
const VERSION_NEW="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r404-card-dna-diversity-authority' as const;";
const TEST_MARKER='BM_R404_CARD_DNA_DIVERSITY_REGRESSION';

function replaceOnce(text,oldText,newText,label){
  if(text.includes(newText)) return text;
  const first=text.indexOf(oldText);
  if(first<0) throw new Error(`R404: bloco não encontrado: ${label}`);
  if(text.indexOf(oldText,first+oldText.length)>=0) throw new Error(`R404: bloco duplicado inesperado: ${label}`);
  return text.slice(0,first)+newText+text.slice(first+oldText.length);
}

export function applyCardDnaBuildDiversityR404(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  const sourcePath=resolve(root,SOURCE);
  const testPath=resolve(root,TEST);
  if(!existsSync(sourcePath)) throw new Error(`R404: fonte ausente: ${SOURCE}`);
  if(!existsSync(testPath)) throw new Error(`R404: regressão base ausente: ${TEST}`);

  let source=readFileSync(sourcePath,'utf8');
  const before=source;
  const revision=Number(source.match(/CLEAN_SLATE_2027_R119_VERSION = '40\.80-r(\d+)-/)?.[1]??0);

  if(revision<405){
  source=replaceOnce(source,VERSION_OLD,VERSION_NEW,'version');

  source=replaceOnce(source,
`function actionQuality(attrs:Attributes, action:ActionDef) {
  const weighted=action.attrs.map(key=>({value:attr(attrs,key),weight:Math.max(.05,Number(action.weights?.[key]??1))}));
  if(!weighted.length) return 0;
  const totalWeight=weighted.reduce((sum,item)=>sum+item.weight,0);
  const mean=weighted.reduce((sum,item)=>sum+item.value*item.weight,0)/Math.max(.01,totalWeight);
  const primary=weighted.filter(item=>item.weight>=.95);
  const bottleneck=Math.min(...(primary.length?primary:weighted).map(item=>item.value));
  // Um atributo secundário (ex.: equilíbrio numa finalização) não vale o mesmo que
  // Finalização/Consciência ofensiva. Isso remove a vantagem matemática artificial
  // de grupos que elevam vários atributos apenas periféricos de uma ação.
  return mean*.88+bottleneck*.12;
}`,
`function actionQuality(attrs:Attributes, action:ActionDef) {
  const weighted=action.attrs.filter(key=>Number.isFinite(Number(attrs[key]))).map(key=>({value:attr(attrs,key),weight:Math.max(.05,Number(action.weights?.[key]??1))}));
  if(!weighted.length) return 0;
  const totalWeight=weighted.reduce((sum,item)=>sum+item.weight,0);
  const mean=weighted.reduce((sum,item)=>sum+item.value*item.weight,0)/Math.max(.01,totalWeight);
  const primary=weighted.filter(item=>item.weight>=.95);
  const bottleneck=Math.min(...(primary.length?primary:weighted).map(item=>item.value));
  const coverage=weighted.length/action.attrs.length;
  return (mean*.84+bottleneck*.16)*(.70+coverage*.30);
}`,'action-quality');

  source=replaceOnce(source,
`  const natural=actionQuality(parsed.attributes,action);
  const capability=Math.pow(clamp((natural-54)/45,0,1),1.3);
  const skillProof=skillActionEvidence(action,parsed);
  const styleProof=styleActionEvidence(action,context);
  // A posição de uso define quais ações aparecem; atributos e habilidades definem
  // o quão natural é executá-las. Estilo inativo/cinza não impõe receita.
  const roleFloor=context.usagePositionChanged
    ? targetDuty*.27 + naturalDuty*.025
    : targetDuty*.14;
  let frequency=roleFloor+relevance*(.41*capability+.34*skillProof+.08*styleProof);`,
`  const natural=actionQuality(parsed.attributes,action);
  const capability=Math.pow(clamp((natural-48)/51,0,1),1.18);
  const skillProof=skillActionEvidence(action,parsed);
  const styleProof=styleActionEvidence(action,context);
  const roleFloor=context.usagePositionChanged
    ? targetDuty*.16 + naturalDuty*.02
    : targetDuty*.07;
  let frequency=roleFloor+relevance*(.52*capability+.30*skillProof+.06*styleProof);`,'action-frequency');

  source=replaceOnce(source,
`function groupNaturalStrength(parsed:ParsedCard,key:TrainingKey) {
  return average(TRAINING_ATTRIBUTES[key].map(a=>attr(parsed.attributes,a)));
}`,
`function groupNaturalStrength(parsed:ParsedCard,key:TrainingKey) {
  const all=TRAINING_ATTRIBUTES[key];
  const values=all.map(a=>Number(parsed.attributes[a])).filter(Number.isFinite).map(v=>clamp(v,1,99));
  if(!values.length) return 0;
  return clamp((average(values)*.72+Math.max(...values)*.20+Math.min(...values)*.08)*(.75+values.length/all.length*.25));
}`,'group-natural-strength');

  source=replaceOnce(source,
`  const compileAttribute=(key:AttributeKey):CompiledAttributeR146=>{
    const group=ATTRIBUTE_TRAINING_GROUP_R144[key];
    return {base:attributeBases[key]??50,groupIndex:group===undefined?-1:TRAINING_KEY_INDEX_R147[group]};
  };`,
`  const compileAttribute=(key:AttributeKey):CompiledAttributeR146=>{
    const group=ATTRIBUTE_TRAINING_GROUP_R144[key], observed=Number.isFinite(Number(parsed.attributes[key]));
    return {base:attributeBases[key]??50,groupIndex:observed&&group!==undefined?TRAINING_KEY_INDEX_R147[group]:-1};
  };`,'compiled-evidence');

  source=replaceOnce(source,
`    const identityFit=clamp(naturalStrength*.58+evidenceFit*.42);
    const identityBonusByLevel=Array.from({length:17},(_,level)=>level?level*Math.pow(naturalStrength/100,1.8)*Math.min(1.25,impacted*.22)*.12:0);`,
`    const identityFit=clamp(naturalStrength*.70+evidenceFit*.30);
    const identityBonusByLevel=Array.from({length:17},(_,level)=>level?level*Math.pow(naturalStrength/100,1.8)*Math.min(1.25,impacted*.22)*.16:0);`,'identity-weight');

  source=replaceOnce(source,'`Confiança da decisão r125: ${decisionConfidence.level}', '`Confiança da decisão r404: ${decisionConfidence.level}', 'confidence-label');
  source=replaceOnce(source,'`Motor final: Clean Slate r125 • ${usageContext.targetPosition}', '`Motor final: Clean Slate r404 • ${usageContext.targetPosition}', 'motor-label');
  }

  if(source!==before) writeFileSync(sourcePath,source,'utf8');

  let test=readFileSync(testPath,'utf8');
  let testChanged=false;
  if(!test.includes(TEST_MARKER)){
    test += `

// ${TEST_MARKER}
const r404SameStyleArchetypes:any[]=[
  {...cfAttrs,ballControl:96,dribbling:96,tightPossession:95,balance:94,heading:63,jump:65,physicalContact:68,speed:83,acceleration:86,finishing:86},
  {...cfAttrs,offensiveAwareness:96,speed:96,acceleration:97,balance:84,ballControl:84,dribbling:80,tightPossession:79,heading:66,jump:70,physicalContact:72},
  {...cfAttrs,offensiveAwareness:95,finishing:97,kickingPower:96,curl:91,ballControl:84,dribbling:78,tightPossession:77,speed:82,acceleration:83,heading:70},
  {...cfAttrs,heading:97,jump:96,physicalContact:97,finishing:91,kickingPower:91,balance:86,ballControl:77,dribbling:70,tightPossession:69,speed:78,acceleration:76},
  {...cfAttrs,lowPass:94,loftedPass:91,ballControl:94,tightPossession:93,dribbling:89,balance:90,finishing:82,kickingPower:82,speed:80,acceleration:82,heading:65}
];
const r404ArchetypeBuilds=r404SameStyleArchetypes.map((attrs,index)=>applyCleanSlatePerformance2027R119(resultFor({name:\`R404 DNA \${index}\`,attrs,style:'Artilheiro',native:[]})));
for(const build of r404ArchetypeBuilds){
  assert.match(build.cleanSlate2027R119.version,/r404-card-dna-diversity-authority/);
  assert.equal(trainingPlanTotalCost(build.training),64);
}
const r404Signatures=new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training)));
assert.ok(r404Signatures.size>=4,\`R404: cinco CFs de mesmo papel, estilo e orçamento devem preservar diversidade real de DNA; assinaturas=\${r404Signatures.size}.\`);

const r404NameA:any=applyCleanSlatePerformance2027R119(resultFor({name:'Nome A não decide',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
const r404NameB:any=applyCleanSlatePerformance2027R119(resultFor({name:'Nome B não decide',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));
assert.deepEqual(r404NameA.training,r404NameB.training,'R404: nome não pode ser usado para fabricar diversidade.');

const r404Partial:any=applyCleanSlatePerformance2027R119(resultFor({name:'R404 leitura parcial',style:'Artilheiro',native:[],attrs:{
  offensiveAwareness:93,ballControl:91,dribbling:90,tightPossession:89,finishing:92,
  speed:91,acceleration:92,kickingPower:90,balance:88,stamina:84
}}));
assert.equal(r404Partial.cleanSlate2027R119.status,'READY');
assert.equal(r404Partial.training.passing,0,'R404: passe totalmente não observado não pode receber pontos por fallback artificial.');
assert.equal(r404Partial.training.aerialStrength,0,'R404: bola aérea totalmente não observada não pode receber pontos por fallback artificial.');
assert.equal(trainingPlanTotalCost(r404Partial.training),64);

console.log('r404 aprovada: diversidade vem do DNA observado; posição/receita não domina, nome não interfere e atributo ausente não fabrica retorno.');
`;
    writeFileSync(testPath,test,'utf8');
    testChanged=true;
  }
  return {sourceChanged:source!==before,testChanged,version:'40.80-r404-card-dna-diversity-authority'};
}
