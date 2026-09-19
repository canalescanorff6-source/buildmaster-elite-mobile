import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R440_VISUAL_CARD_IDENTITY_VERSION = '40.80-r440-visual-card-identity-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  package: 'package.json',
  catalog: 'src/modules/card-catalog/masterCardCatalogR438.ts',
  resolver439: 'src/modules/card-catalog/cardIdentityResolverR439.ts',
  quickReader: 'src/modules/card-catalog/quickCardIdentityReaderR439.ts',
  visual: 'src/modules/card-catalog/cardVisualIdentityR440.ts',
  resolver440: 'src/modules/card-catalog/cardIdentityResolverR440.ts',
  learning: 'src/modules/card-catalog/masterCardVisualLearningR440.ts',
  runtimeTest: 'tests/v40-80-r440-visual-card-identity-runtime-regression.ts',
  learningTest: 'tests/v40-80-r440-visual-learning-regression.ts',
  integrationTest: 'tests/v40-80-r440-visual-card-identity-integration-regression.mjs'
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R440: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}
function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R440: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}
function replaceAllRequired(source, from, to, expectedCount, label) {
  if (!source.includes(from) && source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== expectedCount) throw new Error(`R440: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.split(from).join(to), changed: count > 0 };
}
function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function patchCatalog(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "  sourceHash: string | null;\n  completeness: MasterCardCompletenessR438;",
    "  sourceHash: string | null;\n  visualHash: string | null;\n  visualHashAlgorithm: string | null;\n  visualHashVariants: string[];\n  visualHashQuality: number | null;\n  completeness: MasterCardCompletenessR438;",
    'schema visual do Catálogo Mestre'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    sourceHash: input.sourceHash ? String(input.sourceHash).trim() : null,\n    completeness: 'IDENTITY_ONLY',",
    "    sourceHash: input.sourceHash ? String(input.sourceHash).trim() : null,\n    visualHash: /^[0-9a-f]{16}$/i.test(String(input.visualHash ?? '').trim()) ? String(input.visualHash).trim().toLowerCase() : null,\n    visualHashAlgorithm: input.visualHashAlgorithm ? String(input.visualHashAlgorithm).trim().slice(0, 40) : null,\n    visualHashVariants: uniqueStrings(input.visualHashVariants).filter((value) => /^[0-9a-f]{16}$/i.test(value)).map((value) => value.toLowerCase()).slice(0, 12),\n    visualHashQuality: finite(input.visualHashQuality, 0, 100),\n    completeness: 'IDENTITY_ONLY',",
    'normalização visual da carta'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    sourceHash: right.sourceHash || left.sourceHash,\n    confidence: Math.max(left.confidence, right.confidence)",
    "    sourceHash: right.sourceHash || left.sourceHash,\n    visualHash: right.visualHash || left.visualHash,\n    visualHashAlgorithm: right.visualHashAlgorithm || left.visualHashAlgorithm,\n    visualHashVariants: Array.from(new Set([...(left.visualHashVariants ?? []), ...(right.visualHashVariants ?? []), ...(left.visualHash ? [left.visualHash] : []), ...(right.visualHash ? [right.visualHash] : [])])).filter((value) => value !== (right.visualHash || left.visualHash)).slice(0, 12),\n    visualHashQuality: Math.max(Number(left.visualHashQuality) || 0, Number(right.visualHashQuality) || 0) || null,\n    confidence: Math.max(left.confidence, right.confidence)",
    'merge visual da carta'
  ); next = r.source;
  return next;
}

function patchResolver439(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "  country?: string | null;\n  rawText?: string | null;",
    "  country?: string | null;\n  visualFingerprint?: { algorithm: 'dhash64-v1'; hash: string; variants?: string[]; quality: number } | null;\n  rawText?: string | null;",
    'observação visual R439'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "export type MasterCardResolutionReasonR439 = 'SOURCE_HASH_EXACT' | 'CARD_FINGERPRINT_EXACT' | 'IDENTITY_SCORE' | 'MULTIPLE_CANDIDATES' | 'PLAYER_NOT_FOUND' | 'IDENTITY_INSUFFICIENT';",
    "export type MasterCardResolutionReasonR439 = 'SOURCE_HASH_EXACT' | 'CARD_FINGERPRINT_EXACT' | 'IDENTITY_SCORE' | 'MULTIPLE_CANDIDATES' | 'PLAYER_NOT_FOUND' | 'IDENTITY_INSUFFICIENT' | 'VISUAL_FINGERPRINT_MATCH' | 'VISUAL_FINGERPRINT_AMBIGUOUS';",
    'razões visuais R440'
  ); next = r.source;
  return next;
}

function patchQuickReader(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { validateImageFile } from '@/modules/images/imageSafety';",
    "import { validateImageFile } from '@/modules/images/imageSafety';\nimport { createSmartCardPreview } from '@/modules/card-reader/cardArtCrop';\nimport { extractCardVisualFingerprintR440 } from './cardVisualIdentityR440';",
    'imports da identidade visual'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "  const geometry = await inspectSinglePrintGeometry(safeFile);\n  const zones =",
    "  const geometry = await inspectSinglePrintGeometry(safeFile);\n  const smartCardR440 = await createSmartCardPreview(safeFile, geometry.cardArtZone).catch(() => null);\n  const visualFingerprint = await extractCardVisualFingerprintR440(safeFile, smartCardR440?.box ?? geometry.cardArtZone).catch(() => null);\n  const zones =",
    'fingerprint visual antes do OCR rápido'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    country: hints.country,\n    rawText: compactText",
    "    country: hints.country,\n    visualFingerprint,\n    rawText: compactText",
    'fingerprint na observação'
  ); next = r.source;
  return next;
}

function patchCenter(source) {
  if (source.includes('resolveMasterCardObservationR440') && source.includes('saveCardVisualFingerprintR440') && source.includes('learnedCardR440')) return source;
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { resolveMasterCardObservationR439 } from '@/modules/card-catalog/cardIdentityResolverR439';",
    "import { resolveMasterCardObservationR440 } from '@/modules/card-catalog/cardIdentityResolverR440';\nimport { saveCardVisualFingerprintR440 } from '@/modules/card-catalog/masterCardVisualLearningR440';",
    'imports R440 no Meu Elenco'
  ); next = r.source;
  r = replaceAllRequired(next, 'resolveMasterCardObservationR439(', 'resolveMasterCardObservationR440(', 2, 'chamadas do resolvedor R440'); next = r.source;

  r = replaceOnceRequired(
    next,
    `          if (selectedCardR439) {\n            await setOwnedCardR438(selectedCardR439.catalogCardId);\n            const projectedR439 = masterCardToSquadMappingPlayerR438(selectedCardR439);`,
    `          if (selectedCardR439) {\n            const learnedCardR440 = await saveCardVisualFingerprintR440(selectedCardR439, quickReadR439?.observation.visualFingerprint ?? null);\n            nextCatalogR439 = [learnedCardR440, ...nextCatalogR439.filter((item) => item.catalogCardId !== learnedCardR440.catalogCardId)];\n            setMasterCatalogR438(nextCatalogR439);\n            await setOwnedCardR438(learnedCardR440.catalogCardId);\n            const projectedR439 = masterCardToSquadMappingPlayerR438(learnedCardR440);`,
    'aprendizado visual em match automático'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "            setOwnedCatalogIdsR438((current) => new Set([...current, selectedCardR439.catalogCardId]));",
    "            setOwnedCatalogIdsR438((current) => new Set([...current, learnedCardR440.catalogCardId]));",
    'posse após aprendizado visual'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "        const catalogEntryR438 = await saveResolvedFullOcrCardR439(merged.player, selectedCatalogCardR439);\n        nextCatalogR439 = [catalogEntryR438, ...nextCatalogR439.filter((item) => item.catalogCardId !== catalogEntryR438.catalogCardId)];\n        setMasterCatalogR438(nextCatalogR439);",
    "        const catalogEntryR438 = await saveResolvedFullOcrCardR439(merged.player, selectedCatalogCardR439);\n        const learnedCatalogEntryR440 = await saveCardVisualFingerprintR440(catalogEntryR438, quickReadR439?.observation.visualFingerprint ?? null);\n        nextCatalogR439 = [learnedCatalogEntryR440, ...nextCatalogR439.filter((item) => item.catalogCardId !== learnedCatalogEntryR440.catalogCardId)];\n        setMasterCatalogR438(nextCatalogR439);",
    'aprendizado visual após OCR completo'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    `    await setOwnedCardR438(catalogCardId);\n    const projected = masterCardToSquadMappingPlayerR438(card);`,
    `    const learnedCardR440 = await saveCardVisualFingerprintR440(card, item.observation.visualFingerprint ?? null);\n    setMasterCatalogR438((current) => [learnedCardR440, ...current.filter((candidate) => candidate.catalogCardId !== learnedCardR440.catalogCardId)]);\n    await setOwnedCardR438(learnedCardR440.catalogCardId);\n    const projected = masterCardToSquadMappingPlayerR438(learnedCardR440);`,
    'aprendizado visual na seleção manual'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    setOwnedCatalogIdsR438((current) => new Set([...current, catalogCardId]));",
    "    setOwnedCatalogIdsR438((current) => new Set([...current, learnedCardR440.catalogCardId]));",
    'posse da seleção manual R440'
  ); next = r.source;
  r = replaceOnceRequired(
    next,
    "    setMessage(card.playerName + ' • ' + (card.cardLabel || card.catalogCardId) + ': versão confirmada no Meu Elenco.');",
    "    setMessage(learnedCardR440.playerName + ' • ' + (learnedCardR440.cardLabel || learnedCardR440.catalogCardId) + ': versão confirmada no Meu Elenco e identidade visual aprendida.');",
    'feedback do aprendizado visual'
  ); next = r.source;
  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const commands = [
    'node -r ./tests/_ts-require.cjs tests/v40-80-r440-visual-card-identity-runtime-regression.ts',
    'node -r ./tests/_ts-require.cjs tests/v40-80-r440-visual-learning-regression.ts',
    'node tests/v40-80-r440-visual-card-identity-integration-regression.mjs'
  ];
  let current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R440: script test:r200 ausente.');
  for (const command of commands) if (!current.includes(command)) current += ` && ${command}`;
  pkg.scripts['test:r200'] = current;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R440: validação encontrou arquivo ausente: ${relative}`);
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const quick = fs.readFileSync(path.resolve(root, FILES.quickReader), 'utf8');
  const catalog = fs.readFileSync(path.resolve(root, FILES.catalog), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [center.includes('resolveMasterCardObservationR440'), 'resolvedor visual no lote'],
    [center.includes('saveCardVisualFingerprintR440'), 'aprendizado visual no Meu Elenco'],
    [quick.includes('createSmartCardPreview'), 'recorte inteligente da arte'],
    [quick.includes('extractCardVisualFingerprintR440'), 'fingerprint antes do OCR completo'],
    [catalog.includes('visualHashVariants'), 'schema visual do catálogo'],
    [pkg.includes('v40-80-r440-visual-card-identity-runtime-regression.ts'), 'runtime R440 no CI'],
    [pkg.includes('v40-80-r440-visual-card-identity-integration-regression.mjs'), 'integração R440 no CI']
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R440: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR440VisualCardIdentity(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [
    [FILES.catalog, patchCatalog],
    [FILES.resolver439, patchResolver439],
    [FILES.quickReader, patchQuickReader],
    [FILES.center, patchCenter],
    [FILES.package, patchPackage]
  ];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R440_VISUAL_CARD_IDENTITY_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR440VisualCardIdentity(process.cwd());
  console.log(result.changed ? `R440: identidade visual convergiu ${result.patched.length} arquivo(s).` : 'R440: identidade visual já estava convergida.');
}
