import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R109_EXTREME_COMPAT_MARKER = 'BM_R109_EXTREME_COMPAT';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r109] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

function patchPipeline(input) {
  let source = input;
  if (source.includes('BM_R109_PIPELINE')) return source;

  source = replaceRequired(
    source,
    "import { enforceComplementarySkillIntegrity } from './skillIntegrity';",
    "import { enforceComplementarySkillIntegrity, synchronizeFinalSkillIntegrity } from './skillIntegrity';",
    'import da integridade final'
  );
  source = replaceRequired(
    source,
    "import { applyPerformanceEngine2027R108 } from './performanceEngine2027V4080R108';",
    "import { applyPerformanceEngine2027R108 } from './performanceEngine2027V4080R108';\nimport { applyPerformanceEngine2027R109 } from './performanceEngine2027V4080R109';",
    'import r109'
  );
  source = replaceRequired(
    source,
    '  current = applyPerformanceEngine2027R108(current);\n  current = applyMasterCardEngineV4080R50(current);',
    '  current = applyPerformanceEngine2027R108(current);\n  current = applyPerformanceEngine2027R109(current);\n  current = applyMasterCardEngineV4080R50(current);',
    'ordem r108 -> r109 -> Mestre'
  );
  source = replaceRequired(
    source,
    '  current = applyPlayerGenerationFinalizerV4080R13(current);\n  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };',
    "  current = applyPlayerGenerationFinalizerV4080R13(current);\n  current = synchronizeFinalSkillIntegrity(current);\n  // BM_R109_PIPELINE: a última auditoria espelha exatamente o Top 5 exibido.\n  return { ...current, buildVariants: current.buildVariants.slice(0, 3) };",
    'sincronização final das habilidades'
  );
  return source;
}

function patchMaster(input) {
  let source = input;
  if (source.includes('BM_R109_MASTER')) return source;

  source = replaceRequired(
    source,
    "import type { PerformanceEngine2027R108 } from './performanceEngine2027V4080R108';",
    "import type { PerformanceEngine2027R108 } from './performanceEngine2027V4080R108';\nimport type { PerformanceEngine2027R109 } from './performanceEngine2027V4080R109';",
    'tipo r109 no Mestre'
  );
  source = replaceRequired(
    source,
    '  performanceEngine2027R108?: PerformanceEngine2027R108;\n};',
    '  performanceEngine2027R108?: PerformanceEngine2027R108;\n  performanceEngine2027R109?: PerformanceEngine2027R109;\n};',
    'carrier r109 no Mestre'
  );

  const r109Function = `function applyR109WinnerInsideMaster(result: AnalysisResult): { result: AnalysisResult; applied: boolean } {
  const analysis = (result as AnalysisResult & { performanceEngine2027R109?: PerformanceEngine2027R109 }).performanceEngine2027R109;
  if (!analysis || !analysis.adaptationApplied) return { result, applied: false };
  const budget = Number(result.trainingPointsTotal ?? trainingPlanTotalCost(result.training));
  const candidate = analysis.appliedTraining;
  const canApply =
    analysis.guards.overallIgnored &&
    analysis.guards.formationIndependent &&
    analysis.guards.coreNeverRewritten &&
    analysis.guards.exactBudget &&
    analysis.guards.minimumCorePreservation &&
    analysis.guards.selectedPositionImproved &&
    analysis.guards.extremeLossControlled &&
    analysis.corePreservation >= 72 &&
    analysis.positionGain >= .15 &&
    trainingPlanTotalCost(candidate) === budget;
  if (!canApply) return { result, applied: false };
  return {
    applied: true,
    result: {
      ...result,
      training: { ...candidate },
      trainingPointsUsed: trainingPlanTotalCost(candidate),
      trainingPointsRemaining: 0,
      recommendationExplanation: [
        \`Motor Mestre aplicou Extreme Position r109 (núcleo \${analysis.corePreservation}% • ganho posicional +\${analysis.positionGain} • sem perseguir overall).\`,
        ...result.recommendationExplanation
      ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,112)
    }
  };
}

// BM_R109_MASTER: r109 adapta somente a execução da posição; r108 continua sendo o núcleo permanente.

`;
  source = replaceRequired(
    source,
    'function applyR108WinnerInsideMaster(result: AnalysisResult): { result: AnalysisResult; applied: boolean } {',
    r109Function + 'function applyR108WinnerInsideMaster(result: AnalysisResult): { result: AnalysisResult; applied: boolean } {',
    'função aplicadora r109'
  );

  source = replaceRequired(
    source,
    `  let result = applyFinalCardAuthorityV4080R45(input);
  const extremeR108 = applyR108WinnerInsideMaster(result);
  result = extremeR108.result;
  if (!extremeR108.applied) {
    const qualityR107 = applyR107WinnerInsideMaster(result);
    result = qualityR107.result;
    if (!qualityR107.applied) result = applyR70WinnerInsideMaster(result);
  }`,
    `  let result = applyFinalCardAuthorityV4080R45(input);
  const positionR109 = applyR109WinnerInsideMaster(result);
  result = positionR109.result;
  if (!positionR109.applied) {
    const extremeR108 = applyR108WinnerInsideMaster(result);
    result = extremeR108.result;
    if (!extremeR108.applied) {
      const qualityR107 = applyR107WinnerInsideMaster(result);
      result = qualityR107.result;
      if (!qualityR107.applied) result = applyR70WinnerInsideMaster(result);
    }
  }`,
    'prioridade r109 com fallback r108/r107/r70'
  );

  source = replaceRequired(
    source,
    "      'Motor Mestre r50 + Fundação r60: uma carta = uma identidade canônica permanente.',",
    "      'Motor Mestre r50 + Fundação r60: uma carta = uma identidade canônica permanente.',\n      'Regra de desempenho: extrair jogabilidade máxima sem perseguir overall; o overall exibido não participa da distribuição.',",
    'declaração anti-overall'
  );

  return source;
}

export function applyR109ExtremeCompat(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const pipelinePath = resolve(root, 'src/lib/cardIntelligencePipeline.ts');
  const masterPath = resolve(root, 'src/lib/masterCardEngineV4080R50.ts');
  if (!existsSync(pipelinePath) || !existsSync(masterPath)) throw new Error('[r109] pipeline/Motor Mestre não encontrados.');

  const pipelineBefore = readFileSync(pipelinePath, 'utf8');
  const masterBefore = readFileSync(masterPath, 'utf8');
  const pipelineAfter = patchPipeline(pipelineBefore);
  const masterAfter = patchMaster(masterBefore);
  if (pipelineAfter !== pipelineBefore) writeFileSync(pipelinePath, pipelineAfter, 'utf8');
  if (masterAfter !== masterBefore) writeFileSync(masterPath, masterAfter, 'utf8');
  console.log('v40.80 r109 aplicada: núcleo Extreme permanente + adaptação posicional final + Top 5 sincronizado.');
  return { changed: pipelineAfter !== pipelineBefore || masterAfter !== masterBefore };
}

export function transformPipelineR109(input) { return patchPipeline(input); }
export function transformMasterR109(input) { return patchMaster(input); }
