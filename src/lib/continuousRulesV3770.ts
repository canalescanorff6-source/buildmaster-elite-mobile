import type { AnalysisResult } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES, SPECIAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import { RECOGNIZABLE_IMPETO_NAMES } from './officialImpetoCatalog';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import {
  DEFAULT_DYNAMIC_RULE_PACK,
  sanitizeRulePack,
  writeDynamicRulePack,
  ruleMatchesResult,
  type DynamicRulePack
} from '@/modules/builds/dynamicRules';
import {
  EMPTY_REMOTE_CATALOG_V3770,
  effectiveAdditionalSkillNamesV3770,
  effectiveBoosterNamesV3770,
  effectiveSpecialSkillNamesV3770,
  normalizeRemoteCatalogIdentity,
  sanitizeRemoteCatalogV3770,
  writeRemoteCatalogV3770,
  type RemoteCatalogPatchV3770
} from './remoteCatalogV3770';

export const CONTINUOUS_RULES_V3770_VERSION = '37.70.0' as const;
export const RULE_PACK_HISTORY_V3770_KEY = 'buildmaster_rule_pack_history_v3770';
export const RULE_PACK_AUDIT_V3770_KEY = 'buildmaster_rule_pack_audit_v3770';

export type ContinuousDynamicRulePackV3770 = DynamicRulePack & {
  schemaVersion?: 3770;
  gameVersion?: string;
  publishedAt?: string;
  expiresAt?: string;
  minimumAppVersion?: string;
  checksum?: string;
  releaseNotes?: string[];
  catalog?: RemoteCatalogPatchV3770;
};

export type RulePackHistoryEntryV3770 = {
  id: string;
  version: string;
  gameVersion: string;
  source: string;
  activatedAt: string;
  updatedAt: string;
  confidence: number;
  checksum: string;
  pack: ContinuousDynamicRulePackV3770;
};

export type ContinuousRuleAlertV3770 = {
  level: 'info' | 'warning' | 'critical';
  code: string;
  title: string;
  detail: string;
};

export type ContinuousRuleAuditCheckV3770 = {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
};

export type ContinuousRulesAnalysisV3770 = {
  engineVersion: typeof CONTINUOUS_RULES_V3770_VERSION;
  packVersion: string;
  gameVersion: string;
  status: 'atual' | 'revisar' | 'bloqueado';
  freshness: 'atual' | 'envelhecendo' | 'desatualizado' | 'expirado';
  ageDays: number;
  confidence: number;
  confidenceLabel: 'alta' | 'média' | 'baixa';
  applicableRules: number;
  alerts: ContinuousRuleAlertV3770[];
  auditChecks: ContinuousRuleAuditCheckV3770[];
  catalog: {
    localAdditionalSkills: number;
    effectiveAdditionalSkills: number;
    localSpecialSkills: number;
    effectiveSpecialSkills: number;
    localBoosters: number;
    effectiveBoosters: number;
    activeRemoteItems: number;
    deprecatedItems: number;
  };
  history: RulePackHistoryEntryV3770[];
  releaseNotes: string[];
  safeguards: string[];
  computedChecksum: string;
};

function cleanText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanTextList(value: unknown, limit = 40) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))).slice(0, limit)
    : [];
}

function parseDate(value: string | undefined) {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

function semanticParts(value: string) {
  return value.split(/[^0-9]+/).filter(Boolean).slice(0, 3).map(Number);
}

function versionAtLeast(current: string, minimum: string) {
  const left = semanticParts(current);
  const right = semanticParts(minimum);
  for (let index = 0; index < Math.max(left.length, right.length, 3); index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => key !== 'checksum').sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeRulePackChecksumV3770(pack: ContinuousDynamicRulePackV3770) {
  const value = stableSerialize(sanitizeContinuousRulePackV3770(pack));
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function sanitizeContinuousRulePackV3770(input: unknown): ContinuousDynamicRulePackV3770 {
  const base = sanitizeRulePack(input);
  const raw = input && typeof input === 'object' ? input as Partial<ContinuousDynamicRulePackV3770> : {};
  const updatedAt = cleanText(raw.updatedAt, base.updatedAt) || base.updatedAt;
  const catalog = sanitizeRemoteCatalogV3770(raw.catalog, base.version, updatedAt);
  return {
    ...base,
    schemaVersion: 3770,
    gameVersion: cleanText(raw.gameVersion, 'eFootball 2026') || 'eFootball 2026',
    publishedAt: cleanText(raw.publishedAt, updatedAt) || updatedAt,
    expiresAt: cleanText(raw.expiresAt) || undefined,
    minimumAppVersion: cleanText(raw.minimumAppVersion, '38.38.0') || '38.38.0',
    checksum: cleanText(raw.checksum) || undefined,
    releaseNotes: cleanTextList(raw.releaseNotes),
    catalog
  };
}

export function readRulePackHistoryV3770(): RulePackHistoryEntryV3770[] {
  try {
    const raw = readAccountStorage(RULE_PACK_HISTORY_V3770_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RulePackHistoryEntryV3770[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.version === 'string' && item.pack).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function writeRulePackHistoryV3770(entries: RulePackHistoryEntryV3770[]) {
  writeAccountStorage(RULE_PACK_HISTORY_V3770_KEY, JSON.stringify(entries.slice(0, 12)));
}

function auditCatalog(pack: ContinuousDynamicRulePackV3770) {
  const catalog = pack.catalog ?? EMPTY_REMOTE_CATALOG_V3770;
  const all = [...catalog.additionalSkills, ...catalog.specialSkills, ...catalog.boosters];
  const names = all.map((item) => normalizeRemoteCatalogIdentity(item.name));
  const duplicateCount = names.length - new Set(names).size;
  const activeRemoteItems = all.filter((item) => item.status === 'active').length;
  const deprecatedItems = all.filter((item) => item.status === 'deprecated').length;
  return { catalog, all, duplicateCount, activeRemoteItems, deprecatedItems };
}

export function buildContinuousRulesAnalysisV3770(
  result: AnalysisResult | null,
  rawPack: DynamicRulePack | ContinuousDynamicRulePackV3770 = DEFAULT_DYNAMIC_RULE_PACK,
  history = readRulePackHistoryV3770(),
  now = new Date()
): ContinuousRulesAnalysisV3770 {
  const pack = sanitizeContinuousRulePackV3770(rawPack);
  const nowTime = now.getTime();
  const updatedTime = parseDate(pack.updatedAt);
  const expiresTime = parseDate(pack.expiresAt);
  const ageDays = updatedTime == null ? 999 : Math.max(0, Math.floor((nowTime - updatedTime) / 86_400_000));
  const freshness: ContinuousRulesAnalysisV3770['freshness'] = expiresTime != null && expiresTime < nowTime
    ? 'expirado'
    : ageDays > 90
      ? 'desatualizado'
      : ageDays > 45
        ? 'envelhecendo'
        : 'atual';
  const { catalog, all, duplicateCount, activeRemoteItems, deprecatedItems } = auditCatalog(pack);
  const computedChecksum = computeRulePackChecksumV3770(pack);
  const checksumPassed = !pack.checksum || pack.checksum === computedChecksum;
  const uniqueRuleIds = new Set(pack.rules.map((rule) => rule.id)).size === pack.rules.length;
  const minimumAppPassed = versionAtLeast(CONTINUOUS_RULES_V3770_VERSION, pack.minimumAppVersion ?? '0');
  const gameVersionPresent = Boolean(pack.gameVersion?.trim());
  const datesPassed = updatedTime != null && parseDate(pack.publishedAt) != null;
  const catalogPassed = duplicateCount === 0 && all.every((item) => Boolean(item.name.trim()));
  const rulesPassed = pack.rules.length > 0 && uniqueRuleIds;
  const sourcePassed = Boolean(pack.source?.trim());
  const checks: ContinuousRuleAuditCheckV3770[] = [
    { id: 'checksum', label: 'Integridade do pacote', passed: checksumPassed, weight: 18, detail: pack.checksum ? (checksumPassed ? 'Checksum declarado confere.' : 'Checksum declarado não confere.') : 'Sem checksum declarado; integridade calculada localmente.' },
    { id: 'dates', label: 'Datas válidas', passed: datesPassed, weight: 12, detail: datesPassed ? 'Publicação e atualização reconhecidas.' : 'Data de publicação/atualização inválida.' },
    { id: 'game-version', label: 'Versão do eFootball', passed: gameVersionPresent, weight: 14, detail: gameVersionPresent ? pack.gameVersion ?? '' : 'Versão do jogo ausente.' },
    { id: 'app-version', label: 'Compatibilidade do app', passed: minimumAppPassed, weight: 16, detail: minimumAppPassed ? `Compatível com o motor ${CONTINUOUS_RULES_V3770_VERSION}.` : `Exige app ${pack.minimumAppVersion}.` },
    { id: 'rules', label: 'Regras consistentes', passed: rulesPassed, weight: 18, detail: rulesPassed ? `${pack.rules.length} regra(s) com IDs únicos.` : 'Pacote vazio ou com IDs repetidos.' },
    { id: 'catalog', label: 'Catálogo consistente', passed: catalogPassed, weight: 14, detail: catalogPassed ? `${all.length} alteração(ões) de catálogo auditadas.` : 'Há nomes repetidos ou itens inválidos no catálogo.' },
    { id: 'source', label: 'Fonte identificada', passed: sourcePassed, weight: 8, detail: sourcePassed ? pack.source : 'Fonte ausente.' }
  ];
  const weighted = checks.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const freshnessPenalty = freshness === 'expirado' ? 35 : freshness === 'desatualizado' ? 24 : freshness === 'envelhecendo' ? 10 : 0;
  const confidence = Math.max(10, Math.min(98, weighted - freshnessPenalty + (pack.checksum && checksumPassed ? 4 : 0)));
  const alerts: ContinuousRuleAlertV3770[] = [];
  if (freshness === 'expirado') alerts.push({ level: 'critical', code: 'PACK_EXPIRED', title: 'Pacote expirado', detail: 'Não use estas regras como decisão final até receber uma versão nova.' });
  else if (freshness === 'desatualizado') alerts.push({ level: 'critical', code: 'PACK_STALE', title: 'Regras muito antigas', detail: `O pacote está há ${ageDays} dias sem atualização.` });
  else if (freshness === 'envelhecendo') alerts.push({ level: 'warning', code: 'PACK_AGING', title: 'Revisão recomendada', detail: `O pacote está há ${ageDays} dias sem atualização.` });
  if (!checksumPassed) alerts.push({ level: 'critical', code: 'CHECKSUM_MISMATCH', title: 'Integridade inválida', detail: 'O conteúdo recebido não corresponde ao checksum declarado.' });
  if (!minimumAppPassed) alerts.push({ level: 'critical', code: 'APP_TOO_OLD', title: 'App incompatível', detail: `Atualize o app antes de aplicar este pacote. Versão mínima: ${pack.minimumAppVersion}.` });
  if (!catalogPassed) alerts.push({ level: 'warning', code: 'CATALOG_INVALID', title: 'Catálogo precisa de revisão', detail: 'Existem itens repetidos ou incompletos.' });
  if (!rulesPassed) alerts.push({ level: 'critical', code: 'RULES_INVALID', title: 'Regras inválidas', detail: 'O pacote não possui regras válidas e únicas.' });
  const detectedGameVersion = result?.maxPrecision?.versionIdentity?.detectedVersion?.trim();
  if (detectedGameVersion && pack.gameVersion && !normalizeRemoteCatalogIdentity(detectedGameVersion).includes(normalizeRemoteCatalogIdentity(pack.gameVersion))) {
    alerts.push({ level: 'warning', code: 'GAME_VERSION_MISMATCH', title: 'Versões diferentes', detail: `A carta indica “${detectedGameVersion}” e o pacote declara “${pack.gameVersion}”.` });
  }
  const blocking = alerts.some((item) => item.level === 'critical');
  const status: ContinuousRulesAnalysisV3770['status'] = blocking ? 'bloqueado' : alerts.some((item) => item.level === 'warning') ? 'revisar' : 'atual';
  const effectiveAdditional = effectiveAdditionalSkillNamesV3770(OFFICIAL_ADDITIONAL_SKILL_NAMES, catalog);
  const effectiveSpecial = effectiveSpecialSkillNamesV3770(SPECIAL_SKILL_NAMES, catalog);
  const effectiveBoosters = effectiveBoosterNamesV3770(RECOGNIZABLE_IMPETO_NAMES, catalog);
  const applicableRules = result ? pack.rules.filter((rule) => ruleMatchesResult(rule, result)).length : 0;
  return {
    engineVersion: CONTINUOUS_RULES_V3770_VERSION,
    packVersion: pack.version,
    gameVersion: pack.gameVersion ?? 'Não informada',
    status,
    freshness,
    ageDays,
    confidence,
    confidenceLabel: confidence >= 82 ? 'alta' : confidence >= 64 ? 'média' : 'baixa',
    applicableRules,
    alerts,
    auditChecks: checks,
    catalog: {
      localAdditionalSkills: OFFICIAL_ADDITIONAL_SKILL_NAMES.length,
      effectiveAdditionalSkills: effectiveAdditional.length,
      localSpecialSkills: SPECIAL_SKILL_NAMES.length,
      effectiveSpecialSkills: effectiveSpecial.length,
      localBoosters: RECOGNIZABLE_IMPETO_NAMES.length,
      effectiveBoosters: effectiveBoosters.length,
      activeRemoteItems,
      deprecatedItems
    },
    history,
    releaseNotes: pack.releaseNotes ?? [],
    safeguards: [
      'Pacote crítico ou incompatível não deve substituir silenciosamente as regras locais.',
      'Cada ativação salva uma versão no histórico da conta.',
      'Itens depreciados são removidos das listas efetivas e bloqueados nas recomendações dinâmicas.',
      'A posição escolhida, o orçamento exato e as habilidades já possuídas continuam protegidos.',
      'O nível de confiança cai quando o pacote envelhece, perde integridade ou diverge da versão do jogo.'
    ],
    computedChecksum
  };
}

export function activateContinuousRulePackV3770(rawPack: DynamicRulePack | ContinuousDynamicRulePackV3770) {
  const pack = sanitizeContinuousRulePackV3770(rawPack);
  const analysis = buildContinuousRulesAnalysisV3770(null, pack, []);
  if (analysis.status === 'bloqueado') {
    return { activated: false as const, pack, analysis };
  }
  writeDynamicRulePack(pack);
  writeRemoteCatalogV3770(pack.catalog ?? EMPTY_REMOTE_CATALOG_V3770);
  const entry: RulePackHistoryEntryV3770 = {
    id: `${pack.version}:${analysis.computedChecksum}`,
    version: pack.version,
    gameVersion: pack.gameVersion ?? 'Não informada',
    source: pack.source,
    activatedAt: new Date().toISOString(),
    updatedAt: pack.updatedAt,
    confidence: analysis.confidence,
    checksum: analysis.computedChecksum,
    pack
  };
  const history = [entry, ...readRulePackHistoryV3770().filter((item) => item.id !== entry.id)].slice(0, 12);
  writeRulePackHistoryV3770(history);
  writeAccountStorage(RULE_PACK_AUDIT_V3770_KEY, JSON.stringify({ ...analysis, history: history.map(({ pack: _pack, ...item }) => item) }));
  return { activated: true as const, pack, analysis: { ...analysis, history } };
}

export function restoreRulePackVersionV3770(version: string) {
  const entry = readRulePackHistoryV3770().find((item) => item.version === version || item.id === version);
  if (!entry) return null;
  return activateContinuousRulePackV3770(entry.pack);
}

export function createRulePackTemplateV3770(): ContinuousDynamicRulePackV3770 {
  const base = sanitizeContinuousRulePackV3770(DEFAULT_DYNAMIC_RULE_PACK);
  const template: ContinuousDynamicRulePackV3770 = {
    ...base,
    version: '37.70.1-remoto',
    gameVersion: 'eFootball 2026',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 86_400_000).toISOString(),
    minimumAppVersion: '37.70.0',
    source: 'Pacote remoto oficial do proprietário',
    releaseNotes: ['Descreva as mudanças de habilidades, Boosters e regras desta versão.'],
    catalog: {
      version: '37.70.1-remoto',
      updatedAt: new Date().toISOString(),
      additionalSkills: [],
      specialSkills: [],
      boosters: []
    }
  };
  return { ...template, checksum: computeRulePackChecksumV3770(template) };
}
