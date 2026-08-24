import assert from 'node:assert/strict';
import { applyPerformanceEngine2027R108, ATTRIBUTE_GROUPS_R108 } from '../src/lib/performanceEngine2027V4080R108';
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
      confidence:.97, nativeSkills: options.nativeSkills ?? [], additionalSkills:[], specialSkills:[], impetos:[], warnings:[]
    },
    bestPosition:{code:selected,label:selected,score:95},
    training: zeroPlan(), trainingPointsTotal: options.budget ?? 60, trainingPointsUsed:0, trainingPointsRemaining:options.budget ?? 60,
    recommendationExplanation:[],
    tacticalProfile: options.tacticalProfile ?? { formation:'A' }
  };
  result.canonicalCardIdentity2027R60 = {
    naturalPosition:pos, attackPosition:selected, defencePosition:defence,
    defencePositionSource: options.explicitDefence ? 'EXPLICIT':'FALLBACK_SELECTED',
    offensivePlaystyle: options.style ?? null, defensivePlaystyle: options.defStyle ?? null,
    dna,
    dominantDna:Object.entries(dna).sort((a:any,b:any)=>b[1]-a[1]).slice(0,3).map((x:any)=>x[0]),
    identityConfidence:95
  };
  return result;
}

const technical = makeCard('Tecnico extremo', 'AMF', {
  ballControl:94, dribbling:95, tightPossession:94, lowPass:86, loftedPass:80,
  offensiveAwareness:84, acceleration:90, balance:92, finishing:70, curl:79,
  speed:79, kickingPower:77, stamina:83
}, {technical:97,creation:90,finishing:68,mobility:90,physical:58,aerial:45,defending:30,stamina:82,goalkeeper:0}, {style:'Armador criativo', nativeSkills:['Duplo toque']});

const creator = makeCard('Criador extremo', 'AMF', {
  ballControl:88, dribbling:82, tightPossession:87, lowPass:95, loftedPass:93,
  offensiveAwareness:86, acceleration:84, balance:84, finishing:72, curl:85,
  speed:77, kickingPower:78, stamina:83
}, {technical:85,creation:98,finishing:70,mobility:82,physical:57,aerial:43,defending:28,stamina:82,goalkeeper:0}, {style:'Armador criativo', nativeSkills:['Passe em profundidade']});

const t:any = applyPerformanceEngine2027R108(technical);
const c:any = applyPerformanceEngine2027R108(creator);
const tw = t.performanceEngine2027R108.winner;
const cw = c.performanceEngine2027R108.winner;

assert.equal(trainingPlanTotalCost(tw.training), 60);
assert.equal(trainingPlanTotalCost(cw.training), 60);
assert.notDeepEqual(tw.training, cw.training, 'DNA/atributos/habilidades diferentes precisam produzir fichas diferentes.');
assert.equal(tw.training.defending, 0);
assert.equal(cw.training.defending, 0);
assert.ok(tw.categoryCount <= 6 && cw.categoryCount <= 6, 'r108 não pode espalhar pontos como um otimizador de overall.');
assert.ok(tw.synergyScore >= 70 && cw.synergyScore >= 70, 'ficha extrema precisa manter sinergia real alta.');

const overallLow:any = applyPerformanceEngine2027R108({...technical, parsed:{...technical.parsed, overall:90, maxOverall:100}});
const overallHigh:any = applyPerformanceEngine2027R108({...technical, parsed:{...technical.parsed, overall:105, maxOverall:110}});
assert.deepEqual(overallLow.performanceEngine2027R108.winner.training, overallHigh.performanceEngine2027R108.winner.training, 'overall não pode influenciar a ficha.');

const posA = makeCard('Posicao estável','AMF',technical.parsed.attributes,{technical:97,creation:90,finishing:68,mobility:90,physical:58,aerial:45,defending:30,stamina:82,goalkeeper:0},{style:'Armador criativo',selected:'AMF'});
const posB = makeCard('Posicao estável','AMF',technical.parsed.attributes,{technical:97,creation:90,finishing:68,mobility:90,physical:58,aerial:45,defending:30,stamina:82,goalkeeper:0},{style:'Armador criativo',selected:'SS'});
const pa:any = applyPerformanceEngine2027R108(posA);
const pb:any = applyPerformanceEngine2027R108(posB);
assert.deepEqual(pa.performanceEngine2027R108.winner.training, pb.performanceEngine2027R108.winner.training, 'trocar posição selecionada não pode reescrever o núcleo permanente da carta.');

const formationA:any = applyPerformanceEngine2027R108({...technical, tacticalProfile:{formation:'4-3-3',style:'POSSE_DE_BOLA'}});
const formationB:any = applyPerformanceEngine2027R108({...technical, tacticalProfile:{formation:'4-2-2-2',style:'CONTRA_ATAQUE_RAPIDO'}});
assert.deepEqual(formationA.performanceEngine2027R108.winner.training, formationB.performanceEngine2027R108.winner.training, 'formação/técnico não pode alterar a ficha permanente.');

const cf:any = applyPerformanceEngine2027R108(makeCard('Matador','CF',{
  offensiveAwareness:91,finishing:92,acceleration:87,speed:85,kickingPower:88,balance:80,physicalContact:82,
  ballControl:82,heading:78,jump:79,stamina:80,lowPass:68,dribbling:74,tightPossession:73,curl:80
},{technical:74,creation:60,finishing:96,mobility:87,physical:82,aerial:78,defending:20,stamina:79,goalkeeper:0},{style:'Artilheiro'}));
const cfw = cf.performanceEngine2027R108.winner;
assert.equal(cfw.training.defending, 0);
assert.ok(cfw.training.shooting > 0 && cfw.training.dexterity > 0, 'Artilheiro precisa investir no pacote finalização + movimento.');
assert.ok(cfw.training.passing <= 4, 'Artilheiro não deve gastar alto em passe só para elevar overall.');

const cb:any = applyPerformanceEngine2027R108(makeCard('Zagueiro extremo','CB',{
  defensiveAwareness:90,defensiveEngagement:89,tackling:90,aggression:86,physicalContact:87,jump:84,heading:86,
  speed:81,acceleration:76,stamina:81,lowPass:77,loftedPass:73,ballControl:72,dribbling:60,tightPossession:65
},{technical:62,creation:70,finishing:25,mobility:79,physical:88,aerial:86,defending:95,stamina:80,goalkeeper:0},{style:'Defensor criativo'}));
const cbw = cb.performanceEngine2027R108.winner;
assert.equal(cbw.training.shooting, 0);
assert.equal(cbw.training.dribbling, 0);
assert.ok(cbw.training.defending > 0, 'ZAG precisa manter defesa como núcleo.');

const gk:any = applyPerformanceEngine2027R108(makeCard('Goleiro extremo','GK',{
  goalkeeperAwareness:89,goalkeeperReflexes:91,goalkeeperReach:88,goalkeeperParrying:86,goalkeeperCatching:84,
  jump:82,stamina:70,kickingPower:78
},{technical:20,creation:20,finishing:10,mobility:50,physical:60,aerial:75,defending:35,stamina:50,goalkeeper:97},{style:'Goleiro ofensivo'}));
const gkw = gk.performanceEngine2027R108.winner;
assert.equal(gkw.training.shooting,0);
assert.equal(gkw.training.passing,0);
assert.equal(gkw.training.dribbling,0);
assert.equal(gkw.training.defending,0);
assert.ok(gkw.training.gk1 + gkw.training.gk2 + gkw.training.gk3 > 0);

assert.deepEqual(ATTRIBUTE_GROUPS_R108.gk1, ['goalkeeperAwareness','jump']);
assert.deepEqual(ATTRIBUTE_GROUPS_R108.gk2, ['goalkeeperParrying','goalkeeperReach']);
assert.deepEqual(ATTRIBUTE_GROUPS_R108.gk3, ['goalkeeperCatching','goalkeeperReflexes']);

console.log('r108 runtime aprovada: breakpoints + sinergia + resposta, sem overall/spread genérico, núcleo permanente estável.');
