import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

assert.equal(pkg.version, '30.40.0');
assert.equal(lock.version, '30.40.0');
assert.equal(lock.packages[''].version, '30.40.0');
assert.equal(pkg.scripts['test:all'], 'npm run test:v3000 && npm run test:v3010 && npm run test:v3020 && npm run test:v3030 && npm run test:v3040 && npm run quality:audit');
assert.match(read('src/lib/dataSafety.ts'), /CURRENT_DATA_SCHEMA = 3000/);
assert.match(read('src/lib/dataSafety.ts'), /APP_DATA_VERSION = '30\.40\.0'/);

const css = read('src/app/globals.css');
assert.doesNotMatch(css, /@import\s+['"]/i, 'O tema precisa estar consolidado em um único arquivo.');
assert.match(css, /bm-v3000-play-publication/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /Correção de legibilidade observada no vídeo/, 'O tema escuro precisa manter a correção de contraste validada em aparelho.');
const resultWorkspace = read('src/components/result/ResultWorkspace.tsx');
assert.match(resultWorkspace, /Ainda faltam adicionar/, 'A ficha deve separar habilidades pendentes.');
assert.match(resultWorkspace, /Já adicionadas/, 'A ficha deve manter visíveis as habilidades concluídas.');
assert.match(resultWorkspace, /Marcar como feita/, 'A marcação de habilidades adicionais precisa continuar disponível.');
assert.match(read('src/components/CardVisionApp.tsx'), /habilidade concluída/, 'A marcação de habilidade deve ser persistida no Cofre.');
assert.match(read('src/components/CardVisionApp.tsx'), /settings-update-quick-access/, 'A atualização precisa ter um acesso direto e visível nos Ajustes simples.');
assert.match(css, /Atualizações sempre visíveis no modo simples/, 'O menu móvel de Ajustes não pode esconder a área de atualização.');
assert.match(css, /settings-navigation-rail > button:nth-child\(11\)/, 'O botão de Atualizações precisa permanecer destacado no modo simples.');

assert.ok(read('src/app/layout.tsx').includes('bm-v3000-play-publication'));
assert.ok(read('src/components/CardVisionApp.tsx').includes('PlayStorePublicationCenter'));
assert.ok(read('src/components/CardVisionApp.tsx').includes('exportPlayStorePublicationState'));
assert.ok(fs.existsSync('src/app/privacidade/page.tsx'));
assert.ok(fs.existsSync('src/app/excluir-conta/page.tsx'));

const rootPage = read('src/app/page.tsx');
assert.match(rootPage, /AuthGate/, 'A rota inicial precisa abrir a autenticação do aplicativo.');
assert.match(rootPage, /CardVisionApp/, 'A rota inicial precisa montar o BuildMaster após o login.');
assert.doesNotMatch(rootPage, /Política de privacidade/, 'A política de privacidade não pode substituir a tela inicial do APK.');
assert.match(read('src/app/privacidade/page.tsx'), /Política de privacidade/);
assert.ok(fs.existsSync('supabase/functions/account-deletion-request/index.ts'));
assert.ok(fs.existsSync('supabase/functions/play-integrity-verify/index.ts'));
assert.equal(JSON.parse(read('public/manifest.webmanifest')).name, 'BuildMaster Elite Tático v30.40');

console.log('v30.40 integração de produção limpa aprovada.');
