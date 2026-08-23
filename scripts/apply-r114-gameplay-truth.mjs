import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R114_GAMEPLAY_TRUTH_MARKER = 'BM_R114_GAMEPLAY_TRUTH';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r114] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

function patchR108(input) {
  let source = input;
  if (source.includes('BM_R114_R108_DIRECT_OBJECTIVE')) return source;

  const rulesHelper = `
function homemAreaAerialReadyR114(result: AnalysisResult, identity: CanonicalCardIdentityR60) {
  const style = normalize(\`\${identity.offensivePlaystyle ?? ''} \${identity.defensivePlaystyle ?? ''}\`);
  if (identity.naturalPosition !== 'CF' || !/homem de area|fox in the box/.test(style)) return false;
  const aerialDna = Number(identity.dna.aerial ?? 0);
  const finishingDna = Number(identity.dna.finishing ?? 0);
  const mobilityDna = Number(identity.dna.mobility ?? 0);
  const aerialBase = (
    attribute(result, 'heading') +
    attribute(result, 'jump') +
    attribute(result, 'physicalContact')
  ) / 3;
  return aerialDna >= 86 && aerialBase >= 80 && aerialDna >= Math.max(finishingDna, mobilityDna) - 6;
}

function applyGameplayTruthRulesR114(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  rules: Partial<Record<AttributeKey, AttrRule>>
) {
  const style = normalize(\`\${identity.offensivePlaystyle ?? ''} \${identity.defensivePlaystyle ?? ''}\`);
  if (identity.naturalPosition !== 'CF' || !/homem de area|fox in the box/.test(style)) return;

  const aerialReady = homemAreaAerialReadyR114(result, identity);
  const boost = (key: AttributeKey, amount: number) => {
    const rule = rules[key];
    if (rule) rule.weight += amount;
  };
  const scale = (key: AttributeKey, factor: number) => {
    const rule = rules[key];
    if (rule) rule.weight *= factor;
  };

  // Homem de Área define movimentação dentro da área, não obrigação de transformar
  // qualquer carta em cabeceador. Jogo aéreo só ganha prioridade se o DNA real sustentar.
  if (!aerialReady) {
    scale('heading', .42);
    scale('jump', .42);
    scale('physicalContact', .78);
    boost('offensiveAwareness', .48);
    boost('finishing', .42);
    boost('acceleration', .72);
    boost('balance', .58);
    boost('ballControl', .48);
    boost('speed', .30);
  } else {
    // Mesmo em especialista aéreo, não deixar o estilo consumir o orçamento inteiro.
    scale('heading', .88);
    scale('jump', .88);
    boost('offensiveAwareness', .25);
    boost('finishing', .22);
    boost('acceleration', .22);
  }
}

// BM_R114_R108_DIRECT_OBJECTIVE: estilo modifica o DNA; nunca substitui o DNA da carta.
`;

  source = replaceRequired(
    source,
    'function buildRules(result: AnalysisResult, identity: CanonicalCardIdentityR60) {',
    rulesHelper + '\nfunction buildRules(result: AnalysisResult, identity: CanonicalCardIdentityR60) {',
    'helper de verdade de gameplay'
  );

  source = replaceRequired(
    source,
    `  applyDnaAmplifier(result, identity, rules);

  for (const [key, current] of Object.entries(rules) as Array<[AttributeKey, AttrRule]>) {`,
    `  applyDnaAmplifier(result, identity, rules);
  applyGameplayTruthRulesR114(result, identity, rules);

  for (const [key, current] of Object.entries(rules) as Array<[AttributeKey, AttrRule]>) {`,
    'overlay DNA-first'
  );

  source = replaceRequired(
    source,
    `  add(/homem de area|fox in the box/, [['offensiveAwareness', 95], ['finishing', 95], ['heading', 89], ['jump', 88]]);`,
    `  if (/homem de area|fox in the box/.test(style)) {
    add(
      /homem de area|fox in the box/,
      homemAreaAerialReadyR114(result, identity)
        ? [['offensiveAwareness', 95], ['finishing', 95], ['heading', 89], ['jump', 88]]
        : [['offensiveAwareness', 95], ['finishing', 95], ['acceleration', 91], ['balance', 86]]
    );
  }`,
    'sinergia Homem de Área baseada no DNA'
  );

  const beamHelper = `
function trainingSignatureR114(plan: TrainingPlan) {
  return TRAINING_KEYS.map((key) => \`\${key}:\${Number(plan[key] ?? 0)}\`).join('|');
}

function optimizePoolR114(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  rules: Partial<Record<AttributeKey, AttrRule>>,
  profile: ExtremeProfileR108,
  staminaGoal: number
): TrainingPlan[] {
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  if (!Number.isFinite(budget) || budget <= 0) return [];
  const keys = activeKeys(result, identity, rules, profile, staminaGoal);
  type NodeR114 = { score: number; plan: TrainingPlan };
  const beamWidth = 14;
  let dp: Array<NodeR114[]> = Array.from({ length: budget + 1 }, () => []);
  dp[0] = [{ score: 0, plan: emptyPlan() }];

  const keep = (bucket: NodeR114[], node: NodeR114) => {
    const sig = trainingSignatureR114(node.plan);
    const current = bucket.findIndex((item) => trainingSignatureR114(item.plan) === sig);
    if (current >= 0) {
      if (node.score > bucket[current].score) bucket[current] = node;
    } else bucket.push(node);
    bucket.sort((left, right) => right.score - left.score || trainingSignatureR114(left.plan).localeCompare(trainingSignatureR114(right.plan)));
    if (bucket.length > beamWidth) bucket.length = beamWidth;
  };

  for (const key of keys) {
    const next: Array<NodeR114[]> = Array.from({ length: budget + 1 }, () => []);
    for (let spent = 0; spent <= budget; spent += 1) {
      for (const previous of dp[spent]) {
        for (let level = 0; level <= 16; level += 1) {
          const total = spent + trainingTotalCost(level);
          if (total > budget) break;
          const plan = { ...previous.plan, [key]: level };
          if (!hardPlanValid(identity, plan)) continue;
          const score = previous.score + levelUtility(result, identity, rules, key, level, profile, staminaGoal, keys);
          keep(next[total], { score, plan });
        }
      }
    }
    dp = next;
  }
  return dp[budget].map((node) => node.plan);
}

function gameplayTruthScoreR114(
  result: AnalysisResult,
  identity: CanonicalCardIdentityR60,
  candidate: PerformanceCandidateR108
) {
  let score =
    candidate.totalScore * .36 +
    candidate.synergyScore * .27 +
    candidate.responseScore * .25 +
    candidate.impactScore * .07 +
    candidate.floorCoverage * .03 +
    candidate.staminaScore * .02;

  if (candidate.responseScore < 72) score -= (72 - candidate.responseScore) * 2.8;
  if (candidate.synergyScore < 72) score -= (72 - candidate.synergyScore) * 2.2;
  score -= candidate.fatalBottlenecks.length * 7;
  score -= candidate.wastedLevels * 1.8;

  const style = normalize(\`\${identity.offensivePlaystyle ?? ''} \${identity.defensivePlaystyle ?? ''}\`);
  if (
    identity.naturalPosition === 'CF' &&
    /homem de area|fox in the box/.test(style) &&
    !homemAreaAerialReadyR114(result, identity)
  ) {
    const aerial = Number(candidate.training.aerialStrength ?? 0);
    if (aerial > 8) score -= (aerial - 8) * 4.5;
    const responseInvestment =
      Number(candidate.training.dexterity ?? 0) +
      Number(candidate.training.lowerBodyStrength ?? 0) +
      Number(candidate.training.dribbling ?? 0);
    if (responseInvestment < aerial) score -= (aerial - responseInvestment) * 2.5;
  }
  return score;
}

// r114 não escolhe mais entre apenas quatro fichas. Ele conserva um feixe de
// distribuições por orçamento e deixa a métrica REAL de gameplay decidir no fim.
`;

  source = replaceRequired(
    source,
    'function projectedAttribute(result: AnalysisResult, plan: TrainingPlan, attr: AttributeKey) {',
    beamHelper + '\nfunction projectedAttribute(result: AnalysisResult, plan: TrainingPlan, attr: AttributeKey) {',
    'busca multi-candidata'
  );

  source = replaceRequired(
    source,
    `  const generated = profiles.map((profile) => {
    const optimized = optimize(input, identity, rules, profile, target) ?? input.training;
    const plan = repairTechnicalDnaPlanR111(identity, optimized);
    return scorePerformancePlan2027R108(input, identity, plan, profile);
  });`,
    `  const generated = profiles.flatMap((profile) => {
    const pool = optimizePoolR114(input, identity, rules, profile, target);
    const seeds = pool.length ? pool : [optimize(input, identity, rules, profile, target) ?? input.training];
    return seeds.map((seed) => {
      const plan = repairTechnicalDnaPlanR111(identity, seed);
      return scorePerformancePlan2027R108(input, identity, plan, profile);
    });
  });`,
    'geração r114 por feixe'
  );

  source = replaceRequired(
    source,
    `  const ranked = [...unique.values()].sort((a, b) =>
    b.totalScore - a.totalScore ||
    b.synergyScore - a.synergyScore ||
    b.responseScore - a.responseScore ||
    a.fatalBottlenecks.length - b.fatalBottlenecks.length ||
    a.wastedLevels - b.wastedLevels
  );`,
    `  const ranked = [...unique.values()].sort((a, b) =>
    gameplayTruthScoreR114(input, identity, b) - gameplayTruthScoreR114(input, identity, a) ||
    b.responseScore - a.responseScore ||
    b.synergyScore - a.synergyScore ||
    b.totalScore - a.totalScore ||
    a.fatalBottlenecks.length - b.fatalBottlenecks.length ||
    a.wastedLevels - b.wastedLevels
  );`,
    'ranking por gameplay real'
  );

  source = replaceRequired(
    source,
    `      \`Extreme Gameplay r108: \${winner.totalScore}/100 • \${winner.profile} • sinergia real \${winner.synergyScore}/100 • resposta \${winner.responseScore}/100.\`,`,
    `      \`Gameplay Truth r114: \${winner.totalScore}/100 • \${winner.profile} • sinergia \${winner.synergyScore}/100 • resposta \${winner.responseScore}/100 • busca direta entre \${generated.length} candidatas.\`,`,
    'explicação r114'
  );

  return source;
}

function patchR109(input) {
  let source = input;
  if (source.includes('BM_R114_R109_RESPONSE_GUARD')) return source;

  source = replaceRequired(
    source,
    `        item.extremeDrop <= 4.5 &&
        levelDistance(core, item.candidate) > 0`,
    `        item.extremeDrop <= 4.5 &&
        item.extremeCandidate.responseScore >= Math.max(70, extreme.winner.responseScore - 2) &&
        item.extremeCandidate.synergyScore >= Math.max(70, extreme.winner.synergyScore - 2) &&
        levelDistance(core, item.candidate) > 0`,
    'r109 não pode piorar resposta/sinergia'
  );

  source = replaceRequired(
    source,
    `export const PERFORMANCE_ENGINE_2027_R109_VERSION = '40.80-r109-extreme-position-execution-layer' as const;`,
    `export const PERFORMANCE_ENGINE_2027_R109_VERSION = '40.80-r109-extreme-position-execution-layer' as const;
// BM_R114_R109_RESPONSE_GUARD: adaptação posicional não pode sacrificar a resposta real do núcleo.`,
    'marcador r109'
  );
  return source;
}

function patchSkills(input) {
  let source = input;
  if (source.includes('BM_R114_SKILL_FREQUENCY')) return source;

  source = replaceRequired(
    source,
    `const DEFENSIVE_SKILLS = new Set(['Marcação individual','Volta para marcar','Interceptação','Bloqueador','Carrinho','Afastamento acrobático']);`,
    `const DEFENSIVE_SKILLS = new Set(['Marcação individual','Volta para marcar','Interceptação','Bloqueador','Carrinho','Afastamento acrobático']);

const SITUATIONAL_SHOOTING_R114 = new Set([
  'Efeito de longe',
  'Controle da cavadinha',
  'Chute com o peito do pé',
  'Folha seca',
  'Chute ascendente',
  'Precisão à distância',
  'Especialista em pênalti'
]);

const HIGH_FREQUENCY_GAMEPLAY_R114 = new Set([
  'Passe de primeira',
  'Passe em profundidade',
  'Controle com a sola',
  'Toque duplo',
  'Chute de primeira',
  'Finalização acrobática',
  'Interceptação',
  'Bloqueador',
  'Marcação individual',
  'Volta para marcar',
  'Espírito guerreiro',
  'Cabeçada',
  'Superioridade aérea'
]);

function highFrequencyBonusR114(result: AnalysisResult, position: PositionCode, skill: string) {
  let score = 0;
  const reasons: string[] = [];
  if (HIGH_FREQUENCY_GAMEPLAY_R114.has(skill)) {
    score += 20;
    reasons.push('Ação de alta frequência: tende a participar de muitas jogadas por partida.');
  }
  if (SITUATIONAL_SHOOTING_R114.has(skill)) {
    const a = result.parsed.attributes;
    const eliteShot = avg(a.finishing, a.offensiveAwareness, a.kickingPower) >= 90;
    score -= eliteShot ? 10 : 24;
    reasons.push('Habilidade situacional: perde prioridade para ações que ativam repetidamente durante a partida.');
  }
  if (skill === 'Especialista em pênalti') score -= 80;
  if (position === 'CF' && ['Passe de primeira','Controle com a sola','Chute de primeira'].includes(skill)) score += 8;
  return { score, reasons };
}

function aerialSkillEligibleR114(result: AnalysisResult, position: PositionCode) {
  if (!['CF','SS','CB','DMF'].includes(position)) return false;
  const a = result.parsed.attributes;
  const aerial = avg(a.heading, a.jump, a.physicalContact);
  const style = styleName(result);
  if (/^pivo$|target man/.test(style)) return aerial >= 78;
  if (/homem de area|fox in the box/.test(style)) return aerial >= 84;
  return aerial >= 87;
}

// BM_R114_SKILL_FREQUENCY: Top 5 é ganho por frequência de ativação, não por nome chamativo.
`,
    'camada de frequência das habilidades'
  );

  source = replaceRequired(
    source,
    `  if (['CF','SS','LWF','RWF','AMF'].includes(position) && DEFENSIVE_SKILLS.has(skill)) return true;`,
    `  if (skill === 'Especialista em pênalti') return true;
  if (['CF','SS','LWF','RWF','AMF'].includes(position) && DEFENSIVE_SKILLS.has(skill)) return true;`,
    'penalidade não ocupa Top 5'
  );

  source = replaceRequired(
    source,
    `  const role = functionalRoleBonus(result, position, skill);
  const categoryBase = BASE_CATEGORY[position][category];
  const stable = stableHash(\`\${result.parsed.playerName}|\${result.parsed.cardType}|\${result.parsed.mainPosition}|\${result.parsed.playstyle ?? ''}|\${skill}\`) % 4;
  const raw = 30 + categoryBase + style.score + attr.score + meta.score + role.score + Math.max(0, 12 - poolRank) + stable;`,
    `  const role = functionalRoleBonus(result, position, skill);
  const frequency = highFrequencyBonusR114(result, position, skill);
  const categoryBase = BASE_CATEGORY[position][category];
  const stable = stableHash(\`\${result.parsed.playerName}|\${result.parsed.cardType}|\${result.parsed.mainPosition}|\${result.parsed.playstyle ?? ''}|\${skill}\`) % 4;
  const raw = 30 + categoryBase + style.score + attr.score + meta.score + role.score + frequency.score + Math.max(0, 12 - poolRank) + stable;`,
    'score por frequência'
  );

  source = replaceRequired(
    source,
    `  return { name: skill, category, score, tier, reasons: [...role.reasons, ...style.reasons, ...attr.reasons, ...meta.reasons].slice(0, 3) };`,
    `  return { name: skill, category, score, tier, reasons: [...frequency.reasons, ...role.reasons, ...style.reasons, ...attr.reasons, ...meta.reasons].slice(0, 3) };`,
    'motivo por frequência'
  );

  source = replaceRequired(
    source,
    `    if (position === 'CF' && /homem de area|fox in the box/.test(style)) return ['finalização','finalização','aérea','aérea','físico'];`,
    `  if (position === 'CF' && /homem de area|fox in the box/.test(style)) {
    return aerialSkillEligibleR114(result, position)
      ? ['finalização','drible','aérea','passe','físico']
      : ['finalização','drible','passe','físico','finalização'];
  }`,
    'blueprint Homem de Área'
  );

  source = replaceRequired(
    source,
    `  const ranked = (category?: Category) => candidates
    .filter((candidate) => !selected.some((current) => skillIdentityKey(current.name) === skillIdentityKey(candidate.name)))
    .filter((candidate) => !category || candidate.category === category)
    .map((candidate) => {`,
    `  const ranked = (category?: Category) => candidates
    .filter((candidate) => !selected.some((current) => skillIdentityKey(current.name) === skillIdentityKey(candidate.name)))
    .filter((candidate) => !category || candidate.category === category)
    .filter((candidate) => !SITUATIONAL_SHOOTING_R114.has(candidate.name) || !selected.some((current) => SITUATIONAL_SHOOTING_R114.has(current.name)))
    .filter((candidate) => candidate.category !== 'aérea' || aerialSkillEligibleR114(result, position) || !selected.some((current) => current.category === 'aérea'))
    .map((candidate) => {`,
    'limites globais de habilidades situacionais'
  );

  return source;
}

function patchR80(input) {
  let source = input;
  if (source.includes('BM_R114_IMPETO_TRUTH')) return source;

  source = replaceRequired(
    source,
    `  let winner=impetos[0]??null;
  if(active) winner={name:active,score:100,stability:100,regretRisk:0,reasons:['Ímpeto já aplicado: preservado como recurso permanente da carta.']};`,
    `  let winner=impetos[0]??null;
  if(active) winner={name:active,score:100,stability:100,regretRisk:0,reasons:['Ímpeto já aplicado: preservado como recurso permanente da carta.']};
  // BM_R114_IMPETO_TRUTH: candidato fraco pode aparecer como alternativa, mas não vira recurso Mestre.
  if(!active && winner && (winner.stability<88 || winner.regretRisk>12)) winner=null;`,
    'Ímpeto fraco não vira Mestre'
  );

  return source;
}

function patchPipeline(input) {
  let source = input;
  if (source.includes('BM_R114_PIPELINE_TRUTH')) return source;

  source = replaceRequired(
    source,
    `      'Desempenho extremo: ficha calculada sem perseguir overall; o overall exibido não participa da distribuição dos pontos.',`,
    `      'Gameplay Truth r114: prioridade absoluta para resposta, sinergia, DNA e ações de alta frequência; overall não participa da distribuição.',
      'Desempenho extremo: ficha calculada sem perseguir overall; o overall exibido não participa da distribuição dos pontos.',`,
    'explicação final r114'
  );

  source = replaceRequired(
    source,
    `  // BM_R111_FINAL_ANTI_OVERALL: a proteção anti-overall fica explícita também no resultado final.`,
    `  // BM_R114_PIPELINE_TRUTH: a ficha final declara a política de gameplay real.
  // BM_R111_FINAL_ANTI_OVERALL: a proteção anti-overall fica explícita também no resultado final.`,
    'marcador pipeline r114'
  );
  return source;
}

export function applyR114GameplayTruth(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const files = {
    r108: resolve(root, 'src/lib/performanceEngine2027V4080R108.ts'),
    r109: resolve(root, 'src/lib/performanceEngine2027V4080R109.ts'),
    skills: resolve(root, 'src/lib/definitiveAdditionalSkillsV600R15.ts'),
    r80: resolve(root, 'src/lib/permanentResources2027V4080R80.ts'),
    pipeline: resolve(root, 'src/lib/cardIntelligencePipeline.ts')
  };
  for (const path of Object.values(files)) {
    if (!existsSync(path)) throw new Error(`[r114] arquivo obrigatório ausente: ${path}`);
  }

  const transforms = {
    r108: patchR108,
    r109: patchR109,
    skills: patchSkills,
    r80: patchR80,
    pipeline: patchPipeline
  };

  let changed = false;
  for (const [key, path] of Object.entries(files)) {
    const before = readFileSync(path, 'utf8');
    const after = transforms[key](before);
    if (after !== before) {
      writeFileSync(path, after, 'utf8');
      changed = true;
    }
  }
  console.log('v40.80 r114 aplicada: busca multi-candidata, Homem de Área DNA-first, Top 5 por frequência e Ímpeto seguro.');
  return { changed };
}

export function transformR108R114(input) { return patchR108(input); }
export function transformR109R114(input) { return patchR109(input); }
export function transformSkillsR114(input) { return patchSkills(input); }
export function transformR80R114(input) { return patchR80(input); }
export function transformPipelineR114(input) { return patchPipeline(input); }
