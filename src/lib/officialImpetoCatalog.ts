/**
 * Nomes de Ímpetos reconhecidos pelo BuildMaster.
 *
 * Este catálogo é compartilhado entre leitura OCR, análise da carta e motor de
 * recomendação. Ele evita que uma tela reconheça menos nomes do que outra e
 * impede que habilidades especiais de jogador sejam confundidas com Ímpetos.
 */
export const RECOGNIZABLE_IMPETO_NAMES = [
  'Chute',
  'Cobrança de falta',
  'Disputa aérea',
  'Passe',
  'Condução de bola',
  'Técnica',
  'Defesa',
  'Duelo',
  'Agilidade',
  'Fisicalidade',
  'Goleiro',
  'Instinto artilheiro',
  'Guardião',
  'Motor do time',
  'Defesaça',
  'Cruzamento',
  'Fantasista',
  'Volante criativo',
  'Reconstrução',
  'Precisão',
  'Criador ofensivo',
  'Proteção de Posse',
  'Equilibrado',
  'Transição ofensiva',
  'Bloqueio Aéreo',
  'Rompe-barreira',
  'Força',
  'Movimento sem a bola',
  'Roubo de bola'
] as const;

export type RecognizableImpetoName = typeof RECOGNIZABLE_IMPETO_NAMES[number];

export function isRecognizableImpetoName(value: string): value is RecognizableImpetoName {
  return RECOGNIZABLE_IMPETO_NAMES.some((name) => name.toLocaleLowerCase('pt-BR') === value.trim().toLocaleLowerCase('pt-BR'));
}


/** Metadados públicos confirmados pela Konami para Criação de Ímpeto. */
export const IMPETO_CRAFTING_SELECTABLE_COUNT = 28 as const;
export const IMPETO_RANDOM_POOL_LIMITS = {
  outfieldMin: 14 as const,
  outfieldMax: 15 as const,
  goalkeeper: 8 as const
};

/**
 * O catálogo de reconhecimento pode conter nomes de Ímpetos especiais/de carta.
 * Por isso, a contagem de 28 tipos selecionáveis NÃO é usada para truncar o OCR.
 */
export const IMPETO_CRAFTING_POLICY = 'Somente cartas com Espaço/Vaga de Ímpeto confirmado podem receber recomendação de gasto; Ímpetos já presentes são preservados e entram no cálculo.' as const;
