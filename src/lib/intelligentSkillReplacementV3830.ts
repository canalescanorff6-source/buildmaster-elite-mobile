import type { AnalysisResult } from './analyzerDomain';
import { applyCompleteCardIntelligence } from './cardIntelligencePipeline';
import {
  canonicalizeSkillList,
  isSpecialSkillIdentity,
  skillIdentityKey
} from './officialSkillIdentity';

export const INTELLIGENT_SKILL_REPLACEMENT_VERSION = '38.30.0' as const;

export type IntelligentSkillReplacement = {
  result: AnalysisResult;
  removedSkill: string;
  replacementSkill: string | null;
  ownedSkills: string[];
};

export function markRecommendedSkillAsOwned(result: AnalysisResult, skill: string): AnalysisResult {
  const canonical = canonicalizeSkillList([skill])[0] ?? skill.trim();
  const parsed = result.parsed;
  const key = skillIdentityKey(canonical);
  const nativeSkills = isSpecialSkillIdentity(canonical)
    ? parsed.nativeSkills
    : canonicalizeSkillList([...parsed.nativeSkills, canonical]);
  const specialSkills = isSpecialSkillIdentity(canonical)
    ? canonicalizeSkillList([...parsed.specialSkills, canonical])
    : parsed.specialSkills;
  const recommendedSkills = result.recommendedSkills.filter((item) => skillIdentityKey(item) !== key);

  return {
    ...result,
    parsed: {
      ...parsed,
      nativeSkills,
      specialSkills
    },
    recommendedSkills,
    skillRecommendations: result.skillRecommendations.filter((item) => skillIdentityKey(item.name) !== key),
    recommendationExplanation: [
      `${canonical} foi confirmada como habilidade já possuída e retirada das cinco vagas adicionais.`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14)
  };
}

export function regenerateSkillAfterOwnedConfirmation(result: AnalysisResult, skill: string): IntelligentSkillReplacement {
  const canonical = canonicalizeSkillList([skill])[0] ?? skill.trim();
  const previous = result.recommendedSkills.map(skillIdentityKey);
  const marked = markRecommendedSkillAsOwned(result, canonical);
  const rebuilt = applyCompleteCardIntelligence(marked);
  const removedKey = skillIdentityKey(canonical);
  const replacementSkill = rebuilt.recommendedSkills.find((item) => {
    const key = skillIdentityKey(item);
    return key !== removedKey && !previous.includes(key);
  }) ?? null;

  return {
    result: rebuilt,
    removedSkill: canonical,
    replacementSkill,
    ownedSkills: canonicalizeSkillList([
      ...rebuilt.parsed.nativeSkills,
      ...(rebuilt.parsed.additionalSkills ?? []),
      ...rebuilt.parsed.specialSkills
    ])
  };
}
