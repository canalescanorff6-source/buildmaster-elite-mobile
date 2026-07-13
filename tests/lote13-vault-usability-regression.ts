import assert from 'node:assert/strict';
import { DEFAULT_VAULT_FOLDERS, buildSmartHomeSummary, entryMatchesAdvancedFilters, folderForEntry } from '../src/lib/vaultUsability';

const result: any = {
  parsed: { playerName: 'Jogador Teste', playstyle: 'O Destruidor', nativeSkills: ['Interceptação'], confidence: 82 },
  bestPosition: { code: 'CB', label: 'ZAG' },
  recommendedSkills: ['Bloqueador'],
  advancedOptimizer: { efficiencyScore: 88 }
};
const entry: any = { id: '1', favorite: true, statusTag: 'completo', tacticalRoleNote: 'Titular', result };
assert.equal(DEFAULT_VAULT_FOLDERS.length >= 6, true);
assert.equal(folderForEntry(entry), 'favoritos');
assert.equal(entryMatchesAdvancedFilters(entry, { folderId: 'all', position: 'CB', playstyle: 'O Destruidor', skill: 'Interceptação', minConfidence: 80, maxConfidence: 100, minEfficiency: 80, favoritesOnly: true, pendingOnly: false, reviewOnly: false }), true);
assert.equal(entryMatchesAdvancedFilters(entry, { folderId: 'all', position: 'CF', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false }), false);
const home = buildSmartHomeSummary([entry]);
assert.equal(home.total, 1);
assert.equal(home.recentPlayer, 'Jogador Teste');
console.log('Lote 13 aprovado: pastas, filtros combinados e tela inicial inteligente.');
