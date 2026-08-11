import type {
  AnalysisResult,
  AttributeKey,
  PositionCode,
  TrainingKey,
  TrainingPlan,
  UnifiedPerformanceIdentityV3920,
  UnifiedPerformanceResourceStatusV3920,
  UnifiedPerformanceV3920Analysis,
  UnifiedPositionFitV3920
} from './analyzerDomain';
import { POSITION_PT } from './analyzerDomain';
import { canonicalizePlayerPlaystyle } from './efootball2026Playstyles';
import { resolveCuratedPlayerIdentityV3920 } from './playerIdentityRegistryV3920';
import { TRAINING_LABELS } from './trainingEngine';
import { TRAINING_KEYS, trainingPlanTotalCost } from './trainingPlanCore';
import { skillIdentityKey } from './officialSkillIdentity';

export const UNIFIED_PERFORMANCE_V3920_VERSION = '39.20.0' as const;

const POSITION_ACTIVE_STYLES: Record<string, PositionCode[]> = {
  'Goleiro Ofensivo': ['GK'],
  'Goleiro Defensivo': ['GK'],
  'Atacante Surpresa': ['CB'],
  'Defensor Criativo': ['CB'],
  Destruidor: ['CB', 'DMF', 'CMF'],
  'Lateral Ofensivo': ['LB', 'RB'],
  'Lateral Atacante': ['LB', 'RB'],
  'Perito em Cruzamento': ['LMF', 'RMF', 'LWF', 'RWF'],
  'Lateral Defensivo': ['LB', 'RB'],
  Orquestrador: ['CMF', 'DMF'],
  '1º Volante': ['DMF'],
  'Meia versátil': ['CMF', 'DMF', 'LMF', 'RMF'],
  Infiltração: ['AMF', 'CMF', 'SS'],
  'Clássico 10': ['AMF', 'CMF'],
  'Lateral Móvel': ['LWF', 'RWF', 'LMF', 'RMF'],
  'Ala Produtivo': ['LWF', 'RWF'],
  'Armador Criativo': ['AMF', 'SS', 'LWF', 'RWF'],
  'Atacante Pivô': ['CF', 'SS'],
  Pivô: ['CF'],
  'Homem de Área': ['CF'],
  'Puxa Marcação': ['CF', 'SS'],
  Artilheiro: ['CF', 'SS']
};

const POSITION_TRAINING_WEIGHTS: Record<PositionCode, Partial<Record<TrainingKey, number>>> = {
  CF: { shooting: 1.3, dexterity: 1.05, lowerBodyStrength: .78, aerialStrength: .52, dribbling: .38, passing: .18 },
  SS: { shooting: .9, dribbling: 1.02, dexterity: 1.03, passing: .78, lowerBodyStrength: .48 },
  LWF: { dribbling: 1.15, dexterity: 1.08, lowerBodyStrength: .78, shooting: .7, passing: .42 },
  RWF: { dribbling: 1.15, dexterity: 1.08, lowerBodyStrength: .78, shooting: .7, passing: .42 },
  LMF: { passing: .92, dribbling: .67, lowerBodyStrength: .85, dexterity: .75, defending: .55 },
  RMF: { passing: .92, dribbling: .67, lowerBodyStrength: .85, dexterity: .75, defending: .55 },
  AMF: { passing: 1.16, dribbling: 1.0, dexterity: .85, shooting: .55, lowerBodyStrength: .3 },
  CMF: { passing: 1.06, lowerBodyStrength: .78, defending: .65, dribbling: .56, dexterity: .68, shooting: .22 },
  DMF: { defending: 1.22, passing: .83, lowerBodyStrength: .8, aerialStrength: .43, dexterity: .42 },
  CB: { defending: 1.38, aerialStrength: .95, lowerBodyStrength: .78, dexterity: .42, passing: .28 },
  LB: { defending: 1.0, lowerBodyStrength: .92, dexterity: .74, passing: .65, dribbling: .38 },
  RB: { defending: 1.0, lowerBodyStrength: .92, dexterity: .74, passing: .65, dribbling: .38 },
  GK: { gk2: 1.22, gk3: 1.16, gk1: 1.03, aerialStrength: .3, lowerBodyStrength: .18 }
};

const DIMENSION_LABELS = {
  creation: 'criação',
  control: 'controle e condução',
  finishing: 'finalização',
  movement: 'movimentação',
  defending: 'defesa',
  physical: 'força e duelos',
  aerial: 'jogo aéreo',
  endurance: 'resistência',
  goalkeeping: 'goleiro'
} as const;

type DimensionKey = keyof typeof DIMENSION_LABELS;

type IdentityDimensions = Record<DimensionKey, number>;

function clamp(value: number, min = 0, max = 100): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.round(Math.max(min, Math.min(max, safe)) * 10) / 10;
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function average(values: number[]): number {
  const usable = values.filter((value) => Number.isFinite(value));
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function attributes(result: AnalysisResult, keys: AttributeKey[]): number {
  return average(keys.map((key) => Number(result.parsed.attributes[key] ?? 0)));
}

function dimensionScores(result: AnalysisResult): IdentityDimensions {
  return {
    creation: clamp(attributes(result, ['lowPass', 'loftedPass', 'ballControl', 'curl'])),
    control: clamp(attributes(result, ['ballControl', 'dribbling', 'tightPossession', 'balance'])),
    finishing: clamp(attributes(result, ['finishing', 'offensiveAwareness', 'kickingPower', 'curl'])),
    movement: clamp(attributes(result, ['offensiveAwareness', 'speed', 'acceleration', 'stamina'])),
    defending: clamp(attributes(result, ['defensiveAwareness', 'defensiveEngagement', 'tackling', 'aggression'])),
    physical: clamp(attributes(result, ['physicalContact', 'balance', 'speed', 'stamina'])),
    aerial: clamp(attributes(result, ['heading', 'jump', 'physicalContact'])),
    endurance: clamp(attributes(result, ['stamina', 'speed', 'balance'])),
    goalkeeping: clamp(attributes(result, ['goalkeeperAwareness', 'goalkeeperCatching', 'goalkeeperParrying', 'goalkeeperReflexes', 'goalkeeperReach']))
  };
}

function rankedDimensions(dimensions: IdentityDimensions): Array<[DimensionKey, number]> {
  return (Object.entries(dimensions) as Array<[DimensionKey, number]>)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function cardEvidence(result: AnalysisResult, dimensions: IdentityDimensions): string[] {
  const ranked = rankedDimensions(dimensions);
  const skillSignals = [...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills]
    .slice(0, 5)
    .join(', ');
  return [
    `Forças principais lidas: ${ranked.slice(0, 3).map(([key, score]) => `${DIMENSION_LABELS[key]} ${Math.round(score)}`).join(' • ')}.`,
    `Estilo oficial: ${result.parsed.playstyle ?? 'não confirmado'}.`,
    `Posição original: ${POSITION_PT[result.parsed.mainPosition]}.`,
    skillSignals ? `Habilidades que sustentam o DNA: ${skillSignals}.` : 'Habilidades da carta ainda precisam de confirmação completa.'
  ];
}

function buildIdentity(result: AnalysisResult): UnifiedPerformanceIdentityV3920 {
  const dimensions = dimensionScores(result);
  const ranked = rankedDimensions(dimensions);
  const curated = resolveCuratedPlayerIdentityV3920(result.parsed.playerName);
  const primary = ranked[0]?.[0] ?? 'control';
  const secondary = ranked[1]?.[0] ?? primary;
  const style = canonicalizePlayerPlaystyle(result.parsed.playstyle);
  const source = curated ? 'CURADORIA_E_CARTA' as const : 'SOMENTE_CARTA' as const;
  const traits = curated?.traits ?? ranked.slice(0, 4).map(([key]) => DIMENSION_LABELS[key]);
  const realLifeModel = curated?.realLifeModel
    ?? `Preservar ${DIMENSION_LABELS[primary]} como força central, usar ${DIMENSION_LABELS[secondary]} como apoio e evitar transformar a carta em um molde genérico de posição.`;
  const profileId = curated?.id ?? `card-${primary}-${secondary}`;
  const label = curated?.label ?? `${DIMENSION_LABELS[primary]} com apoio de ${DIMENSION_LABELS[secondary]}`;
  const confidence = clamp(
    Number(result.structuralPrecision?.canonical.confidence ?? result.parsed.confidence ?? 0) * .68
      + Math.min(100, result.parsed.evidence.attributeCount * 4) * .2
      + (style ? 100 : 55) * .12,
    0,
    98
  );
  return {
    source,
    profileId,
    label,
    primaryArchetype: DIMENSION_LABELS[primary],
    secondaryArchetype: DIMENSION_LABELS[secondary],
    traits,
    realLifeModel,
    cardEvidence: cardEvidence(result, dimensions),
    confidence
  };
}

function playstyleActive(result: AnalysisResult, selectedPosition: PositionCode): boolean {
  const style = canonicalizePlayerPlaystyle(result.parsed.playstyle);
  if (!style) return false;
  return POSITION_ACTIVE_STYLES[style]?.includes(selectedPosition) ?? false;
}

function movementProfile(result: AnalysisResult, active: boolean): UnifiedPositionFitV3920['movementProfile'] {
  const style = canonicalizePlayerPlaystyle(result.parsed.playstyle);
  if (!active) return 'CONTROLADO';
  if (style === '1º Volante' || style === 'Lateral Defensivo' || style === 'Defensor Criativo') return 'FIXO';
  if (style === 'Orquestrador' || style === 'Armador Criativo' || style === 'Clássico 10') return 'CONTROLADO';
  if (style === 'Meia versátil' || style === 'Infiltração' || style === 'Puxa Marcação' || style === 'Atacante Surpresa') return 'VERTICAL';
  if (style === 'Artilheiro' || style === 'Homem de Área' || style === 'Lateral Ofensivo' || style === 'Lateral Atacante' || style === 'Ala Produtivo' || style === 'Lateral Móvel') return 'AGRESSIVO';
  return 'MISTO';
}

function positionFamiliarity(result: AnalysisResult, position: PositionCode): number {
  if (position === result.parsed.mainPosition) return 100;
  const rating = Number(result.parsed.positionRatings[position] ?? 0);
  if (rating > 0) return clamp(rating, 45, 99);
  if (result.parsed.positions.includes(position)) return 84;
  return 56;
}

function positionIdentityFit(result: AnalysisResult, position: PositionCode): number {
  const dimensions = dimensionScores(result);
  const weights = POSITION_TRAINING_WEIGHTS[position];
  const groupDimension: Partial<Record<TrainingKey, number>> = {
    shooting: dimensions.finishing,
    passing: dimensions.creation,
    dribbling: dimensions.control,
    dexterity: average([dimensions.movement, dimensions.control]),
    lowerBodyStrength: average([dimensions.physical, dimensions.endurance, dimensions.movement]),
    aerialStrength: dimensions.aerial,
    defending: dimensions.defending,
    gk1: dimensions.goalkeeping,
    gk2: dimensions.goalkeeping,
    gk3: dimensions.goalkeeping
  };
  const entries = Object.entries(weights) as Array<[TrainingKey, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (!total) return 50;
  return clamp(entries.reduce((sum, [key, weight]) => sum + Number(groupDimension[key] ?? 0) * weight, 0) / total);
}

function formationRisk(result: AnalysisResult, active: boolean, movement: UnifiedPositionFitV3920['movementProfile']): { risk: number; conflicts: string[]; strengths: string[] } {
  const selected = result.bestPosition.code;
  const formation = result.tacticalProfile.formation;
  const tacticalStyle = result.tacticalProfile.style;
  const style = canonicalizePlayerPlaystyle(result.parsed.playstyle);
  const conflicts: string[] = [];
  const strengths: string[] = [];
  let risk = 10;

  if (selected === result.parsed.mainPosition) strengths.push('A posição original preserva familiaridade total da carta.');
  else strengths.push('A adaptação foi avaliada sem alterar a receita canônica da carta.');

  if (!active) {
    risk += 4;
    strengths.push('O estilo fica neutro nesta posição; o comportamento depende mais dos atributos e das instruções do time.');
  } else if (movement === 'FIXO' || movement === 'CONTROLADO') {
    strengths.push('O estilo ativo tende a preservar linhas de passe e ocupação do setor.');
  }

  const isCentralMidfielder = selected === 'CMF' || selected === 'DMF';
  const isNarrow433 = formation === '4-3-3' && isCentralMidfielder;
  if (active && movement === 'VERTICAL') {
    risk += 20;
    conflicts.push('O estilo ativo procura subir e retornar; a ficha não consegue obrigar o jogador a permanecer fixo no setor.');
  }
  if (active && movement === 'AGRESSIVO') {
    risk += 16;
    conflicts.push('O estilo ativo prioriza ataque de espaço e pode reduzir a disponibilidade para circular a bola.');
  }
  if (isNarrow433 && (movement === 'VERTICAL' || movement === 'AGRESSIVO')) {
    risk += 22;
    conflicts.push('Na 4-3-3 estreita com apenas um VOL, a subida deste jogador pode isolar o volante e invadir a faixa dos SA.');
  }
  if (tacticalStyle === 'POSSE_DE_BOLA' && (movement === 'VERTICAL' || movement === 'AGRESSIVO')) {
    risk += 12;
    conflicts.push('Para posse controlada e triangulações, a movimentação é mais vertical do que o papel estrutural exige.');
  }
  if (style === 'Meia versátil' && ['CMF', 'LMF', 'RMF', 'DMF'].includes(selected)) {
    risk += 8;
    conflicts.push('Meia versátil ativo cobre muito campo; usar como organizador fixo pode bagunçar a distância entre VOL, MLG e SA.');
  }
  if (style === 'Infiltração' && ['AMF', 'CMF', 'SS'].includes(selected)) {
    risk += 7;
    conflicts.push('Infiltração ativo busca a área; precisa de um parceiro que fique atrás da jogada.');
  }
  if (style === '1º Volante' && selected === 'DMF') {
    risk = Math.max(0, risk - 14);
    strengths.push('O 1º Volante ativo protege a frente da defesa e estabiliza o time.');
  }
  if (style === 'Lateral Defensivo' && (selected === 'LB' || selected === 'RB')) {
    risk = Math.max(0, risk - 12);
    strengths.push('O lateral defensivo ativo preserva a cobertura do corredor.');
  }
  return { risk: clamp(risk, 0, 85), conflicts, strengths };
}

function buildPositionFit(result: AnalysisResult, identity: UnifiedPerformanceIdentityV3920): UnifiedPositionFitV3920 {
  const selected = result.bestPosition.code;
  const active = playstyleActive(result, selected);
  const movement = movementProfile(result, active);
  const familiarity = positionFamiliarity(result, selected);
  const elitePosition = result.eliteDominanceV3910?.compatiblePositions.find((item) => item.position === selected);
  const roleFit = clamp(elitePosition?.performanceScore ?? (familiarity * .55 + positionIdentityFit(result, selected) * .45));
  const identityFit = clamp(positionIdentityFit(result, selected) * .72 + identity.confidence * .28);
  const structure = formationRisk(result, active, movement);
  const structuralFit = clamp(100 - structure.risk);
  const compatibility = clamp(roleFit * .42 + structuralFit * .38 + identityFit * .2);
  const verdict: UnifiedPositionFitV3920['verdict'] = compatibility >= 86
    ? 'IDEAL'
    : compatibility >= 76
      ? 'FORTE'
      : compatibility >= 63
        ? 'SITUACIONAL'
        : 'INCOMPATIVEL';
  const recommendedUse = verdict === 'INCOMPATIVEL'
    ? `Não gaste Ímpeto para forçar ${POSITION_PT[selected]}. Use a posição natural ou uma posição em que o comportamento da carta não desmonte a estrutura.`
    : verdict === 'SITUACIONAL'
      ? `Teste primeiro como ${POSITION_PT[selected]} por pelo menos cinco partidas, sem trocar Ímpeto. A ficha permanece a mesma.`
      : `A carta pode ser usada como ${POSITION_PT[selected]} sem abandonar sua identidade principal: ${identity.label}.`;
  return {
    selectedPosition: selected,
    selectedPositionLabel: POSITION_PT[selected],
    naturalPosition: result.parsed.mainPosition,
    naturalPositionLabel: POSITION_PT[result.parsed.mainPosition],
    playstyle: canonicalizePlayerPlaystyle(result.parsed.playstyle) ?? result.parsed.playstyle ?? null,
    playstyleActive: active,
    movementProfile: movement,
    roleFit,
    structuralFit,
    identityFit,
    compatibility,
    verdict,
    conflicts: structure.conflicts,
    strengths: structure.strengths,
    recommendedUse
  };
}

function exactMicroAdaptation(base: TrainingPlan, result: AnalysisResult): { plan: TrainingPlan; changes: Array<{ key: TrainingKey; label: string; from: number; to: number }> } | null {
  if (result.bestPosition.code === result.parsed.mainPosition) return null;
  const weights = POSITION_TRAINING_WEIGHTS[result.bestPosition.code];
  const receivers = TRAINING_KEYS
    .filter((key) => Number(weights[key] ?? 0) > 0)
    .sort((left, right) => Number(weights[right] ?? 0) - Number(weights[left] ?? 0) || left.localeCompare(right));
  const donors = TRAINING_KEYS
    .filter((key) => base[key] > 0)
    .sort((left, right) => Number(weights[left] ?? 0) - Number(weights[right] ?? 0) || right.localeCompare(left));
  const budget = trainingPlanTotalCost(base);
  for (const receiver of receivers) {
    for (const donor of donors) {
      if (receiver === donor || base[receiver] >= 16 || base[donor] <= 0) continue;
      const candidate = { ...base, [receiver]: base[receiver] + 1, [donor]: base[donor] - 1 };
      if (trainingPlanTotalCost(candidate) !== budget) continue;
      return {
        plan: candidate,
        changes: [
          { key: donor, label: TRAINING_LABELS[donor], from: base[donor], to: candidate[donor] },
          { key: receiver, label: TRAINING_LABELS[receiver], from: base[receiver], to: candidate[receiver] }
        ]
      };
    }
  }
  return null;
}

function resourceStatus(result: AnalysisResult, fit: UnifiedPositionFitV3920, identity: UnifiedPerformanceIdentityV3920): { status: UnifiedPerformanceResourceStatusV3920; reasons: string[] } {
  const reasons: string[] = [];
  const structuralBlocked = Boolean(result.structuralPrecision?.blocked || result.validation.level === 'blocked');
  const cardConfidence = Number(result.structuralPrecision?.canonical.confidence ?? result.parsed.confidence ?? 0);
  if (structuralBlocked) reasons.push('A leitura estrutural possui campo crítico bloqueado.');
  if (cardConfidence < 68) reasons.push(`Confiança da carta ${Math.round(cardConfidence)}%: baixa para gastar recurso raro.`);
  if (identity.confidence < 70) reasons.push(`DNA da carta ainda está em ${Math.round(identity.confidence)}% de confiança.`);
  if (fit.verdict === 'INCOMPATIVEL') reasons.push('A posição escolhida entra em conflito com o comportamento e a estrutura tática.');
  if (fit.structuralFit < 60) reasons.push('A movimentação prevista pode desmontar o setor mesmo com uma ficha forte.');
  if (structuralBlocked || cardConfidence < 68 || fit.verdict === 'INCOMPATIVEL') {
    return { status: 'NAO_GASTAR_RECURSOS', reasons };
  }
  if (cardConfidence < 86 || identity.confidence < 82 || fit.verdict === 'SITUACIONAL' || fit.structuralFit < 78 || result.eliteDominanceV3910?.decision === 'revisar') {
    if (!reasons.length) reasons.push('A receita está consistente, mas o encaixe precisa ser confirmado em partidas antes de consumir Ímpeto.');
    return { status: 'TESTAR_ANTES_DE_GASTAR', reasons };
  }
  return { status: 'APLICAR_COM_SEGURANCA', reasons: ['Leitura, receita e encaixe superaram os pisos de segurança do motor.'] };
}

function statusLabel(status: UnifiedPerformanceResourceStatusV3920): string {
  if (status === 'APLICAR_COM_SEGURANCA') return 'Pode aplicar com segurança';
  if (status === 'TESTAR_ANTES_DE_GASTAR') return 'Teste antes de gastar Ímpeto';
  return 'Não gaste recursos nesta configuração';
}

function proCompact(result: AnalysisResult): UnifiedPerformanceV3920Analysis['proCompact'] {
  const global = result.globalProV3900;
  const dominant = result.eliteDominanceV3910;
  const status = dominant?.proChallengeStatus === 'supera_no_modelo'
    ? 'ACIMA_NO_MODELO'
    : dominant?.proChallengeStatus === 'empata_no_modelo'
      ? 'EMPATE_TECNICO'
      : dominant?.proChallengeStatus === 'abaixo_no_modelo'
        ? 'ABAIXO_NO_MODELO'
        : 'SEM_EVIDENCIA';
  return {
    exactReferences: global?.exactReferences ?? 0,
    fullBuildReferences: global?.fullBuildReferences ?? 0,
    confidence: global?.confidence ?? 0,
    status,
    label: dominant?.proChallengeLabel ?? 'Sem ficha profissional exata e completa para esta versão da carta.',
    margin: dominant?.proMargin ?? null
  };
}

export function buildUnifiedPerformanceV3920(result: AnalysisResult): UnifiedPerformanceV3920Analysis {
  const dominant = result.eliteDominanceV3910;
  const canonicalTraining = { ...(dominant?.winner.training ?? result.training) };
  const canonicalSkills = dominant?.skills ?? [];
  const canonicalImpetos = dominant?.impetos ?? result.recommendedImpetos;
  const primaryImpeto = dominant?.primaryImpeto ?? canonicalImpetos[0]?.name ?? null;
  const identity = buildIdentity(result);
  const positionFit = buildPositionFit(result, identity);
  const micro = positionFit.verdict === 'INCOMPATIVEL' ? null : exactMicroAdaptation(canonicalTraining, result);
  const safety = resourceStatus(result, positionFit, identity);
  const canonicalId = dominant?.canonicalCardId ?? result.canonicalCardV3890?.canonicalCardId ?? result.parsed.internalId;
  const lockSignature = `locked-v3920-${stableHash([
    canonicalId,
    TRAINING_KEYS.map((key) => `${key}:${canonicalTraining[key]}`).join('|'),
    canonicalSkills.map((item) => skillIdentityKey(item.name)).join(','),
    normalize(primaryImpeto)
  ].join('::'))}`;
  const pro = proCompact(result);
  const minimumTestMatches = safety.status === 'APLICAR_COM_SEGURANCA' ? 0 : safety.status === 'TESTAR_ANTES_DE_GASTAR' ? 5 : 8;
  const canSpend = safety.status === 'APLICAR_COM_SEGURANCA';
  const performanceCeiling = clamp(
    Number(dominant?.winner.universalScore ?? result.buildVariants[0]?.qualityScore ?? 0) * .55
      + positionFit.roleFit * .2
      + identity.confidence * .15
      + positionFit.structuralFit * .1
  );
  const warnings = [
    ...positionFit.conflicts,
    ...(safety.status !== 'APLICAR_COM_SEGURANCA' ? safety.reasons : [])
  ].filter((item, index, all) => all.indexOf(item) === index);
  const summary = `${result.parsed.playerName}: receita ${lockSignature} travada pela versão da carta. ${positionFit.recommendedUse} ${statusLabel(safety.status)}.`;
  return {
    engineVersion: UNIFIED_PERFORMANCE_V3920_VERSION,
    philosophy: 'UMA_TELA_UMA_RECEITA_IDENTIDADE_ENCAIXE_E_PROTECAO_DE_RECURSOS',
    canonicalCardId: canonicalId,
    lockSignature,
    selectedPositionAffectsCanonicalRecipe: false,
    identity,
    positionFit,
    canonicalTraining,
    canonicalSkills,
    canonicalImpetos,
    primaryImpeto,
    microAdaptation: {
      available: Boolean(micro),
      appliedAutomatically: false,
      maximumLevelShift: micro ? 1 : 0,
      training: micro?.plan ?? canonicalTraining,
      changes: micro?.changes ?? [],
      note: micro
        ? 'Adaptação opcional de apenas um nível entre dois grupos. A ficha principal, habilidades e Ímpeto continuam travados; nada é alterado automaticamente.'
        : 'Nenhuma microadaptação segura e de mesmo custo foi necessária. A receita canônica permanece intacta.'
    },
    resourceSafety: {
      status: safety.status,
      label: statusLabel(safety.status),
      canSpendImpeto: canSpend,
      canApplySkills: safety.status !== 'NAO_GASTAR_RECURSOS',
      canApplyTraining: safety.status !== 'NAO_GASTAR_RECURSOS',
      minimumTestMatches,
      recipeLocked: true,
      lockSignature,
      reasons: safety.reasons,
      nextAction: safety.status === 'APLICAR_COM_SEGURANCA'
        ? 'Aplique a ficha e as habilidades; use o Ímpeto indicado somente nesta versão exata da carta.'
        : safety.status === 'TESTAR_ANTES_DE_GASTAR'
          ? `Aplique primeiro a ficha sem trocar Ímpeto e teste ${minimumTestMatches} partidas. Só confirme o Ímpeto se o jogador mantiver a estrutura do time.`
          : 'Não aplique Ímpeto nem habilidades caras. Troque a posição ou confirme novamente a leitura da carta.'
    },
    proCompact: pro,
    performanceCeiling,
    tacticalStability: positionFit.structuralFit,
    identityPreservation: clamp((dominant?.winner.identityFit ?? 78) * .65 + identity.confidence * .35),
    deterministicChecks: [
      'A mesma versão da carta repete a mesma ficha, habilidades, Ímpeto e assinatura de bloqueio.',
      'Trocar a posição altera somente o diagnóstico de encaixe e a microadaptação opcional; a receita canônica não muda.',
      'Formação, técnico, conexão, nome do arquivo, horário e ordem dos prints não entram na assinatura da receita.',
      'Cartas diferentes da mesma posição continuam recebendo identidades e receitas diferentes.',
      'O Ímpeto fica bloqueado quando a leitura ou o encaixe tático não atingem o piso de segurança.',
      'O benchmark profissional é exibido de forma compacta e nunca substitui silenciosamente a identidade da carta.'
    ],
    compactSections: ['Ficha definitiva', 'Habilidades adicionais', 'Ímpeto', 'Identidade da carta', 'Encaixe tático', 'Benchmark Pro Global', 'Segurança de recursos'],
    warnings,
    summary
  };
}

export function applyUnifiedPerformanceV3920(result: AnalysisResult): AnalysisResult {
  const analysis = buildUnifiedPerformanceV3920(result);
  const training = analysis.canonicalTraining;
  const pointsUsed = trainingPlanTotalCost(training);
  const skills = analysis.canonicalSkills.map((item) => item.name);
  const impetos = analysis.canonicalImpetos;
  const variant = {
    kind: 'competitive' as const,
    title: `Ficha Automática v40.20 — Ficha Suprema Unificada v39.20 — ${result.parsed.playerName}`,
    positionLabel: 'Receita canônica da carta com diagnóstico tático separado',
    training,
    pointsUsed,
    note: analysis.summary,
    qualityScore: analysis.performanceCeiling,
    adaptationLabel: 'UMA CARTA • UMA RECEITA • UMA TELA • RECURSOS PROTEGIDOS',
    highlights: [
      analysis.identity.label,
      `${analysis.positionFit.selectedPositionLabel}: ${analysis.positionFit.verdict.toLocaleLowerCase('pt-BR')} (${Math.round(analysis.positionFit.compatibility)}/100).`,
      analysis.resourceSafety.label,
      `Ímpeto travado: ${analysis.primaryImpeto ?? 'revisar leitura'}.`,
      analysis.proCompact.label
    ],
    risks: analysis.warnings.slice(0, 5),
    efficiencyScore: result.eliteDominanceV3910?.winner.pointEfficiency ?? analysis.performanceCeiling,
    balanceScore: analysis.tacticalStability,
    verdict: analysis.summary,
    tradeOffs: analysis.positionFit.conflicts,
    simulationsTested: result.eliteDominanceV3910
      ? result.eliteDominanceV3910.candidatesEvaluated * Math.max(1, result.eliteDominanceV3910.compatiblePositions.length)
      : 1
  };
  return {
    ...result,
    training,
    trainingPointsUsed: pointsUsed,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - pointsUsed),
    recommendedSkills: skills.length ? skills : result.recommendedSkills,
    recommendedImpetos: impetos,
    buildVariants: [variant],
    buildName: variant.title,
    recommendationExplanation: [
      analysis.summary,
      'Receita otimizada para desempenho real, sem usar overall como objetivo.',
      analysis.identity.realLifeModel,
      analysis.positionFit.recommendedUse,
      ...analysis.deterministicChecks,
      ...result.recommendationExplanation
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 18),
    strengths: [
      `Identidade reconhecida: ${analysis.identity.label}.`,
      'Uma única receita definitiva por versão exata da carta.',
      'Ficha, habilidades e Ímpeto ficam separados do diagnóstico de posição.',
      'Proteção contra gasto de Ímpeto em encaixe tático incompatível.',
      ...result.strengths
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    weaknesses: [
      ...analysis.positionFit.conflicts,
      ...analysis.warnings,
      ...result.weaknesses
    ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 12),
    note: `${analysis.summary} O motor reduz erros e aleatoriedade, mas não pode garantir 100% de rendimento porque atualização do jogo, conexão e execução em partida continuam influenciando.`,
    unifiedPerformanceV3920: analysis
  };
}
