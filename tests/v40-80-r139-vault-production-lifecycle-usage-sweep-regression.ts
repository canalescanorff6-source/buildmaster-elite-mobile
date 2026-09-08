import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { analysisUsagePositionR138 } from '../src/lib/analysisUsagePositionR138';
import { migrateAnalysisResult, resultHistoryKey } from '../src/modules/vault/cardHistoryStore';
import { prepareVaultOpenR139, prepareVaultSaveR139, prepareVaultSkillToggleR139 } from '../src/modules/vault/vaultProductionLifecycleR139';
import { savedIdentitySealCurrentR134 } from '../src/modules/vault/vaultIdentitySealR134';
import { correctionKeysForResult } from '../src/modules/builds/dynamicRules';
import { buildEliteTeamReport } from '../src/lib/teamOptimizer';
import { buildSquadRotationReport } from '../src/lib/squadRotation';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const rawText = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R139 Fora de posição\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO: Artilheiro\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: Finalização de primeira\nTalento ofensivo: 90\nControle de bola: 86\nDrible: 83\nCondução firme: 81\nPasse rasteiro: 72\nPasse alto: 68\nFinalização: 91\nCabeceio: 84\nTalento defensivo: 61\nDedicação defensiva: 62\nDesarme: 60\nAgressividade: 78\nVelocidade: 84\nAceleração: 85\nForça do chute: 88\nSalto: 84\nContato físico: 86\nEquilíbrio: 79\nResistência: 82\n[FIM AJUSTES]`;

const cb: any = createProductionAnalysisR138({ rawText, objective: 'COMPETITIVE', targetPosition: 'CB', imageFileName: 'r139-cb.png' });
const dmf: any = createProductionAnalysisR138({ rawText, objective: 'COMPETITIVE', targetPosition: 'DMF', imageFileName: 'r139-dmf.png' });
assert.equal(analysisUsagePositionR138(cb), 'CB');
assert.equal(analysisUsagePositionR138(dmf), 'DMF');
assert.notEqual(resultHistoryKey(cb), resultHistoryKey(dmf));
assert.notEqual(correctionKeysForResult(cb).role, correctionKeysForResult(dmf).role, 'Correção funcional não pode vazar entre ZAG e VOL da mesma carta.');

const cbWithDiagnosticCf: any = { ...cb, bestPosition: { ...cb.bestPosition, code: 'CF', label: 'CA', score: 99 } };
assert.equal(analysisUsagePositionR138(cbWithDiagnosticCf), 'CB', 'bestPosition diagnóstica não pode substituir a posição real de uso.');
const teamReport = buildEliteTeamReport([cbWithDiagnosticCf], '4-2-2-2', 'POSSE_DE_BOLA');
assert.ok(teamReport);
assert.equal(teamReport!.roleCoverage.find((item) => item.label === 'Zagueiros/cobertura')?.count, 1, 'Otimizador de elenco deve contar a função real CB, não a bestPosition CF.');
assert.equal(teamReport!.roleCoverage.find((item) => item.label === 'Finalizador claro')?.count, 0, 'Um CB off-position não pode voltar a ser contado como atacante só pela bestPosition.');
const rotationReport = buildSquadRotationReport([cbWithDiagnosticCf], '4-2-2-2', 'POSSE_DE_BOLA', 'NORMAL', 'NORMAL');
assert.ok(rotationReport);
assert.equal(rotationReport!.starters[0]?.position, 'CB', 'Rotação deve carregar a posição real de uso.');

const saved = prepareVaultSaveR139({ history: [], result: cb, rawText, playerImage: null, fullPreview: null, now: '04/09/2026, 16:30:00' });
assert.equal(saved.nextHistory.length, 1);
assert.equal(saved.item.result, saved.productionResult);
assert.match(saved.item.saveKey, /-cb$/);
assert.equal(savedIdentitySealCurrentR134(saved.item), true, 'Registro criado pela transação R139 deve sair com selo coerente.');

const skill = saved.productionResult.recommendedSkills[0];
if (skill) {
  const toggled = prepareVaultSkillToggleR139({
    history: saved.nextHistory,
    result: saved.productionResult,
    activeHistoryId: saved.item.id,
    skill,
    rawText,
    playerImage: null,
    fullPreview: null,
    now: '04/09/2026, 16:31:00'
  });
  assert.deepEqual(toggled.item.result.training, saved.productionResult.training, 'Marcar Top 5 não pode reescrever progressão.');
  assert.deepEqual(toggled.item.result.recommendedSkills, saved.productionResult.recommendedSkills, 'Marcar Top 5 não pode trocar o Top 5 oficial.');
  assert.deepEqual(toggled.item.result.recommendedImpetos, saved.productionResult.recommendedImpetos, 'Marcar Top 5 não pode trocar Ímpeto.');
  assert.equal(toggled.item.skillProgress[skill], true);
  assert.equal(savedIdentitySealCurrentR134(toggled.item), true);
}

const poisoned: any = {
  ...saved.item,
  result: {
    ...saved.item.result,
    training: { ...saved.item.result.training, passing: Number(saved.item.result.training.passing ?? 0) + 1 }
  }
};
const opened = prepareVaultOpenR139([poisoned], poisoned, '04/09/2026, 16:32:00');
assert.equal(opened.changed, true, 'Output adulterado deve ser reconstruído ao abrir pelo lifecycle R139.');
assert.deepEqual(opened.restored.result.training, saved.productionResult.training);
assert.equal(savedIdentitySealCurrentR134(opened.nextHistory[0]), true);

const legacy: any = {
  parsed: { ...cb.parsed, mainPosition: 'CF', mainPositionPt: 'CA' },
  bestPosition: { code: 'CF', label: 'CA', score: 99 },
  cleanSlate2027R119: { usagePosition: 'CB' },
  trainingPointsTotal: 60
};
const migrated = migrateAnalysisResult(legacy, rawText, 'legacy-r139.png');
assert.ok(migrated);
assert.equal(analysisUsagePositionR138(migrated!), 'CB', 'Migração deve preservar usagePosition e não regredir para bestPosition.');

const root = path.resolve(__dirname, '..');
const analysisFacade = fs.readFileSync(path.join(root, 'src/modules/analysis/index.ts'), 'utf8');
assert.doesNotMatch(analysisFacade, /export \{ analyzeCardForProductionR12[68]/, 'Fachada pública não deve reexportar entradas históricas de produção.');
const productionVault = fs.readFileSync(path.join(root, 'src/modules/vault/productionVaultR128.ts'), 'utf8');
assert.doesNotMatch(productionVault, /productionAnalysisR128|productionAuthorityR128/, 'Cofre deve depender da fachada R138, não da implementação R128.');
assert.match(productionVault, /ensureProductionAnalysisR138/);
const historyStore = fs.readFileSync(path.join(root, 'src/modules/vault/cardHistoryStore.ts'), 'utf8');
assert.doesNotMatch(historyStore, /analyzeCardForProductionR128/);
assert.match(historyStore, /createProductionAnalysisR138/);
assert.match(historyStore, /optionalAnalysisUsagePositionR138/);

const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const vaultActions = fs.readFileSync(path.join(root, 'src/hooks/useCardVisionVaultActionsR185.ts'), 'utf8');
assert.match(vaultActions, /prepareVaultOpenR139/);
assert.match(vaultActions, /prepareVaultSaveR139/);
assert.match(vaultActions, /prepareVaultSkillToggleR139/);
assert.doesNotMatch(`${app}\n${vaultActions}`, /upgradeSavedAnalysisForProductionR128|applyProductionVaultUpgradeR128|findExactVaultDuplicateByResult|buildBuildQualityGate/);
assert.ok(app.split(/\r?\n/).length < 4080, 'CardVisionApp deve continuar diminuindo com o lifecycle R139.');

const usageSensitiveFiles: Array<[string, RegExp]> = [
  ['src/components/PrecisionBuildPanel.tsx', /cardUsageIdentityKeyR126\(result\.parsed, result\.bestPosition\.code\)/],
  ['src/components/result/ResultWorkspace.tsx', /cardUsageIdentityKeyR126\(result\.parsed, result\.bestPosition\.code\)/],
  ['src/components/EliteEvolutionPanels.tsx', /versionSignature_\$\{result\.bestPosition\.code\}/],
  ['src/components/CompactSharePanel.tsx', /<b>\{result\.bestPosition\.code\}<\/b> destino/],
  ['src/modules/builds/advancedBuildIntelligence.ts', /activeKeys\(result\.bestPosition\.code\)/],
  ['src/modules/builds/dynamicRules.ts', /role:\$\{result\.parsed\.mainPosition\}/],
  ['src/lib/teamOptimizer.ts', /target\.accepted\.includes\(result\.bestPosition\.code\)/],
  ['src/lib/formationRoleEngine.ts', /const selected = result\.bestPosition\.code/],
  ['src/lib/squadRotation.ts', /const p=r\.bestPosition\.code/],
  ['src/lib/squadChemistry.ts', /includes\(p\.bestPosition\.code\)/],
  ['src/lib/professionalSquadEngine.ts', /includes\(result\.bestPosition\.code\)/],
  ['src/modules/squad/TeamFullMapPanel.tsx', /const code = result\.bestPosition\.code/]
];
for (const [file, forbidden] of usageSensitiveFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(source, forbidden, `${file} ainda confunde bestPosition/mainPosition com posição real de uso.`);
}

console.log('r139 aprovada: Cofre abre/salva pela fachada única, migração preserva posição real, selos não ficam obsoletos e UI/laboratórios não persistem experimentos pela bestPosition.');
