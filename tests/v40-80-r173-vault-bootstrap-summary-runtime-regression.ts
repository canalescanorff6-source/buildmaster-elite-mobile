import assert from 'node:assert/strict';
import { buildCleanVaultSummaryV3800, type CleanVaultEntry } from '../src/lib/cleanVaultV3800';
import { buildVaultBootstrapSummaryR173, cleanVaultPlayerKeyR173 } from '../src/modules/vault/vaultBootstrapSummaryR173';

function entry(id: string, playerName: string, folderId?: string): CleanVaultEntry {
  return {
    id,
    saveKey: id,
    savedAt: '05/09/2026, 10:00:00',
    updatedAt: '05/09/2026, 10:00:00',
    folderId,
    statusTag: 'completo',
    result: {
      parsed: { playerName, cardType: 'Epic', mainPosition: 'CMF', level: 30, maxOverall: 100, nativeSkills: ['Passe de primeira'] },
      bestPosition: { code: 'CMF', label: 'MLG' },
      buildName: 'Teste R173',
      training: { shooting: 2, passing: 8, dribbling: 6, dexterity: 8, lowerBody: 8, aerial: 4, defending: 6, gk1: 0, gk2: 0, gk3: 0 },
      trainingPointsUsed: 62,
      trainingPointsTotal: 62,
      recommendedSkills: ['Passe de primeira'],
      recommendedImpetos: [{ name: 'Agilidade' }],
    },
  };
}

const entries = [
  entry('a', 'João Félix'),
  entry('b', 'JOAO FELIX'),
  entry('c', 'Lionel Messi'),
  entry('d', 'Lionel Messi', 'arquivados'),
  entry('e', ''),
  entry('f', ''),
];

const full = buildCleanVaultSummaryV3800(entries);
const bootstrap = buildVaultBootstrapSummaryR173(entries);
assert.equal(bootstrap.players, full.players, 'R173: contagem de jogadores da home deve ser idêntica ao Cofre completo.');
assert.equal(bootstrap.fichas, full.fichas, 'R173: contagem de fichas ativas deve ser idêntica ao Cofre completo.');
assert.equal(bootstrap.archived, full.archived, 'R173: contagem de arquivadas deve ser idêntica ao Cofre completo.');
assert.equal(cleanVaultPlayerKeyR173(entries[0]), cleanVaultPlayerKeyR173(entries[1]), 'R173: acentos/caixa devem preservar o agrupamento histórico.');
assert.notEqual(cleanVaultPlayerKeyR173(entries[4]), cleanVaultPlayerKeyR173(entries[5]), 'R173: entradas sem nome continuam separadas pelo id.');

console.log('R173 runtime aprovado: resumo bootstrap equivale ao resumo completo nos três números exibidos pela home.');
