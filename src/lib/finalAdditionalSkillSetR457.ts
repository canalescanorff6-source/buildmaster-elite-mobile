import type { ParsedCard, PositionCode } from './analyzerDomain';
import { SKILL_PROFILES } from '@/modules/analysis/analyzerCatalog';
import { officialAdditionalSkillPoolForPosition, isRoleCompatibleAdditionalSkill, SKILL_COMPLEMENTS_R457 } from './skillIntelligenceV31';
import { canonicalizeSkillList, isOfficialAdditionalSkillIdentity, skillIdentityKey } from './officialSkillIdentity';
import { skillActionSupportDetailR459 } from './gameplayImpactR458';

export const FINAL_ADDITIONAL_SKILL_SET_R457_VERSION = '40.80-r508-final-additional-skill-set-v5-style-post-build' as const;

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
  actionStateSource: 'PROJECTED_POST_BUILD_ACTIONS' | 'PARTIAL_PROJECTED_ACTIONS' | 'LEGACY_ACTION_FALLBACK';
  projectedActionCoverage: number;
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
function norm(value:unknown){ return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }

/**
 * R508: reconecta ao escritor final o contexto de estilo oficial que já existia
 * no motor de habilidades v35. O ajuste só desempata/prioriza dentro do pool
 * oficial e compatível da posição; não cria habilidades e não usa Overall/GER.
 *
 * O caso de goleiros precisa ser explícito porque as ações de defesa de meta são
 * muito semelhantes entre Goleiro Ofensivo e Goleiro Defensivo. Sem este sinal,
 * o R506 convergia os dois estilos para o mesmo Top 5 apesar de haver seis opções
 * oficiais seguras disponíveis.
 */
function officialPlaystyleAdjustmentR508(parsed:ParsedCard,position:PositionCode,name:string){
  if(position!=='GK') return 0;
  const style=norm(`${parsed.playstyle??''} ${parsed.offensivePlaystyle??''} ${parsed.defensivePlaystyle??''}`);
  if(/goleiro ofensivo|offensive goalkeeper/.test(style)){
    if(['Reposição baixa do goleiro','Reposição alta do goleiro','Arremesso longo do goleiro'].includes(name)) return 34;
    if(['Espírito guerreiro','Liderança'].includes(name)) return 12;
    if(name==='Pegador de pênalti') return -55;
  }
  if(/goleiro defensivo|defensive goalkeeper/.test(style)){
    if(name==='Pegador de pênalti') return 96;
    if(['Espírito guerreiro','Liderança'].includes(name)) return 25;
    if(name==='Reposição alta do goleiro') return 8;
    if(['Reposição baixa do goleiro','Arremesso longo do goleiro'].includes(name)) return -55;
  }
  return 0;
}

function projectedScoreOf(action:SkillActionInputR457){
  const value=Number(action.projectedScore);
  return Number.isFinite(value)?clamp(value):null;
}

function actionImportance(action:SkillActionInputR457){
  const frequency=clamp(Number(action.frequency)||0);
  const contribution=clamp(Number(action.contribution)||0);
  const projected=projectedScoreOf(action);
  // R506: skill não substitui atributo. Quando a ação vem do estado final da ficha,
  // a utilidade funcional considera se os atributos pós-build realmente sustentam a ação.
  // Sem projectedScore, preservamos exatamente a ponderação legada R459.
  return projected===null
    ? clamp(frequency*.68+contribution*.32)
    : clamp(frequency*.50+contribution*.25+projected*.25);
}

function projectedActionCoverage(actions:SkillActionInputR457[]){
  if(!actions.length) return 0;
  const projected=actions.filter(action=>projectedScoreOf(action)!==null).length;
  return round2(projected/actions.length*100);
}

function actionStateSource(actions:SkillActionInputR457[]):FinalAdditionalSkillSetR457['actionStateSource']{
  const coverage=projectedActionCoverage(actions);
  if(coverage===100&&actions.length>0) return 'PROJECTED_POST_BUILD_ACTIONS';
  if(coverage>0) return 'PARTIAL_PROJECTED_ACTIONS';
  return 'LEGACY_ACTION_FALLBACK';
}

function dimensionDemand(actions:SkillActionInputR457[], dimension:Dimension){
  const ids=DIMENSION_ACTIONS[dimension];
  const relevant=actions.filter(action=>ids.includes(action.id));
  if(!relevant.length) return 0;
  return clamp(relevant.reduce((sum,item)=>sum+actionImportance(item),0)/relevant.length);
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

function individualScore(name:string,actions:SkillActionInputR457[],parsed:ParsedCard,position:PositionCode){
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

  // R459/R506: o Top 5 usa a MESMA ação funcional que dirige a ficha e, quando
  // disponível, o projectedScore pós-build dessa ação. Isto é relevância funcional
  // interna; não representa bônus numérico oficial da habilidade sobre atributos.
  let specificWeighted=0,specificTotal=0;
  const actionSupport:Array<{label:string;value:number}>=[];
  for(const action of actions){
    const importance=actionImportance(action);
    if(importance<=0) continue;
    specificTotal+=importance;
    const detail=skillActionSupportDetailR459([name],action.id);
    if(detail.score<=0) continue;
    const value=importance*detail.score;
    specificWeighted+=value;
    actionSupport.push({label:action.label||action.id,value});
  }
  const specificScore=specificTotal>0?clamp(specificWeighted/specificTotal*100):0;
  const functionalScore=specificTotal>0?clamp(specificScore*.82+genericScore*.18):genericScore;
  const styleAdjustment=officialPlaystyleAdjustmentR508(parsed,position,name);
  const score=clamp(functionalScore+styleAdjustment);
  const support=actionSupport.length?actionSupport:genericSupport;
  support.sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label,'pt-BR'));
  const supportedActions=support.slice(0,3).map(item=>item.label);
  if(styleAdjustment!==0) supportedActions.unshift(`Estilo oficial ${String(parsed.playstyle??'').trim()||position}`);
  return {score:round2(score),supportedActions:supportedActions.slice(0,3)};
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
  const stateSource=actionStateSource(actions);
  const stateCoverage=projectedActionCoverage(actions);
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
  for(const skill of pool) individual.set(skillIdentityKey(skill),individualScore(skill,actions,parsed,position));

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
    actionStateSource:stateSource,
    projectedActionCoverage:stateCoverage,
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
    modelNote:stateSource==='PROJECTED_POST_BUILD_ACTIONS'
      ? 'R508 mantém o Top 5 alinhado às ações e ao projectedScore pós-build da ficha e restaura o contexto de estilo oficial como prioridade adicional dentro do pool oficial compatível. Nenhum bônus numérico oficial de atributo é inventado.'
      : stateSource==='PARTIAL_PROJECTED_ACTIONS'
        ? 'R508 recebeu apenas parte dos projectedScore; usa o estado pós-build onde existe, preserva a ponderação R459 e aplica contexto de estilo oficial apenas dentro do pool compatível, sem inventar atributos.'
        : 'Fallback R508 explícito: sem projectedScore pós-build, frequência/contribuição e contexto de estilo oficial permanecem fontes funcionais. Scores e sinergias são estimativas internas, não bônus oficiais de atributos.'
  };
}
