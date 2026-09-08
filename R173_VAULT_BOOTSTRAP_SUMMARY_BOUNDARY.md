# R173 — Vault Bootstrap Summary Boundary

## Objetivo

Reduzir o acoplamento do `CardVisionApp` com o módulo completo `cleanVaultV3800.ts` sem alterar identidade de jogador, lifecycle do Cofre, detecção de duplicatas, persistência R140, fila R153 ou autoridade de produção R138.

## Diagnóstico da R172

O shell importava `buildCleanVaultSummaryV3800` apenas para exibir na home do Cofre:

- total de jogadores organizados;
- total de fichas ativas;
- total de fichas arquivadas.

O resumo completo também calculava favoritos, revisão, grupos de duplicatas, assinaturas de build e agrupamentos completos. Isso mantinha `cleanVaultV3800.ts` (aprox. 10 KB) no caminho estático mesmo quando a interface inicial não precisava dessas regras.

## Mudança R173

### Novo contrato leve

Criado:

`src/modules/vault/vaultBootstrapSummaryR173.ts`

Versão:

`40.80-r173-vault-bootstrap-summary-v1`

Responsabilidades exclusivas:

- gerar a chave leve de identidade por nome para agrupamento de jogadores;
- contar jogadores ativos;
- contar fichas ativas;
- contar fichas arquivadas.

O contrato não depende de:

- `cardIdentityFingerprintR126`;
- `analysisUsagePositionR138`;
- assinaturas de build;
- detecção de duplicatas;
- lógica de booster/Ímpeto;
- motores de progressão.

### Identidade compartilhada

`cleanVaultV3800.ts` continua expondo `cleanVaultPlayerKey`, mas agora delega para `cleanVaultPlayerKeyR173`.

Dessa forma, o shell e o Cofre completo usam a mesma regra de normalização do nome do jogador. Não foi criada uma segunda regra de identidade.

### CardVisionApp

O shell deixou de importar:

`@/lib/cleanVaultV3800`

E passou a importar:

`@/modules/vault/vaultBootstrapSummaryR173`

O resumo da home agora calcula somente os três números que realmente renderiza.

## Equivalência funcional

Foi criado teste runtime comparando o resumo bootstrap R173 contra `buildCleanVaultSummaryV3800` em cenários com:

- nomes acentuados;
- diferença de caixa;
- múltiplas cartas do mesmo jogador;
- entradas arquivadas;
- entradas sem nome.

Resultados equivalentes nos três campos exibidos pelo shell:

- `players`;
- `fichas`;
- `archived`.

Entradas sem nome continuam separadas pelo ID, preservando a regra histórica.

## Impacto de startup

### R172

- módulos estáticos: 191
- bytes estáticos: 2.727.779 B

### R173

- módulos estáticos: 191
- bytes estáticos: 2.718.734 B

### Ganho

- módulos: estável
- bytes: **-9.045 B**
- redução: **-0,33%** nesta rodada

`cleanVaultV3800.ts` agora está explicitamente proibido pela trava R173 de retornar à árvore estática do `CardVisionApp`.

## CardVisionApp

- R172: 213.189 B
- R173: 213.170 B
- linhas: 2.876 (`wc -l`)

A rodada não tentou reduzir linhas artificialmente; o ganho veio da remoção de uma responsabilidade indevida do shell.

## Autoridades preservadas

Nenhuma alteração foi feita em:

- R138 — autoridade final de produção;
- R139 — lifecycle do Cofre;
- R140 — persistência confirmada e rollback;
- R153 — fila canônica;
- R154 — guard de operações;
- R169 — lifecycle/mutações deferred;
- R172 — commit leve confirmado;
- OCR;
- builds;
- progressão;
- habilidades adicionais;
- Ímpetos;
- posição final;
- DNA competitivo.

## Regressões executadas

Passaram:

- typecheck autocontido R151/R173;
- v38.00 Clean Vault;
- R138;
- R139;
- R140;
- R153 runtime + source;
- R154 runtime + source;
- R172;
- R173 source;
- R173 runtime;
- static closure R173.

## Qualidade sistêmica

- 647 arquivos TS/TSX com sintaxe válida;
- 790 botões tipados;
- 34 imagens com `alt`;
- visual/acessibilidade aprovado;
- auditoria: 127/127;
- pré-voo de produção: 138/138;
- pré-voo Play: 27/27;
- assinatura lógica: `6e5fde98f947ae6c`.

Avisos já conhecidos e não introduzidos pela R173:

- fonte total do projeto ~6,66 MB;
- `CardVisionApp.tsx` ainda é grande (~2,88 mil linhas).

## Decisão arquitetural

A R173 reforça a estratégia de fechamento: o shell deve carregar apenas dados/resumos necessários para a abertura. Regras completas de organização, duplicidade e edição do Cofre permanecem nas superfícies e runtimes onde são realmente usadas.
