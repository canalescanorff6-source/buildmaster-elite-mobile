import type { AnalysisResult, TacticalStyle } from './analyzerDomain';
import { playerIdentityFingerprintR126 } from './cardIdentityFingerprintR126';
import {
  scorePlayerForFormationSlot,
  type FormationBlueprint,
  type FormationSlot,
  type FormationSlotFit
} from './formationRoleEngine';

export const GLOBAL_LINEUP_OPTIMIZER_R457_VERSION='40.80-r457-global-lineup-optimizer-v2-admissible-bound' as const;

export type GlobalLineupOptimizationR457={
  version:typeof GLOBAL_LINEUP_OPTIMIZER_R457_VERSION;
  status:'PROVEN_GLOBAL'|'BEST_FOUND_NOT_PROVEN'|'NO_COMPLETE_LINEUP';
  formationId:string;
  teamStyle:TacticalStyle;
  lineup:FormationSlotFit[];
  teamScore:number;
  rawTotalScore:number;
  filledSlots:number;
  nodesVisited:number;
  branchesPruned:number;
  nodeLimit:number;
  slotOrderIndependent:true;
  uniquePlayerIdentity:true;
  hardStyleDiversityApplied:false;
  styleRepetitionHandledByScore:false;
  admissibleUpperBound:'SUM_REMAINING_SLOT_MAX';
  proofNote:string;
};

type Candidate={
  result:AnalysisResult;
  playerKey:string;
  fit:FormationSlotFit;
  baseScore:number;
};
type Assigned={slot:FormationSlot;candidate:Candidate|null};

function lexicalSignature(assignments:Assigned[]){
  return assignments
    .slice()
    .sort((a,b)=>a.slot.id.localeCompare(b.slot.id,'en'))
    .map(item=>`${item.slot.id}:${item.candidate?.playerKey??'EMPTY'}`).join('|');
}
function evaluateAssignments(assignments:Assigned[],slots:FormationSlot[]){
  const bySlot=new Map(assignments.map(item=>[item.slot.id,item]));
  const ordered=slots.map(slot=>bySlot.get(slot.id)??{slot,candidate:null});
  let total=0,filled=0;
  const lineup:FormationSlotFit[]=ordered.map(item=>{
    if(!item.candidate){
      return {slot:item.slot,player:null,score:0,roleFit:0,positionFit:0,reasons:['Nenhum jogador salvo encaixa com segurança.'],warnings:['Adicione ou treine uma carta para esta função.']};
    }
    total+=item.candidate.fit.score;filled++;
    return item.candidate.fit;
  });
  return {ordered,lineup,total,filled,average:slots.length?total/slots.length:0,signature:lexicalSignature(ordered)};
}

export function optimizeGlobalFormationLineupR457(
  results:AnalysisResult[],
  blueprint:FormationBlueprint,
  teamStyle:TacticalStyle='AUTO',
  options:{nodeLimit?:number}={}
):GlobalLineupOptimizationR457{
  const nodeLimit=Math.max(10_000,Math.floor(options.nodeLimit??2_000_000));
  const slots=blueprint.slots.slice();
  const candidatesBySlot=new Map<string,Candidate[]>();

  for(const slot of slots){
    const candidates=results.map(result=>{
      const fit=scorePlayerForFormationSlot(result,slot);
      return {result,playerKey:playerIdentityFingerprintR126(result.parsed),fit,baseScore:fit.score} as Candidate;
    }).filter(candidate=>candidate.baseScore>=48)
      .sort((a,b)=>b.baseScore-a.baseScore||a.playerKey.localeCompare(b.playerKey,'en'));
    candidatesBySlot.set(slot.id,candidates);
  }

  // Busca os slots mais restritos primeiro. A saída final volta para a ordem do blueprint.
  const searchSlots=slots.slice().sort((a,b)=>{
    const ca=candidatesBySlot.get(a.id)?.length??0,cb=candidatesBySlot.get(b.id)?.length??0;
    return ca-cb||a.id.localeCompare(b.id,'en');
  });

  // Bound admissível para o score ATUAL: scorePlayerForFormationSlot não depende dos parceiros.
  // Ignorar conflitos de identidade só aumenta o bound, portanto nunca subestima o melhor ramo possível.
  const slotMax=new Map(searchSlots.map(slot=>[slot.id,candidatesBySlot.get(slot.id)?.[0]?.baseScore??0]));
  const suffixMax:number[]=new Array(searchSlots.length+1).fill(0);
  for(let i=searchSlots.length-1;i>=0;i--)suffixMax[i]=suffixMax[i+1]+(slotMax.get(searchSlots[i].id)??0);

  let nodesVisited=0,branchesPruned=0,aborted=false;
  let bestAssignments:Assigned[]=[];
  let bestTotal=-Infinity;
  let bestFilled=-1;
  let bestSignature='';
  const usedPlayers=new Set<string>();
  const current:Assigned[]=[];

  const maybeCommit=(assignments:Assigned[])=>{
    const evaluated=evaluateAssignments(assignments,slots);
    const betterScore=evaluated.total>bestTotal+1e-9;
    const sameScore=Math.abs(evaluated.total-bestTotal)<=1e-9;
    const betterFill=sameScore&&evaluated.filled>bestFilled;
    const betterLex=sameScore&&evaluated.filled===bestFilled&&(!bestSignature||evaluated.signature<bestSignature);
    if(betterScore||betterFill||betterLex){
      bestTotal=evaluated.total;bestFilled=evaluated.filled;bestSignature=evaluated.signature;
      bestAssignments=evaluated.ordered.map(item=>({...item}));
    }
  };

  // Incumbente guloso apenas para acelerar a poda; não é usado como prova.
  const greedyUsed=new Set<string>();
  const greedy:Assigned[]=searchSlots.map(slot=>{
    const candidate=(candidatesBySlot.get(slot.id)??[]).find(item=>!greedyUsed.has(item.playerKey))??null;
    if(candidate)greedyUsed.add(candidate.playerKey);
    return {slot,candidate};
  });
  maybeCommit(greedy);

  const visit=(index:number,baseSum:number)=>{
    if(aborted)return;
    nodesVisited++;
    if(nodesVisited>nodeLimit){aborted=true;return;}

    const admissibleUpper=baseSum+suffixMax[index];
    if(bestTotal>-Infinity&&admissibleUpper<bestTotal-1e-9){branchesPruned++;return;}
    if(index===searchSlots.length){maybeCommit(current);return;}

    const slot=searchSlots[index],pool=candidatesBySlot.get(slot.id)??[];
    for(const candidate of pool){
      if(usedPlayers.has(candidate.playerKey))continue;
      usedPlayers.add(candidate.playerKey);
      current.push({slot,candidate});
      visit(index+1,baseSum+candidate.baseScore);
      current.pop();
      usedPlayers.delete(candidate.playerKey);
      if(aborted)break;
    }
    if(!aborted){
      current.push({slot,candidate:null});
      visit(index+1,baseSum);
      current.pop();
    }
  };
  visit(0,0);

  const evaluated=evaluateAssignments(bestAssignments,slots);
  const complete=evaluated.filled===slots.length;
  const status=aborted?'BEST_FOUND_NOT_PROVEN':complete?'PROVEN_GLOBAL':'NO_COMPLETE_LINEUP';
  return {
    version:GLOBAL_LINEUP_OPTIMIZER_R457_VERSION,status,formationId:blueprint.id,teamStyle,lineup:evaluated.lineup,
    teamScore:Math.round(evaluated.average*10)/10,rawTotalScore:evaluated.total,filledSlots:evaluated.filled,nodesVisited,branchesPruned,nodeLimit,
    slotOrderIndependent:true,uniquePlayerIdentity:true,hardStyleDiversityApplied:false,styleRepetitionHandledByScore:false,
    admissibleUpperBound:'SUM_REMAINING_SLOT_MAX',
    proofNote:status==='PROVEN_GLOBAL'
      ?'A árvore foi exaurida ou podada apenas por um limite superior admissível: soma do score atual + máximos individuais dos slots restantes. Como o score de slot atual não depende dos parceiros, o XI está globalmente provado para esta função-objetivo.'
      :status==='NO_COMPLETE_LINEUP'
        ?'A busca completa terminou sem conseguir preencher todos os slots com identidades únicas e score mínimo seguro.'
        :'O limite de nós foi atingido. O resultado é o melhor encontrado, sem rótulo de ótimo global.'
  };
}
