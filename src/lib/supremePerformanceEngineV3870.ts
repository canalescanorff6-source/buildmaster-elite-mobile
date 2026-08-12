import type {
  AnalysisResult,
  AttributeKey,
  ImpetoStressTestV3870,
  MarginalTrainingValueV3870,
  MaxMatchCandidate,
  OpponentArchetypeId,
  OpponentStressScore,
  ParetoCandidateV3870,
  PositionCode,
  RobustnessEnvelopeV3870,
  SkillTriggerMatrixV3870,
  SupremeCandidateV3870,
  SupremeMatchPhaseId,
  SupremeMatchPhaseScore,
  SupremePerformanceV3870Analysis,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { ATTRIBUTE_PT } from './analyzerDomain';
import {
  evaluateTrainingPlanProgressionOnlyV3860,
  evaluateTrainingPlanWithMaxMatchV3860,
  maxMatchAllowedTrainingKeysV3860,
  maxMatchImpetoCombinationsForTrainingV3860,
  maxMatchTrainingPriorityV3860
} from './maxMatchPerformanceEngineV3860';
import { TRAINING_LABELS } from './trainingEngine';
import { trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';

export const SUPREME_ENGINE_V3870_VERSION = '38.70.0' as const;

const IMPROVEMENTS = [
  'Busca determinística em múltiplas rodadas ao redor das melhores fichas da v38.60.',
  'Otimização robusta privilegia rendimento repetível em vez do maior pico isolado.',
  'Fronteira de Pareto compara desempenho, estabilidade, eficiência e segurança ao mesmo tempo.',
  'Candidatas dominadas são rebaixadas mesmo quando possuem uma nota média alta.',
  'A ficha vencedora precisa permanecer forte em seis fases diferentes da partida.',
  'Saída de bola é avaliada separadamente da criação no meio-campo.',
  'Progressão central mede passe, domínio, condução firme e capacidade de girar.',
  'Terço final mede criação, ruptura e conclusão conforme a função real da carta.',
  'Transição defensiva recebe peso próprio para evitar fichas ofensivas frágeis.',
  'Defesa organizada mede posicionamento, duelo e recuperação de espaço.',
  'Fim de partida modela queda funcional causada por baixa resistência.',
  'O pior desempenho entre as fases participa diretamente da classificação.',
  'Seis arquétipos de adversário estressam a ficha antes da aprovação.',
  'Bloco baixo testa criação central, espaço curto e capacidade de decidir perto da área.',
  'Pressão alta testa primeiro toque, saída rápida e passe sob risco.',
  'Contra-ataque veloz testa recuperação, aceleração e leitura defensiva.',
  'Adversário físico e compacto testa equilíbrio, contato e execução sob choque.',
  'Adversário de posse testa disciplina, circulação e capacidade de recuperar sem se desorganizar.',
  'Cenário equilibrado competitivo evita especialização excessiva contra apenas um tipo de rival.',
  'A menor nota contra adversários tem proteção min-max própria.',
  'Envelope de robustez cria estimativas esperada, conservadora e otimista.',
  'Confiança do OCR reduz agressividade quando há poucos atributos confirmados.',
  'Leitura manual confirmada reduz a largura de incerteza sem eliminar a auditoria.',
  'Atributos ausentes aumentam a margem de segurança da ficha.',
  'Grupos sensíveis são identificados para impedir mudanças arriscadas com leitura incompleta.',
  'Grupos estáveis são preservados quando várias candidatas convergem para níveis semelhantes.',
  'Sinergia de atributos usa médias harmônicas para detectar pares desequilibrados.',
  'Passe sem domínio não recebe a mesma nota de passe acompanhado por bom primeiro toque.',
  'Finalização sem desmarcação é penalizada para atacantes dependentes de movimento.',
  'Velocidade sem aceleração perde valor em espaços curtos e retomadas.',
  'Desarme sem consciência defensiva perde valor na defesa organizada.',
  'Contato físico sem equilíbrio não é tratado como domínio automático de duelo.',
  'Nota de gargalo mede o quanto a pior ação limita o restante da ficha.',
  'Desvio entre ações decisivas é penalizado para evitar cartas muito irregulares.',
  'Busca por vizinhança testa transferências de um nível entre grupos.',
  'Busca aprofundada testa transferências de dois níveis quando o custo permite.',
  'Cada mutação volta a fechar o orçamento exato antes de ser avaliada.',
  'Assinaturas impedem avaliar repetidamente a mesma distribuição.',
  'Cache determinístico torna a busca extensa mais rápida e reproduzível.',
  'Rodadas de feixe mantêm apenas candidatas realmente competitivas.',
  'Sementes incluem vencedora, finalistas, ficha atual e alternativas já produzidas pelo app.',
  'O motor procura melhorias próximas sem destruir o DNA consolidado da v38.60.',
  'Valor marginal mostra o ganho provável do próximo investimento em cada grupo.',
  'Perda marginal mostra o risco de retirar um nível do grupo atual.',
  'Grupos saturados são identificados por ganho baixo e perda pequena.',
  'Grupos essenciais são protegidos quando sua retirada derruba várias fases.',
  'Custo do próximo nível participa da análise de retorno marginal.',
  'Pacote de habilidades recebe uma matriz de frequência de ativação.',
  'Cada habilidade é ligada às fases em que tende a gerar mais valor.',
  'Cada habilidade é ligada aos adversários contra os quais oferece cobertura.',
  'Dependência da ficha evita recomendar uma habilidade que exige atributos insuficientes.',
  'Cobertura de gatilhos reduz pacotes formados por cinco habilidades do mesmo tipo.',
  'Habilidades de passe são testadas na saída, progressão e criação.',
  'Habilidades de conclusão são testadas no terço final e contra bloco baixo.',
  'Habilidades defensivas são testadas na transição e defesa organizada.',
  'Habilidades físicas e aéreas são valorizadas apenas em funções que realmente as ativam.',
  'Ímpetos são estressados contra o pior adversário e a pior fase da ficha.',
  'Ganho do Ímpeto no elo mais fraco pesa mais que aumento cosmético em uma força já elevada.',
  'Risco de saturação do Ímpeto é exibido separadamente.',
  'Ímpeto situacional não é apresentado como ideal universal.',
  'Quatro fichas adaptativas são preservadas: principal, anti-delay, espaço curto e duelo competitivo.',
  'A ficha principal continua sendo a única aplicada automaticamente.',
  'Alternativas deixam claro o cenário em que podem superar a principal.',
  'A posição escolhida permanece bloqueada durante toda a busca.',
  'Nenhuma candidata pode usar grupos incompatíveis com goleiros ou jogadores de linha.',
  'O orçamento exato continua sendo condição obrigatória para entrar na classificação.',
  'A pontuação final é limitada para não declarar perfeição impossível.',
  'Overall e GER permanecem completamente fora da decisão da v38.70.',
  'O resultado explica concessões em vez de esconder fraquezas residuais.',
  'A aprovação exige nota conservadora, pior fase e pior adversário aceitáveis.',
  'Uma ficha pode ser marcada para revisão mesmo vencendo a busca matemática.',
  'Protocolo A/B orienta validação em partidas antes de tornar a ficha definitiva.',
  'Validação separa conexão estável e conexão com delay quando possível.',
  'Resultados devem ser registrados por função executada, não somente por gols ou assistências.',
  'O protocolo observa primeiro toque, perdas de posse, ações decisivas e recomposição.',
  'A ficha pode ser recalibrada com evidência real sem perseguir tendências de uma única partida.',
  'O painel mostra fases, adversários, Pareto, marginais, gatilhos e Ímpetos no mesmo diagnóstico.',
  'A decisão final combina busca global limitada, robustez, função e evidência disponível.',
  'O motor preserva o anticlone: cartas parecidas ainda podem receber fichas diferentes.',
  'O mecanismo continua local, determinístico e sem dependência de API paga.',
  'Todas as novas notas são referências internas comparativas e não atributos oficiais do jogo.'
] as const;

type AttributeWeights = Partial<Record<AttributeKey, number>>;
type CandidateSeed = { id: string; title: string; source: string; training: TrainingPlan };
type PhaseDefinition = {
  id: SupremeMatchPhaseId;
  label: string;
  baseWeight: number;
  attributes: AttributeWeights;
  scenarioIds: Array<MaxMatchCandidate['scenarioScores'][number]['id']>;
};
type OpponentDefinition = {
  id: OpponentArchetypeId;
  label: string;
  weight: number;
  phases: Partial<Record<SupremeMatchPhaseId, number>>;
  scenarioIds: Array<MaxMatchCandidate['scenarioScores'][number]['id']>;
  reason: string;
};

const PHASES: PhaseDefinition[] = [
  {
    id: 'BUILDUP',
    label: 'Saída de bola',
    baseWeight: 1.0,
    attributes: { ballControl: 1.05, lowPass: 1.1, tightPossession: .82, balance: .72, defensiveAwareness: .45, goalkeeperAwareness: .45 },
    scenarioIds: ['HIGH_PRESS', 'RANKED_CORE']
  },
  {
    id: 'CENTRAL_PROGRESSION',
    label: 'Progressão central',
    baseWeight: 1.15,
    attributes: { lowPass: 1.08, ballControl: 1.0, tightPossession: 1.0, dribbling: .72, acceleration: .75, balance: .7 },
    scenarioIds: ['TIGHT_SPACES', 'HIGH_DELAY']
  },
  {
    id: 'FINAL_THIRD',
    label: 'Terço final',
    baseWeight: 1.12,
    attributes: { offensiveAwareness: 1.0, finishing: .95, ballControl: .72, lowPass: .68, acceleration: .7, kickingPower: .48, curl: .35 },
    scenarioIds: ['TIGHT_SPACES', 'SPECIAL_SKILL_TRIGGER']
  },
  {
    id: 'DEFENSIVE_TRANSITION',
    label: 'Transição defensiva',
    baseWeight: 1.0,
    attributes: { acceleration: .9, speed: .82, stamina: .9, defensiveEngagement: .82, aggression: .62, tackling: .62, balance: .45 },
    scenarioIds: ['FAST_TRANSITION', 'HIGH_PRESS']
  },
  {
    id: 'SETTLED_DEFENCE',
    label: 'Defesa organizada',
    baseWeight: 1.0,
    attributes: { defensiveAwareness: 1.1, tackling: .95, defensiveEngagement: .9, physicalContact: .62, speed: .5, jump: .38, goalkeeperReflexes: .55 },
    scenarioIds: ['PHYSICAL_DUELS', 'RANKED_CORE']
  },
  {
    id: 'LATE_MATCH',
    label: 'Minutos finais',
    baseWeight: .92,
    attributes: { stamina: 1.2, balance: .65, acceleration: .58, ballControl: .5, defensiveAwareness: .45, offensiveAwareness: .45 },
    scenarioIds: ['LATE_GAME', 'RANKED_CORE']
  }
];

const OPPONENTS: OpponentDefinition[] = [
  {
    id: 'LOW_BLOCK',
    label: 'Bloco baixo',
    weight: 1.08,
    phases: { CENTRAL_PROGRESSION: .32, FINAL_THIRD: .48, BUILDUP: .2 },
    scenarioIds: ['TIGHT_SPACES', 'SPECIAL_SKILL_TRIGGER'],
    reason: 'Exige circulação central, domínio em pouco espaço e decisão perto da área.'
  },
  {
    id: 'HIGH_PRESS',
    label: 'Pressão alta',
    weight: 1.1,
    phases: { BUILDUP: .42, CENTRAL_PROGRESSION: .32, DEFENSIVE_TRANSITION: .26 },
    scenarioIds: ['HIGH_PRESS', 'HIGH_DELAY'],
    reason: 'Exige primeiro toque, passe rápido e resposta segura quando a bola é pressionada.'
  },
  {
    id: 'FAST_COUNTER',
    label: 'Contra-ataque veloz',
    weight: 1.05,
    phases: { DEFENSIVE_TRANSITION: .48, SETTLED_DEFENCE: .32, LATE_MATCH: .2 },
    scenarioIds: ['FAST_TRANSITION', 'RANKED_CORE'],
    reason: 'Exige recomposição, aceleração funcional e leitura para proteger espaço nas costas.'
  },
  {
    id: 'PHYSICAL_COMPACT',
    label: 'Time físico e compacto',
    weight: 1.0,
    phases: { CENTRAL_PROGRESSION: .25, FINAL_THIRD: .3, SETTLED_DEFENCE: .3, LATE_MATCH: .15 },
    scenarioIds: ['PHYSICAL_DUELS', 'TIGHT_SPACES'],
    reason: 'Exige equilíbrio, contato e execução técnica mesmo sob choque e pouco espaço.'
  },
  {
    id: 'POSSESSION_CONTROL',
    label: 'Controle por posse',
    weight: .96,
    phases: { BUILDUP: .25, CENTRAL_PROGRESSION: .3, DEFENSIVE_TRANSITION: .2, SETTLED_DEFENCE: .25 },
    scenarioIds: ['RANKED_CORE', 'HIGH_PRESS'],
    reason: 'Exige disciplina para circular, pressionar depois da perda e recuperar sem romper a estrutura.'
  },
  {
    id: 'BALANCED_META',
    label: 'Adversário competitivo equilibrado',
    weight: 1.18,
    phases: { BUILDUP: .16, CENTRAL_PROGRESSION: .18, FINAL_THIRD: .18, DEFENSIVE_TRANSITION: .16, SETTLED_DEFENCE: .17, LATE_MATCH: .15 },
    scenarioIds: ['RANKED_CORE', 'HIGH_DELAY', 'FAST_TRANSITION'],
    reason: 'Protege o rendimento geral contra mudanças de ritmo e comportamento durante a partida.'
  }
];

const PHASE_TRAINING: Record<SupremeMatchPhaseId, TrainingKey[]> = {
  BUILDUP: ['passing', 'dribbling', 'defending', 'gk1'],
  CENTRAL_PROGRESSION: ['passing', 'dribbling', 'dexterity', 'lowerBodyStrength'],
  FINAL_THIRD: ['shooting', 'dexterity', 'dribbling', 'passing'],
  DEFENSIVE_TRANSITION: ['lowerBodyStrength', 'dexterity', 'defending'],
  SETTLED_DEFENCE: ['defending', 'aerialStrength', 'lowerBodyStrength', 'gk2', 'gk3'],
  LATE_MATCH: ['lowerBodyStrength', 'dexterity', 'defending']
};

function clamp(value: number, min = 0, max = 98) {
  return Math.round(Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)) * 10) / 10;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function weightedAverage(entries: Array<{ value: number; weight: number }>) {
  const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
  return totalWeight > 0 ? entries.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : 0;
}

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function harmonic(left: number, right: number) {
  if (left <= 0 || right <= 0) return 0;
  return (2 * left * right) / (left + right);
}

function signature(plan: TrainingPlan) {
  return Object.entries(plan).map(([key, value]) => `${key}:${value}`).join('|');
}

function normalizedText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function attribute(candidate: MaxMatchCandidate, key: AttributeKey) {
  return Number(candidate.projectedAttributes[key] ?? 50);
}

function scenario(candidate: MaxMatchCandidate, id: MaxMatchCandidate['scenarioScores'][number]['id']) {
  return Number(candidate.scenarioScores.find((item) => item.id === id)?.score ?? candidate.scenarioAverage);
}

function phaseResponsibility(position: PositionCode, phase: SupremeMatchPhaseId) {
  const profiles: Record<PositionCode, Record<SupremeMatchPhaseId, number>> = {
    GK: { BUILDUP: .72, CENTRAL_PROGRESSION: .18, FINAL_THIRD: .08, DEFENSIVE_TRANSITION: 1.15, SETTLED_DEFENCE: 1.35, LATE_MATCH: 1.0 },
    CB: { BUILDUP: .82, CENTRAL_PROGRESSION: .38, FINAL_THIRD: .12, DEFENSIVE_TRANSITION: 1.2, SETTLED_DEFENCE: 1.35, LATE_MATCH: 1.0 },
    LB: { BUILDUP: .75, CENTRAL_PROGRESSION: .72, FINAL_THIRD: .38, DEFENSIVE_TRANSITION: 1.18, SETTLED_DEFENCE: 1.1, LATE_MATCH: 1.02 },
    RB: { BUILDUP: .75, CENTRAL_PROGRESSION: .72, FINAL_THIRD: .38, DEFENSIVE_TRANSITION: 1.18, SETTLED_DEFENCE: 1.1, LATE_MATCH: 1.02 },
    DMF: { BUILDUP: .92, CENTRAL_PROGRESSION: .85, FINAL_THIRD: .3, DEFENSIVE_TRANSITION: 1.2, SETTLED_DEFENCE: 1.22, LATE_MATCH: 1.08 },
    CMF: { BUILDUP: .88, CENTRAL_PROGRESSION: 1.22, FINAL_THIRD: .72, DEFENSIVE_TRANSITION: .9, SETTLED_DEFENCE: .62, LATE_MATCH: 1.12 },
    LMF: { BUILDUP: .62, CENTRAL_PROGRESSION: 1.05, FINAL_THIRD: .92, DEFENSIVE_TRANSITION: .78, SETTLED_DEFENCE: .48, LATE_MATCH: 1.0 },
    RMF: { BUILDUP: .62, CENTRAL_PROGRESSION: 1.05, FINAL_THIRD: .92, DEFENSIVE_TRANSITION: .78, SETTLED_DEFENCE: .48, LATE_MATCH: 1.0 },
    AMF: { BUILDUP: .58, CENTRAL_PROGRESSION: 1.28, FINAL_THIRD: 1.22, DEFENSIVE_TRANSITION: .48, SETTLED_DEFENCE: .24, LATE_MATCH: .88 },
    SS: { BUILDUP: .4, CENTRAL_PROGRESSION: 1.08, FINAL_THIRD: 1.34, DEFENSIVE_TRANSITION: .4, SETTLED_DEFENCE: .18, LATE_MATCH: .78 },
    CF: { BUILDUP: .25, CENTRAL_PROGRESSION: .66, FINAL_THIRD: 1.42, DEFENSIVE_TRANSITION: .3, SETTLED_DEFENCE: .12, LATE_MATCH: .72 },
    LWF: { BUILDUP: .35, CENTRAL_PROGRESSION: 1.05, FINAL_THIRD: 1.28, DEFENSIVE_TRANSITION: .48, SETTLED_DEFENCE: .2, LATE_MATCH: .82 },
    RWF: { BUILDUP: .35, CENTRAL_PROGRESSION: 1.05, FINAL_THIRD: 1.28, DEFENSIVE_TRANSITION: .48, SETTLED_DEFENCE: .2, LATE_MATCH: .82 }
  };
  return profiles[position][phase];
}

function specializedPhaseWeights(position: PositionCode, phase: SupremeMatchPhaseId): AttributeWeights | null {
  const attackers: PositionCode[] = ['AMF', 'SS', 'CF', 'LWF', 'RWF'];
  if (attackers.includes(position) && phase === 'BUILDUP') {
    return { ballControl: 1.15, lowPass: 1.08, tightPossession: .88, balance: .62, acceleration: .35 };
  }
  if (attackers.includes(position) && phase === 'DEFENSIVE_TRANSITION') {
    return { acceleration: 1.15, stamina: .95, speed: .58, balance: .45, aggression: .28, defensiveEngagement: .22 };
  }
  if (attackers.includes(position) && phase === 'SETTLED_DEFENCE') {
    return { stamina: .85, defensiveEngagement: .42, acceleration: .38, balance: .32, aggression: .22 };
  }
  if ((position === 'CMF' || position === 'LMF' || position === 'RMF') && phase === 'SETTLED_DEFENCE') {
    return { defensiveEngagement: .82, stamina: .8, tackling: .48, acceleration: .42, balance: .35 };
  }
  return null;
}

function positionPhaseAdjustments(position: PositionCode, phase: SupremeMatchPhaseId): AttributeWeights {
  const goalkeeper: AttributeWeights = { goalkeeperAwareness: 1.25, goalkeeperReflexes: 1.2, goalkeeperReach: 1.1, goalkeeperParrying: .85, goalkeeperCatching: .6 };
  if (position === 'GK') {
    if (phase === 'BUILDUP') return { ...goalkeeper, lowPass: .45, ballControl: .25 };
    if (phase === 'SETTLED_DEFENCE' || phase === 'DEFENSIVE_TRANSITION') return goalkeeper;
    return { goalkeeperAwareness: 1.1, goalkeeperReflexes: 1.0, goalkeeperReach: 1.0, stamina: .25 };
  }
  if (position === 'CB') {
    if (phase === 'BUILDUP') return { defensiveAwareness: .8, lowPass: .75, ballControl: .45, speed: .35 };
    if (phase === 'DEFENSIVE_TRANSITION' || phase === 'SETTLED_DEFENCE') return { defensiveAwareness: 1.25, tackling: 1.1, defensiveEngagement: 1.0, speed: .75, acceleration: .55, physicalContact: .65 };
  }
  if (position === 'LB' || position === 'RB') {
    if (phase === 'BUILDUP' || phase === 'CENTRAL_PROGRESSION') return { lowPass: .7, ballControl: .55, speed: .6, stamina: .65 };
    if (phase === 'DEFENSIVE_TRANSITION' || phase === 'SETTLED_DEFENCE') return { defensiveAwareness: 1.0, tackling: .85, speed: .9, acceleration: .82, stamina: .7 };
  }
  if (position === 'DMF') {
    if (phase === 'BUILDUP' || phase === 'CENTRAL_PROGRESSION') return { lowPass: .9, ballControl: .65, tightPossession: .48, defensiveAwareness: .55 };
    if (phase === 'DEFENSIVE_TRANSITION' || phase === 'SETTLED_DEFENCE') return { defensiveAwareness: 1.2, defensiveEngagement: 1.05, tackling: .95, physicalContact: .55, stamina: .55 };
  }
  if (position === 'CMF' || position === 'LMF' || position === 'RMF') {
    if (phase === 'CENTRAL_PROGRESSION') return { lowPass: 1.0, ballControl: .82, tightPossession: .72, stamina: .55, balance: .48 };
    if (phase === 'DEFENSIVE_TRANSITION') return { stamina: .95, defensiveEngagement: .7, acceleration: .6, speed: .45 };
  }
  if (position === 'AMF' || position === 'SS') {
    if (phase === 'CENTRAL_PROGRESSION') return { ballControl: .95, tightPossession: .95, lowPass: .88, acceleration: .6, balance: .55 };
    if (phase === 'FINAL_THIRD') return { offensiveAwareness: .95, lowPass: .8, finishing: .75, ballControl: .65, acceleration: .62 };
  }
  if (position === 'CF') {
    if (phase === 'FINAL_THIRD') return { offensiveAwareness: 1.25, finishing: 1.2, acceleration: .72, kickingPower: .62, ballControl: .4, physicalContact: .4 };
    if (phase === 'CENTRAL_PROGRESSION') return { ballControl: .72, tightPossession: .42, lowPass: .38, balance: .55, physicalContact: .45 };
  }
  if (position === 'LWF' || position === 'RWF') {
    if (phase === 'CENTRAL_PROGRESSION' || phase === 'FINAL_THIRD') return { dribbling: 1.0, ballControl: .8, acceleration: .9, speed: .75, tightPossession: .72, finishing: .52 };
  }
  return {};
}

function mergeWeights(...groups: AttributeWeights[]) {
  const merged: AttributeWeights = {};
  for (const group of groups) {
    for (const [key, value] of Object.entries(group) as Array<[AttributeKey, number]>) merged[key] = Number(merged[key] ?? 0) + value;
  }
  return merged;
}

function weightedAttributeScore(candidate: MaxMatchCandidate, weights: AttributeWeights) {
  const entries = (Object.entries(weights) as Array<[AttributeKey, number]>).map(([key, weight]) => ({ value: attribute(candidate, key), weight }));
  return weightedAverage(entries);
}

function lowestAction(candidate: MaxMatchCandidate) {
  const entries = Object.entries(candidate.actionScores).sort((left, right) => left[1] - right[1]);
  return entries[0]?.[0] ?? 'execução da função';
}

function phaseScores(result: AnalysisResult, candidate: MaxMatchCandidate): SupremeMatchPhaseScore[] {
  const position = result.bestPosition.code;
  return PHASES.map((phase) => {
    const responsibility = phaseResponsibility(position, phase.id);
    const specialized = specializedPhaseWeights(position, phase.id);
    const weights = specialized ?? mergeWeights(phase.attributes, positionPhaseAdjustments(position, phase.id));
    const attributeScore = weightedAttributeScore(candidate, weights);
    const scenarioScore = average(phase.scenarioIds.map((id) => scenario(candidate, id)));
    const actionScore = average(Object.values(candidate.actionScores));
    let score = attributeScore * .56 + scenarioScore * .29 + actionScore * .15;
    if (phase.id === 'LATE_MATCH') score = score * .72 + candidate.fatigueResistance * .28;
    if (phase.id === 'DEFENSIVE_TRANSITION') score = score * .76 + candidate.transitionImpact * .24;
    if (phase.id === 'CENTRAL_PROGRESSION') score = score * .78 + candidate.tightSpaceControl * .22;
    if (phase.id === 'SETTLED_DEFENCE') score = score * .8 + candidate.duelReliability * .2;
    const importantAttributes = (Object.entries(weights) as Array<[AttributeKey, number]>)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
    const decisive = importantAttributes.slice(0, 4).map(([key]) => ATTRIBUTE_PT[key]);
    const weakestAttribute = [...importantAttributes]
      .sort((left, right) => attribute(candidate, left[0]) - attribute(candidate, right[0]))[0]?.[0];
    const roleAdjustedScore = responsibility < .55 ? 78 + (score - 78) * responsibility : score;
    return {
      id: phase.id,
      label: phase.label,
      score: clamp(roleAdjustedScore),
      weight: phase.baseWeight * responsibility,
      limitingAction: weakestAttribute ? `${ATTRIBUTE_PT[weakestAttribute]} / ${lowestAction(candidate)}` : lowestAction(candidate),
      decisiveAttributes: decisive
    };
  });
}

function opponentScores(candidate: MaxMatchCandidate, phases: SupremeMatchPhaseScore[]): OpponentStressScore[] {
  const phaseMap = new Map(phases.map((item) => [item.id, item]));
  return OPPONENTS.map((opponent) => {
    const phasePart = weightedAverage(Object.entries(opponent.phases).map(([id, weight]) => ({ value: Number(phaseMap.get(id as SupremeMatchPhaseId)?.score ?? 0), weight: Number(weight) })));
    const scenarioPart = average(opponent.scenarioIds.map((id) => scenario(candidate, id)));
    const score = clamp(phasePart * .68 + scenarioPart * .32);
    const protectedPhase = (Object.entries(opponent.phases).sort((left, right) => Number(right[1]) - Number(left[1]))[0]?.[0] ?? 'CENTRAL_PROGRESSION') as SupremeMatchPhaseId;
    return { id: opponent.id, label: opponent.label, score, weight: opponent.weight, reason: opponent.reason, protectedPhase };
  });
}

function synergyPairs(position: PositionCode): Array<[AttributeKey, AttributeKey, number]> {
  const generic: Array<[AttributeKey, AttributeKey, number]> = [
    ['ballControl', 'tightPossession', 1.0],
    ['lowPass', 'ballControl', .9],
    ['speed', 'acceleration', .8],
    ['physicalContact', 'balance', .65],
    ['stamina', 'acceleration', .55]
  ];
  if (position === 'GK') return [
    ['goalkeeperAwareness', 'goalkeeperReflexes', 1.25],
    ['goalkeeperReach', 'goalkeeperReflexes', 1.1],
    ['goalkeeperParrying', 'goalkeeperCatching', .8],
    ['jump', 'goalkeeperReach', .65]
  ];
  if (position === 'CB' || position === 'DMF' || position === 'LB' || position === 'RB') return [
    ...generic,
    ['defensiveAwareness', 'tackling', 1.25],
    ['defensiveAwareness', 'speed', .9],
    ['defensiveEngagement', 'stamina', .75],
    ['physicalContact', 'tackling', .72]
  ];
  if (position === 'CF') return [
    ...generic,
    ['offensiveAwareness', 'finishing', 1.3],
    ['offensiveAwareness', 'acceleration', 1.0],
    ['ballControl', 'balance', .75],
    ['heading', 'jump', .5]
  ];
  if (position === 'AMF' || position === 'SS' || position === 'CMF') return [
    ...generic,
    ['lowPass', 'tightPossession', 1.2],
    ['offensiveAwareness', 'acceleration', .85],
    ['dribbling', 'balance', .78],
    ['finishing', 'offensiveAwareness', .55]
  ];
  return [...generic, ['dribbling', 'acceleration', 1.1], ['offensiveAwareness', 'finishing', .75], ['lowPass', 'tightPossession', .6]];
}

function attributeSynergy(candidate: MaxMatchCandidate, position: PositionCode) {
  return clamp(weightedAverage(synergyPairs(position).map(([left, right, weight]) => ({ value: harmonic(attribute(candidate, left), attribute(candidate, right)), weight }))));
}

function robustness(result: AnalysisResult, expected: number, candidate: MaxMatchCandidate, priority: TrainingKey[]): RobustnessEnvelopeV3870 {
  const confidence = Math.max(0, Math.min(100, Number(result.parsed.confidence)));
  const count = Number(result.parsed.evidence.attributeCount ?? 0);
  const missingPenalty = count >= 22 ? 0 : count >= 16 ? 2.5 : count >= 10 ? 5.5 : 9;
  const confirmationRelief = result.parsed.manualConfirmed ? 2 : 0;
  const ocrRiskPenalty = clamp((100 - confidence) * .09 + missingPenalty - confirmationRelief, 0, 16);
  const actionSpread = standardDeviation(Object.values(candidate.actionScores));
  const scenarioSpread = standardDeviation(candidate.scenarioScores.map((item) => item.score));
  const sensitivity = Math.min(8, actionSpread * .12 + scenarioSpread * .1);
  const conservative = clamp(expected - ocrRiskPenalty - sensitivity, 0, 98);
  const optimistic = clamp(expected + Math.max(1.5, (98 - expected) * .18), 0, 98);
  const stableGroups = priority.filter((key) => candidate.training[key] >= 4).slice(0, 4);
  const sensitiveGroups = priority.filter((key) => candidate.training[key] < 4).slice(0, 4);
  return {
    expected: clamp(expected),
    conservative,
    optimistic,
    uncertaintyWidth: clamp(optimistic - conservative, 0, 30),
    ocrRiskPenalty,
    stableGroups,
    sensitiveGroups
  };
}

function skillProfile(name: string): { phases: SupremeMatchPhaseId[]; opponents: OpponentArchetypeId[]; base: number } {
  const key = normalizedText(name);
  if (/goleir|defesa|alcance|reflex|penalti/.test(key)) return { phases: ['SETTLED_DEFENCE', 'DEFENSIVE_TRANSITION'], opponents: ['FAST_COUNTER', 'PHYSICAL_COMPACT', 'BALANCED_META'], base: 84 };
  if (/intercept|marcacao|desarme|bloqueio|combatividade|pressao/.test(key)) return { phases: ['DEFENSIVE_TRANSITION', 'SETTLED_DEFENCE', 'LATE_MATCH'], opponents: ['FAST_COUNTER', 'POSSESSION_CONTROL', 'BALANCED_META'], base: 82 };
  if (/passe|cruzamento|levantad|enfiada|visionario/.test(key)) return { phases: ['BUILDUP', 'CENTRAL_PROGRESSION', 'FINAL_THIRD'], opponents: ['HIGH_PRESS', 'LOW_BLOCK', 'POSSESSION_CONTROL'], base: 83 };
  if (/drible|toque duplo|elastico|dominio|controle|giro/.test(key)) return { phases: ['CENTRAL_PROGRESSION', 'FINAL_THIRD'], opponents: ['HIGH_PRESS', 'LOW_BLOCK', 'PHYSICAL_COMPACT'], base: 84 };
  if (/chute|finaliza|curva|cabeceio|acrobatic|bicicleta/.test(key)) return { phases: ['FINAL_THIRD'], opponents: ['LOW_BLOCK', 'PHYSICAL_COMPACT', 'BALANCED_META'], base: 85 };
  if (/veloc|arranque|pique|incansavel|resistencia/.test(key)) return { phases: ['DEFENSIVE_TRANSITION', 'LATE_MATCH', 'FINAL_THIRD'], opponents: ['FAST_COUNTER', 'HIGH_PRESS', 'BALANCED_META'], base: 80 };
  return { phases: ['CENTRAL_PROGRESSION', 'LATE_MATCH'], opponents: ['BALANCED_META', 'POSSESSION_CONTROL'], base: 74 };
}

function skillTriggerMatrix(candidate: SupremeCandidateV3870): SkillTriggerMatrixV3870[] {
  const phaseMap = new Map(candidate.phaseScores.map((item) => [item.id, item.score]));
  const opponentMap = new Map(candidate.opponentScores.map((item) => [item.id, item.score]));
  return candidate.skillPackage.skills.map((skill) => {
    const profile = skillProfile(skill.name);
    const phaseFit = average(profile.phases.map((id) => Number(phaseMap.get(id) ?? candidate.phaseAverage)));
    const opponentFit = average(profile.opponents.map((id) => Number(opponentMap.get(id) ?? candidate.opponentAverage)));
    const activationBase = skill.activationFrequency === 'muito alta' ? 94 : skill.activationFrequency === 'alta' ? 86 : 76;
    const dependencyScore = clamp(phaseFit * .58 + opponentFit * .22 + Number(skill.score) * .2);
    const triggerRate = clamp(profile.base * .25 + activationBase * .36 + dependencyScore * .39);
    return {
      skill: skill.name,
      triggerRate,
      phaseCoverage: profile.phases,
      opponentCoverage: profile.opponents,
      dependencyScore,
      reason: `${skill.coverageRole}; ativação ${skill.activationFrequency}; cobertura concentrada em ${profile.phases.length} fase(s).`
    };
  }).sort((left, right) => right.triggerRate - left.triggerRate);
}

function triggerCoverage(candidate: MaxMatchCandidate) {
  const profiles = candidate.skillPackage.skills.map((skill) => skillProfile(skill.name));
  const phaseSet = new Set(profiles.flatMap((item) => item.phases));
  const opponentSet = new Set(profiles.flatMap((item) => item.opponents));
  const activation = average(candidate.skillPackage.skills.map((skill) => skill.activationFrequency === 'muito alta' ? 96 : skill.activationFrequency === 'alta' ? 86 : 74));
  return clamp(activation * .55 + (phaseSet.size / PHASES.length) * 100 * .25 + (opponentSet.size / OPPONENTS.length) * 100 * .2);
}

function roleWastePenalty(result: AnalysisResult, candidate: MaxMatchCandidate) {
  const position = result.bestPosition.code;
  const caps: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
    GK: { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 3, aerialStrength: 4, defending: 0, gk1: 12, gk2: 13, gk3: 13 },
    CB: { shooting: 1, passing: 5, dribbling: 3, dexterity: 7, lowerBodyStrength: 10, aerialStrength: 10, defending: 13 },
    LB: { shooting: 2, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 11, aerialStrength: 5, defending: 10 },
    RB: { shooting: 2, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 11, aerialStrength: 5, defending: 10 },
    DMF: { shooting: 2, passing: 9, dribbling: 5, dexterity: 6, lowerBodyStrength: 9, aerialStrength: 6, defending: 13 },
    CMF: { shooting: 5, passing: 11, dribbling: 8, dexterity: 8, lowerBodyStrength: 10, aerialStrength: 4, defending: 7 },
    LMF: { shooting: 6, passing: 10, dribbling: 10, dexterity: 10, lowerBodyStrength: 10, aerialStrength: 4, defending: 5 },
    RMF: { shooting: 6, passing: 10, dribbling: 10, dexterity: 10, lowerBodyStrength: 10, aerialStrength: 4, defending: 5 },
    AMF: { shooting: 8, passing: 13, dribbling: 12, dexterity: 11, lowerBodyStrength: 9, aerialStrength: 3, defending: 2 },
    SS: { shooting: 11, passing: 8, dribbling: 11, dexterity: 12, lowerBodyStrength: 9, aerialStrength: 4, defending: 1 },
    CF: { shooting: 14, passing: 5, dribbling: 7, dexterity: 12, lowerBodyStrength: 10, aerialStrength: 9, defending: 1 },
    LWF: { shooting: 10, passing: 7, dribbling: 13, dexterity: 13, lowerBodyStrength: 11, aerialStrength: 3, defending: 1 },
    RWF: { shooting: 10, passing: 7, dribbling: 13, dexterity: 13, lowerBodyStrength: 11, aerialStrength: 3, defending: 1 }
  };
  const style = normalizedText(result.parsed.playstyle);
  const adjusted = { ...caps[position] };
  if (position === 'CF' && /pivo|homem de area|atacante pivo/.test(style)) adjusted.aerialStrength = 12;
  if ((position === 'AMF' || position === 'SS') && /armador criativo/.test(style)) adjusted.passing = 14;
  if ((position === 'CB' || position === 'DMF') && /defensor criativo|orquestrador/.test(style)) adjusted.passing = Number(adjusted.passing ?? 0) + 2;
  let penalty = 0;
  for (const [key, cap] of Object.entries(adjusted) as Array<[TrainingKey, number]>) {
    const excess = Math.max(0, candidate.training[key] - cap);
    const multiplier = key === 'defending' || key === 'aerialStrength' ? 1.5 : 1.0;
    penalty += excess * multiplier;
  }
  return clamp(penalty, 0, 18);
}

function decorateCandidate(result: AnalysisResult, candidate: MaxMatchCandidate, priority: TrainingKey[]): SupremeCandidateV3870 {
  const phases = phaseScores(result, candidate);
  const opponents = opponentScores(candidate, phases);
  const phaseAverage = weightedAverage(phases.map((item) => ({ value: item.score, weight: item.weight })));
  const worstPhase = Math.min(...phases.map((item) => item.score));
  const opponentAverage = weightedAverage(opponents.map((item) => ({ value: item.score, weight: item.weight })));
  const worstOpponent = Math.min(...opponents.map((item) => item.score));
  const synergy = attributeSynergy(candidate, result.bestPosition.code);
  const bottleneckBalance = clamp(100 - standardDeviation([...Object.values(candidate.actionScores), ...phases.map((item) => item.score)]) * 2.15);
  const triggers = triggerCoverage(candidate);
  const wastePenalty = roleWastePenalty(result, candidate);
  const expected = clamp(
    candidate.performanceScore * .16
    + phaseAverage * .19
    + worstPhase * .15
    + opponentAverage * .17
    + worstOpponent * .15
    + synergy * .08
    + bottleneckBalance * .05
    + triggers * .05
    - wastePenalty * .42
  );
  const envelope = robustness(result, expected, candidate, priority);
  const supremeScore = clamp(
    expected * .56
    + envelope.conservative * .22
    + candidate.dimensions.pointEfficiency * .08
    + candidate.consistency * .06
    + candidate.worstScenario * .05
    + candidate.breakpointScore * .03
    - wastePenalty * .18
  );
  return {
    ...candidate,
    phaseScores: phases,
    phaseAverage: clamp(phaseAverage),
    worstPhase: clamp(worstPhase),
    opponentScores: opponents,
    opponentAverage: clamp(opponentAverage),
    worstOpponent: clamp(worstOpponent),
    attributeSynergy: synergy,
    bottleneckBalance,
    robustness: envelope,
    triggerCoverage: triggers,
    paretoRank: 0,
    dominated: false,
    supremeScore
  };
}

function candidateDimensions(candidate: SupremeCandidateV3870) {
  return [
    candidate.phaseAverage,
    candidate.worstPhase,
    candidate.opponentAverage,
    candidate.worstOpponent,
    candidate.robustness.conservative,
    candidate.dimensions.pointEfficiency
  ];
}

function dominates(left: SupremeCandidateV3870, right: SupremeCandidateV3870) {
  const a = candidateDimensions(left);
  const b = candidateDimensions(right);
  return a.every((value, index) => value >= b[index]) && a.some((value, index) => value > b[index]);
}

function applyParetoRanks(candidates: SupremeCandidateV3870[]) {
  return candidates.map((candidate) => {
    const dominators = candidates.filter((other) => other.id !== candidate.id && dominates(other, candidate)).length;
    return { ...candidate, paretoRank: dominators + 1, dominated: dominators > 0 };
  });
}

function paretoSummary(candidates: SupremeCandidateV3870[]): ParetoCandidateV3870[] {
  return [...candidates]
    .sort((left, right) => left.paretoRank - right.paretoRank || right.supremeScore - left.supremeScore)
    .slice(0, 12)
    .map((candidate) => ({
      candidateId: candidate.id,
      title: candidate.title,
      rank: candidate.paretoRank,
      dominated: candidate.dominated,
      phaseAverage: candidate.phaseAverage,
      worstPhase: candidate.worstPhase,
      opponentAverage: candidate.opponentAverage,
      worstOpponent: candidate.worstOpponent,
      conservativeScore: candidate.robustness.conservative,
      pointEfficiency: candidate.dimensions.pointEfficiency,
      reason: candidate.dominated
        ? 'Existe outra ficha igual ou melhor em todas as dimensões principais.'
        : 'Permanece na fronteira eficiente sem ser superada em todas as dimensões.'
    }));
}

function collectInitialSeeds(result: AnalysisResult): CandidateSeed[] {
  const seeds: CandidateSeed[] = [];
  const max = result.maxMatchV3860;
  if (max) {
    seeds.push({ id: 'v3860-winner', title: 'Vencedora v38.60', source: 'base robusta anterior', training: max.winner.training });
    max.finalists.forEach((item, index) => seeds.push({ id: `v3860-final-${index}`, title: item.title, source: 'finalista v38.60', training: item.training }));
  }
  seeds.push({ id: 'current', title: 'Ficha atual', source: 'resultado aplicado', training: result.training });
  result.buildVariants.slice(0, 8).forEach((item, index) => seeds.push({ id: `variant-${index}`, title: item.title, source: 'variante existente', training: item.training }));
  if (result.parsed.autoTrainingPlan) seeds.push({ id: 'auto', title: 'Progressão automática da carta', source: 'leitura original', training: result.parsed.autoTrainingPlan });
  const unique = new Map<string, CandidateSeed>();
  for (const seed of seeds) if (!unique.has(signature(seed.training))) unique.set(signature(seed.training), seed);
  return [...unique.values()];
}

function mutatePlan(plan: TrainingPlan, allowed: TrainingKey[], priority: TrainingKey[], round: number) {
  const mutations: TrainingPlan[] = [];
  const targets = priority.slice(0, Math.min(4 + round, priority.length));
  for (const from of allowed) {
    if (plan[from] <= 0) continue;
    for (const to of targets) {
      if (from === to || plan[to] >= 16) continue;
      mutations.push({ ...plan, [from]: Math.max(0, plan[from] - 1), [to]: Math.min(16, plan[to] + 1) });
      if (round >= 2 && plan[from] >= 2) mutations.push({ ...plan, [from]: Math.max(0, plan[from] - 2), [to]: Math.min(16, plan[to] + 1) });
    }
  }
  return mutations;
}

function evaluationSort(left: SupremeCandidateV3870, right: SupremeCandidateV3870) {
  return right.supremeScore - left.supremeScore
    || right.robustness.conservative - left.robustness.conservative
    || right.worstOpponent - left.worstOpponent
    || right.worstPhase - left.worstPhase
    || right.dimensions.pointEfficiency - left.dimensions.pointEfficiency;
}

function searchCandidates(result: AnalysisResult, rounds = 4, beamSize = 4) {
  const allowed = maxMatchAllowedTrainingKeysV3860(result.bestPosition.code);
  const priority = maxMatchTrainingPriorityV3860(result);
  const cache = new Map<string, SupremeCandidateV3870>();
  let generated = 0;
  const evaluate = (seed: CandidateSeed) => {
    const key = signature(seed.training);
    const cached = cache.get(key);
    if (cached) return cached;
    generated += 1;
    const base = evaluateTrainingPlanProgressionOnlyV3860(result, seed.training, seed);
    if (!base || base.pointsUsed !== result.trainingPointsTotal || !base.exactBudget) return null;
    const decorated = decorateCandidate(result, base, priority);
    cache.set(signature(decorated.training), decorated);
    return decorated;
  };
  let beam = collectInitialSeeds(result).map(evaluate).filter((item): item is SupremeCandidateV3870 => Boolean(item)).sort(evaluationSort).slice(0, beamSize);
  for (let round = 1; round <= rounds; round += 1) {
    const neighbours: CandidateSeed[] = [];
    beam.forEach((candidate, candidateIndex) => {
      // Mantém uma busca ampla, porém limitada a mutações determinísticas de maior
      // valor. A versão anterior avaliava centenas de vizinhos quase idênticos em
      // cada carta e tornava lotes/CI excessivamente lentos sem ganho mensurável.
      mutatePlan(candidate.training, allowed, priority, round).slice(0, 8).forEach((training, mutationIndex) => neighbours.push({
        id: `beam-r${round}-${candidateIndex}-${mutationIndex}`,
        title: `Convergência ${round}.${mutationIndex + 1}`,
        source: `busca robusta rodada ${round}`,
        training
      }));
      const weakest = [...candidate.phaseScores].sort((left, right) => left.score - right.score)[0];
      const focus = PHASE_TRAINING[weakest.id].filter((key) => allowed.includes(key));
      for (const to of focus.slice(0, 1)) {
        const from = [...allowed].filter((key) => key !== to && candidate.training[key] > 0).sort((left, right) => priority.indexOf(right) - priority.indexOf(left))[0];
        if (from) neighbours.push({
          id: `weak-r${round}-${candidateIndex}-${to}`,
          title: `Correção de ${weakest.label}`,
          source: `elo mais fraco da rodada ${round}`,
          training: { ...candidate.training, [from]: Math.max(0, candidate.training[from] - 1), [to]: Math.min(16, candidate.training[to] + 1) }
        });
      }
    });
    const evaluated = neighbours.map(evaluate).filter((item): item is SupremeCandidateV3870 => Boolean(item));
    const combined = [...beam, ...evaluated];
    const unique = new Map<string, SupremeCandidateV3870>();
    combined.forEach((item) => {
      const key = signature(item.training);
      const previous = unique.get(key);
      if (!previous || evaluationSort(item, previous) < 0) unique.set(key, item);
    });
    beam = [...unique.values()].sort(evaluationSort).slice(0, beamSize);
  }
  return { candidates: [...cache.values()], generated, rounds, priority, allowed };
}

function marginalValues(result: AnalysisResult, winner: SupremeCandidateV3870, allowed: TrainingKey[], priority: TrainingKey[]): MarginalTrainingValueV3870[] {
  return allowed.map((training) => {
    const currentLevel = winner.training[training];
    const addition = { ...winner.training, [training]: Math.min(16, currentLevel + 1) };
    const removal = { ...winner.training, [training]: Math.max(0, currentLevel - 1) };
    const plusBase = evaluateTrainingPlanProgressionOnlyV3860(result, addition, { id: `marginal-plus-${training}`, title: 'Marginal +1', source: 'auditoria v38.70' });
    const minusBase = currentLevel > 0 ? evaluateTrainingPlanProgressionOnlyV3860(result, removal, { id: `marginal-minus-${training}`, title: 'Marginal -1', source: 'auditoria v38.70' }) : null;
    const plus = plusBase ? decorateCandidate(result, plusBase, priority).supremeScore : winner.supremeScore;
    const minus = minusBase ? decorateCandidate(result, minusBase, priority).supremeScore : winner.supremeScore;
    const gain = clamp(plus - winner.supremeScore, -20, 20);
    const lossIfRemoved = clamp(winner.supremeScore - minus, -20, 20);
    const nextPointCost = trainingPlanCost({ ...winner.training, [training]: Math.min(16, currentLevel + 1) })[training] - trainingPlanCost(winner.training)[training];
    let verdict: MarginalTrainingValueV3870['verdict'] = 'situacional';
    if (lossIfRemoved >= 1.5) verdict = 'proteger';
    else if (gain >= .8) verdict = 'eficiente';
    else if (gain <= .2 && lossIfRemoved <= .4) verdict = 'saturado';
    return {
      training,
      label: TRAINING_LABELS[training],
      currentLevel,
      nextPointCost: Math.max(0, nextPointCost),
      gain,
      lossIfRemoved,
      verdict,
      reason: verdict === 'proteger'
        ? 'Retirar investimento reduz de forma relevante o rendimento robusto.'
        : verdict === 'eficiente'
          ? 'Ainda existe retorno funcional provável neste grupo.'
          : verdict === 'saturado'
            ? 'O grupo apresenta pouco ganho e pouca perda marginal na vizinhança atual.'
            : 'Pode ser útil em uma variante específica, mas não domina a ficha principal.'
    };
  }).sort((left, right) => right.lossIfRemoved - left.lossIfRemoved || right.gain - left.gain);
}

function allImpetoStressTests(result: AnalysisResult, winner: SupremeCandidateV3870): ImpetoStressTestV3870[] {
  const recalculated = maxMatchImpetoCombinationsForTrainingV3860(result, winner.training);
  const combinations = recalculated.length ? recalculated : (result.maxMatchV3860?.impetoCombinations ?? [winner.impetoCombination]);
  const weakestOpponent = [...winner.opponentScores].sort((left, right) => left.score - right.score)[0];
  const weakestPhase = [...winner.phaseScores].sort((left, right) => left.score - right.score)[0];
  return combinations.map((item) => {
    const saturationRisk = clamp(item.impeto.saturationPenalty);
    const worstOpponentGain = clamp((100 - weakestOpponent.score) * (item.score / 100) * .13, 0, 12);
    const worstPhaseGain = clamp((100 - weakestPhase.score) * (item.score / 100) * .14, 0, 12);
    const score = clamp(item.score * .68 + worstOpponentGain * 1.25 + worstPhaseGain * 1.35 - saturationRisk * .12);
    return {
      name: item.impeto.name,
      score,
      worstOpponentGain,
      worstPhaseGain,
      saturationRisk,
      verdict: score >= 86 ? 'ideal' as const : score >= 78 ? 'forte' as const : 'situacional' as const,
      reason: `Testado contra ${weakestOpponent.label} e na fase ${weakestPhase.label}; ${item.reason}`
    };
  }).sort((left, right) => right.score - left.score).slice(0, 8);
}

function adaptiveVariants(candidates: SupremeCandidateV3870[]) {
  const selectors: Array<{
    id: string;
    label: string;
    purpose: string;
    score: (candidate: SupremeCandidateV3870) => number;
  }> = [
    { id: 'principal', label: 'Ficha principal robusta', purpose: 'Melhor equilíbrio geral para sequência competitiva.', score: (candidate) => candidate.supremeScore },
    { id: 'anti-delay', label: 'Ficha anti-delay', purpose: 'Prioriza resposta, domínio e execução com conexão pesada.', score: (candidate) => scenario(candidate, 'HIGH_DELAY') * .55 + candidate.robustness.conservative * .45 },
    { id: 'espaco-curto', label: 'Ficha de espaço curto', purpose: 'Prioriza triangulações, giro, tabela e bloco baixo.', score: (candidate) => Number(candidate.phaseScores.find((item) => item.id === 'CENTRAL_PROGRESSION')?.score ?? 0) * .45 + Number(candidate.opponentScores.find((item) => item.id === 'LOW_BLOCK')?.score ?? 0) * .55 },
    { id: 'duelo', label: 'Ficha de duelo competitivo', purpose: 'Prioriza contato, transição e adversário físico.', score: (candidate) => Number(candidate.opponentScores.find((item) => item.id === 'PHYSICAL_COMPACT')?.score ?? 0) * .5 + candidate.duelReliability * .28 + candidate.worstPhase * .22 }
  ];
  const used = new Set<string>();
  return selectors.map((selector) => {
    const candidate = [...candidates].sort((left, right) => selector.score(right) - selector.score(left)).find((item) => !used.has(signature(item.training))) ?? [...candidates].sort((left, right) => selector.score(right) - selector.score(left))[0];
    used.add(signature(candidate.training));
    const bestPhase = [...candidate.phaseScores].sort((left, right) => right.score - left.score)[0];
    const bestOpponent = [...candidate.opponentScores].sort((left, right) => right.score - left.score)[0];
    return {
      id: selector.id,
      label: selector.label,
      purpose: selector.purpose,
      training: candidate.training,
      score: clamp(selector.score(candidate)),
      bestPhase: bestPhase.id,
      bestOpponent: bestOpponent.id
    };
  });
}

function validationProtocol(winner: SupremeCandidateV3870) {
  const weakestPhase = [...winner.phaseScores].sort((left, right) => left.score - right.score)[0];
  const weakestOpponent = [...winner.opponentScores].sort((left, right) => left.score - right.score)[0];
  return [
    'Jogue pelo menos 10 partidas antes de alterar novamente a progressão: cinco com a ficha principal e cinco repetindo adversários/condições semelhantes.',
    'Registre primeiro toque, perdas de posse evitáveis, passes que quebram linha, ações decisivas e recomposição — não apenas gols e assistências.',
    `Observe especialmente a fase ${weakestPhase.label}, que permaneceu como o elo mais exigente da simulação.`,
    `Quando enfrentar ${weakestOpponent.label}, registre se o gargalo previsto realmente aparece em campo.`,
    'Separe partidas com conexão estável de partidas com delay para não misturar problemas da ficha com problemas de resposta.',
    'Mantenha posição, formação e técnico iguais durante o primeiro teste A/B para reduzir variáveis.',
    'Só aceite uma troca de pontos quando a mesma deficiência aparecer em pelo menos três partidas, não em um lance isolado.',
    'Depois do teste, use o histórico de validação real do app para recalibrar a próxima análise da mesma carta.'
  ];
}

export function buildSupremePerformanceV3870(result: AnalysisResult): SupremePerformanceV3870Analysis {
  const search = searchCandidates(result);
  if (!search.candidates.length) throw new Error('Motor v38.70 não encontrou candidata válida com orçamento exato.');

  // A exploração usa avaliação leve; somente os melhores candidatos passam
  // novamente pelo Top adicional e pelo Ímpeto completos. Isso mantém a
  // precisão da decisão final e reduz fortemente o tempo em lotes de cartas.
  const fullFinalists = [...search.candidates]
    .sort(evaluationSort)
    .slice(0, 3)
    .map((candidate) => {
      const full = evaluateTrainingPlanWithMaxMatchV3860(result, candidate.training, {
        id: candidate.id,
        title: candidate.title,
        source: `${candidate.source} • validação integral`
      });
      return full ? decorateCandidate(result, full, search.priority) : null;
    })
    .filter((candidate): candidate is SupremeCandidateV3870 => Boolean(candidate));
  const ranked = applyParetoRanks(fullFinalists.length ? fullFinalists : search.candidates)
    .sort((left, right) => left.paretoRank - right.paretoRank || evaluationSort(left, right));
  const winner = ranked[0];
  const marginals = marginalValues(result, winner, search.allowed, search.priority);
  const stableGroups = marginals.filter((item) => item.verdict === 'proteger').map((item) => item.training).slice(0, 4);
  const sensitiveGroups = marginals.filter((item) => item.verdict === 'situacional' || item.verdict === 'saturado').map((item) => item.training).slice(0, 4);
  winner.robustness = { ...winner.robustness, stableGroups, sensitiveGroups };
  const triggers = skillTriggerMatrix(winner);
  const impetos = allImpetoStressTests(result, winner);
  const localImprovement = Math.max(0, ...marginals.map((item) => item.gain));
  const confidence = clamp(
    Number(result.parsed.confidence) * .28
    + winner.robustness.conservative * .24
    + winner.worstPhase * .15
    + winner.worstOpponent * .15
    + winner.bottleneckBalance * .08
    + winner.dimensions.pointEfficiency * .1
    - localImprovement * 2.5
  );
  const decision = confidence >= 74 && winner.robustness.conservative >= 72 && winner.worstPhase >= 70 && winner.worstOpponent >= 70 && localImprovement < 1.5 ? 'aprovada' : 'revisar';
  const guardrails = [
    'Overall/GER não participa da busca, da fronteira de Pareto nem da pontuação robusta.',
    `Posição preservada em ${result.bestPosition.label} durante todas as ${search.rounds} rodadas.`,
    `A triagem avaliou ${search.candidates.length} candidatas com orçamento exato e revalidou integralmente as ${ranked.length} melhores.`,
    'Notas de fase e adversário são índices internos comparativos; não representam valores oficiais do eFootball.',
    'Otimização matemática não substitui validação em partidas, especialmente sob delay e após atualizações do jogo.',
    localImprovement >= 1.5 ? 'Ainda existe ganho marginal relevante em uma vizinhança; a ficha foi marcada para revisão.' : 'Nenhuma troca marginal simples superou a vencedora de forma relevante.',
    winner.robustness.uncertaintyWidth >= 14 ? 'A leitura possui incerteza elevada; confirme atributos e habilidades antes de aplicar definitivamente.' : 'A faixa de incerteza permaneceu controlada para a evidência disponível.'
  ];
  return {
    engineVersion: SUPREME_ENGINE_V3870_VERSION,
    philosophy: 'OTIMIZACAO_ROBUSTA_PARETO_SEM_OVERALL',
    improvements: [...IMPROVEMENTS],
    microRole: result.maxMatchV3860?.microRole ?? result.teamMap.functionLabel,
    searchRounds: search.rounds,
    candidatesGenerated: search.generated,
    candidatesEvaluated: search.candidates.length,
    phasesTested: PHASES.length,
    opponentsTested: OPPONENTS.length,
    winner,
    finalists: ranked.slice(0, 8),
    paretoFrontier: paretoSummary(ranked),
    marginalValues: marginals,
    skillTriggerMatrix: triggers,
    impetoStressTests: impetos,
    adaptiveVariants: adaptiveVariants(ranked),
    validationProtocol: validationProtocol(winner),
    confidence,
    decision,
    guardrails,
    summary: `${result.bestPosition.label} — ${decision === 'aprovada' ? 'ficha robusta aprovada' : 'ficha vencedora marcada para revisão'} com ${winner.supremeScore}/100, faixa conservadora ${winner.robustness.conservative}/100, pior fase ${winner.worstPhase}/100 e pior adversário ${winner.worstOpponent}/100.`
  };
}

export function applySupremePerformanceV3870(result: AnalysisResult): AnalysisResult {
  const analysis = buildSupremePerformanceV3870(result);
  const training = analysis.winner.training;
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = trainingPlanTotalCost(training);
  const skills = analysis.winner.skillPackage.skills;
  const recommendedSkills = skills.map((item) => item.name);
  const triggerMap = new Map(analysis.skillTriggerMatrix.map((item) => [normalizedText(item.skill), item]));
  const skillRecommendations = skills.map((item, index) => {
    const trigger = triggerMap.get(normalizedText(item.name));
    return {
      name: item.name,
      reason: `${item.gameplayImpact} Gatilho estimado ${trigger?.triggerRate ?? 0}/100; cobre ${trigger?.phaseCoverage.length ?? 0} fase(s) e ${trigger?.opponentCoverage.length ?? 0} arquétipo(s).`,
      tier: index < 3 ? 'essencial' as const : 'alternativa' as const
    };
  });
  const impetoByName = new Map((result.maxMatchV3860?.impetoCombinations ?? []).map((item) => [normalizedText(item.impeto.name), item.impeto]));
  const recommendedImpetos = analysis.impetoStressTests.map((item) => {
    const base = impetoByName.get(normalizedText(item.name));
    return {
      ...(base ?? { name: item.name, tier: item.verdict === 'ideal' ? 'ideal' as const : 'alternativo' as const, attributes: [] }),
      name: item.name,
      score: item.score,
      reason: `${base?.reason ?? ''} ${item.reason} Recalculado com a ficha final. Nota robusta v38.70: ${item.score}/100.`.trim(),
      evidence: [
        ...(base?.evidence ?? []),
        `Ímpeto recalculado com a ficha final v38.70 (${analysis.winner.supremeScore}/100), priorizando o pior cenário e evitando saturação.`
      ]
    };
  });
  const winnerVariant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.40 — Suprema v38.70 — ${analysis.microRole}`,
    positionLabel: result.bestPosition.label,
    training,
    pointsUsed: trainingPointsUsed,
    note: `Vencedora após ${analysis.candidatesEvaluated} candidatas, ${analysis.phasesTested} fases e ${analysis.opponentsTested} arquétipos de adversário.`,
    qualityScore: analysis.winner.supremeScore,
    adaptationLabel: 'ROBUSTA • PARETO • SEM OVERALL',
    highlights: [
      `Faixa conservadora ${analysis.winner.robustness.conservative}/100.`,
      `Pior fase ${analysis.winner.worstPhase}/100.`,
      `Pior adversário ${analysis.winner.worstOpponent}/100.`,
      `Sinergia de atributos ${analysis.winner.attributeSynergy}/100.`
    ],
    risks: analysis.guardrails.slice(-2),
    efficiencyScore: analysis.winner.dimensions.pointEfficiency,
    balanceScore: analysis.winner.bottleneckBalance,
    verdict: analysis.summary,
    tradeOffs: analysis.winner.tradeOffs,
    simulationsTested: analysis.candidatesEvaluated
  };
  return {
    ...result,
    training,
    trainingCost,
    trainingPointsUsed,
    trainingPointsRemaining: result.trainingPointsTotal - trainingPointsUsed,
    buildVariants: [winnerVariant, ...analysis.adaptiveVariants.slice(1).map((variant) => ({
      kind: 'alternative' as const,
      title: variant.label,
      positionLabel: result.bestPosition.label,
      training: variant.training,
      pointsUsed: trainingPlanTotalCost(variant.training),
      note: variant.purpose,
      qualityScore: variant.score,
      adaptationLabel: 'VARIANTE SITUACIONAL V38.70',
      highlights: [`Melhor fase: ${variant.bestPhase}.`, `Melhor confronto: ${variant.bestOpponent}.`],
      risks: ['Use somente quando o cenário indicado aparecer de forma recorrente.'],
      efficiencyScore: variant.score,
      balanceScore: variant.score,
      verdict: variant.purpose,
      tradeOffs: ['Não substitui automaticamente a ficha principal robusta.'],
      simulationsTested: analysis.candidatesEvaluated
    })), ...result.buildVariants.filter((item) => signature(item.training) !== signature(training))].slice(0, 5),
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos,
    buildName: winnerVariant.title,
    strengths: [winnerVariant.highlights.join(' '), ...result.strengths].slice(0, 10),
    weaknesses: [...analysis.guardrails.slice(-2), ...result.weaknesses].slice(0, 8),
    note: `${analysis.summary} Confirme o ganho em uma sequência controlada de partidas antes de considerar a ficha definitiva.`,
    supremeV3870: analysis,
    advancedOptimizer: {
      ...result.advancedOptimizer,
      combinationsTested: Math.max(result.advancedOptimizer.combinationsTested, analysis.candidatesEvaluated),
      winnerTitle: winnerVariant.title,
      winnerScore: analysis.winner.supremeScore,
      efficiencyScore: analysis.winner.dimensions.pointEfficiency,
      wasteScore: 100 - analysis.winner.dimensions.antiOverallWaste,
      unusedPoints: Math.max(0, result.trainingPointsTotal - trainingPointsUsed),
      usefulInvestment: analysis.marginalValues.filter((item) => item.verdict === 'proteger' || item.verdict === 'eficiente').map((item) => `${item.label}: ${item.reason}`).slice(0, 8),
      detectedWaste: analysis.marginalValues.filter((item) => item.verdict === 'saturado').map((item) => `${item.label}: ${item.reason}`).slice(0, 8),
      decisionReasons: [analysis.summary, ...result.advancedOptimizer.decisionReasons].slice(0, 8),
      positionPreserved: true,
      budgetRespected: trainingPointsUsed === result.trainingPointsTotal
    }
  };
}
