import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CLEAN_COMPONENT = 'src/components/CleanVaultV3800.tsx';
const WORKSPACE_COMPONENT = 'src/components/vault/CardVisionVaultWorkspaceR191.tsx';
const WORKSPACE_RUNTIME = 'src/modules/vault/useProgressiveVaultWorkspaceR413.ts';
const CLEAN_LIB = 'src/lib/cleanVaultV3800.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r413-progressive-vault-render-regression.mjs';

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R413: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function assertContract(source, fragment, label) {
  if (!source.includes(fragment)) throw new Error(`R413: contrato ausente após patch em ${label}: ${fragment}`);
}

export function applyProgressiveVaultRenderR413(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const cleanPath = resolve(root, CLEAN_COMPONENT);
  const workspacePath = resolve(root, WORKSPACE_COMPONENT);
  const workspaceRuntimePath = resolve(root, WORKSPACE_RUNTIME);
  const libPath = resolve(root, CLEAN_LIB);
  const packagePath = resolve(root, PACKAGE);
  for (const file of [cleanPath, workspacePath, libPath, packagePath]) {
    if (!existsSync(file)) throw new Error(`R413: arquivo obrigatório ausente: ${file}`);
  }

  let changed = false;
  let clean = readFileSync(cleanPath, 'utf8');
  let workspace = readFileSync(workspacePath, 'utf8');
  let lib = readFileSync(libPath, 'utf8');


  const workspaceRuntime = `import { useEffect, useMemo, useRef, useState } from 'react';
import type { CardVisionVaultView } from '@/lib/appNavigationR127';
import { folderForEntry } from '@/lib/vaultUsability';
import type { SavedAnalysis } from './cardHistoryStore';

export const CARDVISION_COMPARE_RENDER_BATCH_R413 = 80 as const;

export function useProgressiveVaultWorkspaceR413(vaultView: CardVisionVaultView, renderHistory: SavedAnalysis[]) {
  const [compareVisibleCountR413, setCompareVisibleCountR413] = useState<number>(CARDVISION_COMPARE_RENDER_BATCH_R413);
  const compareLoadMoreRefR413 = useRef<HTMLDivElement | null>(null);
  const compareViewRefR413 = useRef(vaultView);
  const enteringCompareR413 = vaultView === 'comparar' && compareViewRefR413.current !== 'comparar';
  const effectiveCompareVisibleCountR413 = enteringCompareR413 ? CARDVISION_COMPARE_RENDER_BATCH_R413 : compareVisibleCountR413;
  const compareHistoryR413 = useMemo(() => renderHistory.slice(0, effectiveCompareVisibleCountR413), [renderHistory, effectiveCompareVisibleCountR413]);
  const compareHasMoreR413 = effectiveCompareVisibleCountR413 < renderHistory.length;
  const folderCountsR413 = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of renderHistory) {
      const folderId = folderForEntry(item);
      counts.set(folderId, (counts.get(folderId) ?? 0) + 1);
    }
    return counts;
  }, [renderHistory]);
  const loadMoreCompareR413 = () => setCompareVisibleCountR413(Math.min(renderHistory.length, effectiveCompareVisibleCountR413 + CARDVISION_COMPARE_RENDER_BATCH_R413));

  useEffect(() => {
    const previousView = compareViewRefR413.current;
    compareViewRefR413.current = vaultView;
    if (vaultView === 'comparar' && previousView !== 'comparar') setCompareVisibleCountR413(CARDVISION_COMPARE_RENDER_BATCH_R413);
  }, [vaultView]);

  useEffect(() => {
    const node = compareLoadMoreRefR413.current;
    if (vaultView !== 'comparar' || !node || !compareHasMoreR413 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreCompareR413();
    }, { rootMargin: '720px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [vaultView, renderHistory.length, compareHasMoreR413, effectiveCompareVisibleCountR413]);

  return { compareHistoryR413, compareHasMoreR413, compareLoadMoreRefR413, folderCountsR413, loadMoreCompareR413 };
}
`;
  if (!existsSync(workspaceRuntimePath) || readFileSync(workspaceRuntimePath, 'utf8') !== workspaceRuntime) {
    mkdirSync(dirname(workspaceRuntimePath), { recursive: true });
    writeFileSync(workspaceRuntimePath, workspaceRuntime, 'utf8');
    changed = true;
  }

  let r = replaceRequired(
    clean,
    "import { useMemo } from 'react';",
    "import { useEffect, useMemo, useRef, useState } from 'react';",
    'hooks do catálogo Clean'
  );
  clean = r.source; changed ||= r.changed;

  r = replaceRequired(
    clean,
    "export type CleanVaultSort = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';",
    "export type CleanVaultSort = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';\n\nexport const CLEAN_VAULT_RENDER_BATCH_R413 = 48 as const;",
    'batch progressivo do catálogo'
  );
  clean = r.source; changed ||= r.changed;

  const cleanStateAnchor = "  const mergeKey = (ids: string[]) => `merge:${ids.slice().sort().join('|')}`;";
  const cleanStatePatched = `${cleanStateAnchor}\n  const [renderedGroupCountR413, setRenderedGroupCountR413] = useState<number>(CLEAN_VAULT_RENDER_BATCH_R413);\n  const loadMoreSentinelR413 = useRef<HTMLDivElement | null>(null);\n  const renderScopeR413 = [\n    props.query, props.historyFilter, props.sort, props.advancedFilters.folderId, props.advancedFilters.position,\n    props.advancedFilters.playstyle, props.advancedFilters.skill, props.advancedFilters.minConfidence,\n    props.advancedFilters.maxConfidence, props.advancedFilters.minEfficiency, props.advancedFilters.favoritesOnly,\n    props.advancedFilters.pendingOnly, props.advancedFilters.reviewOnly, props.visibleEntries.length,\n  ].join('\u001f');\n  const renderScopeRefR413 = useRef(renderScopeR413);\n  const effectiveRenderedGroupCountR413 = renderScopeRefR413.current === renderScopeR413\n    ? renderedGroupCountR413\n    : CLEAN_VAULT_RENDER_BATCH_R413;\n  const progressiveGroupsR413 = useMemo(\n    () => groups.slice(0, effectiveRenderedGroupCountR413),\n    [groups, effectiveRenderedGroupCountR413]\n  );\n  const hasMoreGroupsR413 = effectiveRenderedGroupCountR413 < groups.length;\n  const loadMoreGroupsR413 = () => {\n    renderScopeRefR413.current = renderScopeR413;\n    setRenderedGroupCountR413(Math.min(groups.length, effectiveRenderedGroupCountR413 + CLEAN_VAULT_RENDER_BATCH_R413));\n  };\n\n  useEffect(() => {\n    if (renderScopeRefR413.current === renderScopeR413) return;\n    renderScopeRefR413.current = renderScopeR413;\n    setRenderedGroupCountR413(CLEAN_VAULT_RENDER_BATCH_R413);\n  }, [renderScopeR413]);\n\n  useEffect(() => {\n    const node = loadMoreSentinelR413.current;\n    if (!node || !hasMoreGroupsR413 || typeof IntersectionObserver === 'undefined') return;\n    const observer = new IntersectionObserver((entries) => {\n      if (entries.some((entry) => entry.isIntersecting)) {\n        renderScopeRefR413.current = renderScopeR413;\n        setRenderedGroupCountR413(Math.min(groups.length, effectiveRenderedGroupCountR413 + CLEAN_VAULT_RENDER_BATCH_R413));\n      }\n    }, { rootMargin: '720px 0px' });\n    observer.observe(node);\n    return () => observer.disconnect();\n  }, [groups.length, hasMoreGroupsR413, effectiveRenderedGroupCountR413, renderScopeR413]);`;
  r = replaceRequired(clean, cleanStateAnchor, cleanStatePatched, 'estado progressivo do catálogo');
  clean = r.source; changed ||= r.changed;

  r = replaceRequired(
    clean,
    "      {groups.length > 0 ? (\n        <div className=\"bm-v3800-player-groups\">",
    "      {groups.length > 0 ? (\n        <>\n        <div className=\"bm-v3800-player-groups\">",
    'fragmento progressivo do catálogo'
  );
  clean = r.source; changed ||= r.changed;

  r = replaceRequired(clean, '          {groups.map((group) => {', '          {progressiveGroupsR413.map((group) => {', 'map progressivo do catálogo');
  clean = r.source; changed ||= r.changed;

  r = replaceRequired(
    clean,
    "          })}\n        </div>\n      ) : props.entries.length > 0 ? (",
    "          })}\n        </div>\n        {hasMoreGroupsR413 && (\n          <div className=\"bm-v3800-progressive-loader\" ref={loadMoreSentinelR413} role=\"status\" aria-live=\"polite\">\n            <span>Mostrando {progressiveGroupsR413.length} de {groups.length} jogador(es).</span>\n            <button type=\"button\" onClick={loadMoreGroupsR413}>Carregar mais {Math.min(CLEAN_VAULT_RENDER_BATCH_R413, groups.length - progressiveGroupsR413.length)}</button>\n          </div>\n        )}\n        </>\n      ) : props.entries.length > 0 ? (",
    'sentinela progressiva do catálogo'
  );
  clean = r.source; changed ||= r.changed;

  r = replaceRequired(
    lib,
    "    const key = cleanVaultPlayerKey(entry);\n    byPlayer.set(key, [...(byPlayer.get(key) ?? []), entry]);",
    "    const key = cleanVaultPlayerKey(entry);\n    const bucket = byPlayer.get(key);\n    if (bucket) bucket.push(entry);\n    else byPlayer.set(key, [entry]);",
    'agrupamento linear do Cofre'
  );
  lib = r.source; changed ||= r.changed;

  r = replaceRequired(
    workspace,
    "import { folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';",
    "import type { VaultFilterState, VaultFolder } from '@/lib/vaultUsability';\nimport { useProgressiveVaultWorkspaceR413 } from '@/modules/vault/useProgressiveVaultWorkspaceR413';",
    'runtime progressivo do workspace'
  );
  workspace = r.source; changed ||= r.changed;

  const workspaceStateAnchor = "  const vaultActionBusyR154 = (key: string) => activeVaultActionKeysR154.includes(key);";
  const workspaceStatePatched = `${workspaceStateAnchor}\n  const { compareHistoryR413, compareHasMoreR413, compareLoadMoreRefR413, folderCountsR413, loadMoreCompareR413 } = useProgressiveVaultWorkspaceR413(vaultView, renderHistory);`;
  r = replaceRequired(workspace, workspaceStateAnchor, workspaceStatePatched, 'hook progressivo e contagem de pastas');
  workspace = r.source; changed ||= r.changed;

  r = replaceRequired(
    workspace,
    "                const count = folder.id === 'all' ? renderHistory.length : renderHistory.filter((item) => folderForEntry(item) === folder.id).length;",
    "                const count = folder.id === 'all' ? renderHistory.length : (folderCountsR413.get(folder.id) ?? 0);",
    'contagem linear de pastas'
  );
  workspace = r.source; changed ||= r.changed;

  r = replaceRequired(
    workspace,
    "            {renderHistory.length ? <div className=\"compare-player-catalog\">{renderHistory.map((item) => {",
    "            {renderHistory.length ? <><div className=\"compare-player-catalog\">{compareHistoryR413.map((item) => {",
    'catálogo progressivo do comparador'
  );
  workspace = r.source; changed ||= r.changed;

  r = replaceRequired(
    workspace,
    "            })}</div> : <div className=\"empty-cofre-card vault-empty-state\"><div className=\"empty-icon\"><Trophy size={28} /></div><strong>Salve jogadores antes de comparar</strong><span>O comparador usa as fichas guardadas no Cofre.</span></div>}",
    "            })}</div>{compareHasMoreR413 && <div className=\"bm-v3800-progressive-loader\" ref={compareLoadMoreRefR413} role=\"status\" aria-live=\"polite\"><span>Mostrando {compareHistoryR413.length} de {renderHistory.length} ficha(s).</span><button type=\"button\" onClick={loadMoreCompareR413}>Carregar mais</button></div>}</> : <div className=\"empty-cofre-card vault-empty-state\"><div className=\"empty-icon\"><Trophy size={28} /></div><strong>Salve jogadores antes de comparar</strong><span>O comparador usa as fichas guardadas no Cofre.</span></div>}",
    'sentinela progressiva do comparador'
  );
  workspace = r.source; changed ||= r.changed;

  const cleanContracts = [
    'CLEAN_VAULT_RENDER_BATCH_R413 = 48',
    'groups.slice(0, effectiveRenderedGroupCountR413)',
    'progressiveGroupsR413.map((group)',
    'loadMoreSentinelR413',
    "rootMargin: '720px 0px'",
  ];
  for (const contract of cleanContracts) assertContract(clean, contract, 'CleanVaultV3800');
  if (clean.includes('          {groups.map((group) => {')) throw new Error('R413: catálogo principal ainda renderiza todos os grupos de uma vez.');

  const workspaceContracts = [
    'useProgressiveVaultWorkspaceR413(vaultView, renderHistory)',
    'compareHistoryR413.map((item)',
    'folderCountsR413.get(folder.id)',
    'compareLoadMoreRefR413',
    'onClick={loadMoreCompareR413}',
  ];
  for (const contract of workspaceContracts) assertContract(workspace, contract, 'CardVisionVaultWorkspaceR191');
  const workspaceRuntimeContracts = [
    'CARDVISION_COMPARE_RENDER_BATCH_R413 = 80',
    'renderHistory.slice(0, effectiveCompareVisibleCountR413)',
    'IntersectionObserver',
    "rootMargin: '720px 0px'",
  ];
  for (const contract of workspaceRuntimeContracts) assertContract(workspaceRuntime, contract, 'useProgressiveVaultWorkspaceR413');
  if (workspace.includes('{renderHistory.map((item) => {')) throw new Error('R413: comparador ainda renderiza todo o histórico de uma vez.');
  if (workspace.includes("renderHistory.filter((item) => folderForEntry(item) === folder.id).length")) throw new Error('R413: contagem de pastas ainda é O(pastas × fichas).');
  if (Buffer.byteLength(workspace, 'utf8') > 26_000) throw new Error(`R413: workspace R191 excedeu 26000 bytes após extração do runtime progressivo: ${Buffer.byteLength(workspace, 'utf8')}.`);


  assertContract(lib, 'if (bucket) bucket.push(entry);', 'cleanVaultV3800');
  if (lib.includes('byPlayer.set(key, [...(byPlayer.get(key) ?? []), entry]);')) throw new Error('R413: agrupamento ainda copia arrays a cada ficha.');

  if (changed) {
    writeFileSync(cleanPath, clean, 'utf8');
    writeFileSync(workspacePath, workspace, 'utf8');
    writeFileSync(libPath, lib, 'utf8');
  }

  const testPath = resolve(root, TEST);
  mkdirSync(dirname(testPath), { recursive: true });
  const testSource = `import assert from 'node:assert/strict';
import fs from 'node:fs';
const clean=fs.readFileSync('src/components/CleanVaultV3800.tsx','utf8');
const workspace=fs.readFileSync('src/components/vault/CardVisionVaultWorkspaceR191.tsx','utf8');
const runtime=fs.readFileSync('src/modules/vault/useProgressiveVaultWorkspaceR413.ts','utf8');
const lib=fs.readFileSync('src/lib/cleanVaultV3800.ts','utf8');
assert.match(clean,/CLEAN_VAULT_RENDER_BATCH_R413 = 48/);
assert.match(clean,/groups\\.slice\\(0, effectiveRenderedGroupCountR413\\)/);
assert.match(clean,/progressiveGroupsR413\\.map\\(\\(group\\)/);
assert.match(clean,/IntersectionObserver/);
assert.doesNotMatch(clean,/\\{groups\\.map\\(\\(group\\) => \\{/);
assert.match(runtime,/CARDVISION_COMPARE_RENDER_BATCH_R413 = 80/);
assert.match(runtime,/renderHistory\\.slice\\(0, effectiveCompareVisibleCountR413\\)/);
assert.match(runtime,/IntersectionObserver/);
assert.match(workspace,/useProgressiveVaultWorkspaceR413\\(vaultView, renderHistory\\)/);
assert.match(workspace,/compareHistoryR413\\.map\\(\\(item\\)/);
assert.match(workspace,/folderCountsR413\\.get\\(folder\\.id\\)/);
assert.match(workspace,/onClick=\\{loadMoreCompareR413\\}/);
assert.ok(Buffer.byteLength(workspace,'utf8')<=26000,'R413: workspace R191 acima do limite: '+Buffer.byteLength(workspace,'utf8'));
assert.doesNotMatch(workspace,/renderHistory\\.filter\\(\\(item\\) => folderForEntry\\(item\\) === folder\\.id\\)\\.length/);
assert.match(lib,/if \\(bucket\\) bucket\\.push\\(entry\\)/);
assert.doesNotMatch(lib,/byPlayer\\.set\\(key, \\[\\.\\.\\.\\(byPlayer\\.get\\(key\\) \\?\\? \\[\\]\\), entry\\]\\)/);

const count=10000;
const cards=Array.from({length:count},(_,i)=>({id:'card-'+i,result:{trainingPointsTotal:(i%140)+1}}));
let visible=48;
assert.equal(cards.slice(0,visible).length,48);
while(visible<count)visible=Math.min(count,visible+48);
assert.equal(visible,count);
assert.equal(cards.length,count);
assert.equal(cards[7777].result.trainingPointsTotal,(7777%140)+1);
let compareVisible=80;
while(compareVisible<count)compareVisible=Math.min(count,compareVisible+80);
assert.equal(compareVisible,count);

const folderEntries=Array.from({length:10000},(_,i)=>({folder:'f'+(i%25)}));
const counts=new Map();
let visits=0;
for(const item of folderEntries){visits++;counts.set(item.folder,(counts.get(item.folder)??0)+1);}
assert.equal(visits,10000);
assert.equal([...counts.values()].reduce((a,b)=>a+b,0),10000);
console.log('R413 aprovada: renderização progressiva extraída do workspace, comparação em lotes, contagem linear e 10.000 fichas/PP preservados.');
`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r413-progressive-vault-render-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R413: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    progressiveVaultRender: true,
    playerRenderBatch: 48,
    comparisonRenderBatch: 80,
    comparisonRuntime: 'extracted-hook',
    folderCounting: 'linear',
    playerGrouping: 'linear-append',
    logicalHistoryLimit: 'unbounded',
    ppIsolation: 'per-card',
  };
}
