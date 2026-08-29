import { canonicalizeOffensivePlaystyleR124, canonicalizeDefensivePlaystyleR124, findPhasePlaystyleMatchesR124, phasePlaystyleOptionsR124 } from './efootball2027PhaseCatalogR124';

export const EFOOTBALL_V600_PLAYSTYLE_VERSION = '6.0-r124-phase-separated-live-safe' as const;

/**
 * A Konami confirmou publicamente Pressão no Ataque como exemplo de estilo
 * defensivo na v6.0. Nomes adicionais podem ser preservados pelo OCR como
 * provisórios, mas só recebem peso de gameplay após confirmação.
 */
export const CONFIRMED_V600_DEFENSIVE_PLAYSTYLES = phasePlaystyleOptionsR124('DEFENSIVE');
export type ConfirmedV600DefensivePlaystyle = string;

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
  return canonicalizeDefensivePlaystyleR124(value);
}

export function canonicalizeV600OffensivePlaystyle(value: unknown): string | null {
  return canonicalizeOffensivePlaystyleR124(value);
}

function phasePairFromCompactZone(text: string) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let offensive: string | null = null;
  let defensive: ConfirmedV600DefensivePlaystyle | null = null;
  const unphased: Array<{ offensive:string|null; defensive:ConfirmedV600DefensivePlaystyle|null }> = [];

  for (const line of lines) {
    const n = normalize(line);
    const hasOffensiveMarker = /^(?:att|attack|attacking|offensive|ataque|atacando|ofensivo)\b|ataque|atacando|ofensiv|com a bola|vermelh|red|\u2191|\u25b2|\u2b06/.test(n);
    const hasDefensiveMarker = /^(?:def|defence|defense|defending|defensive|defesa|defendendo|defensivo)\b|defesa|defendendo|defensiv|sem a bola|azul|blue|\u2193|\u25bc|\u2b07/.test(n);
    if (hasOffensiveMarker && !offensive) offensive = canonicalizeV600OffensivePlaystyle(line);
    if (hasDefensiveMarker && !defensive) defensive = canonicalizeV600DefensivePlaystyle(line);
    if (!hasOffensiveMarker && !hasDefensiveMarker) {
      unphased.push({
        offensive: canonicalizeV600OffensivePlaystyle(line),
        defensive: canonicalizeV600DefensivePlaystyle(line)
      });
    }
  }

  if (offensive || defensive) return { offensive, defensive };

  // Layout compacto v6.0: duas linhas na área exclusiva de estilos representam
  // ataque e defesa nessa ordem. Cada linha é validada pela família correta.
  if (unphased.length >= 2) {
    const firstOffensive=unphased[0]?.offensive ?? null;
    const secondDefensive=unphased[1]?.defensive ?? null;
    if (firstOffensive || secondDefensive) return { offensive:firstOffensive, defensive:secondDefensive };
  }

  // Alguns OCRs colam as duas cápsulas numa única linha (ex.:
  // "Basic Attacking GK"). Nesse caso preservamos a ordem visual e ainda
  // exigimos que cada rótulo pertença à sua fase correta.
  const offensiveMatches=findPhasePlaystyleMatchesR124(text,'OFFENSIVE');
  const defensiveMatches=findPhasePlaystyleMatchesR124(text,'DEFENSIVE');
  const firstOffensive=offensiveMatches[0] ?? null;
  const afterOffensive=firstOffensive ? defensiveMatches.find((x)=>x.index>=firstOffensive.end) ?? null : defensiveMatches[0] ?? null;
  if (firstOffensive && afterOffensive) return { offensive:firstOffensive.label, defensive:afterOffensive.label };
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
  offensive: string | null;
  /** Nome exibido na carta; pode ser provisório quando ainda não está no catálogo confirmado. */
  defensive: string | null;
  defensiveConfirmed: boolean;
  defensiveRaw: string | null;
  source: 'EXPLICIT_V600' | 'DUAL_PHASE_PAIR' | 'LEGACY_SINGLE' | 'NONE';
};

export function detectV600Playstyles(text: string): V600PlaystyleReading {
  const offensiveRaw = firstCaptured(text, [
    /(?:estilo\s+de\s+jogo\s+ofensivo|estilo\s+ofensivo|offensive\s+playstyle|attacking\s+playstyle)\s*[:=\-]?\s*([^\n|•]{2,48})/i,
    /^(?:att|attack|ataque|atacando)\s*[:=\-]\s*([^\n|•]{2,48})/im
  ]);
  const defensiveRaw = firstCaptured(text, [
    /(?:estilo\s+de\s+jogo\s+defensivo|estilo\s+defensivo|defensive\s+playstyle|defending\s+playstyle)\s*[:=\-]?\s*([^\n|•]{2,48})/i,
    /^(?:def|defence|defense|defesa|defendendo)\s*[:=\-]\s*([^\n|•]{2,48})/im
  ]);

  const explicitOffensive = canonicalizeV600OffensivePlaystyle(offensiveRaw);
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

  const legacy = canonicalizeV600OffensivePlaystyle(text);
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
    case 'Front Line Poacher': return { defending: .18, dexterity: .12, lowerBodyStrength: .08 };
    case 'Pass Disruptor': return { defending: .25, dexterity: .10, lowerBodyStrength: .07 };
    case 'All Action Defender': return { defending: .24, lowerBodyStrength: .22, dexterity: .11 };
    case 'Covering Role': return { defending: .28, lowerBodyStrength: .13, dexterity: .12 };
    case 'High Line Master': return { defending: .31, dexterity: .10, lowerBodyStrength: .08 };
    case 'Sweeper GK': return { gk2: .16, gk3: .18, lowerBodyStrength: .08 };
    case 'Attack Outlet': return { lowerBodyStrength: .05, dexterity: .04 };
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
