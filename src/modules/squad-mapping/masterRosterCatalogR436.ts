export const MASTER_ROSTER_CATALOG_R436_VERSION = '40.80-r436-master-roster-catalog-v1' as const;

export type MasterRosterCardStatusR436 = 'identity-only' | 'partial' | 'complete';

export type MasterRosterPlayerR436 = {
  id: string;
  name: string;
  cardLabel: string;
  cardFingerprint: string;
  mainPosition: string;
  positions: string[];
  playstyle: string;
  offensivePlaystyle?: string | null;
  defensivePlaystyle?: string | null;
  overall?: number | null;
  level?: number | null;
  trainingPointsTotal?: number | null;
  attributes: object;
  skills: string[];
  impetos: string[];
  profileCoverage: number;
  sourceHash?: string;
  identityStatus?: 'canonical' | 'provisional';
};

export type MasterRosterReadinessR436 = {
  status: MasterRosterCardStatusR436;
  canGenerate: boolean;
  trainingPointsTotal: number | null;
  attributeCount: number;
  skillCount: number;
  missing: string[];
};

const ATTRIBUTE_LABELS_R436: Record<string, string> = {
  offensiveAwareness: 'Talento ofensivo',
  ballControl: 'Controle de bola',
  dribbling: 'Drible',
  tightPossession: 'Condução firme',
  lowPass: 'Passe rasteiro',
  loftedPass: 'Passe alto',
  finishing: 'Finalização',
  heading: 'Cabeçada',
  placeKicking: 'Bola parada',
  curl: 'Curva',
  defensiveAwareness: 'Talento defensivo',
  defensiveEngagement: 'Dedicação defensiva',
  tackling: 'Desarme',
  aggression: 'Agressividade',
  goalkeeperAwareness: 'Talento de GO',
  goalkeeperCatching: 'Firmeza de GO',
  goalkeeperParrying: 'Defesa de GO',
  goalkeeperReflexes: 'Reflexos de GO',
  goalkeeperReach: 'Alcance de GO',
  speed: 'Velocidade',
  acceleration: 'Aceleração',
  kickingPower: 'Força do chute',
  jump: 'Salto',
  physicalContact: 'Contato físico',
  balance: 'Equilíbrio',
  stamina: 'Resistência'
};

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function finiteInteger(value: unknown, min: number, max: number) {
  const numeric = Math.round(Number(value));
  return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : null;
}

export function inferTrainingPointsFromLevelR436(level?: number | null): number | null {
  const safeLevel = finiteInteger(level, 2, 99);
  if (safeLevel === null) return null;
  const points = (safeLevel - 1) * 2;
  return points >= 20 && points <= 140 ? points : null;
}

function resolvedTrainingPoints(player: MasterRosterPlayerR436) {
  const explicit = finiteInteger(player.trainingPointsTotal, 20, 140);
  return explicit ?? inferTrainingPointsFromLevelR436(player.level);
}

function validAttributeEntries(player: MasterRosterPlayerR436) {
  return Object.entries((player.attributes ?? {}) as Record<string, number | null | undefined>).filter(([, raw]) => {
    const value = Number(raw);
    return Number.isFinite(value) && value >= 1 && value <= 110;
  });
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set((values ?? []).map((value) => String(value).trim()).filter(Boolean)));
}

export function masterRosterCardReadinessR436(player: MasterRosterPlayerR436): MasterRosterReadinessR436 {
  const trainingPointsTotal = resolvedTrainingPoints(player);
  const attributeCount = validAttributeEntries(player).length;
  const skillCount = uniqueNonEmpty(player.skills).length;
  const missing: string[] = [];

  const name = String(player.name ?? '').trim();
  const identityReady = Boolean(
    name
    && !/^(novo jogador|jogador para revisar|jogador nao identificado)$/i.test(normalize(name))
    && String(player.mainPosition ?? '').trim()
    && String(player.playstyle ?? '').trim()
    && String(player.cardFingerprint ?? '').trim()
  );

  if (!identityReady) missing.push('identidade da carta');
  if (!trainingPointsTotal) missing.push('nível/PP');
  if (attributeCount < 20) missing.push('atributos completos');
  if (skillCount < 1) missing.push('habilidades possuídas');
  if (Number(player.profileCoverage ?? 0) < 70) missing.push('cobertura mínima de leitura');

  const canGenerate = identityReady
    && Boolean(trainingPointsTotal)
    && attributeCount >= 20
    && skillCount >= 1
    && Number(player.profileCoverage ?? 0) >= 70;

  let status: MasterRosterCardStatusR436 = 'identity-only';
  if (canGenerate) status = 'complete';
  else if (attributeCount > 0 || skillCount > 0 || trainingPointsTotal) status = 'partial';

  return { status, canGenerate, trainingPointsTotal, attributeCount, skillCount, missing };
}


export function shouldMergeMasterRosterCardsR436(left: MasterRosterPlayerR436, right: MasterRosterPlayerR436) {
  const leftHash = String(left.sourceHash ?? '').trim();
  const rightHash = String(right.sourceHash ?? '').trim();
  if (leftHash && rightHash && leftHash === rightHash) return true;

  const sameFingerprint = Boolean(left.cardFingerprint && right.cardFingerprint && left.cardFingerprint === right.cardFingerprint);
  if (!sameFingerprint) return false;

  if (left.identityStatus === 'canonical' && right.identityStatus === 'canonical') return true;

  // R436: uma capa/identidade parcial não possui evidência suficiente para afirmar
  // que duas artes diferentes são a mesma edição. Preservamos ambas as variantes
  // e só fazemos merge automático quando os perfis já têm cobertura completa.
  if (Number(left.profileCoverage ?? 0) < 70 || Number(right.profileCoverage ?? 0) < 70) return false;
  return true;
}

export function masterRosterSearchTextR436(player: MasterRosterPlayerR436) {
  return normalize([
    player.name,
    player.cardLabel,
    player.cardFingerprint,
    player.mainPosition,
    ...(player.positions ?? []),
    player.playstyle,
    player.offensivePlaystyle,
    player.defensivePlaystyle,
    ...(player.skills ?? []),
    ...(player.impetos ?? [])
  ].filter(Boolean).join(' '));
}

export function buildMasterRosterRawTextR436(player: MasterRosterPlayerR436) {
  const readiness = masterRosterCardReadinessR436(player);
  if (!readiness.canGenerate || readiness.trainingPointsTotal === null) {
    throw new Error(`R436: dados completos são obrigatórios para gerar a ficha sem OCR (${readiness.missing.join(', ')}).`);
  }

  const lines = [
    '[AJUSTES MANUAIS]',
    'CONFIRMAÇÃO MANUAL: SIM',
    `NOME DO JOGADOR: ${String(player.name).trim()}`,
    `POSIÇÃO PRINCIPAL: ${String(player.mainPosition).trim()}`,
    `ESTILO DE JOGO: ${String(player.playstyle).trim()}`
  ];

  if (player.offensivePlaystyle?.trim()) lines.push(`ESTILO DE JOGO OFENSIVO: ${player.offensivePlaystyle.trim()}`);
  if (player.defensivePlaystyle?.trim()) lines.push(`ESTILO DE JOGO DEFENSIVO: ${player.defensivePlaystyle.trim()}`);
  if (finiteInteger(player.overall, 1, 120) !== null) lines.push(`GER: ${Math.round(Number(player.overall))}`);
  if (finiteInteger(player.level, 1, 99) !== null) lines.push(`NÍVEL MÁXIMO: ${Math.round(Number(player.level))}`);
  lines.push(`PONTOS TOTAIS: ${readiness.trainingPointsTotal}`);

  const positions = uniqueNonEmpty([player.mainPosition, ...(player.positions ?? [])]);
  if (positions.length) lines.push(`POSIÇÕES: ${positions.join(', ')}`);

  const skills = uniqueNonEmpty(player.skills);
  if (skills.length) lines.push(`HABILIDADES JÁ POSSUI: ${skills.join(', ')}`);

  const impetos = uniqueNonEmpty(player.impetos);
  if (impetos.length) lines.push(`ÍMPETOS: ${impetos.join(', ')}`);

  for (const [key, raw] of validAttributeEntries(player)) {
    const label = ATTRIBUTE_LABELS_R436[key] ?? key;
    lines.push(`${label}: ${Math.round(Number(raw))}`);
  }

  lines.push('[FIM AJUSTES]');
  return lines.join('\n');
}
