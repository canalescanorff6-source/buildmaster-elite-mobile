import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file);
const pkg = JSON.parse(read('package.json'));
const layout = read('src/app/layout.tsx');
const css = read('src/app/v35-identity-themes.css');
const app = read('src/components/CardVisionApp.tsx');
const navigation = read('src/components/RefinedNavigation.tsx');
const avatarEditor = read('src/components/ProfileAvatarEditor.tsx');
const appearancePanel = read('src/components/IdentityAppearancePanel.tsx');
const avatarStorage = read('src/lib/profileAvatar.ts');
const easyUi = read('src/lib/easyExperience.ts');
const brand = read('src/components/PremiumBrand.tsx');
const mark = read('src/components/BuildMasterMark.tsx');
const cache = read('src/components/RegisterServiceWorker.tsx');
const serviceWorker = read('public/sw.js');

assert.ok(Number(pkg.version.split('.')[0]) >= 34, `Versão esperada 34 ou superior, recebida ${pkg.version}`);
assert.match(layout, /import '\.\/v35-identity-themes\.css';/);
assert.match(layout, /bm-v3500-identity/);
assert.doesNotMatch(css, /@import\s+/i);

for (const preset of [
  'visual-midnight-navy',
  'visual-obsidian-gold',
  'visual-elite-blue',
  'visual-future-purple',
  'visual-emerald-tactical',
  'visual-graphite-silver',
  'visual-pearl-executive'
]) assert.ok(css.includes(preset), `Tema ausente: ${preset}`);

assert.match(css, /--v2738-rainbow:\s*linear-gradient\(90deg, var\(--v35-accent\), var\(--v35-accent-2\)\)/);
assert.doesNotMatch(css, /conic-gradient/i);
assert.match(css, /\.bm-v3500-identity \.bm-v33-drawer-trigger[\s\S]*left:8px !important/);
assert.match(css, /\.bm-v3500-identity \.bm-simple-topbar[\s\S]*background:\s*color-mix\(in srgb,var\(--v35-bg\) 96%,transparent\) !important/);
assert.match(css, /\.bm-v3500-identity \.premium-app :where\(button,a,input,select,textarea,summary\) \{ touch-action:manipulation; \}/);

assert.match(navigation, /!drawerOpen &&/);
assert.match(navigation, /profileAvatar/);
assert.match(navigation, /<BuildMasterMark size=\{43\}/);
assert.match(navigation, /Buscar no aplicativo/);
for (const route of ['inicio', 'jogadores', 'time', 'partidas', 'ajustes']) {
  assert.match(navigation, new RegExp(`id: '${route}'`));
}
assert.doesNotMatch(navigation, /document\.body\.style\.overflow/);

assert.match(easyUi, /PREMIUM_VISUAL_PRESETS/);
for (const preset of [
  'midnight-navy', 'obsidian-gold', 'elite-blue', 'future-purple',
  'emerald-tactical', 'graphite-silver', 'pearl-executive'
]) assert.ok(easyUi.includes(`'${preset}'`), `Preset não cadastrado: ${preset}`);

assert.match(avatarStorage, /PROFILE_AVATAR_STORAGE_KEY/);
assert.match(avatarStorage, /readAccountStorage/);
assert.match(avatarStorage, /writeAccountStorage/);
assert.match(avatarStorage, /canvas\.toDataURL\('image\/jpeg', \.86\)/);
assert.match(avatarEditor, /type="file"/);
assert.match(avatarEditor, /Escolher foto/);
assert.match(avatarEditor, /Foto salva\. Ela continuará após sair e entrar novamente\./);
assert.match(app, /<IdentityAppearancePanel/);
assert.match(appearancePanel, /<ProfileAvatarEditor/);
assert.match(app, /saveProfileAvatar/);
assert.match(app, /removeProfileAvatar/);
assert.match(app, /profileAvatar,/);
assert.match(appearancePanel, /Sete temas sem efeito arco-íris/);

assert.match(brand, /<BuildMasterMark/);
assert.match(mark, /ficha de jogador com cinco espaços/);
assert.ok(exists('public/assets/logo.svg'));
for (const icon of [
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/icon-maskable-192.png',
  'public/icons/icon-maskable-512.png'
]) assert.ok(exists(icon), `Ícone ausente: ${icon}`);

assert.match(cache, /(?:34\.00\.0-identity-themes-avatar-6|35\.00\.0-official-skills-meta-2)/);
assert.match(serviceWorker, /(?:buildmaster-v34-00-identity-themes-avatar-4|buildmaster-v35-00-official-skills-meta-2|buildmaster-v35-10-max-gameplay-dual-position-1|buildmaster-v35-20-dna-gameplay-solid-theme-1)/);

console.log('v34.00 identidade visual aprovada: menu móvel corrigido, sete temas sem arco-íris, nova marca e foto de perfil persistente.');
