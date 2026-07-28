import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const rootPage = read('src/app/page.tsx');
const privacyPage = read('src/app/privacidade/page.tsx');
const deletionPage = read('src/app/excluir-conta/page.tsx');

assert.match(rootPage, /AuthGate/, 'A rota raiz precisa abrir a autenticação.');
assert.match(rootPage, /CardVisionApp/, 'A rota raiz precisa montar o BuildMaster.');
assert.doesNotMatch(rootPage, /PrivacyPolicyPage|Política de privacidade|public-policy-page/, 'A política não pode substituir o início.');
assert.match(privacyPage, /PrivacyPolicyPage|Política de privacidade/);
assert.match(deletionPage, /AccountDeletionPage|Solicitar exclusão da conta/);
assert.notEqual(rootPage.trim(), privacyPage.trim(), 'A rota raiz e a política não podem ser arquivos duplicados.');

console.log('v31.71 separação das rotas raiz, privacidade e exclusão aprovada.');
