import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCardForProductionR128, ensureCurrentProductionAnalysisR128 } from '../src/lib/productionAnalysisR128';
import { isCurrentProductionAnalysisR128, productionOutputFingerprintR128 } from '../src/lib/productionAuthorityR128';
import { applyGameplayDnaProfileSelection } from '../src/lib/gameplayDnaSelection';
import { resultHistoryKey, type SavedAnalysis } from '../src/modules/vault/cardHistoryStore';
import { applyProductionVaultUpgradeR128, upgradeSavedAnalysisForProductionR128, VAULT_PRODUCTION_RECORD_R128_VERSION } from '../src/modules/vault/productionVaultR128';
import { runSerializedVaultCloudMutationR128 } from '../src/modules/vault/vaultCloudQueueR128';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const rawText = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R128 Integridade\nPOSIÇÃO PRINCIPAL: CMF\nESTILO DE JOGO: Orquestrador\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira\nTalento ofensivo: 80\nControle de bola: 86\nDrible: 84\nCondução firme: 85\nPasse rasteiro: 91\nPasse alto: 89\nFinalização: 73\nCabeceio: 70\nTalento defensivo: 78\nDedicação defensiva: 81\nDesarme: 79\nAgressividade: 76\nVelocidade: 84\nAceleração: 82\nForça do chute: 80\nSalto: 74\nContato físico: 80\nEquilíbrio: 82\nResistência: 90\n[FIM AJUSTES]`;

const production:any = analyzeCardForProductionR128(rawText, 'COMPETITIVE', 'CMF', 'r128.png', { formation: 'AUTO', style: 'POSSE_DE_BOLA' } as any);
assert.equal(production.productionAuthorityR128?.authority, 'PRODUCTION_OUTPUT_INTEGRITY');
assert.equal(isCurrentProductionAnalysisR128(production), true, 'Saída nova deve nascer com integridade R128 válida.');
const originalFingerprint = productionOutputFingerprintR128(production);

const changedTraining:any = { ...production, training: { ...production.training, dribbling: Number(production.training.dribbling || 0) + 1 } };
assert.equal(isCurrentProductionAnalysisR128(changedTraining), false, 'Mutação pós-writer na progressão precisa invalidar o selo.');
const repairedTraining:any = ensureCurrentProductionAnalysisR128(changedTraining);
assert.equal(isCurrentProductionAnalysisR128(repairedTraining), true);
assert.deepEqual(repairedTraining.training, production.training, 'O guardião deve restaurar a ficha do escritor final, não aceitar a mutação.');

const changedSkills:any = { ...production, recommendedSkills: [...production.recommendedSkills].reverse() };
if (production.recommendedSkills.length > 1) {
  assert.equal(isCurrentProductionAnalysisR128(changedSkills), false, 'Ordem/conteúdo do Top 5 faz parte da decisão final selada.');
  assert.deepEqual(ensureCurrentProductionAnalysisR128(changedSkills).recommendedSkills, production.recommendedSkills);
}

const changedImpeto:any = { ...production, recommendedImpetos: [{ name: 'Ímpeto paralelo indevido', value: 99 }] };
assert.equal(isCurrentProductionAnalysisR128(changedImpeto), false, 'Ímpeto posterior ao Clean Slate precisa invalidar a produção.');
assert.equal(productionOutputFingerprintR128(production), originalFingerprint, 'A verificação não pode alterar a própria saída.');

// Gameplay DNA continua disponível como diagnóstico, mas não pode mais virar segundo escritor.
const diagnosticBase:any = {
  ...production,
  gameplayDna: {
    playerName: production.parsed.playerName,
    officialPlaystyle: production.parsed.playstyle,
    primaryProfileId: 'profile-a',
    detectedDna: ['controle'],
    summary: 'diagnóstico',
    profiles: [{
      id: 'profile-a', rank: 1, label: 'Perfil A', position: 'CMF', functionalStyle: 'Criador', score: 99, compatibility: 99,
      focus: ['passe'], description: 'Simulação deliberadamente diferente.', exactBudget: true,
      training: { ...production.training, shooting: 0, passing: 20 }, additionalSkills: ['Habilidade paralela']
    }]
  }
};
const diagnosticSelected:any = applyGameplayDnaProfileSelection(diagnosticBase, 'profile-a' as any);
assert.deepEqual(diagnosticSelected.training, production.training, 'Gameplay DNA não pode sobrescrever a progressão final.');
assert.deepEqual(diagnosticSelected.recommendedSkills, production.recommendedSkills, 'Gameplay DNA não pode sobrescrever Top 5.');
assert.deepEqual(diagnosticSelected.recommendedImpetos, production.recommendedImpetos, 'Gameplay DNA não pode sobrescrever Ímpeto.');
assert.equal(isCurrentProductionAnalysisR128(diagnosticSelected), true, 'Metadado diagnóstico pode mudar sem invalidar os outputs protegidos.');

// Migração lazy do Cofre deve persistir a autoridade nova uma única vez.
const staleResult:any = { ...production, productionAuthorityR128: undefined };
const saved:SavedAnalysis = {
  id: 'vault-r128', saveKey: resultHistoryKey(staleResult), savedAt: '2026-09-04T10:00:00.000Z', updatedAt: '2026-09-04T10:00:00.000Z', rawText,
  playerImage: null, fullPreview: null, result: staleResult, skillProgress: {}, notes: 'nota preservada', favorite: true, personalTags: [], tacticalRoleNote: '', changeLog: []
};
const upgrade = upgradeSavedAnalysisForProductionR128(saved);
assert.equal(upgrade.changed, true);
assert.equal(upgrade.item.productionRecordVersion, VAULT_PRODUCTION_RECORD_R128_VERSION);
assert.equal(isCurrentProductionAnalysisR128(upgrade.item.result), true);
const history = applyProductionVaultUpgradeR128([saved], upgrade);
assert.equal(history.length, 1);
assert.equal(history[0].favorite, true);
assert.equal(history[0].notes, 'nota preservada');
const reopened = upgradeSavedAnalysisForProductionR128(history[0]);
assert.equal(reopened.changed, false, 'Depois de migrada, a mesma ficha não pode recalcular em toda abertura.');

// A fila da nuvem precisa garantir ordem de commits mesmo se o primeiro upload for mais lento.
async function queueRegression() {
  let remote = 'initial';
  const writes:string[] = [];
  const first = runSerializedVaultCloudMutationR128(async () => {
    await new Promise((resolve) => setTimeout(resolve, 35));
    remote = 'snapshot-antigo'; writes.push(remote);
  });
  const second = runSerializedVaultCloudMutationR128(async () => {
    remote = 'snapshot-novo'; writes.push(remote);
  });
  await Promise.all([first, second]);
  assert.deepEqual(writes, ['snapshot-antigo', 'snapshot-novo'], 'Mutações precisam ser serializadas na ordem solicitada.');
  assert.equal(remote, 'snapshot-novo', 'Snapshot mais novo deve vencer; upload antigo nunca pode terminar por último.');
}

async function main() {
  await queueRegression();
  const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
  const dnaCard = fs.readFileSync('src/components/result/GameplayDnaProfilesCard.tsx', 'utf8');
  assert.match(app, /ensureProductionAnalysisR138\(result\)/, 'A tela precisa vigiar mutações posteriores do resultado pela fachada atual de produção.');
  const vaultActions = fs.readFileSync('src/hooks/useCardVisionVaultActionsR185.ts', 'utf8');
  assert.match(vaultActions, /prepareVaultOpenR139/, 'Abrir o Cofre deve entrar pelo lifecycle transacional atual.');
  const lifecycle = fs.readFileSync('src/modules/vault/vaultProductionLifecycleR139.ts', 'utf8');
  assert.match(lifecycle, /upgradeSavedAnalysisForProductionR128/, 'O lifecycle atual deve preservar a migração lazy R128 internamente.');
  const cloudRuntime = fs.readFileSync('src/modules/backup/vaultCloudRuntimeR166.ts', 'utf8');
  assert.doesNotMatch(app, /runSerializedVaultCloudMutationR128/, 'CardVisionApp não deve voltar a carregar a fila cloud diretamente.');
  assert.match(cloudRuntime, /runSerializedVaultCloudMutationR128/, 'Mutações simples da nuvem devem continuar passando pela fila serializada R128 na autoridade cloud lazy.');
  assert.match(dnaCard, /diagnóstico somente/, 'A UI precisa deixar claro que perfis DNA não substituem a ficha oficial.');
  console.log('r128 aprovada: integridade pós-writer, DNA somente diagnóstico, migração lazy persistente do Cofre e fila anti-race da nuvem.');
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
