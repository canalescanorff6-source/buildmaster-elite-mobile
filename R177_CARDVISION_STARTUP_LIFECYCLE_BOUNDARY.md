# R177 — CardVision Startup Lifecycle Boundary

## Objetivo

Retirar do `CardVisionApp.tsx` a orquestração extensa de hidratação inicial sem criar uma segunda autoridade de estado/persistência e sem alterar gameplay, OCR, Cofre, Backup ou navegação.

## Mudança estrutural

Foram criadas três fronteiras complementares:

- `src/hooks/useCardVisionStartupLifecycleR177.ts`
  - coordena os efeitos React do startup;
  - mantém fail-open em safe mode;
  - impede persistência de OCR/UI/pastas antes de `sessionHydrated`;
  - memoiza o carregamento do runtime R177.

- `src/modules/runtime/cardVisionStartupRuntimeR177.ts`
  - carregado somente por `import()` dinâmico;
  - restaura Cofre, preferências, onboarding, backup, regras, calibração OCR/EFHub, pastas e sessão ativa;
  - preserva `loadHistoryStoreForStartup()` e a proteção `nativeDeferredBytes === 0`;
  - usa `readActiveSessionSnapshotR157(ACTIVE_SESSION_KEY)`, mantendo compatibilidade R157/R137;
  - nunca reidrata `result`/`draftResult` como autoridade antiga: limpa derivados e restaura somente entradas de sessão.

- `src/modules/runtime/cardVisionStartupPersistenceR177.ts`
  - concentra persistência account-scoped de UI, OCR e pastas;
  - concentra leitura segura do avatar;
  - é puro o suficiente para regressão runtime em Node.

## CardVisionApp

R176:
- `wc -l`: 2.756 linhas
- 202.897 bytes

R177:
- `wc -l`: 2.592 linhas
- 195.185 bytes

Delta:
- **-164 linhas**
- **-7.712 bytes no shell**

O pré-voo Play usa sua própria convenção e reporta 2.593 linhas.

## Startup estático

R176:
- 191 módulos
- 2.702.913 bytes

R177:
- **191 módulos**
- **2.697.178 bytes**

Delta:
- 0 módulos
- **-5.735 bytes**

`src/lib/easyExperience.ts` deixou a árvore estática do CardVision e passou a ser alcançado apenas pelo runtime dinâmico R177.

Desde R159:
- 245 → **191 módulos**
- 3.580.879 → **2.697.178 bytes**
- redução acumulada de **883.701 bytes (~24,68%)**

## Regressão real encontrada e corrigida durante a rodada

Na primeira extração, o efeito que atualiza a fila OCR após a hidratação foi removido junto com o bloco de startup. A regressão R155 detectou isso antes da promoção.

O efeito foi restaurado integralmente no `CardVisionApp`:

- aguarda `startupGateReady`;
- bloqueia em `startupSafeMode`;
- aguarda `sessionHydrated`;
- adia em background enquanto `deferredStartupReadyR155` é falso;
- carrega imediatamente se o usuário abrir o Leitor.

A R177 somente foi promovida depois dessa correção.

## Travas históricas atualizadas

Dois testes antigos ainda buscavam implementação diretamente no `CardVisionApp`:

- `tests/v38-40-fail-open-startup-regression.mjs`
- `tests/v40-80-r157-session-autosave-boundary-regression.mjs`

Eles foram atualizados para verificar a autoridade atual:

`CardVisionApp → useCardVisionStartupLifecycleR177 → cardVisionStartupRuntimeR177 → R157 / cardHistoryStore`

As regras não foram relaxadas: o Cofre continua limitado no startup, snapshots R157/R137 continuam restauráveis e autosave continua bloqueado antes da hidratação.

## Validações críticas

Passaram:

- R138 — autoridade final / fachada de produção;
- R140 — persistência confirmada e rollback;
- R153 — fila canônica do Cofre;
- R154 — guard/feedback de operação;
- R155 — startup progressivo;
- R157 — sessão dividida + autosave seguro;
- R165 — bootstrap leve de Backup;
- R170 — Backup sync health lazy;
- R175 — Central fora do shell;
- R176 — navegação fora do shell;
- v38.40 — fail-open startup;
- R177 source boundary;
- R177 runtime de persistência;
- R177 static closure.

## Gates sistêmicos

- Whole-source TypeScript R151: aprovado
- Sintaxe: **656 arquivos TS/TSX**
- Interação: **790 botões tipados / 34 imagens com alt**
- Visual/acessibilidade: aprovado
- Auditoria: **127/127**
- Pré-voo produção: **138/138**
- Assinatura lógica: `ab85d88ba849dc30`
- Pré-voo Play: **27/27**

Avisos conhecidos do Play:
- código-fonte ~6,68 MB;
- `CardVisionApp.tsx` ainda grande (~2.593 linhas pela convenção do preflight).

`quality:bundle` histórico não foi executado/não é declarado verde. Nenhum limite histórico foi enfraquecido.

## Arquivos alterados/adicionados

Alterados:
- `package.json`
- `src/components/CardVisionApp.tsx`
- `tests/v38-40-fail-open-startup-regression.mjs`
- `tests/v40-80-r157-session-autosave-boundary-regression.mjs`

Adicionados:
- `src/hooks/useCardVisionStartupLifecycleR177.ts`
- `src/modules/runtime/cardVisionStartupRuntimeR177.ts`
- `src/modules/runtime/cardVisionStartupPersistenceR177.ts`
- `tests/v40-80-r177-cardvision-startup-lifecycle-boundary-regression.mjs`
- `tests/v40-80-r177-startup-persistence-runtime-regression.ts`
- `scripts/check-cardvision-static-closure-r177.mjs`
- `R177_CARDVISION_STARTUP_LIFECYCLE_BOUNDARY.md`

## Autoridades não alteradas

Não houve mudança em:
- cálculo esportivo;
- progressão;
- 5 habilidades adicionais;
- Ímpetos;
- DNA/identidade de carta;
- posição final;
- OCR/evidências R131–R134;
- writer do Cofre;
- fila R153;
- commit R140;
- guard R154;
- runtime de Backup;
- navegação R176.

## Status

**R177 aprovada para base canônica.**
