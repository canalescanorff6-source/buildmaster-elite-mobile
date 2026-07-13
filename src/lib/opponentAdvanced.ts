import type { AnalysisResult, TacticalFormation, TacticalStyle, TeamMapPhaseScores } from './analyzer';
import { buildEliteTeamReport } from './teamOptimizer';
import { buildSquadChemistryReport } from './squadChemistry';
import type { OpponentAnalysisInput, OpponentProfile, OpponentStrength } from './opponentAnalysis';

export type AdvancedSectorComparison = {
  key: 'defesa' | 'meio' | 'ataque';
  label: string;
  ownScore: number;
  opponentScore: number;
  advantage: number;
  status: 'vantagem' | 'equilibrado' | 'risco';
  verdict: string;
};

export type IndividualDuel = {
  zone: 'esquerda' | 'centro' | 'direita';
  ownPlayer: string;
  ownRole: string;
  opponentRole: string;
  ownScore: number;
  opponentScore: number;
  duelScore: number;
  status: 'favorável' | 'equilibrado' | 'perigoso';
  reason: string;
  adjustment: string;
};

export type ThreatMapItem = {
  zone: 'esquerda' | 'centro' | 'direita' | 'área' | 'saída';
  level: number;
  severity: 'alta' | 'média' | 'baixa';
  title: string;
  reason: string;
  protection: string;
};

export type WeaknessMapItem = {
  zone: 'esquerda' | 'centro' | 'direita' | 'entrada da área' | 'costas da defesa';
  opportunity: number;
  title: string;
  reason: string;
  howToExplore: string;
};

export type AdvancedOpponentReport = {
  sectorComparisons: AdvancedSectorComparison[];
  duels: IndividualDuel[];
  threats: ThreatMapItem[];
  weaknesses: WeaknessMapItem[];
  overallSectorEdge: number;
  duelEdge: number;
  mainWarning: string;
  bestOpportunity: string;
  confidenceNote: string;
  locks: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const score = (player: AnalysisResult, key: keyof TeamMapPhaseScores) => Number(player.teamMap?.sectorScores?.[key] ?? 55);

const profileBase: Record<OpponentProfile, { defense: number; midfield: number; attack: number; left: number; center: number; right: number; aerial: number; press: number }> = {
  POSSE: { defense: 75, midfield: 88, attack: 79, left: 77, center: 90, right: 77, aerial: 64, press: 84 },
  CONTRA_RAPIDO: { defense: 72, midfield: 77, attack: 90, left: 85, center: 86, right: 85, aerial: 67, press: 80 },
  CONTRA_LONGO: { defense: 82, midfield: 72, attack: 84, left: 69, center: 86, right: 69, aerial: 89, press: 66 },
  POR_FORA: { defense: 72, midfield: 74, attack: 86, left: 91, center: 72, right: 91, aerial: 82, press: 72 },
  PRESSAO_ALTA: { defense: 74, midfield: 85, attack: 83, left: 81, center: 87, right: 81, aerial: 65, press: 94 },
  BLOCO_BAIXO: { defense: 92, midfield: 79, attack: 68, left: 76, center: 90, right: 76, aerial: 84, press: 58 },
  BOLA_AEREA: { defense: 78, midfield: 73, attack: 85, left: 88, center: 82, right: 88, aerial: 95, press: 65 }
};

function strengthBoost(strength: OpponentStrength) {
  const boost = { defense: 0, midfield: 0, attack: 0, left: 0, center: 0, right: 0, aerial: 0, press: 0 };
  if (strength === 'VELOCIDADE') { boost.attack += 8; boost.left += 6; boost.right += 6; }
  if (strength === 'PASSE') { boost.midfield += 8; boost.center += 7; }
  if (strength === 'FISICO') { boost.defense += 5; boost.attack += 4; boost.aerial += 6; }
  if (strength === 'DRIBLE') { boost.attack += 6; boost.left += 5; boost.right += 5; }
  if (strength === 'FINALIZACAO') { boost.attack += 9; boost.center += 4; }
  if (strength === 'CRUZAMENTO') { boost.left += 8; boost.right += 8; boost.aerial += 7; }
  if (strength === 'PRESSAO') { boost.press += 10; boost.midfield += 5; }
  return boost;
}

function formationModifier(formation: TacticalFormation) {
  if (formation === 'AUTO') return { defense: 0, midfield: 0, attack: 0 };
  if (formation.startsWith('5-')) return { defense: 6, midfield: -1, attack: -3 };
  if (formation.startsWith('3-')) return { defense: -2, midfield: 4, attack: 4 };
  if (formation.includes('4-2-3-1') || formation.includes('4-2-1-3')) return { defense: 2, midfield: 4, attack: 2 };
  if (formation.includes('4-3-3') || formation.includes('4-1-2-3')) return { defense: 0, midfield: 3, attack: 5 };
  return { defense: 2, midfield: 2, attack: 2 };
}

function opponentScores(input: OpponentAnalysisInput) {
  const base = profileBase[input.profile];
  const boost = strengthBoost(input.strength);
  const formation = formationModifier(input.formation);
  return {
    defense: clamp(base.defense + boost.defense + formation.defense),
    midfield: clamp(base.midfield + boost.midfield + formation.midfield),
    attack: clamp(base.attack + boost.attack + formation.attack),
    left: clamp(base.left + boost.left), center: clamp(base.center + boost.center), right: clamp(base.right + boost.right),
    aerial: clamp(base.aerial + boost.aerial), press: clamp(base.press + boost.press)
  };
}

function playerLabel(player: AnalysisResult | undefined, fallback: string) {
  return player?.parsed.playerName?.trim() || fallback;
}

function pickPlayer(players: AnalysisResult[], positionCodes: string[], metric: (player: AnalysisResult) => number) {
  const natural = players.filter((player) => positionCodes.includes(player.bestPosition.code));
  return [...(natural.length ? natural : players)].sort((a, b) => metric(b) - metric(a))[0];
}

export function buildAdvancedOpponentReport(
  results: AnalysisResult[],
  ownFormation: TacticalFormation,
  ownStyle: TacticalStyle,
  input: OpponentAnalysisInput
): AdvancedOpponentReport | null {
  const chemistry = buildSquadChemistryReport(results, ownFormation, ownStyle);
  const elite = buildEliteTeamReport(results, ownFormation, ownStyle);
  if (!chemistry || !elite) return null;

  const selected = elite.lineup
    .map((pick) => results.find((player) => player.parsed.playerName === pick.playerName))
    .filter((player): player is AnalysisResult => Boolean(player));
  if (!selected.length) return null;

  const opponent = opponentScores(input);
  const ownDefense = chemistry.sectors.find((item) => item.key === 'defesa')?.score ?? 55;
  const ownMidfield = chemistry.sectors.find((item) => item.key === 'meio')?.score ?? 55;
  const ownAttack = chemistry.sectors.find((item) => item.key === 'ataque')?.score ?? 55;

  const comparisonData = [
    { key: 'defesa' as const, label: 'Sua defesa × ataque rival', own: ownDefense, rival: opponent.attack },
    { key: 'meio' as const, label: 'Seu meio × meio rival', own: ownMidfield, rival: opponent.midfield },
    { key: 'ataque' as const, label: 'Seu ataque × defesa rival', own: ownAttack, rival: opponent.defense }
  ];
  const sectorComparisons = comparisonData.map((item): AdvancedSectorComparison => {
    const advantage = clamp(item.own - item.rival + 50);
    const status = advantage >= 57 ? 'vantagem' : advantage >= 45 ? 'equilibrado' : 'risco';
    return {
      key: item.key, label: item.label, ownScore: item.own, opponentScore: item.rival, advantage, status,
      verdict: status === 'vantagem' ? 'Seu setor possui recursos para controlar este confronto.' : status === 'equilibrado' ? 'O duelo tende a ser decidido por posicionamento e execução.' : 'O rival possui vantagem estimada neste setor; proteja-o primeiro.'
    };
  });

  const leftBack = pickPlayer(selected, ['LB', 'LMF'], (p) => avg([score(p, 'marcacao'), score(p, 'cobertura'), score(p, 'aceleracao')]));
  const centerBack = pickPlayer(selected, ['CB', 'DMF'], (p) => avg([score(p, 'marcacao'), score(p, 'fisico'), score(p, 'jogoAereo')]));
  const rightBack = pickPlayer(selected, ['RB', 'RMF'], (p) => avg([score(p, 'marcacao'), score(p, 'cobertura'), score(p, 'aceleracao')]));
  const creator = pickPlayer(selected, ['AMF', 'CMF', 'SS'], (p) => avg([score(p, 'criacao'), score(p, 'passe'), score(p, 'saidaDeBola')]));
  const finisher = pickPlayer(selected, ['CF', 'SS', 'LWF', 'RWF'], (p) => avg([score(p, 'finalizacao'), score(p, 'aceleracao')]));

  const duelSeeds = [
    { zone: 'esquerda' as const, own: leftBack, ownRole: 'Proteção do lado esquerdo', rivalRole: 'Atacante/ponta direito rival', ownScore: avg([score(leftBack, 'marcacao'), score(leftBack, 'cobertura'), score(leftBack, 'aceleracao')]), rival: opponent.right },
    { zone: 'centro' as const, own: centerBack, ownRole: 'Defesa central', rivalRole: 'Centroavante e chegada central rival', ownScore: avg([score(centerBack, 'marcacao'), score(centerBack, 'fisico'), score(centerBack, 'jogoAereo')]), rival: avg([opponent.center, opponent.attack, opponent.aerial]) },
    { zone: 'direita' as const, own: rightBack, ownRole: 'Proteção do lado direito', rivalRole: 'Atacante/ponta esquerdo rival', ownScore: avg([score(rightBack, 'marcacao'), score(rightBack, 'cobertura'), score(rightBack, 'aceleracao')]), rival: opponent.left },
    { zone: 'centro' as const, own: creator, ownRole: 'Criação central', rivalRole: 'Bloco de meio e pressão rival', ownScore: avg([score(creator, 'criacao'), score(creator, 'passe'), score(creator, 'fisico')]), rival: avg([opponent.midfield, opponent.press]) },
    { zone: 'centro' as const, own: finisher, ownRole: 'Conclusão do ataque', rivalRole: 'Zagueiros e proteção da área rival', ownScore: avg([score(finisher, 'finalizacao'), score(finisher, 'aceleracao'), score(finisher, 'fisico')]), rival: opponent.defense }
  ];

  const duels = duelSeeds.map((duel): IndividualDuel => {
    const duelScore = clamp(duel.ownScore - duel.rival + 50);
    const status = duelScore >= 58 ? 'favorável' : duelScore >= 45 ? 'equilibrado' : 'perigoso';
    return {
      zone: duel.zone, ownPlayer: playerLabel(duel.own, 'Jogador não confirmado'), ownRole: duel.ownRole, opponentRole: duel.rivalRole,
      ownScore: clamp(duel.ownScore), opponentScore: clamp(duel.rival), duelScore, status,
      reason: status === 'favorável' ? 'Seu jogador possui vantagem estimada nos atributos mais importantes deste duelo.' : status === 'equilibrado' ? 'Os dois lados possuem recursos parecidos; cobertura e tomada de decisão serão decisivas.' : 'O rival tem vantagem estimada no confronto direto e pode exigir ajuda de um segundo jogador.',
      adjustment: status === 'perigoso' ? 'Crie cobertura próxima e evite deixar o duelo isolado.' : status === 'equilibrado' ? 'Mantenha distância curta para oferecer apoio sem desmontar o setor.' : 'Use esta vantagem para direcionar o jogo para este confronto.'
    };
  });

  const threats = ([
    { zone: 'centro', level: opponent.center, severity: opponent.center >= 84 ? 'alta' : opponent.center >= 73 ? 'média' : 'baixa', title: 'Ameaça pelo corredor central', reason: 'Combina criação, chegada e ocupação entre linhas.', protection: 'Aproxime VOL/MLG da defesa e feche passes verticais.' },
    { zone: 'esquerda', level: opponent.left, severity: opponent.left >= 84 ? 'alta' : opponent.left >= 73 ? 'média' : 'baixa', title: 'Ameaça pelo seu lado direito', reason: 'O rival tende a criar aceleração, drible ou cruzamento por esse corredor.', protection: 'Evite que lateral e ponta sejam superados no mesmo lance.' },
    { zone: 'direita', level: opponent.right, severity: opponent.right >= 84 ? 'alta' : opponent.right >= 73 ? 'média' : 'baixa', title: 'Ameaça pelo seu lado esquerdo', reason: 'O rival possui força estimada no corredor oposto.', protection: 'Mantenha cobertura por dentro e bloqueie a origem do passe.' },
    { zone: 'área', level: opponent.aerial, severity: opponent.aerial >= 84 ? 'alta' : opponent.aerial >= 73 ? 'média' : 'baixa', title: 'Ameaça na área e bola aérea', reason: 'Cruzamentos, contato físico e segunda bola podem decidir a jogada.', protection: 'Proteja o segundo poste e aproxime um jogador para recolher a sobra.' },
    { zone: 'saída', level: opponent.press, severity: opponent.press >= 84 ? 'alta' : opponent.press >= 73 ? 'média' : 'baixa', title: 'Ameaça sobre sua saída de bola', reason: 'A pressão rival pode gerar chances antes de sua equipe se organizar.', protection: 'Crie triângulos de passe e mantenha uma rota direta de segurança.' }
  ] satisfies ThreatMapItem[]).sort((a, b) => b.level - a.level).slice(0, 5);

  const weaknessSeeds: WeaknessMapItem[] = [];
  const addWeakness = (item: WeaknessMapItem) => weaknessSeeds.push(item);
  if (input.profile === 'POSSE' || input.profile === 'PRESSAO_ALTA') addWeakness({ zone: 'costas da defesa', opportunity: 88, title: 'Espaço após superar a primeira pressão', reason: 'O rival adianta jogadores e deixa campo atrás do bloco.', howToExplore: 'Use passe vertical rápido para ponta, SA ou CA atacando profundidade.' });
  if (input.profile === 'POR_FORA' || input.profile === 'BOLA_AEREA') addWeakness({ zone: 'centro', opportunity: 84, title: 'Espaço central durante a abertura', reason: 'A concentração nos corredores pode afastar jogadores do eixo.', howToExplore: 'Conduza ou passe para MAT/SA entre as linhas antes da recomposição.' });
  if (input.profile === 'BLOCO_BAIXO') addWeakness({ zone: 'entrada da área', opportunity: 78, title: 'Segunda bola fora da área', reason: 'O bloco protege a área, mas pode ceder rebotes na entrada.', howToExplore: 'Mantenha um meia preparado para recuperar e reiniciar a jogada.' });
  if (opponent.left >= opponent.right) addWeakness({ zone: 'direita', opportunity: clamp(90 - opponent.right + ownAttack / 2), title: 'Atacar o lado direito do rival', reason: 'É o corredor defensivo menos forte na estimativa atual.', howToExplore: 'Crie dois contra um e ataque as costas do lateral.' });
  else addWeakness({ zone: 'esquerda', opportunity: clamp(90 - opponent.left + ownAttack / 2), title: 'Atacar o lado esquerdo do rival', reason: 'É o corredor defensivo menos forte na estimativa atual.', howToExplore: 'Use amplitude e aceleração para forçar cobertura tardia.' });
  addWeakness({ zone: 'centro', opportunity: clamp(100 - opponent.midfield + ownMidfield / 2), title: 'Disputar o controle do meio', reason: 'O nível de oportunidade depende da diferença entre os dois meios.', howToExplore: 'Crie superioridade com apoio do lateral ou atacante recuando.' });
  addWeakness({ zone: 'costas da defesa', opportunity: clamp(105 - opponent.defense + ownAttack / 2), title: 'Atacar a última linha', reason: 'Movimentos coordenados podem explorar o espaço deixado pela defesa rival.', howToExplore: 'Alterne apoio curto e ruptura para desorganizar a marcação.' });
  const weaknesses = weaknessSeeds.sort((a, b) => b.opportunity - a.opportunity).slice(0, 5);

  const overallSectorEdge = clamp(avg(sectorComparisons.map((item) => item.advantage)));
  const duelEdge = clamp(avg(duels.map((item) => item.duelScore)));
  return {
    sectorComparisons, duels, threats, weaknesses, overallSectorEdge, duelEdge,
    mainWarning: threats[0]?.title ?? 'Nenhuma ameaça principal confirmada.',
    bestOpportunity: weaknesses[0]?.title ?? 'Nenhuma fraqueza clara confirmada.',
    confidenceNote: input.formation === 'AUTO' ? 'Confiança moderada: a formação rival ainda não foi confirmada.' : 'Análise estimada a partir do perfil, formação e força informados. Confirme o comportamento durante a partida.',
    locks: [
      'Nenhum duelo estimado substitui sua observação durante a partida.',
      'Nenhum jogador, ficha, formação ou plano é alterado automaticamente.',
      'Os mapas usam apenas os dados confirmados ou informados no módulo do adversário.'
    ]
  };
}
