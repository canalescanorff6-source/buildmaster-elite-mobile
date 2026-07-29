import type { PositionCode } from '@/lib/analyzerDomain';
import { LOCAL_CARD_RULES, type LocalCardRule } from '@/lib/cardDatabase';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/lib/safeLocalStorage';
import { CANONICAL_PLAYER_PLAYSTYLES, canonicalizePlayerPlaystyle } from '@/lib/efootball2026Playstyles';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES, SPECIAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
export type { LocalCardRule } from '@/lib/cardDatabase';

export const OFFICIAL_RULE_PACK_VERSION = '2026.07.4';
export const OFFICIAL_RULE_SCHEMA = 2;
export const OFFICIAL_RULE_STORAGE_KEY = 'buildmaster_official_rule_pack_v2930';
export const OFFICIAL_RULE_HISTORY_KEY = 'buildmaster_official_rule_history_v2930';
export const OFFICIAL_RULE_AUDIT_KEY = 'buildmaster_official_rule_audit_v2940';
export const OFFICIAL_RULE_APP_VERSION = '29.40.0';

export type OfficialPositionDefinition = {
  code: PositionCode;
  label: string;
  family: 'goalkeeper' | 'defense' | 'midfield' | 'attack';
};

export type OfficialPlaystyleDefinition = {
  id: string;
  label: string;
  compatiblePositions: PositionCode[];
};

export type RulePackTrust = 'embedded' | 'checksum-only' | 'verified-signature';

export type OfficialRulePack = {
  schema: number;
  version: string;
  season: string;
  publishedAt: string;
  source: 'embedded' | 'remote' | 'imported';
  status: 'stable' | 'beta';
  publisher: { id: string; name: string };
  compatibility: { minAppVersion: string; maxAppVersion?: string | null };
  integrity: { algorithm: 'fnv1a-32'; trust: RulePackTrust; signature?: string | null };
  changelog: string[];
  checksum: string;
  positions: OfficialPositionDefinition[];
  playstyles: OfficialPlaystyleDefinition[];
  additionalSkills: string[];
  specialSkills: string[];
  cardRules: LocalCardRule[];
};

export type RulePackValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type RulePackComparison = {
  fromVersion: string;
  toVersion: string;
  addedSkills: string[];
  removedSkills: string[];
  addedSpecialSkills: string[];
  removedSpecialSkills: string[];
  addedPlaystyles: string[];
  removedPlaystyles: string[];
  changedPlaystyles: string[];
  addedCardRules: string[];
  removedCardRules: string[];
  changedCardRules: string[];
};

export type RulePackReview = {
  validation: RulePackValidation;
  comparison: RulePackComparison;
  compatible: boolean;
  downgrade: boolean;
  sameVersionDifferentContent: boolean;
  trust: RulePackTrust;
  requiresConfirmation: boolean;
  blockers: string[];
  summary: string[];
};

export type RulePackAuditEntry = {
  id: string;
  createdAt: string;
  action: 'activate' | 'rollback' | 'reset' | 'blocked-import';
  fromVersion: string;
  toVersion: string;
  reason: string;
  checksum: string;
};

const POSITION_DEFINITIONS: OfficialPositionDefinition[] = [
  { code: 'GK', label: 'Goleiro', family: 'goalkeeper' },
  { code: 'CB', label: 'Zagueiro', family: 'defense' },
  { code: 'LB', label: 'Lateral esquerdo', family: 'defense' },
  { code: 'RB', label: 'Lateral direito', family: 'defense' },
  { code: 'DMF', label: 'Volante', family: 'midfield' },
  { code: 'CMF', label: 'Meia central', family: 'midfield' },
  { code: 'LMF', label: 'Meia esquerda', family: 'midfield' },
  { code: 'RMF', label: 'Meia direita', family: 'midfield' },
  { code: 'AMF', label: 'Meia ofensivo', family: 'midfield' },
  { code: 'LWF', label: 'Ponta esquerda', family: 'attack' },
  { code: 'RWF', label: 'Ponta direita', family: 'attack' },
  { code: 'SS', label: 'Segundo atacante', family: 'attack' },
  { code: 'CF', label: 'Centroavante', family: 'attack' }
];

const PLAYSTYLE_DEFINITIONS: OfficialPlaystyleDefinition[] = [
  { id: 'goal-poacher', label: 'Artilheiro', compatiblePositions: ['CF'] },
  { id: 'dummy-runner', label: 'Puxa Marcação', compatiblePositions: ['CF', 'SS', 'AMF'] },
  { id: 'fox-in-box', label: 'Homem de Área', compatiblePositions: ['CF'] },
  { id: 'deep-lying-forward', label: 'Atacante Pivô', compatiblePositions: ['CF', 'SS'] },
  { id: 'target-man', label: 'Pivô', compatiblePositions: ['CF'] },
  { id: 'creative-playmaker', label: 'Armador Criativo', compatiblePositions: ['SS', 'LWF', 'RWF', 'AMF', 'LMF', 'RMF'] },
  { id: 'prolific-winger', label: 'Ala Produtivo', compatiblePositions: ['LWF', 'RWF'] },
  { id: 'roaming-flank', label: 'Lateral Móvel', compatiblePositions: ['LWF', 'RWF', 'LMF', 'RMF'] },
  { id: 'cross-specialist', label: 'Perito em Cruzamento', compatiblePositions: ['LWF', 'RWF', 'LMF', 'RMF'] },
  { id: 'classic-no-10', label: 'Clássico 10', compatiblePositions: ['SS', 'AMF', 'CMF'] },
  { id: 'hole-player', label: 'Infiltração', compatiblePositions: ['SS', 'AMF', 'CMF', 'LMF', 'RMF'] },
  { id: 'box-to-box', label: 'Meia versátil', compatiblePositions: ['DMF', 'CMF', 'LMF', 'RMF'] },
  { id: 'orchestrator', label: 'Orquestrador', compatiblePositions: ['DMF', 'CMF'] },
  { id: 'anchor-man', label: '1º Volante', compatiblePositions: ['DMF'] },
  { id: 'the-destroyer', label: 'Destruidor', compatiblePositions: ['DMF', 'CMF', 'CB'] },
  { id: 'build-up', label: 'Defensor Criativo', compatiblePositions: ['CB'] },
  { id: 'extra-frontman', label: 'Atacante Surpresa', compatiblePositions: ['CB'] },
  { id: 'offensive-fullback', label: 'Lateral Ofensivo', compatiblePositions: ['LB', 'RB'] },
  { id: 'fullback-finisher', label: 'Lateral Atacante', compatiblePositions: ['LB', 'RB'] },
  { id: 'defensive-fullback', label: 'Lateral Defensivo', compatiblePositions: ['LB', 'RB'] },
  { id: 'offensive-goalkeeper', label: 'Goleiro Ofensivo', compatiblePositions: ['GK'] },
  { id: 'defensive-goalkeeper', label: 'Goleiro Defensivo', compatiblePositions: ['GK'] }
];

const ADDITIONAL_SKILLS = [...OFFICIAL_ADDITIONAL_SKILL_NAMES];
const SPECIAL_SKILLS = [...SPECIAL_SKILL_NAMES];

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function checksumForObject(value: Record<string, unknown>): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function officialRuleChecksum(value: Omit<OfficialRulePack, 'checksum'> | OfficialRulePack): string {
  const source = { ...(value as OfficialRulePack) } as Record<string, unknown>;
  delete source.checksum;
  return checksumForObject(source);
}

const EMBEDDED_BASE: Omit<OfficialRulePack, 'checksum'> = {
  schema: OFFICIAL_RULE_SCHEMA,
  version: OFFICIAL_RULE_PACK_VERSION,
  season: 'eFootball 2026',
  publishedAt: '2026-07-25T00:00:00.000Z',
  source: 'embedded',
  status: 'stable',
  publisher: { id: 'buildmaster-embedded', name: 'Base controlada do BuildMaster' },
  compatibility: { minAppVersion: '29.30.0', maxAppVersion: null },
  integrity: { algorithm: 'fnv1a-32', trust: 'embedded', signature: null },
  changelog: [
    'Validação semântica de posições, estilos, habilidades e regras de cartas.',
    'Pré-visualização obrigatória antes de ativar pacotes importados.',
    'Histórico, auditoria e bloqueio de downgrade acidental.',
    'Catálogo de habilidades nativas e especiais do eFootball 2026 ampliado para o leitor eFHUB v31.79.'
  ],
  positions: POSITION_DEFINITIONS,
  playstyles: PLAYSTYLE_DEFINITIONS,
  additionalSkills: ADDITIONAL_SKILLS,
  specialSkills: SPECIAL_SKILLS,
  cardRules: LOCAL_CARD_RULES
};

export const EMBEDDED_OFFICIAL_RULE_PACK: OfficialRulePack = {
  ...EMBEDDED_BASE,
  checksum: officialRuleChecksum(EMBEDDED_BASE)
};

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
}

function parseVersion(value: string): number[] {
  return value.split(/[.+-]/).slice(0, 3).map((part) => Number(part.replace(/\D/g, '')) || 0);
}

export function compareRuleVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) > (b[index] ?? 0) ? 1 : -1;
  }
  return 0;
}

function appCompatible(pack: Pick<OfficialRulePack, 'compatibility'>, appVersion = OFFICIAL_RULE_APP_VERSION): boolean {
  if (compareRuleVersions(appVersion, pack.compatibility.minAppVersion) < 0) return false;
  if (pack.compatibility.maxAppVersion && compareRuleVersions(appVersion, pack.compatibility.maxAppVersion) > 0) return false;
  return true;
}

function legacyChecksumValid(input: Record<string, unknown>): boolean {
  const source = { ...input };
  const checksum = typeof source.checksum === 'string' ? source.checksum : '';
  delete source.checksum;
  return Boolean(checksum) && checksumForObject(source) === checksum;
}

function upgradeLegacyPack(input: Record<string, unknown>): OfficialRulePack | null {
  if (input.schema !== 1 || !legacyChecksumValid(input)) return null;
  const upgradedBase: Omit<OfficialRulePack, 'checksum'> = {
    schema: OFFICIAL_RULE_SCHEMA,
    version: String(input.version ?? OFFICIAL_RULE_PACK_VERSION),
    season: String(input.season ?? 'eFootball 2026'),
    publishedAt: String(input.publishedAt ?? new Date(0).toISOString()),
    source: input.source === 'remote' ? 'remote' : input.source === 'embedded' ? 'embedded' : 'imported',
    status: 'stable',
    publisher: { id: 'legacy-import', name: 'Pacote migrado da v29.30' },
    compatibility: { minAppVersion: '29.30.0', maxAppVersion: null },
    integrity: { algorithm: 'fnv1a-32', trust: 'checksum-only', signature: null },
    changelog: ['Pacote do esquema 1 migrado automaticamente para o esquema 2.'],
    positions: Array.isArray(input.positions) ? input.positions as OfficialPositionDefinition[] : [],
    playstyles: Array.isArray(input.playstyles) ? input.playstyles as OfficialPlaystyleDefinition[] : [],
    additionalSkills: Array.isArray(input.additionalSkills) ? input.additionalSkills as string[] : [],
    specialSkills: Array.isArray(input.specialSkills) ? input.specialSkills as string[] : [],
    cardRules: Array.isArray(input.cardRules) ? input.cardRules as LocalCardRule[] : []
  };
  return { ...upgradedBase, checksum: officialRuleChecksum(upgradedBase) };
}

export function validateOfficialRulePack(input: unknown): RulePackValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid: false, errors: ['Pacote de regras inválido.'], warnings };
  const record = input as Record<string, unknown>;
  if (record.schema === 1) {
    const migrated = upgradeLegacyPack(record);
    return migrated ? { valid: true, errors, warnings: ['Pacote antigo válido: será migrado para o esquema 2 antes da ativação.'] } : { valid: false, errors: ['Pacote legado com checksum inválido.'], warnings };
  }
  const pack = input as Partial<OfficialRulePack>;
  if (pack.schema !== OFFICIAL_RULE_SCHEMA) errors.push(`Schema incompatível: esperado ${OFFICIAL_RULE_SCHEMA}.`);
  if (!pack.version || !/^\d{4}\.\d{2}\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(pack.version)) errors.push('Versão do pacote inválida.');
  if (!pack.season?.trim()) errors.push('Temporada não informada.');
  if (!pack.publisher?.id?.trim() || !pack.publisher?.name?.trim()) errors.push('Publicador do pacote não identificado.');
  if (!pack.compatibility?.minAppVersion) errors.push('Compatibilidade mínima do app não informada.');
  if (pack.integrity?.algorithm !== 'fnv1a-32') errors.push('Algoritmo de integridade incompatível.');
  if (!Array.isArray(pack.positions) || pack.positions.length !== 13) errors.push('O pacote precisa conter as 13 posições.');
  if (!Array.isArray(pack.playstyles) || pack.playstyles.length !== CANONICAL_PLAYER_PLAYSTYLES.length) errors.push(`O pacote precisa conter os ${CANONICAL_PLAYER_PLAYSTYLES.length} estilos oficiais cadastrados.`);
  if (!Array.isArray(pack.additionalSkills) || pack.additionalSkills.length < 20) errors.push('Lista de habilidades adicionais incompleta.');
  if (!Array.isArray(pack.specialSkills)) errors.push('Lista de habilidades especiais ausente.');
  if (!Array.isArray(pack.cardRules)) errors.push('Regras de cartas ausentes.');
  if (typeof pack.checksum !== 'string' || pack.checksum !== officialRuleChecksum(pack as OfficialRulePack)) errors.push('Checksum do pacote não corresponde ao conteúdo.');

  const codes = new Set((pack.positions ?? []).map((item) => item?.code));
  if (codes.size !== 13 || POSITION_DEFINITIONS.some((item) => !codes.has(item.code))) errors.push('Há posições duplicadas, desconhecidas ou ausentes.');
  const labels = (pack.playstyles ?? []).map((item) => item?.label).filter(Boolean);
  const canonicalSet = new Set<string>(CANONICAL_PLAYER_PLAYSTYLES);
  if (labels.some((label) => !canonicalSet.has(label))) errors.push('O pacote contém estilo que não pertence à lista canônica cadastrada.');
  for (const style of pack.playstyles ?? []) {
    if (!style.id?.trim()) errors.push('Há estilo sem identificador interno.');
    if (!Array.isArray(style.compatiblePositions) || !style.compatiblePositions.length) errors.push(`O estilo ${style.label || 'sem nome'} não informa posições compatíveis.`);
    if ((style.compatiblePositions ?? []).some((code) => !codes.has(code))) errors.push(`O estilo ${style.label || 'sem nome'} contém posição incompatível.`);
  }
  if (uniqueStrings(pack.additionalSkills).length !== (pack.additionalSkills ?? []).length) errors.push('Habilidades adicionais duplicadas foram detectadas.');
  if (uniqueStrings(pack.specialSkills).length !== (pack.specialSkills ?? []).length) errors.push('Habilidades especiais duplicadas foram detectadas.');
  if (new Set((pack.cardRules ?? []).map((item) => item.id)).size !== (pack.cardRules ?? []).length) errors.push('Há identificadores duplicados nas regras de cartas.');
  if (pack.integrity?.trust === 'verified-signature' && !pack.integrity.signature) errors.push('O pacote declara assinatura verificada, mas não contém assinatura.');
  if (pack.integrity?.trust === 'checksum-only') warnings.push('O checksum detecta alterações acidentais, mas não comprova a identidade do publicador.');
  if (pack.status === 'beta') warnings.push('Este é um pacote beta e exige revisão adicional antes da ativação.');
  if (pack.compatibility && !appCompatible(pack as OfficialRulePack)) errors.push(`Pacote incompatível com o app ${OFFICIAL_RULE_APP_VERSION}.`);
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function changedIds<T extends { id: string }>(previous: T[], next: T[]): string[] {
  const old = new Map(previous.map((item) => [item.id, stableStringify(item)]));
  return next.filter((item) => old.has(item.id) && old.get(item.id) !== stableStringify(item)).map((item) => item.id);
}

export function compareOfficialRulePacks(previous: OfficialRulePack, next: OfficialRulePack): RulePackComparison {
  const diff = (left: string[], right: string[]) => right.filter((item) => !left.includes(item));
  const previousStyles = previous.playstyles.map((item) => item.label);
  const nextStyles = next.playstyles.map((item) => item.label);
  const previousRules = previous.cardRules.map((item) => item.id);
  const nextRules = next.cardRules.map((item) => item.id);
  return {
    fromVersion: previous.version,
    toVersion: next.version,
    addedSkills: diff(previous.additionalSkills, next.additionalSkills),
    removedSkills: diff(next.additionalSkills, previous.additionalSkills),
    addedSpecialSkills: diff(previous.specialSkills, next.specialSkills),
    removedSpecialSkills: diff(next.specialSkills, previous.specialSkills),
    addedPlaystyles: diff(previousStyles, nextStyles),
    removedPlaystyles: diff(nextStyles, previousStyles),
    changedPlaystyles: changedIds(previous.playstyles, next.playstyles),
    addedCardRules: diff(previousRules, nextRules),
    removedCardRules: diff(nextRules, previousRules),
    changedCardRules: changedIds(previous.cardRules, next.cardRules)
  };
}

export function sanitizeOfficialRulePack(input: unknown): OfficialRulePack | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const migrated = record.schema === 1 ? upgradeLegacyPack(record) : null;
  const candidate = migrated ?? input;
  const validation = validateOfficialRulePack(candidate);
  if (!validation.valid) return null;
  const pack = candidate as OfficialRulePack;
  return {
    ...pack,
    publisher: { ...pack.publisher },
    compatibility: { ...pack.compatibility },
    integrity: { ...pack.integrity },
    changelog: [...pack.changelog],
    positions: pack.positions.map((item) => ({ ...item })),
    playstyles: pack.playstyles.map((item) => ({ ...item, compatiblePositions: [...item.compatiblePositions] })),
    additionalSkills: [...pack.additionalSkills],
    specialSkills: [...pack.specialSkills],
    cardRules: pack.cardRules.map((item) => ({ ...item, match: [...item.match], bestPositions: [...item.bestPositions], avoidPositions: [...item.avoidPositions] }))
  };
}

export function readOfficialRulePack(): OfficialRulePack {
  const raw = safeStorageGet(OFFICIAL_RULE_STORAGE_KEY);
  if (!raw) return EMBEDDED_OFFICIAL_RULE_PACK;
  try { return sanitizeOfficialRulePack(JSON.parse(raw)) ?? EMBEDDED_OFFICIAL_RULE_PACK; }
  catch { return EMBEDDED_OFFICIAL_RULE_PACK; }
}

export function readOfficialRuleHistory(): OfficialRulePack[] {
  const raw = safeStorageGet(OFFICIAL_RULE_HISTORY_KEY);
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(sanitizeOfficialRulePack).filter((item): item is OfficialRulePack => Boolean(item)) : [];
  } catch { return []; }
}

export function readOfficialRuleAudit(): RulePackAuditEntry[] {
  try {
    const parsed: unknown = JSON.parse(safeStorageGet(OFFICIAL_RULE_AUDIT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is RulePackAuditEntry => Boolean(item && typeof item === 'object' && 'action' in item && 'createdAt' in item)) : [];
  } catch { return []; }
}

function recordAudit(entry: Omit<RulePackAuditEntry, 'id' | 'createdAt'>): void {
  const next: RulePackAuditEntry[] = [{ ...entry, id: `${Date.now()}-${entry.action}`, createdAt: new Date().toISOString() }, ...readOfficialRuleAudit()].slice(0, 30);
  safeStorageSet(OFFICIAL_RULE_AUDIT_KEY, JSON.stringify(next));
}

export function reviewOfficialRulePack(input: unknown, current = readOfficialRulePack()): RulePackReview {
  const sanitized = sanitizeOfficialRulePack(input);
  const validation = validateOfficialRulePack(input);
  const next = sanitized ?? current;
  const comparison = compareOfficialRulePacks(current, next);
  const downgrade = sanitized ? compareRuleVersions(sanitized.version, current.version) < 0 : false;
  const sameVersionDifferentContent = Boolean(sanitized && sanitized.version === current.version && sanitized.checksum !== current.checksum);
  const compatible = Boolean(sanitized && appCompatible(sanitized));
  const blockers = [...validation.errors];
  if (downgrade) blockers.push('A ativação direta de uma versão anterior foi bloqueada; use o rollback do histórico.');
  if (sameVersionDifferentContent) blockers.push('A mesma versão possui conteúdo diferente; publique um novo número de versão.');
  const changes = [
    comparison.addedSkills.length + comparison.removedSkills.length,
    comparison.addedSpecialSkills.length + comparison.removedSpecialSkills.length,
    comparison.addedPlaystyles.length + comparison.removedPlaystyles.length + comparison.changedPlaystyles.length,
    comparison.addedCardRules.length + comparison.removedCardRules.length + comparison.changedCardRules.length
  ];
  const summary = [
    `${changes[0]} alteração(ões) em habilidades adicionais.`,
    `${changes[1]} alteração(ões) em habilidades especiais.`,
    `${changes[2]} alteração(ões) em estilos e compatibilidades.`,
    `${changes[3]} alteração(ões) em regras de cartas.`
  ];
  return {
    validation: { ...validation, valid: validation.valid && blockers.length === 0, errors: [...new Set(blockers)] },
    comparison,
    compatible,
    downgrade,
    sameVersionDifferentContent,
    trust: sanitized?.integrity.trust ?? 'checksum-only',
    requiresConfirmation: Boolean(sanitized && sanitized.checksum !== current.checksum),
    blockers: [...new Set(blockers)],
    summary
  };
}

export function activateOfficialRulePack(pack: OfficialRulePack, options: { confirmed?: boolean; reason?: string } = {}): RulePackValidation {
  const current = readOfficialRulePack();
  const review = reviewOfficialRulePack(pack, current);
  if (!review.validation.valid || !options.confirmed) {
    const errors = [...review.validation.errors, ...(!options.confirmed && review.requiresConfirmation ? ['Confirmação explícita obrigatória antes da ativação.'] : [])];
    recordAudit({ action: 'blocked-import', fromVersion: current.version, toVersion: pack.version, reason: errors.join(' ') || 'Ativação cancelada.', checksum: pack.checksum });
    return { valid: false, errors: [...new Set(errors)], warnings: review.validation.warnings };
  }
  const history = [current, ...readOfficialRuleHistory().filter((item) => item.checksum !== current.checksum)].slice(0, 8);
  const historySaved = safeStorageSet(OFFICIAL_RULE_HISTORY_KEY, JSON.stringify(history));
  const packSaved = safeStorageSet(OFFICIAL_RULE_STORAGE_KEY, JSON.stringify({ ...pack, source: pack.source === 'embedded' ? 'imported' : pack.source }));
  if (!historySaved || !packSaved) return { valid: false, errors: ['Não foi possível salvar o pacote de regras neste aparelho.'], warnings: review.validation.warnings };
  recordAudit({ action: 'activate', fromVersion: current.version, toVersion: pack.version, reason: options.reason?.trim() || 'Ativação confirmada pelo usuário.', checksum: pack.checksum });
  return { valid: true, errors: [], warnings: review.validation.warnings };
}

export function rollbackOfficialRulePack(): OfficialRulePack {
  const current = readOfficialRulePack();
  const history = readOfficialRuleHistory();
  const previous = history[0] ?? EMBEDDED_OFFICIAL_RULE_PACK;
  safeStorageSet(OFFICIAL_RULE_STORAGE_KEY, JSON.stringify(previous));
  safeStorageSet(OFFICIAL_RULE_HISTORY_KEY, JSON.stringify(history.slice(1)));
  recordAudit({ action: 'rollback', fromVersion: current.version, toVersion: previous.version, reason: 'Rollback manual pelo histórico protegido.', checksum: previous.checksum });
  return previous;
}

export function resetOfficialRulePack(): OfficialRulePack {
  const current = readOfficialRulePack();
  safeStorageRemove(OFFICIAL_RULE_STORAGE_KEY);
  recordAudit({ action: 'reset', fromVersion: current.version, toVersion: EMBEDDED_OFFICIAL_RULE_PACK.version, reason: 'Base interna restaurada manualmente.', checksum: EMBEDDED_OFFICIAL_RULE_PACK.checksum });
  return EMBEDDED_OFFICIAL_RULE_PACK;
}

export function findOfficialCardRule(playerName: string, text = ''): LocalCardRule | null {
  const normalized = `${playerName} ${text}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return readOfficialRulePack().cardRules.find((rule) => rule.match.some((candidate) => normalized.includes(candidate.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))) ?? null;
}

export function isOfficialPosition(code: string): code is PositionCode {
  return readOfficialRulePack().positions.some((item) => item.code === code);
}

export function officialPlaystyleForLabel(value: string | null | undefined): OfficialPlaystyleDefinition | null {
  const canonical = canonicalizePlayerPlaystyle(value);
  if (!canonical) return null;
  return readOfficialRulePack().playstyles.find((item) => item.label === canonical) ?? null;
}
