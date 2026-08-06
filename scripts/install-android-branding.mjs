import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
const sourceRes = path.join(root, 'resources', 'android-branding', 'res');
const targetRes = path.join(androidRoot, 'app', 'src', 'main', 'res');
const legacySplashFileName = 'buildmaster_native_splash.png';
const sourceLegacySelfReferencingSplash = path.join(sourceRes, 'drawable-nodpi', legacySplashFileName);
const targetLegacySelfReferencingSplash = path.join(targetRes, 'drawable-nodpi', legacySplashFileName);
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');

function fail(message) {
  console.error(`Erro ao instalar identidade Android: ${message}`);
  process.exit(1);
}

function validatePng(file, label = path.relative(root, file)) {
  const data = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (data.length < 33 || !data.subarray(0, 8).equals(signature)) {
    fail(`PNG inválido ou incompleto: ${label}`);
  }

  let offset = 8;
  let sawIhdr = false;
  let sawIend = false;
  const idat = [];
  while (offset < data.length) {
    if (offset + 12 > data.length) fail(`PNG truncado antes do fim de um bloco: ${label}`);
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > data.length) fail(`PNG truncado no bloco ${type || 'desconhecido'}: ${label}`);
    if (type === 'IHDR') sawIhdr = true;
    if (type === 'IDAT') idat.push(data.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') {
      sawIend = true;
      if (length !== 0) fail(`Bloco IEND inválido: ${label}`);
      if (end !== data.length) fail(`Dados extras após IEND: ${label}`);
      break;
    }
    offset = end;
  }

  if (!sawIhdr || !sawIend || idat.length === 0) fail(`Estrutura PNG incompleta: ${label}`);
  try {
    zlib.inflateSync(Buffer.concat(idat));
  } catch (error) {
    fail(`PNG corrompido ou com checksum incompleto: ${label} (${error instanceof Error ? error.message : String(error)})`);
  }
}

function walk(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

if (!fs.existsSync(androidRoot)) fail('o projeto Android ainda não foi criado. Execute cap add android primeiro.');
if (!fs.existsSync(sourceRes)) fail('os recursos premium não foram encontrados em resources/android-branding/res.');
if (!fs.existsSync(targetRes)) fail('a pasta de recursos do aplicativo Android não existe.');

for (const sourcePng of walk(sourceRes).filter((item) =>
  item.endsWith('.png') && path.resolve(item) !== path.resolve(sourceLegacySelfReferencingSplash)
)) {
  validatePng(sourcePng);
}

// Remove o PNG legado que tinha o mesmo nome do XML drawable. No Android,
// drawable/ e drawable-nodpi/ compartilham o mesmo namespace de recursos;
// manter buildmaster_native_splash.xml e buildmaster_native_splash.png fazia
// o XML resolver @drawable/buildmaster_native_splash para ele próprio.
// A exclusão no destino resolve projetos Android já gerados. O filtro na cópia
// também protege repositórios atualizados por sobreposição, nos quais o arquivo
// antigo pode continuar presente em resources/android-branding/res.
fs.rmSync(targetLegacySelfReferencingSplash, { force: true });

fs.cpSync(sourceRes, targetRes, {
  recursive: true,
  force: true,
  filter(source) {
    return path.resolve(source) !== path.resolve(sourceLegacySelfReferencingSplash);
  },
});

// Garante que nenhum resíduo antigo sobreviva mesmo se já existia no projeto.
fs.rmSync(targetLegacySelfReferencingSplash, { force: true });

// O template Android/Capacitor já cria @color/ic_launcher_background em
// values/launch_background.xml. Versões anteriores da identidade também
// declaravam esse nome e o mergeResources do Gradle falhava por duplicidade.
// Mantemos somente a cor própria do BuildMaster e removemos qualquer resíduo
// legado do arquivo copiado antes da compilação.
const brandingValuesPath = path.join(targetRes, 'values', 'buildmaster_branding.xml');
if (fs.existsSync(brandingValuesPath)) {
  const originalBrandingValues = fs.readFileSync(brandingValuesPath, 'utf8');
  const sanitizedBrandingValues = originalBrandingValues.replace(
    /\s*<color\s+name=["']ic_launcher_background["'][^>]*>[^<]*<\/color>\s*/g,
    '\n'
  );
  if (sanitizedBrandingValues !== originalBrandingValues) {
    fs.writeFileSync(brandingValuesPath, sanitizedBrandingValues, 'utf8');
  }
}


// O template do Capacitor pode variar entre versões. Qualquer tema que ainda aponte
// para a splash padrão passa a usar a arte oficial do BuildMaster.
for (const file of walk(targetRes).filter((item) => item.endsWith('.xml'))) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replaceAll('@drawable/splash', '@drawable/buildmaster_native_splash');
  if (updated !== original) fs.writeFileSync(file, updated, 'utf8');
}

if (!fs.existsSync(manifestPath)) fail('AndroidManifest.xml não encontrado.');
let manifest = fs.readFileSync(manifestPath, 'utf8');
const applicationMatch = manifest.match(/<application\b[^>]*>/);
if (!applicationMatch) fail('tag <application> não encontrada no AndroidManifest.xml.');
let applicationTag = applicationMatch[0];
if (/android:icon="[^"]*"/.test(applicationTag)) {
  applicationTag = applicationTag.replace(/android:icon="[^"]*"/, 'android:icon="@mipmap/ic_launcher"');
} else {
  applicationTag = applicationTag.replace('<application', '<application android:icon="@mipmap/ic_launcher"');
}
if (/android:roundIcon="[^"]*"/.test(applicationTag)) {
  applicationTag = applicationTag.replace(/android:roundIcon="[^"]*"/, 'android:roundIcon="@mipmap/ic_launcher_round"');
} else {
  applicationTag = applicationTag.replace('<application', '<application android:roundIcon="@mipmap/ic_launcher_round"');
}
manifest = manifest.replace(applicationMatch[0], applicationTag);
fs.writeFileSync(manifestPath, manifest, 'utf8');

const required = [
  'mipmap-mdpi/ic_launcher.png',
  'mipmap-hdpi/ic_launcher.png',
  'mipmap-xhdpi/ic_launcher.png',
  'mipmap-xxhdpi/ic_launcher.png',
  'mipmap-xxxhdpi/ic_launcher.png',
  'mipmap-anydpi-v26/ic_launcher.xml',
  'mipmap-anydpi-v33/ic_launcher.xml',
  'drawable-nodpi/buildmaster_icon_background_image.png',
  'drawable/buildmaster_icon_background.xml',
  'drawable-nodpi/buildmaster_icon_monochrome_image.png',
  'drawable/buildmaster_icon_monochrome.xml',
  'drawable-nodpi/buildmaster_native_splash_image.png',
  'drawable/buildmaster_native_splash.xml'
];
for (const relative of required) {
  const file = path.join(targetRes, relative);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail(`recurso obrigatório ausente: ${relative}`);
  if (file.endsWith('.png')) validatePng(file, `android/app/src/main/res/${relative}`);
}

console.log('Identidade premium Android instalada: ícone legado, adaptativo, monocromático e splash nativa.');
