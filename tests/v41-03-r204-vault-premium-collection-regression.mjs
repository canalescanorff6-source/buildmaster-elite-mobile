import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read=(file)=>fs.readFileSync(file,'utf8');
const workspace=read('src/components/vault/CardVisionVaultWorkspaceR191.tsx');
const vault=read('src/components/CleanVaultV3800.tsx');
const css=read('src/app/globals.css');
const r119=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

assert.match(workspace,/Cofre Clean · Coleção competitiva/);
for (const label of ['Jogadores','Organizar','Comparar','Proteção']) assert.ok(workspace.includes(`<span>${label}</span>`),`R204: aba ${label} ausente.`);
assert.ok(!workspace.includes('bm-v3800-vault-more'), 'R204: Comparar/Proteção não devem voltar a ficar escondidos em Mais.');
assert.match(vault,/r204-vault-catalog-intro/);
assert.match(vault,/Buscar jogador, posição, estilo ou habilidade/);
assert.match(vault,/r204-player-meta/);
for (const selector of ['.r204-vault-tabs','.r204-vault-catalog-intro','.r204-vault-catalog-kpis','.r204-player-meta']) assert.ok(css.includes(selector),`R204: CSS ausente ${selector}`);
for (const forbidden of ['localStorage.setItem','indexedDB','nativeVaultWrite','supabase.from(']) assert.ok(!workspace.includes(forbidden),`R204: writer proibido no workspace: ${forbidden}`);
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'),'736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5','R204: R119 foi alterado.');
assert.ok(fs.statSync('src/components/vault/CardVisionVaultWorkspaceR191.tsx').size<=26000,'R204: boundary R191 excedeu 26 KB.');
console.log('R204 aprovada: Cofre virou coleção competitiva premium, quatro áreas visíveis e autoridade canônica preservada.');
