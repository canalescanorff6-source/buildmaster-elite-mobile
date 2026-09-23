import type { AnalysisResult, TacticalFormation, TacticalStyle } from './analyzerDomain';
import type { MatchState, TeamEnergy } from './gamePlan';
import { cardIdentityFingerprintR126, playerIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import { analysisUsagePositionR138 } from './analysisUsagePositionR138';
import { canonicalizePlayerPlaystyle } from './efootball2026Playstyles';
import { FORMATION_BLUEPRINTS, scorePlayerForFormationSlot, type FormationSlot, type FormationSlotFit } from './formationRoleEngine';
import { optimizeGlobalFormationLineupR457 } from './globalLineupOptimizerR457';

export const FORMATION_AWARE_ROTATION_R457_VERSION='40.80-r457-formation-aware-rotation-v1' as const;

export type FormationAwareSubstitutionR457={
  mode:'MANTER_FUNCAO'|'MUDAR_COMPORTAMENTO';
  slotId:string;
  slotLabel:string;
  outPlayer:string;
  inPlayer:string;
  beforeTeamScore:number;
  afterTeamScore:number;
  tacticalDelta:number;
  contextDelta:number;
  adjustedGain:number;
  score:number;
  minute:string;
  trigger:string;
  reason:string;
  automatic:false;
};

export type FormationAwareRotationR457={
  version:typeof FORMATION_AWARE_ROTATION_R457_VERSION;
  formation:TacticalFormation;
  style:TacticalStyle;
  lineupStatus:'PROVEN_GLOBAL'|'BEST_FOUND_NOT_PROVEN'|'NO_COMPLETE_LINEUP';
  starterResults:AnalysisResult[];
  benchResults:AnalysisResult[];
  substitutions:FormationAwareSubstitutionR457[];
  baseTeamScore:number;
  formationAware:true;
  generic433SplitUsed:false;
  automaticChanges:false;
};

function clamp(v:number,min=0,max=100){return Math.max(min,Math.min(max,v));}
function avg(v:number[]){return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;}
function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function role(result:AnalysisResult){return norm(result.teamMap?.functionLabel??result.buildName??result.parsed.playstyle??'');}
function sameFunction(a:AnalysisResult,b:AnalysisResult){
  const ar=role(a),br=role(b);
  if(ar&&br&&(ar===br||ar.includes(br)||br.includes(ar)))return true;
  const as=canonicalizePlayerPlaystyle(a.parsed.playstyle),bs=canonicalizePlayerPlaystyle(b.parsed.playstyle);
  return Boolean(as&&bs&&as===bs);
}
function sector(result:AnalysisResult,key:'attack'|'defense'|'control'|'energy'){
  const s=result.teamMap?.sectorScores;
  if(key==='attack')return avg([s?.finalizacao??60,s?.criacao??60,s?.aceleracao??60]);
  if(key==='defense')return avg([s?.marcacao??60,s?.cobertura??60,s?.fisico??60]);
  if(key==='energy')return avg([s?.fisico??60,Number(result.parsed.attributes?.stamina??60)]);
  return avg([s?.passe??60,s?.criacao??60,s?.saidaDeBola??60]);
}
function teamProfile(results:AnalysisResult[]){
  return {attack:avg(results.map(r=>sector(r,'attack'))),defense:avg(results.map(r=>sector(r,'defense'))),control:avg(results.map(r=>sector(r,'control'))),energy:avg(results.map(r=>sector(r,'energy')))};
}
function contextualDelta(before:AnalysisResult[],after:AnalysisResult[],state:MatchState,energy:TeamEnergy){
  const a=teamProfile(before),b=teamProfile(after);
  let delta=0;
  if(String(state).startsWith('PERDENDO'))delta+=(b.attack-a.attack)*.48+(b.control-a.control)*.18;
  else if(String(state).startsWith('VENCENDO'))delta+=(b.defense-a.defense)*.42+(b.control-a.control)*.20;
  else delta+=(b.control-a.control)*.30+(b.attack-a.attack)*.16+(b.defense-a.defense)*.16;
  if(energy==='BAIXA')delta+=(b.energy-a.energy)*.30;
  return Math.round(delta*100)/100;
}
const FORMATION_LINEUP_CACHE_R457=new Map<string,ReturnType<typeof optimizeGlobalFormationLineupR457>>();
function lineupCacheKey(results:AnalysisResult[],formationId:string,style:TacticalStyle){
  const roster=results.map(result=>JSON.stringify([cardIdentityFingerprintR126(result.parsed),analysisUsagePositionR138(result),result.parsed.playstyle??null,result.bestPosition?.score??null,result.teamMap?.functionLabel??null,result.teamMap?.sectorScores??null,result.permittedPositions?.map(p=>p.code).sort()??[],result.parsed.positionRatings??{}])).sort();
  return JSON.stringify([formationId,style,roster]);
}
function cachedGlobalLineup(results:AnalysisResult[],blueprint:any,style:TacticalStyle){
  const key=lineupCacheKey(results,blueprint.id,style);
  const cached=FORMATION_LINEUP_CACHE_R457.get(key);
  if(cached){FORMATION_LINEUP_CACHE_R457.delete(key);FORMATION_LINEUP_CACHE_R457.set(key,cached);return cached;}
  const value=optimizeGlobalFormationLineupR457(results,blueprint,style);
  FORMATION_LINEUP_CACHE_R457.set(key,value);
  while(FORMATION_LINEUP_CACHE_R457.size>24){const oldest=FORMATION_LINEUP_CACHE_R457.keys().next().value;if(oldest===undefined)break;FORMATION_LINEUP_CACHE_R457.delete(oldest);}
  return value;
}

function evaluateAssignments(assignments:Array<{slot:FormationSlot;result:AnalysisResult|null}>,formationId:string,style:TacticalStyle){
  const active=assignments.filter(x=>x.result).map(x=>x.result!);
  const fits=assignments.map(item=>{
    if(!item.result)return null;
    const key=playerIdentityFingerprintR126(item.result.parsed);
    return scorePlayerForFormationSlot(item.result,item.slot,{formationId,teamStyle:style,partnerResults:active.filter(r=>playerIdentityFingerprintR126(r.parsed)!==key)});
  });
  const score=assignments.length?fits.reduce((s,f)=>s+(f?.score??0),0)/assignments.length:0;
  return {score:Math.round(score*10)/10,fits};
}

export function buildFormationAwareRotationR457(
  results:AnalysisResult[],
  formation:TacticalFormation,
  style:TacticalStyle,
  state:MatchState,
  energy:TeamEnergy
):FormationAwareRotationR457|null{
  if(!results.length)return null;
  const formationId=formation==='AUTO'?'4-2-2-2':formation;
  const blueprint=FORMATION_BLUEPRINTS.find(item=>item.id===formationId)??FORMATION_BLUEPRINTS[0];
  const global=cachedGlobalLineup(results,blueprint,style);
  const baseAssignments=global.lineup.map(item=>({slot:item.slot,result:item.player}));
  const starters=baseAssignments.filter(x=>x.result).map(x=>x.result!);
  const starterKeys=new Set(starters.map(r=>playerIdentityFingerprintR126(r.parsed)));

  // Uma única versão de cada atleta no banco, escolhida pelo melhor encaixe real em algum slot da formação.
  const bestReserveByPlayer=new Map<string,{result:AnalysisResult;coverage:number;bestFit:number}>();
  for(const result of results){
    const key=playerIdentityFingerprintR126(result.parsed);
    if(starterKeys.has(key))continue;
    const fits=blueprint.slots.map(slot=>scorePlayerForFormationSlot(result,slot,{formationId:blueprint.id,teamStyle:style,partnerResults:starters}));
    const coverage=fits.filter(f=>f.score>=48).length;
    const bestFit=Math.max(0,...fits.map(f=>f.score));
    const previous=bestReserveByPlayer.get(key);
    if(!previous||bestFit+coverage*2>previous.bestFit+previous.coverage*2)bestReserveByPlayer.set(key,{result,coverage,bestFit});
  }
  const reservePool=[...bestReserveByPlayer.values()].filter(x=>x.coverage>0);
  const substitutions:FormationAwareSubstitutionR457[]=[];
  const beforeScore=evaluateAssignments(baseAssignments,blueprint.id,style).score;

  for(const reserve of reservePool){
    for(let index=0;index<baseAssignments.length;index++){
      const current=baseAssignments[index];
      if(!current.result)continue;
      const reserveKey=playerIdentityFingerprintR126(reserve.result.parsed);
      const conflict=baseAssignments.some((item,i)=>i!==index&&item.result&&playerIdentityFingerprintR126(item.result.parsed)===reserveKey);
      if(conflict)continue;
      const baseFit=scorePlayerForFormationSlot(reserve.result,current.slot,{formationId:blueprint.id,teamStyle:style,partnerResults:starters.filter(r=>r!==current.result)});
      if(baseFit.score<48)continue;
      const swapped=baseAssignments.map((item,i)=>i===index?{slot:item.slot,result:reserve.result}:item);
      const afterEval=evaluateAssignments(swapped,blueprint.id,style);
      const afterResults=swapped.filter(x=>x.result).map(x=>x.result!);
      const contextDelta=contextualDelta(starters,afterResults,state,energy);
      const tacticalDelta=Math.round((afterEval.score-beforeScore)*100)/100;
      const adjustedGain=Math.round((tacticalDelta+contextDelta)*100)/100;
      const mode=sameFunction(current.result,reserve.result)?'MANTER_FUNCAO':'MUDAR_COMPORTAMENTO';
      const losing=String(state).startsWith('PERDENDO'),winning=String(state).startsWith('VENCENDO');
      const minute=energy==='BAIXA'?'55–65':losing?'65–75':winning?'70–80':'60–75';
      const trigger=energy==='BAIXA'?'queda de intensidade confirmada':losing?'buscar maior impacto ofensivo':winning?'proteger a vantagem sem perder estrutura':'ajuste funcional do setor';
      substitutions.push({
        mode,slotId:current.slot.id,slotLabel:current.slot.label,outPlayer:current.result.parsed.playerName,inPlayer:reserve.result.parsed.playerName,
        beforeTeamScore:beforeScore,afterTeamScore:afterEval.score,tacticalDelta,contextDelta,adjustedGain,
        score:Math.round(clamp(70+adjustedGain*4)),minute,trigger,
        reason:mode==='MANTER_FUNCAO'
          ?`${reserve.result.parsed.playerName} preserva a função de ${current.slot.label}; XI recalculado de ${beforeScore} para ${afterEval.score}.`
          :`${reserve.result.parsed.playerName} altera o comportamento de ${current.slot.label}; XI recalculado de ${beforeScore} para ${afterEval.score}, com ajuste contextual ${contextDelta>=0?'+':''}${contextDelta}.`,
        automatic:false
      });
    }
  }

  substitutions.sort((a,b)=>b.adjustedGain-a.adjustedGain||b.afterTeamScore-a.afterTeamScore||a.inPlayer.localeCompare(b.inPlayer,'pt-BR'));
  const bestUtilityByPlayer=new Map<string,number>();
  for(const sub of substitutions)bestUtilityByPlayer.set(sub.inPlayer,Math.max(bestUtilityByPlayer.get(sub.inPlayer)??-999,sub.adjustedGain));
  const benchResults=reservePool.slice().sort((a,b)=>{
    const au=bestUtilityByPlayer.get(a.result.parsed.playerName)??-999,bu=bestUtilityByPlayer.get(b.result.parsed.playerName)??-999;
    return bu-au||b.coverage-a.coverage||b.bestFit-a.bestFit;
  }).slice(0,12).map(x=>x.result);
  const benchNames=new Set(benchResults.map(r=>r.parsed.playerName));
  const selectedSubs:FormationAwareSubstitutionR457[]=[];
  const pairSeen=new Set<string>();
  for(const sub of substitutions){
    if(!benchNames.has(sub.inPlayer))continue;
    const key=`${sub.outPlayer}::${sub.inPlayer}`;
    if(pairSeen.has(key))continue;
    pairSeen.add(key);selectedSubs.push(sub);
    if(selectedSubs.length>=8)break;
  }
  return {version:FORMATION_AWARE_ROTATION_R457_VERSION,formation:formationId as TacticalFormation,style,lineupStatus:global.status,starterResults:starters,benchResults,substitutions:selectedSubs,baseTeamScore:beforeScore,formationAware:true,generic433SplitUsed:false,automaticChanges:false};
}
