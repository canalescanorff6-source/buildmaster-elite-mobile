import assert from 'node:assert/strict';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import {
  buildDashboardStats,
  memoryKey,
  resultHistoryKey,
  savedStatusLabel,
  skillProgressInfo,
  type SavedAnalysis,
} from '../src/modules/vault/cardHistoryStore';
import {
  buildDashboardStatsR200,
  memoryKeyR200,
  resultHistoryKeyR200,
  sanitizeRuntimeHistoryR200,
  savedStatusLabelR200,
  skillProgressInfoR200,
} from '../src/modules/vault/cardHistoryStartupModelR200';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';
const raw = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R200 Startup\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO: Artilheiro\nPONTOS TOTAIS: 60\nTalento ofensivo: 90\nControle de bola: 86\nDrible: 84\nPasse rasteiro: 73\nFinalização: 91\nVelocidade: 85\nAceleração: 86\nContato físico: 81\nResistência: 80\n[FIM AJUSTES]`;
const result = createProductionAnalysisR138({ rawText: raw, objective: 'COMPETITIVE', targetPosition: 'CF', imageFileName: 'r200.png' });
const now = '07/09/2026, 14:30:00';
const progress = Object.fromEntries(result.recommendedSkills.map((skill, index) => [skill, index % 2 === 0]));
const item: SavedAnalysis = { id: 'r200-1', saveKey: resultHistoryKey(result), savedAt: now, updatedAt: now, rawText: raw, playerImage: null, fullPreview: null, result, skillProgress: progress };

for (const value of ['João Félix', 'Pasta 01 / Elite', '  Contra Ataque Rápido  ']) assert.equal(memoryKeyR200(value), memoryKey(value));
assert.equal(resultHistoryKeyR200(result), resultHistoryKey(result));
assert.deepEqual(skillProgressInfoR200(result.recommendedSkills, progress), skillProgressInfo(result.recommendedSkills, progress));
assert.equal(savedStatusLabelR200(item), savedStatusLabel(item));
assert.deepEqual(buildDashboardStatsR200([item]), buildDashboardStats([item]));
const canonical = [item];
assert.equal(sanitizeRuntimeHistoryR200(canonical), canonical, 'R200: história canônica deve manter identidade e evitar cópia no render.');
const duplicate = { ...item, id: 'r200-dup' };
assert.deepEqual(sanitizeRuntimeHistoryR200([item, duplicate]), [item], 'R200: duplicata por saveKey deve ser isolada no render leve.');
console.log('R200 equivalência aprovada: helpers leves do startup preservam chaves/status/estatísticas do Cofre canônico.');
