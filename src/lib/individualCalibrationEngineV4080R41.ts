import type { AnalysisResult, AttributeKey, Attributes, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const INDIVIDUAL_CALIBRATION_ENGINE_V4080_R41 = '40.80-r41-global-individual-calibration' as const;

const ATTRS: AttributeKey[] = ['offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading','placeKicking','curl','defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach','speed','acceleration','kickingPower','jump','physicalContact','balance','stamina'];
const GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
  shooting:{finishing:1,placeKicking:1,curl:1}, passing:{lowPass:1,loftedPass:1}, dribbling:{ballControl:1,dribbling:1,tightPossession:1},
  dexterity:{offensiveAwareness:1,acceleration:1,balance:1}, lowerBodyStrength:{speed:1,kickingPower:1,stamina:1}, aerialStrength:{heading:1,jump:1,physicalContact:1},
  defending:{defensiveAwareness:1,defensiveEngagement:1,tackling:1,aggression:1}, gk1:{goalkeeperAwareness:1,goalkeeperCatching:1}, gk2:{goalkeeperParrying:1,goalkeeperReflexes:1}, gk3:{goalkeeperReach:1,jump:1}
};
const VARIANTS = [
  {id:'BALANCED',identity:.42,need:.82,style:1.00},
  {id:'DNA',identity:.78,need:.46,style:1.05},
  {id:'REPAIR',identity:.12,need:1.18,style:.92},
  {id:'ROLE',identity:.48,need:.68,style:1.28}
] as const;

type Variant = typeof VARIANTS[number];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const norm=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const avg=(v:number[])=>{const s=v.filter(x=>Number.isFinite(x)&&x>0);return s.length?s.reduce((a,b)=>a+b,0)/s.length:0;};
const empty=():TrainingPlan=>({shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0});

function complete(input: Attributes){const out={} as Required<Attributes>; for(const k of ATTRS) out[k]=Number(input[k]??0); return out;}
function naturalOf(result:AnalysisResult){
  const current=complete(result.parsed.attributes); const plan=result.parsed.autoTrainingPlan; const used=Number(result.parsed.trainingPointsUsed??result.parsed.autoTrainingPoints??0);
  if(!plan||used<=0) return current; const out={...current};
  for(const key of TRAINING_KEYS){const level=Math.max(0,Number(plan[key]??0)); if(!level) continue; for(const [attr,gain] of Object.entries(GAINS[key]) as Array<[AttributeKey,number]>) if(out[attr]>0) out[attr]=Math.max(1,out[attr]-level*gain);}
  return out;
}
function group(a:Required<Attributes>,key:TrainingKey){return avg((Object.keys(GAINS[key]) as AttributeKey[]).map(k=>Number(a[k]??0)));}
function allowed(p:PositionCode):TrainingKey[]{
  if(p==='GK') return ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];
  if(p==='CB') return ['passing','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if(p==='DMF'||p==='LB'||p==='RB') return ['passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if(p==='AMF') return ['shooting','passing','dribbling','dexterity','lowerBodyStrength'];
  if(p==='SS'||p==='CF') return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength'];
  return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
}
function role(p:PositionCode,k:TrainingKey){
  const t:Partial<Record<PositionCode,Partial<Record<TrainingKey,number>>>>={
    CF:{shooting:2.55,dexterity:2.1,lowerBodyStrength:1.35,dribbling:1,passing:.55,aerialStrength:.85}, SS:{shooting:1.7,passing:1.55,dribbling:1.85,dexterity:2.2,lowerBodyStrength:.95,aerialStrength:.45},
    AMF:{shooting:.9,passing:2.45,dribbling:2,dexterity:1.5,lowerBodyStrength:.65}, CMF:{shooting:.45,passing:1.95,dribbling:.95,dexterity:1.1,lowerBodyStrength:1.45,defending:1.35,aerialStrength:.35},
    LMF:{shooting:.45,passing:1.7,dribbling:1.3,dexterity:1.45,lowerBodyStrength:1.45,defending:.95,aerialStrength:.25}, RMF:{shooting:.45,passing:1.7,dribbling:1.3,dexterity:1.45,lowerBodyStrength:1.45,defending:.95,aerialStrength:.25},
    DMF:{passing:1.55,dribbling:.35,dexterity:.85,lowerBodyStrength:1.6,aerialStrength:.9,defending:2.55}, CB:{passing:.7,dexterity:.95,lowerBodyStrength:1.55,aerialStrength:1.8,defending:2.9},
    LB:{passing:1.25,dribbling:.75,dexterity:1.3,lowerBodyStrength:1.65,aerialStrength:.5,defending:1.95}, RB:{passing:1.25,dribbling:.75,dexterity:1.3,lowerBodyStrength:1.65,aerialStrength:.5,defending:1.95},
    GK:{gk1:2.55,gk2:2.9,gk3:2.7,aerialStrength:.75,lowerBodyStrength:.35}
  }; return Number(t[p]?.[k]??.15);
}
function style(result:AnalysisResult,k:TrainingKey){
  const s=norm(result.parsed.offensivePlaystyle??result.parsed.playstyle); let v=0; const add=(r:RegExp,w:Partial<Record<TrainingKey,number>>)=>{if(r.test(s))v+=Number(w[k]??0);};
  add(/artilheiro|goal poacher/,{shooting:1.9,dexterity:1.45,lowerBodyStrength:.7,dribbling:.55,aerialStrength:.35}); add(/homem de area|fox in the box/,{shooting:1.8,aerialStrength:1.55,lowerBodyStrength:.9,dexterity:.6});
  add(/pivo|pivô|target man/,{lowerBodyStrength:1.7,aerialStrength:1.35,passing:1.05,shooting:.85,dribbling:.35}); add(/puxa marcacao|puxa marcação|dummy runner|deep lying forward/,{passing:1.4,dribbling:1.05,dexterity:1,shooting:.7});
  add(/armador criativo|creative playmaker/,{passing:1.9,dribbling:1.5,dexterity:.75,shooting:.35}); add(/classico|clássico|classic/,{passing:2,dribbling:1.45,shooting:.45});
  add(/infiltracao|infiltração|hole player|atacante surpresa/,{dexterity:1.7,shooting:1.25,lowerBodyStrength:.65,dribbling:.6}); add(/meia versatil|meia versátil|box.to.box/,{lowerBodyStrength:1.3,passing:1.05,defending:1,dexterity:.75});
  add(/orquestrador|orchestrator/,{passing:2,dribbling:.75,lowerBodyStrength:.6,defending:.45}); add(/primeiro volante|anchor man|ancora|âncora/,{defending:2.1,passing:.9,lowerBodyStrength:1.15,aerialStrength:.65});
  add(/destruidor|destroyer/,{defending:2.15,lowerBodyStrength:1.3,aerialStrength:.8,dexterity:.5}); add(/defensor criativo|build up|construtor/,{defending:1.9,passing:1.1,aerialStrength:.7,lowerBodyStrength:.6});
  add(/lateral defensivo|defensive full/,{defending:1.9,lowerBodyStrength:1.1,passing:.6}); add(/lateral ofensivo|lateral atacante|offensive full|full.back finisher/,{lowerBodyStrength:1.35,passing:1.3,dexterity:1.1,dribbling:.75,defending:.5});
  add(/ala produtivo|prolific winger/,{dribbling:1.6,dexterity:1.45,lowerBodyStrength:.9,shooting:.7}); add(/lateral movel|lateral móvel|roaming flank/,{dexterity:1.45,lowerBodyStrength:1.25,dribbling:1.2,shooting:.5});
  add(/perito em cruzamento|cross specialist/,{passing:1.8,lowerBodyStrength:1,dexterity:.7,dribbling:.4}); add(/goleiro ofensivo|offensive goalkeeper/,{gk2:1,gk3:.85,lowerBodyStrength:.3}); add(/goleiro defensivo|defensive goalkeeper/,{gk1:.95,gk2:.9,gk3:.75}); return v;
}
function target(p:PositionCode,k:TrainingKey,r:number,s:number){const def=k==='defending'||k==='gk1'||k==='gk2'||k==='gk3'; return clamp((def?87:86)+r*2.25+Math.max(0,s)*1.1+(p==='GK'?2:(p==='CB'||p==='DMF'?1.2:.6)),82,96.5);}
function levelUtility(result:AnalysisResult,natural:Required<Attributes>,key:TrainingKey,level:number,baseline:number,v:Variant){
  const ng=group(natural,key), rw=role(result.bestPosition.code,key), sw=style(result,key)*v.style, id=clamp((ng-baseline)/9,-1.35,1.35), tgt=target(result.bestPosition.code,key,rw,sw); let score=0;
  for(let i=1;i<=level;i++){const projected=ng+i-1, need=clamp((tgt-projected)/11,-.55,1.45), sat=projected>=97?.14:projected>=95?.34:projected>=92?.68:1, factor=Math.max(.05,rw+Math.max(0,sw)), individuality=1+id*v.identity*.24+need*v.need*.38, over=projected>tgt+1?(projected-tgt-1)*.38:0; score+=factor*individuality*sat-over;}
  return score;
}
function exactPlan(result:AnalysisResult,natural:Required<Attributes>,budget:number,v:Variant):TrainingPlan|null{
  const keys=allowed(result.bestPosition.code), baseline=avg(keys.map(k=>group(natural,k))); type Node={score:number;plan:TrainingPlan}; let dp:Array<Node|null>=Array.from({length:budget+1},()=>null); dp[0]={score:0,plan:empty()};
  for(const key of keys){const next:Array<Node|null>=Array.from({length:budget+1},()=>null); for(let spent=0;spent<=budget;spent++){const prev=dp[spent]; if(!prev)continue; for(let level=0;level<=16;level++){const cost=trainingTotalCost(level), total=spent+cost; if(total>budget)break; const score=prev.score+levelUtility(result,natural,key,level,baseline,v), cur=next[total]; if(!cur||score>cur.score+1e-9) next[total]={score,plan:{...prev.plan,[key]:level}};}} dp=next;}
  return dp[budget]?.plan??null;
}
function robust(result:AnalysisResult,natural:Required<Attributes>,plan:TrainingPlan){const keys=allowed(result.bestPosition.code), baseline=avg(keys.map(k=>group(natural,k))), scores=VARIANTS.map(v=>keys.reduce((sum,k)=>sum+levelUtility(result,natural,k,Number(plan[k]??0),baseline,v),0)).sort((a,b)=>a-b); const worst=scores[0]??0, average=scores.reduce((a,b)=>a+b,0)/Math.max(1,scores.length); return average*.72+worst*.28;}
function signature(plan:TrainingPlan){return TRAINING_KEYS.map(k=>`${k}:${Number(plan[k]??0)}`).join('|');}

export function applyIndividualCalibrationEngineV4080R41(result:AnalysisResult):AnalysisResult{
  const coverage=Number(result.parsed.evidence.attributeCount??0), budget=Number(result.trainingPointsTotal??0); if(coverage<10||!Number.isFinite(budget)||budget<=0)return result;
  const natural=naturalOf(result), candidates=new Map<string,TrainingPlan>(); for(const v of VARIANTS){const p=exactPlan(result,natural,budget,v); if(p&&trainingPlanTotalCost(p)===budget)candidates.set(signature(p),p);} if(trainingPlanTotalCost(result.training)===budget)candidates.set(signature(result.training),{...result.training});
  const ranked=[...candidates.values()].map(plan=>({plan,score:robust(result,natural,plan)})).sort((a,b)=>b.score-a.score); const winner=ranked[0]?.plan??result.training, used=trainingPlanTotalCost(winner), changed=signature(winner)!==signature(result.training);
  const priorities=allowed(result.bestPosition.code).map(k=>({k,level:Number(winner[k]??0),base:Math.round(group(natural,k))})).sort((a,b)=>b.level-a.level||a.base-b.base).slice(0,3).map(x=>`${x.k} ${x.level} (base ${x.base})`);
  return {...result,training:winner,trainingPointsUsed:used,trainingPointsRemaining:Math.max(0,budget-used),recommendationExplanation:[`Calibração Individual r41: busca global por orçamento exato aplicada a ${result.parsed.playerName}.`,changed?'A ficha anterior foi substituída porque uma distribuição individual teve desempenho robusto superior.':'A ficha anterior permaneceu porque venceu a busca global desta carta — não porque o motor usa receita fixa.',`Prioridades desta carta: ${priorities.join(' • ')}.`,'A decisão usa atributos naturais, posição, estilo, lacunas úteis, saturação e retorno marginal; não usa overall como objetivo.','Jogadores da mesma posição/estilo podem receber fichas diferentes quando o DNA numérico for diferente.',...result.recommendationExplanation].filter((item,index,all)=>all.indexOf(item)===index).slice(0,64)};
}
