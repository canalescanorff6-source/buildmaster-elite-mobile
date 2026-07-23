import assert from 'node:assert/strict';
import fs from 'node:fs';

const card = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const panel = fs.readFileSync('src/components/CreatorBuildResearchPanel.tsx', 'utf8');

assert.doesNotMatch(card, /openMainSection\('resultado'\);\s*setTab\('fontes'\)/, 'setTab não pode ser chamado fora de ResultCard');
assert.match(card, /setResultTabRequest\(\{ tab: 'fontes', token: Date\.now\(\) \}\)/, 'comando deve solicitar a aba fontes pelo estado do app');
assert.match(card, /requestedTab=\{resultTabRequest\}/, 'ResultCard deve receber a solicitação de aba');
assert.match(card, /onRequestedTabHandled=\{\(\) => setResultTabRequest\(null\)\}/, 'solicitação deve ser limpa após abrir a aba');
assert.doesNotMatch(panel, /\bYoutube\b/, 'não deve importar um ícone inexistente da versão instalada do lucide-react');
assert.match(panel, /Pesquisar no YouTube/, 'atalho de pesquisa no YouTube deve continuar visível');

console.log('Hotfix TypeScript do módulo Fichas de Criadores: OK');
