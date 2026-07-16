import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateCachedLicense, isSupabaseConfigurationValid, isTransientAccountError, normalizeUsername, usernameToInternalEmail, validateUsername, type LicenseValidation } from '../src/lib/accountAuth';

assert.equal(normalizeUsername(' João 10! '), 'joao10');
assert.equal(normalizeUsername('PLAYER.Pro_01'), 'player.pro_01');
assert.equal(validateUsername('ab'), 'Use pelo menos 3 caracteres.');
assert.equal(validateUsername('joao10'), null);
assert.equal(usernameToInternalEmail('Joao10'), 'joao10@accounts.buildmaster.app');
assert.equal(isSupabaseConfigurationValid('https://example.supabase.co', 'sb_publishable_test'), false);
assert.equal(isSupabaseConfigurationValid('https://abc123.supabase.co', 'sb_publishable_real_key'), true);
assert.equal(isSupabaseConfigurationValid('https://abc123.supabase.co', 'eyJlegacyAnonKey'), true);

assert.equal(isTransientAccountError(new Error('Não consegui conectar ao serviço license-session. Confira a internet e tente novamente.')), true);
assert.equal(isTransientAccountError(new Error('O servidor de contas está temporariamente indisponível.')), true);
assert.equal(isTransientAccountError(new Error('Request timeout')), true);
assert.equal(isTransientAccountError(new Error('Sua sessão expirou. Entre novamente.')), false);
assert.equal(isTransientAccountError(new Error('Esta conta está bloqueada.')), false);

const base: LicenseValidation = {
  profile: {
    id: 'user-1', username: 'joao10', displayName: 'João', role: 'user', status: 'active', plan: 'premium',
    expiresAt: '2026-08-14T00:00:00.000Z', maxDevices: 1, offlineGraceHours: 4
  },
  deviceId: 'device-1',
  validatedAt: '2026-07-14T10:00:00.000Z',
  offline: false
};
assert.equal(evaluateCachedLicense(base, Date.parse('2026-07-14T13:00:00.000Z')).valid, true);
assert.equal(evaluateCachedLicense(base, Date.parse('2026-07-16T20:00:00.000Z')).valid, false);
assert.equal(evaluateCachedLicense(base, Date.parse('2026-07-14T09:00:00.000Z')).valid, false, 'retrocesso do relógio deve invalidar cache offline');
assert.equal(evaluateCachedLicense({ ...base, profile: { ...base.profile, status: 'blocked' } }, Date.parse('2026-07-14T11:00:00.000Z')).valid, false);
assert.equal(evaluateCachedLicense({ ...base, profile: { ...base.profile, expiresAt: '2026-07-14T10:30:00.000Z' } }, Date.parse('2026-07-14T11:00:00.000Z')).valid, false);

const auth = fs.readFileSync('src/components/AuthGate.tsx', 'utf8');
const admin = fs.readFileSync('src/components/AccountAdminPanel.tsx', 'utf8');
const sql = fs.readFileSync('supabase/migrations/202607140001_buildmaster_accounts.sql', 'utf8');
const licenseFunction = fs.readFileSync('supabase/functions/license-session/index.ts', 'utf8');
const adminFunction = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');
assert.match(auth, /signInWithUsername/);
assert.match(auth, /Somente o administrador cria usuários/);
assert.doesNotMatch(auth, /thiago0126|iu1fsaa67a/, 'credenciais antigas não podem permanecer no APK');
assert.match(auth, /NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK === '1'/);
assert.match(auth, /isTransientAccountError\(cause\)/, 'falha temporária ao retomar não pode derrubar a sessão');
assert.match(auth, /setValidation\(\(current\) => current \? \{ \.\.\.current, offline: true \} : current\)/, 'sessão atual deve ser preservada em falha transitória');
assert.match(auth, /window\.setTimeout\(\(\) => void revalidate\(\), 1800\)/, 'retomada deve aguardar a rede do Android estabilizar');
assert.match(admin, /Criar usuário/);
assert.match(admin, /\+30 dias/);
assert.match(sql, /enable row level security/);
assert.match(sql, /buildmaster_validate_license_and_register_device/);
assert.doesNotMatch(sql, /raw_user_meta_data->>'role'\s*=\s*'admin'/, 'metadata do cliente não pode promover administrador');
assert.match(sql, /raw_app_meta_data->>'buildmaster_managed'/, 'cadastros externos precisam ficar suspensos');
assert.match(licenseFunction, /license-session|buildmaster_validate_license_and_register_device/);
assert.match(adminFunction, /auth\.admin\.createUser/);
assert.match(adminFunction, /app_metadata:\s*\{ buildmaster_managed: true \}/);
assert.match(adminFunction, /auth\.admin\.updateUserById/);
assert.match(adminFunction, /safeAuditDetails/);
assert.doesNotMatch(adminFunction, /details:\s*body\s*\}/, 'senha não pode ser gravada no log administrativo');
console.log('✓ Contas, prazos, aparelhos, RLS e painel administrativo v26.75 validados.');
