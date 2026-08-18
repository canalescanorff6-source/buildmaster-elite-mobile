import type { AnalysisResult, AttributeKey, Attributes, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const INDIVIDUAL_CALIBRATION_ENGINE_V4080_R42 =
  '40.80-r42-definitive-individual-calibration' as const;

const ATTRS: AttributeKey[] = [
  'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading',
  'placeKicking','curl','defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness',
  'goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach','speed','acceleration','kickingPower',
  'jump','physicalContact','balance','stamina'
];

const GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
  shooting:{finishing:1,placeKicking:1,curl:1}, passing:{lowPass:1,loftedPass:1},
  dribbling:{ballControl:1,dribbling:1,tightPossession:1}, dexterity:{offensiveAwareness:1,acceleration:1,balance:1},
  lowerBodyStrength:{speed:1,kickingPower:1,stamina:1}, aerialStrength:{heading:1,jump:1,physicalContact:1},
  defending:{defensiveAwareness:1,defensiveEngagement:1,tackling:1,aggression:1},
  gk1:{goalkeeperAwareness:1,goalkeeperCatching:1}, gk2:{goalkeeperParrying:1,goalkeeperReflexes:1},
  gk3:{goalkeeperReach:1,jump:1}
};

function norm(v: unknown){ return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function mean(v:number[]){ const s=v.filter(x=>x>0&&Number.isFinite(x)); return s.length?s.reduce((a,b)=>a+b,0)/s.length:0; }
function empty():TrainingPlan { return {shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0}; }
function full(a:Attributes){ const o={} as Required<Attributes>; for(const k of ATTRS)o[k]=Number(a[k]??0); return o; }

function natural(result:AnalysisResult){
  const a=full(result.parsed.attributes);
  const plan=result.parsed.autoTrainingPlan;
  const used=Number(result.parsed.trainingPointsUsed??result.parsed.autoTrainingPoints??0);
  if(!plan||used<=0)return a;
  const n={...a};
  for(const key of TRAINING_KEYS){
    const level=Math.max(0,Number(plan[key]??0));
    for(const [attr,gain] of Object.entries(GAINS[key]) as Array<[AttributeKey,number]>){
      if(n[attr]>0)n[attr]=Math.max(1,n[attr]-level*gain);
    }
  }
  return n;
}

function avg(a:Required<Attributes>, key:TrainingKey){
  return mean((Object.keys(GAINS[key]) as AttributeKey[]).map(k=>Number(a[k]??0)));
}

function keysFor(p:PositionCode):TrainingKey[]{
  if(p==='GK')return ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];
  if(p==='CB')return ['passing','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if(p==='DMF'||p==='LB'||p==='RB')return ['passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if(p==='CMF'||p==='LMF'||p==='RMF')return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  if(p==='AMF')return ['shooting','passing','dribbling','dexterity','lowerBodyStrength'];
  if(p==='SS'||p==='CF')return ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength'];
  return ['shooting','passing','dribbling','dexterity','lowerBodyStrength'];
}

function role(p:PositionCode,k:TrainingKey){
  const T:Partial<Record<PositionCode,Partial<Record<TrainingKey,number>>>>={
    CF:{shooting:2.7,dexterity:2.2,lowerBodyStrength:1.35,dribbling:1,passing:.5,aerialStrength:.85},
    SS:{shooting:1.65,passing:1.45,dribbling:2.05,dexterity:2.35,lowerBodyStrength:.95,aerialStrength:.35},
    LWF:{shooting:1.15,passing:.85,dribbling:2.55,dexterity:2.45,lowerBodyStrength:1.55},
    RWF:{shooting:1.15,passing:.85,dribbling:2.55,dexterity:2.45,lowerBodyStrength:1.55},
    AMF:{shooting:.85,passing:2.55,dribbling:2.1,dexterity:1.55,lowerBodyStrength:.55},
    LMF:{shooting:.35,passing:1.75,dribbling:1.3,dexterity:1.45,lowerBodyStrength:1.45,defending:.95,aerialStrength:.2},
    RMF:{shooting:.35,passing:1.75,dribbling:1.3,dexterity:1.45,lowerBodyStrength:1.45,defending:.95,aerialStrength:.2},
    CMF:{shooting:.35,passing:2,dribbling:.95,dexterity:1.1,lowerBodyStrength:1.45,defending:1.35,aerialStrength:.3},
    DMF:{passing:1.6,dribbling:.3,dexterity:.8,lowerBodyStrength:1.65,aerialStrength:.9,defending:2.7},
    CB:{passing:.65,dexterity:.9,lowerBodyStrength:1.6,aerialStrength:1.9,defending:3.05},
    LB:{passing:1.3,dribbling:.7,dexterity:1.35,lowerBodyStrength:1.7,aerialStrength:.45,defending:2.05},
    RB:{passing:1.3,dribbling:.7,dexterity:1.35,lowerBodyStrength:1.7,aerialStrength:.45,defending:2.05},
    GK:{gk1:2.65,gk2:3,gk3:2.8,aerialStrength:.7,lowerBodyStrength:.3}
  };
  return Number(T[p]?.[k]??.1);
}

function style(result:AnalysisResult,k:TrainingKey){
  const s=norm(result.parsed.offensivePlaystyle??result.parsed.playstyle); let x=0;
  const add=(r:RegExp,w:Partial<Record<TrainingKey,number>>)=>{ if(r.test(s))x+=Number(w[k]??0); };
  add(/artilheiro|goal poacher/,{shooting:2,dexterity:1.5,lowerBodyStrength:.7,dribbling:.45,aerialStrength:.3});
  add(/puxa marcacao|dummy runner|deep lying forward/,{passing:1.25,dribbling:1.35,dexterity:1.2,shooting:.65});
  add(/armador criativo|creative playmaker/,{passing:2,dribbling:1.6,dexterity:.8});
  add(/ala produtivo|prolific winger/,{dribbling:1.8,dexterity:1.65,lowerBodyStrength:1,shooting:.65});
  add(/primeiro volante|anchor man/,{defending:2.2,passing:.95,lowerBodyStrength:1.2,aerialStrength:.65});
  add(/defensor criativo|build up/,{defending:2,passing:1.15,aerialStrength:.7,lowerBodyStrength:.6});
  add(/lateral defensivo|defensive full/,{defending:2,lowerBodyStrength:1.15,passing:.65});
  add(/destruidor|destroyer/,{defending:2.25,lowerBodyStrength:1.35,aerialStrength:.8,dexterity:.45});
  add(/meia versatil|box.to.box/,{lowerBodyStrength:1.35,passing:1.05,defending:1.05,dexterity:.75});
  add(/orquestrador|orchestrator/,{passing:2.1,dribbling:.75,lowerBodyStrength:.55,defending:.4});
  add(/goleiro ofensivo|offensive goalkeeper/,{gk2:1,gk3:.9,lowerBodyStrength:.3});
  add(/goleiro defensivo|defensive goalkeeper/,{gk1:1,gk2:.95,gk3:.8});
  return x;
}

function utility(result:AnalysisResult,a:Required<Attributes>,k:TrainingKey,level:number,base:number){
  const naturalAvg=avg(a,k), dna=Math.max(-1.4,Math.min(1.8,(naturalAvg-base)/8));
  const fit=role(result.bestPosition.code,k)+style(result,k);
  let score=0;
  for(let i=1;i<=level;i++){
    const projected=naturalAvg+i-1;
    const saturation=projected>=97?.08:projected>=95?.28:projected>=92?.62:1;
    score+=Math.max(.05,fit)*(1+Math.max(-.4,dna*.42))*saturation;
  }
  return score;
}

function exact(result:AnalysisResult,a:Required<Attributes>,budget:number){
  const keys=keysFor(result.bestPosition.code), base=mean(keys.map(k=>avg(a,k)));
  type Node={score:number;plan:TrainingPlan};
  let dp:Array<Node|null>=Array.from({length:budget+1},()=>null); dp[0]={score:0,plan:empty()};
  for(const key of keys){
    const next:Array<Node|null>=Array.from({length:budget+1},()=>null);
    for(let spent=0;spent<=budget;spent++){
      const prev=dp[spent]; if(!prev)continue;
      for(let level=0;level<=16;level++){
        const total=spent+trainingTotalCost(level); if(total>budget)break;
        const score=prev.score+utility(result,a,key,level,base);
        if(!next[total]||score>(next[total]?.score??-Infinity))next[total]={score,plan:{...prev.plan,[key]:level}};
      }
    }
    dp=next;
  }
  return dp[budget]?.plan??null;
}

function validIdentity(result:AnalysisResult,a:Required<Attributes>,p:TrainingPlan){
  const pos=result.bestPosition.code, s=norm(result.parsed.playstyle);
  const dribbleBase=mean([a.ballControl,a.dribbling,a.tightPossession,a.balance]);
  if((pos==='LWF'||pos==='RWF') && p.dribbling+p.dexterity+p.lowerBodyStrength<=p.defending+p.aerialStrength)return false;
  if(dribbleBase>=88 && ['SS','AMF','LWF','RWF'].includes(pos) && p.dribbling+p.dexterity<p.shooting+p.passing)return false;
  if(pos==='DMF'&&/primeiro volante|anchor man/.test(s)&&p.defending+p.passing<=p.shooting+p.dribbling)return false;
  if(pos==='CB'&&p.defending+p.aerialStrength<=p.shooting+p.dribbling)return false;
  if((pos==='LB'||pos==='RB')&&/lateral defensivo|defensive full/.test(s)&&p.defending+p.lowerBodyStrength+p.passing<=p.shooting+p.aerialStrength)return false;
  if(pos==='GK'&&p.gk1+p.gk2+p.gk3<=p.shooting+p.dribbling+p.defending)return false;
  return true;
}

function search(result:AnalysisResult,a:Required<Attributes>,budget:number){
  const first=exact(result,a,budget);
  if(first&&validIdentity(result,a,first))return first;

  // Segunda busca: reforça os grupos identitários da carta sem herdar grupos proibidos.
  const keys=keysFor(result.bestPosition.code);
  const candidates:TrainingPlan[]=[];
  if(first)candidates.push(first);
  for(const key of keys){
    const base=first?{...first}:empty();
    for(let plus=1;plus<=4;plus++){
      const target={...base,[key]:Math.min(16,Number(base[key]??0)+plus)};
      // Refecha orçamento removendo níveis de menor encaixe.
      let plan={...target};
      while(trainingPlanTotalCost(plan)>budget){
        const removable=keys.filter(k=>Number(plan[k]??0)>0).sort((x,y)=>role(result.bestPosition.code,x)+style(result,x)-role(result.bestPosition.code,y)-style(result,y));
        if(!removable.length)break;
        plan[removable[0]]=Math.max(0,Number(plan[removable[0]]??0)-1);
      }
      while(trainingPlanTotalCost(plan)<budget){
        const addable=keys.filter(k=>Number(plan[k]??0)<16).sort((x,y)=>role(result.bestPosition.code,y)+style(result,y)-role(result.bestPosition.code,x)-style(result,x));
        let changed=false;
        for(const k of addable){
          const copy={...plan,[k]:Number(plan[k]??0)+1};
          if(trainingPlanTotalCost(copy)<=budget){ plan=copy; changed=true; break; }
        }
        if(!changed)break;
      }
      if(trainingPlanTotalCost(plan)===budget)candidates.push(plan);
    }
  }
  return candidates.find(p=>validIdentity(result,a,p))??first;
}

export function applyIndividualCalibrationEngineV4080R41(result:AnalysisResult):AnalysisResult{
  const a=natural(result);
  const directCoverage=ATTRS.filter(k=>Number(a[k]??0)>0).length;
  const declared=Number(result.parsed.evidence.attributeCount??0);
  const coverage=Math.max(directCoverage,declared);
  const budget=Number(result.trainingPointsTotal??result.parsed.trainingPointsTotal??0);

  if(coverage<6||!Number.isFinite(budget)||budget<=0)return result;
  const winner=search(result,a,budget);
  if(!winner||trainingPlanTotalCost(winner)!==budget)return result;

  return {
    ...result,
    training:winner,
    trainingPointsUsed:budget,
    trainingPointsRemaining:0,
    recommendationExplanation:[
      `Calibração Individual r42: ${result.parsed.playerName} recalculado por DNA real com orçamento exato.`,
      `Cobertura efetiva ${coverage}: o calibrador não depende mais somente do contador do OCR.`,
      'Grupos incompatíveis com a posição são eliminados antes da ficha final.',
      'DNA técnico, função, estilo e retorno marginal têm prioridade sobre overall.',
      ...result.recommendationExplanation
    ].filter((v,i,a)=>a.indexOf(v)===i).slice(0,64)
  };
}
