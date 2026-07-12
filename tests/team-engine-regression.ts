import { analyzeCard } from '../src/lib/analyzer';
import { buildEliteTeamReport } from '../src/lib/teamOptimizer';

const samples = [
  `NOME: Goleiro Teste\nPOSIÇÃO PRINCIPAL: GOL\nESTILO DE JOGO: Goleiro defensivo\nPONTOS TOTAIS: 62\nTalento de GO 88\nFirmeza de GO 86\nDefesa de GO 85\nReflexos de GO 90\nAlcance de GO 87`,
  `NOME: Zagueiro Criativo\nPOSIÇÃO PRINCIPAL: ZAG\nESTILO DE JOGO: Defensor criativo\nPONTOS TOTAIS: 62\nTalento defensivo 88\nDesarme 87\nPasse rasteiro 80\nPasse alto 82\nContato físico 86\nSalto 82`,
  `NOME: Volante Cão\nPOSIÇÃO PRINCIPAL: VOL\nESTILO DE JOGO: O destruidor\nPONTOS TOTAIS: 62\nTalento defensivo 86\nDesarme 88\nAgressividade 90\nDedicação defensiva 88\nPasse rasteiro 78\nResistência 86`,
  `NOME: Maestro\nPOSIÇÃO PRINCIPAL: MLG\nESTILO DE JOGO: Orquestrador\nPONTOS TOTAIS: 62\nPasse rasteiro 88\nPasse alto 86\nControle de bola 84\nCondução firme 83\nResistência 80`,
  `NOME: Artilheiro Teste\nPOSIÇÃO PRINCIPAL: CA\nESTILO DE JOGO: Artilheiro\nPONTOS TOTAIS: 62\nTalento ofensivo 88\nFinalização 91\nForça do chute 88\nAceleração 84\nContato físico 80`
];

const results = samples.map((text) => analyzeCard(text, 'COMPETITIVE', 'AUTO', null, { formation: 'AUTO', style: 'AUTO' }));
const report = buildEliteTeamReport(results, 'AUTO', 'AUTO');

if (!report) throw new Error('Mapa do time não foi gerado.');
if (!report.lineup.length) throw new Error('Escalação sugerida vazia.');
if (!report.validators.length) throw new Error('Validador premium não foi gerado.');
if (results.some((result) => result.trainingPointsUsed > result.trainingPointsTotal)) throw new Error('Ficha passou do orçamento de pontos.');

const striker = results.find((result) => result.parsed.playerName.includes('Artilheiro'));
if (!striker) throw new Error('Atacante de teste não encontrado.');
if (striker.recommendedSkills.includes('Volta para marcar')) throw new Error('CA artilheiro recebeu Volta para marcar como top 5.');

console.log('Team Engine OK', report.globalScore, report.bestFormation, report.bestStyle);
