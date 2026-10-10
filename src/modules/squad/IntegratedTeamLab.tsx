'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Crown,
  Download,
  Gamepad2,
  History,
  Layers,
  Link2,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users
} from 'lucide-react';
import { buildTeamDiagnosis, type IntegratedPlayerRecord, type TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import { evaluateManagerLinksR560, type LinkStatusR560, type ManagerLinkEvaluationR560, type SquadMemberR560 } from '@/lib/managerLinkEngineR560';
import type { ManagerRecord } from '@/lib/managers';
import { buildTacticalSnapshotR562 } from '@/lib/tacticalSnapshotR562';
import type { MatchValidationRecord } from '@/lib/appStartupContractsR200';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import { SquadGapPanel } from '@/components/SquadGapPanel';
import { upsertPersonalPreset } from '@/lib/appRefinement';
import { buildTacticalTwinR480 } from '@/modules/tactical-twin/tacticalTwinEngineR480';
import { buildSquadBrainR481 } from '@/modules/squad-brain/squadBrainEngineR481';
import { buildChemistryGraphR484 } from '@/modules/chemistry/chemistryGraphEngineR484';
import { buildAutonomousTacticalDirectorR500 } from '@/modules/tactical-director/tacticalDirectorEngineR500';
import { TacticalDirectorPanelR500 } from '@/modules/tactical-director/TacticalDirectorPanelR500';
import {
  RotationExplainabilityR489,
  StarterExplainabilityR489,
  TacticalExplainabilityR489
} from '@/modules/explainable-ai/TeamExplainabilityR489';

type TeamTab = 'escalacao' | 'elenco' | 'tatica' | 'banco';

type Props = {
  team: TeamDiagnosis;
  players: IntegratedPlayerRecord[];
  records: MatchValidationRecord[];
  teamStyle: TacticalStyle;
  /** Técnico selecionado no estado principal. Opcional para preservar chamadas antigas. */
  selectedManager?: ManagerRecord | null;
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

function chemistryLabel(score: number) {
  if (score >= 84) return 'Forte';
  if (score >= 72) return 'Boa';
  if (score >= 58) return 'Neutra';
  return 'Ajustar';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('pt-BR')).join('') || '?';
}


/**
 * R561: a escalação do diagnóstico é uma sugestão automática. Não sinalizar um
 * vínculo como ATIVO antes da confirmação explícita dos 11 jogadores, posições
 * escaladas e estilos. Nenhum atributo ou carta é modificado por esta UI.
 */
const R561_UNCONFIRMED_STYLES = new Set([
  '', 'nao confirmado', 'nao identificado', 'nao informado', 'desconhecido',
  'indefinido', 'pendente', 'sem estilo', 'n a', 'unknown', 'null', '-'
]);

function normalizedLabelR561(value: string | null | undefined) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isConfirmedStyleR561(value: string | null | undefined) {
  return !R561_UNCONFIRMED_STYLES.has(normalizedLabelR561(value));
}

function squadFromDiagnosisR561(team: TeamDiagnosis): SquadMemberR560[] {
  return team.lineup.map((fit) => ({
    playerName: fit.player?.parsed.playerName?.trim() ?? '',
    // O vínculo exige a posição no campo, e não a posição natural da carta.
    position: fit.slot.position,
    playstyle: fit.player?.parsed.offensivePlaystyle || fit.player?.parsed.playstyle || null
  }));
}

function squadIsCompleteR561(squad: readonly SquadMemberR560[], team: TeamDiagnosis) {
  return squad.length === 11 && team.totalSlots === 11 && team.filledSlots === 11 &&
    squad.every((member) => Boolean(member.playerName.trim()) && isConfirmedStyleR561(member.playstyle));
}

function squadConfirmationKeyR561(team: TeamDiagnosis, managerId: string | null, squad: readonly SquadMemberR560[]) {
  // A chave troca caso mude o técnico, formação, carta, posição ou estilo;
  // assim a confirmação anterior perde validade sem efeitos ou timers.
  return JSON.stringify({
    managerId,
    formation: team.formation,
    squad: team.lineup.map((fit, index) => ({
      slotId: fit.slot.id,
      position: squad[index]?.position ?? fit.slot.position,
      cardFingerprint: fit.player ? cardIdentityFingerprintR126(fit.player.parsed) : null,
      playerName: squad[index]?.playerName ?? '',
      playstyle: squad[index]?.playstyle ?? null
    }))
  });
}

const R561_LINK_PALETTE: Record<LinkStatusR560, { color: string; background: string; border: string }> = {
  ATIVO: { color: '#6ee7b7', background: 'rgba(16,185,129,.09)', border: 'rgba(16,185,129,.42)' },
  INATIVO: { color: '#fca5a5', background: 'rgba(239,68,68,.09)', border: 'rgba(239,68,68,.42)' },
  PENDENTE: { color: '#fcd34d', background: 'rgba(245,158,11,.09)', border: 'rgba(245,158,11,.40)' }
};

function linkRequirementLabelR561(position: string, playstyle: string) {
  const names: Record<string, string> = { DMF: 'VOL', AMF: 'MAT', CF: 'CA' };
  return `${playstyle} • ${names[position] ?? position}`;
}

type ManagerLinksPanelPropsR561 = {
  manager: ManagerRecord | null;
  links: readonly ManagerLinkEvaluationR560[];
  squadComplete: boolean;
  lineupConfirmed: boolean;
  onConfirmationChange: (confirmed: boolean) => void;
  filled: number;
};

function ManagerLinksPanelR561({ manager, links, squadComplete, lineupConfirmed, onConfirmationChange, filled }: ManagerLinksPanelPropsR561) {
  return (
    <section className="luxury-panel bm-r561-manager-links" aria-label="Vínculos táticos do técnico" style={{ marginTop: 14, marginBottom: 14, padding: 16, minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap', marginBottom: 10 }}>
        <Link2 size={21} aria-hidden="true" />
        <div style={{ flex: '1 1 190px', minWidth: 0 }}>
          <strong style={{ display: 'block' }}>Vínculos táticos do técnico</strong>
          <small style={{ display: 'block', opacity: .82 }}>{manager?.name ?? 'Nenhum técnico específico selecionado'}</small>
        </div>
        {links.length > 0 && <small>{links.filter((link) => link.status === 'ATIVO').length}/{links.length} vínculos ativos</small>}
      </header>

      {!links.length ? (
        <p style={{ margin: 0, opacity: .85 }}>
          {manager ? 'Não há vínculos cadastrados para esta edição do técnico. Nenhum bônus de vínculo será presumido.' : 'Selecione um técnico em Opções do time para verificar os vínculos da sua escalação.'}
        </p>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: squadComplete ? 'pointer' : 'not-allowed' }}>
            <input
              type="checkbox"
              checked={lineupConfirmed}
              disabled={!squadComplete}
              onChange={(event) => onConfirmationChange(event.target.checked)}
              aria-label="Confirmar escalação, posições e estilos dos onze titulares"
              style={{ marginTop: 4, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1.5 }}>
              Confirmo que os 11 titulares, suas posições no campo e seus estilos estão corretos no jogo.
              {!squadComplete && <small style={{ display: 'block', opacity: .82 }}>PENDENTE: {filled}/11 posições preenchidas; confira também os nomes e estilos das cartas.</small>}
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            {links.map((link) => {
              const palette = R561_LINK_PALETTE[link.status];
              const explanation = link.status === 'ATIVO'
                ? 'Requisitos atendidos na escalação confirmada. Vínculo habilitado; sem alterar os atributos da carta.'
                : link.status === 'INATIVO'
                  ? `Requisitos não atendidos: ${link.missing.length ? link.missing.join(' + ') : 'combinação de jogadores inválida'}.`
                  : !squadComplete
                    ? 'Dados insuficientes para validar os requisitos do vínculo.'
                    : 'Escalação automática ainda não confirmada. Confira e marque a confirmação acima.';
              return (
                <article key={link.id} aria-label={`${link.name}: ${link.status}`} style={{ minWidth: 0, border: `1px solid ${palette.border}`, background: palette.background, borderRadius: 12, padding: 13 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <strong style={{ minWidth: 0 }}>{link.name}</strong>
                    <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: palette.color, fontSize: 12, fontWeight: 800, letterSpacing: '.03em' }}>
                      {link.status === 'ATIVO' ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
                      {link.status}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 3, fontSize: 12, opacity: .9, marginBottom: 8 }}>
                    <span>Peça-chave: {linkRequirementLabelR561(link.centerpiece.position, link.centerpiece.playstyle)}{link.centerpiecePlayer ? ` — ${link.centerpiecePlayer}` : ''}</span>
                    <span>Complemento: {linkRequirementLabelR561(link.keyman.position, link.keyman.playstyle)}{link.keymanPlayer ? ` — ${link.keymanPlayer}` : ''}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>{explanation}</p>
                </article>
              );
            })}
          </div>
          <small style={{ display: 'block', marginTop: 10, opacity: .76 }}>
            ATIVO indica requisitos táticos confirmados no BuildMaster. A ativação efetiva no jogo não é verificada pelo aplicativo; bônus numéricos não são somados nesta tela.
          </small>
        </>
      )}
    </section>
  );
}

export function IntegratedTeamLab({ team, players, records, teamStyle, selectedManager = null, onOpenFormationLab, onPrepareMatch, onFormationChange }: Props) {
  const [tab, setTab] = useState<TeamTab>('escalacao');
  const [gameMode, setGameMode] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const [clipboardFallbackR562, setClipboardFallbackR562] = useState<string | null>(null);
  const [copyingSnapshotR562, setCopyingSnapshotR562] = useState(false);
  const [comparisonFormation, setComparisonFormation] = useState<TacticalFormation>('4-3-3');
  const [confirmedLineupKeyR561, setConfirmedLineupKeyR561] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const comparisonTeam = useMemo(() => buildTeamDiagnosis(players, comparisonFormation, teamStyle), [players, comparisonFormation, teamStyle]);
  const formationOptions = useMemo(() => FORMATION_BLUEPRINTS.map((item) => item.id as TacticalFormation), []);
  const playerByName = useMemo(() => new Map(players.map((player) => [player.name, player])), [players]);
  const squadR561 = useMemo(() => squadFromDiagnosisR561(team), [team]);
  const squadCompleteR561 = useMemo(() => squadIsCompleteR561(squadR561, team), [squadR561, team]);
  const confirmationKeyR561 = useMemo(() => squadConfirmationKeyR561(team, selectedManager?.id ?? null, squadR561), [team, selectedManager?.id, squadR561]);
  const lineupConfirmedR561 = squadCompleteR561 && confirmedLineupKeyR561 === confirmationKeyR561;
  const managerLinksR561 = useMemo(() => evaluateManagerLinksR560(selectedManager, squadR561, { lineupConfirmed: lineupConfirmedR561 }), [selectedManager, squadR561, lineupConfirmedR561]);
  const starterIds = useMemo(() => new Set(team.lineup.map((item) => item.player?.parsed.playerName).filter(Boolean)), [team.lineup]);
  const reservePlayers = useMemo(() => players.filter((player) => !starterIds.has(player.name)).slice(0, 5), [players, starterIds]);
  const tacticalTwinR480 = useMemo(() => buildTacticalTwinR480({ team, players, records, teamStyle }), [team, players, records, teamStyle]);
  const squadBrainR481 = useMemo(() => buildSquadBrainR481({ team, players, records, twin: tacticalTwinR480 }), [team, players, records, tacticalTwinR480]);
  const chemistryR484 = useMemo(() => buildChemistryGraphR484({ team, players, records, teamStyle, squadBrain: squadBrainR481 }), [team, players, records, teamStyle, squadBrainR481]);
  const tacticalDirectorR500 = useMemo(() => buildAutonomousTacticalDirectorR500({
    officialDecisionFingerprint: `team:${team.formation}:${teamStyle}`,
    formation: team.formation,
    teamStyle,
    lineupContext: team.lineup.map((fit) => ({
      slotId: fit.slot.id,
      cardFingerprint: fit.player
        ? playerByName.get(fit.player.parsed.playerName)?.fingerprint ?? fit.player.parsed.internalId ?? null
        : null
    })),
    tacticalTwin: tacticalTwinR480,
    squadBrain: squadBrainR481,
    matchVision: null,
    buildSimulator: null,
    chemistry: chemistryR484,
    explanations: [],
    confirmedMatchRecords: records,
    proMetaContext: null,
    phase: 'PRE_MATCH',
    currentScenario: 'base',
    previousPlan: null
  }), [team, teamStyle, playerByName, tacticalTwinR480, squadBrainR481, chemistryR484, records]);

  function selectTab(next: TeamTab) {
    setTab(next);
    window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

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

  async function copyTacticalSnapshotR562() {
    if (copyingSnapshotR562) return;
    const snapshot = buildTacticalSnapshotR562({
      team, teamStyle, selectedManager, squad: squadR561,
      lineupConfirmed: lineupConfirmedR561, players
    });
    setCopyingSnapshotR562(true);
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard API indisponível neste navegador.');
      }
      await navigator.clipboard.writeText(snapshot);
      setClipboardFallbackR562(null);
      setSavedNotice('Snapshot tático copiado. Cole o texto no ChatGPT, sem API paga.');
    } catch {
      // Alguns WebViews recusam writeText. Nunca afirmar sucesso nesses casos.
      setClipboardFallbackR562(snapshot);
      setSavedNotice('');
    } finally {
      setCopyingSnapshotR562(false);
    }
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
        <div><h1>Meu Time</h1><p>Escalação, funções e plano de jogo.</p></div>
        <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
      </header>

      <section className="bm32-team-metrics">
        <article><span>ESTILO DO TÉCNICO</span><strong>{teamStyleLabel(teamStyle)}</strong><small>{team.styleFit}% de compatibilidade</small></article>
        <article><span>FORMAÇÃO</span><strong>{team.formation}</strong><small>{team.strongestLine} em destaque</small></article>
        <article><span>FORÇA COLETIVA</span><strong>{team.globalScore}</strong><small>{team.globalScore >= 80 ? 'Excelente' : team.globalScore >= 65 ? 'Competitiva' : 'Em construção'}</small></article>
      </section>

      <ManagerLinksPanelR561
        manager={selectedManager}
        links={managerLinksR561}
        squadComplete={squadCompleteR561}
        lineupConfirmed={lineupConfirmedR561}
        onConfirmationChange={(confirmed) => setConfirmedLineupKeyR561(confirmed ? confirmationKeyR561 : null)}
        filled={team.filledSlots}
      />

      <TacticalDirectorPanelR500 plan={tacticalDirectorR500} compact />

      <section className="bm32-team-pitch-panel">
        <div className="bm32-team-pitch" role="img" aria-label={`Escalação ${team.formation} com ${team.filledSlots} de ${team.totalSlots} posições preenchidas`}>
          <div className="bm32-pitch-lines" aria-hidden="true"><i/><i/><i/><i/></div>
          {team.lineup.map((fit) => {
            const name = fit.player?.parsed.playerName ?? '';
            const record = playerByName.get(name);
            return (
              <div className={`bm32-squad-card line-${fit.slot.line} ${fit.player ? '' : 'empty'}`} key={fit.slot.id} style={{ left: `${fit.slot.x}%`, top: `${fit.slot.y}%` }} aria-label={`${fit.slot.label}: ${name || 'sem encaixe'}`}>
                <span className="bm32-squad-art">{record?.playerImage ? <img src={record.playerImage} alt=""/> : <b>{name ? initials(name) : '+'}</b>}<em>{record?.overall || fit.score || '--'}</em></span>
                <strong>{fit.slot.label}</strong>
                <small>{name || 'Sem encaixe'}</small>
                <i>{record?.playstyle || fit.slot.primaryRoles[0]}</i>
              </div>
            );
          })}
          <span className="bm32-reserve-count"><Users size={15}/> Reservas {reservePlayers.length}/5</span>
          <span className="bm32-team-score">Força do time <strong>{team.globalScore}</strong></span>
        </div>
      </section>

      <section className="bm32-team-bench-strip">
        <header><div><strong>Banco de reservas</strong><small>Cobertura recomendada para cenários diferentes.</small></div><button type="button" onClick={() => selectTab('banco')}>Ver todos <ChevronRight size={17}/></button></header>
        <div>{reservePlayers.map((player) => <article key={player.id}><span>{player.playerImage ? <img src={player.playerImage} alt=""/> : initials(player.name)}<em>{player.overall || player.efficiency}</em></span><strong>{player.name}</strong><small>{player.targetPositionCode} • {player.playstyle}</small></article>)}{!reservePlayers.length && <p>Cadastre mais jogadores para completar o banco.</p>}</div>
      </section>

      <section className="bm32-team-insights">
        <article><header><Target size={19}/><strong>Instruções rápidas</strong></header><span>• Preserve a posição escolhida de cada jogador.</span><span>• Controle primeiro o setor mais fraco: {team.weakestLine}.</span><span>• Use o estilo do técnico com {team.styleFit}% de encaixe.</span><button type="button" onClick={() => selectTab('tatica')}>Editar instruções <ChevronRight size={16}/></button></article>
        <article><header><Sparkles size={19}/><strong>Entrosamento</strong></header><div className="bm32-chemistry-ring"><strong>{chemistryR484.score}</strong><small>{chemistryLabel(chemistryR484.score)}</small></div><span>Confiança: {chemistryR484.confidence}% • {chemistryR484.evidence.links} links</span><span>Links fortes: {chemistryR484.counts.strong + chemistryR484.counts.good}</span><button type="button" onClick={() => selectTab('escalacao')}>Detalhes <ChevronRight size={16}/></button></article>
      </section>

      <nav className="bm32-team-actions" aria-label="Ações do time">
        <button type="button" onClick={() => selectTab('tatica')}><Target size={20}/><span>Táticas</span></button>
        <button type="button" onClick={onOpenFormationLab}><Layers size={20}/><span>Formação</span></button>
        <button type="button" onClick={() => selectTab('elenco')}><ShieldCheck size={20}/><span>Funções</span></button>
        <button type="button" onClick={onPrepareMatch}><Gamepad2 size={20}/><span>Plano de jogo</span></button>
      </nav>

      <nav className="bm32-team-tabs" role="tablist" aria-label="Guias detalhados do Meu Time">
        <button type="button" role="tab" aria-selected={tab === 'escalacao'} className={tab === 'escalacao' ? 'active' : ''} onClick={() => selectTab('escalacao')}>Escalação</button>
        <button type="button" role="tab" aria-selected={tab === 'elenco'} className={tab === 'elenco' ? 'active' : ''} onClick={() => selectTab('elenco')}>Elenco</button>
        <button type="button" role="tab" aria-selected={tab === 'tatica'} className={tab === 'tatica' ? 'active' : ''} onClick={() => selectTab('tatica')}>Tática</button>
        <button type="button" role="tab" aria-selected={tab === 'banco'} className={tab === 'banco' ? 'active' : ''} onClick={() => selectTab('banco')}>Banco</button>
        <button type="button" onClick={saveTeamPreset}><Save size={16}/> Salvar</button>
        <button type="button" disabled={copyingSnapshotR562} onClick={() => void copyTacticalSnapshotR562()} aria-label="Copiar Snapshot Tático para o ChatGPT"><ClipboardCopy size={16}/>{copyingSnapshotR562 ? 'Copiando...' : 'Copiar Snapshot'}</button>
        <button type="button" onClick={exportTeam}><Download size={16}/> Exportar</button>
        <button type="button" onClick={() => importInputRef.current?.click()}><UploadCloud size={16}/> Importar</button>
        <button type="button" aria-pressed={gameMode} onClick={() => setGameMode((value) => !value)}><Gamepad2 size={16}/>{gameMode ? 'Modo normal' : 'Modo jogo'}</button>
        <input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importTeam(event.target.files?.[0])}/>
      </nav>
      {savedNotice && <div className="refined-inline-success" role="status"><CheckCircle2 size={16}/>{savedNotice}</div>}
      {clipboardFallbackR562 !== null && (
        <section className="luxury-panel" role="alert" aria-label="Cópia manual do Snapshot Tático" style={{ padding: 14, marginBlock: 12, minWidth: 0 }}>
          <strong><AlertTriangle size={16} aria-hidden="true" /> Snapshot tático — cópia manual necessária</strong>
          <p style={{ fontSize: 13 }}>Seu navegador não autorizou a cópia automática. Toque no campo, selecione todo o texto e copie para o ChatGPT.</p>
          <textarea aria-label="Snapshot tático em texto para copiar" readOnly value={clipboardFallbackR562}
            onFocus={(event) => event.currentTarget.select()}
            style={{ display: 'block', width: '100%', minHeight: 170, resize: 'vertical', boxSizing: 'border-box' }} />
          <button type="button" onClick={() => setClipboardFallbackR562(null)}>Fechar texto</button>
        </section>
      )}

      <div ref={detailRef} className="bm34-tab-panel" role="tabpanel" aria-live="polite">
      {tab === 'escalacao' && <section className="bm32-team-detail-grid">
        <article className="luxury-panel">
          <header><ShieldCheck size={19}/><div><strong>Diagnóstico da escalação</strong><small>O que corrigir primeiro</small></div></header>
          <div className="v27-recommendation-list compact">{team.recommendations.map((item) => <article key={item.id} className={`priority-${item.priority}`}>{item.priority === 'critical' ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<div><strong>{item.title}</strong><span>{item.detail}</span></div></article>)}</div>
        </article>
        <SquadGapPanel team={team}/>
        <article className="luxury-panel" aria-label="Chemistry Graph R484">
          <header><Sparkles size={19}/><div><strong>Chemistry Graph</strong><small>R484 • somente leitura • confiança {chemistryR484.confidence}%</small></div></header>
          <div className="v27-pairing-list">
            <span><CheckCircle2 size={15}/>Química estrutural: {chemistryR484.score}/100 • {chemistryR484.counts.strong} forte(s) • {chemistryR484.counts.good} boa(s) • {chemistryR484.counts.redundant} redundante(s) • {chemistryR484.counts.poor} ruim(ns).</span>
            {chemistryR484.mostConnected && <span><CheckCircle2 size={15}/>Mais conectado: {chemistryR484.mostConnected.playerName} • {chemistryR484.mostConnected.links} ligação(ões) • média {chemistryR484.mostConnected.averageScore}/100.</span>}
            {chemistryR484.mostIsolated && <span><AlertTriangle size={15}/>Mais isolado: {chemistryR484.mostIsolated.playerName} • {chemistryR484.mostIsolated.links} ligação(ões).</span>}
          </div>
          <div className="v27-pairing-list">
            {chemistryR484.sectors.map((sector) => <span key={sector.id}><CheckCircle2 size={15}/>{sector.label}: {sector.score == null ? 'sem links suficientes' : `${sector.score}/100`} • {sector.links} ligação(ões){sector.confidence == null ? '' : ` • confiança ${sector.confidence}%`}.</span>)}
          </div>
          {(chemistryR484.bestLink || chemistryR484.weakestLink) && <div className="v27-pairing-list">
            {chemistryR484.bestLink && <span><CheckCircle2 size={15}/>Melhor ligação: {chemistryR484.bestLink.leftName} ↔ {chemistryR484.bestLink.rightName} • {chemistryR484.bestLink.score}/100 • {chemistryR484.bestLink.label}.</span>}
            {chemistryR484.weakestLink && <span><AlertTriangle size={15}/>Ligação mais frágil: {chemistryR484.weakestLink.leftName} ↔ {chemistryR484.weakestLink.rightName} • {chemistryR484.weakestLink.score}/100 • {chemistryR484.weakestLink.label}.</span>}
          </div>}
          {chemistryR484.rotations.length > 0 && <div className="v27-recommendation-list compact">
            {chemistryR484.rotations.map((item) => <article key={`${item.reserveId}-${item.replaces}`}><div><strong>{item.reserveName} → {item.replaces} • {item.delta >= 0 ? '+' : ''}{item.delta}</strong><span>{item.summary}</span><small>Química {item.scoreBefore} → {item.scoreAfter} • confiança {item.confidence}% • simulação somente leitura.</small></div></article>)}
          </div>}
          {chemistryR484.warnings.length > 0 && <div className="v27-pairing-list">{chemistryR484.warnings.slice(0, 3).map((warning) => <span key={warning}><AlertTriangle size={15}/>{warning}</span>)}</div>}
        </article>
      </section>}

      {tab === 'elenco' && <section className="bm32-team-detail-grid">
        <article className="bm32-team-roster luxury-panel">
          <header><Users size={19}/><div><strong>Titulares e cobertura</strong><small>{team.filledSlots + team.benchSuggestions.length} jogadores analisados</small></div></header>
          <div>
            {team.lineup.filter((item) => item.player).map((item) => <article key={item.slot.id}><strong>{item.player?.parsed.playerName}</strong><span>{item.slot.label} • {item.score}%</span><small>{item.player?.teamMap?.functionLabel || item.player?.buildName}</small></article>)}
            {team.benchSuggestions.map((item) => <article key={item.id} className="bench"><strong>{item.name}</strong><span>Banco • {item.score}/100 • {item.replacementMode === 'MANTER_FUNCAO' ? 'Manter função' : 'Mudar comportamento'}</span><small>{item.replaces}: {item.behaviourChange}</small></article>)}
          </div>
        </article>
        <article className="luxury-panel" aria-label="Cérebro do elenco R481">
          <header><Sparkles size={19}/><div><strong>Cérebro do elenco</strong><small>R481 • somente leitura • confiança {squadBrainR481.confidence}%</small></div></header>
          <div className="v27-pairing-list">
            {squadBrainR481.coverage.map((item) => <span key={item.line}><CheckCircle2 size={15}/>{item.label}: {item.status} • {item.reserves} reserva(s) • melhor cobertura {item.bestReserveScore || 0}/100.</span>)}
          </div>
          <div className="v27-recommendation-list compact">
            {squadBrainR481.core.slice(0, 4).map((item) => (
              <article key={item.playerId}>
                <div><strong>{item.playerName} • importância {item.importance}/100</strong><span>{item.role} • {item.reason}</span><small>{item.evidenceMatches} partida(s) de evidência • diferença para reserva {item.replacementGap}.</small></div>
                <StarterExplainabilityR489 starter={item} squadBrain={squadBrainR481} chemistry={chemistryR484} />
              </article>
            ))}
          </div>
          <div className="v27-pairing-list">
            {squadBrainR481.rotations.slice(0, 4).map((item) => <span key={item.reserveId}><ChevronRight size={15}/>{item.reserveName} → {item.replaces} • prontidão {item.readiness}/100 • {item.replacementMode === 'MANTER_FUNCAO' ? 'mantém função' : 'muda comportamento'}.</span>)}
          </div>
          {squadBrainR481.warnings.length > 0 && <div className="v27-pairing-list">{squadBrainR481.warnings.slice(0, 3).map((warning) => <span key={warning}><AlertTriangle size={15}/>{warning}</span>)}</div>}
        </article>
      </section>}

      {tab === 'tatica' && <section className="bm32-team-tactics">
        <article className="luxury-panel">
          <header><Target size={19}/><div><strong>Estilo coletivo</strong><small>{team.styleFit}% de encaixe</small></div></header>
          <p>{team.styleNote}</p>
          <div className="v27-pairing-list">{team.pairingNotes.map((note) => <span key={note}><CheckCircle2 size={15}/>{note}</span>)}</div>
        </article>
        <article className="luxury-panel bm32-formation-compare">
          <header><Layers size={19}/><div><strong>Comparar formações</strong><small>{team.formation} x {comparisonFormation}</small></div></header>
          <label>Formação alternativa<select value={comparisonFormation} onChange={(event) => setComparisonFormation(event.target.value as TacticalFormation)}>{formationOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <div><span><strong>{team.globalScore}</strong>Atual</span><b>VS</b><span><strong>{comparisonTeam.globalScore}</strong>Alternativa</span></div>
          <small>{comparisonTeam.globalScore > team.globalScore ? `${comparisonFormation} melhora ${comparisonTeam.globalScore - team.globalScore} ponto(s) na prontidão.` : `${team.formation} continua ${team.globalScore - comparisonTeam.globalScore} ponto(s) à frente.`}</small>
          <button type="button" className="elite-button" disabled={comparisonFormation === team.formation} onClick={() => onFormationChange(comparisonFormation)}>Aplicar alternativa</button>
        </article>
        <article className="luxury-panel" aria-label="Gêmeo tático R480">
          <header><Sparkles size={19}/><div><strong>Gêmeo tático</strong><small>R480 • somente leitura • confiança {tacticalTwinR480.confidence}%</small></div></header>
          <p>{tacticalTwinR480.guardrails[1]}</p>
          <div className="v27-pairing-list">
            <span><CheckCircle2 size={15}/>Evidência real: {tacticalTwinR480.evidence.contextualMatchRecords} partida(s) no mesmo contexto • {tacticalTwinR480.evidence.starterEvidenceCoverage}% dos titulares cobertos.</span>
            <span><CheckCircle2 size={15}/>Estrutura: controle {tacticalTwinR480.scenarios[0]?.control ?? 0} • progressão {tacticalTwinR480.scenarios[0]?.progression ?? 0} • segurança {tacticalTwinR480.scenarios[0]?.defensiveSecurity ?? 0}.</span>
          </div>
          <div className="v27-recommendation-list compact">
            {tacticalTwinR480.scenarios.map((scenario) => (
              <article key={scenario.id}>
                <div><strong>{scenario.label} • {scenario.readiness}/100</strong><span>{scenario.summary}</span><small>Controle {scenario.control} • Progressão {scenario.progression} • Segurança {scenario.defensiveSecurity} • Risco de transição {scenario.transitionRisk}</small></div>
              </article>
            ))}
          </div>
          {tacticalTwinR480.risks.length > 0 && <div className="v27-pairing-list">{tacticalTwinR480.risks.slice(0, 3).map((risk) => <span key={risk}><AlertTriangle size={15}/>{risk}</span>)}</div>}
        </article>
        {(tacticalTwinR480.scenarios.find((scenario) => scenario.id === 'base') ?? tacticalTwinR480.scenarios[0]) && (
          <TacticalExplainabilityR489
            scenario={tacticalTwinR480.scenarios.find((scenario) => scenario.id === 'base') ?? tacticalTwinR480.scenarios[0]!}
            tacticalTwin={tacticalTwinR480}
            squadBrain={squadBrainR481}
            chemistry={chemistryR484}
          />
        )}
      </section>}

      {tab === 'banco' && <section className="luxury-panel bm32-bench-detail">
        <header><Users size={19}/><div><strong>Banco recomendado</strong><small>Cobertura para cenários diferentes</small></div></header>
        <div>
          {team.benchSuggestions.map((player, index) => {
            const rotation = squadBrainR481.rotations.find((item) => (item.reserveId === player.id || item.reserveName === player.name) && item.replaces === player.replaces);
            return <article key={player.id}>
              <span>#{index + 1}</span>
              <div><strong>{player.name}</strong><small>{player.replacementMode === 'MANTER_FUNCAO' ? 'MANTER A FUNÇÃO' : 'MUDAR O COMPORTAMENTO'} • substitui {player.replaces}</small><small>{player.behaviourChange} • {player.reason}</small></div>
              <b>{player.score}</b>
              {rotation && <RotationExplainabilityR489 rotation={rotation} tacticalTwin={tacticalTwinR480} squadBrain={squadBrainR481} chemistry={chemistryR484} />}
            </article>;
          })}
          {!team.benchSuggestions.length && <p>Cadastre mais jogadores para montar um banco complementar.</p>}
        </div>
        <footer><History size={18}/><span>Presets salvos mantêm um retrato da escalação sem sobrescrever o time atual.</span></footer>
      </section>}
      </div>
    </section>
  );
}