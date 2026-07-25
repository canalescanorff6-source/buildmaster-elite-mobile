import type { AttributeKey, Attributes, PositionCode } from '@/lib/analyzerDomain';

export const POSITION_ALIASES: Record<PositionCode, string[]> = {
  CF: ['CF', 'CA', 'CENTROAVANTE', 'CENTRE FORWARD', 'CENTER FORWARD', 'STRIKER'],
  SS: ['SS', 'SA', 'SEGUNDO ATACANTE', 'SECOND STRIKER', 'SUPPORT STRIKER'],
  LWF: ['LWF', 'PE', 'PTE', 'PONTA ESQUERDA', 'LEFT WING FORWARD', 'LEFT WINGER'],
  RWF: ['RWF', 'PD', 'PTD', 'PONTA DIREITA', 'RIGHT WING FORWARD', 'RIGHT WINGER'],
  LMF: ['LMF', 'ME', 'MLE', 'MEIA ESQUERDA', 'LEFT MIDFIELDER', 'LEFT MIDFIELD'],
  RMF: ['RMF', 'MD', 'MLD', 'MEIA DIREITA', 'RIGHT MIDFIELDER', 'RIGHT MIDFIELD'],
  AMF: ['AMF', 'MAT', 'MEIA ATACANTE', 'MEIA OFENSIVO', 'ATTACKING MIDFIELDER', 'ATTACKING MIDFIELD'],
  CMF: ['CMF', 'MLG', 'MC', 'MEIA DE LIGACAO', 'MEIA DE LIGAÇÃO', 'MEIA CENTRAL', 'CENTRAL MIDFIELDER', 'CENTRE MIDFIELDER', 'CENTER MIDFIELDER'],
  DMF: ['DMF', 'VOL', 'VOLANTE', 'DEFENSIVE MIDFIELDER', 'DEFENSIVE MIDFIELD'],
  CB: ['CB', 'ZAG', 'ZC', 'ZAGUEIRO', 'CENTRE BACK', 'CENTER BACK', 'CENTRAL BACK'],
  LB: ['LB', 'LE', 'LATERAL ESQUERDO', 'LEFT BACK'],
  RB: ['RB', 'LD', 'LATERAL DIREITO', 'RIGHT BACK'],
  GK: ['GK', 'GO', 'GOL', 'GOLEIRO', 'GOALKEEPER']
};

export const POSITION_ALIAS_ENTRIES = Object.entries(POSITION_ALIASES) as Array<[PositionCode, string[]]>;

export const SHORT_POSITION_ALIASES: Record<PositionCode, string[]> = {
  CF: ['CF', 'CA'],
  SS: ['SS', 'SA'],
  LWF: ['LWF', 'PE', 'PTE'],
  RWF: ['RWF', 'PD', 'PTD'],
  LMF: ['LMF', 'ME', 'MLE'],
  RMF: ['RMF', 'MD', 'MLD'],
  AMF: ['AMF', 'MAT'],
  CMF: ['CMF', 'MLG', 'MC'],
  DMF: ['DMF', 'VOL'],
  CB: ['CB', 'ZAG', 'ZC'],
  LB: ['LB', 'LE'],
  RB: ['RB', 'LD'],
  GK: ['GK', 'GO', 'GOL']
};

export const SHORT_POSITION_ALIAS_ENTRIES = Object.entries(SHORT_POSITION_ALIASES) as Array<[PositionCode, string[]]>;

export function shortPositionPattern() {
  return SHORT_POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function positionAliasPattern(aliases: string[]) {
  return aliases.map(escapeRegex).join('|');
}

export function attr(overrides: Attributes = {}): Required<Attributes> {
  const base: Required<Attributes> = {
    offensiveAwareness: 68,
    ballControl: 68,
    dribbling: 68,
    tightPossession: 68,
    lowPass: 68,
    loftedPass: 68,
    finishing: 68,
    heading: 68,
    placeKicking: 60,
    curl: 64,
    defensiveAwareness: 50,
    defensiveEngagement: 50,
    tackling: 50,
    aggression: 52,
    goalkeeperAwareness: 40,
    goalkeeperCatching: 40,
    goalkeeperParrying: 40,
    goalkeeperReflexes: 40,
    goalkeeperReach: 40,
    speed: 70,
    acceleration: 70,
    kickingPower: 70,
    jump: 68,
    physicalContact: 68,
    balance: 68,
    stamina: 70
  };
  return { ...base, ...overrides };
}

export const BASE_BY_POSITION: Record<PositionCode, Required<Attributes>> = {
  CF: attr({ offensiveAwareness: 86, finishing: 86, heading: 78, kickingPower: 84, speed: 80, acceleration: 78, physicalContact: 78, balance: 74, stamina: 78 }),
  SS: attr({ offensiveAwareness: 84, ballControl: 86, dribbling: 86, tightPossession: 84, finishing: 82, lowPass: 80, speed: 82, acceleration: 84, balance: 84, stamina: 78 }),
  LWF: attr({ offensiveAwareness: 80, ballControl: 84, dribbling: 88, tightPossession: 84, finishing: 78, lowPass: 76, loftedPass: 74, speed: 88, acceleration: 88, curl: 82, balance: 84, stamina: 80 }),
  RWF: attr({ offensiveAwareness: 80, ballControl: 84, dribbling: 88, tightPossession: 84, finishing: 78, lowPass: 76, loftedPass: 74, speed: 88, acceleration: 88, curl: 82, balance: 84, stamina: 80 }),
  LMF: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 72, tackling: 74, lowPass: 78, loftedPass: 82, dribbling: 82, ballControl: 82 }),
  RMF: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 72, tackling: 74, lowPass: 78, loftedPass: 82, dribbling: 82, ballControl: 82 }),
  AMF: attr({ offensiveAwareness: 82, ballControl: 88, dribbling: 84, tightPossession: 88, lowPass: 88, loftedPass: 84, finishing: 76, curl: 82, balance: 82, stamina: 78 }),
  CMF: attr({ ballControl: 82, dribbling: 78, lowPass: 84, loftedPass: 82, defensiveAwareness: 72, tackling: 72, defensiveEngagement: 74, aggression: 74, stamina: 86, physicalContact: 76 }),
  DMF: attr({ ballControl: 78, lowPass: 82, loftedPass: 78, defensiveAwareness: 86, tackling: 86, defensiveEngagement: 86, aggression: 84, physicalContact: 84, stamina: 86 }),
  CB: attr({ defensiveAwareness: 88, tackling: 88, defensiveEngagement: 86, aggression: 84, physicalContact: 88, heading: 84, jump: 84, speed: 72, stamina: 80 }),
  LB: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 76, tackling: 76, lowPass: 76, loftedPass: 80, dribbling: 76 }),
  RB: attr({ speed: 84, acceleration: 82, stamina: 86, defensiveAwareness: 76, tackling: 76, lowPass: 76, loftedPass: 80, dribbling: 76 }),
  GK: attr({ goalkeeperAwareness: 88, goalkeeperCatching: 84, goalkeeperParrying: 84, goalkeeperReflexes: 88, goalkeeperReach: 86, jump: 78, physicalContact: 80 })
};

export const ATTRIBUTE_LABELS: Array<[AttributeKey, RegExp[]]> = [
  ['offensiveAwareness', [/talento\s+ofensivo\s*(\d{2,3})/i, /consci[eê]ncia\s+ofensiva\s*(\d{2,3})/i, /offensive\s+awareness\s*(\d{2,3})/i]],
  ['ballControl', [/controle\s+de\s+bola\s*(\d{2,3})/i, /ball\s+control\s*(\d{2,3})/i]],
  ['dribbling', [/(?:^|\s)drible\s*(\d{2,3})/i, /dribbling\s*(\d{2,3})/i]],
  ['tightPossession', [/condu[cç][aã]o\s+firme\s*(\d{2,3})/i, /tight\s+possession\s*(\d{2,3})/i]],
  ['lowPass', [/passe\s+rasteiro\s*(\d{2,3})/i, /low\s+pass\s*(\d{2,3})/i]],
  ['loftedPass', [/passe\s+alto\s*(\d{2,3})/i, /lofted\s+pass\s*(\d{2,3})/i]],
  ['finishing', [/finaliza[cç][aã]o\s*(\d{2,3})/i, /finishing\s*(\d{2,3})/i]],
  ['heading', [/cabe[cç]ada\s*(\d{2,3})/i, /heading\s*(\d{2,3})/i]],
  ['placeKicking', [/cobran[cç]a\s+de\s+bola\s+parada\s*(\d{2,3})/i, /bola\s+parada\s*(\d{2,3})/i, /place\s+kicking\s*(\d{2,3})/i]],
  ['curl', [/curva\s*(\d{2,3})/i, /curl\s*(\d{2,3})/i]],
  ['defensiveAwareness', [/talento\s+defensivo\s*(\d{2,3})/i, /consci[eê]ncia\s+defensiva\s*(\d{2,3})/i, /defensive\s+awareness\s*(\d{2,3})/i]],
  ['defensiveEngagement', [/dedica[cç][aã]o\s+defensiva\s*(\d{2,3})/i, /engajamento\s+defensivo\s*(\d{2,3})/i, /defensive\s+engagement\s*(\d{2,3})/i]],
  ['tackling', [/desarme\s*(\d{2,3})/i, /tackling\s*(\d{2,3})/i]],
  ['aggression', [/agressividade\s*(\d{2,3})/i, /aggression\s*(\d{2,3})/i]],
  ['goalkeeperAwareness', [/talento\s+de\s+go\s*(\d{2,3})/i, /talento\s+de\s+gol\s*(\d{2,3})/i, /goalkeeper\s+awareness\s*(\d{2,3})/i]],
  ['goalkeeperCatching', [/firmeza\s+do\s+go\s*(\d{2,3})/i, /firmeza\s+do\s+gol\s*(\d{2,3})/i, /catching\s*(\d{2,3})/i]],
  ['goalkeeperParrying', [/defesa\s+do\s+go\s*(\d{2,3})/i, /defesa\s+do\s+gol\s*(\d{2,3})/i, /parrying\s*(\d{2,3})/i]],
  ['goalkeeperReflexes', [/reflexos\s+do\s+go\s*(\d{2,3})/i, /reflexos\s+do\s+gol\s*(\d{2,3})/i, /reflexes\s*(\d{2,3})/i]],
  ['goalkeeperReach', [/alcance\s+do\s+go\s*(\d{2,3})/i, /alcance\s+do\s+gol\s*(\d{2,3})/i, /reach\s*(\d{2,3})/i]],
  ['speed', [/velocidade\s*(\d{2,3})/i, /speed\s*(\d{2,3})/i]],
  ['acceleration', [/acelera[cç][aã]o\s*(\d{2,3})/i, /acceleration\s*(\d{2,3})/i]],
  ['kickingPower', [/for[cç]a\s+do\s+chute\s*(\d{2,3})/i, /kicking\s+power\s*(\d{2,3})/i]],
  ['jump', [/salto\s*(\d{2,3})/i, /jump\s*(\d{2,3})/i]],
  ['physicalContact', [/contato\s+f[ií]sico\s*(\d{2,3})/i, /physical\s+contact\s*(\d{2,3})/i]],
  ['balance', [/equil[ií]brio\s*(\d{2,3})/i, /balance\s*(\d{2,3})/i]],
  ['stamina', [/resist[eê]ncia\s*(\d{2,3})/i, /stamina\s*(\d{2,3})/i]]
];

export const SKILL_PROFILES: Record<string, { category: string; boosts: Partial<Record<string, number>>; aliases?: string[] }> = {
  'Pedalada simples': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Scissors Feint', 'Pedalada'] },
  'Toque duplo': { category: 'DRIBLE', boosts: { dribbling: 4, mobility: 2 }, aliases: ['Double Touch', 'Toque Duplo'] },
  'Elástico': { category: 'DRIBLE', boosts: { dribbling: 3, mobility: 1 }, aliases: ['Flip Flap', 'Elastico'] },
  'Giro 360°': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Marseille Turn', 'Giro 360'] },
  'Chapéu': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Sombrero', 'Chaleira'] },
  'Corte com virada': { category: 'DRIBLE', boosts: { dribbling: 3, mobility: 1 }, aliases: ['Cut Behind & Turn', 'Corte com virada'] },
  'Puxada de letra': { category: 'DRIBLE', boosts: { dribbling: 2, creation: 1 }, aliases: ['Scotch Move'] },
  'Finta de letra': { category: 'DRIBLE', boosts: { dribbling: 2, mobility: 1 }, aliases: ['Step On Skill Control'] },
  'Controle com a sola': { category: 'DRIBLE', boosts: { dribbling: 4, creation: 1 }, aliases: ['Sole Control', 'Controle com sola', 'Controle de sola'] },
  'Cabeçada': { category: 'FINALIZAÇÃO', boosts: { finishing: 2, aerial: 2 }, aliases: ['Heading'] },
  'Efeito de longe': { category: 'FINALIZAÇÃO', boosts: { finishing: 3, creation: 1 }, aliases: ['Long-Range Curler'] },
  'Controle da cavadinha': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Chip Shot Control'] },
  'Chute com o peito do pé': { category: 'FINALIZAÇÃO', boosts: { finishing: 3 }, aliases: ['Knuckle Shot'] },
  'Folha seca': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Dipping Shot'] },
  'Chute ascendente': { category: 'FINALIZAÇÃO', boosts: { finishing: 2 }, aliases: ['Rising Shot'] },
  'Precisão à distância': { category: 'FINALIZAÇÃO', boosts: { finishing: 3 }, aliases: ['Long-Range Shooting', 'Precisao a distancia', 'Precisão a distância'] },
  'Finalização acrobática': { category: 'FINALIZAÇÃO', boosts: { finishing: 3, mobility: 1 }, aliases: ['Acrobatic Finishing', 'Finaliz. acrobática', 'Finaliz acrobática', 'Finaliz. acrobatica'] },
  'Toque de calcanhar': { category: 'PASSE', boosts: { creation: 2, dribbling: 1 }, aliases: ['Heel Trick'] },
  'Chute de primeira': { category: 'FINALIZAÇÃO', boosts: { finishing: 4 }, aliases: ['First-time Shot', 'First Time Shot'] },
  'Passe de primeira': { category: 'PASSE', boosts: { creation: 4, pressure: 1 }, aliases: ['One-touch Pass', 'One Touch Pass', 'Passe primeira'] },
  'Passe em profundidade': { category: 'PASSE', boosts: { creation: 4 }, aliases: ['Through Passing', 'Passe Profundidade'] },
  'Passe na medida': { category: 'PASSE', boosts: { creation: 3 }, aliases: ['Weighted Pass'] },
  'Cruzamento preciso': { category: 'PASSE', boosts: { creation: 3 }, aliases: ['Pinpoint Crossing'] },
  'Curva para fora': { category: 'PASSE', boosts: { creation: 2, finishing: 1 }, aliases: ['Outside Curler'] },
  'De letra': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['Rabona'] },
  'Passe sem olhar': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['No Look Pass'] },
  'Passe aéreo baixo': { category: 'PASSE', boosts: { creation: 2 }, aliases: ['Low Lofted Pass'] },
  'Arremesso lateral longo': { category: 'PASSE', boosts: { creation: 1 }, aliases: ['Long Throw'] },
  'Especialista em pênalti': { category: 'FINALIZAÇÃO', boosts: { finishing: 1 }, aliases: ['Penalty Specialist'] },
  'Malícia': { category: 'MENTAL', boosts: { pressure: 2 }, aliases: ['Gamesmanship'] },
  'Marcação individual': { category: 'DEFESA', boosts: { defense: 4, pressure: 2 }, aliases: ['Man Marking', 'Marcação ind.', 'Marcacao ind.', 'Marcação indiv.', 'Marcacao indiv.'] },
  'Volta para marcar': { category: 'DEFESA', boosts: { defense: 3, pressure: 4 }, aliases: ['Track Back'] },
  'Interceptação': { category: 'DEFESA', boosts: { defense: 4, pressure: 2 }, aliases: ['Interception'] },
  'Bloqueador': { category: 'DEFESA', boosts: { defense: 4, physical: 1 }, aliases: ['Blocker', 'Bloqueio'] },
  'Superioridade aérea': { category: 'DEFESA', boosts: { aerial: 4, physical: 2 }, aliases: ['Aerial Superiority'] },
  'Carrinho': { category: 'DEFESA', boosts: { defense: 2 }, aliases: ['Sliding Tackle', 'Carrinho preciso'] },
  'Afastamento acrobático': { category: 'DEFESA', boosts: { defense: 2, aerial: 1 }, aliases: ['Acrobatic Clearance'] },
  'Liderança': { category: 'MENTAL', boosts: { stamina: 2, pressure: 2 }, aliases: ['Captaincy'] },
  'Super substituto': { category: 'MENTAL', boosts: { finishing: 2, mobility: 2 }, aliases: ['Super-sub', 'Super Sub'] },
  'Espírito guerreiro': { category: 'MENTAL', boosts: { stamina: 4, pressure: 2 }, aliases: ['Fighting Spirit', 'Espirito guerreiro'] },
  'Pegador de pênalti': { category: 'GOLEIRO', boosts: { goalkeeper: 5, pressure: 2 }, aliases: ['Penalty Saver', 'Defesa de pênalti', 'Pegador de penalti', 'Defesa de penalti'] },
  'Arremesso longo do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 2, creation: 2 }, aliases: ['GK Long Throw', 'Arremesso longo de goleiro'] },
  'Reposição alta do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 3, creation: 2 }, aliases: ['GK High Punt', 'Reposicao alta do goleiro', 'Reposição alta de goleiro'] },
  'Reposição baixa do goleiro': { category: 'GOLEIRO', boosts: { goalkeeper: 3, creation: 2 }, aliases: ['GK Low Punt', 'Reposicao baixa do goleiro', 'Reposição baixa de goleiro'] },
  'Esticada de Perna': { category: 'ÍMPETO', boosts: { defense: 2, physical: 1 }, aliases: ['Long Legs', 'Esticada da Perna', 'Esticada de perna'] },
  'Sombra veloz': { category: 'ÍMPETO', boosts: { mobility: 2, pressure: 1 }, aliases: ['Speeding Bullet', 'Sombra Veloz'] },
};

export const OFFICIAL_ADDITIONAL_SKILL_NAMES = [
  'Pedalada simples', 'Toque duplo', 'Elástico', 'Giro 360°', 'Chapéu', 'Corte com virada',
  'Puxada de letra', 'Finta de letra', 'Controle com a sola', 'Cabeçada', 'Efeito de longe',
  'Controle da cavadinha', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente',
  'Precisão à distância', 'Finalização acrobática', 'Toque de calcanhar', 'Chute de primeira',
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
  'Curva para fora', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo', 'Arremesso lateral longo',
  'Especialista em pênalti', 'Malícia', 'Marcação individual', 'Volta para marcar', 'Interceptação',
  'Bloqueador', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Liderança',
  'Super substituto', 'Espírito guerreiro', 'Pegador de pênalti', 'Arremesso longo do goleiro',
  'Reposição alta do goleiro', 'Reposição baixa do goleiro'
] as const;

export const OFFICIAL_ADDITIONAL_SKILLS = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);

export function isOfficialAdditionalSkill(skill: string) {
  return OFFICIAL_ADDITIONAL_SKILLS.has(skill);
}

export const SPECIAL_SKILL_NAMES = ['Esticada de Perna', 'Sombra veloz'];
