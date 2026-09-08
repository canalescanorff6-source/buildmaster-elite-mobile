/**
 * R130 — utilitários puros de texto usados pela leitura e pelo motor-base.
 * Não possuem autoridade de gameplay nem podem alterar uma ficha.
 */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function slug(value: string): string {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function cleanLine(line: string): string {
  return line.replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function readNumber(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number(String(match[1]).replace(',', '.'));
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

export function textHas(text: string, candidate: string): boolean {
  return normalize(text).toLowerCase().includes(normalize(candidate).toLowerCase());
}
