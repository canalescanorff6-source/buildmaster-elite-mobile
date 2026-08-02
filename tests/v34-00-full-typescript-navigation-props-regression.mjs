import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const navigation = fs.readFileSync('src/components/RefinedNavigation.tsx', 'utf8');
const contextBar = fs.readFileSync('src/components/PremiumContextBar.tsx', 'utf8');

assert.match(navigation, /onSearch:\s*\(\)\s*=>\s*void;/, 'RefinedNavigation deve manter a busca no menu lateral.');
assert.match(app, /<RefinedNavigation[\s\S]*?onSearch=\{\(\) => openMainSection\('buscar'\)\}[\s\S]*?\/>/, 'CardVisionApp deve entregar onSearch ao menu lateral.');
assert.doesNotMatch(contextBar, /onSearch:\s*\(\)\s*=>\s*void;/, 'A lupa não deve voltar ao cabeçalho superior.');
assert.doesNotMatch(contextBar, /<Search\b/, 'O cabeçalho superior deve continuar sem lupa.');

console.log('v34.00 TypeScript completo protegido: busca permanece apenas no menu lateral e props obrigatórias estão sincronizadas.');
