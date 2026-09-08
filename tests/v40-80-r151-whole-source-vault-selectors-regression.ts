import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { PositionCode } from '../src/modules/analysis';
import type { SavedAnalysis } from '../src/modules/vault/cardHistoryStore';
import {
  CARDVISION_VAULT_SELECTORS_R151_VERSION,
  countActiveVaultFiltersR151,
  createDefaultVaultFilterStateR151,
  filterVaultHistoryR151,
  listVaultPlaystylesR151,
  listVaultSkillsR151,
} from '../src/modules/vault/cardVisionVaultSelectorsR151';

function saved(input: {
  id: string;
  name: string;
  position: PositionCode;
  playstyle: string;
  nativeSkills?: string[];
  recommendedSkills?: string[];
  favorite?: boolean;
  statusTag?: SavedAnalysis['statusTag'];
  folderId?: string;
  updatedAt?: string;
  confidence?: number;
  efficiency?: number;
  skillProgress?: Record<string, boolean>;
}): SavedAnalysis {
  const recommendedSkills = input.recommendedSkills ?? ['Interceptação', 'Bloqueio'];
  return {
    id: input.id,
    saveKey: `r151-${input.id}`,
    savedAt: input.updatedAt ?? '2026-09-04T10:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-09-04T10:00:00.000Z',
    rawText: '',
    playerImage: null,
    fullPreview: null,
    result: {
      parsed: {
        playerName: input.name,
        mainPosition: input.position,
        playstyle: input.playstyle,
        nativeSkills: input.nativeSkills ?? [],
        confidence: input.confidence ?? 90,
      },
      bestPosition: { code: input.position, label: input.position },
      buildName: `${input.name} ${input.position}`,
      recommendedSkills,
      cleanSlate2027R119: { usagePosition: input.position },
      advancedOptimizer: { efficiencyScore: input.efficiency ?? 88 },
    } as any,
    skillProgress: input.skillProgress ?? {},
    favorite: input.favorite ?? false,
    statusTag: input.statusTag,
    folderId: input.folderId,
    personalTags: [],
    notes: '',
    tacticalRoleNote: '',
    changeLog: [],
  };
}

assert.equal(CARDVISION_VAULT_SELECTORS_R151_VERSION, '40.80-r151-vault-selectors-v1');

const alpha = saved({
  id: 'alpha',
  name: 'Alpha',
  position: 'CB',
  playstyle: 'Defensor Criativo',
  nativeSkills: ['Antecipação'],
  recommendedSkills: ['Interceptação', 'Bloqueio'],
  updatedAt: '2026-09-04T10:00:00.000Z',
});
const beta = saved({
  id: 'beta',
  name: 'Beta',
  position: 'CF',
  playstyle: 'Artilheiro',
  recommendedSkills: ['Finalização acrobática', 'Cabeceio'],
  favorite: true,
  statusTag: 'completo',
  skillProgress: { 'Finalização acrobática': true, Cabeceio: true },
  updatedAt: '2026-09-04T11:00:00.000Z',
});
const archived = saved({
  id: 'gamma',
  name: 'Gamma',
  position: 'DMF',
  playstyle: '1º Volante',
  folderId: 'arquivados',
  updatedAt: '2026-09-04T12:00:00.000Z',
});
const history = [archived, beta, alpha];
const originalIds = history.map((item) => item.id).join(',');

const defaults = createDefaultVaultFilterStateR151();
const defaults2 = createDefaultVaultFilterStateR151();
assert.notEqual(defaults, defaults2, 'Cada reset deve receber um novo objeto de filtros.');
assert.deepEqual(defaults, {
  folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100,
  minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false,
});

const visible = filterVaultHistoryR151({ history, search: '', filter: 'ALL', sort: 'UPDATED', onlyPendingSkills: false, advancedFilters: defaults });
assert.deepEqual(visible.map((item) => item.id), ['beta', 'alpha'], 'Pasta Todos deve continuar ocultando arquivados e ordenar por atualização.');
assert.equal(history.map((item) => item.id).join(','), originalIds, 'Seletores não podem reordenar/mutar o histórico canônico.');

const searched = filterVaultHistoryR151({ history, search: 'defensor criativo', filter: 'ALL', sort: 'NAME', onlyPendingSkills: false, advancedFilters: defaults });
assert.deepEqual(searched.map((item) => item.id), ['alpha']);

const favorites = filterVaultHistoryR151({ history, search: '', filter: 'FAVORITES', sort: 'NAME', onlyPendingSkills: false, advancedFilters: defaults });
assert.deepEqual(favorites.map((item) => item.id), ['beta']);

const byPosition = filterVaultHistoryR151({ history, search: '', filter: 'CB', sort: 'NAME', onlyPendingSkills: false, advancedFilters: defaults });
assert.deepEqual(byPosition.map((item) => item.id), ['alpha']);

const archivedOnly = filterVaultHistoryR151({ history, search: '', filter: 'ALL', sort: 'NAME', onlyPendingSkills: false, advancedFilters: { ...defaults, folderId: 'arquivados' } });
assert.deepEqual(archivedOnly.map((item) => item.id), ['gamma']);

assert.deepEqual(listVaultPlaystylesR151(history), ['1º Volante', 'Artilheiro', 'Defensor Criativo']);
assert.deepEqual(listVaultSkillsR151(history), ['Antecipação', 'Bloqueio', 'Cabeceio', 'Finalização acrobática', 'Interceptação']);

assert.equal(countActiveVaultFiltersR151({ search: '', filter: 'ALL', advancedFilters: defaults }), 0);
assert.equal(countActiveVaultFiltersR151({
  search: 'Alpha',
  filter: 'FAVORITES',
  advancedFilters: { ...defaults, position: 'CB', minConfidence: 70, favoritesOnly: true },
}), 5);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const derived = fs.readFileSync('src/hooks/useCardVisionDerivedStateR179.ts', 'utf8');
const appLines = app.split(/\r?\n/).length;
assert.ok(appLines < 3901, `R151 deve manter a redução real do CardVision (atual: ${appLines}).`);
assert.match(derived, /cardVisionVaultSelectorsR151/, 'Selector derivado R179 deve consumir os seletores modulares do Cofre.');
assert.match(derived, /filterVaultHistoryR151\(/, 'Filtragem do Cofre deve permanecer fora do shell e dentro do selector derivado.');
assert.doesNotMatch(app, /const searchable = `\$\{item\.result\.parsed\.playerName\}/, 'Busca textual detalhada não deve voltar a ser implementada inline no shell.');

console.log(`r151 aprovada: typecheck de toda src protegido, seletores do Cofre preservados em R179 e CardVision em ${appLines} linhas.`);
