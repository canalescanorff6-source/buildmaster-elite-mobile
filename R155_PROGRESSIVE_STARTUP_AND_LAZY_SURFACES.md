# R155 — Progressive Startup + Lazy Surfaces

## Objetivo

Reduzir trabalho de parse/carregamento e I/O secundário durante a abertura do app no Android sem tocar no motor Clean Slate, na geração de fichas ou nas autoridades de persistência.

## Diagnóstico da R154

O `CardVisionApp.tsx` ainda possuía 143 imports diretos. A árvore estática alcançável a partir do shell continha aproximadamente:

- 288 módulos TS/TSX;
- 4.244.061 bytes de código-fonte estático alcançável.

Superfícies grandes que só eram necessárias quando abertas ainda faziam parte dessa árvore, incluindo `UpdateCenterPanel`, `TeamFullMapPanel`, `EfhubVisualCalibrator`, `CleanVaultV3800` e centros de backup/qualidade.

O `UpdateAutoChecker` também era importado do módulo completo de atualizações e montado imediatamente após o splash, fazendo Capacitor, integridade/download de APK e governança de update entrarem cedo no ciclo de abertura.

## Mudanças de produção

### 1. Superfícies pesadas em chunks dinâmicos

Foram movidos para `AppLazyPanels.tsx` e deixaram de ser imports estáticos do `CardVisionApp`:

- `UpdateAutoChecker` (como `DeferredUpdateAutoCheckerR155`);
- `IntegratedHomePanel`;
- `TeamFullMapPanel`;
- `CloudSyncCenter`;
- `EfhubVisualCalibrator`;
- `ArchitectureHealthPanel`;
- `PremiumQualityCenter`;
- `CleanVaultV3800`.

Os grupos de preload existentes foram atualizados para poder aquecer essas superfícies somente quando a seção correspondente fizer sentido e quando o perfil de desempenho permitir.

### 2. Auto-update fora da hidratação crítica

Novo hook: `useDeferredStartupReadyR155`.

A checagem automática de atualização só monta depois de:

1. `startupGateReady`;
2. sessão principal hidratada;
3. modo seguro desativado;
4. uma janela de respiro dependente do perfil do aparelho;
5. uma oportunidade de `idle` do navegador.

Janelas de respiro:

- economy: 3200 ms;
- balanced: 1800 ms;
- high: 900 ms.

Depois disso, o próprio `UpdateAutoChecker` mantém sua política interna de checagem. A funcionalidade de atualização automática não foi removida.

### 3. I/O secundário não compete com a sessão

- `useCentralMatchRecordsR135` só é habilitado depois de `sessionHydrated`.
- A fila local de OCR não é lida durante a restauração crítica. Ela carrega após a janela R155 ou imediatamente se o usuário entrar no Leitor antes disso.
- Recuperação de checkpoint OCR interrompido continua preservada e não foi adiada.

## Resultado estrutural mensurado

Métrica autocontida de árvore estática do `CardVisionApp`:

| Métrica | R154 | R155 | Diferença |
|---|---:|---:|---:|
| Imports diretos do CardVision | 143 | 136 | -7 |
| Módulos estáticos alcançáveis | 288 | 261 | -27 (-9,4%) |
| Fonte estática alcançável | 4.244.061 B | 3.843.624 B | -400.437 B (-9,4%) |

Esta é uma métrica de fronteira de código-fonte/parse, não uma alegação de tempo de abertura em milissegundos de um APK real. O pacote clean não contém `node_modules`/build final para benchmark de bundle Android nesta sessão.

## Proteção permanente

Novo script:

- `scripts/check-cardvision-static-closure-r155.mjs`

Orçamento congelado:

- máximo 265 módulos estáticos;
- máximo 3.900.000 bytes de fonte estática alcançável.

Novo teste:

- `test:r155`

Ele verifica:

- typecheck de toda `src`;
- orçamento da árvore estática;
- ausência dos imports diretos pesados no CardVision;
- existência dos chunks dinâmicos;
- gate pós-hidratação do auto-update;
- carregamento tardio das partidas;
- fila OCR adiada sem prejudicar entrada imediata no Leitor.

`test:v4080` agora inclui `test:r155`.

## Autoridades preservadas

Nenhum arquivo do motor de fichas foi modificado na R155.

Permanecem intactos:

- R119 Clean Slate;
- beam 20;
- orçamento/custos;
- pesos e heurísticas;
- DNA/identidade da carta;
- posição canônica de uso;
- Top 5;
- Ímpeto;
- calibração por partidas R135/R136;
- hot path R143–R149;
- R140 commit local;
- R141 cloud/backup;
- R153 fila canônica;
- R154 gate de ações.

## Escopo diferencial R154 → R155

Arquivos runtime alterados:

- `src/components/CardVisionApp.tsx`;
- `src/components/lazy/AppLazyPanels.tsx`;
- `src/hooks/useDeferredStartupReadyR155.ts` (novo).

Infra/testes:

- `scripts/check-cardvision-static-closure-r155.mjs` (novo);
- `tests/v40-80-r155-startup-lazy-boundary-regression.mjs` (novo);
- `package.json`.

Nenhum arquivo Clean Slate/analyzer/performance engine foi alterado.

## Validação executada

- R119–R155: aprovadas (em blocos para evitar timeout do agregador).
- Typecheck autocontido de toda `src`: aprovado.
- Sintaxe: 622 arquivos TS/TSX.
- Contratos interativos: 790 botões e 34 imagens com `alt`.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Preflight Play: 27/27.
- `CardVisionApp.tsx`: 3895 linhas no contador das regressões, abaixo do teto R151 de 3901.
- Static closure R155: 261 módulos / 3.843.624 bytes.
