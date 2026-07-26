import type { AnalysisResult, AttributeKey, DeepCardIntelligenceAnalysis, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, normalizeTrainingPlan, trainingPlanCost, trainingPlanTotalCost } from './trainingPlanCore';

const ENGINE_VERSION = '30.30-deep-card-1';

type Candidate = { source: string; plan: TrainingPlan; baseScore: number };

type PairRule = { label: string; keys: [TrainingKey, TrainingKey]; attributes?: AttributeKey[]; explanation: string };

const POSITION_PRIORITIES: Record<PositionCode, TrainingKey[]> = {
  CF: ['shooting', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'dribbling', 'passing'],
  SS: ['dexterity', 'dribbling', 'shooting', 'passing', 'lowerBodyStrength'],
  LWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
  RWF: ['dribbling', 'dexterity', 'lowerBodyStrength', 'shooting', 'passing'],
  LMF: ['passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'defending'],
  RMF: ['passing', 'lowerBodyStrength', 'dexterity', 'dribbling', 'defending'],
  AMF: ['passing', 'dribbling', 'dexterity', 'shooting', 'lowerBodyStrength'],
  CMF: ['passing', 'lowerBodyStrength', 'dexterity', 'defending', 'dribbling'],
  DMF: ['defending', 'passing', 'lowerBodyStrength', 'dexterity', 'aerialStrength'],
  CB: ['defending', 'aerialStrength', 'lowerBodyStrength', 'dexterity', 'passing'],
  LB: ['lowerBodyStrength', 'defending', 'passing', 'dexterity', 'dribbling'],
  RB: ['lowerBodyStrength', 'defending', 'passing', 'dexterity', 'dribbling'],
  GK: ['gk1', 'gk2', 'gk3', 'aerialStrength']
};


const POSITION_SKILL_PRIORITIES: Record<PositionCode, string[]> = {
  CF: ['Toque de calcanhar', 'Passe de primeira', 'Controle com a sola', 'Passe em profundidade', 'Super substituto', 'Toque duplo', 'Malícia'],
  SS: ['Controle com a sola', 'Toque de calcanhar', 'Passe de primeira', 'Passe em profundidade', 'Toque duplo', 'Super substituto'],
  LWF: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Passe em profundidade', 'Cruzamento preciso', 'Super substituto'],
  RWF: ['Toque duplo', 'Controle com a sola', 'Passe de primeira', 'Passe em profundidade', 'Cruzamento preciso', 'Super substituto'],
  LMF: ['Passe de primeira', 'Passe em profundidade', 'Cruzamento preciso', 'Controle com a sola', 'Volta para marcar', 'Interceptação'],
  RMF: ['Passe de primeira', 'Passe em profundidade', 'Cruzamento preciso', 'Controle com a sola', 'Volta para marcar', 'Interceptação'],
  AMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Controle com a sola', 'Toque de calcanhar', 'Toque duplo'],
  CMF: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Interceptação', 'Controle com a sola', 'Volta para marcar'],
  DMF: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Passe de primeira', 'Passe em profundidade', 'Superioridade aérea'],
  CB: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Superioridade aérea', 'Afastamento acrobático', 'Passe de primeira'],
  LB: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira', 'Cruzamento preciso'],
  RB: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar', 'Passe de primeira', 'Cruzamento preciso'],
  GK: ['Pegador de pênalti', 'Arremesso longo do goleiro', 'Reposição alta do goleiro', 'Reposição baixa do goleiro', 'Liderança']
};

const SKILL_REASON: Record<string, string> = {
  'Toque de calcanhar': 'Libera a bola em ângulos difíceis sem exigir que o jogador gire completamente.',
  'Passe de primeira': 'Acelera tabelas e apoios sob pressão, reduzindo toques desnecessários.',
  'Controle com a sola': 'Melhora domínio e mudança curta de direção antes do passe ou chute.',
  'Passe em profundidade': 'Aumenta a utilidade quando o jogador sai da área e encontra companheiros atacando espaço.',
  'Super substituto': 'É situacional: ganha prioridade apenas quando a carta será usada com frequência no segundo tempo.',
  'Toque duplo': 'Cria uma saída curta e objetiva para escapar do primeiro marcador.',
  'Malícia': 'Pode gerar faltas em disputas próximas à área, mas não supera habilidades essenciais.',
  'Interceptação': 'Aumenta a frequência de cortes em linhas de passe compatíveis com a função.',
  'Bloqueador': 'Ajuda a fechar chutes e passes em zonas de alto risco.',
  'Marcação individual': 'Mantém contato mais constante com o adversário prioritário.',
  'Superioridade aérea': 'Reforça duelos de cabeça quando altura, salto e função justificam.',
  'Afastamento acrobático': 'Amplia soluções defensivas em bolas difíceis dentro da área.',
  'Volta para marcar': 'Melhora a recomposição de jogadores que atuam no corredor ou no meio.',
  'Passe na medida': 'Favorece passes decisivos e cruzamentos mais úteis em jogadores criadores.',
  'Cruzamento preciso': 'Prioriza qualidade de bola lateral para funções de amplitude.'
};

const POSITION_SYNERGIES: Record<PositionCode, PairRule[]> = {
  CF: [
    { label: 'Ataque ao espaço', keys: ['shooting', 'dexterity'], attributes: ['offensiveAwareness', 'acceleration', 'finishing'], explanation: 'Finalização e destreza precisam trabalhar juntas para atacar a área e concluir rápido.' },
    { label: 'Potência em profundidade', keys: ['dexterity', 'lowerBodyStrength'], attributes: ['acceleration', 'speed', 'kickingPower'], explanation: 'Aceleração, velocidade e potência sustentam arrancadas e ataques à última linha.' },
    { label: 'Ameaça aérea', keys: ['shooting', 'aerialStrength'], attributes: ['heading', 'jump', 'physicalContact'], explanation: 'Finalização, cabeceio, salto e contato aumentam a presença dentro da área.' }
  ],
  SS: [
    { label: 'Giro e criação', keys: ['dribbling', 'dexterity'], attributes: ['ballControl', 'tightPossession', 'balance', 'acceleration'], explanation: 'Controle corporal e aceleração ajudam a receber entre linhas e girar sob pressão.' },
    { label: 'Último passe e chute', keys: ['passing', 'shooting'], attributes: ['lowPass', 'finishing', 'offensiveAwareness'], explanation: 'Equilibra criação e chegada para não transformar o SA em um jogador unidimensional.' }
  ],
  LWF: [
    { label: 'Condução em velocidade', keys: ['dribbling', 'lowerBodyStrength'], attributes: ['dribbling', 'tightPossession', 'speed'], explanation: 'Combina domínio, condução e velocidade para ganhar metros sem perder controle.' },
    { label: 'Corte para finalizar', keys: ['dexterity', 'shooting'], attributes: ['acceleration', 'balance', 'finishing'], explanation: 'Aceleração e finalização sustentam diagonais e conclusão após o corte.' }
  ],
  RWF: [
    { label: 'Condução em velocidade', keys: ['dribbling', 'lowerBodyStrength'], attributes: ['dribbling', 'tightPossession', 'speed'], explanation: 'Combina domínio, condução e velocidade para ganhar metros sem perder controle.' },
    { label: 'Corte para finalizar', keys: ['dexterity', 'shooting'], attributes: ['acceleration', 'balance', 'finishing'], explanation: 'Aceleração e finalização sustentam diagonais e conclusão após o corte.' }
  ],
  LMF: [
    { label: 'Amplitude com retorno', keys: ['lowerBodyStrength', 'defending'], attributes: ['speed', 'stamina', 'defensiveEngagement'], explanation: 'Velocidade, resistência e defesa mantêm o corredor protegido.' },
    { label: 'Progressão pelo lado', keys: ['passing', 'dribbling'], attributes: ['lowPass', 'loftedPass', 'ballControl'], explanation: 'Passe e controle melhoram a saída e a criação pelo corredor.' }
  ],
  RMF: [
    { label: 'Amplitude com retorno', keys: ['lowerBodyStrength', 'defending'], attributes: ['speed', 'stamina', 'defensiveEngagement'], explanation: 'Velocidade, resistência e defesa mantêm o corredor protegido.' },
    { label: 'Progressão pelo lado', keys: ['passing', 'dribbling'], attributes: ['lowPass', 'loftedPass', 'ballControl'], explanation: 'Passe e controle melhoram a saída e a criação pelo corredor.' }
  ],
  AMF: [
    { label: 'Recepção entre linhas', keys: ['dribbling', 'dexterity'], attributes: ['ballControl', 'tightPossession', 'balance', 'acceleration'], explanation: 'Controle, condução, equilíbrio e aceleração melhoram a recepção sob pressão.' },
    { label: 'Criação decisiva', keys: ['passing', 'shooting'], attributes: ['lowPass', 'loftedPass', 'finishing'], explanation: 'Passe e finalização equilibram assistência e chegada à área.' }
  ],
  CMF: [
    { label: 'Controle do meio', keys: ['passing', 'lowerBodyStrength'], attributes: ['lowPass', 'stamina', 'speed'], explanation: 'Passe, velocidade e resistência mantêm a circulação e a cobertura.' },
    { label: 'Saída sob pressão', keys: ['passing', 'dribbling'], attributes: ['ballControl', 'tightPossession', 'lowPass'], explanation: 'Primeiro toque, condução e passe reduzem perdas no centro.' }
  ],
  DMF: [
    { label: 'Proteção e saída', keys: ['defending', 'passing'], attributes: ['defensiveAwareness', 'tackling', 'lowPass'], explanation: 'Recuperar e entregar a bola com segurança é a base do volante.' },
    { label: 'Cobertura defensiva', keys: ['defending', 'lowerBodyStrength'], attributes: ['defensiveAwareness', 'speed', 'stamina'], explanation: 'Defesa, velocidade, força e resistência sustentam o espaço à frente da zaga.' }
  ],
  CB: [
    { label: 'Defesa de cobertura', keys: ['defending', 'lowerBodyStrength'], attributes: ['defensiveAwareness', 'speed', 'physicalContact'], explanation: 'Leitura defensiva, velocidade e contato reduzem o risco em campo aberto.' },
    { label: 'Domínio aéreo', keys: ['defending', 'aerialStrength'], attributes: ['heading', 'jump', 'physicalContact'], explanation: 'Defesa, cabeceio, salto e físico aumentam a segurança na área.' }
  ],
  LB: [
    { label: 'Corredor protegido', keys: ['defending', 'lowerBodyStrength'], attributes: ['defensiveAwareness', 'speed', 'stamina'], explanation: 'Defesa, velocidade e resistência evitam que o lado vire uma avenida.' },
    { label: 'Saída lateral', keys: ['passing', 'dribbling'], attributes: ['lowPass', 'ballControl', 'tightPossession'], explanation: 'Passe e controle ajudam a sair da pressão sem perder a posição.' }
  ],
  RB: [
    { label: 'Corredor protegido', keys: ['defending', 'lowerBodyStrength'], attributes: ['defensiveAwareness', 'speed', 'stamina'], explanation: 'Defesa, velocidade e resistência evitam que o lado vire uma avenida.' },
    { label: 'Saída lateral', keys: ['passing', 'dribbling'], attributes: ['lowPass', 'ballControl', 'tightPossession'], explanation: 'Passe e controle ajudam a sair da pressão sem perder a posição.' }
  ],
  GK: [
    { label: 'Reação e alcance', keys: ['gk2', 'gk3'], attributes: ['goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach'], explanation: 'Reflexos, defesa e alcance precisam evoluir juntos.' },
    { label: 'Posicionamento seguro', keys: ['gk1', 'gk3'], attributes: ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperReach'], explanation: 'Consciência, firmeza e alcance reduzem rebotes e espaços no gol.' }
  ]
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function signature(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => `${key}:${plan[key] ?? 0}`).join('|');
}

function differenceCount(left: TrainingPlan, right: TrainingPlan) {
  return TRAINING_KEYS.reduce((sum, key) => sum + Math.abs((left[key] ?? 0) - (right[key] ?? 0)), 0);
}

function candidateSources(result: AnalysisResult): Candidate[] {
  const candidates: Candidate[] = [
    { source: 'Ficha atual', plan: result.training, baseScore: result.advancedOptimizer.winnerScore || 72 },
    ...result.buildVariants.map((variant) => ({ source: variant.title, plan: variant.training, baseScore: variant.qualityScore ?? 70 })),
    { source: 'Cenário provável', plan: result.errorTolerance.probable, baseScore: 73 },
    { source: 'Cenário conservador', plan: result.errorTolerance.conservative, baseScore: 69 },
    { source: 'Cenário agressivo controlado', plan: result.errorTolerance.optimistic, baseScore: 70 }
  ];
  if (result.competitiveFusion) candidates.push({ source: 'Fusão profissional', plan: result.competitiveFusion.finalTraining, baseScore: 74 + result.competitiveFusion.confidence * 0.12 });

  const priorities = POSITION_PRIORITIES[result.bestPosition.code];
  const baseline = normalizeTrainingPlan(result.competitiveFusion?.finalTraining ?? result.training);
  for (const receiver of priorities.slice(0, 5)) {
    for (const donor of [...priorities].reverse().concat(TRAINING_KEYS.filter((key) => !priorities.includes(key)))) {
      if (receiver === donor || baseline[donor] <= 0 || baseline[receiver] >= 16) continue;
      for (const step of [1, 2]) {
        if (baseline[donor] < step || baseline[receiver] + step > 16) continue;
        const plan = { ...baseline, [receiver]: baseline[receiver] + step, [donor]: baseline[donor] - step };
        candidates.push({ source: `Simulação ${TRAINING_LABELS[donor]}→${TRAINING_LABELS[receiver]}`, plan, baseScore: 68 });
      }
    }
  }

  const unique = new Map<string, Candidate>();
  for (const candidate of candidates) {
    const plan = normalizeTrainingPlan(candidate.plan);
    const key = signature(plan);
    const current = unique.get(key);
    if (!current || candidate.baseScore > current.baseScore) unique.set(key, { ...candidate, plan });
  }
  return Array.from(unique.values());
}

function priorityScore(result: AnalysisResult, plan: TrainingPlan) {
  const priorities = POSITION_PRIORITIES[result.bestPosition.code];
  let score = 0;
  priorities.forEach((key, index) => {
    const weight = Math.max(1, 6 - index);
    score += Math.min(12, plan[key]) * weight * 0.48;
  });
  const irrelevant = TRAINING_KEYS.filter((key) => !priorities.includes(key) && plan[key] > 0);
  score -= irrelevant.reduce((sum, key) => sum + plan[key] * 0.9, 0);
  return score;
}

function synergyScore(result: AnalysisResult, plan: TrainingPlan) {
  const pairs = POSITION_SYNERGIES[result.bestPosition.code];
  if (!pairs.length) return 0;
  return pairs.reduce((sum, pair) => {
    const [left, right] = pair.keys.map((key) => plan[key] ?? 0);
    const minimum = Math.min(left, right);
    const imbalance = Math.abs(left - right);
    return sum + minimum * 1.35 - Math.max(0, imbalance - 5) * 0.7;
  }, 0) / pairs.length;
}

function marginalScore(result: AnalysisResult, plan: TrainingPlan) {
  return result.marginalReturn.reduce((sum, item) => {
    const delta = (plan[item.training] ?? 0) - (result.training[item.training] ?? 0);
    if (!delta) return sum;
    const factor = item.returnLabel === 'alto' ? 2.5 : item.returnLabel === 'médio' ? 1.1 : -1.8;
    return sum + delta * factor;
  }, 0);
}

function identityScore(result: AnalysisResult, plan: TrainingPlan) {
  const base = result.cardDna?.antiClone.individualityScore ?? result.playerIdentity?.individualityScore ?? 72;
  const distance = differenceCount(plan, result.training);
  const protectedPenalty = result.correctionLimit.correctionCaps.reduce((sum, cap) => {
    const value = plan[cap.training] ?? 0;
    return sum + Math.max(0, value - cap.recommendedMax) * 2.2;
  }, 0);
  return clamp(base - Math.max(0, distance - 7) * 0.65 - protectedPenalty, 20, 100);
}

function scoreCandidate(result: AnalysisResult, candidate: Candidate) {
  const used = trainingPlanTotalCost(candidate.plan);
  if (used > result.trainingPointsTotal) return null;
  const budgetEfficiency = result.trainingPointsTotal > 0 ? used / result.trainingPointsTotal : 0;
  const budgetScore = budgetEfficiency >= 0.95 ? 12 : budgetEfficiency >= 0.88 ? 8 : budgetEfficiency >= 0.78 ? 3 : -6;
  const identity = identityScore(result, candidate.plan);
  const score = candidate.baseScore * 0.42
    + priorityScore(result, candidate.plan) * 0.22
    + synergyScore(result, candidate.plan) * 0.22
    + identity * 0.18
    + marginalScore(result, candidate.plan)
    + budgetScore
    + Math.min(6, (result.competitiveFusion?.exactCardCount ?? 0) * 1.5)
    + Math.min(4, (result.competitiveFusion?.personalMatchSamples ?? 0) * 0.35);
  return { ...candidate, used, identity, score: clamp(score, 0, 100) };
}

function buildSynergies(result: AnalysisResult, plan: TrainingPlan): DeepCardIntelligenceAnalysis['synergies'] {
  return POSITION_SYNERGIES[result.bestPosition.code].map((pair) => {
    const [left, right] = pair.keys.map((key) => plan[key] ?? 0);
    const trainingScore = clamp(Math.min(left, right) * 8 + Math.max(0, 8 - Math.abs(left - right)) * 2.5, 0, 100);
    const attributeValues = (pair.attributes ?? []).map((key) => Number(result.parsed.attributes[key])).filter((value) => Number.isFinite(value) && value > 0);
    const attributeScore = attributeValues.length ? attributeValues.reduce((sum, value) => sum + value, 0) / attributeValues.length : null;
    const score = clamp(attributeScore === null ? trainingScore : attributeScore * 0.72 + trainingScore * 0.28, 0, 100);
    return { label: pair.label, score, status: score >= 78 ? 'forte' : score >= 58 ? 'funcional' : 'fraca', explanation: pair.explanation };
  });
}

function buildRanges(result: AnalysisResult): DeepCardIntelligenceAnalysis['functionalRanges'] {
  return result.attributeGoals.goals.slice(0, 8).map((goal) => ({
    label: goal.label,
    current: goal.current,
    ideal: goal.targetIdeal,
    status: goal.current >= goal.targetIdeal ? 'excelente' : goal.current >= goal.targetMin ? 'competitivo' : 'corrigir',
    reason: goal.reason
  }));
}

function physicalInsights(result: AnalysisResult) {
  const profile = result.parsed.physicalProfile;
  const notes: string[] = [];
  if ((profile.legLength ?? 0) >= 8 || (profile.legCoverageRadius ?? 0) >= 178) notes.push('Pernas longas e grande raio de cobertura favorecem alcance da passada, interceptações e finalizações esticadas.');
  if ((profile.jumpHeight ?? 0) >= 260 || (result.parsed.attributes.jump ?? 0) >= 85) notes.push('Altura de salto e impulsão reforçam a ameaça aérea; bola aérea pode ter retorno real na área.');
  if ((profile.trunkCollision ?? 0) >= 50 || (result.parsed.attributes.physicalContact ?? 0) >= 82) notes.push('Colisão de tronco e contato físico ajudam a proteger a bola e disputar espaço.');
  if ((result.parsed.attributes.balance ?? 100) < 82 || (result.parsed.attributes.tightPossession ?? 100) < 82) notes.push('Equilíbrio/condução abaixo do nível de elite pedem cuidado em giros longos e dribles excessivos sob pressão.');
  return notes.slice(0, 4);
}

export function buildDeepCardIntelligence(result: AnalysisResult): DeepCardIntelligenceAnalysis {
  const candidates = candidateSources(result);
  const scored = candidates.map((candidate) => scoreCandidate(result, candidate)).filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) => b.score - a.score);
  const baseline = scored.find((item) => signature(item.plan) === signature(result.training)) ?? scored[0];
  const rawWinner = scored[0] ?? { source: 'Ficha atual', plan: result.training, baseScore: 70, used: result.trainingPointsUsed, identity: 70, score: 70 };
  const winner = baseline && rawWinner.score < baseline.score + 1.5 ? baseline : rawWinner;
  const changes = TRAINING_KEYS.filter((key) => (winner.plan[key] ?? 0) !== (result.training[key] ?? 0)).map((key) => ({
    key,
    label: TRAINING_LABELS[key],
    from: result.training[key] ?? 0,
    to: winner.plan[key] ?? 0,
    reason: (winner.plan[key] ?? 0) > (result.training[key] ?? 0)
      ? 'Recebeu prioridade por sinergia, função e retorno marginal.'
      : 'Cedeu pontos porque o retorno era menor para esta função.'
  }));
  const dataQuality = clamp(result.parsed.confidence * 0.62 + Math.min(24, result.parsed.evidence.attributeCount * 1.1) + Math.min(8, Object.values(result.parsed.physicalProfile).filter(Number.isFinite).length * 0.7));
  const identity = winner.identity;
  const sourceConfidence = Math.min(10, (result.competitiveFusion?.exactCardCount ?? 0) * 2.2);
  const matchSamples = result.competitiveFusion?.personalMatchSamples ?? 0;
  const confidence = clamp(dataQuality * 0.48 + identity * 0.27 + winner.score * 0.2 + sourceConfidence + Math.min(5, matchSamples * 0.4) - (result.validation.level === 'blocked' ? 25 : result.validation.level === 'review' ? 8 : 0), 20, 98);
  const confidenceLabel: DeepCardIntelligenceAnalysis['confidenceLabel'] = confidence >= 82 ? 'alta' : confidence >= 64 ? 'média' : 'baixa';
  const bestImpeto = result.recommendedImpetos.find((item) => item.tier === 'ideal') ?? result.recommendedImpetos[0];
  const reasons = [
    `${scored.length} distribuições válidas foram comparadas sem ultrapassar ${result.trainingPointsTotal} pontos.`,
    `A identidade da carta ficou em ${identity}/100 e a posição ${result.bestPosition.label} foi preservada.`,
    `A ficha vencedora equilibrou prioridades, sinergias e retorno de cada nível investido.`,
    result.parsed.evidence.attributeCount >= 20 ? 'A leitura extensa dos atributos reduziu o uso de estimativas genéricas.' : 'Campos não lidos continuam marcados para confirmação, sem serem tratados como fatos.',
    (result.competitiveFusion?.exactCardCount ?? 0) > 0 ? `${result.competitiveFusion?.exactCardCount} referência(s) profissional(is) da carta exata entraram apenas como evidência controlada.` : 'Nenhuma ficha externa foi usada como verdade absoluta.'
  ];
  const warnings: string[] = [];
  if (result.parsed.confidence < 70) warnings.push('Confirme identidade, nível, atributos e habilidades antes de aplicar a ficha.');
  if (result.parsed.nativeSkills.length < 5) warnings.push('A lista de habilidades parece incompleta; recomendações podem mudar após a confirmação.');
  if (!result.parsed.impetos.length) warnings.push('O Ímpeto já presente na carta não foi confirmado.');
  if (matchSamples < 3) warnings.push('Ainda faltam partidas comparáveis para personalizar a ficha ao seu estilo de jogo.');
  const learningState: DeepCardIntelligenceAnalysis['learning']['state'] = matchSamples >= 8 ? 'confiável' : matchSamples >= 3 ? 'aprendendo' : 'sem dados';
  const ownedSkills = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map((item) => item.toLowerCase()));
  const roleOrder = POSITION_SKILL_PRIORITIES[result.bestPosition.code];
  const candidatesForSkills = [...roleOrder, ...result.skillPriority.ordered.map((item) => item.name), ...result.recommendedSkills]
    .filter((name, index, all) => all.indexOf(name) === index)
    .filter((name) => !ownedSkills.has(name.toLowerCase()));
  const skillPlan = candidatesForSkills.slice(0, 5).map((name, index) => ({
    name,
    priority: index === 0 ? 'máxima' as const : index < 3 ? 'alta' as const : 'útil' as const,
    reason: SKILL_REASON[name] ?? result.skillPriority.ordered.find((item) => item.name === name)?.reasons[0] ?? 'Compatível com a função escolhida e ainda não identificada na carta.'
  }));
  return {
    engineVersion: ENGINE_VERSION,
    mode: 'Motor especialista local',
    confidence,
    confidenceLabel,
    identityScore: identity,
    dataQuality,
    candidatesEvaluated: candidates.length,
    validCandidates: scored.length,
    winnerScore: winner.score,
    winnerSource: winner.source,
    finalTraining: winner.plan,
    changes,
    synergies: buildSynergies(result, winner.plan),
    functionalRanges: buildRanges(result),
    skillPlan,
    impetoPlan: { name: bestImpeto?.name ?? null, score: bestImpeto?.score ?? 0, reason: bestImpeto?.reason ?? 'A leitura ainda não tem segurança suficiente para escolher um Ímpeto.' },
    physicalInsights: physicalInsights(result),
    learning: {
      samples: matchSamples,
      state: learningState,
      recommendation: learningState === 'confiável' ? 'Os registros já podem desempatar pequenas variações da ficha.' : learningState === 'aprendendo' ? 'Continue registrando partidas semelhantes para confirmar o padrão.' : 'Registre pelo menos 3 partidas com esta ficha; 8 ou mais aumentam a confiabilidade.'
    },
    reasons,
    warnings,
    summary: `A Inteligência Profunda avaliou ${scored.length} distribuições e escolheu ${winner.source} com ${winner.score}/100, mantendo uma única ficha para ${result.bestPosition.label}.`
  };
}

export function applyDeepCardIntelligenceToResult(result: AnalysisResult): AnalysisResult {
  const deepCardIntelligence = buildDeepCardIntelligence(result);
  const finalTraining = deepCardIntelligence.finalTraining;
  const used = trainingPlanTotalCost(finalTraining);
  const recommendedSkills = deepCardIntelligence.skillPlan.map((item) => item.name);
  const skillRecommendations = [
    ...deepCardIntelligence.skillPlan.map((item, index) => ({ name: item.name, tier: index === 0 ? 'essencial' as const : 'alternativa' as const, reason: item.reason })),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !recommendedSkills.includes(item.name))
  ];
  return {
    ...result,
    training: finalTraining,
    trainingCost: trainingPlanCost(finalTraining),
    trainingPointsUsed: used,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - used),
    recommendedSkills,
    skillRecommendations,
    deepCardIntelligence,
    recommendationExplanation: [deepCardIntelligence.summary, ...deepCardIntelligence.reasons.slice(0, 3), ...result.recommendationExplanation]
      .filter((item, index, all) => all.indexOf(item) === index)
      .slice(0, 10)
  };
}
