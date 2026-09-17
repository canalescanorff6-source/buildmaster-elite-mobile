import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyR414CiContractConvergence } from './apply-r414-ci-contract-convergence.mjs';
import { applyR418UnboundedCapacity } from './apply-r418-unbounded-capacity.mjs';
import { applyR418Fix2HistoricalCapacityContracts } from './apply-r418-fix2-historical-contracts.mjs';
import { applyR419ReaderMasterEngineClosure } from './apply-r419-reader-master-engine-closure.mjs';
import { applyR420PersistenceRecoveryClosure } from './apply-r420-persistence-recovery-closure.mjs';
import { applyR421SquadVideoTacticalClosure } from './apply-r421-squad-video-tactical-closure.mjs';
import { applyR422SecurityObservabilityClosure } from './apply-r422-security-observability-closure.mjs';
import { applyR423AndroidPerformanceUxClosure } from './apply-r423-android-performance-ux-closure.mjs';
import { applyR425SupabaseSecurityChain } from './apply-r425-supabase-security-chain.mjs';
import { assertR426SupabaseForwardSecurityMigration } from './check-r426-supabase-forward-security-migration.mjs';
import { assertR424CodeClosure } from './audit-r424-final-requirements-closure.mjs';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILE = path.join(MODULE_DIR, 'templates', 'critical-routes', 'root-page.tsx.txt');

function normalize(text) {
  return String(text).replace(/\r\n/g, '\n').trimEnd() + '\n';
}

function sourceHas(projectRoot, relativePath, fragments) {
  const file = path.join(projectRoot, ...relativePath.split('/'));
  if (!fs.existsSync(file)) return false;
  const source = fs.readFileSync(file, 'utf8');
  return fragments.every((fragment) => source.includes(fragment));
}

export function hasConvergedR417(projectRoot = process.cwd()) {
  return (
    sourceHas(projectRoot, 'src/hooks/useCardVisionVaultActionsR185.ts', [
      'async function batchHistoryR417',
      'const stableIds = [...new Set(ids)].filter(Boolean).sort();',
      "`batch:${action}:${stableIds.join('|')}`",
    ]) &&
    sourceHas(projectRoot, 'src/lib/autonomousCardR417.ts', ['AUTONOMOUS_CARD_R417_VERSION']) &&
    sourceHas(projectRoot, 'src/lib/cardIntelligencePipeline.ts', ['applyAutonomousRoleSeedR417(current)']) &&
    sourceHas(projectRoot, 'src/lib/cleanSlatePerformance2027V4080R119.ts', ['usageContext.targetPosition !== autonomousPrimaryR417']) &&
    sourceHas(projectRoot, 'src/modules/vault/cardVisionVaultSelectorsR151.ts', ["index.folderId === 'lixeira'"]) &&
    sourceHas(projectRoot, 'src/components/CleanVaultV3800.tsx', ['Selecionar tudo', 'Lixeira'])
  );
}

function isValidRootRoute(source) {
  const text = normalize(source);
  return (
    text.includes("@/components/AuthGate") &&
    text.includes("@/components/CardVisionApp") &&
    text.includes("@/components/AppShellSafetyBoundaryV3930") &&
    text.includes('<AppShellSafetyBoundaryV3930>') &&
    text.includes('<AuthGate>') &&
    text.includes('<CardVisionApp') &&
    text.includes('</AppShellSafetyBoundaryV3930>') &&
    !/PrivacyPolicyPage|AccountDeletionPage|Política de privacidade|Solicitar exclusão da conta|public-policy-page/.test(text)
  );
}

export function repairCriticalRoutes(projectRoot = process.cwd(), options = {}) {
  const checkOnly = Boolean(options.checkOnly);
  const rootPage = path.join(projectRoot, 'src', 'app', 'page.tsx');
  const expected = normalize(fs.readFileSync(TEMPLATE_FILE, 'utf8'));
  const current = fs.existsSync(rootPage) ? normalize(fs.readFileSync(rootPage, 'utf8')) : '';

  if (isValidRootRoute(current)) {
    return { repaired: false, rootPage, reason: 'valid' };
  }

  const reason = !current
    ? 'missing'
    : /AccountDeletionPage|Solicitar exclusão da conta/.test(current)
      ? 'deletion-page-overwrite'
      : /PrivacyPolicyPage|Política de privacidade|public-policy-page/.test(current)
        ? 'privacy-page-overwrite'
        : /AuthGate|CardVisionApp/.test(current) && !/AppShellSafetyBoundaryV3930/.test(current)
          ? 'outdated-shell-route'
          : 'invalid-root-route';

  if (checkOnly) {
    const error = new Error(`Rota inicial inválida (${reason}): ${rootPage}`);
    error.code = 'BUILDMASTER_INVALID_ROOT_ROUTE';
    throw error;
  }

  fs.mkdirSync(path.dirname(rootPage), { recursive: true });
  fs.writeFileSync(rootPage, expected, 'utf8');

  const repaired = normalize(fs.readFileSync(rootPage, 'utf8'));
  if (!isValidRootRoute(repaired)) {
    throw new Error(`Não foi possível restaurar a rota inicial: ${rootPage}`);
  }

  return { repaired: true, rootPage, reason };
}

function parseArgs(argv) {
  const options = { checkOnly: false, projectRoot: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') options.checkOnly = true;
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--root exige um caminho.');
      options.projectRoot = path.resolve(value);
      index += 1;
    }
  }
  return options;
}

const invokedAsCli = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedAsCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (hasConvergedR417(options.projectRoot)) {
      console.log('R417 já convergida: reparo de contratos históricos não será reaplicado.');
    } else {
      const contracts = applyR414CiContractConvergence(options.projectRoot);
      if (contracts.changed) {
        console.warn(`::warning::Contratos históricos de CI convergidos para R414 (${contracts.patched.length} arquivo(s)).`);
      }
    }
    const capacity = applyR418UnboundedCapacity(options.projectRoot);
    if (capacity.changed) {
      console.warn(`::warning::R418 removeu tetos artificiais de coleções persistentes (${capacity.patched.length} arquivo(s)).`);
    } else {
      console.log('R418: coleções persistentes já estão sem tetos artificiais.');
    }
    const historicalCapacity = applyR418Fix2HistoricalCapacityContracts(options.projectRoot);
    if (historicalCapacity.changed) {
      console.warn(`::warning::R418-fix2 convergiu contratos históricos de capacidade (${historicalCapacity.patched.length} arquivo(s)).`);
    } else {
      console.log('R418-fix2: contratos históricos de capacidade já estão convergidos.');
    }
    const r419 = applyR419ReaderMasterEngineClosure(options.projectRoot);
    if (r419.changed) {
      console.warn(`::warning::R419 convergiu leitor e Motor Mestre fail-closed (${r419.patched.length} arquivo(s)).`);
    } else {
      console.log('R419: leitor e Motor Mestre já estão convergidos.');
    }
    const r420 = applyR420PersistenceRecoveryClosure(options.projectRoot);
    if (r420.changed) {
      console.warn(`::warning::R420 convergiu persistência, recuperação e backup (${r420.patched.length} arquivo(s)).`);
    } else {
      console.log('R420: persistência, recuperação e backup já estão convergidos.');
    }
    const r421 = applyR421SquadVideoTacticalClosure(options.projectRoot);
    if (r421.changed) {
      console.warn(`::warning::R421 convergiu elenco, vídeo revisável e Estúdio Tático (${r421.patched.length} arquivo(s)).`);
    } else {
      console.log('R421: elenco, vídeo revisável e Estúdio Tático já estão convergidos.');
    }
    const r422 = applyR422SecurityObservabilityClosure(options.projectRoot);
    if (r422.changed) {
      console.warn(`::warning::R422 convergiu segurança fail-closed e observabilidade (${r422.patched.length} arquivo(s)).`);
    } else {
      console.log('R422: segurança fail-closed e observabilidade já estão convergidas.');
    }
    const r423 = applyR423AndroidPerformanceUxClosure(options.projectRoot);
    if (r423.changed) {
      console.warn(`::warning::R423 convergiu Android, medição de leitura e UX final (${r423.patched.length} arquivo(s)).`);
    } else {
      console.log('R423: Android, medição de leitura e UX final já estão convergidos.');
    }
    const r425 = applyR425SupabaseSecurityChain(options.projectRoot);
    if (r425.changed) {
      console.warn(`::warning::R425 convergiu cadeia Supabase estática fail-closed (${r425.patched.length} arquivo(s)).`);
    } else {
      console.log('R425: cadeia Supabase estática já está convergida.');
    }
    const r426 = assertR426SupabaseForwardSecurityMigration(options.projectRoot);
    console.log(`R426: migration forward-only validada (${r426.migration}).`);
    const r424 = assertR424CodeClosure(options.projectRoot);
    console.log(`R424: auditoria estrutural aprovada (${r424.counts.ENTREGUE} requisito(s) de código entregues; dependências externas permanecem explícitas).`);
    const result = repairCriticalRoutes(options.projectRoot, { checkOnly: options.checkOnly });
    if (result.repaired) {
      console.warn(`::warning::Rota inicial restaurada automaticamente (${result.reason}).`);
      console.log(`Rota crítica recuperada: ${path.relative(options.projectRoot, result.rootPage)}`);
    } else {
      console.log('Rota inicial correta: nenhuma recuperação necessária.');
    }
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
