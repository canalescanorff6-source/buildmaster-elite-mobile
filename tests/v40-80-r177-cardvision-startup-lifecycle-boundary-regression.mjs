import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const hook = fs.readFileSync('src/hooks/useCardVisionStartupLifecycleR177.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/runtime/cardVisionStartupRuntimeR177.ts', 'utf8');

assert.match(app, /useCardVisionStartupLifecycleR177\(\{/, 'CardVision deve delegar hidratação/persistência inicial ao lifecycle R177.');
assert.doesNotMatch(app, /loadEasyUiPreferences\(/, 'Shell não deve voltar a hidratar preferências diretamente.');
assert.doesNotMatch(app, /readActiveSessionSnapshotR157\(/, 'Shell não deve voltar a restaurar a sessão diretamente.');
assert.doesNotMatch(app, /loadHistoryStoreForStartup\(/, 'Shell não deve voltar a carregar o Cofre diretamente no bootstrap.');
assert.doesNotMatch(app, /migrateLegacyRuntimeData\(/, 'Migração legada deve ficar fora do shell.');
assert.doesNotMatch(app, /buildmaster_ui_prefs_v24_24/, 'Chave de persistência visual não deve ficar espalhada no shell.');
assert.ok(app.split('\n').length <= 2600, 'R177 deve manter o CardVision abaixo de 2600 linhas de fonte.');

assert.match(hook, /startupRuntimePromiseR177/, 'Runtime de bootstrap deve ser memoizado.');
assert.match(hook, /import\('@\/modules\/runtime\/cardVisionStartupRuntimeR177'\)/, 'Runtime de bootstrap deve ser carregado por import dinâmico.');
assert.match(hook, /if \(input\.startupSafeMode\) \{[\s\S]*?input\.setHistory\(\[\]\)[\s\S]*?input\.setSessionHydrated\(true\)/,
  'Modo seguro deve continuar fail-open sem tocar em dados permanentes.');
assert.match(hook, /if \(!input\.sessionHydrated \|\| input\.startupSafeMode\) return;[\s\S]*?persistCardVisionOcrZonesR177/,
  'Calibração não pode ser persistida antes da hidratação.');
assert.match(hook, /persistCardVisionUiPreferencesR177/, 'Preferências devem continuar com persistência após a hidratação.');
assert.match(hook, /persistCardVisionVaultFoldersR177/, 'Pastas do Cofre devem continuar com persistência após a hidratação.');

assert.match(runtime, /loadHistoryStoreForStartup\(\)/, 'Runtime deve preservar o carregamento limitado do Cofre.');
assert.match(runtime, /nativeDeferredBytes === 0/, 'Cofre nativo adiado não pode ser sobrescrito por fallback vazio.');
assert.match(runtime, /readActiveSessionSnapshotR157\(ACTIVE_SESSION_KEY\)/, 'Runtime deve restaurar formato dividido R157 e legado R137.');
assert.match(runtime, /loadEasyUiPreferences\(\)/, 'Migração/preferências visuais devem continuar usando a autoridade existente.');
assert.match(runtime, /readEfhubCalibrationMap\(readAccountStorage\(EFHUB_MANUAL_CALIBRATION_KEY\)\)/,
  'Calibração EFHub deve continuar restaurada pela autoridade leve R164.');
assert.match(runtime, /target\.clearDerivedResult\(\)[\s\S]*?target\.markSessionRestored\(\)/,
  'Sessão restaurada não pode reidratar resultado derivado antigo e deve marcar restauração antes do autosave.');
assert.match(runtime, /target\.setSessionHydrated\(true\);\n\}/,
  'Hidratação só pode ser liberada após preferências, calibração e sessão serem avaliadas.');

console.log('R177 aprovada: bootstrap/sessão/preferências saíram do shell sem criar nova autoridade de dados.');
