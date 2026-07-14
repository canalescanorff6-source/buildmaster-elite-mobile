import { analyzeCard } from '../src/lib/analyzer';
import { buildCommunityIntelligence, COMMUNITY_SOURCES, COMMUNITY_TIPS } from '../src/lib/communityIntelligence';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Criador Blitz Comunidade
TIPO DA CARTA: Epic Booster Duplo
POSIÇÃO PRINCIPAL: RWF
ESTILO DE JOGO: Armador criativo
HABILIDADE ESPECIAL: Blitz Curler
ALTURA: 178
PESO: 74
PONTOS TOTAIS: 62
Controle de bola: 92
Drible: 92
Condução firme: 91
Passe rasteiro: 88
Passe alto: 85
Finalização: 89
Talento ofensivo: 90
Velocidade: 89
Aceleração: 92
Força do chute: 88
Curva: 95
Equilíbrio: 90
Resistência: 82
[FIM AJUSTES]
`, 'META_2026', 'SS', null, { formation:'4-2-2-2', style:'CONTRA_ATAQUE_RAPIDO', managerName:'Técnico de teste', managerProficiency:90 });

const report = buildCommunityIntelligence(result);
if (COMMUNITY_SOURCES.length < 20) throw new Error(`Poucas fontes curadas: ${COMMUNITY_SOURCES.length}`);
if (COMMUNITY_TIPS.length < 30) throw new Error(`Poucas dicas normalizadas: ${COMMUNITY_TIPS.length}`);
if (report.recommended.length < 12) throw new Error('Recomendações personalizadas insuficientes.');
if (!report.officialMechanics.some(item => item.authority === 'OFICIAL')) throw new Error('Mecânicas oficiais ausentes.');
if (!report.strongConsensus.some(item => item.sourceIds.length >= 3)) throw new Error('Consenso entre múltiplas fontes ausente.');
if (!report.recommended.some(item => item.title.includes('Blitz Curler'))) throw new Error('Habilidade especial confirmada não influenciou a central.');
if (!report.recommended.some(item => item.formations?.includes('4-2-2-2'))) throw new Error('Formação escolhida não personalizou as dicas.');
if (!report.safeguards.some(item => item.includes('TikTok'))) throw new Error('Limitação de indexação de redes não foi documentada.');
if (report.recommended.some(item => !Number.isFinite(item.score))) throw new Error('Nota inválida na recomendação comunitária.');
console.log(`OK: v26.60 reuniu ${report.sources.length} fontes, ${report.allTips.length} dicas e personalizou ${report.recommended.length} recomendações.`);
