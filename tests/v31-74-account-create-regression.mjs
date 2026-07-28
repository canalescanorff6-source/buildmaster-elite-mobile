import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function expect(condition, message) { if (!condition) throw new Error(message); }

const panel = read('src/components/AccountAdminPanel.tsx');
const auth = read('src/lib/accountAuth.ts');
const edge = read('supabase/functions/admin-users/index.ts');
const css = read('src/app/globals.css');
const pkg = JSON.parse(read('package.json'));

expect(pkg.version === '31.74.0', 'Versão 31.74.0 não registrada no pacote.');
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

console.log('v31.74: criação de usuários corrigida com retorno local, confirmação do servidor e transporte Android sem duplicidade.');
