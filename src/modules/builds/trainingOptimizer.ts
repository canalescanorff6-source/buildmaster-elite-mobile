import {
  MAX_PLAYER_TRAINING_BUDGET,
  MIN_PLAYER_TRAINING_BUDGET,
  SAFE_PLAYER_TRAINING_BUDGET,
  inferPointsFromCardLevel,
  normalizePlayerTrainingBudget
} from '@/modules/builds/pointBudget';
import {
  TRAINING_KEYS,
  addTrainingLevel,
  applyPlanEntries,
  emptyTraining,
  normalizeTrainingPlan,
  removeTrainingLevel,
  trainingLevelCost,
  trainingPlanTotalCost,
  trainingTotalCost
} from '@/lib/trainingPlanCore';
import {
  POSITION_PT,
  normalizeObjective,
  type Attributes,
  type Objective,
  type ParsedCard,
  type PositionCode,
  type TrainingKey,
  type TrainingPlan
} from '@/lib/analyzerDomain';

export type IndividualTrainingAdjustments = (
  position: PositionCode,
  attributes: Required<Attributes>,
  parsed: ParsedCard
) => Record<TrainingKey, number>;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function inferTrainingPointsFromLevel(level?: number | null): number | null {
  return inferPointsFromCardLevel(level);
}

export const SAFE_DEFAULT_TRAINING_BUDGET = SAFE_PLAYER_TRAINING_BUDGET;

export const MIN_AUTO_TRAINING_BUDGET = MIN_PLAYER_TRAINING_BUDGET;

export const MAX_AUTO_TRAINING_BUDGET = MAX_PLAYER_TRAINING_BUDGET;

// Cartas especiais/booster do eFHUB/eFootBase normalmente ficam nessa faixa.
// Se o OCR ler 116, 140 etc. vindo de outro número da tela, o app descarta e usa fallback seguro.

export function normalizeTrainingBudget(value: number | null | undefined): number {
  return normalizePlayerTrainingBudget(value);
}

export function trainingBudgetFromCard(parsed: ParsedCard): number {
  const fromTraining = Number(parsed.autoTrainingPoints ?? NaN);
  if (Number.isFinite(fromTraining) && fromTraining >= MIN_AUTO_TRAINING_BUDGET && fromTraining <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(fromTraining);

  const inferred = inferTrainingPointsFromLevel(parsed.level);
  if (inferred && inferred >= MIN_AUTO_TRAINING_BUDGET && inferred <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(inferred);

  const total = Number(parsed.trainingPointsTotal ?? NaN);
  if (Number.isFinite(total) && total >= MIN_AUTO_TRAINING_BUDGET && total <= MAX_AUTO_TRAINING_BUDGET) return normalizeTrainingBudget(total);

  return SAFE_DEFAULT_TRAINING_BUDGET;
}

export function isGoalkeeperStyle(playstyle?: string | null) {
  return /goleiro ofensivo|goleiro defensivo|offensive goalkeeper|defensive goalkeeper/i.test(normalize(playstyle ?? ''));
}

function goalkeeperProfile(parsed: ParsedCard, a: Required<Attributes>) {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const height = Number(parsed.height ?? 0);
  const shortGk = height > 0 && height < 190;
  const offensive = /goleiro ofensivo|offensive goalkeeper/.test(style);
  const defensive = /goleiro defensivo|defensive goalkeeper/.test(style);
  const weakReach = a.goalkeeperReach < 82 || shortGk;
  const weakReflex = a.goalkeeperReflexes < 82;
  const weakCatch = a.goalkeeperCatching < 82;
  return { shortGk, offensive, defensive, weakReach, weakReflex, weakCatch };
}

function goalkeeperTrainingTemplate(objective: Objective, a: Required<Attributes>, parsed: ParsedCard): { target: TrainingPlan; priority: TrainingKey[] } {
  const profile = goalkeeperProfile(parsed, a);
  let target = applyPlanEntries({ gk1: 10, gk2: 10, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 });
  let priority: TrainingKey[] = ['gk2', 'gk3', 'gk1', 'aerialStrength', 'lowerBodyStrength'];

  if (profile.defensive) {
    target = applyPlanEntries({ gk1: 11, gk2: 10, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 });
    priority = ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'];
  }

  if (profile.offensive) {
    target = applyPlanEntries({ gk1: 9, gk2: 11, gk3: 9, aerialStrength: 2, lowerBodyStrength: 3 });
    priority = ['gk2', 'gk3', 'gk1', 'lowerBodyStrength', 'aerialStrength'];
  }

  if (profile.weakReach) {
    target.gk3 = Math.max(target.gk3, 11);
    target.aerialStrength = Math.max(target.aerialStrength, 4);
    priority = ['gk3', 'gk2', 'gk1', 'aerialStrength', 'lowerBodyStrength'];
  }

  if (profile.weakReflex) {
    target.gk2 = Math.max(target.gk2, 11);
    priority = ['gk2', ...priority.filter((key) => key !== 'gk2')];
  }

  if (profile.weakCatch) {
    target.gk1 = Math.max(target.gk1, 11);
    priority = ['gk1', ...priority.filter((key) => key !== 'gk1')];
  }

  if (objective === 'GOALKEEPER' || objective === 'COMPETITIVE') {
    target.gk1 = Math.max(target.gk1, 10);
    target.gk2 = Math.max(target.gk2, 11);
    target.gk3 = Math.max(target.gk3, 10);
  }

  if (objective === 'AERIAL') {
    target.gk3 = Math.max(target.gk3, 11);
    target.aerialStrength = Math.max(target.aerialStrength, 5);
    priority = ['gk3', 'aerialStrength', 'gk2', 'gk1', 'lowerBodyStrength'];
  }

  return { target: normalizeTrainingPlan(target), priority: Array.from(new Set(priority)) };
}

export type TrainingRoleProfile = {
  label: string;
  target?: Partial<TrainingPlan>;
  priority?: TrainingKey[];
  capAdjust?: Partial<TrainingPlan>;
  weightAdjust?: Partial<Record<TrainingKey, number>>;
};

function styleContains(playstyle: string, pattern: RegExp) {
  return pattern.test(normalize(playstyle).toLowerCase());
}

export function trainingRoleProfile(position: PositionCode, _objective: Objective, a: Required<Attributes>, parsed: ParsedCard): TrainingRoleProfile | null {
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const highAerial = a.heading >= 78 || a.jump >= 78 || a.physicalContact >= 82;
  const strongFinisher = a.finishing >= 86 || a.kickingPower >= 86;
  const strongCreator = a.lowPass >= 84 || a.loftedPass >= 84 || a.ballControl >= 84;
  const strongDefender = a.defensiveAwareness >= 82 || a.tackling >= 82 || a.defensiveEngagement >= 82;
  const fastPlayer = a.speed >= 84 || a.acceleration >= 84;

  if (position === 'GK') {
    if (styleContains(style, /goleiro ofensivo|offensive goalkeeper/)) {
      return {
        label: 'GOL ofensivo de cobertura e reposição',
        target: { gk1: 9, gk2: 11, gk3: 10, lowerBodyStrength: 3, aerialStrength: 2 },
        priority: ['gk2', 'gk3', 'gk1', 'lowerBodyStrength', 'aerialStrength'],
        capAdjust: { gk2: 1, gk3: 1, lowerBodyStrength: 1 },
        weightAdjust: { gk2: 1.6, gk3: 1.1, lowerBodyStrength: .7 }
      };
    }
    if (styleContains(style, /goleiro defensivo|defensive goalkeeper/)) {
      return {
        label: 'GOL defensivo de segurança e reflexo',
        target: { gk1: 11, gk2: 11, gk3: 10, aerialStrength: 3, lowerBodyStrength: 1 },
        priority: ['gk1', 'gk2', 'gk3', 'aerialStrength', 'lowerBodyStrength'],
        capAdjust: { gk1: 1, gk2: 1, gk3: 1 },
        weightAdjust: { gk1: 1.6, gk2: 1.4, gk3: .8 }
      };
    }
    return null;
  }

  if (position === 'CF') {
    if (styleContains(style, /artilheiro|goal poacher|atacante matador/)) {
      return {
        label: 'CA artilheiro finalizador',
        target: { shooting: strongFinisher ? 10 : 11, dexterity: fastPlayer ? 8 : 9, lowerBodyStrength: 8, aerialStrength: highAerial ? 6 : 3, dribbling: 3, passing: 0, defending: 0 },
        priority: ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'],
        capAdjust: { shooting: 2, dexterity: 1, lowerBodyStrength: 1, defending: -4 },
        weightAdjust: { shooting: 2.5, dexterity: 1.2, lowerBodyStrength: .9, aerialStrength: highAerial ? .9 : -.4, passing: -.7, defending: -4 }
      };
    }
    if (styleContains(style, /homem de area|homem de área|fox in the box/)) {
      return {
        label: 'CA homem de área',
        target: { shooting: 10, dexterity: 7, lowerBodyStrength: 8, aerialStrength: 8, dribbling: 2, passing: 0, defending: 0 },
        priority: ['shooting', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'dribbling'],
        capAdjust: { shooting: 1, aerialStrength: 3, lowerBodyStrength: 1, defending: -4 },
        weightAdjust: { shooting: 2.1, aerialStrength: 2.1, lowerBodyStrength: 1.1, dexterity: .6, defending: -4, passing: -.5 }
      };
    }
    if (styleContains(style, /pivo|pivô|atacante pivo|atacante pivô|target man|puxa marcacao|puxa marcação/)) {
      return {
        label: 'CA pivô / apoio de costas',
        target: { shooting: 8, passing: 5, dribbling: 3, dexterity: 6, lowerBodyStrength: 9, aerialStrength: highAerial ? 7 : 4, defending: 0 },
        priority: ['lowerBodyStrength', 'passing', 'shooting', 'aerialStrength', 'dexterity', 'dribbling'],
        capAdjust: { passing: 2, lowerBodyStrength: 2, aerialStrength: 2, shooting: 1, defending: -3 },
        weightAdjust: { lowerBodyStrength: 2.0, passing: 1.5, aerialStrength: 1.2, shooting: .9, defending: -3 }
      };
    }
  }

  if (position === 'SS') {
    if (styleContains(style, /puxa marcacao|puxa marcação|deep lying forward|armador criativo|creative playmaker/)) {
      return {
        label: 'SA de apoio e criação',
        target: { shooting: 6, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 5, aerialStrength: 1 },
        priority: ['dexterity', 'passing', 'dribbling', 'shooting', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 1, shooting: 1 },
        weightAdjust: { passing: 1.8, dribbling: 1.1, dexterity: .8, shooting: .6 }
      };
    }
    if (styleContains(style, /jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/)) {
      return {
        label: 'SA infiltrador',
        target: { shooting: 8, dribbling: 6, dexterity: 9, passing: 4, lowerBodyStrength: 6, aerialStrength: 1 },
        priority: ['dexterity', 'shooting', 'lowerBodyStrength', 'dribbling', 'passing'],
        capAdjust: { dexterity: 2, shooting: 1, lowerBodyStrength: 1 },
        weightAdjust: { dexterity: 1.8, shooting: 1.4, lowerBodyStrength: .8, passing: .4 }
      };
    }
  }

  if (position === 'LWF' || position === 'RWF') {
    if (styleContains(style, /ala produtivo|prolific winger|ponta prolifico|ponta prolífico/)) {
      return {
        label: `${POSITION_PT[position]} produtivo de ataque`,
        target: { dribbling: 9, dexterity: 9, lowerBodyStrength: 7, shooting: 6, passing: 3, aerialStrength: 0, defending: 0 },
        priority: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
        capAdjust: { dribbling: 2, dexterity: 2, shooting: 1, defending: -2 },
        weightAdjust: { dribbling: 1.8, dexterity: 1.5, lowerBodyStrength: .8, shooting: .7, defending: -2 }
      };
    }
    if (styleContains(style, /lateral movel|lateral móvel|roaming flank|flanco movel|flanco móvel/)) {
      return {
        label: `${POSITION_PT[position]} diagonal / lateral móvel`,
        target: { dribbling: 8, dexterity: 9, lowerBodyStrength: 8, shooting: 5, passing: 4, aerialStrength: 0 },
        priority: ['dexterity', 'lowerBodyStrength', 'dribbling', 'shooting', 'passing'],
        capAdjust: { dexterity: 2, lowerBodyStrength: 2, dribbling: 1 },
        weightAdjust: { dexterity: 1.6, lowerBodyStrength: 1.4, dribbling: 1.1, shooting: .6 }
      };
    }
  }

  if (position === 'AMF') {
    if (styleContains(style, /classico n[oº]? 10|clássico n[oº]? 10|classic/)) {
      return {
        label: 'MAT clássico 10 de criação',
        target: { passing: 10, dribbling: 8, dexterity: 5, shooting: 4, lowerBodyStrength: 2, defending: 0 },
        priority: ['passing', 'dribbling', 'shooting', 'dexterity', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 2, defending: -4, lowerBodyStrength: -1 },
        weightAdjust: { passing: 2.0, dribbling: 1.3, shooting: .7, defending: -3, lowerBodyStrength: -.5 }
      };
    }
    if (styleContains(style, /armador criativo|creative playmaker|criador de jogadas/)) {
      return {
        label: 'MAT armador criativo',
        target: { passing: 10, dribbling: 7, dexterity: 6, shooting: 4, lowerBodyStrength: 3, defending: 0 },
        priority: ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'],
        capAdjust: { passing: 2, dribbling: 1, dexterity: 1, defending: -3 },
        weightAdjust: { passing: 2.2, dribbling: 1.0, dexterity: .7, shooting: .5, defending: -3 }
      };
    }
    if (styleContains(style, /jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/)) {
      return {
        label: 'MAT de infiltração',
        target: { shooting: 6, passing: 7, dribbling: 6, dexterity: 8, lowerBodyStrength: 5, defending: 0 },
        priority: ['dexterity', 'passing', 'shooting', 'dribbling', 'lowerBodyStrength'],
        capAdjust: { dexterity: 2, shooting: 2, passing: 1 },
        weightAdjust: { dexterity: 1.5, shooting: 1.4, passing: 1.1, dribbling: .7 }
      };
    }
  }

  if (position === 'CMF') {
    if (styleContains(style, /orquestrador|orchestrator/)) {
      return {
        label: 'MLG orquestrador',
        target: { passing: 10, dribbling: 5, dexterity: 5, lowerBodyStrength: 6, defending: 6, aerialStrength: 1, shooting: 0 },
        priority: ['passing', 'dexterity', 'dribbling', 'defending', 'lowerBodyStrength', 'aerialStrength'],
        capAdjust: { passing: 3, dribbling: 1, defending: -1, shooting: -3 },
        weightAdjust: { passing: 2.3, dribbling: .9, dexterity: .7, defending: -.2, shooting: -2 }
      };
    }
    if (styleContains(style, /meia versatil|meia versátil|box-to-box|todo campo/)) {
      return {
        label: 'MLG box-to-box',
        target: { passing: 7, dribbling: 4, dexterity: 6, lowerBodyStrength: 8, defending: 8, aerialStrength: 2, shooting: strongFinisher ? 3 : 1 },
        priority: ['lowerBodyStrength', 'defending', 'passing', 'dexterity', 'dribbling', 'shooting'],
        capAdjust: { lowerBodyStrength: 2, defending: 2, passing: 1, dexterity: 1 },
        weightAdjust: { lowerBodyStrength: 1.7, defending: 1.5, passing: 1.0, dexterity: .7, shooting: strongFinisher ? .7 : -.5 }
      };
    }
  }

  if (position === 'DMF') {
    if (styleContains(style, /primeiro volante|ancora|âncora|anchor/)) {
      return {
        label: 'VOL primeiro volante protetor',
        target: { passing: 6, dribbling: 2, dexterity: 4, lowerBodyStrength: 8, aerialStrength: 5, defending: 14, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'aerialStrength', 'passing', 'dexterity', 'dribbling'],
        capAdjust: { defending: 2, aerialStrength: 2, lowerBodyStrength: 1, shooting: -4 },
        weightAdjust: { defending: 2.4, lowerBodyStrength: 1.1, aerialStrength: 1.0, passing: .5, shooting: -3 }
      };
    }
    if (styleContains(style, /destruidor|destroyer/)) {
      return {
        label: 'VOL destruidor agressivo',
        target: { passing: 7, dribbling: 3, dexterity: 5, lowerBodyStrength: 8, aerialStrength: 4, defending: 13, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'passing', 'dexterity', 'aerialStrength', 'dribbling'],
        capAdjust: { defending: 2, lowerBodyStrength: 1, passing: 1, shooting: -4 },
        weightAdjust: { defending: 2.2, lowerBodyStrength: 1.1, passing: .8, dexterity: .5, shooting: -3 }
      };
    }
    if (styleContains(style, /orquestrador|orchestrator/)) {
      return {
        label: 'VOL orquestrador de saída',
        target: { passing: 10, dribbling: 4, dexterity: 4, lowerBodyStrength: 6, aerialStrength: 2, defending: strongDefender ? 8 : 6, shooting: 0 },
        priority: ['passing', 'defending', 'lowerBodyStrength', 'dribbling', 'dexterity', 'aerialStrength'],
        capAdjust: { passing: 3, defending: -1, dribbling: 1, shooting: -4 },
        weightAdjust: { passing: 2.5, dribbling: .7, dexterity: .6, defending: strongDefender ? .6 : -.7, shooting: -3 }
      };
    }
  }

  if (position === 'CB') {
    if (styleContains(style, /defensor criativo|build up|construtor/)) {
      return {
        label: 'ZAG defensor criativo / saída limpa',
        target: { defending: 13, aerialStrength: 7, lowerBodyStrength: 6, dexterity: 3, passing: strongCreator ? 5 : 4, dribbling: 0, shooting: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'passing', 'dexterity'],
        capAdjust: { passing: 3, defending: 1, shooting: -4, dribbling: -2 },
        weightAdjust: { defending: 1.7, aerialStrength: 1.2, passing: 1.6, lowerBodyStrength: .7, shooting: -3, dribbling: -1 }
      };
    }
    if (styleContains(style, /destruidor|destroyer/)) {
      return {
        label: 'ZAG destruidor de combate',
        target: { defending: 15, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 3, passing: 1, shooting: 0, dribbling: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'],
        capAdjust: { defending: 2, aerialStrength: 1, lowerBodyStrength: 1, shooting: -5, passing: -1 },
        weightAdjust: { defending: 2.5, aerialStrength: 1.3, lowerBodyStrength: .8, passing: -.4, shooting: -4, dribbling: -2 }
      };
    }
    if (styleContains(style, /atacante surpresa|extra frontman/)) {
      return {
        label: 'ZAG atacante surpresa controlado',
        target: { defending: 13, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 4, passing: 3, shooting: 0 },
        priority: ['defending', 'aerialStrength', 'lowerBodyStrength', 'passing', 'dexterity'],
        capAdjust: { passing: 1, dexterity: 1, defending: 1, shooting: -3 },
        weightAdjust: { defending: 1.8, aerialStrength: 1.3, passing: .7, dexterity: .5, shooting: -2.5 }
      };
    }
  }

  if (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') {
    const sideLabel = POSITION_PT[position];
    if (styleContains(style, /lateral defensivo|defensive full/)) {
      return {
        label: `${sideLabel} lateral defensivo seguro`,
        target: { defending: 10, lowerBodyStrength: 8, passing: 6, dexterity: 6, dribbling: 2, aerialStrength: 3, shooting: 0 },
        priority: ['defending', 'lowerBodyStrength', 'dexterity', 'passing', 'aerialStrength', 'dribbling'],
        capAdjust: { defending: 2, lowerBodyStrength: 1, shooting: -4, dribbling: -1 },
        weightAdjust: { defending: 2.0, lowerBodyStrength: 1.1, dexterity: .8, passing: .6, shooting: -3 }
      };
    }
    if (styleContains(style, /perito em cruzamento|cross specialist/)) {
      return {
        label: `${sideLabel} perito em cruzamento`,
        target: { passing: 9, dribbling: 5, dexterity: 7, lowerBodyStrength: 7, defending: 5, aerialStrength: 1, shooting: 0 },
        priority: ['passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'defending', 'aerialStrength'],
        capAdjust: { passing: 3, lowerBodyStrength: 1, shooting: -3 },
        weightAdjust: { passing: 2.1, lowerBodyStrength: 1.0, dexterity: .9, dribbling: .7, shooting: -2 }
      };
    }
    if (styleContains(style, /lateral ofensivo|lateral atacante|offensive full|full back finisher/)) {
      return {
        label: `${sideLabel} apoio ofensivo`,
        target: { passing: 7, dribbling: 5, dexterity: 7, lowerBodyStrength: 8, defending: 7, aerialStrength: 1, shooting: 0 },
        priority: ['lowerBodyStrength', 'passing', 'dexterity', 'defending', 'dribbling', 'aerialStrength'],
        capAdjust: { lowerBodyStrength: 2, passing: 1, dexterity: 1, defending: 1, shooting: -2 },
        weightAdjust: { lowerBodyStrength: 1.6, passing: 1.2, dexterity: 1.0, defending: .7, shooting: -1.5 }
      };
    }
  }

  return null;
}

function mergeTrainingTarget(base: TrainingPlan, role?: TrainingRoleProfile | null): TrainingPlan {
  if (!role?.target) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(role.target) as Array<[TrainingKey, number | undefined]>) {
    if (typeof value === 'number') merged[key] = Math.max(0, Math.min(16, Math.round(value)));
  }
  return merged;
}

function mergeTrainingPriority(base: TrainingKey[], role?: TrainingRoleProfile | null): TrainingKey[] {
  if (!role?.priority?.length) return Array.from(new Set(base));
  return Array.from(new Set([...role.priority, ...base]));
}

function applyCapAdjustments(caps: TrainingPlan, role?: TrainingRoleProfile | null): TrainingPlan {
  if (!role?.capAdjust) return caps;
  const adjusted = { ...caps };
  for (const [key, delta] of Object.entries(role.capAdjust) as Array<[TrainingKey, number | undefined]>) {
    adjusted[key] = Math.max(0, Math.min(16, Math.round((adjusted[key] ?? 0) + Number(delta ?? 0))));
  }
  return adjusted;
}

export function trainingTemplate(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): { target: TrainingPlan; priority: TrainingKey[] } {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const role = trainingRoleProfile(position, objective, a, parsed);
  const isDestroyer = /destruidor|destroyer/.test(playstyle);
  const isFullback = position === 'LB' || position === 'RB';
  const highAerial = a.heading >= 76 || a.jump >= 76 || a.physicalContact >= 80;

  let target: TrainingPlan = emptyTraining();
  let priority: TrainingKey[] = ['dexterity', 'lowerBodyStrength', 'passing', 'dribbling', 'defending', 'shooting', 'aerialStrength'];

  if (position === 'CF') {
    target = applyPlanEntries({ shooting: 10, dexterity: 8, lowerBodyStrength: 8, aerialStrength: highAerial ? 6 : 3, dribbling: 3 });
    priority = ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'];
  } else if (position === 'SS') {
    target = applyPlanEntries({ shooting: 7, dribbling: 7, dexterity: 8, passing: 5, lowerBodyStrength: 5 });
    priority = ['dexterity', 'dribbling', 'shooting', 'passing', 'lowerBodyStrength'];
  } else if (position === 'LWF' || position === 'RWF') {
    target = applyPlanEntries({ dribbling: 9, dexterity: 9, lowerBodyStrength: 6, shooting: 5, passing: 3 });
    priority = ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'];
  } else if (position === 'LMF' || position === 'RMF') {
    target = applyPlanEntries({ passing: 7, dribbling: 5, dexterity: 6, lowerBodyStrength: 7, defending: 6, aerialStrength: 2 });
    priority = ['lowerBodyStrength', 'passing', 'dexterity', 'defending', 'dribbling', 'aerialStrength'];
  } else if (position === 'AMF') {
    target = applyPlanEntries({ passing: 9, dribbling: 7, dexterity: 6, shooting: 4, lowerBodyStrength: 3 });
    priority = ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'];
  } else if (position === 'CMF') {
    target = applyPlanEntries({ passing: 8, dribbling: 4, dexterity: 4, lowerBodyStrength: 7, defending: 8, aerialStrength: 2 });
    priority = ['passing', 'defending', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength'];
  } else if (position === 'DMF') {
    // Modelo competitivo inspirado no próprio eFHUB: em 64 pontos vira 8/4/4/8/4/13.
    target = isDestroyer
      ? applyPlanEntries({ passing: 8, dribbling: 4, dexterity: 4, lowerBodyStrength: 8, aerialStrength: 4, defending: 13 })
      : applyPlanEntries({ passing: 7, dribbling: 3, dexterity: 4, lowerBodyStrength: 7, aerialStrength: 3, defending: 12 });
    priority = ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'aerialStrength'];
  } else if (position === 'CB') {
    target = applyPlanEntries({ defending: 14, aerialStrength: 8, lowerBodyStrength: 6, dexterity: 3, passing: 2 });
    priority = ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'];
  } else if (isFullback) {
    target = isDestroyer
      ? applyPlanEntries({ defending: 10, lowerBodyStrength: 8, passing: 6, dexterity: 6, dribbling: 3, aerialStrength: 3 })
      : applyPlanEntries({ defending: 8, lowerBodyStrength: 8, passing: 7, dexterity: 6, dribbling: 4, aerialStrength: 2 });
    priority = ['lowerBodyStrength', 'defending', 'dexterity', 'passing', 'dribbling', 'aerialStrength'];
  } else if (position === 'GK') {
    const gkBase = goalkeeperTrainingTemplate(objective, a, parsed);
    return { target: mergeTrainingTarget(gkBase.target, role), priority: mergeTrainingPriority(gkBase.priority, role) };
  }

  if (objective === 'FINISHER') priority = ['shooting', 'dexterity', ...priority.filter((key) => !['shooting', 'dexterity'].includes(key))];
  if (objective === 'CREATOR' || objective === 'POSSESSION') priority = ['passing', 'dribbling', ...priority.filter((key) => !['passing', 'dribbling'].includes(key))];
  if (objective === 'DRIBBLER') priority = ['dribbling', 'dexterity', ...priority.filter((key) => !['dribbling', 'dexterity'].includes(key))];
  if (objective === 'PRESSING' || objective === 'DEFENSIVE') priority = ['defending', 'lowerBodyStrength', ...priority.filter((key) => !['defending', 'lowerBodyStrength'].includes(key))];
  if (objective === 'QUICK_COUNTER') priority = ['lowerBodyStrength', 'dexterity', ...priority.filter((key) => !['lowerBodyStrength', 'dexterity'].includes(key))];
  if (objective === 'AERIAL') priority = ['aerialStrength', 'defending', ...priority.filter((key) => !['aerialStrength', 'defending'].includes(key))];
  if (objective === 'META_2026') {
    const metaPriority: TrainingKey[] = position === 'CB' || position === 'DMF' ? ['defending', 'lowerBodyStrength', 'passing'] : position === 'CF' ? ['shooting', 'dexterity', 'lowerBodyStrength'] : position === 'LWF' || position === 'RWF' || position === 'SS' || position === 'AMF' ? ['dribbling', 'dexterity', 'shooting', 'passing'] : ['passing', 'dribbling', 'lowerBodyStrength', 'defending'];
    priority = [...metaPriority, ...priority.filter((key) => !metaPriority.includes(key))];
  }

  target = mergeTrainingTarget(target, role);
  priority = mergeTrainingPriority(priority, role);

  return { target, priority: Array.from(new Set(priority)) };
}

export function fitTrainingToBudget(target: TrainingPlan, priority: TrainingKey[], budget: number): TrainingPlan {
  budget = normalizeTrainingBudget(budget);
  const plan = { ...target };
  const cleanPriority = priority.length ? priority : TRAINING_KEYS;

  // Se passou do orçamento real do eFootball, remove primeiro das prioridades menores.
  let guard = 0;
  while (trainingPlanTotalCost(plan) > budget && guard < 500) {
    guard += 1;
    const removable = [...cleanPriority].reverse().find((key) => (plan[key] ?? 0) > 0) ?? TRAINING_KEYS.find((key) => (plan[key] ?? 0) > 0);
    if (!removable) break;
    removeTrainingLevel(plan, removable);
  }

  // Se ainda sobrar ponto, coloca onde tem mais impacto, respeitando custo progressivo.
  guard = 0;
  while (guard < 500) {
    guard += 1;
    const current = trainingPlanTotalCost(plan);
    if (current >= budget) break;
    let added = false;
    for (const key of cleanPriority) {
      const nextLevel = (plan[key] ?? 0) + 1;
      const nextCost = trainingLevelCost(nextLevel);
      if (current + nextCost <= budget && nextLevel <= 16) {
        addTrainingLevel(plan, key);
        added = true;
        break;
      }
    }
    if (!added) break;
  }

  return plan;
}

function trainingCaps(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): TrainingPlan {
  const playstyle = normalize(parsed.playstyle ?? '').toLowerCase();
  const role = trainingRoleProfile(position, objective, a, parsed);
  const isAreaStriker = position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(playstyle);
  const highAerial = a.heading >= 78 || a.physicalContact >= 82 || isAreaStriker;
  const caps = emptyTraining();

  const set = (entries: Partial<TrainingPlan>) => Object.assign(caps, entries);

  if (position === 'CF') {
    set({ shooting: 13, dexterity: 11, lowerBodyStrength: 11, aerialStrength: highAerial ? 10 : 6, dribbling: 7, passing: 5 });
  } else if (position === 'SS') {
    set({ shooting: 10, passing: 8, dribbling: 10, dexterity: 11, lowerBodyStrength: 8, aerialStrength: 3 });
  } else if (position === 'LWF' || position === 'RWF') {
    set({ shooting: 8, passing: 6, dribbling: 11, dexterity: 11, lowerBodyStrength: 10, aerialStrength: 2 });
  } else if (position === 'LMF' || position === 'RMF') {
    set({ shooting: 4, passing: 9, dribbling: 8, dexterity: 9, lowerBodyStrength: 10, aerialStrength: 4, defending: 8 });
  } else if (position === 'AMF') {
    set({ shooting: 7, passing: 11, dribbling: 10, dexterity: 9, lowerBodyStrength: 6, aerialStrength: 2, defending: 2 });
  } else if (position === 'CMF') {
    set({ shooting: 4, passing: 10, dribbling: 7, dexterity: 7, lowerBodyStrength: 10, aerialStrength: 5, defending: 10 });
  } else if (position === 'DMF') {
    set({ shooting: 2, passing: 9, dribbling: 6, dexterity: 7, lowerBodyStrength: 9, aerialStrength: 6, defending: 14 });
  } else if (position === 'CB') {
    set({ passing: 5, dribbling: 2, dexterity: 6, lowerBodyStrength: 8, aerialStrength: 10, defending: 15 });
  } else if (position === 'LB' || position === 'RB') {
    set({ shooting: 2, passing: 8, dribbling: 7, dexterity: 9, lowerBodyStrength: 10, aerialStrength: 5, defending: 11 });
  } else if (position === 'GK') {
    set({ aerialStrength: 6, lowerBodyStrength: 5, gk1: 14, gk2: 14, gk3: 14 });
  }

  if (position === 'GK') {
    if (objective === 'AERIAL') {
      caps.aerialStrength = Math.min(8, caps.aerialStrength + 2);
      caps.gk3 = Math.min(16, caps.gk3 + 1);
    }
    return applyCapAdjustments(caps, role);
  }

  if (objective === 'FINISHER') {
    caps.shooting = Math.min(16, caps.shooting + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }
  if (objective === 'CREATOR' || objective === 'POSSESSION') {
    caps.passing = Math.min(16, caps.passing + 2);
    caps.dribbling = Math.min(16, caps.dribbling + 1);
  }
  if (objective === 'DRIBBLER') {
    caps.dribbling = Math.min(16, caps.dribbling + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }
  if (objective === 'DEFENSIVE' || objective === 'PRESSING') {
    caps.defending = Math.min(16, caps.defending + 2);
    caps.lowerBodyStrength = Math.min(16, caps.lowerBodyStrength + 1);
  }
  if (objective === 'AERIAL') caps.aerialStrength = Math.min(16, caps.aerialStrength + 3);
  if (objective === 'META_2026') {
    if (position === 'CB' || position === 'DMF') { caps.defending = Math.min(16, caps.defending + 1); caps.lowerBodyStrength = Math.min(16, caps.lowerBodyStrength + 1); }
    else if (position === 'CF') { caps.shooting = Math.min(16, caps.shooting + 1); caps.dexterity = Math.min(16, caps.dexterity + 1); }
    else { caps.dribbling = Math.min(16, caps.dribbling + 1); caps.dexterity = Math.min(16, caps.dexterity + 1); }
  }
  if (objective === 'QUICK_COUNTER') {
    caps.lowerBodyStrength = Math.min(16, caps.lowerBodyStrength + 2);
    caps.dexterity = Math.min(16, caps.dexterity + 1);
  }

  return applyCapAdjustments(caps, role);
}

function trainingKeyWeight(key: TrainingKey, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): number {
  const role = trainingRoleProfile(position, objective, a, parsed);
  const baseByPosition: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
    CF: { shooting: 9.6, dexterity: 7.4, lowerBodyStrength: 7.8, aerialStrength: 5.6, dribbling: 3.4, passing: 2.4, defending: -2, gk1: -20, gk2: -20, gk3: -20 },
    SS: { shooting: 7, passing: 5.5, dribbling: 7.6, dexterity: 8.2, lowerBodyStrength: 5.6, aerialStrength: 1.6, defending: .4, gk1: -20, gk2: -20, gk3: -20 },
    LWF: { shooting: 5.8, passing: 4.2, dribbling: 8.8, dexterity: 9.2, lowerBodyStrength: 7.8, aerialStrength: .8, defending: .7, gk1: -20, gk2: -20, gk3: -20 },
    RWF: { shooting: 5.8, passing: 4.2, dribbling: 8.8, dexterity: 9.2, lowerBodyStrength: 7.8, aerialStrength: .8, defending: .7, gk1: -20, gk2: -20, gk3: -20 },
    LMF: { shooting: 1.8, passing: 7.5, dribbling: 5.4, dexterity: 6.7, lowerBodyStrength: 8.2, aerialStrength: 2, defending: 5.8, gk1: -20, gk2: -20, gk3: -20 },
    RMF: { shooting: 1.8, passing: 7.5, dribbling: 5.4, dexterity: 6.7, lowerBodyStrength: 8.2, aerialStrength: 2, defending: 5.8, gk1: -20, gk2: -20, gk3: -20 },
    AMF: { shooting: 4.7, passing: 9.3, dribbling: 8.2, dexterity: 6.4, lowerBodyStrength: 3.8, aerialStrength: .6, defending: .8, gk1: -20, gk2: -20, gk3: -20 },
    CMF: { shooting: 2.3, passing: 8.2, dribbling: 4.8, dexterity: 5.3, lowerBodyStrength: 7.8, aerialStrength: 2.4, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    DMF: { shooting: .7, passing: 7.3, dribbling: 3.5, dexterity: 4.9, lowerBodyStrength: 7.8, aerialStrength: 4.1, defending: 10.2, gk1: -20, gk2: -20, gk3: -20 },
    CB: { shooting: -2, passing: 3.2, dribbling: .8, dexterity: 4.5, lowerBodyStrength: 6.5, aerialStrength: 8.8, defending: 10.8, gk1: -20, gk2: -20, gk3: -20 },
    LB: { shooting: .8, passing: 6.5, dribbling: 4.8, dexterity: 7.2, lowerBodyStrength: 8.6, aerialStrength: 2.3, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    RB: { shooting: .8, passing: 6.5, dribbling: 4.8, dexterity: 7.2, lowerBodyStrength: 8.6, aerialStrength: 2.3, defending: 7.8, gk1: -20, gk2: -20, gk3: -20 },
    GK: { gk1: 9.6, gk2: 9.8, gk3: 9.4, aerialStrength: 4.8, lowerBodyStrength: 2.2, shooting: -20, passing: -20, dribbling: -20, dexterity: -20, defending: -20 }
  };

  const objectiveBoost: Record<Objective, Partial<Record<TrainingKey, number>>> = {
    COMPETITIVE: { dexterity: .7, lowerBodyStrength: .7, passing: .4, defending: .4 },
    FINISHER: { shooting: 2.2, dexterity: .9, aerialStrength: .8 },
    CREATOR: { passing: 2.2, dribbling: .9 },
    DRIBBLER: { dribbling: 2.1, dexterity: 1.2 },
    PRESSING: { defending: 1.5, lowerBodyStrength: 1.2, dexterity: .5 },
    POSSESSION: { passing: 1.7, dribbling: 1.1, dexterity: .5 },
    QUICK_COUNTER: { lowerBodyStrength: 2.1, dexterity: 1.3, shooting: .6 },
    DEFENSIVE: { defending: 2.2, aerialStrength: .7, lowerBodyStrength: .9 },
    AERIAL: { aerialStrength: 2.4, shooting: position === 'CF' ? .8 : 0, defending: position === 'CB' ? .8 : 0 },
    GOALKEEPER: { gk1: 1.8, gk2: 2.2, gk3: 1.8, aerialStrength: .4, lowerBodyStrength: .3 },
    META_2026: position === 'CB' || position === 'DMF' ? { defending: 2.1, lowerBodyStrength: .9, passing: .35 } : position === 'CF' ? { shooting: 1.8, dexterity: 1.2, lowerBodyStrength: .5 } : { dribbling: 1.35, dexterity: 1.25, passing: .55, shooting: .4 }
  };

  const individual = resolveIdentity(position, a, parsed);
  let weight = (baseByPosition[position][key] ?? 0) + (objectiveBoost[normalizeObjective(objective)]?.[key] ?? 0) + (role?.weightAdjust?.[key] ?? 0) + individual[key];
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  if (position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(style)) {
    if (key === 'shooting') weight += 1.5;
    if (key === 'aerialStrength') weight += 1.4;
    if (key === 'dexterity') weight += .7;
  }
  if (/destruidor|destroyer|ancora|anchor/.test(style)) {
    if (key === 'defending') weight += 1.8;
    if (key === 'lowerBodyStrength') weight += .8;
  }
  if ((a.finishing < 84 && key === 'shooting') || (a.lowPass < 76 && key === 'passing') || (a.speed < 80 && key === 'lowerBodyStrength')) weight += .6;
  return weight;
}

function trainingLevelValue(key: TrainingKey, level: number, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): number {
  const weight = trainingKeyWeight(key, position, objective, a, parsed, resolveIdentity);
  if (weight <= -10) return -999;
  const phase = level <= 4 ? 1.05 : level <= 8 ? .94 : level <= 12 ? .72 : .48;
  const cost = trainingLevelCost(level);
  return (weight * phase) / Math.max(1, cost);
}

function solveTrainingDp(position: PositionCode, objective: Objective, base: Required<Attributes>, parsed: ParsedCard, budget: number, caps: TrainingPlan, resolveIdentity: IndividualTrainingAdjustments): TrainingPlan | null {
  type State = { value: number; plan: TrainingPlan };
  let states: Array<State | null> = Array.from({ length: budget + 1 }, () => null);
  states[0] = { value: 0, plan: emptyTraining() };

  for (const key of TRAINING_KEYS) {
    const next: Array<State | null> = Array.from({ length: budget + 1 }, () => null);
    const cap = Math.max(0, Math.min(16, caps[key] ?? 0));
    const levelValues = Array.from({ length: cap + 1 }, (_, level) => {
      let value = 0;
      for (let current = 1; current <= level; current += 1) value += trainingLevelValue(key, current, position, objective, base, parsed, resolveIdentity);
      return { level, cost: trainingTotalCost(level), value };
    });

    for (let currentBudget = 0; currentBudget <= budget; currentBudget += 1) {
      const state = states[currentBudget];
      if (!state) continue;
      for (const option of levelValues) {
        const totalCost = currentBudget + option.cost;
        if (totalCost > budget) continue;
        const candidateValue = state.value + option.value;
        const previous = next[totalCost];
        if (!previous || candidateValue > previous.value) {
          next[totalCost] = { value: candidateValue, plan: { ...state.plan, [key]: option.level } as TrainingPlan };
        }
      }
    }
    states = next;
  }

  return states[budget]?.plan ?? null;
}

function loosenTrainingCaps(position: PositionCode, caps: TrainingPlan): TrainingPlan {
  const loose = { ...caps };
  if (position === 'GK') {
    loose.gk1 = Math.max(loose.gk1, 12);
    loose.gk2 = Math.max(loose.gk2, 12);
    loose.gk3 = Math.max(loose.gk3, 12);
    loose.aerialStrength = Math.max(loose.aerialStrength, 6);
    loose.lowerBodyStrength = Math.max(loose.lowerBodyStrength, 4);
    return loose;
  }

  for (const key of TRAINING_KEYS) {
    if (key === 'gk1' || key === 'gk2' || key === 'gk3') {
      loose[key] = 0;
    } else {
      loose[key] = Math.max(loose[key] ?? 0, 6);
    }
  }
  return loose;
}

function optimizeEliteTraining(position: PositionCode, objective: Objective, base: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): TrainingPlan {
  const budget = normalizeTrainingBudget(trainingBudgetFromCard(parsed));
  const caps = trainingCaps(position, objective, base, parsed);
  const exact = solveTrainingDp(position, objective, base, parsed, budget, caps, resolveIdentity);
  if (exact) return exact;

  const loose = solveTrainingDp(position, objective, base, parsed, budget, loosenTrainingCaps(position, caps), resolveIdentity);
  if (loose) return loose;

  const { target, priority } = trainingTemplate(position, objective, base, parsed);
  return fitTrainingToBudget(target, priority, budget);
}

export function trainingFor(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): TrainingPlan {
  return optimizeEliteTraining(position, objective, a, parsed, resolveIdentity);
}

export function trainingCostRuleText() {
  return 'Motor Adaptativo Elite: qualquer jogador de linha pode receber ficha para qualquer posição de linha escolhida. A posição-alvo manda; posição original, estilo e atributos servem apenas para preservar qualidades úteis, sem limitar a conversão, mantendo custo progressivo e orçamento real.';
}
