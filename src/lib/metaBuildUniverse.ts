import type {
  AttributeKey,
  Attributes,
  Objective,
  ParsedCard,
  PositionCode,
  TacticalFormation,
  TacticalProfile,
  TacticalStyle,
  TrainingKey,
  TrainingPlan
} from './analyzer';
import type { BuildVariant } from './trainingEngine';
import type { MaxPrecisionAnalysis } from './maxPrecision';

export type MetaBuildCategory =
  | 'Meta total'
  | 'Identidade competitiva'
  | 'Pressão e recuperação'
  | 'Transição rápida'
  | 'Posse segura'
  | 'Drible e 1 contra 1'
  | 'Passe vertical'
  | 'Finalização decisiva'
  | 'Defesa reativa'
  | 'Físico e jogo aéreo';

export type MetaScenario =
  | 'Ranked equilibrado'
  | 'Contra pressão alta'
  | 'Contra bloco baixo'
  | 'Proteger vantagem'
  | 'Buscar o gol'
  | 'Segundo tempo'
  | 'Conexão instável';

export type MetaBuildEntry = {
  id: string;
  rank: number;
  title: string;
  category: MetaBuildCategory;
  formation: Exclude<TacticalFormation, 'AUTO'>;
  style: Exclude<TacticalStyle, 'AUTO'> | 'HÍBRIDO_SEGURO';
  scenario: MetaScenario;
  training: TrainingPlan;
  pointsUsed: number;
  score: number;
  metaScore: number;
  identityScore: number;
  skillScore: number;
  tacticalScore: number;
  efficiencyScore: number;
  stabilityScore: number;
  individualityScore: number;
  strengths: string[];
  risks: string[];
  bestUse: string;
  whyItWon: string;
  officialBasis: string[];
  communityBasis: string[];
};

export type MetaBuildUniverse = {
  version: 'v26.50';
  patchReference: 'v5.5.0';
  gameplayBalanceReference: 'v5.4.0 + v5.2.0';
  updatedAt: '2026-07-13';
  candidatesAnalyzed: number;
  uniqueDistributions: number;
  topBuilds: MetaBuildEntry[];
  bestByCategory: MetaBuildEntry[];
  bestByStyle: MetaBuildEntry[];
  bestByFormation: MetaBuildEntry[];
  bestByScenario: MetaBuildEntry[];
  officialMechanics: string[];
  communityTrends: string[];
  safeguards: string[];
  verdict: string;
};

const ALL_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending','gk1','gk2','gk3'];
const LINE_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
const GK_KEYS: TrainingKey[] = ['gk1','gk2','gk3','lowerBodyStrength','aerialStrength'];

const LABELS: Record<TrainingKey, string> = {
  shooting:'Finalização', passing:'Passe', dribbling:'Drible', dexterity:'Destreza', lowerBodyStrength:'Força das pernas',
  aerialStrength:'Bola aérea', defending:'Defesa', gk1:'Goleiro 1', gk2:'Goleiro 2', gk3:'Goleiro 3'
};

const FORMATIONS = ['4-2-1-3','4-2-2-2','4-3-3','4-2-3-1','4-3-1-2','4-4-2'] as const satisfies readonly Exclude<TacticalFormation, 'AUTO'>[];
const STYLES = ['CONTRA_ATAQUE_RAPIDO','POSSE_DE_BOLA','CONTRA_ATAQUE','POR_FORA','PASSE_LONGO','HÍBRIDO_SEGURO'] as const satisfies readonly (Exclude<TacticalStyle, 'AUTO'> | 'HÍBRIDO_SEGURO')[];
const SCENARIOS: MetaScenario[] = ['Ranked equilibrado','Contra pressão alta','Contra bloco baixo','Proteger vantagem','Buscar o gol','Segundo tempo','Conexão instável'];
const CATEGORIES: MetaBuildCategory[] = ['Meta total','Identidade competitiva','Pressão e recuperação','Transição rápida','Posse segura','Drible e 1 contra 1','Passe vertical','Finalização decisiva','Defesa reativa','Físico e jogo aéreo'];

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF:{shooting:1.35,dexterity:1.2,lowerBodyStrength:1.05,aerialStrength:.72,dribbling:.58,passing:.38},
  SS:{dexterity:1.25,dribbling:1.12,shooting:1.05,passing:.92,lowerBodyStrength:.72},
  LWF:{dribbling:1.32,dexterity:1.25,lowerBodyStrength:1.02,shooting:.98,passing:.55},
  RWF:{dribbling:1.32,dexterity:1.25,lowerBodyStrength:1.02,shooting:.98,passing:.55},
  LMF:{lowerBodyStrength:1.18,passing:1.12,dribbling:.92,defending:.72,dexterity:.68},
  RMF:{lowerBodyStrength:1.18,passing:1.12,dribbling:.92,defending:.72,dexterity:.68},
  AMF:{passing:1.28,dribbling:1.18,dexterity:1.1,shooting:.82,lowerBodyStrength:.48},
  CMF:{passing:1.24,lowerBodyStrength:1.02,dribbling:.84,defending:.82,dexterity:.62},
  DMF:{defending:1.35,passing:1.02,lowerBodyStrength:1.02,aerialStrength:.78,dexterity:.42},
  CB:{defending:1.45,aerialStrength:1.12,lowerBodyStrength:1.0,passing:.46,dexterity:.32},
  LB:{lowerBodyStrength:1.25,defending:1.08,passing:.82,dexterity:.72,dribbling:.58},
  RB:{lowerBodyStrength:1.25,defending:1.08,passing:.82,dexterity:.72,dribbling:.58},
  GK:{gk2:1.35,gk1:1.25,gk3:1.2,aerialStrength:.66,lowerBodyStrength:.5}
};

const CATEGORY_WEIGHTS: Record<MetaBuildCategory, Partial<Record<TrainingKey, number>>> = {
  'Meta total':{dexterity:.45,lowerBodyStrength:.42,defending:.35,dribbling:.32,passing:.3,shooting:.3,aerialStrength:.18,gk1:.3,gk2:.42,gk3:.35},
  'Identidade competitiva':{},
  'Pressão e recuperação':{defending:.72,lowerBodyStrength:.56,dexterity:.35,passing:.16},
  'Transição rápida':{lowerBodyStrength:.68,dexterity:.62,shooting:.34,passing:.28,dribbling:.24},
  'Posse segura':{passing:.72,dribbling:.58,dexterity:.34,lowerBodyStrength:.22},
  'Drible e 1 contra 1':{dribbling:.82,dexterity:.68,lowerBodyStrength:.3,shooting:.15},
  'Passe vertical':{passing:.82,dexterity:.32,dribbling:.28,lowerBodyStrength:.18},
  'Finalização decisiva':{shooting:.88,dexterity:.58,lowerBodyStrength:.34,aerialStrength:.18},
  'Defesa reativa':{defending:.88,lowerBodyStrength:.5,dexterity:.38,aerialStrength:.25,gk2:.75,gk1:.5,gk3:.45},
  'Físico e jogo aéreo':{aerialStrength:.85,lowerBodyStrength:.65,defending:.32,shooting:.22,gk3:.5}
};

const STYLE_WEIGHTS: Record<typeof STYLES[number], Partial<Record<TrainingKey, number>>> = {
  CONTRA_ATAQUE_RAPIDO:{dexterity:.38,lowerBodyStrength:.42,shooting:.22,passing:.18,defending:.16},
  POSSE_DE_BOLA:{passing:.42,dribbling:.36,dexterity:.2,lowerBodyStrength:.12},
  CONTRA_ATAQUE:{defending:.28,lowerBodyStrength:.32,passing:.24,aerialStrength:.22,shooting:.16},
  POR_FORA:{lowerBodyStrength:.3,passing:.3,dribbling:.25,aerialStrength:.2,dexterity:.16},
  PASSE_LONGO:{passing:.4,aerialStrength:.32,lowerBodyStrength:.25,shooting:.12,defending:.12},
  HÍBRIDO_SEGURO:{passing:.2,dexterity:.2,lowerBodyStrength:.2,defending:.2,dribbling:.14,shooting:.14,aerialStrength:.1}
};

const SCENARIO_WEIGHTS: Record<MetaScenario, Partial<Record<TrainingKey, number>>> = {
  'Ranked equilibrado':{passing:.16,dexterity:.2,lowerBodyStrength:.2,defending:.16,dribbling:.12,shooting:.12},
  'Contra pressão alta':{passing:.36,dribbling:.28,dexterity:.22,lowerBodyStrength:.14},
  'Contra bloco baixo':{dribbling:.3,passing:.28,shooting:.3,dexterity:.18},
  'Proteger vantagem':{defending:.42,lowerBodyStrength:.3,passing:.2,aerialStrength:.16,gk1:.28,gk2:.28},
  'Buscar o gol':{shooting:.45,dexterity:.32,dribbling:.22,lowerBodyStrength:.18,aerialStrength:.14},
  'Segundo tempo':{lowerBodyStrength:.42,dexterity:.28,shooting:.18,defending:.18},
  'Conexão instável':{passing:.32,lowerBodyStrength:.24,defending:.2,dexterity:.14,dribbling:-.08}
};

const FORMATION_WEIGHTS: Record<typeof FORMATIONS[number], Partial<Record<TrainingKey, number>>> = {
  '4-2-1-3':{defending:.22,passing:.22,dexterity:.2,dribbling:.15,lowerBodyStrength:.15},
  '4-2-2-2':{passing:.2,dexterity:.24,shooting:.22,lowerBodyStrength:.18,defending:.16},
  '4-3-3':{passing:.26,dribbling:.22,lowerBodyStrength:.18,dexterity:.16,defending:.12},
  '4-2-3-1':{passing:.26,dribbling:.18,defending:.18,dexterity:.16,lowerBodyStrength:.14},
  '4-3-1-2':{passing:.24,dexterity:.2,defending:.18,shooting:.16,dribbling:.12},
  '4-4-2':{defending:.22,lowerBodyStrength:.22,aerialStrength:.18,passing:.16,shooting:.14}
};

const ATTR_GROUPS: Record<TrainingKey, AttributeKey[]> = {
  shooting:['finishing','placeKicking','curl'], passing:['lowPass','loftedPass'], dribbling:['ballControl','dribbling','tightPossession'],
  dexterity:['offensiveAwareness','acceleration','balance'], lowerBodyStrength:['speed','kickingPower','stamina'], aerialStrength:['heading','jump','physicalContact'],
  defending:['defensiveAwareness','defensiveEngagement','tackling','aggression'], gk1:['goalkeeperAwareness','goalkeeperCatching'],
  gk2:['goalkeeperParrying','goalkeeperReflexes'], gk3:['goalkeeperReach','jump']
};

const SPECIAL_SKILL_WEIGHTS: Record<string, Partial<Record<TrainingKey, number>>> = {
  'Blitz Curler':{shooting:.58,dribbling:.25,dexterity:.22}, 'Esticada de Perna':{defending:.62,lowerBodyStrength:.28},
  'Momentum Dribbling':{dribbling:.62,dexterity:.42}, 'Phenomenal Finishing':{shooting:.62,dexterity:.35},
  'Phenomenal Pass':{passing:.62,dribbling:.3}, 'Game-changing Pass':{passing:.58,lowerBodyStrength:.2},
  'Fortress':{defending:.64,aerialStrength:.35}, 'Edged Crossing':{passing:.55,lowerBodyStrength:.25},
  'Bullet Header':{aerialStrength:.62,shooting:.32}, 'Sombra veloz':{dexterity:.5,lowerBodyStrength:.48}
};

function emptyPlan(): TrainingPlan {
  return {shooting:0,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:0,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0};
}
function clamp(value:number,min=0,max=100){return Math.max(min,Math.min(max,value));}
function avg(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}
function levelCost(level:number){return level<=0?0:Math.ceil(level/4);}
function totalCost(level:number){let cost=0;for(let i=1;i<=Math.max(0,level);i++)cost+=levelCost(i);return cost;}
function planCost(plan:TrainingPlan){return ALL_KEYS.reduce((sum,key)=>sum+totalCost(plan[key]??0),0);}
function hash(input:string){let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36).toUpperCase();}
function planKey(plan:TrainingPlan){return ALL_KEYS.map(key=>plan[key]??0).join('-');}
function addWeights(target:Record<TrainingKey,number>, source:Partial<Record<TrainingKey,number>>, factor=1){for(const key of ALL_KEYS)target[key]+=(source[key]??0)*factor;}

function groupIdentity(attributes:Required<Attributes>, keys:TrainingKey[]):Record<TrainingKey,number>{
  const result=Object.fromEntries(ALL_KEYS.map(key=>[key,0])) as Record<TrainingKey,number>;
  const raw=keys.map(key=>({key,value:avg(ATTR_GROUPS[key].map(attr=>attributes[attr]??60))}));
  const min=Math.min(...raw.map(item=>item.value)); const max=Math.max(...raw.map(item=>item.value));
  for(const item of raw)result[item.key]=max===min?.5:(item.value-min)/(max-min);
  return result;
}

function objectiveWeights(objective:Objective):Partial<Record<TrainingKey,number>>{
  const map:Record<Objective,Partial<Record<TrainingKey,number>>>={
    COMPETITIVE:{dexterity:.28,lowerBodyStrength:.28,passing:.18,defending:.18}, FINISHER:{shooting:.6,dexterity:.35}, CREATOR:{passing:.58,dribbling:.36},
    DRIBBLER:{dribbling:.62,dexterity:.4}, PRESSING:{defending:.5,lowerBodyStrength:.4}, POSSESSION:{passing:.5,dribbling:.38},
    QUICK_COUNTER:{lowerBodyStrength:.5,dexterity:.45,shooting:.22}, DEFENSIVE:{defending:.62,aerialStrength:.28}, AERIAL:{aerialStrength:.62,lowerBodyStrength:.32},
    GOALKEEPER:{gk2:.52,gk1:.46,gk3:.44}, META_2026:{dexterity:.38,lowerBodyStrength:.36,defending:.3,dribbling:.25,passing:.22,shooting:.2}
  };return map[objective];
}

function generatePlan(weights:Record<TrainingKey,number>, base:TrainingPlan, keys:TrainingKey[], budget:number, seed:number):TrainingPlan{
  const plan=emptyPlan(); let used=0; let guard=0;
  while(guard++<300){
    let best:TrainingKey|null=null; let bestUtility=-Infinity; let bestCost=0;
    for(let index=0;index<keys.length;index++){
      const key=keys[index]; const next=(plan[key]??0)+1; if(next>16)continue;
      const cost=levelCost(next); if(used+cost>budget)continue;
      const jitter=(((seed+(index+1)*97+next*31)%101)-50)/1000;
      const baseAffinity=1+Math.min(16,base[key]??0)*.018;
      const saturation=1/(1+Math.max(0,next-8)*.14+Math.max(0,next-12)*.25);
      const utility=(weights[key]+jitter)*baseAffinity*saturation/Math.max(1,cost);
      if(utility>bestUtility){bestUtility=utility;best=key;bestCost=cost;}
    }
    if(!best)break; plan[best]+=1; used+=bestCost;
  }
  return plan;
}

function weightedScore(plan:TrainingPlan, weights:Record<TrainingKey,number>, keys:TrainingKey[]):number{
  const totalWeight=keys.reduce((sum,key)=>sum+Math.max(.01,weights[key]),0);
  const raw=keys.reduce((sum,key)=>sum+Math.max(.01,weights[key])*Math.min(1,(plan[key]??0)/10),0)/totalWeight;
  return clamp(Math.round(52+raw*47),1,99);
}
function similarity(plan:TrainingPlan, base:TrainingPlan, keys:TrainingKey[]):number{
  const distance=keys.reduce((sum,key)=>sum+Math.abs((plan[key]??0)-(base[key]??0)),0);
  return clamp(Math.round(100-distance*3),1,99);
}
function diversity(plan:TrainingPlan, generic:TrainingPlan, keys:TrainingKey[]):number{
  const distance=keys.reduce((sum,key)=>sum+Math.abs((plan[key]??0)-(generic[key]??0)),0);
  return clamp(Math.round(55+distance*4),1,99);
}
function topGroups(plan:TrainingPlan,keys:TrainingKey[],count=3){return [...keys].sort((a,b)=>(plan[b]??0)-(plan[a]??0)).slice(0,count);}
function riskText(plan:TrainingPlan,weights:Record<TrainingKey,number>,keys:TrainingKey[]):string[]{
  const important=[...keys].sort((a,b)=>weights[b]-weights[a]).slice(0,3);
  const risks=important.filter(key=>(plan[key]??0)<5).map(key=>`${LABELS[key]} ficou abaixo do nível meta interno deste cenário.`);
  const overs=[...keys].filter(key=>(plan[key]??0)>=13).map(key=>`${LABELS[key]} está muito especializado e reduz flexibilidade.`);
  return [...risks,...overs].slice(0,3);
}
function styleLabel(style:MetaBuildEntry['style']){return ({CONTRA_ATAQUE_RAPIDO:'Contra-Ataque Rápido',POSSE_DE_BOLA:'Posse de Bola',CONTRA_ATAQUE:'Contra-Ataque',POR_FORA:'Por Fora',PASSE_LONGO:'Passe Longo',HÍBRIDO_SEGURO:'Híbrido seguro'} as const)[style];}

function officialBasisFor(category:MetaBuildCategory,position:PositionCode):string[]{
  const items=['Drible em velocidade e Sharp Touch mais responsivos na base de gameplay v5.4.0.','Defesa depende mais de orientação corporal, Match-up e reação correta ao espaço.'];
  if(['CB','DMF','LB','RB'].includes(position))items.push('Consciência Defensiva influencia a reação durante a marcação na base v5.2.0.');
  if(['Drible e 1 contra 1','Transição rápida','Meta total'].includes(category))items.push('Mudança de direção, aceleração e equilíbrio recebem peso maior em duelos de 1 contra 1.');
  return items;
}

function communityBasisFor(formation:MetaBuildEntry['formation'],style:MetaBuildEntry['style']):string[]{
  const notes=[`${formation} é tratada como tendência comunitária, não como regra oficial.`];
  if(formation==='4-2-1-3')notes.push('Estrutura frequentemente citada pela flexibilidade do duplo pivô, MAT e três atacantes.');
  if(formation==='4-2-2-2')notes.push('Estrutura associada a combinações verticais e Contra-Ataque Rápido.');
  if(formation==='4-3-3')notes.push('Estrutura associada a amplitude e construção em Posse de Bola.');
  notes.push(`Compatibilidade considerada com ${styleLabel(style)}.`); return notes;
}

function chooseUniqueBest(entries:MetaBuildEntry[],keyFn:(entry:MetaBuildEntry)=>string,limit=20):MetaBuildEntry[]{
  const seen=new Set<string>(); const result:MetaBuildEntry[]=[];
  for(const entry of entries){const key=keyFn(entry);if(seen.has(key))continue;seen.add(key);result.push(entry);if(result.length>=limit)break;}
  return result;
}

export function buildMetaBuildUniverse(input:{
  parsed:ParsedCard;
  position:PositionCode;
  objective:Objective;
  tacticalProfile:TacticalProfile;
  baseAttributes:Required<Attributes>;
  variants:BuildVariant[];
  maxPrecision?:MaxPrecisionAnalysis;
  trainingPointsTotal:number;
}):MetaBuildUniverse{
  const {parsed,position,objective,tacticalProfile,baseAttributes,variants,maxPrecision,trainingPointsTotal}=input;
  const keys=position==='GK'?GK_KEYS:LINE_KEYS;
  const bases:TrainingPlan[]=[...variants.map(item=>item.training),...(maxPrecision?.alternatives.map(item=>item.training)??[])];
  const uniqueBases=[...new Map(bases.map(plan=>[planKey(plan),plan])).values()];
  const safeBases=uniqueBases.length?uniqueBases:[emptyPlan()];
  while(safeBases.length<6)safeBases.push({...safeBases[safeBases.length%safeBases.length]});
  const identity=groupIdentity(baseAttributes,keys);
  const skillWeights=Object.fromEntries(ALL_KEYS.map(key=>[key,0])) as Record<TrainingKey,number>;
  for(const skill of [...parsed.nativeSkills,...parsed.specialSkills])addWeights(skillWeights,SPECIAL_SKILL_WEIGHTS[skill]??{},1);
  const candidates:MetaBuildEntry[]=[]; const genericWeights=Object.fromEntries(ALL_KEYS.map(key=>[key,.1])) as Record<TrainingKey,number>;
  addWeights(genericWeights,POSITION_WEIGHTS[position],1);
  const genericPlan=generatePlan(genericWeights,safeBases[0],keys,trainingPointsTotal,17);
  let evaluated=0;
  for(const category of CATEGORIES)for(const formation of FORMATIONS)for(const scenario of SCENARIOS)for(const style of STYLES){
    evaluated+=safeBases.length;
    const weights=Object.fromEntries(ALL_KEYS.map(key=>[key,.04])) as Record<TrainingKey,number>;
    addWeights(weights,POSITION_WEIGHTS[position],1);
    addWeights(weights,CATEGORY_WEIGHTS[category],1);
    addWeights(weights,STYLE_WEIGHTS[style],1);
    addWeights(weights,SCENARIO_WEIGHTS[scenario],1);
    addWeights(weights,FORMATION_WEIGHTS[formation],1);
    addWeights(weights,objectiveWeights(objective),.55);
    addWeights(weights,identity,category==='Identidade competitiva'?1.05:.46);
    addWeights(weights,skillWeights,category==='Meta total'?.62:.42);
    if(tacticalProfile.style!=='AUTO'&&style===tacticalProfile.style)addWeights(weights,STYLE_WEIGHTS[style],.25);
    if(tacticalProfile.formation!=='AUTO'&&formation===tacticalProfile.formation)addWeights(weights,FORMATION_WEIGHTS[formation],.2);
    const seed=parseInt(hash(`${parsed.playerName}|${parsed.cardType}|${position}|${category}|${formation}|${scenario}|${style}`).slice(0,6),36)||17;
    const baseIndex=seed%safeBases.length;
    const plan=generatePlan(weights,safeBases[baseIndex]??safeBases[0],keys,trainingPointsTotal,seed);
    const metaScore=weightedScore(plan,weights,keys);
    const identityScore=clamp(Math.round(similarity(plan,safeBases[0],keys)*.55+weightedScore(plan,{...identity} as Record<TrainingKey,number>,keys)*.45),1,99);
    const skillScore=Object.values(skillWeights).some(value=>value>0)?weightedScore(plan,skillWeights,keys):72;
    const tacticalScore=clamp(Math.round(weightedScore(plan,{...Object.fromEntries(ALL_KEYS.map(key=>[key,.05])),...STYLE_WEIGHTS[style],...FORMATION_WEIGHTS[formation]} as Record<TrainingKey,number>,keys)),1,99);
    const efficiencyScore=clamp(Math.round(80+(planCost(plan)/Math.max(1,trainingPointsTotal))*18-(keys.filter(key=>(plan[key]??0)>=13).length*3)),1,99);
    const stabilityWeights=Object.fromEntries(ALL_KEYS.map(key=>[key,.08])) as Record<TrainingKey,number>;
    addWeights(stabilityWeights,{passing:.25,lowerBodyStrength:.35,defending:.28,dexterity:.2,gk1:.3,gk2:.3,gk3:.25},1);
    const stabilityScore=weightedScore(plan,stabilityWeights,keys);
    const individualityScore=diversity(plan,genericPlan,keys);
    const total=clamp(Math.round(metaScore*.34+identityScore*.16+skillScore*.13+tacticalScore*.16+efficiencyScore*.09+stabilityScore*.07+individualityScore*.05),1,99);
    const top=topGroups(plan,keys,3);
    const risks=riskText(plan,weights,keys);
    candidates.push({
      id:`META-${hash(`${planKey(plan)}|${category}|${formation}|${scenario}|${style}`)}`,
      rank:0,title:`${category} • ${styleLabel(style)} • ${scenario}`,category,formation,style,scenario,training:plan,pointsUsed:planCost(plan),
      score:total,metaScore,identityScore,skillScore,tacticalScore,efficiencyScore,stabilityScore,individualityScore,
      strengths:top.map(key=>`${LABELS[key]} +${plan[key]}`),risks,
      bestUse:`${styleLabel(style)} em ${formation}, usando ${parsed.playerName||'a carta'} como ${position} no cenário “${scenario}”.`,
      whyItWon:`Combina ${top.map(key=>LABELS[key]).join(', ')} com identidade da carta, habilidades confirmadas e exigências do cenário, sem ultrapassar ${trainingPointsTotal} pontos.`,
      officialBasis:officialBasisFor(category,position),communityBasis:communityBasisFor(formation,style)
    });
  }
  const bestByPlan=new Map<string,MetaBuildEntry>();
  for(const entry of candidates){const key=planKey(entry.training);const current=bestByPlan.get(key);if(!current||entry.score>current.score)bestByPlan.set(key,entry);}
  const ranked=[...bestByPlan.values()].sort((a,b)=>b.score-a.score||b.individualityScore-a.individualityScore).map((entry,index)=>({...entry,rank:index+1}));
  const topBuilds=ranked.slice(0,36);
  const bestByCategory=chooseUniqueBest(ranked,entry=>entry.category,CATEGORIES.length);
  const bestByStyle=chooseUniqueBest(ranked,entry=>entry.style,STYLES.length);
  const bestByFormation=chooseUniqueBest(ranked,entry=>entry.formation,FORMATIONS.length);
  const bestByScenario=chooseUniqueBest(ranked,entry=>entry.scenario,SCENARIOS.length);
  const best=ranked[0];
  return {
    version:'v26.50',patchReference:'v5.5.0',gameplayBalanceReference:'v5.4.0 + v5.2.0',updatedAt:'2026-07-13',
    candidatesAnalyzed:evaluated,uniqueDistributions:ranked.length,topBuilds,bestByCategory,bestByStyle,bestByFormation,bestByScenario,
    officialMechanics:[
      'v5.4.0: mudanças de direção mais rápidas no Dash Dribble e Sharp Touch, com resposta mais consistente.',
      'v5.4.0: Match-up pode recuar de frente para o driblador e defensores ajustam melhor o corpo para correr para trás.',
      'v5.2.0: Consciência Defensiva passou a influenciar a reação/aceleração durante a marcação.',
      'v5.5.0: atualização atual de referência; não introduziu um novo rebalanceamento geral de gameplay documentado.'
    ],
    communityTrends:[
      '4-2-1-3 aparece como opção comunitária equilibrada e flexível.',
      '4-2-2-2 aparece associada a Contra-Ataque Rápido e combinações verticais.',
      '4-3-3 aparece associada a Posse de Bola, amplitude e pontas cortando para dentro.',
      '4-2-3-1 aparece como alternativa para explorar amplitude contra estruturas estreitas.',
      '4-3-1-2 aparece como alternativa de densidade central; 4-4-2 é opção direta para Contra-Ataque/Passe Longo.'
    ],
    safeguards:[
      'A posição escolhida pelo usuário nunca é trocada.',
      'Nenhuma ficha ultrapassa o orçamento real de pontos.',
      'As tendências comunitárias ficam separadas das mecânicas oficiais.',
      'O motor evita ficha clonada, mas permite distribuições próximas quando as cartas realmente são semelhantes.',
      'A melhor ficha é uma recomendação calculada, não garantia de vitória ou de comportamento idêntico em todas as partidas.'
    ],
    verdict:best?`Foram avaliadas ${evaluated.toLocaleString('pt-BR')} combinações e ${ranked.length.toLocaleString('pt-BR')} distribuições únicas. A melhor foi “${best.title}”, nota ${best.score}/100.`:'Não foi possível gerar o universo Meta 2026.'
  };
}
