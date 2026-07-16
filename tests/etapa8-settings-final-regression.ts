import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const auth = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const accounts = fs.readFileSync('src/components/AccountAdminPanel.tsx', 'utf8');
const updates = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(app, /type SettingsView = 'aparencia' \| 'desempenho' \| 'seguranca' \| 'backup' \| 'atualizacoes' \| 'contas'/);
assert.match(app, /type TextScale = 'compact' \| 'standard' \| 'large'/);
assert.match(app, /type MotionPreference = 'system' \| 'reduced' \| 'full'/);
assert.match(app, /settings-navigation-rail/);
assert.match(app, /Aparência e acessibilidade/);
assert.match(app, /Backup e restauração/);
assert.match(app, /Contraste reforçado/);
assert.match(app, /text-\$\{textScale\}/);
assert.match(app, /motion-\$\{motionPreference\}/);
assert.match(app, /skip-to-content/);
assert.match(auth, /aria-busy=\{loading\}/);
assert.match(auth, /role="status" aria-busy="true"/);
assert.match(accounts, /Testar Supabase/);
assert.match(accounts, /Gerar senha segura/);
assert.match(accounts, /Renovação rápida/);
assert.match(accounts, /\+90 dias/);
assert.match(accounts, /validateOnlineLicense/);
assert.match(updates, /CapacitorHttp/);
assert.match(updates, /Backup, verificar e instalar/);
assert.match(updates, /Testar canal oficial/);
assert.match(css, /ETAPA 8 — AJUSTES, CONTAS, ACESSIBILIDADE E ACABAMENTO FINAL/);
assert.match(css, /@media \(max-width: 360px\)/);
assert.match(css, /@media \(orientation: landscape\)/);
assert.match(css, /\.premium-app\.motion-reduced/);
assert.match(css, /:focus-visible/);

console.log('✓ Etapa 8: ajustes, contas, responsividade, acessibilidade e atualização final validados.');
