import { PLAYSTYLE_OPTIONS, type Objective, type TacticalFormation, type TacticalStyle } from '@/lib/analyzerDomain';

export const CALIBRATION_KEY = 'buildmaster_ocr_zones_v24_3_goleiro_stable';
export const EFHUB_MANUAL_CALIBRATION_KEY = 'buildmaster_efhub_visual_calibration_v31_81';

export const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';
export const VAULT_FOLDERS_KEY = 'buildmaster_vault_folders_v25_33';

export const RULE_PACK_URL_KEY = 'buildmaster_rule_pack_url_v24_29';

export const objectives: Array<{ value: Objective; title: string; hint: string }> = [
  {
    value: 'COMPETITIVE',
    title: 'Desempenho máximo',
    hint: 'rendimento real em campo, não GER alto; DNA + função + Pareto + A/B real + aprendizagem longitudinal'
  }
];

export const playstyleOptions = PLAYSTYLE_OPTIONS;
export const defensivePlaystyleOptions = ['Básico', 'Pressão no Ataque', ...PLAYSTYLE_OPTIONS] as const;









export const formations: Array<{ value: TacticalFormation; label: string }> = [
  { value: 'AUTO', label: 'Automático inteligente' },
  { value: '4-2-2-2', label: '4-2-2-2 — 2 meias + 2 atacantes' },
  { value: '4-3-3', label: '4-3-3 — pontas abertos' },
  { value: '4-1-2-3', label: '4-1-2-3 — VOL + 2 meias + trio' },
  { value: '4-2-1-3', label: '4-2-1-3 — 2 volantes + MAT + trio' },
  { value: '4-2-3-1', label: '4-2-3-1 — proteção + 3 meias' },
  { value: '4-3-1-2', label: '4-3-1-2 — MAT + 2 atacantes' },
  { value: '4-1-3-2', label: '4-1-3-2 — VOL único + pressão' },
  { value: '4-4-2', label: '4-4-2 — equilíbrio clássico' },
  { value: '4-1-4-1', label: '4-1-4-1 — posse segura' },
  { value: '3-2-4-1', label: '3-2-4-1 — saída de três' },
  { value: '3-4-3', label: '3-4-3 — alas + ataque aberto' },
  { value: '3-5-2', label: '3-5-2 — meio dominante' },
  { value: '5-3-2', label: '5-3-2 — bloco seguro' },
  { value: '5-2-3', label: '5-2-3 — defesa + pontas' }
];

export const tacticalStyles: Array<{ value: TacticalStyle; label: string }> = [
  { value: 'AUTO', label: 'Automático inteligente' },
  { value: 'POSSE_DE_BOLA', label: 'Posse de bola' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque normal' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido' },
  { value: 'POR_FORA', label: 'Por fora' },
  { value: 'PASSE_LONGO', label: 'Passe longo' },
  { value: 'SOBREPOSICAO', label: 'Sobreposição' }
];

export const tacticalStyleName: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Por fora',
  PASSE_LONGO: 'Passe longo',
  SOBREPOSICAO: 'Sobreposição'
};

export type FormationGuide = {
  title: string;
  bestStyle: TacticalStyle;
  styleReason: string;
  howToPlay: string;
  roles: string[];
};

export const formationGuides: Record<Exclude<TacticalFormation, 'AUTO'>, FormationGuide> = {
  '4-2-2-2': {
    title: '4-2-2-2 — Compacto e direto',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'combina bem com dois meias por dentro e dupla de ataque para sair rápido após o roubo.',
    howToPlay: 'Recupere com VOL/MLG, toque vertical no MAT/SA e finalize rápido antes da defesa adversária recompor.',
    roles: ['VOL: marcação e primeiro passe', 'MLG: condução curta e cobertura', 'MAT/SA: giro e assistência', 'CA: ataque ao espaço e finalização']
  },
  '4-3-3': {
    title: '4-3-3 — Amplitude e pressão pelos lados',
    bestStyle: 'POR_FORA',
    styleReason: 'usa pontas e laterais para abrir campo, cruzar, inverter jogadas e atacar o lado fraco.',
    howToPlay: 'Abra com PE/PD, apoie com laterais, procure cruzamento rasteiro/alto e finalize com CA bem posicionado.',
    roles: ['Pontas: velocidade, drible e diagonal', 'CA: presença de área', 'MLG: cobertura e passe', 'Laterais: apoio com recomposição']
  },
  '4-1-2-3': {
    title: '4-1-2-3 — Triângulo central ofensivo',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'o VOL protege e os dois meias criam linhas de passe para manter controle sem perder verticalidade.',
    howToPlay: 'Faça triangulações curtas, atraia a marcação no meio e solte nos pontas quando abrir espaço.',
    roles: ['VOL: segurança e cobertura', 'MLG/MAT: passe curto e giro', 'Pontas: amplitude', 'CA: finalização e pivô curto']
  },
  '4-2-1-3': {
    title: '4-2-1-3 — Proteção e trio ofensivo',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'a dupla de volantes dá segurança para o MAT acelerar o trio de ataque.',
    howToPlay: 'Roube por dentro, passe no MAT e ataque com os três da frente em velocidade.',
    roles: ['2 VOL/MLG: roubo e cobertura', 'MAT: passe final', 'Pontas: profundidade', 'CA: finalizar no primeiro toque']
  },
  '4-2-3-1': {
    title: '4-2-3-1 — Controle com proteção dupla',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'a base com dois volantes permite circular a bola e criar com três meias atrás do CA.',
    howToPlay: 'Gire a bola entre laterais e meias, espere o espaço e use o CA como pivô ou finalizador.',
    roles: ['Dupla central: proteção e passe', 'Meias abertos: infiltração', 'MAT: criação', 'CA: pivô e presença de área']
  },
  '4-3-1-2': {
    title: '4-3-1-2 — Compacto pelo centro',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'protege o corredor central e usa MAT com dois atacantes para contra-atacar com segurança.',
    howToPlay: 'Feche o meio, recupere, acione o MAT e ataque com tabelas curtas entre os dois atacantes.',
    roles: ['MAT: último passe', '2 CA/SA: tabela e ataque ao espaço', 'MLG: pressão central', 'Laterais: única largura do time']
  },
  '4-1-3-2': {
    title: '4-1-3-2 — Pressão e ataque em dupla',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'muitos jogadores próximos para recuperar rápido e servir a dupla de ataque.',
    howToPlay: 'Pressione após perder, recupere no meio e finalize rápido com a dupla da frente.',
    roles: ['VOL: proteger contra bola nas costas', 'Linha de 3: pressão e passe', 'Dupla de ataque: movimentação e finalização']
  },
  '4-4-2': {
    title: '4-4-2 — Equilíbrio clássico',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'mantém duas linhas fortes e dois atacantes prontos para sair quando a bola é recuperada.',
    howToPlay: 'Defenda em bloco médio, force o adversário para o lado e ataque com cruzamentos ou passes diretos.',
    roles: ['Meias laterais: recomposição e cruzamento', '2 atacantes: presença e tabela', 'Centrais: cobertura e segundo passe']
  },
  '4-1-4-1': {
    title: '4-1-4-1 — Posse e controle territorial',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'tem muitas linhas de passe e um VOL fixo para segurar a transição defensiva.',
    howToPlay: 'Circule a bola com paciência, avance em bloco e não force passe vertical sem apoio.',
    roles: ['VOL: âncora defensiva', 'Meias: circulação e pressão pós-perda', 'CA: pivô e finalização', 'Laterais: apoio alternado']
  },
  '3-2-4-1': {
    title: '3-2-4-1 — Superioridade no meio',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'a saída de três e os dois volantes sustentam posse com muitos jogadores entrelinhas.',
    howToPlay: 'Saia com três, encontre os meias entre linhas e use os alas para prender a defesa adversária aberta.',
    roles: ['3 ZAG: cobertura e saída', '2 VOL: proteção', 'Alas/meias: amplitude e criação', 'CA: finalizar e prender zagueiros']
  },
  '3-4-3': {
    title: '3-4-3 — Ataque aberto e agressivo',
    bestStyle: 'POR_FORA',
    styleReason: 'favorece amplitude máxima com alas e pontas pressionando os lados.',
    howToPlay: 'Ataque pelos corredores, use inversões rápidas e proteja contra contra-ataques com três zagueiros fortes.',
    roles: ['Alas: fôlego e cruzamento', 'Pontas: 1 contra 1', 'Zagueiros: cobertura longa', 'CA: presença de área']
  },
  '3-5-2': {
    title: '3-5-2 — Meio dominante e dupla de ataque',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'ganha o meio, rouba por dentro e acha dois atacantes em vantagem.',
    howToPlay: 'Feche o centro, use alas para abrir e procure a dupla de ataque com passe rápido após recuperar.',
    roles: ['3 ZAG: segurança', 'Alas: amplitude total', 'Meias: pressão e passe', '2 atacantes: tabela e profundidade']
  },
  '5-3-2': {
    title: '5-3-2 — Segurança máxima',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'protege a área, baixa o risco e usa dois atacantes para aproveitar espaço nas costas.',
    howToPlay: 'Defenda compacto, não quebre a linha de cinco sem necessidade e saia em passe direto para a dupla.',
    roles: ['Laterais/alas: recomposição', '3 ZAG: cobertura aérea', 'Meio: roubo e passe direto', '2 atacantes: profundidade']
  },
  '5-2-3': {
    title: '5-2-3 — Defesa forte e pontas velozes',
    bestStyle: 'PASSE_LONGO',
    styleReason: 'a defesa baixa encontra pontas e CA com lançamentos rápidos para atacar campo aberto.',
    howToPlay: 'Recupere baixo, procure passe longo ou inversão rápida para os pontas e ataque com poucos toques.',
    roles: ['5 defensores: bloco seguro', '2 meios: interceptação e lançamento', 'Pontas: velocidade', 'CA: pivô e finalização']
  }
};
