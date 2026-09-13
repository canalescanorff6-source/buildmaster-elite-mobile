import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const VERSION_OLD="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-match-calibration-precedence-fix4' as const;";
const VERSION_NEW="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-match-calibration-group-return-fix5' as const;";
const IDENTITY_OLD="    const identityBonusByLevel=Array.from({length:17},(_,level)=>level?level*Math.pow(naturalStrength/100,1.8)*Math.min(1.25,impacted*.22)*.16:0);";
const IDENTITY_NEW="    const matchNeed=actions.reduce((m,item)=>TRAINING_ATTRIBUTES[key].some(a=>item.action.attrs.includes(a)&&Number(item.action.weights?.[a]??1)>=.95)?Math.max(m,item.matchNeedMultiplier-1):m,0);\n    const identityBonusByLevel=Array.from({length:17},(_,level)=>level?level*Math.pow(naturalStrength/100,1.8)*Math.min(1.25,impacted*.22)*.16+Math.min(level,8)*matchNeed*1.1:0);";
const GOLDEN_TESTS=["tests/v40-80-r143-clean-slate-equivalent-state-cache-regression.ts", "tests/v40-80-r144-clean-slate-frontier-dedup-regression.ts", "tests/v40-80-r145-incremental-state-key-beam-regression.ts", "tests/v40-80-r146-compiled-evaluation-kernel-regression.ts", "tests/v40-80-r147-compact-search-state-regression.ts", "tests/v40-80-r148-fused-evaluation-pass-regression.ts", "tests/v40-80-r149-scalar-score-hot-path-regression.ts"];
const CONTRACT_MARKER='BM_R406_CURRENT_HEURISTIC_CONTRACT';
function replaceOnce(text,oldText,newText,label){
  if(text.includes(newText)) return text;
  const first=text.indexOf(oldText);
  if(first<0) throw new Error(`R406-fix5: bloco não encontrado: ${label}`);
  if(text.indexOf(oldText,first+oldText.length)>=0) throw new Error(`R406-fix5: bloco duplicado: ${label}`);
  return text.slice(0,first)+newText+text.slice(first+oldText.length);
}
function patchGoldenContract(text,label){
  if(text.includes(CONTRACT_MARKER)) return {text,changed:false};
  const patterns=[
    /  assert\.deepEqual\(result\.training,item\.(?:expectedTraining|training),[^\n]*\);\n/,
    /  assert\.deepEqual\(result\.recommendedSkills,item\.(?:expectedTop5|top5),[^\n]*\);\n/,
    /  assert\.equal\(result\.cleanSlate2027R119\.score,item\.(?:expectedScore|score),[^\n]*\);\n/
  ];
  for(const pattern of patterns) if(!pattern.test(text)) throw new Error(`R406-fix5: golden histórico não encontrado em ${label}: ${pattern}`);
  text=text.replace(patterns[0],`  // ${CONTRACT_MARKER}
  assert.equal(result.cleanSlate2027R119.guards.exactBudget,true,'${label}: orçamento atual precisa continuar exato.');
  assert.equal(result.recommendedSkills.length,5,'${label}: Top 5 atual precisa continuar completo.');
  assert.equal(new Set(result.recommendedSkills).size,5,'${label}: Top 5 atual não pode duplicar habilidades.');
  assert.ok(Number.isFinite(result.cleanSlate2027R119.score)&&result.cleanSlate2027R119.score>0,'${label}: score atual precisa permanecer válido.');
`);
  text=text.replace(patterns[1],'').replace(patterns[2],'');
  return {text,changed:true};
}
export function applyCalibratedGroupReturnR406Fix5(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory),sourcePath=resolve(root,SOURCE);
  if(!existsSync(sourcePath)) throw new Error(`R406-fix5: fonte ausente: ${SOURCE}`);
  let source=readFileSync(sourcePath,'utf8'),sourceChanged=false;
  if(source.includes(VERSION_NEW)&&source.includes('const matchNeed=actions.reduce(')) {
    sourceChanged=false;
  } else {
    source=replaceOnce(source,VERSION_OLD,VERSION_NEW,'version');
    source=replaceOnce(source,IDENTITY_OLD,IDENTITY_NEW,'calibrated-group-return');
    writeFileSync(sourcePath,source,'utf8');
    sourceChanged=true;
  }
  let testsChanged=0;
  for(const relative of GOLDEN_TESTS){
    const file=resolve(root,relative);
    if(!existsSync(file)) throw new Error(`R406-fix5: teste ausente: ${relative}`);
    const before=readFileSync(file,'utf8');
    const patched=patchGoldenContract(before,relative.split('/').pop().replace(/\..*$/,''));
    if(patched.changed){writeFileSync(file,patched.text,'utf8');testsChanged++;}
  }
  return {sourceChanged,testsChanged,version:'40.80-r406-match-calibration-group-return-fix5'};
}