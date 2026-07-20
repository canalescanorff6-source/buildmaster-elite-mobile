import type { PositionCode, TacticalStyle } from './analyzerDomain';

export type FormationCoachStyle = Extract<TacticalStyle, 'POSSE_DE_BOLA' | 'CONTRA_ATAQUE_RAPIDO' | 'CONTRA_ATAQUE'>;
export type PlayerStyleTier = 'muito-bom' | 'usavel' | 'situacional' | 'neutro' | 'evitar';

export type PlayerStyleMeta2026 = {
  canonicalName: CanonicalPlayerPlaystyle;
  tier: PlayerStyleTier;
  score: number;
  verdict: string;
  advice: string;
  preferredPositions: PositionCode[];
  usablePositions?: PositionCode[];
  restrictions?: string[];
};

export const FORMATION_COACH_STYLES: readonly FormationCoachStyle[] = [
  'POSSE_DE_BOLA',
  'CONTRA_ATAQUE_RAPIDO',
  'CONTRA_ATAQUE'
] as const;

export const FORMATION_COACH_STYLE_OPTIONS: ReadonlyArray<{ value: FormationCoachStyle; label: string; summary: string }> = [
  { value: 'POSSE_DE_BOLA', label: 'Posse de bola', summary: 'Aproxima setores, cria linhas curtas e controla o ritmo.' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido', summary: 'Recupera e acelera imediatamente com verticalidade.' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque normal', summary: 'Protege o bloco e sai com segurança quando o rival se expõe.' }
];

export function normalizeFormationCoachStyle(value: TacticalStyle | string | null | undefined): FormationCoachStyle {
  return FORMATION_COACH_STYLES.includes(value as FormationCoachStyle)
    ? value as FormationCoachStyle
    : 'POSSE_DE_BOLA';
}

export const CANONICAL_PLAYER_PLAYSTYLES = [
  'Goleiro Ofensivo',
  'Goleiro Defensivo',
  'Atacante Surpresa',
  'Defensor Criativo',
  'Destruidor',
  'Lateral Ofensivo',
  'Lateral Atacante',
  'Perito em Cruzamento',
  'Lateral Defensivo',
  'Orquestrador',
  '1º Volante',
  'Meia versátil',
  'Infiltração',
  'Clássico 10',
  'Lateral Móvel',
  'Ala Produtivo',
  'Armador Criativo',
  'Atacante Pivô',
  'Pivô',
  'Homem de Área',
  'Puxa Marcação',
  'Artilheiro'
] as const;

export type CanonicalPlayerPlaystyle = typeof CANONICAL_PLAYER_PLAYSTYLES[number];

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STYLE_ALIASES: Array<[RegExp, CanonicalPlayerPlaystyle]> = [
  [/goleiro ofensivo|offensive goalkeeper/, 'Goleiro Ofensivo'],
  [/goleiro defensivo|defensive goalkeeper/, 'Goleiro Defensivo'],
  [/atacante surpresa|extra frontman/, 'Atacante Surpresa'],
  [/defensor criativo|construtor|build up/, 'Defensor Criativo'],
  [/volante destruidor|zagueiro destruidor|o destruidor|destruidor|destroyer/, 'Destruidor'],
  [/lateral ofensivo|offensive full back/, 'Lateral Ofensivo'],
  [/lateral atacante|full back finisher/, 'Lateral Atacante'],
  [/perito em cruzamento|cross specialist/, 'Perito em Cruzamento'],
  [/lateral defensivo|defensive full back/, 'Lateral Defensivo'],
  [/orquestrador|orchestrator/, 'Orquestrador'],
  [/1 volante|primeiro volante|ancora|anchor man/, '1º Volante'],
  [/meia versatil|box to box|todo campo/, 'Meia versátil'],
  [/jogador de infiltracao|infiltracao|hole player/, 'Infiltração'],
  [/classico n? ?10|classico 10|classic no 10/, 'Clássico 10'],
  [/lateral movel|flanco movel|roaming flank/, 'Lateral Móvel'],
  [/ala produtivo|ponta prolifico|prolific winger/, 'Ala Produtivo'],
  [/armador criativo|criador de jogadas|creative playmaker/, 'Armador Criativo'],
  [/atacante pivo|deep lying forward/, 'Atacante Pivô'],
  [/^pivo$|target man/, 'Pivô'],
  [/homem de area|fox in the box/, 'Homem de Área'],
  [/puxa marcacao|dummy runner/, 'Puxa Marcação'],
  [/artilheiro|goal poacher|atacante matador/, 'Artilheiro']
];

export function canonicalizePlayerPlaystyle(value: unknown): CanonicalPlayerPlaystyle | null {
  const text = normalize(value);
  if (!text) return null;
  for (const [pattern, canonical] of STYLE_ALIASES) {
    if (pattern.test(text)) return canonical;
  }
  return null;
}

const BASE_META: Record<CanonicalPlayerPlaystyle, Omit<PlayerStyleMeta2026, 'canonicalName'>> = {
  'Goleiro Ofensivo': {
    tier: 'neutro', score: 78, verdict: 'Tanto faz',
    advice: 'Escolha pela qualidade da carta; o estilo do goleiro não é prioridade nesta regra.',
    preferredPositions: ['GK']
  },
  'Goleiro Defensivo': {
    tier: 'neutro', score: 78, verdict: 'Tanto faz',
    advice: 'Escolha pela qualidade da carta; o estilo do goleiro não é prioridade nesta regra.',
    preferredPositions: ['GK']
  },
  'Atacante Surpresa': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal para zagueiro.',
    preferredPositions: ['CB']
  },
  'Defensor Criativo': {
    tier: 'muito-bom', score: 95, verdict: 'Muito bom',
    advice: 'Prioridade para a saída e para manter a linha organizada.',
    preferredPositions: ['CB']
  },
  'Destruidor': {
    tier: 'situacional', score: 58, verdict: 'Depende da posição',
    advice: 'Muito bom em ZAG no eFootball 2026, mas ruim como VOL nesta regra.',
    preferredPositions: ['CB'], usablePositions: ['DMF', 'CMF'],
    restrictions: ['Não usar dois zagueiros Destruidores juntos.']
  },
  'Lateral Ofensivo': {
    tier: 'evitar', score: 38, verdict: 'Evitar',
    advice: 'Pode virar avenida no contra-ataque. Se usar, limite a um lado e aplique instrução defensiva.',
    preferredPositions: ['LB', 'RB'], restrictions: ['No máximo um lateral ofensivo ou atacante por formação.', 'Usar instrução defensiva.']
  },
  'Lateral Atacante': {
    tier: 'evitar', score: 36, verdict: 'Evitar',
    advice: 'Ataca por dentro e pode deixar o corredor exposto. Use apenas um e com instrução defensiva.',
    preferredPositions: ['LB', 'RB'], restrictions: ['No máximo um lateral ofensivo ou atacante por formação.', 'Usar instrução defensiva.']
  },
  'Perito em Cruzamento': {
    tier: 'usavel', score: 72, verdict: 'Usável',
    advice: 'Avança menos e é uma alternativa aceitável ao lateral ofensivo.',
    preferredPositions: ['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF']
  },
  'Lateral Defensivo': {
    tier: 'muito-bom', score: 96, verdict: 'Muito bom',
    advice: 'Prioridade para proteger os corredores e evitar contra-ataques.',
    preferredPositions: ['LB', 'RB']
  },
  'Orquestrador': {
    tier: 'evitar', score: 25, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal; Meia versátil ou 1º Volante entregam mais.',
    preferredPositions: ['CMF', 'DMF']
  },
  '1º Volante': {
    tier: 'muito-bom', score: 98, verdict: 'Muito bom',
    advice: 'Principal escolha para proteger a frente da defesa.',
    preferredPositions: ['DMF']
  },
  'Meia versátil': {
    tier: 'muito-bom', score: 96, verdict: 'Muito bom',
    advice: 'Melhor opção para dar equilíbrio, intensidade e cobertura no meio.',
    preferredPositions: ['CMF', 'DMF', 'LMF', 'RMF']
  },
  'Infiltração': {
    tier: 'muito-bom', score: 97, verdict: 'Muito bom',
    advice: 'Prioridade para meias ofensivos e SA atacarem espaços.',
    preferredPositions: ['AMF', 'SS'], usablePositions: ['CMF', 'LMF', 'RMF']
  },
  'Clássico 10': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal no meta definido.',
    preferredPositions: ['AMF', 'CMF']
  },
  'Lateral Móvel': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal.',
    preferredPositions: ['LWF', 'RWF', 'LMF', 'RMF']
  },
  'Ala Produtivo': {
    tier: 'evitar', score: 30, verdict: 'Ruim como ponta',
    advice: 'Ponta não é prioridade; como SA pode render mesmo com o estilo inativo.',
    preferredPositions: ['LWF', 'RWF'], usablePositions: ['SS'],
    restrictions: ['Em SA, o estilo pode ficar inativo; avalie a carta pelos atributos.']
  },
  'Armador Criativo': {
    tier: 'muito-bom', score: 95, verdict: 'Muito bom',
    advice: 'Ótimo para produzir passe final, apoio e controle entre linhas.',
    preferredPositions: ['AMF', 'SS', 'CMF', 'LWF', 'RWF']
  },
  'Atacante Pivô': {
    tier: 'usavel', score: 68, verdict: 'Rende bem',
    advice: 'É utilizável, mas Infiltração ou Artilheiro costumam render mais.',
    preferredPositions: ['CF', 'SS']
  },
  'Pivô': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal.',
    preferredPositions: ['CF']
  },
  'Homem de Área': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal.',
    preferredPositions: ['CF']
  },
  'Puxa Marcação': {
    tier: 'evitar', score: 24, verdict: 'Bagre',
    advice: 'Não usar como recomendação principal.',
    preferredPositions: ['CF', 'SS']
  },
  'Artilheiro': {
    tier: 'muito-bom', score: 98, verdict: 'Muito bom',
    advice: 'Prioridade para atacar a última linha e finalizar.',
    preferredPositions: ['CF', 'SS']
  }
};

export function getPlayerStyleMeta2026(value: unknown, position?: PositionCode | null): PlayerStyleMeta2026 | null {
  const canonicalName = canonicalizePlayerPlaystyle(value);
  if (!canonicalName) return null;
  const base = BASE_META[canonicalName];
  let score = base.score;
  let tier = base.tier;
  let verdict = base.verdict;
  let advice = base.advice;

  if (canonicalName === 'Destruidor') {
    if (position === 'CB') {
      score = 91;
      tier = 'muito-bom';
      verdict = 'Muito bom em ZAG';
      advice = 'Muito bom no eFootball 2026, mas use somente um Destruidor na dupla ou trio de zaga.';
    } else if (position === 'DMF' || position === 'CMF') {
      score = 24;
      tier = 'evitar';
      verdict = 'Bagre como volante';
      advice = 'O 1º Volante ou Meia versátil executa melhor esta função.';
    }
  }

  if (canonicalName === 'Ala Produtivo' && position === 'SS') {
    score = 62;
    tier = 'situacional';
    verdict = 'Pode render como SA';
    advice = 'Pode render pelos atributos mesmo sem ativar o estilo de jogo.';
  }

  if (canonicalName === 'Infiltração' && position && !['AMF', 'SS'].includes(position)) {
    score = ['CMF', 'LMF', 'RMF'].includes(position) ? 82 : 52;
  }

  const preferred = base.preferredPositions.includes(position as PositionCode);
  const usable = base.usablePositions?.includes(position as PositionCode) ?? false;
  if (position && !preferred && !usable) score = Math.min(score, 45);

  return { canonicalName, ...base, score, tier, verdict, advice };
}

export function playerStyleTierLabel(tier: PlayerStyleTier): string {
  return ({
    'muito-bom': 'Muito bom',
    usavel: 'Usável',
    situacional: 'Situacional',
    neutro: 'Tanto faz',
    evitar: 'Evitar'
  } as const)[tier];
}
