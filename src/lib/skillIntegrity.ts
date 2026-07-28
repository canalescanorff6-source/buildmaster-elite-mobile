import type { AnalysisResult, SkillRecommendation, UnifiedSkillDecision } from './analyzerDomain';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import { buildPersonalizedSkillPlan } from './skillIntelligenceV31';
import {
  buildOwnedSkillKeys,
  canonicalizeSkillList,
  filterComplementaryAdditionalSkills,
  isOfficialAdditionalSkillIdentity,
  skillIdentityKey
} from './officialSkillIdentity';

const VERSION = '31.72-skill-integrity-1';

function uniqueBySkill<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = skillIdentityKey(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removedFromCurrent(result: AnalysisResult, finalSkills: string[]) {
  const finalKeys = new Set(finalSkills.map(skillIdentityKey));
  const owned = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills);
  const removed: string[] = [];
  const seen = new Set<string>();
  for (const raw of result.recommendedSkills) {
    const key = skillIdentityKey(raw);
    if (!key) continue;
    if (owned.has(key) || seen.has(key) || !isOfficialAdditionalSkillIdentity(raw) || !finalKeys.has(key)) removed.push(raw);
    seen.add(key);
  }
  return canonicalizeSkillList(removed);
}

function recommendationFor(skill: string, rebuilt: UnifiedSkillDecision[], current: SkillRecommendation[]) {
  const key = skillIdentityKey(skill);
  const decision = rebuilt.find((item) => skillIdentityKey(item.name) === key);
  if (decision) {
    return {
      name: decision.name,
      tier: decision.priority === 'essencial' ? 'essencial' as const : 'alternativa' as const,
      reason: `${decision.gameplayImpact} ${decision.reasons[0] ?? ''}`.trim()
    };
  }
  const previous = current.find((item) => skillIdentityKey(item.name) === key && item.tier !== 'evitar');
  return previous ?? {
    name: skill,
    tier: 'alternativa' as const,
    reason: 'Complementa a ficha final, a posição escolhida e o Estilo de Jogo sem repetir habilidade já presente.'
  };
}

export function enforceComplementarySkillIntegrity(result: AnalysisResult): AnalysisResult {
  const rebuilt = buildPersonalizedSkillPlan(result, result.training);
  const candidates = [
    ...result.recommendedSkills,
    ...rebuilt.map((item) => item.name),
    ...result.skillPriority.ordered.map((item) => item.name),
    ...result.skillRecommendations.filter((item) => item.tier !== 'evitar').map((item) => item.name)
  ];
  const recommendedSkills = filterComplementaryAdditionalSkills(
    candidates,
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    5
  );
  const ownedKeys = buildOwnedSkillKeys(result.parsed.nativeSkills, result.parsed.specialSkills);
  const recommendedKeys = new Set(recommendedSkills.map(skillIdentityKey));
  const removedDuplicates = removedFromCurrent(result, recommendedSkills);
  const recommendedItems = recommendedSkills.map((skill) => recommendationFor(skill, rebuilt, result.skillRecommendations));
  const avoidItems = uniqueBySkill(result.skillRecommendations.filter((item) => item.tier === 'evitar'))
    .filter((item) => !ownedKeys.has(skillIdentityKey(item.name)) && !recommendedKeys.has(skillIdentityKey(item.name)));
  const skillRecommendations = [...recommendedItems, ...avoidItems];
  const rebuiltMap = new Map(rebuilt.map((item) => [skillIdentityKey(item.name), item]));
  const finalUnifiedPlan = recommendedSkills
    .map((skill) => rebuiltMap.get(skillIdentityKey(skill)))
    .filter((item): item is UnifiedSkillDecision => Boolean(item));
  const ownedSkills = canonicalizeSkillList([...result.parsed.nativeSkills, ...result.parsed.specialSkills]);
  const officialOnly = recommendedSkills.every((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
  const noOwnedDuplicates = recommendedSkills.every((skill) => !ownedKeys.has(skillIdentityKey(skill)));
  const unique = new Set(recommendedSkills.map(skillIdentityKey)).size === recommendedSkills.length;
  const sourceConfirmed = ownedSkills.length > 0;
  const status = officialOnly && noOwnedDuplicates && unique && sourceConfirmed && result.validation.level !== 'blocked' ? 'approved' as const : 'review' as const;
  const skillIntegrity = {
    version: VERSION,
    status,
    ownedSkills,
    recommendedSkills,
    removedDuplicates,
    missingSlots: Math.max(0, 5 - recommendedSkills.length),
    checks: [
      officialOnly ? 'Somente nomes oficiais entraram no Top 5.' : 'Existe nome fora do catálogo oficial e a ficha precisa de revisão.',
      noOwnedDuplicates ? 'Nenhuma recomendação repete habilidade já detectada na carta.' : 'Foi encontrada sobreposição com habilidade existente.',
      unique ? 'O Top 5 não possui repetições internas.' : 'O Top 5 possui repetição interna.',
      sourceConfirmed ? `${ownedSkills.length} habilidade(s) existente(s) foram usadas no filtro antirrepetição.` : 'A lista de habilidades existentes não foi confirmada; revise o print antes de aplicar.',
      'Habilidades adicionais e Ímpetos foram avaliados em trilhas separadas.'
    ]
  };

  const specialSkillsAnalysis = {
    ...result.specialSkillsAnalysis,
    ownedOfficial: canonicalizeSkillList(result.specialSkillsAnalysis.ownedOfficial),
    missingRecommended: recommendedSkills.map((name, index) => {
      const previous = result.specialSkillsAnalysis.missingRecommended.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name));
      const decision = rebuiltMap.get(skillIdentityKey(name));
      return previous ?? {
        name,
        impact: decision?.gameplayImpact ?? 'Complementa a função escolhida sem repetir habilidade nativa.',
        score: decision?.score ?? Math.max(70, 96 - index * 4)
      };
    }),
    officialCatalogOnly: officialOnly
  };

  const skillPriority = {
    ...result.skillPriority,
    ordered: recommendedSkills.map((name, index) => {
      const previous = result.skillPriority.ordered.find((item) => skillIdentityKey(item.name) === skillIdentityKey(name));
      const decision = rebuiltMap.get(skillIdentityKey(name));
      return previous ?? {
        name,
        score: decision?.score ?? Math.max(70, 96 - index * 5),
        tier: index === 0 ? 'prioridade máxima' as const : index < 3 ? 'alta' as const : 'útil' as const,
        reasons: [
          decision?.gameplayImpact ?? 'Complementa a ficha final.',
          `Compatível com ${result.bestPosition.label}.`,
          result.parsed.playstyle ? `Considera o estilo oficial ${result.parsed.playstyle}.` : 'Sem estilo confirmado: decisão pela posição e atributos.'
        ]
      };
    }),
    officialOnly,
    context: [
      ...result.skillPriority.context.filter((item) => !/habilidades j[aá] existentes foram removidas/i.test(item)),
      'Filtro v31.72: aliases, traduções e variações de OCR também contam como habilidade já existente.'
    ]
  };

  return {
    ...result,
    recommendedSkills,
    skillRecommendations,
    avoidSkills: canonicalizeSkillList(result.avoidSkills).filter((skill) => !ownedKeys.has(skillIdentityKey(skill)) && !recommendedKeys.has(skillIdentityKey(skill))),
    specialSkillsAnalysis,
    skillPriority,
    skillIntegrity,
    unifiedIntelligence: result.unifiedIntelligence ? {
      ...result.unifiedIntelligence,
      skillPlan: finalUnifiedPlan,
      safeguards: [
        'Filtro antirrepetição canônico aplicado depois de todos os motores e correções locais.',
        ...result.unifiedIntelligence.safeguards
      ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 10)
    } : result.unifiedIntelligence,
    deepCardIntelligence: result.deepCardIntelligence ? {
      ...result.deepCardIntelligence,
      skillPlan: recommendedSkills.map((name, index) => {
        const decision = rebuiltMap.get(skillIdentityKey(name));
        return {
          name,
          priority: index === 0 ? 'máxima' as const : index < 3 ? 'alta' as const : 'útil' as const,
          reason: decision ? `${decision.gameplayImpact} ${decision.reasons[0] ?? ''}`.trim() : 'Complementa a ficha sem repetir habilidade existente.'
        };
      })
    } : result.deepCardIntelligence,
    recommendationExplanation: [
      `Integridade das habilidades: ${recommendedSkills.length} opção(ões) complementar(es), sem repetir as ${ownedSkills.length} habilidade(s) confirmada(s).`,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12)
  };
}
