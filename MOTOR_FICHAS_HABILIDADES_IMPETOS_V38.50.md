# BuildMaster Elite Tático — Motor de Desempenho v38.50

## Objetivo

Refinar exclusivamente a geração de fichas, o Top 5 de habilidades adicionais e a escolha de Ímpetos. O novo motor não usa GER/overall como critério de pontuação: ele compara execução da função, eficiência dos pontos, identidade da carta, resposta em campo, robustez online e sinergia entre ficha, habilidades e Ímpeto.

## 30 melhorias implementadas

1. Pontuação principal baseada em ações reais da função, sem usar GER como objetivo.
2. Orçamento de progressão fechado exatamente, sem pontos invisíveis ou excedentes.
3. Pisos funcionais diferentes para cada posição e estilo oficial.
4. Tetos de retorno para impedir investimento caro depois da faixa útil.
5. Retorno marginal calculado nível por nível com o custo progressivo real.
6. Penalidade de saturação quando um bloco recebe pontos além do que ativa em campo.
7. Penalidade de desperdício em grupos incompatíveis com a posição escolhida.
8. Proteção das maiores forças naturais e do DNA específico da versão da carta.
9. Correção seletiva de fraquezas sem transformar todas as cartas no mesmo molde.
10. Posição escolhida pelo usuário permanece travada durante toda a otimização.
11. Estilo de jogo oficial altera pisos, pesos, tetos e frequência esperada das ações.
12. Objetivo competitivo altera a distribuição sem perseguir aumento visual de overall.
13. Perfil de conexão e delay favorece resposta, passe curto e estabilidade de controle.
14. Modo ranqueado recebe proteção contra fichas frágeis que funcionam apenas offline.
15. Modelo físico participa apenas quando altura, contato, salto e função justificam.
16. Habilidades especiais já existentes recebem suporte de treino para ativarem mais vezes.
17. Top 5 usa somente habilidades oficiais adicionais e nunca repete habilidade possuída.
18. Cada habilidade recebe frequência de ativação, cobertura funcional e risco de redundância.
19. Pacote de cinco habilidades é avaliado como conjunto, não como cinco escolhas isoladas.
20. Diversidade funcional impede cinco habilidades da mesma categoria sem necessidade real.
21. Complementos como passe de primeira + passe em profundidade recebem bônus de combinação.
22. Habilidades incompatíveis com goleiro ou jogador de linha permanecem bloqueadas.
23. Ímpeto é calculado depois da ficha e das habilidades, usando a combinação final.
24. Ímpeto perde nota quando reforça atributos já saturados pela progressão.
25. Ímpeto ganha nota quando cobre uma lacuna decisiva sem descaracterizar a carta.
26. Comparação simultânea de fichas recomendada, segura, agressiva, identidade e robustez.
27. Tolerância à leitura incerta aproxima a vencedora da variante conservadora quando necessário.
28. Anticlone mede distância do molde genérico e recompensa individualidade útil.
29. Auditoria explica ganhos, trocas, pisos não atingidos e qualquer ponto potencialmente desperdiçado.
30. A ficha final só é aprovada quando posição, orçamento, habilidades e Ímpeto terminam reconciliados.

## Fluxo de decisão

1. Reúne fichas candidatas dos motores existentes e gera novas variantes por função, identidade, segurança, ranked e habilidades especiais.
2. Fecha o orçamento com custo progressivo real e confere todos os pontos.
3. Avalia 12 dimensões de desempenho sem usar overall.
4. Seleciona cinco habilidades oficiais e complementares, sem repetir habilidades nativas.
5. Recalcula os Ímpetos depois da ficha e do Top 5, penalizando saturação.
6. Revalida posição, orçamento, inventário de habilidades e confiança da leitura.

## Arquivos principais

- `src/lib/performanceBuildEngineV3850.ts` — motor final de comparação e reconciliação.
- `src/components/PowerBuildEngineV3850Panel.tsx` — painel de auditoria e comparação.
- `src/lib/cardIntelligencePipeline.ts` — integração como autoridade final.
- `tests/v38-50-power-build-engine-regression.mjs` — contrato de regressão.
