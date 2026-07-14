import { analyzeCard } from '../src/lib/analyzer';
import { runEvolutionStressSimulation } from '../src/lib/eliteEvolution';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Carta contextual completa
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
`, 'META_2026', 'SS', null, { formation:'4-2-2-2', style:'CONTRA_ATAQUE_RAPIDO', managerName:'Técnico de teste', managerProficiency:90 });

const e = result.eliteEvolution;
if (!e) throw new Error('Evolução total não foi gerada.');
if (result.bestPosition.code !== 'SS') throw new Error('A posição escolhida foi alterada.');
if (e.whatIf.length < 5) throw new Error('Simulador E se incompleto.');
if (e.scenarioBuilds.length !== 7) throw new Error('Fichas por cenário incompletas.');
if (e.ninetyMinutes.length !== 4) throw new Error('Simulação de 90 minutos incompleta.');
if (!e.pointSensitivity.length) throw new Error('Sensibilidade de pontos ausente.');
if (e.proof.candidatesTested < 100) throw new Error('Prova do motor testou poucas combinações.');
if (e.confidence.score < 1 || e.confidence.score > 100) throw new Error('Confiança fora da faixa.');
if (e.abExperiment.matchesPerBuild !== 3) throw new Error('Protocolo A/B incorreto.');
if (!e.learning.confirmationRequired) throw new Error('Correção calibrada não exige confirmação.');
if (!e.videoAssist.supportedMarkers.includes('passe atrasado')) throw new Error('Marcadores de vídeo incompletos.');
if (e.stability.profiles.length < 4) throw new Error('Perfis de estabilidade incompletos.');
if (e.reliability.stages.length !== 7) throw new Error('Geração transacional incompleta.');
if (e.premium.creationFlow.length !== 7) throw new Error('Fluxo premium incompleto.');
if (e.personalProfile.separateFromMeta !== true) throw new Error('Preferência pessoal foi misturada ao Meta.');
if (e.whatIf.some(item=>Object.values(item.training).some(value=>value<0||value>16))) throw new Error('Simulador E se gerou treino inválido.');

const stress = runEvolutionStressSimulation(4096);
if (stress.cases !== 4096 || stress.invalid !== 0) throw new Error('Teste de estresse falhou.');
if (stress.minScore < 0 || stress.maxScore > 100) throw new Error('Teste de estresse produziu nota inválida.');

console.log('OK: Lotes 18–24 entregam contexto, E se, 90 minutos, prova do motor, A/B, vídeo assistido, estabilidade, geração transacional e UX premium; 4096 cenários simulados sem nota inválida.');
