import { analyzeCard } from '../src/lib/analyzer';

const edgarDavidsPrintText = `
### NOME DO JOGADOR
Edgar Davids
O destruidor
88
DMF
Altura 168cm
Peso 69kg
Idade 25
Nível 33

### POSIÇÕES JOGÁVEIS
LWF 85 CF 83 RWF 85
LMF 87 CMF 88 RMF 87
DMF 88
LB 89 CB 88 RB 89
GK 45

### ATRIBUTOS PRINCIPAIS
Talento ofensivo 67
Controle de bola 77
Drible 74
Condução firme 77
Passe rasteiro 80
Passe alto 75
Finalização 72
Cabeçada 65
Talento defensivo 77
Dedicação defensiva 83
Desarme 82
Agressividade 83
Velocidade 79
Aceleração 83
Força do chute 82
Salto 78
Contato físico 82
Equilíbrio 76
Resistência 83

### HABILIDADES
Precisão à distância
Passe de primeira
Marcação ind.
Volta para marcar
Interceptação
Espírito guerreiro
Bloqueador
Carrinho
Esticada de Perna
Sombra veloz
`;

const result = analyzeCard(edgarDavidsPrintText, 'COMPETITIVE', 'AUTO', 'edgar-davids-print.txt', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA'
});

if (result.bestPosition.code === 'LB' || result.bestPosition.code === 'RB') {
  throw new Error(`Edgar Davids não pode virar lateral só por overall 89. Resultado: ${result.bestPosition.code}`);
}

if (result.parsed.mainPosition !== 'DMF') {
  throw new Error(`A posição original deveria ser DMF/VOL, mas veio ${result.parsed.mainPosition}.`);
}

if (!result.trainingComparison || !Array.isArray(result.buildVariants) || result.buildVariants.length < 3) {
  throw new Error('Comparação de ficha e variantes segura/competitiva/alternativa precisam existir.');
}

console.log(`OK: teste de print real passou — ${result.parsed.playerName} como ${result.bestPosition.label}.`);
