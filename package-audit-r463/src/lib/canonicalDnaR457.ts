import type { AttributeKey, ParsedCard, TrainingKey } from './analyzerDomain';
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
  cover_space:['defense','mobility','stamina'],build_out:['creation','defense'],cross_support:['creation','stamina'],set_piece:['creation','finishing'],
  gk_position:['goalkeeper'],gk_reflex:['goalkeeper'],gk_secure:['goalkeeper']
};
const GROUPS:Partial<Record<TrainingKey,CanonicalDnaDimensionR457[]>>={
  shooting:['finishing'],passing:['creation'],dribbling:['dribbling'],dexterity:['mobility'],
  lowerBodyStrength:['mobility','stamina','physical'],aerialStrength:['aerial','physical'],defending:['defense'],
  gk1:['goalkeeper'],gk2:['goalkeeper'],gk3:['goalkeeper']
};
function clamp(v:number,min=0,max=100){return Math.max(min,Math.min(max,v));}
function avg(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;}
function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
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
  const source=[CANONICAL_DNA_R457_VERSION,...Object.entries(dimensions).sort().map(([k,v])=>`${k}:${v}`),...(parsed.nativeSkills??[]).map(norm).sort(),...(parsed.specialSkills??[]).map(norm).sort()].join('|');
  return {version:CANONICAL_DNA_R457_VERSION,dimensions,groupAffinity,dominant,evidenceCoverage:total?Math.round(observed/total*1000)/10:0,fingerprint:`dna-r457-${fnv1a(source)}`,safeguards:{nameExcluded:true,overallExcluded:true,additionalSkillsExcluded:true,impetoExcluded:true,formationExcluded:true}};
}
