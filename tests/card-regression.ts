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

const stoichkovText = `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Hristo Stoichkov
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 62
Talento ofensivo: 91
Controle de bola: 86
Drible: 84
Condução firme: 82
Passe rasteiro: 78
Finalização: 91
Cabeçada: 77
Curva: 83
Velocidade: 83
Aceleração: 86
Força do chute: 90
Contato físico: 78
Equilíbrio: 82
Resistência: 80
[FIM AJUSTES]
`;

const stoichkovResult = analyzeCard(stoichkovText, 'QUICK_COUNTER', 'AUTO', 'stoichkov-cf-artilheiro.txt');
if (stoichkovResult.recommendedSkills.includes('Volta para marcar')) {
  throw new Error(`CA Artilheiro não deve receber Volta para marcar como prioridade: ${stoichkovResult.recommendedSkills.join(', ')}`);
}
if (!stoichkovResult.recommendedSkills.some((skill) => ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe'].includes(skill))) {
  throw new Error(`CA Artilheiro precisa priorizar finalização: ${stoichkovResult.recommendedSkills.join(', ')}`);
}

const destroyerDmfText = `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Edgar Davids
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: O destruidor
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 62
Talento defensivo: 77
Dedicação defensiva: 83
Desarme: 82
Agressividade: 83
Passe rasteiro: 80
Velocidade: 79
Aceleração: 83
Contato físico: 82
Equilíbrio: 76
Resistência: 83
[FIM AJUSTES]
`;

const destroyerResult = analyzeCard(destroyerDmfText, 'COMPETITIVE', 'AUTO', 'davids-dmf-destruidor.txt');
if (!destroyerResult.recommendedSkills.some((skill) => ['Interceptação', 'Bloqueador', 'Marcação individual'].includes(skill))) {
  throw new Error(`VOL Destruidor precisa receber habilidades defensivas: ${destroyerResult.recommendedSkills.join(', ')}`);
}

if (stoichkovResult.recommendedSkills.length !== 5) {
  throw new Error(`A saída deve trazer exatamente 5 habilidades principais para CA: ${stoichkovResult.recommendedSkills.join(', ')}`);
}
if (stoichkovResult.recommendedSkills.some((skill) => ['Volta para marcar', 'Marcação individual', 'Interceptação', 'Carrinho', 'Bloqueador'].includes(skill))) {
  throw new Error(`CA Artilheiro recebeu habilidade defensiva indevida: ${stoichkovResult.recommendedSkills.join(', ')}`);
}
if (!stoichkovResult.avoidSkills.includes('Volta para marcar')) {
  throw new Error(`CA Artilheiro precisa listar Volta para marcar como habilidade a evitar: ${stoichkovResult.avoidSkills.join(', ')}`);
}
if (!stoichkovResult.recommendedImpetos.some((item) => item.tier !== 'evitar' && ['Chute', 'Instinto artilheiro', 'Movimento sem a bola', 'Precisão'].includes(item.name))) {
  throw new Error(`CA Artilheiro precisa receber ímpetos ofensivos: ${stoichkovResult.recommendedImpetos.map((item) => item.name).join(', ')}`);
}
if (stoichkovResult.recommendedImpetos.filter((item) => item.tier !== 'evitar').some((item) => ['Roubo de bola', 'Defesa', 'Duelo', 'Guardião'].includes(item.name))) {
  throw new Error(`CA Artilheiro recebeu ímpeto defensivo indevido: ${stoichkovResult.recommendedImpetos.map((item) => `${item.tier}:${item.name}`).join(', ')}`);
}

const styleMatrixCases = [
  {
    name: 'VOL Orquestrador deve priorizar passe e saída',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Pirlo
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Orquestrador
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 62
Passe rasteiro: 92
Passe alto: 91
Controle de bola: 88
Condução firme: 84
Talento defensivo: 72
Desarme: 70
Resistência: 78
[FIM AJUSTES]
`,
    expectedAny: ['Passe de primeira', 'Passe em profundidade', 'Passe na medida'],
    forbidden: ['Chute de primeira', 'Finalização acrobática']
  },
  {
    name: 'ZAG Defensor criativo deve manter defesa e passe',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Beckenbauer
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 62
Talento defensivo: 88
Desarme: 86
Dedicação defensiva: 84
Passe rasteiro: 84
Passe alto: 86
Salto: 80
Contato físico: 80
[FIM AJUSTES]
`,
    expectedAny: ['Interceptação', 'Bloqueador', 'Passe de primeira', 'Passe na medida'],
    forbidden: ['Chute de primeira', 'Controle da cavadinha']
  },
  {
    name: 'Lateral defensivo deve priorizar recomposição',
    text: `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Pavard
POSIÇÃO PRINCIPAL: RB
ESTILO DE JOGO: Lateral defensivo
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 62
Talento defensivo: 84
Desarme: 82
Dedicação defensiva: 84
Velocidade: 78
Passe rasteiro: 77
Passe alto: 76
Resistência: 82
[FIM AJUSTES]
`,
    expectedAny: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Volta para marcar'],
    forbidden: ['Chute de primeira', 'Finalização acrobática']
  }
];

for (const item of styleMatrixCases) {
  const result = analyzeCard(item.text, 'COMPETITIVE', 'AUTO', `${item.name}.txt`);
  if (!item.expectedAny.some((skill) => result.recommendedSkills.includes(skill))) {
    throw new Error(`${item.name}: faltou habilidade esperada. Veio: ${result.recommendedSkills.join(', ')}`);
  }
  if (item.forbidden.some((skill) => result.recommendedSkills.includes(skill))) {
    throw new Error(`${item.name}: apareceu habilidade proibida. Veio: ${result.recommendedSkills.join(', ')}`);
  }
}

console.log(`OK: ${styleMatrixCases.length} testes do motor por estilo passaram.`);

const nativeSkillText = `
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Teste
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 62
Finalização: 90
Talento ofensivo: 88
Passe rasteiro: 75
Drible: 80
Velocidade: 84
Aceleração: 86
Força do chute: 88
[FIM AJUSTES]
### Habilidades
Chute de primeira
Precisão à distância
Passe de primeira
### Painel
Top 5 habilidades adicionais
Finalização acrobática
Volta para marcar
Interceptação
`;

const nativeSkillResult = analyzeCard(nativeSkillText, 'COMPETITIVE', 'AUTO', 'atacante-habilidades.txt');
if (!nativeSkillResult.parsed.nativeSkills.includes('Chute de primeira') || !nativeSkillResult.parsed.nativeSkills.includes('Precisão à distância')) {
  throw new Error(`Leitura de habilidades nativas falhou: ${nativeSkillResult.parsed.nativeSkills.join(', ')}`);
}
if (nativeSkillResult.parsed.nativeSkills.includes('Volta para marcar') || nativeSkillResult.parsed.nativeSkills.includes('Interceptação')) {
  throw new Error(`OCR confundiu recomendações do app com habilidades nativas: ${nativeSkillResult.parsed.nativeSkills.join(', ')}`);
}
if (nativeSkillResult.recommendedSkills.includes('Chute de primeira') || nativeSkillResult.recommendedSkills.includes('Precisão à distância') || nativeSkillResult.recommendedSkills.includes('Passe de primeira')) {
  throw new Error(`Programa sugeriu habilidade que o jogador já possui: ${nativeSkillResult.recommendedSkills.join(', ')}`);
}
if (nativeSkillResult.recommendedSkills.some((skill) => ['Volta para marcar', 'Interceptação', 'Marcação individual', 'Carrinho', 'Bloqueador'].includes(skill))) {
  throw new Error(`CA com habilidades lidas recebeu habilidade defensiva indevida: ${nativeSkillResult.recommendedSkills.join(', ')}`);
}

console.log('OK: leitura blindada de habilidades nativas passou.');
