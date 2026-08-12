import { canonicalSkillName, extractCanonicalSkillsFromText, normalizeSkillIdentity } from './officialSkillIdentity';
import { resolveRemoteSkillNameV3770 } from './remoteCatalogV3770';
import { resolveProvisionalSpecialSkillNameV4070 } from './provisionalSpecialSkillCatalogV4070';

export type SkillDiscoveryCandidateV4070 = {
  name: string;
  normalized: string;
  evidenceCount: number;
  confidence: number;
};

const REJECT_LINE = /^(?:habilidades?(?: do jogador)?|skills?|atributos?|posi[cç][oõ]es?|modelo|jogador|detalhes|dados|n[ií]vel|overall|ger|t[eé]cnico|manager|condi[cç][aã]o|progress[aã]o|impetos?|finaliza[cç][aã]o|passe|drible|velocidade|acelera[cç][aã]o|resist[eê]ncia|equil[ií]brio|salto|altura|peso|idade)$/i;
const POSITION_ONLY = /^(?:go|gk|cf|ss|cb|dmf|cmf|amf|lwf|rwf|lmf|rmf|lb|rb|ca|sa|zag|vol|mat|mlg|pe|pd|le|ld)$/i;

function cleanLine(raw: string) {
  return raw
    .replace(/[|•·]/g, ' ')
    .replace(/^\s*(?:[-–—+✓✔]+|\d+[.)])\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeSkillName(value: string) {
  const normalized = normalizeSkillIdentity(value);
  const words = normalized.split(/\s+/).filter(Boolean);
  const letters = (value.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (value.length < 5 || value.length > 52 || words.length < 1 || words.length > 6) return false;
  if (letters / Math.max(1, value.length) < 0.72 || /\d/.test(value) || POSITION_ONLY.test(normalized) || REJECT_LINE.test(normalized)) return false;
  if (canonicalSkillName(value) || resolveRemoteSkillNameV3770(value) || resolveProvisionalSpecialSkillNameV4070(value)) return false;
  if (extractCanonicalSkillsFromText(value).length) return false;
  return true;
}

function extractPassCandidates(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  return Array.from(new Map(lines.filter(looksLikeSkillName).map((line) => [normalizeSkillIdentity(line), line])).entries());
}

/**
 * Descobre um nome novo somente quando duas passagens OCR independentes da área
 * exclusiva de habilidades concordam. A descoberta é conservadora: o nome é
 * marcado como provisório, nunca recebe peso de gameplay automaticamente.
 */
export function discoverUnknownSpecialSkillsV4070(independentPassTexts: string[], sourceConfidence = 78) {
  const votes = new Map<string, { display: string; passIndexes: Set<number> }>();
  independentPassTexts.forEach((text, passIndex) => {
    for (const [key, display] of extractPassCandidates(text)) {
      const current = votes.get(key) ?? { display, passIndexes: new Set<number>() };
      current.passIndexes.add(passIndex);
      if (display.length > current.display.length) current.display = display;
      votes.set(key, current);
    }
  });
  const results: SkillDiscoveryCandidateV4070[] = [];
  for (const [normalized, vote] of votes) {
    const evidenceCount = vote.passIndexes.size;
    if (evidenceCount < 2) continue;
    results.push({
      name: vote.display,
      normalized,
      evidenceCount,
      confidence: Math.min(96, Math.round(sourceConfidence + Math.min(12, (evidenceCount - 2) * 5)))
    });
  }
  return results.sort((left, right) => right.evidenceCount - left.evidenceCount || right.confidence - left.confidence || left.name.localeCompare(right.name, 'pt-BR'));
}
