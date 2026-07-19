import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const accountAuth = fs.readFileSync('src/lib/accountAuth.ts', 'utf8');
const accounts = fs.readFileSync('src/components/AccountAdminPanel.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const css = [fs.readFileSync('src/app/legacy-compat.css', 'utf8'), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const capacitor = fs.readFileSync('capacitor.config.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
const displayVersion = pkg.version.split('.').slice(0, 2).join('.');

assert.match(auth, /scheduleReconnect/);
assert.match(auth, /Tentar agora/);
assert.match(auth, /setValidation\(\(current\) => current \? \{ \.\.\.current, offline: true \}/);
assert.match(accountAuth, /if \(!isTransientAccountError\(error\)[\s\S]*clearSessionStorage\(\)/);
assert.match(accountAuth, /Tempo limite ao conectar ao servidor de contas/);

assert.doesNotMatch(accounts, /window\.(prompt|confirm|alert)/);
assert.match(accounts, /bm-admin-dialog/);
assert.match(accounts, /shareCreatedCredentials/);
assert.match(accounts, /Gerar outra senha segura/);

assert.match(app, /aria-current=/);
assert.match(app, /previousFocus\?\.focus\(\)/);
assert.match(app, /setSettingsView\('backup'\)/);
assert.ok(
  app.includes('APP_RELEASE_VERSION') && layout.includes('APP_RELEASE_VERSION'),
  `A interface precisa usar a versão centralizada v${displayVersion}.`,
);

assert.match(css, /v26\.75 — SEGURANÇA REFORÇADA/);
assert.match(css, /label:focus-within[\s\S]*outline: none !important/);
assert.match(css, /bm-dialog-backdrop/);
assert.match(css, /offline-license-banner > button/);
assert.doesNotMatch(layout, /maximumScale/);
assert.match(layout, /colorScheme: 'dark light'/);
assert.match(capacitor, /webContentsDebuggingEnabled: false/);
assert.match(capacitor, /allowMixedContent: false/);

console.log(`✓ v${displayVersion}: sessão resiliente, foco limpo, diálogos premium e acessibilidade validados.`);
