import assert from 'node:assert/strict';
import { applyPerformanceEngine2027R107, ATTRIBUTE_GROUPS_R107 } from '../src/lib/performanceEngine2027V4080R107';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const zeroPlan = () => ({ shooting:0, passing:0, dribbling:0, dexterity:0, lowerBodyStrength:0, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 });

function makeCard(name:string, pos:any, attrs:any, dna:any, options:any = {}) {
  const selected = options.selected ?? pos;
  const defence = options.defence ?? selected;
  const result:any = {
    parsed: {
      playerName:name, cardType:'Epic', mainPosition:pos, positions:[pos, selected],
      offensivePlaystyle: options.style ?? null, defensivePlaystyle: options.defStyle ?? null,
      attributes:attrs, physicalProfile:{}, evidence:{attributeCount:24,skillConfidence:1},
      confidence:.96, nativeSkills:[], additionalSkills:[], specialSkills:[], impetos:[], warnings:[]
    },
    bestPosition:{code:selected,label:selected,score:95},
    training: zeroPlan(), trainingPointsTotal:60, trainingPointsUsed:0, trainingPointsRemaining:60,
    recommendationExplanation:[],
    tacticalProfile: options.tacticalProfile ?? { formation:'A' }
  };
  result.canonicalCardIdentity2027R60 = {
    naturalPosition:pos, attackPosition:selected, defencePosition:defence,
    defencePositionSource: options.explicitDefence ? 'EXPLICIT':'FALLBACK_SELECTED',
    offensivePlaystyle: options.style ?? null, defensivePlaystyle: options.defStyle ?? null,
    dna,
    dominantDna:Object.entries(dna).filter(([k])=>k!=='goalkeeper').sort((a:any,b:any)=>b[1]-a[1]).slice(0,3).map((x:any)=>x[0]),
    identityConfidence:94
  };
  return result;
}

const technical = makeCard('Tecnico', 'AMF', {
  ballControl:94, dribbling:94, tightPossession:93, lowPass:86, loftedPass:82,
  offensiveAwareness:84, acceleration:88, balance:90, finishing:74, curl:80,
  speed:80, kickingPower:78, stamina:84
}, {technical:96,creation:90,finishing:76,mobility:87,physical:65,aerial:55,defending:35,stamina:84,goalkeeper:0}, {style:'Armador criativo'});

const creator = makeCard('Criador', 'AMF', {
  ballControl:87, dribbling:82, tightPossession:86, lowPass:94, loftedPass:92,
  offensiveAwareness:87, acceleration:84, balance:83, finishing:76, curl:86,
  speed:78, kickingPower:80, stamina:84
}, {technical:86,creation:97,finishing:79,mobility:82,physical:62,aerial:50,defending:32,stamina:82,goalkeeper:0}, {style:'Armador criativo'});

const t:any = applyPerformanceEngine2027R107(technical);
const c:any = applyPerformanceEngine2027R107(creator);
assert.equal(trainingPlanTotalCost(t.performanceEngine2027R107.winner.training), 60);
assert.equal(trainingPlanTotalCost(c.performanceEngine2027R107.winner.training), 60);
assert.notDeepEqual(t.performanceEngine2027R107.winner.training, c.performanceEngine2027R107.winner.training, 'cartas com DNA diferente não podem virar ficha genérica igual');
assert.equal(t.performanceEngine2027R107.winner.training.defending, 0);
assert.equal(c.performanceEngine2027R107.winner.training.defending, 0);

const sameOverallA:any = applyPerformanceEngine2027R107({...technical, parsed:{...technical.parsed, overall:91, maxOverall:101}});
const sameOverallB:any = applyPerformanceEngine2027R107({...technical, parsed:{...technical.parsed, overall:99, maxOverall:109}});
assert.deepEqual(sameOverallA.performanceEngine2027R107.winner.training, sameOverallB.performanceEngine2027R107.winner.training, 'overall não pode decidir a ficha');

const formationA:any = applyPerformanceEngine2027R107({...technical, tacticalProfile:{formation:'4-3-3',style:'POSSE_DE_BOLA'}});
const formationB:any = applyPerformanceEngine2027R107({...technical, tacticalProfile:{formation:'4-2-2-2',style:'CONTRA_ATAQUE_RAPIDO'}});
assert.deepEqual(formationA.performanceEngine2027R107.winner.training, formationB.performanceEngine2027R107.winner.training, 'formação/técnico não pode regenerar a ficha permanente');

const cmfAttrs = {
  lowPass:89, loftedPass:86, ballControl:88, tightPossession:86, dribbling:82,
  acceleration:82, balance:82, speed:80, kickingPower:78,
  defensiveAwareness:76, defensiveEngagement:78, tackling:75, aggression:76,
};
const lowStamina:any = applyPerformanceEngine2027R107(makeCard('Folego baixo','CMF',{...cmfAttrs,stamina:74},{technical:84,creation:89,finishing:65,mobility:76,physical:70,aerial:60,defending:77,stamina:72,goalkeeper:0},{style:'Meia versátil'}));
const highStamina:any = applyPerformanceEngine2027R107(makeCard('Folego alto','CMF',{...cmfAttrs,stamina:92},{technical:84,creation:89,finishing:65,mobility:88,physical:70,aerial:60,defending:77,stamina:94,goalkeeper:0},{style:'Meia versátil'}));
assert.ok(lowStamina.performanceEngine2027R107.winner.training.lowerBodyStrength >= highStamina.performanceEngine2027R107.winner.training.lowerBodyStrength, 'stamina baixa deve receber proteção pelo menos igual à stamina alta');

const cb:any = applyPerformanceEngine2027R107(makeCard('Zagueiro','CB',{
  defensiveAwareness:91,defensiveEngagement:90,tackling:90,aggression:86,physicalContact:88,jump:84,heading:87,
  speed:82,acceleration:76,stamina:82,lowPass:78,loftedPass:74,ballControl:72,dribbling:65,tightPossession:68
},{technical:68,creation:73,finishing:35,mobility:80,physical:89,aerial:87,defending:94,stamina:81,goalkeeper:0},{style:'Defensor criativo'}));
assert.equal(cb.performanceEngine2027R107.winner.training.shooting, 0);
assert.equal(cb.performanceEngine2027R107.winner.training.dribbling, 0);

assert.deepEqual(ATTRIBUTE_GROUPS_R107.gk1, ['goalkeeperAwareness','jump']);
assert.deepEqual(ATTRIBUTE_GROUPS_R107.gk2, ['goalkeeperParrying','goalkeeperReach']);
assert.deepEqual(ATTRIBUTE_GROUPS_R107.gk3, ['goalkeeperCatching','goalkeeperReflexes']);

console.log('r107 runtime aprovada: DNA-first, anti-genérica, overall/formação ignorados, stamina dinâmica e GK correto.');
