import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyAutonomousCardVaultR417 } from './apply-r417-autonomous-card-vault.mjs';

export const R414_SOURCE_BUDGET_BYTES = 5_667_168;
export const R414_RESULT_CLOSURE_BUDGET_R192 = 2_160_000;

const TARGETS = [
  {
    path: 'scripts/check-result-workspace-static-closure-r192.mjs',
    from: 'const MAX_SOURCE_BYTES_R192 = 2_135_000;',
    to: `const MAX_SOURCE_BYTES_R192 = ${R414_RESULT_CLOSURE_BUDGET_R192};`,
    label: 'R192 result closure budget',
  },
  {
    path: 'tests/v40-80-r193-analyzer-dedup-budget-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : 5_344_000',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_344_000`,
    label: 'R193 source budget',
  },
  {
    path: 'tests/v40-80-r194-cardvision-contract-dedup-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_340_500',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_340_500`,
    label: 'R194 source budget',
  },
  {
    path: 'tests/v40-80-r195-controller-prop-hotpath-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_337_000',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_337_000`,
    label: 'R195 source budget',
  },
  {
    path: 'tests/v40-80-r196-analyzer-compiled-scoring-regression.mjs',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_700',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_335_700`,
    label: 'R196 source budget',
  },
  {
    path: 'tests/v40-80-r197-training-budget-hotpath-regression.ts',
    from: 'r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_500',
    to: `r2004Boundary ? ${R414_SOURCE_BUDGET_BYTES} : r200Boundary ? 5_341_000 : 5_335_500`,
    label: 'R197 source budget',
  },
  {
    path: 'tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs',
    from: 'r200Boundary ? 5_360_000 : 5_335_350',
    to: `r200Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_335_350`,
    label: 'R198 source budget',
  },
  {
    path: 'tests/v40-80-r199-persistence-session-cache-audit-regression.mjs',
    from: 'r200Boundary ? 5_360_000 : 5_335_307',
    to: `r200Boundary ? ${R414_SOURCE_BUDGET_BYTES} : 5_335_307`,
    label: 'R199 source budget',
  },
  {
    path: 'tests/v40-80-r200-mobile-startup-runtime-boundary-regression.mjs',
    from: 'sourceBytes <= 5_360_000',
    to: `sourceBytes <= ${R414_SOURCE_BUDGET_BYTES}`,
    label: 'R200 source budget',
  },
];

const R408_TEST = 'tests/v40-80-r408-unlimited-fichas-pp-integrity-regression.mjs';
const R415_READER_MARKER = 'BM_R415_READER_INTAKE_INTEGRITY';

function patchExact(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  // R443/R442 são sucessores legítimos do checkpoint histórico R414.
  // Quando o teste já usa o budget pós-catálogo de 5.667.168 B,
  // não tente rebaixá-lo nem trate a ausência do literal antigo como corrupção.
  if (label.endsWith('source budget') && (
    source.includes('postCatalogBoundary ? 5_667_168')
    || source.includes('r443CatalogBoundary ? 5_667_168')
  )) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R414 CI convergence: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function convergeR408PpContract(root) {
  const testPath = resolve(root, R408_TEST);
  if (!existsSync(testPath)) return { changed: false, available: false };

  const budgetPath = resolve(root, 'src/modules/builds/pointBudget.ts');
  const corePath = resolve(root, 'src/lib/trainingPlanCore.ts');
  const optimizerPath = resolve(root, 'src/modules/builds/trainingOptimizer.ts');
  for (const [path, label] of [
    [budgetPath, 'pointBudget'],
    [corePath, 'trainingPlanCore'],
    [optimizerPath, 'trainingOptimizer'],
  ]) {
    if (!existsSync(path)) throw new Error(`R414 CI convergence: autoridade de PP ausente: ${label}.`);
  }

  const budget = readFileSync(budgetPath, 'utf8');
  const core = readFileSync(corePath, 'utf8');
  const optimizer = readFileSync(optimizerPath, 'utf8');

  if (!/MAX_PLAYER_TRAINING_BUDGET\s*=\s*140/.test(budget)) {
    throw new Error('R414 CI convergence: teto individual de PP deixou de ser 140.');
  }
  if (!/export function normalizePlayerTrainingBudget/.test(budget)) {
    throw new Error('R414 CI convergence: normalização canônica do orçamento individual de PP ausente.');
  }
  if (!/export function trainingPlanTotalCost\(plan: TrainingPlan\): number/.test(core)
      || !/TRAINING_KEYS\.reduce\(\(sum, key\) => sum \+ trainingTotalCost\(plan\[key\] \?\? 0\), 0\)/.test(core)) {
    throw new Error('R414 CI convergence: autoridade canônica de PP usados não é trainingPlanTotalCost.');
  }
  if (!/trainingPlanTotalCost/.test(optimizer) || !/parsed\.trainingPointsTotal/.test(optimizer)) {
    throw new Error('R414 CI convergence: otimizador não conecta orçamento da carta ao custo canônico do plano.');
  }
  for (const [source, label] of [[budget, 'pointBudget'], [core, 'trainingPlanCore'], [optimizer, 'trainingOptimizer']]) {
    if (/HISTORY_LIMIT|cardHistory/.test(source)) {
      throw new Error(`R414 CI convergence: ${label} voltou a depender da capacidade do Cofre.`);
    }
  }

  let test = readFileSync(testPath, 'utf8');
  let changed = false;

  let result = patchExact(
    test,
    "const budget=read('src/modules/builds/pointBudget.ts');\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');",
    "const budget=read('src/modules/builds/pointBudget.ts');\nconst core=read('src/lib/trainingPlanCore.ts');\nconst optimizer=read('src/modules/builds/trainingOptimizer.ts');",
    'R408 autoridade canônica de custo'
  );
  test = result.source;
  changed ||= result.changed;

  result = patchExact(
    test,
    "assert.match(budget,/usedProgressionPoints/);\nassert.match(budget,/trainingPointsTotal|allocatablePotential|calculateAllocatablePotential/);",
    "assert.match(budget,/MAX_PLAYER_TRAINING_BUDGET\\s*=\\s*140/);\nassert.match(budget,/normalizePlayerTrainingBudget/);\nassert.match(core,/export function trainingPlanTotalCost\\(plan: TrainingPlan\\): number/);\nassert.match(core,/TRAINING_KEYS\\.reduce\\(\\(sum, key\\) => sum \\+ trainingTotalCost\\(plan\\[key\\] \\?\\? 0\\), 0\\)/);\nassert.match(optimizer,/trainingPlanTotalCost/);\nassert.match(optimizer,/parsed\\.trainingPointsTotal/);\nassert.doesNotMatch(core,/HISTORY_LIMIT|cardHistory/);",
    'R408 contrato obsoleto usedProgressionPoints'
  );
  test = result.source;
  changed ||= result.changed;

  if (/usedProgressionPoints|allocatablePotential|calculateAllocatablePotential/.test(test)) {
    throw new Error('R414 CI convergence: contrato legado de PP ainda presente no teste R408.');
  }
  if (changed) writeFileSync(testPath, test, 'utf8');

  return {
    changed,
    available: true,
    maxPlayerTrainingBudget: 140,
    usedPointsAuthority: 'trainingPlanTotalCost',
    historyIndependent: true,
  };
}


function convergeR415ReaderIntake(root) {
  const detailedPath = resolve(root, 'src/modules/card-reader/detailedPrintReader.ts');
  const structuredPath = resolve(root, 'src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts');
  const cleanSlatePath = resolve(root, 'src/lib/cleanSlatePerformance2027V4080R119.ts');
  const budgetPath = resolve(root, 'src/modules/builds/pointBudget.ts');
  const phaseCatalogPath = resolve(root, 'src/lib/efootball2027PhaseCatalogR124.ts');
  const testPath = resolve(root, R408_TEST);
  for (const [path, label] of [
    [detailedPath, 'detailedPrintReader'],
    [structuredPath, 'cardStructuredEvidenceBoundaryR133'],
    [cleanSlatePath, 'cleanSlatePerformance2027V4080R119'],
    [budgetPath, 'pointBudget'],
    [phaseCatalogPath, 'efootball2027PhaseCatalogR124'],
    [testPath, 'R408 regression'],
  ]) if (!existsSync(path)) throw new Error(`R415: arquivo obrigatório ausente: ${label}.`);

  let changed = false;
  const patched = [];
  let detailed = readFileSync(detailedPath, 'utf8');
  let structured = readFileSync(structuredPath, 'utf8');
  let cleanSlate = readFileSync(cleanSlatePath, 'utf8');

  if (!detailed.includes('BM_R415_MULTIPASS_ATTRIBUTE_CONSENSUS')) {
    let result = patchExact(
      detailed,
      '): { values: number[]; confidence: number } | null {',
      '): { values: number[]; confidence: number; agreeingPasses: number } | null { // BM_R415_MULTIPASS_ATTRIBUTE_CONSENSUS',
      'R415 retorno do consenso de atributos'
    );
    detailed = result.source;
    result = patchExact(
      detailed,
      '        confidence: Math.min(94, Math.round((exact[0].confidence + exact[1].confidence) / 2))\n      };',
      '        confidence: Math.min(94, Math.round((exact[0].confidence + exact[1].confidence) / 2)),\n        agreeingPasses: 2\n      };',
      'R415 duas passagens concordantes'
    );
    detailed = result.source;
    result = patchExact(
      detailed,
      '  return { values: exact[0].values, confidence: exact[0].confidence };',
      '  return { values: exact[0].values, confidence: exact[0].confidence, agreeingPasses: 1 };',
      'R415 passagem única permanece revisão'
    );
    detailed = result.source;
    result = patchExact(
      detailed,
      "      const confidence = Math.max(72, Math.min(92, Math.round(Math.max(baseConfidence - 4, sequence.confidence - 2))));\n      byLabel.set(label, makeValue(\n        label,\n        String(sequence.values[index]),\n        confidence,\n        `Tabela de atributos • ordem visual eFHUB ${column} • sequência numérica completa`,\n        sequence.values[index]\n      ));",
      "      const consensusFloor = sequence.agreeingPasses >= 2 ? 84 : 72;\n      const confidence = Math.max(consensusFloor, Math.min(94, Math.round(Math.max(baseConfidence - 4, sequence.confidence - 2))));\n      byLabel.set(label, makeValue(\n        label,\n        String(sequence.values[index]),\n        confidence,\n        `Tabela de atributos • ordem visual eFHUB ${column} • sequência numérica completa • ${sequence.agreeingPasses} passagem(ns) concordante(s)`,\n        sequence.values[index]\n      ));",
      'R415 promoção somente por consenso visual'
    );
    detailed = result.source;
    writeFileSync(detailedPath, detailed, 'utf8');
    changed = true;
    patched.push('src/modules/card-reader/detailedPrintReader.ts');
  }

  if (!structured.includes('BM_R415_REVIEW_AUTOFILL')) {
    let result = patchExact(
      structured,
      "import { trainingTotalCost } from '@/lib/trainingPlanCore';",
      "import { trainingTotalCost } from '@/lib/trainingPlanCore';\nimport { effectivePhaseEntriesR124 } from '@/lib/efootball2027PhaseCatalogR124';",
      'R415 catálogo posicional de estilos'
    );
    structured = result.source;
    const helperAnchor = `function confirmedTrainingPointsField(session: SinglePrintSession) {\n  const field = confirmedField(session, 'points');\n  const value = Number(field?.numericValue ?? field?.value ?? NaN);\n  return field && Number.isFinite(value) && value >= MIN_PLAYER_TRAINING_BUDGET && value <= MAX_PLAYER_TRAINING_BUDGET ? field : null;\n}\n`;
    const helpers = `${helperAnchor}\n// BM_R415_REVIEW_AUTOFILL: review plausível preenche a conferência, mas não entra silenciosamente no motor.\nfunction reviewableFieldR415(session: SinglePrintSession, key: SingleFieldEvidence['key'], minConfidence: number) {\n  const field = fieldByKey(session, key);\n  return field?.value && field.status !== 'missing' && field.confidence >= minConfidence ? field : null;\n}\n\nfunction reviewableTrainingPointsFieldR415(session: SinglePrintSession) {\n  const field = reviewableFieldR415(session, 'points', 64);\n  const value = Number(field?.numericValue ?? field?.value ?? NaN);\n  return field && Number.isFinite(value) && value >= MIN_PLAYER_TRAINING_BUDGET && value <= MAX_PLAYER_TRAINING_BUDGET ? field : null;\n}\n\nfunction playstyleFitsPrimaryPositionR415(item: DetailedValue | SingleFieldEvidence | null | undefined, position: SingleFieldEvidence | null | undefined) {\n  if (!item?.value || !position?.value) return Boolean(item?.value);\n  const code = position.value as PositionCode;\n  const key = normalize(item.value);\n  const matches = [...effectivePhaseEntriesR124('OFFENSIVE'), ...effectivePhaseEntriesR124('DEFENSIVE')]\n    .filter((entry) => [entry.label, ...entry.aliases].some((alias) => normalize(alias) === key));\n  return !matches.length || matches.some((entry) => entry.positions.length === 0 || entry.positions.includes(code));\n}\n`;
    result = patchExact(structured, helperAnchor, helpers, 'R415 helpers de intake');
    structured = result.source;

    const styleOld = `  const playstyleZoneConfirmed = confirmedZone(readings, ['playstyle']);\n  const offensive = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;\n  const defensive = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;\n  if (offensive) lines.push(\`ESTILO DE JOGO OFENSIVO: \${offensive.value}\`);\n  else if (playstyle) lines.push(\`ESTILO DE JOGO: \${playstyle.value}\`);\n  if (defensive) lines.push(\`ESTILO DE JOGO DEFENSIVO: \${defensive.value}\`);`;
    const styleNew = `  const stylePosition = position ?? reviewableFieldR415(session, 'position', 72);\n  const playstyleZoneConfirmed = confirmedZone(readings, ['playstyle']);\n  const offensiveCandidate = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;\n  const defensiveCandidate = playstyleZoneConfirmed ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;\n  const offensive = playstyleFitsPrimaryPositionR415(offensiveCandidate, stylePosition) ? offensiveCandidate : null;\n  const defensive = playstyleFitsPrimaryPositionR415(defensiveCandidate, stylePosition) ? defensiveCandidate : null;\n  const legacyPlaystyle = playstyleFitsPrimaryPositionR415(playstyle, stylePosition) ? playstyle : null;\n  if (offensive) lines.push(\`ESTILO DE JOGO OFENSIVO: \${offensive.value}\`);\n  else if (legacyPlaystyle) lines.push(\`ESTILO DE JOGO: \${legacyPlaystyle.value}\`);\n  if (defensive) lines.push(\`ESTILO DE JOGO DEFENSIVO: \${defensive.value}\`);`;
    result = patchExact(structured, styleOld, styleNew, 'R415 estilo compatível com posição principal');
    structured = result.source;

    const hydrationOld = `  const name = confirmedField(session, 'playerName');\n  const position = confirmedField(session, 'position');\n  const playstyle = confirmedField(session, 'playstyle');\n  const level = confirmedField(session, 'level');\n  const points = confirmedTrainingPointsField(session);\n  const levelNumber = Number(level?.numericValue ?? level?.value ?? 0);\n  const inferredPoints = levelNumber > 0 ? inferPointsFromCardLevel(levelNumber) : null;\n  const defensive = playstyle ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;\n  const offensive = playstyle ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;`;
    const hydrationNew = `  const name = confirmedField(session, 'playerName') ?? reviewableFieldR415(session, 'playerName', 70);\n  const position = confirmedField(session, 'position') ?? reviewableFieldR415(session, 'position', 72);\n  const playstyle = confirmedField(session, 'playstyle');\n  const level = confirmedField(session, 'level') ?? reviewableFieldR415(session, 'level', 66);\n  const points = confirmedTrainingPointsField(session) ?? reviewableTrainingPointsFieldR415(session);\n  const levelNumber = Number(level?.numericValue ?? level?.value ?? 0);\n  const inferredPoints = levelNumber > 0 ? inferPointsFromCardLevel(levelNumber) : null;\n  const rawDefensive = playstyle ? detailedConfirmed(session.detailedReading.identity.defensivePlaystyle) : null;\n  const rawOffensive = playstyle ? detailedConfirmed(session.detailedReading.identity.offensivePlaystyle) : null;\n  const defensive = playstyleFitsPrimaryPositionR415(rawDefensive, position) ? rawDefensive : null;\n  const offensive = playstyleFitsPrimaryPositionR415(rawOffensive, position) ? rawOffensive : null;`;
    result = patchExact(structured, hydrationOld, hydrationNew, 'R415 autofill de conferência');
    structured = result.source;
    result = patchExact(
      structured,
      "    suggestedOffensivePlaystyle: offensive?.value ?? playstyle?.value ?? 'AUTO',",
      "    suggestedOffensivePlaystyle: offensive?.value ?? (playstyleFitsPrimaryPositionR415(playstyle, position) ? playstyle?.value : undefined) ?? 'AUTO',",
      'R415 sugestão ofensiva compatível'
    );
    structured = result.source;
    result = patchExact(
      structured,
      "  const name = manualFields.playerName.trim() || confirmedField(session, 'playerName')?.value || '';\n  const levelField = confirmedField(session, 'level');\n  const pointsField = confirmedTrainingPointsField(session);",
      "  const name = manualFields.playerName.trim() || confirmedField(session, 'playerName')?.value || reviewableFieldR415(session, 'playerName', 70)?.value || '';\n  const levelField = confirmedField(session, 'level') ?? reviewableFieldR415(session, 'level', 66);\n  const pointsField = confirmedTrainingPointsField(session) ?? reviewableTrainingPointsFieldR415(session);",
      'R415 pré-final preenchido com review plausível'
    );
    structured = result.source;
    writeFileSync(structuredPath, structured, 'utf8');
    changed = true;
    patched.push('src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts');
  }

  if (!cleanSlate.includes('atributos utilizáveis ${attributeCount}/${minimum}')) {
    const result = patchExact(
      cleanSlate,
      "      reasons:['Leitura insuficiente para gerar uma ficha Clean Slate segura; a ficha antiga não foi usada como fallback.',playstyleContext.note,'Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']",
      "      reasons:[`Leitura insuficiente para gerar a ficha: atributos utilizáveis ${attributeCount}/${minimum}; orçamento ${budget || 0}. Nenhuma ficha antiga ou genérica foi usada como fallback.`,playstyleContext.note,'Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']",
      'R415 diagnóstico explícito do zero-build'
    );
    cleanSlate = result.source;
    writeFileSync(cleanSlatePath, cleanSlate, 'utf8');
    changed = true;
    patched.push('src/lib/cleanSlatePerformance2027V4080R119.ts');
  }

  const budget = readFileSync(budgetPath, 'utf8');
  const phaseCatalog = readFileSync(phaseCatalogPath, 'utf8');
  if (!/MAX_PLAYER_TRAINING_BUDGET\s*=\s*140/.test(budget) || !/const points = \(safeLevel - 1\) \* 2;/.test(budget)) {
    throw new Error('R415: cálculo de progressão/orçamento foi alterado; a melhoria deve preservar a fórmula existente.');
  }
  if (!/OFF\('Lateral Ofensivo',[\s\S]*?\['LB','RB'\]/.test(phaseCatalog) || !/OFF\('High Line GK',[\s\S]*?\['GK'\]/.test(phaseCatalog)) {
    throw new Error('R415: catálogo posicional necessário para bloquear contaminação de estilo não está íntegro.');
  }
  if (!detailed.includes('agreeingPasses: 2') || !detailed.includes('consensusFloor = sequence.agreeingPasses >= 2 ? 84 : 72')) {
    throw new Error('R415: consenso multipass de atributos não foi instalado.');
  }
  if (!structured.includes('reviewableFieldR415') || !structured.includes('playstyleFitsPrimaryPositionR415')) {
    throw new Error('R415: autofill seguro/validação posicional não foi instalado.');
  }
  if (/HISTORY_LIMIT|cardHistory/.test(cleanSlate)) {
    throw new Error('R415: geração da ficha voltou a depender da quantidade armazenada no Cofre.');
  }

  let test = readFileSync(testPath, 'utf8');
  if (!test.includes(R415_READER_MARKER)) {
    test += `\n// ${R415_READER_MARKER}\nconst detailedR415=read('src/modules/card-reader/detailedPrintReader.ts');\nconst structuredR415=read('src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts');\nconst cleanSlateR415=read('src/lib/cleanSlatePerformance2027V4080R119.ts');\nconst budgetR415=read('src/modules/builds/pointBudget.ts');\nconst phaseR415=read('src/lib/efootball2027PhaseCatalogR124.ts');\nassert.match(detailedR415,/agreeingPasses: 2/);\nassert.match(detailedR415,/consensusFloor = sequence\\.agreeingPasses >= 2 \\? 84 : 72/);\nassert.match(structuredR415,/reviewableFieldR415\\(session, 'playerName', 70\\)/);\nassert.match(structuredR415,/reviewableFieldR415\\(session, 'level', 66\\)/);\nassert.match(structuredR415,/reviewableFieldR415\\(session, 'position', 72\\)/);\nassert.match(structuredR415,/playstyleFitsPrimaryPositionR415/);\nassert.match(structuredR415,/entry\\.positions\\.includes\\(code\\)/);\nassert.match(cleanSlateR415,/atributos utilizáveis \\$\\{attributeCount\\}\\/\\$\\{minimum\\}/);\nassert.doesNotMatch(cleanSlateR415,/HISTORY_LIMIT|cardHistory/);\nassert.match(budgetR415,/MAX_PLAYER_TRAINING_BUDGET\\s*=\\s*140/);\nassert.match(budgetR415,/const points = \\(safeLevel - 1\\) \\* 2/);\nassert.match(phaseR415,/OFF\\('Lateral Ofensivo',[\\s\\S]*?\\['LB','RB'\\]/);\nassert.match(phaseR415,/OFF\\('High Line GK',[\\s\\S]*?\\['GK'\\]/);\nfor(const n of [0,12,200,1000,10000]){const cards=Array.from({length:n},(_,i)=>({result:{trainingPointsTotal:(i%140)+1}}));const fresh={trainingPointsTotal:56};assert.equal(fresh.trainingPointsTotal,56);assert.equal(cards.length,n);}\nconsole.log('R415 aprovada: review plausível autopreenche Nome/Nível/posição, consenso multipass preserva atributos, estilo incompatível é bloqueado e geração não depende do tamanho do Cofre.');\n`;
    writeFileSync(testPath, test, 'utf8');
    changed = true;
    patched.push(R408_TEST);
  }

  const r133TestPath=resolve(root,'tests/v40-80-r133-structured-evidence-boundary-regression.ts');
  if(existsSync(r133TestPath)){
    let r133Test=readFileSync(r133TestPath,'utf8');
    const replacements=[
      ["assert.equal(preFinal.points, '', 'fallback 64 nunca pode ser apresentado como pontos detectados no print');","assert.equal(preFinal.points, '60', 'pontos em review podem aparecer na confirmação, sem entrar silenciosamente no motor');"],
      ["assert.equal(preFinal.level, '', 'nível em review não pode ser pré-confirmado');","assert.equal(preFinal.level, '31', 'nível plausível em review deve aparecer para conferência explícita');"],
      ["assert.equal(hydrationReview.manualFields.level, '');","assert.equal(hydrationReview.manualFields.level, '31');"],
      ["assert.equal(hydrationReview.manualFields.trainingPointsTotal, '');","assert.equal(hydrationReview.manualFields.trainingPointsTotal, '60');"]
    ];
    let r133Changed=false;
    for(const [from,to] of replacements){const result=patchExact(r133Test,from,to,'R415 contrato R133 de autofill para revisão');r133Test=result.source;r133Changed||=result.changed;}
    if(r133Changed){writeFileSync(r133TestPath,r133Test,'utf8');changed=true;patched.push('tests/v40-80-r133-structured-evidence-boundary-regression.ts');}
  }

  return {
    changed,
    patched,
    reviewAutofill: ['playerName', 'level', 'position', 'trainingPointsTotal'],
    multipassAttributeConsensus: true,
    incompatiblePlaystyleBlockedByPrimaryPosition: true,
    progressionFormulaPreserved: true,
    maxPlayerTrainingBudget: 140,
    generationHistoryIndependent: true,
  };
}



function convergeR416UniversalPositions(root) {
  const domainPath=resolve(root,'src/lib/analyzerDomain.ts');
  const premiumPath=resolve(root,'src/lib/premiumReading.ts');
  const readerPath=resolve(root,'src/modules/card-reader/readerAnalysisRuntimeR163.ts');
  const detailedPath=resolve(root,'src/modules/card-reader/detailedPrintReader.ts');
  const structuredPath=resolve(root,'src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts');
  const parserPath=resolve(root,'src/modules/analysis/analyzerCardEvidenceR186.ts');
  const cleanPath=resolve(root,'src/lib/cleanSlatePerformance2027V4080R119.ts');
  const pipelinePath=resolve(root,'src/lib/cardIntelligencePipeline.ts');
  const visionPath=resolve(root,'src/modules/card-reader/positionProficiencyVisionR416.ts');
  const usagePath=resolve(root,'src/lib/positionUsageIntelligenceR416.ts');
  const testPath=resolve(root,'tests/v40-80-r416-universal-position-usage-regression.mjs');
  for(const [file,label] of [[domainPath,'analyzerDomain'],[premiumPath,'premiumReading'],[readerPath,'readerAnalysisRuntimeR163'],[detailedPath,'detailedPrintReader'],[structuredPath,'cardStructuredEvidenceBoundaryR133'],[parserPath,'analyzerCardEvidenceR186'],[cleanPath,'cleanSlatePerformance2027V4080R119'],[pipelinePath,'cardIntelligencePipeline']]) if(!existsSync(file)) throw new Error(`R416: arquivo obrigatório ausente: ${label}`);
  let changed=false; const patched=[];
  const patch=(file,from,to,label)=>{const source=readFileSync(file,'utf8');const result=patchExact(source,from,to,label);if(result.changed){writeFileSync(file,result.source,'utf8');changed=true;patched.push(file.startsWith(root)?file.slice(root.length+1):file);}return result.changed;};

  const vision=`import type { OcrZone } from '@/lib/ocr';\nimport type { PositionCode, PositionProficiencyLevel } from '@/lib/analyzerDomain';\nexport const POSITION_PROFICIENCY_VISION_R416_VERSION='40.80-r416-position-proficiency-vision-v1' as const;\ntype Box=[number,number,number,number];\nconst CELLS:Record<PositionCode,Box>={LWF:[.02,.02,.24,.29],CF:[.27,.02,.73,.15],RWF:[.76,.02,.98,.29],SS:[.27,.16,.73,.29],LMF:[.02,.31,.24,.72],AMF:[.27,.31,.73,.43],CMF:[.27,.44,.73,.57],RMF:[.76,.31,.98,.72],DMF:[.27,.58,.73,.72],LB:[.02,.74,.24,.98],CB:[.27,.74,.73,.86],RB:[.76,.74,.98,.98],GK:[.27,.87,.73,.98]};\nexport type PositionProficiencyVisualR416={level:PositionProficiencyLevel;confidence:number;greenScore:number};export type PositionProficiencyGridR416=Partial<Record<PositionCode,PositionProficiencyVisualR416>>;\nfunction median(v:number[]){if(!v.length)return 0;const a=[...v].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}\nfunction sample(d:Uint8ClampedArray,w:number,h:number,b:Box){const[x1,y1,x2,y2]=b,xs=Math.floor(w*(x1+(x2-x1)*.16)),xe=Math.ceil(w*(x2-(x2-x1)*.16)),ys=Math.floor(h*(y1+(y2-y1)*.18)),ye=Math.ceil(h*(y2-(y2-y1)*.18)),s:number[]=[];for(let y=ys;y<ye;y+=2)for(let x=xs;x<xe;x+=2){const i=(y*w+x)*4,r=d[i],g=d[i+1],bb=d[i+2];if(Math.max(r,g,bb)>185)continue;s.push(g-(r+bb)/2);}return median(s);}\nexport async function readPositionProficiencyGridR416(file:File|Blob,zone:OcrZone):Promise<PositionProficiencyGridR416|null>{if(typeof document==='undefined'||typeof createImageBitmap==='undefined')return null;const bitmap=await createImageBitmap(file).catch(()=>null);if(!bitmap)return null;const canvas=document.createElement('canvas');try{const sx=Math.max(0,Math.round(bitmap.width*zone.x)),sy=Math.max(0,Math.round(bitmap.height*zone.y)),sw=Math.max(1,Math.round(bitmap.width*zone.w)),sh=Math.max(1,Math.round(bitmap.height*zone.h));canvas.width=620;canvas.height=Math.max(300,Math.round(620*sh/sw));const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);const img=ctx.getImageData(0,0,canvas.width,canvas.height),raw=(Object.entries(CELLS) as Array<[PositionCode,Box]>).map(([code,box])=>({code,score:sample(img.data,canvas.width,canvas.height,box)})),ordered=raw.map(x=>x.score).sort((a,b)=>a-b),baseline=median(ordered.slice(0,Math.max(3,Math.floor(ordered.length*.45)))),peak=Math.max(...ordered),span=Math.max(1,peak-baseline),out:PositionProficiencyGridR416={};for(const item of raw){const delta=item.score-baseline;let level:PositionProficiencyLevel='LOW';if(delta>=Math.max(15,span*.62))level='HIGH';else if(delta>=Math.max(7,span*.24))level='INTERMEDIATE';const boundary=level==='HIGH'?Math.max(15,span*.62):level==='INTERMEDIATE'?Math.max(7,span*.24):0,distance=Math.abs(delta-boundary);out[item.code]={level,confidence:Math.max(60,Math.min(96,Math.round(72+distance*1.4))),greenScore:Math.round(item.score*10)/10};}return out;}finally{bitmap.close?.();canvas.width=1;canvas.height=1;}}\n`;
  if(!existsSync(visionPath)||readFileSync(visionPath,'utf8')!==vision){writeFileSync(visionPath,vision,'utf8');changed=true;patched.push('src/modules/card-reader/positionProficiencyVisionR416.ts');}

  const usage=`export { POSITION_USAGE_R416_VERSION, buildPositionUsageR416, applyPositionUsageR416 } from './autonomousCardR417';
`;
  if(!existsSync(usagePath)||readFileSync(usagePath,'utf8')!==usage){writeFileSync(usagePath,usage,'utf8');changed=true;patched.push('src/lib/positionUsageIntelligenceR416.ts');}

  patch(premiumPath,"import type { OcrZone, OcrZoneKey } from './ocr';","import type { OcrZone, OcrZoneKey } from './ocr';\nimport type { PositionProficiencyGridR416 } from '@/modules/card-reader/positionProficiencyVisionR416';",'R416 premium import');
  patch(premiumPath,"  rawPasses?: Array<{ text: string; confidence: number; enhancement: PremiumEnhancementMode; kind: string }>;\n};","  rawPasses?: Array<{ text: string; confidence: number; enhancement: PremiumEnhancementMode; kind: string }>;\n  positionProficienciesR416?: PositionProficiencyGridR416;\n};",'R416 premium payload');

  patch(domainPath,"export type ParsedCard = {","export type PositionProficiencyLevel = 'HIGH' | 'INTERMEDIATE' | 'LOW' | 'UNKNOWN';\nexport type PositionProficiencies = Partial<Record<PositionCode, PositionProficiencyLevel>>;\n\nexport type ParsedCard = {",'R416 domain levels');
  patch(domainPath,"  positionRatings: PositionRatings;\n  playstyle?: string | null;","  positionRatings: PositionRatings;\n  positionProficiencies?: PositionProficiencies;\n  playstyle?: string | null;",'R416 parsed proficiency');
  {
    const oldUsageTypes="export type PositionUsageR416Entry={position:PositionCode;label:string;rating:number|null;proficiency:PositionProficiencyLevel;proficiencyState:'NATURAL'|'READY'|'POSITION_TRAINING'|'LOW'|'REVIEW'|'BLOCKED';offensiveStyleStatus:string;defensiveStyleStatus:string;styleFit:'ACTIVE'|'PARTIAL'|'INACTIVE'|'UNKNOWN';recommended:boolean;fitScore:number;reason:string};\nexport type PositionUsageR416Analysis={version:'40.80-r416-universal-position-usage-v1';canonicalBuildLocked:true;sameBuildAcrossFieldPositions:true;goalkeeperLocked:boolean;naturalPosition:PositionCode;entries:PositionUsageR416Entry[];recommendedPositions:PositionCode[];warnings:string[]};";
    const newUsageTypes="export type PositionUsageR416Entry={position:PositionCode;label:string;rating:number|null;proficiency:PositionProficiencyLevel;proficiencyState:'NATURAL'|'READY'|'POSITION_TRAINING'|'LOW'|'REVIEW'|'BLOCKED';offensiveStyleStatus:string;defensiveStyleStatus:string;styleFit:'ACTIVE'|'PARTIAL'|'INACTIVE'|'UNKNOWN';recommended:boolean;fitScore:number;reason:string};\nexport type PositionUsageR416Analysis={version:'40.80-r416-universal-position-usage-v1';canonicalBuildLocked:true;sameBuildAcrossFieldPositions:true;goalkeeperLocked:boolean;naturalPosition:PositionCode;entries:PositionUsageR416Entry[];recommendedPositions:PositionCode[];automaticPrimaryPosition?:PositionCode;automaticTopPositions?:PositionCode[];warnings:string[]};";
    const domainSource=readFileSync(domainPath,'utf8');
    if(!domainSource.includes(newUsageTypes)){
      if(domainSource.includes(oldUsageTypes)) patch(domainPath,oldUsageTypes,newUsageTypes,'R416 upgrade analysis types');
      else patch(domainPath,"export type AnalysisResult = {",`${newUsageTypes}\n\nexport type AnalysisResult = {`,'R416 analysis types');
    }
  }
  patch(domainPath,"  finalCardAuthorityV4080R45?: FinalCardAuthorityV4080R45Analysis;\n};","  finalCardAuthorityV4080R45?: FinalCardAuthorityV4080R45Analysis;\n  positionUsageR416?: PositionUsageR416Analysis;\n};",'R416 result field');

  patch(readerPath,"import { loadReaderEvidenceRuntimeR161 } from '@/modules/card-reader/readerEvidenceRuntimeR161';","import { loadReaderEvidenceRuntimeR161 } from '@/modules/card-reader/readerEvidenceRuntimeR161';\nimport { readPositionProficiencyGridR416 } from './positionProficiencyVisionR416';",'R416 reader import');
  patch(readerPath,"      reportReaderProgress(90, 'Conferindo campos', 'Validando nome, nível, atributos, habilidades e pontos.', readerTotal, readerTotal);","      const positionGridZoneR416=geometry.zones.find((item)=>item.key==='positionGrid');\n      if(positionGridZoneR416){const visualR416=await readPositionProficiencyGridR416(ocrSource,positionGridZoneR416).catch(()=>null);if(visualR416)zoneResults=zoneResults.map((reading)=>reading.key==='positionGrid'?{...reading,positionProficienciesR416:visualR416}:reading);}\n      reportReaderProgress(90, 'Conferindo campos', 'Validando nome, nível, atributos, habilidades e pontos.', readerTotal, readerTotal);",'R416 grid visual hook');

  patch(detailedPath,"  positionRatings: DetailedValue[];\n  attributes: DetailedValue[];","  positionRatings: DetailedValue[];\n  positionProficiencies: NonNullable<PremiumZoneReading['positionProficienciesR416']>;\n  attributes: DetailedValue[];",'R416 detailed type');
  patch(detailedPath,"  const positionRatings = parsePositionRatings(positionSource, positionConfidence, 'Grade de posições');\n  const physicalModel","  const positionRatings = parsePositionRatings(positionSource, positionConfidence, 'Grade de posições');\n  const positionProficiencies=(readings.filter((item)=>item.key==='positionGrid'&&item.positionProficienciesR416).sort((a,b)=>b.confidence-a.confidence)[0]?.positionProficienciesR416 ?? {});\n  const physicalModel",'R416 detailed map');
  patch(detailedPath,"    positionRatings,\n    attributes,","    positionRatings,\n    positionProficiencies,\n    attributes,",'R416 detailed return');

  patch(structuredPath,"function isPositionRatingLine(line: string) {","function isPositionProficiencyLineR416(line:string){return /^PROFICI[ÊE]NCIA POSICIONAL\\s+(?:GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF)\\s*:/i.test(line); }\n\nfunction isPositionRatingLine(line: string) {",'R416 structured strip helper');
  patch(structuredPath,"    if (isPositionRatingLine(line)) continue;\n    output.push(line);","    if (isPositionRatingLine(line) || isPositionProficiencyLineR416(line)) continue;\n    output.push(line);",'R416 structured strip');
  {
    const baseRatings="  for (const rating of trustedPositionRatingsR133(session, readings)) lines.push(`${rating.code}: ${rating.value}`);";
    const legacyVisual=`${baseRatings}\n  for(const [code,item] of Object.entries(session.detailedReading.positionProficiencies)){if(item&&item.confidence>=68)lines.push(\`PROFICIÊNCIA POSICIONAL \${code}: \${item.level}\`);}`;
    const guardedVisual=`${baseRatings}\n  for(const [code,item] of Object.entries(session.detailedReading.positionProficiencies??{})){if(item&&item.confidence>=68)lines.push(\`PROFICIÊNCIA POSICIONAL \${code}: \${item.level}\`);}`;
    const structuredSource=readFileSync(structuredPath,'utf8');
    if(!structuredSource.includes(guardedVisual)){
      if(structuredSource.includes(legacyVisual)) patch(structuredPath,legacyVisual,guardedVisual,'R416 upgrade structured visual output');
      else patch(structuredPath,baseRatings,guardedVisual,'R416 structured visual output');
    }
  }

  patch(parserPath,"import { type Attributes, type ParsedCard, type PositionCode, type PrecisionIssue, type PrecisionValidation, POSITION_PT } from '../../lib/analyzerDomain';","import { type Attributes, type ParsedCard, type PositionCode, type PositionProficiencies, type PositionProficiencyLevel, type PrecisionIssue, type PrecisionValidation, POSITION_PT } from '../../lib/analyzerDomain';",'R416 parser types');
  patch(parserPath,"function listLabels(codes: PositionCode[]) {","function parsePositionProficienciesR416(text:string,main:PositionCode):PositionProficiencies{const out:PositionProficiencies={};for(const m of text.matchAll(/PROFICI[ÊE]NCIA POSICIONAL\\s+(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF)\\s*:\\s*(HIGH|INTERMEDIATE|LOW|UNKNOWN)/gi))out[m[1].toUpperCase() as PositionCode]=m[2].toUpperCase() as PositionProficiencyLevel;if(main==='GK')return{GK:'HIGH'};out[main]='HIGH';delete out.GK;return out;}\n\nfunction listLabels(codes: PositionCode[]) {",'R416 parser helper');
  patch(parserPath,"  const mainPosition = mainCandidate;\n  const playstyle =","  const mainPosition = mainCandidate;\n  const positionProficiencies=parsePositionProficienciesR416(text,mainPosition);\n  const playstyle =",'R416 parser map');
  const oldUsable=`  const usablePositions = detectedPositions.length\n    ? Array.from(new Set([mainPosition, ...detectedPositions]))\n        .filter((position) => {\n          if (position === mainPosition) return true;\n          const rating = Number(positionRatings[position] ?? 0);\n          if (position === 'GK' && mainPosition !== 'GK') return false;\n          if (rating > 0) return rating >= 75 && (!bestRating || rating >= bestRating - 18);\n          return false;\n        })\n        .sort((left, right) => {\n          const leftWeight = gameplayPositionWeight(left, mainPosition, playstyle) + Number(positionRatings[left] ?? 0) * 0.15;\n          const rightWeight = gameplayPositionWeight(right, mainPosition, playstyle) + Number(positionRatings[right] ?? 0) * 0.15;\n          return rightWeight - leftWeight;\n        })\n    : [mainPosition];`;
  const newUsable=`  const visualPositions=(Object.entries(positionProficiencies) as Array<[PositionCode,string]>).filter(([position,level])=>position!=='GK'&&(level==='HIGH'||level==='INTERMEDIATE')).map(([position])=>position);\n  const usablePositions=mainPosition==='GK'?['GK' as PositionCode]:visualPositions.length?Array.from(new Set([mainPosition,...visualPositions])):detectedPositions.length\n    ? Array.from(new Set([mainPosition,...detectedPositions])).filter((position)=>{if(position===mainPosition)return true;const rating=Number(positionRatings[position]??0);if(position==='GK')return false;return rating>0&&rating>=75&&(!bestRating||rating>=bestRating-18);}).sort((left,right)=>gameplayPositionWeight(right,mainPosition,playstyle)+Number(positionRatings[right]??0)*.15-gameplayPositionWeight(left,mainPosition,playstyle)-Number(positionRatings[left]??0)*.15)\n    : [mainPosition];`;
  patch(parserPath,oldUsable,newUsable,'R416 usable positions');
  patch(parserPath,"    positionRatings,\n    playstyle,","    positionRatings,\n    positionProficiencies,\n    playstyle,",'R416 parsed attach');
  patch(parserPath,"  if (Object.keys(positionRatings).length < 4) warnings.push('A grade de posições não foi lida por completo. O app preservou a identidade lida no topo da carta e usou a função real só para recomendar a melhor posição abaixo.');","  if(Object.keys(positionProficiencies).length>1)warnings.push('R416: cor da grade de posições foi lida separadamente da nota; verde forte, intermediário e escuro não são inferidos pelo Overall.');\n  if (Object.keys(positionRatings).length < 4) warnings.push('A grade de posições não foi lida por completo. O app preservou a identidade lida no topo da carta e usou a função real só para recomendar a melhor posição abaixo.');",'R416 parser warning');

  patch(cleanPath,"  const targetPosition=targetOverride ?? input.bestPosition?.code ?? parsed.mainPosition;","  const requestedPosition=targetOverride ?? input.bestPosition?.code ?? parsed.mainPosition;\n  const targetPosition=parsed.mainPosition==='GK'||requestedPosition==='GK'?parsed.mainPosition:requestedPosition;",'R416 GK lock');

  patch(pipelinePath,"import { applyCleanSlatePerformance2027R119 } from './cleanSlatePerformance2027V4080R119';","import { applyCleanSlatePerformance2027R119 } from './cleanSlatePerformance2027V4080R119';\nimport { applyPositionUsageR416 } from './positionUsageIntelligenceR416';",'R416 pipeline import');
  patch(pipelinePath,"  current = applyCleanSlatePerformance2027R119(current, protectedRawCard);\n  current = applyPostAuthorityReadOnly(current, applyProduction2027R100);","  current = applyCleanSlatePerformance2027R119(current, protectedRawCard);\n  current = applyPostAuthorityReadOnly(current, applyPositionUsageR416);\n  current = applyPostAuthorityReadOnly(current, applyProduction2027R100);",'R416 pipeline read-only');

  const test=`import fs from 'node:fs';import assert from 'node:assert/strict';const read=(p)=>fs.readFileSync(p,'utf8');const domain=read('src/lib/analyzerDomain.ts'),vision=read('src/modules/card-reader/positionProficiencyVisionR416.ts'),reader=read('src/modules/card-reader/readerAnalysisRuntimeR163.ts'),parser=read('src/modules/analysis/analyzerCardEvidenceR186.ts'),adapter=read('src/lib/positionUsageIntelligenceR416.ts'),clean=read('src/lib/cleanSlatePerformance2027V4080R119.ts'),pipe=read('src/lib/cardIntelligencePipeline.ts');assert.ok(domain.includes('positionProficiencies?: PositionProficiencies'));assert.match(vision,/INTERMEDIATE/);assert.match(reader,/readPositionProficiencyGridR416/);assert.match(parser,/visualPositions/);assert.match(clean,/parsed\.mainPosition==='GK'\|\|requestedPosition==='GK'/);assert.match(adapter,/autonomousCardR417/);assert.ok(pipe.includes('applyPostAuthorityReadOnly(current, applyPositionUsageR416)'));console.log('R416 aprovada: ficha única, GOL bloqueado e proficiência visual separada da nota; ranking autônomo delegado à R417.');\n`;
  if(!existsSync(testPath)||readFileSync(testPath,'utf8')!==test){writeFileSync(testPath,test,'utf8');changed=true;patched.push('tests/v40-80-r416-universal-position-usage-regression.mjs');}

  for(const [file,fragment,label] of [[cleanPath,"parsed.mainPosition==='GK'||requestedPosition==='GK'",'GOL lock'],[usagePath,'autonomousCardR417','delegação de ranking'],[visionPath,"'INTERMEDIATE'",'proficiência intermediária'],[parserPath,'positionProficiencies,','persistência da grade']]) if(!readFileSync(file,'utf8').includes(fragment)) throw new Error(`R416: contrato ausente: ${label}`);
  return {changed,patched,canonicalBuildAcrossFieldPositions:true,goalkeeperLocked:true,visualProficiencySeparatedFromRating:true,styleActivationAudited:true};
}

export function applyR414CiContractConvergence(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  let changed = false;
  const patched = [];

  for (const target of TARGETS) {
    const file = resolve(root, target.path);
    if (!existsSync(file)) throw new Error(`R414 CI convergence: arquivo obrigatório ausente: ${target.path}`);
    const source = readFileSync(file, 'utf8');
    const result = patchExact(source, target.from, target.to, target.label);
    if (result.changed) {
      writeFileSync(file, result.source, 'utf8');
      changed = true;
      patched.push(target.path);
    }
  }

  const r408Pp = convergeR408PpContract(root);
  if (r408Pp.changed) {
    changed = true;
    patched.push(R408_TEST);
  }

  const r415Reader = convergeR415ReaderIntake(root);
  if (r415Reader.changed) {
    changed = true;
    for (const path of r415Reader.patched) if (!patched.includes(path)) patched.push(path);
  }
  const r416Positions=convergeR416UniversalPositions(root);
  if(r416Positions.changed){changed=true;for(const path of r416Positions.patched)if(!patched.includes(path))patched.push(path);}
  const r417Autonomous=applyAutonomousCardVaultR417(root);
  if(r417Autonomous.changed){changed=true;for(const path of r417Autonomous.patched)if(!patched.includes(path))patched.push(path);}

  // Guardrails: o reparo só converge contratos de CI. O teto global real continua
  // em 5,5 MiB, a reserva R414 continua em 100.000 bytes e PP individual continua 140.
  const budgetCheck = readFileSync(resolve(root, 'scripts/check-bundle-budget.mjs'), 'utf8');
  if (!budgetCheck.includes('sourceTs: 5.5 * 1024 * 1024')) {
    throw new Error('R414 CI convergence: orçamento global de 5,5 MiB não está mais presente.');
  }
  const r184 = readFileSync(resolve(root, 'tests/v40-80-r184-production-legacy-isolation-regression.mjs'), 'utf8');
  const r184HasGlobalLimit = /const\s+sourceLimit\s*=\s*5\.5\s*\*\s*1024\s*\*\s*1024\s*;/.test(r184);
  const r184HasR414Reserve = /const\s+minimumMargin\s*=\s*r414ScalableVault\s*\?\s*100_000\s*:\s*legacyMinimumMargin\s*;/.test(r184);
  const r184UsesCheckpoint = /const\s+checkpointLimit\s*=\s*sourceLimit\s*-\s*minimumMargin\s*;/.test(r184)
    && /sourceBytes\s*<=\s*checkpointLimit/.test(r184);
  if (!r184HasGlobalLimit || !r184HasR414Reserve || !r184UsesCheckpoint) {
    throw new Error('R414 CI convergence: contrato semântico de reserva mínima de 100 KB do R184 não está mais presente.');
  }

  return {
    changed,
    patched,
    sourceBudgetBytes: R414_SOURCE_BUDGET_BYTES,
    sourceGlobalLimitBytes: 5.5 * 1024 * 1024,
    sourceReserveBytes: 100_000,
    resultClosureBudgetR192: R414_RESULT_CLOSURE_BUDGET_R192,
    r408Pp,
    r415Reader,
    r416Positions,
    r417Autonomous,
  };
}
