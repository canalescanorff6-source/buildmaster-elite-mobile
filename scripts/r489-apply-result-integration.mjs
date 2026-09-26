import fs from 'node:fs';

const path = 'src/components/result/ResultAdvancedWorkspaceR192.tsx';
let source = fs.readFileSync(path, 'utf8');

if (source.includes('<ExplainableDecisionPanelR489 decision={explainableBuildR489} compact />')) {
  console.log('R489 Resultado já integrado; nenhuma alteração necessária.');
  process.exit(0);
}

function replaceOnce(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`R489 Resultado: marcador ausente (${label}).`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`R489 Resultado: marcador duplicado (${label}).`);
  source = source.replace(before, after);
}

replaceOnce(
  'React useMemo',
  "'use client';\n\nimport dynamic from 'next/dynamic';",
  "'use client';\n\nimport { useMemo } from 'react';\nimport dynamic from 'next/dynamic';"
);

replaceOnce(
  'imports R483/R489',
  "import { BuildSimulatorPanelR483 } from '@/modules/build-simulator/BuildSimulatorPanelR483';",
  "import { BuildSimulatorPanelR483 } from '@/modules/build-simulator/BuildSimulatorPanelR483';\nimport { buildBuildSimulatorR483 } from '@/modules/build-simulator/buildSimulatorEngineR483';\nimport { buildExplainableDecisionR489 } from '@/modules/explainable-ai/explainableDecisionEngineR489';\nimport { ExplainableDecisionPanelR489 } from '@/modules/explainable-ai/ExplainableDecisionPanelR489';"
);

replaceOnce(
  'memos BUILD',
  "  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);\n\n  return <>",
  `  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);\n  const targetPositionR489 = analysisUsagePositionR138(result);\n  const buildSimulatorR489 = useMemo(\n    () => buildBuildSimulatorR483({ result, targetPosition: targetPositionR489 }),\n    [result, targetPositionR489]\n  );\n  const explainableBuildR489 = useMemo(\n    () => buildExplainableDecisionR489({\n      kind: 'BUILD',\n      decisionId: String(result.parsed.internalId || result.parsed.playerName || 'build-sem-id'),\n      verdict: result.buildName || \`Ficha oficial de \${result.parsed.playerName}\`,\n      availability: {\n        r480: 'NOT_APPLICABLE',\n        r481: 'NOT_APPLICABLE',\n        r482: 'NOT_APPLICABLE',\n        r483: buildSimulatorR489.blockedReason ? 'BLOCKED' : 'AVAILABLE',\n        r484: 'NOT_APPLICABLE'\n      },\n      result,\n      buildSimulator: buildSimulatorR489\n    }),\n    [result, buildSimulatorR489]\n  );\n\n  return <>`
);

replaceOnce(
  'painel em Comparar',
  '          <BuildSimulatorPanelR483 result={result} />\n',
  '          <BuildSimulatorPanelR483 result={result} />\n          <ExplainableDecisionPanelR489 decision={explainableBuildR489} compact />\n'
);

fs.writeFileSync(path, source);
console.log('R489 Resultado integrado de forma idempotente.');
