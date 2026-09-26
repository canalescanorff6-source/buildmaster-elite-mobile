import assert from 'node:assert/strict';
import fs from 'node:fs';

const panelPath = 'src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx';
const source = fs.readFileSync(panelPath, 'utf8');

assert.match(source, /Por que esta recomendação\?/);
assert.match(source, /decisionConfidence/);
assert.match(source, /performanceConfidence/);
assert.match(source, /evidenceState/);
assert.match(source, /<details/);
assert.match(source, /Ver evidências/);
assert.match(source, /nativeConfidence/);
assert.match(source, /relevance/);
assert.match(source, /independence/);
assert.match(source, /completeness/);
assert.match(source, /fingerprint/);
assert.match(source, /decision\.version/);
assert.match(source, /Explicação temporariamente indisponível/);
assert.match(source, /recomendação original continua intacta/i);
assert.match(source, /className="luxury-panel/);
assert.match(source, /v27-pairing-list|v27-recommendation-list/);
assert.match(source, /panel-note/);

assert.doesNotMatch(source, /onApply|onSave|onPromote|onSwap|onFormationChange|onChangeLineup|setTraining|setResult|upsert/);
assert.doesNotMatch(source, /Aplicar|Salvar como oficial|Substituir ficha|Trocar titular/);

const signature = source.match(/export function ExplainableDecisionPanelR489\(([^)]*)\)/)?.[1] ?? '';
assert.match(signature, /decision/);
assert.ok(!/on[A-Z]/.test(signature), 'painel R489 não pode receber callback mutável');

console.log('R489 UI aprovada: painel explicável compacto, recolhido e somente leitura.');
