import { analyzeCard } from '../src/lib/analyzer';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Ponta Meta Único
TIPO DA CARTA: Epic Booster Duplo
POSIÇÃO PRINCIPAL: RWF
ESTILO DE JOGO: Ponta prolífico
HABILIDADE ESPECIAL: Blitz Curler
ALTURA: 178
PESO: 73
PONTOS TOTAIS: 62
Controle de bola: 91
Drible: 93
Condução firme: 90
Passe rasteiro: 84
Passe alto: 81
Finalização: 89
Talento ofensivo: 88
Velocidade: 90
Aceleração: 92
Força do chute: 88
Curva: 94
Equilíbrio: 87
Resistência: 84
[FIM AJUSTES]
`, 'META_2026', 'SS', null, { formation:'4-2-2-2', style:'CONTRA_ATAQUE_RAPIDO', managerName:'Técnico Meta', managerProficiency:90 });

const universe=result.metaBuildUniverse;
if(!universe) throw new Error('Universo Meta 2026 não foi gerado.');
if(universe.candidatesAnalyzed < 15000) throw new Error(`Poucas combinações Meta: ${universe.candidatesAnalyzed}.`);
if(universe.uniqueDistributions < 20) throw new Error(`Poucas distribuições únicas: ${universe.uniqueDistributions}.`);
if(universe.topBuilds.length < 12) throw new Error('Top de fichas Meta incompleto.');
if(universe.bestByCategory.length !== 10) throw new Error('Nem todas as categorias Meta foram cobertas.');
if(universe.bestByStyle.length !== 6) throw new Error('Nem todos os estilos coletivos foram cobertos.');
if(universe.bestByFormation.length !== 6) throw new Error('Nem todas as formações comunitárias foram cobertas.');
if(universe.bestByScenario.length !== 7) throw new Error('Nem todos os cenários foram cobertos.');
if(universe.topBuilds.some(item=>item.pointsUsed>result.trainingPointsTotal)) throw new Error('Uma ficha Meta ultrapassou o orçamento.');
if(universe.topBuilds.some(item=>Object.values(item.training).some(value=>value<0||value>16))) throw new Error('Nível de treino inválido no universo Meta.');
if(result.bestPosition.code!=='SS') throw new Error('A posição escolhida foi alterada pelo Meta.');
if(!universe.officialMechanics.some(item=>item.includes('v5.4.0'))) throw new Error('Base oficial v5.4.0 ausente.');
if(!universe.communityTrends.some(item=>item.includes('4-2-1-3'))) throw new Error('Tendências comunitárias não foram separadas.');

const plans=new Set(universe.topBuilds.map(item=>JSON.stringify(item.training)));
if(plans.size<8) throw new Error('As fichas Meta principais ficaram excessivamente parecidas.');

console.log(`OK: v26.50 analisou ${universe.candidatesAnalyzed} combinações, gerou ${universe.uniqueDistributions} distribuições únicas e preservou posição/orçamento.`);
