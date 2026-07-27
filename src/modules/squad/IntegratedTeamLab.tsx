'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Crown,
  Download,
  Gamepad2,
  History,
  Layers,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users
} from 'lucide-react';
import { buildTeamDiagnosis, type IntegratedPlayerRecord, type TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import { SquadGapPanel } from '@/components/SquadGapPanel';
import { upsertPersonalPreset } from '@/lib/appRefinement';

type TeamTab = 'escalacao' | 'elenco' | 'tatica' | 'banco';

type Props = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  teamStyle: TacticalStyle;
  onOpenFormationLab: () => void;
  onPrepareMatch: () => void;
  onFormationChange: (formation: TacticalFormation) => void;
};

function teamStyleLabel(style: TacticalStyle) {
  if (style === 'POSSE_DE_BOLA') return 'Posse de bola';
  if (style === 'CONTRA_ATAQUE_RAPIDO') return 'Contra-ataque rápido';
  if (style === 'CONTRA_ATAQUE') return 'Contra-ataque';
  if (style === 'POR_FORA') return 'Por fora';
  if (style === 'PASSE_LONGO') return 'Passe longo';
  return 'Automático inteligente';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('pt-BR')).join('') || '?';
}

export function IntegratedTeamLab({ team, players, teamStyle, onOpenFormationLab, onPrepareMatch, onFormationChange }: Props) {
  const [tab, setTab] = useState<TeamTab>('escalacao');
  const [gameMode, setGameMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [comparisonFormation, setComparisonFormation] = useState<TacticalFormation>('4-3-3');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const comparisonTeam = useMemo(() => buildTeamDiagnosis(players, comparisonFormation, teamStyle), [players, comparisonFormation, teamStyle]);
  const formationOptions = useMemo(() => FORMATION_BLUEPRINTS.map((item) => item.id as TacticalFormation), []);
  const playerByName = useMemo(() => new Map(players.map((player) => [player.name, player])), [players]);
  const starterIds = useMemo(() => new Set(team.lineup.map((item) => item.player?.parsed.playerName).filter(Boolean)), [team.lineup]);
  const reservePlayers = useMemo(() => players.filter((player) => !starterIds.has(player.name)).slice(0, 5), [players, starterIds]);

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

  return (
    <section className={`bm32-team-screen ${gameMode ? 'is-game-mode' : ''}`} aria-label="Meu Time">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Users size={27}/></div>
        <div><h1>Meu Time</h1><p>Monte o elenco ideal, valide funções e prepare o plano de jogo.</p></div>
        <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
      </header>

      <section className="bm32-team-metrics">
        <article><span>ESTILO DO TÉCNICO</span><strong>{teamStyleLabel(teamStyle)}</strong><small>{team.styleFit}% de compatibilidade</small></article>
        <article><span>FORMAÇÃO</span><strong>{team.formation}</strong><small>{team.strongestLine} em destaque</small></article>
        <article><span>FORÇA COLETIVA</span><strong>{team.globalScore}</strong><small>{team.globalScore >= 80 ? 'Excelente' : team.globalScore >= 65 ? 'Competitiva' : 'Em construção'}</small></article>
      </section>

      <section className="bm32-team-pitch-panel">
        <div className="bm32-team-pitch" role="img" aria-label={`Escalação ${team.formation} com ${team.filledSlots} de ${team.totalSlots} posições preenchidas`}>
          <div className="bm32-pitch-lines" aria-hidden="true"><i/><i/><i/><i/></div>
          {team.lineup.map((fit) => {
            const name = fit.player?.parsed.playerName ?? '';
            const record = playerByName.get(name);
            return (
              <button type="button" className={`bm32-squad-card line-${fit.slot.line} ${fit.player ? '' : 'empty'}`} key={fit.slot.id} style={{ left: `${fit.slot.x}%`, top: `${fit.slot.y}%` }} aria-label={`${fit.slot.label}: ${name || 'sem encaixe'}`}>
                <span className="bm32-squad-art">{record?.playerImage ? <img src={record.playerImage} alt=""/> : <b>{name ? initials(name) : '+'}</b>}<em>{record?.overall || fit.score || '--'}</em></span>
                <strong>{fit.slot.label}</strong>
                <small>{name || 'Sem encaixe'}</small>
                <i>{record?.playstyle || fit.slot.primaryRoles[0]}</i>
              </button>
            );
          })}
          <span className="bm32-reserve-count"><Users size={15}/> Reservas {reservePlayers.length}/5</span>
          <span className="bm32-team-score">Força do time <strong>{team.globalScore}</strong></span>
        </div>
      </section>

      <section className="bm32-team-bench-strip">
        <header><div><strong>Banco de reservas</strong><small>Cobertura recomendada para cenários diferentes.</small></div><button type="button" onClick={() => setTab('banco')}>Ver todos <ChevronRight size={17}/></button></header>
        <div>{reservePlayers.map((player) => <article key={player.id}><span>{player.playerImage ? <img src={player.playerImage} alt=""/> : initials(player.name)}<em>{player.overall || player.efficiency}</em></span><strong>{player.name}</strong><small>{player.targetPositionCode} • {player.playstyle}</small></article>)}{!reservePlayers.length && <p>Cadastre mais jogadores para completar o banco.</p>}</div>
      </section>

      <section className="bm32-team-insights">
        <article><header><Target size={19}/><strong>Instruções rápidas</strong></header><span>• Preserve a posição escolhida de cada jogador.</span><span>• Controle primeiro o setor mais fraco: {team.weakestLine}.</span><span>• Use o estilo do técnico com {team.styleFit}% de encaixe.</span><button type="button" onClick={() => setTab('tatica')}>Editar instruções <ChevronRight size={16}/></button></article>
        <article><header><Sparkles size={19}/><strong>Entrosamento</strong></header><div className="bm32-chemistry-ring"><strong>{team.globalScore}</strong><small>{team.globalScore >= 80 ? 'Excelente' : 'Ajustar'}</small></div><span>Jogadores: {team.filledSlots}/{team.totalSlots}</span><span>Links fortes: {Math.max(0, team.filledSlots - team.missingRoles.length)}</span><button type="button" onClick={() => setTab('escalacao')}>Detalhes <ChevronRight size={16}/></button></article>
      </section>

      <nav className="bm32-team-actions" aria-label="Ações do time">
        <button type="button" onClick={() => setTab('tatica')}><Target size={20}/><span>Táticas</span></button>
        <button type="button" onClick={onOpenFormationLab}><Layers size={20}/><span>Formação</span></button>
        <button type="button" onClick={() => setTab('elenco')}><ShieldCheck size={20}/><span>Funções</span></button>
        <button type="button" onClick={onPrepareMatch}><Gamepad2 size={20}/><span>Plano de jogo</span></button>
      </nav>

      <nav className="bm32-team-tabs" aria-label="Guias detalhados do Meu Time">
        <button type="button" className={tab === 'escalacao' ? 'active' : ''} onClick={() => setTab('escalacao')}>Escalação</button>
        <button type="button" className={tab === 'elenco' ? 'active' : ''} onClick={() => setTab('elenco')}>Elenco</button>
        <button type="button" className={tab === 'tatica' ? 'active' : ''} onClick={() => setTab('tatica')}>Tática</button>
        <button type="button" className={tab === 'banco' ? 'active' : ''} onClick={() => setTab('banco')}>Banco</button>
        <button type="button" onClick={saveTeamPreset}><Save size={16}/> Salvar</button>
        <button type="button" onClick={exportTeam}><Download size={16}/> Exportar</button>
        <button type="button" onClick={() => importInputRef.current?.click()}><UploadCloud size={16}/> Importar</button>
        <button type="button" aria-pressed={gameMode} onClick={() => setGameMode((value) => !value)}><Gamepad2 size={16}/>{gameMode ? 'Modo normal' : 'Modo jogo'}</button>
        <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importTeam(event.target.files?.[0])}/>
      </nav>
      {savedNotice && <div className="refined-inline-success" role="status"><CheckCircle2 size={16}/>{savedNotice}</div>}

      {tab === 'escalacao' && <section className="bm32-team-detail-grid"><article className="luxury-panel"><header><ShieldCheck size={19}/><div><strong>Diagnóstico da escalação</strong><small>O que corrigir primeiro</small></div></header><div className="v27-recommendation-list compact">{team.recommendations.map((item) => <article key={item.id} className={`priority-${item.priority}`}>{item.priority === 'critical' ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<div><strong>{item.title}</strong><span>{item.detail}</span></div></article>)}</div></article><SquadGapPanel team={team}/></section>}

      {tab === 'elenco' && <section className="bm32-team-roster luxury-panel"><header><Users size={19}/><div><strong>Titulares e cobertura</strong><small>{team.filledSlots + team.benchSuggestions.length} jogadores analisados</small></div></header><div>{team.lineup.filter((item) => item.player).map((item) => <article key={item.slot.id}><strong>{item.player?.parsed.playerName}</strong><span>{item.slot.label} • {item.score}%</span><small>{item.player?.teamMap?.functionLabel || item.player?.buildName}</small></article>)}{team.benchSuggestions.map((item) => <article key={item.id} className="bench"><strong>{item.name}</strong><span>Banco • {item.score}/100</span><small>{item.role}</small></article>)}</div></section>}

      {tab === 'tatica' && <section className="bm32-team-tactics"><article className="luxury-panel"><header><Target size={19}/><div><strong>Estilo coletivo</strong><small>{team.styleFit}% de encaixe</small></div></header><p>{team.styleNote}</p><div className="v27-pairing-list">{team.pairingNotes.map((note) => <span key={note}><CheckCircle2 size={15}/>{note}</span>)}</div></article><article className="luxury-panel bm32-formation-compare"><header><Layers size={19}/><div><strong>Comparar formações</strong><small>{team.formation} x {comparisonFormation}</small></div></header><label>Formação alternativa<select value={comparisonFormation} onChange={(event) => setComparisonFormation(event.target.value as TacticalFormation)}>{formationOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><div><span><strong>{team.globalScore}</strong>Atual</span><b>VS</b><span><strong>{comparisonTeam.globalScore}</strong>Alternativa</span></div><small>{comparisonTeam.globalScore > team.globalScore ? `${comparisonFormation} melhora ${comparisonTeam.globalScore - team.globalScore} ponto(s) na prontidão.` : `${team.formation} continua ${team.globalScore - comparisonTeam.globalScore} ponto(s) à frente.`}</small><button type="button" className="elite-button" disabled={comparisonFormation === team.formation} onClick={() => onFormationChange(comparisonFormation)}>Aplicar alternativa</button></article></section>}

      {tab === 'banco' && <section className="luxury-panel bm32-bench-detail"><header><Users size={19}/><div><strong>Banco recomendado</strong><small>Cobertura para cenários diferentes</small></div></header><div>{team.benchSuggestions.map((player, index) => <article key={player.id}><span>#{index + 1}</span><div><strong>{player.name}</strong><small>{player.role} • {player.reason}</small></div><b>{player.score}</b></article>)}{!team.benchSuggestions.length && <p>Cadastre mais jogadores para montar um banco complementar.</p>}</div><footer><History size={18}/><span>Presets salvos mantêm um retrato da escalação sem sobrescrever o time atual.</span></footer></section>}
    </section>
  );
}
