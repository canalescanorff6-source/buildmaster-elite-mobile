import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const derived = fs.readFileSync('src/hooks/useCardVisionDerivedStateR179.ts', 'utf8');
const light = fs.readFileSync('src/lib/playerComparisonR171.ts', 'utf8');
const legacy = fs.readFileSync('src/lib/confidenceComparison.ts', 'utf8');

assert.match(derived, /import \{ comparePlayers \} from ['"]@\/lib\/playerComparisonR171['"]/, 'R171: selector derivado R179 deve consumir o comparador leve.');
assert.doesNotMatch(app, /from ['"]@\/lib\/confidenceComparison['"]/, 'R171: confidenceComparison completo não pode voltar ao startup do CardVisionApp.');
assert.match(light, /export function comparePlayers\(/, 'R171: comparador oficial deve existir no módulo leve.');
assert.match(light, /result\.cardDna\?\.antiClone\.individualityScore/, 'R171: DNA/individualidade deve permanecer na pontuação.');
assert.match(light, /result\.advancedOptimizer\?\.efficiencyScore/, 'R171: eficiência do optimizer deve permanecer na comparação.');
assert.match(light, /sameTarget \? 8 : -8/, 'R171: bônus/penalidade de aderência posicional deve permanecer.');
assert.match(light, /cloneRisk: PlayerComparisonItem\['cloneRisk'\]/, 'R171: risco de clone deve continuar sendo reportado.');
assert.match(legacy, /export \{ comparePlayers \} from ['"]\.\/playerComparisonR171['"]/, 'R171: API histórica de confidenceComparison deve reexportar comparePlayers.');
assert.match(legacy, /export type \{ PlayerComparisonItem, PlayerComparisonReport \} from ['"]\.\/playerComparisonR171['"]/, 'R171: tipos históricos do comparador devem continuar disponíveis.');

console.log('R171 aprovada: comparação de jogadores saiu do módulo pesado sem alterar DNA, eficiência, aderência posicional ou compatibilidade pública.');
