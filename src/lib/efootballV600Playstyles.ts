import { canonicalizePlayerPlaystyle, type CanonicalPlayerPlaystyle } from './efootball2026Playstyles';

export const EFOOTBALL_V600_PLAYSTYLE_VERSION = '6.0.0' as const;

/**
 * A Konami confirmou publicamente Pressão no Ataque como exemplo de estilo
 * defensivo na v6.0. Nomes adicionais podem ser preservados pelo OCR como
 * provisórios, mas só recebem peso de gameplay após confirmação.
 */
export const CONFIRMED_V600_DEFENSIVE_PLAYSTYLES = ['Pressão no Ataque'] as const;
export type ConfirmedV600DefensivePlaystyle = typeof CONFIRMED_V600_DEFENSIVE_PLAYSTYLES[number];

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
  const text = normalize(value);
  if (!text) return null;
  if (/pressao no ataque|attacking pressure|front pressure|frontline pressure/.test(text)) return 'Pressão no Ataque';
  return null;
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
  source: 'EXPLICIT_V600' | 'LEGACY_SINGLE' | 'NONE';
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

  const legacy = canonicalizePlayerPlaystyle(text);
  const defensive = canonicalizeV600DefensivePlaystyle(text);
  if (legacy || defensive) return {
    offensive: legacy,
    defensive,
    defensiveConfirmed: Boolean(defensive),
    defensiveRaw: defensive,
    source: 'LEGACY_SINGLE'
  };
  return { offensive: null, defensive: null, defensiveConfirmed: false, defensiveRaw: null, source: 'NONE' };
}
