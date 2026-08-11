import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const calibration = read('src/modules/card-reader/efhubManualCalibration.ts');
const adaptive = read('src/modules/card-reader/adaptiveZoneSearch.ts');
const precision = read('src/modules/card-reader/highPrecisionOcr.ts');
const macroReader = read('src/modules/card-reader/manualCalibrationFastReader.ts');
const worker = read('src/lib/ocrWorkerManager.ts');
const layout = read('src/app/layout.tsx');
const contrast = read('src/app/v38-reader-speed-contrast.css');

assert.match(app, /const calibratedFastPath = Boolean\(manualEfhubCalibration\)/, 'Fluxo calibrado precisa possuir fast path explícito.');
assert.match(app, /if \(!calibratedFastPath\) \{[\s\S]*?recognizeWithOcrWorker\(fullOptimized/, 'OCR do print inteiro deve existir apenas fora do caminho calibrado.');
assert.match(app, /readEightEfhubCalibrationMacros\(activeFile, manualEfhubCalibration/, 'Os 8 quadrados devem ser lidos diretamente, sem dezenas de subleituras.');
assert.match(app, /calibratedFastPath[\s\S]*?qualityReport[\s\S]*?: qualityReport \?\? await inspectPrintQuality/, 'Modo calibrado deve pular inspeção pesada de qualidade antes do OCR.');
assert.match(app, /calibratedFastPath \? 60 : 120/, 'Leitura calibrada deve carregar histórico reduzido.');
assert.match(app, /calibratedFastPath \? 80 : 160/, 'Leitura calibrada deve carregar correções reduzidas.');

assert.match(calibration, /detectSkillCapsules\?: boolean/, 'Gerador legado deve continuar podendo desativar cápsulas dinâmicas.');
assert.match(calibration, /options\.detectSkillCapsules === false[\s\S]*?\? \[\]/, 'Detector de cápsulas deve continuar desativável.');
assert.match(macroReader, /MANUAL_CALIBRATION_FAST_READER_VERSION = '40\.00-calibrated-fields-r1'/, 'O fluxo manual deve usar o leitor reconstruído v40.00.');
assert.match(macroReader, /buildPreciseOcrZonesFromEfhubCalibration/, 'Os 8 quadrados devem gerar subáreas determinísticas para campos reais.');
assert.match(macroReader, /TOTAL_READER_DEADLINE_MS = 180_000/, 'A leitura inteira deve possuir prazo máximo.');
assert.match(macroReader, /addLegacyPrecisionFallback/, 'Nome, atributos e habilidades podem receber fallback apenas quando necessário.');

assert.match(adaptive, /if \(mode === 'fast'\)/, 'Busca adaptativa antiga continua disponível fora dos 8 quadros.');
assert.match(precision, /GK\|GOL\|CB\|ZAG\|LB\|LE\|RB\|LD/, 'Parser de nome deve remover siglas de posição.');
assert.match(precision, /embeddedKnownName/, 'Nome deve conseguir recuperar jogador conhecido com ruído.');

assert.match(worker, /createWorker\(\['por'\]/, 'Worker Android deve usar português local para evitar bloqueio no traineddata; nomes próprios são reconciliados pelo leitor.');
assert.match(worker, /OCR_WORKER_BOOT_TIMEOUT_MS = 30_000/, 'Inicialização do worker não pode esperar indefinidamente.');
assert.match(worker, /workerBootDeadline/, 'Inicialização deve possuir deadline real.');
assert.match(worker, /timeoutMs\?: number/, 'Cada reconhecimento pode definir prazo específico.');

const performanceImport = "import './v39-unified-performance.css';";
const fixImport = "import './v38-reader-speed-contrast.css';";
assert.ok(layout.indexOf(fixImport) > layout.indexOf(performanceImport), 'Correção de contraste precisa ser importada por último.');
assert.match(contrast, /\.premium-app\.theme-dark[\s\S]*background:[^;]+!important/, 'Tema escuro precisa sobrescrever fundos claros legados.');
assert.match(contrast, /-webkit-text-fill-color:\s*#f7f9fd\s*!important/, 'Texto em controles escuros precisa ter preenchimento visível.');
assert.match(contrast, /reader-live-progress-card/, 'Painel de leitura precisa continuar legível durante OCR.');

console.log('✓ v38.40 r5: 8 quadros = 8 leituras, worker com deadline, nome revisável e contraste seguro.');
