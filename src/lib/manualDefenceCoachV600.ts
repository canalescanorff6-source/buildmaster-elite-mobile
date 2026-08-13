import type { AnalysisResult, MetaVivoDefensiveResponsibilityV4080R8, PositionCode } from './analyzerDomain';

export const MANUAL_DEFENCE_COACH_V600_VERSION = '40.80-r8-manual-defence-v600' as const;

export type ManualDefenceCoachV600 = {
  responsibility: MetaVivoDefensiveResponsibilityV4080R8;
  doublePressRisk: 'BAIXO' | 'MEDIO' | 'ALTO';
  instruction: string;
  secondaryInstruction: string;
  drill: string[];
  score: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function attr(result: AnalysisResult, key: keyof AnalysisResult['parsed']['attributes']): number {
  return Number(result.parsed.attributes[key] ?? 50);
}

function baseResponsibility(position: PositionCode, result: AnalysisResult): MetaVivoDefensiveResponsibilityV4080R8 {
  const defensiveStyle = String(result.parsed.defensivePlaystyle ?? '').toLocaleLowerCase('pt-BR');
  if (['CF','SS','AMF'].includes(position) && /press[aã]o no ataque/.test(defensiveStyle)) return 'PRESSOR_PRIMARIO';
  if (position === 'DMF') return 'ANCORA';
  if (position === 'CB' || position === 'GK') return 'PROTETOR_AREA';
  if (position === 'LB' || position === 'RB' || position === 'LMF' || position === 'RMF') return 'RASTREADOR';
  if (position === 'CMF' || position === 'AMF') return 'FECHADOR_LINHA';
  if (position === 'CF') return 'SAIDA_TRANSICAO';
  return 'COBERTURA';
}

export function buildManualDefenceCoachV600(result: AnalysisResult): ManualDefenceCoachV600 {
  const position = result.bestPosition.code;
  const responsibility = baseResponsibility(position, result);
  const awareness = attr(result,'defensiveAwareness');
  const engagement = attr(result,'defensiveEngagement');
  const tackling = attr(result,'tackling');
  const aggression = attr(result,'aggression');
  const stamina = attr(result,'stamina');
  const acceleration = attr(result,'acceleration');
  const interception = result.parsed.nativeSkills.some((item)=>/intercepta[cç][aã]o/i.test(item))
    || (result.parsed.additionalSkills ?? []).some((item)=>/intercepta[cç][aã]o/i.test(item));
  const defensiveStylePresses = /press[aã]o no ataque/i.test(String(result.parsed.defensivePlaystyle ?? ''));

  const score = clamp(awareness * .23 + engagement * .24 + tackling * .2 + stamina * .13 + acceleration * .12 + (interception ? 8 : 0));
  const rushIndex = aggression * .38 + engagement * .28 + acceleration * .18 + (defensiveStylePresses ? 16 : 0);
  const disciplineIndex = awareness * .4 + tackling * .22 + stamina * .12 + (interception ? 12 : 0);
  const doublePressRisk: ManualDefenceCoachV600['doublePressRisk'] = rushIndex - disciplineIndex >= 12 ? 'ALTO' : rushIndex - disciplineIndex >= 3 ? 'MEDIO' : 'BAIXO';

  const instructions: Record<MetaVivoDefensiveResponsibilityV4080R8, [string,string]> = {
    PRESSOR_PRIMARIO:['Aproxime no portador e oriente a saída para o lado em que sua cobertura já está montada.','Se outro companheiro já iniciou a pressão, pare de correr na bola e feche a linha de passe mais próxima.'],
    FECHADOR_LINHA:['Proteja primeiro a linha de passe interior; pressione só quando a bola entrar na sua zona.','Não acompanhe o mesmo homem que o VOL/ZAG já está controlando.'],
    COBERTURA:['Fique entre a bola e a zona perigosa. Corrija o espaço antes de tentar o bote.','Se o primeiro defensor for batido, seja o segundo duelo; antes disso, preserve a distância.'],
    ANCORA:['Segure a frente dos zagueiros e feche o passe por dentro. Evite sair em perseguição longa.','Quando um MLG pressionar, cubra atrás dele em vez de duplicar a pressão.'],
    RASTREADOR:['Acompanhe o corredor e a infiltração do seu lado sem abandonar a linha cedo demais.','Se o ponta adversário vier por dentro, passe a referência apenas quando houver cobertura.'],
    PROTETOR_AREA:['Proteja profundidade e área. Só avance no portador quando houver cobertura atrás.','Evite puxar os dois zagueiros para o mesmo atacante; um duela, o outro sobra.'],
    SAIDA_TRANSICAO:['Feche a primeira linha de passe sem recuar demais; permaneça disponível para a saída após a recuperação.','Não persiga até o meio-campo defensivo se isso eliminar sua referência de contra-ataque.']
  };
  const [instruction,secondaryInstruction] = instructions[responsibility];

  return {
    responsibility,
    doublePressRisk,
    instruction,
    secondaryInstruction,
    score,
    drill:[
      '1. Antes de apertar pressão, identifique quem já é o primeiro defensor.',
      '2. Se já houver um primeiro defensor, use seu jogador para fechar a linha mais perigosa.',
      '3. Troque o cursor somente quando a bola ou o adversário entrar na sua zona de responsabilidade.',
      '4. Após recuperar, execute o primeiro passe simples antes de acelerar a jogada.',
      doublePressRisk === 'ALTO'
        ? '5. Treino prioritário: em 10 posses defensivas, não permita dois jogadores seus correrem simultaneamente no mesmo portador.'
        : '5. Preserve a compactação; aumente a agressividade apenas quando houver cobertura clara.'
    ]
  };
}
