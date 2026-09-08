import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import { isCurrentProductionAnalysisR128 } from '../src/lib/productionAuthorityR128';
import { buildCurrentHtmlExportR129, buildCurrentMarkdownExportR129, buildSavedAnalysisHtmlExportR129 } from '../src/modules/export/clientTextExportR129';
import {
  archiveHistoryEntryR129,
  batchFavoriteHistoryR129,
  batchStatusHistoryR129,
  duplicateHistoryEntryR129,
  markAllHistorySkillsR129,
  mergeSelectedHistoryR129,
  moveHistoryEntryToFolderR129,
  toggleFavoriteHistoryR129,
  updateHistoryNotesR129,
  updateHistoryStatusR129
} from '../src/modules/vault/vaultHistoryMutationsR129';
import { resultHistoryKey, type SavedAnalysis } from '../src/modules/vault/cardHistoryStore';
import { VAULT_PRODUCTION_RECORD_R128_VERSION } from '../src/modules/vault/productionVaultR128';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const rawText = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R129 Modular\nPOSIÇÃO PRINCIPAL: CB\nESTILO DE JOGO: Defensor Criativo\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: Interceptação\nTalento ofensivo: 65\nControle de bola: 79\nDrible: 72\nCondução firme: 76\nPasse rasteiro: 84\nPasse alto: 83\nFinalização: 55\nCabeceio: 87\nTalento defensivo: 91\nDedicação defensiva: 90\nDesarme: 92\nAgressividade: 88\nVelocidade: 81\nAceleração: 77\nForça do chute: 78\nSalto: 89\nContato físico: 91\nEquilíbrio: 73\nResistência: 86\n[FIM AJUSTES]`;

const result:any = analyzeCardForProductionR128(rawText, 'COMPETITIVE', 'CB', 'r129.png', { formation: 'AUTO', style: 'AUTO' } as any);
assert.equal(isCurrentProductionAnalysisR128(result), true);

function saved(id: string, suffix = ''): SavedAnalysis {
  return {
    id,
    saveKey: `${resultHistoryKey(result)}${suffix}`,
    savedAt: '04/09/2026, 11:00:00',
    updatedAt: '04/09/2026, 11:00:00',
    rawText,
    playerImage: null,
    fullPreview: null,
    result,
    skillProgress: {},
    notes: '',
    favorite: false,
    statusTag: 'pendente',
    personalTags: [],
    tacticalRoleNote: '',
    changeLog: [],
    productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
  };
}

const base = saved('r129-a');
const originalTraining = JSON.stringify(result.training);
const originalSkills = JSON.stringify(result.recommendedSkills);
const originalImpeto = JSON.stringify(result.recommendedImpetos);

const mutations: SavedAnalysis[][] = [];
mutations.push(moveHistoryEntryToFolderR129([base], base.id, 'zagueiros', 'Zagueiros'));
mutations.push(archiveHistoryEntryR129([base], base.id, true));
mutations.push(batchFavoriteHistoryR129([base], [base.id], true));
mutations.push(batchStatusHistoryR129([base], [base.id], 'revisar'));
mutations.push(toggleFavoriteHistoryR129([base], base.id));
mutations.push(updateHistoryStatusR129([base], base.id, 'completo'));
mutations.push(markAllHistorySkillsR129([base], base.id, true));
mutations.push(updateHistoryNotesR129([base], base.id, 'nota de teste'));

for (const history of mutations) {
  const current:any = history[0].result;
  assert.equal(JSON.stringify(current.training), originalTraining, 'Organização do Cofre não pode reescrever progressão.');
  assert.equal(JSON.stringify(current.recommendedSkills), originalSkills, 'Organização do Cofre não pode reescrever Top 5.');
  assert.equal(JSON.stringify(current.recommendedImpetos), originalImpeto, 'Organização do Cofre não pode reescrever Ímpeto.');
  assert.equal(isCurrentProductionAnalysisR128(current), true, 'Mutações de metadados devem preservar o selo da autoridade.');
}

const copy = duplicateHistoryEntryR129(base);
assert.notEqual(copy.id, base.id);
assert.match(copy.saveKey, /-variante-/i);
assert.equal(copy.result, base.result, 'Criar variante do Cofre não pode inventar uma nova análise silenciosamente.');
assert.ok(copy.personalTags?.includes('variante'));

const second = { ...saved('r129-b', '-variante-manual'), favorite: true, notes: 'segunda nota', personalTags: ['teste'] };
const merge = mergeSelectedHistoryR129([base, second], [base.id, second.id]);
assert.ok(merge);
assert.equal(merge?.next.length, 1);
assert.equal(merge?.duplicates.length, 1);
assert.equal(JSON.stringify(merge?.merged.result.training), originalTraining, 'Mesclar metadados não pode mesclar/alterar duas builds silenciosamente.');
assert.equal(isCurrentProductionAnalysisR128(merge!.merged.result), true);

const savedExport = buildSavedAnalysisHtmlExportR129(base);
assert.match(savedExport.fileName, /^buildmaster-r129-modular\.html$/);
assert.match(savedExport.mimeType, /text\/html/);
assert.match(savedExport.contents, /R129 Modular/i);
assert.ok(!savedExport.contents.startsWith(savedExport.fileName), 'Conteúdo não pode ser confundido com nome do arquivo.');

const htmlExport = buildCurrentHtmlExportR129(result, 'nota');
assert.match(htmlExport.fileName, /^buildmaster-r129-modular-\d{4}-\d{2}-\d{2}\.html$/);
assert.match(htmlExport.contents, /R129 Modular/i);
const markdownExport = buildCurrentMarkdownExportR129(result, 'nota');
assert.match(markdownExport.fileName, /^buildmaster-r129-modular-\d{4}-\d{2}-\d{2}\.md$/);
assert.match(markdownExport.contents, /R129 Modular/i);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const vaultActionsR185 = fs.readFileSync('src/hooks/useCardVisionVaultActionsR185.ts', 'utf8');
const deferredActionsR168 = fs.readFileSync('src/modules/runtime/cardVisionDeferredActionsR168.ts', 'utf8');
const appLines = app.split(/\r?\n/).length;
assert.ok(appLines < 4349, `CardVisionApp deve ficar menor que a base R128 (atual: ${appLines}).`);
assert.doesNotMatch(app, /function downloadTextFile\(/, 'Download genérico posicional não deve voltar ao monólito.');
assert.match(vaultActionsR185, /clientTextExport\.downloadClientTextExportR129\(exportRuntime\.clientTextExport\.buildSavedAnalysisHtmlExportR129\(item\)\)/, 'Export individual deve continuar usando a API nomeada anti-inversão através do runtime R168 na fronteira R185.');
assert.match(deferredActionsR168, /import\(['"]@\/modules\/export\/clientTextExportR129['"]\)/, 'R168 deve carregar o exportador R129 por fronteira dinâmica, sem trazê-lo ao startup.');
assert.match(vaultActionsR185, /mergeSelectedHistoryR129/, 'Mesclagem de Cofre deve continuar usando o módulo testável R129 através da fronteira R185.');

console.log(`r129 aprovada: Cofre modular sem segundo writer, exports corrigidos e CardVisionApp reduzido para ${appLines} linhas.`);
