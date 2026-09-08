# R174 — CardVision Lazy Registry Boundary

## Objetivo

Reduzir o acoplamento estrutural do `CardVisionApp` sem alterar lógica esportiva, OCR, Cofre, Backup, fila R153, guard R154 ou commit confirmado R140.

A R173 ainda fazia o shell importar `src/components/lazy/AppLazyPanels.tsx`, um registro genérico que concentrava wrappers `dynamic()` de superfícies usadas pelo CardVision, superfícies exclusivas de outros workspaces e toda a configuração de preload adaptativo.

## Mudança estrutural

### 1. Registro lazy específico do CardVision

Criado:

`src/components/lazy/CardVisionLazyPanelsR174.tsx`

Esse arquivo contém somente os wrappers lazy necessários diretamente pelo `CardVisionApp` e duas funções leves de delegação de preload.

O `CardVisionApp` deixou de importar runtime de:

`src/components/lazy/AppLazyPanels.tsx`

A fachada genérica continua existindo para consumidores históricos e reexporta o registro específico, sem duplicar as definições dos mesmos componentes.

### 2. Preload adaptativo fora do startup

Criado:

`src/components/lazy/AppPanelPreloadR174.ts`

Para esse módulo foram movidos:

- `preloadReaderSurfaceR161`;
- `LazyPanelGroup`;
- mapa `PANEL_PRELOADERS`;
- `preloadPanelGroup`;
- controle de grupos preloaded/preloading;
- integração com `shouldPreloadInBackground`;
- `preloadModuleLimit`;
- espaçamento por `scheduleIdleTask`.

O registro específico usa `import()` dinâmico para adquirir esse módulo somente após intenção/idle. Portanto, o mapa de preload não participa mais da árvore estática inicial.

### 3. Compatibilidade preservada

`src/components/lazy/AppLazyPanels.tsx` continua sendo uma fachada válida para `ResultWorkspace`, `TeamFullMapPanel` e consumidores históricos.

Ele:

- reexporta os wrappers compartilhados de `CardVisionLazyPanelsR174`;
- reexporta o contrato de preload de `AppPanelPreloadR174`;
- mantém wrappers que não pertencem diretamente ao shell, como `SkillAndTrainingPanel`, `VideoReviewPanel`, `CreatorBuildResearchPanel`, `GlobalProLabV3900Panel` e `FormationRoleLabPanel`.

Não foi criada uma segunda implementação dos mesmos wrappers compartilhados.

## Métrica de startup

Medição com o mesmo closure checker sobre os dois pacotes reais:

- R173: **191 módulos / 2.718.734 bytes**
- R174: **191 módulos / 2.711.465 bytes**

Delta R173 → R174:

- módulos: **0**
- fonte estática: **-7.269 bytes**
- redução da fonte estática da rodada: **-0,27%**

Acumulado desde R159:

- módulos: **245 → 191** (`-54`, cerca de `-22,04%`)
- fonte estática: **3.580.879 → 2.711.465 bytes** (`-869.414 bytes`, cerca de `-24,28%`)

## CardVisionApp

R173:

- `wc -l`: 2.876 linhas
- 213.170 bytes

R174 final:

- `wc -l`: 2.876 linhas
- 213.229 bytes

A primeira implementação da R174 adicionava wiring de preload diretamente ao shell. Esse desenho foi rejeitado antes do release. O wiring foi encapsulado no registro lazy R174, mantendo o número de linhas do `CardVisionApp` igual ao da R173.

O preflight usa uma convenção de contagem que reporta aproximadamente 2.877 linhas; esse aviso estrutural continua sendo dívida conhecida.

## Autoridades preservadas

Nenhuma alteração foi feita em:

- autoridade de produção R138;
- lifecycle do Cofre R139;
- commit/rollback R140;
- fila canônica R153;
- guard operacional R154;
- runtime cloud R166;
- mutações lazy R169;
- Backup R170;
- comparação esportiva R171;
- commit leve R172;
- resumo bootstrap R173;
- OCR e evidências R131–R134;
- progressão, habilidades adicionais, Ímpetos, DNA, posição final ou táticas.

## Regressões e validação

Passaram na versão final:

- `npm run test:r174`;
- typecheck autocontido de toda `src` (R151);
- R155 — startup lazy boundary;
- R158 — lazy domain surfaces;
- R159 — lazy overlays/settings;
- R161 — reader surface/evidence lazy;
- v38.20 — invisible optimization integration;
- R138;
- R140;
- R153;
- R154;
- R172;
- R173;
- closure R174.

Qualidade final:

- **649** arquivos TS/TSX com sintaxe aprovada;
- **790** botões tipados;
- **34** imagens com `alt`;
- visual/acessibilidade aprovados;
- **127/127** auditorias;
- **138/138** pré-voo de produção;
- assinatura lógica: `2a696aed500368ae`;
- **27/27** pré-voo Play.

## Dívidas conhecidas não mascaradas

Permanecem avisos legítimos:

- código-fonte total em aproximadamente **6,66 MB**;
- `CardVisionApp` ainda é grande (~2,88 mil linhas pela convenção do preflight);
- o limite histórico de `quality:bundle` continua dívida preexistente e **não foi enfraquecido nem declarado verde** nesta rodada.

## Trava R174

A nova regressão impede:

- retorno do `AppLazyPanels` genérico ao import runtime do `CardVisionApp`;
- retorno do `AppPanelPreloadR174` ao startup estático;
- mistura de wrappers não utilizados pelo shell dentro do registro específico;
- perda da fachada compatível;
- perda do preload adaptativo R155/R158/R159/R161;
- crescimento do registro específico acima do orçamento definido;
- regressão da árvore estática além do orçamento R174.

## Conclusão

A R174 é uma melhoria de fechamento estrutural. O ganho de bytes é menor que nas grandes rodadas de lazy loading, mas remove uma responsabilidade genérica do shell, mantém o `CardVisionApp` sem crescimento de linhas e preserva integralmente os contratos de negócio e persistência.
