import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R419_READER_MASTER_ENGINE_VERSION = '40.80-r419-reader-master-engine-closure-v2-r456';

const FILES = {
  budget: 'src/modules/builds/pointBudget.ts',
  optimizer: 'src/modules/builds/trainingOptimizer.ts',
  domain: 'src/lib/analyzerDomain.ts',
  clean: 'src/lib/cleanSlatePerformance2027V4080R119.ts',
  helper: 'src/modules/analysis/cardEvidenceAuthorityR419.ts',
  r192Closure: 'scripts/check-result-workspace-static-closure-r192.mjs',
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R419: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeIfChanged(file, previous, next, patched, relative) {
  if (previous === next) return false;
  fs.writeFileSync(file, next, 'utf8');
  if (!patched.includes(relative)) patched.push(relative);
  return true;
}

function replaceOnce(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R419: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexOnce(source, pattern, replacement, label) {
  if (typeof replacement === 'string' && source.includes(replacement)) return { source, changed: false };
  const matches = source.match(pattern);
  if (!matches) throw new Error(`R419: contrato ausente em ${label}`);
  const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  const count = [...source.matchAll(global)].length;
  if (count !== 1) throw new Error(`R419: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

const helperSource = `import type { CardEvidenceStateR419, ParsedCard } from '../../lib/analyzerDomain';
import { inferPointsFromCardLevel } from '../builds/pointBudget';

export const CARD_EVIDENCE_AUTHORITY_R419_VERSION = '40.80-r419-critical-evidence-v1' as const;

export type TrainingBudgetEvidenceR419 = {
  state: CardEvidenceStateR419;
  budget: number;
  source: ParsedCard['trainingPointSource'] | 'UNSPECIFIED';
  reasons: string[];
};

function validBudget(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 && numeric <= 140 ? Math.round(numeric) : 0;
}

export function deriveTrainingBudgetEvidenceR419(parsed: ParsedCard): TrainingBudgetEvidenceR419 {
  const budget = validBudget(parsed.trainingPointsTotal);
  const source = parsed.trainingPointSource ?? 'UNSPECIFIED';
  if (!budget) return { state: 'MISSING', budget: 0, source, reasons: ['PP total ausente ou inválido.'] };

  const used = Number(parsed.trainingPointsUsed ?? 0);
  if (Number.isFinite(used) && used > budget) {
    return { state: 'CONFLICTING', budget, source, reasons: [\`PP usado (\${Math.round(used)}) excede PP total (\${budget}).\`] };
  }

  if (source === 'FALLBACK') {
    return { state: 'UNCERTAIN', budget, source, reasons: ['PP marcado como fallback não pode autorizar progressão.'] };
  }
  if (source === 'MANUAL' || source === 'TRAINING_READ') {
    return { state: 'TRUSTED', budget, source, reasons: ['PP confirmado por fonte explícita.'] };
  }
  if (source === 'OCR') {
    const trusted = parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.78;
    return { state: trusted ? 'TRUSTED' : 'UNCERTAIN', budget, source, reasons: [trusted ? 'OCR com confiança suficiente para PP.' : 'OCR de PP precisa de confirmação.'] };
  }
  if (source === 'LEVEL_INFERRED') {
    const inferred = inferPointsFromCardLevel(parsed.level);
    if (inferred !== budget) {
      return { state: 'CONFLICTING', budget, source, reasons: ['PP inferido não coincide com o nível lido.'] };
    }
    const trusted = parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.9;
    return { state: trusted ? 'TRUSTED' : 'UNCERTAIN', budget, source, reasons: [trusted ? 'Nível confiável confirma o PP inferido.' : 'Nível inferido ainda precisa de confirmação.'] };
  }

  if (parsed.manualConfirmed) {
    return { state: 'TRUSTED', budget, source, reasons: ['Carta confirmada manualmente com PP positivo.'] };
  }
  const inferred = inferPointsFromCardLevel(parsed.level);
  if (inferred === budget && Number(parsed.confidence ?? 0) >= 0.92) {
    return { state: 'TRUSTED', budget, source, reasons: ['PP e nível convergem com alta confiança.'] };
  }
  return { state: 'UNCERTAIN', budget, source, reasons: ['PP positivo sem proveniência suficiente para autorizar progressão.'] };
}

export function applyCriticalEvidenceR419(parsed: ParsedCard): ParsedCard {
  const budget = deriveTrainingBudgetEvidenceR419(parsed);
  const evidenceAttributeCount = Number(parsed.evidence?.attributeCount ?? 0);
  const actualAttributeCount = Object.values(parsed.attributes ?? {}).filter((value) => Number.isFinite(Number(value))).length;
  const attributeCount = Math.max(Number.isFinite(evidenceAttributeCount) ? evidenceAttributeCount : 0, actualAttributeCount);
  const criticalState: CardEvidenceStateR419 = budget.state !== 'TRUSTED'
    ? budget.state
    : attributeCount > 0
      ? 'TRUSTED'
      : 'MISSING';
  return {
    ...parsed,
    evidence: {
      ...parsed.evidence,
      criticalStateR419: criticalState,
      criticalReasonsR419: [...budget.reasons, ...(attributeCount > 0 ? [] : ['Atributos críticos ausentes.'])],
      trainingBudgetStateR419: budget.state,
      levelStateR419: parsed.level == null ? 'MISSING' : (parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.9 ? 'TRUSTED' : 'UNCERTAIN')
    }
  };
}
`;

function patchBudget(source) {
  let next = source;
  next = next.replace('export const MIN_PLAYER_TRAINING_BUDGET = 20;', 'export const MIN_PLAYER_TRAINING_BUDGET = 1;');
  next = next.replace(
`export function normalizePlayerTrainingBudget(value: number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < MIN_PLAYER_TRAINING_BUDGET || numeric > MAX_PLAYER_TRAINING_BUDGET) return SAFE_PLAYER_TRAINING_BUDGET;
  return Math.round(numeric);
}`,
`export function normalizePlayerTrainingBudget(value: number | null | undefined): number {
  const numeric = Number(value);
  // R419: 0 representa orçamento desconhecido/bloqueado. Nunca fabricar 64 PP.
  if (!Number.isFinite(numeric) || numeric < MIN_PLAYER_TRAINING_BUDGET || numeric > MAX_PLAYER_TRAINING_BUDGET) return 0;
  return Math.round(numeric);
}`);
  if (/return\s+SAFE_PLAYER_TRAINING_BUDGET\s*;/.test(next)) throw new Error('R419: fallback 64 permaneceu em pointBudget.');
  return next;
}

function patchOptimizer(source) {
  let next = source;
  const start = next.indexOf('export function trainingBudgetFromCard(parsed: ParsedCard): number {');
  const endMarker = '\nexport function isGoalkeeperStyle';
  const end = start >= 0 ? next.indexOf(endMarker, start) : -1;
  if (start < 0) {
    if (!next.includes('R419: orçamento ausente permanece 0')) throw new Error('R419: trainingBudgetFromCard não encontrado.');
  } else {
    if (end < 0) throw new Error('R419: fim de trainingBudgetFromCard não encontrado.');
    const replacement = `export function trainingBudgetFromCard(parsed: ParsedCard): number {\n  // R419: trainingPointsTotal é a autoridade primária. Orçamento ausente nunca vira 64.\n  const total = normalizeTrainingBudget(parsed.trainingPointsTotal);\n  if (total > 0) return total;\n\n  const inferred = inferTrainingPointsFromLevel(parsed.level);\n  const inferredTrusted = parsed.trainingPointSource === 'LEVEL_INFERRED'\n    && (parsed.manualConfirmed || Number(parsed.confidence ?? 0) >= 0.9);\n  if (inferredTrusted && inferred) return normalizeTrainingBudget(inferred);\n\n  // R419: orçamento ausente permanece 0 e deve ser bloqueado pelo Clean Slate.\n  return 0;\n}\n`;
    next = next.slice(0, start) + replacement + next.slice(end);
  }
  next = next.replace(/export function normalizeTrainingBudget\(value: number \| null \| undefined\): number \{\n\s*return normalizePlayerTrainingBudget\(value\);\n\}/,
`export function normalizeTrainingBudget(value: number | null | undefined): number {
  return normalizePlayerTrainingBudget(value);
}`);
  if (/return\s+SAFE_DEFAULT_TRAINING_BUDGET\s*;/.test(next)) throw new Error('R419: fallback 64 permaneceu em trainingOptimizer.');
  return next;
}

function patchDomain(source) {
  let next = source;
  if (!next.includes("export type CardEvidenceStateR419 = 'MISSING' | 'UNCERTAIN' | 'CONFLICTING' | 'TRUSTED';")) {
    const anchor = 'export type PositionRatings = Partial<Record<PositionCode, number>>;';
    if (!next.includes(anchor)) throw new Error('R419: âncora de tipo de evidência ausente.');
    next = next.replace(anchor, `${anchor}\nexport type CardEvidenceStateR419 = 'MISSING' | 'UNCERTAIN' | 'CONFLICTING' | 'TRUSTED';`);
  }
  if (!next.includes('criticalStateR419?: CardEvidenceStateR419;')) {
    const anchor = '    impetoSlotEvidence?: string | null;';
    if (!next.includes(anchor)) throw new Error('R419: âncora ParsedCard.evidence ausente.');
    next = next.replace(anchor, `${anchor}\n    criticalStateR419?: CardEvidenceStateR419;\n    criticalReasonsR419?: string[];\n    trainingBudgetStateR419?: CardEvidenceStateR419;\n    levelStateR419?: CardEvidenceStateR419;`);
  }
  return next;
}

export function convergeR192ModuleBudgetR419(source) {
  // R456: R454/R455 adicionam exatamente um módulo estático legítimo de scouting ao caminho do resultado.
  // O contador permanece exato/fail-closed; qualquer valor futuro desconhecido continua bloqueado.
  const finalMarker = 'const MAX_MODULES_R192 = 129;';
  if (source.includes(finalMarker)) return source;
  for (const legacy of ['const MAX_MODULES_R192 = 128;', 'const MAX_MODULES_R192 = 127;', 'const MAX_MODULES_R192 = 125;']) {
    if (source.includes(legacy)) return source.replace(legacy, finalMarker);
  }
  throw new Error('R419/R456: contrato de módulos R192 inesperado; esperado 125, 127, 128 ou 129.');
}

function patchClean(source) {
  let next = source;
  if (!next.includes("import { applyCriticalEvidenceR419 } from '../modules/analysis/cardEvidenceAuthorityR419';")) {
    const anchor = "import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';";
    if (!next.includes(anchor)) throw new Error('R419: import anchor Clean Slate ausente.');
    next = next.replace(anchor, `${anchor}\nimport { applyCriticalEvidenceR419 } from '../modules/analysis/cardEvidenceAuthorityR419';`);
  }
  const oldParsed = "  const parsed:ParsedCard=rawSnapshot ? JSON.parse(JSON.stringify(rawSnapshot)) as ParsedCard : JSON.parse(JSON.stringify(input.parsed)) as ParsedCard;";
  const newParsed = "  const parsed:ParsedCard=applyCriticalEvidenceR419(rawSnapshot ? JSON.parse(JSON.stringify(rawSnapshot)) as ParsedCard : JSON.parse(JSON.stringify(input.parsed)) as ParsedCard);";
  if (next.includes(oldParsed)) next = next.replace(oldParsed, newParsed);
  else if (!next.includes('const parsed:ParsedCard=applyCriticalEvidenceR419(')) throw new Error('R419: clone protegido do Clean Slate não encontrado.');

  const oldGate = "  if(!budget || attributeCount<minimum) {";
  const r452Gate = "  if(!budget) {";
  const newGate = "  const budgetEvidenceStateR419=parsed.evidence?.trainingBudgetStateR419??'MISSING';\n  if(!budget || budgetEvidenceStateR419!=='TRUSTED') {";
  if (next.includes(oldGate)) next = next.replace(oldGate, newGate);
  else if (next.includes(r452Gate) && next.includes('R452: ficha provisória')) next = next.replace(r452Gate, newGate);
  else if (!next.includes("budgetEvidenceStateR419!=='TRUSTED'")) throw new Error('R419: gate de orçamento Clean Slate ausente.');

  next = next.replace(
    "reasons:['Leitura insuficiente para gerar uma ficha Clean Slate segura; a ficha antiga não foi usada como fallback.',playstyleContext.note,'Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']",
    "reasons:[`Leitura insuficiente para gerar ficha segura; evidência PP R419: ${budgetEvidenceStateR419}.`,...(parsed.evidence?.criticalReasonsR419??[]),playstyleContext.note,'Top 5 permaneceu disponível porque posição e habilidades possuídas podem ser validadas independentemente do orçamento da ficha.']"
  );
  return next;
}

export function applyR419ReaderMasterEngineClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;

  const budget = readRequired(root, FILES.budget);
  const budgetNext = patchBudget(budget.source);
  changed = writeIfChanged(budget.file, budget.source, budgetNext, patched, FILES.budget) || changed;

  const optimizer = readRequired(root, FILES.optimizer);
  const optimizerNext = patchOptimizer(optimizer.source);
  changed = writeIfChanged(optimizer.file, optimizer.source, optimizerNext, patched, FILES.optimizer) || changed;

  const domain = readRequired(root, FILES.domain);
  const domainNext = patchDomain(domain.source);
  changed = writeIfChanged(domain.file, domain.source, domainNext, patched, FILES.domain) || changed;

  const clean = readRequired(root, FILES.clean);
  const cleanNext = patchClean(clean.source);
  changed = writeIfChanged(clean.file, clean.source, cleanNext, patched, FILES.clean) || changed;

  const helperPath = path.resolve(root, FILES.helper);
  if (!fs.existsSync(helperPath) || fs.readFileSync(helperPath, 'utf8') !== helperSource) {
    fs.mkdirSync(path.dirname(helperPath), { recursive: true });
    fs.writeFileSync(helperPath, helperSource, 'utf8');
    patched.push(FILES.helper);
    changed = true;
  }

  // R456: R417 reserva 125→127, R419 adiciona o 128º e o scouting contextual R454/R455 adiciona exatamente o 129º.
  const r192 = readRequired(root, FILES.r192Closure);
  const r192Next = convergeR192ModuleBudgetR419(r192.source);
  changed = writeIfChanged(r192.file, r192.source, r192Next, patched, FILES.r192Closure) || changed;

  const finalBudget = fs.readFileSync(budget.file, 'utf8');
  const finalOptimizer = fs.readFileSync(optimizer.file, 'utf8');
  const finalDomain = fs.readFileSync(domain.file, 'utf8');
  const finalClean = fs.readFileSync(clean.file, 'utf8');
  const finalR192 = fs.readFileSync(r192.file, 'utf8');
  if (/return\s+SAFE_PLAYER_TRAINING_BUDGET\s*;/.test(finalBudget)) throw new Error('R419: pointBudget ainda fabrica fallback.');
  if (/return\s+SAFE_DEFAULT_TRAINING_BUDGET\s*;/.test(finalOptimizer)) throw new Error('R419: optimizer ainda fabrica fallback.');
  if (!finalDomain.includes('trainingBudgetStateR419?: CardEvidenceStateR419;')) throw new Error('R419: estado de evidência não entrou no domínio.');
  if (!finalClean.includes("budgetEvidenceStateR419!=='TRUSTED'")) throw new Error('R419: Clean Slate não bloqueia PP não confiável.');
  if (!/ignoresOverall:true/.test(finalClean)) throw new Error('R419: guard Overall/GER ausente.');
  if (!finalR192.includes('const MAX_MODULES_R192 = 129;')) throw new Error('R419/R456: R192 não contabiliza a closure atual com scouting contextual.');

  return { changed, patched, version: R419_READER_MASTER_ENGINE_VERSION, fabricatedBudgetFallback: false, failClosedEvidence: true, r192ClosureModules: 129 };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR419ReaderMasterEngineClosure(process.cwd());
  console.log(result.changed
    ? `R419: leitor/motor convergidos em ${result.patched.length} arquivo(s).`
    : 'R419: leitor/motor já estavam convergidos.');
}
