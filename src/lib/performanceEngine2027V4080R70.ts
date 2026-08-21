import type { AnalysisResult, AttributeKey, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceFoundation2027R60 } from './performanceFoundation2027V4080R60';
import { TRAINING_KEYS, trainingPlanTotalCost, trainingTotalCost } from './trainingPlanCore';

export const PERFORMANCE_ENGINE_2027_R70_VERSION = '40.80-r70-performance-engine-2027' as const;

const ATTRIBUTE_GROUPS: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['finishing','placeKicking','curl'],
  passing: ['lowPass','loftedPass'],
  dribbling: ['ballControl','dribbling','tightPossession'],
  dexterity: ['offensiveAwareness','acceleration','balance'],
  lowerBodyStrength: ['speed','kickingPower','stamina'],
  aerialStrength: ['heading','jump','physicalContact'],
  defending: ['defensiveAwareness','defensiveEngagement','tackling','aggression'],
  gk1: ['goalkeeperAwareness','goalkeeperCatching'],
  gk2: ['goalkeeperParrying','goalkeeperReflexes'],
  gk3: ['goalkeeperReach','jump']
};

export type PerformanceProfileR70 = 'PEAK' | 'BALANCED_90' | 'FLUID_PHASE';

export type PerformanceCandidateR70 = {
  profile: PerformanceProfileR70;
  training: TrainingPlan;
  exactBudget: boolean;
  totalScore: number;
  attackScore: number;
  defenceScore: number;
  transitionScore: number;
  staminaScore: number;
  identityScore: number;
  projectedStrongUntilMinute: number;
};

export type PerformanceEngine2027R70 = {
  version: typeof PERFORMANCE_ENGINE_2027_R70_VERSION;
  authority: 'SPECIALIST_READ_ONLY';
  simulationModel: 'DIGITAL_TWIN_CARD';
  budget: number;
  attackPosition: PositionCode;
  defencePosition: PositionCode;
  transitionLoad: number;
  staminaFloor: number;
  bottlenecks: TrainingKey[];
  strongestGroups: TrainingKey[];
  baseline: PerformanceCandidateR70;
  winner: PerformanceCandidateR70;
  alternatives: PerformanceCandidateR70[];
  improvementVsIncoming: number;
  confidence: number;
  guards: {
    exactBudget: boolean;
    masterEngineIsOnlyWriter: true;
    overallIgnored: true;
    phaseAware: true;
    staminaProtected: boolean;
    diminishingReturns: true;
    bottleneckAware: true;
  };
};

export type WithPerformanceEngineR70 = AnalysisResult & {
  performanceEngine2027R70: PerformanceEngine2027R70;
};

type FoundationCarrier = AnalysisResult & {
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceFoundation2027R60?: PerformanceFoundation2027R60;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
function round1(value: number) { return Math.round(value * 10) / 10; }
function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function mean(values: Array<number | null | undefined>) {
  const safe = values.map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return safe.length ? safe.reduce((sum,value)=>sum+value,0) / safe.length : 0;
}
function emptyPlan(): TrainingPlan {
  return { shooting:0, passing:0, dribbling:0, dexterity:0, lowerBodyStrength:0, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 };
}
function groupAverage(result: AnalysisResult, key: TrainingKey) {
  return mean(ATTRIBUTE_GROUPS[key].map((attribute)=>Number(result.parsed.attributes[attribute] ?? 0)));
}

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  GK:{gk1:3.0,gk2:3.2,gk3:3.1,aerialStrength:.65,lowerBodyStrength:.4},
  CB:{defending:3.1,aerialStrength:1.75,lowerBodyStrength:1.5,dexterity:.9,passing:.8},
  LB:{defending:1.9,lowerBodyStrength:1.65,dexterity:1.35,passing:1.25,dribbling:.8,aerialStrength:.35},
  RB:{defending:1.9,lowerBodyStrength:1.65,dexterity:1.35,passing:1.25,dribbling:.8,aerialStrength:.35},
  DMF:{defending:2.65,passing:1.55,lowerBodyStrength:1.55,dexterity:.85,aerialStrength:.75,dribbling:.45},
  CMF:{passing:1.9,lowerBodyStrength:1.35,defending:1.25,dexterity:1.15,dribbling:1.0,shooting:.45,aerialStrength:.25},
  LMF:{passing:1.55,lowerBodyStrength:1.55,dexterity:1.4,dribbling:1.3,defending:.75,shooting:.45},
  RMF:{passing:1.55,lowerBodyStrength:1.55,dexterity:1.4,dribbling:1.3,defending:.75,shooting:.45},
  AMF:{passing:2.3,dribbling:2.05,dexterity:1.55,shooting:.95,lowerBodyStrength:.65},
  SS:{dexterity:2.2,dribbling:1.95,shooting:1.55,passing:1.35,lowerBodyStrength:.9,aerialStrength:.25},
  CF:{shooting:2.45,dexterity:2.0,lowerBodyStrength:1.35,dribbling:.85,passing:.45,aerialStrength:.75},
  LWF:{dribbling:2.35,dexterity:2.15,lowerBodyStrength:1.45,shooting:1.05,passing:.8},
  RWF:{dribbling:2.35,dexterity:2.15,lowerBodyStrength:1.45,shooting:1.05,passing:.8}
};

function positionWeight(position: PositionCode, key: TrainingKey) {
  return Number(POSITION_WEIGHTS[position]?.[key] ?? 0.05);
}

function styleWeights(styleValue: string | null | undefined, phase: 'ATTACK'|'DEFENCE', key: TrainingKey) {
  const style = normalize(styleValue);
  let score = 0;
  const add = (pattern: RegExp, weights: Partial<Record<TrainingKey, number>>) => {
    if (pattern.test(style)) score += Number(weights[key] ?? 0);
  };
  if (phase === 'ATTACK') {
    add(/artilheiro|goal poacher/,{shooting:1.8,dexterity:1.45,lowerBodyStrength:.65});
    add(/puxa marcacao|deep lying forward/,{passing:1.35,dribbling:1.1,dexterity:.85});
    add(/homem de area|fox in the box/,{shooting:1.75,dexterity:.95,aerialStrength:.7});
    add(/pivo|target man|atacante pivo/,{passing:1.0,aerialStrength:1.25,lowerBodyStrength:1.05,shooting:.7});
    add(/armador criativo|creative playmaker/,{passing:1.75,dribbling:1.5,dexterity:.7});
    add(/meia versatil|box.to.box/,{lowerBodyStrength:1.25,passing:1.05,dexterity:.75,defending:.65});
    add(/orquestrador|orchestrator/,{passing:1.85,dribbling:.7,lowerBodyStrength:.55});
    add(/jogador de infiltracao|hole player/,{dexterity:1.55,shooting:1.0,dribbling:.75,lowerBodyStrength:.7});
    add(/classico|classic no/,{passing:1.55,dribbling:1.15,dexterity:.5});
    add(/lateral ofensivo|lateral atacante|lateral movel|offensive full|roaming flank/,{lowerBodyStrength:1.35,dexterity:1.05,passing:1.1,dribbling:.75});
  } else {
    add(/destruidor|destroyer/,{defending:2.2,lowerBodyStrength:1.25,aerialStrength:.7,dexterity:.45});
    add(/defensor criativo|build up/,{defending:1.85,passing:1.1,aerialStrength:.55,lowerBodyStrength:.55});
    add(/primeiro volante|anchor man/,{defending:2.15,passing:.9,lowerBodyStrength:1.05,aerialStrength:.55});
    add(/lateral defensivo|defensive full/,{defending:1.95,lowerBodyStrength:1.05,passing:.6});
    add(/goleiro ofensivo|offensive goalkeeper/,{gk2:1.4,gk3:1.2,lowerBodyStrength:.4});
    add(/goleiro defensivo|defensive goalkeeper/,{gk1:1.3,gk2:1.25,gk3:1.1});
  }
  return score;
}

function physicalBias(result: AnalysisResult, key: TrainingKey) {
  const p = result.parsed.physicalProfile;
  let score = 0;
  const longLegs = Number(p.legLength ?? 0) >= 8 || Number(p.legCoverageRadius ?? 0) >= 176;
  const strongFrame = Number(p.shoulderWidth ?? 0) >= 7 || Number(p.thighSize ?? 0) >= 9 || Number(p.calfSize ?? 0) >= 11 || Number(p.trunkCollision ?? 0) >= 49;
  const highJump = Number(p.jumpHeight ?? 0) >= 250;
  const compact = Number(p.baseHeight ?? result.parsed.height ?? 0) > 0 && Number(p.baseHeight ?? result.parsed.height ?? 0) <= 176;
  if (longLegs && key === 'defending') score += .65;
  if (longLegs && key === 'lowerBodyStrength') score += .35;
  if (strongFrame && key === 'aerialStrength') score += .8;
  if (strongFrame && key === 'lowerBodyStrength') score += .7;
  if (highJump && key === 'aerialStrength') score += 1.0;
  if (compact && key === 'dribbling') score += .55;
  if (compact && key === 'dexterity') score += .65;
  return score;
}

function transitionDistance(a: PositionCode, b: PositionCode) {
  const point: Record<PositionCode,[number,number]> = {
    GK:[0,0], CB:[0,2], LB:[-2,2], RB:[2,2], DMF:[0,4], CMF:[0,5], LMF:[-2,5], RMF:[2,5], AMF:[0,7], SS:[0,8], CF:[0,10], LWF:[-2,9], RWF:[2,9]
  };
  const [ax,ay]=point[a], [bx,by]=point[b];
  return Math.sqrt((ax-bx)**2 + (ay-by)**2);
}

function transitionLoad(identity: CanonicalCardIdentityR60) {
  const distance = transitionDistance(identity.attackPosition, identity.defencePosition);
  const styleSwitch = normalize(identity.offensivePlaystyle) !== normalize(identity.defensivePlaystyle) ? 8 : 0;
  return round1(clamp(22 + distance * 7 + styleSwitch, 10, 100));
}

function staminaFloor(result: AnalysisResult, identity: CanonicalCardIdentityR60, load: number) {
  const currentFloor = result.matchStaminaV4080R44?.adjusted ? Number(result.training.lowerBodyStrength ?? 0) : 0;
  const naturalStamina = Number(result.parsed.attributes.stamina ?? 0);
  const highWorkPositions = ['LB','RB','LMF','RMF','CMF','DMF'].includes(identity.attackPosition) || ['LB','RB','LMF','RMF','CMF','DMF'].includes(identity.defencePosition);
  let floor = currentFloor;
  if (load >= 65 || highWorkPositions) floor = Math.max(floor, naturalStamina < 82 ? 9 : naturalStamina < 88 ? 8 : 7);
  else if (load >= 45) floor = Math.max(floor, naturalStamina < 82 ? 8 : 6);
  return Math.min(12, floor);
}

function activeKeys(identity: CanonicalCardIdentityR60) {
  const keys = new Set<TrainingKey>();
  for (const position of [identity.attackPosition, identity.defencePosition]) {
    for (const key of TRAINING_KEYS) if (positionWeight(position,key) >= .2) keys.add(key);
  }
  return [...keys];
}

function phaseWeight(identity: CanonicalCardIdentityR60, key: TrainingKey, profile: PerformanceProfileR70) {
  const attack = positionWeight(identity.attackPosition,key) + styleWeights(identity.offensivePlaystyle,'ATTACK',key);
  const defence = positionWeight(identity.defencePosition,key) + styleWeights(identity.defensivePlaystyle,'DEFENCE',key);
  if (profile === 'PEAK') return attack * .58 + defence * .42;
  if (profile === 'BALANCED_90') return attack * .48 + defence * .52;
  return attack * .5 + defence * .5;
}

function bottleneckBoost(natural: number, baseline: number) {
  if (natural <= baseline - 12) return 1.22;
  if (natural <= baseline - 7) return 1.13;
  if (natural <= baseline - 3) return 1.06;
  if (natural >= baseline + 12) return .94;
  return 1;
}

function saturation(projected: number) {
  if (projected >= 99) return .04;
  if (projected >= 97) return .13;
  if (projected >= 95) return .32;
  if (projected >= 92) return .68;
  if (projected >= 89) return .88;
  return 1;
}

function levelUtility(result: AnalysisResult, identity: CanonicalCardIdentityR60, key: TrainingKey, level: number, baseline: number, profile: PerformanceProfileR70, load: number) {
  const natural = groupAverage(result,key);
  const phase = Math.max(.03, phaseWeight(identity,key,profile));
  const physical = physicalBias(result,key);
  const bottleneck = bottleneckBoost(natural,baseline);
  let score = 0;
  for (let current=1; current<=level; current+=1) {
    const projected = natural + current - 1;
    let marginal = (phase + physical) * bottleneck * saturation(projected);
    if (key === 'lowerBodyStrength') {
      const enduranceBonus = profile === 'BALANCED_90' ? 1.22 : profile === 'FLUID_PHASE' ? 1.14 : 1;
      marginal *= enduranceBonus * (1 + load / 420);
    }
    score += marginal;
  }
  return score;
}

function optimize(result: AnalysisResult, identity: CanonicalCardIdentityR60, profile: PerformanceProfileR70, load: number, floor: number): TrainingPlan | null {
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  if (!Number.isFinite(budget) || budget <= 0) return null;
  const keys = activeKeys(identity);
  const baseline = mean(keys.map((key)=>groupAverage(result,key)));
  type Node={score:number;plan:TrainingPlan};
  let dp:Array<Node|null>=Array.from({length:budget+1},()=>null);
  dp[0]={score:0,plan:emptyPlan()};
  for (const key of keys) {
    const next:Array<Node|null>=Array.from({length:budget+1},()=>null);
    for (let spent=0;spent<=budget;spent+=1) {
      const previous=dp[spent]; if(!previous) continue;
      for(let level=0;level<=16;level+=1) {
        if(key==='lowerBodyStrength' && level<floor) continue;
        const total=spent+trainingTotalCost(level); if(total>budget) break;
        const score=previous.score+levelUtility(result,identity,key,level,baseline,profile,load);
        if(!next[total] || score>(next[total]?.score ?? -Infinity)+1e-9) next[total]={score,plan:{...previous.plan,[key]:level}};
      }
    }
    dp=next;
  }
  return dp[budget]?.plan ?? null;
}

function scorePlan(result: AnalysisResult, identity: CanonicalCardIdentityR60, plan: TrainingPlan, load: number, floor: number, profile: PerformanceProfileR70): PerformanceCandidateR70 {
  const keys=activeKeys(identity);
  const baseline=mean(keys.map((key)=>groupAverage(result,key)));
  let attackRaw=0, defenceRaw=0;
  for(const key of keys){
    const level=Number(plan[key]??0);
    const natural=groupAverage(result,key);
    const atk=Math.max(.02,positionWeight(identity.attackPosition,key)+styleWeights(identity.offensivePlaystyle,'ATTACK',key));
    const def=Math.max(.02,positionWeight(identity.defencePosition,key)+styleWeights(identity.defensivePlaystyle,'DEFENCE',key));
    let gain=0;
    for(let i=1;i<=level;i++) gain += saturation(natural+i-1)*bottleneckBoost(natural,baseline);
    attackRaw += atk*gain; defenceRaw += def*gain;
  }
  const attackScore=clamp(60+attackRaw*1.35,45,100);
  const defenceScore=clamp(60+defenceRaw*1.35,45,100);
  const lower=Number(plan.lowerBodyStrength??0);
  const staminaNatural=Number(result.parsed.attributes.stamina??0);
  const floorPenalty = lower < floor ? (floor - lower) * 4.5 : 0;
  const staminaScore=clamp(55 + staminaNatural*.32 + lower*2.2 - load*.15 - floorPenalty,40,100);
  const transitionScore=clamp(100-load*.35 + lower*1.3,45,100);
  const identityScore=clamp(70 + identity.identityConfidence*.2 + identity.dominantDna.reduce((sum,dna)=>{
    const map:Partial<Record<keyof CanonicalCardIdentityR60['dna'],TrainingKey[]>>={technical:['dribbling','dexterity'],creation:['passing','dribbling'],finishing:['shooting','dexterity'],mobility:['dexterity','lowerBodyStrength'],physical:['lowerBodyStrength','aerialStrength'],aerial:['aerialStrength'],defending:['defending'],stamina:['lowerBodyStrength'],goalkeeper:['gk1','gk2','gk3']};
    return sum + (map[dna]??[]).reduce((s,key)=>s+Number(plan[key]??0),0)*.22;
  },0),55,100);
  const totalScore=clamp(attackScore*.32+defenceScore*.27+staminaScore*.18+transitionScore*.1+identityScore*.13,0,100);
  const minute=clamp(Math.round(55 + staminaScore*.33 + transitionScore*.08),55,90);
  return {profile,training:plan,exactBudget:trainingPlanTotalCost(plan)===Number(result.trainingPointsTotal??trainingPlanTotalCost(result.training)),totalScore:round1(totalScore),attackScore:round1(attackScore),defenceScore:round1(defenceScore),transitionScore:round1(transitionScore),staminaScore:round1(staminaScore),identityScore:round1(identityScore),projectedStrongUntilMinute:Math.round(minute)};
}

function topGroups(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const keys=activeKeys(identity);
  const scored=keys.map((key)=>({key,natural:groupAverage(result,key),fit:phaseWeight(identity,key,'FLUID_PHASE')}));
  const baseline=mean(scored.map((item)=>item.natural));
  const bottlenecks=scored.filter((item)=>item.fit>=.8 && item.natural<=baseline-3).sort((a,b)=>(a.natural-b.natural)||(b.fit-a.fit)).slice(0,3).map((item)=>item.key);
  const strongest=scored.sort((a,b)=>(b.natural-a.natural)||(b.fit-a.fit)).slice(0,3).map((item)=>item.key);
  return {bottlenecks,strongest};
}

export function applyPerformanceEngine2027R70(input: AnalysisResult): AnalysisResult {
  const carrier=input as FoundationCarrier;
  const identity=carrier.canonicalCardIdentity2027R60;
  const foundation=carrier.performanceFoundation2027R60;
  if(!identity || !foundation) return input;
  const budget=Number(input.trainingPointsTotal??trainingPlanTotalCost(input.training));
  const load=transitionLoad(identity);
  const floor=staminaFloor(input,identity,load);
  const profiles:PerformanceProfileR70[]=['PEAK','BALANCED_90','FLUID_PHASE'];
  const candidates=profiles.map((profile)=>{
    const plan=optimize(input,identity,profile,load,floor)??input.training;
    return scorePlan(input,identity,plan,load,floor,profile);
  });
  const baseline=scorePlan(input,identity,input.training,load,floor,'FLUID_PHASE');
  const unique=new Map<string,PerformanceCandidateR70>();
  for(const candidate of candidates){
    const sig=TRAINING_KEYS.map((key)=>`${key}:${candidate.training[key]??0}`).join('|');
    const previous=unique.get(sig); if(!previous || candidate.totalScore>previous.totalScore) unique.set(sig,candidate);
  }
  const ranked=[...unique.values()].sort((a,b)=>b.totalScore-a.totalScore || b.staminaScore-a.staminaScore);
  const winner=ranked[0]??baseline;
  const groups=topGroups(input,identity);
  const confidence=round1(clamp(foundation.readiness.total*.7+identity.identityConfidence*.3));
  const analysis:PerformanceEngine2027R70={
    version:PERFORMANCE_ENGINE_2027_R70_VERSION,
    authority:'SPECIALIST_READ_ONLY',
    simulationModel:'DIGITAL_TWIN_CARD',
    budget,
    attackPosition:identity.attackPosition,
    defencePosition:identity.defencePosition,
    transitionLoad:load,
    staminaFloor:floor,
    bottlenecks:groups.bottlenecks,
    strongestGroups:groups.strongest,
    baseline,
    winner,
    alternatives:ranked.slice(1,3),
    improvementVsIncoming:round1(winner.totalScore-baseline.totalScore),
    confidence,
    guards:{
      exactBudget:winner.exactBudget,
      masterEngineIsOnlyWriter:true,
      overallIgnored:true,
      phaseAware:true,
      staminaProtected:Number(winner.training.lowerBodyStrength??0)>=floor,
      diminishingReturns:true,
      bottleneckAware:true
    }
  };
  return {
    ...input,
    performanceEngine2027R70:analysis,
    recommendationExplanation:[
      `Performance Engine r70: ${winner.totalScore}/100, ganho estimado ${analysis.improvementVsIncoming>=0?'+':''}${analysis.improvementVsIncoming} vs ficha recebida.`,
      `Formação fluida: carga de transição ${load}/100; piso físico ${floor}; intensidade prevista até ~${winner.projectedStrongUntilMinute} min.`,
      groups.bottlenecks.length ? `Gargalos funcionais detectados: ${groups.bottlenecks.join(', ')}.` : 'Nenhum gargalo funcional forte detectado.',
      'r70 é especialista somente-leitura: apenas o Motor Mestre pode aplicar sua candidata vencedora.',
      ...input.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,84)
  } as WithPerformanceEngineR70;
}
