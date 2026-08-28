import { canonicalizePlayerPlaystyle, type CanonicalPlayerPlaystyle } from './efootball2026Playstyles';

export const EFOOTBALL_V600_PLAYSTYLE_VERSION = '6.0-r120-dual-phase-basic-safe' as const;

/**
 * A Konami confirmou publicamente Pressão no Ataque como exemplo de estilo
 * defensivo na v6.0. Nomes adicionais podem ser preservados pelo OCR como
 * provisórios, mas só recebem peso de gameplay após confirmação.
 */
export const CONFIRMED_V600_DEFENSIVE_PLAYSTYLES = ['Básico', 'Pressão no Ataque'] as const;
export type ConfirmedV600DefensivePlaystyle = CanonicalPlayerPlaystyle | typeof CONFIRMED_V600_DEFENSIVE_PLAYSTYLES[number];

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanRawLabel(value: unknown): string | null {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim().replace(/[|•]+$/g, '').trim();
  if (text.length < 3 || text.length > 48) return null;
  const n = normalize(text);
  if (!n || /^(estilo|jogo|defensivo|ofensivo|playstyle|none|nenhum|nao possui)$/.test(n)) return null;
  if ((n.match(/[a-z]/g) ?? []).length < 3) return null;
  return text;
}

export function canonicalizeV600DefensivePlaystyle(value: unknown): ConfirmedV600DefensivePlaystyle | null {
  const canonicalPlayerStyle = canonicalizePlayerPlaystyle(value);
  if (canonicalPlayerStyle) return canonicalPlayerStyle;
  const text = normalize(value);
  if (!text) return null;
  if (/^(basico|basic|padrao|default)$/.test(text)) return 'Básico';
  if (/pressao no ataque|attacking pressure|front pressure|frontline pressure/.test(text)) return 'Pressão no Ataque';
  return null;
}

function canonicalStylesInOrder(text: string): CanonicalPlayerPlaystyle[] {
  const ordered: CanonicalPlayerPlaystyle[] = [];
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const style = canonicalizePlayerPlaystyle(line);
    if (style && ordered[ordered.length - 1] !== style) ordered.push(style);
  }
  return ordered;
}

function phasePairFromCompactZone(text: string) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let offensive: CanonicalPlayerPlaystyle | null = null;
  let defensive: ConfirmedV600DefensivePlaystyle | null = null;

  for (const line of lines) {
    const n = normalize(line);
    const style = canonicalizePlayerPlaystyle(line);
    const defensiveStyle = canonicalizeV600DefensivePlaystyle(line);
    if (!offensive && style && /ataque|atacando|ofensiv|vermelh|red|\u2191|\u25b2|\u2b06/.test(n + ' ' + line)) offensive = style;
    if (!defensive && defensiveStyle && /defesa|defendendo|defensiv|azul|blue|\u2193|\u25bc|\u2b07/.test(n + ' ' + line)) defensive = defensiveStyle;
  }

  if (offensive || defensive) return { offensive, defensive };

  // Layout v6.0: dentro da área exclusiva de estilos, duas linhas distintas
  // representam fase com bola e fase sem bola, nessa ordem visual.
  const ordered = canonicalStylesInOrder(text);
  if (ordered.length === 2 && ordered[0] !== ordered[1]) {
    return { offensive: ordered[0], defensive: ordered[1] as ConfirmedV600DefensivePlaystyle };
  }
  return { offensive: null, defensive: null };
}

function firstCaptured(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export type V600PlaystyleReading = {
  offensive: CanonicalPlayerPlaystyle | null;
  /** Nome exibido na carta; pode ser provisório quando ainda não está no catálogo confirmado. */
  defensive: string | null;
  defensiveConfirmed: boolean;
  defensiveRaw: string | null;
  source: 'EXPLICIT_V600' | 'DUAL_PHASE_PAIR' | 'LEGACY_SINGLE' | 'NONE';
};

export function detectV600Playstyles(text: string): V600PlaystyleReading {
  const offensiveRaw = firstCaptured(text, [
    /(?:estilo\s+de\s+jogo\s+ofensivo|estilo\s+ofensivo|offensive\s+playstyle)\s*[:=\-]?\s*([^\n|•]{2,48})/i
  ]);
  const defensiveRaw = firstCaptured(text, [
    /(?:estilo\s+de\s+jogo\s+defensivo|estilo\s+defensivo|defensive\s+playstyle)\s*[:=\-]?\s*([^\n|•]{2,48})/i
  ]);

  const explicitOffensive = canonicalizePlayerPlaystyle(offensiveRaw);
  const confirmedDefensive = canonicalizeV600DefensivePlaystyle(defensiveRaw);
  const preservedDefensive = confirmedDefensive ?? cleanRawLabel(defensiveRaw);
  if (offensiveRaw || defensiveRaw) {
    return {
      offensive: explicitOffensive,
      defensive: preservedDefensive,
      defensiveConfirmed: Boolean(confirmedDefensive),
      defensiveRaw: cleanRawLabel(defensiveRaw),
      source: 'EXPLICIT_V600'
    };
  }


  const compactPair = phasePairFromCompactZone(text);
  if (compactPair.offensive || compactPair.defensive) {
    return {
      offensive: compactPair.offensive,
      defensive: compactPair.defensive,
      defensiveConfirmed: Boolean(compactPair.defensive),
      defensiveRaw: compactPair.defensive,
      source: 'DUAL_PHASE_PAIR'
    };
  }

  const legacy = canonicalizePlayerPlaystyle(text);
  const explicitDefensiveOnly = !legacy ? canonicalizeV600DefensivePlaystyle(text) : null;
  if (legacy || explicitDefensiveOnly) return {
    offensive: legacy,
    // Cartas antigas exibem um único estilo. Na v6.0 isso não autoriza inferir
    // o mesmo comportamento na fase sem a bola: o fallback seguro é Básico.
    defensive: legacy ? 'Básico' : explicitDefensiveOnly,
    defensiveConfirmed: Boolean(legacy || explicitDefensiveOnly),
    defensiveRaw: legacy ? null : explicitDefensiveOnly,
    source: 'LEGACY_SINGLE'
  };
  return { offensive: null, defensive: null, defensiveConfirmed: false, defensiveRaw: null, source: 'NONE' };
}


export type DefensivePhaseTrainingBias = Partial<Record<
  'shooting' | 'passing' | 'dribbling' | 'dexterity' | 'lowerBodyStrength' | 'aerialStrength' | 'defending' | 'gk1' | 'gk2' | 'gk3',
  number
>>;

/**
 * Peso somente da fase sem a bola. Estilos antigos que agora aparecem na seta azul
 * podem ser reutilizados como identidade defensiva sem alterar o nome ofensivo.
 * Rótulos desconhecidos continuam salvos no catálogo vivo, mas recebem peso zero
 * até existir mapeamento canônico/confirmado.
 */
export function defensivePhaseTrainingBias(value: unknown): DefensivePhaseTrainingBias {
  const style = canonicalizeV600DefensivePlaystyle(value);
  if (!style) return {};
  switch (style) {
    case 'Básico': return {};
    case 'Pressão no Ataque': return { defending: .25, dexterity: .18, lowerBodyStrength: .22 };
    case 'Destruidor': return { defending: .34, lowerBodyStrength: .23, dexterity: .12, aerialStrength: .10 };
    case 'Defensor Criativo': return { defending: .25, passing: .18, lowerBodyStrength: .10, dexterity: .08 };
    case 'Lateral Defensivo': return { defending: .28, lowerBodyStrength: .20, passing: .10, dexterity: .08 };
    case '1º Volante': return { defending: .31, passing: .16, lowerBodyStrength: .18, aerialStrength: .08 };
    case 'Meia versátil': return { defending: .16, lowerBodyStrength: .20, dexterity: .13, passing: .10 };
    case 'Orquestrador': return { passing: .17, defending: .09, dexterity: .06 };
    case 'Atacante Surpresa': return { defending: .18, lowerBodyStrength: .14, aerialStrength: .12 };
    case 'Lateral Ofensivo':
    case 'Lateral Atacante': return { dexterity: .14, lowerBodyStrength: .18, defending: .11 };
    case 'Goleiro Ofensivo': return { gk2: .18, gk3: .16, lowerBodyStrength: .06 };
    case 'Goleiro Defensivo': return { gk1: .18, gk2: .17, gk3: .14 };
    default: return {};
  }
}
