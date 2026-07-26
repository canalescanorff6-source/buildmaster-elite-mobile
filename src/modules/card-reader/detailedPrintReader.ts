import type { PremiumZoneReading } from '@/lib/premiumReading';

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

const VERSION = '30.30-detailed-print-1';

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
    const numeric = numberValue(raw ?? undefined);
    if (numeric === null || numeric < min || numeric > max) continue;
    values.push(makeValue(item.label, String(numeric), confidence, source, numeric));
  }
  return values;
}

function parsePositionRatings(text: string, confidence: number, source: string) {
  const values: DetailedValue[] = [];
  const upper = text.toUpperCase();
  for (const code of POSITION_CODES) {
    const match = upper.match(new RegExp(`\\b${code}\\s*[:=-]?\\s*(\\d{2,3})\\b`, 'i'));
    const numeric = numberValue(match?.[1]);
    if (numeric === null || numeric < 40 || numeric > 110) continue;
    values.push(makeValue(code, String(numeric), confidence, source, numeric));
  }
  return values;
}

function parseSkills(text: string, confidence: number, source: string) {
  const norm = normalized(text);
  const aliases: Partial<Record<(typeof SKILLS)[number], string[]>> = {
    'Cabeçada': ['Cabeceio'],
    'Espírito guerreiro': ['Espirito guerreiro'],
    'Especialista em pênalti': ['Especialista em penalti']
  };
  return SKILLS
    .filter((skill) => [skill, ...(aliases[skill] ?? [])].some((candidate) => norm.includes(normalized(candidate))))
    .map((skill) => makeValue('Habilidade', skill, confidence, source));
}

function parseImpetos(text: string, confidence: number, source: string) {
  const values: DetailedValue[] = [];
  for (const name of IMPETO_NAMES) {
    const match = text.match(new RegExp(`(?:^|[\\n|•])\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+\\s*(\\d+)`, 'i'))
      ?? text.match(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+\\s*(\\d+)`, 'i'));
    const numeric = numberValue(match?.[1]);
    if (numeric === null || numeric < 1 || numeric > 5) continue;
    values.push(makeValue('Ímpeto', `${name} +${numeric}`, confidence, source, numeric));
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
  return makeValue(label, value, confidence, source, numeric ? numberValue(value) : null);
}

function detectName(text: string) {
  const explicit = firstMatch(text, [/(?:nome\s+do\s+jogador|nome|jogador)\s*[:=-]\s*([^\n]{2,48})/i]);
  if (explicit) return explicit;
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
  return lines.find((line) => /^[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ.'-]+){1,4}$/.test(line) && line.length <= 48) ?? null;
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

export function readDetailedPrint(fullText: string, readings: PremiumZoneReading[]): DetailedPrintReading {
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

  const overallRaw = firstMatch(identitySource, [/(?:ger|overall)\s*[:=-]?\s*(\d{2,3})/i, /\b(10[0-9]|9[0-9]|8[0-9])\s*(?:cf|ca|ss|sa|amf|mat|lwf|pe|rwf|pd)\b/i]);
  const positionRaw = firstMatch(identitySource, [/(?:posi[cç][aã]o\s+principal|posi[cç][aã]o)\s*[:=-]?\s*(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF|GOL|ZAG|LE|LD|VOL|MLG|MAT|PE|PD|SA|CA)/i, /\b(GK|CB|LB|RB|DMF|CMF|LMF|RMF|AMF|LWF|RWF|SS|CF)\b/i]);
  const heightRaw = firstMatch(allText, [/altura\s*[:=-]?\s*(\d{3})\s*cm/i, /\b(1\d{2})\s*cm\b/i]);
  const weightRaw = firstMatch(allText, [/peso\s*[:=-]?\s*(\d{2,3})\s*kg/i]);
  const ageRaw = firstMatch(allText, [/idade\s*[:=-]?\s*(\d{1,2})/i]);
  const levelRaw = firstMatch(allText, [/(?:n[ií]vel|nivel|level)\s*[:=-]?\s*(\d{1,2})/i]);
  const name = detectName(identitySource);
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

  const canonical: string[] = ['[LEITURA DETALHADA V30.30]'];
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
  canonical.push('[FIM LEITURA DETALHADA V30.30]');

  const warnings: string[] = [];
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
