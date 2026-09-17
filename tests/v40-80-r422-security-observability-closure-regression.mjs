import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const account = read('src/lib/accountAuth.ts');
const admin = read('supabase/functions/admin-users/index.ts');
const migration = read('supabase/migrations/202607160001_security_hardening_v2675.sql');
const obs = read('src/modules/observability/observabilityEngine.ts');
const license = read('supabase/functions/license-session/index.ts');

assert.doesNotMatch(account, /restore_account_creation/, 'R422: cliente ainda expõe bypass de restauração sem MFA.');
assert.doesNotMatch(admin, /restore_account_creation/, 'R422: Edge Function ainda expõe bypass de MFA.');
assert.match(admin, /admin_mfa_required:\s*true/, 'R422: fallback administrativo deve falhar fechado com MFA ativo.');
assert.doesNotMatch(migration, /raw_user_meta_data->>'plan'/, 'R422: plano ainda nasce de metadata editável pelo usuário.');
assert.doesNotMatch(migration, /raw_user_meta_data->>'expires_at'/, 'R422: vencimento ainda nasce de metadata editável pelo usuário.');
assert.doesNotMatch(migration, /raw_user_meta_data->>'max_devices'/, 'R422: limite de aparelhos ainda nasce de metadata editável pelo usuário.');
assert.doesNotMatch(migration, /raw_user_meta_data->>'offline_grace_hours'/, 'R422: grace offline ainda nasce de metadata editável pelo usuário.');
assert.match(migration, /'premium',\s*\n\s*null,\s*\n\s*1,\s*\n\s*4/, 'R422: novos perfis externos precisam defaults conservadores administrados pelo servidor.');

assert.match(obs, /40\.80-r422-security-observability-v1/, 'R422: versão de observabilidade não convergiu.');
for (const field of ['appVersion','buildId','stage','trainingPointsTotal','fallbackUsed','action','details']) {
  assert.ok(obs.includes(field), `R422: contexto de observabilidade ausente: ${field}`);
}
assert.match(obs, /redactObservabilityDetailsR422/, 'R422: detalhes estruturados precisam de sanitização/redação.');
assert.match(obs, /buildId:\s*input\.buildId/, 'R422: bundle de suporte precisa identificar o build sem segredo.');

assert.doesNotMatch(license, /x-forwarded-for|cf-connecting-ip|x-real-ip/i, 'R422: licença não pode depender de IP.');
assert.doesNotMatch(license, /\b(vpn|proxy)\b[^\n]{0,80}(block|deny|reject)/i, 'R422: licença não pode bloquear VPN/proxy genericamente.');

const srcFiles = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) srcFiles.push(full);
  }
};
walk('src');
for (const file of srcFiles) {
  const source = read(file);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i, `R422: segredo Supabase não pode existir no cliente: ${file}`);
}

console.log('R422 aprovada: MFA fail-closed, metadata sem privilégios, licença independente de IP/VPN e diagnóstico estruturado/redigido.');
