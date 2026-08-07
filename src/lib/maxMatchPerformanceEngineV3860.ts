import type {
  AnalysisResult,
  AttributeKey,
  MaxMatchBreakpoint,
  MaxMatchCandidate,
  MaxMatchCounterfactual,
  MaxMatchImpetoCombination,
  MaxMatchPerformanceV3860Analysis,
  MaxMatchScenarioId,
  MaxMatchScenarioScore,
  MaxMatchSkillPackage,
  PositionCode,
  PowerSkillDecision,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { ATTRIBUTE_PT } from './analyzerDomain';
import { availableOfficialAdditionalSkillCount, buildPersonalizedSkillPlan, skillPlanScore } from './skillIntelligenceV31';
import { filterComplementaryAdditionalSkills, skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_KEYS, normalizeTrainingPlan, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';
import { TRAINING_LABELS, type TrainingComparisonItem } from './trainingEngine';
import { fitTrainingToExactBudget } from '../modules/builds/trainingOptimizer';

export const MAX_MATCH_ENGINE_V3860_VERSION = '38.60.0' as const;

const IMPROVEMENTS = [
  'Simulação de desempenho por ação real, sem usar overall ou GER na nota.',
  'Microfunção automática por posição, estilo oficial, objetivo e DNA da carta.',
  'Avaliação separada de domínio, execução e repetibilidade de cada ação decisiva.',
  'Teste simultâneo em oito cenários de partida em vez de uma única média abstrata.',
  'Cenário ranqueado-base mede estabilidade contra adversários e conexões variadas.',
  'Cenário de delay alto protege domínio, passe curto, aceleração e resposta corporal.',
  'Cenário de espaços curtos mede tabelas, giro, condução firme e tomada de decisão.',
  'Cenário de pressão alta mede saída rápida, proteção da bola e passe sob contato.',
  'Cenário de transição mede ruptura, recuperação e velocidade funcional por posição.',
  'Cenário de duelos físicos adapta contato, equilíbrio, salto e agressividade à função.',
  'Cenário de fim de jogo reduz a nota de fichas que perdem desempenho com fadiga.',
  'Cenário de habilidade especial verifica se a progressão sustenta ativações frequentes.',
  'Pontuação min-max protege contra fichas excelentes em um cenário e frágeis nos demais.',
  'Métrica de consistência penaliza variações grandes entre tipos de partida.',
  'Pior cenário participa diretamente da decisão final, não fica escondido pela média.',
  'Projeção de atributos calcula o efeito funcional de cada grupo da progressão.',
  'Bandas funcionais internas detectam atributos decisivos abaixo da faixa da função.',
  'Bônus de breakpoint é aplicado apenas quando fecha uma lacuna realmente importante.',
  'Excesso acima da faixa útil deixa de receber vantagem automática.',
  'Busca local transfere pontos entre grupos para descobrir ganhos que os motores antigos não testaram.',
  'Busca de duas etapas encontra combinações que exigem retirar pontos de mais de um grupo.',
  'Candidatas específicas reforçam o elo mais fraco de cada cenário de partida.',
  'Candidata de resistência protege desempenho depois dos 70 minutos.',
  'Candidata anti-delay reduz peso e lentidão de comando sem descaracterizar a carta.',
  'Candidata de espaço curto favorece triangulação, tabela e giro sob marcação.',
  'Candidata de duelo usa altura e peso apenas quando a posição realmente aproveita o físico.',
  'Candidata de transição diferencia velocidade máxima de aceleração útil.',
  'Ação de primeiro toque tem nota própria para atacantes, meias e jogadores de saída.',
  'Ação sem bola tem nota própria para finalizadores, infiltradores e pressão defensiva.',
  'Ação de recuperação tem nota própria para zagueiros, volantes, laterais e meias versáteis.',
  'Pacotes de cinco habilidades são gerados para diferentes cenários, não apenas por ranking isolado.',
  'Cada pacote de habilidades recebe cobertura de função, ativação, cenário e redundância.',
  'Habilidades nativas, especiais e adicionais existentes continuam bloqueadas contra repetição.',
  'O pacote vencedor precisa cobrir papéis diferentes e ativar com frequência realista.',
  'Ímpeto é recalculado para o pior cenário da ficha, não apenas para sua maior qualidade.',
  'Ímpeto saturado perde pontos mesmo quando aumentaria o número visual da carta.',
  'Ímpeto que corrige um gargalo decisivo ganha prioridade sobre reforços cosméticos.',
  'Auditoria contrafactual testa trocas de pontos ao redor da vencedora.',
  'A ficha só é aprovada quando nenhuma troca local simples produz ganho relevante.',
  'Resultado final entrega titular, alternativa situacional e motivos de cada concessão.',
  'Confiança da leitura controla o quanto a otimização pode se afastar da ficha conservadora.',
  'Cartas com poucos atributos lidos recebem proteção contra especialização excessiva.',
  'Posição selecionada permanece travada durante todas as simulações e mutações.',
  'Orçamento é fechado exatamente em todas as candidatas válidas.',
  'Goleiros usam cenários e grupos exclusivos, sem herdar lógica de jogadores de linha.',
  'Altura, peso, pé dominante e condição são usados somente como contexto funcional.',
  'Formação e estilo do técnico ajustam pesos de posse, transição, pressão e cobertura.',
  'Perfil de controle ajusta passe, drible e jogo direto sem exigir seleção manual de personalidade.',
  'A nota final prioriza desempenho mínimo, execução da função e estabilidade competitiva.',
  'Overall permanece disponível apenas para exibição; nunca entra no cálculo da v38.60.'
] as const;

type AttributeWeights = Partial<Record<AttributeKey, number>>;
type TrainingWeights = Partial<Record<TrainingKey, number>>;
type CandidateSeed = { id: string; title: string; source: string; training: TrainingPlan };
type MicroRole = {
  id: string;
  label: string;
  trainingWeights: TrainingWeights;
  actionWeights: Record<string, number>;
  actionAttributes: Record<string, AttributeWeights>;
};
type ScenarioDefinition = {
  id: MaxMatchScenarioId;
  label: string;
  baseWeight: number;
  attributes: AttributeWeights;
  training: TrainingWeights;
  protectedActions: string[];
};

const GROUP_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
  shooting: { finishing: 1, placeKicking: 1, curl: 1 },
  passing: { lowPass: 1, loftedPass: 1 },
  dribbling: { ballControl: 1, dribbling: 1, tightPossession: 1 },
  dexterity: { offensiveAwareness: 1, acceleration: 1, balance: 1 },
  lowerBodyStrength: { speed: 1, kickingPower: 1, stamina: 1 },
  aerialStrength: { heading: 1, jump: 1, physicalContact: 1 },
  defending: { defensiveAwareness: 1, defensiveEngagement: 1, tackling: 1, aggression: 1 },
  gk1: { goalkeeperAwareness: 1, goalkeeperCatching: 1 },
  gk2: { goalkeeperParrying: 1, goalkeeperReflexes: 1 },
  gk3: { goalkeeperReach: 1, jump: 1 }
};

const POSITION_CORE: Record<PositionCode, AttributeWeights> = {
  GK: { goalkeeperAwareness: 1.25, goalkeeperReflexes: 1.35, goalkeeperReach: 1.25, goalkeeperParrying: 1.05, goalkeeperCatching: .8, jump: .45 },
  CB: { defensiveAwareness: 1.3, tackling: 1.2, defensiveEngagement: 1.1, physicalContact: .9, speed: .72, acceleration: .58, jump: .55, lowPass: .35 },
  LB: { defensiveAwareness: 1.0, tackling: .92, speed: .92, acceleration: .84, stamina: .82, balance: .55, lowPass: .48, loftedPass: .42 },
  RB: { defensiveAwareness: 1.0, tackling: .92, speed: .92, acceleration: .84, stamina: .82, balance: .55, lowPass: .48, loftedPass: .42 },
  DMF: { defensiveAwareness: 1.2, defensiveEngagement: 1.08, tackling: 1.05, lowPass: .8, physicalContact: .72, stamina: .65, ballControl: .5, speed: .42 },
  CMF: { lowPass: 1.05, ballControl: .85, tightPossession: .75, stamina: .78, balance: .65, defensiveEngagement: .55, acceleration: .52, loftedPass: .48 },
  LMF: { lowPass: .92, ballControl: .82, speed: .86, acceleration: .82, stamina: .82, dribbling: .68, balance: .62, defensiveEngagement: .35 },
  RMF: { lowPass: .92, ballControl: .82, speed: .86, acceleration: .82, stamina: .82, dribbling: .68, balance: .62, defensiveEngagement: .35 },
  AMF: { ballControl: 1.05, tightPossession: 1.0, lowPass: 1.02, dribbling: .85, offensiveAwareness: .75, acceleration: .68, balance: .68, finishing: .45 },
  SS: { ballControl: .95, tightPossession: .9, offensiveAwareness: .95, acceleration: .85, finishing: .82, dribbling: .72, lowPass: .68, balance: .65 },
  CF: { offensiveAwareness: 1.3, finishing: 1.25, acceleration: .88, kickingPower: .72, balance: .62, ballControl: .55, physicalContact: .52, speed: .48 },
  LWF: { dribbling: 1.0, ballControl: .9, tightPossession: .88, acceleration: .95, speed: .9, balance: .72, finishing: .62, lowPass: .42 },
  RWF: { dribbling: 1.0, ballControl: .9, tightPossession: .88, acceleration: .95, speed: .9, balance: .72, finishing: .62, lowPass: .42 }
};

const POSITION_TARGET: Record<PositionCode, number> = {
  GK: 88, CB: 86, LB: 84, RB: 84, DMF: 86, CMF: 84, LMF: 84, RMF: 84, AMF: 86, SS: 86, CF: 87, LWF: 86, RWF: 86
};

const SCENARIOS: ScenarioDefinition[] = [
  { id: 'RANKED_CORE', label: 'Ranqueada completa', baseWeight: 1.3, attributes: {}, training: {}, protectedActions: ['função principal', 'consistência', 'orçamento exato'] },
  { id: 'HIGH_DELAY', label: 'Delay alto', baseWeight: 1.05, attributes: { ballControl: 1, tightPossession: 1.15, lowPass: .95, acceleration: 1.1, balance: 1.0 }, training: { dribbling: .8, passing: .72, dexterity: .95, lowerBodyStrength: .45 }, protectedActions: ['primeiro toque', 'giro', 'passe curto'] },
  { id: 'TIGHT_SPACES', label: 'Espaços curtos', baseWeight: 1.0, attributes: { ballControl: 1.15, tightPossession: 1.25, dribbling: .85, lowPass: .95, balance: .85, acceleration: .72 }, training: { dribbling: 1.0, passing: .72, dexterity: .75 }, protectedActions: ['tabela', 'triangulação', 'proteção de posse'] },
  { id: 'HIGH_PRESS', label: 'Pressão adversária', baseWeight: .95, attributes: { ballControl: .9, lowPass: 1.0, acceleration: .75, balance: .9, physicalContact: .62, defensiveAwareness: .45 }, training: { passing: .85, dribbling: .62, dexterity: .62, lowerBodyStrength: .45, defending: .35 }, protectedActions: ['saída rápida', 'apoio', 'recuperação'] },
  { id: 'FAST_TRANSITION', label: 'Transição rápida', baseWeight: .92, attributes: { acceleration: 1.15, speed: 1.0, offensiveAwareness: .85, lowPass: .55, defensiveEngagement: .5, stamina: .5 }, training: { dexterity: .9, lowerBodyStrength: .85, passing: .35, defending: .3 }, protectedActions: ['ruptura', 'recomposição', 'ataque ao espaço'] },
  { id: 'PHYSICAL_DUELS', label: 'Duelos físicos', baseWeight: .82, attributes: { physicalContact: 1.05, balance: 1.0, jump: .62, aggression: .55, speed: .45 }, training: { aerialStrength: .75, lowerBodyStrength: .65, defending: .38, dexterity: .28 }, protectedActions: ['contato', 'segunda bola', 'proteção corporal'] },
  { id: 'LATE_GAME', label: 'Depois dos 70 minutos', baseWeight: .88, attributes: { stamina: 1.35, speed: .58, acceleration: .58, balance: .52, defensiveEngagement: .45, offensiveAwareness: .45 }, training: { lowerBodyStrength: 1.0, dexterity: .4, defending: .25 }, protectedActions: ['repetição', 'recomposição', 'lucidez final'] },
  { id: 'SPECIAL_SKILL_TRIGGER', label: 'Ativação de habilidades', baseWeight: .88, attributes: {}, training: {}, protectedActions: ['habilidades especiais', 'Top 5', 'Ímpeto'] }
];

const CATEGORY_ROLE: Record<UnifiedSkillDecision['category'], string> = {
  finalização: 'conclusão, movimentação e repertório de chute',
  passe: 'tabela, assistência e progressão rápida',
  drible: 'primeiro duelo, giro e condução em espaço curto',
  defesa: 'interceptação, desarme e proteção estrutural',
  aérea: 'disputa alta, segunda bola e finalização aérea',
  físico: 'contato, pressão e repetição de ações',
  goleiro: 'defesa, reação e segurança no rebote',
  mental: 'consistência e execução sob pressão'
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function allowedKeys(position: PositionCode): TrainingKey[] {
  return position === 'GK'
    ? ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength']
    : ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
}

function sanitize(plan: TrainingPlan, position: PositionCode) {
  const clean = normalizeTrainingPlan(plan);
  const allowed = new Set(allowedKeys(position));
  for (const key of TRAINING_KEYS) if (!allowed.has(key)) clean[key] = 0;
  return clean;
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function compareTraining(autoPlan: TrainingPlan | null | undefined, recommended: TrainingPlan): TrainingComparisonItem[] {
  return TRAINING_KEYS.map((key) => {
    const auto = Number(autoPlan?.[key] ?? 0);
    const rec = Number(recommended[key] ?? 0);
    return { key, label: TRAINING_LABELS[key], auto, recommended: rec, difference: rec - auto };
  }).filter((item) => item.auto > 0 || item.recommended > 0 || item.difference !== 0);
}

function exactPlan(plan: TrainingPlan, result: AnalysisResult, priority: TrainingKey[]) {
  return fitTrainingToExactBudget(sanitize(plan, result.bestPosition.code), priority, result.trainingPointsTotal, result.bestPosition.code);
}

function completeAttributes(result: AnalysisResult) {
  const present = Object.values(result.parsed.attributes).filter((value): value is number => Number.isFinite(value));
  const fallback = present.length ? Math.max(65, Math.min(82, average(present))) : 72;
  const output = {} as Record<AttributeKey, number>;
  for (const key of Object.keys(ATTRIBUTE_PT) as AttributeKey[]) output[key] = Number(result.parsed.attributes[key] ?? fallback);
  return output;
}

function projectedAttributes(result: AnalysisResult, plan: TrainingPlan) {
  const projected = completeAttributes(result);
  for (const [group, gains] of Object.entries(GROUP_GAINS) as Array<[TrainingKey, Partial<Record<AttributeKey, number>>]>) {
    const level = Number(plan[group] ?? 0);
    for (const [attribute, gain] of Object.entries(gains) as Array<[AttributeKey, number]>) {
      projected[attribute] = Math.min(110, Number(projected[attribute] ?? 0) + level * Number(gain));
    }
  }
  return projected;
}

function weightedAttributeScore(attributes: Record<AttributeKey, number>, weights: AttributeWeights, target: number) {
  let total = 0;
  let weightTotal = 0;
  for (const [attribute, weight] of Object.entries(weights) as Array<[AttributeKey, number]>) {
    if (weight <= 0) continue;
    const value = Number(attributes[attribute] ?? 0);
    const deficit = Math.max(0, target - value);
    const excess = Math.max(0, value - (target + 12));
    total += clamp(100 - deficit * 4.4 - excess * .18) * weight;
    weightTotal += weight;
  }
  return weightTotal ? clamp(total / weightTotal) : 72;
}

function trainingPriority(result: AnalysisResult, role: MicroRole) {
  const position = result.bestPosition.code;
  return allowedKeys(position).sort((left, right) => Number(role.trainingWeights[right] ?? 0) - Number(role.trainingWeights[left] ?? 0));
}

function roleFromResult(result: AnalysisResult): MicroRole {
  const position = result.bestPosition.code;
  const style = normalizeText(result.parsed.playstyle);
  const objective = result.objective ?? 'COMPETITIVE';
  const role = (id: string, label: string, trainingWeights: TrainingWeights, actionAttributes: Record<string, AttributeWeights>, actionWeights: Record<string, number>): MicroRole => ({ id, label, trainingWeights, actionAttributes, actionWeights });

  if (position === 'GK') {
    if (/ofensivo/.test(style)) return role('GK_SWEEPER', 'Goleiro de reação e cobertura', { gk2: 1.35, gk3: 1.22, gk1: 1.0, lowerBodyStrength: .36, aerialStrength: .35 }, {
      'Reação curta': { goalkeeperReflexes: 1.3, goalkeeperParrying: 1.0, goalkeeperAwareness: .85 },
      'Cobertura da meta': { goalkeeperReach: 1.25, goalkeeperAwareness: 1.0, jump: .55 },
      'Segurança do rebote': { goalkeeperParrying: 1.2, goalkeeperCatching: .95, goalkeeperAwareness: .8 }
    }, { 'Reação curta': 1.25, 'Cobertura da meta': 1.1, 'Segurança do rebote': .9 });
    return role('GK_STOPPER', 'Goleiro defensor de máxima reação', { gk2: 1.45, gk3: 1.25, gk1: 1.08, aerialStrength: .4 }, {
      'Defesa imediata': { goalkeeperReflexes: 1.35, goalkeeperParrying: 1.1, goalkeeperAwareness: 1.0 },
      'Alcance': { goalkeeperReach: 1.35, jump: .5, goalkeeperAwareness: .85 },
      'Firmeza': { goalkeeperCatching: 1.05, goalkeeperAwareness: 1.0, goalkeeperParrying: .65 }
    }, { 'Defesa imediata': 1.3, 'Alcance': 1.05, 'Firmeza': .8 });
  }

  if (position === 'CB') {
    if (/defensor criativo/.test(style)) return role('CB_BUILDER', 'Zagueiro construtor e dominante', { defending: 1.45, lowerBodyStrength: .82, aerialStrength: .78, passing: .65, dexterity: .42 }, {
      'Antecipação': { defensiveAwareness: 1.3, defensiveEngagement: 1.0, acceleration: .45 },
      'Duelo defensivo': { tackling: 1.25, physicalContact: .9, aggression: .7, balance: .45 },
      'Saída limpa': { lowPass: 1.15, ballControl: .8, tightPossession: .55, loftedPass: .45 }
    }, { 'Antecipação': 1.25, 'Duelo defensivo': 1.15, 'Saída limpa': .75 });
    return role('CB_STOPPER', 'Zagueiro de imposição e cobertura', { defending: 1.55, aerialStrength: 1.0, lowerBodyStrength: .9, dexterity: .5, passing: .3 }, {
      'Marcação': { defensiveAwareness: 1.35, defensiveEngagement: 1.05, tackling: .95 },
      'Duelo': { tackling: 1.25, physicalContact: 1.0, aggression: .8 },
      'Cobertura': { speed: .95, acceleration: .85, defensiveAwareness: .8, jump: .35 }
    }, { Marcação: 1.25, Duelo: 1.15, Cobertura: .9 });
  }

  if (position === 'DMF') {
    if (/orquestrador/.test(style)) return role('DMF_CONTROLLER', 'Volante organizador e protetor', { defending: 1.35, passing: 1.05, lowerBodyStrength: .72, dribbling: .4, dexterity: .45 }, {
      'Proteção central': { defensiveAwareness: 1.25, defensiveEngagement: 1.0, tackling: .9 },
      'Primeiro passe': { lowPass: 1.2, ballControl: .8, tightPossession: .55, loftedPass: .5 },
      'Saída sob pressão': { ballControl: .9, tightPossession: .9, balance: .72, lowPass: .72 }
    }, { 'Proteção central': 1.2, 'Primeiro passe': 1.0, 'Saída sob pressão': .75 });
    return role('DMF_ANCHOR', 'Âncora de recuperação e passe seguro', { defending: 1.55, lowerBodyStrength: .82, passing: .72, aerialStrength: .5, dexterity: .4 }, {
      'Cobertura': { defensiveAwareness: 1.35, defensiveEngagement: 1.15, speed: .38 },
      'Recuperação': { tackling: 1.25, aggression: .9, physicalContact: .75, acceleration: .5 },
      'Passe seguro': { lowPass: 1.05, ballControl: .72, balance: .55 }
    }, { Cobertura: 1.25, Recuperação: 1.15, 'Passe seguro': .72 });
  }

  if (position === 'CMF' || position === 'LMF' || position === 'RMF') {
    if (/meia versatil|infiltracao/.test(style) || objective === 'PRESSING') return role('MID_BOX', 'Meia versátil de apoio e pressão', { passing: 1.1, lowerBodyStrength: 1.0, dexterity: .78, defending: .7, dribbling: .55, shooting: .35 }, {
      'Circulação': { lowPass: 1.15, ballControl: .8, tightPossession: .62 },
      'Chegada': { offensiveAwareness: .85, acceleration: .82, finishing: .52, kickingPower: .45 },
      'Recomposição': { stamina: 1.15, defensiveEngagement: .85, speed: .62, tackling: .52 }
    }, { Circulação: 1.12, Chegada: .8, Recomposição: 1.0 });
    return role('MID_CONTROLLER', 'Meia de controle e triangulação', { passing: 1.25, dribbling: .82, dexterity: .75, lowerBodyStrength: .65, defending: .48 }, {
      'Tabela curta': { lowPass: 1.25, ballControl: .92, tightPossession: .78 },
      'Giro e apoio': { tightPossession: 1.1, balance: .88, acceleration: .68, dribbling: .58 },
      'Passe vertical': { lowPass: 1.0, loftedPass: .75, ballControl: .55, kickingPower: .35 }
    }, { 'Tabela curta': 1.25, 'Giro e apoio': 1.0, 'Passe vertical': .8 });
  }

  if (position === 'AMF') return role('AMF_CREATOR', 'Armador central de tabela e último passe', { passing: 1.35, dribbling: 1.08, dexterity: .95, shooting: .55, lowerBodyStrength: .38 }, {
    'Primeiro toque': { ballControl: 1.2, tightPossession: 1.12, balance: .72 },
    'Tabela': { lowPass: 1.25, ballControl: .85, acceleration: .6 },
    'Último passe': { lowPass: 1.15, loftedPass: .72, curl: .55, offensiveAwareness: .55 },
    'Infiltração curta': { offensiveAwareness: .85, acceleration: .85, finishing: .52, balance: .5 }
  }, { 'Primeiro toque': 1.15, Tabela: 1.2, 'Último passe': 1.05, 'Infiltração curta': .72 });

  if (position === 'SS') return role('SS_CONNECTOR', 'Segundo atacante de conexão e ruptura', { dribbling: 1.08, dexterity: 1.08, shooting: .92, passing: .82, lowerBodyStrength: .58 }, {
    'Conexão curta': { ballControl: 1.1, lowPass: 1.0, tightPossession: .92, balance: .68 },
    'Ruptura': { offensiveAwareness: 1.05, acceleration: 1.0, speed: .52 },
    'Conclusão rápida': { finishing: 1.15, offensiveAwareness: .82, kickingPower: .6, balance: .45 },
    'Drible funcional': { dribbling: 1.0, tightPossession: .95, acceleration: .72, balance: .72 }
  }, { 'Conexão curta': 1.05, Ruptura: 1.05, 'Conclusão rápida': 1.0, 'Drible funcional': .85 });

  if (position === 'CF') {
    if (/pivo|puxa marcacao|atacante pivo/.test(style)) return role('CF_LINK', 'Centroavante pivô e finalizador', { shooting: 1.35, dexterity: .95, lowerBodyStrength: .9, aerialStrength: .85, passing: .48, dribbling: .42 }, {
      'Pivô': { physicalContact: 1.15, ballControl: .9, balance: .85, lowPass: .55 },
      'Ataque à área': { offensiveAwareness: 1.25, acceleration: .82, finishing: .78 },
      'Finalização': { finishing: 1.3, kickingPower: .78, offensiveAwareness: .75 },
      'Jogo aéreo': { heading: 1.0, jump: .85, physicalContact: .72, finishing: .45 }
    }, { Pivô: .95, 'Ataque à área': 1.15, Finalização: 1.25, 'Jogo aéreo': .7 });
    return role('CF_KILLER', 'Finalizador de ruptura e pressão', { shooting: 1.55, dexterity: 1.15, lowerBodyStrength: .82, dribbling: .42, aerialStrength: .5 }, {
      'Movimento sem bola': { offensiveAwareness: 1.35, acceleration: 1.0, speed: .5 },
      'Finalização imediata': { finishing: 1.35, kickingPower: .72, balance: .52 },
      'Primeiro toque': { ballControl: 1.0, tightPossession: .7, balance: .65 },
      'Pressão inicial': { acceleration: .82, stamina: .68, aggression: .52, defensiveEngagement: .38 }
    }, { 'Movimento sem bola': 1.25, 'Finalização imediata': 1.3, 'Primeiro toque': .75, 'Pressão inicial': .55 });
  }

  if (position === 'LWF' || position === 'RWF') return role('WIDE_INSIDE', 'Atacante de condução para dentro', { dribbling: 1.25, dexterity: 1.12, shooting: .85, lowerBodyStrength: .72, passing: .5 }, {
    'Condução': { dribbling: 1.15, ballControl: .95, tightPossession: .9, balance: .68 },
    'Arranque': { acceleration: 1.15, speed: .92, balance: .55 },
    'Entrada na área': { offensiveAwareness: .95, finishing: .82, acceleration: .75 },
    'Tabela por dentro': { lowPass: .95, ballControl: .82, tightPossession: .65 }
  }, { Condução: 1.15, Arranque: 1.05, 'Entrada na área': .95, 'Tabela por dentro': .7 });

  return role('FULLBACK_BALANCED', 'Lateral de segurança e apoio interno', { defending: 1.15, lowerBodyStrength: 1.0, passing: .72, dexterity: .72, dribbling: .42 }, {
    'Fechamento': { defensiveAwareness: 1.15, tackling: 1.0, speed: .62, acceleration: .55 },
    'Recomposição': { speed: 1.0, acceleration: .85, stamina: .95, defensiveEngagement: .62 },
    'Passe de apoio': { lowPass: 1.0, ballControl: .72, balance: .58 },
    'Duelo lateral': { tackling: .95, balance: .78, physicalContact: .62, acceleration: .6 }
  }, { Fechamento: 1.15, Recomposição: 1.05, 'Passe de apoio': .7, 'Duelo lateral': .82 });
}

function scenarioWeight(result: AnalysisResult, scenario: ScenarioDefinition) {
  let weight = scenario.baseWeight;
  const connection = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const style = result.tacticalProfile.style;
  const formation = result.tacticalProfile.formation;
  const control = result.tacticalProfile.controlProfile ?? 'AUTO';
  if (scenario.id === 'HIGH_DELAY' && connection === 'HIGH_DELAY') weight += .65;
  if (scenario.id === 'RANKED_CORE' && result.tacticalProfile.gameplayMode === 'RANKED') weight += .3;
  if (scenario.id === 'TIGHT_SPACES' && (style === 'POSSE_DE_BOLA' || control === 'PASSING' || control === 'DRIBBLE')) weight += .35;
  if (scenario.id === 'FAST_TRANSITION' && (style === 'CONTRA_ATAQUE_RAPIDO' || style === 'CONTRA_ATAQUE')) weight += .32;
  if (scenario.id === 'HIGH_PRESS' && ['4-2-2-2', '4-3-1-2', '4-2-3-1'].includes(formation)) weight += .15;
  if (scenario.id === 'PHYSICAL_DUELS' && (result.bestPosition.code === 'CB' || result.bestPosition.code === 'DMF' || result.bestPosition.code === 'CF')) weight += .22;
  if (scenario.id === 'LATE_GAME' && ['CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB'].includes(result.bestPosition.code)) weight += .25;
  return weight;
}

function actionScores(attributes: Record<AttributeKey, number>, role: MicroRole, position: PositionCode) {
  const target = POSITION_TARGET[position];
  return Object.fromEntries(Object.entries(role.actionAttributes).map(([label, weights]) => [label, weightedAttributeScore(attributes, weights, target)]));
}

function weightedActionAverage(scores: Record<string, number>, role: MicroRole) {
  let sum = 0;
  let total = 0;
  for (const [label, score] of Object.entries(scores)) {
    const weight = Number(role.actionWeights[label] ?? 1);
    sum += score * weight;
    total += weight;
  }
  return total ? clamp(sum / total) : 70;
}

function groupSupport(plan: TrainingPlan, weights: TrainingWeights) {
  let score = 0;
  let total = 0;
  for (const [key, weight] of Object.entries(weights) as Array<[TrainingKey, number]>) {
    const level = Number(plan[key] ?? 0);
    score += Math.min(100, level * 9.5 + 28) * weight;
    total += weight;
  }
  return total ? clamp(score / total) : 70;
}

function specialSkillSupport(result: AnalysisResult, plan: TrainingPlan) {
  const synergies = result.cardDna?.skillSynergies ?? [];
  if (!synergies.length) return result.parsed.specialSkills.length ? 72 : 78;
  const scored = synergies.map((item) => {
    const group = item.trainingGroups.length ? average(item.trainingGroups.map((key) => Math.min(100, Number(plan[key] ?? 0) * 9 + 25))) : 70;
    const frequency = item.expectedFrequency === 'alta' ? 100 : item.expectedFrequency === 'média' ? 78 : 58;
    return clamp(group * .62 + frequency * .38);
  });
  return clamp(average(scored));
}

function scenarioScores(result: AnalysisResult, plan: TrainingPlan, attributes: Record<AttributeKey, number>, role: MicroRole, actions: Record<string, number>, skillScore: number, impetoScore: number): MaxMatchScenarioScore[] {
  const position = result.bestPosition.code;
  const core = weightedAttributeScore(attributes, POSITION_CORE[position], POSITION_TARGET[position]);
  const actionAverage = weightedActionAverage(actions, role);
  const scenarioResults = SCENARIOS.map((scenario) => {
    const weight = scenarioWeight(result, scenario);
    let score = 0;
    if (scenario.id === 'RANKED_CORE') score = clamp(core * .48 + actionAverage * .42 + (trainingPlanTotalCost(plan) === result.trainingPointsTotal ? 100 : 0) * .1);
    else if (scenario.id === 'SPECIAL_SKILL_TRIGGER') score = clamp(specialSkillSupport(result, plan) * .48 + skillScore * .34 + impetoScore * .18);
    else {
      const attrScore = weightedAttributeScore(attributes, scenario.attributes, POSITION_TARGET[position] - (scenario.id === 'PHYSICAL_DUELS' ? 3 : 1));
      const trainingScore = groupSupport(plan, scenario.training);
      score = clamp(attrScore * .58 + trainingScore * .22 + actionAverage * .2);
    }
    const entries = Object.entries(scenario.attributes) as Array<[AttributeKey, number]>;
    const bottleneck = entries.length
      ? entries.sort((left, right) => Number(attributes[left[0]] ?? 0) - Number(attributes[right[0]] ?? 0))[0][0]
      : (Object.entries(POSITION_CORE[position]) as Array<[AttributeKey, number]>).sort((left, right) => Number(attributes[left[0]] ?? 0) - Number(attributes[right[0]] ?? 0))[0][0];
    return { id: scenario.id, label: scenario.label, score, weight, bottleneck: ATTRIBUTE_PT[bottleneck], protectedActions: scenario.protectedActions };
  });
  return scenarioResults;
}

function scenarioSummary(scores: MaxMatchScenarioScore[]) {
  const weightTotal = scores.reduce((sum, item) => sum + item.weight, 0);
  const weighted = scores.reduce((sum, item) => sum + item.score * item.weight, 0) / Math.max(1, weightTotal);
  const worst = Math.min(...scores.map((item) => item.score));
  const mean = average(scores.map((item) => item.score));
  const variance = average(scores.map((item) => (item.score - mean) ** 2));
  const consistency = clamp(100 - Math.sqrt(variance) * 3.1);
  return { average: clamp(weighted), worst, consistency, minMax: clamp(weighted * .55 + worst * .3 + consistency * .15) };
}

function breakpointAnalysis(result: AnalysisResult, attributes: Record<AttributeKey, number>) {
  const core = Object.entries(POSITION_CORE[result.bestPosition.code]) as Array<[AttributeKey, number]>;
  const target = POSITION_TARGET[result.bestPosition.code];
  return core
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([attribute], index): MaxMatchBreakpoint => {
      const projected = Math.round(attributes[attribute]);
      const targetBand = target - (index >= 5 ? 4 : index >= 3 ? 2 : 0);
      const delta = projected - targetBand;
      const status: MaxMatchBreakpoint['status'] = delta >= 5 ? 'acima' : delta >= 0 ? 'atingido' : delta >= -3 ? 'proximo' : 'abaixo';
      const impact = status === 'abaixo'
        ? `Gargalo funcional: faltam aproximadamente ${Math.abs(delta)} ponto(s) para a faixa interna da função.`
        : status === 'proximo'
          ? 'Próximo da faixa funcional; uma redistribuição pequena pode alterar a consistência.'
          : status === 'atingido'
            ? 'Faixa funcional atingida sem excesso relevante.'
            : 'Acima da faixa funcional; novos pontos neste atributo tendem a render menos.';
      return { attribute, label: ATTRIBUTE_PT[attribute], projected, targetBand, status, impact };
    });
}

function breakpointScore(items: MaxMatchBreakpoint[]) {
  const value = items.reduce((sum, item) => sum + (item.status === 'acima' ? 96 : item.status === 'atingido' ? 100 : item.status === 'proximo' ? 78 : Math.max(25, 64 - (item.targetBand - item.projected) * 4)), 0);
  return clamp(value / Math.max(1, items.length));
}

function fatigueResistance(attributes: Record<AttributeKey, number>, position: PositionCode) {
  const staminaWeight = ['CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB'].includes(position) ? 1.45 : position === 'GK' ? .25 : .95;
  return weightedAttributeScore(attributes, { stamina: staminaWeight, speed: .45, acceleration: .45, balance: .5, physicalContact: .3 }, position === 'GK' ? 76 : 83);
}

function duelReliability(attributes: Record<AttributeKey, number>, position: PositionCode) {
  if (position === 'GK') return weightedAttributeScore(attributes, { goalkeeperAwareness: 1, goalkeeperReach: .9, jump: .55, physicalContact: .3 }, 84);
  const defensive = ['CB', 'DMF', 'LB', 'RB'].includes(position);
  return weightedAttributeScore(attributes, defensive
    ? { tackling: 1.0, defensiveAwareness: .85, physicalContact: .82, balance: .65, acceleration: .45, jump: .4 }
    : { balance: 1.0, physicalContact: .7, ballControl: .65, acceleration: .55, tightPossession: .45 }, defensive ? 84 : 82);
}

function tightSpaceControl(attributes: Record<AttributeKey, number>, position: PositionCode) {
  if (position === 'GK') return weightedAttributeScore(attributes, { goalkeeperAwareness: 1, goalkeeperReflexes: 1.1, goalkeeperParrying: .8 }, 86);
  return weightedAttributeScore(attributes, { ballControl: 1.15, tightPossession: 1.2, balance: 1.0, lowPass: .72, acceleration: .7, dribbling: .55 }, ['CB', 'DMF', 'LB', 'RB'].includes(position) ? 80 : 85);
}

function transitionImpact(attributes: Record<AttributeKey, number>, position: PositionCode) {
  if (position === 'GK') return weightedAttributeScore(attributes, { goalkeeperAwareness: 1.05, goalkeeperReach: .8, goalkeeperReflexes: .8 }, 84);
  const offensive = ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position);
  return weightedAttributeScore(attributes, offensive
    ? { acceleration: 1.2, offensiveAwareness: 1.0, speed: .82, ballControl: .55, lowPass: .4 }
    : { acceleration: .82, speed: .82, defensiveEngagement: .72, lowPass: .68, stamina: .58 }, offensive ? 85 : 83);
}

function skillCategoryGroups(category: UnifiedSkillDecision['category']): TrainingKey[] {
  if (category === 'finalização') return ['shooting', 'dexterity'];
  if (category === 'passe') return ['passing', 'dribbling'];
  if (category === 'drible') return ['dribbling', 'dexterity'];
  if (category === 'defesa') return ['defending', 'lowerBodyStrength'];
  if (category === 'aérea') return ['aerialStrength', 'lowerBodyStrength'];
  if (category === 'físico') return ['lowerBodyStrength', 'aerialStrength'];
  if (category === 'goleiro') return ['gk1', 'gk2', 'gk3'];
  return ['dexterity', 'lowerBodyStrength'];
}

function toPowerSkills(result: AnalysisResult, decisions: UnifiedSkillDecision[]): PowerSkillDecision[] {
  const safeNames = filterComplementaryAdditionalSkills(decisions.map((item) => item.name), result.parsed.nativeSkills, result.parsed.specialSkills, 5, result.parsed.additionalSkills ?? []);
  return safeNames.map((name, index) => {
    const item = decisions.find((decision) => skillIdentityKey(decision.name) === skillIdentityKey(name)) ?? {
      name,
      score: 65,
      priority: 'complementar' as const,
      category: 'mental' as const,
      gameplayImpact: 'Complemento funcional oficial.',
      reasons: ['Mantida pelo filtro oficial.'],
      supportedBy: [],
      identityBoost: 0
    };
    return {
      ...item,
      priority: index === 0 || item.score >= 88 ? 'essencial' : index < 3 ? 'alta' : 'complementar',
      activationFrequency: item.score >= 88 ? 'muito alta' : item.score >= 75 ? 'alta' : 'média',
      coverageRole: CATEGORY_ROLE[item.category],
      redundancyPenalty: 0
    };
  });
}

function preferredSkillProfiles(result: AnalysisResult): Array<{ id: string; label: string; categories: UnifiedSkillDecision['category'][] }> {
  const position = result.bestPosition.code;
  if (position === 'GK') return [
    { id: 'gk-core', label: 'Defesa total', categories: ['goleiro', 'goleiro', 'goleiro', 'mental', 'físico'] },
    { id: 'gk-pressure', label: 'Reação sob pressão', categories: ['goleiro', 'goleiro', 'mental', 'físico', 'goleiro'] }
  ];
  if (['CB', 'DMF', 'LB', 'RB'].includes(position)) return [
    { id: 'def-core', label: 'Defesa dominante', categories: ['defesa', 'defesa', 'físico', 'aérea', 'passe'] },
    { id: 'def-build', label: 'Recuperação e saída', categories: ['defesa', 'passe', 'defesa', 'físico', 'mental'] },
    { id: 'def-delay', label: 'Segurança sob delay', categories: ['defesa', 'passe', 'físico', 'mental', 'defesa'] }
  ];
  if (['CMF', 'LMF', 'RMF'].includes(position)) return [
    { id: 'mid-control', label: 'Controle e tabela', categories: ['passe', 'passe', 'drible', 'físico', 'defesa'] },
    { id: 'mid-pressure', label: 'Pressão e transição', categories: ['passe', 'defesa', 'físico', 'drible', 'mental'] },
    { id: 'mid-create', label: 'Criação central', categories: ['passe', 'passe', 'drible', 'mental', 'finalização'] }
  ];
  return [
    { id: 'attack-core', label: 'Ataque decisivo', categories: ['finalização', 'drible', 'passe', 'físico', 'mental'] },
    { id: 'attack-combine', label: 'Tabela e ruptura', categories: ['passe', 'drible', 'finalização', 'mental', 'físico'] },
    { id: 'attack-clinical', label: 'Conclusão máxima', categories: ['finalização', 'finalização', 'drible', 'passe', 'físico'] },
    { id: 'attack-delay', label: 'Resposta sob delay', categories: ['drible', 'passe', 'mental', 'finalização', 'físico'] }
  ];
}

function skillPackages(result: AnalysisResult, plan: TrainingPlan, role: MicroRole): MaxMatchSkillPackage[] {
  // Nem toda carta possui cinco vagas oficiais disponíveis. Cartas com muitas
  // habilidades nativas/especiais podem ter de zero a quatro opções restantes.
  // O motor antigo exigia exatamente cinco e eliminava todas as candidatas,
  // fazendo a análise inteira falhar mesmo quando a ficha de progressão era válida.
  const expectedSkillCount = Math.min(5, availableOfficialAdditionalSkillCount(result));
  const profiles = [{ id: 'automatic', label: 'Automático pela carta', categories: [] as UnifiedSkillDecision['category'][] }, ...preferredSkillProfiles(result)];
  const packages = profiles.map((profile) => {
    const raw = buildPersonalizedSkillPlan(result, plan, profile.categories.length ? { label: profile.label, preferredCategories: profile.categories } : { label: profile.label });
    const skills = toPowerSkills(result, raw).slice(0, expectedSkillCount);
    const categoryCount = new Set(skills.map((item) => item.category)).size;
    const groups = skills.flatMap((item) => skillCategoryGroups(item.category));
    const roleGroups = Object.entries(role.trainingWeights).sort((left, right) => Number(right[1]) - Number(left[1])).slice(0, 4).map(([key]) => key as TrainingKey);
    const roleCoverage = expectedSkillCount === 0
      ? 100
      : clamp(roleGroups.filter((group) => groups.includes(group)).length / Math.max(1, roleGroups.length) * 100);
    const activationCoverage = expectedSkillCount === 0 ? 100 : clamp(average(skills.map((item) => item.score)));
    const scenarioFit = expectedSkillCount === 0
      ? 100
      : clamp(skillPlanScore(skills) * .72 + categoryCount * 6 + roleCoverage * .12);
    const redundancyPenalty = expectedSkillCount === 0
      ? 0
      : clamp(Math.max(0, Math.min(3, expectedSkillCount) - categoryCount) * 8 + skills.reduce((sum, item) => sum + item.redundancyPenalty, 0));
    const score = clamp(activationCoverage * .42 + roleCoverage * .25 + scenarioFit * .33 - redundancyPenalty);
    return { id: profile.id, label: profile.label, skills, score, activationCoverage, roleCoverage, scenarioFit, redundancyPenalty };
  }).filter((item) => item.skills.length === expectedSkillCount);
  const unique = new Map<string, MaxMatchSkillPackage>();
  for (const item of packages) {
    const key = item.skills.map((skill) => skillIdentityKey(skill.name)).sort().join('|') || 'sem-vagas-adicionais';
    const current = unique.get(key);
    if (!current || item.score > current.score) unique.set(key, item);
  }
  return [...unique.values()].sort((left, right) => right.score - left.score);
}

function groupGap(plan: TrainingPlan, role: MicroRole, key: TrainingKey) {
  const weight = Number(role.trainingWeights[key] ?? 0);
  const expected = weight >= 1.25 ? 10 : weight >= .9 ? 8 : weight >= .6 ? 6 : 4;
  return Math.max(0, expected - Number(plan[key] ?? 0));
}

function impetoCombinations(result: AnalysisResult, plan: TrainingPlan, role: MicroRole, weakest: MaxMatchScenarioScore): MaxMatchImpetoCombination[] {
  const source = result.powerBuildV3850?.impetos?.length ? result.powerBuildV3850.impetos : result.recommendedImpetos.map((item, index) => ({
    ...item,
    performanceScore: Number(item.score ?? Math.max(30, 82 - index * 5)),
    roleFit: 65,
    attributeCoverage: 60,
    buildSynergy: 60,
    skillSynergy: 55,
    saturationPenalty: 0,
    supportedGroups: [] as TrainingKey[]
  }));
  return source.map((impeto) => {
    const groups = impeto.supportedGroups ?? [];
    const gaps = groups.map((key) => groupGap(plan, role, key));
    const gapCoverage = gaps.length ? average(gaps) : 0;
    const saturation = groups.reduce((sum, key) => sum + Math.max(0, Number(plan[key] ?? 0) - 11) * 4, 0);
    const weakestScenarioGain = clamp(gapCoverage * 7 + (weakest.score < 75 ? 10 : 4) - saturation);
    const score = clamp(Number(impeto.performanceScore ?? impeto.score ?? 50) * .64 + weakestScenarioGain * .24 + Number(impeto.roleFit ?? 50) * .12 - saturation);
    return {
      impeto: { ...impeto, performanceScore: score, saturationPenalty: clamp(Number(impeto.saturationPenalty ?? 0) + saturation), tier: 'alternativo' },
      score,
      weakestScenarioGain,
      reason: groups.length
        ? `Reforça ${groups.map((key) => TRAINING_LABELS[key]).join(', ')} e foi medido contra o cenário mais fraco: ${weakest.label}.`
        : `Mantido como alternativa, mas sem grupo funcional suficiente para superar o cenário ${weakest.label}.`
    };
  }).sort((left, right) => right.score - left.score).map((item, index) => ({ ...item, impeto: { ...item.impeto, tier: index === 0 ? 'ideal' : index < 5 ? 'alternativo' : 'evitar' } }));
}

function seedFromWeights(role: MicroRole, boosts: TrainingWeights = {}) {
  const plan = normalizeTrainingPlan({} as TrainingPlan);
  for (const key of TRAINING_KEYS) {
    const weight = Number(role.trainingWeights[key] ?? 0) + Number(boosts[key] ?? 0);
    plan[key] = weight >= 1.4 ? 9 : weight >= 1.05 ? 7 : weight >= .7 ? 5 : weight >= .4 ? 3 : 0;
  }
  return plan;
}

function collectSeeds(result: AnalysisResult, role: MicroRole, priority: TrainingKey[]) {
  const seeds: CandidateSeed[] = [];
  const add = (id: string, title: string, source: string, training?: TrainingPlan | null) => {
    if (!training) return;
    seeds.push({ id, title, source, training });
  };
  add('current', 'Ficha atual', 'pipeline atual', result.training);
  add('v3850-winner', 'Vencedora v38.50', 'Motor de Desempenho v38.50', result.powerBuildV3850?.winner.training);
  result.powerBuildV3850?.finalists.forEach((item, index) => add(`v3850-${index}`, item.title, 'finalistas v38.50', item.training));
  result.buildVariants.forEach((item, index) => add(`variant-${index}`, item.title, 'variantes existentes', item.training));
  add('role-core', 'Microfunção dominante', 'novo motor v38.60', seedFromWeights(role));
  add('anti-delay', 'Resposta máxima sob delay', 'novo motor v38.60', seedFromWeights(role, { dribbling: .65, passing: .55, dexterity: .8, lowerBodyStrength: .35, gk2: .55, gk3: .4 }));
  add('tight-space', 'Tabela e espaço curto', 'novo motor v38.60', seedFromWeights(role, { dribbling: .75, passing: .7, dexterity: .55 }));
  add('late-game', 'Resistência competitiva', 'novo motor v38.60', seedFromWeights(role, { lowerBodyStrength: .85, dexterity: .25, defending: .2 }));
  add('transition', 'Transição e ruptura', 'novo motor v38.60', seedFromWeights(role, { dexterity: .75, lowerBodyStrength: .7, shooting: .35, defending: .25 }));
  add('duel', 'Duelos e proteção', 'novo motor v38.60', seedFromWeights(role, { aerialStrength: .7, lowerBodyStrength: .55, defending: .42, dexterity: .25 }));

  const basePlans = [...seeds.map((seed) => exactPlan(seed.training, result, priority))];
  const keys = allowedKeys(result.bestPosition.code);
  const destinationKeys = priority.slice(0, Math.min(4, priority.length));
  for (const [baseIndex, base] of basePlans.slice(0, 4).entries()) {
    for (const from of keys) {
      if (base[from] <= 0) continue;
      for (const to of destinationKeys) {
        if (from === to) continue;
        const mutated = { ...base, [from]: Math.max(0, base[from] - 1), [to]: Math.min(16, base[to] + 1) };
        add(`local-${baseIndex}-${from}-${to}`, `Ajuste local ${TRAINING_LABELS[from]} → ${TRAINING_LABELS[to]}`, 'busca local v38.60', mutated);
      }
    }
  }

  const coreKeys = priority.slice(0, Math.min(5, priority.length));
  for (let a = 0; a < coreKeys.length; a += 1) {
    for (let b = a + 1; b < coreKeys.length; b += 1) {
      const plan = seedFromWeights(role, { [coreKeys[a]]: .8, [coreKeys[b]]: .65 });
      add(`pair-${coreKeys[a]}-${coreKeys[b]}`, `Dupla decisiva: ${TRAINING_LABELS[coreKeys[a]]} + ${TRAINING_LABELS[coreKeys[b]]}`, 'busca combinatória v38.60', plan);
    }
  }
  return seeds;
}

function pointEfficiency(plan: TrainingPlan, role: MicroRole, result: AnalysisResult) {
  let useful = 0;
  let total = 0;
  for (const key of allowedKeys(result.bestPosition.code)) {
    const level = Number(plan[key] ?? 0);
    const weight = Number(role.trainingWeights[key] ?? 0);
    const usefulCap = weight >= 1.3 ? 13 : weight >= .9 ? 11 : weight >= .55 ? 9 : 6;
    useful += Math.min(level, usefulCap) * Math.max(.25, weight);
    total += Math.max(1, level) * Math.max(.25, weight) + Math.max(0, level - usefulCap) * 1.8;
  }
  return clamp(total ? useful / total * 100 : 50);
}

function evaluateSeed(
  result: AnalysisResult,
  seed: CandidateSeed,
  role: MicroRole,
  priority: TrainingKey[],
  reuse: { skillPackage?: MaxMatchSkillPackage; impetoCombination?: MaxMatchImpetoCombination } = {}
): MaxMatchCandidate | null {
  const training = exactPlan(seed.training, result, priority);
  if (trainingPlanTotalCost(training) !== result.trainingPointsTotal) return null;
  const projected = projectedAttributes(result, training);
  const actions = actionScores(projected, role, result.bestPosition.code);
  // A busca profunda da v38.70 avalia dezenas de progressões. Nessa fase,
  // reutilizamos o pacote de habilidades e o Ímpeto já validados pela v38.60,
  // evitando recalcular catálogos completos para cada vizinho. Os finalistas
  // voltam a passar pela avaliação integral antes da decisão definitiva.
  const skillPackage = reuse.skillPackage ?? skillPackages(result, training, role)[0];
  if (!skillPackage) return null;
  const preliminaryScenarios = scenarioScores(result, training, projected, role, actions, skillPackage.score, result.powerBuildV3850?.impetos?.[0]?.performanceScore ?? 60);
  const preliminaryWeakest = [...preliminaryScenarios].sort((left, right) => left.score - right.score)[0];
  const impetoCombination = reuse.impetoCombination ?? impetoCombinations(result, training, role, preliminaryWeakest)[0];
  if (!impetoCombination) return null;
  const scenarios = scenarioScores(result, training, projected, role, actions, skillPackage.score, impetoCombination.score);
  const scenario = scenarioSummary(scenarios);
  const breaks = breakpointAnalysis(result, projected);
  const breakScore = breakpointScore(breaks);
  const fatigue = fatigueResistance(projected, result.bestPosition.code);
  const duel = duelReliability(projected, result.bestPosition.code);
  const tight = tightSpaceControl(projected, result.bestPosition.code);
  const transition = transitionImpact(projected, result.bestPosition.code);
  const roleExecution = weightedActionAverage(actions, role);
  const efficiency = pointEfficiency(training, role, result);
  const confidenceSafety = clamp(Number(result.parsed.confidence) * .7 + Number(result.parsed.evidence.attributeCount >= 18 ? 100 : result.parsed.evidence.attributeCount >= 10 ? 78 : 55) * .3);
  const performanceScore = clamp(
    roleExecution * .22
    + scenario.average * .17
    + scenario.worst * .14
    + scenario.consistency * .08
    + scenario.minMax * .12
    + breakScore * .07
    + efficiency * .07
    + fatigue * .035
    + duel * .035
    + tight * .035
    + transition * .035
    + skillPackage.score * .04
    + impetoCombination.score * .03
    + confidenceSafety * .01,
    0,
    98
  );
  const dimensions = {
    roleExecution,
    functionalThresholds: breakScore,
    pointEfficiency: efficiency,
    responsiveness: clamp(tight * .55 + transition * .25 + scenario.consistency * .2),
    identityPreservation: result.powerBuildV3850?.winner.dimensions.identityPreservation ?? 78,
    specialSkillActivation: specialSkillSupport(result, training),
    skillCoverage: skillPackage.score,
    impetoSynergy: impetoCombination.score,
    onlineRobustness: scenario.minMax,
    antiOverallWaste: efficiency,
    exactBudget: 100,
    confidenceSafety
  };
  const sortedActions = Object.entries(actions).sort((left, right) => right[1] - left[1]);
  const weakScenario = [...scenarios].sort((left, right) => left.score - right.score)[0];
  const strengths = [
    ...sortedActions.slice(0, 3).map(([label, score]) => `${label}: ${score}/100`),
    `Pior cenário protegido em ${weakScenario.score}/100`,
    `Consistência competitiva: ${scenario.consistency}/100`
  ];
  const tradeOffs = [
    ...(breaks.filter((item) => item.status === 'abaixo').slice(0, 2).map((item) => `${item.label} abaixo da faixa interna (${item.projected}/${item.targetBand}).`)),
    ...(weakScenario.score < 76 ? [`Cenário mais exigente: ${weakScenario.label} (${weakScenario.score}/100).`] : []),
    ...(efficiency < 82 ? [`Eficiência dos pontos ainda pode melhorar: ${efficiency}/100.`] : [])
  ];
  if (!tradeOffs.length) tradeOffs.push('Nenhuma fragilidade estrutural importante detectada nas oito simulações.');
  return {
    id: seed.id,
    title: seed.title,
    source: seed.source,
    training,
    pointsUsed: trainingPlanTotalCost(training),
    exactBudget: true,
    performanceScore,
    dimensions,
    thresholdsMet: breaks.filter((item) => item.status === 'atingido' || item.status === 'acima').length,
    thresholdsTotal: breaks.length,
    saturationPenalty: clamp(100 - efficiency),
    wastePenalty: clamp(Math.max(0, 82 - efficiency)),
    strengths,
    tradeOffs,
    projectedAttributes: projected,
    actionScores: actions,
    scenarioScores: scenarios,
    scenarioAverage: scenario.average,
    worstScenario: scenario.worst,
    consistency: scenario.consistency,
    minMaxScore: scenario.minMax,
    breakpointScore: breakScore,
    fatigueResistance: fatigue,
    duelReliability: duel,
    tightSpaceControl: tight,
    transitionImpact: transition,
    skillPackage,
    impetoCombination
  };
}

function counterfactuals(result: AnalysisResult, winner: MaxMatchCandidate, role: MicroRole, priority: TrainingKey[]) {
  const changes: MaxMatchCounterfactual[] = [];
  const keys = allowedKeys(result.bestPosition.code);
  for (const from of keys) {
    if (winner.training[from] <= 0) continue;
    for (const to of keys) {
      if (from === to) continue;
      const training = { ...winner.training, [from]: winner.training[from] - 1, [to]: Math.min(16, winner.training[to] + 1) };
      const candidate = evaluateSeed(result, { id: `cf-${from}-${to}`, title: 'Contrafactual', source: 'auditoria v38.60', training }, role, priority);
      if (!candidate || signature(candidate.training) === signature(winner.training)) continue;
      const scoreDelta = candidate.performanceScore - winner.performanceScore;
      changes.push({
        change: `${TRAINING_LABELS[from]} -1 → ${TRAINING_LABELS[to]} +1`,
        scoreDelta,
        verdict: scoreDelta >= 2 ? 'melhoria encontrada' : scoreDelta > 0 ? 'alternativa situacional' : 'manter'
      });
    }
  }
  const ordered = changes.sort((left, right) => right.scoreDelta - left.scoreDelta);
  return ordered.length ? ordered.slice(0, 6) : [{ change: 'Nenhuma troca local válida', scoreDelta: 0, verdict: 'manter' as const }];
}

export function evaluateTrainingPlanWithMaxMatchV3860(
  result: AnalysisResult,
  training: TrainingPlan,
  metadata: { id?: string; title?: string; source?: string } = {}
): MaxMatchCandidate | null {
  const role = roleFromResult(result);
  const priority = trainingPriority(result, role);
  const normalized = exactPlan(training, result, priority);
  return evaluateSeed(result, {
    id: metadata.id ?? 'external-v3860',
    title: metadata.title ?? 'Candidata externa v38.60',
    source: metadata.source ?? 'motor superior',
    training: normalized
  }, role, priority);
}

/**
 * Avaliação rápida exclusiva para a exploração da v38.70. Ela preserva a
 * projeção de atributos, ações, cenários e orçamento, mas reutiliza o Top
 * adicional e o Ímpeto da vencedora v38.60. A decisão final nunca usa somente
 * esta aproximação: os finalistas são recalculados pela função integral acima.
 */
export function evaluateTrainingPlanProgressionOnlyV3860(
  result: AnalysisResult,
  training: TrainingPlan,
  metadata: { id?: string; title?: string; source?: string } = {}
): MaxMatchCandidate | null {
  const role = roleFromResult(result);
  const priority = trainingPriority(result, role);
  const normalized = exactPlan(training, result, priority);
  const baseline = result.maxMatchV3860?.winner;
  return evaluateSeed(result, {
    id: metadata.id ?? 'progression-only-v3860',
    title: metadata.title ?? 'Triagem de progressão v38.70',
    source: metadata.source ?? 'busca suprema otimizada',
    training: normalized
  }, role, priority, baseline ? {
    skillPackage: baseline.skillPackage,
    impetoCombination: baseline.impetoCombination
  } : {});
}

export function maxMatchAllowedTrainingKeysV3860(position: PositionCode): TrainingKey[] {
  return [...allowedKeys(position)];
}

export function maxMatchTrainingPriorityV3860(result: AnalysisResult): TrainingKey[] {
  const role = roleFromResult(result);
  return [...trainingPriority(result, role)];
}

export function maxMatchImpetoCombinationsForTrainingV3860(
  result: AnalysisResult,
  training: TrainingPlan
): MaxMatchImpetoCombination[] {
  const role = roleFromResult(result);
  const priority = trainingPriority(result, role);
  const candidate = evaluateSeed(result, {
    id: 'impeto-audit-v3860',
    title: 'Auditoria de Ímpetos',
    source: 'motor superior',
    training: exactPlan(training, result, priority)
  }, role, priority);
  if (!candidate) return [];
  const weakestScenario = [...candidate.scenarioScores].sort((left, right) => left.score - right.score)[0];
  return impetoCombinations(result, candidate.training, role, weakestScenario);
}

export function buildMaxMatchPerformanceV3860(result: AnalysisResult): MaxMatchPerformanceV3860Analysis {
  const role = roleFromResult(result);
  const priority = trainingPriority(result, role);
  const seeds = collectSeeds(result, role, priority);
  const unique = new Map<string, CandidateSeed>();
  for (const seed of seeds) {
    const training = exactPlan(seed.training, result, priority);
    const key = signature(training);
    if (!unique.has(key)) unique.set(key, { ...seed, training });
  }
  const evaluated = [...unique.values()]
    .map((seed) => evaluateSeed(result, seed, role, priority))
    .filter((item): item is MaxMatchCandidate => Boolean(item))
    .sort((left, right) => right.performanceScore - left.performanceScore || right.worstScenario - left.worstScenario || right.consistency - left.consistency);
  const winner = evaluated[0];
  if (!winner) throw new Error('Motor v38.60 não encontrou ficha válida com orçamento exato.');
  const allPackages = skillPackages(result, winner.training, role);
  const allImpetos = impetoCombinations(result, winner.training, role, [...winner.scenarioScores].sort((left, right) => left.score - right.score)[0]);
  const breaks = breakpointAnalysis(result, winner.projectedAttributes as Record<AttributeKey, number>);
  const counter = counterfactuals(result, winner, role, priority);
  const localGain = Math.max(0, ...counter.map((item) => item.scoreDelta));
  const confidence = clamp(
    Number(result.parsed.confidence) * .42
    + winner.performanceScore * .2
    + winner.consistency * .15
    + winner.worstScenario * .13
    + (result.parsed.evidence.attributeCount >= 18 ? 100 : result.parsed.evidence.attributeCount >= 10 ? 78 : 52) * .1
    - localGain * 4
  );
  const decision = confidence >= 72 && winner.exactBudget && localGain < 2 ? 'aprovada' : 'revisar';
  const guardrails = [
    'GER/overall não participa de nenhuma dimensão da v38.60.',
    `Posição travada em ${result.bestPosition.label}; nenhuma candidata alterou a função escolhida.`,
    `Todas as ${evaluated.length} candidatas válidas usaram exatamente ${result.trainingPointsTotal} ponto(s).`,
    'Bandas de atributos são referências internas de desempenho, não limites oficiais divulgados pela Konami.',
    'A ficha maximiza desempenho esperado; validação em partidas continua necessária para calibrar conexão, controles e estilo pessoal.',
    localGain >= 2 ? 'Uma troca contrafactual ainda apresentou ganho relevante; revise antes de aplicar definitivamente.' : 'A vencedora permaneceu estável contra trocas locais simples de pontos.'
  ];
  return {
    engineVersion: MAX_MATCH_ENGINE_V3860_VERSION,
    philosophy: 'MAXIMO_DESEMPENHO_EM_PARTIDA_SEM_OVERALL',
    improvements: [...IMPROVEMENTS],
    microRole: role.label,
    candidatesEvaluated: evaluated.length,
    scenariosTested: SCENARIOS.length,
    finalists: evaluated.slice(0, 6),
    winner,
    skillPackages: allPackages.slice(0, 6),
    impetoCombinations: allImpetos.slice(0, 8),
    breakpoints: breaks,
    counterfactuals: counter,
    confidence,
    decision,
    guardrails,
    summary: `${role.label}: ficha ${decision === 'aprovada' ? 'aprovada' : 'marcada para revisão'} com ${winner.performanceScore}/100, pior cenário em ${winner.worstScenario}/100 e consistência ${winner.consistency}/100, sem usar overall.`
  };
}

export function applyMaxMatchPerformanceV3860(result: AnalysisResult): AnalysisResult {
  const analysis = buildMaxMatchPerformanceV3860(result);
  const training = analysis.winner.training;
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = trainingPlanTotalCost(training);
  const skills = analysis.winner.skillPackage.skills;
  const recommendedSkills = skills.map((item) => item.name);
  const skillRecommendations = skills.map((item, index) => ({ name: item.name, reason: `${item.gameplayImpact} Pacote v38.60: ${analysis.winner.skillPackage.label}; ativação ${item.activationFrequency}; ${item.score}/100.`, tier: index < 3 ? 'essencial' as const : 'alternativa' as const }));
  const impetos = analysis.impetoCombinations.map((item) => ({
    ...item.impeto,
    score: item.score,
    reason: `${item.impeto.reason.replace(/\s*Nota final calculada.*$/i, '').trim()} ${item.reason} Nota conjunta v38.60: ${item.score}/100.`
  }));
  const winnerVariant = {
    kind: 'competitive' as const,
    title: `Máximo desempenho — ${analysis.microRole}`,
    positionLabel: result.bestPosition.label,
    training,
    pointsUsed: trainingPointsUsed,
    note: `Vencedora após ${analysis.candidatesEvaluated} fichas e ${analysis.scenariosTested} cenários; pior cenário ${analysis.winner.worstScenario}/100.`,
    qualityScore: analysis.winner.performanceScore,
    adaptationLabel: 'DESEMPENHO MÁXIMO',
    highlights: analysis.winner.strengths,
    risks: analysis.winner.tradeOffs,
    efficiencyScore: analysis.winner.dimensions.pointEfficiency,
    balanceScore: analysis.winner.consistency,
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
    trainingComparison: compareTraining(result.parsed.autoTrainingPlan, training),
    buildVariants: [winnerVariant, ...result.buildVariants.filter((item) => signature(item.training) !== signature(training))].slice(0, 5),
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos: impetos,
    buildName: winnerVariant.title,
    strengths: [...analysis.winner.strengths, ...result.strengths].slice(0, 10),
    weaknesses: [...analysis.winner.tradeOffs, ...result.weaknesses].slice(0, 8),
    note: `${analysis.summary} O melhor resultado real ainda deve ser confirmado em uma sequência de partidas.`,
    maxMatchV3860: analysis,
    advancedOptimizer: {
      ...result.advancedOptimizer,
      combinationsTested: Math.max(result.advancedOptimizer.combinationsTested, analysis.candidatesEvaluated),
      winnerTitle: winnerVariant.title,
      winnerScore: analysis.winner.performanceScore,
      efficiencyScore: analysis.winner.dimensions.pointEfficiency,
      wasteScore: 100 - analysis.winner.dimensions.antiOverallWaste,
      unusedPoints: Math.max(0, result.trainingPointsTotal - trainingPointsUsed),
      usefulInvestment: analysis.winner.strengths,
      detectedWaste: analysis.winner.tradeOffs,
      decisionReasons: [analysis.summary, ...result.advancedOptimizer.decisionReasons].slice(0, 8),
      positionPreserved: true,
      budgetRespected: trainingPointsUsed === result.trainingPointsTotal
    }
  };
}
