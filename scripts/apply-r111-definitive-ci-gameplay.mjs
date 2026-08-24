import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R111_DEFINITIVE_CI_GAMEPLAY_MARKER = 'BM_R111_DEFINITIVE_CI_GAMEPLAY';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`[r111] ${label}: contrato não encontrado.`);
  }
  return source.replace(needle, replacement);
}

function patchExtremeR108(input) {
  let source = input;
  if (source.includes('BM_R111_R108_DNA_REPAIR')) return source;

  const helper = `
function repairTechnicalDnaPlanR111(identity: CanonicalCardIdentityR60, plan: TrainingPlan): TrainingPlan {
  const technicalDominant =
    ['SS', 'AMF', 'LWF', 'RWF'].includes(identity.naturalPosition) &&
    Number(identity.dna.technical ?? 0) >= 88 &&
    Number(identity.dna.technical ?? 0) >= Math.max(
      Number(identity.dna.creation ?? 0),
      Number(identity.dna.finishing ?? 0)
    ) + 3;

  if (!technicalDominant) return plan;

  const original = { ...plan };
  const technical = Number(original.dribbling ?? 0) + Number(original.dexterity ?? 0);
  const creation = Number(original.shooting ?? 0) + Number(original.passing ?? 0);
  const physicalFinish = Number(original.shooting ?? 0) + Number(original.aerialStrength ?? 0);
  if (technical >= creation && technical >= physicalFinish) return original;

  const targetCost =
    trainingTotalCost(Number(original.shooting ?? 0)) +
    trainingTotalCost(Number(original.passing ?? 0)) +
    trainingTotalCost(Number(original.dribbling ?? 0)) +
    trainingTotalCost(Number(original.dexterity ?? 0));

  let best: { plan: TrainingPlan; distance: number; technicalMargin: number } | null = null;

  for (let shooting = 0; shooting <= 16; shooting += 1) {
    const shootingCost = trainingTotalCost(shooting);
    if (shootingCost > targetCost) break;
    for (let passing = 0; passing <= 16; passing += 1) {
      const firstCost = shootingCost + trainingTotalCost(passing);
      if (firstCost > targetCost) break;
      for (let dribbling = 0; dribbling <= 16; dribbling += 1) {
        const secondCost = firstCost + trainingTotalCost(dribbling);
        if (secondCost > targetCost) break;
        for (let dexterity = 0; dexterity <= 16; dexterity += 1) {
          const total = secondCost + trainingTotalCost(dexterity);
          if (total > targetCost) break;
          if (total !== targetCost) continue;

          const technicalInvestment = dribbling + dexterity;
          const creationInvestment = shooting + passing;
          const physicalFinishInvestment = shooting + Number(original.aerialStrength ?? 0);
          if (technicalInvestment < creationInvestment || technicalInvestment < physicalFinishInvestment) continue;

          const candidate: TrainingPlan = {
            ...original,
            shooting,
            passing,
            dribbling,
            dexterity
          };
          const distance =
            Math.abs(shooting - Number(original.shooting ?? 0)) +
            Math.abs(passing - Number(original.passing ?? 0)) +
            Math.abs(dribbling - Number(original.dribbling ?? 0)) +
            Math.abs(dexterity - Number(original.dexterity ?? 0));
          const technicalMargin = technicalInvestment - Math.max(creationInvestment, physicalFinishInvestment);

          if (
            !best ||
            distance < best.distance ||
            (distance === best.distance && technicalMargin > best.technicalMargin)
          ) {
            best = { plan: candidate, distance, technicalMargin };
          }
        }
      }
    }
  }

  return best?.plan ?? original;
}

// BM_R111_R108_DNA_REPAIR: cartas tecnicamente dominantes não podem terminar
// com mais investimento em chute+passe do que em drible+destreza.
`;

  source = replaceRequired(
    source,
    'export function applyPerformanceEngine2027R108(input: AnalysisResult): AnalysisResult {',
    helper + '\nexport function applyPerformanceEngine2027R108(input: AnalysisResult): AnalysisResult {',
    'helper DNA no r108'
  );

  source = replaceRequired(
    source,
    `  const generated = profiles.map((profile) => {
    const plan = optimize(input, identity, rules, profile, target) ?? input.training;
    return scorePerformancePlan2027R108(input, identity, plan, profile);
  });`,
    `  const generated = profiles.map((profile) => {
    const optimized = optimize(input, identity, rules, profile, target) ?? input.training;
    const plan = repairTechnicalDnaPlanR111(identity, optimized);
    return scorePerformancePlan2027R108(input, identity, plan, profile);
  });`,
    'candidatas r108 com reparo DNA'
  );

  return source;
}

function patchMaster(input) {
  let source = input;
  if (source.includes('BM_R111_MASTER_DNA_GUARDS')) return source;

  // r109
  source = replaceRequired(
    source,
    `    analysis.positionGain >= .15 &&
    trainingPlanTotalCost(candidate) === budget;`,
    `    analysis.positionGain >= .15 &&
    preservesPermanentCardDNA(result, candidate) &&
    trainingPlanTotalCost(candidate) === budget;`,
    'guarda DNA r109'
  );

  // r108
  source = replaceRequired(
    source,
    `    analysis.winner.responseScore >= 66 &&
    trainingPlanTotalCost(candidate) === budget;`,
    `    analysis.winner.responseScore >= 66 &&
    preservesPermanentCardDNA(result, candidate) &&
    trainingPlanTotalCost(candidate) === budget;`,
    'guarda DNA r108'
  );

  // r107
  source = replaceRequired(
    source,
    `    analysis.winner.totalScore >= 70 &&
    trainingPlanTotalCost(candidate) === budget;`,
    `    analysis.winner.totalScore >= 70 &&
    preservesPermanentCardDNA(result, candidate) &&
    trainingPlanTotalCost(candidate) === budget;`,
    'guarda DNA r107'
  );

  source = replaceRequired(
    source,
    `/**\n * r50 é a ÚNICA autoridade mutável no final do pipeline.`,
    `// BM_R111_MASTER_DNA_GUARDS: r109/r108/r107 só podem escrever fichas que preservem o DNA permanente.\n\n/**\n * r50 é a ÚNICA autoridade mutável no final do pipeline.`,
    'marcador Mestre r111'
  );

  return source;
}

function patchPipeline(input) {
  let source = input;
  if (source.includes('BM_R111_FINAL_ANTI_OVERALL')) return source;

  source = replaceRequired(
    source,
    `  current = synchronizeFinalSkillIntegrity(current);
  // BM_R109_PIPELINE: a última etapa RECONSTRÓI o Top 5 oficial pelo DNA/função e depois sincroniza a auditoria.
  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };`,
    `  current = synchronizeFinalSkillIntegrity(current);
  current = {
    ...current,
    recommendationExplanation: [
      'Desempenho extremo: ficha calculada sem perseguir overall; o overall exibido não participa da distribuição dos pontos.',
      ...current.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 112)
  };
  // BM_R111_FINAL_ANTI_OVERALL: a proteção anti-overall fica explícita também no resultado final.
  // BM_R109_PIPELINE: a última etapa RECONSTRÓI o Top 5 oficial pelo DNA/função e depois sincroniza a auditoria.
  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };`,
    'declaração final anti-overall'
  );

  return source;
}

export function applyR111DefinitiveCiGameplay(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const r108Path = resolve(root, 'src/lib/performanceEngine2027V4080R108.ts');
  const masterPath = resolve(root, 'src/lib/masterCardEngineV4080R50.ts');
  const pipelinePath = resolve(root, 'src/lib/cardIntelligencePipeline.ts');

  for (const path of [r108Path, masterPath, pipelinePath]) {
    if (!existsSync(path)) throw new Error(`[r111] arquivo obrigatório ausente: ${path}`);
  }

  const r108Before = readFileSync(r108Path, 'utf8');
  const masterBefore = readFileSync(masterPath, 'utf8');
  const pipelineBefore = readFileSync(pipelinePath, 'utf8');

  const r108After = patchExtremeR108(r108Before);
  const masterAfter = patchMaster(masterBefore);
  const pipelineAfter = patchPipeline(pipelineBefore);

  if (r108After !== r108Before) writeFileSync(r108Path, r108After, 'utf8');
  if (masterAfter !== masterBefore) writeFileSync(masterPath, masterAfter, 'utf8');
  if (pipelineAfter !== pipelineBefore) writeFileSync(pipelinePath, pipelineAfter, 'utf8');

  console.log('v40.80 r111 aplicada: DNA técnico protegido, anti-overall final e guardas definitivos do Motor Mestre.');
  return {
    changed: r108After !== r108Before || masterAfter !== masterBefore || pipelineAfter !== pipelineBefore
  };
}

export function transformExtremeR108R111(input) { return patchExtremeR108(input); }
export function transformMasterR111(input) { return patchMaster(input); }
export function transformPipelineR111(input) { return patchPipeline(input); }
