import type { TacticalFormation, TacticalStyle } from './analyzer';
import type { OpponentAnalysisReport, OpponentProfile } from './opponentAnalysis';

export type MatchState = 'EMPATANDO' | 'VENCENDO_1' | 'VENCENDO_2' | 'PERDENDO_1' | 'PERDENDO_2';
export type TeamEnergy = 'ALTA' | 'MEDIA' | 'BAIXA';
export type MatchMoment = 'INICIO' | 'INTERVALO' | 'FINAL';

export type GamePlanInput = {
  matchState: MatchState;
  energy: TeamEnergy;
  opponentProfile: OpponentProfile;
  ownFormation: TacticalFormation;
  ownStyle: TacticalStyle;
};

export type SubstitutionPlan = {
  minute: string;
  trigger: string;
  outProfile: string;
  inProfile: string;
  objective: string;
  priority: 'alta' | 'média' | 'baixa';
};

export type PhasePlan = {
  moment: MatchMoment;
  title: string;
  objective: string;
  instructions: string[];
  substitutions: SubstitutionPlan[];
  formationSuggestion?: TacticalFormation;
  styleSuggestion?: TacticalStyle;
};

export type GamePlanReport = {
  controlScore: number;
  riskScore: number;
  headline: string;
  phases: PhasePlan[];
  emergencyTriggers: string[];
  locks: string[];
};

const stateLabel: Record<MatchState, string> = {
  EMPATANDO: 'partida empatada', VENCENDO_1: 'vantagem de um gol', VENCENDO_2: 'vantagem de dois ou mais gols', PERDENDO_1: 'desvantagem de um gol', PERDENDO_2: 'desvantagem de dois ou mais gols'
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function baseSubstitutions(input: GamePlanInput): SubstitutionPlan[] {
  const losing = input.matchState === 'PERDENDO_1' || input.matchState === 'PERDENDO_2';
  const winning = input.matchState === 'VENCENDO_1' || input.matchState === 'VENCENDO_2';
  const lowEnergy = input.energy === 'BAIXA';
  const plans: SubstitutionPlan[] = [];

  if (lowEnergy) plans.push({ minute: '55–65', trigger: 'Meio-campo sem acompanhar transições', outProfile: 'MLG/VOL mais cansado', inProfile: 'Meio-campista com resistência, cobertura e passe seguro', objective: 'Recuperar intensidade sem desmontar o time', priority: 'alta' });
  if (losing) plans.push({ minute: input.matchState === 'PERDENDO_2' ? '50–60' : '65–75', trigger: 'Pouca presença na área ou criação travada', outProfile: 'Jogador redundante na construção', inProfile: 'SA/MAT infiltrador ou CA finalizador', objective: 'Aumentar ruptura e número de jogadores atacando a última linha', priority: 'alta' });
  if (winning) plans.push({ minute: '70–80', trigger: 'Adversário aumentando pressão e volume', outProfile: 'Atacante com menor fôlego', inProfile: 'Atacante rápido ou meia de retenção', objective: 'Manter ameaça de contra-ataque e aliviar a pressão', priority: 'alta' });
  plans.push({ minute: '75–85', trigger: 'Lateral exposto ou ponta deixando de recompor', outProfile: 'Jogador do corredor mais desgastado', inProfile: 'Lateral/ponta com velocidade e resistência', objective: 'Proteger o corredor sem perder saída', priority: 'média' });
  plans.push({ minute: 'Após 85', trigger: 'Necessidade extrema de gol ou proteção', outProfile: 'Peça menos útil ao estado atual', inProfile: losing ? 'Finalizador, cabeceador ou criador de último passe' : 'Defensor rápido, volante protetor ou jogador de retenção', objective: losing ? 'Criar uma última rota clara de gol' : 'Fechar espaços e controlar segundas bolas', priority: 'média' });
  return plans.slice(0, 4);
}

export function buildGamePlanReport(input: GamePlanInput, opponent: OpponentAnalysisReport): GamePlanReport {
  const losing = input.matchState === 'PERDENDO_1' || input.matchState === 'PERDENDO_2';
  const winning = input.matchState === 'VENCENDO_1' || input.matchState === 'VENCENDO_2';
  const energyPenalty = input.energy === 'BAIXA' ? 15 : input.energy === 'MEDIA' ? 6 : 0;
  const stateRisk = input.matchState === 'PERDENDO_2' ? 18 : input.matchState === 'PERDENDO_1' ? 10 : input.matchState === 'VENCENDO_1' ? 8 : input.matchState === 'VENCENDO_2' ? 3 : 5;
  const controlScore = clamp(opponent.matchupScore - energyPenalty + (winning ? 5 : 0));
  const riskScore = clamp(opponent.threatScore + stateRisk + energyPenalty * .6);
  const substitutions = baseSubstitutions(input);

  const start: PhasePlan = {
    moment: 'INICIO', title: 'Plano de início', objective: 'Confirmar a leitura do adversário sem entregar espaços cedo.',
    instructions: [
      opponent.adjustments[0]?.action ?? 'Proteja primeiro a principal ameaça.',
      'Nos primeiros 15 minutos, observe quem inicia as jogadas e qual corredor recebe mais ataques.',
      losing ? 'Aumente o ritmo, mas não force passes centrais sem apoio.' : 'Evite pressão desesperada; use gatilhos e mantenha a estrutura.'
    ], substitutions: []
  };

  const interval: PhasePlan = {
    moment: 'INTERVALO', title: 'Revisão no intervalo', objective: losing ? 'Criar mais presença ofensiva sem perder proteção contra transição.' : winning ? 'Manter controle e corrigir o setor mais exposto.' : 'Ajustar o confronto com base no que realmente aconteceu.',
    instructions: [
      `Compare a leitura inicial com o jogo: ${opponent.mainThreats[0] ?? 'ameaça principal ainda não confirmada'}.`,
      input.energy === 'BAIXA' ? 'Antecipe uma troca no meio ou no corredor mais desgastado.' : 'Mantenha as peças-chave e prepare a primeira troca por função.',
      losing ? 'Suba apenas um dos laterais por vez e acrescente um infiltrador entre linhas.' : winning ? 'Reduza perdas no centro e deixe uma saída rápida para impedir pressão total.' : 'Se o rival não criou perigo, preserve a estrutura e refine apenas o último passe.'
    ], substitutions: substitutions.filter((item) => item.minute.includes('55') || item.minute.includes('50') || item.minute.includes('65')).slice(0, 2),
    formationSuggestion: losing ? opponent.recommendedFormation : input.ownFormation,
    styleSuggestion: losing ? opponent.recommendedStyle : input.ownStyle
  };

  const final: PhasePlan = {
    moment: 'FINAL', title: 'Reta final', objective: losing ? 'Aumentar o volume com funções claras e proteção mínima.' : winning ? 'Fechar zonas perigosas sem recuar todo o time.' : 'Buscar o gol com controle e evitar contra-ataque fatal.',
    instructions: [
      losing ? 'Ataque com largura e presença na área, mantendo ao menos três jogadores protegendo a perda.' : 'Não devolva a bola de graça; alterne retenção, inversão e transição rápida.',
      winning ? 'Troque o atacante cansado por velocidade para manter o adversário preocupado com profundidade.' : 'Escolha uma rota principal de gol: infiltração, cruzamento ou chute de média distância.',
      'Faça substituições por necessidade funcional, não apenas pelo overall do reserva.'
    ], substitutions: substitutions.slice(-3),
    formationSuggestion: input.matchState === 'PERDENDO_2' ? opponent.recommendedFormation : input.ownFormation,
    styleSuggestion: input.matchState === 'PERDENDO_2' ? opponent.recommendedStyle : input.ownStyle
  };

  return {
    controlScore,
    riskScore,
    headline: `Plano para ${stateLabel[input.matchState]}, energia ${input.energy.toLowerCase()} e adversário com ${opponent.opponentSummary.toLowerCase()}`,
    phases: [start, interval, final],
    emergencyTriggers: [
      'Dois ataques claros seguidos pelo mesmo corredor: reforçar cobertura imediatamente.',
      'Volante ou zagueiro com stamina crítica: trocar antes que a recomposição falhe.',
      'Sem finalizações perigosas até 60 minutos: adicionar ruptura ou presença de área.',
      'Adversário mudou formação/estilo: refazer a leitura antes da próxima substituição.'
    ],
    locks: [
      'Nenhuma substituição, formação ou estilo é aplicado automaticamente.',
      'O plano usa gatilhos; você confirma o que está acontecendo na partida.',
      'A decisão final sobre quem sai e quem entra é sempre sua.'
    ]
  };
}
