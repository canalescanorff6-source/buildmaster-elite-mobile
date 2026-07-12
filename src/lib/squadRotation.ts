import type { AnalysisResult, PositionCode, TacticalFormation, TacticalStyle } from './analyzer';
import type { MatchState, TeamEnergy } from './gamePlan';

export const OFFICIAL_INDIVIDUAL_INSTRUCTIONS = [
  'Ofensivo',
  'Defensivo',
  'Manter posição',
  'Contra-ataque',
  'Marcação individual',
  'Marcação cerrada',
  'Linha defensiva recuada',
  'Contra-ataque nos jogadores avançados'
] as const;
export type OfficialIndividualInstruction = typeof OFFICIAL_INDIVIDUAL_INSTRUCTIONS[number];

type PlayerSummary = {
  id: string;
  name: string;
  position: PositionCode;
  positionLabel: string;
  score: number;
  stamina: number;
  speed: number;
  defense: number;
  creation: number;
  finishing: number;
  aerial: number;
  versatility: number;
};

export type BenchRole = {
  player: PlayerSummary;
  label: string;
  reason: string;
  coverage: string[];
  priority: 'alta' | 'média' | 'baixa';
};

export type RealSubstitution = {
  minute: string;
  trigger: string;
  outPlayer: string;
  inPlayer: string;
  score: number;
  gain: string;
  reason: string;
  priority: 'alta' | 'média' | 'baixa';
};

export type IndividualInstructionSuggestion = {
  player: string;
  instruction: OfficialIndividualInstruction;
  confidence: number;
  reason: string;
  warning?: string;
};

export type SquadRotationReport = {
  squadCount: number;
  starterCount: number;
  benchCount: number;
  coverageScore: number;
  rotationScore: number;
  headline: string;
  starters: PlayerSummary[];
  bench: BenchRole[];
  missingCoverage: string[];
  substitutions: RealSubstitution[];
  instructions: IndividualInstructionSuggestion[];
  locks: string[];
};

const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
const attr=(r:AnalysisResult, keys:string[])=> Math.round(keys.reduce((s,k)=>s+Number((r.parsed.attributes as Record<string,number|undefined>)[k]??0),0)/Math.max(1,keys.length));

function summarize(r:AnalysisResult, index:number):PlayerSummary {
  const p=r.bestPosition.code;
  const ratings=Object.values(r.parsed.positionRatings).filter((x):x is number=>typeof x==='number');
  const versatility=ratings.length ? clamp(ratings.filter(v=>v>=70).length*14+35) : clamp((r.permittedPositions?.length??1)*12+35);
  return {
    id:`${r.parsed.internalId||r.parsed.playerName}-${index}`,
    name:r.parsed.playerName||`Jogador ${index+1}`,
    position:p,
    positionLabel:r.bestPosition.label,
    score:clamp(Number(r.pri?.GER??r.bestPosition.score??70)),
    stamina:attr(r,['stamina']), speed:attr(r,['speed','acceleration']),
    defense:attr(r,['defensiveAwareness','defensiveEngagement','tackling','aggression']),
    creation:attr(r,['lowPass','loftedPass','ballControl','tightPossession']),
    finishing:attr(r,['finishing','offensiveAwareness','kickingPower']),
    aerial:attr(r,['heading','jump','physicalContact']), versatility
  };
}

const line=(p:PositionCode)=>p==='GK'?'GK':['CB','LB','RB'].includes(p)?'DEF':['DMF','CMF','AMF','LMF','RMF'].includes(p)?'MID':'ATT';
const ideal:Record<string,number>={GK:1,DEF:4,MID:3,ATT:3};

function starterValue(p:PlayerSummary, style:TacticalStyle){
  let v=p.score*.55+p.versatility*.08+p.stamina*.1;
  if(style==='POSSE_DE_BOLA')v+=p.creation*.22;
  else if(style==='CONTRA_ATAQUE_RAPIDO')v+=p.speed*.22+p.finishing*.08;
  else if(style==='CONTRA_ATAQUE')v+=p.defense*.1+p.aerial*.12+p.speed*.08;
  else if(style==='POR_FORA')v+=p.speed*.12+p.creation*.1+p.aerial*.06;
  else v+=p.creation*.1+p.aerial*.1;
  return v;
}

function pickStarters(players:PlayerSummary[], style:TacticalStyle){
  const used=new Set<string>(); const out:PlayerSummary[]=[];
  for(const group of ['GK','DEF','MID','ATT']){
    const qty=ideal[group];
    const candidates=players.filter(p=>line(p.position)===group).sort((a,b)=>starterValue(b,style)-starterValue(a,style));
    for(const p of candidates.slice(0,qty)){out.push(p);used.add(p.id)}
  }
  for(const p of players.filter(p=>!used.has(p.id)).sort((a,b)=>starterValue(b,style)-starterValue(a,style))){if(out.length<11){out.push(p);used.add(p.id)}}
  return out.slice(0,11);
}

function benchRole(p:PlayerSummary):BenchRole{
  const coverage=[p.positionLabel];
  if(p.versatility>=70)coverage.push('cobertura versátil');
  let label='Reserva de equilíbrio', reason='Mantém o nível sem concentrar o time em uma única característica.', priority:'média'|'alta'|'baixa'='média';
  if(p.speed>=82){label='Impacto de velocidade';reason='Pode acelerar transições e explorar defesas cansadas.';priority='alta'}
  else if(p.stamina>=84){label='Controle de energia';reason='É uma opção segura quando o setor perde intensidade.';priority='alta'}
  else if(p.finishing>=82){label='Busca de gol';reason='Aumenta presença ofensiva e capacidade de decisão.';priority='alta'}
  else if(p.defense>=82){label='Proteção de resultado';reason='Reforça marcação, duelos e cobertura na reta final.';priority='alta'}
  else if(p.creation>=82){label='Criação contra bloco baixo';reason='Melhora passe e retenção quando o jogo fica congestionado.'}
  return {player:p,label,reason,coverage,priority};
}

function substitutions(starters:PlayerSummary[], bench:BenchRole[], state:MatchState, energy:TeamEnergy):RealSubstitution[]{
  if(!bench.length||!starters.length)return [];
  const losing=state.startsWith('PERDENDO'); const winning=state.startsWith('VENCENDO');
  const candidates:RealSubstitution[]=[];
  for(const b of bench){
    const bp=b.player;
    const ranked=starters.map(s=>{
      let gain=0;
      if(losing) gain=(bp.finishing-s.finishing)*.45+(bp.speed-s.speed)*.25+(bp.creation-s.creation)*.2;
      else if(winning) gain=(bp.defense-s.defense)*.4+(bp.stamina-s.stamina)*.25+(bp.speed-s.speed)*.15;
      else gain=(bp.stamina-s.stamina)*.35+(bp.versatility-s.versatility)*.2+Math.abs(bp.creation-s.creation)*.08;
      if(energy==='BAIXA')gain+=(bp.stamina-s.stamina)*.25;
      if(line(bp.position)===line(s.position))gain+=12;
      return {s,gain};
    }).sort((a,b)=>b.gain-a.gain)[0];
    if(!ranked)continue;
    candidates.push({
      minute:energy==='BAIXA'?'55–65':losing?'65–75':winning?'70–80':'60–75',
      trigger:energy==='BAIXA'?'queda de intensidade confirmada':losing?'necessidade de criar ou finalizar mais':winning?'necessidade de proteger sem perder saída':'setor com menor rendimento',
      outPlayer:ranked.s.name,inPlayer:bp.name,score:clamp(62+ranked.gain),
      gain:losing?'mais criação, velocidade ou finalização':winning?'mais proteção, energia e controle':'renovação funcional do setor',
      reason:`${bp.name} oferece ${b.label.toLowerCase()} e substitui ${ranked.s.name} com encaixe mais útil para o estado atual.`,
      priority:ranked.gain>18?'alta':ranked.gain>5?'média':'baixa'
    });
  }
  const seen=new Set<string>(); return candidates.sort((a,b)=>b.score-a.score).filter(x=>{const k=x.outPlayer+'|'+x.inPlayer;if(seen.has(k))return false;seen.add(k);return true}).slice(0,5);
}

function instructionSuggestions(starters:PlayerSummary[], style:TacticalStyle):IndividualInstructionSuggestion[]{
  const out:IndividualInstructionSuggestion[]=[];
  const bestDefense=[...starters].sort((a,b)=>b.defense-a.defense)[0];
  const fastest=[...starters].filter(p=>line(p.position)==='ATT').sort((a,b)=>b.speed-a.speed)[0];
  const creator=[...starters].sort((a,b)=>b.creation-a.creation)[0];
  const fullbacks=starters.filter(p=>['LB','RB'].includes(p.position)).sort((a,b)=>b.stamina-a.stamina);
  if(bestDefense)out.push({player:bestDefense.name,instruction:'Marcação individual',confidence:clamp(bestDefense.defense),reason:'É o titular com melhor base defensiva para acompanhar a principal ameaça rival.',warning:'Use apenas se o alvo adversário estiver claramente identificado.'});
  if(fastest)out.push({player:fastest.name,instruction:'Contra-ataque nos jogadores avançados',confidence:clamp((fastest.speed+fastest.finishing)/2),reason:'Preserva energia e mantém profundidade para atacar após a recuperação.'});
  if(creator && style==='POSSE_DE_BOLA')out.push({player:creator.name,instruction:'Manter posição',confidence:clamp((creator.creation+creator.stamina)/2),reason:'Ajuda a conservar uma referência de passe e evita que o principal criador abandone sua zona.'});
  if(fullbacks[0])out.push({player:fullbacks[0].name,instruction:style==='POR_FORA'?'Ofensivo':'Defensivo',confidence:clamp((fullbacks[0].stamina+fullbacks[0].speed)/2),reason:style==='POR_FORA'?'Apoia a amplitude e os cruzamentos do estilo selecionado.':'Mantém cobertura em um dos corredores enquanto o restante do time avança.'});
  return out.slice(0,4);
}

export function buildSquadRotationReport(results:AnalysisResult[], formation:TacticalFormation, style:TacticalStyle, state:MatchState, energy:TeamEnergy):SquadRotationReport|null{
  const unique=new Map<string,AnalysisResult>();
  for(const r of results){const k=(r.parsed.internalId||r.parsed.playerName).toLowerCase();if(!unique.has(k))unique.set(k,r)}
  const players=[...unique.values()].map(summarize);
  if(!players.length)return null;
  const starters=pickStarters(players,style);
  const ids=new Set(starters.map(p=>p.id));
  const benchPlayers=players.filter(p=>!ids.has(p.id)).sort((a,b)=>b.versatility+b.stamina-(a.versatility+a.stamina));
  const bench=benchPlayers.slice(0,12).map(benchRole);
  const counts={GK:0,DEF:0,MID:0,ATT:0}; players.forEach(p=>counts[line(p.position)]++);
  const missing:string[]=[];
  if(counts.GK<2)missing.push('Falta um goleiro reserva confiável.');
  if(counts.DEF<6)missing.push('Cobertura defensiva curta para zaga e laterais.');
  if(counts.MID<5)missing.push('Poucas alternativas para renovar ou mudar o meio-campo.');
  if(counts.ATT<4)missing.push('Banco com poucas rotas ofensivas diferentes.');
  const coverage=clamp(100-missing.length*18+Math.min(12,bench.length)*2);
  const rotation=clamp(bench.length?bench.reduce((s,b)=>s+(b.player.stamina+b.player.versatility)/2,0)/bench.length:35);
  return {
    squadCount:players.length,starterCount:starters.length,benchCount:bench.length,coverageScore:coverage,rotationScore:rotation,
    headline:`${players.length} jogadores analisados para ${formation}; ${starters.length} titulares e ${bench.length} opções de banco.`,
    starters,bench,missingCoverage:missing,substitutions:substitutions(starters,bench,state,energy),instructions:instructionSuggestions(starters,style),
    locks:['Nenhuma troca ou instrução é aplicada automaticamente.','Os nomes das instruções vêm somente do catálogo validado do módulo.','Você confirma titulares, reservas, substituições e instruções antes de usar.']
  };
}
