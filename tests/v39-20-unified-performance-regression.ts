import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCanonicalCardV3890 } from '../src/lib/canonicalCardEngineV3890';
import { applyGlobalProBenchmarkV3900 } from '../src/lib/globalProBenchmarkV3900';
import { applyEliteDominanceV3910 } from '../src/lib/eliteDominanceEngineV3910';
import { applyUnifiedPerformanceV3920, buildUnifiedPerformanceV3920 } from '../src/lib/unifiedPerformanceEngineV3920';
import type { AnalysisResult, PositionCode } from '../src/lib/analyzerDomain';
import { creatorTrainingCost } from '../src/lib/creatorBuildResearch';

const MOBILE_MIDFIELDER = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paul Scholes
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: LMF
POSIÇÕES: LMF, CMF, AMF, SS
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

const CRISTIANO = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Cristiano Ronaldo
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CF
POSIÇÕES: CF, SS, LWF
ESTILO DE JOGO: Artilheiro
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Chute de primeira, Cabeçada, Superioridade aérea
ÍMPETO: Instinto artilheiro +2
Talento ofensivo: 96
Controle de bola: 86
Drible: 83
Condução firme: 82
Passe rasteiro: 78
Passe alto: 74
Finalização: 96
Cabeçada: 94
Bola parada: 87
Curva: 84
Talento defensivo: 46
Engajamento defensivo: 62
Desarme: 43
Agressividade: 79
Velocidade: 91
Aceleração: 88
Força do chute: 96
Salto: 95
Contato físico: 90
Equilíbrio: 85
Resistência: 88
[FIM AJUSTES]`;

function dominant(text: string, position: PositionCode, formation: '4-3-3' | '4-2-2-2'): AnalysisResult {
  const analyzed = analyzeCard(text, 'COMPETITIVE', position, `same-card-${position}.png`, {
    formation,
    style: 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: 'STABLE',
    controlProfile: 'PASSING'
  });
  const canonical = applyCanonicalCardV3890(analyzed);
  const pro = applyGlobalProBenchmarkV3900(canonical, []);
  return applyEliteDominanceV3910(pro);
}

const scholesCmf = buildUnifiedPerformanceV3920(dominant(MOBILE_MIDFIELDER, 'CMF', '4-3-3'));
const scholesAmf = buildUnifiedPerformanceV3920(dominant(MOBILE_MIDFIELDER, 'AMF', '4-2-2-2'));
const scholesSs = buildUnifiedPerformanceV3920(dominant(MOBILE_MIDFIELDER, 'SS', '4-3-3'));

for (const analysis of [scholesCmf, scholesAmf, scholesSs]) {
  assert.equal(analysis.engineVersion, '39.20.0');
  assert.equal(analysis.selectedPositionAffectsCanonicalRecipe, false);
  assert.equal(analysis.resourceSafety.recipeLocked, true);
  assert.equal(creatorTrainingCost(analysis.canonicalTraining).totalCost, 64);
  assert.ok(analysis.canonicalSkills.length > 0 && analysis.canonicalSkills.length <= 5);
  assert.ok(analysis.primaryImpeto);
  assert.match(analysis.lockSignature, /^locked-v3920-/);
}

assert.deepEqual(scholesCmf.canonicalTraining, scholesAmf.canonicalTraining, 'Trocar MLG por MAT não pode alterar a ficha canônica.');
assert.deepEqual(scholesCmf.canonicalTraining, scholesSs.canonicalTraining, 'Trocar MLG por SA não pode alterar a ficha canônica.');
assert.deepEqual(scholesCmf.canonicalSkills.map((item) => item.name), scholesAmf.canonicalSkills.map((item) => item.name));
assert.deepEqual(scholesCmf.canonicalImpetos.map((item) => item.name), scholesSs.canonicalImpetos.map((item) => item.name));
assert.equal(scholesCmf.lockSignature, scholesAmf.lockSignature);
assert.equal(scholesCmf.lockSignature, scholesSs.lockSignature);

assert.equal(scholesCmf.positionFit.playstyleActive, true, 'Meia versátil precisa ficar ativo como MLG.');
assert.equal(scholesCmf.positionFit.movementProfile, 'VERTICAL');
assert.ok(scholesCmf.positionFit.conflicts.some((item) => /4-3-3 estreita|isolar o volante|SA/.test(item)), 'O motor deve detectar o risco estrutural descrito pelo usuário.');
assert.notEqual(scholesCmf.resourceSafety.status, 'APLICAR_COM_SEGURANCA', 'O app não deve liberar gasto raro quando o encaixe desmonta a estrutura.');
assert.equal(scholesCmf.resourceSafety.canSpendImpeto, false);
assert.equal(scholesAmf.positionFit.playstyleActive, false, 'Em MAT, o comportamento deve ser tratado separadamente do estilo ativo de MLG.');
assert.ok(scholesAmf.positionFit.structuralFit > scholesCmf.positionFit.structuralFit, 'MAT deve ser estruturalmente mais estável que MLG neste caso.');

const cristianoCf = buildUnifiedPerformanceV3920(dominant(CRISTIANO, 'CF', '4-2-2-2'));
const cristianoSs = buildUnifiedPerformanceV3920(dominant(CRISTIANO, 'SS', '4-2-2-2'));
assert.equal(cristianoCf.lockSignature, cristianoSs.lockSignature, 'Cristiano em CA ou SA precisa manter a mesma receita e o mesmo Ímpeto.');
assert.deepEqual(cristianoCf.canonicalTraining, cristianoSs.canonicalTraining);
assert.equal(cristianoCf.identity.profileId, 'cristiano-ronaldo');
assert.match(cristianoCf.identity.realLifeModel, /última linha|finalizar|ameaça aérea/i);
assert.notEqual(cristianoCf.lockSignature, scholesCmf.lockSignature, 'Cartas diferentes não podem compartilhar a mesma receita.');

const applied = applyUnifiedPerformanceV3920(dominant(MOBILE_MIDFIELDER, 'CMF', '4-3-3'));
assert.equal(applied.buildVariants.length, 1);
assert.deepEqual(applied.training, scholesCmf.canonicalTraining);
assert.equal(applied.unifiedPerformanceV3920?.lockSignature, scholesCmf.lockSignature);
assert.match(applied.buildName, /Ficha Suprema Unificada v39\.20/);

const engine = fs.readFileSync('src/lib/unifiedPerformanceEngineV3920.ts', 'utf8');
const panel = fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(engine, /UMA_TELA_UMA_RECEITA_IDENTIDADE_ENCAIXE_E_PROTECAO_DE_RECURSOS/);
assert.match(engine, /selectedPositionAffectsCanonicalRecipe: false/);
assert.match(engine, /NAO_GASTAR_RECURSOS/);
assert.doesNotMatch(engine, /Math\.random/);
assert.match(panel, /(?:Motor Adaptativo por Carta v39\.30|Precisão Competitiva 99)/);
assert.match(panel, /Recurso permanente decidido pelo r80, independente da posição/);
assert.match(workspace, /Ficha Suprema/);
assert.match(workspace, /Tudo unificado em uma tela/);
assert.match(workspace, /UNIFIED_COMPACT_RESULT_V3920 = true/);
assert.match(pipeline, /applyUnifiedPerformanceV3920/);

console.log(`v39.20 aprovada: receita ${scholesCmf.lockSignature}, MLG ${Math.round(scholesCmf.positionFit.compatibility)}/100 e MAT ${Math.round(scholesAmf.positionFit.compatibility)}/100.`);
