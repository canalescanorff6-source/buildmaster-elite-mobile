import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const TEST='tests/v40-80-r125-role-aware-card-specific-build-regression.ts';
const VERSION_OLD="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r404-card-dna-diversity-authority' as const;";
const VERSION_NEW="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r405-marginal-return-card-specific-authority' as const;";
const TEST_MARKER='BM_R405_MARGINAL_RETURN_DIVERSITY_REGRESSION';

function replaceOnce(text,oldText,newText,label){
  if(text.includes(newText)) return text;
  const first=text.indexOf(oldText);
  if(first<0) throw new Error(`R405: bloco não encontrado: ${label}`);
  if(text.indexOf(oldText,first+oldText.length)>=0) throw new Error(`R405: bloco duplicado inesperado: ${label}`);
  return text.slice(0,first)+newText+text.slice(first+oldText.length);
}

export function applyMarginalReturnDiversityR405(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory),sourcePath=resolve(root,SOURCE),testPath=resolve(root,TEST);
  if(!existsSync(sourcePath)||!existsSync(testPath)) throw new Error('R405: fonte/teste base ausente');
  let source=readFileSync(sourcePath,'utf8');
  const before=source;
  const revision=Number(source.match(/CLEAN_SLATE_2027_R119_VERSION = '40\.80-r(\d+)-/)?.[1]??0);
  if(revision<406){
  source=replaceOnce(source,VERSION_OLD,VERSION_NEW,'version');
  source=replaceOnce(source,
`  let chosen=byCost[budget][0];
  if(!chosen) {
    for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  }
  const chosenLevels=chosen?.levels??zeroLevels;`,
`  let chosen=byCost[budget][0];
  if(chosen){
    const best=chosen.score; let bestFinal=-Infinity;
    for(const state of byCost[budget].slice(0,12)){
      if(best-state.score>.18) break;
      let m=0,w=0,id=0,ls=0,neg=0;
      for(let i=0;i<TRAINING_KEYS.length;i++){
        const level=state.levels[i]??0; if(!level) continue;
        const prev=state.levels.slice(); prev[i]=level-1;
        const fit=(evaluationContext.groupProfiles[i]?.identityFit??0)/100, weight=.55+.45*fit;
        const mr=(state.score-evaluateCompactKernelR149(prev,evaluationContext,'SCORE_ONLY'))/Math.max(1,trainingLevelCost(level));
        m+=mr*weight; w+=weight; id+=fit*level; ls+=level; if(mr<=0) neg++;
      }
      const final=state.score+clamp((w?m/w:0)*.5+((ls?id/ls:.5)-.5)*.12-neg*.016,-.12,.12);
      if(final>bestFinal+1e-12){ chosen=state; bestFinal=final; }
    }
  }
  if(!chosen) for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  const chosenLevels=chosen?.levels??zeroLevels;`,'finalist-selector');
  source=replaceOnce(source,'`Confiança da decisão r404: ${decisionConfidence.level}', '`Confiança da decisão r405: ${decisionConfidence.level}', 'confidence-label');
  source=replaceOnce(source,'`Motor final: Clean Slate r404 • ${usageContext.targetPosition}', '`Motor final: Clean Slate r405 • ${usageContext.targetPosition}', 'motor-label');
  // Recupera margem R184 removendo apenas comentários explicativos sem efeito de runtime.
  for(const comment of [
`  // Estilo é evidência comportamental, nunca receita. A ação ainda precisa provar
  // relevância de posição, capacidade da carta e/ou habilidades reais.\n`,
`  // v6.0: a Konami reduziu parte da correção automática de linhas e passou a
  // diferenciar mais a reação defensiva por Talento/Dedicação defensiva e
  // pela habilidade Interceptação. Isso é contexto de frequência, não receita.\n`,
`  // Diversidade suave: evita cinco habilidades idênticas em função, mas não empurra
  // uma habilidade situacional só para cumprir cota artificial de categoria.\n`
  ]) source=source.replace(comment,'');
  }
  if(source!==before) writeFileSync(sourcePath,source,'utf8');

  let test=readFileSync(testPath,'utf8'); let testChanged=false;
  if(!test.includes(TEST_MARKER)){
    test+=`\n\n// ${TEST_MARKER}\nfor(const build of r404ArchetypeBuilds){\n  assert.match(build.cleanSlate2027R119.version,/r405-marginal-return-card-specific-authority/);\n  assert.equal(trainingPlanTotalCost(build.training),64);\n  assert.ok(build.cleanSlate2027R119.pointRationale.every((x:any)=>Number.isFinite(x.returnPerCost)),'R405: retorno marginal final deve ser auditável.');\n}\nassert.ok(new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training))).size>=4,'R405: desempate marginal não pode recolapsar os cinco DNAs em uma receita.');\nconst r405Repeat:any=applyCleanSlatePerformance2027R119(resultFor({name:'R405 repetição determinística',attrs:r404SameStyleArchetypes[0],style:'Artilheiro',native:[]}));\nassert.deepEqual(r405Repeat.training,r404ArchetypeBuilds[0].training,'R405: mesma evidência deve produzir a mesma ficha sem aleatoriedade.');\nconsole.log('r405 aprovada: finalistas near-tie usam retorno marginal + DNA; desempenho continua primeiro e a ficha permanece determinística.');\n`;
    writeFileSync(testPath,test,'utf8'); testChanged=true;
  }
  return {sourceChanged:source!==before,testChanged,version:'40.80-r405-marginal-return-card-specific-authority'};
}
