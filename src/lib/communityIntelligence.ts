import type { AnalysisResult, PositionCode, TacticalFormation, TacticalStyle } from '@/lib/analyzer';

export type CommunityCategory = 'FICHA' | 'ATAQUE' | 'DEFESA' | 'DRIBLE' | 'TATICA' | 'FORMACAO' | 'HABILIDADE' | 'TREINO' | 'DELAY' | 'CONFIGURACAO';
export type CommunityAuthority = 'OFICIAL' | 'PRO_PLAYER' | 'CRIADOR' | 'COMUNIDADE';
export type CommunityConfidence = 'muito_alta' | 'alta' | 'media' | 'baixa' | 'controversa';

export type CommunitySource = {
  id: string;
  title: string;
  platform: 'KONAMI' | 'YOUTUBE' | 'REDDIT';
  authority: CommunityAuthority;
  url: string;
  subject?: string;
  reviewedAt: string;
  note: string;
};

export type CommunityTip = {
  id: string;
  title: string;
  summary: string;
  category: CommunityCategory;
  confidence: CommunityConfidence;
  authority: CommunityAuthority;
  sourceIds: string[];
  tags: string[];
  positions?: PositionCode[];
  styles?: TacticalStyle[];
  formations?: TacticalFormation[];
  requiredSkills?: string[];
  avoidWhen?: string[];
  drill?: string;
  officialBasis?: string;
};

export type PersonalizedCommunityTip = CommunityTip & {
  score: number;
  matchReasons: string[];
  sourceCount: number;
};

export type CommunityIntelligenceReport = {
  version: string;
  updatedAt: string;
  snapshotLabel: string;
  sources: CommunitySource[];
  allTips: CommunityTip[];
  recommended: PersonalizedCommunityTip[];
  officialMechanics: PersonalizedCommunityTip[];
  strongConsensus: PersonalizedCommunityTip[];
  experimental: PersonalizedCommunityTip[];
  conflicts: Array<{ title: string; explanation: string }>;
  coverage: Array<{ category: CommunityCategory; count: number }>;
  safeguards: string[];
  verdict: string;
};

export const COMMUNITY_SOURCES: CommunitySource[] = [
  {
    id: 'konami-v5-0',
    title: 'eFootball v5.0.0 — ajustes de ataque, defesa e estilos coletivos',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://www.konami.com/efootball/en/page/v5/versioninfo_v5-00', reviewedAt: '2026-07-14',
    note: 'Fonte oficial para Consciência Defensiva, Dedicação Defensiva, pressão, movimentação ofensiva e comportamento em Posse de Bola.'
  },
  {
    id: 'konami-v5-2',
    title: 'eFootball v5.2.0 — Consciência Defensiva e aceleração na marcação',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://www.konami.com/efootball/en/page/v5/versioninfo_v5-20', reviewedAt: '2026-07-14',
    note: 'Fonte oficial para a relação entre Consciência Defensiva, reação ao atacante e perda de aceleração por cansaço.'
  },
  {
    id: 'konami-v5-4',
    title: 'eFootball v5.4.0 — drible, 1 contra 1, Match-up e cruzamentos',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://www.konami.com/efootball/en/page/v5/versioninfo_v5-40', reviewedAt: '2026-07-14',
    note: 'Fonte oficial para mudanças rápidas de direção, Sharp Touch, Match-up, compactação central e reação defensiva.'
  },
  {
    id: 'konami-v5-4-mobile',
    title: 'Update Notice v5.4.0 — detalhes mobile de defesa e largura',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://www.konami.com/efootball/en/topic/news/5062', reviewedAt: '2026-07-14',
    note: 'Fonte oficial sobre recuo no Match-up, orientação corporal, pressão, largura defensiva e dificuldade maior dos cruzamentos.'
  },
  {
    id: 'konami-controls',
    title: 'Manual oficial de controles mobile',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://www.konami.com/efootball/en/page/mobile_controller', reviewedAt: '2026-07-14',
    note: 'Comandos oficiais de Sharp Touch, Finesse Dribble, Match-up, pressão, troca manual e goleiro.'
  },
  {
    id: 'konami-store',
    title: 'eFootball Mobile — desenvolvimento manual e conexão estável',
    platform: 'KONAMI', authority: 'OFICIAL', url: 'https://play.google.com/store/apps/details?id=jp.konami.pesam', reviewedAt: '2026-07-14',
    note: 'A Konami confirma progressão manual por preferência e recomenda conexão estável.'
  },
  {
    id: 'yt-defending-17',
    title: '17 Defending Tips & Tricks To Make you Pro — eFootball 2026',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=Mxrcnq_iz_o', reviewedAt: '2026-07-14',
    note: 'Guia comunitário sobre Match-up, pressão, posicionamento e defesa manual.'
  },
  {
    id: 'yt-defensive-formation',
    title: 'The Best Tactical Formation for Defending in eFootball 2026',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=Lgi8E6Dy8aw', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre estrutura defensiva e pressão sem abrir espaços.'
  },
  {
    id: 'yt-l2-dribbling',
    title: 'The Secret to L2 in eFootball 2026 — Perfect Dribbling',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=EVQYi42nqac', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre proteção, domínio e condução sem acelerar o tempo todo.'
  },
  {
    id: 'yt-dribbling-guide',
    title: 'eFootball 2026 Dribbling Tutorial — 10 movimentos essenciais',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=I6iexx0BqkU', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre Double Touch, Flip Flap, Marseille Turn e uso situacional.'
  },
  {
    id: 'yt-jvictor-4222',
    title: 'JVICTOR Pro Tactic — 4-2-2-2 Long Ball Counter',
    platform: 'YOUTUBE', authority: 'PRO_PLAYER', subject: 'JVICTOR', url: 'https://www.youtube.com/watch?v=4dlM8aixvE4', reviewedAt: '2026-07-14',
    note: 'Análise de uma tática atribuída ao pro player JVICTOR.'
  },
  {
    id: 'yt-rank1-4312',
    title: 'Rank #1 Pro Tactic — 4-3-1-2 Long Ball Counter',
    platform: 'YOUTUBE', authority: 'PRO_PLAYER', subject: 'Rank #1 eFootball League', url: 'https://www.youtube.com/watch?v=Wq6-u6hBn6M', reviewedAt: '2026-07-14',
    note: 'Análise comunitária de uma tática estreita e direta usada em alto ranking.'
  },
  {
    id: 'yt-jeansui-5212',
    title: 'World Champion Tactical Tutorial — 5-2-1-2',
    platform: 'YOUTUBE', authority: 'PRO_PLAYER', subject: 'JEANSUI', url: 'https://www.youtube.com/watch?v=TxLuu83pNVM', reviewedAt: '2026-07-14',
    note: 'Análise de formação associada ao campeão JEANSUI.'
  },
  {
    id: 'yt-formations-top5',
    title: 'Top 5 Most Effective Formations — eFootball 2026',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=VstBMt6gijs', reviewedAt: '2026-07-14',
    note: 'Comparação comunitária de formações competitivas.'
  },
  {
    id: 'yt-progression',
    title: 'How to Level & Train Players Perfectly — Truth About OVR',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=yFvCDg-cjlo', reviewedAt: '2026-07-14',
    note: 'Guia comunitário que separa desempenho real de busca cega por overall.'
  },
  {
    id: 'yt-settings-v54',
    title: 'Best Settings for eFootball 2026 Mobile v5.4.0',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=0gG7DCg6AkY', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre FPS, gráficos e resposta; não garante eliminar atraso de servidor.'
  },
  {
    id: 'yt-settings-smooth',
    title: 'Best eFootball Mobile Settings to Avoid Lag',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=gHORmCO2NCo', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre desempenho e estabilidade no celular.'
  },
  {
    id: 'yt-lbc-setup',
    title: 'Ultimate Long Ball Counter Setup — Formations and Player Roles',
    platform: 'YOUTUBE', authority: 'CRIADOR', url: 'https://www.youtube.com/watch?v=a4KhzVp-nFk', reviewedAt: '2026-07-14',
    note: 'Conteúdo comunitário sobre estrutura e perfis úteis em Contra-Ataque Longo.'
  },
  {
    id: 'reddit-formations-2026',
    title: 'Formações usadas para subir divisões em 2026',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1r6cmbx/what_formations_are_working_for_you_to_climb/', reviewedAt: '2026-07-14',
    note: 'Discussão recente mencionando 4-2-2-2 com Posse e 4-2-3-1 com Contra-Ataque Longo.'
  },
  {
    id: 'reddit-qc-risk',
    title: 'Quick Counter: pressão alta, linha alta e risco',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1nrcr3p/defending_with_quick_counter_feels_impossible/', reviewedAt: '2026-07-14',
    note: 'Discussão comunitária tratando Contra-Ataque Rápido como estilo de alto risco e alta recompensa.'
  },
  {
    id: 'reddit-dribble-slow',
    title: 'Drible: acelerar menos, deslocar o defensor e explodir depois',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1qhf97j/dribbling_tips/', reviewedAt: '2026-07-14',
    note: 'Consenso comunitário recente sobre controle, equilíbrio e uso seletivo da aceleração.'
  },
  {
    id: 'reddit-out-wide',
    title: 'Por Fora: largura sem abandonar cobertura',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1s8wn01/best_formation_and_tactics_for_out_wide_playstyle/', reviewedAt: '2026-07-14',
    note: 'Discussão comunitária sobre pontas, laterais e equilíbrio defensivo.'
  },
  {
    id: 'reddit-blitz-anti-meta',
    title: 'Blitz Curler como ameaça contra bloco baixo',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1q974gu/perfect_attackingminded_antimeta_tactics_for/', reviewedAt: '2026-07-14',
    note: 'Experiência comunitária específica; deve ser tratada como tática situacional e não regra universal.'
  },
  {
    id: 'reddit-lag-community',
    title: 'Input lag: relatos de rede, servidor e desempenho',
    platform: 'REDDIT', authority: 'COMUNIDADE', url: 'https://www.reddit.com/r/eFootball/comments/1m3u443/how_to_stop_lag_buffering_compensation_packet/', reviewedAt: '2026-07-14',
    note: 'Relatos comunitários mostram que conexão boa não elimina todos os atrasos; servidor e rota também influenciam.'
  }
];

const OFFICIAL = (id: string, title: string, summary: string, category: CommunityCategory, sourceIds: string[], tags: string[], extra: Partial<CommunityTip> = {}): CommunityTip => ({
  id, title, summary, category, sourceIds, tags, authority: 'OFICIAL', confidence: 'muito_alta', ...extra
});
const CONSENSUS = (id: string, title: string, summary: string, category: CommunityCategory, sourceIds: string[], tags: string[], extra: Partial<CommunityTip> = {}): CommunityTip => ({
  id, title, summary, category, sourceIds, tags, authority: 'CRIADOR', confidence: sourceIds.length >= 3 ? 'alta' : 'media', ...extra
});

export const COMMUNITY_TIPS: CommunityTip[] = [
  OFFICIAL('official-def-awareness', 'Consciência Defensiva ajuda a reagir à corrida do atacante', 'A partir da v5.2, Consciência Defensiva também influencia a aceleração durante a marcação. Um defensor não precisa receber velocidade máxima se já possui leitura defensiva muito forte.', 'FICHA', ['konami-v5-2'], ['defesa','consciência defensiva','aceleração','zagueiro','volante'], { positions:['CB','DMF','LB','RB'], officialBasis:'Mecânica oficial v5.2.0.' }),
  OFFICIAL('official-def-engagement', 'Dedicação Defensiva muda o início da pressão e a recomposição', 'Jogadores com maior Dedicação Defensiva começam a pressionar e correr para trás de forma mais adequada. A ficha deve considerar esse atributo junto com Consciência Defensiva e Resistência.', 'FICHA', ['konami-v5-0','konami-v5-4-mobile'], ['dedicação defensiva','pressão','recomposição','resistência'], { positions:['CB','DMF','CMF','LB','RB'] }),
  OFFICIAL('official-att-awareness', 'Talento Ofensivo participa da aceleração das corridas', 'A corrida ofensiva não depende apenas de Aceleração. Talento Ofensivo também participa da reação e do arranque sem bola, o que muda a meta de atacantes e infiltradores.', 'FICHA', ['konami-v5-0'], ['talento ofensivo','aceleração','movimentação','ataque'], { positions:['CF','SS','LWF','RWF','AMF'] }),
  OFFICIAL('official-dribble-v54', 'Drible atual valoriza mudança de direção e variação de ritmo', 'A v5.4 tornou mudanças de direção, Dash Dribble e Sharp Touch mais responsivos. Drible, Aceleração, Equilíbrio e domínio precisam ser avaliados em conjunto.', 'DRIBLE', ['konami-v5-4'], ['drible','sharp touch','aceleração','equilíbrio','1x1'], { positions:['SS','LWF','RWF','AMF','LMF','RMF'] }),
  OFFICIAL('official-matchup', 'Match-up deve acompanhar o drible antes do bote', 'O Match-up ganhou recuo, orientação corporal e aproximação melhores. A defesa manual deve fechar a rota antes de usar pressão ou desarme.', 'DEFESA', ['konami-v5-4','konami-v5-4-mobile','konami-controls'], ['match-up','marcação','bote','posicionamento'], { drill:'Faça 10 ataques defendendo apenas com Match-up e direção; use pressão só depois de fechar a linha de passe.' }),
  OFFICIAL('official-central-compact', 'A compactação central tornou a largura mais valiosa', 'A v5.4 aproximou meio e defesa e facilitou a concentração central. Ataques por fora, inversões e laterais com passe podem explorar melhor esse comportamento.', 'TATICA', ['konami-v5-4-mobile'], ['largura','por fora','inversão','lateral','ponta'], { styles:['POR_FORA','POSSE_DE_BOLA'] }),
  OFFICIAL('official-crossing-nerf', 'Cruzamento precisa de qualidade e preparação', 'Após a v5.4, recepções de cruzamentos ficaram menos automáticas. Curva, Passe alto, Cabeceio, Salto, Contato físico e posicionamento precisam trabalhar juntos.', 'FICHA', ['konami-v5-4-mobile'], ['cruzamento','curva','cabeceio','salto','contato físico'], { positions:['CF','LWF','RWF','LMF','RMF','LB','RB'] }),
  OFFICIAL('official-possession-fullbacks', 'Laterais sobem mais na Posse, exceto Lateral Defensivo', 'Na Posse de Bola, laterais tendem a ocupar posições mais altas, salvo cartas com Estilo de Jogo Lateral Defensivo. O volante e o lado oposto precisam oferecer cobertura.', 'TATICA', ['konami-v5-0'], ['posse','lateral ofensivo','lateral defensivo','cobertura'], { styles:['POSSE_DE_BOLA'], positions:['LB','RB','DMF'] }),
  OFFICIAL('official-possession-midfield', 'Meio-campistas sobem na Posse, exceto Primeiro Volante', 'Na Posse de Bola, MLG e VOL podem jogar mais altos, enquanto Primeiro Volante mantém maior proteção. A ficha precisa respeitar o Estilo de Jogo oficial da carta.', 'TATICA', ['konami-v5-0'], ['posse','primeiro volante','meio-campo','cobertura'], { styles:['POSSE_DE_BOLA'], positions:['DMF','CMF'] }),
  OFFICIAL('official-build-up-cb', 'Defensor criativo melhora a saída quando possui passe funcional', 'Zagueiros com perfil de construção recebem melhor para iniciar a jogada. Não é eficiente remover todo o Passe e Controle de um defensor técnico.', 'FICHA', ['konami-v5-0'], ['defensor criativo','passe','saída de bola','zagueiro'], { positions:['CB'] }),
  OFFICIAL('official-mobile-controls', 'Use Sharp Touch, Finesse Dribble e troca manual de forma situacional', 'O manual oficial confirma comandos diferentes para condução, explosão, proteção e troca manual. O treinamento deve praticar cada comando em um cenário próprio.', 'TREINO', ['konami-controls'], ['controles','sharp touch','finesse dribble','troca manual'], { drill:'Treine 5 minutos de cada comando separadamente antes de misturá-los em partidas.' }),
  OFFICIAL('official-manual-progression', 'Progressão manual deve seguir sua preferência, não apenas o recomendado', 'A própria descrição oficial permite distribuir pontos manualmente para personalizar o jogador. A ficha deve buscar desempenho na sua utilização e não apenas overall.', 'FICHA', ['konami-store'], ['progressão','overall','personalização','ficha'] ),
  OFFICIAL('official-stable-connection', 'Conexão estável é recomendada, mas não elimina todo delay', 'A Konami recomenda conexão estável para partidas online. Ainda assim, rota, servidor, adversário, aquecimento e FPS podem causar atraso.', 'DELAY', ['konami-store','reddit-lag-community'], ['conexão','delay','servidor','rede'], { avoidWhen:['Não prometer que DNS ou uma configuração única elimina o atraso.'] }),

  CONSENSUS('consensus-dribble-no-sprint', 'Acelere menos e use a explosão depois de deslocar o defensor', 'Guias e jogadores experientes convergem que conduzir com controle, reduzir sprint e acelerar somente quando surge espaço melhora o 1 contra 1.', 'DRIBLE', ['yt-l2-dribbling','yt-dribbling-guide','reddit-dribble-slow'], ['drible','sprint','mudança de ritmo','equilíbrio'], { drill:'Faça 20 duelos: 10 sem Dash até deslocar o defensor e 10 usando Sharp Touch somente depois do espaço aparecer.' }),
  CONSENSUS('consensus-defend-space', 'Defenda a rota, não persiga a bola o tempo inteiro', 'Conteúdos defensivos convergem em fechar linha de passe, controlar o volante e evitar quebrar a zaga com pressão contínua.', 'DEFESA', ['yt-defending-17','yt-defensive-formation','konami-v5-4-mobile'], ['defesa','linha de passe','volante','pressão'], { drill:'Em 10 ataques, controle primeiro VOL/MLG e só selecione o ZAG quando o atacante entrar na zona dele.' }),
  CONSENSUS('consensus-pressure-trigger', 'Pressão deve ter gatilho', 'Pressionar é mais seguro após passe ruim, domínio longo, jogador de costas ou recepção perto da lateral. Segurar pressão sem gatilho abre espaço.', 'DEFESA', ['yt-defending-17','yt-defensive-formation','konami-v5-4-mobile'], ['pressão','gatilho','marcação','bote'], { drill:'Marque 15 lances e só use pressão em quatro gatilhos: passe lento, costas, lateral e domínio ruim.' }),
  CONSENSUS('consensus-double-pivot', 'Dupla de meio complementar protege melhor a equipe', 'Formações competitivas usam com frequência dois jogadores centrais com características diferentes: um oferece proteção e outro construção ou chegada.', 'FORMACAO', ['yt-jvictor-4222','reddit-formations-2026','yt-formations-top5'], ['duplo volante','meio-campo','proteção','construção'], { formations:['4-2-2-2','4-2-3-1'] }),
  CONSENSUS('consensus-4222', '4-2-2-2 oferece duas linhas de passe e dois atacantes', 'A formação aparece em análises de pro player e discussões recentes por combinar dois médios, dois criadores e dois jogadores de frente.', 'FORMACAO', ['yt-jvictor-4222','reddit-formations-2026','yt-formations-top5'], ['4-2-2-2','meta','dois atacantes','meio'], { formations:['4-2-2-2'] }),
  CONSENSUS('consensus-4231', '4-2-3-1 é uma base segura para pressão e controle', 'A estrutura mantém dois médios de proteção, três opções atrás do atacante e boa capacidade de ajustar largura ou centro.', 'FORMACAO', ['reddit-qc-risk','reddit-formations-2026','yt-formations-top5'], ['4-2-3-1','pressão','equilíbrio','controle'], { formations:['4-2-3-1'] }),
  CONSENSUS('consensus-4312', '4-3-1-2 favorece jogo central, tabelas e LBC', 'A estrutura estreita pode criar superioridade central e dois atacantes próximos, mas exige laterais ou meio-campistas que cubram os corredores.', 'FORMACAO', ['yt-rank1-4312','yt-formations-top5'], ['4-3-1-2','jogo central','tabela','LBC'], { formations:['4-3-1-2'], styles:['CONTRA_ATAQUE'] }),
  CONSENSUS('consensus-5212', '5-2-1-2 oferece proteção extra e saída por alas', 'A formação associada a JEANSUI usa três zagueiros, dois alas e dois atacantes. Pode ser sólida, mas depende de resistência e cobertura lateral.', 'FORMACAO', ['yt-jeansui-5212'], ['5-2-1-2','três zagueiros','alas','proteção'], { formations:['5-3-2'] }),
  CONSENSUS('consensus-qc-risk', 'Contra-Ataque Rápido exige pressão coordenada e aceita risco nas costas', 'A comunidade trata o estilo como alto risco e alta recompensa. Zagueiros, VOL e laterais precisam de reação, cobertura e resistência.', 'TATICA', ['reddit-qc-risk','yt-defending-17'], ['contra-ataque rápido','linha alta','pressão','cobertura'], { styles:['CONTRA_ATAQUE_RAPIDO'] }),
  CONSENSUS('consensus-lbc-direct', 'Contra-Ataque Longo precisa de recepção, passe vertical e segunda bola', 'Guias de LBC valorizam um alvo capaz de segurar a bola, atacantes próximos e meio que recolha a sobra.', 'TATICA', ['yt-jvictor-4222','yt-lbc-setup','yt-rank1-4312'], ['LBC','pivô','passe vertical','segunda bola'], { styles:['CONTRA_ATAQUE'], positions:['CF','SS','DMF','CMF'] }),
  CONSENSUS('consensus-outwide-cover', 'Por Fora precisa de largura e cobertura simultâneas', 'Ala, ponta ou lateral deve dar amplitude, mas alguém precisa proteger o espaço deixado. Subir os dois lados ao mesmo tempo aumenta o risco.', 'TATICA', ['reddit-out-wide','konami-v5-4-mobile'], ['por fora','largura','lateral','cobertura'], { styles:['POR_FORA'] }),
  CONSENSUS('consensus-player-build-not-ovr', 'Treine para ações em campo, não para o maior overall', 'Guias de progressão e a própria personalização oficial favorecem atingir faixas funcionais e preservar a identidade da carta.', 'FICHA', ['yt-progression','konami-store'], ['overall','progressão','retorno marginal','identidade'] ),
  CONSENSUS('consensus-functional-threshold', 'Pare de investir quando o próximo nível custa muito e muda pouco', 'Criadores de progressão costumam comparar ganho funcional e custo. A ficha deve transferir pontos quando o retorno marginal cai.', 'FICHA', ['yt-progression'], ['retorno marginal','custo','faixa funcional','pontos'] ),
  CONSENSUS('consensus-blitz-lowblock', 'Blitz Curler é mais valioso quando o jogador recebe perto da área', 'A comunidade usa Blitz Curler como ameaça contra bloco baixo. Em posições distantes do gol, a habilidade tende a aparecer menos e não deve dominar a ficha.', 'HABILIDADE', ['reddit-blitz-anti-meta'], ['Blitz Curler','bloco baixo','finalização','SA'], { positions:['SS','LWF','RWF','AMF','CF'], requiredSkills:['Blitz Curler'], confidence:'media' }),
  CONSENSUS('consensus-skill-context', 'Habilidade especial só merece pontos quando aparece no seu uso real', 'Possuir uma habilidade não significa que ela será usada com frequência. Posição, lado, formação e comportamento do usuário precisam participar da recomendação.', 'HABILIDADE', ['yt-progression','reddit-blitz-anti-meta'], ['habilidade especial','posição','frequência','desperdício'] ),
  CONSENSUS('consensus-wide-vs-compact', 'Quando o rival fecha o centro, inverta e ataque por fora', 'A compactação defensiva oficial e as discussões de Por Fora reforçam inversão, passe alto funcional e ocupação dos corredores.', 'ATAQUE', ['konami-v5-4-mobile','reddit-out-wide'], ['ataque por fora','inversão','compactação','corredor'] ),
  CONSENSUS('consensus-one-touch', 'Passe de primeira funciona melhor com orientação corporal e opção preparada', 'O usuário deve olhar antes de receber e evitar apertar passe no último instante. Atributos e habilidade ajudam, mas decisão e ângulo continuam importantes.', 'ATAQUE', ['yt-defending-17','yt-progression'], ['passe de primeira','orientação','decisão','ângulo'], { drill:'Treine sequências de três passes e escolha o destino antes do domínio; registre quantos passes saem atrasados.' }),
  CONSENSUS('consensus-mobile-60fps', 'Priorize FPS estável antes de qualidade máxima', 'Guias mobile convergem em usar 60 FPS quando o aparelho sustenta sem aquecer. Se houver queda e aquecimento, 30 FPS estáveis podem responder melhor que 60 instáveis.', 'CONFIGURACAO', ['yt-settings-v54','yt-settings-smooth'], ['60 fps','30 fps','gráficos','aquecimento','estabilidade'] ),
  CONSENSUS('consensus-background-apps', 'Reduza processos em segundo plano e controle a temperatura', 'Fechar apps pesados, evitar economia de bateria durante a partida e manter o aparelho frio pode reduzir quedas de desempenho local.', 'DELAY', ['yt-settings-v54','yt-settings-smooth'], ['aplicativos','temperatura','bateria','desempenho'] ),
  CONSENSUS('consensus-5ghz', 'Prefira 5 GHz perto do roteador ou cabo em plataformas compatíveis', 'A comunidade recomenda conexão com menos interferência. Em 5 GHz, fique próximo do roteador; em distância grande, estabilidade pode cair.', 'DELAY', ['yt-settings-smooth','reddit-lag-community'], ['5 GHz','roteador','interferência','estabilidade'] ),
  CONSENSUS('consensus-server-caveat', 'Não culpe a ficha por todo comando atrasado', 'Input delay pode vir de servidor, rota, adversário, aquecimento, FPS ou comando. O app deve separar essas causas antes de recomendar nova progressão.', 'DELAY', ['reddit-lag-community','konami-store'], ['servidor','rota','fps','aquecimento','diagnóstico'], { confidence:'alta' }),
  CONSENSUS('consensus-train-repeat', 'Treinos curtos e repetidos corrigem melhor um erro específico', 'Guias e discussões de aprendizagem favorecem repetir uma ação com uma meta clara, registrar o erro e aumentar a dificuldade somente após consistência.', 'TREINO', ['yt-defending-17','yt-dribbling-guide','konami-v5-2'], ['treino','repetição','meta','feedback'], { drill:'Escolha um erro, faça 10 repetições, registre acertos e repita até atingir 8/10 em duas sessões.' })
];

const confidenceWeight: Record<CommunityConfidence, number> = {
  muito_alta: 40,
  alta: 30,
  media: 18,
  baixa: 8,
  controversa: 0
};

const authorityWeight: Record<CommunityAuthority, number> = {
  OFICIAL: 35,
  PRO_PLAYER: 24,
  CRIADOR: 16,
  COMUNIDADE: 10
};

function normalized(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tipScore(tip: CommunityTip, result: AnalysisResult) {
  const reasons: string[] = [];
  let score = confidenceWeight[tip.confidence] + authorityWeight[tip.authority] + Math.min(16, tip.sourceIds.length * 4);
  const position = result.bestPosition.code;
  const style = result.tacticalProfile.style;
  const formation = result.tacticalProfile.formation;
  const playstyle = normalized(result.parsed.playstyle);
  const skillText = normalized([...result.parsed.nativeSkills, ...result.parsed.specialSkills].join(' '));
  const contextText = normalized([
    result.buildName,
    result.note,
    result.recommendationExplanation.join(' '),
    result.strengths.join(' '),
    result.weaknesses.join(' '),
    result.parsed.playstyle,
    result.bestPosition.label,
    style,
    formation
  ].join(' '));

  if (tip.positions?.includes(position)) { score += 34; reasons.push(`aplica-se à posição ${result.bestPosition.label}`); }
  if (tip.styles?.includes(style)) { score += 30; reasons.push(`combina com ${style}`); }
  if (tip.formations?.includes(formation)) { score += 26; reasons.push(`foi relacionado à formação ${formation}`); }
  if (tip.requiredSkills?.some(skill => skillText.includes(normalized(skill)))) { score += 38; reasons.push('habilidade necessária confirmada na carta'); }
  const matchedTags = tip.tags.filter(tag => contextText.includes(normalized(tag)) || playstyle.includes(normalized(tag)));
  if (matchedTags.length) { score += Math.min(28, matchedTags.length * 7); reasons.push(`contexto relacionado: ${matchedTags.slice(0,3).join(', ')}`); }
  if (tip.category === 'FICHA') score += 10;
  if (tip.authority === 'OFICIAL') reasons.push('base oficial da Konami');
  if (tip.sourceIds.length >= 3) reasons.push(`consenso entre ${tip.sourceIds.length} fontes`);
  return { score, reasons };
}

export function buildCommunityIntelligence(result: AnalysisResult): CommunityIntelligenceReport {
  const ranked = COMMUNITY_TIPS.map(tip => {
    const ranking = tipScore(tip, result);
    return { ...tip, score: ranking.score, matchReasons: ranking.reasons, sourceCount: tip.sourceIds.length };
  }).sort((a,b) => b.score - a.score || b.sourceCount - a.sourceCount || a.title.localeCompare(b.title, 'pt-BR'));

  const coverage = (['FICHA','ATAQUE','DEFESA','DRIBLE','TATICA','FORMACAO','HABILIDADE','TREINO','DELAY','CONFIGURACAO'] as CommunityCategory[])
    .map(category => ({ category, count: COMMUNITY_TIPS.filter(tip => tip.category === category).length }));

  const conflicts = [
    {
      title: '60 FPS contra estabilidade térmica',
      explanation: 'Criadores costumam recomendar 60 FPS, mas a escolha correta depende de o aparelho sustentar essa taxa sem aquecer e perder quadros. O app deve preferir estabilidade medida.'
    },
    {
      title: 'Formação meta contra identidade do elenco',
      explanation: 'Uma formação usada por pro player não é automaticamente a melhor para outro elenco. O app mantém formação, técnico, jogadores e estilo como contexto obrigatório.'
    },
    {
      title: 'Atributo alto contra retorno marginal',
      explanation: 'Alguns guias priorizam atingir números muito altos; outros valorizam equilíbrio. O motor mantém o custo real e a utilidade da ação em campo como desempate.'
    },
    {
      title: 'Delay local contra atraso de servidor',
      explanation: 'Configuração e temperatura podem ser melhoradas localmente, mas nenhum ajuste do celular garante corrigir servidor, rota ou conexão do adversário.'
    }
  ];

  const recommended = ranked.slice(0, 18);
  return {
    version: '26.60.0',
    updatedAt: '2026-07-14',
    snapshotLabel: 'Pacote comunitário curado — julho de 2026',
    sources: COMMUNITY_SOURCES,
    allTips: COMMUNITY_TIPS,
    recommended,
    officialMechanics: ranked.filter(item => item.authority === 'OFICIAL').slice(0, 12),
    strongConsensus: ranked.filter(item => item.authority !== 'OFICIAL' && (item.confidence === 'alta' || item.sourceCount >= 3)).slice(0, 14),
    experimental: ranked.filter(item => item.confidence === 'media' || item.confidence === 'baixa' || item.confidence === 'controversa').slice(0, 10),
    conflicts,
    coverage,
    safeguards: [
      'Dicas oficiais e comunitárias ficam separadas.',
      'Nenhuma formação, ficha ou configuração é aplicada automaticamente.',
      'Conteúdo de criadores é resumido e contextualizado; o app não copia vídeos ou roteiros.',
      'Uma recomendação de pro player só recebe prioridade quando combina com a carta, o técnico, a formação e o estilo escolhidos.',
      'TikTok e outras redes não são indexadas de forma completa; o pacote usa apenas fontes públicas que puderam ser verificadas.',
      'O pacote é um snapshot offline e deve ser revisado após atualizações relevantes do jogo.'
    ],
    verdict: `${recommended.length} dicas foram priorizadas para ${result.parsed.playerName} em ${result.bestPosition.label}, usando ${COMMUNITY_SOURCES.length} fontes públicas e ${COMMUNITY_TIPS.length} recomendações normalizadas.`
  };
}
