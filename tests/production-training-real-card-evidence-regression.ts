import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { ATTRIBUTE_PT, type AttributeKey } from '../src/lib/analyzerDomain';
import { canonicalizeSkillList, skillIdentityKey } from '../src/lib/officialSkillIdentity';

// Exercise the same production path used by the mobile app. Names/card IDs identify
// imported evidence; the optimizer must derive its answer from attributes and skills.
process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/three-cf-same-budget.json', 'utf8'));
const outcomes: any[] = [];
for (const card of fixture.cards) {
  const rawText = [
    '[AJUSTES MANUAIS]', 'CONFIRMAÇÃO MANUAL: SIM',
    `NOME DO JOGADOR: ${card.playerName}`, 'TIPO DA CARTA: Epic',
    'POSIÇÃO PRINCIPAL: CF', 'ESTILO DE JOGO: Homem de área',
    `NÍVEL MÁXIMO: ${card.level}`, `PONTOS TOTAIS: ${card.trainingPointsTotal}`,
    ...Object.entries(card.attributes).map(([key, value]) => `${ATTRIBUTE_PT[key as AttributeKey]}: ${value}`),
    `HABILIDADES NATIVAS: ${card.nativeSkills.join('; ')}`, '[FIM AJUSTES]',
  ].join('\n');
  const result: any = createProductionAnalysisR138({
    rawText, targetPosition: 'CF',
    tacticalProfile: { formation: '4-2-3-1', style: 'POSSE_DE_BOLA' },
  });
  assert.equal(result.parsed.playerName, card.playerName);
  assert.equal(Object.keys(result.parsed.attributes).length, 26);
  assert.deepEqual(result.parsed.attributes, card.attributes, 'A evidência crua de cada edição deve chegar ao escritor final.');
  assert.equal(result.cleanSlate2027R119.status, 'READY');
  assert.equal(result.trainingPointsTotal, 62);
  assert.equal(result.trainingPointsUsed, 62);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.equal(result.cleanSlate2027R119.guards.ignoresOverall, true);
  const owned = new Set(canonicalizeSkillList(card.nativeSkills).map(skillIdentityKey));
  assert.equal(result.recommendedSkills.length, 5);
  assert.ok(result.recommendedSkills.every((skill: string) => !owned.has(skillIdentityKey(skill))), 'O conjunto final deve respeitar as habilidades nativas desta edição.');
  outcomes.push(result);
  console.log(JSON.stringify({ cardId: card.cardId, name: card.playerName, training: result.training, skills: result.recommendedSkills }));
}
assert.ok(new Set(outcomes.map((result) => JSON.stringify(result.training))).size > 1,
  'Estes três perfis de atributos reais contrastantes não podem colapsar em uma receita única de CF/62 PP.');
assert.ok(new Set(outcomes.map((result) => result.recommendedSkills.join('|'))).size > 1,
  'Inventários nativos e ações distintas precisam chegar às recomendações finais.');
console.log('Produção: três CF reais com o mesmo orçamento mantêm evidência e decisões próprias, sem receitas por nome.');
