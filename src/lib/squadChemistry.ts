import type { AnalysisResult, TacticalFormation, TacticalStyle, TeamMapPhaseScores } from './analyzer';
import { buildEliteTeamReport } from './teamOptimizer';

export type SquadSectorScore = {
  key: 'defesa' | 'meio' | 'ataque' | 'transicao' | 'amplitude' | 'equilibrio';
  label: string;
  score: number;
  verdict: string;
};

export type SquadChemistryReport = {
  selectedCount: number;
  complete: boolean;
  globalScore: number;
  chemistryLabel: string;
  sectors: SquadSectorScore[];
  strengths: string[];
  weaknesses: string[];
  synergies: Array<{ title: string; players: string; score: number; reason: string }>;
  conflicts: Array<{ title: string; players: string; severity: 'leve' | 'media' | 'alta'; reason: string }>;
  roleBalance: Array<{ role: string; count: number; ideal: string; status: 'ok' | 'atenção' | 'falta' }>;
  styleFit: number;
  styleVerdict: string;
  recommendations: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const score = (player: AnalysisResult, key: keyof TeamMapPhaseScores) => Number(player.teamMap?.sectorScores?.[key] ?? 55);
const roleText = (player: AnalysisResult) => `${player.teamMap?.functionLabel ?? ''} ${player.buildName ?? ''} ${player.parsed.playstyle ?? ''}`.toLowerCase();

function styleScore(players: AnalysisResult[], style: TacticalStyle) {
  if (style === 'AUTO') return clamp(avg(players.map((p) => avg([score(p, 'passe'), score(p, 'criacao'), score(p, 'aceleracao'), score(p, 'marcacao')]))));
  if (style === 'POSSE_DE_BOLA') return clamp(avg(players.map((p) => avg([score(p, 'passe'), score(p, 'saidaDeBola'), score(p, 'criacao')]))));
  if (style === 'CONTRA_ATAQUE_RAPIDO') return clamp(avg(players.map((p) => avg([score(p, 'aceleracao'), score(p, 'finalizacao'), score(p, 'passe')]))));
  if (style === 'CONTRA_ATAQUE') return clamp(avg(players.map((p) => avg([score(p, 'marcacao'), score(p, 'cobertura'), score(p, 'finalizacao')]))));
  if (style === 'POR_FORA') return clamp(avg(players.map((p) => avg([score(p, 'aceleracao'), score(p, 'passe'), score(p, 'jogoAereo')]))));
  return clamp(avg(players.map((p) => avg([score(p, 'saidaDeBola'), score(p, 'fisico'), score(p, 'jogoAereo')]))));
}

function verdict(value: number, high: string, medium: string, low: string) {
  return value >= 82 ? high : value >= 70 ? medium : low;
}

export function buildSquadChemistryReport(results: AnalysisResult[], formation: TacticalFormation, style: TacticalStyle): SquadChemistryReport | null {
  const elite = buildEliteTeamReport(results, formation, style);
  if (!elite) return null;

  const selected = elite.lineup
    .map((pick) => ({ pick, player: results.find((result) => result.parsed.playerName === pick.playerName) }))
    .filter((item): item is { pick: typeof elite.lineup[number]; player: AnalysisResult } => Boolean(item.player));
  const players = selected.map((item) => item.player);
  if (!players.length) return null;

  const defense = selected.filter(({ pick }) => ['cobertura', 'marcacao'].includes(pick.slot.phase)).map((item) => item.player);
  const midfield = selected.filter(({ pick }) => ['saidaDeBola', 'criacao'].includes(pick.slot.phase)).map((item) => item.player);
  const attack = selected.filter(({ pick }) => ['aceleracao', 'finalizacao'].includes(pick.slot.phase)).map((item) => item.player);

  const defenseScore = clamp(avg(defense.map((p) => avg([score(p, 'marcacao'), score(p, 'cobertura'), score(p, 'fisico'), score(p, 'jogoAereo')]))));
  const midfieldScore = clamp(avg(midfield.map((p) => avg([score(p, 'saidaDeBola'), score(p, 'passe'), score(p, 'criacao'), score(p, 'marcacao')]))));
  const attackScore = clamp(avg(attack.map((p) => avg([score(p, 'finalizacao'), score(p, 'aceleracao'), score(p, 'criacao'), score(p, 'passe')]))));
  const transitionScore = clamp(avg(players.map((p) => avg([score(p, 'aceleracao'), score(p, 'passe'), score(p, 'cobertura')]))));

  const widePlayers = players.filter((p) => ['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(p.bestPosition.code));
  const widthScore = clamp(avg(widePlayers.map((p) => avg([score(p, 'aceleracao'), score(p, 'passe'), score(p, 'cobertura')])) || [45]));

  const phaseAverages = ['marcacao','cobertura','saidaDeBola','passe','criacao','aceleracao','finalizacao','jogoAereo','fisico']
    .map((key) => avg(players.map((p) => score(p, key as keyof TeamMapPhaseScores))));
  const spread = Math.max(...phaseAverages) - Math.min(...phaseAverages);
  const balanceScore = clamp(96 - spread * 1.4 - Math.max(0, 11 - players.length) * 4);
  const fit = styleScore(players, style);

  const creators = players.filter((p) => /criador|armador|orquestrador|clássico|classico|organizador/.test(roleText(p)));
  const destroyers = players.filter((p) => /destruidor|primeiro volante|marcador|combate|proteção/.test(roleText(p)));
  const finishers = players.filter((p) => /artilheiro|finalizador|homem de área|homem de area/.test(roleText(p)) || score(p, 'finalizacao') >= 80);
  const runners = players.filter((p) => /box|infiltra|ponta|ala|móvel|movel/.test(roleText(p)) || score(p, 'aceleracao') >= 82);
  const builders = players.filter((p) => /construtor|orquestrador|defensor criativo|saída|saida/.test(roleText(p)) || score(p, 'saidaDeBola') >= 80);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (defenseScore >= 80) strengths.push('Última linha forte em marcação, cobertura e duelos.'); else if (defenseScore < 70) weaknesses.push('A defesa apresenta risco em cobertura, físico ou jogo aéreo.');
  if (midfieldScore >= 80) strengths.push('Meio-campo oferece boa saída, passe e criação.'); else if (midfieldScore < 70) weaknesses.push('O meio-campo pode perder controle e deixar o ataque isolado.');
  if (attackScore >= 80) strengths.push('Ataque combina criação, aceleração e poder de finalização.'); else if (attackScore < 70) weaknesses.push('O ataque tem pouca profundidade, criação ou presença de gol.');
  if (widthScore >= 78) strengths.push('O time possui amplitude suficiente pelos dois lados.'); else if (widthScore < 65) weaknesses.push('Há pouca amplitude; o time pode ficar previsível pelo centro.');
  if (transitionScore < 70) weaknesses.push('A transição entre recuperação e ataque tende a ser lenta.');
  if (balanceScore >= 82) strengths.push('Os setores estão bem distribuídos, sem dependência excessiva de uma única característica.');

  const synergies: SquadChemistryReport['synergies'] = [];
  if (destroyers.length && builders.length) synergies.push({ title: 'Proteção + construção', players: `${destroyers[0].parsed.playerName} + ${builders[0].parsed.playerName}`, score: clamp(avg([score(destroyers[0], 'marcacao'), score(builders[0], 'saidaDeBola')])), reason: 'Um recupera e protege; o outro dá qualidade ao primeiro passe.' });
  if (creators.length && finishers.length) synergies.push({ title: 'Criador + finalizador', players: `${creators[0].parsed.playerName} + ${finishers[0].parsed.playerName}`, score: clamp(avg([score(creators[0], 'criacao'), score(finishers[0], 'finalizacao')])), reason: 'A criação entre linhas encontra um jogador preparado para concluir.' });
  if (runners.length >= 2) synergies.push({ title: 'Ataque ao espaço', players: `${runners[0].parsed.playerName} + ${runners[1].parsed.playerName}`, score: clamp(avg([score(runners[0], 'aceleracao'), score(runners[1], 'aceleracao')])), reason: 'Dois jogadores oferecem profundidade e linhas de passe em velocidade.' });
  if (defense.length >= 2) {
    const cover = [...defense].sort((a,b) => score(b,'cobertura') - score(a,'cobertura'))[0];
    const combat = [...defense].sort((a,b) => score(b,'marcacao') + score(b,'fisico') - score(a,'marcacao') - score(a,'fisico'))[0];
    if (cover.parsed.internalId !== combat.parsed.internalId) synergies.push({ title: 'Cobertura + combate', players: `${cover.parsed.playerName} + ${combat.parsed.playerName}`, score: clamp(avg([score(cover,'cobertura'), score(combat,'marcacao'), score(combat,'fisico')])), reason: 'Um antecipa e cobre espaço; o outro ganha o duelo direto.' });
  }

  const conflicts: SquadChemistryReport['conflicts'] = [];
  if (destroyers.length >= 3) conflicts.push({ title: 'Excesso de contenção', players: destroyers.slice(0,3).map((p) => p.parsed.playerName).join(', '), severity: 'media', reason: 'Muitos jogadores de combate podem reduzir passe e criação no meio.' });
  if (creators.length >= 4) conflicts.push({ title: 'Funções criativas repetidas', players: creators.slice(0,4).map((p) => p.parsed.playerName).join(', '), severity: 'leve', reason: 'Há muitos jogadores pedindo a bola no mesmo setor e pouca ruptura.' });
  if (finishers.length === 0) conflicts.push({ title: 'Sem referência de gol', players: 'Ataque', severity: 'alta', reason: 'A escalação não possui um finalizador claro para transformar criação em gol.' });
  if (widePlayers.length < 2) conflicts.push({ title: 'Corredores laterais vazios', players: 'Laterais e pontas', severity: 'alta', reason: 'O adversário pode fechar o centro sem ser ameaçado por fora.' });
  if (defenseScore < 68 && style === 'CONTRA_ATAQUE_RAPIDO') conflicts.push({ title: 'Linha vulnerável', players: 'Defesa', severity: 'alta', reason: 'O estilo acelera o jogo, mas a última linha não sustenta bem transições e coberturas.' });

  const roleBalance = [
    { role: 'Proteção defensiva', count: destroyers.length, ideal: '1–2', status: destroyers.length >= 1 && destroyers.length <= 2 ? 'ok' : destroyers.length === 0 ? 'falta' : 'atenção' },
    { role: 'Construção de jogada', count: builders.length, ideal: '1–3', status: builders.length >= 1 && builders.length <= 3 ? 'ok' : builders.length === 0 ? 'falta' : 'atenção' },
    { role: 'Criação entre linhas', count: creators.length, ideal: '1–2', status: creators.length >= 1 && creators.length <= 2 ? 'ok' : creators.length === 0 ? 'falta' : 'atenção' },
    { role: 'Ruptura e profundidade', count: runners.length, ideal: '2–4', status: runners.length >= 2 && runners.length <= 4 ? 'ok' : runners.length < 2 ? 'falta' : 'atenção' },
    { role: 'Finalização', count: finishers.length, ideal: '1–3', status: finishers.length >= 1 && finishers.length <= 3 ? 'ok' : finishers.length === 0 ? 'falta' : 'atenção' }
  ] as SquadChemistryReport['roleBalance'];

  const recommendations: string[] = [];
  if (weaknesses.length) recommendations.push(...weaknesses.map((item) => `Corrigir: ${item}`));
  if (!creators.length) recommendations.push('Use pelo menos um MAT/MLG/SA com criação e passe para ligar meio e ataque.');
  if (!destroyers.length) recommendations.push('Inclua um VOL ou defensor de proteção para cobrir laterais e segurar contra-ataques.');
  if (!finishers.length) recommendations.push('Escolha um CA/SA com finalização alta para ser a referência de gol.');
  if (style === 'POSSE_DE_BOLA' && midfieldScore < 78) recommendations.push('Para Posse, aumente passe, controle e saída de bola no eixo ZAG–VOL–MLG.');
  if (style === 'CONTRA_ATAQUE_RAPIDO' && transitionScore < 78) recommendations.push('Para Contra-ataque rápido, aumente aceleração e passe vertical em pelo menos dois jogadores de frente.');
  if (style === 'POR_FORA' && widthScore < 76) recommendations.push('Para Por fora, use laterais/alas com resistência e pontas capazes de criar superioridade no corredor.');
  if (style === 'PASSE_LONGO' && avg(players.map((p) => score(p,'jogoAereo'))) < 74) recommendations.push('Para Passe longo, adicione alvo físico e jogadores fortes na segunda bola.');
  if (!recommendations.length) recommendations.push('O time está equilibrado. Ajuste fichas apenas para especializar o estilo sem destruir a complementaridade atual.');

  const sectors: SquadSectorScore[] = [
    { key: 'defesa', label: 'Defesa', score: defenseScore, verdict: verdict(defenseScore, 'Setor seguro e complementar.', 'Competitivo, mas ainda ajustável.', 'Setor vulnerável em jogos difíceis.') },
    { key: 'meio', label: 'Meio-campo', score: midfieldScore, verdict: verdict(midfieldScore, 'Controla e conecta os setores.', 'Funciona com apoio da estrutura.', 'Pode perder o controle da partida.') },
    { key: 'ataque', label: 'Ataque', score: attackScore, verdict: verdict(attackScore, 'Cria e finaliza com qualidade.', 'Tem recursos, mas depende do encaixe.', 'Pouca ameaça ou eficiência de gol.') },
    { key: 'transicao', label: 'Transição', score: transitionScore, verdict: verdict(transitionScore, 'Recupera e acelera com fluidez.', 'Transição suficiente para competir.', 'Demora para transformar defesa em ataque.') },
    { key: 'amplitude', label: 'Cobertura dos lados', score: widthScore, verdict: verdict(widthScore, 'Dois corredores bem ocupados.', 'Amplitude funcional.', 'Laterais ou pontas deixam corredores frágeis.') },
    { key: 'equilibrio', label: 'Equilíbrio geral', score: balanceScore, verdict: verdict(balanceScore, 'Funções complementares e poucos excessos.', 'Boa base com alguns desequilíbrios.', 'Funções repetidas ou setores descobertos.') }
  ];

  const globalScore = clamp(avg([defenseScore, midfieldScore, attackScore, transitionScore, widthScore, balanceScore, fit]));
  return {
    selectedCount: players.length,
    complete: players.length === 11,
    globalScore,
    chemistryLabel: globalScore >= 86 ? 'Entrosamento de elite' : globalScore >= 78 ? 'Time muito competitivo' : globalScore >= 68 ? 'Boa base com ajustes necessários' : 'Time desequilibrado ou incompleto',
    sectors,
    strengths: strengths.slice(0,5),
    weaknesses: weaknesses.slice(0,5),
    synergies: synergies.sort((a,b) => b.score - a.score).slice(0,5),
    conflicts: conflicts.slice(0,5),
    roleBalance,
    styleFit: fit,
    styleVerdict: fit >= 82 ? 'O elenco combina muito bem com o estilo selecionado.' : fit >= 72 ? 'O estilo funciona, mas alguns jogadores exigem compensação.' : 'O elenco atual não aproveita plenamente o estilo selecionado.',
    recommendations: recommendations.slice(0,7)
  };
}
