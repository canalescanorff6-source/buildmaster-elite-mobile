import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function expect(condition, message) { if (!condition) throw new Error(message); }

const panel = read('src/components/AccountAdminPanel.tsx');
const auth = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const css = read('src/app/globals.css');
const pkg = JSON.parse(read('package.json'));
const preflight = read('scripts/production-preflight.mjs');
const ciDoctor = read('scripts/ci-doctor.mjs');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const serviceWorker = read('public/sw.js');
const playPreflight = read('scripts/validate-play-store-release.mjs');

expect(pkg.version === '31.77.0', 'Versão 31.77.0 não registrada no pacote.');
expect(preflight.includes("version === '31.77.0'"), 'Pré-voo de produção ainda valida uma versão antiga.');
expect(preflight.includes('BuildMaster Elite Tático v31.77'), 'Pré-voo não valida o manifesto PWA da v31.77.');
expect(preflight.includes('npm run test:v3177'), 'Pré-voo não valida a bateria atual da v31.77.');
expect(ciDoctor.includes("['Regressões v31.77', ['run', 'test:v3177']]"), 'Diagnóstico consolidado não executa a regressão v31.77.');
expect(manifest.name === 'BuildMaster Elite Tático v31.77' && manifest.short_name === 'BuildMaster v31.77', 'Manifesto PWA não está na v31.77.');
expect(serviceWorker.includes('buildmaster-v31-77'), 'Cache PWA não foi renovado para v31.77.');
expect(playPreflight.includes('release-notes/31.77.0.txt'), 'Pré-voo Play ainda usa notas de uma versão anterior.');
expect(panel.includes('noValidate'), 'Formulário ainda depende de validação nativa silenciosa.');
expect(panel.includes('account-create-feedback'), 'Retorno local abaixo do botão não foi implementado.');
expect(panel.includes('Deixe vazio para gerar automaticamente'), 'Senha automática não está indicada no formulário.');
expect(panel.includes('const accountPassword = password || generateTemporaryPassword()'), 'Senha segura automática não é usada no envio.');
expect(panel.includes('Criando e confirmando...'), 'Botão não informa a etapa real da criação.');
expect(panel.includes("if (!result?.success || !result.userId)"), 'Cliente aceita resposta sem confirmação do usuário criado.');
expect(css.includes('.account-create-feedback.is-error'), 'Erro local do formulário não possui estilo visível.');
expect(auth.indexOf('if (Capacitor.isNativePlatform())') < auth.indexOf("return await fetch(url"), 'Android ainda tenta fetch web antes da ponte nativa.');
expect(!auth.includes('A operação não foi reenviada automaticamente.') || auth.includes('CapacitorHttp.request'), 'Proteção contra reenvio duplicado ausente.');
expect(edge.includes("USERNAME_EXISTS', 'Esse nome de usuário já está cadastrado. Escolha outro nome.'"), 'Servidor não traduz duplicidade para mensagem clara.');
expect(edge.includes("return respond({ success: true, userId: created.user.id, username, requestId })"), 'Servidor não confirma criação com usuário e referência.');
expect(edge.includes("return { limit: 12, window: 300 }"), 'Limite de tentativas ainda é baixo demais para recuperação administrativa.');
expect(edge.includes(".select('id, username, status').single()"), 'Servidor não confirma persistência do perfil criado.');

console.log('v31.74 preservada na v31.77: criação de usuários corrigida com retorno local, confirmação do servidor e transporte Android sem duplicidade.');
