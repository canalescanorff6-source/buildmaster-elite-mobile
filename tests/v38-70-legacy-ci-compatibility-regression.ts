import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import {
  availableOfficialAdditionalSkillCount,
  officialAdditionalSkillPoolForPosition
} from '../src/lib/skillIntelligenceV31';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const card = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Compatibilidade Suprema CI
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
Talento ofensivo: 92
Controle de bola: 85
Drible: 82
Condução firme: 81
Passe rasteiro: 76
Passe alto: 72
Finalização: 93
Cabeçada: 84
Velocidade: 86
Aceleração: 87
Força do chute: 91
Salto: 82
Contato físico: 83
Equilíbrio: 82
Resistência: 84
[FIM AJUSTES]`;

const base = analyzeCard(card, 'COMPETITIVE', 'CF', 'compatibilidade-v3870.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA',
  gameplayMode: 'RANKED',
  connectionProfile: 'VARIABLE',
  controlProfile: 'PASSING'
});

// Simula uma carta que já possui quase todo o catálogo seguro. O motor deve
// entregar somente as vagas oficiais restantes, sem exigir artificialmente 5.
const officialPool = officialAdditionalSkillPoolForPosition('CF');
assert.ok(officialPool.length >= 6, 'O catálogo de CA precisa permitir o teste de vagas parciais.');
base.parsed.nativeSkills = officialPool.slice(0, officialPool.length - 3);
const expectedSlots = Math.min(5, availableOfficialAdditionalSkillCount(base));
assert.equal(expectedSlots, 3, 'O cenário de regressão deve deixar exatamente três opções oficiais livres.');

const result = applyCompleteCardIntelligence(base);
assert.equal(result.recommendedSkills.length, expectedSlots, 'O Motor Supremo deve aceitar de zero a cinco vagas oficiais restantes.');
assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, expectedSlots, 'As vagas parciais precisam permanecer únicas.');
assert.equal(result.trainingPointsUsed, result.trainingPointsTotal, 'A compatibilidade não pode quebrar o orçamento exato.');
assert.equal(result.trainingPointsRemaining, 0);
assert.ok(result.buildVariants.length >= 1 && result.buildVariants.length <= 3, 'A saída pública preserva de uma a três fichas aplicáveis; alternativas extras continuam no diagnóstico v38.70.');
assert.match(result.buildName, /Ficha Automática v(?:38\.40|40\.00)/, 'O nome deve manter o contrato público e identificar o Motor Supremo no complemento.');
const usefulImpeto = result.recommendedImpetos.find((item) => item.tier !== 'evitar');
assert.ok(usefulImpeto, 'A análise precisa manter ao menos um Ímpeto útil.');
assert.match(usefulImpeto?.evidence?.join(' ') ?? '', /ficha final/i, 'O Ímpeto precisa registrar que foi recalculado com a ficha final.');

const maxEngine = fs.readFileSync('src/lib/maxMatchPerformanceEngineV3860.ts', 'utf8');
const supremeEngine = fs.readFileSync('src/lib/supremePerformanceEngineV3870.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(maxEngine, /availableOfficialAdditionalSkillCount/);
assert.match(maxEngine, /expectedSkillCount/);
assert.match(maxEngine, /evaluateTrainingPlanProgressionOnlyV3860/);
assert.doesNotMatch(maxEngine, /\.filter\(\(item\) => item\.skills\.length === 5\)/);
assert.match(supremeEngine, /mutatePlan\([^\n]+\)\.slice\(0, 8\)/);
assert.match(supremeEngine, /\.slice\(0, 5\),\n\s+recommendedSkills/);
assert.match(pipeline, /return enforceComplementarySkillIntegrity\(finalAdvanced\)/);
assert.match(pipeline, /const finalAdvanced = advancedReconciled/);
assert.match(pipeline, /const finalPower = powerIntegrity/);
assert.match(pipeline, /const finalMaximum = maximumIntegrity/);

console.log('v38.70 compatibilidade legada aprovada: vagas parciais, até 3 fichas públicas, alternativas internas preservadas, Ímpeto final e pipeline sem recomputações duplicadas.');
