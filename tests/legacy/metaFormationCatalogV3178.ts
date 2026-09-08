import type { AnalysisResult, TacticalStyle } from '@/lib/analyzer';
import {
  FORMATION_BLUEPRINTS,
  FORMATION_ROLE_CATALOG,
  buildFormationLineup,
  type FormationBlueprint,
  type FormationRoleId,
  type FormationSlotFit
} from '@/lib/formationRoleEngine';

export const MARQUES_FORMATION_STUDIO_VERSION = '31.78.0';

export const OFFICIAL_MARQUES_PLAYSTYLES = {
  ataque: ['Artilheiro', 'Puxa marcação', 'Homem de área', 'Pivô', 'Atacante pivô', 'Armador criativo'],
  meio: ['Primeiro volante', 'O destruidor', 'Orquestrador', 'Clássico nº 10', 'Jogador de infiltração', 'Meia versátil'],
  defesa: ['Defensor criativo', 'Atacante surpresa', 'Lateral ofensivo', 'Lateral defensivo', 'Lateral atacante', 'Ala produtivo', 'Lateral móvel', 'Perito em cruzamento'],
  goleiros: ['Goleiro ofensivo', 'Goleiro defensivo']
} as const;

export type MarquesCoachStyle = Extract<TacticalStyle, 'POSSE_DE_BOLA' | 'CONTRA_ATAQUE' | 'CONTRA_ATAQUE_RAPIDO'>;
export type FormationGoalId = 'equilibrio' | 'jogo-central' | 'sem-pontas' | 'dois-atacantes' | 'posse-segura' | 'transicao-rapida' | 'proteger-resultado';

export const FORMATION_STYLE_OPTIONS: Array<{ id: MarquesCoachStyle; label: string; description: string }> = [
  { id: 'POSSE_DE_BOLA', label: 'Posse de bola', description: 'Apoios curtos, controle dos espaços e circulação segura.' },
  { id: 'CONTRA_ATAQUE', label: 'Contra-ataque normal', description: 'Bloco equilibrado, recuperação e aceleração com segurança.' },
  { id: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido', description: 'Ruptura vertical, poucos toques e ataque ao espaço.' }
];

export const FORMATION_GOAL_OPTIONS: Array<{ id: FormationGoalId; label: string; description: string }> = [
  { id: 'equilibrio', label: 'Equilíbrio total', description: 'Ataque e defesa sem expor o corredor central.' },
  { id: 'jogo-central', label: 'Jogar pelo centro', description: 'Aproximar meias, MAT, SA e atacantes.' },
  { id: 'sem-pontas', label: 'Sem pontas', description: 'Construção e profundidade por dentro, sem depender de cruzamentos.' },
  { id: 'dois-atacantes', label: 'Dois atacantes', description: 'Dupla complementar para apoio, ruptura e finalização.' },
  { id: 'posse-segura', label: 'Posse segura', description: 'Mais linhas de passe e menor risco após perder a bola.' },
  { id: 'transicao-rapida', label: 'Transição rápida', description: 'Recuperar e atacar antes de a defesa se reorganizar.' },
  { id: 'proteger-resultado', label: 'Proteger o resultado', description: 'Cobertura, compactação e controle da vantagem.' }
];

export type FormationMetrics = {
  attack: number;
  creation: number;
  defense: number;
  transition: number;
  control: number;
  difficulty: number;
};

export type MetaFormationRecommendation = {
  formation: FormationBlueprint;
  score: number;
  metrics: FormationMetrics;
  tags: string[];
  headline: string;
  reason: string;
};

export type FormationValidation = {
  score: number;
  status: 'excelente' | 'equilibrada' | 'atenção';
  strengths: string[];
  warnings: string[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countPositions(formation: FormationBlueprint, positions: string[]): number {
  return formation.slots.filter((slot) => positions.includes(slot.position)).length;
}

function metricsFor(formation: FormationBlueprint, style: MarquesCoachStyle): FormationMetrics {
  const attackers = countPositions(formation, ['CF', 'SS', 'LWF', 'RWF']);
  const creators = countPositions(formation, ['AMF', 'CMF', 'SS']);
  const holding = countPositions(formation, ['DMF']);
  const defenders = countPositions(formation, ['CB', 'LB', 'RB']);
  const width = countPositions(formation, ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB']);
  const styleIdeal = formation.idealStyles.includes(style);
  return {
    attack: clamp(56 + attackers * 9 + creators * 3 + (style === 'CONTRA_ATAQUE_RAPIDO' ? 8 : 0)),
    creation: clamp(50 + creators * 9 + holding * 3 + (style === 'POSSE_DE_BOLA' ? 9 : 0)),
    defense: clamp(47 + defenders * 7 + holding * 9 - Math.max(0, attackers - 2) * 4),
    transition: clamp(50 + attackers * 7 + holding * 4 + (style === 'CONTRA_ATAQUE_RAPIDO' ? 14 : style === 'CONTRA_ATAQUE' ? 8 : 0)),
    control: clamp(48 + creators * 7 + holding * 7 + (style === 'POSSE_DE_BOLA' ? 14 : 0) - Math.max(0, width - 4) * 2),
    difficulty: clamp(35 + attackers * 6 + (formation.slots.some((slot) => slot.position === 'LWF' || slot.position === 'RWF') ? 5 : 0) + (defenders === 3 ? 8 : 0) + (styleIdeal ? 0 : 8))
  };
}

function goalScore(formation: FormationBlueprint, metrics: FormationMetrics, goal: FormationGoalId): number {
  const attackers = countPositions(formation, ['CF', 'SS', 'LWF', 'RWF']);
  const centralAttackers = countPositions(formation, ['CF', 'SS', 'AMF']);
  const wingers = countPositions(formation, ['LWF', 'RWF']);
  const holding = countPositions(formation, ['DMF']);
  const defenders = countPositions(formation, ['CB', 'LB', 'RB']);
  switch (goal) {
    case 'jogo-central': return centralAttackers * 8 + metrics.creation * .25 - wingers * 8;
    case 'sem-pontas': return wingers === 0 ? 30 + centralAttackers * 6 : -20;
    case 'dois-atacantes': return attackers >= 2 && centralAttackers >= 2 ? 28 + attackers * 4 : -12;
    case 'posse-segura': return metrics.control * .32 + metrics.creation * .2 + holding * 5;
    case 'transicao-rapida': return metrics.transition * .38 + attackers * 5;
    case 'proteger-resultado': return metrics.defense * .38 + holding * 8 + defenders * 3 - attackers * 2;
    default: return (metrics.attack + metrics.creation + metrics.defense + metrics.control) * .11;
  }
}

function tagsFor(formation: FormationBlueprint, metrics: FormationMetrics): string[] {
  const tags: string[] = [];
  const wingers = countPositions(formation, ['LWF', 'RWF']);
  const strikers = countPositions(formation, ['CF', 'SS']);
  const holding = countPositions(formation, ['DMF']);
  if (wingers === 0) tags.push('Sem pontas');
  if (strikers >= 2) tags.push('Dupla de ataque');
  if (holding >= 1) tags.push('Proteção central');
  if (metrics.control >= 78) tags.push('Controle forte');
  if (metrics.transition >= 82) tags.push('Transição veloz');
  if (metrics.defense >= 80) tags.push('Bloco seguro');
  return tags.slice(0, 4);
}

export function recommendMetaFormations(style: MarquesCoachStyle, goal: FormationGoalId): MetaFormationRecommendation[] {
  return FORMATION_BLUEPRINTS.map((formation) => {
    const metrics = metricsFor(formation, style);
    const ideal = formation.idealStyles.includes(style) ? 24 : 8;
    const objective = goalScore(formation, metrics, goal);
    const score = clamp(42 + ideal + objective * .45 + (100 - metrics.difficulty) * .08);
    const tags = tagsFor(formation, metrics);
    return {
      formation,
      score,
      metrics,
      tags,
      headline: score >= 88 ? 'Encaixe premium' : score >= 78 ? 'Muito competitiva' : 'Opção adaptável',
      reason: `${formation.behavior} ${formation.description}`
    };
  }).sort((left, right) => right.score - left.score || left.formation.name.localeCompare(right.formation.name));
}

export function roleOptionsForSlot(formation: FormationBlueprint, slotId: string): FormationRoleId[] {
  const slot = formation.slots.find((item) => item.id === slotId);
  if (!slot) return [];
  return Array.from(new Set([...slot.primaryRoles, ...slot.complementaryRoles]));
}

export function defaultRoleOverrides(formation: FormationBlueprint): Record<string, FormationRoleId> {
  return Object.fromEntries(formation.slots.map((slot) => [slot.id, slot.primaryRoles[0] ?? slot.complementaryRoles[0]]).filter((entry) => Boolean(entry[1]))) as Record<string, FormationRoleId>;
}

export function applyRoleOverrides(formation: FormationBlueprint, overrides: Record<string, FormationRoleId>): FormationBlueprint {
  return {
    ...formation,
    id: `${formation.id}-marques-personalizada`,
    name: `${formation.name} • Marques`,
    family: 'personalizada',
    slots: formation.slots.map((slot) => {
      const selected = overrides[slot.id];
      return selected ? { ...slot, primaryRoles: [selected], complementaryRoles: slot.complementaryRoles.filter((role) => role !== selected) } : slot;
    })
  };
}

export function createFormationLineup(formation: FormationBlueprint, results: AnalysisResult[]): FormationSlotFit[] {
  if (results.length) return buildFormationLineup(results, formation);
  return formation.slots.map((slot) => ({
    slot,
    player: null,
    score: 0,
    roleFit: 0,
    positionFit: 0,
    reasons: [`Função recomendada: ${FORMATION_ROLE_CATALOG[slot.primaryRoles[0]]?.officialName ?? slot.position}.`],
    warnings: []
  }));
}

export function validateFormationRoles(formation: FormationBlueprint, overrides: Record<string, FormationRoleId>): FormationValidation {
  const selected = Object.values(overrides);
  const warnings: string[] = [];
  const strengths: string[] = [];
  const destroyerCbs = formation.slots.filter((slot) => slot.position === 'CB' && overrides[slot.id] === 'zagueiro-destruidor').length;
  const aggressiveFullbacks = formation.slots.filter((slot) => ['LB', 'RB'].includes(slot.position) && ['lateral-ofensivo', 'lateral-atacante'].includes(overrides[slot.id])).length;
  const hasDmf = formation.slots.some((slot) => slot.position === 'DMF');
  const hasAnchor = selected.includes('primeiro-volante');
  const creatorCount = selected.filter((role) => ['armador-criativo', 'orquestrador', 'infiltracao', 'meia-versatil'].includes(role)).length;
  const forwardRoles = formation.slots.filter((slot) => ['CF', 'SS'].includes(slot.position)).map((slot) => overrides[slot.id]).filter(Boolean);

  if (destroyerCbs > 1) warnings.push('Evite dois zagueiros O destruidor juntos: a linha pode perder cobertura.');
  if (aggressiveFullbacks > 1) warnings.push('Os dois laterais estão agressivos. Use cobertura ou deixe um deles defensivo.');
  if (hasDmf && !hasAnchor) warnings.push('Há volante na estrutura, mas nenhum Primeiro volante protegendo o centro.');
  if (creatorCount === 0) warnings.push('Falta um organizador ou Jogador de infiltração para ligar meio e ataque.');
  if (forwardRoles.length >= 2 && new Set(forwardRoles).size === 1) warnings.push('A dupla de ataque repete a mesma função; combine comportamentos complementares.');
  if (selected.includes('atacante-surpresa')) warnings.push('Atacante surpresa aumenta o risco de abandonar a linha defensiva.');
  if (selected.includes('classico-10')) warnings.push('Clássico nº 10 exige circulação ao redor para não diminuir o ritmo da transição.');

  if (hasAnchor) strengths.push('Primeiro volante protege a frente da área.');
  if (creatorCount >= 2) strengths.push('Há criação suficiente entre as linhas.');
  if (forwardRoles.length >= 2 && new Set(forwardRoles).size > 1) strengths.push('Dupla de ataque com funções complementares.');
  if (aggressiveFullbacks <= 1) strengths.push('Amplitude controlada sem expor os dois corredores.');
  if (destroyerCbs <= 1) strengths.push('Linha defensiva preserva cobertura e agressividade.');

  const score = clamp(96 - warnings.length * 11 + strengths.length * 2);
  return { score, status: score >= 88 ? 'excelente' : score >= 72 ? 'equilibrada' : 'atenção', strengths, warnings };
}
