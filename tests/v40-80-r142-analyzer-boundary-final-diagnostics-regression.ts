import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard, analyzeCardProductionBaseR142 } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { analyzeCardForProductionR128, ensureCurrentProductionAnalysisR128 } from '../src/lib/productionAnalysisR128';
import { isFinalBuildDiagnosticsCurrentR142 } from '../src/modules/analysis/finalBuildDiagnosticsR142';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const rawText = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R142 Equivalência\nPOSIÇÃO PRINCIPAL: CB\nESTILO DE JOGO: Defensor Criativo\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: Interceptação\nTalento ofensivo: 65\nControle de bola: 79\nDrible: 72\nCondução firme: 76\nPasse rasteiro: 84\nPasse alto: 83\nFinalização: 55\nCabeceio: 87\nTalento defensivo: 91\nDedicação defensiva: 90\nDesarme: 92\nAgressividade: 88\nVelocidade: 81\nAceleração: 77\nForça do chute: 78\nSalto: 89\nContato físico: 91\nEquilíbrio: 73\nResistência: 86\n[FIM AJUSTES]`;

const fullBase: any = analyzeCard(rawText, 'COMPETITIVE', 'CB');
const leanBase: any = analyzeCardProductionBaseR142(rawText, 'COMPETITIVE', 'CB');
assert.ok((fullBase.buildVariants[0]?.simulationsTested ?? 0) > 100, 'Modo FULL deve preservar a busca histórica extensa para auditorias.');
assert.ok((leanBase.buildVariants[0]?.simulationsTested ?? 99) <= 3, 'Base de produção não deve simular centenas de fichas que o Clean Slate descartará.');

const fullFinal: any = applyCompleteCardIntelligence(fullBase);
const production: any = analyzeCardForProductionR128(rawText, 'COMPETITIVE', 'CB');
assert.deepEqual(production.training, fullFinal.training, 'Modo enxuto não pode alterar a progressão do único escritor final.');
assert.deepEqual(production.recommendedSkills, fullFinal.recommendedSkills, 'Modo enxuto não pode alterar Top 5.');
assert.deepEqual(production.recommendedImpetos, fullFinal.recommendedImpetos, 'Modo enxuto não pode alterar Ímpeto.');
assert.equal(production.cleanSlate2027R119.score, fullFinal.cleanSlate2027R119.score);

assert.deepEqual(production.buildVariants[0].training, production.training, 'Comparador deve exibir como vencedora a ficha Clean Slate real.');
assert.equal(production.buildVariants[0].title, 'Ficha Clean Slate — final');
assert.equal(production.advancedOptimizer.winnerTitle, 'Ficha Clean Slate — final');
assert.equal(isFinalBuildDiagnosticsCurrentR142(production), true);

const staleDiagnostics: any = {
  ...production,
  buildVariants: production.buildVariants.map((item: any, index: number) => index === 0 ? { ...item, training: { ...item.training, passing: Number(item.training.passing ?? 0) + 1 }, title: 'Ficha provisória antiga' } : item),
  advancedOptimizer: { ...production.advancedOptimizer, winnerTitle: 'Ficha provisória antiga' },
  finalBuildDiagnosticsR142: undefined
};
const repaired: any = ensureCurrentProductionAnalysisR128(staleDiagnostics);
assert.deepEqual(repaired.training, production.training, 'Reparar diagnóstico não pode recalcular/mudar a ficha selada.');
assert.deepEqual(repaired.recommendedSkills, production.recommendedSkills);
assert.deepEqual(repaired.buildVariants[0].training, production.training);
assert.equal(isFinalBuildDiagnosticsCurrentR142(repaired), true);

const analyzerSource = fs.readFileSync('src/lib/analyzer.ts', 'utf8');
const positionCoreSource = fs.readFileSync('src/modules/analysis/analyzerPositionCoreR142.ts', 'utf8');
assert.match(analyzerSource, /analyzerPositionCoreR142/);
assert.doesNotMatch(analyzerSource, /function gameplayPositionWeight\s*\(/, 'Núcleo de posição não deve voltar ao monólito.');
assert.match(positionCoreSource, /export function gameplayPositionWeight/);
assert.match(positionCoreSource, /export function detectMainPosition/);

console.log('r142 aprovada: analyzer modularizado, produção evita busca provisória exaustiva e diagnósticos finais refletem a ficha Clean Slate sem alterar ficha/Top 5/Ímpeto.');
