export const PREMIUM_CLEAN_RESULT_VERSION = '38.10.0' as const;

export type PremiumCleanExportFormat = 'portrait' | 'square';

export type PremiumCleanTrainingKey =
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'dexterity'
  | 'lowerBodyStrength'
  | 'aerialStrength'
  | 'defending'
  | 'gk1'
  | 'gk2'
  | 'gk3';

export type PremiumCleanTrainingPlan = Record<PremiumCleanTrainingKey, number>;

export type PremiumCleanResultInput = {
  parsed: { playerName?: string | null; mainPositionPt?: string | null; mainPosition?: string | null; playstyle?: string | null };
  bestPosition: { label?: string | null; code?: string | null };
  buildName?: string | null;
  training: PremiumCleanTrainingPlan;
  trainingCost: Partial<PremiumCleanTrainingPlan>;
  trainingPointsUsed: number;
  trainingPointsTotal: number;
  recommendedSkills: string[];
  recommendedImpetos: Array<{ name: string; tier?: string; reason?: string }>;
  advancedMotorV3750?: { winner?: { boosterName?: string | null } };
  powerBuildV3850?: { impetos?: Array<{ name?: string | null }> };
  maxMatchV3860?: { impetoCombinations?: Array<{ impeto?: { name?: string | null } }> };
  supremeV3870?: { impetoStressTests?: Array<{ name?: string | null }> };
  usageTips: string[];
  validation?: { canGenerate?: boolean };
};

export type PremiumCleanTrainingItem = {
  key: PremiumCleanTrainingKey;
  label: string;
  value: number;
  cost: number;
};

export type PremiumCleanResultModel = {
  playerName: string;
  position: string;
  originalPosition: string;
  playstyle: string;
  buildName: string;
  training: PremiumCleanTrainingItem[];
  pointsUsed: number;
  pointsTotal: number;
  skills: string[];
  boosterName: string;
  boosterReason: string;
  usageTip: string;
  statusLabel: 'Ficha validada' | 'Revisar ficha';
};

const TRAINING_LABELS: Record<PremiumCleanTrainingKey, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

function cleanInlineText(value: unknown, fallback = '—') {
  const cleaned = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

function truncate(value: string, maximum: number) {
  if (value.length <= maximum) return value;
  return `${value.slice(0, Math.max(1, maximum - 1)).trimEnd()}…`;
}

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeImageHref(value?: string | null) {
  if (!value) return null;
  const candidate = value.trim();
  if (/^(?:data:image\/(?:png|jpe?g|webp);base64,|blob:)/i.test(candidate)) return candidate;
  return null;
}

function selectedBooster(result: PremiumCleanResultInput) {
  const winnerName = result.supremeV3870?.impetoStressTests?.[0]?.name
    ?? result.maxMatchV3860?.impetoCombinations?.[0]?.impeto?.name
    ?? result.powerBuildV3850?.impetos?.[0]?.name
    ?? result.advancedMotorV3750?.winner?.boosterName;
  const byWinner = winnerName
    ? result.recommendedImpetos.find((item) => item.name === winnerName)
    : undefined;
  const selected = byWinner
    ?? result.recommendedImpetos.find((item) => item.tier === 'ideal')
    ?? result.recommendedImpetos.find((item) => item.tier !== 'evitar');
  return {
    name: cleanInlineText(winnerName ?? selected?.name, 'Sem Booster seguro'),
    reason: cleanInlineText(selected?.reason, 'Escolha vinculada à função e à distribuição da ficha.')
  };
}

export function buildPremiumCleanResultModel(result: PremiumCleanResultInput): PremiumCleanResultModel {
  const booster = selectedBooster(result);
  const training = (Object.keys(result.training) as PremiumCleanTrainingKey[])
    .map((key) => ({
      key,
      label: TRAINING_LABELS[key] ?? String(key),
      value: Number(result.training[key] ?? 0),
      cost: Number(result.trainingCost[key] ?? 0)
    }))
    .filter((item) => item.value > 0);

  return {
    playerName: cleanInlineText(result.parsed.playerName, 'Jogador'),
    position: cleanInlineText(result.bestPosition.label, result.bestPosition.code ?? '—'),
    originalPosition: cleanInlineText(result.parsed.mainPositionPt, result.parsed.mainPosition ?? '—'),
    playstyle: cleanInlineText(result.parsed.playstyle, 'Estilo não informado'),
    buildName: cleanInlineText(result.buildName, 'Ficha recomendada'),
    training,
    pointsUsed: Number(result.trainingPointsUsed || 0),
    pointsTotal: Number(result.trainingPointsTotal || 0),
    skills: result.recommendedSkills.slice(0, 5).map((skill) => cleanInlineText(skill)),
    boosterName: booster.name,
    boosterReason: booster.reason,
    usageTip: cleanInlineText(result.usageTips[0], 'Use o jogador na função escolhida e ajuste apenas após testar em partidas reais.'),
    statusLabel: result.validation?.canGenerate ? 'Ficha validada' : 'Revisar ficha'
  };
}

export function buildPremiumCleanShareText(result: PremiumCleanResultInput) {
  const model = buildPremiumCleanResultModel(result);
  const distribution = model.training.map((item) => `${item.label} +${item.value}`).join(' • ');
  return [
    `${model.playerName} — ${model.position}`,
    `${model.buildName} • ${model.playstyle}`,
    `Ficha: ${distribution || 'sem pontos distribuídos'}`,
    `Habilidades: ${model.skills.join(', ') || 'sem recomendação segura'}`,
    `Booster: ${model.boosterName}`,
    `BuildMaster Elite Tático`
  ].join('\n');
}

export function buildPremiumCleanCardSvg(
  result: PremiumCleanResultInput,
  options: { format?: PremiumCleanExportFormat; playerImage?: string | null; branded?: boolean } = {}
) {
  const model = buildPremiumCleanResultModel(result);
  const format = options.format ?? 'portrait';
  const branded = options.branded !== false;
  const width = 1080;
  const height = format === 'square' ? 1080 : 1350;
  const cardImage = safeImageHref(options.playerImage);
  const compact = format === 'square';
  const skillStart = compact ? 730 : 840;
  const footerY = height - 46;
  const trainingColumns = compact ? 4 : 3;
  const trainingCellWidth = compact ? 218 : 278;
  const trainingRows = model.training.slice(0, compact ? 8 : 9).map((item, index) => {
    const column = index % trainingColumns;
    const row = Math.floor(index / trainingColumns);
    const x = 74 + (column * (trainingCellWidth + 14));
    const y = (compact ? 475 : 520) + (row * 102);
    return `<g transform="translate(${x} ${y})">
      <rect width="${trainingCellWidth}" height="86" rx="20" fill="#101a2b" stroke="#26374f"/>
      <text x="18" y="31" fill="#9fb1c8" font-size="21" font-weight="700">${escapeXml(truncate(item.label, 18))}</text>
      <text x="18" y="67" fill="#ffffff" font-size="34" font-weight="900">+${escapeXml(item.value)}</text>
    </g>`;
  }).join('');
  const skills = model.skills.slice(0, 5).map((skill, index) => {
    const y = skillStart + (index * 47);
    return `<g transform="translate(74 ${y})">
      <circle cx="17" cy="-8" r="16" fill="#d9ad52"/>
      <text x="17" y="0" text-anchor="middle" fill="#101114" font-size="16" font-weight="900">${index + 1}</text>
      <text x="50" y="0" fill="#f8fafc" font-size="27" font-weight="750">${escapeXml(truncate(skill, compact ? 24 : 25))}</text>
    </g>`;
  }).join('');
  const imageBlock = cardImage
    ? `<clipPath id="cardClip"><rect x="74" y="142" width="250" height="290" rx="28"/></clipPath>
       <image href="${escapeXml(cardImage)}" x="74" y="142" width="250" height="290" preserveAspectRatio="xMidYMid slice" clip-path="url(#cardClip)"/>
       <rect x="74" y="142" width="250" height="290" rx="28" fill="none" stroke="#3a4c68" stroke-width="2"/>`
    : `<rect x="74" y="142" width="250" height="290" rx="28" fill="#101a2b" stroke="#3a4c68" stroke-width="2"/>
       <text x="199" y="270" text-anchor="middle" fill="#d9ad52" font-size="68" font-weight="900">${escapeXml(model.playerName.slice(0, 2).toUpperCase())}</text>
       <text x="199" y="316" text-anchor="middle" fill="#9fb1c8" font-size="21" font-weight="700">CARTA</text>`;
  const boosterX = compact ? 650 : 612;
  const boosterY = compact ? 705 : 842;
  const tipY = compact ? 950 : 1180;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07101d"/>
      <stop offset="0.58" stop-color="#080d17"/>
      <stop offset="1" stop-color="#03060b"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d9ad52"/>
      <stop offset="1" stop-color="#f7dc91"/>
    </linearGradient>
    <filter id="softShadow"><feDropShadow dx="0" dy="20" stdDeviation="26" flood-color="#000000" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#background)"/>
  <circle cx="1015" cy="56" r="300" fill="#d9ad52" opacity="0.06"/>
  <circle cx="30" cy="${height - 20}" r="260" fill="#4f78b8" opacity="0.07"/>
  <rect x="40" y="38" width="1000" height="${height - 76}" rx="42" fill="#0a111d" stroke="#28354a" stroke-width="2" filter="url(#softShadow)"/>
  <rect x="74" y="76" width="932" height="4" rx="2" fill="url(#accentLine)"/>
  ${branded ? `<text x="74" y="119" fill="#d9ad52" font-size="21" font-weight="900" letter-spacing="4">BUILDMASTER ELITE TÁTICO</text>` : ''}
  ${imageBlock}
  <text x="360" y="184" fill="#ffffff" font-size="${compact ? 49 : 54}" font-weight="900">${escapeXml(truncate(model.playerName, compact ? 24 : 28))}</text>
  <text x="360" y="228" fill="#9fb1c8" font-size="25" font-weight="700">${escapeXml(truncate(`${model.position} • ${model.playstyle}`, 47))}</text>
  <rect x="360" y="266" width="646" height="66" rx="20" fill="#111a29" stroke="#2a384d"/>
  <text x="386" y="307" fill="#f8fafc" font-size="25" font-weight="800">${escapeXml(truncate(model.buildName, 39))}</text>
  <rect x="360" y="350" width="306" height="82" rx="22" fill="#101a2b" stroke="#26374f"/>
  <text x="384" y="382" fill="#9fb1c8" font-size="18" font-weight="800">PONTOS</text>
  <text x="384" y="417" fill="#ffffff" font-size="34" font-weight="900">${escapeXml(model.pointsUsed)}/${escapeXml(model.pointsTotal)}</text>
  <rect x="684" y="350" width="322" height="82" rx="22" fill="#101a2b" stroke="#26374f"/>
  <text x="708" y="382" fill="#9fb1c8" font-size="18" font-weight="800">STATUS</text>
  <text x="708" y="417" fill="${model.statusLabel === 'Ficha validada' ? '#73d7a2' : '#f2ad45'}" font-size="27" font-weight="900">${escapeXml(model.statusLabel)}</text>
  <text x="74" y="${compact ? 458 : 500}" fill="#d9ad52" font-size="26" font-weight="900">DISTRIBUIÇÃO</text>
  ${trainingRows}
  <text x="74" y="${skillStart - 52}" fill="#d9ad52" font-size="26" font-weight="900">5 HABILIDADES</text>
  ${skills || `<text x="74" y="${skillStart}" fill="#9fb1c8" font-size="26">Sem recomendação segura.</text>`}
  <g transform="translate(${boosterX} ${boosterY})">
    <rect width="${compact ? 356 : 394}" height="${compact ? 235 : 268}" rx="28" fill="#111a29" stroke="#3a4b66"/>
    <text x="28" y="44" fill="#d9ad52" font-size="22" font-weight="900">BOOSTER</text>
    <text x="28" y="89" fill="#ffffff" font-size="31" font-weight="900">${escapeXml(truncate(model.boosterName, 22))}</text>
    <text x="28" y="132" fill="#9fb1c8" font-size="20" font-weight="650">Escolhido junto com a ficha</text>
    <text x="28" y="168" fill="#9fb1c8" font-size="20" font-weight="650">e as cinco habilidades.</text>
    <rect x="28" y="${compact ? 191 : 214}" width="${compact ? 300 : 338}" height="3" rx="2" fill="url(#accentLine)" opacity="0.75"/>
  </g>
  <rect x="74" y="${tipY}" width="932" height="${compact ? 68 : 92}" rx="22" fill="#0f1826" stroke="#26374f"/>
  <text x="100" y="${tipY + (compact ? 42 : 37)}" fill="#d9ad52" font-size="18" font-weight="900">COMO USAR</text>
  <text x="${compact ? 238 : 100}" y="${tipY + (compact ? 42 : 70)}" fill="#f8fafc" font-size="${compact ? 21 : 22}" font-weight="700">${escapeXml(truncate(model.usageTip, compact ? 54 : 68))}</text>
  <text x="74" y="${footerY}" fill="#788ba5" font-size="18" font-weight="700">${escapeXml(`${model.originalPosition} original • resultado clean v${PREMIUM_CLEAN_RESULT_VERSION}`)}</text>
  ${branded ? `<text x="1006" y="${footerY}" text-anchor="end" fill="#d9ad52" font-size="18" font-weight="900">FICHA PREMIUM</text>` : ''}
</svg>`;
}

export async function premiumCleanSvgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('Conversão PNG disponível apenas no aplicativo ou navegador.');
  }
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = () => reject(new Error('Não foi possível renderizar a imagem da ficha.'));
      instance.src = svgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponível para gerar PNG.');
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao gerar PNG.')), 'image/png', 0.96);
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
