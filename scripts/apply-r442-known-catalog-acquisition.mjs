import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R442_KNOWN_CATALOG_ACQUISITION_VERSION = '40.80-r442-known-catalog-acquisition-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  package: 'package.json',
  module: 'src/modules/card-catalog/knownCatalogAcquisitionR442.ts',
  runtimeTest: 'tests/v40-80-r442-known-catalog-acquisition-runtime-regression.ts',
  integrationTest: 'tests/v40-80-r442-known-catalog-acquisition-integration-regression.mjs',
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R442: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}
function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R442: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}
function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function patchCenter(source) {
  let next = source;
  let r = replaceOnceRequired(
    next,
    "import { catalogUpdateLabelR441, printVaultLabelR441 } from '@/modules/master-catalog/masterCatalogUiModelR441';",
    "import { catalogUpdateLabelR441, printVaultLabelR441 } from '@/modules/master-catalog/masterCatalogUiModelR441';\nimport { addKnownCatalogCardToMappingR442, knownCatalogCardActionR442, knownCatalogEditionLabelR442 } from '@/modules/card-catalog/knownCatalogAcquisitionR442';",
    'import R442'
  ); next = r.source;

  const derivedAnchor = "  const reviewCatalogEntriesR438 = useMemo(() => catalogSearchResultsR438.filter((card) => card.completeness !== 'COMPLETE'), [catalogSearchResultsR438]);";
  const derivedBlock = `${derivedAnchor}\n  const catalogCardActionR442 = (card: MasterCardCatalogEntryR438) => knownCatalogCardActionR442(card, ownedCatalogIdsR438.has(card.catalogCardId));`;
  r = replaceOnceRequired(next, derivedAnchor, derivedBlock, 'gate de ações do Catálogo Geral'); next = r.source;

  const functionAnchor = "  function addManualPlayer() {";
  const functionBlock = `  async function addKnownCatalogCardR442(card: MasterCardCatalogEntryR438) {\n    try {\n      await setOwnedCardR438(card.catalogCardId);\n      setOwnedCatalogIdsR438((current) => new Set([...current, card.catalogCardId]));\n      setState((current) => {\n        const acquisition = addKnownCatalogCardToMappingR442(card, current.players);\n        return { ...current, players: acquisition.players, updatedAt: new Date().toISOString() };\n      });\n      const nextAction = knownCatalogCardActionR442(card, true);\n      setMessage(nextAction.canGenerate\n        ? \`${'${card.playerName}'} • ${'${card.cardLabel || card.cardType || card.mainPosition}'} adicionado ao Meu Elenco sem novo print. Gerar ficha sem OCR foi liberado.\`\n        : \`${'${card.playerName}'} adicionado ao Meu Elenco sem novo print. A carta ainda precisa de revisão antes de gerar ficha.\`);\n    } catch (cause) {\n      setMessage(cause instanceof Error ? cause.message : 'Não foi possível adicionar esta carta ao Meu Elenco.');\n    }\n  }\n\n${functionAnchor}`;
  r = replaceOnceRequired(next, functionAnchor, functionBlock, 'aquisição direta R442'); next = r.source;

  const detailsAnchor = "<p>{card.cardLabel || card.cardType || 'Edição sem rótulo'}</p><small>{card.offensivePlaystyle || card.playstyle || 'Estilo não confirmado'} • nível {card.level ?? '?' } • {card.trainingPointsTotal ?? '?'} PP</small>";
  const detailsBlock = "<p>{knownCatalogEditionLabelR442(card)}</p><small>{card.offensivePlaystyle || card.playstyle || 'Estilo não confirmado'}{card.country ? ` • ${card.country}` : ''}</small>";
  r = replaceOnceRequired(next, detailsAnchor, detailsBlock, 'identificação visual da edição no catálogo'); next = r.source;

  const actionAnchor = `<div className="mapping-player-actions">{onGenerateMasterCard && <button type="button" disabled={card.completeness !== 'COMPLETE'} aria-label={\`Gerar ficha de ${'${card.playerName}'}\`} onClick={() => onGenerateMasterCard(card)}><Sparkles size={16}/></button>}</div>`;
  const actionBlock = `<div className="mapping-player-actions">{(() => { const actionR442 = catalogCardActionR442(card); return <>{actionR442.canAdd && <button type="button" className="elite-button" onClick={() => void addKnownCatalogCardR442(card)}><Plus size={16}/> Adicionar ao Meu Elenco</button>}{actionR442.canGenerate && onGenerateMasterCard && <button type="button" className="elite-button" aria-label={\`Gerar ficha de ${'${card.playerName}'} sem OCR\`} onClick={() => onGenerateMasterCard(card)}><Sparkles size={16}/> Gerar ficha</button>}{actionR442.owned && actionR442.needsReview && <button type="button" onClick={() => setTab('revisar')}><AlertTriangle size={16}/> Revisar dados</button>}</>; })()}</div>`;
  r = replaceOnceRequired(next, actionAnchor, actionBlock, 'CTAs de aquisição e geração'); next = r.source;

  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const commands = [
    'node -r ./tests/_ts-require.cjs tests/v40-80-r442-known-catalog-acquisition-runtime-regression.ts',
    'node tests/v40-80-r442-known-catalog-acquisition-integration-regression.mjs'
  ];
  let current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R442: script test:r200 ausente.');
  for (const command of commands) if (!current.includes(command)) current += ` && ${command}`;
  pkg.scripts['test:r200'] = current;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R442: validação encontrou arquivo ausente: ${relative}`);
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [center.includes('knownCatalogCardActionR442'), 'gate R442'],
    [center.includes('addKnownCatalogCardToMappingR442'), 'projeção sem print'],
    [center.includes('async function addKnownCatalogCardR442'), 'ação adicionar ao Meu Elenco'],
    [center.includes('Adicionar ao Meu Elenco'), 'CTA adicionar'],
    [center.includes('Gerar ficha'), 'CTA gerar'],
    [center.includes('actionR442.canGenerate'), 'geração só após posse'],
    [center.includes('knownCatalogEditionLabelR442'), 'identificação da edição'],
    [pkg.includes('v40-80-r442-known-catalog-acquisition-runtime-regression.ts'), 'R442 runtime no CI'],
    [pkg.includes('v40-80-r442-known-catalog-acquisition-integration-regression.mjs'), 'R442 integração no CI'],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R442: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR442KnownCatalogAcquisition(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [[FILES.center, patchCenter], [FILES.package, patchPackage]];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R442_KNOWN_CATALOG_ACQUISITION_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR442KnownCatalogAcquisition(process.cwd());
  console.log(result.changed ? `R442: aquisição direta convergiu ${result.patched.length} arquivo(s).` : 'R442: aquisição direta já estava convergida.');
}
