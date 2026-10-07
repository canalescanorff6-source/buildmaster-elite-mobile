import assert from 'node:assert/strict';
import { createProductionAnalysisR138, ensureProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { sealProductionAuthorityR128 } from '../src/lib/productionAuthorityR128';
import { isCurrentProductionAnalysisR126, sealProductionAuthorityR126 } from '../src/lib/productionAuthorityR126';
import { emptyTraining } from '../src/lib/trainingPlanCore';
import { prepareVaultOpenR139 } from '../src/modules/vault/vaultProductionLifecycleR139';
import { VAULT_PRODUCTION_RECORD_R128_VERSION } from '../src/modules/vault/productionVaultR128';
import type { SavedAnalysis } from '../src/modules/vault/cardHistoryStore';

const RAW = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Jogador R453
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CF
NÍVEL MÁXIMO: 29
PONTOS TOTAIS: 56
Talento ofensivo: 90
Controle de bola: 85
Finalização: 92
Velocidade: 87
Aceleração: 86
Drible: 84
Condução firme: 85
Passe rasteiro: 75
Equilíbrio: 83
Resistência: 80
[FIM AJUSTES]`;

const current = createProductionAnalysisR138({
  rawText: RAW,
  objective: 'COMPETITIVE',
  targetPosition: 'CF',
  tacticalProfile: { formation: 'AUTO', style: 'AUTO' }
}) as any;

assert.equal(current.trainingPointsTotal, 56);
assert.equal(current.trainingPointsUsed, 56, 'A ficha nova parcial deve consumir exatamente os 56 PP.');
assert.equal(current.trainingPointsRemaining, 0);

const stale = JSON.parse(JSON.stringify(current)) as any;
stale.training = emptyTraining();
stale.trainingCost = emptyTraining();
stale.trainingPointsUsed = 0;
stale.trainingPointsRemaining = 56;
// Simula uma ficha 0/56 que estava selada pela autoridade R128 anterior.
// A política R453 precisa invalidar esse selo, mesmo quando identidade/evidência não mudaram.
const staleSealed = sealProductionAuthorityR128(stale) as any;
staleSealed.productionAuthorityR128.version = '40.80-r128-output-integrity-v1';
const rebuilt = ensureProductionAnalysisR138(staleSealed) as any;
assert.notEqual(rebuilt, staleSealed, 'O selo R128 anterior precisa ser invalidado e recalculado pela política R453.');
assert.equal(rebuilt.trainingPointsUsed, 56);
assert.equal(rebuilt.trainingPointsRemaining, 0);
assert.ok(Object.values(rebuilt.training).some((value) => Number(value) > 0));

// Reproduz a receita antiga: PP/nome conhecidos, mas valores críticos não lidos.
// O selo é da versão corrente; a validade deve conferir a cobertura real, não só versões.
const unsupported = JSON.parse(JSON.stringify(current)) as any;
unsupported.parsed.attributes = {};
unsupported.parsed.evidence.attributeCount = 26;
const unsupportedSealed = sealProductionAuthorityR128(sealProductionAuthorityR126(unsupported)) as any;
assert.equal(isCurrentProductionAnalysisR126(unsupportedSealed), false, 'Uma receita READY sem valores críticos reais não pode continuar atual só porque seus selos estão íntegros.');
const blocked = ensureProductionAnalysisR138(unsupportedSealed) as any;
assert.equal(blocked.cleanSlate2027R119.status, 'BLOCKED_INSUFFICIENT_DATA');
assert.equal(blocked.trainingPointsTotal, 56, 'O orçamento conhecido continua disponível para a conferência.');
assert.equal(blocked.trainingPointsUsed, 0, 'A abertura não pode restaurar uma receita genérica sem atributos.');
assert.deepEqual(blocked.training, emptyTraining());
assert.equal(isCurrentProductionAnalysisR126(blocked), true, 'A prévia bloqueada pode ser selada sem entrar em reconstrução permanente.');

const oldFinalPartial = JSON.parse(JSON.stringify(current)) as any;
oldFinalPartial.cleanSlate2027R119.cardTruthCertificationR501.state = 'FINAL_CERTIFIED';
oldFinalPartial.cleanSlate2027R119.cardTruthCertificationR501.canFinalize = true;
const oldFinalPartialSealed = sealProductionAuthorityR128(sealProductionAuthorityR126(oldFinalPartial)) as any;
assert.equal(isCurrentProductionAnalysisR126(oldFinalPartialSealed), false, 'A certificação final antiga de apenas 10 atributos precisa ser reavaliada.');
const provisional = ensureProductionAnalysisR138(oldFinalPartialSealed) as any;
assert.equal(provisional.trainingPointsUsed, 56, 'A progressão útil é preservada ao retirar apenas a certificação indevida.');
assert.equal(provisional.cleanSlate2027R119.cardTruthCertificationR501.canFinalize, false);

const saved: SavedAnalysis = {
  id: 'saved-r453-0-56',
  saveKey: 'legacy-r453-0-56',
  savedAt: '19/09/2026 18:00',
  updatedAt: '19/09/2026 18:00',
  rawText: RAW,
  playerImage: null,
  fullPreview: null,
  result: staleSealed,
  skillProgress: {},
  notes: '',
  favorite: false,
  personalTags: [],
  tacticalRoleNote: '',
  changeLog: [],
  productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
};

const opened = prepareVaultOpenR139([saved], saved) as any;
assert.equal(opened.changed, true, 'Abrir uma ficha antiga 0/56 deve disparar upgrade automático.');
assert.equal(opened.restored.result.trainingPointsUsed, 56);
assert.equal(opened.restored.result.trainingPointsRemaining, 0);
assert.ok(Object.values(opened.restored.result.training).some((value) => Number(value) > 0));

console.log('R453 aprovada: fichas antigas 0/56 são invalidadas, recalculadas e persistidas ao abrir.');
