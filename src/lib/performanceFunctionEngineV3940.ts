import type {
  AnalysisResult,
  AttributeKey,
  PerformanceFunctionV3940Analysis,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedSkillDecision
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { canonicalizePlayerPlaystyle } from './efootball2026Playstyles';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import { skillIdentityKey } from './officialSkillIdentity';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingLevelCost, trainingPlanTotalCost } from './trainingPlanCore';

export const PERFORMANCE_FUNCTION_V3940_VERSION = '39.40.0' as const;

type SkillCategory = UnifiedSkillDecision['category'];
type RoleBlueprint = {
  id: string;
  label: string;
  description: string;
  positions: PositionCode[];
  weights: Partial<Record<TrainingKey, number>>;
  floors: Partial<Record<TrainingKey, number>>;
  response: AttributeKey[];
  skills: SkillCategory[];
  identityBias: Array<'creation' | 'control' | 'finishing' | 'movement' | 'defending' | 'physical' | 'aerial' | 'endurance' | 'goalkeeping'>;
};

type DimensionKey = RoleBlueprint['identityBias'][number];
type Dimensions = Record<DimensionKey, number>;

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

const ROLE_BLUEPRINTS: RoleBlueprint[] = [
  { id: 'CA_FINALIZADOR', label: 'CA finalizador de movimentos curtos', description: 'Ataca a última linha, domina e conclui sem gastar pontos em áreas pouco acionadas.', positions: ['CF'], weights: { shooting: 1.45, dexterity: 1.15, lowerBodyStrength: .8, dribbling: .45, aerialStrength: .35 }, floors: { shooting: 7, dexterity: 7, lowerBodyStrength: 5 }, response: ['offensiveAwareness', 'finishing', 'acceleration', 'balance', 'kickingPower', 'ballControl'], skills: ['finalização', 'finalização', 'drible', 'físico', 'mental'], identityBias: ['finishing', 'movement', 'control'] },
  { id: 'CA_REFERENCIA', label: 'CA referência de apoio e área', description: 'Protege a bola, oferece parede e mantém ameaça física e aérea.', positions: ['CF'], weights: { shooting: 1.05, aerialStrength: 1.15, lowerBodyStrength: 1.0, dribbling: .55, passing: .25 }, floors: { shooting: 5, aerialStrength: 6, lowerBodyStrength: 6 }, response: ['ballControl', 'finishing', 'heading', 'jump', 'physicalContact', 'balance'], skills: ['aérea', 'físico', 'finalização', 'passe', 'mental'], identityBias: ['physical', 'aerial', 'finishing'] },
  { id: 'SA_CRIADOR', label: 'SA criador de conexão', description: 'Recebe entre linhas, tabela, conduz e cria a última ação sem perder ameaça de chute.', positions: ['SS'], weights: { dribbling: 1.2, passing: 1.1, dexterity: .95, shooting: .7, lowerBodyStrength: .45 }, floors: { dribbling: 6, passing: 6, dexterity: 5, shooting: 4 }, response: ['ballControl', 'dribbling', 'tightPossession', 'lowPass', 'offensiveAwareness', 'acceleration', 'balance', 'finishing'], skills: ['passe', 'drible', 'passe', 'finalização', 'mental'], identityBias: ['creation', 'control', 'finishing'] },
  { id: 'SA_RUPTURA', label: 'SA de ruptura e conclusão', description: 'Ataca o intervalo, acelera a jogada e conclui com poucos toques.', positions: ['SS'], weights: { dexterity: 1.2, shooting: 1.05, dribbling: .9, lowerBodyStrength: .65, passing: .55 }, floors: { dexterity: 6, shooting: 6, dribbling: 5 }, response: ['offensiveAwareness', 'acceleration', 'finishing', 'ballControl', 'balance', 'speed'], skills: ['finalização', 'drible', 'passe', 'finalização', 'físico'], identityBias: ['movement', 'finishing', 'control'] },
  { id: 'PONTA_CONDUTOR', label: 'Ponta condutor e decisivo', description: 'Conduz em velocidade, vence o primeiro duelo e chega para passe ou finalização.', positions: ['LWF', 'RWF'], weights: { dribbling: 1.35, dexterity: 1.1, lowerBodyStrength: .85, shooting: .75, passing: .4 }, floors: { dribbling: 7, dexterity: 6, lowerBodyStrength: 5 }, response: ['ballControl', 'dribbling', 'tightPossession', 'speed', 'acceleration', 'balance', 'finishing'], skills: ['drible', 'drible', 'finalização', 'passe', 'físico'], identityBias: ['control', 'movement', 'finishing'] },
  { id: 'ME_APOIO', label: 'Meia lateral de apoio e recomposição', description: 'Circula, progride e recompõe sem depender apenas de amplitude e cruzamento.', positions: ['LMF', 'RMF'], weights: { passing: 1.15, lowerBodyStrength: .95, dribbling: .85, dexterity: .75, defending: .62 }, floors: { passing: 6, lowerBodyStrength: 6, dribbling: 5, defending: 3 }, response: ['ballControl', 'lowPass', 'loftedPass', 'speed', 'acceleration', 'stamina', 'balance'], skills: ['passe', 'drible', 'defesa', 'físico', 'passe'], identityBias: ['creation', 'endurance', 'control'] },
  { id: 'MAT_ARMADOR', label: 'MAT armador entre linhas', description: 'Controla a zona central, aproxima os setores e cria sem virar um corredor genérico.', positions: ['AMF'], weights: { passing: 1.35, dribbling: 1.15, dexterity: .85, shooting: .58, lowerBodyStrength: .35 }, floors: { passing: 7, dribbling: 6, dexterity: 5 }, response: ['ballControl', 'tightPossession', 'lowPass', 'dribbling', 'offensiveAwareness', 'acceleration', 'balance'], skills: ['passe', 'drible', 'passe', 'finalização', 'mental'], identityBias: ['creation', 'control', 'finishing'] },
  { id: 'MAT_INFILTRADOR', label: 'MAT de infiltração controlada', description: 'Ataca a área no tempo certo sem abandonar domínio, passe e condução.', positions: ['AMF'], weights: { dexterity: 1.1, dribbling: 1.0, passing: .95, shooting: .85, lowerBodyStrength: .42 }, floors: { dexterity: 6, dribbling: 5, passing: 5, shooting: 4 }, response: ['offensiveAwareness', 'acceleration', 'ballControl', 'tightPossession', 'lowPass', 'finishing', 'balance'], skills: ['finalização', 'passe', 'drible', 'passe', 'físico'], identityBias: ['movement', 'control', 'creation'] },
  { id: 'MLG_CONTROLADOR', label: 'MLG controlador de posse', description: 'Mantém linhas de passe, protege a circulação e dá continuidade atrás dos jogadores ofensivos.', positions: ['CMF'], weights: { passing: 1.35, dribbling: .92, lowerBodyStrength: .82, defending: .74, dexterity: .58, shooting: .18 }, floors: { passing: 7, dribbling: 5, lowerBodyStrength: 6, defending: 4 }, response: ['ballControl', 'lowPass', 'loftedPass', 'tightPossession', 'stamina', 'balance', 'defensiveEngagement'], skills: ['passe', 'passe', 'drible', 'defesa', 'físico'], identityBias: ['creation', 'control', 'endurance'] },
  { id: 'MLG_AREA_A_AREA', label: 'MLG área a área equilibrado', description: 'Preserva mobilidade e chegada, mas reforça passe, resistência e recuperação para não partir o time.', positions: ['CMF'], weights: { lowerBodyStrength: 1.12, passing: 1.0, defending: .9, dexterity: .78, dribbling: .66, shooting: .3 }, floors: { lowerBodyStrength: 7, passing: 6, defending: 5, dexterity: 4 }, response: ['lowPass', 'ballControl', 'stamina', 'speed', 'balance', 'defensiveEngagement', 'tackling'], skills: ['passe', 'defesa', 'físico', 'drible', 'passe'], identityBias: ['endurance', 'movement', 'defending'] },
  { id: 'VOL_ANCORA', label: 'VOL de proteção e saída curta', description: 'Protege a frente da defesa, intercepta e entrega a bola com segurança.', positions: ['DMF'], weights: { defending: 1.38, passing: .95, lowerBodyStrength: .9, aerialStrength: .45, dexterity: .4 }, floors: { defending: 8, passing: 5, lowerBodyStrength: 6 }, response: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'lowPass', 'physicalContact', 'stamina', 'speed'], skills: ['defesa', 'defesa', 'passe', 'físico', 'aérea'], identityBias: ['defending', 'physical', 'creation'] },
  { id: 'VOL_ORGANIZADOR', label: 'VOL organizador recuado', description: 'Inicia a construção sem abrir mão de leitura defensiva e resistência.', positions: ['DMF'], weights: { passing: 1.22, defending: 1.08, lowerBodyStrength: .82, dribbling: .55, dexterity: .38 }, floors: { passing: 7, defending: 6, lowerBodyStrength: 5 }, response: ['lowPass', 'loftedPass', 'ballControl', 'defensiveAwareness', 'defensiveEngagement', 'stamina'], skills: ['passe', 'defesa', 'passe', 'físico', 'defesa'], identityBias: ['creation', 'defending', 'endurance'] },
  { id: 'ZAG_DOMINANTE', label: 'ZAG dominante em duelo', description: 'Prioriza leitura, desarme, contato e cobertura sem perseguir overall.', positions: ['CB'], weights: { defending: 1.48, aerialStrength: 1.0, lowerBodyStrength: .88, dexterity: .42, passing: .28 }, floors: { defending: 9, aerialStrength: 6, lowerBodyStrength: 6 }, response: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'physicalContact', 'speed', 'acceleration', 'jump'], skills: ['defesa', 'defesa', 'aérea', 'físico', 'passe'], identityBias: ['defending', 'physical', 'aerial'] },
  { id: 'ZAG_CONSTRUTOR', label: 'ZAG construtor seguro', description: 'Mantém superioridade defensiva e melhora a primeira saída de bola.', positions: ['CB'], weights: { defending: 1.35, passing: .72, aerialStrength: .86, lowerBodyStrength: .78, dexterity: .42 }, floors: { defending: 8, passing: 4, aerialStrength: 5, lowerBodyStrength: 5 }, response: ['defensiveAwareness', 'tackling', 'physicalContact', 'speed', 'lowPass', 'ballControl', 'jump'], skills: ['defesa', 'passe', 'defesa', 'aérea', 'físico'], identityBias: ['defending', 'creation', 'physical'] },
  { id: 'LATERAL_DEFENSIVO', label: 'Lateral de cobertura e saída', description: 'Fecha o corredor, recupera e participa da saída sem forçar cruzamentos.', positions: ['LB', 'RB'], weights: { defending: 1.15, lowerBodyStrength: 1.0, dexterity: .78, passing: .72, dribbling: .38 }, floors: { defending: 7, lowerBodyStrength: 6, dexterity: 4, passing: 4 }, response: ['defensiveAwareness', 'tackling', 'speed', 'acceleration', 'stamina', 'lowPass', 'balance'], skills: ['defesa', 'físico', 'passe', 'defesa', 'drible'], identityBias: ['defending', 'endurance', 'creation'] },
  { id: 'LATERAL_APOIO', label: 'Lateral de apoio equilibrado', description: 'Apoia a circulação e progride sem desproteger o corredor.', positions: ['LB', 'RB'], weights: { lowerBodyStrength: 1.02, passing: .95, defending: .9, dexterity: .78, dribbling: .55 }, floors: { lowerBodyStrength: 6, passing: 5, defending: 5, dexterity: 4 }, response: ['speed', 'acceleration', 'stamina', 'lowPass', 'loftedPass', 'defensiveAwareness', 'balance'], skills: ['passe', 'defesa', 'drible', 'físico', 'passe'], identityBias: ['endurance', 'creation', 'control'] },
  { id: 'GOL_COMPLETO', label: 'GOL de reação e alcance', description: 'Equilibra leitura, reflexo, defesa e alcance conforme os atributos reais da carta.', positions: ['GK'], weights: { gk2: 1.35, gk3: 1.22, gk1: 1.12, aerialStrength: .25 }, floors: { gk1: 6, gk2: 7, gk3: 6 }, response: ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach', 'jump'], skills: ['goleiro', 'goleiro', 'mental', 'físico', 'goleiro'], identityBias: ['goalkeeping', 'aerial', 'physical'] }
];

function clamp(value: number, min = 0, max = 100): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.round(Math.max(min, Math.min(max, safe)) * 10) / 10;
}

function average(values: number[]): number {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function normalize(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function clone(plan: TrainingPlan): TrainingPlan {
  return Object.fromEntries(TRAINING_KEYS.map((key) => [key, Number(plan[key] ?? 0)])) as TrainingPlan;
}

function planSignature(plan: TrainingPlan): string {
  return TRAINING_KEYS.map((key) => `${key}:${Number(plan[key] ?? 0)}`).join('|');
}

function l1Distance(left: TrainingPlan, right: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs(Number(left[key] ?? 0) - Number(right[key] ?? 0)), 0);
}

function preservation(core: TrainingPlan, candidate: TrainingPlan): number {
  const total = TRAINING_KEYS.reduce((sum, key) => sum + Number(core[key] ?? 0), 0);
  return total ? clamp(100 - l1Distance(core, candidate) / total * 100) : 100;
}

function attributes(result: AnalysisResult, keys: AttributeKey[]): number {
  return average(keys.map((key) => Number(result.parsed.attributes[key] ?? 0)));
}

function dimensions(result: AnalysisResult): Dimensions {
  return {
    creation: clamp(attributes(result, ['lowPass', 'loftedPass', 'ballControl', 'curl'])),
    control: clamp(attributes(result, ['ballControl', 'dribbling', 'tightPossession', 'balance'])),
    finishing: clamp(attributes(result, ['finishing', 'offensiveAwareness', 'kickingPower', 'curl'])),
    movement: clamp(attributes(result, ['offensiveAwareness', 'speed', 'acceleration', 'stamina'])),
    defending: clamp(attributes(result, ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'])),
    physical: clamp(attributes(result, ['physicalContact', 'balance', 'speed', 'stamina'])),
    aerial: clamp(attributes(result, ['heading', 'jump', 'physicalContact'])),
    endurance: clamp(attributes(result, ['stamina', 'speed', 'balance'])),
    goalkeeping: clamp(attributes(result, ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach']))
  };
}

function roleIdentityScore(role: RoleBlueprint, scores: Dimensions): number {
  return clamp(average(role.identityBias.map((key) => scores[key])));
}

function styleRoleBonus(result: AnalysisResult, role: RoleBlueprint): number {
  const style = normalize(canonicalizePlayerPlaystyle(result.parsed.playstyle) ?? result.parsed.playstyle);
  let bonus = 0;
  if (/meia versatil/.test(style) && ['MLG_AREA_A_AREA', 'ME_APOIO'].includes(role.id)) bonus += 12;
  if (/orquestrador/.test(style) && ['MLG_CONTROLADOR', 'VOL_ORGANIZADOR'].includes(role.id)) bonus += 14;
  if (/primeiro volante/.test(style) && role.id === 'VOL_ANCORA') bonus += 18;
  if (/destruidor/.test(style) && ['VOL_ANCORA', 'ZAG_DOMINANTE'].includes(role.id)) bonus += 14;
  if (/defensor criativo/.test(style) && role.id === 'ZAG_CONSTRUTOR') bonus += 16;
  if (/lateral defensivo/.test(style) && role.id === 'LATERAL_DEFENSIVO') bonus += 18;
  if (/armador criativo|classico 10/.test(style) && ['MAT_ARMADOR', 'SA_CRIADOR'].includes(role.id)) bonus += 16;
  if (/infiltracao/.test(style) && ['MAT_INFILTRADOR', 'SA_RUPTURA'].includes(role.id)) bonus += 16;
  if (/artilheiro|homem de area/.test(style) && role.id === 'CA_FINALIZADOR') bonus += 15;
  if (/pivo|atacante pivo/.test(style) && role.id === 'CA_REFERENCIA') bonus += 18;
  return bonus;
}

function chooseRole(result: AnalysisResult): RoleBlueprint {
  const position = result.bestPosition.code;
  const scores = dimensions(result);
  const candidates = ROLE_BLUEPRINTS.filter((role) => role.positions.includes(position));
  return candidates.sort((left, right) => {
    const leftScore = roleIdentityScore(left, scores) + styleRoleBonus(result, left);
    const rightScore = roleIdentityScore(right, scores) + styleRoleBonus(result, right);
    return rightScore - leftScore || left.id.localeCompare(right.id);
  })[0] ?? ROLE_BLUEPRINTS.find((role) => role.id === 'MLG_CONTROLADOR')!;
}

function projectAttributes(result: AnalysisResult, plan: TrainingPlan): Partial<Record<AttributeKey, number>> {
  const projected = { ...result.parsed.attributes };
  for (const key of TRAINING_KEYS) {
    const level = Number(plan[key] ?? 0);
    for (const [attribute, gain] of Object.entries(TRAINING_ATTRIBUTE_GAINS[key]) as Array<[AttributeKey, number]>) {
      projected[attribute] = Math.min(110, Number(projected[attribute] ?? 0) + level * gain);
    }
  }
  return projected;
}

function responseScore(result: AnalysisResult, plan: TrainingPlan, role: RoleBlueprint): number {
  const projected = projectAttributes(result, plan);
  return clamp(average(role.response.map((key) => Number(projected[key] ?? 0))));
}

function weightedPlanScore(plan: TrainingPlan, role: RoleBlueprint): number {
  const entries = Object.entries(role.weights) as Array<[TrainingKey, number]>;
  const denominator = entries.reduce((sum, [, weight]) => sum + 12 * weight, 0);
  return denominator ? clamp(entries.reduce((sum, [key, weight]) => sum + Number(plan[key] ?? 0) * weight, 0) / denominator * 100) : 0;
}

function floorScore(plan: TrainingPlan, role: RoleBlueprint): number {
  const entries = Object.entries(role.floors) as Array<[TrainingKey, number]>;
  if (!entries.length) return 100;
  const deficits = entries.reduce((sum, [key, floor]) => sum + Math.max(0, floor - Number(plan[key] ?? 0)), 0);
  return clamp(100 - deficits * 9);
}

function structuralCompensation(result: AnalysisResult, plan: TrainingPlan): number {
  const movement = result.unifiedPerformanceV3920?.positionFit.movementProfile;
  const selected = result.bestPosition.code;
  const possession = result.tacticalProfile.style === 'POSSE_DE_BOLA';
  let score = 70;
  if (possession && movement === 'VERTICAL' && ['CMF', 'DMF', 'AMF'].includes(selected)) {
    score += Number(plan.passing ?? 0) * 1.7 + Number(plan.dribbling ?? 0) * .8 + Number(plan.defending ?? 0) * 1.1 + Number(plan.lowerBodyStrength ?? 0) * .7;
    score -= Math.max(0, Number(plan.shooting ?? 0) - 8) * 1.2;
  } else {
    score += weightedPlanScore(plan, chooseRole(result)) * .22;
  }
  return clamp(score);
}

function protectedKeys(core: TrainingPlan): TrainingKey[] {
  return [...TRAINING_KEYS].sort((left, right) => Number(core[right] ?? 0) - Number(core[left] ?? 0) || left.localeCompare(right)).slice(0, 3);
}

function candidateAllowed(core: TrainingPlan, candidate: TrainingPlan, maxDistance: number): boolean {
  if (trainingPlanTotalCost(candidate) !== trainingPlanTotalCost(core)) return false;
  if (l1Distance(core, candidate) > maxDistance) return false;
  if (preservation(core, candidate) < 72) return false;
  if (TRAINING_KEYS.some((key) => Number(candidate[key] ?? 0) < 0 || Number(candidate[key] ?? 0) > 16)) return false;
  const protectedCore = protectedKeys(core);
  if (protectedCore.some((key) => Number(candidate[key] ?? 0) < Number(core[key] ?? 0) - 1)) return false;
  if (TRAINING_KEYS.some((key) => Number(candidate[key] ?? 0) < Number(core[key] ?? 0) - 3)) return false;
  return true;
}

function generateNeighbors(plan: TrainingPlan): TrainingPlan[] {
  const output: TrainingPlan[] = [];
  for (const donor of TRAINING_KEYS) {
    const donorLevel = Number(plan[donor] ?? 0);
    for (let remove = 1; remove <= Math.min(2, donorLevel); remove += 1) {
      const refund = Array.from({ length: remove }, (_, index) => trainingLevelCost(donorLevel - index)).reduce((sum, value) => sum + value, 0);
      for (const receiver of TRAINING_KEYS) {
        if (receiver === donor) continue;
        const receiverLevel = Number(plan[receiver] ?? 0);
        for (let add = 1; add <= Math.min(3, 16 - receiverLevel); add += 1) {
          const cost = Array.from({ length: add }, (_, index) => trainingLevelCost(receiverLevel + index + 1)).reduce((sum, value) => sum + value, 0);
          if (cost !== refund) continue;
          const next = clone(plan);
          next[donor] -= remove;
          next[receiver] += add;
          output.push(next);
        }
      }
    }
  }
  return output;
}

function scoreCandidate(result: AnalysisResult, core: TrainingPlan, plan: TrainingPlan, role: RoleBlueprint): { total: number; role: number; response: number; stability: number; floors: number; identity: number } {
  const roleScore = weightedPlanScore(plan, role);
  const response = responseScore(result, plan, role);
  const identity = preservation(core, plan);
  const floors = floorScore(plan, role);
  const stability = structuralCompensation(result, plan);
  const total = clamp(roleScore * .3 + response * .24 + identity * .23 + floors * .13 + stability * .1);
  return { total, role: roleScore, response, stability, floors, identity };
}

function searchBestPlan(result: AnalysisResult, core: TrainingPlan, seed: TrainingPlan, role: RoleBlueprint): { plan: TrainingPlan; candidates: number; before: ReturnType<typeof scoreCandidate>; after: ReturnType<typeof scoreCandidate> } {
  const mode = result.adaptivePositionV3930?.adaptationMode ?? 'COMPATIVEL';
  const maxDistance = mode === 'NATURAL' ? 8 : mode === 'COMPATIVEL' ? 12 : 14;
  const seen = new Set<string>();
  const queue: Array<{ plan: TrainingPlan; depth: number }> = [{ plan: clone(seed), depth: 0 }];
  const candidates: TrainingPlan[] = [];
  while (queue.length && candidates.length < 32) {
    const current = queue.shift()!;
    const key = planSignature(current.plan);
    if (seen.has(key)) continue;
    seen.add(key);
    if (candidateAllowed(core, current.plan, maxDistance)) candidates.push(current.plan);
    if (current.depth >= 3) continue;
    for (const next of generateNeighbors(current.plan)) {
      if (!candidateAllowed(core, next, maxDistance)) continue;
      const nextKey = planSignature(next);
      if (!seen.has(nextKey)) queue.push({ plan: next, depth: current.depth + 1 });
    }
  }
  if (!candidates.some((candidate) => planSignature(candidate) === planSignature(seed))) candidates.push(clone(seed));
  const before = scoreCandidate(result, core, seed, role);
  const ranked = candidates.map((plan) => ({ plan, score: scoreCandidate(result, core, plan, role) }))
    .sort((left, right) => right.score.total - left.score.total || right.score.response - left.score.response || planSignature(left.plan).localeCompare(planSignature(right.plan)));
  const winner = ranked.find((item) => item.score.response >= before.response - .05) ?? ranked[0] ?? { plan: seed, score: before };
  const meaningful = winner.score.total >= before.total + .2 || winner.score.response >= before.response + .4 || winner.score.floors >= before.floors + 4;
  return { plan: clone(meaningful ? winner.plan : seed), candidates: candidates.length, before, after: meaningful ? winner.score : before };
}

function mergeSkills(core: UnifiedSkillDecision[], roleSkills: UnifiedSkillDecision[]): UnifiedSkillDecision[] {
  const selected: UnifiedSkillDecision[] = [];
  const seen = new Set<string>();
  const add = (item: UnifiedSkillDecision | undefined, fixed: boolean) => {
    if (!item) return;
    const key = skillIdentityKey(item.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.push({
      ...item,
      priority: selected.length === 0 ? 'essencial' : selected.length < 3 ? 'alta' : 'complementar',
      reasons: [fixed ? 'Habilidade fixa do DNA desta versão da carta.' : 'Habilidade escolhida para executar a função real na posição selecionada.', ...item.reasons].slice(0, 4)
    });
  };
  core.slice(0, 3).forEach((item) => add(item, true));
  roleSkills.forEach((item) => { if (selected.length < 5) add(item, false); });
  core.forEach((item) => { if (selected.length < 5) add(item, true); });
  return selected.slice(0, 5);
}

export function buildPerformanceFunctionV3940(result: AnalysisResult): PerformanceFunctionV3940Analysis {
  const adaptive = result.adaptivePositionV3930;
  const core = clone(adaptive?.coreTraining ?? result.unifiedPerformanceV3920?.canonicalTraining ?? result.training);
  const seed = clone(adaptive?.adaptedTraining ?? result.training);
  const role = chooseRole(result);
  const search = searchBestPlan(result, core, seed, role);
  const roleSkills = buildPersonalizedSkillPlan(result, search.plan, {
    label: role.label,
    positionOverride: result.bestPosition.code,
    preferredCategories: role.skills
  });
  const fixedSkills = adaptive?.coreSkills ?? result.unifiedPerformanceV3920?.canonicalSkills ?? [];
  const finalSkills = mergeSkills(fixedSkills, roleSkills);
  const impetos = adaptive?.impetos ?? result.recommendedImpetos;
  const primaryImpeto = adaptive?.primaryImpeto ?? result.unifiedPerformanceV3920?.primaryImpeto ?? impetos[0]?.name ?? null;
  const changes = TRAINING_KEYS.filter((key) => Number(seed[key] ?? 0) !== Number(search.plan[key] ?? 0))
    .map((key) => ({ key, label: TRAINING_LABELS[key], from: Number(seed[key] ?? 0), to: Number(search.plan[key] ?? 0) }));
  const playstyle = canonicalizePlayerPlaystyle(result.parsed.playstyle) ?? result.parsed.playstyle ?? 'Sem estilo confirmado';
  const movement = result.unifiedPerformanceV3920?.positionFit.movementProfile ?? 'MISTO';
  const tacticalWarnings = [...(adaptive?.warnings ?? [])];
  if (movement === 'VERTICAL' && result.tacticalProfile.style === 'POSSE_DE_BOLA' && ['CMF', 'DMF'].includes(result.bestPosition.code)) {
    tacticalWarnings.unshift('A ficha melhora a execução como meio-campista, mas o estilo ativo continuará fazendo o jogador avançar. Use cobertura posicional ao lado ou atrás.');
  }
  const fitBefore = clamp(search.before.total * .65 + Number(adaptive?.positionFit ?? 70) * .35);
  const fitAfter = clamp(search.after.total * .65 + Number(adaptive?.positionFit ?? 70) * .35);
  const roleSignature = `role-v3940-${stableHash([
    adaptive?.coreSignature ?? result.parsed.internalId,
    result.bestPosition.code,
    role.id,
    planSignature(search.plan),
    finalSkills.map((item) => skillIdentityKey(item.name)).join(','),
    normalize(primaryImpeto)
  ].join('::'))}`;
  const useLevel: PerformanceFunctionV3940Analysis['useLevel'] = fitAfter >= 84 ? 'PRINCIPAL' : fitAfter >= 70 ? 'ALTERNATIVA' : 'EXPERIMENTAL';
  const reasons = [
    `Função definida pela carta: ${role.label}.`,
    `Foram avaliadas ${search.candidates} distribuições determinísticas com o mesmo orçamento.`,
    `Resposta funcional ${Math.round(search.before.response)} → ${Math.round(search.after.response)} e preservação do DNA em ${Math.round(search.after.identity)}%.`,
    `As três primeiras habilidades continuam presas à identidade; as demais completam a função ${POSITION_PT[result.bestPosition.code]}.`,
    `O Ímpeto ${primaryImpeto ?? 'a confirmar'} permanece fixo e não é trocado para esconder incompatibilidade tática.`
  ];
  const recommendedUse = useLevel === 'PRINCIPAL'
    ? `Pronto para ser usado como ${POSITION_PT[result.bestPosition.code]} na função ${role.label}.`
    : useLevel === 'ALTERNATIVA'
      ? `A ficha está pronta para ${POSITION_PT[result.bestPosition.code]}, mas a função ${role.label} deve ser testada com a estrutura atual do time.`
      : `A ficha executa a função ${role.label}, porém o comportamento do estilo ${playstyle} pode exigir ajuste na escalação ao redor.`;
  return {
    engineVersion: PERFORMANCE_FUNCTION_V3940_VERSION,
    philosophy: 'DNA_DA_CARTA_FUNCAO_REAL_POSICAO_ALVO_SEM_RECEITA_GENERICA',
    deterministic: true,
    canonicalCardId: adaptive?.canonicalCardId ?? result.parsed.internalId,
    selectedPosition: result.bestPosition.code,
    selectedPositionLabel: POSITION_PT[result.bestPosition.code],
    roleId: role.id,
    roleLabel: role.label,
    roleDescription: role.description,
    roleSignature,
    playstyle,
    movementProfile: movement,
    baseTraining: seed,
    finalTraining: search.plan,
    exactBudget: trainingPlanTotalCost(search.plan) === trainingPlanTotalCost(core),
    candidateCount: search.candidates,
    corePreservation: search.after.identity,
    roleScoreBefore: search.before.role,
    roleScoreAfter: search.after.role,
    responseScoreBefore: search.before.response,
    responseScoreAfter: search.after.response,
    stabilityScore: search.after.stability,
    fitBefore,
    fitAfter,
    changes,
    fixedSkills: fixedSkills.slice(0, 3),
    roleSkills,
    finalSkills,
    primaryImpeto,
    impetoLockedByCard: true,
    impetos,
    useLevel,
    canApply: result.adaptivePositionV3930?.status !== 'REVISAR_LEITURA',
    recommendedUse,
    tacticalWarnings: [...new Set(tacticalWarnings)].slice(0, 5),
    reasons,
    summary: `${result.parsed.playerName}: ${role.label} em ${POSITION_PT[result.bestPosition.code]}, com DNA preservado, ficha ajustada e Ímpeto fixo.`
  };
}

export function applyPerformanceFunctionV3940(result: AnalysisResult): AnalysisResult {
  const analysis = buildPerformanceFunctionV3940(result);
  const training = analysis.finalTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const skills = analysis.finalSkills.map((item) => item.name);
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.20 — Motor Adaptativo por Carta v39.30 + Função Real v39.40 — ${result.parsed.playerName}`,
    positionLabel: `${analysis.selectedPositionLabel} • ${analysis.roleLabel}`,
    training,
    pointsUsed,
    note: analysis.summary,
    qualityScore: analysis.fitAfter,
    adaptationLabel: 'DNA PRESERVADO • FUNÇÃO REAL • ÍMPETO FIXO • SEM RECEITA GENÉRICA',
    highlights: [
      analysis.roleLabel,
      `Resposta funcional: ${Math.round(analysis.responseScoreAfter)}/100.`,
      `DNA preservado: ${Math.round(analysis.corePreservation)}%.`,
      `Ímpeto fixo: ${analysis.primaryImpeto ?? 'revisar leitura'}.`
    ],
    risks: analysis.tacticalWarnings,
    efficiencyScore: analysis.roleScoreAfter,
    balanceScore: analysis.stabilityScore,
    verdict: analysis.recommendedUse,
    tradeOffs: analysis.tacticalWarnings,
    simulationsTested: analysis.candidateCount
  };
  return {
    ...result,
    training,
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    recommendedSkills: skills.length ? skills : result.recommendedSkills,
    recommendedImpetos: analysis.impetos,
    buildVariants: [variant],
    buildName: variant.title,
    recommendationExplanation: [analysis.summary, analysis.recommendedUse, ...analysis.reasons, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 20),
    strengths: [
      'A posição escolhida recebe uma função real baseada no DNA da carta, não um molde genérico.',
      'A ficha mantém orçamento exato, Ímpeto fixo e resultado determinístico.',
      'O motor separa limitação tática do estilo de jogo de limitação da progressão.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 15),
    weaknesses: [...analysis.tacticalWarnings, ...result.weaknesses]
      .filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    note: `${analysis.summary} O motor melhora a execução na posição sem prometer alterar a movimentação programada do estilo de jogo.`,
    performanceFunctionV3940: analysis
  };
}
