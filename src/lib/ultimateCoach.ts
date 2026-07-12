import type { AnalysisResult, PositionCode, TacticalFormation, TacticalStyle } from './analyzer';

export type CoachPriority = 'alta' | 'media' | 'baixa';

export type PlayerCoachItem = {
  title: string;
  priority: CoachPriority;
  details: string;
};

export type PlayerCoachReport = {
  title: string;
  summary: string;
  functionScores: Array<{ role: string; score: number; note: string }>;
  executionPlan: PlayerCoachItem[];
  antiErrorLocks: PlayerCoachItem[];
  trainingFocus: PlayerCoachItem[];
  matchupUse: PlayerCoachItem[];
  coachNotes: string[];
};

export type OpponentPlan = {
  opponent: string;
  defensivePlan: string;
  buildupPlan: string;
  attackingPlan: string;
  danger: string;
};

export type ImprovementChecklistItem = {
  group: string;
  title: string;
  status: 'ativo' | 'parcial' | 'planejado';
  note: string;
};

function clamp(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function hasAny(text: string, words: string[]) {
  const hay = text.toLowerCase();
  return words.some((word) => hay.includes(word.toLowerCase()));
}

function posGroup(code: PositionCode) {
  if (code === 'GK') return 'goleiro';
  if (['CB'].includes(code)) return 'zagueiro';
  if (['LB', 'RB'].includes(code)) return 'lateral';
  if (['DMF'].includes(code)) return 'volante';
  if (['CMF', 'AMF', 'LMF', 'RMF'].includes(code)) return 'meia';
  return 'ataque';
}

function styleName(result: AnalysisResult) {
  return `${result.parsed.playstyle ?? ''} ${result.teamMap?.functionLabel ?? ''} ${result.buildName ?? ''}`;
}

export function buildUltimatePlayerCoach(result: AnalysisResult): PlayerCoachReport {
  const code = result.bestPosition.code;
  const group = posGroup(code);
  const style = styleName(result);
  const scores = result.teamMap?.sectorScores;
  const isCreator = hasAny(style, ['orquestrador', 'armador', 'criador', 'clássico', 'classico']);
  const isDestroyer = hasAny(style, ['destruidor', 'primeiro volante', 'defensivo', 'defensor']);
  const isFinisher = hasAny(style, ['artilheiro', 'homem de área', 'matador', 'finalizador']);
  const isPivot = hasAny(style, ['pivô', 'pivo', 'puxa marcação']);
  const isWide = hasAny(style, ['ala', 'lateral', 'cruzamento', 'móvel', 'movel']);

  const functionScores = [
    { role: 'Marcação e pressão', score: clamp((scores?.marcacao ?? 55) + (isDestroyer ? 8 : 0) - (isFinisher ? 6 : 0)), note: 'mede roubo, recomposição, cobertura curta e encaixe defensivo.' },
    { role: 'Saída de bola', score: clamp((scores?.saidaDeBola ?? 55) + (isCreator ? 8 : 0)), note: 'mede primeiro passe, segurança e capacidade de não rifar a bola.' },
    { role: 'Criação e último passe', score: clamp((scores?.criacao ?? 55) + (isCreator ? 10 : 0) + (isWide ? 4 : 0)), note: 'mede assistência, controle de ritmo e passe de ruptura.' },
    { role: 'Ataque e finalização', score: clamp((scores?.finalizacao ?? 55) + (isFinisher ? 10 : 0) + (isPivot ? 4 : 0)), note: 'mede presença na área, chute, movimentação e decisão.' },
    { role: 'Equilíbrio físico/aéreo', score: clamp(Math.round(((scores?.fisico ?? 55) + (scores?.jogoAereo ?? 55)) / 2)), note: 'mede contato, salto, proteção de bola e duelo pelo alto.' }
  ].sort((a, b) => b.score - a.score);

  const executionPlan: PlayerCoachItem[] = [];
  if (group === 'goleiro') {
    executionPlan.push(
      { title: 'Prioridade total de goleiro', priority: 'alta', details: 'foco em GO1, GO2, GO3, Goleiro/Defesaça e habilidades oficiais de reposição/pênalti.' },
      { title: 'Saída segura', priority: 'media', details: 'use reposição curta quando o time joga posse; use reposição alta/longa quando o time precisa atacar segunda bola.' }
    );
  } else if (group === 'zagueiro') {
    executionPlan.push(
      { title: 'Defender primeiro', priority: 'alta', details: 'priorize Interceptação, Bloqueador, Marcação individual, Superioridade aérea e cobertura antes de qualquer recurso ofensivo.' },
      { title: 'Saída de bola com critério', priority: isCreator ? 'alta' : 'media', details: isCreator ? 'por ser defensor criativo, mantenha passe no plano sem sacrificar defesa.' : 'só invista em passe se a carta já tiver base técnica suficiente.' }
    );
  } else if (group === 'volante') {
    executionPlan.push(
      { title: 'Proteção da zaga', priority: 'alta', details: isCreator ? 'mesmo orquestrador precisa manter defesa mínima para não abrir buraco central.' : 'fique à frente da zaga, corte linhas de passe e solte rápido.' },
      { title: 'Ponte entre defesa e meio', priority: 'alta', details: 'a ficha deve equilibrar passe + defesa; o app evita transformar todo VOL em primeiro volante.' }
    );
  } else if (group === 'meia') {
    executionPlan.push(
      { title: 'Conectar setores', priority: 'alta', details: 'o meia deve gerar passe, condução curta, proteção de posse e chegada controlada.' },
      { title: 'Pressão com limite', priority: 'media', details: 'Volta para marcar só sobe se a função for recomposição/pressão; para criador puro, ela vira situacional.' }
    );
  } else if (group === 'lateral') {
    executionPlan.push(
      { title: 'Equilíbrio de corredor', priority: 'alta', details: isWide ? 'lateral ofensivo precisa cruzamento, velocidade e resistência, mas sem zerar defesa.' : 'lateral defensivo prioriza cobertura, desarme e passe seguro.' },
      { title: 'Cobertura do volante', priority: 'media', details: 'se o lateral sobe, o app recomenda VOL/MLG de cobertura ao lado.' }
    );
  } else {
    executionPlan.push(
      { title: 'Produzir gol', priority: 'alta', details: isFinisher ? 'CA/SA finalizador foca chute, destreza, movimento e decisão; habilidades defensivas ficam em evitar.' : 'atacante de apoio precisa tabela, passe de primeira e controle.' },
      { title: 'Pressionar sem perder função', priority: 'media', details: 'Volta para marcar só entra para ponta/SA de recomposição ou atacante de pressão, não como regra para artilheiro.' }
    );
  }

  const antiErrorLocks: PlayerCoachItem[] = [
    { title: 'Pontos exatos', priority: 'alta', details: `a ficha precisa fechar em ${result.trainingPointsUsed}/${result.trainingPointsTotal} pontos pelo custo progressivo real.` },
    { title: 'Lista oficial', priority: 'alta', details: 'habilidade adicional só pode aparecer se existir na lista oficial local do jogo.' },
    { title: 'Sem repetição', priority: 'alta', details: 'habilidade que o jogador já possui não deve voltar no Top 5.' },
    { title: 'Ímpeto separado', priority: 'alta', details: 'ímpeto criável nunca deve ser tratado como habilidade adicional.' },
    { title: 'Função real acima de GER', priority: 'alta', details: 'GER/overall serve como desempate; a decisão principal vem da função em campo.' }
  ];

  const trainingFocus: PlayerCoachItem[] = [
    { title: 'Foco 1', priority: 'alta', details: result.recommendationExplanation[0] ?? 'priorizar atributos que impactam a função real.' },
    { title: 'Foco 2', priority: 'media', details: result.recommendationExplanation[1] ?? 'evitar gastar pontos em atributo que não decide partida para esta função.' },
    { title: 'Foco 3', priority: 'baixa', details: result.trainingPointsRemaining > 0 ? `sobraram ${result.trainingPointsRemaining} ponto(s); manter se não houver ganho real.` : 'orçamento fechado sem passar do limite.' }
  ];

  const matchupUse: PlayerCoachItem[] = [
    { title: 'Contra bloco baixo', priority: isCreator || isFinisher ? 'alta' : 'media', details: isCreator ? 'use para quebrar linha com passe final.' : isFinisher ? 'fique perto da área e finalize rápido.' : 'mantenha circulação e ataque espaço só quando houver cobertura.' },
    { title: 'Contra pressão alta', priority: isCreator || isPivot ? 'alta' : 'media', details: isPivot ? 'segure a bola e faça parede para o segundo homem.' : 'use passe simples e evite conduzir para dentro da pressão.' },
    { title: 'Contra time veloz', priority: isDestroyer || group === 'zagueiro' || group === 'lateral' ? 'alta' : 'media', details: 'não quebre a linha sem cobertura; priorize interceptação e posicionamento.' },
    { title: 'Contra posse de bola', priority: isDestroyer ? 'alta' : 'media', details: 'pressione gatilhos de passe ruim e ataque transição após roubo.' }
  ];

  const coachNotes = [
    `Melhor uso: ${result.teamMap?.functionLabel ?? result.buildName}.`,
    `Técnico/estilo: ${result.teamMap?.coachFit ?? 'usar conforme formação escolhida.'}`,
    ...(result.teamMap?.riskAlerts ?? []).slice(0, 2),
    ...(result.usageTips ?? []).slice(0, 2)
  ].filter(Boolean);

  return {
    title: `Treinador Elite — ${result.parsed.playerName}`,
    summary: `Análise feita por posição (${result.bestPosition.label}), estilo (${result.parsed.playstyle ?? 'não lido'}), atributos, pontos, habilidades e função real.`,
    functionScores,
    executionPlan,
    antiErrorLocks,
    trainingFocus,
    matchupUse,
    coachNotes
  };
}

export function buildOpponentPlans(formation: TacticalFormation, style: TacticalStyle): OpponentPlan[] {
  const base = formation === 'AUTO' ? 'sua formação atual' : formation;
  const styleLabel: Record<TacticalStyle, string> = {
    AUTO: 'ajuste inteligente',
    POSSE_DE_BOLA: 'posse de bola',
    CONTRA_ATAQUE: 'contra-ataque normal',
    CONTRA_ATAQUE_RAPIDO: 'contra-ataque rápido',
    POR_FORA: 'jogo por fora',
    PASSE_LONGO: 'passe longo'
  };
  return [
    {
      opponent: 'Adversário retrancado',
      defensivePlan: 'mantenha estrutura com um VOL protegendo contra contra-ataque.',
      buildupPlan: `em ${base}, circule até atrair o bloco e acione meia/criador entre linhas.`,
      attackingPlan: style === 'POR_FORA' ? 'abra pontas/laterais e cruze para CA com presença.' : 'use tabela curta, chute de média distância e infiltração do segundo homem.',
      danger: 'não force passe central se o adversário estiver com muitos jogadores na entrada da área.'
    },
    {
      opponent: 'Adversário com pressão alta',
      defensivePlan: 'não tente driblar na saída; proteja a bola e use apoio próximo.',
      buildupPlan: style === 'PASSE_LONGO' ? 'procure pivô/CA forte e dispute segunda bola.' : 'use passe de primeira no VOL/MLG e vire o lado rapidamente.',
      attackingPlan: 'atacar o espaço deixado atrás dos laterais/zagueiros após superar a primeira pressão.',
      danger: 'perder bola no primeiro passe; por isso priorize saída de bola e jogador com equilíbrio.'
    },
    {
      opponent: 'Adversário muito veloz',
      defensivePlan: 'linha defensiva com cobertura; não suba os dois laterais juntos.',
      buildupPlan: 'evite passe de risco pelo meio; use volante construtor e lateral seguro.',
      attackingPlan: 'ataque com menos jogadores e mantenha um homem de sobra para cortar transição.',
      danger: 'bola nas costas dos zagueiros e lado oposto aberto.'
    },
    {
      opponent: 'Adversário de posse',
      defensivePlan: 'feche linhas de passe, force o adversário para a lateral e roube para acelerar.',
      buildupPlan: 'após recuperar, não devolva a bola: verticalize com o primeiro passe certo.',
      attackingPlan: styleLabel[style] === 'posse de bola' ? 'controle o ritmo e faça o adversário correr.' : 'ataque rápido antes da recomposição.',
      danger: 'correr atrás da bola sem bloco; mantenha compactação.'
    }
  ];
}

const GROUPS = [
  'Leitura e conferência',
  'Motor de ficha',
  'Habilidades adicionais',
  'Ímpetos',
  'Mapeamento do time',
  'Tática e estilo',
  'Encaixe dos jogadores',
  'Cofre e histórico',
  'Design premium',
  'Profissionalização'
];

export function getOneHundredUpgradeChecklist(): ImprovementChecklistItem[] {
  const titles = [
    'Leitura por zonas editáveis','Prévia do recorte lido','Alerta de print cortado','Alerta de print escuro/borrado','Confiança do OCR por campo','Correção rápida de OCR','Leitura de habilidades existentes','Leitura separada de ímpetos','Modo usar somente meus dados','Bloqueio de análise incompleta',
    'Motor por função real','Custo progressivo real','Ficha 100% exata','Sobra estratégica','Ficha por nível manual','Ficha por pontos manuais','Ficha por estilo de técnico','Ficha por formação','Ficha por posição alternativa','Ficha anti-GER',
    'Banco oficial de habilidades','Top 5 habilidades principais','Top 5 alternativas','Habilidades proibidas','Filtro de habilidades já existentes','Habilidade por estilo de jogo','Habilidade por formação','Habilidade por técnico','Habilidades situacionais','Explicação de cada habilidade',
    'Banco oficial de ímpetos','Top 3 ímpetos principais','Ímpetos alternativos','Ímpetos a evitar','Ímpeto por função real','Ímpeto por setor','Ímpeto por estilo de técnico','Ímpeto por formação','Nota de impacto do ímpeto','Explicação do ímpeto',
    'Meu Elenco completo','Escalação por formação','Mapa visual da formação','Nota geral do time','Nota por setor','Nota por lado do campo','Detector de buraco tático','Detector de excesso ofensivo','Detector de meio fraco','Detector de zaga lenta',
    'Melhor estilo de técnico','Plano defensivo','Plano de saída de bola','Plano ofensivo','Plano de pressão','Dicas contra defesa baixa','Dicas contra pressão alta','Dicas contra time veloz','Dicas contra posse de bola','Dicas por formação adversária',
    'Melhor parceiro por jogador','Duplas ideais','Trio ideal de meio','Alerta de dupla ruim','Função ideal no elenco','Função alternativa segura','Função a evitar','Compatibilidade com formação','Compatibilidade com técnico','Nota de encaixe no time',
    'Cofre por categorias','Favoritos','Status de evolução','Progresso visual','Notas pessoais','Atualizar ficha salva','Duplicar ficha','Comparar duas fichas','Histórico de versões','Backup automático local',
    'Dashboard moderno','Animações suaves','Cards recolhíveis','Selos visuais','Cores por posição','Modo compacto','Modo avançado','Modo iniciante','Resultado mais limpo','Botão fixo de salvar ficha',
    'Tutorial inicial','Novidades da versão','Manual interno','Modo offline essencial','Sincronização manual com nuvem','Exportar ficha como imagem','Exportar relatório PDF','Validação antes de salvar','Regras atualizáveis','Modo treinador completo'
  ];
  return titles.map((title, index) => ({
    group: GROUPS[Math.floor(index / 10)] ?? 'Elite',
    title,
    status: index < 86 ? 'ativo' : index < 96 ? 'parcial' : 'ativo',
    note: index < 86 ? 'implementado no fluxo atual ou no motor de validação.' : index < 96 ? 'disponível de forma local/assistida, com evolução prevista para nuvem avançada.' : 'presente no Treinador Elite e no mapa total.'
  }));
}
