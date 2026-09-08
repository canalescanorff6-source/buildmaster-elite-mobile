import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync('src/modules/backup/useCardVisionBackupControllerR162.ts', 'utf8');
const types = fs.readFileSync('src/modules/backup/cardVisionBackupControllerTypesR170.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/backup/cardVisionBackupRuntimeR162.ts', 'utf8');
const sync = fs.readFileSync('src/modules/backup/syncBackupEngine.ts', 'utf8');

assert.doesNotMatch(
  controller,
  /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/backup\/syncBackupEngine['"]/m,
  'R170: syncBackupEngine não pode voltar como import estático do controller.'
);
assert.match(controller, /import type \{ BackupSnapshot, SectionConflict \} from ['"]@\/modules\/backup\/syncBackupEngine['"]/, 'R170: controller deve consumir apenas tipos do sync engine no startup.');
assert.match(controller, /if \(!backupSettingsActive \|\| !syncHealthEnvelope\)/, 'R170: diagnóstico completo deve respeitar intenção explícita da tela de Backup.');
assert.match(controller, /import\(['"]\.\/syncBackupEngine['"]\)/, 'R170: buildSyncHealth deve carregar o sync engine dinamicamente.');
assert.match(controller, /setFullSyncHealth\(buildSyncHealth\(/, 'R170: diagnóstico completo continua usando a implementação oficial buildSyncHealth.');
assert.match(sync, /export function buildSyncHealth/, 'R170: implementação oficial buildSyncHealth deve continuar no syncBackupEngine.');
assert.match(controller, /import type \{ CardVisionBackupControllerInputR162, FullSyncHealthR170 \} from ['"]\.\/cardVisionBackupControllerTypesR170['"]/, 'R170: contrato grande do controller deve ficar em módulo type-only.');
assert.match(types, /export type CardVisionBackupControllerInputR162/, 'R170: contrato público R162 deve ser preservado no módulo type-only.');
assert.match(controller, /export type \{ CardVisionBackupControllerInputR162 \} from ['"]\.\/cardVisionBackupControllerTypesR170['"]/, 'R170: controller deve manter compatibilidade de export type R162.');
assert.match(runtime, /import type \{ CardVisionBackupControllerInputR162 \} from ['"]\.\/cardVisionBackupControllerTypesR170['"]/, 'R170: runtime pesado deve depender diretamente do contrato type-only, sem voltar pelo hook.');
assert.match(controller, /import\(['"]\.\/cardVisionBackupRuntimeR162['"]\)/, 'R170: operações completas de backup continuam lazy no runtime R162.');

console.log('R170 aprovada: sync health completo e contrato grande do Backup saíram do startup sem alterar runtime R162, writers ou comportamento do diagnóstico.');
