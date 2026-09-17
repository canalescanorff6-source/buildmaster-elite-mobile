import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = path.resolve('scripts/audit-r424-final-requirements-closure.mjs');
const { auditR424FinalRequirementsClosure, assertR424CodeClosure } = await import(pathToFileURL(modulePath).href);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r424-'));
const write = (relative, content) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};
const remove = (relative) => fs.rmSync(path.join(root, relative), { force: true });

function seedPassingFixture() {
  remove('src/modules/vault/roguePersistence.ts');
  write('package.json', JSON.stringify({ version: '40.80.0', scripts: { 'quality:bundle': 'node scripts/check-bundle-budget.mjs' } }));
  write('src/hooks/useCardVisionVaultActionsR185.ts', `async function batchHistoryR417(){}\nconst stableIds = [...new Set(ids)].filter(Boolean).sort();\nconst key = \`batch:\${action}:\${stableIds.join('|')}\`;`);
  write('src/lib/autonomousCardR417.ts', `export const AUTONOMOUS_CARD_R417_VERSION='r417';`);
  write('src/lib/cardIntelligencePipeline.ts', `applyAutonomousRoleSeedR417(current);`);
  write('src/lib/cleanSlatePerformance2027V4080R119.ts', `import { applyCriticalEvidenceR419 } from '../modules/analysis/cardEvidenceAuthorityR419';\nconst parsed=applyCriticalEvidenceR419(raw);\nif (usageContext.targetPosition !== autonomousPrimaryR417){}\nconst budgetEvidenceStateR419=parsed.evidence?.trainingBudgetStateR419??'MISSING';\nif(!budget || budgetEvidenceStateR419!=='TRUSTED') return blocked;`);
  write('src/modules/vault/cardVisionVaultSelectorsR151.ts', `if (index.folderId === 'lixeira') return true;`);
  write('src/components/CleanVaultV3800.tsx', `export const labels=['Selecionar tudo','Lixeira'];`);

  write('src/modules/vault/cardHistoryStore.ts', `// R418_UNBOUNDED_PERSISTENT_COLLECTIONS\n// R420_UNBOUNDED_CANONICAL_VAULT: nenhuma rota de persistência pode truncar silenciosamente o Cofre.\nexport function normalizeHistoryList(list){return list.filter(Boolean);}`);
  write('src/modules/vault/vaultHistoryMutationsR129.ts', `export function prepend(history,item){return [item,...history];}`);
  write('src/modules/tactical-studio/tacticalStudio2Storage.ts', `// R418_UNBOUNDED_PERSISTENT_COLLECTIONS\nexport function saveProjects(projects){return projects;}\nif (typeof project.id !== 'string') throw new Error('id');\nconst valid = frame.actions.every(Boolean);`);
  write('src/modules/squad-mapping/squadMappingStorage.ts', `// R418_UNBOUNDED_PERSISTENT_COLLECTIONS\nconst label=String('x').slice(0,100);\nexport function sanitizeMappingState(source){return {players:source.players,trials:source.trials};}`);
  write('supabase/functions/license-session/index.ts', `async function verifyDeviceProof(){}\nconst deviceId='bm2';\nawait service.rpc('buildmaster_register_secure_device',{p_device_id:deviceId});`);

  write('src/modules/builds/pointBudget.ts', `export const SAFE_PLAYER_TRAINING_BUDGET=64;\nexport function normalizePlayerTrainingBudget(value){const n=Number(value);return Number.isFinite(n)&&n>0&&n<=140?Math.round(n):0;}`);
  write('src/modules/builds/trainingOptimizer.ts', `export function trainingBudgetFromCard(parsed){const total=normalizeTrainingBudget(parsed.trainingPointsTotal);if(total>0)return total;\n// R419: orçamento ausente permanece 0 e deve ser bloqueado pelo Clean Slate.\nreturn 0;}`);
  write('src/modules/analysis/cardEvidenceAuthorityR419.ts', `export const CARD_EVIDENCE_AUTHORITY_R419_VERSION='40.80-r419-critical-evidence-v1';\nexport function deriveTrainingBudgetEvidenceR419(){return {state:'MISSING',budget:0};}\nexport function applyCriticalEvidenceR419(parsed){return parsed;}`);
  write('src/lib/analyzerDomain.ts', `export type CardEvidenceStateR419 = 'MISSING' | 'UNCERTAIN' | 'CONFLICTING' | 'TRUSTED';\ntype Evidence={criticalStateR419?:CardEvidenceStateR419;trainingBudgetStateR419?:CardEvidenceStateR419;};`);

  write('src/modules/vault/cardHistoryStartupModelR200.ts', `export const HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER;`);
  write('src/modules/backup/cardVisionBackupRuntimeR162.ts', `// R420_FAIL_CLOSED_RESTORE\nexport function verifyRestoredHistoryR420(){return true;}`);
  write('src/lib/dataSafety.ts', `if (schema > CURRENT_DATA_SCHEMA) return { valid: false, reason: 'future' };`);
  write('scripts/install-native-vault-storage-plugin.mjs', `import android.util.AtomicFile;\natomicFile.startWrite();\natomicFile.finishWrite(stream);\natomicFile.failWrite(stream);`);

  write('src/modules/matches/matchTrainerEngine.ts', `type Marker='pass' | 'marking' | 'finishing' | 'interception';\nconst dimensions={'interception': {}};\ntype Event={playerCardFingerprint?: string | null;playerHistoryId?: string | null;playerLabel?: string | null;};`);
  write('src/modules/matches/MatchTrainerCenter.tsx', `loadSquadMappingState(); const mappedPlayersR421=[]; const ui=<select value={markerPlayer}></select>;`);
  write('src/modules/tactical-studio/tacticalStudio2Engine.ts', `const steps=['Aproximar por dentro','Apoio interior'];`);
  write('src/modules/squad-mapping/squadMappingEngine.ts', `const preferences={avoidWingers: true,favorCentralTriangles: true};`);

  write('src/lib/accountAuth.ts', `export async function requireAal2(){return 'aal2';}`);
  write('supabase/functions/admin-users/index.ts', `const settings={admin_mfa_required: true};`);
  write('supabase/migrations/202607140001_buildmaster_accounts.sql', `-- R425_AUTHORIZATION_METADATA_FAIL_CLOSED\nselect 1;`);
  write('supabase/migrations/202607160001_security_hardening_v2675.sql', `-- R422: campos de autorização nunca vêm de raw_user_meta_data\n-- R425_AUTHORIZATION_METADATA_FAIL_CLOSED\nrevoke all on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;\ngrant execute on function public.buildmaster_take_admin_rate_limit(uuid, text, integer, integer) to service_role;\nrevoke all on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) from public, anon, authenticated;\ngrant execute on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) to service_role;`);
  write('supabase/migrations/202607250001_blocks25_27_community_commercial.sql', `-- R425_DATA_API_GRANTS_EXPLICIT\ngrant select on table public.buildmaster_commercial_plans, public.buildmaster_commercial_licenses, public.buildmaster_commercial_ledger to authenticated;\ngrant select, insert, update, delete on table public.buildmaster_terms_acceptances, public.buildmaster_community_profiles, public.buildmaster_community_packages, public.buildmaster_community_ratings to authenticated;`);
  write('supabase/migrations/202607250002_block28_play_publication.sql', `-- R425_DATA_API_GRANTS_EXPLICIT\ngrant select on table public.buildmaster_public_deletion_requests, public.buildmaster_play_integrity_audit to authenticated;`);
  write('supabase/migrations/202607280001_account_recovery_v3171.sql', `-- R425_MFA_FAIL_CLOSED\nupdate public.buildmaster_security_settings set admin_mfa_required = true where id = 1;`);
  write('supabase/migrations/202607280002_restore_account_creation_v3173.sql', `-- R425_MFA_FAIL_CLOSED\nupdate public.buildmaster_security_settings set admin_mfa_required = true where id = 1;`);
  write('supabase/migrations/202609160001_r426_security_finalization.sql', `-- R426_FORWARD_SECURITY_FINALIZATION\nbegin;\nupdate public.buildmaster_security_settings set allow_legacy_clients = false, require_device_proof = true, admin_mfa_required = true where id = 1;\nalter table public.buildmaster_security_settings add constraint buildmaster_security_admin_mfa_fail_closed check (admin_mfa_required is true) not valid;\nalter table public.buildmaster_security_settings add constraint buildmaster_security_device_proof_fail_closed check (require_device_proof is true) not valid;\nalter table public.buildmaster_security_settings add constraint buildmaster_security_no_legacy_clients check (allow_legacy_clients is false) not valid;\ncreate or replace function public.buildmaster_handle_new_auth_user() returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$ begin insert into public.buildmaster_profiles(id,username,display_name,role,status,plan,expires_at,max_devices,offline_grace_hours) values (new.id,'u','u','user','suspended','premium',null,1,4); return new; end; $$;\nrevoke all on table public.buildmaster_security_settings from anon, authenticated;\ngrant select on table public.buildmaster_profiles, public.buildmaster_devices to authenticated;\ngrant select, insert, update, delete on table public.user_vault_snapshots to authenticated;\nrevoke all on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) from public, anon, authenticated;\ngrant execute on function public.buildmaster_register_secure_device(uuid, text, text, text, text, text, integer, bigint, integer) to service_role;\ncommit;`);
  write('src/modules/observability/observabilityEngine.ts', `export const OBSERVABILITY_VERSION='40.80-r422-security-observability-v1';\nexport type ObservabilityContextR422={buildId?:string};\nfunction redactObservabilityDetailsR422(v){return v;}\nconst bundle={buildId: input.buildId};`);
  write('src/modules/observability/ObservabilityBootstrap.tsx', `document.addEventListener('visibilitychange',onVisibility);\nconst code=document.visibilityState==='visible'?'app-resume':'app-background';\nconst context={stage: 'app-lifecycle'};`);

  write('src/lib/appUpdates.ts', `export const APP_RELEASE_VERSION=process.env.X || '40.80.0';\nexport const APP_NATIVE_VERSION=process.env.Y || '40.80.0';`);
  write('src/components/TotalCardReaderPanel.tsx', `const t=performance.now();\nrecord({code:'total-read-complete',durationMs:performance.now()-t});\nrecord({code:'total-read-failed'});\nconst limit=90_000;\nURL.revokeObjectURL(url);\nconst img=<img loading="lazy" decoding="async"/>;`);
  write('src/components/result/ResultWorkspace.tsx', `const labels=['Pontos usados','Disponíveis','trainingPointsRemaining','Top 5','Ímpeto'];`);
  write('src/components/UpdateCenterPanel.tsx', `downloadVerifyAndInstallApk({expectedPackageName,expectedVersionCode,expectedVersionName});\ndocument.addEventListener('visibilitychange', onVisible);`);
  write('scripts/check-android-release-convergence-r183.mjs', `const appUpdatesFallbackReleaseR423='40.80.0';\nconst appUpdatesFallbackNativeR423='40.80.0';`);
  write('src/components/FormationRoleLabPanelV4080.tsx', `export function FormationRoleLabPanelV4080(){return null;}`);
  remove('src/components/FormationRoleLabPanel.tsx');

  write('tests/v40-80-r407-unbounded-vault-capacity-regression.mjs', `assert.doesNotMatch(source,/\\.slice\\(0,\\s*HISTORY_LIMIT\\)/);`);
  write('tests/v39-50-total-squad-library-integration-regression.mjs', `assert.doesNotMatch(source,/source\\.players[\\s\\S]{0,200}\\.slice\\(0,\\s*500\\)/);`);
}

seedPassingFixture();
const report = auditR424FinalRequirementsClosure(root);
assert.equal(report.codeReady, true, JSON.stringify(report, null, 2));
assert.equal(report.finalizationReady, false, 'R424 não pode declarar final sem CI/APK/aparelho/Supabase reais.');
assert.deepEqual(report.items.filter((item) => item.blockingCode && item.status !== 'ENTREGUE'), []);
assert.ok(report.items.some((item) => item.id === 'external-ci' && item.status === 'BLOQUEADO_POR_DEPENDENCIA_EXTERNA'));
assert.ok(report.items.some((item) => item.id === 'external-apk-smoke' && item.status === 'BLOQUEADO_POR_DEPENDENCIA_EXTERNA'));
assert.ok(report.items.some((item) => item.id === 'external-supabase-runtime' && item.status === 'BLOQUEADO_POR_DEPENDENCIA_EXTERNA'));
assert.doesNotThrow(() => assertR424CodeClosure(root));

// Negative 1: fallback 64 ativo reaparece.
write('src/modules/builds/pointBudget.ts', `export const SAFE_PLAYER_TRAINING_BUDGET=64;\nexport function normalizePlayerTrainingBudget(){return SAFE_PLAYER_TRAINING_BUDGET;}`);
let broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'r419-reader-master-engine' && item.status === 'FALHOU'));
assert.throws(() => assertR424CodeClosure(root), /R424/);

// Negative 2: licença volta a depender de IP/VPN.
seedPassingFixture();
write('supabase/functions/license-session/index.ts', `async function verifyDeviceProof(){}\nconst deviceId='bm2';\nconst sourceIp=request.headers.get('x-forwarded-for');\nif(sourceIp!==previousIp) throw new Error('VPN blocked');\nawait service.rpc('buildmaster_register_secure_device',{p_device_id:deviceId});`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'r418-capacity-network-mobility' && item.status === 'FALHOU'));

// Negative 3: poda persistente volta em qualquer src.
seedPassingFixture();
write('src/modules/vault/roguePersistence.ts', `export function persist(items){return items.slice(0,HISTORY_LIMIT);}`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'historical-contradictions' && item.status === 'FALHOU'));

// Negative 4: fonte legado reaparece sem ser substituto ativo.
seedPassingFixture();
write('src/components/FormationRoleLabPanel.tsx', `export function FormationRoleLabPanel(){return null;}`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'r423-android-performance-ux' && item.status === 'FALHOU'));

// Negative 6: uma migration posterior não pode desligar MFA depois do hardening.
seedPassingFixture();
write('supabase/migrations/202607280002_restore_account_creation_v3173.sql', `update public.buildmaster_security_settings set admin_mfa_required = false where id = 1;`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false, 'R424 precisa detectar override posterior que desliga MFA.');
assert.ok(broken.items.some((item) => item.id === 'r425-supabase-security-chain' && item.status === 'FALHOU'));

// Negative 5: teste histórico volta a exigir teto antigo.
seedPassingFixture();
write('tests/v40-80-r407-unbounded-vault-capacity-regression.mjs', `assert.match(source,/HISTORY_LIMIT/);`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'historical-tests' && item.status === 'FALHOU'));

// Negative 7: migration posterior à R426 tenta rebaixar MFA.
seedPassingFixture();
write('supabase/migrations/202609170001_security_regression.sql', `update public.buildmaster_security_settings set admin_mfa_required = false where id = 1;`);
broken = auditR424FinalRequirementsClosure(root);
assert.equal(broken.codeReady, false);
assert.ok(broken.items.some((item) => item.id === 'r426-supabase-forward-security' && item.status === 'FALHOU'));

console.log('R424 aprovada: auditoria final fail-closed cobre R417–R426 e mantém CI/APK/aparelho/Supabase como dependências externas explícitas.');
