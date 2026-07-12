import { analyzeCard, type TacticalFormation, type TacticalStyle } from '../src/lib/analyzer';
import { buildAssistedLineupReport } from '../src/lib/assistedLineup';

const positions = ['GK','CB','CB','LB','RB','DMF','CMF','AMF','LWF','RWF','CF'] as const;
const players = positions.map((position,index) => analyzeCard(
  `Jogador ${index+1}\nPosição ${position}\nNível 30\nPontos de progressão 60`,
  'COMPETITIVE',
  position,
  `jogador-${index+1}.png`,
  { formation: '4-3-3' as TacticalFormation, style: 'CONTRA_ATAQUE_RAPIDO' as TacticalStyle }
));
const report = buildAssistedLineupReport(players, '4-3-3', 'CONTRA_ATAQUE_RAPIDO');
if (!report) throw new Error('Relatório assistido não foi criado.');
if (report.options.length < 2) throw new Error('Deveria gerar pelo menos duas opções diferentes.');
if (report.options[0].formation !== '4-3-3') throw new Error('A primeira opção não respeitou a formação escolhida.');
if (report.options[0].style !== 'CONTRA_ATAQUE_RAPIDO') throw new Error('A primeira opção não respeitou o estilo escolhido.');
for (const option of report.options) {
  if (option.lineup.length !== 11) throw new Error('Opção sem 11 espaços.');
  if (option.score < 0 || option.score > 100) throw new Error('Nota inválida.');
}
console.log(`OK v24.43: ${report.generatedCount} combinações, ${report.options.length} opções assistidas.`);
