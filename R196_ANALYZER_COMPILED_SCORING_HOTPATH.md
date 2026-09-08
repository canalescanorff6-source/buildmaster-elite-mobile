# R196 — Analyzer compiled scoring hot path

## Base canônica

R195 — `buildmaster-elite-mobile-r195-controller-prop-hotpath-net-reduction.zip`.

## Objetivo

Reduzir custo de CPU e tamanho líquido do `src` no `src/lib/analyzer.ts` sem alterar qualquer saída esportiva, R119, OCR, Cofre, Resultado ou contratos lazy.

## Alterações principais

1. **Scorers de variantes compilados uma vez por busca**
   - removidos os helpers redundantes `identityPlanScore`, `adaptationPlanScore` e `adaptivePlanScore`;
   - pesos individuais, funcionais, híbridos, identidade e adaptação passam a ser calculados uma única vez dentro de `buildTrainingVariants`;
   - todos os candidatos reutilizam os mesmos scorers já compilados;
   - qualidade e eficiência reutilizam os mesmos scorers, sem reconstruir pesos.

2. **Menos alocações por análise**
   - catálogo oficial reutiliza `OFFICIAL_ADDITIONAL_SKILLS` em vez de reconstruir `Set` local;
   - grupos de identidade reutilizam os arrays canônicos em vez de criar `Set` por chamada;
   - `adaptiveTrainingWeights` é calculado uma vez nos pontos em que antes era repetido dentro de comparadores/filtros.

3. **Deduplicação no fechamento da análise**
   - `selected.label` é reaproveitado como label canônico da posição escolhida;
   - o treino primário de diagnóstico é resolvido uma única vez;
   - a prioridade já calculada por `trainingTemplate` é reutilizada pelo Error Tolerance.

## Redução líquida

Comparação exata R195 -> R196:

- `src/lib/analyzer.ts`: **109.361 B / 1.233 linhas -> 108.337 B / 1.219 linhas**
- redução do analyzer: **1.024 bytes / 14 linhas**
- `src` total: **5.336.611 B -> 5.335.587 B**
- redução líquida total: **1.024 bytes**
- margem do orçamento: **169.437 bytes**
- nenhum teto foi aumentado.

## Closure inicial

CardVision:

- R195: **178 módulos / 2.378.554 B**
- R196: **178 módulos / 2.377.530 B**
- redução: **1.024 bytes**

Resultado R192/R196:

- **125 módulos / 2.125.408 B**
- ferramentas avançadas, revisão e calibração continuam fora do carregamento inicial.

## Benchmark local indicativo

Fixture FULL fixa, 4 warm-ups + 20 execuções, mesmo ambiente/node e mesmo checksum de saída:

- R195: **331,45 ms/análise**
- R196: **172,68 ms/análise**
- melhora observada: aproximadamente **47,9%** no caminho benchmarkado.

Este benchmark é evidência local, não gate de CI, pois tempo absoluto varia por hardware/ambiente. O gate R196 protege estruturalmente a compilação única dos scorers e a equivalência de saída.

## Equivalência e autoridade

- R186 snapshot de evidência/skills/Ímpetos/posição: **byte-a-byte preservado**;
- R193 Curva descendente e Comandante da defesa (GO): **byte-a-byte preservados**;
- R119 SHA-256 permanece:
  `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

Nenhuma alteração em:

- progressão;
- orçamento de treino;
- DNA da carta;
- Top 5;
- Ímpetos;
- escolha de posição;
- neutralidade de GER/Overall;
- autoridade final R119.

## Validações

Aprovados:

- `npm run typecheck:r151`
- `npm run test:r119`
- `npm run test:r122`
- `npm run test:r125`
- `npm run test:r180` até `test:r196` em execução segmentada
- `npm run test:v3840` — **15/15**
- `npm run quality:syntax` — **660 TS/TSX**
- `npm run quality:interactive` — **790 botões / 34 imagens com alt**
- `npm run quality:audit` — **127/127**
- `npm run release:preflight` — **138/138**, assinatura `d4517c186adda895`
- `npm run release:play-preflight` — **27/27**
- `npm run quality:native-java`
- `npm run quality:ci-contract`

## Android

Fonte/workflows continuam verdes. O ambiente local continua sem Android SDK/adb/sdkmanager/node_modules completos, portanto não há alegação de APK/AAB físico compilado localmente nesta revisão.
