import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  ImpetoRecommendation,
  ParsedCard,
  PositionCode,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import {
  emptyTraining,
  trainingLevelCost,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';
import { RECOGNIZABLE_IMPETO_NAMES } from './officialImpetoCatalog';
import { skillIdentityKey } from './officialSkillIdentity';
import { isRoleCompatibleAdditionalSkill } from './skillIntelligenceV31';

export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r119-clean-slate-gameplay-authority' as const;

export type CleanSlateActionR119 = {
  id: string;
  label: string;
  naturalScore: number;
  projectedScore: number;
  frequency: number;
  contribution: number;
};

export type CleanSlate2027R119 = {
  version: typeof CLEAN_SLATE_2027_R119_VERSION;
  authority: 'CLEAN_SLATE_SINGLE_WRITER';
  source: 'RAW_CARD_SNAPSHOT';
  status: 'READY' | 'BLOCKED_INSUFFICIENT_DATA';
  cardKey: string;
  positionAnchor: PositionCode;
  budget: number;
  training: TrainingPlan;
  candidateCount: number;
  score: number;
  responseScore: number;
  synergyScore: number;
  confidence: number;
  dominantDna: string[];
  specialSkills: string[];
  actions: CleanSlateActionR119[];
  top5: string[];
  currentImpeto: string | null;
  impetoDecision: 'KEEP_CURRENT' | 'RECOMMEND_NEW' | 'NO_SAFE_IMPETO' | 'SLOT_NOT_AVAILABLE';
  recommendedImpeto: string | null;
  guards: {
    ignoresIncomingTraining: true;
    ignoresOverall: true;
    noFloorPeakCeiling: true;
    rawSnapshotProtected: true;
    exactBudget: boolean;
    ownedSkillDuplicatesBlocked: boolean;
    existingImpetoNeverRepeated: boolean;
    selectedPositionDoesNotRewriteSignature: true;
    legacyEnginesReadOnly: true;
  };
  reasons: string[];
};

type WithR119 = AnalysisResult & { cleanSlate2027R119: CleanSlate2027R119 };
type ActionDef = {
  id: string;
  label: string;
  attrs: AttributeKey[];
  positions: Partial<Record<PositionCode, number>>;
  tags: string[];
};

type BeamState = { plan: TrainingPlan; score: number; signature: string };

const TRAINING_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing', 'placeKicking', 'curl'],
  passing: ['lowPass', 'loftedPass'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach']
};

const FIELD_KEYS: TrainingKey[] = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
const GK_KEYS: TrainingKey[] = ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength'];

const ACTIONS: ActionDef[] = [
  { id:'attack_space', label:'Ataque ao espaço', attrs:['offensiveAwareness','acceleration','speed','balance'], positions:{CF:1,SS:.92,LWF:.84,RWF:.84,AMF:.66,LMF:.42,RMF:.42,CMF:.24}, tags:['movement','finishing'] },
  { id:'finish_box', label:'Finalização na área', attrs:['offensiveAwareness','finishing','kickingPower','balance'], positions:{CF:1,SS:.88,LWF:.66,RWF:.66,AMF:.58,CMF:.18}, tags:['finishing'] },
  { id:'turn_finish', label:'Giro + chute', attrs:['ballControl','tightPossession','balance','finishing','acceleration'], positions:{CF:.9,SS:1,AMF:.82,LWF:.7,RWF:.7,CMF:.25}, tags:['technical','finishing','control'] },
  { id:'long_finish', label:'Finalização de média distância', attrs:['finishing','kickingPower','curl','ballControl'], positions:{CF:.68,SS:.78,LWF:.76,RWF:.76,AMF:.9,CMF:.55,LMF:.45,RMF:.45}, tags:['finishing','technical'] },
  { id:'close_control', label:'Controle sob pressão', attrs:['ballControl','dribbling','tightPossession','balance'], positions:{CF:.55,SS:1,LWF:1,RWF:1,AMF:1,CMF:.84,DMF:.52,LMF:.78,RMF:.78,LB:.42,RB:.42}, tags:['technical','control'] },
  { id:'carry', label:'Condução progressiva', attrs:['dribbling','tightPossession','speed','acceleration','balance'], positions:{SS:.82,LWF:1,RWF:1,AMF:.9,CMF:.72,LMF:.92,RMF:.92,LB:.62,RB:.62,CF:.4}, tags:['technical','movement','control'] },
  { id:'short_creation', label:'Tabela e passe curto', attrs:['lowPass','ballControl','tightPossession','offensiveAwareness'], positions:{SS:.9,AMF:1,CMF:1,DMF:.76,LMF:.88,RMF:.88,CF:.45,LB:.48,RB:.48}, tags:['creation','technical'] },
  { id:'through_creation', label:'Passe de ruptura', attrs:['lowPass','loftedPass','curl','ballControl'], positions:{AMF:1,CMF:.96,SS:.88,DMF:.64,LMF:.78,RMF:.78,LWF:.56,RWF:.56,LB:.52,RB:.52}, tags:['creation'] },
  { id:'hold_up', label:'Proteção e apoio', attrs:['physicalContact','balance','ballControl','offensiveAwareness'], positions:{CF:1,SS:.58,AMF:.35,DMF:.4,CB:.3}, tags:['physical','control'] },
  { id:'aerial_finish', label:'Disputa aérea ofensiva', attrs:['heading','jump','physicalContact','offensiveAwareness'], positions:{CF:1,SS:.3,CB:.22,AMF:.12}, tags:['aerial','physical','finishing'] },
  { id:'press_recover', label:'Pressão e recuperação', attrs:['stamina','defensiveEngagement','aggression','speed','acceleration'], positions:{DMF:.9,CMF:.9,LMF:.82,RMF:.82,LB:.78,RB:.78,AMF:.5,SS:.48,CF:.34,CB:.58}, tags:['defending','stamina','movement'] },
  { id:'intercept', label:'Interceptação', attrs:['defensiveAwareness','defensiveEngagement','tackling','speed'], positions:{DMF:1,CB:1,CMF:.78,LB:.86,RB:.86,LMF:.48,RMF:.48,AMF:.2}, tags:['defending'] },
  { id:'defensive_duel', label:'Duelo defensivo', attrs:['tackling','physicalContact','aggression','balance'], positions:{CB:1,DMF:.94,LB:.84,RB:.84,CMF:.66,LMF:.42,RMF:.42}, tags:['defending','physical'] },
  { id:'cover_space', label:'Cobertura de espaço', attrs:['defensiveAwareness','speed','acceleration','stamina'], positions:{CB:1,LB:1,RB:1,DMF:.9,CMF:.58,LMF:.5,RMF:.5}, tags:['defending','movement','stamina'] },
  { id:'build_out', label:'Saída de bola', attrs:['lowPass','ballControl','defensiveAwareness','tightPossession'], positions:{CB:.78,DMF:1,CMF:.86,LB:.72,RB:.72,GK:.12}, tags:['creation','defending','control'] },
  { id:'cross_support', label:'Apoio e cruzamento', attrs:['loftedPass','curl','speed','stamina'], positions:{LB:.86,RB:.86,LMF:.78,RMF:.78,LWF:.52,RWF:.52}, tags:['creation','movement'] },
  { id:'gk_position', label:'Posicionamento do goleiro', attrs:['goalkeeperAwareness','goalkeeperReach','goalkeeperReflexes'], positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_reflex', label:'Defesa por reflexo', attrs:['goalkeeperReflexes','goalkeeperReach','goalkeeperParrying'], positions:{GK:1}, tags:['goalkeeper'] },
  { id:'gk_secure', label:'Controle de rebote', attrs:['goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying'], positions:{GK:1}, tags:['goalkeeper'] }
];

const clamp = (v:number,min=0,max=100) => Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const norm = (v:unknown) => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const average = (values:number[]) => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
const attr = (attrs:Attributes,key:AttributeKey) => clamp(Number(attrs[key] ?? 50),1,99);
const round1 = (v:number) => Number(v.toFixed(1));

function cardKey(parsed:ParsedCard) {
  return `${norm(parsed.playerName)}|${norm(parsed.cardType)}|${parsed.mainPosition}|${norm(parsed.specialTag)}`;
}

function normalizedConfidence(parsed:ParsedCard) {
  const raw=Number(parsed.confidence ?? 0);
  const conf=raw<=1 ? raw*100 : raw;
  const coverage=clamp(Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length)*4,0,100);
  return clamp(conf*.7+coverage*.3);
}

function positionRelevance(action:ActionDef, parsed:ParsedCard) {
  const main=action.positions[parsed.mainPosition] ?? 0;
  const alternates=(parsed.positions??[]).filter(p=>p!==parsed.mainPosition).map(p=>(action.positions[p]??0)*.62);
  return Math.max(main,...alternates,0);
}

function skillText(parsed:ParsedCard) {
  return norm([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].join(' | '));
}

function actionEvidence(action:ActionDef,parsed:ParsedCard,natural:number) {
  const skills=skillText(parsed);
  const style=norm(`${parsed.playstyle??''} ${parsed.offensivePlaystyle??''} ${parsed.defensivePlaystyle??''}`);
  let bonus=0;
  if(action.tags.includes('finishing') && /chute|finaliza|efeito de longe|curva descendente|blitz|fenomenal/.test(skills)) bonus+=.11;
  if(action.tags.includes('technical') && /toque duplo|elastico|giro|sola|drible|pes magneticos/.test(skills)) bonus+=.12;
  if(action.tags.includes('creation') && /passe|visionario|passador|cruzamento/.test(skills)) bonus+=.11;
  if(action.tags.includes('defending') && /intercept|bloqueador|marcacao|carrinho|esticada|fortaleza/.test(skills)) bonus+=.12;
  if(action.tags.includes('aerial') && /cabec|superioridade aerea|fortaleza aerea/.test(skills)) bonus+=.16;
  if(action.tags.includes('goalkeeper') && /goleiro|penalti|comandante|rugido/.test(skills)) bonus+=.13;
  if(action.tags.includes('stamina') && /espirito guerreiro|lideranca|garra/.test(skills)) bonus+=.07;
  // Estilo é apenas evidência secundária; nunca cria uma identidade sozinho.
  if(action.tags.includes('finishing') && /artilheiro|homem de area|pivo|puxa marcacao/.test(style)) bonus+=.025;
  if(action.tags.includes('creation') && /orquestrador|armador|classico|criativo/.test(style)) bonus+=.025;
  if(action.tags.includes('defending') && /destruidor|primeiro volante|defensor|lateral defensivo/.test(style)) bonus+=.025;
  if(action.tags.includes('aerial') && /homem de area|pivo/.test(style) && natural>=80) bonus+=.015;
  return bonus;
}

function naturalActionFrequency(action:ActionDef,parsed:ParsedCard) {
  const relevance=positionRelevance(action,parsed);
  if(relevance<=0) return 0;
  const natural=average(action.attrs.map(k=>attr(parsed.attributes,k)));
  // A carta ganha peso nas ações que já executa bem. Isso evita "corrigir a fraqueza" só porque ela está baixa.
  const identity=Math.pow(clamp((natural-48)/52,0,1),1.35);
  let frequency=relevance*(.22+.78*identity)+actionEvidence(action,parsed,natural);
  if(action.tags.includes('aerial')) {
    const aerial=average(['heading','jump','physicalContact'].map(k=>attr(parsed.attributes,k as AttributeKey)));
    const aerialProof=/cabec|superioridade aerea|fortaleza aerea/.test(skillText(parsed));
    if(aerial<76 && !aerialProof) frequency*=.42;
    else if(aerial>=84 || aerialProof) frequency*=1.12;
  }
  return clamp(frequency,0,1.25);
}

function projectedAttributes(parsed:ParsedCard,plan:TrainingPlan):Attributes {
  const out:Attributes={...parsed.attributes};
  for(const [group,keys] of Object.entries(TRAINING_ATTRIBUTES) as Array<[TrainingKey,AttributeKey[]]>) {
    const level=Number(plan[group]??0);
    if(!level) continue;
    for(const key of keys) out[key]=clamp(attr(parsed.attributes,key)+level,1,99);
  }
  return out;
}

function groupNaturalStrength(parsed:ParsedCard,key:TrainingKey) {
  return average(TRAINING_ATTRIBUTES[key].map(a=>attr(parsed.attributes,a)));
}

function evaluatePlan(parsed:ParsedCard,plan:TrainingPlan, actionFrequencies:Map<string,number>) {
  const projected=projectedAttributes(parsed,plan);
  let weighted=0, weightTotal=0, improvement=0;
  const details:CleanSlateActionR119[]=[];
  for(const action of ACTIONS) {
    const frequency=actionFrequencies.get(action.id)??0;
    if(frequency<=.01) continue;
    const natural=average(action.attrs.map(k=>attr(parsed.attributes,k)));
    const projectedScore=average(action.attrs.map(k=>attr(projected,k)));
    weighted+=projectedScore*frequency;
    improvement+=(projectedScore-natural)*frequency;
    weightTotal+=frequency;
    details.push({id:action.id,label:action.label,naturalScore:round1(natural),projectedScore:round1(projectedScore),frequency:round1(frequency*100),contribution:round1(projectedScore*frequency)});
  }
  const actionScore=weightTotal?weighted/weightTotal:0;
  const actionGain=weightTotal?improvement/weightTotal:0;
  let identityBonus=0, weakRepairPenalty=0, excessPenalty=0;
  for(const key of Object.keys(plan) as TrainingKey[]) {
    const level=Number(plan[key]??0); if(!level) continue;
    const strength=groupNaturalStrength(parsed,key);
    const impacted=ACTIONS.filter(a=>TRAINING_ATTRIBUTES[key].some(attrKey=>a.attrs.includes(attrKey))).reduce((sum,a)=>sum+(actionFrequencies.get(a.id)??0),0);
    identityBonus += level*Math.pow(strength/100,1.8)*Math.min(1.25,impacted*.22)*.12;
    if(strength<60 && impacted<1.05) weakRepairPenalty += level*(60-strength)*.018;
    if(level>12 && strength<82) excessPenalty += (level-12)*.7;
  }
  const aerialLevel=plan.aerialStrength??0;
  const aerialSupport=actionFrequencies.get('aerial_finish')??0;
  if(aerialLevel>=10 && aerialSupport<.62) excessPenalty+=(aerialLevel-9)*1.15;
  const score=actionScore+actionGain*.55+identityBonus-weakRepairPenalty-excessPenalty;
  return { score, actionScore, actionGain, details:details.sort((a,b)=>b.contribution-a.contribution) };
}

function planSignature(plan:TrainingPlan) {
  return Object.entries(plan).map(([k,v])=>`${k}:${v}`).join('|');
}

function insertBeam(list:BeamState[],state:BeamState,width:number) {
  const previous=list.findIndex(x=>x.signature===state.signature);
  if(previous>=0) { if(state.score>list[previous].score) list[previous]=state; }
  else list.push(state);
  list.sort((a,b)=>b.score-a.score || a.signature.localeCompare(b.signature));
  if(list.length>width) list.length=width;
}

function optimizeTraining(parsed:ParsedCard,budget:number) {
  const frequencies=new Map(ACTIONS.map(a=>[a.id,naturalActionFrequency(a,parsed)]));
  const allowed=parsed.mainPosition==='GK'?GK_KEYS:FIELD_KEYS;
  const byCost:Array<BeamState[]>=Array.from({length:budget+1},()=>[]);
  const zero=emptyTraining();
  byCost[0].push({plan:zero,score:evaluatePlan(parsed,zero,frequencies).score,signature:planSignature(zero)});
  let candidates=1;
  const BEAM=20;
  for(let cost=0;cost<=budget;cost++) {
    const states=byCost[cost];
    if(!states.length) continue;
    for(const state of states) {
      for(const key of allowed) {
        const current=state.plan[key]??0;
        if(current>=16) continue;
        const next=current+1;
        const step=trainingLevelCost(next);
        const target=cost+step;
        if(target>budget) continue;
        const plan={...state.plan,[key]:next};
        const evaluated=evaluatePlan(parsed,plan,frequencies);
        insertBeam(byCost[target],{plan,score:evaluated.score,signature:planSignature(plan)},BEAM);
        candidates++;
      }
    }
  }
  let chosen=byCost[budget][0];
  if(!chosen) {
    for(let cost=budget;cost>=0&&!chosen;cost--) chosen=byCost[cost][0];
  }
  const plan=chosen?.plan??zero;
  return {plan,candidates,frequencies,evaluation:evaluatePlan(parsed,plan,frequencies)};
}

function naturalActionDetails(parsed:ParsedCard):CleanSlateActionR119[] {
  return ACTIONS
    .map((action)=>{
      const frequency=naturalActionFrequency(action,parsed);
      const natural=average(action.attrs.map(k=>attr(parsed.attributes,k)));
      return {
        id:action.id,
        label:action.label,
        naturalScore:round1(natural),
        projectedScore:round1(natural),
        frequency:round1(frequency*100),
        contribution:round1(natural*frequency)
      };
    })
    .filter(action=>action.frequency>1)
    .sort((a,b)=>b.contribution-a.contribution)
    .slice(0,12);
}

function categoryScores(actions:CleanSlateActionR119[]) {
  const map=new Map<string,number>();
  const put=(key:string,value:number)=>map.set(key,Math.max(map.get(key)??0,value));
  for(const action of actions) {
    const value=action.frequency;
    if(['attack_space'].includes(action.id)) put('movement',value);
    if(['finish_box','turn_finish','long_finish'].includes(action.id)) put('finishing',value);
    if(['close_control','carry','turn_finish'].includes(action.id)) put('dribble',value);
    if(['short_creation','through_creation','build_out','cross_support'].includes(action.id)) put('passing',value);
    if(['hold_up','defensive_duel'].includes(action.id)) put('physical',value);
    if(['aerial_finish'].includes(action.id)) put('aerial',value);
    if(['press_recover','intercept','defensive_duel','cover_space'].includes(action.id)) put('defense',value);
    if(['press_recover','cover_space','cross_support'].includes(action.id)) put('stamina',value);
    if(['gk_position','gk_reflex','gk_secure'].includes(action.id)) put('goalkeeper',value);
  }
  return map;
}

function skillCategory(name:string):string[] {
  const s=norm(name);
  if(/pegador de penalti|arremesso longo do goleiro|reposicao alta do goleiro|reposicao baixa do goleiro/.test(s)) return ['goalkeeper'];
  if(/toque duplo|elastico|giro|chapeu|corte|puxada|finta|sola|malicia/.test(s)) return ['dribble'];
  if(/cabecada|superioridade aerea/.test(s)) return ['aerial'];
  if(/efeito de longe|cavadinha|chute com o peito|folha seca|chute ascendente|precisao a distancia|finalizacao acrobatica|chute de primeira|penalti/.test(s)) return ['finishing'];
  if(/passe|cruzamento|curva para fora|de letra|sem olhar|arremesso lateral/.test(s)) return ['passing'];
  if(/marcacao|volta para marcar|interceptacao|bloqueador|carrinho|afastamento/.test(s)) return ['defense'];
  if(/espirito guerreiro/.test(s)) return ['stamina','physical'];
  if(/lideranca/.test(s)) return ['stamina'];
  if(/super substituto/.test(s)) return ['movement','finishing'];
  if(/toque de calcanhar/.test(s)) return ['dribble','passing'];
  return ['dribble','passing'];
}

function recommendTop5(parsed:ParsedCard,actions:CleanSlateActionR119[]) {
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const cats=categoryScores(actions);
  const gk=parsed.mainPosition==='GK';
  const position=parsed.mainPosition;
  const style=norm(`${parsed.playstyle??''} ${parsed.offensivePlaystyle??''} ${parsed.defensivePlaystyle??''}`);
  const scored=OFFICIAL_ADDITIONAL_SKILL_NAMES
    .filter(name=>!owned.has(skillIdentityKey(name)))
    .filter(name=>isRoleCompatibleAdditionalSkill(name,position))
    .filter(name=>gk ? /goleiro|pegador|lideranca|espirito guerreiro/i.test(norm(name)) : !/goleiro|pegador de penalti/i.test(norm(name)))
    .map((name,index)=>{
      const categories=skillCategory(name);
      let score=average(categories.map(c=>cats.get(c)??18));
      if(name==='Passe de primeira') score+=(cats.get('passing')??0)*.1;
      if(name==='Chute de primeira') score+=(cats.get('finishing')??0)*.12;
      if(name==='Toque duplo' || name==='Controle com a sola') score+=(cats.get('dribble')??0)*.11;
      if(name==='Interceptação' || name==='Bloqueador') score+=(cats.get('defense')??0)*.12;
      if(name==='Cabeçada' || name==='Superioridade aérea') score+=(cats.get('aerial')??0)*.12;

      // O estilo oficial atua apenas como desempate secundário do Top 5.
      // Ele nunca altera a ficha de progressão nem substitui o DNA natural.
      if(/goleiro ofensivo/.test(style)) {
        if(/Reposição baixa do goleiro|Reposição alta do goleiro|Arremesso longo do goleiro/.test(name)) score+=7;
      } else if(/goleiro defensivo/.test(style)) {
        if(/Pegador de pênalti|Liderança|Espírito guerreiro/.test(name)) score+=7;
      }
      if(/defensor criativo/.test(style)) {
        if(skillCategory(name).includes('passing')) score+=9;
        if(name==='Passe de primeira' || name==='Passe em profundidade') score+=3;
      } else if(/destruidor/.test(style)) {
        if(skillCategory(name).includes('defense') || skillCategory(name).includes('physical')) score+=9;
        if(name==='Bloqueador' || name==='Marcação individual' || name==='Carrinho' || name==='Afastamento acrobático') score+=3;
      }
      if(/primeiro volante/.test(style)) {
        if(skillCategory(name).includes('defense') || name==='Passe de primeira' || name==='Passe em profundidade') score+=3.5;
      }
      if(/orquestrador|armador criativo|classico/.test(style)) {
        if(skillCategory(name).includes('passing')) score+=3;
      }
      return {name,score,index};
    })
    .sort((a,b)=>b.score-a.score || a.index-b.index);
  if(gk) return scored.slice(0,5).map(x=>x.name);

  // r119: diversidade funcional. Uma carta não deve gastar os cinco slots em
  // uma única família só porque uma ação correlata ficou no topo do score.
  // O limite é genérico (não é receita por jogador/estilo) e força o Top 5 a
  // complementar pelo menos duas dimensões do DNA natural da carta.
  const selected:typeof scored=[];
  const familyCount=new Map<string,number>();
  for(const candidate of scored){
    const family=skillCategory(candidate.name)[0]??'other';
    if((familyCount.get(family)??0)>=2) continue;
    selected.push(candidate);
    familyCount.set(family,(familyCount.get(family)??0)+1);
    if(selected.length===5) break;
  }
  // Catálogo curto: complete sem duplicar habilidade; o limite de família é
  // relaxado somente quando não há cinco alternativas oficiais compatíveis.
  if(selected.length<Math.min(5,scored.length)){
    for(const candidate of scored){
      if(selected.some(item=>item.name===candidate.name)) continue;
      selected.push(candidate);
      if(selected.length===Math.min(5,scored.length)) break;
    }
  }
  return selected.map(x=>x.name);
}


function skillIntegrityR119(input:AnalysisResult, parsed:ParsedCard, top5:string[]) {
  const ownedSkills=[...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])];
  const owned=new Set(ownedSkills.map(skillIdentityKey));
  const available=OFFICIAL_ADDITIONAL_SKILL_NAMES
    .filter(name=>isRoleCompatibleAdditionalSkill(name,parsed.mainPosition))
    .filter(name=>!owned.has(skillIdentityKey(name))).length;
  const expected=Math.min(5,available);
  const officialOnly=top5.every(name=>OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(name as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
  const unique=new Set(top5.map(skillIdentityKey)).size===top5.length;
  const noOwned=top5.every(name=>!owned.has(skillIdentityKey(name)));
  const roleCompatible=top5.every(name=>isRoleCompatibleAdditionalSkill(name,parsed.mainPosition));
  const complete=top5.length===expected;
  const approved=officialOnly&&unique&&noOwned&&roleCompatible&&complete&&input.validation.level!=='blocked';
  return {
    version:'40.80-r119-clean-slate-final-skill-integrity',
    status:approved?'approved' as const:'review' as const,
    ownedSkills:[...new Set(ownedSkills)],
    recommendedSkills:[...top5],
    removedDuplicates:[],
    missingSlots:Math.max(0,expected-top5.length),
    checks:[
      officialOnly?'Somente habilidades adicionais oficiais foram usadas.':'Há habilidade fora do catálogo oficial.',
      noOwned?'Nenhuma habilidade recomendada já existe na carta.':'Foi detectada habilidade já possuída.',
      unique?'Top 5 sem duplicatas internas.':'Há duplicata interna no Top 5.',
      roleCompatible?`Compatibilidade validada pela posição natural ${parsed.mainPosition}.`:`Há habilidade incompatível com ${parsed.mainPosition}.`,
      complete?`Foram entregues ${top5.length}/${expected} opções oficiais disponíveis.`:`Foram entregues ${top5.length}/${expected}; revisar leitura/catálogo.`,
      'Ímpetos foram avaliados em trilhas separadas das habilidades adicionais.',
      'A formação e a posição selecionada não reescrevem as habilidades permanentes da carta.'
    ]
  };
}

function impetoCategories(name:string):string[] {
  const s=norm(name);
  if(/goleiro|guardiao|defesaca/.test(s)) return ['goalkeeper'];
  if(/chute|instinto artilheiro|precisao/.test(s)) return ['finishing'];
  if(/cobranca de falta/.test(s)) return ['finishing','passing'];
  if(/disputa aerea|bloqueio aereo/.test(s)) return ['aerial'];
  if(/passe|criador ofensivo|volante criativo|reconstrucao|cruzamento/.test(s)) return ['passing'];
  if(/conducao|tecnica|fantasista|protecao de posse/.test(s)) return ['dribble'];
  if(/defesa|roubo de bola/.test(s)) return ['defense'];
  if(/duelo|fisicalidade|forca|rompe-barreira/.test(s)) return ['physical'];
  if(/agilidade|movimento sem a bola|transicao ofensiva/.test(s)) return ['movement'];
  if(/motor do time/.test(s)) return ['stamina','passing'];
  return ['movement','dribble','passing','finishing','defense'];
}

function recommendImpetosR119(parsed:ParsedCard,actions:CleanSlateActionR119[]) {
  const current=parsed.impetos?.find(i=>i.active!==false)?.name ?? parsed.impetos?.[0]?.name ?? null;
  if(current) return {current,decision:'KEEP_CURRENT' as const,recommendations:[] as ImpetoRecommendation[]};
  const slot=parsed.evidence?.impetoSlotStatus;
  if(slot==='OCUPADO'||slot==='SEM_VAGA') return {current:null,decision:'SLOT_NOT_AVAILABLE' as const,recommendations:[] as ImpetoRecommendation[]};
  if(slot!=='DISPONIVEL') return {current:null,decision:'NO_SAFE_IMPETO' as const,recommendations:[] as ImpetoRecommendation[]};
  const cats=categoryScores(actions);
  const gk=parsed.mainPosition==='GK';
  const scored=RECOGNIZABLE_IMPETO_NAMES
    .filter(name=>gk?/goleiro|guardiao|defesaca|agilidade|fisicalidade|forca/i.test(norm(name)):!/goleiro|guardiao|defesaca/i.test(norm(name)))
    .map(name=>({name,score:average(impetoCategories(name).map(c=>cats.get(c)??18))}))
    .sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name));
  const best=scored[0];
  if(!best||best.score<52) return {current:null,decision:'NO_SAFE_IMPETO' as const,recommendations:[] as ImpetoRecommendation[]};
  const recommendations=scored.slice(0,3).map((item,index):ImpetoRecommendation=>({
    name:item.name,
    tier:index===0?'ideal':'alternativo',
    attributes:impetoCategories(item.name),
    reason:`Clean Slate r119: compatibilidade ${Math.round(item.score)}/100 com as ações mais frequentes desta carta.`,
    score:round1(item.score),
    confidence:round1(clamp(item.score*.72+normalizedConfidence(parsed)*.28)),
    official:true,
    evidence:['DNA natural da carta','ações funcionais de maior frequência','Ímpeto atual ausente','vaga de Ímpeto confirmada']
  }));
  return {current:null,decision:'RECOMMEND_NEW' as const,recommendations};
}

function dominantDna(actions:CleanSlateActionR119[]) {
  const cats=categoryScores(actions);
  const labels:Record<string,string>={finishing:'finalização',movement:'mobilidade',dribble:'controle/condução',passing:'criação',physical:'físico',aerial:'jogo aéreo',defense:'defesa',stamina:'resistência',goalkeeper:'goleiro'};
  return [...cats.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>labels[k]??k);
}

export function applyCleanSlatePerformance2027R119(input:AnalysisResult, rawSnapshot?:ParsedCard):WithR119 {
  const parsed:ParsedCard=rawSnapshot ? JSON.parse(JSON.stringify(rawSnapshot)) as ParsedCard : JSON.parse(JSON.stringify(input.parsed)) as ParsedCard;
  const budgetCandidate=Number(parsed.trainingPointsTotal ?? input.trainingPointsTotal ?? 0);
  const budget=Number.isFinite(budgetCandidate)&&budgetCandidate>0?Math.round(budgetCandidate):0;
  const confidence=normalizedConfidence(parsed);
  const attributeCount=Number(parsed.evidence?.attributeCount ?? Object.keys(parsed.attributes??{}).length);
  const minimum=parsed.mainPosition==='GK'?4:10;
  if(!budget || attributeCount<minimum) {
    const zero=emptyTraining();
    // Ficha e Top 5 têm requisitos de evidência diferentes. Uma leitura curta
    // pode ser insuficiente para distribuir pontos com segurança, mas ainda
    // conter posição, habilidades já possuídas e atributos suficientes para
    // ordenar habilidades adicionais oficiais sem recorrer a receita legada.
    const actions=naturalActionDetails(parsed);
    const top5=recommendTop5(parsed,actions);
    const skillIntegrity=skillIntegrityR119(input,parsed,top5);
    const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
    const duplicatesBlocked=top5.every(s=>!owned.has(skillIdentityKey(s)))&&new Set(top5.map(skillIdentityKey)).size===top5.length;
    const dna=dominantDna(actions);
    const analysis:CleanSlate2027R119={
      version:CLEAN_SLATE_2027_R119_VERSION,authority:'CLEAN_SLATE_SINGLE_WRITER',source:'RAW_CARD_SNAPSHOT',status:'BLOCKED_INSUFFICIENT_DATA',cardKey:cardKey(parsed),positionAnchor:parsed.mainPosition,budget,training:zero,candidateCount:0,score:0,responseScore:0,synergyScore:0,confidence:round1(confidence),dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,currentImpeto:parsed.impetos?.[0]?.name??null,impetoDecision:parsed.impetos?.length?'KEEP_CURRENT':'NO_SAFE_IMPETO',recommendedImpeto:null,guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget:false,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:true,selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true},reasons:['Leitura insuficiente para gerar uma ficha Clean Slate segura; a ficha antiga não foi usada como fallback.','Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']};
    return {...input,parsed,training:zero,trainingCost:trainingPlanCost(zero),trainingPointsUsed:0,trainingPointsTotal:budget,trainingPointsRemaining:budget,recommendedSkills:top5,recommendedImpetos:[],skillIntegrity,cleanSlate2027R119:analysis,recommendationExplanation:[`r119 bloqueou apenas a ficha por dados insuficientes; Top 5 seguro: ${top5.join(', ')||'indisponível'}.`,'Nenhum motor legado foi usado como fallback.',...input.recommendationExplanation]} as WithR119;
  }
  const optimized=optimizeTraining(parsed,budget);
  const training=optimized.plan;
  const spent=trainingPlanTotalCost(training);
  const actions=optimized.evaluation.details.slice(0,12);
  const top5=recommendTop5(parsed,actions);
  const impeto=recommendImpetosR119(parsed,actions);
  const skillIntegrity=skillIntegrityR119(input,parsed,top5);
  const owned=new Set([...(parsed.nativeSkills??[]),...(parsed.additionalSkills??[]),...(parsed.specialSkills??[])].map(skillIdentityKey));
  const duplicatesBlocked=top5.every(s=>!owned.has(skillIdentityKey(s)))&&new Set(top5.map(skillIdentityKey)).size===top5.length;
  const exactBudget=spent===budget;
  const score=round1(clamp(optimized.evaluation.score));
  const response=round1(clamp(optimized.evaluation.actionScore));
  const synergy=round1(clamp(score*.62+confidence*.38));
  const dna=dominantDna(actions);
  const analysis:CleanSlate2027R119={
    version:CLEAN_SLATE_2027_R119_VERSION,authority:'CLEAN_SLATE_SINGLE_WRITER',source:'RAW_CARD_SNAPSHOT',status:'READY',cardKey:cardKey(parsed),positionAnchor:parsed.mainPosition,budget,training,candidateCount:optimized.candidates,score,responseScore:response,synergyScore:synergy,confidence:round1(confidence),dominantDna:dna,specialSkills:[...(parsed.specialSkills??[])],actions,top5,currentImpeto:impeto.current,impetoDecision:impeto.decision,recommendedImpeto:impeto.recommendations[0]?.name??null,guards:{ignoresIncomingTraining:true,ignoresOverall:true,noFloorPeakCeiling:true,rawSnapshotProtected:true,exactBudget,ownedSkillDuplicatesBlocked:duplicatesBlocked,existingImpetoNeverRepeated:!impeto.current||!impeto.recommendations.some(x=>norm(x.name)===norm(impeto.current)),selectedPositionDoesNotRewriteSignature:true,legacyEnginesReadOnly:true},reasons:[
      `Clean Slate r119 avaliou ${optimized.candidates} estados com beam limitado e orçamento ${spent}/${budget}.`,
      `DNA dominante: ${dna.join(' + ')||'em revisão'}.`,
      'A pontuação favorece ações que a carta já executa naturalmente; não tenta elevar o atributo mais fraco só porque ele está abaixo de um alvo.',
      'Posição selecionada, overall, ficha recebida e pesos floor/peak/ceiling não participam da assinatura permanente.'
    ]
  };
  return {
    ...input,
    parsed,
    training,
    trainingCost:trainingPlanCost(training),
    trainingPointsUsed:spent,
    trainingPointsTotal:budget,
    trainingPointsRemaining:Math.max(0,budget-spent),
    recommendedSkills:top5,
    recommendedImpetos:impeto.recommendations,
    skillIntegrity,
    cleanSlate2027R119:analysis,
    recommendationExplanation:[
      `Motor final: Clean Slate r119 • ${score}/100 • resposta ${response}/100 • sinergia ${synergy}/100.`,
      `Ficha calculada do zero pelo snapshot cru da carta: ${spent}/${budget} pontos.`,
      `Top 5 r119: ${top5.join(', ')||'leitura insuficiente'}.`,
      impeto.current?`Ímpeto atual preservado: ${impeto.current}.`:impeto.recommendations[0]?`Ímpeto r119: ${impeto.recommendations[0].name}.`:'Ímpeto r119: nenhum gasto seguro confirmado.',
      ...analysis.reasons,
      ...input.recommendationExplanation
    ].filter((x,i,a)=>a.indexOf(x)===i).slice(0,112)
  } as WithR119;
}
