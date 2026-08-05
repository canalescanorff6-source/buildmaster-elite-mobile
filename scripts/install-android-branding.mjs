import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
const sourceRes = path.join(root, 'resources', 'android-branding', 'res');
const targetRes = path.join(androidRoot, 'app', 'src', 'main', 'res');
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');

function fail(message) {
  console.error(`Erro ao instalar identidade Android: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(androidRoot)) fail('o projeto Android ainda não foi criado. Execute cap add android primeiro.');
if (!fs.existsSync(sourceRes)) fail('os recursos premium não foram encontrados em resources/android-branding/res.');
if (!fs.existsSync(targetRes)) fail('a pasta de recursos do aplicativo Android não existe.');

fs.cpSync(sourceRes, targetRes, { recursive: true, force: true });

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
  'drawable-nodpi/buildmaster_native_splash.png',
  'drawable/buildmaster_native_splash.xml'
];
for (const relative of required) {
  const file = path.join(targetRes, relative);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail(`recurso obrigatório ausente: ${relative}`);
}

console.log('Identidade premium Android instalada: ícone legado, adaptativo, monocromático e splash nativa.');
