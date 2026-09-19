import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R437_RESUMABLE_ROSTER_IMPORT_VERSION = '40.80-r437-resumable-roster-import-v1';

const FILES = {
  center: 'src/modules/squad-mapping/SquadMappingCenter.tsx',
  helper: 'src/modules/squad-mapping/batchRosterImportR437.ts',
  runtimeTest: 'tests/v40-80-r437-resumable-roster-import-runtime-regression.ts',
  integrationTest: 'tests/v40-80-r437-resumable-roster-import-integration-regression.mjs',
  package: 'package.json'
};

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R437: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R437: contrato inesperado em ${label}; ocorrências=${count}`);
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
    "import { masterRosterCardReadinessR436, masterRosterSearchTextR436 } from './masterRosterCatalogR436';",
    "import { masterRosterCardReadinessR436, masterRosterSearchTextR436 } from './masterRosterCatalogR436';\nimport { batchRosterImportSummaryR437, createBatchRosterImportStatsR437, findImportedRosterCardBySourceHashR437, pauseBatchRosterImportR437, recordBatchRosterImportOutcomeR437 } from './batchRosterImportR437';",
    'import do checkpoint R437'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  const [importing, setImporting] = useState(false);\n  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, fileName: '' });",
    "  const [importing, setImporting] = useState(false);\n  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, fileName: '' });\n  const importCancelRequestedRef = useRef(false);",
    'ref de pausa segura'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  async function readMappingImage(file: File, currentPlayers: SquadMappingPlayer[]): Promise<SquadMappingPlayer> {",
    "  async function readMappingImage(file: File, currentPlayers: SquadMappingPlayer[], knownSourceHash?: string): Promise<SquadMappingPlayer> {",
    'assinatura de leitura com hash pré-calculado'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    const hash = await fileDigest(safeFile);",
    "    const hash = knownSourceHash || await fileDigest(safeFile);",
    'reuso de hash no leitor'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "  async function importImages(files: FileList | File[]) {",
    "  async function preflightSourceHashR437(file: File) {\n    const validated = await validateImageFile(file);\n    const safeFile = new File([validated.sanitizedBlob], file.name, { type: validated.mime, lastModified: file.lastModified });\n    return fileDigest(safeFile);\n  }\n\n  async function importImages(files: FileList | File[]) {",
    'preflight de hash antes da fila'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    if (!selected.length) return;\n    setImporting(true);\n    let nextPlayers = [...state.players];\n    let created = 0;\n    let updated = 0;\n    let failed = 0;",
    "    if (!selected.length) return;\n    importCancelRequestedRef.current = false;\n    setImporting(true);\n    let nextPlayers = [...state.players];\n    let stats = createBatchRosterImportStatsR437(selected.length);",
    'estado do lote retomável'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    for (let index = 0; index < selected.length; index += 1) {\n      const file = selected[index];",
    "    for (let index = 0; index < selected.length; index += 1) {\n      if (importCancelRequestedRef.current) {\n        stats = pauseBatchRosterImportR437(stats);\n        break;\n      }\n      const file = selected[index];",
    'pausa entre cartas'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "      try {\n        const incoming = await readMappingImage(file, nextPlayers);",
    "      try {\n        const sourceHash = await preflightSourceHashR437(file);\n        if (findImportedRosterCardBySourceHashR437(nextPlayers, sourceHash)) {\n          stats = recordBatchRosterImportOutcomeR437(stats, 'skipped');\n          continue;\n        }\n        const incoming = await readMappingImage(file, nextPlayers, sourceHash);",
    'skip pré-OCR por sourceHash'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "        if (merged.action === 'created') created += 1; else updated += 1;\n      } catch { failed += 1; }",
    "        stats = recordBatchRosterImportOutcomeR437(stats, merged.action);\n      } catch {\n        stats = recordBatchRosterImportOutcomeR437(stats, 'failed');\n      }",
    'estatísticas de resultado'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    "    setImporting(false);\n    setMessage(`${created} jogador(es) adicionado(s), ${updated} atualizado(s) e ${failed} arquivo(s) para tentar novamente.`);",
    "    setImporting(false);\n    importCancelRequestedRef.current = false;\n    setMessage(batchRosterImportSummaryR437(stats));",
    'resumo retomável'
  ); next = r.source;

  const oldProgress = `{importing && <section className="mapping-import-progress luxury-panel" role="status"><Loader2 className="spin" size={22}/><div><strong>Lendo jogador {importProgress.current} de {importProgress.total}</strong><span>{importProgress.fileName}</span><i><b style={{ width: \`${'${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}'}%\` }}/></i></div></section>}`;
  const newProgress = `{importing && <section className="mapping-import-progress luxury-panel" role="status"><Loader2 className="spin" size={22}/><div><strong>Lendo jogador {importProgress.current} de {importProgress.total}</strong><span>{importProgress.fileName}</span><small>Se pausar, selecione o mesmo lote depois: cartas já concluídas serão puladas antes do OCR.</small><i><b style={{ width: \`${'${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}'}%\` }}/></i></div><button type="button" onClick={() => { importCancelRequestedRef.current = true; setMessage('Pausa solicitada. A carta atual será concluída antes de parar.'); }}>Pausar após esta carta</button></section>}`;
  r = replaceOnceRequired(next, oldProgress, newProgress, 'controle visual de pausa'); next = r.source;

  r = replaceOnceRequired(
    next,
    '<section className="mapping-center" aria-label="Mapeamento Inteligente de Elenco">',
    '<section className="mapping-center" aria-label="Meu Elenco — Banco Mestre">',
    'aria-label do Meu Elenco'
  ); next = r.source;

  r = replaceOnceRequired(
    next,
    '<div className="mapping-hero-copy"><p className="kicker">Função premium</p><h1>Mapeamento Inteligente de Elenco</h1><p>Guarde os prints completos, reconheça o DNA de cada carta e monte automaticamente titulares e reservas em qualquer formação — inclusive com adaptações inteligentes, sem usar overall como decisão.</p>',
    '<div className="mapping-hero-copy"><p className="kicker">Banco mestre</p><h1>Meu Elenco — Banco Mestre</h1><p>Cadastre suas cartas uma vez, pesquise qualquer versão e reutilize os dados para fichas, titulares, reservas e formações sem repetir OCR nas cartas já conhecidas.</p>',
    'hero do Meu Elenco'
  ); next = r.source;

  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const runtime = 'node -r ./tests/_ts-require.cjs tests/v40-80-r437-resumable-roster-import-runtime-regression.ts';
  const integration = 'node tests/v40-80-r437-resumable-roster-import-integration-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R437: script test:r200 ausente.');
  let next = current;
  if (!next.includes(runtime)) next += ` && ${runtime}`;
  if (!next.includes(integration)) next += ` && ${integration}`;
  pkg.scripts['test:r200'] = next;
  return JSON.stringify(pkg, null, 2) + '\n';
}

function validate(root) {
  for (const relative of Object.values(FILES)) {
    if (!fs.existsSync(path.resolve(root, relative))) throw new Error(`R437: validação encontrou arquivo ausente: ${relative}`);
  }
  const center = fs.readFileSync(path.resolve(root, FILES.center), 'utf8');
  const helper = fs.readFileSync(path.resolve(root, FILES.helper), 'utf8');
  const pkg = fs.readFileSync(path.resolve(root, FILES.package), 'utf8');
  const checks = [
    [center.includes('preflightSourceHashR437'), 'preflight de hash'],
    [center.includes('findImportedRosterCardBySourceHashR437'), 'skip pré-OCR'],
    [center.includes('readMappingImage(file, nextPlayers, sourceHash)'), 'reuso de hash'],
    [center.includes('Pausar após esta carta'), 'pausa segura'],
    [center.includes('batchRosterImportSummaryR437(stats)'), 'resumo do lote'],
    [center.includes('const selected = Array.from(files);'), 'lote sem teto'],
    [!center.includes('Array.from(files).slice(0, 120)'), 'teto 120 ausente'],
    [center.includes('Gerar ficha sem OCR'), 'R436 preservada'],
    [center.includes('Meu Elenco — Banco Mestre'), 'superfície Meu Elenco'],
    [helper.includes('pulada(s) sem OCR'), 'mensagem de checkpoint'],
    [pkg.includes('v40-80-r437-resumable-roster-import-runtime-regression.ts'), 'runtime R437 no CI'],
    [pkg.includes('v40-80-r437-resumable-roster-import-integration-regression.mjs'), 'integração R437 no CI']
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R437: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR437ResumableRosterImport(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [
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
  return { changed: patched.length > 0, patched, version: R437_RESUMABLE_ROSTER_IMPORT_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR437ResumableRosterImport(process.cwd());
  console.log(result.changed
    ? `R437: importação retomável convergiu ${result.patched.length} arquivo(s).`
    : 'R437: importação retomável já estava convergida.');
}
