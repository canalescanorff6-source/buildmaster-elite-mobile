import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../modules/analysis/analyzerCatalog';

export type SkillFamilyR119 = 'dribble' | 'finishing' | 'passing' | 'defense' | 'mental' | 'goalkeeper' | 'aerial';

export type SkillVisualIdentityR119 = {
  family: SkillFamilyR119;
  code: string;
  variant: number;
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function familyForSkill(skill: string): SkillFamilyR119 {
  const s = normalize(skill);
  if (/goleiro|pegador de penalti/.test(s)) return 'goalkeeper';
  if (/cabecada|superioridade aerea/.test(s)) return 'aerial';
  if (/marcacao|interceptacao|bloqueador|carrinho|afastamento|volta para marcar/.test(s)) return 'defense';
  if (/passe|cruzamento|calcanhar|de letra|sem olhar|arremesso lateral/.test(s)) return 'passing';
  if (/chute|finalizacao|efeito|cavadinha|folha seca|precisao|penalti/.test(s)) return 'finishing';
  if (/lideranca|substituto|espirito guerreiro|malicia/.test(s)) return 'mental';
  return 'dribble';
}

function shortCode(skill: string): string {
  const words = skill.replace(/[^A-Za-zÀ-ÿ0-9° ]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'SK';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  const last = words[words.length - 1] ?? words[0];
  return `${words[0][0] ?? ''}${last.slice(-2)}`.toUpperCase();
}

const SKILL_IDENTITIES = new Map<string, SkillVisualIdentityR119>(
  OFFICIAL_ADDITIONAL_SKILL_NAMES.map((skill, index) => [normalize(skill), { family: familyForSkill(skill), code: shortCode(skill), variant: index + 1 }])
);

export function officialSkillIdentityR119(skill: string): SkillVisualIdentityR119 {
  return SKILL_IDENTITIES.get(normalize(skill)) ?? { family: familyForSkill(skill), code: shortCode(skill), variant: 99 };
}
