import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const app = read('src/components/CardVisionApp.tsx');
const teamMap = read('src/modules/squad/TeamFullMapPanel.tsx');
const auth = read('src/components/AuthGate.tsx');
const studio = read('src/components/TacticalPosterStudioPanel.tsx');
const poster = read('src/lib/tacticalPoster.ts');
const posterLibrary = read('src/lib/tacticalPosterLibrary.ts');
const images = read('src/modules/images/imageSafety.ts');
const imageLibrary = read('src/modules/images/accountImageLibrary.ts');
const exportUtils = read('src/modules/tactical-studio/exportUtils.ts');
const ocr = read('src/lib/ocrWorkerManager.ts');
const backup = read('src/lib/dataSafety.ts');
const workflow = read('.github/workflows/build-apk.yml');
const oldStudioTest = read('tests/v27-32-tactical-studio-complete-regression.mjs');

assert.equal(pkg.version, '29.10.0');

// 1. Cofre antigo removido.
assert.equal(fs.existsSync('src/app/api/cloud/fichas/route.ts'), false);
assert.doesNotMatch(app, /buildmaster-ai-git-main-buildmaster-ai\.vercel\.app\/api\/cloud\/fichas/);
assert.equal(Object.hasOwn(pkg.dependencies, '@neondatabase/serverless'), false);
assert.match(app, /requireSecureAccountCloud/);

// 2. Login local removido.
assert.doesNotMatch(auth, /LOCAL_LOGIN_PASSWORD|ALLOW_LOCAL_FALLBACK|saveLocalSession|readValidLocalSession/);
assert.doesNotMatch(workflow, /NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK|NEXT_PUBLIC_BUILDMASTER_CLOUD_API_URL/);

// 3. Impressão protegida contra título adulterado.
assert.match(studio, /escapeHtml\(title\)/);
assert.match(studio, /Content-Security-Policy/);
assert.match(studio, /setAttribute\('sandbox'/);

// 4. Validação de imagem.
assert.match(images, /maxFileBytes: 20 \* 1024 \* 1024/);
assert.match(images, /maxPixelCount: 40_000_000/);
assert.match(images, /sniffRasterKind/);
assert.match(images, /sanitizeSvgText/);
assert.match(app, /validateImageFile\(file\)/);

// 5. OCR totalmente direcionado para assets locais.
assert.match(ocr, /workerPath: '\/tesseract\/worker\.min\.js'/);
assert.match(ocr, /langPath: '\/tesseract\/lang'/);
assert.match(pkg.scripts['vendor:ocr'], /vendor-tesseract-assets/);
assert.match(workflow, /npm run vendor:ocr/);

// 6. Liberação de memória.
assert.match(exportUtils, /URL\.revokeObjectURL/);
assert.match(exportUtils, /canvas\.width = 1/);
assert.match(app, /previewObjectUrlRef/);
assert.doesNotMatch(app, /Tesseract\.recognize/);
assert.doesNotMatch(auth, /setActiveAccountIdentity/);
assert.match(teamMap, /const opponentPrintObjectUrlRef = useRef/);
assert.match(teamMap, /URL\.revokeObjectURL\(opponentPrintObjectUrlRef\.current\)/);
assert.doesNotMatch(app, /opponentPrintObjectUrlRef/);

// 7 e 8. Formatos ampliados e galeria por conta.
assert.match(studio, /image\/jpeg,image\/png,image\/webp,image\/gif,image\/bmp/);
assert.match(images, /HEIC ou HEIF/);
assert.match(imageLibrary, /accountDatabaseName\(DB_BASE_NAME\)/);
assert.match(imageLibrary, /maxLibraryItems/);
assert.match(imageLibrary, /app não remove arquivos antigos sozinho/);

// 9. Arrastar jogadores.
assert.match(studio, /setPointerCapture/);
assert.match(studio, /movePlayerFromPointer/);
assert.match(poster, /override\?\.x/);
assert.match(poster, /override\?\.y/);

// 10. Setas usam estilo, função e atributos.
assert.match(poster, /createDefaultTacticalPosterArrows\(lineup: FormationSlotFit\[], style/);
assert.match(poster, /playstyle/);
assert.match(poster, /attributes\.speed/);
assert.match(poster, /CONTRA_ATAQUE_RAPIDO/);

// 11. Backup completo.
assert.match(backup, /tacticalStudio/);
assert.match(backup, /customFormations/);
assert.match(backup, /imageGallery/);
assert.match(app, /exportTacticalImageLibrary/);
assert.match(app, /importTacticalImageLibrary/);
assert.match(app, /replaceTacticalPosterLibrary/);

// 12. Manifesto placeholder removido.
assert.equal(fs.existsSync('public/update-manifest.json'), false);

// 13. Android limpo e versão injetada pelo workflow oficial.
assert.match(workflow, /rm -rf out android/);
assert.match(workflow, /ANDROID_VERSION_CODE/);
assert.match(workflow, /versionName "\{version\}"/);

// 14. Teste do Estúdio atualizado.
assert.match(oldStudioTest, /Estúdio Tático Completo/);
assert.match(oldStudioTest, /MAX_PROJECTS = 60/);
assert.match(oldStudioTest, /schema: 2736/);

// 15. Primeira divisão dos arquivos gigantes em módulos reutilizáveis.
assert.equal(fs.existsSync('src/modules/images/imageSafety.ts'), true);
assert.equal(fs.existsSync('src/modules/images/accountImageLibrary.ts'), true);
assert.equal(fs.existsSync('src/modules/tactical-studio/exportUtils.ts'), true);
assert.match(studio, /@\/modules\/tactical-studio\/exportUtils/);
const legacyCssEntry = read('src/app/legacy-compat.css');
assert.match(legacyCssEntry, /legacy-compat\/part-01\.css/);
assert.match(legacyCssEntry, /legacy-compat\/part-07\.css/);
for (let part = 1; part <= 7; part += 1) {
  const file = `src/app/legacy-compat/part-${String(part).padStart(2, '0')}.css`;
  assert.equal(fs.existsSync(file), true);
  assert.ok(read(file).split('\n').length < 2005, `${file} voltou a ficar grande demais`);
}

assert.match(posterLibrary, /buildmaster_tactical_poster_library_v2736/);
console.log('✓ v27.36: as 15 correções foram aplicadas e protegidas por regressão estática.');
