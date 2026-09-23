import type { ParsedCard, PositionCode } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES, SKILL_PROFILES } from '@/modules/analysis/analyzerCatalog';
import { officialAdditionalSkillPoolForPosition, isRoleCompatibleAdditionalSkill, SKILL_COMPLEMENTS_R457 } from './skillIntelligenceV31';
import { canonicalizeSkillList, isOfficialAdditionalSkillIdentity, skillIdentityKey } from './officialSkillIdentity';
import { skillActionSupportDetailR459 } from './gameplayImpactR458';

export const FINAL_ADDITIONAL_SKILL_SET_R457_VERSION = '40.80-r459-final-additional-skill-set-v3-action-aligned' as const;

export type SkillActionInputR457 = {
  id: string;
  label: string;
  frequency: number;
  contribution: number;
  projectedScore?: number;
};

export type FinalAdditionalSkillSlotDecisionR457 = {
  slot: number;
  action: 'KEEP' | 'ADD' | 'REPLACE';
  skill: string;
  replaces: string | null;
  functionalScore: number;
  reason: string;
};

export type FinalAdditionalSkillSetR457 = {
  version: typeof FINAL_ADDITIONAL_SKILL_SET_R457_VERSION;
  status: 'OPTIMAL_SET_PROVEN' | 'PARTIAL_POOL';
  position: PositionCode;
  currentSkills: string[];
  finalSkills: string[];
  additions: string[];
  removals: string[];
  decisions: FinalAdditionalSkillSlotDecisionR457[];
  individualScores: Array<{name:string;score:number;supportedActions:string[]}>;
  currentSetScore: number;
  finalSetScore: number;
  estimatedSetGain: number;
  complementPairs: Array<[string,string]>;
  candidatePoolSize: number;
  combinationsTested: number;
  exactFive: boolean;
  officialOnly: boolean;
  roleCompatible: boolean;
  nativeSpecialDuplicatesBlocked: boolean;
  deterministic: true;
  modelNote: string;
};

type Dimension =
  | 'finishing' | 'creation' | 'dribbling' | 'mobility' | 'pressure'
  | 'defense' | 'physical' | 'aerial' | 'stamina' | 'goalkeeper';

const DIMENSION_ACTIONS: Record<Dimension, readonly string[]> = {
  finishing:['finish_box','turn_finish','long_finish','aerial_finish'],
  creation:['short_creation','through_creation','build_out','cross_support'],
  dribbling:['close_control','carry','turn_finish'],
  mobility:['attack_space','carry','press_recover','cover_space'],
  pressure:['close_control','short_creation','press_recover','intercept','defensive_duel'],
  defense:['intercept','defensive_duel','cover_space','aerial_defend','build_out'],
  physical:['hold_up','defensive_duel','aerial_finish','aerial_defend'],
  aerial:['aerial_finish','aerial_defend'],
  stamina:['press_recover','cover_space','cross_support'],
  goalkeeper:['gk_position','gk_reflex','gk_secure']
};

function clamp(value:number,min=0,max=100){ return Math.max(min,Math.min(max,value)); }
function round2(value:number){ return Math.round(value*100)/100; }

function dimensionDemand(actions:SkillActionInputR457[], dimension:Dimension){
  const ids=DIMENSION_ACTIONS[dimension];
  const relevant=actions.filter(action=>ids.includes(action.id));
  if(!relevant.length) return 0;
  const frequency=relevant.reduce((sum,item)=>sum+clamp(Number(item.frequency)||0),0)/relevant.length;
  const contribution=relevant.reduce((sum,item)=>sum+clamp(Number(item.contribution)||0),0)/relevant.length;
  return clamp(frequency*.68+contribution*.32);
}

function skillVector(name:string):Partial<Record<Dimension,number>>{
  const profile=SKILL_PROFILES[name as keyof typeof SKILL_PROFILES];
  if(!profile) return {};
  const boosts=profile.boosts ?? {};
  const out:Partial<Record<Dimension,number>>={};
  for(const dimension of Object.keys(DIMENSION_ACTIONS) as Dimension[]){
    const value=Number((boosts as Record<string,number>)[dimension]??0);
    if(Number.isFinite(value)&&value>0) out[dimension]=value;
  }
  return out;
}

function individualScore(name:string,actions:SkillActionInputR457[]){
  // Base genérica preservada apenas como fallback para habilidades ainda sem mapeamento de ação.
  const vector=skillVector(name);
  let genericWeighted=0,genericTotal=0;
  const genericSupport:Array<{label:string;value:number}>=[];
  for(const [dimension,boostRaw] of Object.entries(vector) as Array<[Dimension,number]>){
    const boost=Number(boostRaw)||0;
    const demand=dimensionDemand(actions,dimension);
    genericWeighted+=demand*boost;
    genericTotal+=boost;
    if(demand>0) genericSupport.push({label:dimension,value:demand*boost});
  }
  const genericScore=genericTotal>0?clamp(genericWeighted/genericTotal):0;

  // R459: o Top 5 usa a MESMA ação funcional que dirige a ficha, não apenas categorias amplas.
  let specificWeighted=0,specificTotal=0;
  const actionSupport:Array<{label:string;value:number}>=[];
  for(const action of actions){
    const importance=clamp((Number(action.frequency)||0)*.68+(Number(action.contribution)||0)*.32);
    if(importance<=0) continue;
    specificTotal+=importance;
    const detail=skillActionSupportDetailR459([name],action.id);
    if(detail.score<=0) continue;
    const value=importance*detail.score;
    specificWeighted+=value;
    actionSupport.push({label:action.label||action.id,value});
  }
  const specificScore=specificTotal>0?clamp(specificWeighted/specificTotal*100):0;
  const score=specificTotal>0?clamp(specificScore*.82+genericScore*.18):genericScore;
  const support=actionSupport.length?actionSupport:genericSupport;
  support.sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label,'pt-BR'));
  return {score:round2(score),supportedActions:support.slice(0,3).map(item=>item.label)};
}

function pairKey(left:string,right:string){
  return [skillIdentityKey(left),skillIdentityKey(right)].sort().join('::');
}
const COMPLEMENT_KEYS=new Set(SKILL_COMPLEMENTS_R457.map(([a,b])=>pairKey(a,b)));

function setScore(skills:string[], individual:Map<string,{score:number;supportedActions:string[]}>){
  const base=skills.reduce((sum,name)=>sum+(individual.get(skillIdentityKey(name))?.score??0),0);
  let synergy=0;
  const pairs:Array<[string,string]>=[];
  for(let i=0;i<skills.length;i++) for(let j=i+1;j<skills.length;j++){
    if(COMPLEMENT_KEYS.has(pairKey(skills[i],skills[j]))){
      const left=individual.get(skillIdentityKey(skills[i]))?.score??0;
      const right=individual.get(skillIdentityKey(skills[j]))?.score??0;
      const bonus=Math.min(4.5,Math.min(left,right)*.055);
      synergy+=bonus;
      pairs.push([skills[i],skills[j]]);
    }
  }
  return {score:round2(base+synergy),pairs};
}

function combinations<T>(items:T[],size:number){
  const out:T[][]=[];
  const current:T[]=[];
  const visit=(start:number)=>{
    if(current.length===size){ out.push([...current]); return; }
    const needed=size-current.length;
    for(let i=start;i<=items.length-needed;i++){ current.push(items[i]); visit(i+1); current.pop(); }
  };
  if(size===0) return [[]];
  visit(0);
  return out;
}

export function optimizeFinalAdditionalSkillSetR457(
  parsed:ParsedCard,
  actions:SkillActionInputR457[],
  position:PositionCode
):FinalAdditionalSkillSetR457{
  const nativeSpecial=new Set(canonicalizeSkillList([...(parsed.nativeSkills??[]),...(parsed.specialSkills??[])]).map(skillIdentityKey));
  const current=canonicalizeSkillList(parsed.additionalSkills??[])
    .filter(isOfficialAdditionalSkillIdentity);
  const pool=canonicalizeSkillList([
    ...officialAdditionalSkillPoolForPosition(position),
    ...current
  ]).filter(skill=>
    isOfficialAdditionalSkillIdentity(skill)
    && !nativeSpecial.has(skillIdentityKey(skill))
    && isRoleCompatibleAdditionalSkill(skill,position)
  );

  const individual=new Map<string,{score:number;supportedActions:string[]}>();
  for(const skill of pool) individual.set(skillIdentityKey(skill),individualScore(skill,actions));

  const target=Math.min(5,pool.length);
  const sets=combinations(pool,target);
  let winner:string[]=[];
  let winnerScore=-Infinity;
  let winnerPairs:Array<[string,string]>=[];
  for(const set of sets){
    const evaluated=setScore(set,individual);
    const lexical=[...set].sort((a,b)=>a.localeCompare(b,'pt-BR')).join('|');
    const winnerLexical=[...winner].sort((a,b)=>a.localeCompare(b,'pt-BR')).join('|');
    if(evaluated.score>winnerScore+1e-9 || (Math.abs(evaluated.score-winnerScore)<=1e-9 && lexical<winnerLexical)){
      winner=[...set]; winnerScore=evaluated.score; winnerPairs=evaluated.pairs;
    }
  }

  const currentInstalled=current.slice(0,5);
  // Skill instalada mas incompatível com a função continua sendo um slot real:
  // ela vale 0 no modelo desta função e deve aparecer como candidata a SUBSTITUIR, não desaparecer.
  const currentScore=setScore(currentInstalled,individual).score;
  const finalSet=new Set(winner.map(skillIdentityKey));
  const currentSet=new Set(currentInstalled.map(skillIdentityKey));
  const kept=currentInstalled.filter(skill=>finalSet.has(skillIdentityKey(skill)));
  const removals=currentInstalled.filter(skill=>!finalSet.has(skillIdentityKey(skill)))
    .sort((a,b)=>(individual.get(skillIdentityKey(a))?.score??0)-(individual.get(skillIdentityKey(b))?.score??0));
  const additions=winner.filter(skill=>!currentSet.has(skillIdentityKey(skill)))
    .sort((a,b)=>(individual.get(skillIdentityKey(b))?.score??0)-(individual.get(skillIdentityKey(a))?.score??0));

  const decisions:FinalAdditionalSkillSlotDecisionR457[]=[];
  let slot=1;
  for(const skill of kept){
    const data=individual.get(skillIdentityKey(skill))!;
    decisions.push({slot:slot++,action:'KEEP',skill,replaces:null,functionalScore:data.score,reason:'A habilidade atual permanece no conjunto globalmente superior para as ações desta função.'});
  }
  const replacementCount=Math.min(removals.length,additions.length);
  for(let i=0;i<replacementCount;i++){
    const skill=additions[i],replaces=removals[i],data=individual.get(skillIdentityKey(skill))!;
    decisions.push({slot:slot++,action:'REPLACE',skill,replaces,functionalScore:data.score,reason:`Substituir ${replaces}: o conjunto final obtém maior desempenho funcional total sem usar GER/Overall ou diversidade artificial.`});
  }
  for(const skill of additions.slice(replacementCount)){
    const data=individual.get(skillIdentityKey(skill))!;
    decisions.push({slot:slot++,action:'ADD',skill,replaces:null,functionalScore:data.score,reason:'Preenche vaga adicional com a habilidade que mais aumenta o conjunto final dentro do pool oficial compatível.'});
  }

  return {
    version:FINAL_ADDITIONAL_SKILL_SET_R457_VERSION,
    status:target===5?'OPTIMAL_SET_PROVEN':'PARTIAL_POOL',
    position,
    currentSkills:currentInstalled,
    finalSkills:winner,
    additions,
    removals,
    decisions,
    individualScores:pool
      .map(name=>({name,score:individual.get(skillIdentityKey(name))?.score??0,supportedActions:individual.get(skillIdentityKey(name))?.supportedActions??[]}))
      .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'pt-BR')),
    currentSetScore:round2(currentScore),
    finalSetScore:round2(Math.max(0,winnerScore)),
    estimatedSetGain:round2(Math.max(0,winnerScore-currentScore)),
    complementPairs:winnerPairs,
    candidatePoolSize:pool.length,
    combinationsTested:sets.length,
    exactFive:winner.length===5,
    officialOnly:winner.every(isOfficialAdditionalSkillIdentity),
    roleCompatible:winner.every(skill=>isRoleCompatibleAdditionalSkill(skill,position)),
    nativeSpecialDuplicatesBlocked:winner.every(skill=>!nativeSpecial.has(skillIdentityKey(skill))),
    deterministic:true,
    modelNote:'R459 alinha o Top 5 às ações Clean Slate específicas; a matriz dimensional fica apenas como fallback. Scores e sinergias são estimativas funcionais internas e não representam bônus numéricos oficiais de atributos.'
  };
}
