import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tactical = require('../src/modules/tactical-studio/metaFormationStudioV3832.ts');
const read = (file) => fs.readFileSync(file, 'utf8');

assert.equal(tactical.META_FORMATION_STUDIO_VERSION, '38.38.0');
assert.deepEqual([...tactical.META_COACH_STYLES], ['Posse de bola', 'Contra-ataque normal', 'Contra-ataque rápido']);
assert.equal(tactical.META_OBJECTIVES.length, 16);
assert.equal(tactical.META_FORMATION_CATALOG.length, 30);
assert.equal(new Set(tactical.META_FORMATION_CATALOG.map((item) => item.id)).size, 30);
for (const style of tactical.META_COACH_STYLES) {
  assert.equal(tactical.META_FORMATION_CATALOG.filter((item) => item.style === style).length, 10, `${style} deve ter 10 formações`);
}
for (const formation of tactical.META_FORMATION_CATALOG) {
  assert.equal(formation.slots.length, 11, `${formation.id} precisa de 11 jogadores`);
  assert.equal(new Set(formation.slots.map((item) => item.id)).size, 11, `${formation.id} não pode repetir slot`);
  assert.ok(formation.whyItWorks.length > 20);
  assert.ok(formation.attackPlan.length && formation.defensePlan.length && formation.successKeys.length);
}
const exactStyles = [
  'Artilheiro','Puxa marcação','Homem de área','Pivô','Atacante pivô','Armador criativo',
  'Primeiro volante','O destruidor','Orquestrador','Clássico nº 10','Jogador de infiltração','Meia versátil',
  'Defensor criativo','Atacante surpresa','Lateral ofensivo','Lateral defensivo','Lateral atacante','Ala produtivo','Lateral móvel','Perito em cruzamento',
  'Goleiro ofensivo','Goleiro defensivo'
];
assert.deepEqual([...tactical.OFFICIAL_PLAYER_STYLES], exactStyles);
for (const banned of ['Box-to-box','Segundo atacante','Ponta produtivo','Infiltração']) assert.ok(!tactical.OFFICIAL_PLAYER_STYLES.includes(banned));

const recommended = tactical.recommendMetaFormations('Contra-ataque rápido', 'jogar sem pontas');
assert.ok(recommended.length >= 3);
assert.ok(recommended.every((entry) => entry.formation.style === 'Contra-ataque rápido'));
const formation = recommended[0].formation;
const project = tactical.createMetaFormationProject(formation, 'jogar sem pontas', 'inteligente');
assert.equal(Object.keys(project.assignments).length, 11);
const svg = tactical.renderMetaFormationSvg(project, 'complete');
assert.match(svg, /eFootball 2026/);
assert.match(svg, /Meta personalizada/);
assert.match(svg, /Marques Fichas/);
assert.equal((svg.match(/<circle r="31"/g) || []).length, 11);
assert.equal(tactical.metaFormationOutputSize('story').height, 1920);
assert.equal(tactical.metaFormationOutputSize('square').width, 1080);
const fit = tactical.scorePlayerForMetaSlot({ id:'p1', name:'Jogador', targetPositionCode:'CF', playstyle:'Artilheiro', functionLabel:'Artilheiro', efficiency:90 }, formation.slots.find((item) => item.position === 'CA') || formation.slots[0], 'Artilheiro');
assert.ok(fit.score >= 68);
assert.ok(['jogador ideal','compatível','adaptável','jogador de risco'].includes(fit.label));

const adminPanel = read('src/components/AccountAdminPanel.tsx');
const accountAuth = read('src/lib/accountAuth.ts');
const adminEdge = read('supabase/functions/admin-users/index.ts');
for (const marker of ['Criando usuário @', 'clientRequestId', 'authConfirmed', 'profileConfirmed', 'expiryConfirmed', 'Gerar senha segura', 'account-create-feedback']) assert.ok(adminPanel.includes(marker), `painel admin sem ${marker}`);
assert.ok(accountAuth.includes('clientRequestId: string'));
assert.ok(accountAuth.includes('CapacitorHttp.request'));
assert.ok(!/CapacitorHttp\.request[\s\S]{0,400}fetch\(/.test(accountAuth), 'criação Android não deve duplicar a rota');
for (const marker of ['duplicateBlocked', 'authConfirmed', 'profileConfirmed', 'expiryConfirmed', "service.auth.admin.getUserById"]) assert.ok(adminEdge.includes(marker), `Edge Function sem ${marker}`);

const recorderBridge = read('src/modules/matches/matchRecorderBridge.ts');
const recorderInstaller = read('scripts/install-match-recorder-plugin.mjs');
for (const marker of ['renameMatchRecording', 'getMatchRecorderStorageInfo', 'gallerySaved', 'analysisReady']) assert.ok(recorderBridge.includes(marker));
for (const marker of ['BuildMaster_Partida_', 'DIRECTORY_MOVIES + "/BuildMaster/Partidas"', 'MediaStore', 'Intent.EXTRA_STREAM', 'renameRecording', 'getStorageInfo']) assert.ok(recorderInstaller.includes(marker), `gravador nativo sem ${marker}`);
assert.ok(!recorderInstaller.includes('file://'));

const videoEngine = read('src/modules/matches/matchTrainerEngine.ts');
const videoUi = read('src/modules/matches/MatchTrainerCenter.tsx');
for (const marker of ['38.38.0', 'commandEvidence', 'candidate', 'confirmed', 'repeated', 'annotations', 'offensive-transition', 'defensive-transition', 'replaceMatchTrainerSessions']) assert.ok(videoEngine.includes(marker), `motor de vídeo sem ${marker}`);
for (const tab of ['Resumo','Momentos','Ataque','Defesa','Comandos','Tática','Treino','Evolução']) assert.ok(videoUi.includes(tab), `aba ${tab} ausente`);
for (const marker of ['Inferência tática — comando não confirmado diretamente.', 'Minhas gravações', 'Salvar automaticamente em Filmes/BuildMaster/Partidas', 'Quadro-chave', 'Renomear', 'Compartilhar vídeo']) assert.ok(videoUi.includes(marker), `UI de vídeo sem ${marker}`);

const app = read('src/components/CardVisionApp.tsx');
for (const marker of ['MetaFormationStudioV3832', 'readMetaFormationProjects', 'replaceMetaFormationProjects', 'readMatchTrainerSessions', 'replaceMatchTrainerSessions']) assert.ok(app.includes(marker), `integração principal sem ${marker}`);
assert.ok(app.includes('schema: 3832'));

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
assert.equal(pkg.version, '38.38.0');
assert.equal(lock.version, '38.38.0');
assert.equal(lock.packages[''].version, '38.38.0');
assert.equal(JSON.parse(read('public/manifest.webmanifest')).name, 'BuildMaster Elite Tático v38.38');
assert.ok(read('public/sw.js').includes('buildmaster-v38-38-legacy-profile-regressions-1'));
assert.ok(read('src/components/RegisterServiceWorker.tsx').includes('38.38.0-legacy-profile-regressions-1'));
assert.ok(read('.github/workflows/build-apk.yml').includes('package_version'));
assert.ok(read('.github/workflows/build-play-store.yml').includes('BUILDMASTER_VERSION'));
assert.ok(read('.github/workflows/build-play-store.yml').includes('versionName "{os.environ["BUILDMASTER_VERSION"]}"'));
assert.equal(read('capacitor.config.ts').includes("appId: 'com.buildmaster.elitetatico'"), true);

console.log('v38.32 integração completa aprovada: contas confirmadas, gravações, Vídeo 2.0, Estúdio Meta, exportação, backup e versão sincronizados.');
