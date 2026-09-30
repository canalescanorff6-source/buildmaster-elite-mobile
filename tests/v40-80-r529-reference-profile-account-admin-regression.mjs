import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const settings = read('src/components/settings/CardVisionSettingsWorkspaceR190.tsx');
const accounts = read('src/components/AccountAdminPanel.tsx');
const security = read('src/modules/administration/AdministrationSecurityCenter.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r529-settings',
  'bm-r529-account-overview',
  'bm-r529-account-trust-grid',
  'bm-r529-notification-truth',
]) assert.ok(settings.includes(marker), `R529: configurações sem hook ${marker}`);

for (const marker of [
  'bm-r529-account-panel',
  'bm-r529-account-workspace',
]) assert.ok(accounts.includes(marker), `R529: contas sem hook ${marker}`);

for (const marker of [
  'bm-r529-security-center',
  'bm-r529-security-score-grid',
]) assert.ok(security.includes(marker), `R529: segurança sem hook ${marker}`);

for (const selector of [
  '.bm-r529-settings',
  '.bm-r529-account-overview',
  '.bm-r529-account-trust-grid',
  '.bm-r529-notification-truth',
  '.bm-r529-account-panel',
  '.bm-r529-account-workspace',
  '.bm-r529-security-center',
  '.bm-r529-security-score-grid',
]) assert.ok(css.includes(selector), `R529: CSS não cobre ${selector}`);

assert.match(settings, /Avisos internos/, 'R529: tela deve explicar que os avisos atuais são internos/contextuais.');
assert.match(settings, /Sem prometer push do sistema/, 'R529: tela não pode fingir push nativo inexistente.');
assert.match(accounts, /const mfaRequired = true/, 'R529: administração deve continuar fail-closed com MFA.');
assert.match(accounts, /beginAdminMfaEnrollment/, 'R529: fluxo real de matrícula MFA deve permanecer.');
assert.match(accounts, /verifyAdminMfa/, 'R529: verificação MFA real deve permanecer.');
assert.match(security, /allowLegacyClients: false/, 'R529: clientes legados continuam bloqueados.');
assert.match(security, /requireDeviceProof: true/, 'R529: prova criptográfica continua obrigatória.');
assert.match(security, /adminMfaRequired: true/, 'R529: MFA administrativo continua obrigatório.');
assert.ok(!settings.includes("from '@/lib/accountAuth'"), 'R529: workspace visual não deve virar autoridade de autenticação.');

console.log('R529 aprovada: perfil/conta/admin premium preserva sessão, MFA, aparelhos, política e avisos reais.');
