# BuildMaster Elite Tático v40.60 — Aprendizado Competitivo por Carta

## Objetivo

A v40.60 transforma a validação real da v40.50 em aprendizado longitudinal. Uma ficha que vence um A/B em um único bloco de partidas passa a ser tratada como vencedora provisória. A promoção permanente exige repetição em sessões distintas da mesma carta e posição.

## O que mudou

- mínimo de 3 sessões/dias distintos para consolidar aprendizado;
- comparação pareada entre candidata e campeã atual;
- mínimo de 2 sessões pareadas para promover uma alternativa;
- score longitudinal com recência controlada e consistência entre sessões;
- cobertura de ranqueadas, eventos, contra amigos e offline;
- detecção de drift entre histórico e sessões recentes;
- drift crítico suspende promoção automaticamente;
- memória presa ao fingerprint exato da carta e posição exata;
- vencedor v40.50 é provisório até passar pela camada longitudinal;
- distribuição salva só é reaplicada se continuar idêntica a uma alternativa da busca Pareto atual;
- memória inválida ou obsoleta volta para a campeã Pareto em vez de manter ficha antiga;
- autorrecuperação da memória longitudinal a partir do histórico de partidas após backup/restauração.

## Proteções contra overfitting

1. Muitas partidas em um único dia não substituem a necessidade de sessões distintas.
2. A comparação longitudinal prefere sessões em que campeã e desafiante foram testadas em condições comparáveis.
3. Mudança recente forte de desempenho ativa a proteção de drift.
4. Uma carta nunca herda memória de outra versão da carta.
5. A posição escolhida faz parte da chave da memória.
6. O motor não gasta pontos, GP, itens nem reseta progressão automaticamente.

## Testes runtime

### Promoção precoce bloqueada

12 partidas concentradas em um único dia não geraram promoção longitudinal.

### Promoção longitudinal válida

- 12 partidas;
- 3 sessões distintas;
- 3 sessões pareadas;
- líder: Resposta online;
- confiança longitudinal: 88/100;
- promoção aprovada somente após repetição.

### Drift

O teste também força queda forte nas sessões recentes. O motor detecta drift, muda a ação para `SUSPENDER_POR_DRIFT` e impede consolidação da memória.

## Compatibilidade preservada

- v40.50 — Validação Real de Gameplay;
- v40.40 — Precisão Competitiva 99 / Pareto;
- v40.30 — Desempenho Máximo Adaptativo;
- v40.20 — OCR dos 8 quadrados;
- v40.00 — leitor reconstruído;
- v38.40 — bateria detalhada legada.

## Resultado esperado

O BuildMaster passa a diferenciar uma ficha que foi boa em uma sequência curta de uma ficha que continua superior ao longo de várias sessões. O objetivo é aumentar consistência e reduzir decisões causadas por um único dia, adversários específicos ou condição de conexão temporária.
