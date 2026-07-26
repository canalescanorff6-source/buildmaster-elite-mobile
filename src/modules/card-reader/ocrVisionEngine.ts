import type { PositionCode } from '@/lib/analyzerDomain';
import type { SingleFieldEvidence, SinglePrintSession } from './singlePrintPro';
import { officialPlaystyleForLabel, readOfficialRulePack } from '@/modules/rules/officialRuleRegistry';

export const OCR_VISION_VERSION = '30.50.0';

export type OcrVisionFieldStatus = 'trusted' | 'review' | 'blocked';

export type OcrVisionFieldAudit = {
  key: SingleFieldEvidence['key'];
  label: string;
  value: string | null;
  confidence: number;
  status: OcrVisionFieldStatus;
  officialMatch: boolean;
  reasons: string[];
};

export type OcrVisionPass = {
  id: 'geometry' | 'contrast' | 'sharp' | 'official-validation';
  label: string;
  required: boolean;
  reason: string;
};

export type OcrVisionAudit = {
  version: string;
  rulePackVersion: string;
  score: number;
  state: 'ready' | 'review' | 'blocked';
  template: SinglePrintSession['template'];
  resolutionClass: 'low' | 'standard' | 'high';
  fields: OcrVisionFieldAudit[];
  passes: OcrVisionPass[];
  blockingFields: string[];
  warnings: string[];
  corrections: string[];
  goalkeeperGuard: 'not-applicable' | 'safe' | 'review';
};

const POSITION_ALIASES: Record<string, PositionCode> = {
  GK: 'GK', GOL: 'GK', GO: 'GK',
  CB: 'CB', ZAG: 'CB',
  LB: 'LB', LE: 'LB',
  RB: 'RB', LD: 'RB',
  DMF: 'DMF', VOL: 'DMF',
  CMF: 'CMF', MLG: 'CMF', MC: 'CMF',
  LMF: 'LMF', MLE: 'LMF',
  RMF: 'RMF', MLD: 'RMF',
  AMF: 'AMF', MAT: 'AMF',
  LWF: 'LWF', PE: 'LWF',
  RWF: 'RWF', PD: 'RWF',
  SS: 'SS', SA: 'SS',
  CF: 'CF', CA: 'CF'
};

function normalized(value: string | null | undefined): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

function positionFromValue(value: string | null): PositionCode | null {
  const token = normalized(value).split(' ').find((item) => POSITION_ALIASES[item]);
  return token ? POSITION_ALIASES[token] : null;
}

function resolutionClass(width: number, height: number): OcrVisionAudit['resolutionClass'] {
  const longest = Math.max(width, height);
  if (longest < 1000) return 'low';
  if (longest >= 2200) return 'high';
  return 'standard';
}

function fieldStatus(field: SingleFieldEvidence, officialMatch: boolean): OcrVisionFieldStatus {
  if (field.status === 'missing' || field.confidence < 45) return 'blocked';
  if (field.status === 'review' || field.confidence < 75 || !officialMatch) return 'review';
  return 'trusted';
}

function isOfficialField(field: SingleFieldEvidence): boolean {
  const pack = readOfficialRulePack();
  if (!field.value) return false;
  if (field.key === 'position') return Boolean(positionFromValue(field.value));
  if (field.key === 'playstyle') return Boolean(officialPlaystyleForLabel(field.value));
  if (field.key === 'specialSkill') {
    const text = normalized(field.value);
    return pack.specialSkills.some((item) => text.includes(normalized(item))) || field.value.length >= 3;
  }
  if (field.key === 'skills') {
    const text = normalized(field.value);
    return pack.additionalSkills.some((item) => text.includes(normalized(item))) || field.value.length >= 12;
  }
  if (field.key === 'overall' || field.key === 'level' || field.key === 'points') return Number.isFinite(field.numericValue) || /^\d+$/.test(field.value.trim());
  return field.value.trim().length >= 2;
}

function auditField(field: SingleFieldEvidence): OcrVisionFieldAudit {
  const officialMatch = isOfficialField(field);
  const status = fieldStatus(field, officialMatch);
  const reasons: string[] = [field.reason];
  if (!officialMatch && ['position', 'playstyle', 'skills', 'specialSkill'].includes(field.key)) reasons.push('O valor não foi confirmado pela base oficial ativa.');
  if (field.alternatives.length > 0 && field.confidence < 85) reasons.push(`${field.alternatives.length} alternativa(s) disponível(is) para revisão.`);
  return { key: field.key, label: field.label, value: field.value, confidence: field.confidence, status, officialMatch, reasons };
}

function goalkeeperGuard(fields: OcrVisionFieldAudit[], rawText: string): OcrVisionAudit['goalkeeperGuard'] {
  const position = positionFromValue(fields.find((field) => field.key === 'position')?.value ?? null);
  if (position !== 'GK') return 'not-applicable';
  const text = normalized(rawText);
  const goalkeeperEvidence = ['CONSCIENCIA DO GOLEIRO', 'AGARRAR', 'ESPALMAR', 'REFLEXO DO GOLEIRO', 'ALCANCE DO GOLEIRO', 'GOLEIRO'].filter((item) => text.includes(item)).length;
  const lineEvidence = ['FINALIZACAO', 'DRIBLE', 'PASSE RASTEIRO', 'CONSCIENCIA OFENSIVA'].filter((item) => text.includes(item)).length;
  return goalkeeperEvidence >= 2 && goalkeeperEvidence >= lineEvidence ? 'safe' : 'review';
}

export function buildOcrVisionAudit(session: SinglePrintSession, rawText = session.canonicalText): OcrVisionAudit {
  const pack = readOfficialRulePack();
  const fields = session.fields.map(auditField);
  const blockingFields = [...new Set([
    ...fields.filter((field) => field.status === 'blocked').map((field) => field.label),
    ...session.blockingFields
  ])];
  const warnings = [...session.warnings];
  const corrections: string[] = [];
  const resolution = resolutionClass(session.width, session.height);
  const position = positionFromValue(fields.find((field) => field.key === 'position')?.value ?? null);
  const playstyle = fields.find((field) => field.key === 'playstyle')?.value ?? null;
  const officialStyle = officialPlaystyleForLabel(playstyle);

  if (resolution === 'low') warnings.push('Resolução baixa: prefira o print original sem recorte de aplicativo de mensagens.');
  if ((session.layoutConfidence ?? 100) < 65) warnings.push('Os limites da carta não foram encontrados com confiança suficiente.');
  if (position && officialStyle && !officialStyle.compatiblePositions.includes(position)) {
    warnings.push(`${officialStyle.label} não é compatível com ${position} na base oficial ativa.`);
    corrections.push('Revise separadamente posição e estilo; um campo pode ter sido trocado pelo OCR.');
  }
  const gkGuard = goalkeeperGuard(fields, rawText);
  if (gkGuard === 'review') {
    warnings.push('A carta foi reconhecida como goleiro, mas faltam evidências suficientes de atributos de GOL.');
    corrections.push('Não gerar atributos de jogador de linha até confirmar os campos específicos do goleiro.');
  }
  const level = fields.find((field) => field.key === 'level');
  const overall = fields.find((field) => field.key === 'overall');
  if (level?.value && overall?.value && level.value === overall.value) {
    warnings.push('Nível e GER ficaram iguais; confirme para evitar confusão entre os números.');
    corrections.push('Use a segunda passagem numérica apenas na área do nível.');
  }

  const scoredFields = fields.filter((field) => field.value !== null);
  const baseScore = scoredFields.length ? scoredFields.reduce((sum, field) => sum + field.confidence, 0) / scoredFields.length : 0;
  const precisionScore = session.precisionAudit.estimatedAccuracy;
  const officialBonus = fields.filter((field) => field.officialMatch).length * 1.1;
  const penalty = blockingFields.length * 8 + warnings.length * 1.5 + (gkGuard === 'review' ? 12 : 0);
  const score = Math.max(0, Math.min(100, Math.round(baseScore * 0.62 + precisionScore * 0.38 + officialBonus - penalty)));
  const state: OcrVisionAudit['state'] = blockingFields.length > 0 || gkGuard === 'review' ? 'blocked' : score >= 82 ? 'ready' : 'review';

  const passes: OcrVisionPass[] = [
    { id: 'geometry', label: 'Geometria automática', required: true, reason: `Template ${session.template}, ${session.width}×${session.height}.` },
    { id: 'contrast', label: 'Consenso multietapas local', required: true, reason: `${session.precisionAudit.totalPasses} passagens distribuídas entre tratamentos de cor, contraste, nitidez e binarização.` },
    { id: 'sharp', label: 'Releitura seletiva dos campos críticos', required: state !== 'ready', reason: state === 'ready' ? 'O consenso alto dispensou novas passagens.' : 'Nome, posição e números sem acordo permanecem bloqueados para confirmação.' },
    { id: 'official-validation', label: 'Validação pela base oficial', required: true, reason: `Pacote ${pack.version} • ${pack.season}.` }
  ];

  return {
    version: OCR_VISION_VERSION,
    rulePackVersion: pack.version,
    score,
    state,
    template: session.template,
    resolutionClass: resolution,
    fields,
    passes,
    blockingFields,
    warnings: [...new Set(warnings)],
    corrections: [...new Set(corrections)],
    goalkeeperGuard: gkGuard
  };
}

export function buildOcrVisionCanonicalText(session: SinglePrintSession, audit: OcrVisionAudit): string {
  const trusted = new Set(audit.fields.filter((field) => field.status === 'trusted').map((field) => field.key));
  const lines = session.canonicalText.split('\n').filter((line) => {
    if (line.startsWith('POSIÇÃO PRINCIPAL:')) return trusted.has('position');
    if (line.startsWith('ESTILO DE JOGO:')) return trusted.has('playstyle');
    if (line.startsWith('NÍVEL MÁXIMO:')) return trusted.has('level');
    return true;
  });
  return `${lines.join('\n')}\n[OCR VISION ${audit.version}]\nCONFIANÇA VALIDADA: ${audit.score}\nBASE OFICIAL: ${audit.rulePackVersion}`;
}
