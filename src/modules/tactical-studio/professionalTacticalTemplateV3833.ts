import {
  getMetaFormation,
  type MetaFormationDefinition,
  type MetaFormationExportFormat,
  type MetaFormationProject,
  type MetaFormationSlot,
  type TacticalArrowKind
} from './metaFormationStudioV3832';

export const PROFESSIONAL_TACTICAL_TEMPLATE_VERSION = '40.10.0';

const GOLD = '#d8a92d';
const GOLD_LIGHT = '#ffe08a';
const SOFT_WHITE = '#f3f0e7';
const MUTED = '#b9c2c9';
const CYAN = '#12b5e5';
const BLUE = '#1672d4';
const FIELD = '#254e22';
const FIELD_LIGHT = '#315f29';

const ARROW_COLOR: Record<TacticalArrowKind, string> = {
  'short-pass': '#e4b238',
  'vertical-pass': '#f0bf3e',
  run: '#55d27b',
  recovery: CYAN,
  cover: BLUE,
  rotation: '#d8e0e6'
};

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function splitWords(value: string, maxChars: number, maxLines: number): string[] {
  const words = normalizeText(value).split(' ').filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(' ').split(' ').length;
  if (consumed < words.length && lines.length) {
    const last = lines.length - 1;
    lines[last] = `${lines[last].replace(/[.,;:!?-]*$/, '')}…`;
  }
  return lines;
}

function multilineText(options: {
  x: number;
  y: number;
  text: string;
  widthChars: number;
  maxLines: number;
  fontSize: number;
  lineHeight?: number;
  fill?: string;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  family?: string;
  className?: string;
}): string {
  const lines = splitWords(options.text, options.widthChars, options.maxLines);
  const lineHeight = options.lineHeight ?? Math.round(options.fontSize * 1.3);
  const anchor = options.anchor ?? 'start';
  return `<text x="${options.x}" y="${options.y}" text-anchor="${anchor}" fill="${options.fill ?? SOFT_WHITE}" font-family="${options.family ?? 'Arial,Helvetica,sans-serif'}" font-size="${options.fontSize}" font-weight="${options.weight ?? 500}"${options.className ? ` class="${options.className}"` : ''}>${lines.map((line, index) => `<tspan x="${options.x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`).join('')}</text>`;
}

function panel(x: number, y: number, width: number, height: number, radius = 12): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#panelGradient)" stroke="url(#goldStroke)" stroke-width="2" filter="url(#panelShadow)"/>`;
}

function sectionTitle(x: number, y: number, label: string, color = GOLD, size = 20): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="900" letter-spacing="1">${esc(label.toUpperCase())}</text>`;
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const values: string[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + index * Math.PI / points;
    values.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return values.join(' ');
}

function starIcon(cx: number, cy: number, size: number, fill = GOLD): string {
  return `<polygon points="${starPoints(cx, cy, size, size * .44)}" fill="${fill}"/>`;
}

function vectorIcon(kind: 'check' | 'refresh' | 'attack' | 'shield', x: number, y: number, color: string): string {
  if (kind === 'check') return `<circle cx="${x + 15}" cy="${y - 8}" r="15" fill="none" stroke="${color}" stroke-width="3"/><path d="M${x + 6} ${y - 8} l7 7 l13 -16" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'refresh') return `<path d="M${x + 4} ${y - 8} a14 14 0 0 1 23 -10 l5 -5 v13 h-13 l5 -5 a10 10 0 1 0 1 17" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'attack') return `<path d="M${x + 15} ${y + 8} V${y - 22} M${x + 15} ${y - 22} l-10 10 M${x + 15} ${y - 22} l10 10" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<path d="M${x + 15} ${y - 25} l13 6 v12 c0 12 -7 20 -13 24 c-6 -4 -13 -12 -13 -24 v-12 z" fill="none" stroke="${color}" stroke-width="3"/>`;
}

function trophyIcon(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})"><path d="M18 5 h52 v25 c0 25 -12 38 -26 43 c-14 -5 -26 -18 -26 -43 z" fill="url(#goldBar)" stroke="${GOLD_LIGHT}" stroke-width="2"/><path d="M18 14 H5 v10 c0 18 11 28 24 30 M70 14 h13 v10 c0 18 -11 28 -24 30" fill="none" stroke="${GOLD}" stroke-width="5"/><rect x="38" y="75" width="12" height="16" fill="${GOLD}"/><rect x="25" y="90" width="38" height="8" rx="3" fill="${GOLD_LIGHT}"/><rect x="17" y="98" width="54" height="8" rx="3" fill="${GOLD}"/></g>`;
}

function starRow(x: number, y: number, score: number, size = 18): string {
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));
  return Array.from({ length: 5 }, (_, index) => starIcon(x + index * (size + 4), y - size * .45, size * .48, index < stars ? GOLD : '#34404a')).join('');
}

function ratingBar(x: number, y: number, label: string, score: number, width = 122): string {
  const fillWidth = Math.max(8, Math.round(width * Math.max(0, Math.min(100, score)) / 100));
  return `<text x="${x}" y="${y + 14}" fill="${SOFT_WHITE}" font-size="15" font-weight="700" font-family="Arial">${esc(label.toUpperCase())}</text><rect x="${x + 102}" y="${y}" width="${width}" height="16" rx="3" fill="#1b2730" stroke="#5d4a19"/><rect x="${x + 102}" y="${y}" width="${fillWidth}" height="16" rx="3" fill="url(#goldBar)"/>${starRow(x + 238, y + 15, score, 16)}`;
}

function instructionBlock(options: { x: number; y: number; width: number; icon: 'check' | 'refresh' | 'attack' | 'shield'; title: string; text: string; accent?: string; maxLines?: number }): string {
  const accent = options.accent ?? GOLD;
  const titleSize = options.title.length > 16 ? 14 : 16;
  return `<g>${vectorIcon(options.icon, options.x, options.y, accent)}<text x="${options.x + 39}" y="${options.y - 4}" fill="${accent}" font-family="Arial,Helvetica,sans-serif" font-size="${titleSize}" font-weight="900">${esc(options.title.toUpperCase())}</text>${multilineText({ x: options.x, y: options.y + 34, text: options.text, widthChars: Math.max(18, Math.floor(options.width / 8.4)), maxLines: options.maxLines ?? 6, fontSize: 15, lineHeight: 22, fill: SOFT_WHITE })}</g>`;
}

function bulletList(x: number, y: number, width: number, values: string[], accent: string, maxItems = 5): string {
  return values.slice(0, maxItems).map((value, index) => {
    const top = y + index * 57;
    return `${starIcon(x + 10, top - 6, 10, accent)}${multilineText({ x: x + 30, y: top - 2, text: value, widthChars: Math.max(15, Math.floor(width / 8.5)), maxLines: 2, fontSize: 14, lineHeight: 18, fill: SOFT_WHITE, weight: 700 })}`;
  }).join('');
}

function definitionText(project: MetaFormationProject, key: keyof MetaFormationProject['customTexts'], fallback: string): string {
  return normalizeText(project.customTexts[key] || fallback);
}

function getPosition(project: MetaFormationProject, slot: MetaFormationSlot): { x: number; y: number } {
  const assigned = project.assignments[slot.id];
  return { x: assigned?.x ?? slot.x, y: assigned?.y ?? slot.y };
}

function shortenLine(x1: number, y1: number, x2: number, y2: number, startGap = 42, endGap = 48) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    x1: x1 + dx / length * startGap,
    y1: y1 + dy / length * startGap,
    x2: x2 - dx / length * endGap,
    y2: y2 - dy / length * endGap
  };
}

function tacticalArrowPath(project: MetaFormationProject, formation: MetaFormationDefinition, field: { x: number; y: number; w: number; h: number }): string {
  if (!project.appearance.showArrows) return '';
  const slotById = new Map(formation.slots.map((slot) => [slot.id, slot]));
  const existingKeys = new Set(project.arrows.filter((arrow) => arrow.enabled && arrow.toSlotId).map((arrow) => `${arrow.fromSlotId}>${arrow.toSlotId}`));
  const supplements: Array<{ fromSlotId: string; toSlotId: string; kind: TacticalArrowKind }> = [];
  const addSupplement = (from?: MetaFormationSlot, to?: MetaFormationSlot, kind: TacticalArrowKind = 'short-pass') => {
    if (!from || !to || from.id === to.id) return;
    const direct = `${from.id}>${to.id}`;
    const reverse = `${to.id}>${from.id}`;
    if (existingKeys.has(direct) || existingKeys.has(reverse) || supplements.some((item) => `${item.fromSlotId}>${item.toSlotId}` === direct || `${item.fromSlotId}>${item.toSlotId}` === reverse)) return;
    supplements.push({ fromSlotId: from.id, toSlotId: to.id, kind });
  };
  const byY = [...formation.slots].sort((a, b) => getPosition(project, a).y - getPosition(project, b).y);
  const attackers = byY.filter((slot) => getPosition(project, slot).y <= 30);
  const creators = byY.filter((slot) => {
    const y = getPosition(project, slot).y;
    return y > 30 && y <= 48;
  });
  const midfielders = byY.filter((slot) => {
    const y = getPosition(project, slot).y;
    return y > 48 && y <= 70;
  });
  const defenders = byY.filter((slot) => {
    const y = getPosition(project, slot).y;
    return y > 70 && y <= 90;
  });
  const keeper = byY.find((slot) => slot.position === 'GOL');
  const nearest = (source: MetaFormationSlot, candidates: MetaFormationSlot[]) => [...candidates].sort((a, b) => {
    const sa = getPosition(project, source);
    const pa = getPosition(project, a);
    const pb = getPosition(project, b);
    return Math.hypot(sa.x - pa.x, sa.y - pa.y) - Math.hypot(sa.x - pb.x, sa.y - pb.y);
  });
  if (attackers.length >= 2) addSupplement(attackers[0], attackers[1], 'short-pass');
  for (const attacker of attackers) addSupplement(attacker, nearest(attacker, creators.length ? creators : midfielders)[0], 'vertical-pass');
  for (const creator of creators) for (const target of nearest(creator, midfielders).slice(0, 2)) addSupplement(creator, target, 'short-pass');
  for (const midfielder of midfielders) addSupplement(midfielder, nearest(midfielder, defenders)[0], midfielder.position === 'VOL' ? 'cover' : 'short-pass');
  const centerBacks = defenders.filter((slot) => slot.position === 'ZAG');
  if (centerBacks.length >= 2) addSupplement(centerBacks[0], centerBacks[1], 'cover');
  if (keeper) addSupplement(keeper, nearest(keeper, centerBacks.length ? centerBacks : defenders)[0], 'short-pass');
  const fullbacks = defenders.filter((slot) => ['LE', 'LD', 'ALA'].includes(slot.position));
  for (const fullback of fullbacks) addSupplement(fullback, nearest(fullback, midfielders)[0], 'recovery');

  const renderArrow = (from: MetaFormationSlot, targetPoint: { x: number; y: number }, kind: TacticalArrowKind, index: number, supplemental: boolean) => {
    const fromPoint = getPosition(project, from);
    const rawX1 = field.x + field.w * fromPoint.x / 100;
    const rawY1 = field.y + field.h * Math.min(90, fromPoint.y) / 100;
    const rawX2 = field.x + field.w * targetPoint.x / 100;
    const rawY2 = field.y + field.h * Math.min(90, targetPoint.y) / 100;
    const points = shortenLine(rawX1, rawY1, rawX2, rawY2, supplemental ? 48 : 46, supplemental ? 54 : 52);
    const curveSign = index % 2 === 0 ? 1 : -1;
    const curve = kind === 'recovery' || kind === 'cover' ? 24 * curveSign : kind === 'rotation' ? 36 * curveSign : 10 * curveSign;
    const mx = (points.x1 + points.x2) / 2;
    const my = (points.y1 + points.y2) / 2;
    const dx = points.x2 - points.x1;
    const dy = points.y2 - points.y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const cx = mx - dy / len * curve;
    const cy = my + dx / len * curve;
    const dash = kind === 'vertical-pass' || kind === 'recovery' || kind === 'rotation' ? '14 10' : '';
    return `<path d="M ${points.x1.toFixed(1)} ${points.y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${points.x2.toFixed(1)} ${points.y2.toFixed(1)}" fill="none" stroke="${ARROW_COLOR[kind]}" stroke-width="${supplemental ? 3.5 : 5}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#arrow-${kind})" opacity="${supplemental ? '.62' : '.94'}"/>`;
  };

  const explicit = project.arrows.filter((arrow) => arrow.enabled).map((arrow, index) => {
    const from = slotById.get(arrow.fromSlotId);
    if (!from) return '';
    const targetSlot = arrow.toSlotId ? slotById.get(arrow.toSlotId) : undefined;
    const fromPoint = getPosition(project, from);
    const targetPoint = targetSlot ? getPosition(project, targetSlot) : { x: fromPoint.x, y: Math.max(4, fromPoint.y - 16) };
    return renderArrow(from, targetPoint, arrow.kind, index, false);
  }).join('');
  const generated = supplements.slice(0, 10).map((arrow, index) => {
    const from = slotById.get(arrow.fromSlotId);
    const to = slotById.get(arrow.toSlotId);
    if (!from || !to) return '';
    return renderArrow(from, getPosition(project, to), arrow.kind, project.arrows.length + index, true);
  }).join('');
  return explicit + generated;
}

function playerNodes(project: MetaFormationProject, formation: MetaFormationDefinition, field: { x: number; y: number; w: number; h: number }): string {
  return formation.slots.map((slot) => {
    const assigned = project.assignments[slot.id];
    const point = getPosition(project, slot);
    const x = field.x + field.w * point.x / 100;
    const safeY = Math.max(7, Math.min(90, point.y));
    const y = field.y + field.h * safeY / 100;
    const style = assigned?.style || slot.recommendedStyles[0];
    const secondary = assigned?.playerName || (slot.side === 'centro' ? '' : slot.side);
    const nodeFill = slot.position === 'GOL' ? 'url(#keeperGradient)' : 'url(#playerGradient)';
    const shirt = project.appearance.shirt === 'minimalista'
      ? `<circle cx="0" cy="0" r="38" fill="${nodeFill}" stroke="url(#goldStroke)" stroke-width="2"/>`
      : `<path d="M-38,-18 L-22,-35 L-9,-27 L9,-27 L22,-35 L38,-18 L29,-2 L25,36 L-25,36 L-29,-2 Z" fill="${nodeFill}" stroke="url(#goldStroke)" stroke-width="2" filter="url(#nodeShadow)"/>`;
    const pillWidth = Math.max(130, Math.min(174, 54 + style.length * 7));
    const pillFont = style.length > 20 ? 11 : style.length > 16 ? 12 : 13;
    return `<g data-slot="${esc(slot.id)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${shirt}<text x="0" y="4" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="28" font-weight="900" font-family="Arial">${esc(slot.position)}</text>${secondary ? `<text x="0" y="23" text-anchor="middle" fill="${SOFT_WHITE}" font-size="12" font-weight="700" font-family="Arial">${esc(secondary)}</text>` : ''}<rect x="${-pillWidth / 2}" y="42" width="${pillWidth}" height="31" rx="7" fill="#02070c" stroke="${GOLD}" stroke-width="1.4"/><text x="0" y="63" text-anchor="middle" fill="${SOFT_WHITE}" font-size="${pillFont}" font-weight="700" font-family="Arial">${esc(style)}</text></g>`;
  }).join('');
}

function fieldMarkup(project: MetaFormationProject, formation: MetaFormationDefinition, field: { x: number; y: number; w: number; h: number }): string {
  const stripeWidth = field.w / 10;
  const stripes = Array.from({ length: 10 }, (_, index) => `<rect x="${field.x + index * stripeWidth}" y="${field.y}" width="${stripeWidth}" height="${field.h}" fill="${index % 2 === 0 ? FIELD : FIELD_LIGHT}" opacity=".94"/>`).join('');
  const centerX = field.x + field.w / 2;
  const centerY = field.y + field.h / 2;
  const line = '#d2d8c1';
  const arrows = tacticalArrowPath(project, formation, field);
  const nodes = playerNodes(project, formation, field);
  return `<g clip-path="url(#fieldClip)"><rect x="${field.x}" y="${field.y}" width="${field.w}" height="${field.h}" rx="8" fill="#24491f"/>${stripes}<rect x="${field.x}" y="${field.y}" width="${field.w}" height="${field.h}" fill="url(#grassNoise)" opacity=".25"/><rect x="${field.x + 18}" y="${field.y + 18}" width="${field.w - 36}" height="${field.h - 36}" fill="none" stroke="${line}" stroke-width="3" opacity=".74"/><line x1="${field.x + 18}" y1="${centerY}" x2="${field.x + field.w - 18}" y2="${centerY}" stroke="${line}" stroke-width="3" opacity=".7"/><circle cx="${centerX}" cy="${centerY}" r="${Math.round(field.w * .105)}" fill="none" stroke="${line}" stroke-width="3" opacity=".7"/><circle cx="${centerX}" cy="${centerY}" r="4" fill="${line}"/><rect x="${field.x + field.w * .25}" y="${field.y + 18}" width="${field.w * .5}" height="${field.h * .16}" fill="none" stroke="${line}" stroke-width="3" opacity=".7"/><rect x="${field.x + field.w * .38}" y="${field.y + 18}" width="${field.w * .24}" height="${field.h * .065}" fill="none" stroke="${line}" stroke-width="3" opacity=".7"/><rect x="${field.x + field.w * .25}" y="${field.y + field.h - field.h * .16 - 18}" width="${field.w * .5}" height="${field.h * .16}" fill="none" stroke="${line}" stroke-width="3" opacity=".7"/><rect x="${field.x + field.w * .38}" y="${field.y + field.h - field.h * .065 - 18}" width="${field.w * .24}" height="${field.h * .065}" fill="none" stroke="${line}" stroke-width="3" opacity=".7"/><circle cx="${centerX}" cy="${field.y + field.h * .115}" r="4" fill="${line}"/><circle cx="${centerX}" cy="${field.y + field.h * .885}" r="4" fill="${line}"/>${arrows}${nodes}</g><rect x="${field.x}" y="${field.y}" width="${field.w}" height="${field.h}" rx="8" fill="none" stroke="url(#goldStroke)" stroke-width="3" filter="url(#panelShadow)"/>`;
}

function baseDefs(field: { x: number; y: number; w: number; h: number }): string {
  const markers = (Object.keys(ARROW_COLOR) as TacticalArrowKind[]).map((kind) => `<marker id="arrow-${kind}" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,1 L14,8 L0,15 Z" fill="${ARROW_COLOR[kind]}"/></marker>`).join('');
  return `<defs>${markers}<linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#02070e"/><stop offset=".52" stop-color="#061422"/><stop offset="1" stop-color="#01050a"/></linearGradient><linearGradient id="panelGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d2d"/><stop offset="1" stop-color="#030a12"/></linearGradient><linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7f5705"/><stop offset=".35" stop-color="#ffe08a"/><stop offset=".65" stop-color="#b57b0e"/><stop offset="1" stop-color="#f5cd62"/></linearGradient><linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f5705"/><stop offset=".45" stop-color="#f1c451"/><stop offset="1" stop-color="#a96e06"/></linearGradient><radialGradient id="playerGradient" cx="35%" cy="25%" r="75%"><stop offset="0" stop-color="#173b5b"/><stop offset=".55" stop-color="#071726"/><stop offset="1" stop-color="#01060c"/></radialGradient><radialGradient id="keeperGradient" cx="35%" cy="25%" r="75%"><stop offset="0" stop-color="#4c781e"/><stop offset=".58" stop-color="#1f420e"/><stop offset="1" stop-color="#071006"/></radialGradient><pattern id="starDust" width="90" height="90" patternUnits="userSpaceOnUse"><circle cx="8" cy="16" r="1" fill="#d6a329" opacity=".25"/><circle cx="63" cy="36" r=".7" fill="#f2d37b" opacity=".18"/><circle cx="35" cy="76" r=".8" fill="#89a6ba" opacity=".14"/></pattern><pattern id="grassNoise" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M1 18 L6 7 M14 22 L18 12 M8 14 L12 3" stroke="#d7e4c1" stroke-width=".6" opacity=".2"/></pattern><filter id="panelShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".65"/></filter><filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".9"/></filter><clipPath id="fieldClip"><rect x="${field.x}" y="${field.y}" width="${field.w}" height="${field.h}" rx="8"/></clipPath></defs>`;
}

function decorativeFrame(width: number, height: number): string {
  const corner = (x: number, y: number, sx: number, sy: number) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M0 0 H120 L82 18 H18 V82 L0 120 Z" fill="url(#goldStroke)"/><path d="M12 0 H92 L70 10 H22 V70 L12 92 Z" fill="#020812"/><path d="M30 0 H66 L48 8 H28 V48 L20 66 V18 Z" fill="${GOLD}" opacity=".9"/></g>`;
  return `<rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="url(#goldStroke)" stroke-width="4"/><rect x="18" y="18" width="${width - 36}" height="${height - 36}" fill="none" stroke="#7a5a17" stroke-width="1.5"/>${corner(8, 8, 1, 1)}${corner(width - 8, 8, -1, 1)}${corner(8, height - 8, 1, -1)}${corner(width - 8, height - 8, -1, -1)}`;
}

function metaBadge(x: number, y: number, width: number, height: number): string {
  const points = `${x + width * .15},${y} ${x + width * .85},${y} ${x + width},${y + height * .17} ${x + width},${y + height * .8} ${x + width * .5},${y + height} ${x},${y + height * .8} ${x},${y + height * .17}`;
  return `<polygon points="${points}" fill="url(#panelGradient)" stroke="url(#goldStroke)" stroke-width="3" filter="url(#panelShadow)"/>${starIcon(x + width / 2, y + 37, 18, GOLD)}<text x="${x + width / 2}" y="${y + 82}" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="25" font-weight="900" font-family="Arial">META</text><text x="${x + width / 2}" y="${y + 108}" text-anchor="middle" fill="${GOLD}" font-size="17" font-weight="800" font-family="Arial">PERSONALIZADA</text><line x1="${x + 28}" y1="${y + 128}" x2="${x + width - 28}" y2="${y + 128}" stroke="#785914"/><text x="${x + width / 2}" y="${y + 155}" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="15" font-weight="800" font-family="Arial">FORA DO PADRÃO</text><text x="${x + width / 2}" y="${y + 177}" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="15" font-weight="800" font-family="Arial">NÃO OFICIAL</text>`;
}

function renderFullPoster(project: MetaFormationProject, formation: MetaFormationDefinition, width: number, height: number): string {
  const scaleX = width / 1080;
  const scaleY = height / 1920;
  const field = { x: 230, y: 422, w: 625, h: 1000 };
  const passing = definitionText(project, 'passing', formation.startPlay[0] || 'Use passes curtos e seguros para atrair a marcação.');
  const recycle = definitionText(project, 'recycle', formation.recycleWhen[0] || 'Recue a bola quando o corredor estiver bloqueado.');
  const attack = definitionText(project, 'attack', formation.attackPlan[0] || 'Acelere quando surgir vantagem entre as linhas.');
  const defense = definitionText(project, 'defense', formation.defensePlan[0] || 'Proteja o centro e mantenha a última linha compacta.');
  const alert = definitionText(project, 'alert', formation.avoid[0] || 'Evite retirar os dois zagueiros da linha ao mesmo tempo.');
  const why = definitionText(project, 'why', formation.whyItWorks);
  const success = project.customTexts.success ? splitWords(project.customTexts.success, 42, 5) : [...formation.successKeys, ...formation.strengths.filter((item) => !formation.successKeys.includes(item))].slice(0, 5);
  const offensive = project.customTexts.offensive ? splitWords(project.customTexts.offensive, 62, 4) : formation.offensivePrinciples;
  const defensive = project.customTexts.defensive ? splitWords(project.customTexts.defensive, 62, 4) : formation.defensivePrinciples;
  const title = normalizeText(project.name || formation.commercialName);
  const header = `<text x="540" y="58" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="34" font-weight="900" letter-spacing="3" font-family="Arial">MODELO GERADO PELO APP</text><g transform="translate(115 80)"><circle cx="0" cy="24" r="29" fill="none" stroke="url(#goldStroke)" stroke-width="10"/><path d="M-35 24 H35" stroke="${GOLD_LIGHT}" stroke-width="10"/></g><text x="540" y="154" text-anchor="middle" fill="url(#goldStroke)" font-size="72" font-weight="900" font-family="Arial,Helvetica,sans-serif" letter-spacing="-2">eFOOTBALL 2026</text><text x="540" y="191" text-anchor="middle" fill="${SOFT_WHITE}" font-size="20" font-weight="700" letter-spacing="2" font-family="Arial">GUIA TÁTICO INTELIGENTE • FORMAÇÃO PERSONALIZADA</text>`;
  const infoBars = `${panel(52, 216, 768, 62, 8)}<circle cx="85" cy="247" r="13" fill="none" stroke="${GOLD}" stroke-width="3"/><path d="M85 228 V236 M85 258 V266 M66 247 H74 M96 247 H104" stroke="${GOLD}" stroke-width="3"/><text x="126" y="255" fill="${SOFT_WHITE}" font-size="21" font-weight="800" font-family="Arial">ESTILO DO TÉCNICO:</text><text x="785" y="255" text-anchor="end" fill="${GOLD}" font-size="23" font-weight="900" font-family="Arial">${esc(project.style.toUpperCase())}</text>${panel(52, 290, 768, 62, 8)}<rect x="70" y="310" width="29" height="25" fill="none" stroke="${GOLD}" stroke-width="2"/><line x1="84.5" y1="310" x2="84.5" y2="335" stroke="${GOLD}"/><circle cx="84.5" cy="322.5" r="4" fill="none" stroke="${GOLD}"/><text x="126" y="329" fill="${SOFT_WHITE}" font-size="21" font-weight="800" font-family="Arial">FORMAÇÃO PERSONALIZADA:</text><text x="785" y="329" text-anchor="end" fill="${GOLD}" font-size="22" font-weight="900" font-family="Arial">${esc(title.toUpperCase())}</text>${metaBadge(840, 214, 188, 202)}`;
  const leftPanel = project.appearance.showInstructions ? `${panel(24, 405, 190, 790)}${instructionBlock({ x: 43, y: 448, width: 150, icon: 'check', title: '1. Passe certo', text: passing, maxLines: 7 })}<line x1="42" y1="646" x2="194" y2="646" stroke="#876314"/>${instructionBlock({ x: 43, y: 690, width: 150, icon: 'refresh', title: '2. Quando voltar', text: recycle, accent: CYAN, maxLines: 7 })}<line x1="42" y1="893" x2="194" y2="893" stroke="#876314"/>${instructionBlock({ x: 43, y: 937, width: 150, icon: 'attack', title: '3. Quando atacar', text: attack, maxLines: 7 })}${panel(24, 1210, 190, 220)}${instructionBlock({ x: 43, y: 1251, width: 150, icon: 'shield', title: '4. Como defender', text: defense, accent: CYAN, maxLines: 7 })}` : '';
  const rightPanels = `${panel(870, 405, 184, 278)}<text x="962" y="443" text-anchor="middle" fill="${GOLD}" font-size="20" font-weight="900" font-family="Arial">LEGENDA</text><line x1="895" y1="461" x2="1028" y2="461" stroke="#876314"/><line x1="895" y1="504" x2="924" y2="504" stroke="${GOLD}" stroke-width="5"/><polygon points="924,496 940,504 924,512" fill="${GOLD}"/>${multilineText({ x: 945, y: 494, text: 'Combinação / movimento ofensivo', widthChars: 16, maxLines: 3, fontSize: 14, lineHeight: 20, fill: SOFT_WHITE, weight: 700 })}<line x1="895" y1="592" x2="924" y2="592" stroke="${CYAN}" stroke-width="5" stroke-dasharray="9 6"/><polygon points="924,584 940,592 924,600" fill="${CYAN}"/>${multilineText({ x: 945, y: 582, text: 'Recuperação / cobertura defensiva', widthChars: 16, maxLines: 3, fontSize: 14, lineHeight: 20, fill: SOFT_WHITE, weight: 700 })}${panel(870, 705, 184, 490)}<text x="962" y="747" text-anchor="middle" fill="${GOLD}" font-size="18" font-weight="900" font-family="Arial"><tspan x="962">CHAVES DO</tspan><tspan x="962" dy="22">SUCESSO</tspan></text>${bulletList(890, 798, 145, success, GOLD, 5)}`;
  const warning = `${panel(245, 1443, 595, 58, 10)}<circle cx="278" cy="1472" r="16" fill="none" stroke="${GOLD}" stroke-width="3"/><text x="278" y="1479" text-anchor="middle" fill="${GOLD}" font-size="22" font-weight="900" font-family="Arial">!</text>${multilineText({ x: 306, y: 1478, text: alert, widthChars: 56, maxLines: 1, fontSize: 17, fill: GOLD_LIGHT, weight: 900 })}`;
  const principles = `${panel(218, 1519, 836, 170)}<line x1="636" y1="1542" x2="636" y2="1668" stroke="#8f6b1b" stroke-width="2"/><text x="427" y="1553" text-anchor="middle" fill="${GOLD}" font-size="18" font-weight="900" font-family="Arial">PRINCÍPIOS OFENSIVOS</text>${offensive.slice(0, 4).map((item, index) => `<circle cx="251" cy="${1581 + index * 25}" r="5" fill="none" stroke="${GOLD}" stroke-width="2"/>${multilineText({ x: 270, y: 1586 + index * 25, text: item, widthChars: 42, maxLines: 1, fontSize: 14, fill: SOFT_WHITE })}`).join('')}<text x="845" y="1553" text-anchor="middle" fill="${GOLD}" font-size="18" font-weight="900" font-family="Arial">PRINCÍPIOS DEFENSIVOS</text>${defensive.slice(0, 4).map((item, index) => `<path d="M${658} ${1574 + index * 25} l7 -4 l7 4 v8 c0 6 -4 10 -7 12 c-3 -2 -7 -6 -7 -12 z" fill="none" stroke="${CYAN}" stroke-width="2"/>${multilineText({ x: 684, y: 1586 + index * 25, text: item, widthChars: 39, maxLines: 1, fontSize: 14, fill: SOFT_WHITE })}`).join('')}`;
  const whyPanel = `${panel(43, 1710, 994, 154, 12)}${trophyIcon(80, 1737)}${sectionTitle(206, 1757, '5. Por que rende', GOLD, 28)}${multilineText({ x: 206, y: 1791, text: why, widthChars: 55, maxLines: 4, fontSize: 15, lineHeight: 21, fill: SOFT_WHITE })}<line x1="636" y1="1731" x2="636" y2="1840" stroke="#8f6b1b" stroke-width="2"/>${ratingBar(663, 1737, 'Transição', formation.scores.transition)}${ratingBar(663, 1765, 'Criatividade', formation.scores.creation)}${ratingBar(663, 1793, 'Solidez', Math.round((formation.scores.defense + formation.scores.compactness) / 2))}${ratingBar(663, 1821, 'Finalização', formation.scores.attack)}`;
  const footer = `<text x="540" y="1894" text-anchor="middle" fill="${GOLD}" font-size="13" font-weight="800" letter-spacing="2" font-family="Arial">GERADO AUTOMATICAMENTE PELO APP • ANALISADO • OTIMIZADO • PERSONALIZADO</text><text x="540" y="1909" text-anchor="middle" fill="${MUTED}" font-size="11" font-family="Arial">Marques Fichas${project.appearance.teamName ? ` • ${esc(project.appearance.teamName)}` : ''}${project.appearance.userName ? ` • ${esc(project.appearance.userName)}` : ''}</text>`;
  const content = `<rect width="1080" height="1920" fill="url(#bgGradient)"/><rect width="1080" height="1920" fill="url(#starDust)"/>${decorativeFrame(1080, 1920)}${header}${infoBars}${leftPanel}${fieldMarkup(project, formation, field)}${rightPanels}${warning}${project.appearance.showNotes ? principles + whyPanel : ''}${footer}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" data-template-version="${PROFESSIONAL_TACTICAL_TEMPLATE_VERSION}" width="${width}" height="${height}" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid meet">${baseDefs(field)}<g transform="scale(${scaleX} ${scaleY})">${content}</g></svg>`;
}

function renderCompactPoster(project: MetaFormationProject, formation: MetaFormationDefinition, width: number, height: number, fieldOnly: boolean): string {
  const field = fieldOnly ? { x: 70, y: 125, w: 940, h: 850 } : { x: 52, y: 255, w: 700, h: 1000 };
  const header = fieldOnly ? `<text x="540" y="66" text-anchor="middle" fill="${GOLD_LIGHT}" font-size="34" font-weight="900" font-family="Arial">${esc(project.name.toUpperCase())}</text><text x="540" y="98" text-anchor="middle" fill="${SOFT_WHITE}" font-size="18" font-family="Arial">${esc(project.style)} • ${esc(project.objective)}</text>` : `<text x="52" y="64" fill="${GOLD_LIGHT}" font-size="24" font-weight="900" letter-spacing="2" font-family="Arial">MARQUES FICHAS</text><text x="52" y="126" fill="url(#goldStroke)" font-size="58" font-weight="900" font-family="Arial">eFOOTBALL 2026</text><text x="52" y="173" fill="${SOFT_WHITE}" font-size="30" font-weight="900" font-family="Arial">${esc(project.name)}</text><text x="52" y="212" fill="${CYAN}" font-size="20" font-weight="800" font-family="Arial">${esc(project.style)} • ${esc(project.objective)}</text>${metaBadge(824, 42, 190, 200)}`;
  const side = fieldOnly ? '' : `${panel(775, 270, 260, 575)}${sectionTitle(800, 310, 'Chaves do sucesso', GOLD, 21)}${bulletList(800, 360, 210, formation.successKeys, GOLD, 5)}${panel(775, 865, 260, 300)}${sectionTitle(800, 905, 'Por que rende', GOLD, 21)}${multilineText({ x: 800, y: 943, text: formation.whyItWorks, widthChars: 27, maxLines: 8, fontSize: 16, lineHeight: 23, fill: SOFT_WHITE })}`;
  const footerY = height - 72;
  return `<svg xmlns="http://www.w3.org/2000/svg" data-template-version="${PROFESSIONAL_TACTICAL_TEMPLATE_VERSION}" width="${width}" height="${height}" viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid meet">${baseDefs(field)}<rect width="1080" height="1350" fill="url(#bgGradient)"/><rect width="1080" height="1350" fill="url(#starDust)"/>${decorativeFrame(1080, 1350)}${header}${fieldMarkup(project, formation, field)}${side}<text x="540" y="${footerY}" text-anchor="middle" fill="${GOLD}" font-size="14" font-weight="800" letter-spacing="2" font-family="Arial">GERADO AUTOMATICAMENTE PELO APP • MARQUES FICHAS</text></svg>`;
}

export function professionalMetaFormationOutputSize(format: MetaFormationExportFormat) {
  if (format === 'square' || format === 'field-only') return { width: 1080, height: 1080 };
  if (format === 'whatsapp') return { width: 1080, height: 1350 };
  return { width: 1080, height: 1920 };
}

export function renderProfessionalMetaFormationSvg(project: MetaFormationProject, format: MetaFormationExportFormat = 'complete'): string {
  const formation = getMetaFormation(project.formationId);
  const { width, height } = professionalMetaFormationOutputSize(format);
  if (format === 'complete' || format === 'story' || format === 'vertical') {
    return renderFullPoster(project, formation, width, height);
  }
  return renderCompactPoster(project, formation, width, height, format === 'field-only');
}
