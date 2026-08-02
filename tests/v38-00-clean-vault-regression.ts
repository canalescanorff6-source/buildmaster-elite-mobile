import assert from 'node:assert/strict';
import {
  CLEAN_VAULT_VERSION,
  buildCleanVaultSummaryV3800,
  cleanVaultBuildSignature,
  cleanVaultMatchesSearch,
  detectExactVaultDuplicates,
  findExactVaultDuplicateByResult,
  groupVaultPlayersV3800,
  type CleanVaultEntry
} from '../src/lib/cleanVaultV3800';

function entry(overrides: Partial<CleanVaultEntry> & { id: string; name?: string; canonicalId?: string; versionKey?: string }): CleanVaultEntry {
  const name = overrides.name ?? 'Jogador Teste';
  const canonicalId = overrides.canonicalId ?? 'ef-card-jogador-teste-a';
  const versionKey = overrides.versionKey ?? 'epic-100-30-a';
  return {
    id: overrides.id,
    saveKey: overrides.saveKey ?? overrides.id,
    savedAt: overrides.savedAt ?? '01/08/2026, 10:00:00',
    updatedAt: overrides.updatedAt ?? '01/08/2026, 10:00:00',
    favorite: overrides.favorite ?? false,
    folderId: overrides.folderId,
    statusTag: overrides.statusTag ?? 'completo',
    personalTags: overrides.personalTags ?? [],
    skillProgress: overrides.skillProgress ?? {
      'Passe de primeira': true,
      'Passe em profundidade': true,
      Interceptação: true,
      Bloqueador: true,
      'Marcação individual': true
    },
    result: overrides.result ?? {
      parsed: {
        playerName: name,
        playstyle: 'Meia versátil',
        cardType: 'Epic',
        mainPosition: 'CMF',
        level: 30,
        maxOverall: 100,
        confidence: 95,
        nativeSkills: ['Passe de primeira']
      },
      bestPosition: { code: 'CMF', label: 'MLG' },
      buildName: 'Ficha recomendada',
      training: { shooting: 2, passing: 8, dribbling: 6, dexterity: 8, lowerBody: 8, aerial: 4, defending: 6, gk1: 0, gk2: 0, gk3: 0 },
      trainingPointsUsed: 62,
      trainingPointsTotal: 62,
      recommendedSkills: ['Passe de primeira', 'Passe em profundidade', 'Interceptação', 'Bloqueador', 'Marcação individual'],
      recommendedImpetos: [{ name: 'Agilidade' }],
      structuralPrecision: { canonical: { canonicalId, versionKey } },
      advancedMotorV3750: { winner: { boosterName: 'Agilidade' } }
    }
  };
}

assert.equal(CLEAN_VAULT_VERSION, '38.00.0');

const base = entry({ id: 'a', updatedAt: '01/08/2026, 10:00:00' });
const duplicate = entry({ id: 'b', updatedAt: '02/08/2026, 10:00:00', favorite: true });
const secondCard = entry({ id: 'c', canonicalId: 'ef-card-jogador-teste-b', versionKey: 'showtime-101-28-b', updatedAt: '03/08/2026, 10:00:00' });
const intentionalVariant = entry({ id: 'd', personalTags: ['variante'], updatedAt: '04/08/2026, 10:00:00' });
const archived = entry({ id: 'e', name: 'Jogador Arquivado', canonicalId: 'ef-card-arquivado', versionKey: 'epic-99-30-z', folderId: 'arquivados' });

assert.equal(cleanVaultBuildSignature(base), cleanVaultBuildSignature(duplicate));
assert.notEqual(cleanVaultBuildSignature(base), cleanVaultBuildSignature(secondCard));

const duplicateGroups = detectExactVaultDuplicates([base, duplicate, secondCard, intentionalVariant, archived]);
assert.equal(duplicateGroups.length, 1);
assert.equal(duplicateGroups[0].keeper.id, 'b', 'Favorito mais recente deve ser preservado como registro principal.');
assert.deepEqual(new Set(duplicateGroups[0].entryIds), new Set(['a', 'b']));

const groups = groupVaultPlayersV3800([base, duplicate, secondCard, intentionalVariant, archived]);
const mainGroup = groups.find((group) => group.playerName === 'Jogador Teste');
assert.ok(mainGroup);
assert.equal(mainGroup?.buildCount, 4);
assert.equal(mainGroup?.cardVersionCount, 2);
assert.equal(mainGroup?.favorite, true);

const summary = buildCleanVaultSummaryV3800([base, duplicate, secondCard, intentionalVariant, archived]);
assert.equal(summary.players, 1);
assert.equal(summary.fichas, 4);
assert.equal(summary.archived, 1);
assert.equal(summary.duplicateGroups, 1);

assert.equal(cleanVaultMatchesSearch(base, 'meia versatil'), true);
assert.equal(cleanVaultMatchesSearch(base, 'bloqueador'), true);
assert.equal(cleanVaultMatchesSearch(base, 'goleiro'), false);

const found = findExactVaultDuplicateByResult([base, secondCard], duplicate.result);
assert.equal(found?.id, 'a');

console.log('v38.00 Cofre Clean aprovado: agrupamento por jogador, versões, arquivamento, busca e duplicidade exata.');
