import assert from 'node:assert/strict';
import { cardEvidenceFingerprintR126, cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { resultHistoryKey } from '../src/modules/vault/cardHistoryStore';
import { sealProductionAuthorityR126, isCurrentProductionAnalysisR126 } from '../src/lib/productionAuthorityR126';
import { CLEAN_SLATE_2027_R119_VERSION } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { cardFingerprint } from '../src/lib/appEvolution';

function parsed(overall=105, speed=86, nativeSkills=['Passe de primeira']) {
  const attributes:any={
    offensiveAwareness:80,ballControl:84,dribbling:82,tightPossession:83,lowPass:86,loftedPass:84,finishing:74,heading:70,placeKicking:76,curl:78,
    defensiveAwareness:76,defensiveEngagement:79,tackling:77,aggression:75,goalkeeperAwareness:40,goalkeeperCatching:40,goalkeeperParrying:40,goalkeeperReflexes:40,goalkeeperReach:40,
    speed,acceleration:84,kickingPower:82,jump:73,physicalContact:78,balance:82,stamina:88
  };
  return {
    playerName:'Carta R126',cardType:'Epic',specialTag:'Teste',country:'Brasil',mainPosition:'CMF',mainPositionPt:'MLG',positions:['CMF','DMF'],positionsPt:['MLG','VOL'],positionRatings:{CMF:100,DMF:90},
    playstyle:'Orquestrador',offensivePlaystyle:'Orquestrador',defensivePlaystyle:'Básico',defensivePlaystyleConfirmed:true,dominantFoot:'Direito',overall,maxOverall:overall,height:180,weight:77,age:27,level:35,
    trainingPointsTotal:64,condition:{},impetos:[],nativeSkills,additionalSkills:[],specialSkills:[],attributes,physicalProfile:{},manualConfirmed:true,
    evidence:{positionLocked:true,playstyleLocked:true,attributeCount:26,positionRatingsCount:2,skillConfidence:.98,impetoSlotStatus:'DISPONIVEL'},internalId:`legacy-id-with-overall-${overall}`,confidence:.98,warnings:[]
  } as any;
}

function result(best='CMF', overall=105, speed=86, nativeSkills=['Passe de primeira']) {
  const p=parsed(overall,speed,nativeSkills);
  return {
    parsed:p,bestPosition:{code:best,label:best,score:100},trainingPointsTotal:64,buildName:'Nome antigo da build',
    training:{},trainingCost:{},trainingPointsUsed:64,trainingPointsRemaining:0,recommendedSkills:[],recommendedImpetos:[],
    cleanSlate2027R119:{
      version:CLEAN_SLATE_2027_R119_VERSION,authority:'CLEAN_SLATE_SINGLE_WRITER',source:'RAW_CARD_SNAPSHOT',status:'READY',cardKey:cardIdentityFingerprintR126(p),
      positionAnchor:'CMF',usagePosition:best,usagePositionChanged:best!=='CMF',playstyleContext:{offensive:{style:'Orquestrador',status:'LIKELY_ACTIVE',activeWeight:1},defensive:{style:'Básico',status:'LIKELY_ACTIVE',activeWeight:1},neutralRoleMode:false,note:''}
    }
  } as any;
}

const base=parsed(105,86);
assert.equal(cardIdentityFingerprintR126(base),cardIdentityFingerprintR126(parsed(119,86)),'Overall/GER não pode alterar a identidade intrínseca da carta.');
assert.equal(cardIdentityFingerprintR126(base),cardIdentityFingerprintR126(parsed(105,90)),'Atributo treinado não pode transformar a mesma edição em outra carta.');
assert.notEqual(cardEvidenceFingerprintR126(base),cardEvidenceFingerprintR126(parsed(105,90)),'Mudança de atributo deve invalidar a evidência/cache da análise atual.');
assert.notEqual(cardIdentityFingerprintR126(base),cardIdentityFingerprintR126(parsed(105,86,['Passe de primeira','Interceptação'])),'Inventário de habilidades diferente deve diferenciar a carta.');
const sameWithAppliedResources:any={...base,additionalSkills:['Interceptação','Bloqueador'],impetos:[{name:'Agilidade',value:1,active:true}],defensivePlaystyleConfirmed:false,positionRatings:{CMF:108,DMF:106}};
assert.equal(cardIdentityFingerprintR126(base),cardIdentityFingerprintR126(sameWithAppliedResources),'Recursos aplicados, confirmação e ratings/GER por posição não podem trocar a identidade da carta.');
assert.notEqual(cardEvidenceFingerprintR126(base),cardEvidenceFingerprintR126(sameWithAppliedResources),'Recursos/ratings mutáveis precisam alterar a evidência atual sem criar outra carta.');

const sameCardCmf=result('CMF',105);
const sameCardDmf=result('DMF',119);
assert.equal(cardIdentityFingerprintR126(sameCardCmf.parsed),cardIdentityFingerprintR126(sameCardDmf.parsed),'Posição de uso e GER não podem trocar a identidade da carta.');
assert.notEqual(resultHistoryKey(sameCardCmf),resultHistoryKey(sameCardDmf),'O Cofre deve separar a mesma carta usada em funções diferentes.');

assert.equal(cardFingerprint(sameCardCmf),cardIdentityFingerprintR126(sameCardCmf.parsed),'Partidas e memória longitudinal devem usar a mesma identidade canônica do Clean Slate.');
assert.equal(cardFingerprint(sameCardCmf),cardFingerprint(sameCardDmf),'Trocar posição de uso ou GER não pode separar o histórico da mesma carta.');

const renamedBuild={...sameCardCmf,buildName:'Outro nome gerado por versão nova'};
assert.equal(resultHistoryKey(sameCardCmf),resultHistoryKey(renamedBuild),'Nome da build não pode gerar ficha duplicada no Cofre.');
const correctedBudget={...sameCardCmf,trainingPointsTotal:60};
assert.equal(resultHistoryKey(sameCardCmf),resultHistoryKey(correctedBudget),'Correção do orçamento/OCR deve atualizar a mesma carta e função no Cofre, não criar duplicata.');

const sealed:any=sealProductionAuthorityR126(sameCardCmf);
assert.equal(sealed.productionAuthorityR126.authority,'PRODUCTION_SINGLE_WRITER');
assert.equal(sealed.productionAuthorityR126.cardIdentity,cardIdentityFingerprintR126(base));
assert.equal(sealed.productionAuthorityR126.cardEvidence,cardEvidenceFingerprintR126(base));
assert.equal(sealed.productionAuthorityR126.owns.training,true);
assert.equal(sealed.productionAuthorityR126.owns.top5,true);
assert.equal(sealed.productionAuthorityR126.owns.impeto,true);
assert.equal(sealed.productionAuthorityR126.diagnostics.overallExcludedFromDecision,true);
assert.equal(isCurrentProductionAnalysisR126(sealed),true,'Resultado selado precisa ser reconhecido como produção atual.');
assert.equal(isCurrentProductionAnalysisR126({...sealed,parsed:parsed(105,90)} as any),false,'Alterar a evidência intrínseca invalida o selo persistido.');

import { createProductionAnalysisR138, ensureProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';

const rawText = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Produção R126\nPOSIÇÃO PRINCIPAL: CMF\nESTILO DE JOGO: Orquestrador\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira\nTalento ofensivo: 80\nControle de bola: 84\nDrible: 82\nCondução firme: 83\nPasse rasteiro: 86\nPasse alto: 84\nFinalização: 74\nCabeceio: 70\nTalento defensivo: 76\nDedicação defensiva: 79\nDesarme: 77\nAgressividade: 75\nVelocidade: 86\nAceleração: 84\nForça do chute: 82\nSalto: 73\nContato físico: 78\nEquilíbrio: 82\nResistência: 88\n[FIM AJUSTES]`;
const production:any=createProductionAnalysisR138({ rawText, objective:'COMPETITIVE', targetPosition:'CMF', imageFileName:'r126-production.png', tacticalProfile:{formation:'AUTO',style:'AUTO'} as any });
assert.equal(production.productionAuthorityR126?.authority,'PRODUCTION_SINGLE_WRITER','A fachada de produção deve entregar resultado já selado.');
assert.equal(production.cleanSlate2027R119?.authority,'CLEAN_SLATE_SINGLE_WRITER');
assert.strictEqual(ensureProductionAnalysisR138(production),production,'Resultado atual não deve ser recalculado ao abrir no Cofre.');
const stale:any={...production,productionAuthorityR126:undefined};
const refreshed:any=ensureProductionAnalysisR138(stale);
assert.equal(refreshed.productionAuthorityR126?.authority,'PRODUCTION_SINGLE_WRITER','Ficha antiga deve ser atualizada sob demanda ao abrir.');


import { FORMATION_BLUEPRINTS, buildFormationLineup } from '../src/lib/formationRoleEngine';
import { buildSquadRotationReport } from '../src/lib/squadRotation';
import { playerIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';

function rosterResult(name:string, position:any, cardType='Epic', phase=80):any {
  const attrs:any={
    offensiveAwareness:80,ballControl:82,dribbling:80,tightPossession:81,lowPass:82,loftedPass:80,finishing:78,heading:78,placeKicking:70,curl:72,
    defensiveAwareness:80,defensiveEngagement:80,tackling:80,aggression:80,goalkeeperAwareness:position==='GK'?86:40,goalkeeperCatching:position==='GK'?85:40,goalkeeperParrying:position==='GK'?85:40,goalkeeperReflexes:position==='GK'?87:40,goalkeeperReach:position==='GK'?85:40,
    speed:82,acceleration:82,kickingPower:80,jump:80,physicalContact:80,balance:80,stamina:84
  };
  const p:any={playerName:name,cardType,specialTag:cardType,mainPosition:position,mainPositionPt:position,positions:[position],positionsPt:[position],positionRatings:{[position]:100},playstyle:position==='GK'?'Goleiro defensivo':position==='CB'?'Defensor criativo':position==='DMF'?'Primeiro volante':position==='CF'?'Artilheiro':'Meia versátil',overall:110,maxOverall:110,height:180,weight:78,age:27,level:35,condition:{},impetos:[],nativeSkills:['Passe de primeira'],additionalSkills:[],specialSkills:[],attributes:attrs,physicalProfile:{},manualConfirmed:true,evidence:{positionLocked:true,playstyleLocked:true,attributeCount:26,positionRatingsCount:1},internalId:`${name}-${cardType}-110`,confidence:95,warnings:[]};
  return {parsed:p,bestPosition:{code:position,label:position,score:88},buildName:'R126',permittedPositions:[{code:position,label:position,score:100}],trainingPointsTotal:64,trainingPointsUsed:64,trainingPointsRemaining:0,training:{},trainingCost:{},recommendedSkills:[],recommendedImpetos:[],tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'},teamMap:{functionLabel:'Função R126',matchPlan:['Manter função'],sectorScores:{marcacao:phase,cobertura:phase,saidaDeBola:phase,passe:phase,criacao:phase,aceleracao:phase,finalizacao:phase,jogoAereo:phase,fisico:phase}}};
}

const formation4222=FORMATION_BLUEPRINTS.find((item)=>item.id==='4-2-2-2')!;
const uniqueRoster=formation4222.slots.map((slot,index)=>rosterResult(`Atleta R126 ${index+1}`,slot.position,'Epic',78+index));
const duplicateStar={...rosterResult('Atleta R126 2',formation4222.slots[1].position,'Show Time',99)};
assert.equal(playerIdentityFingerprintR126(uniqueRoster[1].parsed),playerIdentityFingerprintR126(duplicateStar.parsed),'Duas cartas do mesmo atleta devem compartilhar identidade de jogador.');
assert.notEqual(cardIdentityFingerprintR126(uniqueRoster[1].parsed),cardIdentityFingerprintR126(duplicateStar.parsed),'Duas edições distintas do mesmo atleta devem continuar sendo cartas distintas.');
const lineupR126=buildFormationLineup([...uniqueRoster,duplicateStar],formation4222).filter((pick)=>pick.player);
const lineupNames=lineupR126.map((pick)=>pick.player!.parsed.playerName);
assert.equal(new Set(lineupNames).size,lineupNames.length,'Uma pessoa não pode ocupar dois postos mesmo quando existem duas cartas dela no Cofre.');
const rotationR126=buildSquadRotationReport([...uniqueRoster,duplicateStar], '4-2-2-2' as any,'POSSE_DE_BOLA' as any,'EMPATANDO' as any,'MEDIA' as any)!;
const activeNames=[...rotationR126.starters.map((item)=>item.name),...rotationR126.bench.map((item)=>item.player.name)];
assert.equal(new Set(activeNames).size,activeNames.length,'Titulares e banco não podem conter duas versões do mesmo atleta ao mesmo tempo.');

console.log('r126 aprovada: identidade Jogador→Carta→Build sem GER, evidência mutável separada, Cofre canônico, elenco sem atleta duplicado e contrato único de produção selado.');
