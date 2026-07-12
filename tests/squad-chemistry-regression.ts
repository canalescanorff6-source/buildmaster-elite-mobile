import { analyzeCard, type PositionCode } from '../src/lib/analyzer';
import { buildSquadChemistryReport } from '../src/lib/squadChemistry';

const players: Array<[string, PositionCode, string]> = [
  ['Goleiro Seguro','GK','Goleiro defensivo'],
  ['Zagueiro Cobertura','CB','Defensor criativo'],
  ['Zagueiro Combate','CB','O destruidor'],
  ['Lateral Esquerdo','LB','Lateral ofensivo'],
  ['Lateral Direito','RB','Lateral defensivo'],
  ['Volante Protetor','DMF','Primeiro volante'],
  ['Meia Construtor','CMF','Orquestrador'],
  ['Armador Central','AMF','Armador criativo'],
  ['Ponta Esquerda','LWF','Ponta produtivo'],
  ['Ponta Direita','RWF','Ponta móvel'],
  ['Centroavante','CF','Artilheiro']
];

const results = players.map(([name, position, style], index) => analyzeCard(
  `NOME: ${name}\nPOSIÇÃO PRINCIPAL: ${position}\nESTILO DE JOGO: ${style}\nPONTOS TOTAIS: 62\nPasse rasteiro ${78 + index % 8}\nPasse alto ${75 + index % 7}\nControle de bola ${77 + index % 9}\nFinalização ${72 + index % 15}\nVelocidade ${78 + index % 10}\nAceleração ${79 + index % 9}\nTalento defensivo ${72 + (10-index) % 15}\nDesarme ${71 + (10-index) % 14}\nContato físico ${76 + index % 8}\nResistência ${80 + index % 9}`,
  'COMPETITIVE',
  position,
  null,
  { formation: '4-2-1-3', style: 'CONTRA_ATAQUE_RAPIDO' }
));

const report = buildSquadChemistryReport(results, '4-2-1-3', 'CONTRA_ATAQUE_RAPIDO');
if (!report) throw new Error('Relatório de entrosamento não foi gerado.');
if (report.selectedCount !== 11) throw new Error(`Esperado 11 jogadores, recebido ${report.selectedCount}.`);
if (!report.complete) throw new Error('Escalação completa não foi reconhecida.');
if (report.sectors.length !== 6) throw new Error('As seis notas coletivas não foram geradas.');
if (report.roleBalance.length !== 5) throw new Error('Equilíbrio de funções incompleto.');
if (!report.synergies.length) throw new Error('Nenhuma sinergia foi detectada.');
if (report.globalScore < 1 || report.globalScore > 100) throw new Error('Nota global inválida.');
if (results.some((result) => result.trainingPointsUsed > result.trainingPointsTotal)) throw new Error('Uma ficha ultrapassou o orçamento.');
console.log('Squad Chemistry OK', report.globalScore, report.chemistryLabel, report.synergies.length);
