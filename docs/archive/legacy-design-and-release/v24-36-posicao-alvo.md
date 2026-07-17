# BuildMaster Elite Tático v24.36 — Posição-Alvo Prioritária

## Correção principal

A ficha de treino agora é calculada diretamente para a posição escolhida pelo usuário. A posição original da carta deixa de bloquear ou substituir a posição-alvo.

## Nova ordem de decisão

1. Posição escolhida para jogar.
2. Função necessária nessa posição.
3. Atributos fortes que continuam úteis na conversão.
4. Estilo de jogo original como contexto secundário.
5. Objetivo tático e pontos disponíveis.

## Exemplos validados

- ME/LMF convertido para MAT/AMF: a ficha passa a priorizar passe, drible, controle, destreza e criação.
- VOL/DMF destruidor convertido para ZAG/CB: a ficha passa a priorizar defesa, bola aérea, físico e cobertura.
- PD/RWF convertido para SA/SS: a ficha passa a priorizar mobilidade, drible, finalização e apoio ofensivo.

## Proteções

- A posição original continua visível, mas apenas como identidade da carta.
- A posição escolhida aparece na auditoria como confirmada.
- Conversões de jogador de linha para goleiro, ou de goleiro para linha, continuam bloqueadas.
- A ficha nunca ultrapassa o orçamento real de pontos.
- A explicação informa claramente que a posição-alvo comandou a distribuição.
