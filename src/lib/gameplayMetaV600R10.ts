import type { AnalysisResult, AttributeKey, PositionCode } from './analyzerDomain';

export const GAMEPLAY_META_V600_R10_VERSION = '40.80-r10-gameplay-meta-v600' as const;

type ModeRecommendation = 'TRADICIONAL' | 'FLUIDA_LEVE' | 'FLUIDA_COMPLETA';

type Pair = { position: PositionCode; label: string; risk: 'BAIXO'|'MEDIO'|'ALTO'; reason: string };

const SAFE_MOVES: Partial<Record<PositionCode, Pair[]>> = {
  GK: [], CB:[{position:'DMF',label:'VOL',risk:'MEDIO',reason:'Só se a carta tiver passe, mobilidade e consciência suficientes.'}],
  LB:[{position:'LMF',label:'ME',risk:'BAIXO',reason:'Avanço natural pelo corredor sem abandonar totalmente o DNA lateral.'},{position:'CB',label:'ZAG',risk:'MEDIO',reason:'Seguro apenas para lateral defensivo/físico.'}],
  RB:[{position:'RMF',label:'MD',risk:'BAIXO',reason:'Avanço natural pelo corredor sem abandonar totalmente o DNA lateral.'},{position:'CB',label:'ZAG',risk:'MEDIO',reason:'Seguro apenas para lateral defensivo/físico.'}],
  DMF:[{position:'CMF',label:'MLG',risk:'BAIXO',reason:'Mudança curta entre proteção e apoio à circulação.'}],
  CMF:[{position:'DMF',label:'VOL',risk:'BAIXO',reason:'Boa dupla função para meias com resistência e leitura defensiva.'},{position:'AMF',label:'MAT',risk:'MEDIO',reason:'Vale quando controle/passe e aceleração sustentam a fase ofensiva.'}],
  LMF:[{position:'CMF',label:'MLG',risk:'BAIXO',reason:'Recolhe por dentro mantendo função de conexão.'},{position:'LB',label:'LE',risk:'MEDIO',reason:'Exige defesa, resistência e velocidade suficientes.'}],
  RMF:[{position:'CMF',label:'MLG',risk:'BAIXO',reason:'Recolhe por dentro mantendo função de conexão.'},{position:'RB',label:'LD',risk:'MEDIO',reason:'Exige defesa, resistência e velocidade suficientes.'}],
  AMF:[{position:'CMF',label:'MLG',risk:'BAIXO',reason:'Recuo curto que preserva criação e melhora a saída.'},{position:'SS',label:'SA',risk:'BAIXO',reason:'Avanço natural entre linhas.'}],
  SS:[{position:'AMF',label:'MAT',risk:'BAIXO',reason:'Recuo curto para tabelas e criação.'},{position:'CF',label:'CA',risk:'MEDIO',reason:'Depende de finalização e talento ofensivo.'}],
  CF:[{position:'SS',label:'SA',risk:'BAIXO',reason:'Recuo curto para conexão sem transformar o atacante em meio-campista.'}],
  LWF:[{position:'LMF',label:'ME',risk:'BAIXO',reason:'Recomposição pelo mesmo corredor.'},{position:'SS',label:'SA',risk:'MEDIO',reason:'Interioriza para tabelas se controle e passe forem fortes.'}],
  RWF:[{position:'RMF',label:'MD',risk:'BAIXO',reason:'Recomposição pelo mesmo corredor.'},{position:'SS',label:'SA',risk:'MEDIO',reason:'Interioriza para tabelas se controle e passe forem fortes.'}]
};

function v(r:AnalysisResult,k:AttributeKey,f=50){return Number(r.parsed.attributes[k]??f)}
function clamp(n:number){return Math.round(Math.max(0,Math.min(100,n))*10)/10}
function has(r:AnalysisResult,re:RegExp){return [...r.parsed.nativeSkills,...(r.parsed.additionalSkills??[]),...r.parsed.specialSkills].some(s=>re.test(s))}

export type GameplayMetaV600R10Analysis = {
  engineVersion: typeof GAMEPLAY_META_V600_R10_VERSION;
  scores:{ shortPassing:number; ballCarry:number; tikiTaka:number; manualDefence:number; pressResistance:number; fluidCompatibility:number; traditionalCompatibility:number; metaReadiness:number };
  formation:{ recommendation:ModeRecommendation; reason:string; safeMoves:Pair[]; warning:string };
  priorities:string[]; drills:string[]; salesSummary:string; guarantees:{doesNotFixNetwork:true;doesNotForceFluidFormation:true;preservesPlayerDna:true};
};

export function buildGameplayMetaV600R10(r:AnalysisResult):GameplayMetaV600R10Analysis{
  const passBonus=(has(r,/passe de primeira/i)?5:0)+(has(r,/passe em profundidade/i)?3:0)+(has(r,/passe na medida/i)?2:0);
  const shortPassing=clamp(v(r,'lowPass')*.38+v(r,'ballControl')*.24+v(r,'tightPossession')*.16+v(r,'balance')*.12+v(r,'offensiveAwareness')*.1+passBonus);
  const ballCarry=clamp(v(r,'ballControl')*.25+v(r,'dribbling')*.25+v(r,'tightPossession')*.22+v(r,'balance')*.16+v(r,'acceleration')*.12+(has(r,/controle com a sola/i)?4:0));
  const tikiTaka=clamp(shortPassing*.42+ballCarry*.24+v(r,'acceleration')*.12+v(r,'stamina')*.1+v(r,'offensiveAwareness')*.12+(has(r,/passe de primeira/i)?5:0));
  const existing=r.metaVivo2027V4080R8?.scores;
  const manualDefence=clamp(existing?.manualDefence ?? (v(r,'defensiveAwareness')*.3+v(r,'defensiveEngagement')*.27+v(r,'tackling')*.23+v(r,'acceleration')*.1+v(r,'stamina')*.1));
  const pressResistance=clamp(ballCarry*.42+shortPassing*.3+v(r,'balance')*.18+v(r,'physicalContact')*.1);
  const phaseBalance=existing?.phaseBalance ?? r.realPerformance2027V4080R7?.phaseProfile.phaseBalanceScore ?? 72;
  const stamina=v(r,'stamina');
  const versatility=Math.min(100,55+(r.permittedPositions?.length??1)*7-(r.avoidPositions?.length??0)*3);
  const fluidCompatibility=clamp(phaseBalance*.36+stamina*.2+versatility*.18+shortPassing*.13+manualDefence*.13);
  const traditionalCompatibility=clamp(88+(100-Math.abs(shortPassing-manualDefence))*.05-(fluidCompatibility>90?2:0));
  let recommendation:ModeRecommendation='TRADICIONAL';
  if(fluidCompatibility>=84) recommendation='FLUIDA_COMPLETA'; else if(fluidCompatibility>=72) recommendation='FLUIDA_LEVE';
  const moves=(SAFE_MOVES[r.bestPosition.code]??[]).filter(m=>m.risk!=='ALTO').slice(0,recommendation==='FLUIDA_COMPLETA'?3:2);
  const reason=recommendation==='TRADICIONAL'
    ? `A carta rende melhor preservando a função-base; compatibilidade fluída ${Math.round(fluidCompatibility)}/100.`
    : recommendation==='FLUIDA_LEVE'
      ? `A carta aceita mudança curta entre fases, mas não deve ser deslocada para uma linha totalmente diferente; compatibilidade ${Math.round(fluidCompatibility)}/100.`
      : `A carta tem resistência, versatilidade e equilíbrio de fases suficientes para dupla função real; compatibilidade ${Math.round(fluidCompatibility)}/100.`;
  const metaReadiness=clamp(shortPassing*.24+ballCarry*.22+tikiTaka*.22+manualDefence*.2+pressResistance*.12);
  const priorities=[
    shortPassing<86?'Subir passe curto/primeiro toque antes de perseguir velocidade extra.':'Passe curto já está em faixa forte: evite superinvestir.',
    ballCarry<86?'Priorizar controle, condução firme, drible e equilíbrio para carregar a bola sob pressão.':'Condução já sustenta retenção sob pressão.',
    manualDefence<82?'Reforçar leitura, dedicação, desarme e mobilidade defensiva para a marcação mais manual.':'Base defensiva manual funcional para a função atual.',
    tikiTaka>=86?'Perfil muito forte para jogo de tocou-passou, apoio curto e devolução rápida.':'Tiki-taka exige melhorar conexão curta e resposta após o primeiro toque.'
  ];
  return {engineVersion:GAMEPLAY_META_V600_R10_VERSION,scores:{shortPassing,ballCarry,tikiTaka,manualDefence,pressResistance,fluidCompatibility,traditionalCompatibility,metaReadiness},formation:{recommendation,reason,safeMoves:moves,warning:'A Formação Fluída muda a estrutura, não os atributos da carta. O app evita recomendar conversões que destruam o DNA ou exijam uma função incompatível.'},priorities,drills:['Defenda primeiro a linha de passe e só pressione quando houver cobertura.','Use um marcador por vez; a segunda pressão só entra quando não abrir o corredor central.','Na saída, faça triângulos de 3 jogadores: passe, apoio curto, devolução ou terceiro homem.','Conduza alguns metros quando o rival recuar; não transforme toda posse em passe de primeira.'],salesSummary:`Meta v6.0 ${Math.round(metaReadiness)}/100 • passe ${Math.round(shortPassing)} • condução ${Math.round(ballCarry)} • tiki-taka ${Math.round(tikiTaka)} • defesa manual ${Math.round(manualDefence)} • formação ${recommendation.replaceAll('_',' ')}`,guarantees:{doesNotFixNetwork:true,doesNotForceFluidFormation:true,preservesPlayerDna:true}};
}

export function applyGameplayMetaV600R10(r:AnalysisResult):AnalysisResult{
  const a=buildGameplayMetaV600R10(r);
  return {...r,gameplayMetaV600R10:a,recommendationExplanation:[a.salesSummary,a.formation.reason,...a.priorities,...r.recommendationExplanation].filter((x,i,all)=>all.indexOf(x)===i).slice(0,48),strengths:[`Leitura v6.0: passe ${Math.round(a.scores.shortPassing)}, condução ${Math.round(a.scores.ballCarry)}, tiki-taka ${Math.round(a.scores.tikiTaka)} e defesa manual ${Math.round(a.scores.manualDefence)}.`,...r.strengths].filter((x,i,all)=>all.indexOf(x)===i).slice(0,32)};
}
