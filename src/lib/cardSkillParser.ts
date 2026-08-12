import { SPECIAL_SKILL_NAMES } from '@/modules/analysis/analyzerCatalog';
import { listProvisionalSpecialSkillsV4070, resolveProvisionalSpecialSkillNameV4070 } from './provisionalSpecialSkillCatalogV4070';
import {
  canonicalSkillName,
  canonicalizeSkillList,
  extractCanonicalSkillsFromText,
  skillIdentityKey
} from './officialSkillIdentity';

export type CardSkillInventorySource = 'explicit' | 'visible_block' | 'scan' | 'none';

export type CardSkillInventory = {
  native: string[];
  additional: string[];
  special: string[];
  unknown: string[];
  duplicates: string[];
  source: CardSkillInventorySource;
  confidence: number;
};

function cleanLine(line: string) {
  return line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseSkillContent(content: string) {
  const canonicalFromText = extractCanonicalSkillsFromText(content);
  if (canonicalFromText.length) return canonicalizeSkillList(canonicalFromText);

  const found: string[] = [];
  for (const raw of content.split(/[,;•|]/)) {
    const skill = cleanLine(raw).replace(/^[+\-–—\s]+|[+\-–—\s]+$/g, '');
    const letters = (skill.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    if (skill.length < 3 || skill.length > 54 || letters / Math.max(1, skill.length) < 0.62) continue;
    const canonical = canonicalSkillName(skill);
    const provisional = resolveProvisionalSpecialSkillNameV4070(skill);
    if (canonical) found.push(canonical);
    else if (provisional) found.push(provisional);
  }
  return canonicalizeSkillList(found);
}

function collectExplicitSkillLines(text: string) {
  const native: string[] = [];
  const additional: string[] = [];
  const special: string[] = [];
  let sawExplicit = false;

  const patterns: Array<{ kind: 'native' | 'additional' | 'special'; pattern: RegExp }> = [
    { kind: 'additional', pattern: /^\s*(?:HABILIDADES?\s+ADICIONAIS?|ADICIONAIS?\s+INSTALADAS?|HABILIDADES?\s+ADICIONADAS?|ADDITIONAL\s+SKILLS?)\s*[:=]\s*(.*)$/i },
    { kind: 'special', pattern: /^\s*(?:HABILIDADES?\s+ESPECIAIS?(?:\s+PROVIS[OÓ]RIAS?)?|HABILIDADE\s+ESPECIAL|SPECIAL\s+SKILLS?)\s*[:=]\s*(.*)$/i },
    { kind: 'native', pattern: /^\s*HABILIDADES?\s+(?:JÁ POSSUI|JA POSSUI|DO JOGADOR|NATIVAS?|CONFIRMADAS?)\s*[:=]\s*(.*)$/i }
  ];

  for (const line of text.split(/\r?\n/)) {
    for (const entry of patterns) {
      const match = line.match(entry.pattern);
      if (!match) continue;
      sawExplicit = true;
      const parsed = parseSkillContent(String(match[1] ?? '').trim());
      if (entry.kind === 'native') native.push(...parsed);
      if (entry.kind === 'additional') additional.push(...parsed);
      if (entry.kind === 'special') special.push(...parsed);
      break;
    }
  }

  return { native, additional, special, sawExplicit };
}

function scanVisibleSkills(text: string) {
  const visibleBlock = text.match(/HABILIDADES VIS[IÍ]VEIS\s*:\s*([\s\S]*?)(?=\n(?:\[|NOME|POSI[CÇ][AÃ]O|ESTILO|GER|N[IÍ]VEL|PONTOS|ATRIBUTOS|[IÍ]MPETO|IMPETO|T[EÉ]CNICO)|$)/i)?.[1] ?? '';
  const safeLines = text.split(/\r?\n/).map(cleanLine).filter(Boolean)
    .filter((line) => !/\b\d{2,3}\b/.test(line))
    .filter((line) => !/^(?:nome(?: do jogador)?|posi[cç][aã]o(?: principal)?|estilo de jogo|tipo da carta|pa[ií]s|altura|peso|idade|n[ií]vel|ger|overall|t[eé]cnico|manager)\s*[:=-]/i.test(line))
    .filter((line) => !/^(?:talento|controle de bola|drible|condu[cç][aã]o firme|passe rasteiro|passe alto|finaliza[cç][aã]o|cabe[cç](?:ada|eio)|velocidade|acelera[cç][aã]o|for[cç]a do chute|salto|contato f[ií]sico|equil[ií]brio|resist[eê]ncia)\s*[:=-]/i.test(line))
    .join('\n');
  const detectionScope = [visibleBlock, safeLines].filter(Boolean).join('\n');
  return { skills: extractCanonicalSkillsFromText(detectionScope), hasVisibleBlock: Boolean(visibleBlock.trim()) };
}

function separateCategories(nativeInput: string[], additionalInput: string[], specialInput: string[]) {
  const specialKeys = new Set([...SPECIAL_SKILL_NAMES, ...listProvisionalSpecialSkillsV4070().map((entry) => entry.name)].map(skillIdentityKey));
  const special = canonicalizeSkillList([
    ...specialInput,
    ...nativeInput.filter((skill) => specialKeys.has(skillIdentityKey(skill))),
    ...additionalInput.filter((skill) => specialKeys.has(skillIdentityKey(skill)))
  ]);
  const specialOwned = new Set(special.map(skillIdentityKey));
  const additional = canonicalizeSkillList(additionalInput.filter((skill) => !specialOwned.has(skillIdentityKey(skill))));
  const additionalOwned = new Set(additional.map(skillIdentityKey));
  const native = canonicalizeSkillList(nativeInput.filter((skill) => !specialOwned.has(skillIdentityKey(skill)) && !additionalOwned.has(skillIdentityKey(skill))));

  const categorySeen = new Map<string, number>();
  for (const skill of [...nativeInput, ...additionalInput, ...specialInput]) {
    const key = skillIdentityKey(skill);
    categorySeen.set(key, (categorySeen.get(key) ?? 0) + 1);
  }
  const duplicates = canonicalizeSkillList([...categorySeen.entries()].filter(([, count]) => count > 1).map(([key]) => key));
  return { native, additional, special, duplicates };
}

/**
 * Separa habilidades nativas, adicionais já instaladas e especiais.
 * Quando o print antigo possui apenas “HABILIDADES JÁ POSSUI”, mantém
 * compatibilidade classificando as oficiais comuns como nativas e movendo
 * habilidades especiais para a lista exclusiva correspondente.
 */
export function parseCardSkillInventory(text: string): CardSkillInventory {
  const explicit = collectExplicitSkillLines(text);
  if (explicit.sawExplicit) {
    const categories = separateCategories(explicit.native, explicit.additional, explicit.special);
    const count = categories.native.length + categories.additional.length + categories.special.length;
    return {
      ...categories,
      unknown: [],
      source: 'explicit',
      confidence: count ? 98 : 58
    };
  }

  const scanned = scanVisibleSkills(text);
  const categories = separateCategories(scanned.skills, [], []);
  const count = categories.native.length + categories.special.length;
  return {
    ...categories,
    unknown: [],
    source: scanned.hasVisibleBlock ? 'visible_block' : count ? 'scan' : 'none',
    confidence: scanned.hasVisibleBlock ? 86 : count ? 68 : 20
  };
}

/** Lê todas as habilidades confirmadas/visíveis sem misturar nomes não oficiais. */
export function detectCardSkills(text: string) {
  const inventory = parseCardSkillInventory(text);
  return canonicalizeSkillList([...inventory.native, ...inventory.additional, ...inventory.special]);
}
