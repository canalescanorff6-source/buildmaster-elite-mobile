# BuildMaster Elite Tático — Motor Máximo Desempenho v38.60

## Objetivo

A v38.60 é uma camada final acima do Motor de Desempenho v38.50. Ela não tenta elevar GER/overall. A decisão é tomada pela capacidade da carta de executar sua microfunção, manter desempenho em diferentes cenários e evitar uma ficha muito forte em uma situação, mas frágil em outras.

A nota máxima do motor é limitada a 98/100. O app não declara uma ficha como perfeita porque conexão, atualização do jogo, controles, adversário e maneira de jogar ainda precisam ser validados em partidas.

## 50 refinamentos adicionais

1. Simulação por ação real sem overall.
2. Microfunção automática por posição e estilo.
3. Separação entre domínio, execução e repetibilidade.
4. Oito cenários de partida.
5. Ranqueada completa.
6. Delay alto.
7. Espaços curtos.
8. Pressão alta.
9. Transição rápida.
10. Duelos físicos.
11. Desempenho depois dos 70 minutos.
12. Ativação de habilidades especiais.
13. Decisão min-max.
14. Penalidade por inconsistência.
15. Participação direta do pior cenário.
16. Projeção funcional dos atributos.
17. Bandas funcionais internas por posição.
18. Bônus somente para breakpoints úteis.
19. Retorno reduzido acima da faixa útil.
20. Busca local de redistribuições.
21. Busca combinatória de duas prioridades.
22. Candidatas para corrigir elo fraco.
23. Variante de resistência.
24. Variante anti-delay.
25. Variante para tabela e triangulação.
26. Variante de duelo físico.
27. Variante de transição.
28. Nota de primeiro toque.
29. Nota de movimento sem bola.
30. Nota de recuperação defensiva.
31. Pacotes completos de cinco habilidades.
32. Cobertura de função e cenário por pacote.
33. Bloqueio de habilidades já possuídas.
34. Exigência de diversidade funcional.
35. Ímpeto calculado contra o pior cenário.
36. Penalidade de Ímpeto saturado.
37. Bônus de Ímpeto que corrige gargalo.
38. Auditoria contrafactual.
39. Estabilidade contra trocas locais.
40. Alternativas situacionais explicadas.
41. Proteção proporcional à confiança do OCR.
42. Conservadorismo quando faltam atributos.
43. Posição escolhida permanentemente travada.
44. Orçamento exato em todas as candidatas.
45. Cenários exclusivos para goleiros.
46. Uso contextual de altura, peso e pé.
47. Influência de formação e técnico.
48. Influência do perfil de controle.
49. Prioridade para desempenho mínimo e consistência.
50. Overall disponível somente para exibição.

## Cenários avaliados

- Ranqueada completa
- Delay alto
- Espaços curtos
- Pressão adversária
- Transição rápida
- Duelos físicos
- Depois dos 70 minutos
- Ativação das habilidades

## Resultado entregue

O painel do motor mostra:

- microfunção detectada;
- ficha vencedora e finalistas;
- distribuição exata dos pontos;
- notas das ações decisivas;
- pior cenário e consistência;
- resistência, duelo, espaço curto e transição;
- pacotes alternativos de cinco habilidades;
- Ímpetos recalculados;
- bandas funcionais e gargalos;
- auditoria contrafactual das trocas de pontos;
- proteções e limitações do resultado.

## Arquivos principais

- `src/lib/maxMatchPerformanceEngineV3860.ts`
- `src/components/MaxMatchPerformanceV3860Panel.tsx`
- `src/lib/cardIntelligencePipeline.ts`
- `src/lib/analyzerDomain.ts`
- `tests/v38-60-max-match-performance-regression.ts`

## Observação importante

O motor entrega a ficha com maior desempenho esperado de acordo com os dados lidos. O resultado definitivo deve ser confirmado em uma sequência de partidas porque gameplay, conexão, atualização da Konami e estilo do usuário não podem ser reproduzidos perfeitamente apenas por cálculo local.
