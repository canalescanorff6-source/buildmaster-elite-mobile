import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const sequenceStorage = read('src/modules/tactical-studio/tacticalStudio2Storage.ts');
const sequencePanel = read('src/modules/tactical-studio/TacticalStudio2SequencePanel.tsx');
const studio = read('src/components/TacticalPosterStudioPanel.tsx');
const poster = read('src/lib/tacticalPoster.ts');
const posterLibrary = read('src/lib/tacticalPosterLibrary.ts');
const imageSafety = read('src/modules/images/imageSafety.ts');
const imageLibrary = read('src/modules/images/accountImageLibrary.ts');
const updateCenter = read('src/components/UpdateCenterPanel.tsx');
const chrome = read('src/components/CardVisionAppChromeR185.tsx');

assert.match(sequenceStorage, /MAX_TACTICAL_SEQUENCE_PROJECTS = 40/, 'Estúdio Tático 2.0 deve preservar até 40 sequências por conta.');
assert.match(sequencePanel, /1_500_000/, 'Importação JSON da sequência deve respeitar 1,5 MB.');
assert.match(sequencePanel, /Importar/, 'Sequências devem poder ser importadas, além de exportadas.');

for (const marker of ['passing', 'recycle', 'attack', 'defend', 'offensive', 'defensive', 'avoid', 'whyItWorks']) {
  assert.match(studio, new RegExp(`\\b${marker}\\b`), `Estúdio deve preservar a instrução ${marker}.`);
}
assert.match(studio, /schema:\s*2736/, 'Projeto tático deve manter schema editável atual compatível com a linhagem 2732+.');
assert.match(studio, /file\.size > 1_500_000/, 'Projeto tático importado deve permanecer limitado a 1,5 MB.');
assert.match(studio, /1024 \* exportScale/, 'PNG vertical deve derivar da base 1024×1536.');
assert.match(studio, /1536 \* exportScale/, 'PNG horizontal/alta deve preservar dimensões profissionais.');
assert.match(studio, /capture="environment"/, 'Estúdio deve permitir captura pela câmera quando suportado.');
assert.match(studio, /addEventListener\('paste'/, 'Estúdio deve aceitar colar imagem da área de transferência.');
assert.match(studio, /onDrop=\{handleStudioDrop\}/, 'Estúdio deve aceitar arrastar e soltar arquivos.');
assert.match(studio, /\.tif,\.tiff/, 'Entrada do Estúdio deve aceitar TIFF/TIF.');
for (const role of ["'background'", "'watermark'", "'logo'", "'free'", "'reference'"]) {
  assert.ok(studio.includes(role), `Papel de imagem ausente no Estúdio: ${role}`);
}
assert.match(studio, /Imagem de referência/, 'Referência visual deve permanecer somente no editor.');
assert.match(studio, /Camada livre adicionada/, 'Camada livre redimensionável deve estar disponível.');

assert.match(poster, /TacticalPosterImageLayerRole = 'watermark' \| 'logo' \| 'free'/, 'Renderizador deve suportar marca, logo e camada livre.');
assert.match(poster, /data-layer-role=/, 'Camadas importadas devem participar do SVG exportado.');
assert.match(posterLibrary, /const MAX_PROJECTS = 60/, 'Biblioteca principal deve suportar pelo menos os 40 projetos históricos.');
assert.match(posterLibrary, /referenceImageId/, 'Projeto salvo deve preservar referência visual.');
assert.match(posterLibrary, /imageLayers/, 'Projeto salvo deve preservar camadas visuais.');

assert.match(imageSafety, /'tiff'/, 'Validador deve reconhecer TIFF/TIF.');
assert.match(imageSafety, /previewAvailable:\s*false/, 'Formato sem codec deve ser preservado sem exigir prévia.');
assert.match(imageSafety, /original preservado/, 'Fallback de formato sem codec deve informar preservação do original.');
assert.match(imageLibrary, /createUnavailableImageThumbnail/, 'Galeria deve guardar formatos sem codec com miniatura segura.');
assert.match(imageLibrary, /maxLibraryItems/, 'Galeria deve manter limite explícito por conta.');

assert.match(updateCenter, /await onPrepareBackup\(\)/, 'Atualização deve preparar backup antes de instalar.');
assert.match(updateCenter, /expectedChecksum|checksum/, 'Atualizador deve validar checksum.');
assert.match(updateCenter, /expectedVersionCode|versionCode/, 'Atualizador deve validar versionCode.');
assert.match(chrome, /global-update-notice/, 'Atualização disponível deve continuar visível fora de Ajustes.');

console.log('R200.4 histórica aprovada: Estúdio Tático, importação ampliada, biblioteca, camadas visuais e proteção do atualizador convergiram com os requisitos recuperados dos chats anteriores.');
