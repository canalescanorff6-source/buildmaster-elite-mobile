import { ATTRIBUTE_LABELS, POSITION_ALIAS_ENTRIES, SKILL_PROFILES, SPECIAL_SKILL_NAMES, escapeRegex, positionAliasPattern, shortPositionPattern } from './analyzerCatalog';
import { canonicalSkillName, skillIdentityKey } from '../../lib/officialSkillIdentity';
import { RECOGNIZABLE_IMPETO_NAMES } from '../../lib/officialImpetoCatalog';
import type { Attributes, Impetus, PhysicalProfile, PlayerCondition, ParsedCard, PositionCode, PositionRatings } from '../../lib/analyzerDomain';
import { cleanLine, normalize, readNumber, textHas } from './analyzerTextUtilsR130';

/**
 * R130 — parser de evidência da carta.
 * Responsabilidade estrita: transformar texto/OCR em evidência estruturada.
 * Não escolhe build, não recomenda Top 5, não recomenda Ímpeto e não escreve o resultado final.
 */
function styleText(playstyle?: string | null) {
  return normalize(playstyle ?? '').toLowerCase();
}

const IMPETO_NAMES = [...RECOGNIZABLE_IMPETO_NAMES];
function skillKey(skill: string): string {
  return skillIdentityKey(skill);
}

function normalizedLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => cleanLine(normalize(line)).toUpperCase())
    .filter(Boolean);
}

function positionCodesInTextOrder(line: string): PositionCode[] {
  const hits: Array<{ code: PositionCode; index: number }> = [];
  for (const [code, aliases] of POSITION_ALIAS_ENTRIES) {
    let bestIndex = Number.POSITIVE_INFINITY;
    for (const alias of aliases) {
      const match = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i').exec(line);
      if (match && match.index < bestIndex) bestIndex = match.index;
    }
    if (Number.isFinite(bestIndex)) hits.push({ code, index: bestIndex });
  }
  return hits.sort((left, right) => left.index - right.index).map((item) => item.code);
}

export function detectPositions(text: string): PositionCode[] {
  const normalized = ` ${normalize(text).toUpperCase()} `;
  const detected: PositionCode[] = [];
  for (const [code, aliases] of POSITION_ALIAS_ENTRIES) {
    const pattern = positionAliasPattern(aliases);
    if (new RegExp(`\\b(${pattern})\\b`, 'i').test(normalized)) detected.push(code);
  }
  return Array.from(new Set(detected));
}

function codeFromPositionToken(token: string): PositionCode | null {
  const value = normalize(token).toUpperCase().replace(/[^A-ZÀ-Ÿ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [code, aliases] of POSITION_ALIAS_ENTRIES) {
    if (aliases.some((alias) => value === normalize(alias).toUpperCase())) return code;
  }
  return null;
}

export function extractOcrSection(text: string, label: string): string | null {
  const lines = text.split(/\r?\n/);
  const labelKey = normalize(label).toUpperCase();
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = normalize(lines[index]).toUpperCase();
    if (line.startsWith('###') && line.includes(labelKey)) {
      start = index + 1;
      break;
    }
  }
  if (start < 0) return null;
  const collected: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*###\s+/.test(line)) break;
    collected.push(line);
  }
  const block = collected.join('\n').trim();
  return block.length ? block : null;
}

export function identityScope(text: string): string {
  const identity = extractOcrSection(text, 'IDENTIDADE DA CARTA');
  const top = extractOcrSection(text, 'TOPO DA CARTA');
  const firstLines = text.split(/\r?\n/).slice(0, 70).join('\n');
  return [identity, top, firstLines].filter(Boolean).join('\n');
}


export function detectExplicitMainPosition(text: string): PositionCode | null {
  const compact = normalize(text).replace(/[:=]\s*(?=\d)/g, ' ').replace(/\r?\n/g, ' ');
  const tokenGroup = POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');
  const patterns = [
    new RegExp(`(?:posi[cç][aã]o\\s+principal|posição\\s+principal|main\\s*position|primary\\s*position|posicao)\\s*[:=\\-]?\\s*(${tokenGroup})\\b`, 'i'),
    new RegExp(`(?:overall|ovr)\\s*[:=\\-]?\\s*\\d{2,3}\\s*(${tokenGroup})\\b`, 'i')
  ];
  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      const code = codeFromPositionToken(match[1]);
      if (code) return code;
    }
  }
  return null;
}

export function detectCardBadgePosition(text: string): PositionCode | null {
  const lines = normalizedLines(text).slice(0, 60);

  const shortPattern = shortPositionPattern();
  const isPurePosition = (line: string) => {
    const direct = line.match(new RegExp(`^(${shortPattern})$`, 'i'));
    return direct?.[1] ? codeFromPositionToken(direct[1]) : null;
  };

  // Regra mais confiável para o card: overall grande e sigla da posição logo abaixo/acima.
  // Ex.: "104" + "CB" ou "107 AMF" no recorte da carta.
  for (let index = 0; index < Math.min(lines.length, 28); index += 1) {
    const line = lines[index];
    const numberMatch = line.match(/\b(8\d|9\d|10\d|11\d)\b/);
    const sameLineAfter = line.match(new RegExp(`\\b(8\\d|9\\d|10\\d|11\\d)\\s*(${shortPattern})\\b`, 'i'));
    if (sameLineAfter?.[2]) {
      const code = codeFromPositionToken(sameLineAfter[2]);
      if (code) return code;
    }
    const sameLineBefore = line.match(new RegExp(`\\b(${shortPattern})\\s*(8\\d|9\\d|10\\d|11\\d)\\b`, 'i'));
    if (sameLineBefore?.[1]) {
      const code = codeFromPositionToken(sameLineBefore[1]);
      if (code) return code;
    }

    if (numberMatch) {
      for (let offset = 1; offset <= 6; offset += 1) {
        const below = lines[index + offset];
        if (!below) continue;
        const code = isPurePosition(below);
        if (code) return code;
      }
      for (let offset = 1; offset <= 3; offset += 1) {
        const above = lines[index - offset];
        if (!above) continue;
        const code = isPurePosition(above);
        if (code) return code;
      }
    }
  }

  // Fallback: primeira sigla curta isolada no recorte de identidade. Não usa nomes longos
  // para evitar confundir "Atacante surpresa" ou menus com posição.
  for (const line of lines.slice(0, 28)) {
    const code = isPurePosition(line);
    if (code) return code;
  }

  return null;
}

export function detectPrimaryPositionFromTop(text: string): PositionCode | null {
  const lines = normalizedLines(text).slice(0, 40);
  const positionAliases = POSITION_ALIAS_ENTRIES.flatMap(([, aliases]) => aliases).map(escapeRegex).join('|');

  // Formato comum da carta recortada: overall grande e posição logo abaixo. Ex.: "104" na linha anterior e "CA" na linha atual.
  for (let index = 1; index < lines.length; index += 1) {
    const previousNumber = lines[index - 1].match(/\b(8\d|9\d|10\d|11\d)\b/);
    const currentPosition = lines[index].match(new RegExp(`^(${positionAliases})$`, 'i'));
    if (previousNumber && currentPosition) {
      const code = codeFromPositionToken(currentPosition[1]);
      if (code) return code;
    }
  }

  // Formato em uma linha só. Em grades como "CA 102 PE 100", a primeira posição da linha é a principal.
  for (const line of lines.slice(0, 25)) {
    const leadingPositionThenNumber = line.match(new RegExp(`^(${positionAliases})\\s*(8\\d|9\\d|10\\d|11\\d)\\b`, 'i'));
    if (leadingPositionThenNumber) {
      const code = codeFromPositionToken(leadingPositionThenNumber[1]);
      if (code) return code;
    }

    const leadingNumberThenPosition = line.match(new RegExp(`^(8\\d|9\\d|10\\d|11\\d)\\s*(${positionAliases})\\b`, 'i'));
    if (leadingNumberThenPosition) {
      const code = codeFromPositionToken(leadingNumberThenPosition[2]);
      if (code) return code;
    }
  }

  return null;
}

export function detectPositionRatings(text: string): PositionRatings {
  const ratings: PositionRatings = {};
  const lines = normalizedLines(text);
  const setRating = (code: PositionCode, value: number) => {
    if (value >= 40 && value <= 110 && ratings[code] === undefined) ratings[code] = value;
  };

  const ptMap = POSITION_ALIAS_ENTRIES;

  // 1) Leitura clássica na MESMA linha: CA 101, CF 101, VOL 97 etc.
  // Não colapsa o texto inteiro: uma grade em duas linhas precisa preservar colunas.
  for (const line of lines) {
    for (const [code, aliases] of ptMap) {
      for (const alias of aliases) {
        const escaped = escapeRegex(alias);
        const match = line.match(new RegExp(`\b${escaped}\s*[:\-]?\s*(\d{2,3})\b`, 'i'));
        if (match?.[1]) setRating(code, Number(match[1]));
      }
    }
  }

  // 2) Leitura quando o OCR separa UMA posição e seu número em linhas diferentes.
  // Linhas com várias posições são grades e ficam para a etapa 3.
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const orderedCodes = positionCodesInTextOrder(line);
    if (orderedCodes.length !== 1) continue;
    const code = orderedCodes[0];
    if (ratings[code] !== undefined) continue;
    const nearby = [line, lines[index + 1] ?? '', lines[index + 2] ?? ''].join(' ');
    const number = nearby.match(/\b(\d{2,3})\b/);
    if (number?.[1]) setRating(code, Number(number[1]));
  }

  // 3) Leitura de grades em duas linhas: uma linha com posições, outra com números.
  for (let index = 0; index < lines.length - 1; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];
    const positionTokens = positionCodesInTextOrder(current);
    const numbers = [...next.matchAll(/\b(\d{2,3})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 40 && value <= 110);
    if (positionTokens.length >= 2 && numbers.length >= 2) {
      positionTokens.slice(0, numbers.length).forEach((code, posIndex) => setRating(code, numbers[posIndex]));
    }
  }

  return ratings;
}

export function detectCardType(text: string) {
  const normalized = normalize(text).toLowerCase();
  if (/show\s*time/.test(normalized)) return 'Show Time';
  if (/big\s*time/.test(normalized)) return 'Big Time';
  if (/epic|epico/.test(normalized)) return 'Epic';
  if (/potw|player\s+of\s+the\s+week/.test(normalized)) return 'POTW';
  if (/featured|destaque/.test(normalized)) return 'Featured';
  if (/legend|lenda/.test(normalized)) return 'Legend';
  if (/highlight/.test(normalized)) return 'Highlight';
  if (/standard|padrao|padrão/.test(normalized)) return 'Standard';
  return 'Carta analisada';
}

export function detectSpecialTag(text: string) {
  const tags = [...SPECIAL_SKILL_NAMES, 'Duelo', 'Sem Impulso'];
  const matched = tags.find((tag) => textHas(text, tag) || (SKILL_PROFILES[tag]?.aliases ?? []).some((alias) => textHas(text, alias)));
  return matched ? canonicalSkillName(matched) : null;
}

const PLAYSTYLE_PATTERNS: Array<[RegExp, string]> = [
  [/goleiro\s+ofensivo|offensive\s+goalkeeper/i, 'Goleiro Ofensivo'],
  [/goleiro\s+defensivo|defensive\s+goalkeeper/i, 'Goleiro Defensivo'],
  [/atacante\s+surpresa|extra\s+frontman/i, 'Atacante Surpresa'],
  [/defensor\s+criativo|construtor|build\s+up/i, 'Defensor Criativo'],
  [/destruidor|destroyer/i, 'Destruidor'],
  [/lateral\s+ofensivo|offensive\s+full/i, 'Lateral Ofensivo'],
  [/lateral\s+atacante|full\s*back\s*finisher/i, 'Lateral Atacante'],
  [/perito\s+em\s+cruzamento|cross\s+specialist/i, 'Perito em Cruzamento'],
  [/lateral\s+defensivo|defensive\s+full/i, 'Lateral Defensivo'],
  [/orquestrador|orchestrator/i, 'Orquestrador'],
  [/(?:1[oº]?|primeiro)\s+volante|(?:^|\s)(ancora|âncora|anchor\s+man)(?:\s|$)/i, '1º Volante'],
  [/meia\s+vers[aá]til|box\s*to\s*box|todo\s+campo/i, 'Meia versátil'],
  [/jogador\s+de\s+infiltra[cç][aã]o|infiltra[cç][aã]o|jogador\s+sem\s+bola|hole\s+player/i, 'Infiltração'],
  [/cl[aá]ssico\s*n[oº]?\s*10|classic\s*no\.?\s*10/i, 'Clássico 10'],
  [/lateral\s+m[oó]vel|flanco\s+m[oó]vel|roaming\s+flank/i, 'Lateral Móvel'],
  [/ala\s+produtivo|ponta\s+prol[ií]fico|prolific\s+winger/i, 'Ala Produtivo'],
  [/armador\s+criativo|criador\s+de\s+jogadas|creative\s+playmaker/i, 'Armador Criativo'],
  [/atacante\s+piv[oô]|deep\s+lying\s+forward/i, 'Atacante Pivô'],
  [/(?:^|\s)piv[oô](?:\s|$)|target\s+man/i, 'Pivô'],
  [/homem\s+de\s+[aá]rea|fox\s+in\s+the\s+box/i, 'Homem de Área'],
  [/puxa\s+marca[cç][aã]o|dummy\s+runner/i, 'Puxa Marcação'],
  [/artilheiro|goal\s+poacher|atacante\s+matador/i, 'Artilheiro']
];

function findPlaystyleInText(text: string): string | null {
  const normalizedText = normalize(text);
  const found = PLAYSTYLE_PATTERNS.find(([regex]) => regex.test(normalizedText));
  return found?.[1] ?? null;
}

function findPlaystylesInText(text: string): string[] {
  const normalizedText = normalize(text);
  const found: string[] = [];
  for (const [regex, label] of PLAYSTYLE_PATTERNS) {
    if (regex.test(normalizedText) && !found.includes(label)) found.push(label);
  }
  return found;
}

export function playstyleFitsPosition(playstyle: string | null | undefined, position: PositionCode): boolean {
  const style = styleText(playstyle);
  if (!style) return true;

  const isGoalkeeper = /goleiro/.test(style);
  const isCentralDefender = /destruidor|defensor criativo|construtor|build up|atacante surpresa|extra frontman/.test(style);
  const isDefensiveMid = /destruidor|1(?:º|o)?\s*volante|primeiro volante|ancora|anchor man|orquestrador|meia versatil|box-to-box|todo campo/.test(style);
  const isCreator = /armador criativo|criador de jogadas|creative playmaker|classico n[oº]?\s*10|orquestrador|infiltracao|jogador de infiltracao|hole player/.test(style);
  const isForward = /homem de area|artilheiro|pivo|atacante pivo|target man|puxa marcacao|puxa marcação|atacante matador|goal poacher|fox in the box/.test(style);
  const isWide = /ala produtivo|lateral movel|ponta prolifico|prolific winger|flanco movel|roaming flank|perito em cruzamento|cross specialist/.test(style);
  const isFullback = /lateral ofensivo|lateral defensivo|lateral atacante|offensive full|defensive full|full\s*back/.test(style);

  if (position === 'GK') return isGoalkeeper;
  if (isGoalkeeper) return false;

  if (position === 'CB') return isCentralDefender || /1(?:º|o)?\s*volante|primeiro volante|ancora|anchor man/.test(style);
  if (position === 'DMF') return isDefensiveMid || isCentralDefender;
  if (position === 'CMF') return isDefensiveMid || isCreator || /infiltracao|jogador de infiltracao|hole player/.test(style);
  if (position === 'AMF') return isCreator || /infiltracao|jogador de infiltracao|hole player|meia versatil|box-to-box/.test(style);
  if (position === 'CF' || position === 'SS') return isForward || isCreator || /infiltracao|jogador de infiltracao|hole player/.test(style);
  if (position === 'LWF' || position === 'RWF') return isWide || isForward || /infiltracao|jogador de infiltracao|hole player/.test(style);
  if (position === 'LMF' || position === 'RMF') return isWide || isFullback || /meia versatil|box-to-box|infiltracao|jogador de infiltracao|hole player/.test(style);
  if (position === 'LB' || position === 'RB') return isFullback || /destruidor|defensor criativo|construtor|perito em cruzamento|cross specialist/.test(style);

  return true;
}

export function resolvePlaystyleForCard(rawPlaystyle: string | null, mainPosition: PositionCode, searchText: string): string | null {
  if (rawPlaystyle && playstyleFitsPosition(rawPlaystyle, mainPosition)) return rawPlaystyle;

  const candidates = findPlaystylesInText(searchText);
  const fitted = candidates.find((candidate) => playstyleFitsPosition(candidate, mainPosition));
  if (fitted) return fitted;

  // Quando a leitura local só encontrou um estilo incompatível com a posição principal
  // (ex.: ZAG lido como "Lateral defensivo" por ruído de OCR), é mais seguro não exibir
  // estilo do que trocar a identidade da carta por uma informação errada.
  return null;
}

export function detectPlaystyle(text: string) {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const topLines = lines.slice(0, 28);
  const attributeOrMenuLine = /talento|controle|drible|passe|finaliza|cabe[cç]ada|velocidade|acelera|for[cç]a|salto|contato|equil|resist|habilidades|modelo|impetos|aumenta os atributos|qualificado|posi[cç][aã]o alvo|objetivo/i;

  // Primeiro procura no topo da carta, porque o estilo verdadeiro fica logo abaixo do nome.
  // Isso evita que textos auxiliares/listas do app sejam confundidos como estilo do jogador.
  for (const line of topLines) {
    if (attributeOrMenuLine.test(line)) continue;
    const direct = findPlaystyleInText(line);
    if (direct) return direct;
  }

  // Depois tenta uma janela um pouco maior, ainda antes da zona de atributos.
  const topBlock = topLines.join('\n');
  const fromTop = findPlaystyleInText(topBlock);
  if (fromTop) return fromTop;

  // Não procura no texto inteiro para não confundir menu/lista/recomendação com o estilo real da carta.
  return null;
}

function normalizeExplicitPlayerName(value: string | null | undefined) {
  const cleaned = cleanLine(String(value ?? ''))
    .replace(/^(?:nome(?:\s+do\s+jogador)?|jogador|player)\s*[:=\-]\s*/i, '')
    .replace(/\s+(?:posi[cç][aã]o|estilo|n[ií]vel|pontos|habilidades?)\s*[:=\-].*$/i, '')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 50) return null;
  if (!/[A-Za-zÀ-ÿ]/.test(cleaned)) return null;
  if (/^(?:jogador|player|nome|n[aã]o\s+identificado)$/i.test(cleaned)) return null;
  return cleaned;
}

function explicitPlayerName(rawText: string) {
  const manualScope = rawText.match(/\[AJUSTES MANUAIS\]([\s\S]*?)\[FIM AJUSTES\]/i)?.[1] ?? '';
  const scopes = [manualScope, rawText];
  const patterns = [
    /(?:^|\n)\s*NOME\s+DO\s+JOGADOR\s*[:=\-]\s*([^\r\n]{2,50})/i,
    /(?:^|\n)\s*(?:NOME|JOGADOR|PLAYER)\s*[:=\-]\s*([^\r\n]{2,50})/i
  ];
  for (const scope of scopes) {
    if (!scope) continue;
    for (const pattern of patterns) {
      const match = scope.match(pattern);
      const normalized = normalizeExplicitPlayerName(match?.[1]);
      if (normalized) return normalized;
    }
  }
  return null;
}

export function detectName(rawText: string, fileName?: string | null) {
  // A identidade digitada pelo usuário é autoritativa. Ela precisa ser lida
  // antes de qualquer nome completo encontrado pelo OCR no restante do print.
  const explicit = explicitPlayerName(rawText);
  if (explicit) return explicit;

  const ignored = /^(show time|big time|epic|potw|featured|legend|standard|arilheiro|artilheiro|destruidor|criador|altura|peso|idade|nivel|nível|talento|controle|drible|passe|finaliza|cabe[cç]ada|velocidade|acelera|for[cç]a|salto|contato|equil[ií]brio|resist[eê]ncia|habilidades|skills|modelo|jogador|ca|cf|sa|ss|pd|pe|mat|amf|cmf|dmf|cb|gk|gol)$/i;
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .filter((line) => line.length <= 46)
    .filter((line) => /[A-Za-zÀ-ÿ]/.test(line))
    .filter((line) => !/\d{2,3}/.test(line))
    .filter((line) => !ignored.test(line));
  const strongName = lines.find((line) => /^[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+){1,3}$/.test(line));
  if (strongName) return strongName;
  if (lines[0]) return lines[0];
  if (fileName) return cleanLine(fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
  return 'Jogador não identificado';
}

export function parseAttributes(text: string): Attributes {
  const attributes: Attributes = {};
  const compact = normalize(text).replace(/[:=]\s*(?=\d)/g, ' ').replace(/\r?\n/g, ' ');
  for (const [key, patterns] of ATTRIBUTE_LABELS) {
    const value = readNumber(compact, patterns);
    if (value !== null && value >= 1 && value <= 110) attributes[key] = value;
  }
  return attributes;
}

export function parseImpetos(text: string): Impetus[] {
  const impetos: Impetus[] = [];
  const normalized = normalize(text);
  const lines = text.split(/\r?\n/).map((line) => cleanLine(line)).filter(Boolean);
  const impetoHeader = /^(?:ímpeto|impeto|booster|reforço)(?:\s+(?:adicional|selecionado|ativo|principal|do jogador|slot))?\s*:?$/i;
  const explicitPrefix = /(?:ímpeto|impeto|booster|reforço)(?:\s+(?:adicional|selecionado|ativo|principal|do jogador|slot))?\s*[:\-]?\s*/i;

  const explicitValue = normalized.match(/(?:ímpeto|impeto|booster|reforço)\s*[:\-]?\s*([a-zà-ÿ\s\-]+?)\s*\+\s*(\d+)/i);
  if (explicitValue?.[1]) impetos.push({ name: cleanLine(explicitValue[1]), value: explicitValue[2] ? Number(explicitValue[2]) : null, active: true });
  if (/sem\s+(?:ímpeto|impeto|booster|reforço)/i.test(normalized)) impetos.push({ name: 'Sem Ímpeto', value: null, active: false });

  for (const name of IMPETO_NAMES) {
    const escaped = escapeRegex(name);
    const explicitPattern = new RegExp(`${explicitPrefix.source}${escaped}(?:\\s*\\+\\s*(\\d+))?(?:\\b|$)`, 'i');
    const explicitMatch = text.match(explicitPattern);
    if (explicitMatch) {
      impetos.push({ name, value: explicitMatch[1] ? Number(explicitMatch[1]) : null, active: true });
      continue;
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const previous = lines[index - 1] ?? '';
      if (impetoHeader.test(previous) && new RegExp(`^${escaped}(?:\\s*\\+\\s*(\\d+))?$`, 'i').test(line)) {
        const value = line.match(/\+\s*(\d+)/)?.[1];
        impetos.push({ name, value: value ? Number(value) : null, active: true });
        break;
      }
    }
  }

  return Array.from(new Map(impetos.map((item) => [`${skillKey(item.name)}-${item.value ?? ''}`, item])).values());
}

export function detectImpetoSlotStatus(text: string, impetos: Impetus[]): { status: ParsedCard['evidence']['impetoSlotStatus']; evidence: string | null } {
  const normalized = normalize(text).toLowerCase();
  const noSlot = /(?:sem|não possui|nao possui)\s+(?:vaga|espaço|espaco|slot)\s+de\s+(?:ímpeto|impeto|booster)|(?:vaga|espaço|espaco|slot)\s+de\s+(?:ímpeto|impeto|booster)\s*[:\-]?\s*(?:indisponível|indisponivel|não disponível|nao disponivel)/i;
  if (noSlot.test(normalized)) return { status: 'SEM_VAGA', evidence: 'O print informa explicitamente que a carta não possui vaga/espaço de Ímpeto.' };

  const slotMarker = /(?:vaga|espaço|espaco|slot)\s+de\s+(?:ímpeto|impeto|booster)|booster\s+slot/i;
  const freeMarker = /(?:vaga|espaço|espaco|slot)[^\n]{0,40}(?:livre|vazi[oa]|disponível|disponivel)|(?:sem|nenhum)\s+(?:ímpeto|impeto|booster)\s+adicional/i;
  const occupiedMarker = /(?:ímpeto|impeto|booster)\s+adicional\s*[:\-]\s*(?!nenhum|sem|vazio|livre)[a-zà-ÿ]/i;
  const active = impetos.filter((item) => item.active !== false && !/sem\s+(?:ímpeto|impeto|booster)/i.test(item.name));

  if (occupiedMarker.test(normalized) || (slotMarker.test(normalized) && active.length >= 2)) {
    return { status: 'OCUPADO', evidence: 'A vaga de Ímpeto aparece ocupada por um Ímpeto adicional já lido.' };
  }
  if (freeMarker.test(normalized) || (slotMarker.test(normalized) && active.length <= 1)) {
    return { status: 'DISPONIVEL', evidence: 'O print indica vaga/espaço de Ímpeto disponível para criação.' };
  }
  return { status: 'NAO_CONFIRMADO', evidence: null };
}

export function parseCondition(text: string): PlayerCondition {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  const weakFreq = compact.match(/pior\s+p[eé]\s*\(?frequ[eê]ncia\)?\s*[:=-]?\s*(raramente|ocasionalmente|frequentemente|muito\s+frequentemente|baixo|m[eé]dio|alto|alta)/i)?.[1] ?? null;
  const weakAcc = compact.match(/pior\s+p[eé]\s*\(?precis[aã]o\)?\s*[:=-]?\s*(baixa|m[eé]dia|alta|muito\s+alta)/i)?.[1] ?? null;
  const form = compact.match(/condi[cç][aã]o\s+f[ií]sica\s*[:=-]?\s*(est[aá]vel|inconsistente|normal|alta|baixo|m[eé]dio)/i)?.[1] ?? null;
  const injury = compact.match(/resist[eê]ncia\s+(?:a|à)\s+les[aã]o\s*[:=-]?\s*(baixo|baixa|m[eé]dio|m[eé]dia|alto|alta)/i)?.[1] ?? null;
  return {
    weakFootFrequency: weakFreq ? cleanLine(weakFreq) : null,
    weakFootAccuracy: weakAcc ? cleanLine(weakAcc) : null,
    form: form ? cleanLine(form) : null,
    injuryResistance: injury ? cleanLine(injury) : null
  };
}

export function parsePhysicalProfile(text: string): PhysicalProfile {
  const compact = normalize(text).replace(/\r?\n/g, ' ');
  return {
    armLength: readNumber(compact, [/comprimento\s+do\s+bra[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    shoulderWidth: readNumber(compact, [/largura\s+dos\s+ombros\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    neckLength: readNumber(compact, [/comprimento\s+do\s+pesco[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    chest: readNumber(compact, [/chest\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i, /peito\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    neckSize: readNumber(compact, [/tamanho\s+do\s+pesco[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    shoulderHeight: readNumber(compact, [/altura\s+do\s+ombro\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    legLength: readNumber(compact, [/comprimento\s+da\s+perna\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    thighSize: readNumber(compact, [/tamanho\s+da\s+coxa\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    waistSize: readNumber(compact, [/tamanho\s+da\s+cintura\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    armSize: readNumber(compact, [/tamanho\s+do\s+bra[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    calfSize: readNumber(compact, [/tamanho\s+da\s+panturrilha\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    legCoverageRadius: readNumber(compact, [/raio\s+de\s+cobertura\s+das\s+pernas\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    armCoverageRadius: readNumber(compact, [/raio\s+de\s+cobertura\s+dos\s+bra[cç]os\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    jumpHeight: readNumber(compact, [/altura\s+de\s+salto\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    trunkCollision: readNumber(compact, [/colis[aã]o\s+do\s+tronco\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i]),
    baseHeight: readNumber(compact, [/altura\s+com\s+base\s+no\s+comprimento\S*\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i])
  };
}

