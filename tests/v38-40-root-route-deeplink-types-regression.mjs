import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('src/app/page.tsx', 'utf8');
const card = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const privacy = fs.readFileSync('src/app/privacidade/page.tsx', 'utf8');

assert.match(page, /import \{ AuthGate \} from '@\/components\/AuthGate'/, 'A raiz precisa continuar sendo a tela autenticada.');
assert.match(page, /<CardVisionApp\s*\/>/, 'A raiz precisa montar o aplicativo.');
assert.doesNotMatch(page, /PrivacyPolicyPage|Política de privacidade/, 'A política não pode sobrescrever src/app/page.tsx.');
assert.match(privacy, /PrivacyPolicyPage/, 'A política deve permanecer em /privacidade.');

assert.match(card, /const targetWorkspace = deepLink\.workspace \?\? 'visao-geral'/, 'Deep link precisa normalizar workspace opcional.');
assert.match(card, /if \(deepLink\.group === 'jogadores'\) setPlayerWorkspace\(targetWorkspace\)/, 'Estado de jogadores só pode receber PlayerWorkspace definido.');
assert.doesNotMatch(card, /setPlayerWorkspace\(deepLink\.workspace\)/, 'Workspace opcional não pode ser enviado diretamente ao setter.');

console.log('v38.40 rota raiz e deep link tipado aprovados.');
