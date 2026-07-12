import { buildUltimatePlayerCoach, buildOpponentPlans, getOneHundredUpgradeChecklist } from '../src/lib/ultimateCoach';
import type { AnalysisResult } from '../src/lib/analyzer';

const mockResult = {
  parsed: {
    playerName: 'Teste Artilheiro',
    playstyle: 'Artilheiro',
    mainPosition: 'CF',
    mainPositionPt: 'CA',
    nativeSkills: ['Chute de primeira'],
    warnings: [],
    confidence: 98
  },
  bestPosition: { code: 'CF', label: 'CA', score: 94 },
  trainingPointsUsed: 62,
  trainingPointsTotal: 62,
  trainingPointsRemaining: 0,
  recommendationExplanation: ['Prioriza finalização, destreza e força nas pernas.'],
  teamMap: {
    functionLabel: 'CA finalizador',
    tacticalIdentity: 'Atacante de decisão',
    coachFit: 'Combina com contra-ataque rápido.',
    riskAlerts: ['Evitar recomposição pesada como prioridade.'],
    sectorScores: {
      marcacao: 45,
      cobertura: 40,
      saidaDeBola: 58,
      passe: 62,
      criacao: 70,
      aceleracao: 83,
      finalizacao: 94,
      jogoAereo: 76,
      fisico: 80
    },
    matchPlan: ['Ficar perto da área e atacar espaço.']
  },
  buildName: 'CA Finalizador',
  tacticalProfile: { formation: '4-2-2-2', style: 'CONTRA_ATAQUE_RAPIDO' },
  usageTips: ['Finalize rápido e evite sair demais da área.']
} as unknown as AnalysisResult;

const report = buildUltimatePlayerCoach(mockResult);
if (!report.functionScores.length) throw new Error('Treinador Elite não gerou pontuação por função.');
if (!report.antiErrorLocks.some((item) => item.title.includes('Pontos'))) throw new Error('Trava de pontos não foi gerada.');
if (!report.executionPlan.some((item) => /Produzir gol|finalizador/i.test(item.details + item.title))) throw new Error('Plano do CA finalizador não ficou ofensivo.');

const plans = buildOpponentPlans('4-2-2-2', 'CONTRA_ATAQUE_RAPIDO');
if (plans.length < 4) throw new Error('Planos contra adversários incompletos.');

const checklist = getOneHundredUpgradeChecklist();
if (checklist.length !== 100) throw new Error(`Checklist 100 melhorias deveria ter 100 itens, veio ${checklist.length}.`);
if (!checklist.some((item) => item.title === 'Modo treinador completo')) throw new Error('Checklist não contém Modo treinador completo.');

console.log('Ultimate Coach v24.23 OK');
