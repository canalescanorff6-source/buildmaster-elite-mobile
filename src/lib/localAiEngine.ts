import type { AnalysisResult, ImpetoRecommendation, LocalAiAnalysis, PositionCode, TrainingKey } from './analyzer';

type ImpetoDomain = 'finalizacao' | 'passe' | 'drible' | 'mobilidade' | 'defesa' | 'fisico' | 'aereo' | 'goleiro' | 'equilibrio';

type ImpetoProfile = {
  name: string;
  domains: ImpetoDomain[];
  positions: PositionCode[];
  training: TrainingKey[];
  keywords: string[];
  attributes: string[];
};

const LOCAL_AI_VERSION = '30.40-local-ai-2';

const IMPETO_PROFILES: ImpetoProfile[] = [
  { name: 'Chute', domains: ['finalizacao', 'fisico'], positions: ['CF', 'SS', 'LWF', 'RWF', 'AMF'], training: ['shooting', 'lowerBodyStrength'], keywords: ['artilheiro', 'finalizador', 'chute', 'atacante'], attributes: ['Controle de bola', 'Finalização', 'Força do chute', 'Contato físico'] },
  { name: 'Cobrança de falta', domains: ['finalizacao', 'passe'], positions: ['AMF', 'CMF', 'SS', 'LWF', 'RWF'], training: ['shooting', 'passing'], keywords: ['batedor', 'bola parada', 'criador'], attributes: ['Finalização', 'Bola parada', 'Curva', 'Força do chute'] },
  { name: 'Disputa aérea', domains: ['aereo', 'fisico', 'finalizacao'], positions: ['CF', 'CB'], training: ['aerialStrength', 'lowerBodyStrength', 'shooting'], keywords: ['homem de área', 'pivô', 'cabeceio', 'zagueiro'], attributes: ['Finalização', 'Cabeceio', 'Salto', 'Contato físico'] },
  { name: 'Passe', domains: ['passe'], positions: ['AMF', 'CMF', 'DMF', 'LMF', 'RMF', 'LB', 'RB'], training: ['passing'], keywords: ['armador', 'orquestrador', 'criador', 'posse'], attributes: ['Passe rasteiro', 'Passe alto', 'Curva', 'Força do chute'] },
  { name: 'Condução de bola', domains: ['drible', 'mobilidade'], positions: ['LWF', 'RWF', 'SS', 'AMF', 'LMF', 'RMF'], training: ['dribbling', 'dexterity', 'lowerBodyStrength'], keywords: ['driblador', 'ponta', 'condução', 'ala'], attributes: ['Drible', 'Condução firme', 'Velocidade', 'Equilíbrio'] },
  { name: 'Técnica', domains: ['drible', 'passe'], positions: ['AMF', 'CMF', 'SS', 'LWF', 'RWF'], training: ['dribbling', 'passing'], keywords: ['técnico', 'criador', 'posse', 'clássico'], attributes: ['Controle de bola', 'Drible', 'Condução firme', 'Passe rasteiro'] },
  { name: 'Defesa', domains: ['defesa', 'mobilidade'], positions: ['CB', 'DMF', 'LB', 'RB'], training: ['defending', 'dexterity', 'aerialStrength'], keywords: ['defensor', 'destruidor', 'lateral defensivo', 'primeiro volante'], attributes: ['Talento defensivo', 'Desarme', 'Aceleração', 'Salto'] },
  { name: 'Duelo', domains: ['defesa', 'mobilidade'], positions: ['CB', 'DMF', 'LB', 'RB', 'CMF'], training: ['defending', 'lowerBodyStrength'], keywords: ['duelo', 'marcação', 'destruidor', 'pressão'], attributes: ['Talento defensivo', 'Desarme', 'Velocidade', 'Resistência'] },
  { name: 'Agilidade', domains: ['mobilidade', 'equilibrio'], positions: ['LWF', 'RWF', 'SS', 'AMF', 'LMF', 'RMF', 'LB', 'RB', 'CMF'], training: ['dexterity', 'lowerBodyStrength'], keywords: ['rápido', 'móvel', 'infiltração', 'ponta'], attributes: ['Velocidade', 'Aceleração', 'Equilíbrio', 'Resistência'] },
  { name: 'Fisicalidade', domains: ['fisico', 'aereo', 'equilibrio'], positions: ['CB', 'DMF', 'CF', 'CMF'], training: ['lowerBodyStrength', 'aerialStrength'], keywords: ['físico', 'pivô', 'destruidor', 'forte'], attributes: ['Salto', 'Contato físico', 'Equilíbrio', 'Resistência'] },
  { name: 'Goleiro', domains: ['goleiro'], positions: ['GK'], training: ['gk1', 'gk2'], keywords: ['goleiro'], attributes: ['Talento de GO', 'Firmeza do GO', 'Defesa do GO', 'Reflexos do GO'] },
  { name: 'Instinto artilheiro', domains: ['finalizacao', 'mobilidade'], positions: ['CF', 'SS', 'LWF', 'RWF'], training: ['shooting', 'dexterity'], keywords: ['artilheiro', 'matador', 'infiltração', 'atacante'], attributes: ['Talento ofensivo', 'Controle de bola', 'Finalização', 'Aceleração'] },
  { name: 'Guardião', domains: ['defesa', 'mobilidade'], positions: ['CB', 'DMF'], training: ['defending', 'lowerBodyStrength'], keywords: ['defensor', 'guardião', 'primeiro volante', 'âncora'], attributes: ['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Velocidade'] },
  { name: 'Motor do time', domains: ['mobilidade', 'defesa', 'fisico'], positions: ['CMF', 'DMF', 'LMF', 'RMF'], training: ['dexterity', 'lowerBodyStrength', 'defending'], keywords: ['box-to-box', 'versátil', 'todo campo', 'pressão'], attributes: ['Agressividade', 'Aceleração', 'Contato físico', 'Resistência'] },
  { name: 'Defesaça', domains: ['goleiro'], positions: ['GK'], training: ['gk2', 'gk3'], keywords: ['goleiro', 'reflexo'], attributes: ['Talento de GO', 'Defesa do GO', 'Reflexos do GO', 'Alcance do GO'] },
  { name: 'Cruzamento', domains: ['passe', 'mobilidade'], positions: ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF'], training: ['passing', 'lowerBodyStrength'], keywords: ['cruzamento', 'lateral', 'ala', 'ponta'], attributes: ['Passe alto', 'Curva', 'Velocidade', 'Resistência'] },
  { name: 'Fantasista', domains: ['drible', 'finalizacao', 'equilibrio'], positions: ['AMF', 'SS', 'LWF', 'RWF'], training: ['dribbling', 'shooting', 'dexterity'], keywords: ['fantasista', 'criativo', 'driblador', 'meia ofensivo'], attributes: ['Controle de bola', 'Drible', 'Finalização', 'Equilíbrio'] },
  { name: 'Volante criativo', domains: ['passe', 'defesa'], positions: ['DMF', 'CMF'], training: ['passing', 'defending'], keywords: ['orquestrador', 'volante', 'criador', 'posse'], attributes: ['Condução firme', 'Passe rasteiro', 'Talento defensivo', 'Desarme'] },
  { name: 'Reconstrução', domains: ['passe', 'defesa'], positions: ['CB', 'DMF'], training: ['passing', 'defending'], keywords: ['construtor', 'saída de bola', 'primeiro volante', 'zagueiro'], attributes: ['Passe rasteiro', 'Talento defensivo', 'Agressividade', 'Dedicação defensiva'] },
  { name: 'Precisão', domains: ['passe', 'finalizacao'], positions: ['AMF', 'CMF', 'SS', 'CF', 'LWF', 'RWF'], training: ['passing', 'shooting'], keywords: ['precisão', 'criador', 'finalizador', 'batedor'], attributes: ['Passe rasteiro', 'Passe alto', 'Finalização', 'Força do chute'] },
  { name: 'Criador ofensivo', domains: ['passe', 'finalizacao', 'drible'], positions: ['AMF', 'SS', 'CMF', 'LWF', 'RWF'], training: ['passing', 'dribbling', 'shooting'], keywords: ['criador', 'armador', 'meia ofensivo'], attributes: ['Talento ofensivo', 'Controle de bola', 'Passe rasteiro', 'Força do chute'] },
  { name: 'Proteção de Posse', domains: ['drible', 'fisico', 'equilibrio'], positions: ['CF', 'SS', 'AMF', 'CMF', 'DMF'], training: ['dribbling', 'lowerBodyStrength'], keywords: ['pivô', 'posse', 'proteção', 'clássico'], attributes: ['Controle de bola', 'Condução firme', 'Contato físico', 'Equilíbrio'] },
  { name: 'Equilibrado', domains: ['equilibrio', 'mobilidade', 'defesa', 'finalizacao'], positions: ['CMF', 'DMF', 'SS', 'AMF', 'LMF', 'RMF'], training: ['dexterity', 'lowerBodyStrength', 'defending', 'shooting'], keywords: ['versátil', 'equilibrado', 'coringa', 'box-to-box'], attributes: ['Talento ofensivo', 'Talento defensivo', 'Aceleração', 'Resistência'] },
  { name: 'Transição ofensiva', domains: ['passe', 'defesa', 'fisico'], positions: ['DMF', 'CMF', 'LMF', 'RMF', 'LB', 'RB'], training: ['passing', 'defending', 'lowerBodyStrength'], keywords: ['transição', 'contra-ataque', 'pressão', 'versátil'], attributes: ['Passe rasteiro', 'Desarme', 'Dedicação defensiva', 'Contato físico'] },
  { name: 'Bloqueio Aéreo', domains: ['aereo', 'defesa', 'fisico'], positions: ['CB', 'DMF'], training: ['aerialStrength', 'defending', 'lowerBodyStrength'], keywords: ['zagueiro', 'bloqueio', 'aéreo'], attributes: ['Cabeceio', 'Talento defensivo', 'Salto', 'Contato físico'] },
  { name: 'Rompe-barreira', domains: ['drible', 'mobilidade', 'finalizacao', 'fisico'], positions: ['LWF', 'RWF', 'CF', 'SS'], training: ['dribbling', 'lowerBodyStrength', 'shooting'], keywords: ['driblador', 'ponta', 'velocidade', 'força'], attributes: ['Drible', 'Velocidade', 'Força do chute', 'Contato físico'] },
  { name: 'Força', domains: ['fisico', 'aereo', 'mobilidade'], positions: ['CF', 'CB', 'DMF'], training: ['lowerBodyStrength', 'aerialStrength'], keywords: ['forte', 'pivô', 'zagueiro', 'duelo'], attributes: ['Velocidade', 'Força do chute', 'Salto', 'Contato físico'] },
  { name: 'Movimento sem a bola', domains: ['mobilidade', 'finalizacao'], positions: ['CF', 'SS', 'LWF', 'RWF', 'AMF'], training: ['dexterity', 'lowerBodyStrength', 'shooting'], keywords: ['infiltração', 'sem bola', 'artilheiro', 'ponta'], attributes: ['Talento ofensivo', 'Velocidade', 'Aceleração', 'Resistência'] },
  { name: 'Roubo de bola', domains: ['defesa', 'fisico', 'mobilidade'], positions: ['CB', 'DMF', 'CMF', 'LB', 'RB'], training: ['defending', 'lowerBodyStrength', 'dexterity'], keywords: ['destruidor', 'roubo', 'pressão', 'marcação'], attributes: ['Desarme', 'Agressividade', 'Aceleração', 'Contato físico'] }
];

const DOMAIN_ATTRIBUTE_KEYS: Record<ImpetoDomain, string[]> = {
  finalizacao: ['offensiveAwareness', 'finishing', 'kickingPower'],
  passe: ['lowPass', 'loftedPass', 'curl'],
  drible: ['ballControl', 'dribbling', 'tightPossession'],
  mobilidade: ['speed', 'acceleration', 'stamina'],
  defesa: ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'],
  fisico: ['physicalContact', 'balance', 'stamina'],
  aereo: ['heading', 'jump', 'physicalContact'],
  goleiro: ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach'],
  equilibrio: ['balance', 'ballControl', 'stamina']
};

const DOMAIN_SKILL_WORDS: Record<ImpetoDomain, string[]> = {
  finalizacao: ['chute', 'finalização', 'cabeçada', 'cavadinha'],
  passe: ['passe', 'cruzamento', 'calcanhar'],
  drible: ['toque duplo', 'controle com a sola', 'elástico', 'giro'],
  mobilidade: ['super substituto', 'volta para marcar'],
  defesa: ['interceptação', 'bloqueador', 'marcação', 'carrinho'],
  fisico: ['espírito guerreiro', 'superioridade aérea'],
  aereo: ['cabeçada', 'superioridade aérea', 'acrobática'],
  goleiro: ['goleiro', 'pênalti', 'reposição'],
  equilibrio: ['controle', 'toque duplo', 'calcanhar']
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizedText(result: AnalysisResult) {
  return [
    result.parsed.playstyle,
    result.teamMap?.functionLabel,
    result.positionScores.find((item) => item.code === result.bestPosition.code)?.role,
    result.buildName,
    result.tacticalProfile.style,
    result.tacticalProfile.formation,
    ...(result.recommendationExplanation ?? [])
  ].filter(Boolean).join(' ').toLowerCase();
}

function attributeAverage(result: AnalysisResult, domain: ImpetoDomain) {
  const attributes = result.parsed.attributes as Record<string, number | null | undefined>;
  const values = DOMAIN_ATTRIBUTE_KEYS[domain]
    .map((key) => Number(attributes[key]))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function positionFit(profile: ImpetoProfile, position: PositionCode) {
  if (profile.positions.includes(position)) return 28;
  const isWide = ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(position);
  const profileWide = profile.positions.some((item) => ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(item));
  const isCentralMid = ['AMF', 'CMF', 'DMF'].includes(position);
  const profileCentralMid = profile.positions.some((item) => ['AMF', 'CMF', 'DMF'].includes(item));
  if ((isWide && profileWide) || (isCentralMid && profileCentralMid)) return 12;
  return -20;
}

function trainingSynergy(result: AnalysisResult, profile: ImpetoProfile) {
  const values = profile.training.map((key) => Number(result.training[key] ?? 0));
  const max = Math.max(...values, 0);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return Math.min(16, max * 0.85 + average * 0.55);
}

function keywordSynergy(text: string, profile: ImpetoProfile) {
  const matches = profile.keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  return Math.min(12, matches * 5);
}

function skillSynergy(result: AnalysisResult, profile: ImpetoProfile) {
  const skillText = [...result.parsed.nativeSkills, ...result.parsed.specialSkills, ...result.recommendedSkills].join(' ').toLowerCase();
  let matches = 0;
  for (const domain of profile.domains) {
    if (DOMAIN_SKILL_WORDS[domain].some((word) => skillText.includes(word))) matches += 1;
  }
  return Math.min(10, matches * 3);
}

function attributeNeed(result: AnalysisResult, profile: ImpetoProfile) {
  const averages = profile.domains.map((domain) => attributeAverage(result, domain)).filter((value): value is number => value !== null);
  if (!averages.length) return 5;
  const average = averages.reduce((sum, value) => sum + value, 0) / averages.length;
  if (average < 65) return 3;
  if (average < 75) return 10;
  if (average < 85) return 12;
  if (average < 91) return 8;
  return 5;
}

function incompatibilityPenalty(profile: ImpetoProfile, position: PositionCode) {
  if (position === 'GK' && !profile.domains.includes('goleiro')) return 120;
  if (position !== 'GK' && profile.domains.includes('goleiro')) return 120;
  if (position === 'CB' && profile.domains.every((domain) => ['finalizacao', 'drible'].includes(domain))) return 38;
  if (position === 'CF' && profile.domains.every((domain) => ['defesa', 'goleiro'].includes(domain))) return 42;
  return 0;
}

function priorScore(result: AnalysisResult, name: string) {
  const index = result.recommendedImpetos.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
  if (index < 0) return 0;
  const tier = result.recommendedImpetos[index]?.tier;
  return tier === 'ideal' ? 14 : tier === 'alternativo' ? Math.max(3, 10 - index * 2) : -10;
}

function ownedPenalty(result: AnalysisResult, name: string) {
  const owned = result.parsed.impetos.some((item) => item.active !== false && item.name.toLowerCase() === name.toLowerCase());
  return owned ? 28 : 0;
}

function confidenceForImpeto(result: AnalysisResult, score: number) {
  const read = result.parsed.confidence;
  const exact = result.competitiveFusion?.exactCardCount ?? 0;
  const validation = result.validation.level === 'blocked' ? -24 : result.validation.level === 'review' ? -8 : 6;
  return clamp(read * 0.62 + Math.min(12, exact * 3) + Math.min(12, Math.max(0, score - 55) * 0.25) + validation, 20, 98);
}

function buildEvidence(result: AnalysisResult, profile: ImpetoProfile, score: number) {
  const evidence: string[] = [];
  evidence.push(`Compatibilidade com ${result.bestPosition.label} e ${result.teamMap?.functionLabel ?? result.positionScores.find((item) => item.code === result.bestPosition.code)?.role ?? result.buildName}.`);
  const strongestTraining = profile.training
    .map((key) => ({ key, value: Number(result.training[key] ?? 0) }))
    .sort((a, b) => b.value - a.value)[0];
  if (strongestTraining?.value > 0) evidence.push(`Conversa com o investimento principal da ficha (${strongestTraining.value} nível(is) no bloco relacionado).`);
  const domainWithGap = profile.domains
    .map((domain) => ({ domain, average: attributeAverage(result, domain) }))
    .filter((item): item is { domain: ImpetoDomain; average: number } => item.average !== null)
    .sort((a, b) => a.average - b.average)[0];
  if (domainWithGap) evidence.push(`Ataca uma necessidade real da carta: média ${Math.round(domainWithGap.average)} no domínio ${domainWithGap.domain}.`);
  if ((result.competitiveFusion?.exactCardCount ?? 0) > 0) evidence.push(`${result.competitiveFusion?.exactCardCount} referência(s) da carta exata reforçaram a leitura da ficha.`);
  if (score >= 80) evidence.push('Passou pelo consenso dos submotores de posição, DNA, ficha e habilidades.');
  return evidence.slice(0, 4);
}

function refineImpetos(result: AnalysisResult): ImpetoRecommendation[] {
  const text = normalizedText(result);
  const scored = IMPETO_PROFILES.map((profile) => {
    const scoreRaw = 16
      + positionFit(profile, result.bestPosition.code)
      + trainingSynergy(result, profile)
      + keywordSynergy(text, profile)
      + skillSynergy(result, profile)
      + attributeNeed(result, profile)
      + priorScore(result, profile.name)
      - incompatibilityPenalty(profile, result.bestPosition.code)
      - ownedPenalty(result, profile.name);
    const score = clamp(scoreRaw, 0, 100);
    const confidence = confidenceForImpeto(result, score);
    const warnings: string[] = [];
    if (result.parsed.confidence < 60) warnings.push('Confirme atributos e estilo para aumentar a segurança.');
    if (result.parsed.impetos.some((item) => item.active !== false && item.name.toLowerCase() === profile.name.toLowerCase())) warnings.push('Este ímpeto já foi identificado na carta; priorize outro para o slot adicional.');
    if (incompatibilityPenalty(profile, result.bestPosition.code) >= 100) warnings.push('Incompatível com jogador de linha/goleiro.');
    return {
      profile,
      score,
      confidence,
      evidence: buildEvidence(result, profile, score),
      warnings
    };
  }).sort((left, right) => right.score - left.score || right.confidence - left.confidence);

  const usable = scored.filter((item) => item.score >= 48 && !item.warnings.some((warning) => warning.includes('Incompatível')));
  const top = usable.slice(0, 4).map((item, index): ImpetoRecommendation => ({
    name: item.profile.name,
    tier: index === 0 ? 'ideal' : 'alternativo',
    attributes: item.profile.attributes,
    reason: index === 0
      ? `Escolha principal da IA local: ${item.evidence.slice(0, 2).join(' ')}`
      : `Alternativa segura: ${item.evidence[0] ?? 'combina com a função desta carta.'}`,
    score: item.score,
    confidence: item.confidence,
    official: true,
    evidence: item.evidence,
    warnings: item.warnings
  }));

  const avoid = scored
    .filter((item) => !top.some((chosen) => chosen.name === item.profile.name))
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((item): ImpetoRecommendation => ({
      name: item.profile.name,
      tier: 'evitar',
      attributes: item.profile.attributes,
      reason: item.warnings[0] ?? `Baixa sinergia com ${result.bestPosition.label}, a função real e a distribuição final da ficha.`,
      score: item.score,
      confidence: item.confidence,
      official: true,
      evidence: item.evidence,
      warnings: item.warnings
    }));

  return [...top, ...avoid];
}

function scoreModels(result: AnalysisResult, refinedImpetos: ImpetoRecommendation[]): LocalAiAnalysis['models'] {
  const reading = clamp(result.parsed.confidence);
  const dnaIdentity = result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? result.bestPosition.score;
  const dna = clamp(dnaIdentity * 0.72 + result.parsed.confidence * 0.28);
  const role = clamp(result.advancedTacticalFunction.compatibilityScore * 0.65 + result.bestPosition.score * 0.35);
  const build = clamp((result.buildVariants[0]?.qualityScore ?? result.bestPosition.score) * 0.7 + (result.advancedOptimizer?.efficiencyScore ?? 70) * 0.3);
  const skills = clamp(result.specialSkillsAnalysis.coverageScore * 0.55 + (result.recommendedSkills.length === 5 ? 38 : result.recommendedSkills.length * 6));
  const impeto = clamp((refinedImpetos[0]?.score ?? 0) * 0.62 + (refinedImpetos[0]?.confidence ?? 0) * 0.38);
  return [
    { id: 'leitura', label: 'Leitura do print', score: reading, note: reading >= 80 ? 'Dados suficientes para uma decisão forte.' : 'Alguns campos ainda precisam de confirmação.' },
    { id: 'dna', label: 'DNA da carta', score: dna, note: 'Compara versão, atributos, estilo, físico e habilidades nativas.' },
    { id: 'funcao', label: 'Função em campo', score: role, note: `Avalia a carta atuando como ${result.bestPosition.label}.` },
    { id: 'ficha', label: 'Ficha definitiva', score: build, note: 'Audita orçamento, retorno marginal e desperdício de pontos.' },
    { id: 'habilidades', label: 'Habilidades', score: skills, note: 'Filtra repetidas e prioriza apenas habilidades oficiais úteis.' },
    { id: 'impeto', label: 'Ímpeto', score: impeto, note: 'Cruza posição, função, atributos, treino e habilidades.' }
  ];
}

function buildLocalAiAnalysis(result: AnalysisResult, refinedImpetos: ImpetoRecommendation[]): LocalAiAnalysis {
  const models = scoreModels(result, refinedImpetos);
  const weighted = models.reduce((sum, item, index) => sum + item.score * (index === 0 ? 1.25 : 1), 0) / (models.length + 0.25);
  const sourceBonus = Math.min(8, (result.competitiveFusion?.exactCardCount ?? 0) * 2);
  const validationPenalty = result.validation.level === 'blocked' ? 28 : result.validation.level === 'review' ? 10 : 0;
  const confidence = clamp(weighted + sourceBonus - validationPenalty, 20, 98);
  const confidenceLabel: LocalAiAnalysis['confidenceLabel'] = confidence >= 82 ? 'alta' : confidence >= 64 ? 'media' : 'baixa';
  const decisionState: LocalAiAnalysis['decisionState'] = result.validation.level === 'blocked' ? 'bloqueado' : confidence >= 72 ? 'confiante' : 'revisar';
  const uncertainties = [...result.deepAnalysis.uncertainFields];
  if (!result.parsed.playstyle) uncertainties.push('Estilo de jogo');
  if (!result.parsed.impetos.length) uncertainties.push('Ímpeto já existente na carta');
  if (result.parsed.nativeSkills.length < 3) uncertainties.push('Habilidades nativas completas');
  const uniqueUncertainties = Array.from(new Set(uncertainties)).slice(0, 5);
  const bestImpeto = refinedImpetos.find((item) => item.tier === 'ideal');
  const evidence = [
    `Analisou ${result.parsed.evidence.attributeCount} atributo(s) reconhecido(s) no print.`,
    `Respeitou a posição escolhida: ${result.bestPosition.label}.`,
    `Usou ${result.trainingPointsUsed}/${result.trainingPointsTotal} pontos sem ultrapassar o orçamento.`,
    `${result.recommendedSkills.length} habilidade(s) adicional(is) passaram pelo filtro oficial e antirrepetição.`,
    bestImpeto ? `${bestImpeto.name} venceu o ranking local com ${bestImpeto.score ?? 0}/100.` : 'Nenhum ímpeto atingiu segurança suficiente.'
  ];
  const nextAction = decisionState === 'bloqueado'
    ? 'Revise os campos destacados antes de usar a ficha.'
    : uniqueUncertainties.length
      ? `Para aumentar a precisão, confirme: ${uniqueUncertainties.slice(0, 3).join(', ')}.`
      : 'A ficha, as habilidades e o ímpeto estão prontos para teste em partidas reais.';
  return {
    engineVersion: LOCAL_AI_VERSION,
    mode: 'IA local sem API paga',
    confidence,
    confidenceLabel,
    decisionState,
    dataQuality: clamp(result.parsed.confidence * 0.72 + Math.min(28, result.parsed.evidence.attributeCount * 1.4)),
    summary: bestImpeto
      ? `A IA local escolheu ${bestImpeto.name} como ímpeto principal e manteve uma única ficha competitiva para ${result.bestPosition.label}.`
      : 'A IA local preservou a ficha, mas pediu revisão antes de definir um ímpeto principal.',
    models,
    evidence,
    uncertainties: uniqueUncertainties,
    nextAction,
    privacyNote: 'Todo o raciocínio principal roda no aparelho com regras, pontuação adaptativa e memória local. Nenhuma API de IA paga é necessária.'
  };
}

export function applyLocalAiToResult(result: AnalysisResult): AnalysisResult {
  const recommendedImpetos = refineImpetos(result);
  const localAi = buildLocalAiAnalysis(result, recommendedImpetos);
  return {
    ...result,
    recommendedImpetos,
    localAi,
    recommendationExplanation: [localAi.summary, ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(0, 9)
  };
}

export function getLocalImpetoCatalog() {
  return IMPETO_PROFILES.map((item) => item.name);
}
