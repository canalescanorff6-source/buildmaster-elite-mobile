import assert from 'node:assert/strict';
import { analyzeCard, type PositionCode } from '../src/lib/analyzer';
import { buildOpponentAnalysisReport, type OpponentProfile, type OpponentStrength } from '../src/lib/opponentAnalysis';

const players: Array<[string, PositionCode, string]> = [
  ['Goleiro','GK','Goleiro defensivo'],['Lateral Direito','RB','Lateral defensivo'],['Zagueiro 1','CB','O destruidor'],['Zagueiro 2','CB','Defensor criativo'],['Lateral Esquerdo','LB','Lateral ofensivo'],['Volante','DMF','Primeiro volante'],['Meia','CMF','Orquestrador'],['Armador','AMF','Armador criativo'],['Ponta Direita','RWF','Ponta produtivo'],['Centroavante','CF','Artilheiro'],['Ponta Esquerda','LWF','Ponta móvel']
];
const results = players.map(([name,position,style],index) => analyzeCard(
  `NOME: ${name}\nPOSIÇÃO PRINCIPAL: ${position}\nESTILO DE JOGO: ${style}\nPONTOS TOTAIS: 60\nPasse rasteiro ${76+index}\nPasse alto ${74+index}\nControle de bola ${75+index}\nFinalização ${72+index}\nVelocidade ${77+index}\nAceleração ${78+index}\nTalento defensivo ${74+(10-index)}\nDesarme ${73+(10-index)}\nContato físico ${76+index%5}\nResistência ${79+index%6}`,
  'COMPETITIVE', position, null, {formation:'4-3-3',style:'CONTRA_ATAQUE_RAPIDO'}
));
const profiles: OpponentProfile[] = ['POSSE','CONTRA_RAPIDO','CONTRA_LONGO','POR_FORA','PRESSAO_ALTA','BLOCO_BAIXO','BOLA_AEREA'];
const strengths: OpponentStrength[] = ['VELOCIDADE','PASSE','FISICO','DRIBLE','FINALIZACAO','CRUZAMENTO','PRESSAO'];
for (let i=0;i<profiles.length;i++) {
  const report = buildOpponentAnalysisReport(results,'4-3-3','CONTRA_ATAQUE_RAPIDO',{profile:profiles[i],formation:'4-2-3-1',strength:strengths[i]});
  assert.ok(report);
  assert.ok(report!.adjustments.length >= 3);
  assert.ok(report!.mainThreats.length >= 3);
  assert.ok(report!.matchupScore >= 0 && report!.matchupScore <= 100);
  assert.ok(report!.locks.some((item) => item.includes('automaticamente')));
}
console.log('v24.44 opponent analysis regression: OK');
