import { analyzeCard } from '../src/lib/analyzer';

const cases = [
  {
    name: 'Gattuso destruidor não pode virar lateral/atacante',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Gattuso
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: O destruidor
NÍVEL MÁXIMO: 32
PONTOS TOTAIS: 62
Talento defensivo: 90
Desarme: 92
Dedicação defensiva: 90
Agressividade: 88
Contato físico: 86
Resistência: 88
Passe rasteiro: 80
Velocidade: 76
Aceleração: 72
[FIM AJUSTES]
`,
    disallow: ['LB', 'RB', 'CF', 'SS', 'LWF', 'RWF']
  },
  {
    name: 'Maldini deve ficar em função defensiva',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paolo Maldini
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 60
Talento defensivo: 92
Desarme: 90
Dedicação defensiva: 88
Cabeçada: 86
Salto: 84
Contato físico: 82
Velocidade: 80
Passe rasteiro: 78
[FIM AJUSTES]
`,
    disallow: ['CF', 'SS', 'LWF', 'RWF', 'AMF']
  },
  {
    name: 'Neymar deve evitar defesa/goleiro',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Neymar
POSIÇÃO PRINCIPAL: LWF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 30
PONTOS TOTAIS: 58
Controle de bola: 92
Drible: 94
Condução firme: 92
Passe rasteiro: 84
Finalização: 82
Velocidade: 86
Aceleração: 90
Equilíbrio: 88
[FIM AJUSTES]
`,
    disallow: ['CB', 'DMF', 'LB', 'RB', 'GK']
  }
];

for (const item of cases) {
  const result = analyzeCard(item.text, 'COMPETITIVE', 'AUTO', `${item.name}.txt`);
  if (item.disallow.includes(result.bestPosition.code)) {
    throw new Error(`${item.name}: posição proibida escolhida (${result.bestPosition.code}).`);
  }
  if (!result.validation.canGenerate) {
    throw new Error(`${item.name}: validação não permitiu gerar mesmo com confirmação manual.`);
  }
}


const goalkeeperText = `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Oliver Kahn
POSIÇÃO PRINCIPAL: GK
ESTILO DE JOGO: Goleiro defensivo
NÍVEL MÁXIMO: 30
PONTOS TOTAIS: 62
Talento de GO: 90
Firmeza do GO: 88
Defesa do GO: 89
Reflexos do GO: 91
Alcance do GO: 88
Salto: 82
Contato físico: 85
Força do chute: 78
[FIM AJUSTES]
`;

const goalkeeperResult = analyzeCard(goalkeeperText, 'GOALKEEPER', 'AUTO', 'oliver-kahn-goleiro.txt');
if (goalkeeperResult.bestPosition.code !== 'GK') {
  throw new Error(`Goleiro deve permanecer como GK/GOL, mas veio ${goalkeeperResult.bestPosition.code}.`);
}
if (goalkeeperResult.training.shooting || goalkeeperResult.training.passing || goalkeeperResult.training.dribbling || goalkeeperResult.training.defending) {
  throw new Error('Ficha de goleiro não pode receber Finalização, Passe, Drible ou Defesa de jogador de linha.');
}
if (!goalkeeperResult.training.gk1 || !goalkeeperResult.training.gk2 || !goalkeeperResult.training.gk3) {
  throw new Error('Ficha de goleiro precisa priorizar Goleiro 1, Goleiro 2 e Goleiro 3.');
}
if (goalkeeperResult.recommendedSkills.some((skill) => ['Interceptação', 'Bloqueador', 'Marcação individual', 'Chute de primeira', 'Passe de primeira', 'Toque duplo'].includes(skill))) {
  throw new Error(`Habilidades de jogador de linha não devem aparecer para goleiro: ${goalkeeperResult.recommendedSkills.join(', ')}`);
}

console.log(`OK: ${cases.length + 1} testes de regressão passaram.`);
if (goalkeeperResult.recommendedSkills.some((skill) => skill.toLowerCase().includes('saque longo'))) {
  throw new Error(`Não recomendar nome inventado para goleiro: ${goalkeeperResult.recommendedSkills.join(', ')}`);
}
