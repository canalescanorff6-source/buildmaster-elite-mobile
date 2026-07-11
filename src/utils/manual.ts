import { ATTRIBUTE_PT, POSITION_PT, type AttributeKey, type Attributes, type Objective, type PositionCode, type TacticalProfile } from '../core/analyzer';

export type ManualInput = {
  playerName: string;
  position: PositionCode;
  playstyle: string;
  objective: Objective;
  targetPosition: PositionCode | 'AUTO';
  overall: string;
  level: string;
  points: string;
  attributes: Attributes;
  nativeSkills: string[];
  impetos: string[];
  tacticalProfile: TacticalProfile;
};

export function buildManualText(input: ManualInput) {
  const positionPt = POSITION_PT[input.position];
  const lines = [
    'CONFIRMAÇÃO MANUAL: SIM',
    `Nome do jogador: ${input.playerName || 'Jogador manual'}`,
    `Posição principal: ${input.position}`,
    `Posição principal PT: ${positionPt}`,
    `Estilo de jogo: ${input.playstyle || 'Não informado'}`,
    input.overall ? `GER ${input.overall}` : '',
    input.level ? `Nível ${input.level}` : '',
    input.points ? `Pontos totais: ${input.points}` : '',
    '',
    'ATRIBUTOS',
    ...Object.entries(input.attributes)
      .filter(([, value]) => Number.isFinite(value ?? NaN))
      .map(([key, value]) => `${ATTRIBUTE_PT[key as AttributeKey]} ${value}`),
    '',
    'HABILIDADES',
    ...input.nativeSkills,
    '',
    'ÍMPETOS',
    ...input.impetos
  ];
  return lines.filter(Boolean).join('\n');
}

export function defaultAttributesFor(position: PositionCode): Attributes {
  if (position === 'GK') {
    return {
      goalkeeperAwareness: 78,
      goalkeeperCatching: 76,
      goalkeeperParrying: 78,
      goalkeeperReflexes: 80,
      goalkeeperReach: 78,
      jump: 74,
      physicalContact: 74,
      kickingPower: 70
    };
  }
  if (['CB', 'LB', 'RB', 'DMF'].includes(position)) {
    return {
      defensiveAwareness: 78,
      defensiveEngagement: 78,
      tackling: 78,
      aggression: 77,
      lowPass: 72,
      loftedPass: 70,
      speed: 74,
      acceleration: 72,
      jump: 74,
      physicalContact: 76,
      stamina: 76
    };
  }
  if (['AMF', 'CMF', 'LMF', 'RMF'].includes(position)) {
    return {
      offensiveAwareness: 74,
      ballControl: 78,
      dribbling: 76,
      tightPossession: 78,
      lowPass: 78,
      loftedPass: 74,
      finishing: 70,
      speed: 74,
      acceleration: 75,
      balance: 76,
      stamina: 76
    };
  }
  return {
    offensiveAwareness: 78,
    ballControl: 76,
    dribbling: 76,
    tightPossession: 74,
    lowPass: 70,
    finishing: 78,
    heading: 72,
    kickingPower: 76,
    speed: 78,
    acceleration: 78,
    physicalContact: 72,
    balance: 74,
    stamina: 74
  };
}

export const OBJECTIVE_LABELS: Array<{ value: Objective; label: string }> = [
  { value: 'COMPETITIVE', label: 'Plano competitivo' },
  { value: 'FINISHER', label: 'Finalizador' },
  { value: 'CREATOR', label: 'Criador de jogo' },
  { value: 'DRIBBLER', label: 'Driblador' },
  { value: 'PRESSING', label: 'Pressão alta' },
  { value: 'POSSESSION', label: 'Posse e passe' },
  { value: 'QUICK_COUNTER', label: 'Contra-ataque rápido' },
  { value: 'DEFENSIVE', label: 'Segurança defensiva' },
  { value: 'AERIAL', label: 'Força aérea' },
  { value: 'GOALKEEPER', label: 'Goleiro elite' }
];

export const TACTICAL_STYLES = [
  { value: 'AUTO', label: 'Automático' },
  { value: 'POSSE_DE_BOLA', label: 'Posse de bola' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque normal' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido' },
  { value: 'POR_FORA', label: 'Por fora' },
  { value: 'PASSE_LONGO', label: 'Passe longo' }
] as const;

export const FORMATIONS = [
  'AUTO', '4-2-2-2', '4-3-3', '4-1-2-3', '4-2-1-3', '4-2-3-1', '4-3-1-2', '4-1-3-2', '4-4-2', '4-1-4-1', '3-2-4-1', '3-4-3', '3-5-2', '5-3-2', '5-2-3'
] as const;
