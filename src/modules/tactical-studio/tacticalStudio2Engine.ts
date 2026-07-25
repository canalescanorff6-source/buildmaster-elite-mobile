import type { TacticalStyle } from '@/lib/analyzer';
import type { FormationBlueprint, FormationSlotFit } from '@/lib/formationRoleEngine';
import { createStableId } from '@/lib/stableId';

export const TACTICAL_STUDIO_2_VERSION = '29.50.0';

export type TacticalPhase = 'saida' | 'progressao' | 'criacao' | 'finalizacao' | 'transicao-defensiva' | 'bloco-defensivo';
export type TacticalActionKind = 'passe' | 'movimento' | 'retorno' | 'pressao' | 'cobertura' | 'finalizacao';

export type TacticalSequencePlayer = { slotId: string; label: string; playerName: string; role: string; x: number; y: number };
export type TacticalSequenceAction = { id: string; fromSlotId: string; toSlotId: string; kind: TacticalActionKind; label: string };
export type TacticalSequenceFrame = { id: string; title: string; phase: TacticalPhase; durationMs: number; objective: string; coachingPoints: string[]; players: TacticalSequencePlayer[]; actions: TacticalSequenceAction[] };
export type TacticalSequenceProject = { id: string; name: string; formationId: string; style: TacticalStyle; createdAt: string; updatedAt: string; frames: TacticalSequenceFrame[] };
export type TacticalSequenceValidation = { valid: boolean; score: number; blockers: string[]; warnings: string[] };

export const TACTICAL_PHASE_LABELS: Record<TacticalPhase, string> = {
  saida: 'Saída de bola', progressao: 'Progressão', criacao: 'Criação', finalizacao: 'Finalização',
  'transicao-defensiva': 'Transição defensiva', 'bloco-defensivo': 'Bloco defensivo'
};

const clamp = (value: number) => Math.max(2, Math.min(98, Math.round(value * 10) / 10));

function basePlayers(lineup: FormationSlotFit[]): TacticalSequencePlayer[] {
  return lineup.map((fit) => ({
    slotId: fit.slot.id,
    label: fit.slot.label,
    playerName: fit.player?.parsed.playerName?.trim() || fit.slot.label,
    role: fit.player?.parsed.playstyle?.trim() || fit.slot.primaryRoles[0] || fit.slot.position,
    x: clamp(fit.slot.x), y: clamp(fit.slot.y)
  }));
}

function shifted(players: TacticalSequencePlayer[], phase: TacticalPhase): TacticalSequencePlayer[] {
  return players.map((player) => {
    const isAttack = player.y < 42;
    const isMidfield = player.y >= 42 && player.y < 72;
    const isDefense = player.y >= 72 && player.y < 90;
    let x = player.x; let y = player.y;
    if (phase === 'progressao') { y -= isAttack ? 4 : isMidfield ? 8 : isDefense ? 6 : 1; if (x < 30) x -= 3; if (x > 70) x += 3; }
    else if (phase === 'criacao') { y -= isAttack ? 8 : isMidfield ? 14 : isDefense ? 7 : 2; if (x < 35) x -= 5; if (x > 65) x += 5; }
    else if (phase === 'finalizacao') { y -= isAttack ? 12 : isMidfield ? 18 : isDefense ? 8 : 2; if (isAttack) x += x < 50 ? 5 : -5; }
    else if (phase === 'transicao-defensiva') { y += isAttack ? 8 : isMidfield ? 10 : isDefense ? 4 : 0; x += x < 50 ? 4 : -4; }
    else if (phase === 'bloco-defensivo') { y += isAttack ? 18 : isMidfield ? 14 : isDefense ? 5 : 0; x += x < 50 ? 7 : -7; }
    return { ...player, x: clamp(x), y: clamp(y) };
  });
}

function nearest(players: TacticalSequencePlayer[], predicate: (player: TacticalSequencePlayer) => boolean, fallback: TacticalSequencePlayer): TacticalSequencePlayer {
  return players.filter(predicate).sort((a, b) => a.y - b.y)[0] || fallback;
}

function makeActions(players: TacticalSequencePlayer[], phase: TacticalPhase): TacticalSequenceAction[] {
  if (!players.length) return [];
  const keeper = [...players].sort((a, b) => b.y - a.y)[0];
  const leftDefender = nearest(players, (p) => p.y > 65 && p.x < 50, keeper);
  const rightDefender = nearest(players, (p) => p.y > 65 && p.x >= 50, keeper);
  const midfielder = nearest(players, (p) => p.y >= 38 && p.y <= 68, leftDefender);
  const creator = nearest(players, (p) => p.y >= 22 && p.y < 52, midfielder);
  const striker = [...players].sort((a, b) => a.y - b.y)[0];
  const action = (from: TacticalSequencePlayer, to: TacticalSequencePlayer, kind: TacticalActionKind, label: string): TacticalSequenceAction => ({ id: createStableId('seq-action'), fromSlotId: from.slotId, toSlotId: to.slotId, kind, label });
  if (phase === 'saida') return [action(keeper, leftDefender, 'passe', 'Saída segura'), action(leftDefender, midfielder, 'passe', 'Quebrar primeira linha'), action(rightDefender, midfielder, 'movimento', 'Criar apoio')];
  if (phase === 'progressao') return [action(midfielder, creator, 'passe', 'Passe vertical'), action(leftDefender, creator, 'movimento', 'Apoio por fora'), action(striker, creator, 'movimento', 'Fixar e aproximar')];
  if (phase === 'criacao') return [action(creator, striker, 'passe', 'Último passe'), action(midfielder, creator, 'cobertura', 'Sustentar a jogada'), action(rightDefender, striker, 'movimento', 'Amplitude oposta')];
  if (phase === 'finalizacao') return [action(creator, striker, 'finalizacao', 'Atacar a área'), action(midfielder, striker, 'movimento', 'Chegada de segunda linha'), action(leftDefender, midfielder, 'cobertura', 'Proteger a sobra')];
  if (phase === 'transicao-defensiva') return [action(striker, creator, 'pressao', 'Pressão imediata'), action(creator, midfielder, 'retorno', 'Fechar o centro'), action(leftDefender, rightDefender, 'cobertura', 'Restabelecer linha')];
  return [action(striker, creator, 'retorno', 'Compactar ataque'), action(creator, midfielder, 'retorno', 'Fechar entrelinhas'), action(midfielder, leftDefender, 'cobertura', 'Proteger a defesa')];
}

function frame(players: TacticalSequencePlayer[], phase: TacticalPhase, index: number): TacticalSequenceFrame {
  const objectives: Record<TacticalPhase, string> = {
    saida: 'Sair sem rifar a bola e criar duas linhas de passe.', progressao: 'Levar a posse ao meio ofensivo com segurança.',
    criacao: 'Mover o bloco adversário e encontrar o jogador entre linhas.', finalizacao: 'Ocupar área, rebote e proteção contra contra-ataque.',
    'transicao-defensiva': 'Recuperar em poucos segundos ou interromper a transição.', 'bloco-defensivo': 'Fechar o centro e orientar o rival para zonas menos perigosas.'
  };
  return {
    id: createStableId(`seq-frame-${index}`), title: `${index + 1}. ${TACTICAL_PHASE_LABELS[phase]}`, phase,
    durationMs: phase === 'finalizacao' ? 1800 : 2400, objective: objectives[phase],
    coachingPoints: phase === 'bloco-defensivo'
      ? ['Não quebrar a linha por bote isolado.', 'Cobertura antes da pressão dupla.', 'Saída preparada para o primeiro passe.']
      : ['Corpo orientado antes de receber.', 'Passe apenas quando a linha estiver aberta.', 'Manter pelo menos dois jogadores protegendo a perda.'],
    players: shifted(players, phase), actions: makeActions(players, phase)
  };
}

export function createDefaultTacticalSequence(formation: FormationBlueprint, lineup: FormationSlotFit[], style: TacticalStyle): TacticalSequenceProject {
  const players = basePlayers(lineup);
  const phases: TacticalPhase[] = style === 'POSSE_DE_BOLA'
    ? ['saida', 'progressao', 'criacao', 'finalizacao', 'transicao-defensiva']
    : ['bloco-defensivo', 'transicao-defensiva', 'progressao', 'finalizacao'];
  const now = new Date().toISOString();
  return { id: createStableId('tactical-sequence'), name: `${formation.name} • sequência ${style === 'POSSE_DE_BOLA' ? 'de posse' : style === 'CONTRA_ATAQUE_RAPIDO' ? 'de contra-ataque rápido' : 'competitiva'}`, formationId: formation.id, style, createdAt: now, updatedAt: now, frames: phases.map((phase, index) => frame(players, phase, index)) };
}

export function updateSequencePlayer(project: TacticalSequenceProject, frameId: string, slotId: string, x: number, y: number): TacticalSequenceProject {
  return { ...project, updatedAt: new Date().toISOString(), frames: project.frames.map((item) => item.id === frameId ? { ...item, players: item.players.map((player) => player.slotId === slotId ? { ...player, x: clamp(x), y: clamp(y) } : player) } : item) };
}

export function duplicateSequenceFrame(project: TacticalSequenceProject, frameId: string): TacticalSequenceProject {
  const index = project.frames.findIndex((item) => item.id === frameId);
  if (index < 0 || project.frames.length >= 12) return project;
  const source = project.frames[index];
  const copy: TacticalSequenceFrame = { ...source, id: createStableId('seq-frame'), title: `${source.title} (cópia)`, players: source.players.map((item) => ({ ...item })), actions: source.actions.map((item) => ({ ...item, id: createStableId('seq-action') })) };
  const frames = [...project.frames]; frames.splice(index + 1, 0, copy);
  return { ...project, updatedAt: new Date().toISOString(), frames };
}

export function removeSequenceFrame(project: TacticalSequenceProject, frameId: string): TacticalSequenceProject {
  if (project.frames.length <= 2) return project;
  return { ...project, updatedAt: new Date().toISOString(), frames: project.frames.filter((item) => item.id !== frameId) };
}

export function validateTacticalSequence(project: TacticalSequenceProject): TacticalSequenceValidation {
  const blockers: string[] = []; const warnings: string[] = [];
  if (project.frames.length < 2) blockers.push('A sequência precisa de pelo menos duas etapas.');
  project.frames.forEach((item, index) => {
    if (!item.players.length) blockers.push(`A etapa ${index + 1} não possui jogadores.`);
    if (!item.objective.trim()) warnings.push(`A etapa ${index + 1} não possui objetivo explicado.`);
    if (!item.actions.length) warnings.push(`A etapa ${index + 1} não possui movimento ou passe indicado.`);
    if (item.durationMs < 600 || item.durationMs > 10000) warnings.push(`A duração da etapa ${index + 1} está fora da faixa recomendada.`);
  });
  const score = Math.max(0, Math.min(100, 100 - blockers.length * 30 - warnings.length * 6));
  return { valid: blockers.length === 0, score, blockers, warnings };
}

export function interpolateSequenceFrame(from: TacticalSequenceFrame, to: TacticalSequenceFrame, progress: number): TacticalSequencePlayer[] {
  const ratio = Math.max(0, Math.min(1, progress));
  return from.players.map((player) => { const target = to.players.find((item) => item.slotId === player.slotId) || player; return { ...player, x: player.x + (target.x - player.x) * ratio, y: player.y + (target.y - player.y) * ratio }; });
}

export function exportTacticalSequence(project: TacticalSequenceProject): string {
  return JSON.stringify({ schema: 1, appVersion: TACTICAL_STUDIO_2_VERSION, exportedAt: new Date().toISOString(), project }, null, 2);
}
