import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R424_FIX2_CI_CONVERGENCE_VERSION = '40.80-r424-fix2-ci-convergence-v1';
const R417_SOURCE_SHA = '299db08a35e14c8ba7dea325b9fc8722480309c3417f915058243b8a3b50e312';

const P = Object.freeze({
  repairRoutes: 'scripts/repair-critical-routes.mjs',
  r406Baseline: 'scripts/apply-r406-fix7-r186-r200-reviewed-baselines.mjs',
  r419: 'scripts/apply-r419-reader-master-engine-closure.mjs',
  r419Helper: 'src/modules/analysis/cardEvidenceAuthorityR419.ts',
  analyzerStub: 'tests/types-v3170-ui/analyzer-stub.ts',
  uiStubs: 'tests/types-v3170-ui/stubs.d.ts',
  accountPanel: 'src/components/AccountAdminPanel.tsx',
  securityCenter: 'src/modules/administration/AdministrationSecurityCenter.tsx',
  v3171: 'tests/v31-71-account-recovery-regression.mjs',
  v3173: 'tests/v31-73-account-panel-restoration-regression.mjs',
  v3840: 'tests/v38-40-native-vault-storage-hotfix-regression.mjs',
  r151: 'scripts/check-source-types-r151.mjs',
});

function file(root, relative) { return path.resolve(root, relative); }
function readRequired(root, relative) {
  const target = file(root, relative);
  if (!fs.existsSync(target)) throw new Error(`R424-fix2: arquivo obrigatório ausente: ${relative}`);
  return fs.readFileSync(target, 'utf8');
}
function readOptional(root, relative) {
  const target = file(root, relative);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
}
function writeChanged(root, relative, before, after, patched) {
  if (before === after) return false;
  fs.writeFileSync(file(root, relative), after, 'utf8');
  if (!patched.includes(relative)) patched.push(relative);
  return true;
}
function replaceOne(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R424-fix2: contrato inesperado em ${label}; ocorrências=${count}`);
  return source.replace(from, to);
}

function patchRepairRoutes(source) {
  if (source.includes('R424_FIX2_SEMANTIC_R417_CONVERGENCE')) return source;
  const pattern = /export function hasConvergedR417\(projectRoot = process\.cwd\(\)\) \{[\s\S]*?\n\}\r?\n(?:\r?\n)?function isValidRootRoute/;
  if (!pattern.test(source)) throw new Error('R424-fix2: hasConvergedR417 não encontrado.');
  const replacement = `export function hasConvergedR417(projectRoot = process.cwd()) {\n  // R424_FIX2_SEMANTIC_R417_CONVERGENCE: detalhes internos de implementação não definem a autoridade R417.\n  return (\n    sourceHas(projectRoot, 'src/hooks/useCardVisionVaultActionsR185.ts', ['batchHistoryR417', "action === 'delete'"]) &&\n    sourceHas(projectRoot, 'src/modules/vault/vaultHistoryMutationsR129.ts', ['batchRemoveHistoryR417']) &&\n    sourceHas(projectRoot, 'src/lib/autonomousCardR417.ts', ['AUTONOMOUS_CARD_R417_VERSION', 'slice(0,3)', 'buildPositionUsageR416']) &&\n    sourceHas(projectRoot, 'src/lib/cardIntelligencePipeline.ts', ['applyAutonomousRoleSeedR417(current)']) &&\n    sourceHas(projectRoot, 'src/lib/cleanSlatePerformance2027V4080R119.ts', ['usageContext.targetPosition !== autonomousPrimaryR417']) &&\n    sourceHas(projectRoot, 'src/modules/vault/cardVisionVaultSelectorsR151.ts', ["index.folderId === 'lixeira'"]) &&\n    sourceHas(projectRoot, 'src/components/CleanVaultV3800.tsx', ['Selecionar tudo', 'Lixeira'])\n  );\n}\n\nfunction isValidRootRoute`;
  return source.replace(pattern, replacement);
}

function patchR406Baseline(source) {
  let next = source;
  if (!next.includes(`const R417_SHA='${R417_SOURCE_SHA}';`)) {
    const anchor = "const R416_SHA='8e31a5d224836cef882d9bb23e396358299adf64cfb1405ce2baa79f280cf0e4';";
    if (!next.includes(anchor)) throw new Error('R424-fix2: âncora R416 ausente no R406-fix7.');
    next = next.replace(anchor, `${anchor}\nconst R417_SHA='${R417_SOURCE_SHA}';`);
  }
  next = next.replace('const known=[LEGACY_SHA,REVIEWED_SHA,R416_SHA];', 'const known=[LEGACY_SHA,REVIEWED_SHA,R416_SHA,R417_SHA];');
  if (!next.includes('const known=[LEGACY_SHA,REVIEWED_SHA,R416_SHA,R417_SHA];')) {
    throw new Error('R424-fix2: lista de baselines R406-fix7 não convergiu.');
  }
  return next;
}

function patchR419(source) {
  const marker = '  const reasons: string[] = [];\n';
  const count = source.split(marker).length - 1;
  if (count > 1) throw new Error(`R424-fix2: razões R419 inesperadas; ocorrências=${count}`);
  return count === 1 ? source.replace(marker, '') : source;
}

const ANALYZER_STUB = `import type { AnalysisResult, AttributeKey, PositionCode, TacticalFormation, TacticalStyle } from '../../src/lib/analyzerDomain';\n\nexport type { AnalysisResult, AttributeKey, PositionCode, TacticalFormation, TacticalStyle };\nexport const ATTRIBUTE_PT = {} as Record<AttributeKey, string>;\nexport const ATTRIBUTE_INPUTS = [] as Array<{ key: AttributeKey; label: string }>;\nexport const POSITION_LABELS = [] as Array<{ code: PositionCode | 'AUTO'; label: string }>;\n`;

function patchUiStubs(source) {
  let next = source.replace(/(?:^|\n)declare module '@\/lib\/analyzer' \{[^\n]*\}\n?/, '\n');
  if (!next.includes('safeStorageRemove')) {
    const pattern = /declare module '@\/lib\/safeLocalStorage' \{([^}]*)\}/;
    const match = next.match(pattern);
    if (!match) throw new Error('R424-fix2: stub safeLocalStorage ausente.');
    const body = match[1].trimEnd();
    next = next.replace(pattern, `declare module '@/lib/safeLocalStorage' {${body} export function safeStorageRemove(key:string):boolean; }`);
  }
  return next;
}

const MFA_GATE = `  if (mfaRequired && (mfaStatus === null || !mfaStatus.protected)) {\n    const hasVerifiedFactor = Boolean(mfaStatus?.verifiedFactor);\n    return (\n      <section className="account-admin-panel luxury-panel settings-view-panel settings-final-panel admin-mfa-gate">\n        <div className="settings-panel-heading">\n          <div><p className="kicker"><ShieldCheck size={15} /> Administração protegida</p><h3>MFA obrigatório</h3><span>As ações administrativas permanecem bloqueadas até confirmar um autenticador TOTP.</span></div>\n          <span className="settings-state-pill">Fail-closed</span>\n        </div>\n        <div className="admin-mfa-security-card">\n          <ShieldCheck size={28} />\n          <div><strong>{hasVerifiedFactor ? 'Confirme o código do autenticador' : 'Ative o autenticador'}</strong><span>{hasVerifiedFactor ? 'Abra seu aplicativo TOTP e informe o código de 6 números.' : 'Escaneie o QR Code uma única vez e confirme o código antes de administrar contas.'}</span></div>\n        </div>\n        {!hasVerifiedFactor && !mfaEnrollment && <button className="elite-button" type="button" onClick={() => void startMfaEnrollment()} disabled={mfaLoading}>{mfaLoading ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />} Ativar MFA</button>}\n        {mfaEnrollment && <div className="admin-mfa-enrollment"><img src={mfaEnrollment.qrCode} alt="QR Code para ativar o MFA" /><div><strong>Chave manual</strong><code>{mfaEnrollment.secret}</code><span>Não compartilhe essa chave.</span></div></div>}\n        {(hasVerifiedFactor || mfaEnrollment) && <div className="admin-mfa-code-row"><label><span>Código de 6 números</span><input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} /></label><button className="elite-button" type="button" onClick={() => void confirmMfa()} disabled={mfaLoading || mfaCode.length !== 6}>{mfaLoading ? <Loader2 className="spin" size={17} /> : <ShieldCheck size={17} />} Confirmar MFA</button></div>}\n        {message && <p className="account-success" role="status"><CheckCircle2 size={15} /> {message}</p>}\n        {error && <p className="auth-error" role="alert"><AlertTriangle size={15} /> {error}</p>}\n        <button className="settings-diagnostic-button" type="button" onClick={() => { void refreshBackendHealth(); void refreshMfa(); }} disabled={mfaLoading}><RefreshCw size={16} /><div><strong>Verificar servidor novamente</strong><span>Confirma banco, função administrativa, perfil admin e exigência de MFA.</span></div></button>\n      </section>\n    );\n  }`;

function patchAccountPanel(source) {
  let next = source;
  next = next.replace(/^\s*const \[restoringAccountPanel, setRestoringAccountPanel\] = useState\(false\);\r?\n/m, '');
  next = next.replace('const mfaRequired = backendHealth?.mfaRequired ?? true;', 'const mfaRequired = true; // R424-fix2: administração sempre fail-closed com MFA.');
  const restoreStart = next.indexOf('async function restoreAccountCreation() {');
  if (restoreStart >= 0) {
    const runAction = next.indexOf('async function runAction(', restoreStart);
    if (runAction < 0) throw new Error('R424-fix2: fim do restoreAccountCreation não encontrado.');
    next = next.slice(0, restoreStart) + next.slice(runAction);
  }
  const gateStart = next.indexOf('  if (mfaRequired && (mfaStatus === null || !mfaStatus.protected)) {');
  const workspaceReturn = next.indexOf('\n\n  return (\n    <div className="account-admin-workspace account-admin-final-workspace">', gateStart);
  if (gateStart >= 0 && workspaceReturn >= 0) next = next.slice(0, gateStart) + MFA_GATE + next.slice(workspaceReturn);
  if (gateStart < 0 && !next.includes('<h3>MFA obrigatório</h3>')) throw new Error('R424-fix2: gate MFA do painel não encontrado.');
  next = next.replace("MFA: {backendHealth.mfaRequired ? 'obrigatório' : 'opcional até a ativação'}.", 'MFA: obrigatório.');
  if (/restore_account_creation|Restaurar criação de contas agora|restoringAccountPanel/.test(next)) {
    throw new Error('R424-fix2: bypass de MFA permaneceu no AccountAdminPanel.');
  }
  return next;
}

function patchSecurityCenter(source) {
  let next = source;
  next = next.replace(/adminMfaRequired:\s*false,/, 'adminMfaRequired: true,');
  next = next.replace(/setSettings\(data\.settings\);/, 'setSettings({ ...data.settings, allowLegacyClients: false, requireDeviceProof: true, adminMfaRequired: true });');
  next = next.replace(/setSettings\(response\.settings\);/, 'setSettings({ ...response.settings, allowLegacyClients: false, requireDeviceProof: true, adminMfaRequired: true });');
  next = next.replace(/allowLegacyClients:\s*settings\.allowLegacyClients\b,?/, 'allowLegacyClients: false,');
  next = next.replace(/adminMfaRequired:\s*settings\.adminMfaRequired\b,?/, 'adminMfaRequired: true,');
  next = next.replace('O MFA é opcional. Ative somente depois de configurar o autenticador.', 'MFA, prova do aparelho e bloqueio de clientes legados são obrigatórios em produção.');
  next = next.replace(/<label className="update-toggle"><input type="checkbox" checked=\{settings\.adminMfaRequired\}[\s\S]*?<\/label>/,
    '<label className="update-toggle"><input type="checkbox" checked readOnly disabled aria-label="MFA administrativo obrigatório" /><span><b>Exigir MFA para administração</b><small>Proteção obrigatória: ações administrativas exigem AAL2/TOTP.</small></span></label>');
  next = next.replace(/<label className="update-toggle bm2910-danger-toggle"><input type="checkbox" checked=\{settings\.allowLegacyClients\}[\s\S]*?<\/label>/,
    '<label className="update-toggle bm2910-danger-toggle"><input type="checkbox" checked={false} readOnly disabled aria-label="Clientes legados bloqueados" /><span><b>Clientes sem versão</b><small>Bloqueados em produção para impedir downgrade de segurança.</small></span></label>');
  if (/MFA é opcional|adminMfaRequired:\s*false|adminMfaRequired:\s*settings\.adminMfaRequired|allowLegacyClients:\s*settings\.allowLegacyClients/.test(next)) {
    throw new Error('R424-fix2: política administrativa ainda permite downgrade.');
  }
  return next;
}

function patchV3171(source) {
  const old = `expect(migration.includes("factor.status::text = 'verified'"), 'Migração não detecta MFA verificado.');`;
  const replacement = `expect(migration.includes('R425_MFA_FAIL_CLOSED'), 'Migração não registra a política MFA fail-closed atual.');\nexpect(migration.includes('admin_mfa_required = true'), 'Migração não mantém MFA administrativo obrigatório.');\nexpect(!migration.includes('has_verified_admin_factor'), 'Migração antiga ainda pode desligar MFA quando não há fator cadastrado.');`;
  if (source.includes(old)) return source.replace(old, replacement.trimStart());
  if (source.includes('R425_MFA_FAIL_CLOSED') && !source.includes("factor.status::text = 'verified'")) return source;
  throw new Error('R424-fix2: contrato v31.71 inesperado.');
}

const V3173 = `import fs from 'node:fs';\n\nfunction read(path) { return fs.readFileSync(path, 'utf8'); }\nfunction expect(condition, message) { if (!condition) throw new Error(message); }\n\nconst panel = read('src/components/AccountAdminPanel.tsx');\nconst auth = read('src/lib/accountAuth.ts');\nconst edge = read('supabase/functions/admin-users/index.ts');\nconst migration = read('supabase/migrations/202607280002_restore_account_creation_v3173.sql');\nconst security = read('src/modules/administration/AdministrationSecurityCenter.tsx');\nconst workflow = read('.github/workflows/deploy-supabase.yml');\n\nexpect(panel.includes('Quantidade de dias') && panel.includes('Data específica') && panel.includes('Sem vencimento'), 'Modos de validade não estão completos.');\nexpect(panel.includes('1 dia') && panel.includes('7 dias') && panel.includes('15 dias') && panel.includes('30 dias') && panel.includes('60 dias') && panel.includes('90 dias') && panel.includes('1 ano'), 'Períodos tradicionais não foram preservados.');\nexpect(panel.includes('Limite de aparelhos'), 'Controle de aparelhos ausente.');\nexpect(panel.includes('MFA obrigatório'), 'Painel administrativo não expõe o gate MFA fail-closed.');\nexpect(!panel.includes('restore_account_creation') && !panel.includes('Restaurar criação de contas agora'), 'Painel ainda expõe bypass para desligar MFA.');\nexpect(!auth.includes("| { action: 'restore_account_creation' }"), 'Cliente ainda expõe contrato inseguro de recuperação.');\nexpect(!edge.includes("action === 'restore_account_creation'"), 'Edge Function ainda expõe bypass de MFA.');\nexpect(!edge.includes('admin_mfa_required: false'), 'Servidor ainda possui fallback MFA fail-open.');\nexpect(migration.includes('R425_MFA_FAIL_CLOSED') && migration.includes('admin_mfa_required = true'), 'Migração de recuperação não foi convergida para MFA obrigatório.');\nexpect(!migration.includes('admin_mfa_required = false'), 'Migração ainda desativa MFA.');\nexpect(security.includes('adminMfaRequired: true'), 'Central de segurança não inicia fail-closed.');\nexpect(security.includes('MFA administrativo obrigatório'), 'Central de segurança ainda permite desligar MFA.');\nexpect(security.includes('Clientes legados bloqueados'), 'Central de segurança ainda permite downgrade para cliente legado.');\nexpect(workflow.includes("- 'supabase/**'"), 'Migração e Edge Function não serão publicadas automaticamente.');\n\nconsole.log('v31.73 convergida: criação/renovação preservadas sem bypass de MFA; política administrativa permanece fail-closed.');\n`;

function patchV3840(source) {
  const old = "assert.ok(plugin.includes('temporary.renameTo(target)'));";
  const replacement = `  assert.ok(plugin.includes('AtomicFile'), 'plugin deve usar android.util.AtomicFile');\n  assert.ok(plugin.includes('atomicFile.startWrite()'));\n  assert.ok(plugin.includes('atomicFile.finishWrite(stream)'));\n  assert.ok(plugin.includes('atomicFile.failWrite(stream)'));\n  assert.ok(!plugin.includes('temporary.renameTo(target)'), 'R420 não pode reintroduzir rename não atômico');`;
  if (source.includes(old)) return source.replace(old, replacement.trimStart());
  if (source.includes("plugin.includes('AtomicFile')") && !source.includes("temporary.renameTo(target)'))")) return source;
  throw new Error('R424-fix2: contrato v38.40 inesperado.');
}


function patchR151(source) {
  if (source.includes('R151/R424-fix2')) return source;
  const anchor = "console.log('R151 aprovado: toda a pasta src passou no contrato TypeScript autocontido do pacote limpo.');";
  if (!source.includes(anchor)) throw new Error('R424-fix2: âncora final R151 ausente.');
  const block = `const r424Fix2Regression = spawnSync(process.execPath, ['tests/v40-80-r424-fix2-ci-convergence-regression.mjs'], {\n  encoding: 'utf8',\n  stdio: ['ignore', 'pipe', 'pipe']\n});\nconst r424Fix2Output = \`${'${r424Fix2Regression.stdout || \'\'}'}${'${r424Fix2Regression.stderr || \'\'}'}\`.trim();\nif (r424Fix2Regression.status !== 0) {\n  console.error('R151/R424-fix2: convergência histórica/CI voltou a regredir.');\n  if (r424Fix2Output) console.error(r424Fix2Output);\n  process.exit(r424Fix2Regression.status || 1);\n}\nif (r424Fix2Output) console.log(r424Fix2Output);\n${anchor}`;
  return source.replace(anchor, block);
}

export function auditR424Fix2CiConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const issues = [];
  const repair = readOptional(root, P.repairRoutes) || '';
  const r406 = readOptional(root, P.r406Baseline) || '';
  const r419 = readOptional(root, P.r419) || '';
  const helper = readOptional(root, P.r419Helper);
  const analyzerStub = readOptional(root, P.analyzerStub) || '';
  const stubs = readOptional(root, P.uiStubs) || '';
  const panel = readOptional(root, P.accountPanel) || '';
  const security = readOptional(root, P.securityCenter) || '';
  const v3171 = readOptional(root, P.v3171) || '';
  const v3173 = readOptional(root, P.v3173) || '';
  const v3840 = readOptional(root, P.v3840) || '';
  const r151 = readOptional(root, P.r151) || '';
  if (!repair.includes('R424_FIX2_SEMANTIC_R417_CONVERGENCE') || repair.includes('stableIds') || !repair.includes('batchRemoveHistoryR417')) issues.push('repair-critical-routes ainda usa identidade interna antiga de R417.');
  if (!r406.includes(`const R417_SHA='${R417_SOURCE_SHA}';`) || !r406.includes('known=[LEGACY_SHA,REVIEWED_SHA,R416_SHA,R417_SHA]')) issues.push('R406-fix7 não reconhece baseline R417 histórico.');
  if (r419.includes('const reasons: string[] = [];')) issues.push('Gerador R419 ainda cria variável reasons não usada.');
  if (helper?.includes('const reasons: string[] = [];')) issues.push('Helper R419 materializado ainda contém variável não usada.');
  if (!analyzerStub.includes('AnalysisResult') || !analyzerStub.includes('ATTRIBUTE_PT') || !analyzerStub.includes('POSITION_LABELS')) issues.push('Fixture analyzer v31.70 incompleta.');
  if (/declare module '@\/lib\/analyzer'/.test(stubs) || !stubs.includes('safeStorageRemove')) issues.push('Stubs v31.70 ainda sombreiam analyzer ou omitem safeStorageRemove.');
  if (/restore_account_creation|Restaurar criação de contas agora|restoringAccountPanel/.test(panel) || !panel.includes('const mfaRequired = true')) issues.push('AccountAdminPanel ainda expõe downgrade de MFA.');
  if (/MFA é opcional|adminMfaRequired:\s*false|adminMfaRequired:\s*settings\.adminMfaRequired|allowLegacyClients:\s*settings\.allowLegacyClients/.test(security) || !/adminMfaRequired:\s*true/.test(security) || !/allowLegacyClients:\s*false/.test(security)) issues.push('AdministrationSecurityCenter ainda permite downgrade de segurança.');
  if (v3171.includes("factor.status::text = 'verified'") || !v3171.includes('R425_MFA_FAIL_CLOSED')) issues.push('v31.71 ainda exige política MFA antiga.');
  if (!v3173.includes('MFA administrativo obrigatório') || !v3173.includes("expect(!auth.includes(\"| { action: 'restore_account_creation' }\")") || !v3173.includes("expect(!migration.includes('admin_mfa_required = false')")) issues.push('v31.73 ainda exige bypass MFA aposentado.');
  if (v3840.includes("assert.ok(plugin.includes('temporary.renameTo(target)'))") || !v3840.includes("plugin.includes('AtomicFile')")) issues.push('v38.40 ainda exige rename legado em vez de AtomicFile.');
  if (!r151.includes('R151/R424-fix2')) issues.push('R151 ainda não executa a regressão R424-fix2.');
  return { version: R424_FIX2_CI_CONVERGENCE_VERSION, ok: issues.length === 0, issues };
}

export function applyR424Fix2CiConvergence(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;
  const apply = (relative, transform) => {
    const before = readRequired(root, relative);
    const after = transform(before);
    changed = writeChanged(root, relative, before, after, patched) || changed;
  };
  apply(P.repairRoutes, patchRepairRoutes);
  apply(P.r406Baseline, patchR406Baseline);
  apply(P.r419, patchR419);
  const helper = readOptional(root, P.r419Helper);
  if (helper !== null) changed = writeChanged(root, P.r419Helper, helper, patchR419(helper), patched) || changed;
  apply(P.analyzerStub, () => ANALYZER_STUB);
  apply(P.uiStubs, patchUiStubs);
  apply(P.accountPanel, patchAccountPanel);
  apply(P.securityCenter, patchSecurityCenter);
  apply(P.v3171, patchV3171);
  apply(P.v3173, () => V3173);
  apply(P.v3840, patchV3840);
  apply(P.r151, patchR151);
  const audit = auditR424Fix2CiConvergence(root);
  if (!audit.ok) throw new Error(`R424-fix2: convergência incompleta — ${audit.issues.join(' | ')}`);
  return { changed, patched, audit };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR424Fix2CiConvergence(process.cwd());
  console.log(result.changed ? `R424-fix2 convergiu ${result.patched.length} arquivo(s).` : 'R424-fix2: contratos já estavam convergidos.');
}
