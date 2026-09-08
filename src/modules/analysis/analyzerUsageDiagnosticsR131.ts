import type { Attributes, Objective, PositionCode } from '@/lib/analyzerDomain';

export const ANALYZER_USAGE_DIAGNOSTICS_R131_VERSION = 'r131-usage-diagnostics-1';

export function buildStrengthWeaknessDiagnosticsR131(a: Required<Attributes>, pri: Record<string, number>, position: PositionCode = 'CF') {
  const ranked = Object.entries({
    Ataque: pri.attack,
    Criação: pri.creation,
    Mobilidade: pri.mobility,
    Defesa: pri.defense,
    Físico: pri.physical,
    Resistência: pri.stamina,
    'Jogo aéreo': pri.aerial,
    'Passe curto': a.lowPass,
    Velocidade: a.speed,
    Aceleração: a.acceleration,
    Equilíbrio: a.balance
  }).sort((left, right) => Number(right[1]) - Number(left[1]));
  const strengths = ranked.slice(0, 4).map(([name, value]) => `${name} forte (${Number(value).toFixed(1)})`);
  const weaknesses = ranked.slice(-3).reverse().map(([name, value]) => `${name} precisa de cuidado (${Number(value).toFixed(1)})`);
  void position;
  return { strengths, weaknesses };
}

export function buildUsageTipsR131(position: PositionCode, objective: Objective, a: Required<Attributes>) {
  const tips: string[] = [];
  if (position === 'CF') {
    tips.push('Use como referência no último terço: procure finalizar de primeira e atacar o espaço entre zagueiros.');
    if (a.heading >= 80 || a.physicalContact >= 80) tips.push('Valorize cruzamentos, pivôs curtos e bolas aéreas; o físico e a cabeçada sustentam o contato.');
    if (a.balance < 72) tips.push('Evite conduções longas sob pressão; solte a bola rápido e finalize em poucos toques.');
  } else if (position === 'SS') {
    tips.push('Use como SA entre linhas: receba no giro, combine com o CA e ataque o espaço para finalizar.');
    tips.push('Funciona melhor com passe rápido e triangulações, não preso na ponta o tempo todo.');
  } else if (position === 'AMF') {
    tips.push('Use como MAT por dentro: acione passes em profundidade e chute de média distância quando sobrar espaço.');
    tips.push('Evite gastar pontos demais em defesa; o valor dele é criação e último passe.');
  } else if (position === 'LWF' || position === 'RWF') {
    tips.push('Use aberto para atrair marcação e cortar para dentro; aceleração e drible são o foco.');
    tips.push('Se tiver Cruzamento preciso, alterne entre infiltrar e cruzar para não ficar previsível.');
  } else if (position === 'LMF' || position === 'RMF') {
    tips.push('Use pelo corredor lateral como apoio intenso: ajuda na recomposição e acelera a transição.');
  } else if (position === 'DMF') {
    tips.push('Use como VOL fixo: bloqueie linha de passe, antecipe e solte passe curto seguro.');
    tips.push('Para extrair máximo gameplay, pressione só no timing certo; esta função rende mais protegendo a entrada da área.');
  } else if (position === 'CMF') {
    tips.push('Use como MC de ida e volta: acelere transições, encurte passes e pressione após perda da bola.');
  } else if (position === 'CB') {
    tips.push('Use como ZAG de cobertura: não dê bote desnecessário; priorize interceptar e bloquear chutes.');
    tips.push('Combine com outro zagueiro mais veloz se a velocidade estiver abaixo de 75.');
  } else if (position === 'GK') {
    tips.push('Use como GOL puro: mantenha a linha defensiva protegida, evite sair manualmente sem necessidade e valorize reflexo, alcance e firmeza.');
    tips.push('Para goleiro ofensivo, use reposição rápida e saída curta; para goleiro defensivo, prefira posicionamento, alcance e segurança em chutes próximos.');
    tips.push('Não use habilidades de jogador de linha no plano de goleiro; a recomendação mantém somente habilidades próprias de GOL e habilidades universais úteis, sem nomes inventados.');
  } else {
    tips.push('Use na posição recomendada e foque nas ações que aparecem como pontos fortes no PRI.');
  }
  if (objective === 'QUICK_COUNTER') tips.push('No contra-ataque rápido, procure passes verticais cedo e evite prender a bola no meio.');
  if (objective === 'POSSESSION') tips.push('Na posse de bola, mantenha aproximação curta e use Passe de primeira para acelerar triangulações.');
  if (objective === 'PRESSING') tips.push('Em pressão alta, controle o fôlego: use pressão manual em gatilhos, não o tempo todo.');
  if (objective === 'META_2026') tips.push('Meta 2026 é uma tendência datada: valorize resposta curta, leitura defensiva e uma ação decisiva, mas preserve a identidade da carta.');
  return tips;
}
