import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const derived = fs.readFileSync('src/hooks/useCardVisionDerivedStateR179.ts', 'utf8');
const bootstrap = fs.readFileSync('src/modules/vault/vaultBootstrapSummaryR173.ts', 'utf8');
const cleanVault = fs.readFileSync('src/lib/cleanVaultV3800.ts', 'utf8');

assert.match(bootstrap, /VAULT_BOOTSTRAP_SUMMARY_R173_VERSION/, 'R173: resumo bootstrap deve ter versão explícita.');
assert.match(bootstrap, /export function cleanVaultPlayerKeyR173\(/, 'R173: identidade leve do jogador deve existir.');
assert.match(bootstrap, /export function buildVaultBootstrapSummaryR173/, 'R173: resumo leve do Cofre deve existir.');
assert.match(bootstrap, /new Set\(active\.map\(cleanVaultPlayerKeyR173\)\)\.size/, 'R173: total de jogadores deve derivar da mesma chave canônica leve.');
assert.doesNotMatch(bootstrap, /cardIdentityFingerprintR126|analysisUsagePositionR138|detectExactVaultDuplicates|cleanVaultBuildSignature/, 'R173: resumo bootstrap não pode puxar lógica pesada de identidade de carta/duplicatas.');

assert.match(derived, /import \{ buildVaultBootstrapSummaryR173 \} from ['"]@\/modules\/vault\/vaultBootstrapSummaryR173['"]/, 'R173: selector derivado R179 deve consumir apenas o resumo bootstrap.');
assert.doesNotMatch(shell, /from ['"]@\/lib\/cleanVaultV3800['"]/, 'R173: cleanVaultV3800 completo não pode voltar ao shell.');
assert.match(derived, /buildVaultBootstrapSummaryR173\(renderHistory\)/, 'R173: resumo da home deve usar o contrato leve no selector derivado.');

assert.match(cleanVault, /import \{ cleanVaultPlayerKeyR173 \} from ['"]@\/modules\/vault\/vaultBootstrapSummaryR173['"]/, 'R173: Cofre completo deve compartilhar a mesma identidade leve.');
assert.match(cleanVault, /export function cleanVaultPlayerKey\(entry: CleanVaultEntry\) \{\s*return cleanVaultPlayerKeyR173\(entry\);\s*\}/, 'R173: API histórica cleanVaultPlayerKey deve delegar à autoridade R173.');

console.log('R173 aprovada: resumo bootstrap do Cofre saiu do módulo pesado sem duplicar a identidade do jogador.');
