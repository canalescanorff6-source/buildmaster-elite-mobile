import type { TrainingKey } from './analyzerDomain';

export type CuratedPlayerIdentityV3920 = {
  id: string;
  label: string;
  aliases: RegExp[];
  traits: string[];
  realLifeModel: string;
  trainingBias: Partial<Record<TrainingKey, number>>;
  safeguards: string[];
};

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Curadoria nominal usada somente como desempate de identidade.
 * Os atributos, o estilo e as habilidades da versão exata da carta continuam
 * sendo a fonte principal. Assim, uma nova versão do mesmo jogador não é
 * forçada a copiar uma receita antiga apenas por possuir o mesmo nome.
 */
export const CURATED_PLAYER_IDENTITIES_V3920: readonly CuratedPlayerIdentityV3920[] = [
  {
    id: 'neymar',
    label: 'Criador driblador imprevisível',
    aliases: [/\bneymar\b/],
    traits: ['condução curta', 'mudança de direção', 'passe final', 'criação sob pressão'],
    realLifeModel: 'Receber por dentro, desequilibrar no drible e criar a última ação sem transformar a carta em ponta de cruzamento.',
    trainingBias: { dribbling: 10, passing: 7, dexterity: 6, shooting: 3 },
    safeguards: ['Não sacrificar controle e condução para perseguir apenas velocidade ou Overall.']
  },
  {
    id: 'ronaldinho',
    label: 'Armador fantasista de controle total',
    aliases: [/\bronaldinho\b/, /\bga[uú]cho\b/],
    traits: ['controle orientado', 'drible criativo', 'passe de ruptura', 'finalização colocada'],
    realLifeModel: 'Controlar o ritmo entre linhas, atrair marcação e acelerar somente quando a jogada pede.',
    trainingBias: { dribbling: 10, passing: 8, dexterity: 5, shooting: 4 },
    safeguards: ['Preservar passe e controle; não converter a carta em corredor vertical genérico.']
  },
  {
    id: 'cristiano-ronaldo',
    label: 'Finalizador vertical dominante',
    aliases: [/\bcristiano ronaldo\b/, /\bcr7\b/],
    traits: ['movimento sem bola', 'finalização', 'potência', 'ataque aéreo'],
    realLifeModel: 'Atacar a última linha, finalizar rápido e manter ameaça aérea mesmo quando usado como SA.',
    trainingBias: { shooting: 11, dexterity: 7, lowerBodyStrength: 7, aerialStrength: 6 },
    safeguards: ['Adaptações para SA não podem apagar a identidade de finalizador.']
  },
  {
    id: 'messi',
    label: 'Condutor criador e finalizador',
    aliases: [/\blionel messi\b/, /\bmessi\b/],
    traits: ['controle em espaço curto', 'condução', 'passe final', 'finalização precisa'],
    realLifeModel: 'Receber entre linhas, conduzir por dentro e decidir entre assistência e finalização.',
    trainingBias: { dribbling: 10, passing: 8, shooting: 6, dexterity: 5 },
    safeguards: ['Evitar excesso de físico ou bola aérea que não aumenta suas ações principais.']
  },
  {
    id: 'paul-scholes',
    label: 'Meia de chegada e passe vertical',
    aliases: [/\bpaul scholes\b/, /\bscholes\b/],
    traits: ['passe vertical', 'chute de média distância', 'chegada de trás', 'mobilidade intensa'],
    realLifeModel: 'Acelerar a circulação e chegar para finalizar; não fingir que é um organizador fixo se o estilo da carta permanecer ativo.',
    trainingBias: { passing: 9, shooting: 7, lowerBodyStrength: 6, dexterity: 4, defending: 2 },
    safeguards: ['Em estruturas estreitas, alertar quando a movimentação vertical invade o espaço do SA e isola o VOL.']
  },
  {
    id: 'mbappe',
    label: 'Atacante de ruptura explosiva',
    aliases: [/\bmbapp[eé]\b/],
    traits: ['aceleração', 'ruptura', 'condução em velocidade', 'finalização'],
    realLifeModel: 'Atacar profundidade e conduzir em transição sem desperdiçar pontos tentando transformá-lo em pivô.',
    trainingBias: { dexterity: 10, lowerBodyStrength: 8, shooting: 7, dribbling: 5 },
    safeguards: ['Preservar aceleração e movimento sem bola como núcleo da carta.']
  },
  {
    id: 'haaland',
    label: 'Finalizador físico de profundidade',
    aliases: [/\bhaaland\b/],
    traits: ['movimento de área', 'potência', 'contato', 'finalização aérea e rasteira'],
    realLifeModel: 'Atacar a área e concluir com poucos toques; não gastar demais em criação ou drible fino.',
    trainingBias: { shooting: 11, dexterity: 7, lowerBodyStrength: 7, aerialStrength: 7 },
    safeguards: ['Manter a carta especializada em conclusão e presença de área.']
  },
  {
    id: 'iniesta',
    label: 'Controlador de espaço curto',
    aliases: [/\biniesta\b/],
    traits: ['controle orientado', 'passe curto', 'giro', 'resistência à pressão'],
    realLifeModel: 'Criar superioridade com apoio, giro e passe no tempo certo.',
    trainingBias: { dribbling: 9, passing: 9, dexterity: 5, lowerBodyStrength: 2 },
    safeguards: ['Não trocar controle e passe por velocidade genérica.']
  },
  {
    id: 'xavi',
    label: 'Organizador de circulação e ritmo',
    aliases: [/\bxavi\b/],
    traits: ['passe curto', 'orientação corporal', 'controle de ritmo', 'apoio constante'],
    realLifeModel: 'Manter linhas de passe e controlar a circulação sem abandonar o centro.',
    trainingBias: { passing: 11, dribbling: 7, dexterity: 3, lowerBodyStrength: 2 },
    safeguards: ['Evitar converter o organizador em meia de corrida apenas para elevar números.']
  },
  {
    id: 'modric',
    label: 'Meia técnico de progressão',
    aliases: [/\bmodri[cć]\b/, /\bmodric\b/],
    traits: ['passe progressivo', 'condução', 'controle sob pressão', 'mobilidade'],
    realLifeModel: 'Progredir por passe ou condução, mantendo apoio atrás da bola.',
    trainingBias: { passing: 9, dribbling: 8, lowerBodyStrength: 4, dexterity: 4 },
    safeguards: ['Preservar equilíbrio entre circulação e progressão.']
  },
  {
    id: 'vieira',
    label: 'Volante dominante de cobertura',
    aliases: [/\bpatrick vieira\b/, /\bvieira\b/],
    traits: ['cobertura', 'duelo', 'interceptação', 'progressão física'],
    realLifeModel: 'Proteger a zona central, recuperar e conduzir a primeira progressão.',
    trainingBias: { defending: 11, lowerBodyStrength: 8, aerialStrength: 5, passing: 3 },
    safeguards: ['Não retirar defesa e físico para perseguir passe ou Overall.']
  },
  {
    id: 'maldini',
    label: 'Defensor de leitura e cobertura',
    aliases: [/\bpaolo maldini\b/, /\bmaldini\b/],
    traits: ['antecipação', 'cobertura', 'duelo limpo', 'recuperação'],
    realLifeModel: 'Defender por leitura e posicionamento antes do bote.',
    trainingBias: { defending: 12, lowerBodyStrength: 6, dexterity: 5, aerialStrength: 4 },
    safeguards: ['Preservar consciência defensiva e recuperação acima de ganhos cosméticos.']
  },
  {
    id: 'beckenbauer',
    label: 'Defensor construtor cerebral',
    aliases: [/\bbeckenbauer\b/],
    traits: ['antecipação', 'saída de bola', 'passe vertical', 'cobertura'],
    realLifeModel: 'Iniciar a construção sem perder a segurança defensiva.',
    trainingBias: { defending: 10, passing: 6, lowerBodyStrength: 5, aerialStrength: 4 },
    safeguards: ['Equilibrar construção e defesa; não transformá-lo em meia frágil.']
  }
] as const;

export function resolveCuratedPlayerIdentityV3920(playerName: string): CuratedPlayerIdentityV3920 | null {
  const name = normalize(playerName);
  if (!name) return null;
  return CURATED_PLAYER_IDENTITIES_V3920.find((profile) => profile.aliases.some((pattern) => pattern.test(name))) ?? null;
}
