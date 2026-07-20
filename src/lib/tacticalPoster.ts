import type { TacticalStyle } from './analyzer';
import {
  FORMATION_ROLE_CATALOG,
  styleLabel,
  type FormationBlueprint,
  type FormationSlotFit
} from './formationRoleEngine';

export type TacticalPosterPalette = 'ouro' | 'ciano' | 'rubi' | 'esmeralda' | 'grafite';
export type TacticalPosterOrientation = 'vertical' | 'horizontal';
export type TacticalPosterArrowKind = 'support' | 'recycle' | 'defend' | 'movement';

export type TacticalPosterDisplayOptions = {
  showArrows: boolean;
  showLegend: boolean;
  showInstructionPanels: boolean;
  showPrinciples: boolean;
  showPlayerNames: boolean;
  showScores: boolean;
  showFooter: boolean;
};

export type TacticalPosterPlayerOverride = {
  name?: string;
  role?: string;
};

export type TacticalPosterCustomColors = {
  accent?: string;
  secondary?: string;
  danger?: string;
  field?: string;
};

export type TacticalPosterArrow = {
  id: string;
  fromSlotId: string;
  toSlotId: string;
  kind: TacticalPosterArrowKind;
  bend: number;
  label?: string;
  enabled: boolean;
};

export type TacticalPosterConfig = {
  title: string;
  subtitle: string;
  focus: string;
  formation: FormationBlueprint;
  lineup: FormationSlotFit[];
  style: TacticalStyle;
  palette: TacticalPosterPalette;
  orientation?: TacticalPosterOrientation;
  options?: Partial<TacticalPosterDisplayOptions>;
  playerOverrides?: Record<string, TacticalPosterPlayerOverride>;
  customColors?: TacticalPosterCustomColors;
  useAutomaticArrows?: boolean;
  manualArrows?: TacticalPosterArrow[];
  instructions: {
    passing: string[];
    recycle: string[];
    attack: string[];
    defend: string[];
    offensive: string[];
    defensive: string[];
    avoid: string[];
    whyItWorks: string[];
  };
};

type PosterTheme = {
  accent: string;
  accentSoft: string;
  secondary: string;
  danger: string;
  bg0: string;
  bg1: string;
  panel0: string;
  panel1: string;
  field0: string;
  field1: string;
};

type PosterPoint = {
  pick: FormationSlotFit;
  x: number;
  y: number;
};

const THEMES: Record<TacticalPosterPalette, PosterTheme> = {
  ouro: {
    accent: '#f4c542', accentSoft: '#9a6d16', secondary: '#1fd3df', danger: '#ff5a5f',
    bg0: '#02070d', bg1: '#07131f', panel0: '#111f2b', panel1: '#07111b', field0: '#274f21', field1: '#0c2714'
  },
  ciano: {
    accent: '#43dcff', accentSoft: '#176f88', secondary: '#f0c94b', danger: '#ff6472',
    bg0: '#02080d', bg1: '#05202a', panel0: '#0b2632', panel1: '#06131b', field0: '#1d5144', field1: '#0b2b26'
  },
  rubi: {
    accent: '#ff7187', accentSoft: '#8f2d45', secondary: '#55d9e8', danger: '#ffb14d',
    bg0: '#0b0308', bg1: '#22101a', panel0: '#2a1520', panel1: '#12080e', field0: '#3f4d20', field1: '#1c2710'
  },
  esmeralda: {
    accent: '#65e6a6', accentSoft: '#247a56', secondary: '#4fc9ff', danger: '#ff6d6d',
    bg0: '#020a08', bg1: '#09251d', panel0: '#123027', panel1: '#071812', field0: '#23613a', field1: '#0d2e1d'
  },
  grafite: {
    accent: '#d9e1ea', accentSoft: '#647181', secondary: '#52b9ff', danger: '#ff666f',
    bg0: '#050608', bg1: '#15191f', panel0: '#222832', panel1: '#0e1116', field0: '#33463a', field1: '#18251e'
  }
};

export const DEFAULT_TACTICAL_POSTER_OPTIONS: TacticalPosterDisplayOptions = {
  showArrows: true,
  showLegend: true,
  showInstructionPanels: true,
  showPrinciples: true,
  showPlayerNames: true,
  showScores: true,
  showFooter: true
};

function resolvedOptions(config: TacticalPosterConfig): TacticalPosterDisplayOptions {
  return { ...DEFAULT_TACTICAL_POSTER_OPTIONS, ...(config.options ?? {}) };
}

function validHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim());
}

function darker(color: string, amount = 0.35): string {
  const raw = color.replace('#', '');
  const channels = [0, 2, 4].map((index) => Number.parseInt(raw.slice(index, index + 2), 16));
  return `#${channels.map((channel) => Math.max(0, Math.round(channel * (1 - amount))).toString(16).padStart(2, '0')).join('')}`;
}

function resolveTheme(config: TacticalPosterConfig): PosterTheme {
  const base = THEMES[config.palette];
  const custom = config.customColors ?? {};
  const accent = validHexColor(custom.accent) ? custom.accent : base.accent;
  const secondary = validHexColor(custom.secondary) ? custom.secondary : base.secondary;
  const danger = validHexColor(custom.danger) ? custom.danger : base.danger;
  const field = validHexColor(custom.field) ? custom.field : base.field0;
  return {
    ...base,
    accent,
    accentSoft: validHexColor(custom.accent) ? darker(accent, 0.42) : base.accentSoft,
    secondary,
    danger,
    field0: field,
    field1: validHexColor(custom.field) ? darker(field, 0.58) : base.field1
  };
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function truncate(value: string, max = 28): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function wrapText(value: string, maxChars = 31, maxLines = 3): string[] {
  const words = value.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (!words.length) return ['—'];
  const lines: string[] = [];
  let current = '';
  let consumed = 0;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      consumed += 1;
      continue;
    }
    lines.push(current);
    current = word;
    consumed += 1;
    if (lines.length >= maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (consumed < words.length && lines.length) {
    lines[lines.length - 1] = truncate(`${lines[lines.length - 1]}…`, maxChars);
  }
  return lines.slice(0, maxLines);
}

function textLines(lines: string[], x: number, y: number, options?: { size?: number; weight?: number; fill?: string; lineHeight?: number; anchor?: 'start' | 'middle' | 'end' }): string {
  const size = options?.size ?? 18;
  const weight = options?.weight ?? 500;
  const fill = options?.fill ?? '#edf4ff';
  const lineHeight = options?.lineHeight ?? Math.round(size * 1.35);
  const anchor = options?.anchor ?? 'start';
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" font-family="Inter,Arial,sans-serif">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('')}</text>`;
}

function panel(x: number, y: number, width: number, height: number, accent: string, title: string, items: string[], icon: string, compact = false): string {
  const titleLabel = `${icon} ${title.toUpperCase()}`;
  const titleSize = compact ? 14 : titleLabel.length > 18 ? 12 : titleLabel.length > 15 ? 14 : 16;
  const maxChars = compact ? 28 : 19;
  const itemLines = items.slice(0, compact ? 4 : 5).flatMap((item) => wrapText(item, maxChars, 2));
  const maxLines = compact ? 6 : 7;
  const step = compact ? 20 : 18;
  const content = itemLines.slice(0, maxLines).map((line, index) => {
    const yPos = y + (compact ? 62 : 70) + index * step;
    return `<circle cx="${x + 22}" cy="${yPos - 4}" r="3" fill="${accent}"/>${textLines([line], x + 32, yPos, { size: compact ? 13 : 11, lineHeight: step })}`;
  }).join('');
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="url(#panelGradient)" stroke="${accent}" stroke-width="2"/><rect x="${x + 9}" y="${y + 9}" width="${width - 18}" height="40" rx="11" fill="#0b1724" stroke="${accent}" stroke-opacity=".55"/><text x="${x + 18}" y="${y + 36}" fill="${accent}" font-size="${titleSize}" font-weight="900" font-family="Inter,Arial,sans-serif">${escapeXml(titleLabel)}</text>${content}</g>`;
}

function shirt(x: number, y: number, label: string, role: string, name: string, accent: string, score: number, options: TacticalPosterDisplayOptions): string {
  const scoreLabel = score > 0 ? `${score}/100` : 'vaga';
  const mainLabel = options.showPlayerNames && name ? name : role;
  const subLabel = options.showPlayerNames && name ? role : '';
  return `<g transform="translate(${x} ${y})"><path d="M-35 -24 L-20 -39 L-7 -30 L7 -30 L20 -39 L35 -24 L26 -8 L18 -13 L18 28 L-18 28 L-18 -13 L-26 -8 Z" fill="#081827" stroke="${accent}" stroke-width="2.2"/><path d="M-7 -30 Q0 -20 7 -30" fill="none" stroke="${accent}" stroke-width="2"/><text x="0" y="5" text-anchor="middle" fill="${accent}" font-size="20" font-weight="900" font-family="Inter,Arial,sans-serif">${escapeXml(label)}</text><rect x="-57" y="33" width="114" height="26" rx="8" fill="#050b12" stroke="${accent}" stroke-opacity=".8"/><text x="0" y="51" text-anchor="middle" fill="#f7fbff" font-size="13" font-weight="800" font-family="Inter,Arial,sans-serif">${escapeXml(truncate(mainLabel, 18))}</text>${subLabel ? `<text x="0" y="74" text-anchor="middle" fill="#aebdca" font-size="11" font-weight="600" font-family="Inter,Arial,sans-serif">${escapeXml(truncate(subLabel, 18))}${options.showScores ? ` • ${escapeXml(scoreLabel)}` : ''}</text>` : options.showScores ? `<text x="0" y="74" text-anchor="middle" fill="#aebdca" font-size="11" font-weight="600" font-family="Inter,Arial,sans-serif">${escapeXml(scoreLabel)}</text>` : ''}</g>`;
}

function arrowStyle(kind: TacticalPosterArrowKind, theme: PosterTheme): { color: string; marker: string; dash: string; width: number } {
  if (kind === 'recycle') return { color: theme.secondary, marker: 'arrowCyan', dash: 'stroke-dasharray="10 8"', width: 3.6 };
  if (kind === 'defend') return { color: '#2e78e8', marker: 'arrowBlue', dash: '', width: 3.6 };
  if (kind === 'movement') return { color: '#f7dc63', marker: 'arrowMovement', dash: 'stroke-dasharray="7 7"', width: 3.4 };
  return { color: theme.accent, marker: 'arrowGold', dash: '', width: 4 };
}

function arrow(x1: number, y1: number, x2: number, y2: number, kind: TacticalPosterArrowKind, theme: PosterTheme, bend = 0, label = ''): string {
  const cx = (x1 + x2) / 2 + bend;
  const cy = (y1 + y2) / 2 - Math.abs(bend) * 0.3;
  const style = arrowStyle(kind, theme);
  const labelSvg = label.trim()
    ? `<g><rect x="${cx - 42}" y="${cy - 16}" width="84" height="22" rx="8" fill="#06101a" stroke="${style.color}" stroke-opacity=".8"/><text x="${cx}" y="${cy}" text-anchor="middle" fill="#f5f8fb" font-size="10" font-weight="700" font-family="Inter,Arial,sans-serif">${escapeXml(truncate(label, 15))}</text></g>`
    : '';
  return `<g><path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${style.color}" stroke-width="${style.width}" stroke-linecap="round" ${style.dash} marker-end="url(#${style.marker})" opacity=".92"/>${labelSvg}</g>`;
}

function roleForPick(pick: FormationSlotFit, config: TacticalPosterConfig): string {
  const override = config.playerOverrides?.[pick.slot.id]?.role?.trim();
  if (override) return override;
  const roleId = pick.slot.primaryRoles[0];
  return roleId ? FORMATION_ROLE_CATALOG[roleId].officialName : pick.slot.duty;
}

function nameForPick(pick: FormationSlotFit, config: TacticalPosterConfig): string {
  const override = config.playerOverrides?.[pick.slot.id]?.name?.trim();
  return override || pick.player?.parsed.playerName || '';
}

function posterPlayers(config: TacticalPosterConfig, fieldX: number, fieldY: number, fieldW: number, fieldH: number, accent: string): string {
  const options = resolvedOptions(config);
  return config.lineup.map((pick) => {
    const x = fieldX + (pick.slot.x / 100) * fieldW;
    const y = fieldY + (pick.slot.y / 100) * fieldH;
    return shirt(x, y, pick.slot.label, roleForPick(pick, config), nameForPick(pick, config), accent, pick.score, options);
  }).join('');
}

function pointMap(config: TacticalPosterConfig, fieldX: number, fieldY: number, fieldW: number, fieldH: number): Map<string, PosterPoint> {
  return new Map(config.lineup.map((pick) => [pick.slot.id, {
    pick,
    x: fieldX + (pick.slot.x / 100) * fieldW,
    y: fieldY + (pick.slot.y / 100) * fieldH
  }]));
}

export function createDefaultTacticalPosterArrows(lineup: FormationSlotFit[]): TacticalPosterArrow[] {
  const byLine = (line: FormationSlotFit['slot']['line']) => lineup.filter((pick) => pick.slot.line === line).sort((a, b) => a.slot.x - b.slot.x);
  const attack = byLine('ataque');
  const midfield = byLine('meio');
  const defense = byLine('defesa');
  const keeper = byLine('goleiro')[0];
  const arrows: TacticalPosterArrow[] = [];
  let sequence = 0;
  const add = (fromSlotId: string, toSlotId: string, kind: TacticalPosterArrowKind, bend: number, label = '') => {
    sequence += 1;
    arrows.push({ id: `auto-${sequence}-${fromSlotId}-${toSlotId}`, fromSlotId, toSlotId, kind, bend, label, enabled: true });
  };
  const connectNeighbors = (group: FormationSlotFit[], kind: TacticalPosterArrowKind) => {
    group.slice(0, -1).forEach((pick, index) => add(pick.slot.id, group[index + 1].slot.id, kind, index % 2 ? 12 : -12));
  };
  connectNeighbors(attack, 'support');
  connectNeighbors(midfield, 'support');
  connectNeighbors(defense, 'defend');
  midfield.forEach((mid, index) => {
    if (!attack.length) return;
    const target = attack[Math.min(attack.length - 1, Math.round(index * (attack.length - 1) / Math.max(1, midfield.length - 1)))];
    add(mid.slot.id, target.slot.id, 'support', index % 2 ? 26 : -26);
  });
  defense.forEach((back, index) => {
    if (!midfield.length) return;
    const target = midfield[Math.min(midfield.length - 1, Math.round(index * (midfield.length - 1) / Math.max(1, defense.length - 1)))];
    add(back.slot.id, target.slot.id, 'defend', index % 2 ? 18 : -18);
  });
  if (keeper && defense.length) {
    add(keeper.slot.id, defense[0].slot.id, 'recycle', -36, 'saída curta');
    add(keeper.slot.id, defense[defense.length - 1].slot.id, 'recycle', 36, 'saída curta');
  }
  if (attack.length > 0 && midfield.length > 0) {
    const target = attack[Math.floor(attack.length / 2)];
    const source = midfield[Math.floor(midfield.length / 2)];
    add(target.slot.id, source.slot.id, 'movement', attack.length > 1 ? 34 : -34, 'apoio');
  }
  return arrows.slice(0, 24);
}

function posterArrows(config: TacticalPosterConfig, fieldX: number, fieldY: number, fieldW: number, fieldH: number, theme: PosterTheme): string {
  if (!resolvedOptions(config).showArrows) return '';
  const points = pointMap(config, fieldX, fieldY, fieldW, fieldH);
  const automatic = config.useAutomaticArrows === false ? [] : createDefaultTacticalPosterArrows(config.lineup);
  const manual = Array.isArray(config.manualArrows) ? config.manualArrows : [];
  const arrows = [...automatic, ...manual]
    .filter((item) => item.enabled !== false)
    .filter((item, index, all) => all.findIndex((other) => other.fromSlotId === item.fromSlotId && other.toSlotId === item.toSlotId && other.kind === item.kind && Math.round(other.bend) === Math.round(item.bend)) === index)
    .slice(0, 36);
  return arrows.map((item) => {
    const from = points.get(item.fromSlotId);
    const to = points.get(item.toSlotId);
    if (!from || !to || from.pick.slot.id === to.pick.slot.id) return '';
    const verticalDirection = to.y < from.y ? -1 : 1;
    return arrow(from.x, from.y + verticalDirection * 34, to.x, to.y - verticalDirection * 34, item.kind, theme, Math.max(-90, Math.min(90, Number(item.bend) || 0)), item.label || '');
  }).join('');
}

function bulletColumn(title: string, items: string[], x: number, y: number, width: number, accent: string, maxChars = 34): string {
  const lines = items.slice(0, 5).flatMap((item) => wrapText(item, maxChars, 2)).slice(0, 8);
  return `<g><text x="${x}" y="${y}" fill="${accent}" font-size="21" font-weight="900" font-family="Inter,Arial,sans-serif">${escapeXml(title.toUpperCase())}</text>${lines.map((line, index) => `<circle cx="${x + 6}" cy="${y + 34 + index * 25 - 5}" r="4" fill="${accent}"/>${textLines([line], x + 20, y + 34 + index * 25, { size: 15 })}`).join('')}<line x1="${x + width}" y1="${y - 18}" x2="${x + width}" y2="${y + 230}" stroke="#324656" stroke-width="1"/></g>`;
}

function svgDefs(theme: PosterTheme): string {
  return `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.bg0}"/><stop offset=".55" stop-color="${theme.bg1}"/><stop offset="1" stop-color="#010308"/></linearGradient><linearGradient id="panelGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.panel0}"/><stop offset="1" stop-color="${theme.panel1}"/></linearGradient><linearGradient id="field" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.field0}"/><stop offset="1" stop-color="${theme.field1}"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grain" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".7" fill="#fff" opacity=".05"/><circle cx="10" cy="11" r=".5" fill="#fff" opacity=".04"/></pattern><marker id="arrowGold" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${theme.accent}"/></marker><marker id="arrowCyan" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${theme.secondary}"/></marker><marker id="arrowBlue" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#2e78e8"/></marker><marker id="arrowMovement" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#f7dc63"/></marker></defs>`;
}

function pitch(fieldX: number, fieldY: number, fieldW: number, fieldH: number, content: string): string {
  return `<g><rect x="${fieldX}" y="${fieldY}" width="${fieldW}" height="${fieldH}" rx="20" fill="url(#field)" stroke="#9bb788" stroke-width="3"/><rect x="${fieldX + 16}" y="${fieldY + 16}" width="${fieldW - 32}" height="${fieldH - 32}" fill="none" stroke="#d6e1c9" stroke-opacity=".58" stroke-width="2"/><line x1="${fieldX + 16}" y1="${fieldY + fieldH / 2}" x2="${fieldX + fieldW - 16}" y2="${fieldY + fieldH / 2}" stroke="#d6e1c9" stroke-opacity=".58" stroke-width="2"/><circle cx="${fieldX + fieldW / 2}" cy="${fieldY + fieldH / 2}" r="${Math.min(fieldW, fieldH) * .095}" fill="none" stroke="#d6e1c9" stroke-opacity=".58" stroke-width="2"/><circle cx="${fieldX + fieldW / 2}" cy="${fieldY + fieldH / 2}" r="4" fill="#d6e1c9" opacity=".7"/><rect x="${fieldX + fieldW * .26}" y="${fieldY + 16}" width="${fieldW * .48}" height="${fieldH * .15}" fill="none" stroke="#d6e1c9" stroke-opacity=".58" stroke-width="2"/><rect x="${fieldX + fieldW * .26}" y="${fieldY + fieldH - 16 - fieldH * .15}" width="${fieldW * .48}" height="${fieldH * .15}" fill="none" stroke="#d6e1c9" stroke-opacity=".58" stroke-width="2"/>${content}</g>`;
}

function legend(x: number, y: number, width: number, height: number, theme: PosterTheme, focus: string[]): string {
  const narrow = width < 260;
  const textX = x + (narrow ? 77 : 84);
  const chars = narrow ? 12 : 38;
  const size = narrow ? 11 : 13;
  const pass = wrapText('Passe / apoio ofensivo', chars, 2);
  const recycle = wrapText('Reciclar / reorganizar', chars, 2);
  const defend = wrapText('Defesa / compactação', chars, 2);
  const movement = wrapText('Movimentação sem bola', chars, 2);
  const movementY = y + 252;
  const focusY = y + (narrow ? 330 : 320);
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="url(#panelGradient)" stroke="${theme.accent}" stroke-width="2"/><text x="${x + width / 2}" y="${y + 44}" text-anchor="middle" fill="${theme.accent}" font-size="23" font-weight="900" font-family="Inter,Arial,sans-serif">LEGENDA</text><line x1="${x + 18}" y1="${y + 75}" x2="${x + 62}" y2="${y + 75}" stroke="${theme.accent}" stroke-width="5" marker-end="url(#arrowGold)"/>${textLines(pass, textX, y + 75, { size, lineHeight: 16 })}<line x1="${x + 18}" y1="${y + 137}" x2="${x + 62}" y2="${y + 137}" stroke="${theme.secondary}" stroke-width="4" stroke-dasharray="9 7" marker-end="url(#arrowCyan)"/>${textLines(recycle, textX, y + 137, { size, lineHeight: 16 })}<line x1="${x + 18}" y1="${y + 199}" x2="${x + 62}" y2="${y + 199}" stroke="#2e78e8" stroke-width="4" marker-end="url(#arrowBlue)"/>${textLines(defend, textX, y + 199, { size, lineHeight: 16 })}<line x1="${x + 18}" y1="${movementY}" x2="${x + 62}" y2="${movementY}" stroke="#f7dc63" stroke-width="4" stroke-dasharray="7 7" marker-end="url(#arrowMovement)"/>${textLines(movement, textX, movementY, { size, lineHeight: 16 })}<circle cx="${x + 41}" cy="${focusY}" r="18" fill="none" stroke="${theme.accent}" stroke-width="4"/><circle cx="${x + 41}" cy="${focusY}" r="7" fill="${theme.accent}"/>${textLines(['FOCO'], textX, focusY - 4, { size: 12, weight: 900, fill: theme.accent })}${textLines(focus, textX, focusY + 21, { size: narrow ? 10 : 12, lineHeight: narrow ? 15 : 17 })}</g>`;
}

export function defaultTacticalPosterInstructions(formation: FormationBlueprint, style: TacticalStyle): TacticalPosterConfig['instructions'] {
  const styleName = styleLabel(style);
  return {
    passing: ['Prefira passes curtos e seguros.', 'Progrida pelos meias e laterais.', 'Mantenha triângulos ativos.', 'Evite passes longos sem opção.'],
    recycle: ['Sob pressão, volte a bola.', 'Use o goleiro e os zagueiros.', 'Reorganize antes de acelerar.'],
    attack: ['Ataque os espaços entre linhas.', 'Dê apoio e infiltre na hora certa.', 'Finalize somente com vantagem clara.'],
    defend: ['Mantenha a linha compacta.', 'Feche o centro primeiro.', 'Pressione sem abandonar sua zona.'],
    offensive: [`Use ${styleName} para controlar o ritmo.`, formation.behavior, 'Crie superioridade com aproximações.', 'Acelere apenas quando a linha abrir.'],
    defensive: ['Bloco compacto e linhas próximas.', 'Proteja a entrada da área.', 'Intercepte antes de perseguir.', 'Cada jogador cobre o próprio espaço.'],
    avoid: ['Forçar passes verticais sem opção.', 'Sair com o zagueiro para perseguir.', 'Perder a posse no centro.', formation.risk],
    whyItWorks: ['Aproxima os setores.', 'Cria linhas de passe curtas.', 'Reduz riscos desnecessários.', 'Mantém cobertura após perder a bola.']
  };
}

function createVerticalPosterSvg(config: TacticalPosterConfig): string {
  const theme = resolveTheme(config);
  const options = resolvedOptions(config);
  const fieldX = options.showInstructionPanels ? 215 : 40;
  const fieldY = 360;
  const fieldW = options.showInstructionPanels ? 595 : 765;
  const fieldH = 690;
  const coachStyle = styleLabel(config.style);
  const safeTitle = truncate(config.title || 'BUILDMASTER TÁTICO', 40);
  const safeSubtitle = truncate(config.subtitle || config.formation.name, 46);
  const titleFontSize = safeTitle.length > 30 ? 36 : safeTitle.length > 24 ? 46 : safeTitle.length > 19 ? 57 : 64;
  const focus = wrapText(config.focus || 'Segurança, construção e finalização inteligente.', 18, 4);
  const fieldContent = `${posterArrows(config, fieldX, fieldY, fieldW, fieldH, theme)}${posterPlayers(config, fieldX, fieldY, fieldW, fieldH, theme.accent)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536" role="img" aria-labelledby="posterTitle posterDescription"><title id="posterTitle">${escapeXml(safeTitle)} — ${escapeXml(config.formation.name)}</title><desc id="posterDescription">Infográfico tático criado localmente pelo BuildMaster, sem serviço externo.</desc>${svgDefs(theme)}<rect width="1024" height="1536" fill="url(#bg)"/><rect width="1024" height="1536" fill="url(#grain)"/><path d="M0 110 L125 0 M0 170 L185 0 M840 1536 L1024 1352 M900 1536 L1024 1412" stroke="${theme.accent}" stroke-width="3" opacity=".65"/><g filter="url(#glow)"><circle cx="92" cy="82" r="42" fill="#071522" stroke="${theme.accent}" stroke-width="3"/><path d="M67 82 Q92 57 117 82 Q92 107 67 82 Z" fill="none" stroke="${theme.accent}" stroke-width="7"/><text x="151" y="95" fill="${theme.accent}" font-size="${titleFontSize}" font-weight="1000" letter-spacing="1.4" font-family="Inter,Arial,sans-serif">${escapeXml(safeTitle.toUpperCase())}</text></g>${textLines([safeSubtitle], 512, 137, { size: 21, weight: 700, fill: '#c3d0dc', anchor: 'middle' })}<g><rect x="96" y="162" width="832" height="62" rx="16" fill="#07111b" stroke="${theme.accent}" stroke-width="2"/><text x="127" y="201" fill="#f2f6fa" font-size="24" font-weight="800" font-family="Inter,Arial,sans-serif">ESTILO DO TÉCNICO:</text><text x="415" y="201" fill="${theme.accent}" font-size="24" font-weight="900" font-family="Inter,Arial,sans-serif">${escapeXml(coachStyle.toUpperCase())}</text><rect x="96" y="236" width="832" height="62" rx="16" fill="#07111b" stroke="${theme.accent}" stroke-width="2"/><text x="127" y="275" fill="#f2f6fa" font-size="24" font-weight="800" font-family="Inter,Arial,sans-serif">FORMAÇÃO:</text><text x="300" y="275" fill="${theme.accent}" font-size="24" font-weight="900" font-family="Inter,Arial,sans-serif">${escapeXml(config.formation.name.toUpperCase())}</text></g>${options.showInstructionPanels ? `${panel(18, 330, 185, 190, theme.accent, '1. Passe certo', config.instructions.passing, '◎')}${panel(18, 530, 185, 190, theme.secondary, '2. Voltar a bola', config.instructions.recycle, '↻')}${panel(18, 730, 185, 190, theme.accent, '3. Atacar', config.instructions.attack, '↗')}${panel(18, 930, 185, 190, '#3e8cff', '4. Defender', config.instructions.defend, '⬡')}` : ''}${pitch(fieldX, fieldY, fieldW, fieldH, fieldContent)}${options.showLegend ? legend(822, 360, 184, 500, theme, focus) : ''}${options.showPrinciples ? `<g><rect x="18" y="1140" width="988" height="252" rx="22" fill="url(#panelGradient)" stroke="#33495b" stroke-width="2"/>${bulletColumn('Princípios ofensivos', config.instructions.offensive, 54, 1183, 287, theme.accent)}${bulletColumn('Princípios defensivos', config.instructions.defensive, 376, 1183, 287, '#3e8cff')}${bulletColumn('Por que rende', config.instructions.whyItWorks, 697, 1183, 270, theme.accent)}</g>` : ''}<g><rect x="35" y="1407" width="954" height="75" rx="18" fill="#160a0d" stroke="${theme.danger}" stroke-width="2"/><text x="63" y="1438" fill="${theme.danger}" font-size="18" font-weight="900" font-family="Inter,Arial,sans-serif">ERROS A EVITAR</text>${config.instructions.avoid.slice(0, 3).map((item, index) => `<text x="${250 + (index % 2) * 355}" y="${1435 + Math.floor(index / 2) * 27}" fill="#f1c4c7" font-size="14" font-weight="650" font-family="Inter,Arial,sans-serif">× ${escapeXml(truncate(item, 42))}</text>`).join('')}</g>${options.showFooter ? `<text x="512" y="1515" text-anchor="middle" fill="#7f93a4" font-size="13" font-weight="600" font-family="Inter,Arial,sans-serif">GERADO LOCALMENTE PELO BUILDMASTER • SEM API PAGA • SVG/PNG EDITÁVEL</text>` : ''}</svg>`;
}

function createHorizontalPosterSvg(config: TacticalPosterConfig): string {
  const theme = resolveTheme(config);
  const options = resolvedOptions(config);
  const fieldX = 45;
  const fieldY = 205;
  const fieldW = 855;
  const fieldH = 690;
  const safeTitle = truncate(config.title || 'BUILDMASTER TÁTICO', 44);
  const safeSubtitle = truncate(config.subtitle || config.formation.name, 55);
  const titleFontSize = safeTitle.length > 34 ? 42 : safeTitle.length > 27 ? 48 : 55;
  const focus = wrapText(config.focus || 'Segurança, construção e finalização inteligente.', 44, 3);
  const fieldContent = `${posterArrows(config, fieldX, fieldY, fieldW, fieldH, theme)}${posterPlayers(config, fieldX, fieldY, fieldW, fieldH, theme.accent)}`;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024" role="img" aria-labelledby="posterTitleHorizontal"><title id="posterTitleHorizontal">${escapeXml(safeTitle)} — ${escapeXml(config.formation.name)}</title>${svgDefs(theme)}<rect width="1536" height="1024" fill="url(#bg)"/><rect width="1536" height="1024" fill="url(#grain)"/><path d="M0 105 L130 0 M0 155 L185 0 M1350 1024 L1536 838 M1410 1024 L1536 898" stroke="${theme.accent}" stroke-width="3" opacity=".6"/><g filter="url(#glow)"><circle cx="78" cy="72" r="38" fill="#071522" stroke="${theme.accent}" stroke-width="3"/><path d="M56 72 Q78 50 100 72 Q78 94 56 72 Z" fill="none" stroke="${theme.accent}" stroke-width="6"/><text x="135" y="85" fill="${theme.accent}" font-size="${titleFontSize}" font-weight="1000" font-family="Inter,Arial,sans-serif">${escapeXml(safeTitle.toUpperCase())}</text></g>${textLines([safeSubtitle], 805, 122, { size: 22, weight: 800, fill: '#cbd7e1', anchor: 'middle' })}<rect x="45" y="145" width="1450" height="44" rx="13" fill="#07111b" stroke="${theme.accent}" stroke-width="2"/><text x="72" y="174" fill="#f2f6fa" font-size="19" font-weight="800" font-family="Inter,Arial,sans-serif">ESTILO: <tspan fill="${theme.accent}">${escapeXml(styleLabel(config.style).toUpperCase())}</tspan>  •  FORMAÇÃO: <tspan fill="${theme.accent}">${escapeXml(config.formation.name.toUpperCase())}</tspan></text>${pitch(fieldX, fieldY, fieldW, fieldH, fieldContent)}${options.showInstructionPanels ? `${panel(930, 205, 275, 205, theme.accent, '1. Passe certo', config.instructions.passing, '◎', true)}${panel(1220, 205, 275, 205, theme.secondary, '2. Voltar', config.instructions.recycle, '↻', true)}${panel(930, 425, 275, 205, theme.accent, '3. Atacar', config.instructions.attack, '↗', true)}${panel(1220, 425, 275, 205, '#3e8cff', '4. Defender', config.instructions.defend, '⬡', true)}` : ''}${options.showLegend ? legend(930, 645, 565, 250, theme, focus) : ''}${options.showPrinciples ? `<g><rect x="45" y="915" width="1450" height="82" rx="18" fill="url(#panelGradient)" stroke="#33495b" stroke-width="2"/><text x="75" y="947" fill="${theme.accent}" font-size="17" font-weight="900" font-family="Inter,Arial,sans-serif">OFENSIVO:</text>${textLines([truncate(config.instructions.offensive.join(' • '), 100)], 190, 947, { size: 14 })}<text x="75" y="977" fill="#3e8cff" font-size="17" font-weight="900" font-family="Inter,Arial,sans-serif">DEFENSIVO:</text>${textLines([truncate(config.instructions.defensive.join(' • '), 100)], 190, 977, { size: 14 })}<text x="930" y="947" fill="${theme.danger}" font-size="17" font-weight="900" font-family="Inter,Arial,sans-serif">EVITAR:</text>${textLines([truncate(config.instructions.avoid.join(' • '), 62)], 1010, 947, { size: 14 })}<text x="930" y="977" fill="${theme.accent}" font-size="17" font-weight="900" font-family="Inter,Arial,sans-serif">RENDE:</text>${textLines([truncate(config.instructions.whyItWorks.join(' • '), 62)], 1000, 977, { size: 14 })}</g>` : ''}${options.showFooter ? `<text x="1490" y="1008" text-anchor="end" fill="#7f93a4" font-size="11" font-family="Inter,Arial,sans-serif">BUILDMASTER • LOCAL • SEM API PAGA</text>` : ''}</svg>`;
}

export function createTacticalPosterSvg(config: TacticalPosterConfig): string {
  return (config.orientation ?? 'vertical') === 'horizontal' ? createHorizontalPosterSvg(config) : createVerticalPosterSvg(config);
}
