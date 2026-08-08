# Motor IA por Carta v38.80

## Objetivo

Eliminar fichas, habilidades e Ímpetos clonados apenas porque jogadores diferentes foram escolhidos para a mesma posição.

A posição escolhida pelo usuário continua sendo respeitada, porém passa a funcionar como **restrição de tarefa**. A identidade da versão da carta é definida antes por atributos, posição original, estilo oficial, habilidades nativas, habilidades especiais, físico, evidência de leitura e contexto competitivo.

## Nova regra de decisão

- 66%: identidade individual da carta;
- 22%: função exigida na posição escolhida;
- 12%: robustez em partida, pressão e delay.

Overall/GER não participa da nota.

## Exemplo resolvido

Duas cartas usadas como SA não recebem mais a mesma receita:

- CA de origem com DNA finalizador: SA finalizador móvel, preservando finalização, movimento, físico e habilidades de chute;
- MAT de origem com DNA criador: SA criador de conexão e tabela, preservando passe, controle, condução e habilidades de criação.

## O que o motor analisa

1. Criação;
2. Controle e condução;
3. Finalização;
4. Movimento;
5. Defesa;
6. Físico;
7. Jogo aéreo;
8. Resistência competitiva;
9. Atributos de goleiro;
10. Estilo de jogo;
11. Habilidades nativas e especiais;
12. Conversão da posição original para a posição escolhida;
13. Orçamento exato de progressão;
14. Robustez nos cenários da v38.60;
15. Distância do molde genérico da posição.

## Habilidades adicionais

O catálogo da posição é usado somente como trava de compatibilidade. A ordem das cinco habilidades é definida pelo DNA da carta, pelas habilidades já possuídas e pela ficha vencedora.

## Ímpetos

O ranking é recalculado somente depois da ficha e das habilidades. O Ímpeto que cobre uma lacuna importante da versão específica da carta sobe; o que reforça uma área já saturada perde nota.

## Interface

A aba `IA por Carta` mostra:

- DNA principal e secundário;
- função individual na posição escolhida;
- classificação da conversão;
- dimensões medidas;
- diferenças em relação ao molde genérico;
- Top adicional por identidade;
- Ímpetos após a ficha;
- finalistas e notas de identidade, função e robustez.

## Compatibilidade

- posição escolhida continua soberana;
- orçamento permanece exato;
- no máximo três fichas públicas;
- habilidades já possuídas não são repetidas;
- contratos públicos da v38.40 e motores v38.50–v38.70 foram preservados.
