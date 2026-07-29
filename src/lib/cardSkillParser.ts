import { SKILL_PROFILES } from '@/modules/analysis/analyzerCatalog';
import {
  canonicalSkillName,
  canonicalizeSkillList,
  extractCanonicalSkillsFromText
} from './officialSkillIdentity';

function cleanLine(line: string) {
  return line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function textHas(text: string, candidate: string) {
  return normalized(text).includes(normalized(candidate));
}

/** Lê apenas habilidades confirmadas/visíveis, sem capturar linhas de atributos. */
export function detectCardSkills(text: string) {
  const found: string[] = [];
  const explicitBlocks: string[] = [];
  let sawExplicitHeader = false;

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*HABILIDADES (?:JÁ POSSUI|JA POSSUI|DO JOGADOR|NATIVAS|CONFIRMADAS)[ \t]*[:=][ \t]*(.*)$/i);
    if (!match) continue;
    sawExplicitHeader = true;
    const content = String(match[1] ?? '').trim();
    if (content) explicitBlocks.push(content);
  }

  for (const content of explicitBlocks) {
    const canonicalFromText = extractCanonicalSkillsFromText(content);
    if (canonicalFromText.length) { found.push(...canonicalFromText); continue; }
    for (const raw of content.split(/[,;•|]/)) {
      const skill = cleanLine(raw).replace(/^[+\-–—\s]+|[+\-–—\s]+$/g, '');
      const letters = (skill.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
      if (skill.length < 3 || skill.length > 54 || letters / Math.max(1, skill.length) < 0.62) continue;
      found.push(canonicalSkillName(skill) ?? skill);
    }
  }
  if (sawExplicitHeader) return canonicalizeSkillList(found);

  const visibleBlock = text.match(/HABILIDADES VIS[IÍ]VEIS\s*:\s*([\s\S]*?)(?=\n(?:\[|NOME|POSI[CÇ][AÃ]O|ESTILO|GER|N[IÍ]VEL|PONTOS|ATRIBUTOS|[IÍ]MPETO|IMPETO|T[EÉ]CNICO)|$)/i)?.[1] ?? '';
  const safeLines = text.split(/\r?\n/).map(cleanLine).filter(Boolean)
    .filter((line) => !/\b\d{2,3}\b/.test(line))
    .filter((line) => !/^(?:nome(?: do jogador)?|posi[cç][aã]o(?: principal)?|estilo de jogo|tipo da carta|pa[ií]s|altura|peso|idade|n[ií]vel|ger|overall|t[eé]cnico|manager)\s*[:=-]/i.test(line))
    .filter((line) => !/^(?:talento|controle de bola|drible|condu[cç][aã]o firme|passe rasteiro|passe alto|finaliza[cç][aã]o|cabe[cç](?:ada|eio)|velocidade|acelera[cç][aã]o|for[cç]a do chute|salto|contato f[ií]sico|equil[ií]brio|resist[eê]ncia)\s*[:=-]/i.test(line))
    .join('\n');
  const detectionScope = [visibleBlock, safeLines].filter(Boolean).join('\n');
  for (const [skill, profile] of Object.entries(SKILL_PROFILES)) {
    if ([skill, ...(profile.aliases ?? [])].some((candidate) => textHas(detectionScope, candidate))) found.push(skill);
  }
  return canonicalizeSkillList(found);
}
