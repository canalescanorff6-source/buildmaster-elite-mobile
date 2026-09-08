# R176 — CardVision Navigation Controller Boundary

## Objetivo

Retirar do `CardVisionApp.tsx` a orquestração completa de navegação sem alterar motores esportivos, OCR, Cofre, Backup, fila R153, guard R154 ou writers canônicos.

## Causa estrutural

Na R175 o shell ainda concentrava:

- construção da navegação principal;
- resolução de grupo/workspace;
- persistência de snapshot de navegação;
- deep links internos;
- histórico de navegação/voltar;
- restauração de scroll/foco;
- preloads orientados pela navegação;
- eventos de atualização que abrem Ajustes;
- registro de atividade Premium por navegação.

Além disso, o shell importava `appRefinement.ts` completo para usar apenas deep link + snapshot de navegação.

## Implementação R176

### 1. Controller de navegação

Criado:

`src/hooks/useCardVisionNavigationControllerR176.ts`

Ele passa a ser responsável por:

- `mainNavigation`;
- `currentNavigation`;
- `currentNavigationGroup`;
- `currentPlayerWorkspace`;
- `openMainSection`;
- `openNavigationGroup`;
- `openPlayerWorkspace`;
- `goBackInsideApp`;
- restauração de foco/scroll;
- preload adaptativo R174;
- preload do leitor R160/R161/R163/R164;
- preload do Cofre R169;
- deep link + snapshot persistido;
- eventos `buildmaster:update-available` / `buildmaster:open-updates`;
- anúncio Premium da área atual;
- atividade recente Premium.

O shell apenas fornece estado/callbacks e consome o contrato resultante.

### 2. Modelo de navegação consolidado

`src/lib/appNavigationR127.ts` agora também contém o contrato leve de persistência/deep link:

- `NAVIGATION_STATE_KEY`;
- migração da chave legada v2739;
- `readNavigationSnapshot`;
- `writeNavigationSnapshot`;
- `parseInternalDeepLink`;
- tipos `MainNavigationGroup`, `PlayerWorkspace` e `NavigationSnapshot`.

A implementação foi movida preservando as strings/chaves históricas e o comportamento v2.

### 3. Compatibilidade histórica

`src/lib/appRefinement.ts` continua expondo:

- `NAVIGATION_STATE_KEY`;
- `parseInternalDeepLink`;
- `readNavigationSnapshot`;
- `writeNavigationSnapshot`;
- tipos de navegação.

Agora esses símbolos são reexportados do modelo canônico `appNavigationR127`, evitando segunda autoridade.

## Resultado estrutural

### CardVisionApp

R175:

- 2.830 linhas (`wc -l`)

R176:

- 2.756 linhas (`wc -l`)

Delta:

- **-74 linhas**

O pré-voo usa sua própria convenção e informa 2.757 linhas.

### Startup estático

R175:

- 191 módulos
- 2.704.482 bytes

R176:

- 191 módulos
- 2.702.913 bytes

Delta:

- módulos: **0**
- bytes: **-1.569 B**

O ganho de bytes é secundário; o ganho principal é a redução de responsabilidade do shell sem regredir a árvore inicial.

### Acumulado R159 → R176

R159:

- 245 módulos
- 3.580.879 bytes

R176:

- 191 módulos
- 2.702.913 bytes

Acumulado:

- **-54 módulos**
- **-877.966 bytes**
- aproximadamente **-24,52%** da fonte estática inicial.

## Regressões R176

Criados:

- `tests/v40-80-r176-cardvision-navigation-controller-boundary-regression.mjs`
- `tests/v40-80-r176-navigation-runtime-regression.ts`
- `scripts/check-cardvision-static-closure-r176.mjs`

O runtime valida:

- deep link de grupo;
- deep link de workspace;
- fallback de workspace inválido;
- rejeição de grupo inválido;
- gravação de snapshot v2;
- leitura do snapshot;
- migração do snapshot legado v1;
- contadores/hints da navegação principal.

A trava estática exige:

- máximo de 191 módulos;
- máximo de 2.704.000 bytes;
- `appRefinement.ts` fora do startup;
- controller R176 presente;
- modelo `appNavigationR127` presente;
- todas as fronteiras leves R167–R175 preservadas.

## Travas históricas atualizadas

### R155

A verificação do repositório de partidas passou a seguir a autoridade atual R175:

`CardVisionApp -> useCardVisionCentralWorkspaceR175 -> useCentralMatchRecordsR135`

A condição de proteção de startup continua obrigatória.

### R174

A verificação de preload passou a seguir a autoridade atual R176:

`CardVisionApp -> useCardVisionNavigationControllerR176 -> CardVisionLazyPanelsR174`

O preload adaptativo continua obrigatório e `AppPanelPreloadR174` continua fora do startup estático.

## Validação crítica

Passaram:

- R138 — autoridade final de produção;
- R140 — persistência confirmada + rollback;
- R153 — fila canônica do Cofre;
- R154 — guard/feedback;
- R155 — startup progressivo;
- R170 — Backup sync health;
- R172 — commit leve;
- R174 — lazy registry;
- R175 — Central workspace;
- R176 source/runtime/static closure.

## Qualidade sistêmica

- whole-source TypeScript R151: aprovado;
- sintaxe: 652 arquivos TS/TSX;
- interações: 790 botões tipados;
- imagens: 34 com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- assinatura lógica: `1d65dcdd617c7a5b`;
- Play preflight: 27/27.

Avisos existentes:

- fonte total ~6,66 MB;
- `CardVisionApp.tsx` ainda grande (~2.757 linhas pela convenção do preflight).

`quality:bundle` histórico não foi declarado verde e seu orçamento não foi enfraquecido.

## Autoridades preservadas

Nenhuma mudança foi feita em:

- R138 / fachada final;
- algoritmos de progressão;
- 5 habilidades adicionais;
- Ímpetos;
- DNA da carta;
- posição final;
- motores de gameplay;
- OCR;
- R140 writer;
- R153 fila;
- R154 guard;
- Backup/cloud.

## Conclusão

A R176 transforma a navegação em uma boundary explícita e deixa o `CardVisionApp` mais próximo de um shell real. A versão reduz 74 linhas do monólito, mantém 191 módulos no startup, reduz levemente bytes estáticos e preserva os contratos históricos de deep link, navegação persistida e preload.
