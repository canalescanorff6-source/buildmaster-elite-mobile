import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import {
  buildDecisionWeights,
  buildSignature,
  cardFingerprint,
  compareRegistryEntry,
  createCardRegistryEntry,
  createMatchValidationRecord,
  summarizeMatchValidation
} from '../src/lib/appEvolution';
import { readLegacyCssBundle } from './helpers/readLegacyCssBundle';

const result = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Volante Evolução Total
TIPO DA CARTA: Épico
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Primeiro volante
NÍVEL: 30
PONTOS TOTAIS: 62
Passe rasteiro: 82
Passe alto: 78
Controle de bola: 79
Talento defensivo: 88
Dedicação defensiva: 89
Desarme: 87
Agressividade: 86
Contato físico: 85
Resistência: 87
HABILIDADES: Interceptação, Bloqueador, Marcação individual
[FIM AJUSTES]
`, 'COMPETITIVE', 'DMF', null, { formation: '4-2-2-2', style: 'CONTRA_ATAQUE_RAPIDO' });

const weights = buildDecisionWeights(result);
assert.equal(weights.reduce((sum, item) => sum + item.weight, 0), 100);
assert.ok(weights.find((item) => item.key === 'position')!.weight >= 25);
assert.ok(weights.every((item) => item.confidence >= 0 && item.confidence <= 100));

const fingerprint = cardFingerprint(result);
const signature = buildSignature(result);
assert.match(fingerprint, /^card-[a-f0-9]{8}$/);
assert.match(signature, /^build-[a-f0-9]{8}$/);

const entry = createCardRegistryEntry(result, 'manual', 'Carta conferida no teste');
assert.equal(entry.fingerprint, fingerprint);
assert.equal(compareRegistryEntry(entry, result).matches, true);

const match1 = createMatchValidationRecord(result, {
  minutes: 90,
  overallRating: 4,
  passing: 4,
  movement: 3,
  finishing: 2,
  defending: 5,
  physical: 4,
  stamina: 4,
  tags: ['Marcou bem'],
  note: 'Primeiro teste'
});
const match2 = createMatchValidationRecord(result, {
  minutes: 90,
  overallRating: 4,
  passing: 4,
  movement: 3,
  finishing: 2,
  defending: 5,
  physical: 4,
  stamina: 4,
  tags: ['Marcou bem'],
  note: 'Segundo teste'
});
const match3 = createMatchValidationRecord(result, {
  minutes: 75,
  overallRating: 3,
  passing: 3,
  movement: 3,
  finishing: 2,
  defending: 4,
  physical: 4,
  stamina: 3,
  tags: ['Cansou cedo'],
  note: 'Terceiro teste'
});
const summary = summarizeMatchValidation([match1, match2, match3]);
assert.equal(summary.totalMatches, 3);
assert.equal(summary.confidence, 'média');
assert.ok(summary.repeatedProblems.some((item) => item.tag === 'Marcou bem' && item.count === 2));
assert.ok(summary.strongestAreas.some((item) => item.startsWith('Defesa')));

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const lazyPanels = fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8');
const resultWorkspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const css = [readLegacyCssBundle(), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');
assert.match(app, /FirstUseOnboarding/);
assert.match(lazyPanels, /DecisionWeightPanel/);
assert.match(lazyPanels, /VerifiedCardRegistryPanel/);
assert.match(lazyPanels, /MatchValidationCenter/);
assert.match(resultWorkspace, /Validação real/);
assert.match(css, /v26\.80 — Evolução total/);
assert.match(css, /mode-basic \.result-advanced-bar/);

console.log('✓ v26.80: primeiro uso, modo simples, pesos da decisão, registro de cartas e validação real aprovados.');
