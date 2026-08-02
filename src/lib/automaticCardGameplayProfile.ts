import type {
  AnalysisResult,
  AttributeKey,
  AutomaticCardGameplayProfile,
  EffectiveControlProfile,
  TrainingKey
} from './analyzerDomain';
import { ATTRIBUTE_PT } from './analyzerDomain';

const ENGINE_VERSION = '38.37.0';

type DimensionKey = keyof AutomaticCardGameplayProfile['dimensions'];
type DimensionScores = Record<DimensionKey, number>;

type WeightedAttribute = readonly [AttributeKey, number];

const DIMENSION_ATTRIBUTES: Record<DimensionKey, readonly WeightedAttribute[]> = {
  creation: [
    ['lowPass', .34], ['loftedPass', .25], ['ballControl', .16],
    ['curl', .12], ['placeKicking', .08], ['tightPossession', .05]
  ],
  dribbling: [
    ['dribbling', .29], ['tightPossession', .27], ['ballControl', .2],
    ['balance', .13], ['acceleration', .07], ['speed', .04]
  ],
  finishing: [
    ['finishing', .37], ['offensiveAwareness', .24], ['kickingPower', .15],
    ['curl', .1], ['heading', .08], ['balance', .06]
  ],
  setPieces: [
    ['placeKicking', .44], ['curl', .34], ['kickingPower', .15], ['loftedPass', .07]
  ],
  movement: [
    ['offensiveAwareness', .24], ['acceleration', .23], ['speed', .2],
    ['balance', .13], ['stamina', .12], ['ballControl', .08]
  ],
  defensive: [
    ['defensiveAwareness', .28], ['defensiveEngagement', .25], ['tackling', .23],
    ['aggression', .14], ['stamina', .1]
  ],
  physical: [
    ['physicalContact', .31], ['stamina', .24], ['balance', .18],
    ['speed', .12], ['acceleration', .08], ['kickingPower', .07]
  ],
  aerial: [
    ['heading', .31], ['jump', .3], ['physicalContact', .24],
    ['offensiveAwareness', .08], ['defensiveAwareness', .07]
  ],
  goalkeeping: [
    ['goalkeeperAwareness', .23], ['goalkeeperReflexes', .22], ['goalkeeperReach', .2],
    ['goalkeeperParrying', .18], ['goalkeeperCatching', .17]
  ]
};

const DOMAIN_LABELS: Record<DimensionKey, string> = {
  creation: 'criação e passe',
  dribbling: 'drible e controle',
  finishing: 'finalização',
  setPieces: 'bola parada',
  movement: 'movimentação',
  defensive: 'proteção defensiva',
  physical: 'força e resistência',
  aerial: 'jogo aéreo',
  goalkeeping: 'defesa de goleiro'
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function weightedAttributeScore(result: AnalysisResult, entries: readonly WeightedAttribute[]) {
  let total = 0;
  let weight = 0;
  for (const [key, factor] of entries) {
    const value = Number(result.parsed.attributes[key]);
    if (!Number.isFinite(value) || value <= 0) continue;
    total += clamp(value, 1, 99) * factor;
    weight += factor;
  }
  return weight > 0 ? total / weight : 50;
}

function add(scores: DimensionScores, key: DimensionKey, amount: number) {
  scores[key] = clamp(scores[key] + amount, 1, 99);
}

function applyPositionContext(result: AnalysisResult, scores: DimensionScores) {
  const position = result.bestPosition.code;
  if (position === 'GK') {
    add(scores, 'goalkeeping', 12);
    add(scores, 'aerial', 4);
    return;
  }
  if (position === 'CF') { add(scores, 'finishing', 7); add(scores, 'movement', 6); add(scores, 'aerial', 2); }
  if (position === 'SS') { add(scores, 'creation', 5); add(scores, 'dribbling', 5); add(scores, 'movement', 4); add(scores, 'finishing', 3); }
  if (position === 'LWF' || position === 'RWF') { add(scores, 'dribbling', 7); add(scores, 'movement', 6); add(scores, 'finishing', 3); }
  if (position === 'AMF') { add(scores, 'creation', 8); add(scores, 'dribbling', 5); add(scores, 'setPieces', 2); }
  if (position === 'CMF') { add(scores, 'creation', 7); add(scores, 'physical', 2); add(scores, 'defensive', 2); }
  if (position === 'DMF') { add(scores, 'defensive', 8); add(scores, 'creation', 4); add(scores, 'physical', 4); }
  if (position === 'LMF' || position === 'RMF') { add(scores, 'creation', 4); add(scores, 'movement', 4); add(scores, 'physical', 2); }
  if (position === 'CB') { add(scores, 'defensive', 10); add(scores, 'aerial', 7); add(scores, 'physical', 5); }
  if (position === 'LB' || position === 'RB') { add(scores, 'defensive', 6); add(scores, 'movement', 5); add(scores, 'physical', 4); add(scores, 'creation', 2); }
}

function applyPlaystyleContext(result: AnalysisResult, scores: DimensionScores) {
  const style = normalizeText(result.parsed.playstyle);
  if (!style) return;

  if (/armador criativo/.test(style)) { add(scores, 'creation', 11); add(scores, 'dribbling', 7); add(scores, 'setPieces', 2); }
  if (/orquestrador/.test(style)) { add(scores, 'creation', 13); add(scores, 'setPieces', 4); add(scores, 'dribbling', 2); }
  if (/classico 10/.test(style)) { add(scores, 'creation', 9); add(scores, 'dribbling', 5); add(scores, 'setPieces', 4); }
  if (/infiltracao|jogador de infiltracao/.test(style)) { add(scores, 'movement', 12); add(scores, 'finishing', 7); add(scores, 'dribbling', 3); }
  if (/artilheiro/.test(style)) { add(scores, 'finishing', 13); add(scores, 'movement', 10); }
  if (/puxa marcacao/.test(style)) { add(scores, 'movement', 9); add(scores, 'creation', 5); add(scores, 'dribbling', 3); }
  if (/homem de area/.test(style)) { add(scores, 'finishing', 14); add(scores, 'aerial', 9); add(scores, 'physical', 4); }
  if (/atacante pivo|\bpivo\b/.test(style)) { add(scores, 'physical', 10); add(scores, 'aerial', 8); add(scores, 'creation', 7); add(scores, 'finishing', 3); }
  if (/meia versatil/.test(style)) { add(scores, 'creation', 5); add(scores, 'defensive', 5); add(scores, 'physical', 5); add(scores, 'movement', 5); }
  if (/primeiro volante|1 volante/.test(style)) { add(scores, 'defensive', 13); add(scores, 'creation', 6); add(scores, 'physical', 5); }
  if (/destruidor/.test(style)) { add(scores, 'defensive', 14); add(scores, 'physical', 8); add(scores, 'aerial', 3); }
  if (/defensor criativo/.test(style)) { add(scores, 'defensive', 9); add(scores, 'creation', 8); add(scores, 'aerial', 2); }
  if (/atacante surpresa/.test(style)) { add(scores, 'movement', 9); add(scores, 'finishing', 5); add(scores, 'physical', 3); }
  if (/lateral defensivo/.test(style)) { add(scores, 'defensive', 11); add(scores, 'physical', 5); }
  if (/lateral ofensivo|lateral atacante|ala produtivo|lateral movel/.test(style)) { add(scores, 'movement', 9); add(scores, 'creation', 5); add(scores, 'dribbling', 4); }
  if (/perito em cruzamento/.test(style)) { add(scores, 'creation', 10); add(scores, 'movement', 6); add(scores, 'setPieces', 2); }
  if (/goleiro ofensivo/.test(style)) { add(scores, 'goalkeeping', 9); add(scores, 'movement', 4); add(scores, 'creation', 2); }
  if (/goleiro defensivo/.test(style)) { add(scores, 'goalkeeping', 13); add(scores, 'aerial', 4); }
}

function applySkillContext(result: AnalysisResult, scores: DimensionScores) {
  const skills = [
    ...result.parsed.nativeSkills,
    ...(result.parsed.additionalSkills ?? []),
    ...result.parsed.specialSkills
  ].map(normalizeText).filter(Boolean);

  const counts: Partial<Record<DimensionKey, number>> = {};
  const hit = (key: DimensionKey) => { counts[key] = Number(counts[key] ?? 0) + 1; };

  for (const skill of skills) {
    if (/passe|lancamento|cruzamento|assistencia|visao|toque de primeira|calcanhar/.test(skill)) hit('creation');
    if (/drible|duplo toque|controle com a sola|finta|conducao|elastico|sombrero|pedalada/.test(skill)) hit('dribbling');
    if (/finalizacao|chute|curler|cabeceio ofensivo|primeiro chute|acrobatic/.test(skill)) hit('finishing');
    if (/bola parada|cobranca|falta|penalti|curva/.test(skill)) hit('setPieces');
    if (/arranque|aceleracao|velocidade|infiltracao|movimento|sombra veloz/.test(skill)) hit('movement');
    if (/interceptacao|bloqueador|marcacao|desarme|defensiva|cobertura|esticada de pernas/.test(skill)) hit('defensive');
    if (/fisico|resistencia|combatividade|protecao de bola/.test(skill)) hit('physical');
    if (/superioridade aerea|cabecada|jogo aereo|salto/.test(skill)) hit('aerial');
    if (/goleiro|defesa de penalti|alcance|reflexo/.test(skill)) hit('goalkeeping');
  }

  for (const key of Object.keys(counts) as DimensionKey[]) {
    add(scores, key, Math.min(10, Number(counts[key] ?? 0) * 1.8));
  }
}

function scoreToControlWeight(score: number, floor = .08, scale = 1.3) {
  return round(floor + clamp((score - 52) / 38, 0, 1.25) * scale);
}

function trainingWeights(result: AnalysisResult, scores: DimensionScores): Partial<Record<TrainingKey, number>> {
  if (result.bestPosition.code === 'GK') {
    const gk = scoreToControlWeight(scores.goalkeeping, .16, 1.25);
    return {
      shooting: 0,
      passing: 0,
      dribbling: 0,
      dexterity: 0,
      lowerBodyStrength: scoreToControlWeight(scores.physical, .08, .45),
      aerialStrength: scoreToControlWeight(scores.aerial, .1, .55),
      defending: 0,
      gk1: round(gk * .9),
      gk2: round(gk * 1.05),
      gk3: gk
    };
  }

  return {
    shooting: round(scoreToControlWeight(scores.finishing, .05, 1.05) + scoreToControlWeight(scores.setPieces, 0, .22)),
    passing: round(scoreToControlWeight(scores.creation, .08, 1.28) + scoreToControlWeight(scores.setPieces, 0, .16)),
    dribbling: scoreToControlWeight(scores.dribbling, .06, 1.28),
    dexterity: round(scoreToControlWeight(scores.movement, .06, .58) + scoreToControlWeight(scores.dribbling, 0, .52)),
    lowerBodyStrength: round(scoreToControlWeight(scores.physical, .05, .7) + scoreToControlWeight(scores.movement, 0, .3)),
    aerialStrength: scoreToControlWeight(scores.aerial, .03, 1.0),
    defending: scoreToControlWeight(scores.defensive, .03, 1.2),
    gk1: 0,
    gk2: 0,
    gk3: 0
  };
}

function primaryLegacyProfile(scores: DimensionScores): EffectiveControlProfile {
  const candidates: Array<[EffectiveControlProfile, number]> = [
    ['PASSING', scores.creation + scores.setPieces * .18],
    ['DRIBBLE', scores.dribbling + scores.movement * .16],
    ['DIRECT', scores.finishing + scores.movement * .32 + scores.aerial * .12]
  ];
  candidates.sort((left, right) => right[1] - left[1]);
  if (candidates.length > 1 && candidates[0][1] - candidates[1][1] < 5) return 'BALANCED';
  return candidates[0][0];
}

function topAttributeEvidence(result: AnalysisResult) {
  return (Object.entries(result.parsed.attributes) as Array<[AttributeKey, number | undefined]>)
    .filter((entry): entry is [AttributeKey, number] => Number.isFinite(entry[1]) && Number(entry[1]) > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([key, value]) => `${ATTRIBUTE_PT[key]} ${Math.round(value)}`);
}

export function inferAutomaticCardGameplayProfile(result: AnalysisResult): AutomaticCardGameplayProfile {
  const scores = Object.fromEntries(
    (Object.keys(DIMENSION_ATTRIBUTES) as DimensionKey[]).map((key) => [key, weightedAttributeScore(result, DIMENSION_ATTRIBUTES[key])])
  ) as DimensionScores;

  applyPositionContext(result, scores);
  applyPlaystyleContext(result, scores);
  applySkillContext(result, scores);

  for (const key of Object.keys(scores) as DimensionKey[]) scores[key] = round(clamp(scores[key], 1, 99));

  const domains = (Object.entries(scores) as Array<[DimensionKey, number]>)
    .filter(([key]) => result.bestPosition.code === 'GK' ? ['goalkeeping', 'aerial', 'physical', 'creation'].includes(key) : key !== 'goalkeeping')
    .sort((left, right) => right[1] - left[1]);
  const topDomains = domains.slice(0, 3).map(([key]) => DOMAIN_LABELS[key]);
  const label = topDomains.length
    ? topDomains.map((item, index) => index === 0 ? item.charAt(0).toUpperCase() + item.slice(1) : item).join(' • ')
    : 'Perfil funcional da carta';

  const attributeCount = Object.values(result.parsed.attributes).filter((value) => Number.isFinite(Number(value)) && Number(value) > 0).length;
  const skillsCount = result.parsed.nativeSkills.length + (result.parsed.additionalSkills?.length ?? 0) + result.parsed.specialSkills.length;
  const confidence = Math.round(clamp(
    52
      + Math.min(25, attributeCount / 26 * 25)
      + (result.parsed.playstyle ? 8 : 0)
      + Math.min(8, skillsCount * .8)
      + (result.parsed.manualConfirmed ? 4 : 0),
    35,
    98
  ));

  const evidence = [
    result.parsed.playstyle ? `Estilo oficial lido: ${result.parsed.playstyle}.` : 'Estilo oficial não confirmado; o motor usou atributos, posição e habilidades.',
    topAttributeEvidence(result).length ? `Atributos dominantes: ${topAttributeEvidence(result).join(', ')}.` : 'Poucos atributos legíveis; o perfil permanece conservador.',
    skillsCount ? `${skillsCount} habilidade(s) da carta participaram da leitura funcional.` : 'Nenhuma habilidade confirmada participou da leitura.',
    `A posição escolhida (${result.bestPosition.label}) define a função; o overall não é usado como objetivo.`
  ];

  return {
    engineVersion: ENGINE_VERSION,
    mode: 'AUTO',
    label,
    primaryInternalProfile: primaryLegacyProfile(scores),
    confidence,
    dimensions: scores,
    trainingWeights: trainingWeights(result, scores),
    evidence,
    safeguards: [
      'O perfil é calculado para esta versão específica da carta, não apenas pelo nome do jogador.',
      'O Estilo de Jogo oficial não é alterado.',
      'A posição escolhida pelo usuário permanece soberana.',
      'A distribuição busca desempenho funcional e não maximização de overall.',
      'Perfis antigos salvos continuam legíveis, mas novas fichas usam o modo automático.'
    ],
    signature: [
      result.parsed.internalId,
      result.bestPosition.code,
      normalizeText(result.parsed.playstyle),
      ...domains.slice(0, 5).map(([key, value]) => `${key}:${Math.round(value)}`)
    ].join('|')
  };
}
