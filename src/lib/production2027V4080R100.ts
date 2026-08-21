import type { AnalysisResult, TrainingPlan } from './analyzerDomain';
import { trainingPlanTotalCost } from './trainingPlanCore';
import { skillIdentityKey } from './officialSkillIdentity';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import type { PerformanceEngine2027R70 } from './performanceEngine2027V4080R70';
import type { PermanentResources2027R80 } from './permanentResources2027V4080R80';
import type { PerformanceLab2027R90 } from './performanceLab2027V4080R90';

export const PRODUCTION_2027_R100_VERSION = '40.80-r100-production-2027' as const;

type MasterShape = {
  cardKey: string;
  masterTraining: TrainingPlan;
  permanentSkills: string[];
  permanentImpeto: { name: string | null; score: number; reason: string };
  guarantees: {
    singleTrainingAuthority: true;
    positionChangeDoesNotRegenerateRareResources: true;
    exactBudget: boolean;
    nativeSkillDuplicationBlocked: true;
    dualPhasePreserved: true;
  };
};

type Enriched = AnalysisResult & {
  canonicalCardIdentity2027R60?: CanonicalCardIdentityR60;
  performanceEngine2027R70?: PerformanceEngine2027R70;
  permanentResources2027R80?: PermanentResources2027R80;
  performanceLab2027R90?: PerformanceLab2027R90;
  masterCardV4080R50?: MasterShape;
};

export type Production2027R100 = {
  version: typeof PRODUCTION_2027_R100_VERSION;
  releaseChannel: 'PRODUCTION_2027';
  cardKey: string;
  productionReady: boolean;
  totalScore: number;
  identityScore: number;
  performanceScore: number;
  resourceScore: number;
  evidenceScore: number;
  buildSignature: string;
  identitySignature: string;
  warnings: string[];
  safeguards: {
    exactBudget: boolean;
    singleTrainingAuthority: boolean;
    dualPhasePreserved: boolean;
    staminaProtected: boolean;
    nativeSkillDuplicatesBlocked: boolean;
    rareResourcesProtected: boolean;
    labReadOnly: boolean;
    deterministicSignature: boolean;
  };
  verdict: string;
};

type WithProduction = AnalysisResult & { production2027R100: Production2027R100 };

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function compact(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function trainingSignature(plan: TrainingPlan) {
  const ordered = Object.entries(plan)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${Number(value ?? 0)}`)
    .join('|');
  return hashString(ordered);
}

function identitySignature(result: AnalysisResult, canonical?: CanonicalCardIdentityR60) {
  const parsed = result.parsed;
  const dna = canonical?.dna;
  const physical = parsed.physicalProfile;
  const value = [
    canonical?.cardKey ?? `${compact(parsed.playerName)}|${compact(parsed.cardType)}|${parsed.mainPosition}`,
    canonical?.attackPosition ?? result.bestPosition.code,
    canonical?.defencePosition ?? result.bestPosition.code,
    canonical?.offensivePlaystyle ?? parsed.offensivePlaystyle ?? parsed.playstyle ?? '',
    canonical?.defensivePlaystyle ?? parsed.defensivePlaystyle ?? '',
    dna?.technical ?? '', dna?.creation ?? '', dna?.finishing ?? '', dna?.mobility ?? '', dna?.physical ?? '', dna?.aerial ?? '', dna?.defending ?? '', dna?.stamina ?? '',
    parsed.height ?? '', parsed.weight ?? '', physical.legLength ?? '', physical.armSize ?? '', physical.shoulderWidth ?? '', physical.legCoverageRadius ?? ''
  ].join('|');
  return hashString(value);
}

function nativeDuplicateGuard(result: AnalysisResult, finalSkills: string[]) {
  const native = new Set((result.parsed.nativeSkills ?? []).map(skillIdentityKey));
  return finalSkills.every((skill) => !native.has(skillIdentityKey(skill)));
}

function evidenceScore(lab?: PerformanceLab2027R90) {
  if (!lab) return 55;
  const stageBase = lab.evidenceStage === 'VALIDADA' ? 100 : lab.evidenceStage === 'TESTADA' ? 86 : lab.evidenceStage === 'BENCHMARK' ? 74 : 62;
  return clamp(stageBase * .48 + lab.confidence * .32 + lab.consistency * .2);
}

export function applyProduction2027R100(input: AnalysisResult): WithProduction {
  const result = input as Enriched;
  const canonical = result.canonicalCardIdentity2027R60;
  const performance = result.performanceEngine2027R70;
  const resources = result.permanentResources2027R80;
  const lab = result.performanceLab2027R90;
  const master = result.masterCardV4080R50;

  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const spent = trainingPlanTotalCost(result.training);
  const finalSkills = resources?.permanentTop5?.length ? resources.permanentTop5 : master?.permanentSkills ?? result.recommendedSkills.slice(0, 5);
  const exactBudget = spent === budget;
  const singleAuthority = master?.guarantees.singleTrainingAuthority === true;
  const dualPhase = master?.guarantees.dualPhasePreserved === true && Boolean(canonical?.attackPosition) && Boolean(canonical?.defencePosition);
  const staminaProtected = performance?.guards.staminaProtected ?? true;
  const duplicatesBlocked = nativeDuplicateGuard(result, finalSkills);
  const rareProtected = Boolean(
    master?.guarantees.positionChangeDoesNotRegenerateRareResources &&
    (resources?.guards.rareResourceRegretProtected ?? true)
  );
  const labReadOnly = lab?.safeguards.readOnlyLab ?? true;

  const identity = clamp(canonical?.identityConfidence ?? 55);
  const performanceScore = clamp(performance?.winner.totalScore ?? 60);
  const resourceScore = clamp(resources?.confidence ?? (finalSkills.length === 5 ? 68 : 52));
  const evidence = evidenceScore(lab);
  const total = round(identity * .28 + performanceScore * .34 + resourceScore * .2 + evidence * .18);

  const buildSig = `${trainingSignature(result.training)}-${hashString(finalSkills.map(skillIdentityKey).sort().join('|'))}`;
  const identitySig = identitySignature(result, canonical);
  const warnings: string[] = [];
  if (!exactBudget) warnings.push(`Orçamento inconsistente: ${spent}/${budget} pontos.`);
  if (!singleAuthority) warnings.push('Autoridade única da ficha não foi confirmada.');
  if (!dualPhase) warnings.push('Ataque/defesa ainda não estão totalmente confirmados para esta carta.');
  if (!staminaProtected) warnings.push('Piso físico/stamina da função não foi preservado.');
  if (!duplicatesBlocked) warnings.push('Foi detectada habilidade adicional duplicando habilidade nativa.');
  if (!rareProtected) warnings.push('Recurso raro não atingiu o nível de permanência exigido.');
  if ((canonical?.identityConfidence ?? 0) < 62) warnings.push('Identidade da carta abaixo da confiança mínima para decisão cara.');
  if (lab?.risk === 'ALTO') warnings.push('Performance Lab classifica esta configuração como risco alto até haver mais evidência.');
  if (finalSkills.length !== 5) warnings.push(`Top 5 permanente incompleto (${finalSkills.length}/5).`);

  const safeguards = {
    exactBudget,
    singleTrainingAuthority: singleAuthority,
    dualPhasePreserved: dualPhase,
    staminaProtected,
    nativeSkillDuplicatesBlocked: duplicatesBlocked,
    rareResourcesProtected: rareProtected,
    labReadOnly,
    deterministicSignature: Boolean(buildSig && identitySig)
  };
  const hardReady = Object.values(safeguards).every(Boolean) && (canonical?.identityConfidence ?? 0) >= 62;
  const productionReady = hardReady && total >= 72;
  const verdict = productionReady
    ? `Produção 2027 aprovada: ${total}/100. Ficha Mestre fechada, recursos protegidos e duas fases preservadas.`
    : `Produção 2027 em revisão: ${total}/100. ${warnings[0] ?? 'Faltam evidências suficientes para liberar decisão definitiva.'}`;

  const analysis: Production2027R100 = {
    version: PRODUCTION_2027_R100_VERSION,
    releaseChannel: 'PRODUCTION_2027',
    cardKey: canonical?.cardKey ?? master?.cardKey ?? compact(result.parsed.playerName),
    productionReady,
    totalScore: total,
    identityScore: round(identity),
    performanceScore: round(performanceScore),
    resourceScore: round(resourceScore),
    evidenceScore: round(evidence),
    buildSignature: buildSig,
    identitySignature: identitySig,
    warnings,
    safeguards,
    verdict
  };

  return {
    ...result,
    production2027R100: analysis,
    recommendationExplanation: [
      `Production r100: ${productionReady ? 'APROVADA' : 'REVISAR'} • ${total}/100.`,
      `Identidade ${analysis.identityScore} • Performance ${analysis.performanceScore} • Recursos ${analysis.resourceScore} • Evidência ${analysis.evidenceScore}.`,
      `Assinatura da ficha ${analysis.buildSignature}; assinatura da identidade ${analysis.identitySignature}.`,
      warnings.length ? `Alertas r100: ${warnings.join(' ')}` : 'Sem alerta crítico r100: orçamento, stamina, duas fases e recursos raros passaram pelos guardas finais.',
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 110)
  } as WithProduction;
}
