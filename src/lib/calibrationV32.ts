import type {
  AnalysisResult,
  AttributeKey,
  Attributes,
  CalibrationV32Analysis,
  CalibrationV32Profile,
  ConnectionProfile,
  ControlProfile,
  GameplayMode,
  GameplayDnaAnalysis,
  GameplayDnaProfile,
  GameplayDnaProfileId,
  PositionCode,
  PositionBuildComparison,
  PositionGameplayBuild,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import { normalizeObjective, POSITION_PT } from './analyzerDomain';
import { BASE_BY_POSITION } from '@/modules/analysis/analyzerCatalog';
import { fitTrainingToBudget } from '@/modules/builds/trainingOptimizer';
import {
  TRAINING_KEYS,
  normalizeTrainingPlan,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import type { BuildVariant } from './trainingEngine';
import { cardAnalysisInputFingerprint } from './cardAnalysisFingerprint';
import { buildMaxPrecisionAnalysis } from './maxPrecision';
import { buildEliteEvolutionAnalysis } from './eliteEvolution';
import { buildMetaBuildUniverse } from './metaBuildUniverse';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import { inferAutomaticCardGameplayProfile } from './automaticCardGameplayProfile';

const ENGINE_VERSION = '38.37-automatic-card-gameplay-1';
const PATCH_REFERENCE = 'eFootball v5.4.0' as const;
const CACHE_LIMIT = 0;

const LINE_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending'];
const GK_KEYS: TrainingKey[] = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];

const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 10, dexterity: 8.6, lowerBodyStrength: 7.4, aerialStrength: 5.2, dribbling: 4.6, passing: 2.4 },
  SS: { dexterity: 9.2, dribbling: 8.2, passing: 7.2, shooting: 6.4, lowerBodyStrength: 4.4 },
  LWF: { dribbling: 9.6, dexterity: 9.2, lowerBodyStrength: 7.2, shooting: 6.4, passing: 4.2 },
  RWF: { dribbling: 9.6, dexterity: 9.2, lowerBodyStrength: 7.2, shooting: 6.4, passing: 4.2 },
  LMF: { passing: 8.2, lowerBodyStrength: 8.0, dexterity: 6.4, dribbling: 5.5, defending: 5.2 },
  RMF: { passing: 8.2, lowerBodyStrength: 8.0, dexterity: 6.4, dribbling: 5.5, defending: 5.2 },
  AMF: { passing: 9.6, dribbling: 8.6, dexterity: 8.0, shooting: 5.4, lowerBodyStrength: 3.5 },
  CMF: { passing: 9.2, lowerBodyStrength: 7.6, dexterity: 6.6, defending: 5.8, dribbling: 5.0 },
  DMF: { defending: 10, passing: 7.8, lowerBodyStrength: 7.8, dexterity: 5.1, aerialStrength: 4.6 },
  CB: { defending: 10, aerialStrength: 8.5, lowerBodyStrength: 7.8, dexterity: 5.6, passing: 2.8 },
  LB: { defending: 8.8, lowerBodyStrength: 8.5, passing: 6.4, dexterity: 5.6, dribbling: 3.4 },
  RB: { defending: 8.8, lowerBodyStrength: 8.5, passing: 6.4, dexterity: 5.6, dribbling: 3.4 },
  GK: { gk2: 10, gk3: 9.2, gk1: 8.8, aerialStrength: 5.4, lowerBodyStrength: 4.4 }
};

const MODE_WEIGHTS: Record<GameplayMode, Partial<Record<TrainingKey, number>>> = {
  RANKED: { passing: 1.25, dexterity: 1.25, lowerBodyStrength: 1.18, defending: 1.05, gk2: 1.15, gk3: 1.05 },
  UNIVERSAL: { passing: .55, dribbling: .5, dexterity: .65, lowerBodyStrength: .65, defending: .45, shooting: .35, gk1: .4, gk2: .55, gk3: .45 },
  OFFLINE: { shooting: 1.05, dribbling: 1.1, dexterity: .9, passing: .65, aerialStrength: .4, gk1: .55, gk2: .6 }
};

const CONNECTION_WEIGHTS: Record<ConnectionProfile, Partial<Record<TrainingKey, number>>> = {
  STABLE: { dribbling: .45, shooting: .3, dexterity: .35 },
  VARIABLE: { passing: .9, dexterity: .9, lowerBodyStrength: .75, defending: .4, gk2: .5 },
  HIGH_DELAY: { passing: 1.45, dexterity: 1.35, lowerBodyStrength: 1.1, defending: .65, dribbling: -.35, gk2: .75, gk3: .5 }
};

const CONTROL_WEIGHTS: Record<ControlProfile, Partial<Record<TrainingKey, number>>> = {
  AUTO: {},
  BALANCED: { passing: .35, dribbling: .3, dexterity: .35, lowerBodyStrength: .3, defending: .2 },
  PASSING: { passing: 1.45, dexterity: .7, dribbling: .35, lowerBodyStrength: .35 },
  DRIBBLE: { dribbling: 1.5, dexterity: 1.15, lowerBodyStrength: .45, passing: .2 },
  DIRECT: { shooting: 1.2, lowerBodyStrength: 1.15, aerialStrength: .8, passing: .45, dexterity: .35 }
};

const GROUP_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {
  shooting: ['offensiveAwareness', 'finishing', 'placeKicking', 'curl', 'kickingPower'],
  passing: ['ballControl', 'lowPass', 'loftedPass', 'curl'],
  dribbling: ['ballControl', 'dribbling', 'tightPossession', 'balance'],
  dexterity: ['offensiveAwareness', 'acceleration', 'balance'],
  lowerBodyStrength: ['speed', 'acceleration', 'kickingPower', 'stamina'],
  aerialStrength: ['heading', 'jump', 'physicalContact'],
  defending: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  gk1: ['goalkeeperAwareness', 'goalkeeperCatching'],
  gk2: ['goalkeeperParrying', 'goalkeeperReflexes'],
  gk3: ['goalkeeperReach', 'jump']
};

const TRAINING_ATTRIBUTE_GAINS: Record<TrainingKey, Partial<Record<AttributeKey, number>>> = {
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

const RESPONSE_ATTRIBUTES: Record<PositionCode, AttributeKey[]> = {
  CF: ['offensiveAwareness', 'finishing', 'acceleration', 'balance', 'kickingPower', 'ballControl'],
  SS: ['ballControl', 'dribbling', 'tightPossession', 'offensiveAwareness', 'acceleration', 'balance', 'lowPass', 'finishing'],
  LWF: ['ballControl', 'dribbling', 'tightPossession', 'acceleration', 'speed', 'balance', 'finishing'],
  RWF: ['ballControl', 'dribbling', 'tightPossession', 'acceleration', 'speed', 'balance', 'finishing'],
  LMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'acceleration', 'stamina', 'balance'],
  RMF: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'acceleration', 'stamina', 'balance'],
  AMF: ['ballControl', 'tightPossession', 'lowPass', 'dribbling', 'offensiveAwareness', 'acceleration', 'balance'],
  CMF: ['ballControl', 'lowPass', 'loftedPass', 'tightPossession', 'stamina', 'balance', 'defensiveEngagement'],
  DMF: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'lowPass', 'physicalContact', 'stamina', 'speed'],
  CB: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'physicalContact', 'speed', 'acceleration', 'jump'],
  LB: ['defensiveAwareness', 'tackling', 'speed', 'acceleration', 'stamina', 'loftedPass', 'balance'],
  RB: ['defensiveAwareness', 'tackling', 'speed', 'acceleration', 'stamina', 'loftedPass', 'balance'],
  GK: ['goalkeeperAwareness', 'goalkeeperReflexes', 'goalkeeperReach', 'goalkeeperParrying', 'goalkeeperCatching', 'jump']
};


type GameplayProfileCategory = 'finalização' | 'passe' | 'drible' | 'defesa' | 'aérea' | 'físico' | 'goleiro' | 'mental';
type DnaProfileDefinition = {
  id: GameplayDnaProfileId;
  label: string;
  functionalStyle: string;
  description: string;
  positions: PositionCode[];
  weights: Partial<Record<TrainingKey, number>>;
  categories: GameplayProfileCategory[];
  playstyle?: RegExp;
  focus: string[];
};

const DNA_PROFILE_DEFINITIONS: DnaProfileDefinition[] = [
  { id:'DRIBBLER', label:'Driblador dominante', functionalStyle:'Condução, mudança de direção e vantagem individual', description:'Extrai domínio, drible curto, equilíbrio e aceleração para ganhar o primeiro duelo sem deixar a carta pesada.', positions:['CF','SS','LWF','RWF','AMF','CMF','LMF','RMF'], weights:{dribbling:5.2,dexterity:3.8,lowerBodyStrength:1.5,passing:.7,shooting:.5}, categories:['drible','drible','passe','finalização','físico'], playstyle:/ala produtivo|lateral movel|armador criativo|puxa marcacao/, focus:['Drible','Controle corporal','Aceleração útil'] },
  { id:'CREATOR', label:'Criador de jogadas', functionalStyle:'Passe rápido, domínio entre linhas e último passe', description:'Prioriza controle, passe e mobilidade para tabelas, assistências e circulação sob pressão.', positions:['CF','SS','LWF','RWF','AMF','CMF','DMF','LMF','RMF'], weights:{passing:5.1,dribbling:2.2,dexterity:2.0,lowerBodyStrength:.8,shooting:.4}, categories:['passe','passe','passe','drible','mental'], playstyle:/armador criativo|orquestrador|classico|puxa marcacao|pivo/, focus:['Passe','Controle','Criação'] },
  { id:'FINISHER', label:'Finalizador clínico', functionalStyle:'Movimentação ofensiva e conclusão rápida', description:'Concentra pontos em finalização, leitura de área, aceleração e potência útil, sem caçar overall.', positions:['CF','SS','LWF','RWF','AMF'], weights:{shooting:5.4,dexterity:3.2,lowerBodyStrength:1.5,dribbling:.6,aerialStrength:.5}, categories:['finalização','finalização','finalização','drible','físico'], playstyle:/artilheiro|homem de area|infiltracao|atacante surpresa/, focus:['Finalização','Movimentação','Chute de primeira'] },
  { id:'SECOND_STRIKER', label:'Segundo atacante completo', functionalStyle:'Tabela curta, infiltração e finalização', description:'Equilibra drible, passe, destreza e conclusão para jogar próximo do centroavante.', positions:['CF','SS','AMF','LWF','RWF'], weights:{dexterity:4.2,dribbling:3.5,passing:2.8,shooting:2.7,lowerBodyStrength:1.0}, categories:['finalização','passe','drible','passe','físico'], playstyle:/puxa marcacao|infiltracao|armador criativo/, focus:['Tabela','Infiltração','Conclusão'] },
  { id:'DIRECT_RUNNER', label:'Atacante de ruptura', functionalStyle:'Arranque, profundidade e ataque ao espaço', description:'Aumenta aceleração, velocidade funcional e movimentação para transições e corridas sem bola.', positions:['CF','SS','LWF','RWF','LMF','RMF','AMF'], weights:{dexterity:4.6,lowerBodyStrength:4.4,shooting:2.2,dribbling:1.4,passing:.5}, categories:['finalização','drible','físico','passe','mental'], playstyle:/artilheiro|infiltracao|ala produtivo|lateral movel/, focus:['Arranque','Profundidade','Transição'] },
  { id:'AERIAL_TARGET', label:'Referência aérea', functionalStyle:'Pivô, contato e conclusão pelo alto', description:'Explora cabeceio, salto, contato físico e finalização quando o corpo da carta sustenta esse jogo.', positions:['CF','SS','CB','DMF'], weights:{aerialStrength:5.5,shooting:3.0,lowerBodyStrength:3.0,passing:1.0,dexterity:.4,defending:.7}, categories:['aérea','finalização','aérea','físico','mental'], playstyle:/homem de area|pivo|atacante pivo|destruidor/, focus:['Jogo aéreo','Contato','Pivô'] },
  { id:'WIDE_CREATOR', label:'Criador pelo corredor', functionalStyle:'Progressão lateral, passe e cruzamento', description:'Constrói pelo lado com passe, condução e resistência, sem obrigar o usuário a jogar somente por cruzamentos.', positions:['LWF','RWF','LMF','RMF','LB','RB'], weights:{passing:4.5,lowerBodyStrength:3.0,dribbling:2.6,dexterity:1.8,defending:.9}, categories:['passe','passe','drible','físico','defesa'], playstyle:/perito em cruzamento|ala produtivo|lateral ofensivo|lateral atacante/, focus:['Progressão','Passe lateral','Apoio'] },
  { id:'BOX_TO_BOX', label:'Meia versátil', functionalStyle:'Cobertura de campo, apoio e chegada', description:'Equilibra resistência, passe, aceleração e defesa para participar das duas fases.', positions:['AMF','CMF','DMF','LMF','RMF'], weights:{lowerBodyStrength:4.5,passing:3.5,defending:2.8,dexterity:2.2,dribbling:1.0,shooting:.7}, categories:['passe','defesa','físico','passe','mental'], playstyle:/meia versatil|box.?to.?box|infiltracao/, focus:['Resistência','Apoio','Recomposição'] },
  { id:'DEEP_PLAYMAKER', label:'Organizador recuado', functionalStyle:'Saída de bola e passe vertical', description:'Prioriza passe, domínio e proteção para iniciar jogadas de trás sem abandonar a zona central.', positions:['CMF','DMF','CB','LB','RB'], weights:{passing:4.8,defending:2.6,lowerBodyStrength:2.3,dribbling:1.3,dexterity:.8}, categories:['passe','passe','defesa','físico','mental'], playstyle:/orquestrador|defensor criativo|primeiro volante/, focus:['Saída de bola','Passe vertical','Controle'] },
  { id:'BALL_WINNER', label:'Recuperador agressivo', functionalStyle:'Antecipação, pressão e desarme', description:'Extrai marcação, interceptação, contato e mobilidade para recuperar a posse com segurança.', positions:['CMF','DMF','CB','LB','RB','LMF','RMF'], weights:{defending:5.3,lowerBodyStrength:3.2,dexterity:1.4,aerialStrength:1.1,passing:.8}, categories:['defesa','defesa','defesa','físico','aérea'], playstyle:/destruidor|primeiro volante|lateral defensivo/, focus:['Interceptação','Desarme','Pressão'] },
  { id:'DEFENSIVE_ANCHOR', label:'Âncora defensiva', functionalStyle:'Posicionamento, cobertura e proteção central', description:'Mantém a estrutura com defesa, físico e passe seguro, evitando perseguições desnecessárias.', positions:['DMF','CB','CMF'], weights:{defending:5.6,lowerBodyStrength:3.1,aerialStrength:2.0,passing:1.7,dexterity:.7}, categories:['defesa','defesa','passe','físico','aérea'], playstyle:/primeiro volante|defensor criativo|lateral defensivo/, focus:['Cobertura','Posicionamento','Proteção'] },
  { id:'PROGRESSIVE_DEFENDER', label:'Defensor construtor', functionalStyle:'Defesa forte com saída qualificada', description:'Preserva marcação e duelos, mas abre espaço para domínio e passe de progressão.', positions:['CB','DMF','LB','RB'], weights:{defending:4.7,passing:3.4,lowerBodyStrength:2.6,aerialStrength:1.8,dexterity:.8}, categories:['defesa','defesa','passe','aérea','mental'], playstyle:/defensor criativo|orquestrador|primeiro volante/, focus:['Defesa','Saída','Passe'] },
  { id:'DEFENSIVE_FULLBACK', label:'Lateral de segurança', functionalStyle:'Fechamento, recomposição e passe simples', description:'Fortalece defesa, velocidade funcional e resistência para evitar que o corredor vire uma avenida.', positions:['LB','RB','LMF','RMF'], weights:{defending:4.8,lowerBodyStrength:4.0,passing:2.0,dexterity:1.2,dribbling:.5}, categories:['defesa','defesa','passe','físico','mental'], playstyle:/lateral defensivo|perito em cruzamento/, focus:['Recomposição','Cobertura','Passe seguro'] },
  { id:'OFFENSIVE_FULLBACK', label:'Lateral de apoio', functionalStyle:'Progressão, chegada e criação controlada', description:'Entrega apoio ofensivo com passe e condução, mantendo defesa suficiente para não desmontar o setor.', positions:['LB','RB','LMF','RMF'], weights:{lowerBodyStrength:4.0,passing:3.7,dribbling:2.2,dexterity:1.7,defending:1.6}, categories:['passe','drible','físico','defesa','passe'], playstyle:/lateral ofensivo|lateral atacante|perito em cruzamento/, focus:['Apoio','Progressão','Passe'] },
  { id:'GK_SHOT_STOPPER', label:'Goleiro de reação', functionalStyle:'Reflexo, alcance e defesa imediata', description:'Prioriza defesa e reflexo para responder a finalizações rápidas e rebotes.', positions:['GK'], weights:{gk2:5.4,gk3:4.2,gk1:3.2,aerialStrength:1.0,lowerBodyStrength:.5}, categories:['goleiro','goleiro','goleiro','mental','físico'], playstyle:/goleiro defensivo|goleiro ofensivo/, focus:['Reflexo','Defesa','Alcance'] },
  { id:'GK_DISTRIBUTOR', label:'Goleiro construtor', functionalStyle:'Defesa com reposição e primeira fase', description:'Mantém atributos de goleiro e reforça potência e recursos para iniciar transições.', positions:['GK'], weights:{gk1:3.7,gk2:4.5,gk3:3.5,lowerBodyStrength:2.0,aerialStrength:1.1}, categories:['goleiro','goleiro','goleiro','goleiro','mental'], playstyle:/goleiro ofensivo/, focus:['Reposição','Reflexo','Saída'] },
  { id:'GK_BALANCED', label:'Goleiro completo', functionalStyle:'Equilíbrio entre segurança, reflexo e alcance', description:'Distribui o orçamento entre os três grupos de goleiro sem sacrificar o piso funcional.', positions:['GK'], weights:{gk1:4.4,gk2:4.7,gk3:4.3,aerialStrength:1.2,lowerBodyStrength:.8}, categories:['goleiro','goleiro','goleiro','mental','físico'], playstyle:/goleiro ofensivo|goleiro defensivo/, focus:['Equilíbrio','Segurança','Consistência'] }
];

const cache = new Map<string, AnalysisResult>();

type WeightMap = Record<TrainingKey, number>;
type CandidateScore = {
  plan: TrainingPlan;
  score: number;
  dimensions: CalibrationV32Analysis['dimensions'];
};

type CalibrationMaps = ReturnType<typeof targetWeights>;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function activeKeys(position: PositionCode) {
  return position === 'GK' ? GK_KEYS : LINE_KEYS;
}

function emptyWeights(): WeightMap {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

function addWeights(target: WeightMap, values: Partial<Record<TrainingKey, number>>, factor = 1) {
  for (const [key, value] of Object.entries(values) as Array<[TrainingKey, number]>) target[key] += Number(value || 0) * factor;
}

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => Number(plan[key] ?? 0)).join('-');
}

function completeAttributes(result: AnalysisResult): Required<Attributes> {
  const base = BASE_BY_POSITION[result.parsed.mainPosition] ?? BASE_BY_POSITION[result.bestPosition.code];
  return { ...base, ...result.parsed.attributes } as Required<Attributes>;
}

function groupAverage(attributes: Required<Attributes>, key: TrainingKey) {
  return average(GROUP_ATTRIBUTES[key].map((attribute) => Number(attributes[attribute] ?? 0)));
}

function projectedAttributes(result: AnalysisResult, plan: TrainingPlan) {
  const projected = { ...completeAttributes(result) };
  for (const [group, gains] of Object.entries(TRAINING_ATTRIBUTE_GAINS) as Array<[TrainingKey, Partial<Record<AttributeKey, number>>]>) {
    const level = Number(plan[group] ?? 0);
    for (const [attribute, gain] of Object.entries(gains) as Array<[AttributeKey, number]>) {
      projected[attribute] = Math.min(110, Number(projected[attribute] ?? 0) + level * gain);
    }
  }
  return projected;
}

function gameplayResponse(result: AnalysisResult, plan: TrainingPlan) {
  const position = result.bestPosition.code;
  const projected = projectedAttributes(result, plan);
  const values = RESPONSE_ATTRIBUTES[position].map((attribute) => Number(projected[attribute] ?? 0));
  if (!values.length) return 70;
  const ordered = [...values].sort((a, b) => a - b);
  const floor = average(ordered.slice(0, Math.max(2, Math.ceil(ordered.length * .35))));
  const mean = average(values);
  return clamp(mean * .68 + floor * .32);
}

function functionalFloor(result: AnalysisResult, plan: TrainingPlan) {
  const position = result.bestPosition.code;
  const projected = projectedAttributes(result, plan);
  const ranked = activeKeys(position)
    .map((key) => ({ key, importance: Number(POSITION_WEIGHTS[position][key] ?? 0) }))
    .filter((item) => item.importance > 0)
    .sort((left, right) => right.importance - left.importance)
    .slice(0, position === 'GK' ? 3 : 5);
  if (!ranked.length) return 70;
  const scores = ranked.map(({ key, importance }) => {
    const target = importance >= 9 ? 88 : importance >= 7 ? 84 : 80;
    const current = groupAverage(projected, key);
    return clamp(100 - Math.max(0, target - current) * 4.2 - Math.max(0, current - (target + 14)) * .35);
  });
  const weakest = Math.min(...scores);
  return clamp(average(scores) * .72 + weakest * .28);
}

function identityPreservation(result: AnalysisResult, plan: TrainingPlan) {
  const keys = activeKeys(result.bestPosition.code);
  const dna = emptyWeights();
  addWeights(dna, attributeDnaWeights(result), 1);
  if (!keys.some((key) => dna[key] > 0)) addWeights(dna, POSITION_WEIGHTS[result.bestPosition.code], .45);
  return distributionFit(plan, dna, keys);
}

function attributeDnaWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  const a = completeAttributes(result);
  const position = result.bestPosition.code;
  const weights: Partial<Record<TrainingKey, number>> = {};
  const add = (key: TrainingKey, value: number) => { weights[key] = (weights[key] ?? 0) + value; };
  const scores: Partial<Record<TrainingKey, number>> = position === 'GK'
    ? {
        gk1: average([a.goalkeeperAwareness, a.goalkeeperCatching]),
        gk2: average([a.goalkeeperParrying, a.goalkeeperReflexes]),
        gk3: average([a.goalkeeperReach, a.jump]),
        aerialStrength: average([a.jump, a.physicalContact]),
        lowerBodyStrength: average([a.kickingPower, a.stamina])
      }
    : {
        shooting: average([a.offensiveAwareness, a.finishing, a.kickingPower, a.curl]),
        passing: average([a.ballControl, a.lowPass, a.loftedPass, a.curl]),
        dribbling: average([a.ballControl, a.dribbling, a.tightPossession, a.balance]),
        dexterity: average([a.offensiveAwareness, a.acceleration, a.balance]),
        lowerBodyStrength: average([a.speed, a.acceleration, a.kickingPower, a.stamina]),
        aerialStrength: average([a.heading, a.jump, a.physicalContact]),
        defending: average([a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression])
      };
  const ranked = (Object.entries(scores) as Array<[TrainingKey, number]>).sort((left, right) => right[1] - left[1]);
  ranked.forEach(([key, value], index) => {
    if (value < 72) return;
    const base = index === 0 ? 1.55 : index === 1 ? .9 : index === 2 ? .45 : 0;
    if (base > 0) add(key, base + Math.max(0, value - 82) * .035);
  });
  const dribbleDna = average([a.ballControl, a.dribbling, a.tightPossession, a.balance]);
  const passDna = average([a.lowPass, a.loftedPass, a.ballControl]);
  const finishDna = average([a.finishing, a.offensiveAwareness, a.kickingPower]);
  const defenseDna = average([a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression]);
  if (dribbleDna >= 82 && ['SS', 'LWF', 'RWF', 'AMF', 'CMF', 'LMF', 'RMF'].includes(position)) { add('dribbling', 1.25); add('dexterity', .75); }
  if (passDna >= 82 && ['SS', 'AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB'].includes(position)) add('passing', 1.25);
  if (finishDna >= 82 && ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position)) add('shooting', 1.3);
  if (defenseDna >= 82 && ['CB', 'DMF', 'LB', 'RB', 'CMF'].includes(position)) add('defending', 1.35);
  return weights;
}

function teamStyleWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  switch (result.tacticalProfile.style) {
    case 'POSSE_DE_BOLA': return { passing: 1.3, dribbling: .85, dexterity: .55 };
    case 'CONTRA_ATAQUE': return { passing: .7, lowerBodyStrength: 1.05, aerialStrength: .5, defending: .35 };
    case 'CONTRA_ATAQUE_RAPIDO': return { dexterity: 1.15, lowerBodyStrength: 1.2, passing: .55, shooting: .45 };
    case 'POR_FORA': return { passing: 1.0, lowerBodyStrength: .8, dribbling: .55, aerialStrength: .45 };
    case 'PASSE_LONGO': return { passing: 1.05, aerialStrength: .9, lowerBodyStrength: .75 };
    default: return {};
  }
}

function playstyleWeights(result: AnalysisResult): Partial<Record<TrainingKey, number>> {
  const style = normalizeText(result.parsed.playstyle);
  if (/artilheiro|goal poacher|atacante matador/.test(style)) return { shooting: 1.4, dexterity: .8, lowerBodyStrength: .55 };
  if (/homem de area|fox in the box/.test(style)) return { shooting: 1.2, aerialStrength: 1.05, lowerBodyStrength: .65 };
  if (/pivo|target man|puxa marcacao/.test(style)) return { lowerBodyStrength: 1.25, passing: .9, aerialStrength: .7 };
  if (/armador criativo|creative playmaker|classico|orquestrador/.test(style)) return { passing: 1.35, dribbling: .75, dexterity: .4 };
  if (/infiltracao|hole player|atacante surpresa/.test(style)) return { dexterity: 1.25, shooting: .8, lowerBodyStrength: .4 };
  if (/ala produtivo|prolific winger|lateral movel|roaming flank/.test(style)) return { dribbling: 1.1, dexterity: 1.0, lowerBodyStrength: .65 };
  if (/perito em cruzamento|cross specialist/.test(style)) return { passing: 1.35, lowerBodyStrength: .55 };
  if (/primeiro volante|1º volante|anchor man|ancora/.test(style)) return { defending: 1.4, passing: .65, lowerBodyStrength: .7 };
  if (/destruidor|destroyer/.test(style)) return { defending: 1.45, lowerBodyStrength: .8, dexterity: .35 };
  if (/defensor criativo|build up/.test(style)) return { defending: 1.05, passing: .95, lowerBodyStrength: .4 };
  if (/lateral defensivo/.test(style)) return { defending: 1.2, lowerBodyStrength: .75, passing: .4 };
  if (/lateral ofensivo|lateral atacante/.test(style)) return { lowerBodyStrength: 1.0, passing: .85, dexterity: .55, defending: .3 };
  if (/goleiro ofensivo/.test(style)) return { gk2: 1.0, gk3: .8, lowerBodyStrength: .4 };
  if (/goleiro defensivo/.test(style)) return { gk1: 1.0, gk2: .9, gk3: .45 };
  return {};
}

function keywordWeights(items: string[]): Partial<Record<TrainingKey, number>> {
  const weights: Partial<Record<TrainingKey, number>> = {};
  const add = (key: TrainingKey, value: number) => { weights[key] = (weights[key] ?? 0) + value; };
  for (const item of items.map(normalizeText)) {
    if (/chute|finaliza|curva|cabeceio ofensivo/.test(item)) add('shooting', .75);
    if (/passe|cruzamento|lan[cç]amento|vision/.test(item)) add('passing', .75);
    if (/drible|controle|sola|duplo toque|finta/.test(item)) add('dribbling', .75);
    if (/acelera|arranque|movimenta|giro|equilibrio/.test(item)) add('dexterity', .65);
    if (/veloc|resist|fisic|garra|impulso ofensivo/.test(item)) add('lowerBodyStrength', .65);
    if (/cabe[cç]a|aereo|salto|fortaleza/.test(item)) add('aerialStrength', .65);
    if (/intercept|bloque|desarme|marca[cç]|defesa|esticada/.test(item)) add('defending', .8);
    if (/goleiro|reflex|alcance|defesa de go|firmeza/.test(item)) { add('gk1', .45); add('gk2', .65); add('gk3', .55); }
  }
  return weights;
}

function deficitWeights(result: AnalysisResult, attributes: Required<Attributes>): Partial<Record<TrainingKey, number>> {
  const weights: Partial<Record<TrainingKey, number>> = {};
  const position = result.bestPosition.code;
  const role = POSITION_WEIGHTS[position];
  for (const key of activeKeys(position)) {
    const importance = Number(role[key] ?? 0);
    if (importance <= 0) continue;
    const current = groupAverage(attributes, key);
    const target = position === 'GK' ? 82 : importance >= 8 ? 82 : importance >= 5 ? 78 : 74;
    const gap = Math.max(0, target - current);
    weights[key] = Math.min(1.8, gap * .07) * Math.min(1.2, importance / 8);
  }
  return weights;
}

function targetWeights(result: AnalysisResult, mode: GameplayMode) {
  const position = result.bestPosition.code;
  const attributes = completeAttributes(result);
  const target = emptyWeights();
  const role = emptyWeights();
  const tactical = emptyWeights();
  const style = emptyWeights();
  const control = emptyWeights();
  const connection = emptyWeights();
  const skill = emptyWeights();
  const impeto = emptyWeights();
  const manager = Number(result.tacticalProfile.managerProficiency ?? 0);
  const tacticalTrust = manager > 0 ? Math.max(.45, Math.min(1, (manager - 65) / 28)) : .55;

  addWeights(role, POSITION_WEIGHTS[position]);
  addWeights(tactical, teamStyleWeights(result), tacticalTrust);
  addWeights(style, playstyleWeights(result));
  addWeights(style, attributeDnaWeights(result), 1.15);
  const selectedControlProfile = result.tacticalProfile.controlProfile ?? 'AUTO';
  if (selectedControlProfile === 'AUTO') addWeights(control, inferAutomaticCardGameplayProfile(result).trainingWeights);
  else addWeights(control, CONTROL_WEIGHTS[selectedControlProfile]);
  addWeights(connection, CONNECTION_WEIGHTS[result.tacticalProfile.connectionProfile ?? 'VARIABLE']);
  addWeights(skill, keywordWeights([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills, ...result.recommendedSkills]));
  addWeights(impeto, keywordWeights(result.recommendedImpetos.slice(0, 3).flatMap((item) => [item.name, ...item.attributes, item.reason])));

  addWeights(target, role, 1);
  addWeights(target, tactical, 1);
  addWeights(target, style, .9);
  addWeights(target, MODE_WEIGHTS[mode], 1);
  addWeights(target, control, .8);
  addWeights(target, connection, .9);
  addWeights(target, skill, .52);
  addWeights(target, impeto, .32);
  addWeights(target, deficitWeights(result, attributes), .75);

  for (const key of TRAINING_KEYS) {
    const active = activeKeys(position).includes(key);
    target[key] = active ? Math.max(.05, target[key]) : 0;
  }
  return { target, role, tactical, style, control, connection, skill, impeto };
}

function costShares(plan: TrainingPlan, keys: TrainingKey[]) {
  const costs = trainingPlanCost(plan);
  const total = Math.max(1, keys.reduce((sum, key) => sum + Number(costs[key] ?? 0), 0));
  const result = emptyWeights();
  for (const key of keys) result[key] = Number(costs[key] ?? 0) / total;
  return result;
}

function weightShares(weights: WeightMap, keys: TrainingKey[]) {
  const total = Math.max(.001, keys.reduce((sum, key) => sum + Math.max(0, weights[key] ?? 0), 0));
  const result = emptyWeights();
  for (const key of keys) result[key] = Math.max(0, weights[key] ?? 0) / total;
  return result;
}

function distributionFit(plan: TrainingPlan, weights: WeightMap, keys: TrainingKey[]) {
  const actual = costShares(plan, keys);
  const desired = weightShares(weights, keys);
  const distance = keys.reduce((sum, key) => sum + Math.abs(actual[key] - desired[key]), 0);
  return clamp((1 - Math.min(2, distance) / 2) * 100);
}

function pointEfficiency(result: AnalysisResult, plan: TrainingPlan, weights: WeightMap) {
  const used = trainingPlanTotalCost(plan);
  const budget = result.trainingPointsTotal;
  const exact = used === budget;
  const overflow = Math.max(0, used - budget);
  const remaining = Math.max(0, budget - used);
  let score = exact ? 100 : 100 - overflow * 14 - remaining * 7;
  for (const key of activeKeys(result.bestPosition.code)) {
    const level = Number(plan[key] ?? 0);
    if (level > 12) score -= (level - 12) * 2.2;
    if (level > 9 && weights[key] < 2.2) score -= (level - 9) * 1.1;
  }
  return clamp(score);
}

function antiOverallWaste(result: AnalysisResult, plan: TrainingPlan, weights: WeightMap) {
  const keys = activeKeys(result.bestPosition.code);
  const costs = trainingPlanCost(plan);
  const base = completeAttributes(result);
  const projected = projectedAttributes(result, plan);
  let penalty = 0;
  let usefulGain = 0;
  let totalGain = 0;
  for (const key of TRAINING_KEYS) {
    const cost = Number(costs[key] ?? 0);
    if (cost <= 0) continue;
    const active = keys.includes(key);
    const importance = Number(weights[key] ?? 0);
    if (!active) penalty += cost * 4.5;
    if (importance < 1.3 && plan[key] >= 7) penalty += cost * .9;
    if (importance < .6 && plan[key] >= 4) penalty += cost * 1.25;
    const before = groupAverage(base, key);
    if (before >= 94 && plan[key] > 7) penalty += (plan[key] - 7) * 1.8;
  }
  for (const attribute of Object.keys(projected) as AttributeKey[]) {
    const gain = Math.max(0, Number(projected[attribute] ?? 0) - Number(base[attribute] ?? 0));
    if (!gain) continue;
    totalGain += gain;
    const relevant = keys.some((key) => GROUP_ATTRIBUTES[key].includes(attribute) && Number(weights[key] ?? 0) >= 1.1);
    if (relevant) usefulGain += gain;
  }
  const total = Math.max(1, trainingPlanTotalCost(plan));
  const relevance = totalGain ? usefulGain / totalGain * 100 : 100;
  const wasteProtection = 100 - penalty / total * 100;
  return clamp(wasteProtection * .58 + relevance * .42);
}

function crossModePlanScore(result: AnalysisResult, plan: TrainingPlan, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const keys = activeKeys(result.bestPosition.code);
  return average((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) =>
    distributionFit(plan, allMaps[mode].target, keys)
  ));
}

function scorePlan(result: AnalysisResult, plan: TrainingPlan, maps: CalibrationMaps, allMaps: Record<GameplayMode, CalibrationMaps>): CandidateScore {
  const keys = activeKeys(result.bestPosition.code);
  const roleFit = distributionFit(plan, maps.role, keys);
  // Compatibilidade mantida com o contrato antigo: formationFit agora mede somente
  // o estilo coletivo/técnico. A formação não participa do cálculo individual.
  const formationFit = Object.values(maps.tactical).some((value) => value > 0) ? distributionFit(plan, maps.tactical, keys) : 86;
  const playstyleFit = result.parsed.playstyle ? distributionFit(plan, maps.style, keys) : 68;
  const controlFit = distributionFit(plan, maps.control, keys);
  const connectionRobustness = distributionFit(plan, maps.connection, keys);
  const efficiency = pointEfficiency(result, plan, maps.target);
  const skillSynergy = [...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills, ...result.recommendedSkills].length ? distributionFit(plan, maps.skill, keys) : 70;
  const impetoSynergy = result.recommendedImpetos.length ? distributionFit(plan, maps.impeto, keys) : 68;
  const waste = antiOverallWaste(result, plan, maps.target);
  const crossModeStability = crossModePlanScore(result, plan, allMaps);
  const targetFit = distributionFit(plan, maps.target, keys);
  const response = gameplayResponse(result, plan);
  const floor = functionalFloor(result, plan);
  const identity = identityPreservation(result, plan);
  const score = clamp(
    targetFit * .10
    + roleFit * .12
    + formationFit * .04
    + playstyleFit * .09
    + controlFit * .03
    + connectionRobustness * .08
    + efficiency * .11
    + skillSynergy * .05
    + impetoSynergy * .02
    + waste * .10
    + crossModeStability * .08
    + response * .07
    + floor * .05
    + identity * .06
  );
  return {
    plan,
    score,
    dimensions: {
      roleFit,
      formationFit,
      playstyleFit,
      controlFit,
      connectionRobustness,
      pointEfficiency: efficiency,
      skillSynergy,
      impetoSynergy,
      antiOverallWaste: waste,
      crossModeStability,
      gameplayResponse: response,
      functionalFloor: floor,
      identityPreservation: identity
    }
  };
}

function collectCandidates(result: AnalysisResult, maps: CalibrationMaps) {
  const map = new Map<string, TrainingPlan>();
  const add = (plan: TrainingPlan | null | undefined) => {
    if (!plan) return;
    const normalized = normalizeTrainingPlan(plan);
    map.set(signature(normalized), normalized);
  };
  const priority = [...activeKeys(result.bestPosition.code)].sort((left, right) => maps.target[right] - maps.target[left]);
  const seedFromWeights = (weights: WeightMap, boost = 1) => {
    const keys = activeKeys(result.bestPosition.code);
    const total = Math.max(.001, keys.reduce((sum, key) => sum + Math.max(.01, weights[key]), 0));
    const seed = normalizeTrainingPlan({ shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 });
    for (const key of keys) seed[key] = Math.min(16, Math.max(0, Math.round(2 + (Math.max(.01, weights[key]) / total) * 48 * boost)));
    add(fitTrainingToBudget(seed, priority, result.trainingPointsTotal));
  };
  seedFromWeights(maps.target, 1);
  seedFromWeights(maps.role, .95);
  seedFromWeights(maps.style, .9);
  add(result.training);
  add(result.supremeGameplay?.finalTraining);
  add(result.unifiedIntelligence?.finalTraining);
  add(result.deepCardIntelligence?.finalTraining);
  add(result.competitiveFusion?.finalTraining);
  add(result.errorTolerance?.conservative);
  add(result.errorTolerance?.probable);
  add(result.errorTolerance?.optimistic);
  add(result.unifiedIntelligence?.simulation.abTest.variantA);
  add(result.unifiedIntelligence?.simulation.abTest.variantB);
  result.buildVariants.forEach((variant) => add(variant.training));
  result.maxPrecision?.alternatives.forEach((variant) => add(variant.training));

  const keys = activeKeys(result.bestPosition.code);
  const bases = Array.from(map.values()).slice(0, 7);
  for (const base of bases) {
    for (const plus of keys) {
      for (const minus of keys) {
        if (plus === minus) continue;
        for (const amount of [1, 2]) {
          const next = { ...base };
          next[plus] = Math.min(16, next[plus] + amount);
          next[minus] = Math.max(0, next[minus] - amount);
          add(fitTrainingToBudget(next, priority, result.trainingPointsTotal));
        }
      }
    }
    for (let first = 0; first < keys.length; first += 1) {
      for (let second = first + 1; second < keys.length; second += 1) {
        const minus = [...keys].reverse().find((key) => key !== keys[first] && key !== keys[second]);
        if (!minus) continue;
        const next = { ...base };
        next[keys[first]] = Math.min(16, next[keys[first]] + 1);
        next[keys[second]] = Math.min(16, next[keys[second]] + 1);
        next[minus] = Math.max(0, next[minus] - 2);
        add(fitTrainingToBudget(next, priority, result.trainingPointsTotal));
      }
    }
  }
  return Array.from(map.values());
}

function profileLabel(mode: GameplayMode) {
  if (mode === 'RANKED') return 'Ranqueado robusto';
  if (mode === 'OFFLINE') return 'Offline expressivo';
  return 'Universal equilibrado';
}

function topStrengths(score: CandidateScore) {
  const labels: Array<[keyof CandidateScore['dimensions'], string]> = [
    ['roleFit', 'função em campo'],
    ['formationFit', 'estilo coletivo'],
    ['playstyleFit', 'Estilo de Jogo'],
    ['controlFit', 'forma de controlar'],
    ['connectionRobustness', 'robustez de conexão'],
    ['pointEfficiency', 'retorno dos pontos'],
    ['skillSynergy', 'habilidades adicionais'],
    ['impetoSynergy', 'Ímpeto'],
    ['antiOverallWaste', 'proteção contra overall artificial'],
    ['crossModeStability', 'estabilidade entre modos'],
    ['gameplayResponse', 'resposta em campo'],
    ['functionalFloor', 'mínimos funcionais'],
    ['identityPreservation', 'DNA da carta']
  ];
  return labels.sort((left, right) => score.dimensions[right[0]] - score.dimensions[left[0]])
    .slice(0, 3)
    .map(([key, label]) => `${label}: ${Math.round(score.dimensions[key])}/100`);
}

function tradeOffs(score: CandidateScore) {
  const alerts: string[] = [];
  if (score.dimensions.connectionRobustness < 74) alerts.push('Pode responder pior quando houver atraso ou oscilação de rede.');
  if (score.dimensions.playstyleFit < 74) alerts.push('A distribuição não explora totalmente o Estilo de Jogo confirmado.');
  if (score.dimensions.formationFit < 72) alerts.push('A distribuição pode aproveitar melhor o estilo coletivo do técnico.');
  if (score.dimensions.antiOverallWaste < 82) alerts.push('Há investimento próximo da faixa de retorno baixo.');
  if (score.dimensions.crossModeStability < 76) alerts.push('É mais especializada e pode variar entre ranqueado e offline.');
  if (score.dimensions.gameplayResponse < 78) alerts.push('A resposta prática ainda possui um ponto fraco importante para a posição.');
  if (score.dimensions.functionalFloor < 76) alerts.push('Um dos mínimos funcionais da posição ficou abaixo da faixa competitiva.');
  return alerts.length ? alerts.slice(0, 3) : ['Nenhum comprometimento crítico detectado para este perfil.'];
}

function readiness(result: AnalysisResult) {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const attributes = Object.values(result.parsed.attributes).filter((value) => Number.isFinite(value)).length;
  if (!result.parsed.playstyle) blockers.push('Confirmar o Estilo de Jogo da carta.');
  if (result.tacticalProfile.style === 'AUTO') blockers.push('Escolher o estilo coletivo do técnico.');
  if (attributes < 12) blockers.push(`Confirmar mais atributos da carta; apenas ${attributes} foram lidos.`);
  if (result.validation.level === 'blocked') blockers.push('Resolver os campos bloqueados na validação do print.');
  if (!result.tacticalProfile.managerName && !result.tacticalProfile.managerId) warnings.push('Sem técnico específico, a proficiência não participa do ajuste fino.');
  if (result.recommendedSkills.length < 5) warnings.push('O Top 5 de habilidades ainda não está completo.');
  if (!result.recommendedImpetos.length) warnings.push('Nenhum Ímpeto foi classificado com segurança.');
  const score = clamp(100 - blockers.length * 16 - warnings.length * 5 - (result.parsed.confidence < 70 ? 12 : 0));
  const state: CalibrationV32Analysis['readiness'] = score >= 88 ? 'pronta' : score >= 68 ? 'quase pronta' : 'revisar';
  return { blockers, warnings, score, state };
}

function buildProfile(result: AnalysisResult, mode: GameplayMode, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const maps = allMaps[mode];
  const candidates = collectCandidates(result, maps);
  const scored = candidates.map((plan) => scorePlan(result, plan, maps, allMaps))
    .sort((left, right) => {
      const leftExact = trainingPlanTotalCost(left.plan) === result.trainingPointsTotal ? 1 : 0;
      const rightExact = trainingPlanTotalCost(right.plan) === result.trainingPointsTotal ? 1 : 0;
      return rightExact - leftExact || right.score - left.score || right.dimensions.pointEfficiency - left.dimensions.pointEfficiency;
    });
  const exact = scored.filter((item) => trainingPlanTotalCost(item.plan) === result.trainingPointsTotal);
  const winner = exact[0] ?? scored[0] ?? scorePlan(result, result.training, maps, allMaps);
  const profile: CalibrationV32Profile = {
    mode,
    label: profileLabel(mode),
    score: winner.score,
    training: winner.plan,
    exactBudget: trainingPlanTotalCost(winner.plan) === result.trainingPointsTotal,
    strengths: topStrengths(winner),
    tradeOffs: tradeOffs(winner)
  };
  return { profile, winner, candidates: candidates.length, exactCandidates: exact.length };
}

function weightedDimensions(entries: Array<{ score: CandidateScore; weight: number }>): CalibrationV32Analysis['dimensions'] {
  const total = Math.max(.001, entries.reduce((sum, item) => sum + item.weight, 0));
  const keys = Object.keys(entries[0]?.score.dimensions ?? {}) as Array<keyof CalibrationV32Analysis['dimensions']>;
  return Object.fromEntries(keys.map((key) => [key, clamp(entries.reduce((sum, item) => sum + item.score.dimensions[key] * item.weight, 0) / total)])) as CalibrationV32Analysis['dimensions'];
}

function buildRobustChampion(result: AnalysisResult, selectedMode: GameplayMode, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const modeWeights: Record<GameplayMode, Record<GameplayMode, number>> = {
    RANKED: { RANKED: .62, UNIVERSAL: .28, OFFLINE: .10 },
    UNIVERSAL: { RANKED: .42, UNIVERSAL: .38, OFFLINE: .20 },
    OFFLINE: { RANKED: .15, UNIVERSAL: .25, OFFLINE: .60 }
  };
  const plans = new Map<string, TrainingPlan>();
  for (const mode of ['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]) {
    for (const plan of collectCandidates(result, allMaps[mode])) plans.set(signature(plan), plan);
  }
  const ranked = Array.from(plans.values()).map((plan) => {
    const scored = (['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) => ({ mode, score: scorePlan(result, plan, allMaps[mode], allMaps), weight: modeWeights[selectedMode][mode] }));
    const weighted = scored.reduce((sum, item) => sum + item.score.score * item.weight, 0);
    const floor = Math.min(...scored.map((item) => item.score.score));
    const antiOverall = average(scored.map((item) => item.score.dimensions.antiOverallWaste));
    const response = average(scored.map((item) => item.score.dimensions.gameplayResponse));
    const exact = trainingPlanTotalCost(plan) === result.trainingPointsTotal;
    const total = clamp(weighted * .86 + floor * .08 + antiOverall * .035 + response * .025);
    return {
      plan,
      score: total,
      exact,
      dimensions: weightedDimensions(scored.map((item) => ({ score: item.score, weight: item.weight }))),
      floor
    };
  }).sort((left, right) => Number(right.exact) - Number(left.exact) || right.score - left.score || right.floor - left.floor || right.dimensions.antiOverallWaste - left.dimensions.antiOverallWaste);
  const exact = ranked.filter((item) => item.exact);
  return { winner: exact[0] ?? ranked[0] ?? { plan: result.training, score: 0, exact: false, dimensions: scorePlan(result, result.training, allMaps[selectedMode], allMaps).dimensions, floor: 0 }, candidates: ranked.length, exactCandidates: exact.length };
}

function shadowResultForPosition(result: AnalysisResult, position: PositionCode): AnalysisResult {
  const score = result.positionScores.find((item) => item.code === position)?.score ?? (position === result.parsed.mainPosition ? 88 : 72);
  return {
    ...result,
    bestPosition: { code: position, label: POSITION_PT[position], score },
    tacticalProfile: { ...result.tacticalProfile, formation: 'AUTO' },
    recommendedSkills: position === result.bestPosition.code ? result.recommendedSkills : [],
    skillRecommendations: position === result.bestPosition.code ? result.skillRecommendations : [],
    recommendedImpetos: position === result.bestPosition.code ? result.recommendedImpetos : []
  };
}

function buildPositionSnapshot(result: AnalysisResult, position: PositionCode, role: PositionGameplayBuild['role'], mode: GameplayMode): PositionGameplayBuild {
  const shadow = shadowResultForPosition(result, position);
  const maps = Object.fromEntries((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((item) => [item, targetWeights(shadow, item)])) as Record<GameplayMode, CalibrationMaps>;
  const champion = buildRobustChampion(shadow, mode, maps).winner;
  const scored = scorePlan(shadow, champion.plan, maps[mode], maps);
  return {
    position,
    label: POSITION_PT[position],
    role,
    training: champion.plan,
    score: champion.score,
    gameplayResponse: scored.dimensions.gameplayResponse,
    functionalFloor: scored.dimensions.functionalFloor,
    antiOverallWaste: scored.dimensions.antiOverallWaste,
    crossModeStability: scored.dimensions.crossModeStability,
    exactBudget: trainingPlanTotalCost(champion.plan) === shadow.trainingPointsTotal,
    strengths: topStrengths(scored),
    note: role === 'posição natural'
      ? `Ficha preservando a identidade original em ${POSITION_PT[position]}, sem perseguir overall.`
      : `Ficha recalculada para atuar em ${POSITION_PT[position]}, com a escolha do usuário preservada.`
  };
}

function buildPositionComparison(result: AnalysisResult, mode: GameplayMode, selectedSnapshot?: PositionGameplayBuild): PositionBuildComparison {
  const naturalPosition = result.parsed.mainPosition;
  const selectedPosition = result.bestPosition.code;
  const natural = naturalPosition === selectedPosition && selectedSnapshot
    ? { ...selectedSnapshot, role: 'posição natural' as const, note: `A posição natural e a escolhida são ${POSITION_PT[selectedPosition]}; esta é a ficha máxima para as duas leituras.` }
    : buildPositionSnapshot(result, naturalPosition, 'posição natural', mode);
  const selected = selectedSnapshot ?? buildPositionSnapshot(result, selectedPosition, 'posição escolhida', mode);
  const samePosition = naturalPosition === selectedPosition;
  return {
    engineVersion: ENGINE_VERSION,
    natural,
    selected,
    samePosition,
    recommendation: samePosition
      ? `A carta foi mantida em ${selected.label}; use a ficha selecionada como versão máxima de gameplay.`
      : `Use “posição natural” quando quiser preservar o comportamento original e “posição escolhida” quando escalar a carta como ${selected.label}.`,
    safeguards: [
      'As duas fichas usam exatamente o mesmo orçamento disponível.',
      'Overall não participa da pontuação e não altera a ficha vencedora.',
      'A posição escolhida pelo usuário nunca é trocada silenciosamente.',
      'A formação permanece automática e não muda a distribuição individual.',
      'Ranqueado, universal e offline participam da decisão para evitar uma ficha frágil fora de um único modo.'
    ]
  };
}


function dnaMetricSet(result: AnalysisResult) {
  const a = completeAttributes(result);
  return {
    dribble: average([a.ballControl, a.dribbling, a.tightPossession, a.balance, a.acceleration]),
    creation: average([a.lowPass, a.loftedPass, a.ballControl, a.tightPossession]),
    finishing: average([a.finishing, a.offensiveAwareness, a.kickingPower, a.ballControl]),
    rupture: average([a.speed, a.acceleration, a.offensiveAwareness, a.balance]),
    aerial: average([a.heading, a.jump, a.physicalContact, a.finishing]),
    engine: average([a.stamina, a.speed, a.acceleration, a.lowPass, a.defensiveEngagement]),
    defending: average([a.defensiveAwareness, a.defensiveEngagement, a.tackling, a.aggression, a.physicalContact]),
    buildup: average([a.lowPass, a.loftedPass, a.ballControl, a.defensiveAwareness]),
    wide: average([a.speed, a.acceleration, a.stamina, a.loftedPass, a.ballControl]),
    gkReaction: average([a.goalkeeperReflexes, a.goalkeeperParrying, a.goalkeeperReach, a.goalkeeperAwareness]),
    gkDistribution: average([a.goalkeeperAwareness, a.goalkeeperCatching, a.kickingPower, a.lowPass, a.loftedPass]),
    gkBalanced: average([a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach])
  };
}

function profileAttributeScore(result: AnalysisResult, id: GameplayDnaProfileId) {
  const m = dnaMetricSet(result);
  switch (id) {
    case 'DRIBBLER': return m.dribble;
    case 'CREATOR': return m.creation;
    case 'FINISHER': return m.finishing;
    case 'SECOND_STRIKER': return average([m.dribble, m.creation, m.finishing, m.rupture]);
    case 'DIRECT_RUNNER': return m.rupture;
    case 'AERIAL_TARGET': return m.aerial;
    case 'WIDE_CREATOR': return average([m.wide, m.creation]);
    case 'BOX_TO_BOX': return m.engine;
    case 'DEEP_PLAYMAKER': return average([m.creation, m.buildup]);
    case 'BALL_WINNER': return average([m.defending, m.engine]);
    case 'DEFENSIVE_ANCHOR': return average([m.defending, m.buildup]);
    case 'PROGRESSIVE_DEFENDER': return average([m.defending, m.buildup]);
    case 'DEFENSIVE_FULLBACK': return average([m.defending, m.wide]);
    case 'OFFENSIVE_FULLBACK': return average([m.wide, m.creation]);
    case 'GK_SHOT_STOPPER': return m.gkReaction;
    case 'GK_DISTRIBUTOR': return m.gkDistribution;
    case 'GK_BALANCED': return m.gkBalanced;
  }
}

function profileSkillAffinity(result: AnalysisResult, definition: DnaProfileDefinition) {
  const owned = normalizeText([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].join(' '));
  const signals: Partial<Record<GameplayDnaProfileId, RegExp>> = {
    DRIBBLER: /toque duplo|controle com a sola|giro 360|elastico|finta|pedalada|chapeu/,
    CREATOR: /passe de primeira|passe em profundidade|passe na medida|passe sem olhar|calcanhar/,
    FINISHER: /chute de primeira|precisao a distancia|efeito de longe|finalizacao acrobatica|folha seca/,
    SECOND_STRIKER: /passe de primeira|chute de primeira|calcanhar|controle com a sola/,
    DIRECT_RUNNER: /chute de primeira|super substituto|espirito guerreiro/,
    AERIAL_TARGET: /cabecada|superioridade aerea|finalizacao acrobatica/,
    WIDE_CREATOR: /cruzamento preciso|curva para fora|passe na medida|passe aereo baixo/,
    BOX_TO_BOX: /volta para marcar|espirito guerreiro|passe de primeira|interceptacao/,
    DEEP_PLAYMAKER: /passe de primeira|passe em profundidade|passe aereo baixo|interceptacao/,
    BALL_WINNER: /interceptacao|bloqueador|marcacao individual|carrinho/,
    DEFENSIVE_ANCHOR: /interceptacao|bloqueador|marcacao individual|superioridade aerea/,
    PROGRESSIVE_DEFENDER: /interceptacao|bloqueador|passe de primeira|passe em profundidade/,
    DEFENSIVE_FULLBACK: /volta para marcar|interceptacao|bloqueador|marcacao individual/,
    OFFENSIVE_FULLBACK: /cruzamento preciso|passe na medida|controle com a sola|volta para marcar/,
    GK_SHOT_STOPPER: /pegador de penalti|espirito guerreiro|lideranca/,
    GK_DISTRIBUTOR: /reposicao baixa|reposicao alta|arremesso longo do goleiro/,
    GK_BALANCED: /pegador de penalti|reposicao|lideranca|espirito guerreiro/
  };
  if (!owned.trim()) return 72;
  return signals[definition.id]?.test(owned) ? 94 : 74;
}

function profileCompatibility(result: AnalysisResult, definition: DnaProfileDefinition) {
  const attribute = profileAttributeScore(result, definition.id);
  const playstyle = normalizeText(result.parsed.playstyle);
  const playstyleFit = definition.playstyle && playstyle ? (definition.playstyle.test(playstyle) ? 98 : 70) : 76;
  const skillFit = profileSkillAffinity(result, definition);
  const positionFit = definition.positions.includes(result.bestPosition.code) ? 98 : 45;
  return clamp(attribute * .62 + positionFit * .18 + playstyleFit * .12 + skillFit * .08);
}

function profileMaps(result: AnalysisResult, definition: DnaProfileDefinition) {
  return Object.fromEntries((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) => {
    const base = targetWeights(result, mode);
    const target = { ...base.target };
    const style = { ...base.style };
    const control = { ...base.control };
    addWeights(target, definition.weights, 3.8);
    addWeights(style, definition.weights, 2.2);
    addWeights(control, definition.weights, 1.1);
    return [mode, { ...base, target, style, control }];
  })) as Record<GameplayMode, CalibrationMaps>;
}

function buildFastDnaChampion(result: AnalysisResult, selectedMode: GameplayMode, allMaps: Record<GameplayMode, CalibrationMaps>) {
  const modeWeights: Record<GameplayMode, Record<GameplayMode, number>> = {
    RANKED: { RANKED: .62, UNIVERSAL: .28, OFFLINE: .10 },
    UNIVERSAL: { RANKED: .42, UNIVERSAL: .38, OFFLINE: .20 },
    OFFLINE: { RANKED: .15, UNIVERSAL: .25, OFFLINE: .60 }
  };
  const keys = activeKeys(result.bestPosition.code);
  const plans = new Map<string, TrainingPlan>();
  const add = (plan: TrainingPlan | null | undefined) => {
    if (!plan) return;
    const normalized = normalizeTrainingPlan(plan);
    if (trainingPlanTotalCost(normalized) !== result.trainingPointsTotal) return;
    plans.set(signature(normalized), normalized);
  };
  const seedFromWeights = (weights: WeightMap) => {
    const priority = [...keys].sort((left, right) => weights[right] - weights[left]);
    const total = Math.max(.001, keys.reduce((sum, key) => sum + Math.max(.01, weights[key]), 0));
    const seed = normalizeTrainingPlan({ shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 });
    for (const key of keys) seed[key] = Math.min(16, Math.max(0, Math.round(2 + (Math.max(.01, weights[key]) / total) * 48)));
    add(fitTrainingToBudget(seed, priority, result.trainingPointsTotal));
  };

  for (const mode of ['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]) seedFromWeights(allMaps[mode].target);
  const mainPriority = [...keys].sort((left, right) => allMaps[selectedMode].target[right] - allMaps[selectedMode].target[left]);
  // A busca DNA não reutiliza fichas intermediárias de motores anteriores.
  // Essas fichas podem carregar metadados variáveis de OCR (como GER/Overall)
  // e alterar o conjunto de candidatas da mesma carta. As sementes abaixo são
  // derivadas somente dos atributos, estilo, habilidades e orçamento canônicos.

  const bases = Array.from(plans.values()).slice(0, 3);
  const top = mainPriority.slice(0, Math.min(3, mainPriority.length));
  const low = [...mainPriority].reverse();
  for (const base of bases) {
    for (const plus of top) {
      const minus = low.find((key) => key !== plus && Number(base[key] ?? 0) > 0);
      if (!minus) continue;
      for (const amount of [1, 2]) {
        const next = { ...base };
        next[plus] = Math.min(16, next[plus] + amount);
        next[minus] = Math.max(0, next[minus] - amount);
        add(fitTrainingToBudget(next, mainPriority, result.trainingPointsTotal));
      }
    }
  }

  const ranked = Array.from(plans.values()).map((plan) => {
    const scored = (['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) => ({
      score: scorePlan(result, plan, allMaps[mode], allMaps),
      weight: modeWeights[selectedMode][mode]
    }));
    const weighted = scored.reduce((sum, item) => sum + item.score.score * item.weight, 0);
    const floor = Math.min(...scored.map((item) => item.score.score));
    const antiOverall = average(scored.map((item) => item.score.dimensions.antiOverallWaste));
    const response = average(scored.map((item) => item.score.dimensions.gameplayResponse));
    return {
      plan,
      score: clamp(weighted * .86 + floor * .08 + antiOverall * .035 + response * .025),
      dimensions: weightedDimensions(scored),
      floor
    };
  }).sort((left, right) => right.score - left.score || right.floor - left.floor || right.dimensions.antiOverallWaste - left.dimensions.antiOverallWaste);

  return ranked[0] ?? {
    plan: fitTrainingToBudget(result.training, mainPriority, result.trainingPointsTotal),
    score: 0,
    dimensions: scorePlan(result, result.training, allMaps[selectedMode], allMaps).dimensions,
    floor: 0
  };
}

function detectedDnaLabels(result: AnalysisResult) {
  const metrics = dnaMetricSet(result);
  const entries = result.bestPosition.code === 'GK'
    ? [
        ['Reflexo e defesa', metrics.gkReaction],
        ['Reposição e construção', metrics.gkDistribution],
        ['Equilíbrio de goleiro', metrics.gkBalanced]
      ] as Array<[string, number]>
    : [
        ['Drible e controle', metrics.dribble],
        ['Criação e passe', metrics.creation],
        ['Finalização', metrics.finishing],
        ['Ruptura e aceleração', metrics.rupture],
        ['Jogo aéreo e contato', metrics.aerial],
        ['Cobertura de campo', metrics.engine],
        ['Defesa e recuperação', metrics.defending],
        ['Saída de bola', metrics.buildup],
        ['Jogo pelo corredor', metrics.wide]
      ] as Array<[string, number]>;
  return entries.sort((left, right) => right[1] - left[1]).slice(0, 3).map(([label, score]) => `${label} ${Math.round(score)}`);
}


type DnaProfileFamily =
  | 'dribble'
  | 'creation'
  | 'finishing'
  | 'rupture'
  | 'aerial'
  | 'engine'
  | 'defense'
  | 'buildup'
  | 'wide'
  | 'gkReaction'
  | 'gkDistribution'
  | 'gkBalanced';

function dnaProfileFamily(id: GameplayDnaProfileId): DnaProfileFamily {
  switch (id) {
    case 'DRIBBLER': return 'dribble';
    case 'CREATOR':
    case 'WIDE_CREATOR':
    case 'DEEP_PLAYMAKER': return 'creation';
    case 'FINISHER':
    case 'SECOND_STRIKER': return 'finishing';
    case 'DIRECT_RUNNER': return 'rupture';
    case 'AERIAL_TARGET': return 'aerial';
    case 'BOX_TO_BOX': return 'engine';
    case 'BALL_WINNER':
    case 'DEFENSIVE_ANCHOR':
    case 'DEFENSIVE_FULLBACK': return 'defense';
    case 'PROGRESSIVE_DEFENDER': return 'buildup';
    case 'OFFENSIVE_FULLBACK': return 'wide';
    case 'GK_SHOT_STOPPER': return 'gkReaction';
    case 'GK_DISTRIBUTOR': return 'gkDistribution';
    case 'GK_BALANCED': return 'gkBalanced';
  }
}

function dnaFamilyAffinity(result: AnalysisResult, family: DnaProfileFamily) {
  const metrics = dnaMetricSet(result);
  const values: Record<DnaProfileFamily, number> = {
    dribble: metrics.dribble,
    creation: metrics.creation,
    finishing: metrics.finishing,
    rupture: metrics.rupture,
    aerial: metrics.aerial,
    engine: metrics.engine,
    defense: metrics.defending,
    buildup: metrics.buildup,
    wide: metrics.wide,
    gkReaction: metrics.gkReaction,
    gkDistribution: metrics.gkDistribution,
    gkBalanced: metrics.gkBalanced
  };
  const playstyle = normalizeText(result.parsed.playstyle ?? '');
  const playstyleBoosts: Partial<Record<DnaProfileFamily, RegExp>> = {
    dribble: /armador criativo|ala produtivo|lateral movel|puxa marcacao/,
    creation: /armador criativo|orquestrador|classico|pivo|defensor criativo/,
    finishing: /artilheiro|homem de area|infiltracao|atacante surpresa/,
    rupture: /artilheiro|infiltracao|ala produtivo|lateral movel/,
    aerial: /homem de area|pivo|atacante pivo|destruidor/,
    engine: /meia versatil|box.?to.?box|infiltracao/,
    defense: /primeiro volante|destruidor|lateral defensivo|defensor criativo/,
    buildup: /defensor criativo|orquestrador|primeiro volante/,
    wide: /perito em cruzamento|lateral ofensivo|lateral atacante|ala produtivo/,
    gkReaction: /goleiro defensivo/,
    gkDistribution: /goleiro ofensivo/,
    gkBalanced: /goleiro/
  };
  const styleBoost = playstyle && playstyleBoosts[family]?.test(playstyle) ? 7 : 0;
  return clamp(values[family] + styleBoost);
}

function selectDiverseGameplayProfiles(result: AnalysisResult, candidates: GameplayDnaProfile[]) {
  if (candidates.length <= 3) return candidates;

  const selected: GameplayDnaProfile[] = [];
  const selectedIds = new Set<GameplayDnaProfileId>();
  const selectedFamilies = new Set<DnaProfileFamily>();
  const selectedSignatures = new Set<string>();
  const add = (candidate: GameplayDnaProfile) => {
    if (selectedIds.has(candidate.id) || selected.length >= 3) return false;
    selected.push(candidate);
    selectedIds.add(candidate.id);
    selectedFamilies.add(dnaProfileFamily(candidate.id));
    selectedSignatures.add(signature(candidate.training));
    return true;
  };

  // A primeira ficha continua sendo a campeã absoluta. As seguintes precisam
  // representar DNAs funcionais diferentes, em vez de três variações quase iguais.
  add(candidates[0]);

  const bestByFamily = new Map<DnaProfileFamily, GameplayDnaProfile>();
  for (const candidate of candidates) {
    const family = dnaProfileFamily(candidate.id);
    const current = bestByFamily.get(family);
    const candidateRank = candidate.score * .34 + dnaFamilyAffinity(result, family) * .66;
    const currentRank = current ? current.score * .34 + dnaFamilyAffinity(result, family) * .66 : -1;
    if (!current || candidateRank > currentRank) bestByFamily.set(family, candidate);
  }

  const familyCandidates = Array.from(bestByFamily.entries())
    .filter(([family, candidate]) => !selectedFamilies.has(family) && !selectedIds.has(candidate.id))
    .sort((left, right) => {
      const leftRank = left[1].score * .34 + dnaFamilyAffinity(result, left[0]) * .66;
      const rightRank = right[1].score * .34 + dnaFamilyAffinity(result, right[0]) * .66;
      return rightRank - leftRank || right[1].compatibility - left[1].compatibility;
    });

  // A diversidade funcional vem antes da assinatura numérica: duas fichas podem
  // chegar à mesma distribuição ótima e ainda diferirem em objetivo e habilidades.
  for (const [, candidate] of familyCandidates) {
    add(candidate);
    if (selected.length === 3) break;
  }
  // Salvaguarda para posições com poucas famílias elegíveis.
  for (const candidate of candidates) {
    if (selectedSignatures.has(signature(candidate.training))) continue;
    add(candidate);
    if (selected.length === 3) break;
  }
  for (const candidate of candidates) {
    add(candidate);
    if (selected.length === 3) break;
  }
  return selected;
}

function buildGameplayDnaAnalysis(result: AnalysisResult, mode: GameplayMode): GameplayDnaAnalysis {
  const shadow = shadowResultForPosition(result, result.bestPosition.code);
  const definitions = DNA_PROFILE_DEFINITIONS.filter((definition) => definition.positions.includes(shadow.bestPosition.code));
  const candidates: GameplayDnaProfile[] = definitions.map((definition) => {
    const compatibility = profileCompatibility(shadow, definition);
    const maps = profileMaps(shadow, definition);
    const champion = buildFastDnaChampion(shadow, mode, maps);
    const scored = scorePlan(shadow, champion.plan, maps[mode], maps);
    const profileScore = clamp(champion.score * .76 + compatibility * .24);
    const skillPlan = buildPersonalizedSkillPlan(
      { ...shadow, training: champion.plan },
      champion.plan,
      { label: definition.label, preferredCategories: definition.categories }
    );
    const limitations = [
      compatibility < 78 ? 'A carta executa este perfil, mas não é uma especialista natural.' : '',
      scored.dimensions.functionalFloor < 80 ? 'Existe um piso funcional que precisa ser respeitado durante a partida.' : '',
      scored.dimensions.crossModeStability < 80 ? 'Este perfil é mais especializado e pode variar mais entre modos.' : '',
      scored.dimensions.antiOverallWaste < 84 ? 'Alguns pontos têm retorno menor; use somente se este for seu objetivo de gameplay.' : ''
    ].filter(Boolean);
    return {
      id: definition.id,
      rank: 0,
      label: definition.label,
      functionalStyle: definition.functionalStyle,
      description: definition.description,
      position: shadow.bestPosition.code,
      compatibility,
      score: profileScore,
      recommended: false,
      exactBudget: trainingPlanTotalCost(champion.plan) === shadow.trainingPointsTotal,
      training: champion.plan,
      additionalSkills: skillPlan.map((item) => item.name),
      focus: definition.focus,
      strengths: topStrengths(scored),
      limitations: limitations.length ? limitations : ['Nenhuma limitação crítica detectada para este perfil.'],
      evidence: [
        `Compatibilidade técnica ${compatibility}/100 para ${POSITION_PT[shadow.bestPosition.code]}.`,
        result.parsed.playstyle ? `Estilo oficial preservado: ${result.parsed.playstyle}.` : 'Estilo oficial não confirmado; decisão baseada em posição e atributos.',
        `Resposta ${Math.round(scored.dimensions.gameplayResponse)} • piso ${Math.round(scored.dimensions.functionalFloor)} • anti-overall ${Math.round(scored.dimensions.antiOverallWaste)}.`,
        `Cinco habilidades oficiais recalculadas para o perfil ${definition.label}.`
      ]
    };
  }).sort((left, right) => right.score - left.score || right.compatibility - left.compatibility);

  const diverse = selectDiverseGameplayProfiles(shadow, candidates);
  const profiles = diverse.map((profile, index) => ({ ...profile, rank: index + 1, recommended: index === 0 }));
  const primary = profiles[0] ?? candidates[0];
  return {
    engineVersion: ENGINE_VERSION,
    playerName: result.parsed.playerName,
    officialPlaystyle: result.parsed.playstyle ?? null,
    selectedPosition: result.bestPosition.code,
    detectedDna: detectedDnaLabels(result),
    primaryProfileId: primary?.id ?? (result.bestPosition.code === 'GK' ? 'GK_BALANCED' : 'CREATOR'),
    profiles,
    summary: primary
      ? `${result.parsed.playerName} foi reconhecido pela carta e recebeu ${profiles.length} fichas funcionais. A recomendada é “${primary.label}” para ${POSITION_PT[result.bestPosition.code]}, sem alterar o Estilo de Jogo oficial.`
      : 'Não foi possível formar perfis distintos com os dados disponíveis.',
    safeguards: [
      'O nome identifica o jogador, mas a decisão usa principalmente os atributos desta versão específica da carta.',
      'Perfil funcional não altera o Estilo de Jogo oficial da Konami.',
      'Cada ficha usa o orçamento real e mantém a posição escolhida pelo usuário.',
      'As habilidades adicionais vêm somente do catálogo oficial e não repetem habilidades já possuídas.',
      'Overall não participa do ranking dos perfis.'
    ]
  };
}

function updateDerivedPrecision(result: AnalysisResult, profiles: CalibrationV32Profile[]) {
  const baseAttributes = completeAttributes(result);
  const objective = normalizeObjective(result.objective);
  const variants: BuildVariant[] = profiles.map((profile, index) => ({
    kind: index === 0 ? 'competitive' : index === 1 ? 'safe' : 'alternative',
    title: profile.label,
    positionLabel: result.bestPosition.label,
    training: profile.training,
    pointsUsed: trainingPlanTotalCost(profile.training),
    qualityScore: profile.score,
    efficiencyScore: profile.exactBudget ? 100 : 80,
    balanceScore: profile.score,
    note: profile.strengths.join(' • '),
    verdict: profile.tradeOffs[0],
    simulationsTested: 0
  }));
  const maxPrecision = buildMaxPrecisionAnalysis({
    parsed: result.parsed,
    position: result.bestPosition.code,
    selectedScore: result.bestPosition.score,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    trainingPointsTotal: result.trainingPointsTotal
  });
  const eliteEvolution = buildEliteEvolutionAnalysis({
    parsed: result.parsed,
    position: result.bestPosition.code,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    maxPrecision
  });
  const metaBuildUniverse = buildMetaBuildUniverse({
    parsed: result.parsed,
    position: result.bestPosition.code,
    objective,
    tacticalProfile: result.tacticalProfile,
    baseAttributes,
    variants,
    maxPrecision,
    trainingPointsTotal: result.trainingPointsTotal
  });
  return { variants, maxPrecision, eliteEvolution, metaBuildUniverse };
}

export function applyCalibrationV32(result: AnalysisResult): AnalysisResult {
  const selectedMode = result.tacticalProfile.gameplayMode ?? 'UNIVERSAL';
  const connectionProfile = result.tacticalProfile.connectionProfile ?? 'VARIABLE';
  const controlProfile = result.tacticalProfile.controlProfile ?? 'AUTO';
  const automaticCardProfile = controlProfile === 'AUTO' ? inferAutomaticCardGameplayProfile(result) : undefined;
  const cacheKey = cardAnalysisInputFingerprint(result, `calibration-v35-20:${selectedMode}:${connectionProfile}:${controlProfile}`);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const allMaps = Object.fromEntries((['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).map((mode) => [mode, targetWeights(result, mode)])) as Record<GameplayMode, CalibrationMaps>;
  const modes: GameplayMode[] = [selectedMode, ...(['RANKED', 'UNIVERSAL', 'OFFLINE'] as GameplayMode[]).filter((mode) => mode !== selectedMode)];
  const built = modes.map((mode) => buildProfile(result, mode, allMaps));
  const robust = buildRobustChampion(result, selectedMode, allMaps);
  const champion: CandidateScore = { plan: robust.winner.plan, score: robust.winner.score, dimensions: robust.winner.dimensions };
  const activeProfile: CalibrationV32Profile = {
    ...built[0].profile,
    score: champion.score,
    training: champion.plan,
    exactBudget: trainingPlanTotalCost(champion.plan) === result.trainingPointsTotal,
    strengths: topStrengths(champion),
    tradeOffs: tradeOffs(champion)
  };
  const profiles = [activeProfile, ...built.slice(1).map((item) => item.profile)];
  const finalPlan = champion.plan;
  const used = trainingPlanTotalCost(finalPlan);
  const previousSignature = signature(result.training);
  const recalibrated = previousSignature !== signature(finalPlan);
  const ready = readiness(result);
  const confidence = clamp(result.parsed.confidence * .42 + champion.score * .43 + ready.score * .15, 20, 99);
  const selectedSnapshot: PositionGameplayBuild = {
    position: result.bestPosition.code,
    label: result.bestPosition.label,
    role: 'posição escolhida',
    training: finalPlan,
    score: champion.score,
    gameplayResponse: champion.dimensions.gameplayResponse,
    functionalFloor: champion.dimensions.functionalFloor,
    antiOverallWaste: champion.dimensions.antiOverallWaste,
    crossModeStability: champion.dimensions.crossModeStability,
    exactBudget: used === result.trainingPointsTotal,
    strengths: topStrengths(champion),
    note: `Ficha máxima para atuar como ${result.bestPosition.label}, sem usar overall como objetivo.`
  };
  const positionBuildComparison = buildPositionComparison(result, selectedMode, selectedSnapshot);
  const gameplayDna = buildGameplayDnaAnalysis(result, selectedMode);
  const reasons = [
    `Modo principal: ${profileLabel(selectedMode)} com campeão robusto entre ranqueado, universal e offline.`,
    `Conexão: ${connectionProfile === 'HIGH_DELAY' ? 'atraso alto' : connectionProfile === 'VARIABLE' ? 'variável' : 'estável'}; perfil: ${automaticCardProfile ? `automático pela carta — ${automaticCardProfile.label}` : controlProfile === 'PASSING' ? 'passe' : controlProfile === 'DRIBBLE' ? 'drible' : controlProfile === 'DIRECT' ? 'jogo direto' : 'equilibrado'}.`,
    `A distribuição foi comparada em ranqueado, universal e offline, sem usar overall como objetivo.`,
    `Resposta prática ${Math.round(champion.dimensions.gameplayResponse)}/100, piso funcional ${Math.round(champion.dimensions.functionalFloor)}/100 e proteção anti-overall ${Math.round(champion.dimensions.antiOverallWaste)}/100.`,
    `Orçamento real auditado: ${used}/${result.trainingPointsTotal} pontos.`,
    ...activeProfile.strengths
  ];
  const safeguards = [
    'A posição escolhida pelo usuário permanece soberana.',
    'O motor não recebe overall como meta nem pontua uma ficha pelo GER final.',
    'Grupos de goleiro são bloqueados em jogadores de linha e vice-versa.',
    'Uma ficha incompleta não vence uma alternativa que usa exatamente o orçamento.',
    'A formação não limita a ficha; posição, DNA da carta, estilo coletivo e técnico comandam a calibração.',
    'Habilidades nativas são removidas do Top 5 adicional antes da calibração final.',
    'Ímpetos já existentes não são recomendados novamente.',
    'O perfil ranqueado favorece consistência e resposta; o offline aceita mais especialização criativa.',
    'No modo automático, o jeito de jogar é inferido pelos atributos, Estilo de Jogo, habilidades e posição desta carta específica.'
  ];
  const analysis: CalibrationV32Analysis = {
    engineVersion: ENGINE_VERSION,
    patchReference: PATCH_REFERENCE,
    selectedMode,
    connectionProfile,
    controlProfile,
    automaticCardProfile,
    readiness: ready.state,
    readinessScore: ready.score,
    confidence,
    calibrationScore: champion.score,
    finalTraining: finalPlan,
    candidatesEvaluated: built.reduce((sum, item) => sum + item.candidates, 0) + robust.candidates,
    exactBudgetCandidates: built.reduce((sum, item) => sum + item.exactCandidates, 0) + robust.exactCandidates,
    recalibrated,
    dimensions: champion.dimensions,
    profiles,
    blockers: ready.blockers,
    warnings: [...ready.warnings, ...activeProfile.tradeOffs.filter((item) => !item.startsWith('Nenhum'))].slice(0, 8),
    safeguards,
    reasons,
    summary: `A Calibração Automática v40.20 avaliou ${built.reduce((sum, item) => sum + item.candidates, 0) + robust.candidates} candidatas e escolheu um campeão robusto para ${profileLabel(selectedMode).toLowerCase()} com ${champion.score}/100, sem perseguir overall.`
  };

  const derived = updateDerivedPrecision(result, profiles);
  const finalResult: AnalysisResult = {
    ...result,
    tacticalProfile: { ...result.tacticalProfile, gameplayMode: selectedMode, connectionProfile, controlProfile },
    training: finalPlan,
    trainingCost: trainingPlanCost(finalPlan),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    trainingComparison: result.trainingComparison.map((item) => ({ ...item, recommended: finalPlan[item.key], difference: finalPlan[item.key] - item.auto })),
    buildName: `Ficha Automática v40.20 — ${profileLabel(selectedMode)}`,
    buildVariants: derived.variants,
    recommendationExplanation: [analysis.summary, ...reasons, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    maxPrecision: derived.maxPrecision,
    eliteEvolution: derived.eliteEvolution,
    metaBuildUniverse: derived.metaBuildUniverse,
    supremeGameplay: result.supremeGameplay ? {
      ...result.supremeGameplay,
      engineVersion: '35.20-supreme-dna-gameplay-1',
      finalTraining: finalPlan,
      winnerScore: champion.score,
      dimensions: {
        ...result.supremeGameplay.dimensions,
        roleFit: champion.dimensions.roleFit,
        pointEfficiency: champion.dimensions.pointEfficiency,
        skillSynergy: champion.dimensions.skillSynergy,
        onlineRobustness: champion.dimensions.connectionRobustness
      },
      summary: analysis.summary
    } : result.supremeGameplay,
    unifiedIntelligence: result.unifiedIntelligence ? {
      ...result.unifiedIntelligence,
      engineVersion: '35.20-unified-dna-gameplay-1',
      finalTraining: finalPlan,
      simulation: { ...result.unifiedIntelligence.simulation, exactBudget: used === result.trainingPointsTotal, winnerScore: champion.score },
      summary: analysis.summary
    } : result.unifiedIntelligence,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      engineVersion: '35.20-deep-dna-gameplay-1',
      finalTraining: finalPlan,
      winnerScore: champion.score,
      summary: analysis.summary
    } : result.deepCardIntelligence,
    calibrationV32: analysis,
    positionBuildComparison,
    gameplayDna
  };

  cache.set(cacheKey, finalResult);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  return finalResult;
}
