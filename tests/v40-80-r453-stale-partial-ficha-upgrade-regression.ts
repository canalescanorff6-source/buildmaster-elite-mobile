import assert from 'node:assert/strict';
import { createProductionAnalysisR138, ensureProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { sealProductionAuthorityR128 } from '../src/lib/productionAuthorityR128';
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
