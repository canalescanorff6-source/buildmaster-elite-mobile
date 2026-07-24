'use client';

import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Gamepad2, History, Layers, Save, ShieldCheck, Target, UploadCloud, Users } from 'lucide-react';
import { buildTeamDiagnosis, type IntegratedPlayerRecord, type TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import { SquadGapPanel } from '@/components/SquadGapPanel';
import { upsertPersonalPreset } from '@/lib/appRefinement';
import { PremiumScreenHero } from '@/components/PremiumScreenPrimitives';

type TeamTab = 'escalacao' | 'elenco' | 'tatica' | 'banco';

export function IntegratedTeamLab({ team, players, teamStyle, onOpenFormationLab, onPrepareMatch, onFormationChange }: { team: TeamDiagnosis; players: IntegratedPlayerRecord[]; teamStyle: TacticalStyle; onOpenFormationLab: () => void; onPrepareMatch: () => void; onFormationChange: (formation: TacticalFormation) => void }) {
  const [tab, setTab] = useState<TeamTab>('escalacao');
  const [gameMode, setGameMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [comparisonFormation, setComparisonFormation] = useState<TacticalFormation>('4-3-3');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const comparisonTeam = useMemo(() => buildTeamDiagnosis(players, comparisonFormation, teamStyle), [players, comparisonFormation, teamStyle]);
  const formationOptions = useMemo(() => FORMATION_BLUEPRINTS.map((item) => item.id as TacticalFormation), []);

  function saveTeamPreset() {
    upsertPersonalPreset({ name: `${team.formation} • ${new Date().toLocaleDateString('pt-BR')}`, category: 'time', payload: { formation: team.formation, globalScore: team.globalScore, lineup: team.lineup.map((item) => ({ slot: item.slot.id, player: item.player?.parsed.playerName ?? null })) } });
    setSavedNotice('Preset salvo na Biblioteca pessoal.');
    window.setTimeout(() => setSavedNotice(''), 2500);
  }

  function exportTeam() {
    const payload = { kind: 'buildmaster-team', version: 1, formation: team.formation, teamStyle, exportedAt: new Date().toISOString(), lineup: team.lineup.map((item) => ({ slot: item.slot.id, label: item.slot.label, player: item.player?.parsed.playerName ?? null, score: item.score })) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildmaster-time-${team.formation}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSavedNotice('Time exportado sem alterar a escalação atual.');
  }

  async function importTeam(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo acima de 5 MB.');
      const parsed = JSON.parse(await file.text()) as { kind?: string; formation?: TacticalFormation };
      if (parsed.kind !== 'buildmaster-team' || !parsed.formation || !formationOptions.includes(parsed.formation)) throw new Error('Arquivo de time não reconhecido.');
      onFormationChange(parsed.formation);
      setSavedNotice(`Formação ${parsed.formation} importada. Os jogadores foram recalculados com o Cofre atual.`);
    } catch (cause) {
      setSavedNotice(cause instanceof Error ? cause.message : 'Não foi possível importar o time.');
    }
  }

  return <section className={`v27-module v27-team-lab refined-team-lab bm2820-screen bm2820-team-screen ${gameMode ? 'is-game-mode' : ''}`}>
    <PremiumScreenHero
      icon={Users}
      eyebrow="Centro de comando do elenco"
      title="Escalação, banco e tática com leitura imediata."
      description="Veja o time como uma unidade: cobertura dos setores, encaixe do estilo, opções de banco e ajustes de formação sem trocar a posição escolhida de nenhum jogador."
      badge={gameMode ? 'Modo jogo ativo' : team.formation}
      actions={<><button type="button" className="elite-button" onClick={onOpenFormationLab}><Layers size={17}/> Editar formação</button><button type="button" onClick={onPrepareMatch}><Target size={17}/> Preparar partida</button><button type="button" aria-pressed={gameMode} onClick={() => setGameMode((value) => !value)}><Gamepad2 size={17}/>{gameMode ? 'Sair do modo jogo' : 'Modo jogo'}</button></>}
      metrics={gameMode ? undefined : [
        { label: 'Prontidão', value: team.globalScore, hint: 'de 100', tone: team.globalScore >= 80 ? 'positive' : 'warning' },
        { label: 'Escalação', value: `${team.filledSlots}/${team.totalSlots}`, hint: 'espaços preenchidos', tone: 'accent' },
        { label: 'Melhor setor', value: team.strongestLine, hint: 'maior segurança' },
        { label: 'Prioridade', value: team.weakestLine, hint: 'corrigir primeiro', tone: 'warning' }
      ]}
    />

    <nav className="refined-team-tabs luxury-panel" aria-label="Guias do Meu Time">
      <button type="button" className={tab === 'escalacao' ? 'active' : ''} onClick={() => setTab('escalacao')}><Layers size={17}/> Escalação</button>
      <button type="button" className={tab === 'elenco' ? 'active' : ''} onClick={() => setTab('elenco')}><Users size={17}/> Elenco</button>
      <button type="button" className={tab === 'tatica' ? 'active' : ''} onClick={() => setTab('tatica')}><Target size={17}/> Tática</button>
      <button type="button" className={tab === 'banco' ? 'active' : ''} onClick={() => setTab('banco')}><ShieldCheck size={17}/> Banco</button>
      <button type="button" onClick={saveTeamPreset}><Save size={17}/> Salvar preset</button>
      <button type="button" onClick={exportTeam}><Download size={17}/> Exportar</button>
      <button type="button" onClick={() => importInputRef.current?.click()}><UploadCloud size={17}/> Importar</button>
      <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importTeam(event.target.files?.[0])}/>
    </nav>
    {savedNotice && <div className="refined-inline-success" role="status"><CheckCircle2 size={16}/>{savedNotice}</div>}


    {tab === 'escalacao' && <div className="v27-team-grid refined-lineup-grid">
      <article className="v27-lineup-board luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> {team.formation}</p><h3>Escalação recomendada</h3></div><span>{team.styleFit}% estilo</span></div><div className="v27-pitch" role="img" aria-label={`Escalação ${team.formation} com ${team.filledSlots} de ${team.totalSlots} posições preenchidas`}>{team.lineup.map((fit) => <button type="button" className={`v27-pitch-slot line-${fit.slot.line} ${fit.player ? '' : 'empty'}`} key={fit.slot.id} style={{ left: `${fit.slot.x}%`, top: `${fit.slot.y}%` }} aria-label={`${fit.slot.label}: ${fit.player?.parsed.playerName ?? 'sem encaixe'}`}><strong>{fit.slot.label}</strong><span>{fit.player?.parsed.playerName ?? 'Sem encaixe'}</span><small>{fit.score ? `${fit.score}%` : fit.slot.primaryRoles[0]}</small></button>)}</div></article>
      <aside className="v27-team-diagnosis luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Diagnóstico</p><h3>O que corrigir primeiro</h3></div><span>{team.recommendations.length}</span></div><div className="v27-recommendation-list compact">{team.recommendations.map((item) => <article key={item.id} className={`priority-${item.priority}`}>{item.priority === 'critical' ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<div><strong>{item.title}</strong><span>{item.detail}</span></div></article>)}</div>{team.missingRoles.length > 0 && <div className="refined-sector-warning"><AlertTriangle size={17}/><div><strong>Setores sem cobertura segura</strong>{team.missingRoles.slice(0, 5).map((item) => <span key={item}>{item}</span>)}</div></div>}</aside>
    </div>}

    {tab === 'elenco' && <section className="refined-team-roster luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><Users size={14}/> Elenco atual</p><h3>Titulares e cobertura</h3></div><span>{team.filledSlots + team.benchSuggestions.length} jogadores</span></div><div className="refined-roster-grid">{team.lineup.filter((item) => item.player).map((item) => <article key={item.slot.id}><strong>{item.player?.parsed.playerName}</strong><span>{item.slot.label} • {item.score}%</span><small>{item.player?.teamMap?.functionLabel || item.player?.buildName}</small></article>)}{team.benchSuggestions.map((item) => <article key={item.id} className="bench"><strong>{item.name}</strong><span>Banco • {item.score}/100</span><small>{item.role}</small></article>)}</div></section>}

    {tab === 'tatica' && <div className="refined-tactics-grid"><article className="luxury-panel"><div className="v27-panel-heading"><div><p className="kicker"><Target size={14}/> Estilo coletivo</p><h3>{team.styleFit}% de encaixe</h3></div></div><p>{team.styleNote}</p><div className="v27-pairing-list">{team.pairingNotes.map((note) => <span key={note}><CheckCircle2 size={15}/>{note}</span>)}</div></article><SquadGapPanel team={team}/>{team.repeatedFunctions.length > 0 && <article className="luxury-panel refined-function-warning"><AlertTriangle size={18}/><div><strong>Funções repetidas</strong><span>{team.repeatedFunctions.join(' • ')}</span></div></article>}<article className="luxury-panel refined-formation-compare"><div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> Comparar formações</p><h3>{team.formation} x {comparisonFormation}</h3></div></div><label>Formação alternativa<select value={comparisonFormation} onChange={(event) => setComparisonFormation(event.target.value as TacticalFormation)}>{formationOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><div><span><strong>{team.globalScore}</strong>Atual</span><b>VS</b><span><strong>{comparisonTeam.globalScore}</strong>Alternativa</span></div><small>{comparisonTeam.globalScore > team.globalScore ? `${comparisonFormation} melhora ${comparisonTeam.globalScore - team.globalScore} ponto(s) na prontidão.` : `${team.formation} continua ${team.globalScore - comparisonTeam.globalScore} ponto(s) à frente.`}</small><button type="button" className="elite-button" disabled={comparisonFormation === team.formation} onClick={() => onFormationChange(comparisonFormation)}>Aplicar formação alternativa</button></article></div>}

    {tab === 'banco' && <section className="luxury-panel v27-bench-card refined-bench-card"><div className="v27-panel-heading"><div><p className="kicker"><Users size={14}/> Banco recomendado</p><h3>Cobertura para cenários diferentes</h3></div><span>{team.benchSuggestions.length}</span></div><div className="v27-bench-list">{team.benchSuggestions.map((player, index) => <div key={player.id}><strong>{player.name}</strong><span>{player.role}</span><small>{player.reason}</small><b>#{index + 1} • {player.score}</b></div>)}{!team.benchSuggestions.length && <p>Cadastre mais jogadores para montar um banco complementar.</p>}</div><div className="refined-bench-guidance"><History size={18}/><div><strong>Histórico de mudanças</strong><span>Presets salvos mantêm um retrato da escalação sem sobrescrever o time atual.</span></div></div></section>}
  </section>;
}
