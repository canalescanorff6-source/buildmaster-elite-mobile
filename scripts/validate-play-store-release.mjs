import fs from 'node:fs';
import path from 'node:path';

const failures = [];
const passes = [];
const check = (value, label) => value ? passes.push(label) : failures.push(label);
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
const size = (file) => fs.existsSync(file) ? fs.statSync(file).size : 0;
function pngDimensions(file) {
  const data = fs.readFileSync(file);
  if (data.length < 24 || data.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}
const title = read('play-store/listing/pt-BR/title.txt');
const short = read('play-store/listing/pt-BR/short-description.txt');
const full = read('play-store/listing/pt-BR/full-description.txt');
const notes = read('play-store/listing/pt-BR/release-notes/31.82.0.txt');
check(title.length > 0 && title.length <= 30, 'Título possui 1–30 caracteres');
check(short.length > 0 && short.length <= 80, 'Descrição curta possui 1–80 caracteres');
check(full.length > 0 && full.length <= 4000, 'Descrição completa possui 1–4000 caracteres');
check(notes.length > 0 && notes.length <= 500, 'Notas da versão possuem 1–500 caracteres');
check(!/\b(?:TODO|EXEMPLO|PLACEHOLDER)\b/i.test([title, short, full, notes].join(' ')), 'Ficha da loja não contém placeholders');
const feature = 'play-store/assets/feature-graphic-1024x500.png';
const icon = 'play-store/assets/icon-512.png';
const featureDim = fs.existsSync(feature) ? pngDimensions(feature) : null;
const iconDim = fs.existsSync(icon) ? pngDimensions(icon) : null;
check(size(feature) > 1000 && featureDim?.width === 1024 && featureDim?.height === 500, 'Imagem de destaque é PNG 1024×500');
check(size(icon) > 1000 && iconDim?.width === 512 && iconDim?.height === 512, 'Ícone da loja é PNG 512×512');
for (const file of ['privacy-policy.md','data-safety.md','account-deletion.md','app-access.md','content-rating.md','ads-declaration.md','play-app-signing.md','play-integrity.md','release-checklist.md','android-vitals.md']) {
  check(read(`play-store/policies/${file}`).length > 100, `Documento ${file} presente`);
}
const workflow = read('.github/workflows/build-play-store.yml');
const playUsesConsolidatedDoctor = workflow.includes('npm run ci:verify');
for (const marker of ['bundleRelease', 'targetSdkVersion = 36', 'GOOGLE_PLAY_UPLOAD_KEY_BUNDLE', 'install-play-store-bridge.mjs', 'publish-play-store.mjs', 'release:play-preflight', 'bundletool.jar validate', 'jarsigner -verify -strict']) check(workflow.includes(marker) || (marker === 'release:play-preflight' && playUsesConsolidatedDoctor), `Workflow Play contém ${marker} diretamente ou pelo diagnóstico consolidado`);
check(read('src/app/privacidade/page.tsx').length > 100, 'Rota pública de privacidade presente');
check(read('src/app/excluir-conta/page.tsx').length > 100, 'Rota pública de exclusão presente');
if (failures.length) { console.error(`Pré-voo Play falhou (${failures.length}):\n- ${failures.join('\n- ')}`); process.exit(1); }
console.log(`Pré-voo Play aprovado: ${passes.length} verificações.`);
