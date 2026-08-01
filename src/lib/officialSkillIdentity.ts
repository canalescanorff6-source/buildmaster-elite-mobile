import {
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  SKILL_PROFILES,
  SPECIAL_SKILL_NAMES
} from '@/modules/analysis/analyzerCatalog';

export type CanonicalSkillName = keyof typeof SKILL_PROFILES;

const EXTRA_ALIASES: Record<string, CanonicalSkillName> = {
  'one touch pass': 'Passe de primeira',
  'one-touch pass': 'Passe de primeira',
  'one touch passing': 'Passe de primeira',
  'passe 1 toque': 'Passe de primeira',
  'passe de 1 toque': 'Passe de primeira',
  'passe primeiro toque': 'Passe de primeira',
  'first time shot': 'Chute de primeira',
  'first-time shot': 'Chute de primeira',
  'finalizacao de primeira': 'Chute de primeira',
  'through passing': 'Passe em profundidade',
  'through pass': 'Passe em profundidade',
  'weighted pass': 'Passe na medida',
  'pinpoint crossing': 'Cruzamento preciso',
  'outside curler': 'Curva para fora',
  'low lofted pass': 'Passe aéreo baixo',
  'low lofted passing': 'Passe aéreo baixo',
  'long range shooting': 'Precisão à distância',
  'long-range shooting': 'Precisão à distância',
  'long range curler': 'Efeito de longe',
  'long-range curler': 'Efeito de longe',
  'acrobatic finishing': 'Finalização acrobática',
  'cabeceio': 'Cabeçada',
  'cabeceada': 'Cabeçada',
  'aerial superiority': 'Superioridade aérea',
  'man marking': 'Marcação individual',
  'track back': 'Volta para marcar',
  'fighting spirit': 'Espírito guerreiro',
  'sole control': 'Controle com a sola',
  'double touch': 'Toque duplo',
  'flip flap': 'Elástico',
  'marseille turn': 'Giro 360°',
  'acrobatic clearance': 'Afastamento acrobático',
  'penalty saver': 'Pegador de pênalti',
  'gk long throw': 'Arremesso longo do goleiro',
  'gk high punt': 'Reposição alta do goleiro',
  'gk low punt': 'Reposição baixa do goleiro',
  'reposicao baixa do go': 'Reposição baixa do goleiro',
  'reposição baixa do go': 'Reposição baixa do goleiro',
  'reposicao alta do go': 'Reposição alta do goleiro',
  'reposição alta do go': 'Reposição alta do goleiro',
  'arremesso longo do go': 'Arremesso longo do goleiro',
  'pegador de penalti': 'Pegador de pênalti',
  'gk penalty saver': 'Pegador de pênalti',

  // Habilidades especiais/nativas atuais e variações usadas pelo eFHUB.
  'aerial fort': 'Fortaleza aérea',
  'forte aereo': 'Fortaleza aérea',
  'acceleration burst': 'Drible explosivo',
  'explosive dribbling': 'Drible explosivo',
  'drible explosivos': 'Drible explosivo',
  'explosao de aceleracao': 'Drible explosivo',
  'attacking surge': 'Impulso ofensivo',
  'attack surge': 'Impulso ofensivo',
  'surto ofensivo': 'Impulso ofensivo',
  'arrancada ofensiva': 'Impulso ofensivo',
  'impulso de ataque': 'Impulso ofensivo',
  'attack trigger': 'Desencadeador de ataques',
  'gatilho de ataque': 'Desencadeador de ataques',
  'blitz curler': 'Curva Blitz',
  'bullet header': 'Cabeçada fulminante',
  'edged crossing': 'Cruzamento cortante',
  'fortress': 'Fortaleza',
  'game changing pass': 'Passe decisivo',
  'game-changing pass': 'Passe decisivo',
  'gk directing defence': 'Comandante da defesa (GO)',
  'gk directing defense': 'Comandante da defesa (GO)',
  'comandante da defesa go': 'Comandante da defesa (GO)',
  'gk spirit roar': 'Rugido do goleiro',
  'long reach tackle': 'Esticada de Perna',
  'esticada de pernas': 'Esticada de Perna',
  'low screamer': 'Chute rasteiro fulminante',
  'magnetic feet': 'Pés magnéticos',
  'momentum dribbling': 'Drible de impulso',
  'phenomenal finishing': 'Finalização fenomenal',
  'phenomenal pass': 'Passe fenomenal',
  'willpower': 'Garra',
  'visionary pass': 'Passe visionário',
  'shadow hunt': 'Sombra veloz',
  'caca sombras': 'Sombra veloz',
  'caça sombras': 'Sombra veloz',
  'sombra veloz': 'Sombra veloz',

  // Habilidade regular ausente no catálogo antigo.
  'chop turn': 'Corte com virada',
  'corte seco': 'Corte com virada',
  'inside bounce': 'Finta de letra'
};

export function normalizeSkillIdentity(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(?:habilidade|skill|skills|j[aá]\s+possui|nativa|nativas|confirmada|confirmadas)\b/g, ' ')
    .replace(/[°º]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactSkillIdentity(value: string | null | undefined) {
  return normalizeSkillIdentity(value).replace(/\s+/g, '');
}

function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost
      );
    }
    for (let column = 0; column < current.length; column += 1) previous[column] = current[column];
  }
  return previous[right.length];
}

const identityIndex = new Map<string, CanonicalSkillName>();
const canonicalNames = Object.keys(SKILL_PROFILES) as CanonicalSkillName[];

for (const canonical of canonicalNames) {
  const profile = SKILL_PROFILES[canonical];
  for (const alias of [canonical, ...(profile.aliases ?? [])]) {
    const normalized = normalizeSkillIdentity(alias);
    const compact = compactSkillIdentity(alias);
    if (normalized) identityIndex.set(normalized, canonical);
    if (compact) identityIndex.set(compact, canonical);
  }
}
for (const [alias, canonical] of Object.entries(EXTRA_ALIASES)) {
  identityIndex.set(normalizeSkillIdentity(alias), canonical);
  identityIndex.set(compactSkillIdentity(alias), canonical);
}

function fuzzyCanonicalSkill(value: string): CanonicalSkillName | null {
  const compact = compactSkillIdentity(value);
  if (compact.length < 7) return null;
  let winner: { canonical: CanonicalSkillName; distance: number; ratio: number } | null = null;
  for (const [aliasKey, canonical] of identityIndex) {
    const alias = aliasKey.replace(/\s+/g, '');
    if (Math.abs(alias.length - compact.length) > 3 || alias.length < 7) continue;
    const distance = levenshtein(compact, alias);
    const ratio = 1 - distance / Math.max(compact.length, alias.length);
    const allowedDistance = compact.length >= 18 ? 3 : compact.length >= 11 ? 2 : 1;
    if (distance > allowedDistance || ratio < 0.84) continue;
    if (!winner || ratio > winner.ratio || (ratio === winner.ratio && distance < winner.distance)) {
      winner = { canonical, distance, ratio };
    }
  }
  return winner?.canonical ?? null;
}

export function canonicalSkillName(value: string | null | undefined): CanonicalSkillName | null {
  const normalized = normalizeSkillIdentity(value);
  const compact = compactSkillIdentity(value);
  if (!normalized) return null;
  return identityIndex.get(normalized) ?? identityIndex.get(compact) ?? fuzzyCanonicalSkill(normalized);
}


export function skillAliasesFor(canonical: string) {
  const resolved = canonicalSkillName(canonical);
  if (!resolved) return [];
  const aliases = [resolved, ...(SKILL_PROFILES[resolved].aliases ?? [])];
  for (const [alias, target] of Object.entries(EXTRA_ALIASES)) {
    if (target === resolved) aliases.push(alias);
  }
  return Array.from(new Set(aliases));
}



type SkillTextMatch = { canonical: CanonicalSkillName; start: number; end: number; confidence: number };

function officialAliasEntries() {
  const entries: Array<{ canonical: CanonicalSkillName; alias: string; normalized: string; tokens: number }> = [];
  for (const canonical of canonicalNames) {
    for (const alias of skillAliasesFor(canonical)) {
      const normalized = normalizeSkillIdentity(alias);
      if (!normalized || normalized.length < 4) continue;
      entries.push({ canonical, alias, normalized, tokens: normalized.split(/\s+/).length });
    }
  }
  return entries.sort((left, right) => right.normalized.length - left.normalized.length || right.tokens - left.tokens);
}

/**
 * Extrai somente nomes oficiais do texto OCR. Uma linha que contenha duas
 * cápsulas coladas (por exemplo, "Passe de primeira Passe em profundidade")
 * produz duas habilidades separadas. Fragmentos como "Ply" e "O IN A" nunca
 * são devolvidos como habilidades.
 */
export function extractCanonicalSkillsFromText(value: string | null | undefined) {
  const normalizedText = normalizeSkillIdentity(value);
  if (!normalizedText) return [] as CanonicalSkillName[];
  const padded = ` ${normalizedText} `;
  const matches: SkillTextMatch[] = [];
  const seenSpans = new Set<string>();

  for (const entry of officialAliasEntries()) {
    const needle = ` ${entry.normalized} `;
    let cursor = 0;
    while (cursor < padded.length) {
      const index = padded.indexOf(needle, cursor);
      if (index < 0) break;
      const start = index + 1;
      const end = start + entry.normalized.length;
      const spanKey = `${start}:${end}:${entry.canonical}`;
      if (!seenSpans.has(spanKey)) {
        matches.push({ canonical: entry.canonical, start, end, confidence: 1 });
        seenSpans.add(spanKey);
      }
      cursor = index + Math.max(1, needle.length - 1);
    }
  }

  // Segunda passagem conservadora para erros pequenos do OCR. Só aceita
  // aliases longos e janelas com número de palavras semelhante.
  const tokens = normalizedText.split(/\s+/).filter(Boolean);
  const offsets: number[] = [];
  let running = 0;
  for (const token of tokens) { offsets.push(running); running += token.length + 1; }
  for (const entry of officialAliasEntries()) {
    if (entry.normalized.length < 9) continue;
    for (let size = Math.max(1, entry.tokens - 1); size <= entry.tokens + 1; size += 1) {
      for (let index = 0; index + size <= tokens.length; index += 1) {
        const window = tokens.slice(index, index + size).join(' ');
        if (Math.abs(window.length - entry.normalized.length) > 4) continue;
        const compactWindow = window.replace(/\s+/g, '');
        const compactAlias = entry.normalized.replace(/\s+/g, '');
        const distance = levenshtein(compactWindow, compactAlias);
        const ratio = 1 - distance / Math.max(compactWindow.length, compactAlias.length);
        const allowed = compactAlias.length >= 18 ? 3 : compactAlias.length >= 12 ? 2 : 1;
        if (distance > allowed || ratio < 0.88) continue;
        const start = offsets[index];
        const end = start + window.length;
        if (matches.some((item) => item.canonical === entry.canonical && Math.abs(item.start - start) <= 2)) continue;
        matches.push({ canonical: entry.canonical, start, end, confidence: ratio });
      }
    }
  }

  const selected: SkillTextMatch[] = [];
  for (const match of matches.sort((left, right) => left.start - right.start || right.confidence - left.confidence || (right.end - right.start) - (left.end - left.start))) {
    const duplicate = selected.some((item) => item.canonical === match.canonical);
    if (duplicate) continue;
    selected.push(match);
  }
  return selected.sort((left, right) => left.start - right.start).map((item) => item.canonical);
}

export function isLikelySkillOcrNoise(value: string | null | undefined) {
  const raw = String(value ?? '').trim();
  const normalized = normalizeSkillIdentity(raw);
  if (!normalized) return true;
  const words = normalized.split(/\s+/).filter(Boolean);
  const letters = (raw.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (normalized.length < 5 || words.length > 8 || letters / Math.max(1, raw.length) < 0.68) return true;
  if (/^(?:ply|o in a|in a|ina|go|gk|cf|ss|cb|dmf|cmf|amf|lwf|rwf|lb|rb)$/i.test(normalized)) return true;
  return extractCanonicalSkillsFromText(raw).length === 0;
}

export function skillIdentityKey(value: string | null | undefined) {
  const canonical = canonicalSkillName(value);
  return compactSkillIdentity(canonical ?? value);
}

export function canonicalizeSkillList(skills: Array<string | null | undefined>) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of skills) {
    const cleaned = String(raw ?? '').replace(/^[+\-–—\s]+|[+\-–—\s]+$/g, '').trim();
    if (!cleaned) continue;
    const canonical = canonicalSkillName(cleaned) ?? cleaned;
    const key = skillIdentityKey(canonical);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(canonical);
  }
  return result;
}

export function buildOwnedSkillKeys(nativeSkills: string[] = [], specialSkills: string[] = []) {
  return new Set(canonicalizeSkillList([...nativeSkills, ...specialSkills]).map(skillIdentityKey));
}

export function isSkillAlreadyOwned(skill: string, nativeSkills: string[] = [], specialSkills: string[] = []) {
  return buildOwnedSkillKeys(nativeSkills, specialSkills).has(skillIdentityKey(skill));
}

export function filterComplementaryAdditionalSkills(
  candidates: string[],
  nativeSkills: string[] = [],
  specialSkills: string[] = [],
  limit = 5
) {
  const official = new Set<string>(OFFICIAL_ADDITIONAL_SKILL_NAMES);
  const owned = buildOwnedSkillKeys(nativeSkills, specialSkills);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of candidates) {
    const canonical = canonicalSkillName(raw);
    if (!canonical || !official.has(canonical)) continue;
    const key = skillIdentityKey(canonical);
    if (owned.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(canonical);
    if (result.length >= limit) break;
  }
  return result;
}

export function isOfficialAdditionalSkillIdentity(skill: string) {
  const canonical = canonicalSkillName(skill);
  return Boolean(canonical && OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(canonical as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]));
}

export function isSpecialSkillIdentity(skill: string) {
  const canonical = canonicalSkillName(skill);
  return Boolean(canonical && SPECIAL_SKILL_NAMES.includes(canonical));
}
