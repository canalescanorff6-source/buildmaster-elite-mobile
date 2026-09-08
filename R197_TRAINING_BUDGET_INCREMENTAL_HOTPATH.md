# R197 — Training Budget Incremental Hot Path

## Base canônica
R196 (`buildmaster-elite-mobile-r196-analyzer-compiled-scoring-hotpath.zip`).

## Objetivo
Otimizar o caminho de ajuste de orçamento de progressão sem alterar regra de pontos, prioridade, desempate, identidade esportiva ou autoridade final R119.

## Alterações
- `trainingTotalCost(level)` passou de soma nível-a-nível para fórmula fechada O(1), matematicamente equivalente à progressão `ceil(level / 4)`.
- `trainingPlanTotalCost(plan)` soma diretamente os dez grupos canônicos, sem materializar um objeto de custos intermediário.
- `fitTrainingToBudget(...)` calcula o custo corrente uma vez e o atualiza incrementalmente a cada remoção/adição de nível.
- A prioridade reversa é calculada uma única vez por ajuste.
- Nenhuma ordem de prioridade, teto de nível, regra de custo ou fallback foi alterado.

## Equivalência
O gate R197 compara a implementação nova contra uma reprodução do algoritmo legado em 500 planos determinísticos, cobrindo níveis, prioridades e orçamentos variados. Todos os resultados foram idênticos.

Também permaneceram verdes os snapshots congelados R186/R193 e os gates competitivos R119/R122/R125/R184.

## Performance
Microbenchmark A/B no mesmo processo, 500 casos determinísticos, 5 warm-ups e 20 rodadas:
- legado: 127.66 ms
- R197: 32.14 ms
- speedup observado: ~3.97×
- redução de tempo observada: ~74.8%

O benchmark é evidência local do hot path, não promessa universal para todo hardware ou para o tempo total da análise.

## Métricas finais
- `src`: 5,335,491 bytes / 5,505,024 bytes (96.9%)
- margem: 169,533 bytes
- 427 arquivos TS/TSX no orçamento de fonte
- `analyzer.ts`: 108,337 bytes / 1,219 linhas
- `CardVisionApp.tsx`: 107,449 bytes / 1,606 linhas
- `ResultWorkspace.tsx`: 99,453 bytes / 1,425 linhas
- closure inicial CardVision: 178 módulos / 2,377,434 bytes
- redução líquida vs R196: 96 bytes em `src` e 96 bytes na closure compartilhada

## Autoridade esportiva
R119 permanece byte-a-byte intacto:
`765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`

Não houve alteração em progressão final, DNA, Top 5, Ímpetos, escolha posicional, GER/Overall ou writer canônico.

## Gates finais
- R197: 500 planos equivalentes
- R190 → R197: verdes
- R180 global: verde
- R183 release convergence: 17 contratos
- R119/R122/R125/R184: verdes
- v38.40: 15/15
- auditoria: 127/127
- preflight: 138/138
- Play: 27/27
- sintaxe: 661 TS/TSX
- interativos: 790 botões / 34 imagens com alt
- Java nativo: verde
- CI contract: verde

Limitação ambiental preservada: Android SDK, `sdkmanager`, `adb` e dependências Capacitor não estão instalados localmente, portanto não houve compilação física local de APK/AAB nesta revisão.
