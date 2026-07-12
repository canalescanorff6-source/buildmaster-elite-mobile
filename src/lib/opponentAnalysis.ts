import type { AnalysisResult, TacticalFormation, TacticalStyle } from './analyzer';
import { buildSquadChemistryReport } from './squadChemistry';
import { buildAssistedLineupReport } from './assistedLineup';

export type OpponentProfile = 'POSSE' | 'CONTRA_RAPIDO' | 'CONTRA_LONGO' | 'POR_FORA' | 'PRESSAO_ALTA' | 'BLOCO_BAIXO' | 'BOLA_AEREA';
export type OpponentStrength = 'VELOCIDADE' | 'PASSE' | 'FISICO' | 'DRIBLE' | 'FINALIZACAO' | 'CRUZAMENTO' | 'PRESSAO';

export type OpponentAnalysisInput = {
  profile: OpponentProfile;
  formation: TacticalFormation;
  strength: OpponentStrength;
};

export type OpponentAdjustment = {
  area: 'Formação' | 'Defesa' | 'Meio-campo' | 'Ataque' | 'Pressão' | 'Fichas';
  priority: 'alta' | 'média' | 'baixa';
  title: string;
  action: string;
  reason: string;
};

export type OpponentAnalysisReport = {
  threatScore: number;
  matchupScore: number;
  verdict: string;
  opponentSummary: string;
  mainThreats: string[];
  exploitableWeaknesses: string[];
  adjustments: OpponentAdjustment[];
  recommendedFormation: TacticalFormation;
  recommendedStyle: TacticalStyle;
  comparisonNote: string;
  locks: string[];
};

export const OPPONENT_PROFILE_LABELS: Record<OpponentProfile, string> = {
  POSSE: 'Posse e circulação curta',
  CONTRA_RAPIDO: 'Contra-ataque rápido',
  CONTRA_LONGO: 'Contra-ataque longo',
  POR_FORA: 'Ataque pelos lados',
  PRESSAO_ALTA: 'Pressão alta e agressiva',
  BLOCO_BAIXO: 'Bloco baixo e defesa fechada',
  BOLA_AEREA: 'Bola aérea e cruzamentos'
};

export const OPPONENT_STRENGTH_LABELS: Record<OpponentStrength, string> = {
  VELOCIDADE: 'Velocidade', PASSE: 'Passe', FISICO: 'Força física', DRIBLE: 'Drible', FINALIZACAO: 'Finalização', CRUZAMENTO: 'Cruzamento', PRESSAO: 'Pressão'
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const profilePlan: Record<OpponentProfile, { style: TacticalStyle; formation: TacticalFormation; threats: string[]; weaknesses: string[]; adjustments: OpponentAdjustment[] }> = {
  POSSE: {
    style: 'CONTRA_ATAQUE_RAPIDO', formation: '4-2-3-1',
    threats: ['Superioridade numérica no meio', 'Paciência para encontrar passes entre linhas', 'Recuperação rápida após perder a bola'],
    weaknesses: ['Espaço atrás dos laterais', 'Vulnerabilidade ao passe vertical após perda', 'Dificuldade contra marcação orientada para os lados'],
    adjustments: [
      { area: 'Meio-campo', priority: 'alta', title: 'Fechar o corredor central', action: 'Use pelo menos dois jogadores com cobertura e interceptação no eixo.', reason: 'Reduz linhas de passe curtas e força o adversário a circular por fora.' },
      { area: 'Ataque', priority: 'alta', title: 'Atacar após a recuperação', action: 'Mantenha dois jogadores rápidos prontos para o passe vertical.', reason: 'Times de posse deixam espaço quando perdem a bola com muitos jogadores à frente.' },
      { area: 'Pressão', priority: 'média', title: 'Pressionar por gatilho', action: 'Não persiga o tempo todo; pressione passe recuado, domínio ruim ou recepção de costas.', reason: 'Pressão contínua abre espaços e favorece a circulação do adversário.' }
    ]
  },
  CONTRA_RAPIDO: {
    style: 'CONTRA_ATAQUE', formation: '4-2-2-2',
    threats: ['Ataques verticais em poucos toques', 'Pontas e atacantes atacando profundidade', 'Transição perigosa após erro no passe'],
    weaknesses: ['Pouca paciência contra bloco organizado', 'Espaços entre linhas quando a primeira pressão falha', 'Dependência de velocidade para criar vantagem'],
    adjustments: [
      { area: 'Defesa', priority: 'alta', title: 'Proteção contra profundidade', action: 'Priorize zagueiro de cobertura e volante protetor.', reason: 'Evita que um passe vertical elimine toda a última linha.' },
      { area: 'Meio-campo', priority: 'alta', title: 'Reduzir perdas perigosas', action: 'Use saída simples e passe seguro no corredor central.', reason: 'A maior arma do rival nasce de erros durante sua construção.' },
      { area: 'Formação', priority: 'média', title: 'Compactar setores', action: 'Mantenha pouca distância entre defesa e meio.', reason: 'Diminui o espaço para arrancadas e tabelas verticais.' }
    ]
  },
  CONTRA_LONGO: {
    style: 'POSSE_DE_BOLA', formation: '4-3-3',
    threats: ['Passe direto para atacante físico', 'Segunda bola perto da área', 'Ataque rápido após duelo aéreo'],
    weaknesses: ['Menor controle quando o primeiro passe longo é neutralizado', 'Espaço no meio para circular a bola', 'Dificuldade para pressionar durante longos períodos'],
    adjustments: [
      { area: 'Defesa', priority: 'alta', title: 'Ganhar primeira e segunda bola', action: 'Combine zagueiro físico com jogador de cobertura e aproxime o volante.', reason: 'Neutraliza o alvo direto e recolhe a sobra antes do adversário.' },
      { area: 'Meio-campo', priority: 'média', title: 'Controlar a posse', action: 'Use três jogadores capazes de passe curto e retenção.', reason: 'Faz o rival correr e reduz a frequência de lançamentos.' },
      { area: 'Fichas', priority: 'média', title: 'Reforçar jogo aéreo funcional', action: 'Valorize físico, impulsão e consciência defensiva nos jogadores centrais.', reason: 'Esses atributos decidem os duelos que iniciam o plano rival.' }
    ]
  },
  POR_FORA: {
    style: 'CONTRA_ATAQUE_RAPIDO', formation: '4-1-4-1',
    threats: ['Dois contra um nos corredores', 'Cruzamentos para a área', 'Inversão rápida de lado'],
    weaknesses: ['Espaço central quando muitos jogadores abrem', 'Laterais avançados deixam costas livres', 'Dependência de cruzamentos previsíveis'],
    adjustments: [
      { area: 'Defesa', priority: 'alta', title: 'Dobrar a marcação lateral', action: 'Aproxime ponta/meia do lateral e evite que ele defenda sozinho.', reason: 'Impede superioridade numérica e reduz cruzamentos limpos.' },
      { area: 'Ataque', priority: 'alta', title: 'Atacar as costas dos laterais', action: 'Use pontas ou SA rápidos partindo para o espaço exterior.', reason: 'O corredor fica exposto quando o lateral adversário sobe.' },
      { area: 'Fichas', priority: 'média', title: 'Preparar defesa da área', action: 'Mantenha bola aérea e posicionamento nos zagueiros.', reason: 'Mesmo reduzindo cruzamentos, alguns chegarão à área.' }
    ]
  },
  PRESSAO_ALTA: {
    style: 'PASSE_LONGO', formation: '4-2-3-1',
    threats: ['Roubo perto da sua área', 'Marcação agressiva na primeira construção', 'Ataques logo após recuperar'],
    weaknesses: ['Espaço atrás da primeira linha', 'Desgaste físico', 'Última linha exposta a inversões e bolas diretas'],
    adjustments: [
      { area: 'Meio-campo', priority: 'alta', title: 'Criar saída de segurança', action: 'Use volante que receba de costas e um lateral como apoio curto.', reason: 'Oferece duas rotas para escapar da primeira pressão.' },
      { area: 'Ataque', priority: 'alta', title: 'Ultrapassar a pressão', action: 'Alterne passe curto com bola direta para jogador que proteja ou ataque profundidade.', reason: 'Uma saída vencida encontra o adversário desorganizado.' },
      { area: 'Fichas', priority: 'média', title: 'Valorizar domínio e passe', action: 'Priorize controle, equilíbrio e passe nos responsáveis pela saída.', reason: 'Reduz erros técnicos sob pressão.' }
    ]
  },
  BLOCO_BAIXO: {
    style: 'POSSE_DE_BOLA', formation: '4-2-3-1',
    threats: ['Área congestionada', 'Contra-ataque após passe forçado', 'Muitos defensores protegendo o centro'],
    weaknesses: ['Pouco espaço para sair jogando', 'Dificuldade para defender inversões constantes', 'Segunda bola fora da área'],
    adjustments: [
      { area: 'Ataque', priority: 'alta', title: 'Mover o bloco antes de finalizar', action: 'Circule rápido, inverta lados e ataque depois que a linha se deslocar.', reason: 'Finalizações precipitadas favorecem uma área congestionada.' },
      { area: 'Meio-campo', priority: 'alta', title: 'Criador entre linhas', action: 'Use MAT/SA com passe, domínio e giro em espaço curto.', reason: 'Cria superioridade no intervalo entre volantes e zagueiros.' },
      { area: 'Pressão', priority: 'média', title: 'Contra-pressão preventiva', action: 'Mantenha volante e zagueiros preparados para a sobra.', reason: 'Evita que uma perda ofensiva vire contra-ataque claro.' }
    ]
  },
  BOLA_AEREA: {
    style: 'CONTRA_ATAQUE_RAPIDO', formation: '5-3-2',
    threats: ['Cruzamentos frequentes', 'Atacante alto no segundo poste', 'Rebotes e segunda bola'],
    weaknesses: ['Construção previsível pelos lados', 'Espaço para contra-atacar após cruzamento', 'Menor ameaça se o cruzador for bloqueado'],
    adjustments: [
      { area: 'Defesa', priority: 'alta', title: 'Proteger segundo poste', action: 'Não abandone o zagueiro oposto para pressionar o cruzador.', reason: 'A maioria dos gols aéreos nasce do atacante livre no lado contrário.' },
      { area: 'Fichas', priority: 'alta', title: 'Priorizar duelo aéreo', action: 'Use zagueiros com físico, impulsão, cabeceio e consciência defensiva.', reason: 'É a zona em que a principal arma do adversário será decidida.' },
      { area: 'Ataque', priority: 'média', title: 'Sair após o cruzamento', action: 'Deixe um atacante rápido disponível para a transição.', reason: 'O rival coloca muitos jogadores na área e oferece campo após a recuperação.' }
    ]
  }
};

function strengthThreat(strength: OpponentStrength): string {
  const map: Record<OpponentStrength, string> = {
    VELOCIDADE: 'A principal ameaça individual é a aceleração atacando espaço.', PASSE: 'O adversário pode encontrar passes que eliminam setores.', FISICO: 'Duelos e proteção de bola favorecem o adversário.', DRIBLE: 'O um contra um pode quebrar sua estrutura defensiva.', FINALIZACAO: 'Qualquer espaço próximo da área pode virar gol.', CRUZAMENTO: 'Permitir cruzamentos limpos aumenta muito o risco.', PRESSAO: 'Erros na saída podem gerar chances imediatas.'
  };
  return map[strength];
}

export function buildOpponentAnalysisReport(results: AnalysisResult[], ownFormation: TacticalFormation, ownStyle: TacticalStyle, input: OpponentAnalysisInput): OpponentAnalysisReport | null {
  if (!results.length) return null;
  const plan = profilePlan[input.profile];
  const chemistry = buildSquadChemistryReport(results, ownFormation, ownStyle);
  const alternatives = buildAssistedLineupReport(results, plan.formation, plan.style);
  if (!chemistry) return null;

  const defensive = chemistry.sectors.find((item) => item.key === 'defesa')?.score ?? 55;
  const transition = chemistry.sectors.find((item) => item.key === 'transicao')?.score ?? 55;
  const width = chemistry.sectors.find((item) => item.key === 'amplitude')?.score ?? 55;
  const matchupBase = input.profile === 'POR_FORA' || input.profile === 'BOLA_AEREA' ? (defensive + width) / 2 : input.profile === 'CONTRA_RAPIDO' ? (defensive + transition) / 2 : chemistry.globalScore;
  const threatScore = clamp(72 + (input.formation === 'AUTO' ? 0 : 3) + (input.strength === 'FINALIZACAO' || input.strength === 'VELOCIDADE' ? 5 : 2));
  const matchupScore = clamp(matchupBase - Math.max(0, threatScore - 76) * .35);
  const chosenAlternative = alternatives?.options.find((item) => item.formation === plan.formation) ?? alternatives?.options[1] ?? alternatives?.options[0];
  const recommendedFormation = chosenAlternative?.formation ?? plan.formation;
  const recommendedStyle = chosenAlternative?.style ?? plan.style;

  const extraAdjustment: OpponentAdjustment = input.strength === 'VELOCIDADE'
    ? { area: 'Defesa', priority: 'alta', title: 'Cobertura contra velocidade', action: 'Evite zagueiros saindo juntos e mantenha um defensor protegendo profundidade.', reason: 'A força declarada do rival é atacar espaço em velocidade.' }
    : input.strength === 'PASSE'
      ? { area: 'Pressão', priority: 'alta', title: 'Bloquear o passador', action: 'Oriente a pressão para o jogador que organiza e feche sua linha vertical.', reason: 'Sem tempo para levantar a cabeça, a qualidade de passe perde impacto.' }
      : input.strength === 'FISICO'
        ? { area: 'Meio-campo', priority: 'média', title: 'Evitar duelo desnecessário', action: 'Faça a bola circular e pressione a sobra, não apenas o corpo do portador.', reason: 'O rival é favorecido quando o jogo vira disputa física direta.' }
        : input.strength === 'DRIBLE'
          ? { area: 'Defesa', priority: 'alta', title: 'Criar cobertura no um contra um', action: 'Não dê bote isolado; aproxime um segundo marcador para fechar a saída.', reason: 'O driblador perde eficiência quando vence o primeiro homem, mas encontra cobertura.' }
          : input.strength === 'FINALIZACAO'
            ? { area: 'Defesa', priority: 'alta', title: 'Negar a zona de chute', action: 'Proteja a entrada da área e force recepções de costas ou para o lado fraco.', reason: 'A finalização só é perigosa quando o adversário recebe equilibrado.' }
            : input.strength === 'CRUZAMENTO'
              ? { area: 'Defesa', priority: 'alta', title: 'Bloquear a origem do cruzamento', action: 'Force o portador para trás e mantenha cobertura no segundo poste.', reason: 'Cortar a origem é mais seguro do que depender apenas do duelo aéreo.' }
              : { area: 'Meio-campo', priority: 'alta', title: 'Saída anti-pressão', action: 'Crie apoio triangular e tenha uma opção direta além da primeira linha.', reason: 'A pressão perde valor quando você supera o primeiro bloco com controle.' };

  const locks = [
    'Nenhuma formação, jogador ou ficha é alterada automaticamente.',
    'A análise trabalha com o perfil informado; confirme no jogo se o adversário mudou de plano.',
    'Você pode aplicar apenas um ajuste e manter o restante da sua estratégia.'
  ];

  return {
    threatScore,
    matchupScore,
    verdict: matchupScore >= 82 ? 'Confronto favorável com pequenos cuidados.' : matchupScore >= 70 ? 'Confronto equilibrado; os ajustes podem decidir a partida.' : 'Confronto perigoso; proteja primeiro a principal ameaça.',
    opponentSummary: `${OPPONENT_PROFILE_LABELS[input.profile]} em ${input.formation === 'AUTO' ? 'formação ainda não confirmada' : input.formation}, com destaque para ${OPPONENT_STRENGTH_LABELS[input.strength].toLowerCase()}.`,
    mainThreats: [...plan.threats, strengthThreat(input.strength)].slice(0, 4),
    exploitableWeaknesses: plan.weaknesses,
    adjustments: [extraAdjustment, ...plan.adjustments].filter((item, index, array) => array.findIndex((other) => other.title === item.title) === index).slice(0, 5),
    recommendedFormation,
    recommendedStyle,
    comparisonNote: `A alternativa ${recommendedFormation} com ${recommendedStyle === 'POSSE_DE_BOLA' ? 'Posse de bola' : recommendedStyle === 'CONTRA_ATAQUE_RAPIDO' ? 'Contra-ataque rápido' : recommendedStyle === 'CONTRA_ATAQUE' ? 'Contra-ataque longo' : recommendedStyle === 'POR_FORA' ? 'Por fora' : 'Passe longo'} foi a resposta assistida mais adequada encontrada. Sua configuração atual permanece ativa até você decidir mudar.`,
    locks
  };
}
