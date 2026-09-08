import { findOfficialCardRule } from '../modules/rules/officialRuleRegistry';
import { buildStrengthWeaknessDiagnosticsR131, buildUsageTipsR131 } from '../modules/analysis/analyzerUsageDiagnosticsR131';
import { buildAvoidPositions, buildPermittedPositions, parseCard, validateAnalysis } from '../modules/analysis/analyzerCardEvidenceR186';
import { buildSkillRecommendations, recommendAdditionalSkills, recommendImpetos as recommendImpetosR186, TARGET_CF_STYLES, uniqueSkillList } from '../modules/analysis/analyzerSkillIntelligenceR186';
import { avg, calculatePri, calculateTacticalFit, clamp, clampDecimal, fillAttributes, gameplayPositionWeight, gameplayPriorityByMainPosition, playstylePositionBonus, positionScore, preferredPositionsByPlaystyle, roleName, styleText } from '../modules/analysis/analyzerPositionCoreR142';
import { BASE_BY_POSITION, OFFICIAL_ADDITIONAL_SKILLS, SKILL_PROFILES, SPECIAL_SKILL_ANALYSIS_META } from '../modules/analysis/analyzerCatalog';
import { canonicalSkillName } from './officialSkillIdentity';
import { TRAINING_LABELS, type BuildVariant, type TrainingComparisonItem } from './trainingEngine';
import { buildMaxPrecisionAnalysis } from './maxPrecision';
import { buildEliteEvolutionAnalysis } from './eliteEvolution';
import { buildMetaBuildUniverse } from './metaBuildUniverse';
import { buildStructuralPrecisionAnalysis, mergeStructuralValidation } from './structuralPrecisionV3740';
import {
  emptyTraining,
  normalizeTrainingPlan,
  TRAINING_KEYS,
  trainingLevelCost,
  trainingPlanCost,
  trainingPlanTotalCost
} from './trainingPlanCore';
import {
  fitTrainingToBudget,
  fitTrainingToExactBudget,
  trainingBudgetFromCard,
  trainingCostRuleText,
  trainingFor,
  trainingRoleProfile,
  trainingTemplate
} from '../modules/builds/trainingOptimizer';
import { Objective, TacticalProfile, PositionCode, AttributeKey, Attributes, TrainingKey, TrainingPlan, ImpetoRecommendation, ParsedCard, TeamMapPhaseScores, TeamMapAnalysis, DeepReadingItem, DeepAnalysis, AdvancedTacticalFunction, SpecialSkillsAnalysis, PhysicalEngineAnalysis, AttributeGoalItem, AttributeGoalsAnalysis, AdvancedOptimizerAnalysis, CorrectionLimitAnalysis, MarginalReturnItem, ErrorToleranceAnalysis, SkillPriorityAnalysis, PlayerIdentityAnalysis, IndividualAttributeGoal, SelectiveWeaknessStrategy, SpecialSkillSynergyItem, OnFieldBehaviorSimulation, AntiCloneAnalysis, CardDnaAnalysis, AnalysisResult, normalizeObjective, POSITION_PT, ATTRIBUTE_PT, PLAYSTYLE_OPTIONS, TACTICAL_STYLE_NAME,  } from './analyzerDomain';
export * from './analyzerDomain';
export { parseCard };
export function recommendImpetos(parsed: ParsedCard, selectedPosition: PositionCode, objective: Objective): ImpetoRecommendation[] {
  return recommendImpetosR186(parsed, selectedPosition, objective);
}

const NON_GK_TRAINING_KEYS = TRAINING_KEYS.filter((key) => !key.startsWith('gk'));
const GK_DNA_TRAINING_KEYS: TrainingKey[] = ['gk1','gk2','gk3','lowerBodyStrength','aerialStrength'];
const AUTO_POSITION_FAMILIES = {
  attack: new Set<PositionCode>(['CF','SS','LWF','RWF']), creators: new Set<PositionCode>(['SS','AMF','CMF','LMF','RMF']),
  midfield: new Set<PositionCode>(['AMF','CMF','DMF','LMF','RMF']), defence: new Set<PositionCode>(['CB','LB','RB','DMF']),
};

function automaticPositionFamilyCompatible(main: PositionCode, candidate: PositionCode): boolean {
  if (main === candidate) return true;
  if (main === 'GK' || candidate === 'GK') return false;
  const { attack, creators, midfield, defence } = AUTO_POSITION_FAMILIES;
  if (attack.has(main)) return attack.has(candidate) || (main === 'SS' && candidate === 'AMF');
  if (main === 'AMF') return creators.has(candidate);
  if (main === 'CMF' || main === 'LMF' || main === 'RMF') return midfield.has(candidate) || creators.has(candidate);
  if (main === 'DMF') return midfield.has(candidate) || defence.has(candidate);
  if (main === 'CB' || main === 'LB' || main === 'RB') return defence.has(candidate);
  return false;
}

function chooseGameplaySelectedPosition(parsed: ParsedCard, scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>): PositionCode {
  // r27: no modo AUTO, a identidade da posição da carta é uma trava de família.
  // Adaptação fora da função continua liberada quando o usuário escolhe a posição manualmente.
  const compatible = scored.filter((item) => automaticPositionFamilyCompatible(parsed.mainPosition, item.code));
  const best = compatible[0] ?? scored.find((item) => item.code === parsed.mainPosition) ?? scored[0];
  if (!best) return parsed.mainPosition;

  const preferred = gameplayPriorityByMainPosition(parsed.mainPosition, parsed.playstyle)
    .filter((code) => parsed.positions.includes(code) && automaticPositionFamilyCompatible(parsed.mainPosition, code))
    .map((code) => compatible.find((item) => item.code === code))
    .filter((item): item is { code: PositionCode; label: string; score: number; role: string; cardRating?: number | null } => Boolean(item));

  const strongPreferred = preferred.find((item) => item.score >= best.score - 4);
  if (strongPreferred) return strongPreferred.code;
  return best.code;
}

function tacticalScoreBonus(position: PositionCode, profile: TacticalProfile, a: Required<Attributes>) {
  let bonus = 0;
  const managerFactor = profile.managerProficiency ? Math.max(0.92, Math.min(1.12, 1 + (profile.managerProficiency - 85) * 0.018)) : 1;
  if (profile.style === 'POSSE_DE_BOLA') {
    bonus += Math.max(0, Math.max(a.lowPass, a.ballControl, a.tightPossession) - 74) * 0.07;
    if (['AMF', 'CMF', 'DMF', 'SS'].includes(position)) bonus += 2;
  }
  if (profile.style === 'CONTRA_ATAQUE') {
    bonus += Math.max(0, Math.max(a.loftedPass, a.physicalContact, a.stamina) - 74) * 0.055;
    if (['CB', 'DMF', 'CF', 'SS'].includes(position)) bonus += 1.5;
  }
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO') {
    bonus += Math.max(0, Math.max(a.speed, a.acceleration, a.offensiveAwareness) - 75) * 0.075;
    bonus += Math.max(0, a.lowPass - 74) * 0.03;
    if (['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position)) bonus += 2;
  }
  if (profile.style === 'POR_FORA') bonus += Math.max(0, Math.max(a.loftedPass, a.speed, a.stamina) - 74) * 0.06;
  if (profile.style === 'PASSE_LONGO') bonus += Math.max(0, Math.max(a.loftedPass, a.heading, a.physicalContact) - 74) * 0.06;
  if (profile.managerProficiency) bonus *= managerFactor;
  return bonus;
}

function tacticalProfileTips(profile: TacticalProfile, selected: PositionCode) {
  const tips: string[] = [];
  if (profile.managerName && profile.managerProficiency) tips.push(`Técnico selecionado: ${profile.managerName} (${profile.managerProficiency}). A proficiência refina a ficha, mas nunca substitui a posição escolhida por você.`);
  tips.push('Ficha universal: a formação não altera a distribuição; a posição escolhida, o estilo da carta e o estilo do técnico comandam a calibração.');
  if (profile.style === 'POSSE_DE_BOLA') tips.push('Estilo do técnico — Posse de bola: prioriza passe curto, controle, paciência e triangulações; evite forçar bola longa sem necessidade.');
  if (profile.style === 'CONTRA_ATAQUE') tips.push('Estilo do técnico — Contra-ataque: prioriza bloco organizado, roubo e passe direto com segurança; bom para atacar quando o rival se expõe.');
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO') tips.push('Estilo do técnico — Contra-ataque rápido: aceleração, velocidade e passe vertical pesam mais na recomendação; ataque o espaço logo após recuperar.');
  if (profile.style === 'POR_FORA') tips.push('Estilo do técnico — Por fora: use laterais/alas e pontas para abrir campo, cruzar e inverter jogadas.');
  if (profile.style === 'PASSE_LONGO') tips.push('Estilo do técnico — Passe longo: valoriza passe alto, físico e jogo aéreo; use pivô, segunda bola e atacantes fortes.');
  if (profile.style === 'CONTRA_ATAQUE_RAPIDO' && (selected === 'CF' || selected === 'SS' || selected === 'LWF' || selected === 'RWF')) tips.push('Dica prática: no contra-ataque rápido, o primeiro passe precisa achar o atacante já de frente; use Chute de primeira e Passe em profundidade antes de pensar em recomposição.');
  if (profile.style === 'POSSE_DE_BOLA' && (selected === 'CMF' || selected === 'AMF' || selected === 'SS')) tips.push('Dica prática: na posse, a carta precisa oferecer linha curta; Passe de primeira, Controle com a sola e Passe na medida valem mais que correria isolada.');
  if (profile.style === 'POR_FORA' && (selected === 'LB' || selected === 'RB' || selected === 'LWF' || selected === 'RWF' || selected === 'LMF' || selected === 'RMF')) tips.push('Dica prática: por fora rende melhor com amplitude; force 2 contra 1 no corredor, cruze rasteiro/alto e tenha um CA atacando a primeira trave.');
  if (profile.style === 'PASSE_LONGO' && (selected === 'CF' || selected === 'CB' || selected === 'DMF')) tips.push('Dica prática: no passe longo, use zagueiros/volantes com lançamento e CA com físico; priorize segunda bola e não tente driblar no meio congestionado.');
  if (selected === 'CF') tips.push('Para CA, escolha habilidade de finalização primeiro; pressão só entra como plano alternativo se o atleta for pivô ou atacante de desgaste.');
  if (selected === 'DMF') tips.push('Para VOL, proteja a entrada da área: Interceptação, Bloqueador e Passe de primeira costumam render mais que subir demais.');
  if (!tips.length) tips.push(`Perfil tático automático: a ficha foi feita para o melhor rendimento da posição ${POSITION_PT[selected]}.`);
  return tips;
}

function compareTraining(autoPlan: TrainingPlan | null | undefined, recommended: TrainingPlan): TrainingComparisonItem[] {
  return TRAINING_KEYS.map((key) => {
    const auto = Number(autoPlan?.[key] ?? 0);
    const rec = Number(recommended[key] ?? 0);
    return { key, label: TRAINING_LABELS[key], auto, recommended: rec, difference: rec - auto };
  }).filter((item) => item.auto > 0 || item.recommended > 0 || item.difference !== 0);
}

const GK_LINE_TRAINING_KEYS: TrainingKey[] = ['shooting','passing','dribbling','defending'];
function shiftTraining(plan: TrainingPlan, changes: Partial<Record<TrainingKey, number>>, zero: TrainingKey[] = []): TrainingPlan {
  const next = { ...plan };
  for (const [key, delta] of Object.entries(changes) as Array<[TrainingKey, number]>) next[key] = Math.max(0, next[key] + delta);
  for (const key of zero) next[key] = 0;
  return normalizeTrainingPlan(next);
}

function softenTraining(plan: TrainingPlan, position: PositionCode): TrainingPlan {
  if (position === 'GK') return shiftTraining(plan, { gk1:1, gk2:1, lowerBodyStrength:-1 }, GK_LINE_TRAINING_KEYS);
  if (position === 'DMF' || position === 'CMF') return shiftTraining(plan, { defending:1, passing:1, dribbling:-1 });
  if (position === 'CB') return shiftTraining(plan, { defending:1, aerialStrength:1, shooting:-1 });
  if (position === 'CF') return shiftTraining(plan, { shooting:1, defending:-1 });
  return shiftTraining(plan, { dexterity:1, aerialStrength:-1 });
}

function aggressiveTraining(plan: TrainingPlan, position: PositionCode): TrainingPlan {
  if (position === 'GK') return shiftTraining(plan, { gk2:1, gk3:1, aerialStrength:-1 }, GK_LINE_TRAINING_KEYS);
  if (position === 'DMF' || position === 'CMF') return shiftTraining(plan, { lowerBodyStrength:1, passing:1, aerialStrength:-1 });
  if (position === 'CB') return shiftTraining(plan, { lowerBodyStrength:1, defending:1, dribbling:-1 });
  if (position === 'CF' || position === 'LWF' || position === 'RWF') return shiftTraining(plan, { shooting:1, dexterity:1, defending:-1 });
  return shiftTraining(plan, { dribbling:1, passing:1, defending:-1 });
}

const TRAINING_GROUP_ATTRIBUTES: Record<TrainingKey, AttributeKey[]> = {
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

const IDENTITY_CORE_GROUPS: Record<PositionCode, TrainingKey[]> = {
  CF: ['shooting','dexterity','lowerBodyStrength','aerialStrength'],
  SS: ['shooting','passing','dribbling','dexterity'],
  LWF: ['shooting','dribbling','dexterity','lowerBodyStrength'],
  RWF: ['shooting','dribbling','dexterity','lowerBodyStrength'],
  LMF: ['passing','dribbling','dexterity','lowerBodyStrength','defending'],
  RMF: ['passing','dribbling','dexterity','lowerBodyStrength','defending'],
  AMF: ['shooting','passing','dribbling','dexterity'],
  CMF: ['passing','dribbling','lowerBodyStrength','defending'],
  DMF: ['passing','lowerBodyStrength','aerialStrength','defending'],
  CB: ['passing','lowerBodyStrength','aerialStrength','defending'],
  LB: ['passing','dribbling','dexterity','lowerBodyStrength','defending'],
  RB: ['passing','dribbling','dexterity','lowerBodyStrength','defending'],
  GK: ['gk1','gk2','gk3','aerialStrength','lowerBodyStrength']
};

function trainingGroupAverage(key: TrainingKey, a: Required<Attributes>) {
  return avg(...TRAINING_GROUP_ATTRIBUTES[key].map((attribute) => a[attribute]));
}

function addSkillIdentityWeights(weights: Record<TrainingKey, number>, parsed: ParsedCard) {
  const names = Array.from(new Set([...(parsed.nativeSkills ?? []), ...(parsed.additionalSkills ?? []), ...(parsed.specialSkills ?? []), ...(parsed.impetos ?? []).map((item) => item.name), parsed.specialTag ?? ''].filter(Boolean)));
  const add = (key: TrainingKey, amount: number) => { weights[key] += amount; };
  for (const name of names) {
    const canonicalName = canonicalSkillName(name) ?? name;
    for (const [key, value] of Object.entries(SPECIAL_SKILL_ANALYSIS_META[canonicalName]?.identity ?? {}) as Array<[TrainingKey, number]>) add(key, value);
    const boosts = SKILL_PROFILES[canonicalName]?.boosts ?? {};
    for (const [boost, amountRaw] of Object.entries(boosts)) {
      const amount = Number(amountRaw) * .12;
      if (boost === 'finishing') add('shooting', amount);
      if (boost === 'creation') add('passing', amount);
      if (boost === 'dribbling') add('dribbling', amount);
      if (boost === 'mobility') { add('dexterity', amount * .65); add('lowerBodyStrength', amount * .35); }
      if (boost === 'defense') add('defending', amount);
      if (boost === 'pressure') { add('defending', amount * .55); add('lowerBodyStrength', amount * .45); }
      if (boost === 'physical') { add('lowerBodyStrength', amount * .55); add('aerialStrength', amount * .45); }
      if (boost === 'aerial') add('aerialStrength', amount);
      if (boost === 'stamina') add('lowerBodyStrength', amount);
      if (boost === 'goalkeeper') { add('gk1', amount * .34); add('gk2', amount * .36); add('gk3', amount * .3); }
    }
  }
}

function addPlaystyleIdentityWeights(weights: Record<TrainingKey, number>, parsed: ParsedCard, position: PositionCode) {
  const style = styleText(parsed.playstyle);
  const add = (key: TrainingKey, amount: number) => { weights[key] += amount; };
  if (/armador criativo|creative playmaker|classico 10|clássico 10|orquestrador/.test(style)) { add('passing',1.15); add('dribbling',.55); }
  if (/jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/.test(style)) { add('dexterity',1.1); add('shooting',.75); }
  if (/artilheiro|goal poacher|atacante matador/.test(style)) { add('shooting',1.25); add('dexterity',.65); }
  if (/homem de area|homem de área|fox in the box/.test(style)) { add('shooting',1.05); add('aerialStrength',1.0); }
  if (/pivo|pivô|target man|puxa marcacao|puxa marcação/.test(style)) { add('lowerBodyStrength',1.1); add('passing',.7); add('aerialStrength',.65); }
  if (/ala produtivo|ponta prolifico|ponta prolífico|prolific winger/.test(style)) { add('dribbling',.95); add('dexterity',.85); add('shooting',.45); }
  if (/lateral movel|lateral móvel|roaming flank|flanco movel|flanco móvel/.test(style)) { add('dexterity',.9); add('lowerBodyStrength',.85); add('dribbling',.55); }
  if (/perito em cruzamento|cross specialist/.test(style)) { add('passing',1.3); add('lowerBodyStrength',.45); }
  if (/primeiro volante|anchor man|ancora|âncora/.test(style)) { add('defending',1.25); add('lowerBodyStrength',.65); }
  if (/destruidor|destroyer/.test(style)) { add('defending',1.35); add('lowerBodyStrength',.7); }
  if (/defensor criativo|build up/.test(style)) { add('defending',.9); add('passing',.85); }
  if (/lateral ofensivo|offensive full-back|lateral atacante/.test(style)) { add('lowerBodyStrength',.85); add('passing',.75); add('dexterity',.55); }
  if (/lateral defensivo|defensive full-back/.test(style)) { add('defending',1.1); add('lowerBodyStrength',.65); }
  if (/goleiro ofensivo/.test(style) && position === 'GK') { add('gk2',.9); add('gk3',.75); add('lowerBodyStrength',.35); }
  if (/goleiro defensivo/.test(style) && position === 'GK') { add('gk1',.9); add('gk2',.75); }
}

function individualTrainingAdjustments(position: PositionCode, a: Required<Attributes>, parsed: ParsedCard): Record<TrainingKey, number> {
  const weights = emptyTraining();
  const active = position === 'GK' ? IDENTITY_CORE_GROUPS.GK : NON_GK_TRAINING_KEYS;
  const playerMean = avg(...active.map((key) => trainingGroupAverage(key, a)));
  const reference = BASE_BY_POSITION[position];
  const core = IDENTITY_CORE_GROUPS[position];

  for (const key of active) {
    const current = trainingGroupAverage(key, a);
    const target = trainingGroupAverage(key, reference);
    const standout = current - playerMean;
    const gap = target - current;
    // A posição define o mínimo funcional, mas a identidade da carta define onde vale especializar.
    weights[key] += Math.max(-.55, Math.min(1.15, standout / 13));
    if (core.includes(key)) weights[key] += Math.max(-.45, Math.min(1.2, gap / 13));
    else if (gap > 8) weights[key] -= Math.min(.55, gap / 28);
    if (current >= target + 7) weights[key] -= .22; // evita inflar atributo já saturado
  }

  addPlaystyleIdentityWeights(weights, parsed, position);
  addSkillIdentityWeights(weights, parsed);

  if (parsed.height) {
    if (parsed.height >= 190) { weights.aerialStrength += .8; weights.dexterity -= .18; }
    else if (parsed.height <= 175) { weights.dexterity += .45; weights.aerialStrength -= .5; }
  }
  if (parsed.weight) {
    if (parsed.weight >= 88) { weights.lowerBodyStrength += .42; weights.aerialStrength += .22; }
    else if (parsed.weight <= 68) { weights.dribbling += .32; weights.dexterity += .28; weights.aerialStrength -= .22; }
  }

  return weights;
}

function identityHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

function buildPlayerIdentity(parsed: ParsedCard, selected: PositionCode, a: Required<Attributes>): PlayerIdentityAnalysis {
  const keys = selected === 'GK' ? IDENTITY_CORE_GROUPS.GK : NON_GK_TRAINING_KEYS;
  const scores = keys.map((key) => ({ key, score: trainingGroupAverage(key, a) })).sort((left, right) => right.score - left.score);
  const reference = BASE_BY_POSITION[selected];
  const corrections = IDENTITY_CORE_GROUPS[selected]
    .map((key) => ({ key, gap: trainingGroupAverage(key, reference) - trainingGroupAverage(key, a) }))
    .filter((item) => item.gap > 4)
    .sort((left, right) => right.gap - left.gap)
    .slice(0, 3);
  const localRule = findOfficialCardRule(parsed.playerName, parsed.playerName);
  const skillNames = Array.from(new Set([...(parsed.specialSkills ?? []), ...(parsed.nativeSkills ?? [])]));
  const profileLabel = scores.slice(0, 2).map((item) => TRAINING_LABELS[item.key]).join(' + ') || POSITION_PT[selected];
  const signatureSource = [parsed.playerName, parsed.playstyle ?? '', selected, parsed.height ?? '', parsed.weight ?? '', ...scores.map((item) => `${item.key}:${Math.round(item.score)}`), ...skillNames.sort()].join('|');
  const evidence = parsed.evidence.attributeCount * 2.6 + (parsed.playstyle ? 12 : 0) + Math.min(18, skillNames.length * 3) + (parsed.height ? 5 : 0) + (parsed.weight ? 4 : 0);
  const decisiveFactors = [
    `Posição escolhida: ${POSITION_PT[selected]}.`,
    parsed.playstyle ? `Estilo de Jogo oficial preservado: ${parsed.playstyle}.` : 'Estilo de Jogo não confirmado; a identidade foi calculada pelos atributos.',
    skillNames.length ? `${skillNames.length} habilidade(s) confirmada(s) influenciaram os pesos da ficha.` : 'Nenhuma habilidade confirmada alterou artificialmente a distribuição.',
    parsed.height || parsed.weight ? `Perfil físico considerado${parsed.height ? `: ${parsed.height} cm` : ''}${parsed.weight ? `, ${parsed.weight} kg` : ''}.` : 'Altura e peso não confirmados; nenhum perfil físico foi inventado.'
  ];
  if (localRule?.note) decisiveFactors.push(localRule.note);
  return {
    signature: `ID-${identityHash(signatureSource)}`,
    profileLabel: `Perfil técnico da carta: ${profileLabel}`,
    individualityScore: Math.round(clampDecimal(evidence, 35, 99)),
    naturalStrengths: scores.slice(0, 4).map((item) => `${TRAINING_LABELS[item.key]} (${Math.round(item.score)})`),
    criticalCorrections: corrections.length ? corrections.map((item) => `${TRAINING_LABELS[item.key]} precisa de correção funcional para ${POSITION_PT[selected]}.`) : [`A carta já possui uma base funcional equilibrada para ${POSITION_PT[selected]}.`],
    decisiveFactors,
    protectedCharacteristics: scores.slice(0, 3).map((item) => `${TRAINING_LABELS[item.key]} foi preservado como característica natural, sem copiar um molde genérico da posição.`),
    localReference: localRule?.note ?? null,
    note: 'Este perfil é descritivo do app, não um novo Estilo de Jogo oficial. A ficha é calculada pela identidade desta carta e pode coincidir com outra apenas quando os dados forem realmente muito parecidos.'
  };
}

function positionRequirementWeights(position: PositionCode, objective: Objective, a: Required<Attributes>): Record<TrainingKey, number> {
  const weights: Record<TrainingKey, number> = { shooting: .3, passing: .5, dribbling: .5, dexterity: .6, lowerBodyStrength: .6, aerialStrength: .3, defending: .3, gk1: 0, gk2: 0, gk3: 0 };
  const add = (key: TrainingKey, value: number) => { weights[key] += value; };
  if (position === 'GK') return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: .45, aerialStrength: .35, defending: 0, gk1: 2.2, gk2: 2.35, gk3: 2.1 };
  if (position === 'CB') { add('defending', 2.4); add('aerialStrength', a.heading < 80 || a.jump < 80 ? 1.4 : .8); add('lowerBodyStrength', a.speed < 80 ? 1.35 : .85); add('passing', a.lowPass >= 76 ? .55 : .15); }
  if (position === 'DMF') { add('defending', 2.0); add('passing', 1.25); add('lowerBodyStrength', 1.15); add('dexterity', .35); }
  if (position === 'CMF') { add('passing', 1.8); add('lowerBodyStrength', 1.0); add('dexterity', .8); add('dribbling', .65); add('defending', .65); }
  if (position === 'AMF') { add('passing', 1.8); add('dribbling', 1.35); add('dexterity', 1.1); add('shooting', .75); }
  if (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') { add('lowerBodyStrength', 1.5); add('passing', 1.05); add('dexterity', 1.0); add('defending', position === 'LB' || position === 'RB' ? .95 : .4); add('dribbling', .7); }
  if (position === 'LWF' || position === 'RWF') { add('dribbling', 1.75); add('dexterity', 1.55); add('lowerBodyStrength', 1.2); add('shooting', .9); add('passing', .55); }
  if (position === 'SS') { add('dexterity', 1.5); add('shooting', 1.25); add('dribbling', 1.15); add('passing', 1.0); add('lowerBodyStrength', .75); }
  if (position === 'CF') { add('shooting', 2.15); add('dexterity', 1.3); add('lowerBodyStrength', 1.15); add('aerialStrength', a.heading >= 78 || a.physicalContact >= 82 ? .95 : .35); add('dribbling', .45); }
  if (objective === 'DEFENSIVE') { add('defending', .55); add('aerialStrength', .2); }
  if (objective === 'CREATOR') { add('passing', .55); add('dribbling', .35); }
  if (objective === 'FINISHER') { add('shooting', .65); add('dexterity', .25); }
  if (objective === 'DRIBBLER') { add('dribbling', .65); add('dexterity', .35); }
  if (objective === 'PRESSING') { add('defending', .35); add('lowerBodyStrength', .45); }
  if (objective === 'POSSESSION') { add('passing', .45); add('dribbling', .3); }
  if (objective === 'QUICK_COUNTER') { add('dexterity', .35); add('lowerBodyStrength', .45); }
  if (objective === 'AERIAL') { add('aerialStrength', .7); }
  if (objective === 'META_2026') {
    if (position === 'CB' || position === 'DMF') { add('defending', .72); add('lowerBodyStrength', .28); add('passing', .12); }
    else if (position === 'CF') { add('shooting', .58); add('dexterity', .34); add('lowerBodyStrength', .18); }
    else if (position === 'LWF' || position === 'RWF' || position === 'SS' || position === 'AMF') { add('dribbling', .48); add('dexterity', .42); add('shooting', .28); }
    else { add('passing', .36); add('dribbling', .22); add('lowerBodyStrength', .22); add('defending', .14); }
  }
  return weights;
}

function adaptiveTrainingWeights(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): Record<TrainingKey, number> {
  const weights = positionRequirementWeights(position, objective, a);
  const individual = individualTrainingAdjustments(position, a, parsed);
  for (const key of TRAINING_KEYS) weights[key] += individual[key];
  return weights;
}

function planDistance(left: TrainingPlan, right: TrainingPlan, keys: TrainingKey[]) {
  return keys.reduce((sum, key) => sum + Math.abs((left[key] ?? 0) - (right[key] ?? 0)), 0);
}

function scorePlanByWeights(plan: TrainingPlan, weights: Record<TrainingKey, number>, budget: number, saturationBoost: Partial<Record<TrainingKey, number>> = {}) {
  const used = trainingPlanTotalCost(plan);
  let value = 0;
  let waste = 0;
  for (const key of TRAINING_KEYS) {
    const level = plan[key];
    const saturationStart = saturationBoost[key] ?? 10;
    const effectiveLevel = Math.min(level, saturationStart) + Math.max(0, level - saturationStart) * .32;
    value += effectiveLevel * Math.max(.02, weights[key]);
    if (weights[key] <= .35 && level > 3) waste += (level - 3) * 1.45;
    if (level > saturationStart) waste += (level - saturationStart) * 1.2;
  }
  const unused = Math.max(0, budget - used);
  const efficiency = used > 0 ? value / used : 0;
  return value * 5.2 + efficiency * 18 - waste * 4 - unused * .18;
}

function adaptationAssessment(position: PositionCode, parsed: ParsedCard, a: Required<Attributes>) {
  const score = clampDecimal(positionScore(position, a, parsed.nativeSkills, parsed.positionRatings), 1, 100);
  if (score >= 82) return { label: 'Adaptação excelente', risk: 'Poucas limitações estruturais para a posição escolhida.' };
  if (score >= 72) return { label: 'Adaptação boa', risk: 'A ficha corrige as principais lacunas sem descaracterizar o jogador.' };
  if (score >= 60) return { label: 'Adaptação razoável', risk: 'Pode render bem, mas ainda terá limitações naturais em alguns confrontos.' };
  return { label: 'Adaptação difícil', risk: 'A posição foi respeitada, porém existem limitações naturais que treino nenhum elimina por completo.' };
}

function planBalanceScore(plan: TrainingPlan, keys: TrainingKey[]) {
  const active = keys.map((key) => plan[key]).filter((value) => value > 0);
  if (!active.length) return 1;
  const average = active.reduce((sum, value) => sum + value, 0) / active.length;
  const variance = active.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / active.length;
  return Math.round(clampDecimal(100 - Math.sqrt(variance) * 8.5, 1, 99));
}

function scenarioScores(plan: TrainingPlan, position: PositionCode, _objective: Objective) {
  const n = (key: TrainingKey) => Number(plan[key] ?? 0);
  const scale = (raw: number) => Math.round(clampDecimal(42 + raw * 4.6, 1, 99));
  const goalkeeper = position === 'GK';
  if (goalkeeper) {
    return {
      possession: scale(n('gk1') * .45 + n('lowerBodyStrength') * .25 + n('gk3') * .3),
      counterAttack: scale(n('gk2') * .4 + n('gk3') * .35 + n('lowerBodyStrength') * .25),
      pressing: scale(n('gk2') * .55 + n('gk1') * .25 + n('lowerBodyStrength') * .2),
      physicalDuels: scale(n('gk1') * .35 + n('gk3') * .35 + n('aerialStrength') * .3),
      consistency: scale(n('gk1') * .34 + n('gk2') * .33 + n('gk3') * .33)
    };
  }
  const defensive = position === 'CB' || position === 'DMF' || position === 'LB' || position === 'RB';
  const attacking = position === 'CF' || position === 'SS' || position === 'LWF' || position === 'RWF' || position === 'AMF';
  return {
    possession: scale(n('passing') * .38 + n('dribbling') * .25 + n('dexterity') * .2 + n('lowerBodyStrength') * .1 + n('defending') * .07),
    counterAttack: scale(n('lowerBodyStrength') * .32 + n('dexterity') * .28 + n('shooting') * (attacking ? .24 : .08) + n('passing') * .16),
    pressing: scale(n('lowerBodyStrength') * .28 + n('dexterity') * .2 + n('defending') * (defensive ? .38 : .18) + n('passing') * .08 + n('dribbling') * .06),
    physicalDuels: scale(n('aerialStrength') * .36 + n('lowerBodyStrength') * .32 + n('defending') * (defensive ? .25 : .1) + n('shooting') * (position === 'CF' ? .12 : 0)),
    consistency: scale(n('passing') * .17 + n('dribbling') * .14 + n('dexterity') * .19 + n('lowerBodyStrength') * .2 + n('defending') * (defensive ? .2 : .1) + n('shooting') * (attacking ? .1 : .03) + n('aerialStrength') * .07)
  };
}

function genericPositionTemplateCard(parsed: ParsedCard): ParsedCard {
  return { ...parsed, playerName:'Modelo genérico da posição', playstyle:null, nativeSkills:[], additionalSkills:[], specialSkills:[], impetos:[], specialTag:null, height:null, weight:null, evidence:{...parsed.evidence, localRuleMatched:null} };
}

function buildTrainingVariants(selected: PositionCode, selectedLabel: string, training: TrainingPlan, _scored: Array<{ code: PositionCode; label: string; score: number }>, budget: number, objective: Objective, parsed: ParsedCard, executionModeR142: 'FULL' | 'PRODUCTION_BASE' = 'FULL'): BuildVariant[] {
  const attributes = fillAttributes(parsed);
  const basePriority = trainingTemplate(selected, objective, attributes, parsed).priority;
  const candidates: TrainingPlan[] = [];
  const seen = new Set<string>();
  const push = (plan: TrainingPlan) => {
    const fitted = fitTrainingToBudget(normalizeTrainingPlan(plan), basePriority, budget);
    const key = JSON.stringify(fitted);
    if (!seen.has(key)) { seen.add(key); candidates.push(fitted); }
  };
  push(training); push(softenTraining(training, selected)); push(aggressiveTraining(training, selected));
  const keys = dnaGroupKeys(selected);
  // R142: em produção o Clean Slate é o único escritor final; não há retorno em enumerar
  // centenas de distribuições provisórias que serão descartadas alguns milissegundos depois.
  // O modo FULL continua intacto para regressões/diagnósticos históricos.
  if (executionModeR142 === 'FULL') {
    for (const plus of keys) for (const minus of keys) {
      if (plus === minus) continue;
      for (const amount of [1, 2, 3, 4]) {
        const shifted = { ...training };
        shifted[plus] += amount;
        shifted[minus] = Math.max(0, shifted[minus] - amount);
        push(shifted);
      }
    }
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      for (const minus of keys) {
        if (minus === keys[i] || minus === keys[j]) continue;
        for (const amount of [1, 2]) {
          const mixed = { ...training };
          mixed[keys[i]] += amount;
          mixed[keys[j]] += amount;
          mixed[minus] = Math.max(0, mixed[minus] - amount * 2);
          push(mixed);
        }
      }
    }
  }

  const individualWeights = individualTrainingAdjustments(selected, attributes, parsed);
  const requirementWeights = positionRequirementWeights(selected, objective, attributes);
  const hybridWeights = { ...requirementWeights };
  for (const key of TRAINING_KEYS) hybridWeights[key] += individualWeights[key];
  const scoringKeys = selected === 'GK' ? IDENTITY_CORE_GROUPS.GK : NON_GK_TRAINING_KEYS;
  const identityMean = avg(...scoringKeys.map((key) => trainingGroupAverage(key, attributes)));
  const identityScoreWeights = emptyTraining();
  for (const key of scoringKeys) identityScoreWeights[key] = .45 + Math.max(-.15, (trainingGroupAverage(key, attributes) - identityMean) / 10) + Math.max(0, individualWeights[key]) * 1.45;
  const adaptationScoreWeights = emptyTraining();
  const reference = BASE_BY_POSITION[selected], core = IDENTITY_CORE_GROUPS[selected];
  for (const key of TRAINING_KEYS) {
    const gap = trainingGroupAverage(key, reference) - trainingGroupAverage(key, attributes);
    adaptationScoreWeights[key] = requirementWeights[key] + (core.includes(key) ? Math.max(0, gap) / 8 : Math.max(0, gap) / 18);
  }
  const saturationBoost = selected === 'GK' ? { gk1: 12, gk2: 12, gk3: 12 } : { defending: selected === 'CB' || selected === 'DMF' ? 12 : 10, shooting: selected === 'CF' ? 12 : 10 };
  const hybridScore = (plan: TrainingPlan) => scorePlanByWeights(plan, hybridWeights, budget, saturationBoost);
  const identityScore = (plan: TrainingPlan) => scorePlanByWeights(plan, identityScoreWeights, budget);
  const adaptationScore = (plan: TrainingPlan) => scorePlanByWeights(plan, adaptationScoreWeights, budget, saturationBoost);
  const hybridRanked = candidates.map((plan) => ({ plan, score: hybridScore(plan) })).sort((a,b) => b.score-a.score);
  const identityRanked = candidates.map((plan) => ({ plan, score: identityScore(plan) })).sort((a,b) => b.score-a.score);
  const adaptationRanked = candidates.map((plan) => ({ plan, score: adaptationScore(plan) })).sort((a,b) => b.score-a.score);

  const genericParsed = genericPositionTemplateCard(parsed);
  const genericPlan = trainingFor(selected, objective, BASE_BY_POSITION[selected], genericParsed, individualTrainingAdjustments);
  const evidenceStrength = parsed.evidence.attributeCount * 2 + (parsed.playstyle ? 10 : 0) + Math.min(16, (parsed.nativeSkills.length + (parsed.additionalSkills?.length ?? 0) + parsed.specialSkills.length) * 2) + (parsed.height ? 4 : 0) + (parsed.weight ? 3 : 0);
  let hybrid = hybridRanked[0]?.plan ?? training;
  let antiCloneAdjusted = false;
  if (evidenceStrength >= 34 && planDistance(hybrid, genericPlan, keys) < 3) {
    const topScore = hybridRanked[0]?.score ?? 0;
    const alternative = hybridRanked.find((item) => item.score >= topScore - Math.abs(topScore) * .1 && planDistance(item.plan, genericPlan, keys) >= 3);
    if (alternative) { hybrid = alternative.plan; antiCloneAdjusted = true; }
  }

  const usedKeys = new Set([JSON.stringify(hybrid)]);
  const chooseDistinct = (ranked: Array<{ plan: TrainingPlan; score: number }>, fallback: TrainingPlan) => {
    const found = ranked.find((item) => !usedKeys.has(JSON.stringify(item.plan)))?.plan ?? fallback;
    usedKeys.add(JSON.stringify(found));
    return found;
  };
  const identity = chooseDistinct(identityRanked, hybridRanked[1]?.plan ?? hybrid);
  const adaptation = chooseDistinct(adaptationRanked, hybridRanked[2]?.plan ?? hybrid);

  const maxHybrid = Math.max(1, hybridRanked[0]?.score ?? 1);
  const maxIdentity = Math.max(1, identityRanked[0]?.score ?? 1);
  const maxAdaptation = Math.max(1, adaptationRanked[0]?.score ?? 1);
  const quality = (plan: TrainingPlan) => {
    const h = hybridScore(plan) / maxHybrid;
    const i = identityScore(plan) / maxIdentity;
    const a = adaptationScore(plan) / maxAdaptation;
    return Math.round(clampDecimal(74 + (h * .5 + i * .27 + a * .23) * 24, 1, 99));
  };
  const efficiency = (plan: TrainingPlan) => {
    const used = Math.max(1, trainingPlanTotalCost(plan));
    const relative = hybridScore(plan) / used;
    const bestRelative = Math.max(...hybridRanked.map(({plan: item}) => hybridScore(item) / Math.max(1, trainingPlanTotalCost(item))));
    return Math.round(clampDecimal(68 + (relative / Math.max(.01, bestRelative)) * 31, 1, 99));
  };
  const adapt = adaptationAssessment(selected, parsed, attributes);
  const label = (key: TrainingKey) => TRAINING_LABELS[key];
  const identityKeys = [...keys].sort((a,b)=>individualWeights[b]-individualWeights[a]).slice(0,3);
  const adaptationKeys = [...keys].sort((a,b)=>requirementWeights[b]-requirementWeights[a]).slice(0,3);
  const hybridKeys = [...keys].sort((a,b)=>hybridWeights[b]-hybridWeights[a]).slice(0,3);
  const make = (kind: BuildVariant['kind'], title: string, plan: TrainingPlan, highlights: string[], risks: string[], note: string, verdict: string, tradeOffs: string[]): BuildVariant => ({
    kind, title, positionLabel: selectedLabel, training: plan, pointsUsed: trainingPlanTotalCost(plan), qualityScore: quality(plan), adaptationLabel: adapt.label,
    efficiencyScore: efficiency(plan), balanceScore: planBalanceScore(plan, keys), scenarioScores: scenarioScores(plan, selected, objective), simulationsTested: candidates.length,
    highlights, risks, note, verdict, tradeOffs
  });
  return [
    make('competitive', 'Ficha híbrida DNA — recomendada', hybrid, [
      ...hybridKeys.map((key)=>`Equilibra identidade e exigência de ${selectedLabel} em ${label(key)}`),
      antiCloneAdjusted ? 'Detector anticlone afastou a distribuição do molde genérico da posição.' : 'A distribuição já apresentou distância segura do molde genérico.'
    ], [adapt.risk], 'Combina as qualidades naturais desta carta com as correções realmente necessárias para a posição escolhida.', 'Melhor escolha geral para manter o jogador reconhecível e, ao mesmo tempo, funcional na nova posição.', ['Não maximiza um único setor: prioriza o melhor desempenho total desta versão da carta.']),
    make('alternative', 'Ficha identidade', identity, identityKeys.map((key)=>`Protege e amplia ${label(key)} como diferencial natural`), ['Pode manter uma limitação da posição quando corrigi-la custaria identidade demais.'], 'Preserva ao máximo a maneira natural desta carta jogar, incluindo Estilo de Jogo, físico e habilidades confirmadas.', 'Indicada quando você quer que o jogador continue parecendo com sua identidade real dentro da posição escolhida.', ['Entrega menos correção estrutural do que a ficha de adaptação.']),
    make('safe', 'Ficha adaptação', adaptation, adaptationKeys.map((key)=>`Corrige a exigência funcional de ${selectedLabel} em ${label(key)}`), [adapt.risk], 'Prioriza as lacunas mais importantes da posição escolhida e limita investimentos em características secundárias.', 'Indicada quando a prioridade é transformar a carta para cumprir melhor as exigências da posição escolhida.', ['Pode reduzir parte da especialização natural para corrigir fraquezas críticas.'])
  ];
}

function dnaGroupKeys(position: PositionCode): TrainingKey[] { return position === 'GK' ? GK_DNA_TRAINING_KEYS : NON_GK_TRAINING_KEYS; }

function buildIndividualGoals(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): IndividualAttributeGoal[] {
  const reference = BASE_BY_POSITION[position];
  const keys = dnaGroupKeys(position);
  const mean = avg(...keys.map((key) => trainingGroupAverage(key, a)));
  const identity = individualTrainingAdjustments(position, a, parsed);
  const requirements = positionRequirementWeights(position, objective, a);
  const core = IDENTITY_CORE_GROUPS[position];
  return keys.map((key) => {
    const current = trainingGroupAverage(key, a);
    const target = trainingGroupAverage(key, reference);
    const natural = current >= mean + 4;
    const gap = target - current;
    let priority: IndividualAttributeGoal['priority'] = 'manter';
    if (natural && identity[key] >= .35) priority = 'proteger';
    if (core.includes(key) && gap > 5) priority = 'corrigir';
    if (natural && identity[key] >= 1.05 && requirements[key] >= .8) priority = 'especializar';
    const functionalMin = Math.round(clampDecimal(target - (core.includes(key) ? 2 : 5), 45, 94));
    const personalizedIdeal = Math.round(clampDecimal(
      priority === 'corrigir' ? Math.max(functionalMin, target + 1) :
      priority === 'especializar' ? Math.max(current + 4, target + 2) :
      priority === 'proteger' ? Math.max(current + 2, functionalMin) : Math.max(current, functionalMin),
      45, 99
    ));
    const recommendedCeiling = Math.round(clampDecimal(Math.max(personalizedIdeal, current + (priority === 'especializar' ? 6 : 3)), 48, 99));
    const reason = priority === 'corrigir'
      ? `${TRAINING_LABELS[key]} está abaixo da necessidade funcional de ${POSITION_PT[position]}, mas será corrigido apenas até uma faixa eficiente.`
      : priority === 'especializar'
        ? `${TRAINING_LABELS[key]} é forte nesta carta e também ajuda diretamente a posição escolhida.`
        : priority === 'proteger'
          ? `${TRAINING_LABELS[key]} é parte da identidade natural e não deve ser sacrificado para copiar um molde da posição.`
          : `${TRAINING_LABELS[key]} já está em faixa aceitável; o motor evita investimento excessivo.`;
    return { training:key, label:TRAINING_LABELS[key], current:Math.round(current), functionalMin, personalizedIdeal, recommendedCeiling, priority, reason };
  }).sort((left,right) => {
    const rank = { corrigir:4, especializar:3, proteger:2, manter:1 } as const;
    return rank[right.priority] - rank[left.priority] || right.personalizedIdeal - left.personalizedIdeal;
  });
}

function buildSelectiveWeaknesses(position: PositionCode, a: Required<Attributes>, parsed: ParsedCard): SelectiveWeaknessStrategy[] {
  const reference = BASE_BY_POSITION[position];
  const core = IDENTITY_CORE_GROUPS[position];
  return dnaGroupKeys(position).map((key) => {
    const current = trainingGroupAverage(key, a);
    const target = trainingGroupAverage(key, reference);
    const gap = Math.max(0, target - current);
    let correctability: SelectiveWeaknessStrategy['correctability'] = gap <= 6 ? 'alta' : gap <= 12 ? 'parcial' : 'baixa';
    if (key === 'aerialStrength' && parsed.height != null && parsed.height <= 175) correctability = 'baixa';
    if (key === 'lowerBodyStrength' && parsed.weight != null && parsed.weight >= 90 && a.acceleration < 72) correctability = 'parcial';
    const importance: SelectiveWeaknessStrategy['importance'] = core.includes(key) && gap >= 8 ? 'crítica' : gap >= 5 ? 'relevante' : 'aceitável';
    const maxInvestment = correctability === 'alta' ? 9 : correctability === 'parcial' ? 6 : 4;
    const strategy = gap <= 3
      ? 'Não precisa de correção relevante; preservar pontos para diferenciais da carta.'
      : correctability === 'baixa'
        ? `Fazer apenas correção funcional em ${TRAINING_LABELS[key]}; tentar eliminar completamente a limitação desperdiçaria pontos.`
        : correctability === 'parcial'
          ? `Reduzir a fraqueza até uma faixa segura e compensar o restante com posicionamento, parceiro e plano de jogo.`
          : `Corrigir de forma direta porque o retorno por ponto ainda é alto para ${POSITION_PT[position]}.`;
    return { training:key, label:TRAINING_LABELS[key], current:Math.round(current), gap:Math.round(gap), importance, correctability, maxInvestment, strategy };
  }).filter((item) => item.gap > 2).sort((a,b) => (b.importance === 'crítica' ? 2 : b.importance === 'relevante' ? 1 : 0) - (a.importance === 'crítica' ? 2 : a.importance === 'relevante' ? 1 : 0) || b.gap-a.gap).slice(0,5);
}

function inferSkillTrainingGroups(name: string): TrainingKey[] {
  const boosts = SKILL_PROFILES[name]?.boosts ?? {};
  const groups = new Set<TrainingKey>();
  for (const boost of Object.keys(boosts)) {
    if (boost === 'finishing') groups.add('shooting');
    if (boost === 'creation') groups.add('passing');
    if (boost === 'dribbling') groups.add('dribbling');
    if (boost === 'mobility') { groups.add('dexterity'); groups.add('lowerBodyStrength'); }
    if (boost === 'defense' || boost === 'pressure') groups.add('defending');
    if (boost === 'physical' || boost === 'stamina') groups.add('lowerBodyStrength');
    if (boost === 'aerial') groups.add('aerialStrength');
    if (boost === 'goalkeeper') { groups.add('gk1'); groups.add('gk2'); groups.add('gk3'); }
  }
  return [...groups];
}

function buildSkillSynergies(parsed: ParsedCard, position: PositionCode, a: Required<Attributes>, plan: TrainingPlan): SpecialSkillSynergyItem[] {
  const names = Array.from(new Set([...(parsed.specialSkills ?? []), ...(parsed.nativeSkills ?? []), ...(parsed.impetos ?? []).map((item) => item.name), parsed.specialTag ?? ''].filter(Boolean)));
  return names.map((name) => {
    const canonicalName = canonicalSkillName(name) ?? name;
    const rule = SPECIAL_SKILL_ANALYSIS_META[canonicalName];
    const groups = rule?.groups ?? inferSkillTrainingGroups(canonicalName);
    const attrs = rule?.attrs ?? groups.flatMap((group) => TRAINING_GROUP_ATTRIBUTES[group] ?? []).slice(0,4);
    const attributeSupport = attrs.length ? Math.round(avg(...attrs.map((key) => a[key]))) : Math.round(avg(...IDENTITY_CORE_GROUPS[position].map((key) => trainingGroupAverage(key, a))));
    const positionFit = rule ? (rule.positions.includes(position) ? 96 : 48) : 72;
    const trainedSupport = groups.length ? Math.round(avg(...groups.map((group) => Math.min(100, trainingGroupAverage(group, a) + plan[group] * 1.15)))) : attributeSupport;
    const activationScore = Math.round(clampDecimal(attributeSupport * .42 + trainedSupport * .28 + positionFit * .3, 1, 99));
    const expectedFrequency: SpecialSkillSynergyItem['expectedFrequency'] = positionFit >= 88 ? 'alta' : positionFit >= 60 ? 'média' : 'baixa';
    const status: SpecialSkillSynergyItem['status'] = activationScore >= 90 ? 'aproveitamento máximo' : activationScore >= 76 ? 'bem aproveitada' : activationScore >= 58 ? 'parcial' : 'desperdiçada';
    const source: SpecialSkillSynergyItem['source'] = parsed.specialSkills.includes(name) || parsed.specialTag === name ? 'habilidade especial' : parsed.nativeSkills.includes(name) ? 'habilidade oficial' : 'ímpeto';
    const helpfulAttributes = attrs.slice(0,4).map((key) => ATTRIBUTE_PT[key]);
    const recommendation = rule
      ? `${rule.use}. ${activationScore < 76 ? `Reforce ${groups.map((group) => TRAINING_LABELS[group]).join(' e ')} somente até melhorar o suporte da habilidade.` : 'A base atual já permite usar a habilidade sem desviar demais a ficha.'}`
      : `A habilidade foi mantida no DNA da carta. O app usa os grupos ${groups.map((group) => TRAINING_LABELS[group]).join(', ') || 'relacionados à posição'} sem inventar requisitos não confirmados.`;
    const wasteRisk = expectedFrequency === 'baixa'
      ? `Na posição ${POSITION_PT[position]}, as situações de uso tendem a ser raras; não vale construir toda a ficha ao redor desta habilidade.`
      : attributeSupport < 70
        ? 'A habilidade existe, mas os atributos de suporte ainda limitam sua execução.'
        : null;
    return { name, source, activationScore, attributeSupport, positionFit, expectedFrequency, status, helpfulAttributes, trainingGroups:groups, recommendation, wasteRisk };
  }).sort((a,b)=>b.activationScore-a.activationScore);
}

function buildBehaviorSimulation(position: PositionCode, a: Required<Attributes>, plan: TrainingPlan, skillSynergies: SpecialSkillSynergyItem[]): OnFieldBehaviorSimulation {
  const boost = (key: TrainingKey) => plan[key] * 1.05;
  const score = (...values: number[]) => Math.round(clampDecimal(avg(...values), 1, 99));
  const passUnderPressure = score(a.ballControl + boost('dribbling'), a.tightPossession + boost('dribbling'), a.lowPass + boost('passing'), a.balance + boost('dexterity'));
  const turnAndCarry = score(a.ballControl + boost('dribbling'), a.dribbling + boost('dribbling'), a.tightPossession + boost('dribbling'), a.balance + boost('dexterity'), a.acceleration + boost('dexterity'));
  const offBallMovement = score(a.offensiveAwareness + boost('dexterity'), a.acceleration + boost('dexterity'), a.stamina + boost('lowerBodyStrength'));
  const defensiveRecovery = score(a.defensiveAwareness + boost('defending'), a.defensiveEngagement + boost('defending'), a.tackling + boost('defending'), a.speed + boost('lowerBodyStrength'), a.stamina + boost('lowerBodyStrength'));
  const physicalDuels = score(a.physicalContact + boost('aerialStrength'), a.balance + boost('dexterity'), a.jump + boost('aerialStrength'), a.heading + boost('aerialStrength'));
  const reactionSpeed = score(a.acceleration + boost('dexterity'), a.balance + boost('dexterity'), a.defensiveEngagement + boost('defending'));
  const matchConsistency = score(a.stamina + boost('lowerBodyStrength'), a.balance + boost('dexterity'), passUnderPressure, reactionSpeed);
  const creation = Math.round(clampDecimal(a.lowPass * .34 + a.loftedPass * .25 + a.ballControl * .22 + a.offensiveAwareness * .19 + boost('passing') * .72 + boost('dribbling') * .18, 1, 99));
  const finishing = Math.round(clampDecimal(a.finishing * .45 + a.kickingPower * .2 + a.offensiveAwareness * .25 + a.balance * .1 + boost('shooting') * .58 + boost('dexterity') * .16, 1, 99));
  const specialSkillUsage = skillSynergies.length ? Math.round(avg(...skillSynergies.map((item) => item.activationScore))) : 0;
  const entries = [
    ['Passe sob pressão',passUnderPressure],['Giro e condução',turnAndCarry],['Movimentação sem bola',offBallMovement],['Recuperação defensiva',defensiveRecovery],['Duelo físico',physicalDuels],['Velocidade de reação',reactionSpeed],['Consistência',matchConsistency],['Criação',creation],['Finalização',finishing],['Habilidades especiais',specialSkillUsage]
  ] as Array<[string,number]>;
  const ordered = [...entries].sort((a,b)=>b[1]-a[1]);
  const strongestBehaviors = ordered.filter(([,value])=>value>=75).slice(0,4).map(([label,value])=>`${label} (${value})`);
  const limitingBehaviors = [...ordered].reverse().filter(([,value])=>value<72).slice(0,3).map(([label,value])=>`${label} (${value})`);
  return {
    passUnderPressure, turnAndCarry, offBallMovement, defensiveRecovery, physicalDuels, reactionSpeed, matchConsistency, creation, finishing, specialSkillUsage,
    strongestBehaviors,
    limitingBehaviors,
    summary: `Na posição ${POSITION_PT[position]}, a projeção mais forte é ${ordered[0][0].toLowerCase()} (${ordered[0][1]}/100). ${limitingBehaviors.length ? `O principal limite provável é ${limitingBehaviors[0].toLowerCase()}.` : 'Não foi detectada limitação grave no comportamento simulado.'}`
  };
}

function buildAntiCloneAnalysis(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, variants: BuildVariant[]): AntiCloneAnalysis {
  const keys = dnaGroupKeys(position);
  const genericParsed = genericPositionTemplateCard(parsed);
  const genericPlan = trainingFor(position, objective, BASE_BY_POSITION[position], genericParsed, individualTrainingAdjustments);
  const mainPlan = variants[0]?.training ?? emptyTraining();
  const distanceFromGenericTemplate = planDistance(mainPlan, genericPlan, keys);
  const individual = individualTrainingAdjustments(position, a, parsed);
  const requirements = positionRequirementWeights(position, objective, a);
  const individualMagnitude = keys.reduce((sum,key)=>sum+Math.abs(individual[key]),0);
  const totalMagnitude = individualMagnitude + keys.reduce((sum,key)=>sum+Math.abs(requirements[key]),0);
  const identityContribution = Math.round(clampDecimal((individualMagnitude / Math.max(.01,totalMagnitude))*100, 1, 99));
  const positionTemplateContribution = 100-identityContribution;
  const pairDistances:number[]=[];
  for(let i=0;i<variants.length;i++) for(let j=i+1;j<variants.length;j++) pairDistances.push(planDistance(variants[i].training,variants[j].training,keys));
  const distributionDiversity = Math.round(clampDecimal((pairDistances.length?avg(...pairDistances):0)*8,1,99));
  const evidence = parsed.evidence.attributeCount*2 + (parsed.playstyle?10:0) + Math.min(18,(parsed.nativeSkills.length+(parsed.additionalSkills?.length??0)+parsed.specialSkills.length)*2) + (parsed.height?4:0) + (parsed.weight?3:0);
  const individualityScore = Math.round(clampDecimal(identityContribution*.48 + Math.min(100,evidence)*.27 + Math.min(100,distanceFromGenericTemplate*12)*.25, 20,99));
  const cloneRisk: AntiCloneAnalysis['cloneRisk'] = individualityScore>=76 && distanceFromGenericTemplate>=3 ? 'baixo' : individualityScore>=55 ? 'médio' : 'alto';
  const recalculationTriggered = evidence>=34 && distanceFromGenericTemplate>=3;
  const fingerprintSource=[parsed.internalId,parsed.playerName,parsed.playstyle??'',position,...keys.map((key)=>`${key}:${mainPlan[key]}`),...Object.entries(parsed.attributes).map(([key,value])=>`${key}:${value}`)].join('|');
  const reasons=[
    `Contribuição da identidade da carta: ${identityContribution}%; molde da posição: ${positionTemplateContribution}%.`,
    `Distância da ficha genérica de ${POSITION_PT[position]}: ${distanceFromGenericTemplate} nível(is) distribuído(s).`,
    `As três filosofias apresentam diversidade ${distributionDiversity}/100.`,
    cloneRisk==='baixo'?'A distribuição possui diferenciação suficiente para esta carta.':'A leitura ainda possui poucos dados exclusivos; confirme atributos, estilo, físico e habilidades para reduzir semelhanças.'
  ];
  return { fingerprint:`DNA-${identityHash(fingerprintSource)}`, individualityScore, identityContribution, positionTemplateContribution, distributionDiversity, distanceFromGenericTemplate, cloneRisk, recalculationTriggered, reasons };
}

function buildCardDnaAnalysis(position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, variants: BuildVariant[]): CardDnaAnalysis {
  const goals=buildIndividualGoals(position,objective,a,parsed);
  const weaknessStrategies=buildSelectiveWeaknesses(position,a,parsed);
  const plan=variants[0]?.training ?? emptyTraining();
  const skillSynergies=buildSkillSynergies(parsed,position,a,plan);
  const behavior=buildBehaviorSimulation(position,a,plan,skillSynergies);
  const antiClone=buildAntiCloneAnalysis(position,objective,a,parsed,variants);
  const protectedStrengths=goals.filter((goal)=>goal.priority==='proteger'||goal.priority==='especializar').slice(0,5).map((goal)=>`${goal.label}: ${goal.reason}`);
  const topBehavior=behavior.strongestBehaviors[0] ?? 'equilíbrio geral';
  const identityLabel=`DNA ${POSITION_PT[position]} • ${parsed.playstyle ?? 'sem Estilo de Jogo confirmado'} • ${topBehavior}`;
  return {
    versionSignature:`${parsed.internalId}-${antiClone.fingerprint}`,
    identityLabel,
    protectedStrengths:protectedStrengths.length?protectedStrengths:['Nenhuma força foi presumida: confirme mais atributos para aumentar a individualização.'],
    weaknessStrategies,
    individualGoals:goals,
    skillSynergies,
    behavior,
    antiClone,
    buildPhilosophies:[
      {title:'Ficha identidade',purpose:'Preservar a maneira natural desta versão da carta atuar.',difference:'Dá mais peso aos pontos fortes, Estilo de Jogo, físico e habilidades confirmadas.'},
      {title:'Ficha adaptação',purpose:`Cumprir melhor as exigências de ${POSITION_PT[position]}.`,difference:'Corrige lacunas críticas mesmo quando isso reduz parte da especialização original.'},
      {title:'Ficha híbrida DNA',purpose:'Unir identidade e adaptação com o melhor retorno total.',difference:'É a recomendação principal quando nenhuma necessidade específica foi escolhida.'}
    ],
    lifeLikeSummary:`A projeção procura manter o jogador reconhecível: ${topBehavior.toLowerCase()}. ${parsed.playstyle?`O Estilo de Jogo oficial ${parsed.playstyle} foi preservado como comportamento de referência.`:'Sem estilo confirmado, o app não inventou comportamento; usou somente atributos, físico e habilidades.'}`,
    note:'O DNA é calculado para esta versão da carta. Ele não cria Estilos de Jogo oficiais e não altera a posição escolhida pelo usuário.'
  };
}

const POSITION_FAMILY: Record<PositionCode, string> = { GK:'goleiro', CB:'zagueiro', LB:'lateral', RB:'lateral', DMF:'volante', CMF:'meia de ligação', AMF:'meia atacante', LMF:'meia lateral', RMF:'meia lateral', LWF:'ponta', RWF:'ponta', SS:'segundo atacante', CF:'centroavante' };
function positionFamily(position: PositionCode) { return POSITION_FAMILY[position]; }

function realFunctionLabel(parsed: ParsedCard, selected: PositionCode, objective: Objective, a: Required<Attributes>) {
  const style = styleText(parsed.playstyle);
  if (selected === 'GK') {
    if (/ofensivo/.test(style) || a.lowPass >= 72 || a.kickingPower >= 82) return 'GOL de reposição e saída rápida';
    if (a.goalkeeperReflexes >= a.goalkeeperReach + 3) return 'GOL de reflexo';
    return 'GOL seguro de posicionamento';
  }
  if (selected === 'CB') {
    if (/atacante surpresa|extra frontman/.test(style)) return 'ZAG atacante surpresa com avanço controlado';
    if (/defensor criativo|construtor|build up/.test(style) || a.lowPass >= 76 || a.loftedPass >= 76) return 'ZAG defensor criativo / saída de bola';
    if (/destruidor|destroyer/.test(style)) return 'ZAG destruidor de combate';
    if (a.speed >= 78 || a.acceleration >= 78) return 'ZAG de cobertura';
    return 'ZAG de combate e bloqueio';
  }
  if (selected === 'LB' || selected === 'RB') {
    if (/lateral defensivo/.test(style) || objective === 'DEFENSIVE' || a.defensiveAwareness >= 78) return `${POSITION_PT[selected]} defensivo de recomposição`;
    if (/perito em cruzamento/.test(style)) return `${POSITION_PT[selected]} especialista em cruzamentos`;
    if (/lateral ofensivo|lateral atacante|ala produtivo/.test(style) || a.loftedPass >= 78 || a.speed >= 82) return `${POSITION_PT[selected]} ofensivo de amplitude`;
    return `${POSITION_PT[selected]} equilibrado`;
  }
  if (selected === 'DMF') {
    if (/primeiro volante|ancora|âncora|anchor/.test(style)) return '1º VOL protetor da zaga';
    if (/destruidor|destroyer/.test(style) || a.tackling >= 80 || a.aggression >= 80) return 'VOL destruidor de contenção';
    if (/orquestrador|defensor criativo|construtor/.test(style) || a.lowPass >= 80 || a.loftedPass >= 78) return 'VOL construtor de saída';
    return 'VOL híbrido de proteção';
  }
  if (selected === 'CMF') {
    if (/orquestrador/.test(style) || a.lowPass >= 82) return 'MLG orquestrador';
    if (/armador|criativo/.test(style)) return 'MLG armador de apoio';
    if (/meia versatil|box-to-box|todo campo/.test(style) || a.stamina >= 83) return 'MLG box-to-box';
    if (a.defensiveAwareness >= 77) return 'MLG marcador de apoio';
    return 'MLG de ligação';
  }
  if (selected === 'AMF') {
    if (/jogador de infiltracao|jogador de infiltração|atacante surpresa|hole/.test(style) || a.finishing >= 76) return 'MAT infiltrador';
    if (/classico|clássico/.test(style)) return 'MAT clássico 10 de criação';
    if (/armador criativo/.test(style)) return 'MAT armador criativo';
    return 'MAT criador de último passe';
  }
  if (selected === 'LWF' || selected === 'RWF') {
    if (/perito em cruzamento/.test(style) || a.loftedPass >= 78) return `${POSITION_PT[selected]} cruzador`;
    if (/ala produtivo/.test(style)) return `${POSITION_PT[selected]} ala produtivo`;
    if (/lateral movel|lateral móvel|flanco|roaming/.test(style) || a.finishing >= 78) return `${POSITION_PT[selected]} finalizador diagonal`;
    if (objective === 'PRESSING' || a.stamina >= 84) return `${POSITION_PT[selected]} de pressão e recomposição`;
    return `${POSITION_PT[selected]} driblador/velocista`;
  }
  if (selected === 'SS') {
    if (/armador|criativo/.test(style) || a.lowPass >= 80) return 'SA criador entre linhas';
    if (objective === 'PRESSING' || a.stamina >= 84) return 'SA de pressão e apoio';
    return 'SA de ruptura';
  }
  if (/puxa marcacao|puxa marcação/.test(style)) return 'CA que puxa marcação e abre espaço';
  if (/homem de area|homem de área/.test(style)) return 'CA homem de área';
  if (TARGET_CF_STYLES.test(style)) return 'CA pivô/referência';
  if (/artilheiro|goal poacher|atacante matador/.test(style)) return 'CA artilheiro finalizador';
  if (objective === 'PRESSING' && a.stamina >= 85 && a.aggression >= 78) return 'CA de pressão situacional';
  return 'CA finalizador de máximo rendimento';
}

function buildSectorScores(position: PositionCode, a: Required<Attributes>, _pri: Record<string, number>, objective: Objective, profile: TacticalProfile): TeamMapPhaseScores {
  const defenseBase = avg(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression, a.physicalContact);
  const passBase = avg(a.lowPass, a.loftedPass, a.ballControl);
  const creationBase = avg(a.lowPass, a.ballControl, a.tightPossession, a.dribbling, a.curl);
  const speedBase = avg(a.speed, a.acceleration, a.balance);
  const finishBase = avg(a.finishing, a.offensiveAwareness, a.kickingPower, a.curl);
  const aerialBase = avg(a.heading, a.jump, a.physicalContact);
  const gkBase = avg(a.goalkeeperAwareness, a.goalkeeperCatching, a.goalkeeperParrying, a.goalkeeperReflexes, a.goalkeeperReach);

  const roleBoost = (roles: PositionCode[], amount: number) => roles.includes(position) ? amount : 0;
  const styleBoost = profile.style === 'CONTRA_ATAQUE_RAPIDO' ? 3 : profile.style === 'POSSE_DE_BOLA' ? 2 : profile.style === 'POR_FORA' ? 2 : 0;
  const pressureBoost = objective === 'PRESSING' ? 5 : 0;

  if (position === 'GK') {
    return {
      marcacao: Math.round(clampDecimal(gkBase, 1, 100)),
      cobertura: Math.round(clampDecimal(avg(a.goalkeeperReach, a.goalkeeperAwareness, a.jump), 1, 100)),
      saidaDeBola: Math.round(clampDecimal(avg(a.kickingPower, a.lowPass, a.loftedPass, a.goalkeeperAwareness), 1, 100)),
      passe: Math.round(clampDecimal(avg(a.kickingPower, a.loftedPass, a.lowPass), 1, 100)),
      criacao: Math.round(clampDecimal(avg(a.kickingPower, a.loftedPass), 1, 100)),
      aceleracao: Math.round(clampDecimal(avg(a.goalkeeperReflexes, a.jump), 1, 100)),
      finalizacao: 1,
      jogoAereo: Math.round(clampDecimal(avg(a.goalkeeperReach, a.jump, a.goalkeeperAwareness), 1, 100)),
      fisico: Math.round(clampDecimal(avg(a.physicalContact, a.jump, a.balance), 1, 100))
    };
  }

  return {
    marcacao: Math.round(clampDecimal(defenseBase + roleBoost(['CB', 'DMF', 'LB', 'RB'], 7) + pressureBoost, 1, 100)),
    cobertura: Math.round(clampDecimal(avg(defenseBase, speedBase, a.stamina) + roleBoost(['CB', 'LB', 'RB', 'DMF'], 5), 1, 100)),
    saidaDeBola: Math.round(clampDecimal(passBase + roleBoost(['DMF', 'CMF', 'CB'], 5) + (profile.style === 'POSSE_DE_BOLA' ? 4 : 0), 1, 100)),
    passe: Math.round(clampDecimal(passBase + roleBoost(['CMF', 'AMF', 'DMF', 'SS'], 5), 1, 100)),
    criacao: Math.round(clampDecimal(creationBase + roleBoost(['AMF', 'CMF', 'SS', 'LWF', 'RWF'], 5), 1, 100)),
    aceleracao: Math.round(clampDecimal(speedBase + roleBoost(['LWF', 'RWF', 'CF', 'SS', 'LB', 'RB'], 4) + styleBoost, 1, 100)),
    finalizacao: Math.round(clampDecimal(finishBase + roleBoost(['CF', 'SS', 'LWF', 'RWF', 'AMF'], 6), 1, 100)),
    jogoAereo: Math.round(clampDecimal(aerialBase + roleBoost(['CB', 'CF'], 5), 1, 100)),
    fisico: Math.round(clampDecimal(avg(a.physicalContact, a.balance, a.stamina, a.jump) + roleBoost(['CB', 'DMF', 'CF'], 4), 1, 100))
  };
}

function buildTeamMapAnalysis(parsed: ParsedCard, selected: PositionCode, objective: Objective, a: Required<Attributes>, pri: Record<string, number>, profile: TacticalProfile, skills: string[], impetos: ImpetoRecommendation[]): TeamMapAnalysis {
  const functionLabel = realFunctionLabel(parsed, selected, objective, a);
  const family = positionFamily(selected);
  const scores = buildSectorScores(selected, a, pri, objective, profile);
  let defensiveJob = 'Manter posição, proteger zona próxima e evitar sair no bote sem cobertura.';
  let buildupJob = 'Dar opção de passe seguro e acelerar quando encontrar linha limpa.';
  let attackingJob = 'Apoiar a fase ofensiva sem perder a função principal.';
  let pressingJob = 'Pressionar por gatilhos: passe fraco, domínio de costas ou adversário sem linha de passe.';
  let idealPartners: string[] = [];
  let riskAlerts: string[] = [];
  let matchPlan: string[] = [];

  if (selected === 'GK') {
    defensiveJob = 'Ficar seguro na meta: priorizar reflexo, alcance, firmeza e posicionamento em finalizações curtas.';
    buildupJob = 'Repor rápido quando o adversário estiver aberto; se o passe não estiver limpo, prefira reposição segura.';
    attackingJob = 'Não participar como jogador de linha; o valor ofensivo é acelerar a saída com reposição.';
    pressingJob = 'Sair manualmente só quando a bola estiver longa e o zagueiro não alcançar.';
    idealPartners = ['ZAG veloz para cobertura', 'ZAG forte no alto', 'VOL que bloqueia chute frontal'];
    riskAlerts = ['Evite habilidades de linha no goleiro.', 'Se a defesa joga alta, use GOL com alcance/reflexo alto.'];
    matchPlan = ['Defesa: proteger a entrada da área.', 'Saída: usar reposição rápida só com alvo livre.', 'Ataque: iniciar contra-ataque após defesa segura.'];
  } else if (selected === 'CB') {
    defensiveJob = 'Cobrir profundidade, bloquear chute e cortar passe antes do atacante girar.';
    buildupJob = a.lowPass >= 76 || a.loftedPass >= 76 ? 'Iniciar saída com passe curto/longo sem forçar condução.' : 'Tocar simples no VOL/MLG e evitar conduzir sob pressão.';
    attackingJob = 'Subir apenas em bola parada; em jogo corrido, manter cobertura.';
    pressingJob = 'Não quebrar linha à toa; só dar bote quando o VOL atrasar o portador.';
    idealPartners = ['VOL destruidor na frente', 'ZAG complementar veloz/forte', 'Laterais que recomponham'];
    riskAlerts = ['Se velocidade for baixa, não use linha defensiva muito alta.', 'Evite gastar habilidade ofensiva em ZAG de combate.'];
    matchPlan = ['Marcação: fechar corredor central.', 'Passe: primeira bola no VOL/MLG.', 'Ataque: ficar pronto para segunda bola.'];
  } else if (selected === 'DMF') {
    defensiveJob = 'Ser a trava do time: cortar passe central, proteger zagueiros e impedir chute frontal.';
    buildupJob = 'Receber dos zagueiros e soltar passe limpo no MLG/MAT; evitar girar pressionado.';
    attackingJob = 'Apoiar atrás da jogada para rebote e cobertura, não invadir área sem necessidade.';
    pressingJob = 'Pressionar só quando houver cobertura; o valor é bloquear linha de passe.';
    idealPartners = ['MLG construtor', 'ZAG de cobertura', 'MAT com passe vertical'];
    riskAlerts = ['Se subir demais, o meio abre buraco.', 'Não priorize drible se a função é contenção.'];
    matchPlan = ['Defesa: proteger a meia-lua.', 'Construção: passe curto seguro.', 'Ataque: ficar no rebote e cortar contra-ataque.'];
  } else if (selected === 'CMF') {
    defensiveJob = 'Ajudar o VOL na pressão e cobrir corredor central quando o lateral subir.';
    buildupJob = 'Ligar defesa e ataque com passe rápido, condução curta e inversão quando houver espaço.';
    attackingJob = 'Chegar como segunda linha, sem abandonar o equilíbrio do meio.';
    pressingJob = 'Pressionar após perda com fôlego; se não roubar, atrasar a jogada.';
    idealPartners = ['VOL fixo', 'MAT criador', 'Lateral que dê amplitude'];
    riskAlerts = ['Se tiver pouca defesa, use ao lado de VOL forte.', 'Se tiver pouco passe, não use como organizador principal.'];
    matchPlan = ['Marcação: encurtar no meio.', 'Passe: triangular com VOL/MAT.', 'Ataque: chegar de trás.'];
  } else if (selected === 'AMF') {
    defensiveJob = 'Fechar primeira linha de passe do volante rival, sem virar marcador principal.';
    buildupJob = 'Receber entre linhas, girar rápido e achar passe em profundidade.';
    attackingJob = 'Ser o cérebro do último passe e finalizar quando sobrar espaço na entrada da área.';
    pressingJob = 'Pressionar o volante rival quando ele dominar de costas.';
    idealPartners = ['CA finalizador', 'Ponta veloz', 'MLG que proteja suas costas'];
    riskAlerts = ['Não transforme MAT criador em volante.', 'Se for lento, evite condução longa.'];
    matchPlan = ['Criação: passe entre linhas.', 'Ataque: tabela curta com CA/SA.', 'Defesa: fechar o volante adversário.'];
  } else if (selected === 'LB' || selected === 'RB' || selected === 'LMF' || selected === 'RMF') {
    defensiveJob = 'Recompor corredor lateral e impedir cruzamento fácil.';
    buildupJob = 'Dar amplitude, receber aberto e tocar por dentro quando pressionado.';
    attackingJob = 'Criar superioridade pelo lado com cruzamento, tabela ou passe rasteiro para trás.';
    pressingJob = 'Pressionar lateral/ponta adversário com cobertura do MLG/VOL.';
    idealPartners = ['MLG que cubra o corredor', 'Ponta que puxe marcação', 'CA que ataque a área'];
    riskAlerts = ['Se os dois laterais sobem juntos, o contra-ataque adversário fica perigoso.', 'Não use lateral ofensivo sem VOL de cobertura.'];
    matchPlan = ['Marcação: fechar lado forte.', 'Construção: abrir campo.', 'Ataque: cruzar ou tocar para trás.'];
  } else if (selected === 'LWF' || selected === 'RWF') {
    defensiveJob = 'Pressionar saída adversária pelo lado e acompanhar lateral quando necessário.';
    buildupJob = 'Receber aberto para carregar ou cortar por dentro, sempre com opção de passe curto.';
    attackingJob = 'Atacar 1 contra 1, cruzar ou finalizar diagonal conforme o pé e atributos.';
    pressingJob = 'Pressionar lateral/zagueiro no primeiro toque; Volta para marcar só se for ponta de recomposição.';
    idealPartners = ['Lateral de apoio', 'CA finalizador', 'MLG que inverta jogo'];
    riskAlerts = ['Se usar ponta sem recomposição, proteja o lado com lateral defensivo.', 'Não priorize habilidade defensiva em ponta finalizador.'];
    matchPlan = ['Ataque: isolar no 1 contra 1.', 'Passe: diagonal no CA/SA.', 'Defesa: recompor quando o lateral subir.'];
  } else if (selected === 'SS') {
    defensiveJob = 'Fechar o primeiro passe no meio e ajudar a pressionar sem perder posição entre linhas.';
    buildupJob = 'Aproximar do CA/MAT para tabela e passe de primeira.';
    attackingJob = 'Atacar espaço nas costas do volante/zagueiro e finalizar como segundo homem.';
    pressingJob = 'Pressionar com o CA em dupla quando o rival sair curto.';
    idealPartners = ['CA pivô ou finalizador', 'MAT criador', 'Ponta que abra espaço'];
    riskAlerts = ['Se virar ponta fixo, perde parte da função entre linhas.', 'Não coloque habilidades só defensivas em SA criativo.'];
    matchPlan = ['Criação: tabela curta.', 'Ataque: ruptura por dentro.', 'Marcação: pressão coordenada com CA.'];
  } else {
    defensiveJob = 'Fechar linha de passe inicial e orientar a saída adversária para o lado, sem abandonar a área.';
    buildupJob = 'Servir de apoio para tabela/pivô e devolver rápido para quem vem de frente.';
    attackingJob = 'Atacar espaço, finalizar em poucos toques e ocupar a área na hora certa.';
    pressingJob = TARGET_CF_STYLES.test(styleText(parsed.playstyle)) ? 'Pressionar zagueiro quando houver cobertura, sem sair demais da referência.' : 'Pressionar só em gatilhos; o foco é finalizar, não virar marcador.';
    idealPartners = ['SA/MAT de passe', 'Ponta com cruzamento ou diagonal', 'MLG que ache passe vertical'];
    riskAlerts = ['Não priorize habilidade defensiva em CA finalizador.', 'Se o CA sair demais para marcar, falta presença na área.'];
    matchPlan = ['Ataque: receber e finalizar rápido.', 'Construção: pivô curto se tiver físico.', 'Defesa: orientar pressão, sem abandonar a zona de gol.'];
  }

  const coachFit = profile.style === 'AUTO'
    ? `Função ajustada para ${family}; escolha o estilo do técnico para refinar ainda mais.`
    : `${profile.managerName ? `${profile.managerName} (${profile.managerProficiency ?? '—'}) • ` : ''}${functionLabel} combina com ${TACTICAL_STYLE_NAME[profile.style]} quando a ficha respeita a posição escolhida e não força habilidade fora de contexto.`;

  const bestImpetoNames = impetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => item.name);
  if (bestImpetoNames.length) matchPlan.push(`Ímpetos prioritários: ${bestImpetoNames.join(', ')}.`);
  if (skills.length) matchPlan.push(`Habilidades prioritárias: ${skills.slice(0, 3).join(', ')}.`);

  return {
    functionLabel,
    tacticalIdentity: `${POSITION_PT[selected]} • ${functionLabel}`,
    defensiveJob,
    buildupJob,
    attackingJob,
    pressingJob,
    idealPartners,
    riskAlerts,
    matchPlan,
    sectorScores: scores,
    coachFit
  };
}

function recommendationExplanation(parsed: ParsedCard, selected: PositionCode, attributes: Required<Attributes>, pri: Record<string, number>, avoidPositions: Array<{ code: PositionCode; label: string; reason: string }>, profile: TacticalProfile) {
  const lines: string[] = [];
  const style = parsed.playstyle ? `estilo ${parsed.playstyle}` : 'estilo não confirmado';
  const role = trainingRoleProfile(selected, 'COMPETITIVE', attributes, parsed);
  lines.push(`Recomendei ${POSITION_PT[selected]} porque a carta é ${POSITION_PT[parsed.mainPosition]}, tem ${style} e o motor priorizou função real, não o maior GER da grade.`);
  if (role?.label) lines.push(`A ficha foi calibrada como ${role.label}: os pontos sobem nos atributos que mais aparecem nas ações reais dessa função e caem onde haveria desperdício.`);
  if (selected === 'GK') lines.push(`Como GOL, pesaram talento de GO ${attributes.goalkeeperAwareness}, firmeza ${attributes.goalkeeperCatching}, defesa ${attributes.goalkeeperParrying}, reflexos ${attributes.goalkeeperReflexes}, alcance ${attributes.goalkeeperReach}, salto ${attributes.jump} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'DMF') lines.push(`Como VOL, pesaram defesa ${attributes.defensiveAwareness}, desarme ${attributes.tackling}, agressividade ${attributes.aggression}, passe rasteiro ${attributes.lowPass} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'CMF') lines.push(`Como MLG, pesaram passe ${attributes.lowPass}, condução ${attributes.tightPossession}, fôlego ${attributes.stamina} e capacidade de recomposição.`);
  if (selected === 'CB') lines.push(`Como ZAG, pesaram defesa ${attributes.defensiveAwareness}, desarme ${attributes.tackling}, contato físico ${attributes.physicalContact}, salto ${attributes.jump} e leitura de cobertura.`);
  if (selected === 'CF') lines.push(`Como CA, pesaram finalização ${attributes.finishing}, talento ofensivo ${attributes.offensiveAwareness}, força do chute ${attributes.kickingPower} e contato físico ${attributes.physicalContact}.`);
  if (selected === 'LWF' || selected === 'RWF') lines.push(`Como ponta, pesaram drible ${attributes.dribbling}, aceleração ${attributes.acceleration}, equilíbrio ${attributes.balance} e finalização ${attributes.finishing}.`);
  if (pri.defense >= 78) lines.push('A defesa teve peso alto no PRI, por isso posições ofensivas são tratadas com cuidado mesmo quando aparecem com GER alto.');
  if (avoidPositions.length) lines.push(`Evitei ${avoidPositions.slice(0, 3).map((item) => item.label).join(', ')} por regra anti-posição impossível ou baixa aderência ao estilo.`);
  if (profile.style !== 'AUTO') lines.push('O estilo coletivo do técnico ajustou passe, pressão, velocidade ou cobertura sem prender a ficha a uma formação.');
  return lines;
}

const WINGER_PRIORITY_LABELS = ['Drible', 'Aceleração', 'Velocidade', 'Finalização'];
const WIDE_MID_PRIORITY_LABELS = ['Resistência', 'Passe alto', 'Velocidade', 'Dedicação defensiva'];
const FULLBACK_PRIORITY_LABELS = ['Velocidade', 'Resistência', 'Passe alto', 'Desarme'];
const POSITION_PRIORITY_LABELS: Record<PositionCode, string[]> = {
  CF:['Finalização', 'Talento ofensivo', 'Contato físico', 'Aceleração'], SS:['Controle de bola', 'Drible', 'Passe rasteiro', 'Finalização'], LWF:WINGER_PRIORITY_LABELS, RWF:WINGER_PRIORITY_LABELS, LMF:WIDE_MID_PRIORITY_LABELS, RMF:WIDE_MID_PRIORITY_LABELS,
  AMF:['Passe rasteiro', 'Controle de bola', 'Condução firme', 'Talento ofensivo'], CMF:['Passe rasteiro', 'Passe alto', 'Resistência', 'Controle de bola'], DMF:['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Passe rasteiro'], CB:['Talento defensivo', 'Desarme', 'Contato físico', 'Salto'], LB:FULLBACK_PRIORITY_LABELS, RB:FULLBACK_PRIORITY_LABELS, GK:['Talento de GO', 'Reflexos de GO', 'Alcance de GO', 'Defesa de GO']
};
function positionPriorityLabels(position: PositionCode): string[] { return POSITION_PRIORITY_LABELS[position]; }

function buildAdvancedTacticalFunction(parsed: ParsedCard, selected: PositionCode, selectedScore: number): AdvancedTacticalFunction {
  const official = parsed.playstyle && PLAYSTYLE_OPTIONS.includes(parsed.playstyle as typeof PLAYSTYLE_OPTIONS[number]) ? parsed.playstyle : null;
  const preferred = official ? preferredPositionsByPlaystyle(official) : [];
  const activates = official ? preferred.includes(selected) : false;
  const native = parsed.positions.includes(selected) || parsed.mainPosition === selected;
  const score = clamp(Math.round(selectedScore * .72 + (activates ? 18 : 5) + (native ? 10 : 2)), 1, 100);
  const fitLabel: AdvancedTacticalFunction['fitLabel'] = score >= 88 ? 'excelente' : score >= 76 ? 'boa' : score >= 62 ? 'razoável' : 'difícil';
  return {
    position: selected,
    officialPlaystyle: official,
    status: official ? 'oficial_confirmado' : 'nao_identificado',
    activationNote: !official
      ? 'Estilo de Jogo não confirmado. A ficha usa a posição escolhida e os atributos, sem inventar um nome.'
      : activates
        ? `${official} é considerado na posição escolhida conforme o cadastro oficial local do app.`
        : `${official} foi preservado como estilo oficial da carta, mas pode não ativar nessa posição. A ficha continua obedecendo à sua escolha.`,
    priorities: positionPriorityLabels(selected),
    compatibilityScore: score,
    fitLabel,
    officialNameGuard: 'Somente nomes presentes em PLAYSTYLE_OPTIONS podem aparecer como Estilo de Jogo oficial.'
  };
}

function skillImpactText(skill: string, position: PositionCode): string {
  const profile = SKILL_PROFILES[skill];
  if (!profile) return 'Habilidade oficial preservada no cadastro.';
  const boosts = Object.entries(profile.boosts).sort((a,b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0,2).map(([key]) => ({
    defense:'defesa', pressure:'pressão', creation:'criação', finishing:'finalização', dribbling:'drible', mobility:'mobilidade', physical:'físico', aerial:'jogo aéreo', stamina:'resistência', goalkeeper:'goleiro'
  } as Record<string,string>)[key] ?? key);
  return `Ajuda em ${boosts.join(' e ')} para atuar como ${POSITION_PT[position]}.`;
}

function buildSpecialSkillsAnalysis(parsed: ParsedCard, selected: PositionCode, recommended: string[], avoid: string[]): SpecialSkillsAnalysis {
  const ownedOfficial = uniqueSkillList([...(parsed.nativeSkills ?? []), ...(parsed.additionalSkills ?? []), ...(parsed.specialSkills ?? [])]).filter((skill) => OFFICIAL_ADDITIONAL_SKILLS.has(skill));
  const usefulOwned = ownedOfficial.map((name) => ({ name, impact: skillImpactText(name, selected), score: 70 + Math.min(25, Object.values(SKILL_PROFILES[name]?.boosts ?? {}).reduce<number>((sum, value) => sum + (value ?? 0), 0) * 2) })).sort((a,b)=>b.score-a.score);
  const missingRecommended = recommended.filter((name) => OFFICIAL_ADDITIONAL_SKILLS.has(name) && !ownedOfficial.includes(name)).slice(0,8).map((name,index) => ({ name, impact: skillImpactText(name, selected), score: Math.max(70, 96-index*4) }));
  const redundant = ownedOfficial.filter((name) => avoid.includes(name)).map((name) => ({ name, reason: `É oficial, mas tem retorno baixo para ${POSITION_PT[selected]} nesta ficha.` }));
  const usefulCount = usefulOwned.filter((item) => !redundant.some((r)=>r.name===item.name)).length;
  const coverageScore = clamp(45 + usefulCount*8 + Math.min(20, missingRecommended.length ? 20-missingRecommended.length*2 : 20), 1, 100);
  return {
    ownedOfficial,
    usefulOwned,
    missingRecommended,
    redundant,
    coverageScore,
    officialCatalogOnly: [...ownedOfficial, ...missingRecommended.map(i=>i.name), ...redundant.map(i=>i.name)].every((name)=>OFFICIAL_ADDITIONAL_SKILLS.has(name)),
    validationNotes: [
      'Nenhuma habilidade fora de OFFICIAL_ADDITIONAL_SKILL_NAMES é tratada como oficial.',
      'Habilidades já existentes são removidas das recomendações adicionais.',
      'A posição escolhida por você define a utilidade; o estilo oficial nunca é renomeado.'
    ]
  };
}

const ATTRIBUTE_GOAL_LABEL_OVERRIDES: Partial<Record<AttributeKey, string>> = {
  offensiveAwareness:'Consciência ofensiva', tightPossession:'Condução precisa', heading:'Cabeceio', defensiveAwareness:'Consciência defensiva', defensiveEngagement:'Engajamento defensivo', goalkeeperAwareness:'Consciência do goleiro', goalkeeperCatching:'Segurar bola', goalkeeperParrying:'Espalmar', goalkeeperReflexes:'Reflexos', goalkeeperReach:'Alcance', jump:'Impulsão'
};
const attributeGoalLabel = (key: AttributeKey) => ATTRIBUTE_GOAL_LABEL_OVERRIDES[key] ?? ATTRIBUTE_PT[key];

function buildPhysicalEngine(parsed: ParsedCard, selected: PositionCode, a: Required<Attributes>): PhysicalEngineAnalysis {
  const h=parsed.height ?? null, w=parsed.weight ?? null;
  const mobility=Math.round(clampDecimal((a.speed+a.acceleration+a.balance)/3,1,99));
  const strength=Math.round(clampDecimal((a.physicalContact+a.balance+a.stamina)/3,1,99));
  const aerial=Math.round(clampDecimal((a.heading+a.jump+a.physicalContact)/3,1,99));
  const stamina=Math.round(clampDecimal(a.stamina,1,99));
  let body: PhysicalEngineAnalysis['bodyProfile']='não confirmado';
  if(h && w){ if(h>=188) body='alto'; else if(w>=82 || a.physicalContact>=85) body='forte'; else if(w<=68 && mobility>=80) body='leve'; else body='equilibrado'; }
  const needAerial=['CB','CF','GK'].includes(selected), needMobility=['LWF','RWF','LMF','RMF','LB','RB','SS'].includes(selected);
  const suitability=Math.round(clampDecimal((needAerial?aerial*.35:strength*.25)+(needMobility?mobility*.45:mobility*.25)+stamina*.2+strength*.2,1,99));
  const advantages=[] as string[], limitations=[] as string[];
  if(mobility>=80) advantages.push('Boa mobilidade para acelerar, recuperar e mudar de direção.'); else if(needMobility) limitations.push('Mobilidade abaixo do ideal para a posição escolhida.');
  if(strength>=80) advantages.push('Contato, equilíbrio e resistência sustentam duelos.'); else if(['CB','DMF','CF'].includes(selected)) limitations.push('Pode sofrer em contato físico contra jogadores fortes.');
  if(aerial>=80) advantages.push('Boa base para disputas aéreas.'); else if(needAerial) limitations.push('Jogo aéreo é uma limitação natural que o treino apenas reduz.');
  if(stamina<72) limitations.push('Resistência pode cair antes do fim da partida.');
  return {heightCm:h,weightKg:w,dominantFoot:parsed.dominantFoot ?? null,bodyProfile:body,mobilityScore:mobility,strengthScore:strength,aerialScore:aerial,staminaScore:stamina,suitabilityScore:suitability,advantages,limitations,notes:['A posição escolhida não é bloqueada pelo perfil físico.','Dados não lidos aparecem como não confirmados; o app não inventa altura, peso ou perna dominante.']};
}

type PositionGoal = [AttributeKey,number,number,string];
const WINGER_GOALS: PositionGoal[] = [['speed',78,88,'Atacar espaço no corredor.'],['acceleration',78,88,'Explodir no primeiro passo.'],['dribbling',78,87,'Vencer o duelo individual.'],['finishing',72,82,'Finalizar quando entra por dentro.']];
const WIDE_MID_GOALS: PositionGoal[] = [['stamina',76,86,'Sustentar ida e volta.'],['lowPass',74,83,'Circular e criar pelo lado.'],['speed',74,84,'Dar amplitude e recuperação.'],['defensiveEngagement',68,78,'Ajudar a recomposição.']];
const FULLBACK_GOALS: PositionGoal[] = [['stamina',76,86,'Sustentar o corredor.'],['speed',76,86,'Acompanhar pontas.'],['defensiveAwareness',70,80,'Fechar o lado.'],['loftedPass',70,82,'Apoiar com cruzamentos e inversões.']];
const ATTRIBUTE_GOALS_BY_POSITION: Record<PositionCode, PositionGoal[]> = {
  CF:[['offensiveAwareness',78,86,'Movimentação para receber e atacar a área.'],['finishing',78,88,'Converter as chances criadas.'],['acceleration',74,82,'Ganhar o primeiro passo.'],['physicalContact',70,80,'Proteger a bola e disputar com zagueiros.']], SS:[['ballControl',78,86,'Receber entre linhas.'],['dribbling',76,85,'Criar vantagem curta.'],['lowPass',74,82,'Associar com o ataque.'],['finishing',74,84,'Também concluir jogadas.']], LWF:WINGER_GOALS, RWF:WINGER_GOALS, LMF:WIDE_MID_GOALS, RMF:WIDE_MID_GOALS,
  AMF:[['ballControl',80,88,'Receber sob pressão.'],['lowPass',78,87,'Criar a última bola.'],['dribbling',76,85,'Romper linhas.'],['offensiveAwareness',74,84,'Aparecer em zonas perigosas.']], CMF:[['lowPass',76,86,'Conectar os setores.'],['stamina',76,86,'Participar das duas fases.'],['ballControl',74,83,'Girar e proteger a posse.'],['defensiveEngagement',68,78,'Reagir após a perda.']], DMF:[['defensiveAwareness',78,88,'Proteger a frente da zaga.'],['tackling',76,86,'Recuperar a bola.'],['physicalContact',74,84,'Vencer duelos centrais.'],['lowPass',72,82,'Dar saída segura.']], CB:[['defensiveAwareness',80,90,'Manter posicionamento defensivo.'],['tackling',78,88,'Interromper jogadas.'],['physicalContact',78,88,'Disputar com atacantes.'],['speed',68,78,'Cobrir espaço sem comprometer a defesa.']], LB:FULLBACK_GOALS, RB:FULLBACK_GOALS, GK:[['goalkeeperAwareness',80,90,'Posicionamento e leitura.'],['goalkeeperReflexes',80,90,'Responder a finalizações.'],['goalkeeperReach',78,88,'Cobrir maior área do gol.'],['goalkeeperParrying',76,86,'Controlar rebotes.']]
};
function goalsForPosition(position: PositionCode): PositionGoal[] { return ATTRIBUTE_GOALS_BY_POSITION[position]; }

function buildAttributeGoals(selected: PositionCode, a: Required<Attributes>): AttributeGoalsAnalysis {
 const goals=goalsForPosition(selected).map(([attribute,min,ideal,reason])=>{const current=Math.round(a[attribute]); const gap=Math.max(0,min-current); const status:AttributeGoalItem['status']=current>=ideal?'atingida':current>=min?'próxima':'prioritária'; return {attribute,label:attributeGoalLabel(attribute),current,targetMin:min,targetIdeal:ideal,status,gap,reason};});
 const achieved=goals.filter(g=>g.status==='atingida').length, priority=goals.filter(g=>g.status==='prioritária').length;
 const readiness=Math.round(clampDecimal(goals.reduce((s,g)=>s+Math.min(100,(g.current/g.targetIdeal)*100),0)/goals.length,1,99));
 return {position:selected,goals,achievedCount:achieved,priorityCount:priority,readinessScore:readiness,summary:priority?`${priority} meta(s) ainda exigem prioridade para ${POSITION_PT[selected]}.`:`As metas principais de ${POSITION_PT[selected]} estão em faixa funcional.`};
}

function buildCorrectionLimit(selected: PositionCode, objective: Objective, a: Required<Attributes>, plan: TrainingPlan, parsed: ParsedCard): CorrectionLimitAnalysis {
  const weights = adaptiveTrainingWeights(selected, objective, a, parsed);
  const keys = TRAINING_KEYS;
  const protectedStrengths: string[] = [];
  const caps = keys.filter(k => plan[k] > 0).map(k => {
    const max = weights[k] >= 2 ? 13 : weights[k] >= 1.2 ? 11 : weights[k] >= .7 ? 9 : 6;
    if (plan[k] > max) return { training:k, label:TRAINING_LABELS[k], currentLevel:plan[k], recommendedMax:max, reason:'O retorno cai depois desta faixa e pode descaracterizar qualidades úteis.' };
    return null;
  }).filter(Boolean) as CorrectionLimitAnalysis['correctionCaps'];
  if (a.lowPass >= 82) protectedStrengths.push('Passe natural protegido contra cortes excessivos.');
  if (a.speed >= 84) protectedStrengths.push('Velocidade natural preservada; não precisa consumir o orçamento inteiro.');
  if (a.finishing >= 84) protectedStrengths.push('Finalização forte preservada mesmo em adaptação de posição.');
  if (a.defensiveAwareness >= 84) protectedStrengths.push('Base defensiva forte preservada.');
  const naturalLimits: string[] = [];
  if ((selected === 'CB' || selected === 'CF') && a.heading < 68 && a.jump < 70) naturalLimits.push('Jogo aéreo é limitação natural; o motor evita gastar pontos demais tentando anulá-la.');
  if (a.speed < 68) naturalLimits.push('Velocidade muito baixa não é tratada como totalmente corrigível apenas com treino.');
  if (a.physicalContact < 68 && (selected === 'CB' || selected === 'DMF' || selected === 'CF')) naturalLimits.push('Contato físico baixo continua sendo risco estrutural da adaptação.');
  const score = Math.max(1, 100 - caps.length * 12 - naturalLimits.length * 5);
  return { score, protectedStrengths, correctionCaps:caps, naturalLimits, summary:caps.length ? 'Há grupos acima da faixa de melhor retorno; a ficha limita correções exageradas.' : 'Nenhuma correção exagerada foi detectada na ficha recomendada.' };
}

function buildMarginalReturn(selected: PositionCode, objective: Objective, a: Required<Attributes>, plan: TrainingPlan, parsed: ParsedCard): MarginalReturnItem[] {
  const weights = adaptiveTrainingWeights(selected, objective, a, parsed);
  return (Object.keys(plan) as TrainingKey[]).filter(k => selected === 'GK' ? ['gk1','gk2','gk3','lowerBodyStrength','aerialStrength'].includes(k) : !k.startsWith('gk')).map(k => {
    const level=plan[k]; const cost=trainingLevelCost(level+1); const saturation=level >= 12 ? .35 : level >= 10 ? .6 : 1;
    const gain=Math.round(Math.max(1, weights[k] * saturation * 18 / cost));
    const returnLabel = gain >= 20 ? 'alto' : gain >= 10 ? 'médio' : 'baixo';
    return { training:k,label:TRAINING_LABELS[k],currentLevel:level,nextPointCost:cost,marginalGain:gain,returnLabel,recommendation:returnLabel==='alto'?'Próximo investimento recomendado.':returnLabel==='médio'?'Só investir se combinar com sua prioridade.':'Evitar por enquanto; o custo supera o ganho provável.' } as MarginalReturnItem;
  }).sort((x,y)=>y.marginalGain-x.marginalGain);
}

function shiftForTolerance(plan: TrainingPlan, selected: PositionCode, direction: 'conservative'|'optimistic'): TrainingPlan {
  const p={...plan}; const main = selected==='GK'?'gk2':selected==='CB'||selected==='DMF'?'defending':selected==='CF'?'shooting':selected==='AMF'||selected==='CMF'?'passing':'dexterity';
  const secondary = selected==='GK'?'gk1':selected==='CB'?'lowerBodyStrength':selected==='CF'?'dexterity':'lowerBodyStrength';
  if(direction==='conservative'){ p[main]=Math.max(0,p[main]-1); p[secondary]+=1; }
  else { p[main]+=1; p[secondary]=Math.max(0,p[secondary]-1); }
  return normalizeTrainingPlan(p);
}

function buildErrorTolerance(parsed: ParsedCard, selected: PositionCode, plan: TrainingPlan, budget:number, priority: TrainingKey[]): ErrorToleranceAnalysis {
  const confidence = parsed.confidence >= 85 && parsed.evidence.attributeCount >= 18 ? 'alta' : parsed.confidence >= 60 && parsed.evidence.attributeCount >= 8 ? 'média' : 'baixa';
  const probable=fitTrainingToBudget(plan,priority,budget);
  const conservative=fitTrainingToBudget(shiftForTolerance(probable,selected,'conservative'),priority,budget);
  const optimistic=fitTrainingToBudget(shiftForTolerance(probable,selected,'optimistic'),priority,budget);
  const sensitiveGroups = confidence==='alta'?[]:['Atributos não confirmados podem mudar a ordem entre os dois principais grupos de treino.'];
  const stableGroups=TRAINING_KEYS.filter(k=>probable[k]>=6).map(k=>TRAINING_LABELS[k]).slice(0,4);
  return { confidence, conservative, probable, optimistic, sensitiveGroups, stableGroups, note:'Os três cenários respeitam o mesmo orçamento e a posição escolhida. Eles existem para reduzir o risco de um dado lido incorretamente.' };
}

function buildSkillPriority(parsed: ParsedCard, selected: PositionCode, analysis: SpecialSkillsAnalysis): SkillPriorityAnalysis {
  const ordered=analysis.missingRecommended.filter(x=>OFFICIAL_ADDITIONAL_SKILLS.has(x.name)).map((x,index)=>({name:x.name,score:Math.max(1,Math.min(100,x.score + (index<2?8:0))),tier:(index===0?'prioridade máxima':index<3?'alta':'útil') as 'prioridade máxima'|'alta'|'útil',reasons:[x.impact,`Compatível com ${POSITION_PT[selected]}.`, parsed.playstyle?`Considera o estilo oficial ${parsed.playstyle}.`:'Sem estilo confirmado: prioridade calculada pela posição e atributos.']})).sort((a,b)=>b.score-a.score).slice(0,8);
  return { ordered, ownedCoverage:analysis.coverageScore, officialOnly:ordered.every(x=>OFFICIAL_ADDITIONAL_SKILLS.has(x.name)), context:[`Posição escolhida: ${POSITION_PT[selected]}.`, parsed.playstyle?`Estilo oficial: ${parsed.playstyle}.`:'Estilo oficial não confirmado.', 'Habilidades já existentes foram removidas da fila.'] };
}

function buildAdvancedOptimizer(variants: BuildVariant[], training: TrainingPlan, budget:number, selected:PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard): AdvancedOptimizerAnalysis {
 const winner=[...variants].sort((a,b)=>(b.qualityScore??0)-(a.qualityScore??0))[0] ?? variants[0];
 const used=trainingPlanTotalCost(winner?.training ?? training);
 const adaptiveWeights=adaptiveTrainingWeights(selected,objective,a,parsed);
 const inactive=TRAINING_KEYS.filter(k=>(winner?.training??training)[k]>=5 && adaptiveWeights[k]<=.35);
 return {combinationsTested:Math.max(...variants.map(v=>v.simulationsTested??0),0),winnerTitle:winner?.title??'Ficha recomendada Elite',winnerScore:winner?.qualityScore??0,efficiencyScore:winner?.efficiencyScore??0,wasteScore:Math.max(0,100-(winner?.efficiencyScore??0)),unusedPoints:Math.max(0,budget-used),usefulInvestment:(winner?.highlights??[]).slice(0,4),detectedWaste:inactive.length?inactive.map(k=>`${TRAINING_LABELS[k]} recebeu investimento acima do retorno estimado.`):['Nenhum desperdício crítico detectado na ficha vencedora.'],decisionReasons:[winner?.verdict??'Melhor média geral.',winner?.note??'Selecionada pelo motor adaptativo.',`A posição ${POSITION_PT[selected]} foi preservada em todas as simulações.`],positionPreserved:true,budgetRespected:used<=budget};
}

export function analyzeCard(rawText: string, objective: Objective = 'COMPETITIVE', targetPosition: PositionCode | 'AUTO' = 'AUTO', imageFileName?: string | null, tacticalProfile: TacticalProfile = { formation: 'AUTO', style: 'AUTO' }, executionModeR142: 'FULL' | 'PRODUCTION_BASE' = 'FULL'): AnalysisResult {
  objective = normalizeObjective(objective);
  const parsed = parseCard(rawText, imageFileName);
  const attributes = fillAttributes(parsed);
  const allowedPositions = parsed.positions.length ? parsed.positions : [parsed.mainPosition];
  const nativePositionScores = allowedPositions
    .map((code) => {
      const rawScore = positionScore(code, attributes, parsed.nativeSkills, parsed.positionRatings) + playstylePositionBonus(code, parsed.playstyle) + gameplayPositionWeight(code, parsed.mainPosition, parsed.playstyle) * 0.18 + tacticalScoreBonus(code, tacticalProfile, attributes);
      return { code, label: POSITION_PT[code], score: clampDecimal(rawScore, 1, 100), role: roleName(code, attributes), cardRating: parsed.positionRatings[code] ?? null };
    })
    .sort((left, right) => {
      const leftRank = left.score + gameplayPositionWeight(left.code, parsed.mainPosition, parsed.playstyle) * 0.18;
      const rightRank = right.score + gameplayPositionWeight(right.code, parsed.mainPosition, parsed.playstyle) * 0.18;
      return rightRank - leftRank;
    });
  const autoSelectedCode = chooseGameplaySelectedPosition(parsed, nativePositionScores);
  const explicitTarget = targetPosition !== 'AUTO';
  const requestedCode = explicitTarget ? targetPosition as PositionCode : autoSelectedCode;
  // Quando o usuário escolhe uma posição, a decisão é soberana.
  // O motor pode avaliar a adaptação, mas nunca troca ou bloqueia silenciosamente a escolha.
  const selectedCode = explicitTarget ? requestedCode : autoSelectedCode;
  const targetScore = positionScore(selectedCode, attributes, parsed.nativeSkills, parsed.positionRatings) + tacticalScoreBonus(selectedCode, tacticalProfile, attributes);
  const selected = nativePositionScores.find((item) => item.code === selectedCode) ?? {
    code: selectedCode,
    label: POSITION_PT[selectedCode],
    score: clampDecimal(targetScore, 1, 100),
    role: roleName(selectedCode, attributes),
    cardRating: parsed.positionRatings[selectedCode] ?? null
  };
  const positionScores = [selected, ...nativePositionScores.filter((item) => item.code !== selected.code)];
  const selectedLabel = selected.label;
  const pri = calculatePri(selected.code, attributes, parsed.nativeSkills);
  const tacticalFit = calculateTacticalFit(selected.code, attributes, pri);
  const trainingPointsTotal = trainingBudgetFromCard(parsed);
  const baseTraining = trainingFor(selected.code, objective, attributes, parsed, individualTrainingAdjustments);
  const buildVariants = buildTrainingVariants(selected.code, selectedLabel, baseTraining, positionScores.slice(0, 10), trainingPointsTotal, objective, parsed, executionModeR142);
  const initialTraining = buildVariants[0]?.training ?? baseTraining;
  const exactPriority = trainingTemplate(selected.code, objective, attributes, parsed).priority;
  const training = fitTrainingToExactBudget(initialTraining, exactPriority, trainingPointsTotal, selected.code, parsed);
  const trainingCost = trainingPlanCost(training);
  const trainingPointsUsed = trainingPlanTotalCost(training);
  const trainingPointsRemaining = trainingPointsTotal - trainingPointsUsed;
  const recommendedSkills = recommendAdditionalSkills(parsed, selected.code, objective, attributes);
  const skillRecommendations = buildSkillRecommendations(parsed, selected.code, objective, attributes, recommendedSkills);
  const avoidSkills = skillRecommendations.filter((item) => item.tier === 'evitar').map((item) => item.name);
  const recommendedImpetos = recommendImpetos(parsed, selected.code, objective);
  const teamMap = buildTeamMapAnalysis(parsed, selected.code, objective, attributes, pri, tacticalProfile, recommendedSkills, recommendedImpetos);
  const { strengths, weaknesses } = buildStrengthWeaknessDiagnosticsR131(attributes, pri, selected.code);
  const tips = buildUsageTipsR131(selected.code, objective, attributes);
  const buildName = `${selectedLabel} ${selected.role}`;
  const visiblePositionScores = positionScores.slice(0, 10);
  const permittedPositions = buildPermittedPositions(parsed, visiblePositionScores);
  const avoidPositions = buildAvoidPositions(parsed, attributes);
  const baseValidation = validateAnalysis(parsed, selected, visiblePositionScores, attributes, avoidPositions, explicitTarget);
  const structuralPrecision = buildStructuralPrecisionAnalysis(parsed, training, trainingPointsTotal, selected.code);
  const validation = mergeStructuralValidation(baseValidation, structuralPrecision);
  const trainingComparison = compareTraining(parsed.autoTrainingPlan, training);
  const advancedTacticalFunction = buildAdvancedTacticalFunction(parsed, selected.code, selected.score);
  const specialSkillsAnalysis = buildSpecialSkillsAnalysis(parsed, selected.code, recommendedSkills, avoidSkills);
  const physicalEngine = buildPhysicalEngine(parsed, selected.code, attributes);
  const attributeGoals = buildAttributeGoals(selected.code, attributes);
  const advancedOptimizer = buildAdvancedOptimizer(buildVariants, training, trainingPointsTotal, selected.code, objective, attributes, parsed);
  const primaryTraining = buildVariants[0]?.training ?? training;
  const correctionLimit = buildCorrectionLimit(selected.code, objective, attributes, primaryTraining, parsed);
  const marginalReturn = buildMarginalReturn(selected.code, objective, attributes, primaryTraining, parsed);
  const errorTolerance = buildErrorTolerance(parsed, selected.code, primaryTraining, trainingPointsTotal, exactPriority);
  const skillPriority = buildSkillPriority(parsed, selected.code, specialSkillsAnalysis);
  const playerIdentity = buildPlayerIdentity(parsed, selected.code, attributes);
  const cardDna = buildCardDnaAnalysis(selected.code, objective, attributes, parsed, buildVariants);
  const maxPrecision = buildMaxPrecisionAnalysis({ parsed, position: selected.code, selectedScore: selected.score, objective, tacticalProfile, baseAttributes: attributes, variants: buildVariants, trainingPointsTotal });
  const eliteEvolution = buildEliteEvolutionAnalysis({ parsed, position: selected.code, objective, tacticalProfile, baseAttributes: attributes, variants: buildVariants, maxPrecision });
  const metaBuildUniverse = buildMetaBuildUniverse({ parsed, position: selected.code, objective, tacticalProfile, baseAttributes: attributes, variants: buildVariants, maxPrecision, trainingPointsTotal });
  const profileTips = tacticalProfileTips(tacticalProfile, selected.code);
  const explanation = recommendationExplanation(parsed, selected.code, attributes, pri, avoidPositions, tacticalProfile);
  explanation.unshift(`${playerIdentity.profileLabel}. ${cardDna.lifeLikeSummary}`);
  if (explicitTarget) explanation.unshift(`Posição escolhida por você: ${selectedLabel}. Toda a ficha foi recalculada para essa função. O app apenas avalia a adaptação; a decisão final é sua.`);
  const note = validation.level === 'blocked'
    ? 'Conferência obrigatória: revise posição, estilo, atributos e pontos antes de gerar a ficha final.'
    : parsed.confidence >= 85
      ? 'Alta confiança. A identidade da carta foi preservada e a ficha foi gerada para desempenho real em campo, sem buscar GER máximo.'
      : parsed.confidence >= 60
        ? 'Confiança média. O motor local preservou a identidade provável da carta e compensou dados faltantes com regras de rendimento real.'
        : 'Confiança baixa. O motor local usou fallback seguro; revise os dados lidos para aumentar a precisão.';
  const confidenceLevel: DeepAnalysis['confidenceLevel'] = parsed.confidence >= 85 ? 'alta' : parsed.confidence >= 60 ? 'media' : 'baixa';
  const readingItems: DeepReadingItem[] = [
    { field: 'Nome', value: parsed.playerName, source: parsed.playerName !== 'Jogador não identificado' ? (parsed.manualConfirmed ? 'confirmado' : 'lido') : 'fallback', confidence: parsed.playerName !== 'Jogador não identificado' ? 'alta' : 'baixa', note: parsed.playerName !== 'Jogador não identificado' ? 'Identidade encontrada no cabeçalho/ajuste manual.' : 'Nome não identificado com segurança.' },
    { field: 'Posição original', value: parsed.mainPositionPt, source: parsed.manualConfirmed || parsed.evidence.positionLocked ? 'confirmado' : parsed.evidence.positionRatingsCount > 0 ? 'lido' : 'inferido', confidence: parsed.evidence.positionLocked ? 'alta' : parsed.confidence >= 70 ? 'media' : 'baixa', note: 'Mantida apenas como identidade original da carta.' },
    { field: 'Posição escolhida para a ficha', value: POSITION_PT[selected.code], source: targetPosition === 'AUTO' ? 'inferido' : 'confirmado', confidence: targetPosition === 'AUTO' ? 'media' : 'alta', note: targetPosition === 'AUTO' ? 'Sugestão automática do motor.' : 'Escolhida por você; o aplicativo não substitui nem bloqueia esta decisão.' },
    { field: 'Estilo original', value: parsed.playstyle ?? 'Não identificado', source: parsed.playstyle ? (parsed.manualConfirmed || parsed.evidence.playstyleLocked ? 'confirmado' : 'lido') : 'fallback', confidence: parsed.playstyle ? (parsed.evidence.playstyleLocked ? 'alta' : 'media') : 'baixa', note: parsed.playstyle ? 'Usado para calibrar a função real.' : 'A ficha foi calculada sem inventar estilo.' },
    { field: 'Pontos disponíveis', value: String(trainingPointsTotal), source: parsed.trainingPointSource === 'MANUAL' ? 'confirmado' : parsed.trainingPointSource === 'FALLBACK' ? 'fallback' : parsed.trainingPointSource === 'LEVEL_INFERRED' ? 'inferido' : 'lido', confidence: parsed.trainingPointSource === 'FALLBACK' ? 'baixa' : parsed.trainingPointSource === 'LEVEL_INFERRED' ? 'media' : 'alta', note: `Origem: ${parsed.trainingPointSource ?? 'FALLBACK'}.` },
    { field: 'Atributos', value: `${parsed.evidence.attributeCount} lidos`, source: parsed.evidence.attributeCount >= 12 ? 'lido' : 'inferido', confidence: parsed.evidence.attributeCount >= 18 ? 'alta' : parsed.evidence.attributeCount >= 8 ? 'media' : 'baixa', note: 'Atributos ausentes recebem apenas estimativa segura por posição e estilo.' }
  ];
  const uncertainFields = readingItems.filter((item) => item.confidence === 'baixa').map((item) => item.field);
  const deepAnalysis: DeepAnalysis = {
    confidenceLevel,
    originalIdentity: `${parsed.mainPositionPt}${parsed.playstyle ? ` • ${parsed.playstyle}` : ''}`,
    recommendedFunction: `${selectedLabel} • ${teamMap.functionLabel || selected.role}`,
    readingItems,
    uncertainFields,
    safeguards: [
      targetPosition === 'AUTO' ? 'A posição e o estilo originais permanecem separados da recomendação.' : `A ficha foi calculada diretamente para ${selectedLabel}. O app apenas informa o nível de adaptação em relação à posição original ${parsed.mainPositionPt}.`,
      'Nenhum valor ausente é exibido como se tivesse sido lido do print.',
      'A ficha não ultrapassa o orçamento de pontos.',
      'O motor reduz pontos em grupos que não ajudam a função real.',
      validation.level === 'blocked' ? 'A geração final exige revisão manual.' : 'A análise passou pelas travas principais de precisão.'
    ],
    pointRationale: explanation.slice(0, 5)
  };
  return { objective, parsed, bestPosition: selected, positionScores: visiblePositionScores, pri, tacticalFit, training, trainingCost, trainingPointsUsed, trainingPointsTotal, trainingPointsRemaining, trainingCostRule: trainingCostRuleText(), trainingComparison, buildVariants, recommendationExplanation: explanation, tacticalProfile, teamMap, profileTips, validation, permittedPositions, avoidPositions, recommendedSkills, skillRecommendations, avoidSkills, recommendedImpetos, buildName, strengths, weaknesses, usageTips: [...tips, ...profileTips, ...teamMap.matchPlan.slice(0, 2)], note, deepAnalysis, advancedTacticalFunction, specialSkillsAnalysis, physicalEngine, attributeGoals, advancedOptimizer, correctionLimit, marginalReturn, errorTolerance, skillPriority, playerIdentity, cardDna, maxPrecision, eliteEvolution, metaBuildUniverse, structuralPrecision };
}

/** Base enxuta de produção R142: mantém parsing/diagnósticos necessários, mas evita a busca exaustiva de uma ficha provisória que o Clean Slate nunca usa como autoridade. */
export function analyzeCardProductionBaseR142(rawText: string, objective: Objective = 'COMPETITIVE', targetPosition: PositionCode | 'AUTO' = 'AUTO', imageFileName?: string | null, tacticalProfile: TacticalProfile = { formation: 'AUTO', style: 'AUTO' }): AnalysisResult {
  return analyzeCard(rawText, objective, targetPosition, imageFileName, tacticalProfile, 'PRODUCTION_BASE');
}

// Compatibilidade com integrações e regressões anteriores; novas telas devem importar pela fachada modules/analysis.
export { ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES, OFFICIAL_ADDITIONAL_SKILL_NAMES, SPECIAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';
