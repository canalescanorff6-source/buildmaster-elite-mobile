# R171 — Player Comparison Light Boundary

## Objetivo

Reduzir a árvore estática inicial do `CardVisionApp` sem tocar no motor esportivo, no Cofre ou nas autoridades de produção. A auditoria da R170 mostrou que `src/lib/confidenceComparison.ts` adicionava 11,7 KB exclusivos ao startup, embora o shell consumisse apenas `comparePlayers`.

## Arquitetura aplicada

Foi criado `src/lib/playerComparisonR171.ts` contendo exclusivamente:

- `PlayerComparisonItem`;
- `PlayerComparisonReport`;
- `comparePlayers`;
- o `clamp` local já usado pela função.

O `CardVisionApp` passou a importar `comparePlayers` diretamente desse módulo leve.

`confidenceComparison.ts` mantém compatibilidade pública por reexport:

- `comparePlayers`;
- `PlayerComparisonItem`;
- `PlayerComparisonReport`.

Assim, superfícies antigas que dependam da API histórica continuam válidas, enquanto o shell deixa de carregar confiabilidade, inconsistências e comparação de variantes de build apenas para comparar jogadores.

## Equivalência esportiva

A implementação de `comparePlayers` foi extraída da R170 sem reescrita. A comparação textual confirmou **2.357 caracteres idênticos** entre a função da R170 e a função da R171.

Foram preservados integralmente:

- `physicalEngine.suitabilityScore`;
- cobertura de habilidades especiais;
- prontidão das metas de atributos;
- `advancedOptimizer.efficiencyScore`;
- confiança da leitura;
- DNA e individualidade;
- consistência em partida;
- uso de habilidades especiais;
- diversidade de distribuição;
- bônus/penalidade de aderência à posição real;
- risco de clone;
- comportamento e diferencial único da carta.

Nenhuma fórmula, peso ou regra foi alterada.

## Métricas de startup

R170:

- 191 módulos estáticos;
- 2.740.050 bytes de fonte estática.

R171:

- **191 módulos estáticos**;
- **2.731.492 bytes de fonte estática**.

Ganho:

- **-8.558 bytes**;
- **-0,31%** de fonte estática;
- contagem de módulos mantida, pois `confidenceComparison.ts` foi substituído na árvore inicial pelo módulo leve R171.

## Guard R171

Foram adicionados:

- `tests/v40-80-r171-player-comparison-light-boundary-regression.mjs`;
- `scripts/check-cardvision-static-closure-r171.mjs`.

O guard garante que:

- `CardVisionApp` consuma o módulo leve;
- `confidenceComparison.ts` não volte ao startup;
- DNA, eficiência, aderência posicional e risco de clone permaneçam na comparação;
- a API histórica continue reexportada;
- a árvore permaneça em até 191 módulos e 2.735.000 bytes.

## Regressões validadas

Passaram:

- `typecheck:r151` / toda `src`;
- R122 — máximo online e DNA;
- R123 — saturação/confiança/laboratório competitivo;
- R138 — posição real e fachada de produção;
- R153 — fila canônica do Cofre;
- corpo e static closure da R170;
- R171.

## Qualidade sistêmica

Passaram:

- sintaxe: **644 arquivos TS/TSX**;
- contratos interativos: **790 botões** e **34 imagens com alt**;
- acessibilidade visual completa;
- auditoria: **127/127**;
- pré-voo de produção: **138/138**;
- assinatura lógica: `de589058565cbcbb`;
- pré-voo Play: **27/27**.

Avisos conhecidos e não introduzidos pela R171:

- projeto-fonte total ~6,65 MB;
- `CardVisionApp.tsx` continua com aproximadamente 2,88 mil linhas.

## Escopo do diff

A R171 altera somente:

- `package.json`;
- `src/components/CardVisionApp.tsx` (troca de import);
- `src/lib/confidenceComparison.ts` (reexport da fronteira leve);
- novo `src/lib/playerComparisonR171.ts`;
- novo teste R171;
- novo guard de static closure R171.

Não foram alterados:

- R138;
- R140;
- R153/R154;
- OCR;
- progressão;
- habilidades adicionais;
- Ímpetos;
- táticas;
- builds;
- persistência/Backup;
- motores de gameplay.

## Conclusão

R171 remove uma dependência de análise ampla do caminho inicial sem mudar a comparação esportiva. A próxima rodada pode voltar à auditoria dos blocos estáticos restantes, inclusive R153, mas apenas se houver uma separação que preserve fila, guard e commit síncronos/canônicos.
