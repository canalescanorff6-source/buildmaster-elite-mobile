import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const TEST='tests/v40-80-r125-role-aware-card-specific-build-regression.ts';
const UI='src/components/UnifiedPerformanceV3920Panel.tsx';
const TEST_R108='tests/v40-80-r108-master-authority-runtime-regression.ts';
const TEST_R118='tests/v40-80-r118-single-final-authority-regression.mjs';
const TEST_R122='tests/v40-80-r122-result-ui-regression.mjs';
const TEST_R123='tests/v40-80-r123-result-ui-regression.mjs';
const VERSION_OLD="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r405-marginal-return-card-specific-authority' as const;";
const VERSION_NEW="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-pareto-no-wasted-point-authority' as const;";
const TEST_MARKER='BM_R406_PARETO_NO_WASTED_POINT_REGRESSION';

function replaceOnce(text,oldText,newText,label){
  if(text.includes(newText)) return text;
  const first=text.indexOf(oldText);
  if(first<0) throw new Error(`R406: bloco não encontrado: ${label}`);
  if(text.indexOf(oldText,first+oldText.length)>=0) throw new Error(`R406: bloco duplicado inesperado: ${label}`);
  return text.slice(0,first)+newText+text.slice(first+oldText.length);
}

export function applyParetoNoWastedPointR406(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory),sourcePath=resolve(root,SOURCE),testPath=resolve(root,TEST);
  if(!existsSync(sourcePath)||!existsSync(testPath)) throw new Error('R406: fonte/teste base ausente');
  let source=readFileSync(sourcePath,'utf8');
  const before=source;
  const revision=Number(source.match(/CLEAN_SLATE_2027_R119_VERSION = '40\.80-r(\d+)-/)?.[1]??0);
  if(revision<406){
    source=replaceOnce(source,VERSION_OLD,VERSION_NEW,'version');
    source=replaceOnce(source,
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
    let current=evaluateCompactPlanR148(chosen.levels,evaluationContext,false);
    for(let pass=0;pass<3;pass++){
      let upgraded=false;
      for(const state of byCost[budget]){
        if(state.cacheKey===chosen.cacheKey) continue;
        const e=evaluateCompactPlanR148(state.levels,evaluationContext,false);
        const a=[e.score,e.actionScore,e.online.rankedScore,e.online.pressureReliability,e.online.matchConsistency,e.online.staminaSustainability,e.online.identityPreservation];
        const b=[current.score,current.actionScore,current.online.rankedScore,current.online.pressureReliability,current.online.matchConsistency,current.online.staminaSustainability,current.online.identityPreservation];
        let noWorse=true,better=false;
        for(let k=0;k<a.length;k++){if(a[k]<b[k]-.02){noWorse=false;break;} if(a[k]>b[k]+.06) better=true;}
        if(noWorse&&better){chosen=state;current=e;upgraded=true;}
      }
      if(!upgraded) break;
    }
  }
  if(!chosen) for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  const chosenLevels=chosen?.levels??zeroLevels;`,'pareto-frontier');
    source=replaceOnce(source,'`Confiança da decisão r405: ${decisionConfidence.level}', '`Confiança da decisão r406: ${decisionConfidence.level}', 'confidence-label');
    source=replaceOnce(source,'`Motor final: Clean Slate r405 • ${usageContext.targetPosition}', '`Motor final: Clean Slate r406 • ${usageContext.targetPosition}', 'motor-label');
    for(const comment of [
`  // Um atributo secundário (ex.: equilíbrio numa finalização) não vale o mesmo que
  // Finalização/Consciência ofensiva. Isso remove a vantagem matemática artificial
  // de grupos que elevam vários atributos apenas periféricos de uma ação.\n`,
`  // A função escolhida manda no uso em campo. A posição natural continua apenas
  // como resíduo de DNA, para uma adaptação não transformar a carta em outro jogador.\n`,
`  // O estilo oficial atua apenas como desempate secundário do Top 5.
      // Ele nunca altera a ficha de progressão nem substitui o DNA natural.\n`,
`  // Se uma única família dominou tudo, troca apenas a última vaga por uma segunda
  // dimensão compatível; nunca força uma terceira família de baixo valor.\n`,
`      // Compatibilidade posicional baixa não pode ser mascarada por um atributo alto.\n`,
`    // Ficha e Top 5 têm requisitos de evidência diferentes. Uma leitura curta
    // pode ser insuficiente para distribuir pontos com segurança, mas ainda
    // conter posição, habilidades já possuídas e atributos suficientes para
    // ordenar habilidades adicionais oficiais sem recorrer a receita legada.\n`
    ]) source=source.replace(comment,'');
  }
  if(source!==before) writeFileSync(sourcePath,source,'utf8');

  let test=readFileSync(testPath,'utf8'); let testChanged=false;
  test=test.replace(/assert\.match\(build\.cleanSlate2027R119\.version,\/r404-card-dna-diversity-authority\/\);/g,"assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\\d+)-/)?.[1])>=404);");
  test=test.replace(/assert\.match\(build\.cleanSlate2027R119\.version,\/r405-marginal-return-card-specific-authority\/\);/g,"assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\\d+)-/)?.[1])>=405);");
  if(!test.includes(TEST_MARKER)){
    test+=`\n\n// ${TEST_MARKER}\nfor(const build of r404ArchetypeBuilds){\n  assert.ok(Number(build.cleanSlate2027R119.version.match(/-r(\\d+)-/)?.[1])>=406);\n  assert.equal(trainingPlanTotalCost(build.training),64);\n  assert.equal(build.cleanSlate2027R119.guards.exactBudget,true);\n}\nassert.ok(new Set(r404ArchetypeBuilds.map(build=>JSON.stringify(build.training))).size>=4,'R406: Pareto não pode recolapsar DNAs distintos em receita única.');\nconst r406Again:any=applyCleanSlatePerformance2027R119(resultFor({name:'R406 determinismo',attrs:r404SameStyleArchetypes[3],style:'Artilheiro',native:[]}));\nassert.deepEqual(r406Again.training,r404ArchetypeBuilds[3].training,'R406: frontier Pareto precisa ser determinística.');\nconsole.log('r406 aprovada: ficha final permanece exata, determinística, diversa por DNA e protegida contra candidato Pareto-dominado no frontier.');\n`;
    testChanged=true;
  }
  if(test!==readFileSync(testPath,'utf8')){writeFileSync(testPath,test,'utf8');testChanged=true;}

  const uiPath=resolve(root,UI);
  if(!existsSync(uiPath)) throw new Error('R406: UI final ausente');
  let ui=readFileSync(uiPath,'utf8'),uiBefore=ui;
  if(!ui.includes('const cleanSlateRevision=')) ui=replaceOnce(ui,
`  if (cleanSlate) {
`,
`  if (cleanSlate) {
    const cleanSlateRevision=cleanSlate.version.match(/-r(\\d+)-/)?.[1]??'119';
`,'ui-dynamic-version');
  ui=ui.replaceAll('Clean Slate R125','Clean Slate R{cleanSlateRevision}');
  if(ui!==uiBefore) writeFileSync(uiPath,ui,'utf8');

  const patchContract=(relative,oldText,newText,label)=>{
    const path=resolve(root,relative); if(!existsSync(path)) throw new Error(`R406: contrato ausente: ${relative}`);
    const prior=readFileSync(path,'utf8'); const next=replaceOnce(prior,oldText,newText,label);
    if(next!==prior) writeFileSync(path,next,'utf8');
    return next!==prior;
  };
  const r108Changed=patchContract(TEST_R108,
`assert.ok((result.recommendationExplanation as string[]).some((line:string) => /Motor final: Clean Slate r12[235]/.test(line)));`,
`const finalMotorLine=(result.recommendationExplanation as string[]).find((line:string)=>/Motor final: Clean Slate r\\d+/.test(line));
assert.ok(finalMotorLine,'A explicação precisa identificar o Motor final Clean Slate.');
assert.ok(Number(finalMotorLine.match(/r(\\d+)/)?.[1])>=119,'A autoridade Clean Slate não pode regredir abaixo da r119.');`,'r108-version-contract');
  const r118Changed=patchContract(TEST_R118,
`assert.match(ui, /(?:Motor final: Produção R126 \\/ Clean Slate R125|Motor final: Clean Slate r12[235])/);`,
`assert.match(ui,/cleanSlateRevision=cleanSlate\\.version\\.match/);
assert.ok((ui.match(/Clean Slate R\\{cleanSlateRevision\\}/g)??[]).length>=3,'A UI precisa derivar o rótulo Clean Slate da versão real do motor.');`,'r118-ui-version-contract');
  const r122Changed=patchContract(TEST_R122,
`assert.match(panel,/(?:Produção R126 • Clean Slate R125|Clean Slate • r12[235])/);`,
`assert.match(panel,/cleanSlateRevision=cleanSlate\\.version\\.match/);
assert.ok((panel.match(/Clean Slate R\\{cleanSlateRevision\\}/g)??[]).length>=3);`,'r122-ui-version-contract');
  const r123Changed=patchContract(TEST_R123,
`assert.match(panel,/(?:Produção R126 • Clean Slate R125|Clean Slate • r12[35])/);`,
`assert.match(panel,/cleanSlateRevision=cleanSlate\\.version\\.match/);
assert.ok((panel.match(/Clean Slate R\\{cleanSlateRevision\\}/g)??[]).length>=3);`,'r123-ui-version-contract');

  return {sourceChanged:source!==before,testChanged,uiChanged:ui!==uiBefore,contractsChanged:r108Changed||r118Changed||r122Changed||r123Changed,version:'40.80-r406-pareto-no-wasted-point-authority'};
}
