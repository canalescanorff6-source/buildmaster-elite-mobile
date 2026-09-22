import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const MODULE='src/lib/scoutingDecisionEvidenceR457.ts',TEST='tests/v40-80-r457-scouting-decision-evidence-regression.ts';
export const R457_STAGE10_VERSION='40.80-r457-scouting-decision-evidence-v1';
function f(root,p){const x=resolve(root,p);if(!existsSync(x))throw new Error(`R457-stage10: ausente ${p}`);return x;}
function read(root,p){return readFileSync(f(root,p),'utf8');}
function write(root,p,s){const x=resolve(root,p);mkdirSync(dirname(x),{recursive:true});writeFileSync(x,s,'utf8');}

const MODULE_SOURCE=`import type { AnalysisResult, PositionCode } from './analyzerDomain';
import type { GameplayScoutingRecordR454, GameplayScoutingRoleR454 } from '@/modules/scouting/gameplayScoutingR454';

export const SCOUTING_DECISION_EVIDENCE_R457_VERSION='40.80-r457-scouting-decision-evidence-v1' as const;
export type ScoutingDecisionEvidenceR457={
  version:typeof SCOUTING_DECISION_EVIDENCE_R457_VERSION;
  status:'APPLIED'|'IGNORED_PENDING'|'IGNORED_LOW_CONFIDENCE'|'NO_STRUCTURED_SIGNAL';
  confidenceWeight:number;
  actionMultipliers:Record<string,number>;
  adjustedActions:string[];
  sourceTypes:string[];
  reason:string;
  safeguards:{boundedInfluence:true;neverWritesTraining:true;neverInventsAttributes:true;gameVersionScoped:true};
};

const ROLE_ACTION_RULES:Array<[RegExp,string[]]>= [
  [/orquestr|armador|criador|cria[cç][aã]o|passe|construt|sa[ií]da/,['short_creation','through_creation','build_out']],
  [/infiltra|ruptura|espa[cç]o|profundidade|ataque sem bola/,['attack_space','finish_box']],
  [/drible|condu[cç][aã]o|carreg|controle curto/,['carry','close_control']],
  [/marca[cç][aã]o|intercept|desarme|conten[cç][aã]o|protetor|destruidor/,['intercept','defensive_duel','cover_space','press_recover']],
  [/piv[oô]|prote[cç][aã]o|apoio de costas/,['hold_up']],
  [/a[eé]reo|cabece|bola alta/,['aerial_finish','aerial_defend']],
  [/cruzamento|corredor|amplitude/,['cross_support']],
  [/goleiro|reflexo|shot.?stopper/,['gk_position','gk_reflex','gk_secure']]
];

function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();}
function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v));}
function sourceFactor(record:GameplayScoutingRecordR454){
  const weight:Record<string,number>={OFFICIAL:1,DATABASE:.92,USER_GAMEPLAY:.9,REVIEWER:.74,COMMUNITY:.56};
  const values=(record.sourceTypes??[]).map(x=>weight[x]??.45);
  return values.length?Math.max(...values):.5;
}
function confidenceBase(record:GameplayScoutingRecordR454){
  return record.confidence==='ALTA'?.06:record.confidence==='MEDIA'?.04:.015;
}
function roleSignals(role:GameplayScoutingRoleR454){
  const text=norm(\`\${role.label} \${role.function} \${role.reason}\`);
  const out=new Set<string>();
  for(const [pattern,actions] of ROLE_ACTION_RULES)if(pattern.test(text))actions.forEach(a=>out.add(a));
  return [...out];
}

export function buildScoutingDecisionEvidenceR457(result:AnalysisResult,position:PositionCode):ScoutingDecisionEvidenceR457{
  const record=(result as AnalysisResult&{gameplayScoutingR454?:GameplayScoutingRecordR454}).gameplayScoutingR454;
  const empty=(status:ScoutingDecisionEvidenceR457['status'],reason:string):ScoutingDecisionEvidenceR457=>({
    version:SCOUTING_DECISION_EVIDENCE_R457_VERSION,status,confidenceWeight:0,actionMultipliers:{},adjustedActions:[],sourceTypes:record?.sourceTypes??[],reason,
    safeguards:{boundedInfluence:true,neverWritesTraining:true,neverInventsAttributes:true,gameVersionScoped:true}
  });
  if(!record||record.status!=='READY')return empty('IGNORED_PENDING','Scouting ainda não está READY; nenhuma decisão da ficha foi alterada.');
  if(record.confidence==='BAIXA')return empty('IGNORED_LOW_CONFIDENCE','Scouting com confiança baixa fica apenas informativo.');
  const base=confidenceBase(record)*sourceFactor(record);
  const testedFactor=(record.testedPositions??[]).includes(position)?1:.78;
  const cap=clamp(base*testedFactor,.01,.06);
  const score=new Map<string,number>();
  const apply=(roles:GameplayScoutingRoleR454[],delta:number)=>{
    for(const role of roles.filter(r=>r.position===position))for(const action of roleSignals(role))score.set(action,(score.get(action)??0)+delta);
  };
  apply(record.bestRoles??[],1);
  apply(record.acceptableRoles??[],.45);
  apply(record.badRoles??[],-.85);
  if(!score.size)return empty('NO_STRUCTURED_SIGNAL','Registro READY existe, mas ainda não há função estruturada para a posição de uso.');
  const actionMultipliers:Record<string,number>={};
  for(const [action,value] of score)actionMultipliers[action]=Math.round(clamp(1+value*cap,.94,1.06)*10000)/10000;
  return {
    version:SCOUTING_DECISION_EVIDENCE_R457_VERSION,status:'APPLIED',confidenceWeight:Math.round(cap*10000)/10000,
    actionMultipliers,adjustedActions:Object.keys(actionMultipliers).sort(),sourceTypes:[...(record.sourceTypes??[])],
    reason:\`Scouting READY aplicado com influência máxima de ±6% na demanda funcional; peso efetivo \${Math.round(cap*1000)/10}%.\`,
    safeguards:{boundedInfluence:true,neverWritesTraining:true,neverInventsAttributes:true,gameVersionScoped:true}
  };
}
`;

const TEST_SOURCE=`import assert from 'node:assert/strict';
import { buildScoutingDecisionEvidenceR457 } from '../src/lib/scoutingDecisionEvidenceR457';
const result:any={gameplayScoutingR454:{status:'READY',confidence:'ALTA',sourceTypes:['OFFICIAL'],testedPositions:['CMF'],bestRoles:[{position:'CMF',label:'Orquestrador',function:'criação e passe curto',fit:'EXCELENTE',reason:'organiza saída'}],acceptableRoles:[],badRoles:[]}};
const e=buildScoutingDecisionEvidenceR457(result,'CMF');
assert.equal(e.status,'APPLIED');
assert.ok(e.actionMultipliers.short_creation>1);
assert.ok(e.actionMultipliers.short_creation<=1.06);
assert.equal(e.safeguards.neverWritesTraining,true);
const low=buildScoutingDecisionEvidenceR457({gameplayScoutingR454:{...result.gameplayScoutingR454,confidence:'BAIXA'}} as any,'CMF');
assert.equal(low.status,'IGNORED_LOW_CONFIDENCE');
assert.deepEqual(low.actionMultipliers,{});
console.log('R457 Scouting aprovado: scouting READY influencia somente frequência funcional, com peso limitado e auditável.');
`;

export function applyR457Stage10(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  for(const p of ['src/lib/productionAnalysisR128.ts','src/lib/cleanSlatePerformance2027V4080R119.ts','src/modules/scouting/gameplayScoutingRepositoryR454.ts','package.json'])f(root,p);
  write(root,MODULE,MODULE_SOURCE);write(root,TEST,TEST_SOURCE);

  let production=read(root,'src/lib/productionAnalysisR128.ts'),pb=production;
  if(!production.includes("readGameplayScoutingForResultR454")){
    production=production.replace(
      "import { isFinalBuildDiagnosticsCurrentR142, synchronizeFinalBuildDiagnosticsR142 } from '../modules/analysis/finalBuildDiagnosticsR142';\n",
      "import { isFinalBuildDiagnosticsCurrentR142, synchronizeFinalBuildDiagnosticsR142 } from '../modules/analysis/finalBuildDiagnosticsR142';\nimport { readGameplayScoutingForResultR454 } from '../modules/scouting/gameplayScoutingRepositoryR454';\n"
    );
  }
  // Stage 3B may already have wrapped the identified card in `functionScoped`.
  // Scouting must be attached to the exact input that will enter the single-writer pipeline.
  const oldStage3B="  // R457 Stages 2–3: edição e função de uso entram antes da Clean Slate/R126.\n  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(functionScoped));";
  const newStage3B="  // R457 Stage 10: scouting persistido entra como evidência read-only antes do único escritor final.\n  const withScouting = { ...functionScoped, gameplayScoutingR454: readGameplayScoutingForResultR454(functionScoped) } as AnalysisResult;\n  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(withScouting));";
  const oldStage2="  // R457 Stage 2: identidade da edição entra antes da Clean Slate/R126, nunca depois do selo.\n  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(identified));";
  const newStage2="  // R457 Stage 10: scouting persistido entra como evidência read-only antes do único escritor final.\n  const withScouting = { ...identified, gameplayScoutingR454: readGameplayScoutingForResultR454(identified) } as AnalysisResult;\n  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(withScouting));";
  if(production.includes(oldStage3B))production=production.replace(oldStage3B,newStage3B);
  else if(production.includes(oldStage2))production=production.replace(oldStage2,newStage2);
  else if(!production.includes('const withScouting ='))throw new Error('R457-stage10: execute Stages 2–3 antes.');
  if(production!==pb)write(root,'src/lib/productionAnalysisR128.ts',production);

  let clean=read(root,'src/lib/cleanSlatePerformance2027V4080R119.ts'),before=clean;
  if(!clean.includes("buildScoutingDecisionEvidenceR457")){
    clean=clean.replace(
      "import { buildCanonicalDnaR457, type CanonicalDnaR457 } from './canonicalDnaR457';\n",
      "import { buildCanonicalDnaR457, type CanonicalDnaR457 } from './canonicalDnaR457';\nimport { buildScoutingDecisionEvidenceR457, type ScoutingDecisionEvidenceR457 } from './scoutingDecisionEvidenceR457';\n"
    );
  }
  if(!clean.includes('scoutingEvidenceR457:ScoutingDecisionEvidenceR457;')){
    clean=clean.replace('  neutralRoleMode: boolean;\n};','  neutralRoleMode: boolean;\n  scoutingEvidenceR457:ScoutingDecisionEvidenceR457;\n};');
  }
  if(!clean.includes('const scoutingEvidenceR457=buildScoutingDecisionEvidenceR457(input,targetPosition);')){
    clean=clean.replace(
      '  const neutralRoleMode=usagePositionChanged && (',
      '  const scoutingEvidenceR457=buildScoutingDecisionEvidenceR457(input,targetPosition);\n  const neutralRoleMode=usagePositionChanged && ('
    );
    clean=clean.replace(
      'return {targetPosition,naturalPosition:parsed.mainPosition,usagePositionChanged,offensiveStyle,defensiveStyle,offensiveActivation,defensiveActivation,offensiveStyleWeight,defensiveStyleWeight,defensiveStyleConfirmed,neutralRoleMode};',
      'return {targetPosition,naturalPosition:parsed.mainPosition,usagePositionChanged,offensiveStyle,defensiveStyle,offensiveActivation,defensiveActivation,offensiveStyleWeight,defensiveStyleWeight,defensiveStyleConfirmed,neutralRoleMode,scoutingEvidenceR457};'
    );
  }
  if(!clean.includes('context.scoutingEvidenceR457.actionMultipliers[action.id]')){
    clean=clean.replace(
      "  if(action.id==='cover_space' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle)) && context.defensiveStyleWeight>.5) frequency*=1.06;\n  return clamp(frequency,0,1);",
      "  if(action.id==='cover_space' && /pressao no ataque/.test(norm(parsed.defensivePlaystyle)) && context.defensiveStyleWeight>.5) frequency*=1.06;\n  frequency*=Number(context.scoutingEvidenceR457.actionMultipliers[action.id]??1);\n  return clamp(frequency,0,1);"
    );
  }
  if(!clean.includes('Scouting R457: ${usageContext.scoutingEvidenceR457.status}')){
    const anchor='      playstyleContext.note,';
    clean=clean.replace(anchor,anchor+"\n      `Scouting R457: ${usageContext.scoutingEvidenceR457.status}. ${usageContext.scoutingEvidenceR457.reason}`,");
  }
  if(clean!==before)write(root,'src/lib/cleanSlatePerformance2027V4080R119.ts',clean);

  const pkgPath=f(root,'package.json'),pkg=JSON.parse(readFileSync(pkgPath,'utf8'));pkg.scripts??={};pkg.scripts['test:r457:scouting']="node -r ./tests/_ts-require.cjs tests/v40-80-r457-scouting-decision-evidence-regression.ts";writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');
  return {changed:true,version:R457_STAGE10_VERSION};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(applyR457Stage10(process.cwd()),null,2));
