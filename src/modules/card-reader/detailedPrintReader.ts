import type { PremiumZoneReading } from '@/lib/premiumReading';
import { textSimilarity } from './highPrecisionOcr';

export type DetailedReadStatus = 'confirmed' | 'review' | 'missing';

export type DetailedValue = {
  label: string;
  value: string;
  numericValue?: number;
  confidence: number;
  status: DetailedReadStatus;
  source: string;
};

export type DetailedPrintReading = {
  version: string;
  format: 'complete-profile' | 'standard-card';
  identity: {
    playerName: DetailedValue | null;
    playstyle: DetailedValue | null;
    overall: DetailedValue | null;
    mainPosition: DetailedValue | null;
    height: DetailedValue | null;
    weight: DetailedValue | null;
    age: DetailedValue | null;
    level: DetailedValue | null;
  };
  condition: DetailedValue[];
  manager: { name: string | null; boosts: DetailedValue[]; confidence: number };
  impetos: DetailedValue[];
  positionRatings: DetailedValue[];
  attributes: DetailedValue[];
  progressionSequence: DetailedValue[];
  physicalModel: DetailedValue[];
  skills: DetailedValue[];
  coverage: {
    recognized: number;
    totalExpected: number;
    score: number;
    attributeCount: number;
    positionCount: number;
    skillCount: number;
    physicalCount: number;
    missing: string[];
  };
  warnings: string[];
  canonicalText: string;
};

const VERSION = '30.50-detailed-print-2';

function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[|•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function numberValue(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function rawNumberInRange(raw: string | null, min: number, max: number): string | null {
  const numeric = numberValue(raw ?? undefined);
  return numeric !== null && numeric >= min && numeric <= max ? raw : null;
}

function numericFromDecoratedValue(raw: string): number | null {
  const match = raw.match(/-?\d+(?:[,.]\d+)?/);
  return numberValue(match?.[0]);
}

function sourceText(readings: PremiumZoneReading[], keys: Array<PremiumZoneReading['key']>) {
  return readings
    .filter((reading) => keys.includes(reading.key))
    .sort((left, right) => right.confidence - left.confidence)
    .map((reading) => reading.text)
    .filter(Boolean)
    .join('\n');
}

function confidenceFromSource(readings: PremiumZoneReading[], keys: Array<PremiumZoneReading['key']>, base = 72) {
  const values = readings.filter((reading) => keys.includes(reading.key) && reading.text.trim()).map((reading) => reading.confidence);
  if (!values.length) return base;
  return Math.max(base, Math.min(98, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)));
}

function statusFor(confidence: number, strong = 82): DetailedReadStatus {
  return confidence >= strong ? 'confirmed' : confidence >= 55 ? 'review' : 'missing';
}

function makeValue(label: string, value: string, confidence: number, source: string, numeric?: number | null): DetailedValue {
  return {
    label,
    value: clean(value),
    ...(numeric !== null && numeric !== undefined ? { numericValue: numeric } : {}),
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    status: statusFor(confidence),
    source
  };
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return null;
}

const OCR_LABEL_VARIANTS: Record<string, string[]> = {
  'Talento ofensivo': ['Consciência ofensiva', 'Talento ofenslvo', 'Talento ofensivo'],
  'Controle de bola': ['Controle da bola', 'Controle de boIa'],
  'Condução firme': ['Posse de bola curta', 'Condução flrme'],
  'Passe rasteiro': ['Passe baixo', 'Passe rasteíro'],
  'Finalização': ['Finalizacao', 'Finalizaçao', 'Finalizaçâo'],
  'Cabeçada': ['Cabeceio', 'Cabecada'],
  'Talento defensivo': ['Consciência defensiva', 'Talento defenslvo'],
  'Dedicação defensiva': ['Engajamento defensivo', 'Dedicaçao defensiva'],
  'Talento de GO': ['Consciência do goleiro', 'Talento de GK'],
  'Firmeza de GO': ['Agarrar', 'Firmeza do goleiro'],
  'Defesa de GO': ['Espalmar', 'Defesa do goleiro'],
  'Reflexos de GO': ['Reflexos do goleiro'],
  'Alcance de GO': ['Alcance do goleiro'],
  'Força do chute': ['Potência do chute', 'Forca do chute'],
  'Contato físico': ['Contato fisico', 'Força física'],
  'Equilíbrio': ['Equilibrio'],
  'Resistência': ['Resistencia'],
  'Comprimento do braço': ['Comprimento do braco'],
  'Largura dos ombros': ['Largura dos ombro'],
  'Comprimento do pescoço': ['Comprimento do pescoco'],
  'Tamanho do pescoço': ['Tamanho do pescoco'],
  'Altura do ombro': ['Altura dos ombros'],
  'Comprimento da perna': ['Comprimento das pernas'],
  'Tamanho da coxa': ['Tamanho da coxa'],
  'Tamanho da cintura': ['Tamanho da cintura'],
  'Tamanho do braço': ['Tamanho do braco'],
  'Tamanho da panturrilha': ['Tamanho da panturrilha'],
  'Raio de cobertura das pernas': ['Raio cobertura pernas'],
  'Raio de cobertura dos braços': ['Raio cobertura braços', 'Raio cobertura bracos'],
  'Altura de salto': ['Altura do salto'],
  'Colisão do tronco': ['Colisao do tronco'],
  'Altura com base no comprimento': ['Altura com base no comprimen']
};

function normalizeNumericGlyphs(value: string) {
  return value
    .replace(/[Oo](?=\d|\b)/g, '0')
    .replace(/(?<=\d)[Il](?=\d|\b)/g, '1')
    .replace(/(?<=\d)[Ss](?=\d|\b)/g, '5')
    .replace(/(?<=\d)[Bb](?=\d|\b)/g, '8');
}

function fuzzyNumericValue(text: string, label: string, min: number, max: number): number | null {
  const aliases = [label, ...(OCR_LABEL_VARIANTS[label] ?? [])];
  const lines = text.split(/\r?\n/).map((line) => clean(normalizeNumericGlyphs(line))).filter(Boolean);
  let best: { value: number; score: number } | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1] ?? '';
    const numericMatches = Array.from(line.matchAll(/\b(\d{1,3}(?:[,.]\d+)?)\b/g));
    const candidates = numericMatches.length
      ? numericMatches.map((match) => ({ value: numberValue(match[1]), labelPart: clean(line.replace(match[0], ' ')) }))
      : /^\d{1,3}(?:[,.]\d+)?$/.test(next)
        ? [{ value: numberValue(next), labelPart: line }]
        : [];
    for (const candidate of candidates) {
      if (candidate.value === null || candidate.value < min || candidate.value > max) continue;
      const labelScore = Math.max(...aliases.map((alias) => textSimilarity(candidate.labelPart, alias)));
      if (labelScore < 0.67) continue;
      const score = labelScore + (numericMatches.length ? 0.05 : 0);
      if (!best || score > best.score) best = { value: candidate.value, score };
    }
  }
  return best?.value ?? null;
}

const ATTRIBUTE_ALIASES: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'Talento ofensivo', patterns: [/talento\s+ofensivo\s*[:=-]?\s*(\d{1,3})/i, /consci[eê]ncia\s+ofensiva\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Controle de bola', patterns: [/controle\s+de\s+bola\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Drible', patterns: [/(?:^|\s)drible\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Condução firme', patterns: [/condu[cç][aã]o\s+firme\s*[:=-]?\s*(\d{1,3})/i, /posse\s+de\s+bola\s+curta\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Passe rasteiro', patterns: [/passe\s+rasteiro\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Passe alto', patterns: [/passe\s+alto\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Finalização', patterns: [/finaliza[cç][aã]o\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Cabeçada', patterns: [/cabe[cç]ada\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Bola parada', patterns: [/(?:cobran[cç]a\s+de\s+)?bola\s+parada\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Curva', patterns: [/(?:^|\s)curva\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Talento defensivo', patterns: [/talento\s+defensivo\s*[:=-]?\s*(\d{1,3})/i, /consci[eê]ncia\s+defensiva\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Dedicação defensiva', patterns: [/dedica[cç][aã]o\s+defensiva\s*[:=-]?\s*(\d{1,3})/i, /engajamento\s+defensivo\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Desarme', patterns: [/desarme\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Agressividade', patterns: [/agressividade\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Talento de GO', patterns: [/talento\s+de\s+go\s*[:=-]?\s*(\d{1,3})/i, /consci[eê]ncia\s+do\s+goleiro\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Firmeza de GO', patterns: [/firmeza\s+(?:do|de)\s+go\s*[:=-]?\s*(\d{1,3})/i, /agarrar\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Defesa de GO', patterns: [/defesa\s+(?:do|de)\s+go\s*[:=-]?\s*(\d{1,3})/i, /espalmar\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Reflexos de GO', patterns: [/reflexos?\s+(?:do|de)\s+go\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Alcance de GO', patterns: [/alcance\s+(?:do|de)\s+go\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Velocidade', patterns: [/velocidade\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Aceleração', patterns: [/acelera[cç][aã]o\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Força do chute', patterns: [/for[cç]a\s+do\s+chute\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Salto', patterns: [/(?:^|\s)salto\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Contato físico', patterns: [/contato\s+f[ií]sico\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Equilíbrio', patterns: [/equil[ií]brio\s*[:=-]?\s*(\d{1,3})/i] },
  { label: 'Resistência', patterns: [/resist[eê]ncia(?!\s+a\s+les[aã]o)\s*[:=-]?\s*(\d{1,3})/i] }
];

const POSITION_CODES = ['LWF', 'CF', 'RWF', 'SS', 'AMF', 'LMF', 'CMF', 'RMF', 'DMF', 'LB', 'CB', 'RB', 'GK'] as const;

const PHYSICAL_ALIASES: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'Comprimento do braço', patterns: [/comprimento\s+do\s+bra[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Largura dos ombros', patterns: [/largura\s+dos\s+ombros\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Comprimento do pescoço', patterns: [/comprimento\s+do\s+pesco[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Chest', patterns: [/(?:^|\s)chest\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i, /peito\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Tamanho do pescoço', patterns: [/tamanho\s+do\s+pesco[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Altura do ombro', patterns: [/altura\s+do\s+ombro\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Comprimento da perna', patterns: [/comprimento\s+da\s+perna\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Tamanho da coxa', patterns: [/tamanho\s+da\s+coxa\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Tamanho da cintura', patterns: [/tamanho\s+da\s+cintura\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Tamanho do braço', patterns: [/tamanho\s+do\s+bra[cç]o\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Tamanho da panturrilha', patterns: [/tamanho\s+da\s+panturrilha\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Raio de cobertura das pernas', patterns: [/raio\s+de\s+cobertura\s+das\s+pernas\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Raio de cobertura dos braços', patterns: [/raio\s+de\s+cobertura\s+dos\s+bra[cç]os\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Altura de salto', patterns: [/altura\s+de\s+salto\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Colisão do tronco', patterns: [/colis[aã]o\s+do\s+tronco\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] },
  { label: 'Altura com base no comprimento', patterns: [/altura\s+com\s+base\s+no\s+comprimento\S*\s*[:=-]?\s*(\d+(?:[,.]\d+)?)/i] }
];

const SKILLS = [
  'Pedalada simples', 'Toque duplo', 'Elástico', 'Giro 360°', 'Chapéu', 'Corte com virada',
  'Puxada de letra', 'Finta de letra', 'Controle com a sola', 'Cabeçada', 'Efeito de longe',
  'Controle da cavadinha', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente',
  'Precisão à distância', 'Finalização acrobática', 'Toque de calcanhar', 'Chute de primeira',
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Cruzamento preciso',
  'Curva para fora', 'De letra', 'Passe sem olhar', 'Passe aéreo baixo', 'Arremesso lateral longo',
  'Especialista em pênalti', 'Malícia', 'Marcação individual', 'Volta para marcar', 'Interceptação',
  'Bloqueador', 'Superioridade aérea', 'Carrinho', 'Afastamento acrobático', 'Liderança',
  'Super substituto', 'Espírito guerreiro', 'Pegador de pênalti', 'Arremesso longo do goleiro',
  'Reposição alta do goleiro', 'Reposição baixa do goleiro', 'Garra'
] as const;

const IMPETO_NAMES = [
  'Chute', 'Cobrança de falta', 'Disputa aérea', 'Passe', 'Condução de bola', 'Técnica', 'Defesa',
  'Duelo', 'Agilidade', 'Fisicalidade', 'Goleiro', 'Instinto artilheiro', 'Precisão', 'Força',
  'Movimento sem a bola', 'Esticada de Perna', 'Sombra veloz'
] as const;

function parseNumericCatalog(text: string, catalog: Array<{ label: string; patterns: RegExp[] }>, confidence: number, source: string, min: number, max: number) {
  const values: DetailedValue[] = [];
  for (const item of catalog) {
    const raw = firstMatch(text, item.patterns);
    const exact = numberValue(raw ?? undefined);
    const numeric = exact !== null && exact >= min && exact <= max
      ? exact
      : fuzzyNumericValue(text, item.label, min, max);
    if (numeric === null || numeric < min || numeric > max) continue;
    const adjustedConfidence = exact !== null ? confidence : Math.max(58, confidence - 5);
    values.push(makeValue(item.label, String(numeric), adjustedConfidence, exact !== null ? source : `${source} • rótulo corrigido por similaridade`, numeric));
  }
  return values;
}

const POSITION_OCR_ALIASES: Record<string, (typeof POSITION_CODES)[number]> = {
  LWF: 'LWF', LWE: 'LWF', LVE: 'LWF',
  CF: 'CF', CE: 'CF',
  RWF: 'RWF', RWE: 'RWF',
  SS: 'SS',
  AMF: 'AMF', AME: 'AMF', ANF: 'AMF',
  LMF: 'LMF', LME: 'LMF',
  CMF: 'CMF', CME: 'CMF',
  RMF: 'RMF', RME: 'RMF',
  DMF: 'DMF', DME: 'DMF',
  LB: 'LB', L8: 'LB',
  CB: 'CB', C8: 'CB',
  RB: 'RB', R8: 'RB',
  GK: 'GK', CK: 'GK'
};

function parsePositionRatings(text: string, confidence: number, source: string) {
  const found = new Map<(typeof POSITION_CODES)[number], { value: number; confidence: number }>();
  const upper = normalizeNumericGlyphs(text.toUpperCase());
  for (const [rawCode, code] of Object.entries(POSITION_OCR_ALIASES)) {
    const match = upper.match(new RegExp(`\\b${rawCode}\\s*[:=-]?\\s*(\\d{2,3})\\b`, 'i'));
    const numeric = numberValue(match?.[1]);
    if (numeric === null || numeric < 40 || numeric > 110) continue;
    const current = found.get(code);
    const nextConfidence = rawCode === code ? confidence : Math.max(58, confidence - 7);
    if (!current || nextConfidence > current.confidence) found.set(code, { value: numeric, confidence: nextConfidence });
  }
  const lines = upper.split(/\r?\n/).map(clean).filter(Boolean);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const code = POSITION_OCR_ALIASES[lines[index].replace(/[^A-Z0-9]/g, '')];
    const numeric = /^\d{2,3}$/.test(lines[index + 1]) ? Number(lines[index + 1]) : null;
    if (!code || numeric === null || numeric < 40 || numeric > 110 || found.has(code)) continue;
    found.set(code, { value: numeric, confidence: Math.max(56, confidence - 9) });
  }
  return Array.from(found.entries()).map(([code, item]) => makeValue(code, String(item.value), item.confidence, source, item.value));
}

function fuzzyContainsCatalogItem(text: string, item: string, aliases: string[]) {
  const norm = normalized(text);
  if ([item, ...aliases].some((candidate) => norm.includes(normalized(candidate)))) return true;
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
  return lines.some((line) => [item, ...aliases].some((candidate) => textSimilarity(line, candidate) >= 0.82));
}

function parseSkills(text: string, confidence: number, source: string) {
  const aliases: Partial<Record<(typeof SKILLS)[number], string[]>> = {
    'Cabeçada': ['Cabeceio', 'Cabecada'],
    'Espírito guerreiro': ['Espirito guerreiro'],
    'Especialista em pênalti': ['Especialista em penalti'],
    'Passe de primeira': ['Passe primeira'],
    'Chute de primeira': ['Chute primeira'],
    'Precisão à distância': ['Precisao a distancia'],
    'Finalização acrobática': ['Finalizacao acrobatica'],
    'Controle com a sola': ['Controle sola']
  };
  return SKILLS
    .filter((skill) => fuzzyContainsCatalogItem(text, skill, aliases[skill] ?? []))
    .map((skill) => makeValue('Habilidade', skill, confidence, source));
}

function parseImpetos(text: string, confidence: number, source: string) {
  const values: DetailedValue[] = [];
  const lines = normalizeNumericGlyphs(text).split(/\r?\n|[|•]/).map(clean).filter(Boolean);
  for (const name of IMPETO_NAMES) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`(?:^|[\\n|•])\\s*${escaped}\\s*\\+\\s*(\\d+)`, 'i'))
      ?? text.match(new RegExp(`\\b${escaped}\\s*\\+\\s*(\\d+)`, 'i'));
    let numeric = numberValue(match?.[1]);
    let fuzzy = false;
    if (numeric === null) {
      for (const line of lines) {
        const lineMatch = line.match(/(.+?)\s*\+\s*(\d{1,2})/);
        if (!lineMatch || textSimilarity(lineMatch[1], name) < 0.76) continue;
        numeric = Number(lineMatch[2]);
        fuzzy = true;
        break;
      }
    }
    if (numeric === null || numeric < 1 || numeric > 5) continue;
    values.push(makeValue('Ímpeto', `${name} +${numeric}`, fuzzy ? Math.max(58, confidence - 6) : confidence, fuzzy ? `${source} • nome corrigido por similaridade` : source, numeric));
  }
  return values;
}

function parseProgressionSequence(text: string, confidence: number, source: string) {
  const normalizedText = normalized(text);
  const labeled: Array<{ label: string; patterns: RegExp[] }> = [
    { label: 'Finalização', patterns: [/finaliza[cç][aã]o\s*\+?\s*(\d{1,2})/i, /shooting\s*\+?\s*(\d{1,2})/i] },
    { label: 'Passe', patterns: [/(?:^|\s)passe\s*\+?\s*(\d{1,2})/i, /passing\s*\+?\s*(\d{1,2})/i] },
    { label: 'Drible', patterns: [/(?:^|\s)drible\s*\+?\s*(\d{1,2})/i, /dribbling\s*\+?\s*(\d{1,2})/i] },
    { label: 'Destreza', patterns: [/destreza\s*\+?\s*(\d{1,2})/i, /dexterity\s*\+?\s*(\d{1,2})/i] },
    { label: 'Força nas pernas', patterns: [/for[cç]a\s+(?:nas|de)\s+pernas\s*\+?\s*(\d{1,2})/i, /lower\s+body\s+strength\s*\+?\s*(\d{1,2})/i] },
    { label: 'Bola aérea', patterns: [/bola\s+a[eé]rea\s*\+?\s*(\d{1,2})/i, /aerial\s+strength\s*\+?\s*(\d{1,2})/i] },
    { label: 'Defesa', patterns: [/(?:^|\s)defesa\s*\+?\s*(\d{1,2})/i, /defending\s*\+?\s*(\d{1,2})/i] }
  ];
  const labeledValues = parseNumericCatalog(normalizedText, labeled, confidence, source, 0, 16);
  if (labeledValues.length) return labeledValues;

  const numbers = Array.from(text.matchAll(/(?:^|\s)(\d{1,2})(?=\s|$)/g))
    .map((match) => Number(match[1]))
    .filter((value) => value >= 0 && value <= 16);
  if (numbers.length < 4 || numbers.length > 7) return [];
  const labels = ['Finalização', 'Passe', 'Drible', 'Destreza', 'Força nas pernas', 'Bola aérea', 'Defesa'];
  return numbers.map((value, index) => ({
    ...makeValue(labels[index] ?? `Grupo ${index + 1}`, String(value), Math.min(confidence, 68), `${source} • sequência visual`, value),
    status: 'review' as const
  }));
}

function identityValue(label: string, value: string | null, confidence: number, source: string, numeric = false) {
  if (!value) return null;
  return makeValue(label, value, confidence, source, numeric ? numericFromDecoratedValue(value) : null);
}

const NAME_REJECT_TOKENS = [
  'detalhes do jogador', 'modelo de jogador', 'atributos', 'habilidades', 'nivel', 'overall', 'ger',
  'estilo de jogo', 'posicao', 'talento ofensivo', 'talento defensivo', 'condicao fisica',
  'resistencia a lesao', 'pior pe', 'altura', 'peso', 'idade', 'tecnico', 'manager'
];

function titleCaseName(value: string) {
  const particles = new Set(['da', 'de', 'do', 'das', 'dos', 'del', 'della', 'di', 'van', 'von', 'le', 'la']);
  return clean(value).toLowerCase().split(/\s+/).map((word, index) => index > 0 && particles.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function detectName(text: string, knownPlayerNames: string[] = []) {
  const explicit = firstMatch(text, [/(?:nome\s+do\s+jogador|nome|jogador)\s*[:=-]\s*([^\n]{2,52})/i]);
  const rawLines = [explicit ?? '', ...text.split(/\r?\n/)].map((line) => clean(line)).filter(Boolean);
  const candidates: Array<{ value: string; score: number }> = [];
  rawLines.forEach((rawLine, index) => {
    const line = rawLine
      .replace(/^(?:nome(?:\s+do\s+jogador)?|jogador)\s*[:=.-]?\s*/i, '')
      .replace(/^[^A-Za-zÀ-ÿ]+|[^A-Za-zÀ-ÿ.' -]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const norm = normalized(line);
    const words = line.split(/\s+/).filter(Boolean);
    const letters = (line.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
    if (line.length < 3 || line.length > 52 || words.length > 6 || /\d/.test(line) || letters / Math.max(1, line.length) < 0.67) return;
    if (NAME_REJECT_TOKENS.some((token) => norm.includes(token))) return;
    let score = 62 + Math.max(0, 14 - index * 2) + (words.length >= 2 && words.length <= 4 ? 12 : 4);
    const nearest = knownPlayerNames.map((name) => ({ name, similarity: textSimilarity(line, name) })).sort((a, b) => b.similarity - a.similarity)[0];
    if (nearest?.similarity >= 0.88) {
      candidates.push({ value: nearest.name, score: score + 18 });
      return;
    }
    if (/^[A-ZÀ-Ÿ]/.test(line)) score += 4;
    candidates.push({ value: titleCaseName(line), score });
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.value ?? null;
}

function detectPlaystyle(text: string) {
  const styles = ['Artilheiro', 'Homem de Área', 'Pivô', 'Atacante Pivô', 'Puxa Marcação', 'Armador Criativo', 'Infiltração', 'Ala Produtivo', 'Lateral Móvel', 'Clássico 10', 'Meia versátil', '1º Volante', 'Orquestrador', 'Lateral Defensivo', 'Perito em Cruzamento', 'Lateral Atacante', 'Lateral Ofensivo', 'Destruidor', 'Defensor Criativo', 'Atacante Surpresa', 'Goleiro Ofensivo', 'Goleiro Defensivo'];
  const norm = normalized(text);
  return styles.find((style) => norm.includes(normalized(style))) ?? null;
}

export function looksLikeCompleteProfile(text: string) {
  const norm = normalized(text);
  const markers = [
    'modelo de jogador', 'raio de cobertura das pernas', 'condicao fisica', 'resistencia a lesao',
    'talento ofensivo', 'posicoes', 'habilidades', 'comprimento da perna'
  ];
  return markers.filter((marker) => norm.includes(marker)).length >= 3;
}

export function readDetailedPrint(fullText: string, readings: PremiumZoneReading[], knownPlayerNames: string[] = []): DetailedPrintReading {
  const allText = [fullText, ...readings.map((reading) => reading.text)].filter(Boolean).join('\n');
  const identitySource = [sourceText(readings, ['name', 'playstyle', 'overall', 'mainPosition', 'identityMeta']), fullText].filter(Boolean).join('\n');
  const attributeSource = [sourceText(readings, ['attributes']), fullText].filter(Boolean).join('\n');
  const positionSource = [sourceText(readings, ['positionGrid']), fullText].filter(Boolean).join('\n');
  const physicalSource = [sourceText(readings, ['physicalModel', 'progression']), fullText].filter(Boolean).join('\n');
  const skillSource = [sourceText(readings, ['skills']), fullText].filter(Boolean).join('\n');
  const conditionSource = [sourceText(readings, ['condition', 'manager']), fullText].filter(Boolean).join('\n');
  const impetoSource = [sourceText(readings, ['impetos', 'autoTraining']), fullText].filter(Boolean).join('\n');
  const progressionSource = [sourceText(readings, ['progression', 'autoTraining']), fullText].filter(Boolean).join('\n');

  const identityConfidence = confidenceFromSource(readings, ['name', 'playstyle', 'overall', 'mainPosition', 'identityMeta'], 72);
  const attributeConfidence = confidenceFromSource(readings, ['attributes'], 70);
  const positionConfidence = confidenceFromSource(readings, ['positionGrid'], 70);
  const physicalConfidence = confidenceFromSource(readings, ['physicalModel', 'progression'], 68);
  const skillConfidence = confidenceFromSource(readings, ['skills'], 70);
  const conditionConfidence = confidenceFromSource(readings, ['condition', 'manager'], 68);
  const impetoConfidence = confidenceFromSource(readings, ['impetos', 'autoTraining'], 68);

  const overallCandidate = firstMatch(identitySource, [/(?:ger|overall)\s*[:=-]?\s*(\d{2,3})/i, /\b(10[0-9]|9[0-9]|8[0-9])\s*(?:cf|ca|ss|sa|amf|mat|lwf|pe|rwf|pd)\b/i]);
  const overallRaw = rawNumberInRange(overallCandidate, 40, 120);
  const positionRaw = firstMatch(identitySource, [/(?:posi[cç][aã]o\s+principal|posi[cç][aã]o)\s*[:=-]?\s*(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF|GOL|ZAG|LE|LD|VOL|MLG|MAT|PE|PD|SA|CA)/i, /\b(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF)\b/i]);
  const heightCandidate = firstMatch(allText, [/altura\s*[:=-]?\s*(\d{3})\s*cm/i, /\b(1\d{2})\s*cm\b/i]);
  const weightCandidate = firstMatch(allText, [/peso\s*[:=-]?\s*(\d{2,3})\s*kg/i]);
  const ageCandidate = firstMatch(allText, [/idade\s*[:=-]?\s*(\d{1,2})/i]);
  const levelCandidate = firstMatch(allText, [/(?:n[ií]vel|nivel|level)\s*[:=-]?\s*(\d{1,2})/i]);
  const heightRaw = rawNumberInRange(heightCandidate, 145, 225);
  const weightRaw = rawNumberInRange(weightCandidate, 40, 160);
  const ageRaw = rawNumberInRange(ageCandidate, 15, 65);
  const levelRaw = rawNumberInRange(levelCandidate, 1, 99);
  const name = detectName(identitySource, knownPlayerNames);
  const playstyle = detectPlaystyle(identitySource);

  const attributes = parseNumericCatalog(attributeSource, ATTRIBUTE_ALIASES, attributeConfidence, 'Tabela de atributos', 1, 110);
  const positionRatings = parsePositionRatings(positionSource, positionConfidence, 'Grade de posições');
  const physicalModel = parseNumericCatalog(physicalSource, PHYSICAL_ALIASES, physicalConfidence, 'Modelo físico', 0, 400);
  const skills = parseSkills(skillSource, skillConfidence, 'Lista de habilidades');
  const impetos = parseImpetos(impetoSource, impetoConfidence, 'Faixa de Ímpetos');
  const progressionSequence = parseProgressionSequence(progressionSource, confidenceFromSource(readings, ['progression', 'autoTraining'], 62), 'Faixa de progressão');

  const condition: DetailedValue[] = [];
  const conditionItems: Array<{ label: string; patterns: RegExp[] }> = [
    { label: 'Pior pé (frequência)', patterns: [/pior\s+p[eé]\s*\(?frequ[eê]ncia\)?\s*[:=-]?\s*(raramente|ocasionalmente|frequentemente|muito\s+frequentemente)/i] },
    { label: 'Pior pé (precisão)', patterns: [/pior\s+p[eé]\s*\(?precis[aã]o\)?\s*[:=-]?\s*(baixa|m[eé]dia|alta|muito\s+alta)/i] },
    { label: 'Condição física', patterns: [/condi[cç][aã]o\s+f[ií]sica\s*[:=-]?\s*(normal|est[aá]vel|inconsistente|alta|baixa)/i] },
    { label: 'Resistência à lesão', patterns: [/resist[eê]ncia\s+(?:a|à)\s+les[aã]o\s*[:=-]?\s*(baixa|m[eé]dia|alta)/i] }
  ];
  for (const item of conditionItems) {
    const value = firstMatch(conditionSource, item.patterns);
    if (value) condition.push(makeValue(item.label, value, conditionConfidence, 'Condição da carta'));
  }

  const managerName = firstMatch(conditionSource, [
    /(?:t[eé]cnico|manager)\s*[:=-]\s*([^\n]+?)(?=\s+(?:finaliza[cç][aã]o|talento\s+ofensivo|passe\s+rasteiro|passe\s+alto|velocidade|acelera[cç][aã]o|contato\s+f[ií]sico|talento\s+defensivo)\s*\+\s*\d|\n|$)/i,
    /\b([A-ZÀ-Ÿ][.A-Za-zÀ-ÿ'-]+\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+)\s+(?=[A-Za-zÀ-ÿ ]+\+\s*1)/
  ]);
  const managerBoosts: DetailedValue[] = [];
  for (const label of ['Finalização', 'Talento ofensivo', 'Passe rasteiro', 'Passe alto', 'Velocidade', 'Aceleração', 'Contato físico', 'Talento defensivo']) {
    const match = conditionSource.match(new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+\\s*(\\d+)`, 'i'));
    const numeric = numberValue(match?.[1]);
    if (numeric !== null && numeric >= 1 && numeric <= 5) managerBoosts.push(makeValue('Bônus do técnico', `${label} +${numeric}`, conditionConfidence, 'Cartão do técnico', numeric));
  }

  const identity = {
    playerName: identityValue('Nome do jogador', name, identityConfidence, 'Cabeçalho'),
    playstyle: identityValue('Estilo de jogo', playstyle, identityConfidence, 'Cabeçalho'),
    overall: identityValue('GER', overallRaw, identityConfidence, 'Selo da carta/grade', true),
    mainPosition: identityValue('Posição principal', positionRaw, identityConfidence, 'Selo da carta', false),
    height: identityValue('Altura', heightRaw ? `${heightRaw} cm` : null, identityConfidence, 'Dados físicos', true),
    weight: identityValue('Peso', weightRaw ? `${weightRaw} kg` : null, identityConfidence, 'Dados físicos', true),
    age: identityValue('Idade', ageRaw, identityConfidence, 'Dados físicos', true),
    level: identityValue('Nível', levelRaw, identityConfidence, 'Dados da carta', true)
  };

  const missing: string[] = [];
  if (!identity.playerName) missing.push('nome');
  if (!identity.playstyle) missing.push('estilo');
  if (!identity.mainPosition) missing.push('posição');
  if (!identity.level) missing.push('nível');
  if (attributes.length < 12) missing.push('mais atributos');
  if (skills.length < 3) missing.push('habilidades completas');
  if (!impetos.length) missing.push('Ímpetos');
  const recognized = [
    ...Object.values(identity).filter(Boolean), ...condition, ...managerBoosts, ...impetos,
    ...positionRatings, ...attributes, ...progressionSequence, ...physicalModel, ...skills
  ].length;
  const totalExpected = 8 + 4 + 2 + 2 + 13 + 26 + 5 + 16 + 10;
  const score = Math.max(0, Math.min(100, Math.round(
    Math.min(28, attributes.length * 1.08)
    + Math.min(15, positionRatings.length * 1.15)
    + Math.min(14, skills.length * 1.4)
    + Math.min(10, physicalModel.length * 0.7)
    + Math.min(8, condition.length * 2)
    + Math.min(8, impetos.length * 4)
    + Object.values(identity).filter(Boolean).length * 2.1
  )));

  const canonical: string[] = ['[LEITURA DETALHADA V30.50]'];
  if (identity.playerName) canonical.push(`NOME DO JOGADOR: ${identity.playerName.value}`);
  if (identity.mainPosition) canonical.push(`POSIÇÃO PRINCIPAL: ${identity.mainPosition.value}`);
  if (identity.playstyle) canonical.push(`ESTILO DE JOGO: ${identity.playstyle.value}`);
  if (identity.overall) canonical.push(`GER: ${identity.overall.value}`);
  if (identity.level) canonical.push(`NÍVEL MÁXIMO: ${identity.level.numericValue ?? identity.level.value}`);
  if (identity.height) canonical.push(`ALTURA: ${identity.height.value}`);
  if (identity.weight) canonical.push(`PESO: ${identity.weight.value}`);
  if (identity.age) canonical.push(`IDADE: ${identity.age.numericValue ?? identity.age.value}`);
  for (const value of condition) canonical.push(`${value.label}: ${value.value}`);
  if (managerName) canonical.push(`TÉCNICO: ${managerName}`);
  if (managerBoosts.length) canonical.push(`BÔNUS DO TÉCNICO: ${managerBoosts.map((item) => item.value).join(', ')}`);
  for (const value of impetos) canonical.push(`ÍMPETO: ${value.value}`);
  for (const value of positionRatings) canonical.push(`${value.label}: ${value.value}`);
  for (const value of attributes) canonical.push(`${value.label}: ${value.value}`);
  for (const value of physicalModel) canonical.push(`${value.label}: ${value.value}`);
  if (skills.length) canonical.push(`HABILIDADES JÁ POSSUI: ${skills.map((item) => item.value).join(', ')}`);
  canonical.push('[FIM LEITURA DETALHADA V30.50]');

  const warnings: string[] = [];
  if (overallCandidate && !overallRaw) warnings.push(`GER descartado por estar fora da faixa plausível: ${overallCandidate}.`);
  if (heightCandidate && !heightRaw) warnings.push(`Altura descartada por estar fora da faixa plausível: ${heightCandidate} cm.`);
  if (weightCandidate && !weightRaw) warnings.push(`Peso descartado por estar fora da faixa plausível: ${weightCandidate} kg.`);
  if (ageCandidate && !ageRaw) warnings.push(`Idade descartada por estar fora da faixa plausível: ${ageCandidate}.`);
  if (levelCandidate && !levelRaw) warnings.push(`Nível descartado por estar fora da faixa plausível: ${levelCandidate}.`);
  const highestPosition = Math.max(0, ...positionRatings.map((item) => item.numericValue ?? 0));
  if (identity.overall?.numericValue && highestPosition && Math.abs(identity.overall.numericValue - highestPosition) > 12) {
    identity.overall.status = 'review';
    warnings.push('O GER divergiu muito da melhor classificação por posição e precisa de confirmação visual.');
  }
  if (progressionSequence.some((item) => item.status === 'review')) warnings.push('A sequência de progressão foi lida pela ordem visual dos ícones e precisa de confirmação antes de virar orçamento da ficha.');
  if (attributes.length >= 20) warnings.push('Tabela de atributos com cobertura alta: o motor pode reduzir o uso de estimativas por posição.');
  if (physicalModel.length >= 8) warnings.push('Modelo físico detectado e incorporado à leitura de alcance, salto e contato.');
  if (skills.some((item) => item.value === 'Garra')) warnings.push('“Garra” foi lida como texto exibido no print; confirme se pertence à lista oficial da versão atual do jogo.');

  return {
    version: VERSION,
    format: looksLikeCompleteProfile(allText) ? 'complete-profile' : 'standard-card',
    identity,
    condition,
    manager: { name: managerName, boosts: managerBoosts, confidence: managerName || managerBoosts.length ? conditionConfidence : 0 },
    impetos,
    positionRatings,
    attributes,
    progressionSequence,
    physicalModel,
    skills,
    coverage: {
      recognized,
      totalExpected,
      score,
      attributeCount: attributes.length,
      positionCount: positionRatings.length,
      skillCount: skills.length,
      physicalCount: physicalModel.length,
      missing
    },
    warnings,
    canonicalText: canonical.join('\n')
  };
}
