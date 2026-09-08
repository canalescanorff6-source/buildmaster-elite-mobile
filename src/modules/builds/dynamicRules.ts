import type { AnalysisResult } from '@/lib/analyzer';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import {
  canonicalSkillName,
  filterComplementaryAdditionalSkills,
  skillIdentityKey
} from '@/lib/officialSkillIdentity';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { memoryKey } from '@/modules/vault/cardHistoryStore';
import {
  resolveRemoteSkillNameV3770,
  isRemoteAdditionalSkillActiveV3770,
  sanitizeRemoteCatalogV3770,
} from '@/lib/remoteCatalogV3770';
import { DEFAULT_DYNAMIC_RULE_PACK, RULE_PACK_KEY, type DynamicRule, type DynamicRulePack } from '@/lib/remoteCatalogV3770';
export { DEFAULT_DYNAMIC_RULE_PACK, RULE_PACK_KEY, type DynamicRule, type DynamicRuleMatch, type DynamicRulePack } from '@/lib/remoteCatalogV3770';

export const CORRECTION_KEY = 'buildmaster_local_corrections_v24_29';

export type LocalCorrectionProfile = {
  blockedSkills: string[];
  promotedSkills: string[];
  blockedImpetos: string[];
  promotedImpetos: string[];
  notes: string[];
  updatedAt: string;
};

export type LocalCorrectionStore = Record<string, LocalCorrectionProfile>;

export const emptyCorrectionProfile = (): LocalCorrectionProfile => ({
  blockedSkills: [],
  promotedSkills: [],
  blockedImpetos: [],
  promotedImpetos: [],
  notes: [],
  updatedAt: new Date().toISOString()
});

export function normalizeRuleText(value: string | null | undefined) {
  return memoryKey(String(value ?? ''));
}

export function sanitizeRulePack(input: unknown): DynamicRulePack {
  const fallback = DEFAULT_DYNAMIC_RULE_PACK;
  if (!input || typeof input !== 'object') return fallback;
  const raw = input as Partial<DynamicRulePack>;
  const rules = Array.isArray(raw.rules) ? raw.rules.filter((rule): rule is DynamicRule => Boolean(rule && typeof rule === 'object' && typeof (rule as DynamicRule).id === 'string')) : [];
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString();
  return {
    version: typeof raw.version === 'string' ? raw.version : fallback.version,
    updatedAt,
    source: typeof raw.source === 'string' ? raw.source : 'Pacote importado',
    rules,
    globalBlockedSkills: Array.isArray(raw.globalBlockedSkills) ? raw.globalBlockedSkills.filter((item): item is string => typeof item === 'string') : [],
    globalBlockedImpetos: Array.isArray(raw.globalBlockedImpetos) ? raw.globalBlockedImpetos.filter((item): item is string => typeof item === 'string') : [],
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : undefined,
    gameVersion: typeof raw.gameVersion === 'string' ? raw.gameVersion : undefined,
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : undefined,
    expiresAt: typeof raw.expiresAt === 'string' ? raw.expiresAt : undefined,
    minimumAppVersion: typeof raw.minimumAppVersion === 'string' ? raw.minimumAppVersion : undefined,
    checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
    releaseNotes: Array.isArray(raw.releaseNotes) ? raw.releaseNotes.filter((item): item is string => typeof item === 'string').slice(0, 40) : [],
    catalog: sanitizeRemoteCatalogV3770(raw.catalog, typeof raw.version === 'string' ? raw.version : fallback.version, updatedAt)
  };
}

export function readDynamicRulePack(): DynamicRulePack {
  if (typeof window === 'undefined') return DEFAULT_DYNAMIC_RULE_PACK;
  try {
    const raw = readAccountStorage(RULE_PACK_KEY);
    if (!raw) return DEFAULT_DYNAMIC_RULE_PACK;
    const parsed = sanitizeRulePack(JSON.parse(raw));
    return parsed.rules.length ? parsed : DEFAULT_DYNAMIC_RULE_PACK;
  } catch {
    return DEFAULT_DYNAMIC_RULE_PACK;
  }
}

export function writeDynamicRulePack(pack: DynamicRulePack) {
  if (typeof window === 'undefined') return;
  try {
    writeAccountStorage(RULE_PACK_KEY, JSON.stringify(sanitizeRulePack(pack)));
  } catch {
    // Regras atualizáveis são opcionais e não podem travar a ficha.
  }
}

export function ruleMatchesResult(rule: DynamicRule, result: AnalysisResult) {
  const match = rule.match ?? {};
  const usagePosition = analysisUsagePositionR138(result);
  if (match.position && match.position !== 'ANY' && match.position !== usagePosition && match.position !== result.parsed.mainPosition) return false;
  if (match.objective && match.objective !== 'ANY' && match.objective !== 'COMPETITIVE') return false;
  const playstyle = normalizeRuleText(result.parsed.playstyle);
  if (match.playstyleIncludes?.length && !match.playstyleIncludes.some((item) => playstyle.includes(normalizeRuleText(item)))) return false;
  const functionText = normalizeRuleText(`${result.teamMap?.functionLabel ?? ''} ${result.buildName ?? ''}`);
  if (match.functionIncludes?.length && !match.functionIncludes.some((item) => functionText.includes(normalizeRuleText(item)))) return false;
  return true;
}

export function dynamicRulesForResult(result: AnalysisResult): LocalCorrectionProfile {
  const pack = readDynamicRulePack();
  const profile = emptyCorrectionProfile();
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  add(profile.blockedSkills, pack.globalBlockedSkills);
  add(profile.blockedImpetos, pack.globalBlockedImpetos);
  add(profile.blockedSkills, pack.catalog?.additionalSkills.filter((item) => item.status === 'deprecated').map((item) => item.name));
  add(profile.blockedSkills, pack.catalog?.specialSkills.filter((item) => item.status === 'deprecated').map((item) => item.name));
  add(profile.blockedImpetos, pack.catalog?.boosters.filter((item) => item.status === 'deprecated').map((item) => item.name));
  for (const rule of pack.rules) {
    if (!ruleMatchesResult(rule, result)) continue;
    add(profile.blockedSkills, rule.blockSkills);
    add(profile.promotedSkills, rule.promoteSkills);
    add(profile.blockedImpetos, rule.blockImpetos);
    add(profile.promotedImpetos, rule.promoteImpetos);
    if (rule.note) add(profile.notes, [rule.note]);
  }
  profile.updatedAt = pack.updatedAt;
  return profile;
}

export function readCorrectionStore(): LocalCorrectionStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = readAccountStorage(CORRECTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeCorrectionStore(store: LocalCorrectionStore) {
  if (typeof window === 'undefined') return;
  try {
    writeAccountStorage(CORRECTION_KEY, JSON.stringify(store));
  } catch {
    // Regras atualizáveis é local e não pode travar a ficha.
  }
}

export function correctionKeysForResult(result: AnalysisResult) {
  const player = memoryKey(result.parsed.playerName || 'jogador');
  const style = memoryKey(result.parsed.playstyle || 'sem-estilo');
  const usagePosition = analysisUsagePositionR138(result);
  const role = memoryKey(result.teamMap?.functionLabel || result.buildName || usagePosition);
  return {
    player: `player:${player}`,
    role: `role:${usagePosition}:${style}:${role}`
  };
}

export function mergeCorrectionProfiles(...profiles: Array<LocalCorrectionProfile | undefined>): LocalCorrectionProfile {
  const merged = emptyCorrectionProfile();
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  for (const profile of profiles) {
    if (!profile) continue;
    add(merged.blockedSkills, profile.blockedSkills);
    add(merged.promotedSkills, profile.promotedSkills);
    add(merged.blockedImpetos, profile.blockedImpetos);
    add(merged.promotedImpetos, profile.promotedImpetos);
    add(merged.notes, profile.notes?.slice(-8));
    if (profile.updatedAt > merged.updatedAt) merged.updatedAt = profile.updatedAt;
  }
  return merged;
}

export function getMergedCorrectionsForResult(result: AnalysisResult): LocalCorrectionProfile {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  const dynamicRules = dynamicRulesForResult(result);
  return mergeCorrectionProfiles(dynamicRules, store[keys.role], store[keys.player]);
}

export function upsertCorrectionForResult(result: AnalysisResult, patch: Partial<LocalCorrectionProfile>, scope: 'player' | 'role' = 'role') {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  const key = scope === 'player' ? keys.player : keys.role;
  const existing = store[key] ?? emptyCorrectionProfile();
  const next = { ...existing, updatedAt: new Date().toISOString() };
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  add(next.blockedSkills, patch.blockedSkills);
  add(next.promotedSkills, patch.promotedSkills);
  add(next.blockedImpetos, patch.blockedImpetos);
  add(next.promotedImpetos, patch.promotedImpetos);
  add(next.notes, patch.notes);
  // Se o usuário mudou de ideia, a última ação vence.
  for (const skill of patch.blockedSkills ?? []) next.promotedSkills = next.promotedSkills.filter((item) => item.toLowerCase() !== skill.toLowerCase());
  for (const skill of patch.promotedSkills ?? []) next.blockedSkills = next.blockedSkills.filter((item) => item.toLowerCase() !== skill.toLowerCase());
  for (const impeto of patch.blockedImpetos ?? []) next.promotedImpetos = next.promotedImpetos.filter((item) => item.toLowerCase() !== impeto.toLowerCase());
  for (const impeto of patch.promotedImpetos ?? []) next.blockedImpetos = next.blockedImpetos.filter((item) => item.toLowerCase() !== impeto.toLowerCase());
  store[key] = next;
  writeCorrectionStore(store);
}

export function clearCorrectionsForResult(result: AnalysisResult) {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  delete store[keys.player];
  delete store[keys.role];
  writeCorrectionStore(store);
}

export function applyLocalCorrectionsToResult(result: AnalysisResult): AnalysisResult {
  const corrections = getMergedCorrectionsForResult(result);
  const blockedSkills = new Set(corrections.blockedSkills.map(skillIdentityKey));
  const promotedSkills = corrections.promotedSkills
    .map((skill) => resolveRemoteSkillNameV3770(skill) ?? canonicalSkillName(skill))
    .filter((skill): skill is string => Boolean(skill && (OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]) || isRemoteAdditionalSkillActiveV3770(skill))));
  const blockedImpetos = new Set(corrections.blockedImpetos.map((item) => item.toLowerCase()));
  const ownedImpetos = new Set(result.parsed.impetos.filter((item) => item.active !== false).map((item) => item.name.toLowerCase()));
  const promotedImpetos = corrections.promotedImpetos.filter((name) => !ownedImpetos.has(name.toLowerCase()));
  const ownedSkills = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
  const isAllowedSkill = (skill: string) => {
    const canonical = resolveRemoteSkillNameV3770(skill) ?? canonicalSkillName(skill);
    if (!canonical || !(OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(canonical as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]) || isRemoteAdditionalSkillActiveV3770(canonical))) return false;
    const key = skillIdentityKey(canonical);
    return !ownedSkills.has(key) && !blockedSkills.has(key);
  };

  const candidates: string[] = [];
  const pushSkill = (skill: string) => {
    const canonical = resolveRemoteSkillNameV3770(skill) ?? canonicalSkillName(skill);
    if (canonical && isAllowedSkill(canonical) && !candidates.some((item) => skillIdentityKey(item) === skillIdentityKey(canonical))) candidates.push(canonical);
  };
  promotedSkills.forEach(pushSkill);
  result.recommendedSkills.forEach(pushSkill);
  result.skillRecommendations.filter((item) => item.tier !== 'evitar').forEach((item) => pushSkill(item.name));

  const recommendedSkills = filterComplementaryAdditionalSkills(candidates, result.parsed.nativeSkills, result.parsed.specialSkills, 5, result.parsed.additionalSkills ?? []);
  const existingRecommendations = result.skillRecommendations.filter((item) => !blockedSkills.has(skillIdentityKey(item.name)) && !ownedSkills.has(skillIdentityKey(item.name)));
  const promotedRecommendations = promotedSkills.map((name) => ({ name, tier: 'essencial' as const, reason: 'Priorizada por correção inteligente local nesta função/jogador.' }));
  const blockedRecommendations = corrections.blockedSkills.map((name) => ({ name, tier: 'evitar' as const, reason: 'Você marcou como não combina; o app passa a evitar automaticamente.' }));
  const skillRecommendations = [...promotedRecommendations, ...existingRecommendations, ...blockedRecommendations]
    .filter((item, index, array) => array.findIndex((other) => skillIdentityKey(other.name) === skillIdentityKey(item.name) && other.tier === item.tier) === index);

  const recommendedImpetos = [
    ...promotedImpetos.map((name) => {
      const existing = result.recommendedImpetos.find((item) => item.name.toLowerCase() === name.toLowerCase());
      return existing ? { ...existing, tier: 'ideal' as const } : { name, tier: 'ideal' as const, attributes: ['Correção local'], reason: 'Priorizado por correção inteligente local.' };
    }),
    ...result.recommendedImpetos.filter((item) => !blockedImpetos.has(item.name.toLowerCase()))
  ].filter((item, index, array) => array.findIndex((other) => other.name.toLowerCase() === item.name.toLowerCase()) === index);

  const avoidSkills = Array.from(new Set([...(result.avoidSkills ?? []), ...corrections.blockedSkills]));
  const noteSuffix = corrections.notes.length ? ' Correções locais aplicadas nesta função/jogador.' : '';

  return {
    ...result,
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos,
    avoidSkills,
    note: `${result.note}${noteSuffix}`.trim()
  };
}
