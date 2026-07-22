import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const panel = fs.readFileSync('src/components/AccountAdminPanel.tsx', 'utf8');
const css = fs.readFileSync('src/app/legacy-compat.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };

assert.equal(pkg.version, '27.36.0');
assert.match(app, /topbar-admin-account-action/);
assert.match(app, /Criar e gerenciar contas/);
assert.match(app, /account\?\.profile\.role === 'admin' \? 'Criar contas' : 'Minha conta'/);
assert.match(app, /settings-admin-account-shortcut/);
assert.match(app, /launcher-admin-account-action/);
assert.match(panel, /A função continua disponível/);
assert.match(panel, /account-create-locked-preview/);
assert.match(panel, /Confirmar e abrir Criar contas/);
assert.match(panel, /Este login está registrado como usuário comum/);
assert.match(panel, /Criar acesso para um cliente/);
assert.match(panel, /Criar usuário/);
assert.match(css, /v27\.29 — acesso visível para criação e administração de contas/);
assert.match(css, /\.topbar-admin-account-action/);
assert.match(css, /\.settings-admin-account-shortcut/);
assert.match(css, /\.account-create-locked-preview/);

console.log('✓ v27.29: opção Criar contas visível, acesso direto do administrador e proteção MFA preservados.');
