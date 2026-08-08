import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCanonicalCardV3890 } from '../src/lib/canonicalCardEngineV3890';
import { applyGlobalProBenchmarkV3900 } from '../src/lib/globalProBenchmarkV3900';
import {
  applyEliteDominanceV3910,
  buildEliteDominanceV3910
} from '../src/lib/eliteDominanceEngineV3910';
import {
  cardIdentityFromResult,
  creatorTrainingCost,
  type CreatorBuildSource
} from '../src/lib/creatorBuildResearch';
import type { AnalysisResult, PositionCode, TrainingPlan } from '../src/lib/analyzerDomain';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const SCHOLES = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paul Scholes
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Meia versátil
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Passe em profundidade, Chute de primeira, Efeito de longe
HABILIDADE ESPECIAL: Foguete Rasante
ÍMPETO: Técnica +2
Talento ofensivo: 85
Controle de bola: 88
Drible: 84
Condução firme: 91
Passe rasteiro: 91
Passe alto: 88
Finalização: 82
Cabeçada: 68
Bola parada: 88
Curva: 89
Talento defensivo: 72
Engajamento defensivo: 75
Desarme: 73
Agressividade: 74
Velocidade: 90
Aceleração: 91
Força do chute: 94
Salto: 72
Contato físico: 78
Equilíbrio: 86
Resistência: 92
[FIM AJUSTES]`;

const CONTROLLER = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Maestro Teste
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Passe em profundidade, Passe na medida
ÍMPETO: Passe +2
Talento ofensivo: 78
Controle de bola: 94
Drible: 87
Condução firme: 93
Passe rasteiro: 96
Passe alto: 95
Finalização: 72
Cabeçada: 65
Bola parada: 91
Curva: 92
Talento defensivo: 76
Engajamento defensivo: 78
Desarme: 75
Agressividade: 70
Velocidade: 77
Aceleração: 81
Força do chute: 84
Salto: 67
Contato físico: 72
Equilíbrio: 89
Resistência: 88
[FIM AJUSTES]`;

function canonical(text: string, position: PositionCode): AnalysisResult {
  const analyzed = analyzeCard(text, 'COMPETITIVE', position, `same-card-${position}.png`, {
    formation: position === 'SS' ? '4-3-1-2' : position === 'AMF' ? '4-2-2-2' : '4-3-3',
    style: position === 'SS' ? 'CONTRA_ATAQUE_RAPIDO' : 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: position === 'CMF' ? 'HIGH_DELAY' : 'STABLE',
    controlProfile: position === 'SS' ? 'DRIBBLE' : 'PASSING'
  });
  return applyCanonicalCardV3890(analyzed);
}

function shiftedExactPlan(plan: TrainingPlan, budget: number): TrainingPlan {
  const keys = Object.keys(plan) as Array<keyof TrainingPlan>;
  for (const donor of keys) {
    for (const receiver of keys) {
      if (donor === receiver || plan[donor] <= 0 || plan[receiver] >= 16) continue;
      const candidate = { ...plan, [donor]: plan[donor] - 1, [receiver]: plan[receiver] + 1 };
      if (creatorTrainingCost(candidate).totalCost === budget) return candidate;
    }
  }
  return { ...plan };
}

function proSource(result: AnalysisResult, id: string, verifiedProId: string, training: TrainingPlan): CreatorBuildSource {
  const identity = cardIdentityFromResult(result);
  return {
    id,
    platform: 'YOUTUBE',
    authority: 'PRO_PLAYER',
    verifiedProId,
    device: 'AMBOS',
    url: `https://www.youtube.com/watch?v=${id}`,
    title: `${identity.playerName} ficha completa ${id}`,
    channel: verifiedProId.toUpperCase(),
    country: verifiedProId === 'rentao' ? 'Brasil' : 'Itália',
    publishedAt: '2026-07-27',
    reviewedAt: '2026-08-08',
    testedInMatches: true,
    targetPosition: identity.mainPosition,
    playstyle: result.parsed.playstyle ?? '',
    card: identity,
    training: { ...training },
    skills: [...result.recommendedSkills.slice(0, 5)],
    impeto: result.recommendedImpetos[0]?.name ?? 'Técnica +2',
    evidenceLevel: 'FICHA_COMPLETA',
    proofType: 'VIDEO',
    tournament: 'World Finals 2026',
    notes: 'Fonte exata de regressão.'
  };
}

const cmfBase = canonical(SCHOLES, 'CMF');
const amfBase = canonical(SCHOLES, 'AMF');
const ssBase = canonical(SCHOLES, 'SS');

const noProCmf = applyGlobalProBenchmarkV3900(cmfBase, []);
const noProAmf = applyGlobalProBenchmarkV3900(amfBase, []);
const noProSs = applyGlobalProBenchmarkV3900(ssBase, []);

const cmf = buildEliteDominanceV3910(noProCmf);
const amf = buildEliteDominanceV3910(noProAmf);
const ss = buildEliteDominanceV3910(noProSs);

for (const analysis of [cmf, amf, ss]) {
  assert.equal(analysis.engineVersion, '39.10.0');
  assert.equal(analysis.selectedPositionAffectsOutput, false);
  assert.equal(creatorTrainingCost(analysis.winner.training).totalCost, 64);
  assert.ok(analysis.candidatesGenerated >= analysis.candidatesEvaluated);
  assert.ok(analysis.candidatesEvaluated > 0);
  assert.ok(analysis.skills.length > 0 && analysis.skills.length <= 5);
  assert.equal(new Set(analysis.skills.map((item) => skillIdentityKey(item.name))).size, analysis.skills.length);
  assert.ok(analysis.impetos.length > 0);
  assert.ok(analysis.primaryImpeto);
  assert.doesNotMatch(analysis.resultSignature, /CMF|AMF|SS/);
}

assert.deepEqual(cmf.winner.training, amf.winner.training, 'A mesma carta em MLG e MAT precisa manter a mesma ficha.');
assert.deepEqual(cmf.winner.training, ss.winner.training, 'A mesma carta em MLG e SA precisa manter a mesma ficha.');
assert.deepEqual(cmf.skills.map((item) => item.name), amf.skills.map((item) => item.name));
assert.deepEqual(cmf.skills.map((item) => item.name), ss.skills.map((item) => item.name));
assert.deepEqual(cmf.impetos.map((item) => item.name), amf.impetos.map((item) => item.name));
assert.deepEqual(cmf.impetos.map((item) => item.name), ss.impetos.map((item) => item.name));
assert.equal(cmf.resultSignature, amf.resultSignature);
assert.equal(cmf.resultSignature, ss.resultSignature);

const proTraining = shiftedExactPlan(cmfBase.training, cmfBase.trainingPointsTotal);
const sources = [
  proSource(cmfBase, 'dominance-pro-1', 'rentao', proTraining),
  proSource(cmfBase, 'dominance-pro-2', 'ettorito', proTraining)
];
const withPros = applyGlobalProBenchmarkV3900(cmfBase, sources);
const challenged = buildEliteDominanceV3910(withPros);
assert.deepEqual(challenged.winner.training, cmf.winner.training, 'Atualizar a base pro não pode trocar silenciosamente a receita da carta.');
assert.deepEqual(challenged.skills.map((item) => item.name), cmf.skills.map((item) => item.name));
assert.deepEqual(challenged.impetos.map((item) => item.name), cmf.impetos.map((item) => item.name));
assert.equal(challenged.resultSignature, cmf.resultSignature);
assert.ok(challenged.proReferencesChallenged >= 1);
assert.notEqual(challenged.proChallengeStatus, 'sem_evidencia');

const applied = applyEliteDominanceV3910(withPros);
assert.equal(applied.buildVariants.length, 1);
assert.equal(creatorTrainingCost(applied.training).totalCost, applied.trainingPointsTotal);
assert.deepEqual(applied.training, challenged.winner.training);
assert.deepEqual(applied.recommendedSkills, challenged.skills.map((item) => item.name));
assert.equal(applied.recommendedImpetos[0]?.name, challenged.primaryImpeto);
assert.equal(applied.eliteDominanceV3910?.resultSignature, challenged.resultSignature);

const other = buildEliteDominanceV3910(applyGlobalProBenchmarkV3900(canonical(CONTROLLER, 'CMF'), []));
assert.notEqual(other.resultSignature, cmf.resultSignature, 'Cartas diferentes na mesma posição precisam ter receitas diferentes.');
assert.ok(
  JSON.stringify(other.winner.training) !== JSON.stringify(cmf.winner.training)
    || other.skills.map((item) => item.name).join('|') !== cmf.skills.map((item) => item.name).join('|')
    || other.primaryImpeto !== cmf.primaryImpeto,
  'O motor não pode clonar ficha, habilidades e Ímpeto entre cartas diferentes da mesma posição.'
);

const engine = fs.readFileSync('src/lib/eliteDominanceEngineV3910.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const panel = fs.readFileSync('src/components/GlobalProLabV3900Panel.tsx', 'utf8');
assert.match(engine, /UMA_CARTA_UMA_RECEITA_UNIVERSAL_DOMINANTE_SEM_OVERALL/);
assert.match(engine, /selectedPositionAffectsOutput: false/);
assert.match(engine, /Fichas profissionais são adversários de benchmark/);
assert.doesNotMatch(engine, /Math\.random/);
assert.match(pipeline, /applyEliteDominanceV3910/);
assert.match(panel, /Motor Dominante Universal v39\.10/);
assert.match(panel, /A posição selecionada não muda a ficha/);

console.log(`v39.10 aprovada: ${cmf.candidatesGenerated} candidatas, ${cmf.candidatesEvaluated} finalistas integrais e assinatura ${cmf.resultSignature}.`);
