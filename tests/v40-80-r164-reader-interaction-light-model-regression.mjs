import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const loader = read('src/modules/card-reader/readerRuntimeR160.ts');
const runtime = read('src/modules/card-reader/readerInteractionRuntimeR164.ts');
const navigationControllerR176 = read('src/hooks/useCardVisionNavigationControllerR176.ts');
const ocrModel = read('src/lib/ocrZonesModelR164.ts');
const ocrRuntime = read('src/lib/ocr.ts');
const calibrationModel = read('src/modules/card-reader/efhubCalibrationModelR164.ts');
const backupCollector = read('src/modules/backup/backupSectionCollectorR141.ts');
const readerActionsR187 = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');

assert.ok(app.split(/\r?\n/).length <= 2850, 'R164 deve manter CardVisionApp abaixo de 2.850 linhas.');
assert.match(app, /from '@\/lib\/ocrZonesModelR164'/, 'Shell deve consumir apenas o modelo OCR leve no startup.');
assert.match(app, /from '@\/modules\/card-reader\/efhubCalibrationModelR164'/, 'Shell deve consumir apenas o modelo leve de calibração.');
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/lib\/ocr['"]/m, 'CardVisionApp não pode voltar a carregar processamento OCR estaticamente.');
assert.doesNotMatch(app, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/card-reader\/efhubManualCalibration['"]/m, 'CardVisionApp não pode voltar a carregar o calibrador pesado estaticamente.');

assert.match(loader, /let interactionRuntimePromiseR164:[^\n]+null/, 'Runtime de interações R164 deve ser memoizado.');
assert.match(loader, /import\('\.\/readerInteractionRuntimeR164'\)/, 'Runtime R164 deve carregar por import dinâmico.');
assert.match(navigationControllerR176, /if \(section === 'leitor'\) \{[\s\S]*preloadReaderInteractionRuntimeR164\(\)/, 'Entrada no Leitor deve antecipar R164 somente após intenção do usuário pela autoridade de navegação R176.');
assert.match(app, /createCardVisionReaderActionsR187/, 'Shell deve delegar ações do leitor à fronteira R187.');
assert.match(readerActionsR187, /createCardVisionReaderInteractionOperationsR164\(buildReaderInteractionContextR187\(\)\)/, 'R187 deve delegar ações à fronteira R164 com o estado canônico.');

for (const marker of [
  'imageSafety.validateImageFile(file)',
  'backgroundOcr.clearBackgroundOcrCheckpoint()',
  'cardArtCrop.adjustCardCropBox',
  'queueJobAsFile(job)',
  'enhanceImageLocally(selectedFile',
]) {
  assert.ok(!app.includes(marker), `R164 não pode devolver ao shell a operação pesada: ${marker}`);
  assert.ok(runtime.includes(marker), `Runtime R164 deve continuar responsável por: ${marker}`);
}

assert.match(ocrModel, /OCR_ZONES_MODEL_R164_VERSION/, 'Modelo OCR leve deve possuir versão explícita.');
assert.match(ocrRuntime, /export \{ DEFAULT_OCR_ZONES \} from '\.\/ocrZonesModelR164'/, 'ocr.ts deve preservar compatibilidade reexportando os defaults R164.');
assert.match(calibrationModel, /EFHUB_CALIBRATION_MODEL_R164_VERSION/, 'Modelo de calibração leve deve possuir versão explícita.');
assert.match(backupCollector, /from '@\/modules\/card-reader\/efhubCalibrationModelR164'/, 'Backup estático deve usar o modelo leve e não puxar detector/calibrador pesado.');
assert.doesNotMatch(backupCollector, /efhubManualCalibration/, 'Coletor de backup não pode reintroduzir o calibrador pesado na árvore inicial.');

console.log('R164 aprovada: interações do Leitor e modelos OCR/EFHub ficaram lazy/leves sem mover a autoridade canônica de estado.');
