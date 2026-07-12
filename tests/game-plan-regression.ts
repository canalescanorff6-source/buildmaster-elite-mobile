import { buildGamePlanReport, type MatchState, type TeamEnergy } from '../src/lib/gamePlan';
import type { OpponentAnalysisReport, OpponentProfile } from '../src/lib/opponentAnalysis';

const opponent: OpponentAnalysisReport = {
  threatScore: 82, matchupScore: 74, verdict: 'Equilibrado', opponentSummary: 'Contra-ataque rápido em 4-3-3',
  mainThreats: ['Ataques verticais'], exploitableWeaknesses: ['Espaço atrás dos laterais'],
  adjustments: [{ area:'Defesa', priority:'alta', title:'Cobertura', action:'Proteja profundidade.', reason:'Evita passe vertical.' }],
  recommendedFormation:'4-2-3-1', recommendedStyle:'CONTRA_ATAQUE', comparisonNote:'Teste', locks:[]
};

const states: MatchState[] = ['EMPATANDO','VENCENDO_1','VENCENDO_2','PERDENDO_1','PERDENDO_2'];
const energies: TeamEnergy[] = ['ALTA','MEDIA','BAIXA'];
for (const matchState of states) for (const energy of energies) {
  const report = buildGamePlanReport({ matchState, energy, opponentProfile:'CONTRA_RAPIDO' as OpponentProfile, ownFormation:'4-3-3', ownStyle:'POSSE_DE_BOLA' }, opponent);
  if (report.phases.length !== 3) throw new Error('Plano deve ter três fases.');
  if (report.controlScore < 0 || report.controlScore > 100 || report.riskScore < 0 || report.riskScore > 100) throw new Error('Notas inválidas.');
  if (!report.phases.some((phase) => phase.substitutions.length > 0)) throw new Error('Deve sugerir substituições por gatilho.');
  if (!report.locks.some((item) => item.includes('automaticamente'))) throw new Error('Falta trava de decisão do usuário.');
}
console.log('v24.45 game plan regression: OK');
