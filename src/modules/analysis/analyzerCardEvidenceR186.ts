import { findOfficialCardRule } from '../rules/officialRuleRegistry';
import { normalize, readNumber } from './analyzerTextUtilsR130';
import { detectCardBadgePosition, detectCardType, detectExplicitMainPosition, detectImpetoSlotStatus, detectName, detectPlaystyle, detectPositionRatings, detectPositions, detectPrimaryPositionFromTop, detectSpecialTag, extractOcrSection, identityScope, parseAttributes, parseCondition, parseImpetos, parsePhysicalProfile, playstyleFitsPosition, resolvePlaystyleForCard } from './cardEvidenceParserR130';
import { parseCardTrainingBudgetR130 } from './cardTrainingBudgetParserR130';
import { detectMainPosition, gameplayPositionWeight, styleText } from './analyzerPositionCoreR142';
import { cardIdentityFingerprintR126 } from '../../lib/cardIdentityFingerprintR126';
import { isImpossibleByCoreStyle } from '../../lib/positionRules';
import { parseCardSkillInventory } from '../../lib/cardSkillParser';
import { detectV600Playstyles } from '../../lib/efootballV600Playstyles';
import { parseTrainingAllocation } from '../../lib/trainingPlanCore';
import { type Attributes, type ParsedCard, type PositionCode, type PrecisionIssue, type PrecisionValidation, POSITION_PT } from '../../lib/analyzerDomain';

const ALL_POSITIONS = Object.keys(POSITION_PT) as PositionCode[];

function findLocalCardRule(playerName: string, text: string) {
  return findOfficialCardRule(playerName, text);
}

function hasManualConfirmation(text: string) {
  return /CONFIRMA(?:CAO|ÇÃO)\s+MANUAL\s*[:=\-]?\s*SIM/i.test(normalize(text));
}

function hasPositionLock(text: string) {
  return /POSI(?:CAO|ÇÃO)\s+PRINCIPAL\s*[:=\-]/i.test(normalize(text));
}

function hasPlaystyleLock(text: string) {
  return /ESTILO\s+DE\s+JOGO(?:\s+(?:OFENSIVO|DEFENSIVO))?\s*[:=\-]/i.test(normalize(text));
}

function listLabels(codes: PositionCode[]) {
  return codes.map((code) => POSITION_PT[code]).join(', ');
}

export function parseCard(rawText: string, imageFileName?: string | null): ParsedCard {
  const text = rawText || '';
  const identitySection = extractOcrSection(text, 'IDENTIDADE DA CARTA') ?? '';
  const badgeSection = extractOcrSection(text, 'CARD BADGE') ?? '';
  const topSection = extractOcrSection(text, 'TOPO DA CARTA') ?? '';
  const firstLines = text.split(/\r?\n/).slice(0, 60).join('\n');
  const manualLockText = text.split(/\r?\n/).slice(0, 12).join('\n');
  const identityText = [manualLockText, badgeSection, identitySection, firstLines].filter(Boolean).join('\n');
  const headerOnlyText = [manualLockText, badgeSection, identitySection].filter(Boolean).join('\n') || identityScope(text);
  const attributes = parseAttributes(text);
  const positionRatings = detectPositionRatings(text);
  const positions = Array.from(new Set([...detectPositions(text), ...(Object.keys(positionRatings) as PositionCode[])]));
  const allNumbers = [...text.matchAll(/\b(\d{2,3})\b/g)].map((match) => Number(match[1])).filter((value) => value >= 40 && value <= 110);
  const ratingValues = Object.values(positionRatings).filter((v): v is number => Number.isFinite(v));
  const readOverallValue = readNumber(text, [/overall\s*(?:base|inicial)?\s*(\d{2,3})/i, /\bovr\s*(\d{2,3})/i]);
  const safeReadOverall = readOverallValue && readOverallValue >= 40 && readOverallValue <= 110 ? readOverallValue : null;
  const overall = safeReadOverall ?? (ratingValues.sort((a, b) => b - a)[0] ?? allNumbers.find((value) => value >= 80 && value <= 110) ?? null);
  const readMaxOverallValue = readNumber(text, [/overall\s*(?:m[aá]x(?:imo)?|max)\s*(\d{2,3})/i, /max\s*overall\s*(\d{2,3})/i]);
  const safeReadMaxOverall = readMaxOverallValue && readMaxOverallValue >= 40 && readMaxOverallValue <= 110 ? readMaxOverallValue : null;
  const maxOverall = safeReadMaxOverall ?? (ratingValues.sort((a, b) => b - a)[0] ?? allNumbers.filter((value) => value >= 80 && value <= 110).sort((a, b) => b - a)[0] ?? overall);
  const identityName = detectName(identityText, imageFileName);
  const playerName = identityName !== 'Jogador não identificado' ? identityName : detectName(text, imageFileName);
  const localRule = findLocalCardRule(playerName, text);
  const v600Styles = detectV600Playstyles([headerOnlyText, topSection, identityText].filter(Boolean).join('\n'));
  const rawPlaystyle = v600Styles.offensive ?? detectPlaystyle(headerOnlyText) ?? detectPlaystyle(topSection) ?? localRule?.playstyle ?? null;
  const explicitMainPosition = detectExplicitMainPosition(headerOnlyText);
  const primaryPositionFromCard = detectCardBadgePosition(badgeSection) ?? detectCardBadgePosition(identitySection) ?? detectPrimaryPositionFromTop(headerOnlyText);
  const manualPositionLocked = hasPositionLock(manualLockText);
  const manualPlaystyleLocked = hasPlaystyleLock(manualLockText);
  const manualConfirmed = hasManualConfirmation(text);
  const mainCandidate = explicitMainPosition ?? (!manualPositionLocked ? localRule?.mainPosition : null) ?? primaryPositionFromCard ?? detectMainPosition(positions, positionRatings, attributes, rawPlaystyle);
  const mainPosition = mainCandidate;
  const playstyle = resolvePlaystyleForCard(rawPlaystyle, mainPosition, headerOnlyText + '\n' + topSection + '\n' + identityText) ?? (!manualPlaystyleLocked && localRule?.playstyle && playstyleFitsPosition(localRule.playstyle, mainPosition) ? localRule.playstyle : null);
  const offensivePlaystyle = v600Styles.offensive ?? playstyle;
  const defensivePlaystyle = v600Styles.defensive;
  const defensivePlaystyleConfirmed = v600Styles.defensiveConfirmed;
  const detectedPositions = Array.from(new Set([mainPosition, ...positions]));
  const parsedSkillInventory = parseCardSkillInventory(text);
  const nativeSkills = parsedSkillInventory.native;
  const additionalSkills = parsedSkillInventory.additional;
  const specialSkills = parsedSkillInventory.special;
  const height = readNumber(text, [
    /(?:^|\n)\s*altura\s*[:=-]?\s*(\d{3})(?:\s*cm)?\s*(?=$|\n)/im,
    /(?:^|\n)\s*height\s*[:=-]?\s*(\d{3})(?:\s*cm)?\s*(?=$|\n)/im
  ]);
  const weight = readNumber(text, [
    /(?:^|\n)\s*peso\s*[:=-]?\s*(\d{2,3})(?:\s*kg)?\s*(?=$|\n)/im,
    /(?:^|\n)\s*weight\s*[:=-]?\s*(\d{2,3})(?:\s*kg)?\s*(?=$|\n)/im
  ]);
  const age = readNumber(text, [
    /(?:^|\n)\s*idade\s*[:=-]?\s*(\d{1,2})\s*(?=$|\n)/im,
    /(?:^|\n)\s*age\s*[:=-]?\s*(\d{1,2})\s*(?=$|\n)/im
  ]);
  const autoTraining = parseTrainingAllocation(text);
  const { level, pointBudget } = parseCardTrainingBudgetR130(text, autoTraining?.points ?? null);
  const trainingPointsTotal = pointBudget.total;
  const trainingPointsUsed = pointBudget.used;
  const trainingPointSource: ParsedCard['trainingPointSource'] = pointBudget.source;
  const specialTag = detectSpecialTag(text);
  const cardType = detectCardType(text);
  const country = text.match(/\b(Argentina|Brasil|Brazil|França|France|Portugal|Espanha|Spain|Inglaterra|England|Alemanha|Germany|Itália|Italy|Holanda|Netherlands|Países Baixos|Uruguai|Uruguay)\b/i)?.[1] ?? null;
  const dominantFoot = /p[eé]\s+esquerdo|left\s+foot/i.test(text) ? 'Esquerdo' : /p[eé]\s+direito|right\s+foot/i.test(text) ? 'Direito' : null;
  const condition = parseCondition(text);
  const physicalProfile = parsePhysicalProfile(text);
  const impetos = parseImpetos(text);
  const impetoSlot = detectImpetoSlotStatus(text, impetos);
  const attributeCount = Object.keys(attributes).length;
  const modelCount = Object.values(physicalProfile).filter((value) => Number.isFinite(value)).length;
  let confidence = 18;
  if (playerName !== 'Jogador não identificado') confidence += 14;
  if (detectedPositions.length > 0) confidence += 10;
  if (ratingValues.length >= 3) confidence += 12;
  if (overall || maxOverall) confidence += 8;
  if (playstyle) confidence += 8;
  confidence += Math.min(24, attributeCount * 1.6);
  confidence += Math.min(8, nativeSkills.length);
  confidence += Math.min(8, modelCount);
  confidence += Math.min(6, impetos.length * 2);
  const warnings: string[] = [];
  warnings.push('Posições convertidas automaticamente para PT-BR: CF→CA, DMF→VOL, CMF→MLG, CB→ZAG, LB→LE, RB→LD, AMF→MAT, LWF→PE, RWF→PD.');
  warnings.push(`Identidade preservada: a arte da carta usa ${POSITION_PT[mainPosition]}${playstyle ? ` + ${playstyle}` : ''} lidos do print. Recomendações de desempenho em campo aparecem separadas abaixo.`);
  if (defensivePlaystyle) warnings.push(defensivePlaystyleConfirmed
    ? `eFootball v6.0: estilo defensivo separado confirmado como ${defensivePlaystyle}; ele será avaliado apenas na fase sem a bola.`
    : `eFootball v6.0: novo estilo defensivo lido como “${defensivePlaystyle}”. Ele foi preservado como provisório e não recebe peso competitivo até ser confirmado.`);
  if (localRule && !manualPositionLocked) warnings.push(`${localRule.note} Banco local aplicado: melhores posições ${listLabels(localRule.bestPositions)}; evitar ${listLabels(localRule.avoidPositions)}.`);
  if (manualConfirmed) warnings.push('Conferência manual marcada como SIM: o app gerou a ficha final com os dados revisados pelo usuário.');
  if (attributeCount < 12) warnings.push('O OCR local leu poucos atributos. O app usou motor seguro por posição, mas quanto mais atributos lidos, melhor fica a ficha.');
  if (!explicitMainPosition && !primaryPositionFromCard) warnings.push('A posição original não foi lida com alta confiança no badge da carta. O app usou fallback seguro; confirme no campo Dados lidos antes de copiar a ficha.');
  if (!playstyle && rawPlaystyle) warnings.push(`Estilo OCR "${rawPlaystyle}" descartado porque não combina com a posição original ${POSITION_PT[mainPosition]}. A carta não foi alterada com estilo suspeito.`);
  if (!playstyle) warnings.push('O estilo de jogo não foi lido com alta confiança no topo da carta. A recomendação foi gerada sem alterar a identidade visual.');
  if (Object.keys(positionRatings).length < 4) warnings.push('A grade de posições não foi lida por completo. O app preservou a identidade lida no topo da carta e usou a função real só para recomendar a melhor posição abaixo.');
  if (!overall && !maxOverall) warnings.push('GER não identificado. O programa estimou a análise pela posição e atributos lidos.');
  if (trainingPointSource === 'MANUAL') warnings.push(`Orçamento manual aplicado pela Auditoria Elite: ${trainingPointsTotal} pontos. A ficha foi recalculada usando esse limite.`);
  if (trainingPointSource === 'TRAINING_READ') warnings.push(`Orçamento de pontos identificado pela ficha automática visível no print: ${trainingPointsTotal} pontos.`);
  if (trainingPointSource === 'LEVEL_INFERRED') warnings.push(`Orçamento de pontos calculado pelo nível máximo ${level}: ${trainingPointsTotal} pontos.`);
  if (trainingPointSource === 'FALLBACK') warnings.push(pointBudget.warning ?? 'Pontos e nível não foram lidos com segurança; usando orçamento competitivo padrão de 64 pontos.');
  if (pointBudget.warning && trainingPointSource !== 'FALLBACK') warnings.push(pointBudget.warning);
  const bestRating = Math.max(0, ...Object.values(positionRatings).filter((value): value is number => Number.isFinite(value)));
  const usablePositions = detectedPositions.length
    ? Array.from(new Set([mainPosition, ...detectedPositions]))
        .filter((position) => {
          if (position === mainPosition) return true;
          const rating = Number(positionRatings[position] ?? 0);
          if (position === 'GK' && mainPosition !== 'GK') return false;
          if (rating > 0) return rating >= 75 && (!bestRating || rating >= bestRating - 18);
          return false;
        })
        .sort((left, right) => {
          const leftWeight = gameplayPositionWeight(left, mainPosition, playstyle) + Number(positionRatings[left] ?? 0) * 0.15;
          const rightWeight = gameplayPositionWeight(right, mainPosition, playstyle) + Number(positionRatings[right] ?? 0) * 0.15;
          return rightWeight - leftWeight;
        })
    : [mainPosition];

  const parsedCard: ParsedCard = {
    playerName,
    cardType,
    specialTag,
    country,
    mainPosition,
    mainPositionPt: POSITION_PT[mainPosition],
    positions: usablePositions,
    positionsPt: usablePositions.map((position) => POSITION_PT[position]),
    positionRatings,
    playstyle,
    offensivePlaystyle,
    defensivePlaystyle,
    defensivePlaystyleConfirmed,
    dominantFoot,
    overall,
    maxOverall,
    height,
    weight,
    age,
    level,
    trainingPointsTotal,
    trainingPointsUsed,
    trainingPointSource,
    autoTrainingPlan: autoTraining?.plan ?? null,
    autoTrainingPoints: autoTraining?.points ?? null,
    condition,
    impetos,
    nativeSkills,
    additionalSkills,
    specialSkills,
    attributes,
    physicalProfile,
    manualConfirmed,
    evidence: {
      positionLocked: manualPositionLocked,
      playstyleLocked: manualPlaystyleLocked,
      attributeCount,
      positionRatingsCount: Object.keys(positionRatings).length,
      localRuleMatched: localRule?.id ?? null,
      skillSource: parsedSkillInventory.source,
      skillConfidence: parsedSkillInventory.confidence,
      additionalSkillCount: additionalSkills.length,
      specialSkillCount: specialSkills.length,
      impetoSlotStatus: impetoSlot.status,
      impetoSlotEvidence: impetoSlot.evidence
    },
    internalId: 'pending-r130-canonical-id',
    confidence: Math.max(1, Math.min(100, Math.round(confidence))),
    warnings
  };
  parsedCard.internalId = cardIdentityFingerprintR126(parsedCard);
  return parsedCard;
}

function impossiblePositionReason(position: PositionCode, parsed: ParsedCard, a: Required<Attributes>): string | null {
  const style = styleText(parsed.playstyle);
  const main = parsed.mainPosition;
  const localRule = findLocalCardRule(parsed.playerName, '');
  const coreStyleReason = isImpossibleByCoreStyle(position, main, parsed.playstyle);
  if (coreStyleReason) return coreStyleReason;

  if (localRule?.avoidPositions.includes(position)) return `Banco local recomenda evitar para esta carta; melhores opções: ${listLabels(localRule.bestPositions)}.`;
  if (main !== 'GK' && position === 'GK') return 'Jogador de linha não deve ser tratado como goleiro.';
  if (main === 'GK' && position !== 'GK') return 'Goleiro não deve ser tratado como jogador de linha.';

  if (/destruidor|primeiro volante|ancora|anchor man|destroyer/.test(style)) {
    if (position === 'LWF' || position === 'RWF' || position === 'CF' || position === 'SS') return 'Estilo defensivo/volante não combina com ataque aberto ou centroavante.';
    if ((position === 'LB' || position === 'RB') && main !== 'LB' && main !== 'RB') return 'Destruidor central costuma render melhor como VOL/MLG/ZAG do que lateral.';
  }

  if (/homem de area|fox in the box|pivo|target man|atacante matador|artilheiro|goal poacher/.test(style)) {
    if (position === 'CB' || position === 'DMF' || position === 'LB' || position === 'RB') return 'Estilo de atacante de área não combina com posição defensiva.';
  }

  if (/lateral ofensivo|lateral defensivo|lateral atacante|full/.test(style)) {
    if (position === 'CF' || position === 'SS' || position === 'GK') return 'Lateral não deve ser convertido para atacante/goleiro por erro de OCR.';
  }

  if (position === 'CF' && a.finishing < 72 && a.offensiveAwareness < 74) return 'Atributos ofensivos baixos para centroavante.';
  if ((position === 'CB' || position === 'DMF') && a.defensiveAwareness < 70 && a.tackling < 70) return 'Atributos defensivos baixos para função defensiva.';
  if ((position === 'LWF' || position === 'RWF') && a.dribbling < 72 && a.speed < 76) return 'Falta drible/velocidade para ponta.';
  return null;
}

export function buildAvoidPositions(parsed: ParsedCard, attributes: Required<Attributes>) {
  return ALL_POSITIONS
    .map((code) => ({ code, label: POSITION_PT[code], reason: impossiblePositionReason(code, parsed, attributes) }))
    .filter((item): item is { code: PositionCode; label: string; reason: string } => Boolean(item.reason))
    .slice(0, 8);
}

export function buildPermittedPositions(_parsed: ParsedCard, scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>) {
  return scored.map((item, index) => ({
    code: item.code,
    label: item.label,
    rating: item.cardRating ?? null,
    reason: index === 0
      ? 'Melhor posição de rendimento real calculada por função, atributos e estilo.'
      : item.cardRating
        ? `Compatível no print, com nota lida ${item.cardRating}.`
        : 'Compatível por função/estilo, sem depender de GER.'
  }));
}

export function validateAnalysis(
  parsed: ParsedCard,
  selected: { code: PositionCode; label: string; score: number; role: string; cardRating?: number | null },
  scored: Array<{ code: PositionCode; label: string; score: number; role: string; cardRating?: number | null }>,
  _attributes: Required<Attributes>,
  avoidPositions: Array<{ code: PositionCode; label: string; reason: string }>,
  explicitTarget = false
): PrecisionValidation {
  const issues: PrecisionIssue[] = [];
  const confirmed = parsed.manualConfirmed;
  const push = (severity: PrecisionIssue['severity'], code: string, message: string) => issues.push({ severity, code, message });

  if (!parsed.evidence.positionLocked && parsed.confidence < 70) push('block', 'POSITION_REVIEW', 'Confiança baixa/média: confirme a posição principal antes da ficha final.');
  if (!parsed.playstyle && !parsed.evidence.playstyleLocked) push('block', 'PLAYSTYLE_REVIEW', 'Estilo de jogo não foi lido com segurança: confirme manualmente para evitar ficha errada.');
  if (parsed.evidence.attributeCount < 8) push('block', 'ATTRIBUTES_REVIEW', 'Poucos atributos foram lidos: revise/corrija atributos importantes antes de confirmar.');
  else if (parsed.evidence.attributeCount < 12) push('review', 'ATTRIBUTES_PARTIAL', 'Atributos parcialmente lidos: a ficha fica melhor se você revisar os valores principais.');
  if (parsed.trainingPointSource === 'FALLBACK') push('block', 'POINTS_REVIEW', 'Pontos/nível máximo não foram confirmados; revise o orçamento de pontos antes da ficha final.');
  if (parsed.evidence.positionRatingsCount < 2) push('review', 'POSITION_GRID_PARTIAL', 'Grade de posições pouco lida; o ranking usa regras de rendimento real e deve ser conferido.');

  const avoid = avoidPositions.find((item) => item.code === selected.code);
  if (avoid) {
    if (explicitTarget) push('review', 'TARGET_CONVERSION', `Você escolheu ${POSITION_PT[selected.code]}. A ficha foi recalculada para essa posição. Avaliação da adaptação: ${avoid.reason} A decisão final é sempre sua.`);
    else push('review', 'POSITION_ADVISORY', `O motor recomenda cautela em ${POSITION_PT[selected.code]}: ${avoid.reason}`);
  }
  if (scored.length === 0) push('block', 'NO_POSITION', 'Nenhuma posição válida foi calculada com segurança.');

  const hasBlocking = issues.some((issue) => issue.severity === 'block');
  const hasReview = issues.some((issue) => issue.severity === 'review');
  return {
    confirmed,
    canGenerate: confirmed || !hasBlocking,
    level: confirmed || !hasBlocking ? (hasReview ? 'review' : 'safe') : 'blocked',
    issues: issues.length ? issues : [{ severity: 'ok', code: 'SAFE', message: 'Dados suficientes para gerar ficha com segurança.' }]
  };
}

