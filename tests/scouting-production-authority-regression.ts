import assert from 'node:assert/strict';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { createPendingGameplayScoutingR454 } from '../src/modules/scouting/gameplayScoutingR454';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';
const rawText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Autoridade de pesquisa
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 8
NÍVEL MÁXIMO: 5
Talento ofensivo: 80
Controle de bola: 84
Drible: 82
Condução firme: 83
Passe rasteiro: 86
Passe alto: 84
Finalização: 74
Cabeceio: 70
Bola parada: 76
Curva: 78
Talento defensivo: 76
Dedicação defensiva: 79
Desarme: 77
Agressividade: 75
Talento de GO: 40
Firmeza de GO: 40
Defesa de GO: 40
Reflexos de GO: 40
Alcance de GO: 40
Velocidade: 86
Aceleração: 84
Força do chute: 82
Salto: 73
Contato físico: 78
Equilíbrio: 82
Resistência: 88
[FIM AJUSTES]`;
const base: any = createProductionAnalysisR138({ rawText, targetPosition: 'CMF' });
const forgedScouting: any = {
  ...createPendingGameplayScoutingR454(base), status: 'READY', confidence: 'ALTA',
  sources: [], sourceTypes: ['OFFICIAL'],
  bestRoles: [{ id: 'role', position: 'CMF', label: 'Meia versátil', function: 'Meia versátil', fit: 'EXCELENTE', reason: 'pressão e cobertura' }],
};
const untrusted: any = applyCleanSlatePerformance2027R119({ ...base, gameplayScoutingR454: forgedScouting });
assert.equal(untrusted.cleanSlate2027R119.usageFunction, base.cleanSlate2027R119.usageFunction,
  'Scouting READY sem fontes verificadas não pode trocar a função e influenciar os PP por uma rota paralela.');
assert.deepEqual(untrusted.training, base.training);

const supportedScouting = { ...forgedScouting, sources: [{ id: 'review', cardId: forgedScouting.cardId, type: 'REVIEWER',
  label: 'Relato da edição', gameVersion: '6.0.0', confidence: 'ALTA', observedAt: '2026-10-06T10:00:00Z' }] };
const trusted: any = applyCleanSlatePerformance2027R119({ ...base, gameplayScoutingR454: supportedScouting });
assert.equal(trusted.cleanSlate2027R119.usageFunction, 'Meia versátil', 'Função estruturada com fontes qualificadas continua disponível.');
assert.equal(trusted.trainingPointsUsed, 8);
console.log('Produção: a função pesquisada só entra no escritor final quando a autoridade de fontes a libera.');
