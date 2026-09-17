import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditR425SupabaseSecurityChain } from './apply-r425-supabase-security-chain.mjs';
import { auditR426SupabaseForwardSecurityMigration } from './check-r426-supabase-forward-security-migration.mjs';

export const R424_FINAL_REQUIREMENTS_AUDIT_VERSION = '40.80-r424-final-requirements-audit-v3-r426-aware';

export const R424_REQUIREMENT_STATUSES = Object.freeze({
  DELIVERED: 'ENTREGUE',
  PARTIAL: 'PARCIAL',
  SUPERSEDED: 'SUBSTITUIDO_POR_DECISAO_MAIS_NOVA',
  EXTERNAL: 'BLOQUEADO_POR_DEPENDENCIA_EXTERNA',
  FAILED: 'FALHOU',
});

const TEXT_EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;

function read(root, relative) {
  const file = path.resolve(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function exists(root, relative) {
  return fs.existsSync(path.resolve(root, relative));
}

function walkSources(root) {
  const start = path.resolve(root, 'src');
  const files = [];
  if (!fs.existsSync(start)) return files;
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (TEXT_EXTENSIONS.test(entry.name)) files.push(absolute);
    }
  }
  return files;
}

function fragments(source, required) {
  return Boolean(source) && required.every((fragment) => source.includes(fragment));
}

function item(id, label, ok, details, blockingCode = true) {
  return {
    id,
    label,
    status: ok ? R424_REQUIREMENT_STATUSES.DELIVERED : R424_REQUIREMENT_STATUSES.FAILED,
    blockingCode,
    details: Array.isArray(details) ? details : [details],
  };
}

function external(id, label, details) {
  return {
    id,
    label,
    status: R424_REQUIREMENT_STATUSES.EXTERNAL,
    blockingCode: false,
    details: Array.isArray(details) ? details : [details],
  };
}

function evaluateR417(root) {
  const vault = read(root, 'src/hooks/useCardVisionVaultActionsR185.ts');
  const autonomous = read(root, 'src/lib/autonomousCardR417.ts');
  const pipeline = read(root, 'src/lib/cardIntelligencePipeline.ts');
  const clean = read(root, 'src/lib/cleanSlatePerformance2027V4080R119.ts');
  const selectors = read(root, 'src/modules/vault/cardVisionVaultSelectorsR151.ts');
  const ui = read(root, 'src/components/CleanVaultV3800.tsx');
  const ok = fragments(vault, ['async function batchHistoryR417', 'const stableIds = [...new Set(ids)].filter(Boolean).sort();', "`batch:${action}:${stableIds.join('|')}`"])
    && fragments(autonomous, ['AUTONOMOUS_CARD_R417_VERSION'])
    && fragments(pipeline, ['applyAutonomousRoleSeedR417(current)'])
    && fragments(clean, ['usageContext.targetPosition !== autonomousPrimaryR417'])
    && fragments(selectors, ["index.folderId === 'lixeira'"])
    && fragments(ui, ['Selecionar tudo', 'Lixeira']);
  return item('r417-permanent-card-authority', 'R417 — ficha permanente, função autônoma e ações estáveis do Cofre', ok,
    ok ? 'Autoridade permanente e identidade estável presentes.' : 'Contrato R417 incompleto ou reescrito.');
}

function evaluateR418(root, sources) {
  const tactical = read(root, 'src/modules/tactical-studio/tacticalStudio2Storage.ts') || '';
  const squad = read(root, 'src/modules/squad-mapping/squadMappingStorage.ts') || '';
  const license = read(root, 'supabase/functions/license-session/index.ts') || '';
  const activeVaultCaps = sources.filter((file) => /\.slice\(0,\s*HISTORY_LIMIT\)/.test(fs.readFileSync(file, 'utf8')));
  const tacticalCap = /\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/.test(tactical);
  const squadCap = /source\.players[\s\S]{0,220}\.slice\(0,\s*500\)|source\.trials[\s\S]{0,220}\.slice\(0,\s*100\)/.test(squad);
  const deviceBound = /verifyDeviceProof/.test(license) && /\bdeviceId\b/.test(license) && /buildmaster_register_secure_device/.test(license);
  const forbiddenIpVpnBinding = [
    /headers\.get\(\s*['"]x-forwarded-for['"]\s*\)/i,
    /headers\.get\(\s*['"]cf-connecting-ip['"]\s*\)/i,
    /headers\.get\(\s*['"]x-real-ip['"]\s*\)/i,
    /\bpreviousIp\b/i,
    /\b(?:vpn|proxy)\b[^\n]{0,80}\b(?:block|blocked|deny|denied|reject|forbid)/i,
    /\b(?:block|blocked|deny|denied|reject|forbid)[^\n]{0,80}\b(?:vpn|proxy)\b/i,
  ].some((pattern) => pattern.test(license));
  const ok = activeVaultCaps.length === 0 && !tacticalCap && !squadCap && deviceBound && !forbiddenIpVpnBinding;
  return item('r418-capacity-network-mobility', 'R418 — coleções sem teto e licença por aparelho, não IP/VPN', ok,
    ok ? 'Sem poda persistente conhecida; identidade de licença permanece no aparelho.' : [
      activeVaultCaps.length ? `Poda HISTORY_LIMIT em: ${activeVaultCaps.map((file) => path.relative(root, file)).join(', ')}` : 'Cofre sem HISTORY_LIMIT ativo.',
      tacticalCap ? 'Teto do Tactical Studio reapareceu.' : 'Tactical Studio sem teto numérico ativo.',
      squadCap ? 'Teto de elenco/testes reapareceu.' : 'Mapeamento sem poda 500/100.',
      !deviceBound ? 'Prova/identidade segura do aparelho ausente.' : 'Prova de aparelho presente.',
      forbiddenIpVpnBinding ? 'Dependência indevida de IP/VPN detectada.' : 'Sem identidade IP/VPN detectada.',
    ]);
}

function evaluateR419(root) {
  const budget = read(root, 'src/modules/builds/pointBudget.ts') || '';
  const optimizer = read(root, 'src/modules/builds/trainingOptimizer.ts') || '';
  const evidence = read(root, 'src/modules/analysis/cardEvidenceAuthorityR419.ts') || '';
  const clean = read(root, 'src/lib/cleanSlatePerformance2027V4080R119.ts') || '';
  const domain = read(root, 'src/lib/analyzerDomain.ts') || '';
  const fallbackActive = /return\s+SAFE_PLAYER_TRAINING_BUDGET\s*;/.test(budget) || /return\s+SAFE_DEFAULT_TRAINING_BUDGET\s*;/.test(optimizer);
  const ok = !fallbackActive
    && fragments(optimizer, ['R419: orçamento ausente permanece 0'])
    && fragments(evidence, ['CARD_EVIDENCE_AUTHORITY_R419_VERSION', 'deriveTrainingBudgetEvidenceR419', 'applyCriticalEvidenceR419'])
    && fragments(clean, ['applyCriticalEvidenceR419', "budgetEvidenceStateR419!=='TRUSTED'"])
    && fragments(domain, ['CardEvidenceStateR419', 'trainingBudgetStateR419']);
  return item('r419-reader-master-engine', 'R419 — leitor/Motor Mestre fail-closed e PP sem fabricação', ok,
    ok ? 'Orçamento desconhecido permanece bloqueado; evidência crítica governa o Clean Slate.' : 'Fallback de PP ou gate de evidência R419 está incompleto.');
}

function evaluateR420(root) {
  const store = read(root, 'src/modules/vault/cardHistoryStore.ts') || '';
  const startup = read(root, 'src/modules/vault/cardHistoryStartupModelR200.ts') || '';
  const backup = read(root, 'src/modules/backup/cardVisionBackupRuntimeR162.ts') || '';
  const safety = read(root, 'src/lib/dataSafety.ts') || '';
  const installer = read(root, 'scripts/install-native-vault-storage-plugin.mjs') || '';
  const ok = store.includes('R420_UNBOUNDED_CANONICAL_VAULT')
    && !/\.slice\(0,\s*HISTORY_LIMIT\)/.test(store)
    && !/\.slice\(0,\s*40\)/.test(store)
    && startup.includes('HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER')
    && backup.includes('verifyRestoredHistoryR420')
    && !/\bHISTORY_LIMIT\b/.test(backup)
    && /schema > CURRENT_DATA_SCHEMA[\s\S]{0,500}valid:\s*false/.test(safety)
    && installer.includes('import android.util.AtomicFile;')
    && fragments(installer, ['atomicFile.startWrite()', 'atomicFile.finishWrite(stream)', 'atomicFile.failWrite(stream)']);
  return item('r420-persistence-recovery', 'R420 — persistência, recuperação e escrita nativa atômica', ok,
    ok ? 'Cofre canônico sem poda, restore verificável e AtomicFile presentes.' : 'Contrato de persistência/restore R420 incompleto.');
}

function evaluateR421(root) {
  const matchEngine = read(root, 'src/modules/matches/matchTrainerEngine.ts') || '';
  const matchCenter = read(root, 'src/modules/matches/MatchTrainerCenter.tsx') || '';
  const tacticalEngine = read(root, 'src/modules/tactical-studio/tacticalStudio2Engine.ts') || '';
  const tacticalStorage = read(root, 'src/modules/tactical-studio/tacticalStudio2Storage.ts') || '';
  const squadEngine = read(root, 'src/modules/squad-mapping/squadMappingEngine.ts') || '';
  const matchMarkers = ["| 'interception'", "'interception': {", 'playerCardFingerprint?: string | null;', 'playerHistoryId?: string | null;', 'playerLabel?: string | null;'];
  const ok = fragments(matchEngine, matchMarkers)
    && fragments(matchCenter, ['loadSquadMappingState', 'mappedPlayersR421', '<select value={markerPlayer}'])
    && !/Apoio por fora|Amplitude oposta/.test(tacticalEngine)
    && fragments(tacticalEngine, ['Aproximar por dentro', 'Apoio interior'])
    && fragments(tacticalStorage, ["typeof project.id !== 'string'", 'frame.actions.every'])
    && !/\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/.test(tacticalStorage)
    && /avoidWingers:\s*true/.test(squadEngine)
    && /favorCentralTriangles:\s*true/.test(squadEngine)
    && !/result\.training\s*=/.test(squadEngine);
  return item('r421-functional-modules', 'R421 — elenco, vídeo revisável e Estúdio Tático', ok,
    ok ? 'Vídeo ligado ao elenco, sequência central e persistência tática segura presentes.' : 'Um ou mais contratos funcionais R421 regrediram.');
}

function evaluateR422(root) {
  const account = read(root, 'src/lib/accountAuth.ts') || '';
  const admin = read(root, 'supabase/functions/admin-users/index.ts') || '';
  const migration = read(root, 'supabase/migrations/202607160001_security_hardening_v2675.sql') || '';
  const obs = read(root, 'src/modules/observability/observabilityEngine.ts') || '';
  const privilegeMetadata = ['plan', 'expires_at', 'max_devices', 'offline_grace_hours'].some((field) => migration.includes(`raw_user_meta_data->>'${field}'`));
  const ok = !/restore_account_creation/.test(account + admin)
    && !/admin_mfa_required:\s*false/.test(admin)
    && /aal2/i.test(account)
    && !privilegeMetadata
    && fragments(obs, ['40.80-r422-security-observability-v1', 'ObservabilityContextR422', 'redactObservabilityDetailsR422', 'buildId: input.buildId']);
  return item('r422-security-observability', 'R422 — MFA fail-closed, autorização segura e diagnóstico redigido', ok,
    ok ? 'Sem bypass conhecido de MFA/user_metadata; diagnóstico estruturado e redigido presente.' : 'Contrato de segurança/observabilidade R422 incompleto.');
}

function evaluateR425(root) {
  const report = auditR425SupabaseSecurityChain(root);
  return item('r425-supabase-security-chain', 'R425 — cadeia Supabase estática fail-closed', report.ok,
    report.ok
      ? `Cadeia estática convergida em ${report.migrationCount} migration(s); runtime remoto continua externo.`
      : report.issues);
}

function evaluateR426(root) {
  const report = auditR426SupabaseForwardSecurityMigration(root);
  return item('r426-supabase-forward-security', 'R426 — migration forward-only de segurança do Supabase', report.ok,
    report.ok
      ? 'Migration final impede downgrade de MFA/device-proof, fixa defaults seguros e reasserta grants mínimos.'
      : report.issues);
}

function evaluateR423(root) {
  const pkgRaw = read(root, 'package.json');
  const appUpdates = read(root, 'src/lib/appUpdates.ts') || '';
  const bootstrap = read(root, 'src/modules/observability/ObservabilityBootstrap.tsx') || '';
  const reader = read(root, 'src/components/TotalCardReaderPanel.tsx') || '';
  const result = read(root, 'src/components/result/ResultWorkspace.tsx') || '';
  const updater = read(root, 'src/components/UpdateCenterPanel.tsx') || '';
  const convergence = read(root, 'scripts/check-android-release-convergence-r183.mjs') || '';
  let version = '';
  try { version = String(JSON.parse(pkgRaw || '{}').version || ''); } catch { version = ''; }
  const releaseFallback = (appUpdates.match(/APP_RELEASE_VERSION\s*=\s*[^\n]*\|\|\s*'([^']+)'/) || [])[1] || '';
  const nativeFallback = (appUpdates.match(/APP_NATIVE_VERSION\s*=\s*[^\n]*\|\|\s*'([^']+)'/) || [])[1] || '';
  const legacyGone = !exists(root, 'src/components/FormationRoleLabPanel.tsx') && exists(root, 'src/components/FormationRoleLabPanelV4080.tsx');
  const ok = Boolean(version) && releaseFallback === version && nativeFallback === version
    && fragments(convergence, ['appUpdatesFallbackReleaseR423', 'appUpdatesFallbackNativeR423'])
    && legacyGone
    && fragments(bootstrap, ['visibilitychange', 'app-resume', 'app-background', "stage: 'app-lifecycle'"])
    && fragments(reader, ['total-read-complete', 'total-read-failed', '90_000', 'performance.now()', 'URL.revokeObjectURL', 'loading="lazy"', 'decoding="async"'])
    && fragments(result, ['Pontos usados', 'Disponíveis', 'trainingPointsRemaining', 'Top 5', 'Ímpeto'])
    && fragments(updater, ['expectedPackageName', 'expectedVersionCode', 'expectedVersionName', 'visibilitychange']);
  return item('r423-android-performance-ux', 'R423 — Android, medição de leitura, memória e UX final', ok,
    ok ? 'Versões coerentes, lifecycle/tempo observáveis, preview liberado e ficha crítica visível.' : 'Contrato Android/performance/UX R423 incompleto.');
}

function evaluateHistoricalContradictions(root, sources) {
  const offenders = [];
  for (const file of sources) {
    const source = fs.readFileSync(file, 'utf8');
    if (/\.slice\(0,\s*HISTORY_LIMIT\)/.test(source)) offenders.push(`${path.relative(root, file)}:HISTORY_LIMIT`);
    if (/return\s+SAFE_(?:PLAYER_)?TRAINING_BUDGET\s*;|return\s+SAFE_DEFAULT_TRAINING_BUDGET\s*;/.test(source)) offenders.push(`${path.relative(root, file)}:PP_FALLBACK`);
  }
  return item('historical-contradictions', 'Auditoria cruzada — sem teto persistente ou fallback de PP reintroduzido', offenders.length === 0,
    offenders.length ? offenders : 'Nenhuma contradição crítica encontrada na pasta src.');
}

function evaluateHistoricalTests(root) {
  const r407 = read(root, 'tests/v40-80-r407-unbounded-vault-capacity-regression.mjs') || '';
  const v3950 = read(root, 'tests/v39-50-total-squad-library-integration-regression.mjs') || '';
  const staleR407 = /assert\.match\(source,\s*\/HISTORY_LIMIT\//.test(r407);
  const staleSquad = /assert\.ok\(source\.includes\(["']slice\(0, 500\)["']\)\)/.test(v3950);
  const ok = Boolean(r407 && v3950) && !staleR407 && !staleSquad;
  return item('historical-tests', 'Contratos históricos — testes não exigem arquiteturas aposentadas', ok,
    ok ? 'R407/v39.50 não exigem mais os tetos removidos.' : 'Teste histórico voltou a exigir limite aposentado.');
}

function evaluateBudgetGate(root) {
  const pkgRaw = read(root, 'package.json');
  let qualityBundle = '';
  try { qualityBundle = String(JSON.parse(pkgRaw || '{}').scripts?.['quality:bundle'] || ''); } catch { qualityBundle = ''; }
  const ok = /check-bundle-budget\.mjs/.test(qualityBundle) && !exists(root, 'src/components/FormationRoleLabPanel.tsx');
  return item('source-budget-gate', 'Orçamento de fonte — gate preservado sem elevar teto por atalho', ok,
    ok ? 'Gate de bundle segue conectado e fonte legado R423 não ocupa orçamento.' : 'Gate de budget ausente ou fonte legado voltou.');
}

export function auditR424FinalRequirementsClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const sources = walkSources(root);
  const items = [
    evaluateR417(root),
    evaluateR418(root, sources),
    evaluateR419(root),
    evaluateR420(root),
    evaluateR421(root),
    evaluateR422(root),
    evaluateR425(root),
    evaluateR426(root),
    evaluateR423(root),
    evaluateHistoricalContradictions(root, sources),
    evaluateHistoricalTests(root),
    evaluateBudgetGate(root),
    external('external-ci', 'CI completo da main', 'Exige execução GitHub Actions no SHA que receber R419–R426.'),
    external('external-apk-smoke', 'APK real + smoke test + upgrade/restart', 'Exige artefato Android gerado e validação em aparelho/emulador após a main verde.'),
    external('external-device-benchmark', 'Benchmark real de OCR/memória/background', 'A meta de 1–1,5 min precisa de medições em aparelho real; o código apenas instrumenta a duração.'),
    external('external-supabase-runtime', 'Supabase real — RLS, grants, advisors e funções implantadas', 'Exige projeto Supabase conectado/identificado e consulta ao backend real; migration no Git não prova implantação.'),
  ];
  const codeBlocking = items.filter((entry) => entry.blockingCode);
  const codeReady = codeBlocking.every((entry) => entry.status === R424_REQUIREMENT_STATUSES.DELIVERED || entry.status === R424_REQUIREMENT_STATUSES.SUPERSEDED);
  const finalizationReady = codeReady && items.every((entry) => entry.status === R424_REQUIREMENT_STATUSES.DELIVERED || entry.status === R424_REQUIREMENT_STATUSES.SUPERSEDED);
  return {
    version: R424_FINAL_REQUIREMENTS_AUDIT_VERSION,
    root,
    codeReady,
    finalizationReady,
    counts: Object.fromEntries(Object.values(R424_REQUIREMENT_STATUSES).map((status) => [status, items.filter((entry) => entry.status === status).length])),
    items,
  };
}

export function assertR424CodeClosure(rootDirectory = process.cwd()) {
  const report = auditR424FinalRequirementsClosure(rootDirectory);
  const failures = report.items.filter((entry) => entry.blockingCode && entry.status === R424_REQUIREMENT_STATUSES.FAILED);
  if (failures.length) {
    const summary = failures.map((entry) => `${entry.id}: ${entry.details.join(' | ')}`).join('; ');
    throw new Error(`R424: auditoria final de código reprovada — ${summary}`);
  }
  return report;
}

function printReport(report) {
  console.log(`R424 ${report.codeReady ? 'CÓDIGO APROVADO' : 'CÓDIGO REPROVADO'} — ${report.version}`);
  for (const entry of report.items) console.log(`[${entry.status}] ${entry.id} — ${entry.label}`);
  console.log(`Finalização total: ${report.finalizationReady ? 'PRONTA' : 'AINDA DEPENDE DE VALIDAÇÕES EXTERNAS'}`);
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const report = auditR424FinalRequirementsClosure(process.cwd());
  printReport(report);
  if (!report.codeReady) process.exit(1);
}
