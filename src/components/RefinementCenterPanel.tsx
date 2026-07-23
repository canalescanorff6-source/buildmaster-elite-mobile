'use client';

import { useMemo, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, Clipboard, Database, Download, Flag, Gauge, HardDrive, Layers, PlayCircle, Save, Search, ShieldCheck, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import {
  appendDecisionHistory,
  getRefinementFlags,
  deletePersonalPreset,
  isDemoModeEnabled,
  readDecisionHistory,
  readPerformanceSamples,
  readPersonalPresets,
  setDemoMode,
  setRefinementFlag,
  upsertPersonalPreset,
  type PersonalPreset,
  type RefinementFeatureFlag
} from '@/lib/appRefinement';
import { estimateLocalStorageUsage, inspectLegacyProject, monthlyEvolutionReportText, type LegacyImportInspection } from '@/lib/refinementDataTools';

export function RefinementCenterPanel({ players, appVersion, healthScore, onOpenPlayer }: { players: IntegratedPlayerRecord[]; appVersion: string; healthScore: number; onOpenPlayer: (id: string) => void }) {
  const [tab, setTab] = useState<'health' | 'compare' | 'presets' | 'data' | 'features' | 'help'>('health');
  const [firstId, setFirstId] = useState(players[0]?.id ?? '');
  const [secondId, setSecondId] = useState(players[1]?.id ?? '');
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<PersonalPreset[]>(() => readPersonalPresets());
  const [demoMode, setDemoModeState] = useState(() => isDemoModeEnabled());
  const [featureFlags, setFeatureFlags] = useState(() => getRefinementFlags());
  const [legacyInspection, setLegacyInspection] = useState<LegacyImportInspection | null>(null);
  const storage = useMemo(() => estimateLocalStorageUsage(), []);
  const performance = useMemo(() => readPerformanceSamples().slice(0, 8), []);
  const decisions = useMemo(() => readDecisionHistory().slice(0, 8), []);
  const first = players.find((item) => item.id === firstId);
  const second = players.find((item) => item.id === secondId);

  const comparison = useMemo(() => {
    if (!first || !second || first.id === second.id) return null;
    const metrics = [
      ['Eficiência', first.efficiency, second.efficiency],
      ['Confiança', first.confidence, second.confidence],
      ['Partidas', Math.min(100, first.matchCount * 10), Math.min(100, second.matchCount * 10)],
      ['Encaixe', first.bestFormations[0]?.score ?? 0, second.bestFormations[0]?.score ?? 0]
    ] as const;
    const firstScore = Math.round(metrics.reduce((sum, item) => sum + item[1], 0) / metrics.length);
    const secondScore = Math.round(metrics.reduce((sum, item) => sum + item[2], 0) / metrics.length);
    return { metrics, firstScore, secondScore, winner: firstScore >= secondScore ? first : second };
  }, [first, second]);

  function savePreset() {
    const name = presetName.trim();
    if (!name) return;
    const preset = upsertPersonalPreset({ name, category: 'ficha', payload: { firstId, secondId } });
    setPresets((current) => [preset, ...current.filter((item) => item.id !== preset.id)]);
    setPresetName('');
  }

  function removePreset(id: string) {
    deletePersonalPreset(id);
    setPresets((current) => current.filter((item) => item.id !== id));
  }

  function downloadMonthlyReport() {
    const text = monthlyEvolutionReportText(players, performance);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildmaster-evolucao-mensal-${new Date().toISOString().slice(0, 7)}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function inspectLegacyFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 40 * 1024 * 1024) throw new Error('Arquivo maior que 40 MB.');
      const parsed = JSON.parse(await file.text()) as unknown;
      setLegacyInspection(inspectLegacyProject(parsed));
    } catch (cause) {
      setLegacyInspection({ valid: false, kind: 'unknown', version: null, itemCount: 0, warnings: [cause instanceof Error ? cause.message : 'Arquivo inválido.'] });
    }
  }

  function toggleFeature(flag: RefinementFeatureFlag) {
    const enabled = !featureFlags[flag];
    setRefinementFlag(flag, enabled);
    setFeatureFlags((current) => ({ ...current, [flag]: enabled }));
  }

  return <section className="refinement-center luxury-panel">
    <header><div><p className="kicker"><Sparkles size={15}/> Central de refinamento</p><h3>Saúde, comparação, presets e ajuda em um único lugar</h3><span>Ferramentas locais: nenhum dado pessoal é enviado por este painel.</span></div><span className={healthScore >= 85 ? 'healthy' : 'attention'}>{healthScore}/100</span></header>
    <nav aria-label="Guias da Central de refinamento">
      <button type="button" className={tab === 'health' ? 'active' : ''} onClick={() => setTab('health')}><Activity size={17}/> Saúde</button>
      <button type="button" className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}><Layers size={17}/> Comparar</button>
      <button type="button" className={tab === 'presets' ? 'active' : ''} onClick={() => setTab('presets')}><Save size={17}/> Presets</button>
      <button type="button" className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}><HardDrive size={17}/> Dados</button>
      <button type="button" className={tab === 'features' ? 'active' : ''} onClick={() => setTab('features')}><Flag size={17}/> Recursos</button>
      <button type="button" className={tab === 'help' ? 'active' : ''} onClick={() => setTab('help')}><BookOpen size={17}/> Ajuda</button>
    </nav>

    {tab === 'health' && <div className="refinement-health-grid">
      <article><ShieldCheck size={20}/><div><strong>Aplicativo</strong><span>Versão {appVersion}</span><small>{healthScore >= 85 ? 'Estrutura local saudável' : 'Revise alertas e backup'}</small></div></article>
      <article><Database size={20}/><div><strong>Dados</strong><span>{players.length} jogador(es) integrados</span><small>Separados por conta</small></div></article>
      <article><Gauge size={20}/><div><strong>Desempenho recente</strong><span>{performance[0] ? `${performance[0].name}: ${performance[0].milliseconds} ms` : 'Sem medição registrada'}</span><small>Somente métricas locais</small></div></article>
      <article><PlayCircle size={20}/><div><strong>Modo demonstração</strong><span>{demoMode ? 'Ativo — dados fictícios isolados' : 'Desativado'}</span><button type="button" onClick={() => setDemoModeState(setDemoMode(!demoMode))}>{demoMode ? 'Desativar' : 'Ativar'}</button></div></article>
      <div className="refinement-decision-log"><strong>Decisões recentes</strong>{decisions.length ? decisions.map((item) => <span key={item.id}><CheckCircle2 size={14}/>{item.decision}<small>{item.reason}</small></span>) : <span>Nenhuma decisão registrada ainda.</span>}</div>
    </div>}

    {tab === 'compare' && <div className="refinement-compare">
      <div className="refinement-compare-selectors"><label>Primeira carta<select value={firstId} onChange={(event) => setFirstId(event.target.value)}>{players.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.targetPosition}</option>)}</select></label><label>Segunda carta<select value={secondId} onChange={(event) => setSecondId(event.target.value)}>{players.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.targetPosition}</option>)}</select></label></div>
      {comparison ? <><div className="refinement-comparison-score"><article><strong>{first?.name}</strong><span>{comparison.firstScore}/100</span><button type="button" onClick={() => first && onOpenPlayer(first.id)}>Abrir ficha</button></article><b>VS</b><article><strong>{second?.name}</strong><span>{comparison.secondScore}/100</span><button type="button" onClick={() => second && onOpenPlayer(second.id)}>Abrir ficha</button></article></div><div className="refinement-metric-list">{comparison.metrics.map(([label, a, b]) => <div key={label}><strong>{label}</strong><span>{a}</span><i><b style={{ width: `${Math.max(3, a)}%` }}/></i><i><b style={{ width: `${Math.max(3, b)}%` }}/></i><span>{b}</span></div>)}</div><button type="button" className="elite-button" onClick={() => appendDecisionHistory({ subject: `${first?.name} x ${second?.name}`, decision: `Escolha atual: ${comparison.winner.name}`, reason: `Índice comparativo ${Math.max(comparison.firstScore, comparison.secondScore)}/100.` })}><Clipboard size={16}/> Registrar decisão</button></> : <div className="refinement-empty"><Search size={24}/><strong>Escolha duas cartas diferentes</strong><span>O comparador não altera nenhuma ficha.</span></div>}
    </div>}

    {tab === 'presets' && <div className="refinement-presets">
      <div className="refinement-preset-create"><label>Nome do preset<input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Ex.: comparação dos meus volantes"/></label><button type="button" className="elite-button" onClick={savePreset} disabled={!presetName.trim()}><Save size={16}/> Salvar</button></div>
      <div className="refinement-preset-list">{presets.map((preset) => <article key={preset.id}><div><strong>{preset.name}</strong><span>{preset.category} • {new Date(preset.updatedAt).toLocaleDateString('pt-BR')}</span></div><button type="button" aria-label={`Excluir preset ${preset.name}`} onClick={() => removePreset(preset.id)}><Trash2 size={16}/></button></article>)}{!presets.length && <div className="refinement-empty"><Save size={24}/><strong>Nenhum preset salvo</strong><span>Salve comparações e configurações que você usa com frequência.</span></div>}</div>
    </div>}

    {tab === 'data' && <div className="refinement-data-grid">
      <article><HardDrive size={21}/><div><strong>Armazenamento local</strong><span>{storage.formatted} em {storage.entries} registro(s)</span><small>Estimativa sem enviar dados para fora do aparelho.</small></div></article>
      <article><Download size={21}/><div><strong>Relatório mensal</strong><span>Evolução, validações e desempenho local.</span><button type="button" onClick={downloadMonthlyReport}>Exportar relatório</button></div></article>
      <article className="refinement-legacy-import"><UploadCloud size={21}/><div><strong>Importador inteligente de projetos antigos</strong><span>O arquivo é apenas inspecionado; nada é substituído automaticamente.</span><label className="refinement-file-button"><input type="file" accept=".json,.bmbak,application/json" onChange={(event) => void inspectLegacyFile(event.target.files?.[0])}/>Selecionar arquivo</label></div></article>
      {legacyInspection && <article className={legacyInspection.valid ? 'inspection-ok' : 'inspection-error'}><CheckCircle2 size={21}/><div><strong>{legacyInspection.valid ? 'Arquivo reconhecido' : 'Arquivo não reconhecido'}</strong><span>Tipo: {legacyInspection.kind} • versão: {legacyInspection.version || 'não informada'} • itens: {legacyInspection.itemCount}</span>{legacyInspection.warnings.map((warning) => <small key={warning}>{warning}</small>)}</div></article>}
    </div>}

    {tab === 'features' && <div className="refinement-feature-grid">
      {(Object.entries(featureFlags) as Array<[RefinementFeatureFlag, boolean]>).map(([flag, enabled]) => <article key={flag}><div><strong>{flag === 'guidedReader' ? 'Leitor guiado' : flag === 'unifiedPlayers' ? 'Central unificada de jogadores' : flag === 'smartHome' ? 'Home inteligente' : flag === 'accessibleDialogs' ? 'Diálogos acessíveis' : flag === 'performanceMonitor' ? 'Monitor de desempenho' : flag === 'demoMode' ? 'Modo demonstração' : flag === 'universalCompare' ? 'Comparador universal' : 'Ajuda contextual'}</strong><span>{enabled ? 'Ativo' : 'Desativado'}</span></div><button type="button" role="switch" aria-checked={enabled} className={enabled ? 'is-on' : ''} onClick={() => toggleFeature(flag)}><i/></button></article>)}
      <p>As mudanças grandes podem ser desativadas individualmente sem apagar dados. O modo demonstração permanece isolado dos dados reais.</p>
    </div>}

    {tab === 'help' && <div className="refinement-help-grid">
      <article><strong>Começar uma ficha</strong><span>Jogadores › Ler print. Confira os campos duvidosos antes de gerar.</span></article>
      <article><strong>Editar manualmente</strong><span>Jogadores › Manual Pro. O orçamento de pontos permanece visível.</span></article>
      <article><strong>Organizar jogadores</strong><span>Jogadores › Cofre. Use busca, filtros, favoritos e backup.</span></article>
      <article><strong>Montar o time</strong><span>Meu Time reúne elenco, escalação, funções, banco e planos.</span></article>
      <article><strong>Treinar e validar</strong><span>Partidas separa planejamento, execução e análise pós-jogo.</span></article>
      <article><strong>Resolver problemas</strong><span>Ajustes › Segurança permite copiar um diagnóstico sem senhas ou tokens.</span></article>
    </div>}
  </section>;
}
