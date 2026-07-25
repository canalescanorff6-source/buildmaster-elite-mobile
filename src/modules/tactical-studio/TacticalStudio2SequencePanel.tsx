'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, Pause, Play, RotateCcw, Save, Trash2, Waypoints } from 'lucide-react';
import type { TacticalStyle } from '@/lib/analyzer';
import type { FormationBlueprint, FormationSlotFit } from '@/lib/formationRoleEngine';
import { downloadBlob, safeFileName } from '@/modules/tactical-studio/exportUtils';
import { readTacticalSequenceProjects, saveTacticalSequenceProjects } from './tacticalStudio2Storage';
import {
  createDefaultTacticalSequence,
  duplicateSequenceFrame,
  exportTacticalSequence,
  removeSequenceFrame,
  TACTICAL_PHASE_LABELS,
  updateSequencePlayer,
  validateTacticalSequence,
  type TacticalSequenceProject
} from './tacticalStudio2Engine';

type Props = { formation: FormationBlueprint; lineup: FormationSlotFit[]; style: TacticalStyle };
export function TacticalStudio2SequencePanel({ formation, lineup, style }: Props) {
  const initial = useMemo(() => createDefaultTacticalSequence(formation, lineup, style), [formation, lineup, style]);
  const [project, setProject] = useState(initial);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [projects, setProjects] = useState<TacticalSequenceProject[]>([]);
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setProjects(readTacticalSequenceProjects()); }, []);
  useEffect(() => { setProject(initial); setFrameIndex(0); setPlaying(false); }, [initial]);
  useEffect(() => {
    if (!playing || !project.frames.length) return;
    const frame = project.frames[frameIndex];
    timerRef.current = setTimeout(() => setFrameIndex((current) => current >= project.frames.length - 1 ? 0 : current + 1), Math.max(500, frame.durationMs / speed));
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [frameIndex, playing, project.frames, speed]);

  const frame = project.frames[Math.min(frameIndex, project.frames.length - 1)];
  const validation = useMemo(() => validateTacticalSequence(project), [project]);

  function movePlayer(event: ReactPointerEvent<HTMLButtonElement>, slotId: string): void {
    if (!frame) return;
    const field = event.currentTarget.parentElement;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const onMove = (pointer: PointerEvent) => {
      const x = ((pointer.clientX - rect.left) / rect.width) * 100;
      const y = ((pointer.clientY - rect.top) / rect.height) * 100;
      setProject((current) => updateSequencePlayer(current, frame.id, slotId, x, y));
    };
    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish, { once: true });
  }

  function saveProject(): void {
    const next = { ...project, updatedAt: new Date().toISOString() };
    setProject(next);
    setProjects((current) => saveTacticalSequenceProjects([next, ...current.filter((item) => item.id !== next.id)]));
    setMessage('Sequência salva na conta local.');
  }

  function loadProject(id: string): void {
    const found = projects.find((item) => item.id === id);
    if (!found) return;
    setProject(found);
    setFrameIndex(0);
    setPlaying(false);
    setMessage('Sequência carregada.');
  }

  function exportProject(): void {
    const blob = new Blob([exportTacticalSequence(project)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${safeFileName(project.name)}-v2950.json`);
    setMessage('Sequência exportada em JSON.');
  }

  if (!frame) return null;

  return <section className="bm2950-sequence-studio" aria-labelledby="bm2950-sequence-title">
    <div className="bm2950-section-heading"><div><p className="kicker"><Waypoints size={15}/> Bloco 20 • Estúdio Tático 2.0</p><h3 id="bm2950-sequence-title">Sequências, movimentos e fases do jogo</h3><span>Arraste jogadores, reproduza etapas e salve jogadas sem alterar a escalação original.</span></div><strong>{validation.score}/100</strong></div>
    <div className="bm2950-sequence-toolbar">
      <label><span>Projeto</span><input value={project.name} maxLength={90} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value, updatedAt: new Date().toISOString() }))}/></label>
      <label><span>Salvos</span><select defaultValue="" onChange={(event) => { if (event.target.value) loadProject(event.target.value); }}><option value="">Selecionar</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button type="button" onClick={saveProject}><Save size={16}/> Salvar</button>
      <button type="button" onClick={exportProject}><Download size={16}/> Exportar</button>
      <button type="button" onClick={() => { setProject(initial); setFrameIndex(0); }}><RotateCcw size={16}/> Restaurar</button>
    </div>

    <div className="bm2950-sequence-layout">
      <div className="bm2950-sequence-stage">
        <div className="bm2950-sequence-player-controls">
          <button type="button" aria-label="Etapa anterior" onClick={() => setFrameIndex((current) => Math.max(0, current - 1))}><ChevronLeft size={18}/></button>
          <button type="button" className="primary" onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Pausar' : 'Reproduzir'}</button>
          <button type="button" aria-label="Próxima etapa" onClick={() => setFrameIndex((current) => Math.min(project.frames.length - 1, current + 1))}><ChevronRight size={18}/></button>
          <label>Velocidade<select value={String(speed)} onChange={(event) => setSpeed(Number(event.target.value))}><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
        </div>
        <div className="bm2950-sequence-field" aria-label="Campo tático editável">
          <span className="half-line"/><span className="center-circle"/><span className="box top"/><span className="box bottom"/>
          {frame.actions.map((action) => {
            const from = frame.players.find((item) => item.slotId === action.fromSlotId);
            const to = frame.players.find((item) => item.slotId === action.toSlotId);
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return <span key={action.id} className={`bm2950-action action-${action.kind}`} style={{ left: `${from.x}%`, top: `${from.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)` }} title={action.label}/>;
          })}
          {frame.players.map((player) => <button key={player.slotId} type="button" className="bm2950-sequence-player" style={{ left: `${player.x}%`, top: `${player.y}%` }} onPointerDown={(event) => movePlayer(event, player.slotId)} aria-label={`Mover ${player.playerName}`}><b>{player.label}</b><span>{player.playerName}</span></button>)}
        </div>
        <div className="bm2950-frame-summary"><strong>{frame.title}</strong><span>{TACTICAL_PHASE_LABELS[frame.phase]} • {(frame.durationMs / 1000).toFixed(1)}s</span><p>{frame.objective}</p>{frame.coachingPoints.map((item) => <small key={item}>{item}</small>)}</div>
      </div>

      <aside className="bm2950-sequence-timeline">
        <strong>Linha do tempo</strong>
        {project.frames.map((item, index) => <article key={item.id} className={index === frameIndex ? 'active' : ''} onClick={() => { setFrameIndex(index); setPlaying(false); }}><div><span>{index + 1}</span><b>{TACTICAL_PHASE_LABELS[item.phase]}</b></div><small>{item.objective}</small><div className="actions"><button type="button" aria-label="Duplicar etapa" onClick={(event) => { event.stopPropagation(); setProject((current) => duplicateSequenceFrame(current, item.id)); }}><Copy size={14}/></button><button type="button" aria-label="Excluir etapa" disabled={project.frames.length <= 2} onClick={(event) => { event.stopPropagation(); setProject((current) => removeSequenceFrame(current, item.id)); setFrameIndex(0); }}><Trash2 size={14}/></button></div></article>)}
        <div className="bm2950-validation"><span>{validation.valid ? 'Sequência pronta' : 'Sequência bloqueada'}</span>{validation.blockers.map((item) => <small key={item}>{item}</small>)}{validation.warnings.map((item) => <small key={item}>{item}</small>)}</div>
      </aside>
    </div>
    {message && <p className="bm2950-message" role="status">{message}</p>}
  </section>;
}
