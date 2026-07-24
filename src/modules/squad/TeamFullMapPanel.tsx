'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Layers,
  LayoutDashboard,
  Save,
  ScanText,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import type {
  AnalysisResult,
  PositionCode,
  TacticalFormation,
  TacticalStyle
} from '@/lib/analyzer';
import { buildEliteTeamReport } from '@/lib/teamOptimizer';
import { buildSquadChemistryReport } from '@/lib/squadChemistry';
import { buildAssistedLineupReport } from '@/lib/assistedLineup';
import {
  buildOpponentAnalysisReport,
  OPPONENT_PROFILE_LABELS,
  OPPONENT_STRENGTH_LABELS,
  type OpponentProfile,
  type OpponentStrength
} from '@/lib/opponentAnalysis';
import { buildAdvancedOpponentReport } from '@/lib/opponentAdvanced';
import { readOpponentPrintText, type OpponentPrintReport } from '@/lib/opponentPrintReader';
import { buildGamePlanReport, type MatchState, type TeamEnergy } from '@/lib/gamePlan';
import { buildSquadRotationReport } from '@/lib/squadRotation';
import { buildProfessionalSquadReport } from '@/lib/professionalSquadEngine';
import { inspectPrintQuality } from '@/lib/ocr';
import { fileDigest, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import { validateImageFile } from '@/modules/images/imageSafety';
import { preprocessImage } from '@/modules/card-reader/imageProcessing';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { FormationRoleLabPanel } from '@/components/lazy/AppLazyPanels';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ProfessionalSquadPanel } from '@/modules/squad/ProfessionalSquadPanel';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';

const tacticalStyleName: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Por fora',
  PASSE_LONGO: 'Passe longo'
};

type TeamCenterView = 'profissional' | 'visao' | 'formacoes' | 'escalacao' | 'elenco' | 'entrosamento' | 'planos' | 'adversario';


const teamMapLabels: Record<string, string> = {
  marcacao: 'Marcação',
  cobertura: 'Cobertura',
  saidaDeBola: 'Saída de bola',
  passe: 'Passe',
  criacao: 'Criação',
  aceleracao: 'Aceleração',
  finalizacao: 'Ataque/finalização',
  jogoAereo: 'Jogo aéreo',
  fisico: 'Físico'
};

type SquadPhaseKey = keyof AnalysisResult['teamMap']['sectorScores'];

type SquadReport = {
  playerCount: number;
  phaseScores: Record<SquadPhaseKey, number>;
  globalScore: number;
  balanceLabel: string;
  composition: { goleiros: number; defensores: number; meio: number; ataque: number; lateraisAlas: number; volantes: number; criadores: number; finalizadores: number };
  topByPhase: Array<{ title: string; player: string; position: string; score: number; functionLabel: string }>;
  warnings: string[];
  suggestions: string[];
  gamePlan: string[];
};

const PHASE_KEYS: SquadPhaseKey[] = ['marcacao', 'cobertura', 'saidaDeBola', 'passe', 'criacao', 'aceleracao', 'finalizacao', 'jogoAereo', 'fisico'];

function avgNumbers(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function clampTeamScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function uniqueSavedResults(history: SavedAnalysis[]) {
  const map = new Map<string, AnalysisResult>();
  for (const item of history) {
    const key = `${item.result.parsed.playerName.toLowerCase()}-${item.result.bestPosition.code}-${item.result.parsed.playstyle ?? ''}`;
    if (!map.has(key)) map.set(key, item.result);
  }
  return Array.from(map.values()).slice(0, 30);
}

function buildSquadReport(history: SavedAnalysis[], formation: TacticalFormation, teamStyle: TacticalStyle): SquadReport | null {
  const results = uniqueSavedResults(history);
  if (!results.length) return null;

  const phaseScores = Object.fromEntries(PHASE_KEYS.map((key) => [key, avgNumbers(results.map((result) => Number(result.teamMap?.sectorScores?.[key] ?? 0))) ])) as Record<SquadPhaseKey, number>;
  const globalScore = clampTeamScore(avgNumbers([
    phaseScores.marcacao,
    phaseScores.cobertura,
    phaseScores.saidaDeBola,
    phaseScores.passe,
    phaseScores.criacao,
    phaseScores.finalizacao,
    phaseScores.jogoAereo,
    phaseScores.fisico
  ]));

  const count = (codes: PositionCode[]) => results.filter((result) => codes.includes(result.bestPosition.code)).length;
  const composition = {
    goleiros: count(['GK']),
    defensores: count(['CB', 'LB', 'RB']),
    meio: count(['DMF', 'CMF', 'AMF', 'LMF', 'RMF']),
    ataque: count(['CF', 'SS', 'LWF', 'RWF']),
    lateraisAlas: count(['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF']),
    volantes: count(['DMF', 'CMF']),
    criadores: results.filter((result) => /criador|orquestrador|armador|clássico|classico|passe|organizador/i.test(`${result.teamMap?.functionLabel ?? ''} ${result.parsed.playstyle ?? ''}`)).length,
    finalizadores: results.filter((result) => ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(result.bestPosition.code) && Number(result.teamMap?.sectorScores?.finalizacao ?? 0) >= 76).length
  };

  const phaseLeaders: Array<[string, SquadPhaseKey]> = [
    ['Melhor marcador', 'marcacao'],
    ['Melhor cobertura', 'cobertura'],
    ['Melhor saída', 'saidaDeBola'],
    ['Melhor passe', 'passe'],
    ['Melhor criação', 'criacao'],
    ['Melhor ataque', 'finalizacao']
  ];
  const topByPhase = phaseLeaders.map(([title, key]) => {
    const leader = [...results].sort((a, b) => Number(b.teamMap?.sectorScores?.[key] ?? 0) - Number(a.teamMap?.sectorScores?.[key] ?? 0))[0];
    return {
      title,
      player: leader.parsed.playerName,
      position: leader.bestPosition.label,
      score: Number(leader.teamMap?.sectorScores?.[key] ?? 0),
      functionLabel: leader.teamMap?.functionLabel ?? leader.buildName
    };
  });

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!composition.goleiros) warnings.push('Falta salvar pelo menos um goleiro para o mapa ficar completo.');
  if (composition.defensores < 3 && !String(formation).startsWith('3')) warnings.push('Poucos defensores salvos: o app ainda não consegue medir bem cobertura e bola aérea da última linha.');
  if (composition.volantes < 1) warnings.push('Falta um VOL/MLG de proteção para medir equilíbrio entre defesa e ataque.');
  if (composition.criadores < 1) warnings.push('Falta um criador/orquestrador salvo para medir último passe e saída limpa.');
  if (composition.finalizadores < 1) warnings.push('Falta um finalizador claro para medir poder de gol.');
  if (phaseScores.marcacao < 72) suggestions.push('Melhorar marcação: priorize VOL/ZAG com Interceptação, Bloqueador, Marcação individual e ímpetos Defesa/Roubo de bola.');
  if (phaseScores.saidaDeBola < 72) suggestions.push('Melhorar saída de bola: use um VOL orquestrador ou ZAG defensor criativo com Passe de primeira e Passe na medida.');
  if (phaseScores.criacao < 72) suggestions.push('Melhorar criação: adicione MAT/MLG/SA com Armador criativo, Orquestrador ou Clássico nº 10.');
  if (phaseScores.finalizacao < 72) suggestions.push('Melhorar ataque: use CA Artilheiro/Homem de área com habilidades de finalização, não habilidade defensiva.');
  if (phaseScores.jogoAereo < 68) suggestions.push('Melhorar bola aérea: tenha ao menos um ZAG forte e um CA/pivô com Cabeçada ou Superioridade aérea.');

  if (teamStyle === 'POSSE_DE_BOLA' && phaseScores.passe < 76) suggestions.push('Para Posse de bola, seu time precisa de mais Passe de primeira, Passe em profundidade e Proteção de Posse no meio.');
  if (teamStyle === 'CONTRA_ATAQUE_RAPIDO' && phaseScores.aceleracao < 76) suggestions.push('Para Contra-ataque rápido, falta aceleração/verticalidade nos atacantes e meias de transição.');
  if (teamStyle === 'POR_FORA' && composition.lateraisAlas < 3) suggestions.push('Para jogar Por fora, salve e use laterais/alas/pontas com Cruzamento preciso e velocidade.');
  if (teamStyle === 'PASSE_LONGO' && phaseScores.jogoAereo < 72) suggestions.push('Para Passe longo, faltam alvo físico, jogo aéreo e segunda bola no meio.');

  const gamePlan: string[] = [];
  if (teamStyle === 'POSSE_DE_BOLA') gamePlan.push('Defenda com bloco médio, recupere e saia com passe curto pelo VOL/MLG; não force lançamento se o meio não aproximar.');
  else if (teamStyle === 'CONTRA_ATAQUE_RAPIDO') gamePlan.push('Roube e verticalize rápido: primeiro passe no MAT/SA, segundo passe no CA/ponta atacando espaço.');
  else if (teamStyle === 'POR_FORA') gamePlan.push('Abra amplitude com laterais/pontas, atraia por um lado e inverta para cruzar ou cortar para dentro.');
  else if (teamStyle === 'PASSE_LONGO') gamePlan.push('Use ZAG/VOL com passe alto, procure pivô/CA forte e ataque a segunda bola com MLG/SA.');
  else gamePlan.push('Mantenha estrutura: um jogador de contenção, um criador, dois aceleradores e um finalizador claro.');

  if (formation !== 'AUTO') gamePlan.push(`Na formação ${formation}, preserve cobertura antes de acelerar; o app calcula o time por função real, não só por GER.`);
  gamePlan.push('Use o Cofre para salvar 11 titulares e reservas; quanto mais cartas confirmadas, mais preciso fica o mapa completo.');

  const balanceLabel = globalScore >= 84 ? 'Time muito equilibrado' : globalScore >= 74 ? 'Time competitivo com ajustes pontuais' : globalScore >= 62 ? 'Time promissor, mas com buracos táticos' : 'Time incompleto ou desequilibrado';

  return {
    playerCount: results.length,
    phaseScores,
    globalScore,
    balanceLabel,
    composition,
    topByPhase,
    warnings: warnings.slice(0, 5),
    suggestions: suggestions.length ? suggestions.slice(0, 6) : ['O mapa não encontrou buraco crítico. Continue salvando titulares e reservas para refinar o diagnóstico.'],
    gamePlan
  };
}

function FormationMiniBoard({ history, formation }: { history: SavedAnalysis[]; formation: TacticalFormation }) {
  const players = uniqueSavedResults(history);
  const byLine = {
    gol: players.filter((item) => item.bestPosition.code === 'GK').slice(0, 1),
    defesa: players.filter((item) => ['CB', 'LB', 'RB'].includes(item.bestPosition.code)).slice(0, 5),
    meio: players.filter((item) => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(item.bestPosition.code)).slice(0, 5),
    ataque: players.filter((item) => ['CF', 'SS', 'LWF', 'RWF'].includes(item.bestPosition.code)).slice(0, 4)
  };
  const row = (label: string, items: AnalysisResult[], min: number) => {
    const padded = [...items];
    while (padded.length < min) padded.push(null as unknown as AnalysisResult);
    return (
      <div className="formation-row">
        <span>{label}</span>
        <div>
          {padded.slice(0, Math.max(min, items.length)).map((item, index) => (
            <em key={`${label}-${index}`} className={item ? 'filled' : ''}>{item ? `${item.parsed.playerName.split(' ')[0]} • ${item.bestPosition.label}` : 'vaga'}</em>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="formation-board">
      <strong><Layers size={15} /> Mapa visual da formação {formation === 'AUTO' ? 'automática' : formation}</strong>
      {row('ATA', byLine.ataque, 2)}
      {row('MEI', byLine.meio, 3)}
      {row('DEF', byLine.defesa, 4)}
      {row('GOL', byLine.gol, 1)}
    </div>
  );
}

type VisualLineupSlot = {
  id: string;
  label: string;
  preferred: PositionCode[];
  line: 'ataque' | 'meio' | 'defesa' | 'goleiro';
  duty: string;
};

type VisualLineupPick = VisualLineupSlot & {
  player: AnalysisResult | null;
  fit: number;
  reason: string;
};

const formationVisualLayouts: Record<Exclude<TacticalFormation, 'AUTO'>, VisualLineupSlot[]> = {
  '4-2-2-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizar e atacar espaço.' },
    { id: 'cf2', label: 'CA 2', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Apoiar, tabelar ou puxar marcação.' },
    { id: 'am1', label: 'Meia E', preferred: ['AMF', 'LMF', 'CMF', 'SS'], line: 'meio', duty: 'Criar por dentro e acelerar transição.' },
    { id: 'am2', label: 'Meia D', preferred: ['AMF', 'RMF', 'CMF', 'SS'], line: 'meio', duty: 'Último passe e apoio aos atacantes.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteger a zaga e cortar passe.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída de bola e cobertura lateral.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Cobrir o lado esquerdo.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate e cobertura.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura e bola aérea.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Cobrir o lado direito.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança e reflexo.' }
  ],
  '4-3-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Amplitude, drible e diagonal.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização e presença de área.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Amplitude, corte e finalização.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF', 'DMF'], line: 'meio', duty: 'Apoio e passe vertical.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Equilíbrio e proteção central.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF', 'DMF'], line: 'meio', duty: 'Cobertura e chegada.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Apoio controlado.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Apoio controlado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Reposição e segurança.' }
  ],
  '4-1-2-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Amplitude e diagonal.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Amplitude e último toque.' },
    { id: 'am1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Criar linha de passe.' },
    { id: 'am2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Criação e pressão.' },
    { id: 'dm', label: '1º VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteger o centro.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Bola aérea.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-2-1-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Profundidade.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Diagonal.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS', 'CMF'], line: 'meio', duty: 'Último passe.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Marcação.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Apoio moderado.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Apoio moderado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-2-3-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência e finalização.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF', 'AMF'], line: 'meio', duty: 'Amplitude e criação.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS', 'CMF'], line: 'meio', duty: 'Último passe.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF', 'AMF'], line: 'meio', duty: 'Amplitude e pressão.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída de bola.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-3-1-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio/pivô.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS'], line: 'meio', duty: 'Criação central.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Saída e passe.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Largura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Largura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-1-3-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF', 'AMF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'CMF'], line: 'meio', duty: 'Criação.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF', 'AMF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção única.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-4-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF'], line: 'meio', duty: 'Amplitude e recomposição.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Equilíbrio.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-1-4-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Seguro.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Seguro.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '3-2-4-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência.' },
    { id: 'lw', label: 'ALA E', preferred: ['LWF', 'LMF', 'LB'], line: 'meio', duty: 'Amplitude e pressão.' },
    { id: 'am1', label: 'MEI E', preferred: ['AMF', 'CMF', 'SS'], line: 'meio', duty: 'Criação.' },
    { id: 'am2', label: 'MEI D', preferred: ['AMF', 'CMF', 'SS'], line: 'meio', duty: 'Último passe.' },
    { id: 'rw', label: 'ALA D', preferred: ['RWF', 'RMF', 'RB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB', 'LB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB', 'RB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Linha alta.' }
  ],
  '3-4-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF'], line: 'ataque', duty: 'Amplitude.' },
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF'], line: 'ataque', duty: 'Amplitude.' },
    { id: 'lm', label: 'ALA E', preferred: ['LMF', 'LB', 'LWF'], line: 'meio', duty: 'Vai e volta.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'rm', label: 'ALA D', preferred: ['RMF', 'RB', 'RWF'], line: 'meio', duty: 'Vai e volta.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB', 'LB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB', 'RB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '3-5-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ALA E', preferred: ['LMF', 'LB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'rm', label: 'ALA D', preferred: ['RMF', 'RB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '5-3-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Transição.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'lwb', label: 'ALA E', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'rwb', label: 'ALA D', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '5-2-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF'], line: 'ataque', duty: 'Transição pelo lado.' },
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF'], line: 'ataque', duty: 'Transição pelo lado.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe rápido.' },
    { id: 'lwb', label: 'ALA E', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'rwb', label: 'ALA D', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ]
};

function lineupScoreForSlot(result: AnalysisResult, slot: VisualLineupSlot) {
  const code = result.bestPosition.code;
  const scoreMap = result.teamMap?.sectorScores;
  const base = Number(result.pri?.GER ?? 70);
  let score = base;
  if (slot.preferred.includes(code)) score += 35;
  else if (slot.line === 'defesa' && ['CB', 'LB', 'RB', 'DMF'].includes(code)) score += 12;
  else if (slot.line === 'meio' && ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(code)) score += 14;
  else if (slot.line === 'ataque' && ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(code)) score += 14;
  else score -= 28;

  if (slot.line === 'defesa') score += Number(scoreMap?.marcacao ?? 0) * 0.24 + Number(scoreMap?.cobertura ?? 0) * 0.18;
  if (slot.line === 'meio') score += Number(scoreMap?.passe ?? 0) * 0.18 + Number(scoreMap?.criacao ?? 0) * 0.14 + Number(scoreMap?.marcacao ?? 0) * 0.10;
  if (slot.line === 'ataque') score += Number(scoreMap?.finalizacao ?? 0) * 0.24 + Number(scoreMap?.aceleracao ?? 0) * 0.12 + Number(scoreMap?.criacao ?? 0) * 0.10;
  if (slot.line === 'goleiro') score += code === 'GK' ? 55 : -80;

  return Math.round(score);
}

function buildVisualLineup(history: SavedAnalysis[], formation: TacticalFormation): VisualLineupPick[] {
  const selectedFormation: Exclude<TacticalFormation, 'AUTO'> = formation === 'AUTO' ? '4-2-2-2' : formation;
  const slots = formationVisualLayouts[selectedFormation] ?? formationVisualLayouts['4-2-2-2'];
  const players = uniqueSavedResults(history);
  const used = new Set<string>();
  return slots.map((slot) => {
    const ranked = players
      .filter((player) => !used.has(player.parsed.playerName))
      .map((player) => ({ player, fit: lineupScoreForSlot(player, slot) }))
      .sort((a, b) => b.fit - a.fit);
    const best = ranked[0];
    if (!best || best.fit < 55) return { ...slot, player: null, fit: 0, reason: 'Nenhum jogador salvo encaixa com segurança nesta função.' };
    used.add(best.player.parsed.playerName);
    const exact = slot.preferred.includes(best.player.bestPosition.code);
    const reason = exact
      ? `Encaixe natural em ${best.player.bestPosition.label}.`
      : `Encaixe adaptado: função real ${best.player.teamMap?.functionLabel ?? best.player.buildName}.`;
    return { ...slot, player: best.player, fit: Math.max(0, Math.min(100, Math.round(best.fit / 2))), reason };
  });
}

function VisualLineupPitch({ history, formation, teamStyle }: { history: SavedAnalysis[]; formation: TacticalFormation; teamStyle: TacticalStyle }) {
  const picks = useMemo(() => buildVisualLineup(history, formation), [history, formation]);
  const rows: Array<{ key: VisualLineupSlot['line']; title: string }> = [
    { key: 'ataque', title: 'Ataque' },
    { key: 'meio', title: 'Meio' },
    { key: 'defesa', title: 'Defesa' },
    { key: 'goleiro', title: 'Goleiro' }
  ];
  const filledCount = picks.filter((pick) => pick.player).length;
  const averageFit = picks.length ? Math.round(picks.reduce((sum, pick) => sum + (pick.player ? pick.fit : 0), 0) / Math.max(1, filledCount || picks.length)) : 0;
  return (
    <div className="visual-pitch-card">
      <div className="visual-pitch-head">
        <div>
          <p className="kicker"><LayoutDashboard size={14} /> Escalação visual</p>
          <h3>{formation === 'AUTO' ? 'Mapa automático do elenco' : `Mapa ${formation}`}</h3>
        </div>
        <strong>{filledCount}/11 • {averageFit}/100</strong>
      </div>
      <div className="visual-pitch-meta">
        <span>Estilo: {tacticalStyleName[teamStyle] ?? 'Automático'}</span>
        <span>Arrume o Cofre com titulares e reservas para o encaixe ficar mais preciso.</span>
      </div>
      <div className="visual-pitch-field">
        {rows.map((row) => {
          const items = picks.filter((pick) => pick.line === row.key);
          return (
            <div key={row.key} className={`pitch-line pitch-line-${row.key}`}>
              <span className="pitch-line-title">{row.title}</span>
              <div className="pitch-line-slots">
                {items.map((pick) => (
                  <div key={pick.id} className={pick.player ? 'pitch-player-slot filled' : 'pitch-player-slot empty'}>
                    <span>{pick.label}</span>
                    <strong>{pick.player ? pick.player.parsed.playerName.split(' ').slice(0, 2).join(' ') : 'Vaga'}</strong>
                    <em>{pick.player ? `${pick.player.bestPosition.label} • ${pick.fit}/100` : pick.duty}</em>
                    <small>{pick.player ? pick.reason : 'Salve uma ficha compatível no Cofre.'}</small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="visual-pitch-legend">
        <span><b /> Encaixe natural</span>
        <span><i /> Vaga sem jogador salvo</span>
        <span>O app prioriza função real, não GER alto.</span>
      </div>
    </div>
  );
}

export function TeamFullMapPanel({ history, formation, teamStyle, onFormationChange }: { history: SavedAnalysis[]; formation: TacticalFormation; teamStyle: TacticalStyle; onFormationChange?: (formation: TacticalFormation) => void }) {
  const [teamCenterView, setTeamCenterView] = useState<TeamCenterView>('profissional');
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile>('CONTRA_RAPIDO');
  const [opponentFormation, setOpponentFormation] = useState<TacticalFormation>('4-3-3');
  const [opponentStrength, setOpponentStrength] = useState<OpponentStrength>('VELOCIDADE');
  const [matchState, setMatchState] = useState<MatchState>('EMPATANDO');
  const [teamEnergy, setTeamEnergy] = useState<TeamEnergy>('MEDIA');
  const [opponentPrintPreview, setOpponentPrintPreview] = useState<string | null>(null);
  const [opponentPrintReport, setOpponentPrintReport] = useState<OpponentPrintReport | null>(null);
  const [opponentPrintLoading, setOpponentPrintLoading] = useState(false);
  const opponentPrintObjectUrlRef = useRef<string | null>(null);
  const [savedTeamPlans, setSavedTeamPlans] = useState<Record<string, boolean>>({});

  useEffect(() => () => {
    if (opponentPrintObjectUrlRef.current) {
      URL.revokeObjectURL(opponentPrintObjectUrlRef.current);
      opponentPrintObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    try { setSavedTeamPlans(JSON.parse(readAccountStorage('buildmaster_team_plans_v25_19') || '{}')); } catch { setSavedTeamPlans({}); }
  }, []);

  function toggleSavedTeamPlan(planId: string) {
    setSavedTeamPlans((current) => {
      const next = { ...current, [planId]: !current[planId] };
      try { writeAccountStorage('buildmaster_team_plans_v25_19', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function analyzeOpponentPrint(file: File) {
    setOpponentPrintLoading(true);
    setOpponentPrintReport(null);
    try {
      await validateImageFile(file);
      if (opponentPrintObjectUrlRef.current) URL.revokeObjectURL(opponentPrintObjectUrlRef.current);
      opponentPrintObjectUrlRef.current = URL.createObjectURL(file);
      setOpponentPrintPreview(opponentPrintObjectUrlRef.current);
      const quality = await inspectPrintQuality(file).catch(() => null);
      const processed = await preprocessImage(file, 'sharp');
      const pass = await recognizeWithOcrWorker(processed, { label: 'Adversário • escalação', kind: 'general', cacheKey: await fileDigest(file) });
      const nextReport = readOpponentPrintText(pass.text || '');
      if (quality?.issues.length) nextReport.warnings.unshift(quality.issues[0].message);
      setOpponentPrintReport(nextReport);
    } catch (error) {
      const report = readOpponentPrintText('');
      report.warnings.unshift(error instanceof Error ? error.message : 'Não foi possível ler o print do adversário.');
      setOpponentPrintReport(report);
    } finally {
      setOpponentPrintLoading(false);
    }
  }

  function applyOpponentPrintReading() {
    if (!opponentPrintReport) return;
    if (opponentPrintReport.profile.value) setOpponentProfile(opponentPrintReport.profile.value);
    if (opponentPrintReport.formation.value) setOpponentFormation(opponentPrintReport.formation.value);
    if (opponentPrintReport.strength.value && opponentPrintReport.strength.confidence !== 'baixa') setOpponentStrength(opponentPrintReport.strength.value);
  }

  const report = useMemo(() => buildSquadReport(history, formation, teamStyle), [history, formation, teamStyle]);
  const eliteReport = useMemo(() => buildEliteTeamReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const chemistryReport = useMemo(() => buildSquadChemistryReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const assistedLineup = useMemo(() => buildAssistedLineupReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const opponentReport = useMemo(() => buildOpponentAnalysisReport(history.map((item) => item.result), formation, teamStyle, { profile: opponentProfile, formation: opponentFormation, strength: opponentStrength }), [history, formation, teamStyle, opponentProfile, opponentFormation, opponentStrength]);
  const advancedOpponentReport = useMemo(() => buildAdvancedOpponentReport(history.map((item) => item.result), formation, teamStyle, { profile: opponentProfile, formation: opponentFormation, strength: opponentStrength }), [history, formation, teamStyle, opponentProfile, opponentFormation, opponentStrength]);
  const gamePlan = useMemo(() => opponentReport ? buildGamePlanReport({ matchState, energy: teamEnergy, opponentProfile, ownFormation: formation, ownStyle: teamStyle }, opponentReport) : null, [opponentReport, matchState, teamEnergy, opponentProfile, formation, teamStyle]);
  const rotationReport = useMemo(() => buildSquadRotationReport(history.map((item) => item.result), formation, teamStyle, matchState, teamEnergy), [history, formation, teamStyle, matchState, teamEnergy]);
  const visualLineup = useMemo(() => buildVisualLineup(history, formation), [history, formation]);
  const professionalSquad = useMemo(() => buildProfessionalSquadReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);

  const starterCount = visualLineup.filter((pick) => pick.player).length;
  const averageStarterFit = starterCount
    ? Math.round(visualLineup.reduce((sum, pick) => sum + (pick.player ? pick.fit : 0), 0) / starterCount)
    : 0;
  const strongestSector = chemistryReport?.sectors.reduce((best, sector) => sector.score > best.score ? sector : best, chemistryReport.sectors[0]);
  const weakestSector = chemistryReport?.sectors.reduce((worst, sector) => sector.score < worst.score ? sector : worst, chemistryReport.sectors[0]);
  const tacticalAlerts = [
    ...(report?.warnings ?? []),
    ...(chemistryReport?.weaknesses ?? []),
    ...(eliteReport?.tacticalAlerts ?? [])
  ].filter(Boolean).slice(0, 4);
  const tacticalSuggestions = [
    ...(chemistryReport?.recommendations ?? []),
    ...(report?.suggestions ?? []),
    ...(eliteReport?.upgradePriorities ?? [])
  ].filter(Boolean).slice(0, 4);

  if (!report) {
    return (
      <article className="team-center-empty luxury-panel">
        <div className="team-empty-icon"><Users size={30} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Central tática</p>
        <h3>Monte seu elenco pelo Cofre</h3>
        <p>Salve as fichas para liberar titulares, reservas, setores, entrosamento, banco, substituições e Planos A, B e C.</p>
        <div className="team-empty-steps">
          <span><b>1</b> Salve pelo menos 11 jogadores</span>
          <span><b>2</b> Cubra defesa, meio e ataque</span>
          <span><b>3</b> Volte aqui para montar a central</span>
        </div>
      </article>
    );
  }

  return (
    <article className="squad-map-card team-center-shell">
      <section className="team-center-hero">
        <div className="team-center-hero-copy">
          <p className="kicker"><ShieldCheck size={14} /> Meu Time • Central tática</p>
          <h2>{report.balanceLabel}</h2>
          <p>Veja o essencial primeiro e abra cada camada somente quando precisar ajustar o elenco.</p>
          <div className="team-center-tags">
            <span>{formation === 'AUTO' ? 'Formação assistida' : formation}</span>
            <span>{tacticalStyleName[teamStyle] ?? 'Estilo automático'}</span>
            <span>{starterCount}/11 titulares preenchidos</span>
          </div>
        </div>
        <div className="team-center-main-score">
          <span>Equilíbrio</span>
          <strong>{report.globalScore}</strong>
          <small>/100</small>
          <i><b style={{ width: `${report.globalScore}%` }} /></i>
        </div>
      </section>

      <div className="team-center-summary-grid">
        <button type="button" onClick={() => setTeamCenterView('escalacao')}><span>Titulares</span><strong>{starterCount}/11</strong><small>encaixe médio {averageStarterFit}/100</small></button>
        <button type="button" onClick={() => setTeamCenterView('elenco')}><span>Reservas</span><strong>{rotationReport?.benchCount ?? Math.max(0, report.playerCount - starterCount)}</strong><small>{rotationReport?.benchBalance.label ?? 'Banco em formação'}</small></button>
        <button type="button" onClick={() => setTeamCenterView('entrosamento')}><span>Entrosamento</span><strong>{chemistryReport?.globalScore ?? '—'}</strong><small>{chemistryReport?.chemistryLabel ?? 'Aguardando 11 jogadores'}</small></button>
        <button type="button" onClick={() => setTeamCenterView('planos')}><span>Planos salvos</span><strong>{Object.values(savedTeamPlans).filter(Boolean).length}/3</strong><small>A, B e C</small></button>
      </div>

      <nav className="team-center-tabs" aria-label="Áreas da central tática">
        <button type="button" className={teamCenterView === 'profissional' ? 'active' : ''} onClick={() => setTeamCenterView('profissional')}><ShieldCheck size={17}/><span>Profissional</span></button>
        <button type="button" className={teamCenterView === 'visao' ? 'active' : ''} onClick={() => setTeamCenterView('visao')}><LayoutDashboard size={17}/><span>Visão geral</span></button>
        <button type="button" className={teamCenterView === 'formacoes' ? 'active' : ''} onClick={() => setTeamCenterView('formacoes')}><Layers size={17}/><span>Formações</span></button>
        <button type="button" className={teamCenterView === 'escalacao' ? 'active' : ''} onClick={() => setTeamCenterView('escalacao')}><Target size={17}/><span>Escalação</span></button>
        <button type="button" className={teamCenterView === 'elenco' ? 'active' : ''} onClick={() => setTeamCenterView('elenco')}><Users size={17}/><span>Elenco</span></button>
        <button type="button" className={teamCenterView === 'entrosamento' ? 'active' : ''} onClick={() => setTeamCenterView('entrosamento')}><Layers size={17}/><span>Setores</span></button>
        <button type="button" className={teamCenterView === 'planos' ? 'active' : ''} onClick={() => setTeamCenterView('planos')}><Clock3 size={17}/><span>Planos</span></button>
        <button type="button" className={teamCenterView === 'adversario' ? 'active' : ''} onClick={() => setTeamCenterView('adversario')}><Trophy size={17}/><span>Adversário</span></button>
      </nav>

      {teamCenterView === 'profissional' && professionalSquad && (
        <ProfessionalSquadPanel report={professionalSquad} onApplyFormation={onFormationChange} />
      )}

      {teamCenterView === 'formacoes' && (
        <SectionErrorBoundary area="laboratorio-formacoes"><FormationRoleLabPanel results={history.map((item) => item.result)} activeFormation={formation} activeStyle={teamStyle} /></SectionErrorBoundary>
      )}

      {teamCenterView === 'visao' && (
        <section className="team-overview-layer">
          <div className="team-overview-sector-grid">
            <article><span>Setor mais forte</span><strong>{strongestSector?.label ?? 'Em análise'}</strong><b>{strongestSector?.score ?? '—'}/100</b><small>{strongestSector?.verdict ?? 'Salve mais jogadores para confirmar.'}</small></article>
            <article><span>Setor prioritário</span><strong>{weakestSector?.label ?? 'Em análise'}</strong><b>{weakestSector?.score ?? '—'}/100</b><small>{weakestSector?.verdict ?? 'Aguardando cobertura do elenco.'}</small></article>
            <article><span>Banco</span><strong>{rotationReport?.benchBalance.label ?? 'Em formação'}</strong><b>{rotationReport?.benchBalance.score ?? '—'}/100</b><small>{rotationReport?.missingCoverage[0] ?? 'Sem falta crítica confirmada.'}</small></article>
          </div>

          <div className="team-overview-columns">
            <article className="team-layer-card danger"><div><Target size={18}/><strong>Ameaças e fraquezas</strong></div>{(tacticalAlerts.length ? tacticalAlerts : ['Nenhuma fraqueza crítica foi detectada.']).map((item) => <span key={item}>{item}</span>)}</article>
            <article className="team-layer-card good"><div><Sparkles size={18}/><strong>Sugestões táticas</strong></div>{(tacticalSuggestions.length ? tacticalSuggestions : ['O elenco está equilibrado para a configuração atual.']).map((item) => <span key={item}>{item}</span>)}</article>
          </div>

          {eliteReport && (
            <div className="team-recommendation-banner">
              <div><Sparkles size={19}/><span>Melhor encaixe sugerido</span><strong>{eliteReport.bestFormation} • {eliteReport.bestStyleReason}</strong></div>
              <b>{eliteReport.globalScore}/100</b>
            </div>
          )}

          <details className="team-layer-details">
            <summary>Ver relatório geral por fases</summary>
            <div className="team-layer-details-body">
              <div className="squad-phase-grid">{PHASE_KEYS.map((key) => <div key={key} className="squad-phase-item"><span>{teamMapLabels[key]}</span><strong>{report.phaseScores[key]}</strong><i><b style={{ width: `${report.phaseScores[key]}%` }} /></i></div>)}</div>
              <div className="squad-leader-grid">{report.topByPhase.slice(0, 4).map((item) => <div key={item.title} className="squad-leader-item"><span>{item.title}</span><strong>{item.player}</strong><em>{item.position} • {item.score}/100 • {item.functionLabel}</em></div>)}</div>
              <div className="squad-plan-box"><strong>Plano-base do time</strong>{report.gamePlan.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </details>
        </section>
      )}

      {teamCenterView === 'escalacao' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Titulares e escalação</p><h3>Mapa dos 11 e alternativas assistidas</h3></div><span>{starterCount}/11 preenchidos</span></div>
          <FormationMiniBoard history={history} formation={formation} />
          <VisualLineupPitch history={history} formation={formation} teamStyle={teamStyle} />

          {assistedLineup && (
            <details className="team-layer-details" open={starterCount < 11}>
              <summary>Comparar escalações assistidas</summary>
              <div className="team-layer-details-body">
                {assistedLineup.warning && <div className="squad-alert-box"><strong>Escalação ainda incompleta</strong><span>{assistedLineup.warning}</span></div>}
                <div className="assisted-option-grid">
                  {assistedLineup.options.map((option) => (
                    <article key={option.id} className={`assisted-option-card ${option.id}`}>
                      <div className="assisted-option-head"><div><span>{option.title}</span><strong>{option.formation} • {tacticalStyleName[option.style]}</strong></div><b>{option.score}/100</b></div>
                      <p>{option.subtitle}</p>
                      <div className="assisted-mini-scores"><span>Entrosamento <b>{option.chemistry}</b></span><span>Estilo <b>{option.styleFit}</b></span><span>{option.complete ? '11/11 completos' : 'Há vagas abertas'}</span></div>
                      <div className="assisted-lineup-list">{option.lineup.map((pick) => <span key={pick.slot.id}><b>{pick.slot.label}</b><em>{pick.playerName ?? 'Vaga aberta'} • {pick.score}/100</em></span>)}</div>
                      <details><summary>Por que esta opção?</summary><p>{option.reason}</p>{option.changes.map((item) => <span key={item}>{item}</span>)}<small>{option.decisionNote}</small></details>
                    </article>
                  ))}
                </div>
                <div className="squad-suggestion-box"><strong>Recomendação assistida</strong><span>{assistedLineup.recommendation}</span><span>Nada é aplicado automaticamente.</span></div>
              </div>
            </details>
          )}
        </section>
      )}

      {teamCenterView === 'elenco' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Elenco e banco</p><h3>Titulares, reservas e substituições</h3></div><span>{rotationReport?.squadCount ?? report.playerCount} jogadores</span></div>

          <div className="team-starter-list">
            {visualLineup.map((pick) => <article key={pick.id} className={pick.player ? '' : 'missing'}><span>{pick.label}</span><strong>{pick.player?.parsed.playerName ?? 'Vaga aberta'}</strong><small>{pick.player ? `${pick.player.bestPosition.label} • encaixe ${pick.fit}/100` : pick.reason}</small></article>)}
          </div>

          {rotationReport && (
            <>
              <div className="opponent-score-strip"><span>Elenco <b>{rotationReport.squadCount}</b></span><span>Titulares <b>{rotationReport.starterCount}/11</b></span><span>Banco <b>{rotationReport.benchCount}</b></span><span>Rotação <b>{rotationReport.rotationScore}/100</b></span></div>
              <div className="rotation-grid">
                <article className="rotation-card"><strong>Banco disponível</strong>{rotationReport.bench.length ? rotationReport.bench.map((item)=><div key={item.player.id}><span>{item.player.name} • {item.player.positionLabel}</span><b>{item.label}</b><small>{item.reason}</small></div>) : <p>Salve mais de 11 jogadores no Cofre para formar o banco.</p>}</article>
                <article className="rotation-card"><strong>Coberturas que faltam</strong>{(rotationReport.missingCoverage.length ? rotationReport.missingCoverage : ['O elenco salvo cobre os principais setores.']).map((item)=><span key={item}>{item}</span>)}</article>
              </div>

              <article className="rotation-card"><strong>Substituições com jogadores reais</strong><div className="real-sub-grid">{rotationReport.substitutions.length ? rotationReport.substitutions.map((sub)=><div key={`${sub.outPlayer}-${sub.inPlayer}`}><span>{sub.minute} • prioridade {sub.priority} • {sub.score}/100</span><b>{sub.outPlayer} → {sub.inPlayer}</b><small>{sub.trigger}. {sub.reason}</small></div>) : <p>Adicione reservas ao Cofre para receber trocas nominais.</p>}</div></article>

              <details className="team-layer-details"><summary>Ver cobertura, reservas e instruções individuais</summary><div className="team-layer-details-body">
                <article className="rotation-card"><strong>Melhor reserva por titular</strong><div className="real-sub-grid">{rotationReport.reserveByStarter.map((item)=><div key={`${item.starter}-${item.reserve ?? 'sem-reserva'}`}><span>{item.level} • encaixe {item.fit}/100</span><b>{item.starter} → {item.reserve ?? 'Sem reserva segura'}</b><small>{item.reason}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Cobertura por posição</strong><div className="real-sub-grid">{rotationReport.positionCoverage.map((item)=><div key={item.position}><span>{item.status} • {item.score}/100</span><b>{item.label} • {item.total} opção(ões)</b><small>{item.warning}{item.players.length ? ` ${item.players.join(', ')}.` : ''}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Instruções individuais</strong><div className="real-sub-grid">{rotationReport.instructions.map((item)=><div key={`${item.player}-${item.instruction}`}><span>{item.instruction} • confiança {item.confidence}/100</span><b>{item.player}</b><small>{item.reason}{item.warning ? ` ${item.warning}` : ''}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Equilíbrio do banco</strong><div className="chemistry-head"><div><span>{rotationReport.benchBalance.label}</span></div><strong>{rotationReport.benchBalance.score}/100</strong></div><div className="real-sub-grid">{rotationReport.benchBalance.dimensions.map((item)=><div key={item.key}><span>{item.status}</span><b>{item.label} • {item.score}/100</b><small>{item.note}</small></div>)}</div></article>
              </div></details>
            </>
          )}
        </section>
      )}

      {teamCenterView === 'entrosamento' && chemistryReport && (
        <section className="team-layer-section chemistry-panel">
          <div className="chemistry-head"><div><p className="kicker"><Users size={14}/> Setores e entrosamento</p><h3>{chemistryReport.chemistryLabel}</h3><span>{chemistryReport.selectedCount}/11 analisados • estilo {chemistryReport.styleFit}/100</span></div><strong>{chemistryReport.globalScore}/100</strong></div>
          <div className="chemistry-sector-grid">{chemistryReport.sectors.map((sector) => <div key={sector.key} className="chemistry-sector-card"><span>{sector.label}</span><strong>{sector.score}/100</strong><i><b style={{ width: `${sector.score}%` }} /></i><small>{sector.verdict}</small></div>)}</div>
          <div className="chemistry-columns"><div className="chemistry-box good"><strong>Forças coletivas</strong>{(chemistryReport.strengths.length ? chemistryReport.strengths : ['Nenhuma força dominante confirmada.']).map((item) => <span key={item}>{item}</span>)}</div><div className="chemistry-box warn"><strong>Fraquezas coletivas</strong>{(chemistryReport.weaknesses.length ? chemistryReport.weaknesses : ['Nenhuma fraqueza crítica detectada.']).map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="squad-suggestion-box"><strong>Sugestões para os 11 juntos</strong><span>{chemistryReport.styleVerdict}</span>{chemistryReport.recommendations.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>

          <details className="team-layer-details"><summary>Ver sinergias, conflitos, corredores e linhas</summary><div className="team-layer-details-body">
            {!!chemistryReport.synergies.length && <div className="chemistry-pair-grid">{chemistryReport.synergies.map((item) => <div key={`${item.title}-${item.players}`} className="chemistry-pair-card synergy"><span>{item.title}</span><strong>{item.players}</strong><em>{item.score}/100</em><small>{item.reason}</small></div>)}</div>}
            {!!chemistryReport.conflicts.length && <div className="chemistry-pair-grid">{chemistryReport.conflicts.map((item) => <div key={`${item.title}-${item.players}`} className={`chemistry-pair-card conflict ${item.severity}`}><span>{item.title}</span><strong>{item.players}</strong><em>Risco {item.severity}</em><small>{item.reason}</small></div>)}</div>}
            <div className="chemistry-role-grid">{chemistryReport.roleBalance.map((item) => <div key={item.role} className={`chemistry-role-card ${item.status}`}><span>{item.status === 'ok' ? '✓ Equilibrado' : item.status === 'falta' ? '⚠ Falta' : '↔ Excesso'}</span><strong>{item.role}</strong><em>{item.count} no time • ideal {item.ideal}</em></div>)}</div>
            <div className="sector-intelligence-grid">{chemistryReport.corridors.map((item) => <div key={item.key} className="sector-intelligence-card"><strong>{item.label}</strong><span>Ataque {item.attack} • Defesa {item.defense}</span><span>Criação {item.creation} • Cobertura {item.coverage}</span><em>Risco {item.risk}/100</em><small>{item.verdict}</small></div>)}</div>
            <div className="sector-intelligence-grid">{chemistryReport.lines.map((item) => <div key={item.key} className="sector-intelligence-card"><strong>{item.label}</strong><span>Com bola {item.withBall} • Sem bola {item.withoutBall}</span><span>Conexão {item.connection} • Risco {item.risk}</span><small>{item.verdict}</small></div>)}</div>
          </div></details>
        </section>
      )}

      {teamCenterView === 'planos' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Plano de jogo</p><h3>Planos A, B e C e substituições por contexto</h3></div><span>{Object.values(savedTeamPlans).filter(Boolean).length} salvo(s)</span></div>
          {gamePlan && (
            <>
              <div className="opponent-input-grid">
                <label><span>Situação do placar</span><select value={matchState} onChange={(event) => setMatchState(event.target.value as MatchState)}><option value="EMPATANDO">Empatando</option><option value="VENCENDO_1">Vencendo por 1</option><option value="VENCENDO_2">Vencendo por 2+</option><option value="PERDENDO_1">Perdendo por 1</option><option value="PERDENDO_2">Perdendo por 2+</option></select></label>
                <label><span>Energia do time</span><select value={teamEnergy} onChange={(event) => setTeamEnergy(event.target.value as TeamEnergy)}><option value="ALTA">Alta</option><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option></select></label>
                <div className="game-plan-score"><span>Controle <b>{gamePlan.controlScore}</b></span><span>Risco <b>{gamePlan.riskScore}</b></span></div>
              </div>
              <div className="squad-alert-box"><strong>Contexto atual</strong><span>{gamePlan.headline}</span></div>
              <div className="game-phase-grid">{gamePlan.phases.map((phase) => <article key={phase.moment} className="game-phase-card"><div><span>{phase.moment}</span><strong>{phase.title}</strong></div><p>{phase.objective}</p><details><summary>Ver instruções e trocas</summary><ul>{phase.instructions.map((item) => <li key={item}>{item}</li>)}</ul>{phase.substitutions.length > 0 && <div className="substitution-list"><b>Substituições por gatilho</b>{phase.substitutions.map((sub) => <div key={`${sub.minute}-${sub.trigger}`}><span>{sub.minute} • {sub.priority}</span><strong>{sub.outProfile} → {sub.inProfile}</strong><small>{sub.trigger}. {sub.objective}</small></div>)}</div>}</details></article>)}</div>
            </>
          )}

          {rotationReport && (
            <div className="rotation-card team-plans-card"><strong>Planos A, B e C</strong><div className="game-phase-grid">{rotationReport.plans.map((plan) => <article key={plan.id} className="game-phase-card"><div><span>{plan.id} • {plan.formation} • {tacticalStyleName[plan.style]}</span><strong>{plan.title}</strong></div><p>{plan.purpose}</p><small>Nota do plano: {plan.score}/100</small><details><summary>Ver mudanças e orientações</summary><ul>{plan.changes.map((item) => <li key={item}>{item}</li>)}</ul><b>Orientações</b><ul>{plan.instructions.map((item) => <li key={item}>{item}</li>)}</ul><small>{plan.decisionNote}</small></details><button type="button" onClick={() => toggleSavedTeamPlan(plan.id)}>{savedTeamPlans[plan.id] ? <CheckCircle2 size={15}/> : <Save size={15}/>} {savedTeamPlans[plan.id] ? 'Plano salvo' : 'Salvar plano'}</button></article>)}</div></div>
          )}
        </section>
      )}

      {teamCenterView === 'adversario' && opponentReport && (
        <section className="team-layer-section opponent-analysis-panel">
          <div className="chemistry-head"><div><p className="kicker"><Target size={14}/> Ameaças e fraquezas</p><h3>Análise do adversário</h3><span>Informe o perfil ou leia um print. Nada altera sua escalação automaticamente.</span></div><strong>{opponentReport.matchupScore}/100</strong></div>

          <div className="opponent-print-reader">
            <div className="opponent-print-actions"><label className="opponent-print-upload"><ScanText size={18}/><span>{opponentPrintLoading ? 'Lendo print...' : 'Ler escalação por print'}</span><input type="file" accept="image/*" disabled={opponentPrintLoading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void analyzeOpponentPrint(file); event.currentTarget.value=''; }}/></label><small>A leitura cria um rascunho para sua confirmação.</small></div>
            {opponentPrintPreview && <img className="opponent-print-preview" src={opponentPrintPreview} alt="Print do adversário"/>}
            {opponentPrintReport && <div className="opponent-print-review"><div className="opponent-print-confidence"><strong>Confiança geral: {opponentPrintReport.overallConfidence}</strong><span>{opponentPrintReport.visibleNames.length} nome(s) possivelmente visível(is)</span></div><div className="opponent-print-fields"><span><b>Formação</b>{opponentPrintReport.formation.value ?? 'Não confirmada'}<small>{opponentPrintReport.formation.confidence}</small></span><span><b>Estilo</b>{opponentPrintReport.profile.value ? OPPONENT_PROFILE_LABELS[opponentPrintReport.profile.value] : 'Não confirmado'}<small>{opponentPrintReport.profile.confidence}</small></span><span><b>Força</b>{opponentPrintReport.strength.value ? OPPONENT_STRENGTH_LABELS[opponentPrintReport.strength.value] : 'Não confirmada'}<small>{opponentPrintReport.strength.confidence}</small></span></div>{opponentPrintReport.warnings.map((warning) => <p key={warning}>{warning}</p>)}<button type="button" onClick={applyOpponentPrintReading}><CheckCircle2 size={16}/> Aplicar leitura confirmada</button></div>}
          </div>

          <div className="opponent-input-grid">
            <label><span>Estilo do adversário</span><select value={opponentProfile} onChange={(event) => setOpponentProfile(event.target.value as OpponentProfile)}>{Object.entries(OPPONENT_PROFILE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Formação observada</span><select value={opponentFormation} onChange={(event) => setOpponentFormation(event.target.value as TacticalFormation)}>{['AUTO','4-2-2-2','4-3-3','4-1-2-3','4-2-1-3','4-2-3-1','4-3-1-2','4-1-3-2','4-4-2','4-1-4-1','3-2-4-1','3-4-3','3-5-2','5-3-2','5-2-3'].map((value) => <option key={value} value={value}>{value === 'AUTO' ? 'Ainda não sei' : value}</option>)}</select></label>
            <label><span>Maior força percebida</span><select value={opponentStrength} onChange={(event) => setOpponentStrength(event.target.value as OpponentStrength)}>{Object.entries(OPPONENT_STRENGTH_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className="opponent-score-strip"><span>Ameaça <b>{opponentReport.threatScore}/100</b></span><span>Seu encaixe <b>{opponentReport.matchupScore}/100</b></span><span>{opponentReport.verdict}</span></div>
          <div className="chemistry-columns"><div className="chemistry-box warn"><strong>Principais ameaças</strong>{opponentReport.mainThreats.map((item) => <span key={item}>{item}</span>)}</div><div className="chemistry-box good"><strong>Onde explorar</strong>{opponentReport.exploitableWeaknesses.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="opponent-adjustment-grid">{opponentReport.adjustments.slice(0, 6).map((item) => <article key={`${item.area}-${item.title}`} className={`opponent-adjustment-card priority-${item.priority}`}><div><span>{item.area}</span><b>{item.priority}</b></div><strong>{item.title}</strong><p>{item.action}</p><small>{item.reason}</small></article>)}</div>
          <div className="squad-suggestion-box"><strong>Resposta assistida</strong><span>{opponentReport.recommendedFormation} • {tacticalStyleName[opponentReport.recommendedStyle]}</span><span>{opponentReport.comparisonNote}</span></div>

          {advancedOpponentReport && <details className="team-layer-details"><summary>Ver comparação avançada, duelos e mapas</summary><div className="team-layer-details-body"><div className="sector-comparison-grid">{advancedOpponentReport.sectorComparisons.map((item) => <article key={item.key} className={`sector-comparison-card ${item.status}`}><div><span>{item.label}</span><b>{item.advantage}/100</b></div><small>Seu setor {item.ownScore} × Rival {item.opponentScore}</small><p>{item.verdict}</p></article>)}</div><div className="duel-grid">{advancedOpponentReport.duels.map((duel,index) => <article key={`${duel.ownPlayer}-${index}`} className={`duel-card ${duel.status}`}><div><span>{duel.zone}</span><b>{duel.duelScore}/100</b></div><strong>{duel.ownPlayer}</strong><small>{duel.ownRole} × {duel.opponentRole}</small><p>{duel.reason}</p><em>{duel.adjustment}</em></article>)}</div><div className="advanced-map-columns"><div className="advanced-opponent-block threat-map"><strong>Mapa de ameaças</strong>{advancedOpponentReport.threats.map((item) => <article key={`${item.zone}-${item.title}`} className={`map-item ${item.severity}`}><div><span>{item.zone}</span><b>{item.level}/100</b></div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.protection}</small></article>)}</div><div className="advanced-opponent-block weakness-map"><strong>Mapa de fraquezas</strong>{advancedOpponentReport.weaknesses.map((item) => <article key={`${item.zone}-${item.title}`} className="map-item opportunity"><div><span>{item.zone}</span><b>{item.opportunity}/100</b></div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.howToExplore}</small></article>)}</div></div></div></details>}
        </section>
      )}
    </article>
  );
}
