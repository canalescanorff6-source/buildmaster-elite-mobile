import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const coordinator = fs.readFileSync('src/modules/vault/useCardVisionVaultCoordinatorR153.ts', 'utf8');
const runtime = fs.readFileSync('src/modules/backup/vaultCloudRuntimeR166.ts', 'utf8');

assert.match(runtime, /VAULT_CLOUD_RUNTIME_R166_VERSION/, 'Runtime cloud R166 deve possuir versão explícita.');
assert.doesNotMatch(app, /useVaultCloudR141/, 'CardVisionApp não deve importar o hook cloud pesado R141.');
assert.doesNotMatch(coordinator, /^\s*import\s+(?!type\b)[^\n]+from ['"]@\/modules\/backup\/vaultCloudRuntimeR166['"]/m, 'Coordenador R153 não pode importar o runtime cloud R166 estaticamente.');
assert.match(coordinator, /await import\('@\/modules\/backup\/vaultCloudRuntimeR166'\)/, 'Runtime cloud deve entrar apenas por import dinâmico.');
assert.doesNotMatch(coordinator, /from ['"]@\/lib\/accountAuth['"]/, 'Autenticação pesada da conta não pode voltar ao coordenador de startup.');
assert.match(runtime, /from ['"]@\/lib\/accountAuth['"]/, 'Operações remotas devem continuar usando a autoridade de conta existente.');
assert.match(runtime, /runSerializedVaultCloudMutationR128/, 'Cloud deve continuar serializada pela fila R128.');
assert.match(runtime, /commitVaultHistoryR140/, 'Fallback cloud deve continuar confirmando a verdade local em R140.');
assert.match(runtime, /commitCanonicalHistory/, 'Pull/sync devem atravessar a fila canônica R153 quando fornecida.');
assert.equal(fs.existsSync('src/modules/backup/useVaultCloudR141.ts'), false, 'Wrapper cloud R141 órfão deve ser removido; R166 é a autoridade única de runtime.');
assert.match(coordinator, /createVaultCanonicalMutationQueueR153/, 'Fila canônica R153 continua no coordenador leve.');
assert.match(coordinator, /queueRef\.current\.run\(input\.history, mutate, commitVaultHistoryR140\)/, 'R140 continua sendo o único commit local do coordenador.');
assert.match(coordinator, /createVaultActionGuardR154/, 'Gate R154 continua protegendo ações concorrentes.');

for (const method of ['pushCloudHistory', 'pullCloudHistory', 'syncCloudHistory', 'deleteCloudHistoryItem']) {
  assert.ok(runtime.includes(`function ${method}`), `Runtime R166 deve preservar ${method}.`);
  assert.ok(coordinator.includes(method), `Coordenador deve expor ${method} via fronteira lazy.`);
}

console.log('R166 aprovada: nuvem do Cofre saiu do startup sem criar segunda lógica, fila ou writer local.');
