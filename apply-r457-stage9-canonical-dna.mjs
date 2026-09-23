import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const MODULE='src/lib/canonicalDnaR457.ts',TEST='tests/v40-80-r457-canonical-dna-regression.ts';
export const R457_STAGE9_VERSION='40.80-r457-canonical-dna-v1';
function f(root,p){const x=resolve(root,p);if(!existsSync(x))throw new Error(`R457-stage9: ausente ${p}`);return x;}
function read(root,p){return readFileSync(f(root,p),'utf8');}
function write(root,p,s){const x=resolve(root,p);mkdirSync(dirname(x),{recursive:true});writeFileSync(x,s,'utf8');}

const MODULE_SOURCE=`import type { AttributeKey, ParsedCard, TrainingKey } from './analyzerDomain';
import { SKILL_PROFILES } from '@/modules/analysis/analyzerCatalog';
import { canonicalSkillName } from './officialSkillIdentity';

export const CANONICAL_DNA_R457_VERSION='40.80-r457-canonical-dna-v1' as const;
export type CanonicalDnaDimensionR457='finishing'|'creation'|'dribbling'|'mobility'|'defense'|'physical'|'aerial'|'stamina'|'goalkeeper';
export type CanonicalDnaR457={
  version:typeof CANONICAL_DNA_R457_VERSION;
  dimensions:Record<CanonicalDnaDimensionR457,number>;
  groupAffinity:Partial<Record<TrainingKey,number>>;
  dominant:Array<{dimension:CanonicalDnaDimensionR457;score:number}>;
  evidenceCoverage:number;
  fingerprint:string;
  safeguards:{nameExcluded:true;overallExcluded:true;additionalSkillsExcluded:true;impetoExcluded:true;formationExcluded:true};
};

type ActionLike={id:string;frequency:number};
const DIMENSION_ATTRIBUTES:Record<CanonicalDnaDimensionR457,AttributeKey[]>={
  finishing:['offensiveAwareness','finishing','kickingPower','curl'],
  creation:['lowPass','loftedPass','ballControl','tightPossession'],
  dribbling:['ballControl','dribbling','tightPossession','balance'],
  mobility:['speed','acceleration','balance','offensiveAwareness'],
  defense:['defensiveAwareness','defensiveEngagement','tackling','aggression'],
  physical:['physicalContact','balance','jump','stamina'],
  aerial:['heading','jump','physicalContact'],
  stamina:['stamina','speed','defensiveEngagement'],
  goalkeeper:['goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach']
};
const ACTION_DIMENSIONS:Record<string,CanonicalDnaDimensionR457[]>={
  attack_space:['mobility','finishing'],finish_box:['finishing'],turn_finish:['finishing','dribbling'],long_finish:['finishing'],
  close_control:['dribbling'],carry:['dribbling','mobility'],short_creation:['creation'],through_creation:['creation'],
  hold_up:['physical'],aerial_finish:['aerial','finishing','physical'],aerial_defend:['aerial','defense','physical'],
  press_recover:['defense','stamina','mobility'],intercept:['defense'],defensive_duel:['defense','physical'],
  cover_space:['defense','mobility','stamina'],build_out:['creation','defense'],cross_support:['creation','stamina'],
  gk_position:['goalkeeper'],gk_reflex:['goalkeeper'],gk_secure:['goalkeeper']
};
const GROUPS:Partial<Record<TrainingKey,CanonicalDnaDimensionR457[]>>={
  shooting:['finishing'],passing:['creation'],dribbling:['dribbling'],dexterity:['mobility'],
  lowerBodyStrength:['mobility','stamina','physical'],aerialStrength:['aerial','physical'],defending:['defense'],
  gk1:['goalkeeper'],gk2:['goalkeeper'],gk3:['goalkeeper']
};
function clamp(v:number,min=0,max=100){return Math.max(min,Math.min(max,v));}
function avg(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;}
function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();}
function fnv1a(value:string){let out=2166136261;for(let i=0;i<value.length;i++){out^=value.charCodeAt(i);out=Math.imul(out,16777619);}return (out>>>0).toString(36);}

export function buildCanonicalDnaR457(parsed:ParsedCard,actions:ActionLike[]=[]):CanonicalDnaR457{
  const dimensions={} as Record<CanonicalDnaDimensionR457,number>;
  let observed=0,total=0;
  const actionEvidence=new Map<CanonicalDnaDimensionR457,number>();
  for(const action of actions)for(const dimension of ACTION_DIMENSIONS[action.id]??[]){
    actionEvidence.set(dimension,Math.max(actionEvidence.get(dimension)??0,clamp(Number(action.frequency)||0)));
  }
  const nativeSkillEvidence=new Map<CanonicalDnaDimensionR457,number>();
  for(const raw of [...(parsed.nativeSkills??[]),...(parsed.specialSkills??[])]){
    const canonical=canonicalSkillName(raw); if(!canonical)continue;
    const boosts=SKILL_PROFILES[canonical]?.boosts??{};
    const map:Record<string,CanonicalDnaDimensionR457>={finishing:'finishing',creation:'creation',dribbling:'dribbling',mobility:'mobility',defense:'defense',physical:'physical',aerial:'aerial',stamina:'stamina',goalkeeper:'goalkeeper'};
    for(const [key,value] of Object.entries(boosts)){const dimension=map[key];if(!dimension)continue;nativeSkillEvidence.set(dimension,Math.max(nativeSkillEvidence.get(dimension)??0,clamp(Number(value)*16)));}
  }
  for(const dimension of Object.keys(DIMENSION_ATTRIBUTES) as CanonicalDnaDimensionR457[]){
    const keys=DIMENSION_ATTRIBUTES[dimension],values:number[]=[];
    for(const key of keys){total++;const value=Number(parsed.attributes[key]);if(Number.isFinite(value)){observed++;values.push(clamp(value,1,99));}}
    const intrinsic=values.length?avg(values):50;
    const coverage=keys.length?values.length/keys.length:0;
    const skill=nativeSkillEvidence.get(dimension)??0;
    const action=actionEvidence.get(dimension)??0;
    dimensions[dimension]=Math.round(clamp(intrinsic*(.62+.18*coverage)+skill*.08+action*.12)*10)/10;
  }
  const groupAffinity:Partial<Record<TrainingKey,number>>={};
  for(const [group,dims] of Object.entries(GROUPS) as Array<[TrainingKey,CanonicalDnaDimensionR457[]]>){
    groupAffinity[group]=Math.round(avg(dims.map(d=>dimensions[d]))*10)/10;
  }
  const dominant=(Object.entries(dimensions) as Array<[CanonicalDnaDimensionR457,number]>).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([dimension,score])=>({dimension,score}));
  const source=[CANONICAL_DNA_R457_VERSION,...Object.entries(dimensions).sort().map(([k,v])=>\`\${k}:\${v}\`),...(parsed.nativeSkills??[]).map(norm).sort(),...(parsed.specialSkills??[]).map(norm).sort()].join('|');
  return {version:CANONICAL_DNA_R457_VERSION,dimensions,groupAffinity,dominant,evidenceCoverage:total?Math.round(observed/total*1000)/10:0,fingerprint:\`dna-r457-\${fnv1a(source)}\`,safeguards:{nameExcluded:true,overallExcluded:true,additionalSkillsExcluded:true,impetoExcluded:true,formationExcluded:true}};
}
`;

const TEST_SOURCE=`import assert from 'node:assert/strict';
import { buildCanonicalDnaR457 } from '../src/lib/canonicalDnaR457';
const actions:any=[{id:'short_creation',frequency:88},{id:'close_control',frequency:82},{id:'press_recover',frequency:58}];
const base:any={playerName:'A',overall:105,attributes:{ballControl:92,dribbling:90,tightPossession:91,balance:88,lowPass:93,loftedPass:89,stamina:87,speed:82,acceleration:84},nativeSkills:['Passe de primeira'],specialSkills:[],additionalSkills:['Toque duplo'],impetos:[{name:'Passe'}]};
const a=buildCanonicalDnaR457(base,actions);
const b=buildCanonicalDnaR457({...base,playerName:'B',overall:120,additionalSkills:['Interceptação'],impetos:[{name:'Chute'}]},actions);
assert.deepEqual(a.dimensions,b.dimensions,'Nome/GER/skill adicional/Ímpeto não podem reescrever DNA estrutural.');
assert.equal(a.fingerprint,b.fingerprint);
const nativeChanged=buildCanonicalDnaR457({...base,nativeSkills:['Interceptação']},actions);
assert.notEqual(a.fingerprint,nativeChanged.fingerprint,'Skill nativa pode alterar evidência estrutural.');
assert.ok(a.groupAffinity.passing!>0);
assert.ok(a.dominant.length===3);
console.log('R457 DNA aprovado: DNA canônico exclui estado mutável e entra por atributos/skills permanentes/ações.');
`;

export function applyR457Stage9(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  for(const p of ['src/lib/cleanSlatePerformance2027V4080R119.ts','package.json'])f(root,p);
  write(root,MODULE,MODULE_SOURCE);write(root,TEST,TEST_SOURCE);
  let s=read(root,'src/lib/cleanSlatePerformance2027V4080R119.ts'),before=s;
  if(!s.includes("buildCanonicalDnaR457")){
    s=s.replace("import { evaluateFinalImpetoDecisionR457, type FinalImpetoDecisionR457 } from './finalImpetoDecisionR457';\n",
                "import { evaluateFinalImpetoDecisionR457, type FinalImpetoDecisionR457 } from './finalImpetoDecisionR457';\nimport { buildCanonicalDnaR457, type CanonicalDnaR457 } from './canonicalDnaR457';\n");
  }
  if(!s.includes('canonicalDnaR457: CanonicalDnaR457;')){
    s=s.replace('  finalImpetoDecisionR457: FinalImpetoDecisionR457;\n','  finalImpetoDecisionR457: FinalImpetoDecisionR457;\n  canonicalDnaR457: CanonicalDnaR457;\n');
  }
  if(!s.includes('canonicalDnaR457:CanonicalDnaR457;')){
    s=s.replace('type EvaluationContextR143 = {\n','type EvaluationContextR143 = {\n  canonicalDnaR457:CanonicalDnaR457;\n');
  }
  if(!s.includes('dnaAffinity:number;')){
    s=s.replace('type EvaluationGroupR143 = {\n  naturalStrength:number;','type EvaluationGroupR143 = {\n  naturalStrength:number;\n  dnaAffinity:number;');
  }
  if(!s.includes('const canonicalDnaR457=buildCanonicalDnaR457(parsed,actionSeeds.map')){
    s=s.replace(
      "  const attributeBases:Partial<Record<AttributeKey,number>>={};",
      "  const canonicalDnaR457=buildCanonicalDnaR457(parsed,actionSeeds.map(item=>({id:item.action.id,frequency:item.frequency*100})));\n  const attributeBases:Partial<Record<AttributeKey,number>>={};"
    );
  }
  // Stage 1 may have either R406 identity blend or a later one. Replace the current identityFit expression structurally.
  s=s.replace(/    const identityFit=clamp\(naturalStrength\*[^;]+;/,
    "    const dnaAffinity=Number(canonicalDnaR457.groupAffinity[key]??naturalStrength);\n    const identityFit=clamp(naturalStrength*.55+evidenceFit*.25+dnaAffinity*.20);");
  s=s.replace('    groupProfiles.push({naturalStrength,impacted,identityFit,identityBonusByLevel,weakRepairPenaltyByLevel,excessPenaltyByLevel});',
              '    groupProfiles.push({naturalStrength,dnaAffinity,impacted,identityFit,identityBonusByLevel,weakRepairPenaltyByLevel,excessPenaltyByLevel});');
  s=s.replace('    actions,groupProfiles,attributeBases,stamina:compileAttribute(\'stamina\')',
              "    canonicalDnaR457,actions,groupProfiles,attributeBases,stamina:compileAttribute('stamina')");
  if(!s.includes('canonicalDnaR457:blockedCanonicalDnaR457')){
    s=s.replace('    const dna=dominantDna(actions);','    const dna=dominantDna(actions);\n    const blockedCanonicalDnaR457=buildCanonicalDnaR457(parsed,actions);');
    s=s.replace('pointRationale:[],dominantDna:dna,','pointRationale:[],canonicalDnaR457:blockedCanonicalDnaR457,dominantDna:dna,');
  }
  if(!s.includes('canonicalDnaR457:optimized.evaluationContext.canonicalDnaR457')){
    s=s.replace('confidence:round1(confidence),decisionConfidence,saturationProfile,competitiveLab,onlinePerformance,pointRationale,',
                'confidence:round1(confidence),decisionConfidence,saturationProfile,competitiveLab,onlinePerformance,pointRationale,canonicalDnaR457:optimized.evaluationContext.canonicalDnaR457,');
  }
  if(s!==before)write(root,'src/lib/cleanSlatePerformance2027V4080R119.ts',s);
  const pkgPath=f(root,'package.json'),pkg=JSON.parse(readFileSync(pkgPath,'utf8'));pkg.scripts??={};pkg.scripts['test:r457:dna']="node -r ./tests/_ts-require.cjs tests/v40-80-r457-canonical-dna-regression.ts";writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');
  return {changed:true,version:R457_STAGE9_VERSION};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(applyR457Stage9(process.cwd()),null,2));
