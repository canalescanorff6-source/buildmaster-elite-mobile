import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const helper = read('src/modules/backup/backupStorageJsonR165.ts');
const collector = read('src/modules/backup/backupSectionCollectorR141.ts');
const runtime = read('src/modules/backup/cardVisionBackupRuntimeR162.ts');

assert.match(app, /from '@\/modules\/backup\/backupStorageJsonR165'/, 'Shell deve usar o helper JSON leve R165.');
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/backup\/backupSectionCollectorR141['"]/m, 'CardVisionApp não pode carregar o coletor completo R141 no startup.');
assert.match(helper, /BACKUP_STORAGE_JSON_R165_VERSION/, 'Helper leve R165 deve possuir versão explícita.');
assert.match(helper, /readAccountStorage\(key\)/, 'Helper R165 deve preservar a leitura account-scoped.');
assert.match(helper, /JSON\.parse\(raw\)/, 'Helper R165 deve preservar a mesma semântica JSON.');
assert.match(collector, /from '@\/modules\/backup\/backupStorageJsonR165'/, 'Coletor R141 deve reutilizar a mesma autoridade leve de leitura JSON.');
assert.match(collector, /export \{ readAccountJsonR141 \} from '@\/modules\/backup\/backupStorageJsonR165'/, 'Compatibilidade pública R141 deve ser preservada por reexport.');
assert.match(runtime, /collectFullBackupSectionsR141, collectPlayersBackupSectionsR141/, 'Runtime lazy R162 deve continuar sendo o consumidor do coletor pesado.');

for (const heavyMarker of [
  'exportTacticalImageLibrary',
  'exportCommunityState',
  'exportCommercialState',
  'exportPlayStorePublicationState',
  'readMatchTrainerSessions',
]) {
  assert.ok(!helper.includes(heavyMarker), `Helper leve R165 não pode importar/usar ${heavyMarker}.`);
  assert.ok(collector.includes(heavyMarker), `Coletor pesado R141 deve continuar responsável por ${heavyMarker}.`);
}

console.log('R165 aprovada: leitura JSON de bootstrap saiu do coletor completo R141 sem alterar o contrato de backup.');
