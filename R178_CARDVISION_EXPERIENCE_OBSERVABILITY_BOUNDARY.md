# R178 — CardVision Experience + Observability Lazy Boundary

## Objetivo

Continuar o fechamento estrutural do `CardVisionApp.tsx` removendo responsabilidades de apresentação/experiência do shell e, ao mesmo tempo, retirar do startup a infraestrutura de observabilidade carregada apenas para decidir se o painel OCR Vision deveria aparecer.

A rodada não altera cálculo esportivo, OCR/evidência, Cofre, Backup, sessão, progressão, habilidades adicionais, Ímpetos, DNA ou posição final.

## 1. Experiência saiu do shell

Foi criado:

- `src/modules/experience/cardVisionExperienceControllerR178.ts`

A fronteira concentra:

- navegação da Evolução 360;
- navegação Premium 2.0;
- aplicação do perfil adaptativo;
- labels dos sete presets visuais;
- mapa de acentos por preset;
- aplicação de tema;
- salvar avatar;
- remover avatar.

O `CardVisionApp` mantém somente os estados/setters canônicos e consome as ações retornadas pelo controller.

### Avatar continua na mesma autoridade

`src/lib/profileAvatar.ts` ficou **byte-for-byte inalterado** contra a R177.

A diferença é somente de carregamento:

- R177: `CardVisionApp` importava `saveProfileAvatar/removeProfileAvatar` estaticamente;
- R178: o controller usa `import('@/lib/profileAvatar')` apenas quando o usuário salva/remove a foto.

Portanto não foi criada uma segunda persistência de avatar.

## 2. Feature flag do OCR Vision saiu do startup

Na R177 o shell fazia:

- `useObservabilityFeatureFlag('ocrVision2')` no `CardVisionApp`;
- só então decidia se renderizava `OcrVisionCenter`.

Isso colocava no startup:

- `src/modules/observability/useObservabilityFeatureFlag.ts`;
- `src/modules/observability/observabilityEngine.ts`.

Na R178 foi criado:

- `src/modules/card-reader/OcrVisionFeatureGateR178.tsx`

Fluxo atual:

`CardVisionApp → CardVisionLazyPanelsR174 → OcrVisionFeatureGateR178 → feature flag ocrVision2 → OcrVisionCenter`

O gate:

1. só é carregado pela superfície lazy;
2. lê a mesma flag oficial `ocrVision2`;
3. retorna `null` quando desabilitada;
4. só então faz `dynamic(import('./OcrVisionCenter'))` quando habilitada.

Assim, com a flag desligada, o painel OCR pesado continua sem ser carregado.

### Autoridades preservadas

Ficaram **byte-for-byte inalterados** contra a R177:

- `src/modules/card-reader/OcrVisionCenter.tsx`;
- `src/modules/observability/useObservabilityFeatureFlag.ts`;
- `src/modules/observability/observabilityEngine.ts`;
- `src/lib/profileAvatar.ts`.

A R178 muda somente a fronteira de carregamento.

## CardVisionApp

R177:
- `wc -l`: 2.592 linhas
- 195.185 bytes

R178:
- `wc -l`: **2.545 linhas**
- **192.538 bytes**

Delta:
- **-47 linhas**
- **-2.647 bytes no shell**

O pré-voo Play usa sua própria convenção e reporta 2.546 linhas.

## Startup estático

R177:
- 191 módulos
- 2.697.178 bytes

R178:
- **189 módulos**
- **2.689.357 bytes**

Delta:
- **-2 módulos**
- **-7.821 bytes**
- aproximadamente **-0,29%** nesta rodada

Confirmados fora da árvore estática:

- `src/modules/observability/useObservabilityFeatureFlag.ts`;
- `src/modules/observability/observabilityEngine.ts`;
- `src/lib/profileAvatar.ts`.

Confirmado dentro como fronteira leve:

- `src/modules/experience/cardVisionExperienceControllerR178.ts`.

## Evolução acumulada R159 → R178

- módulos: 245 → **189**
- redução: **56 módulos (~22,86%)**
- fonte estática: 3.580.879 → **2.689.357 bytes**
- redução: **891.522 bytes (~24,90%)**

## Travas históricas atualizadas

Quatro regressões antigas ainda verificavam a localização anterior de responsabilidades:

- `tests/v31-50-forensic-scanner-regression.ts`
  - ainda procurava consenso forense diretamente no `CardVisionApp`;
  - agora verifica a autoridade atual `readerAnalysisRuntimeR163` / `templateCalibration` e preserva a delegação do shell.

- `tests/v34-00-identity-themes-profile-regression.mjs`
  - ainda exigia `saveProfileAvatar/removeProfileAvatar` no shell;
  - agora exige que o controller R178 adquira `profileAvatar.ts` dinamicamente e continue chamando suas funções históricas.

- `tests/v40-80-r163-reader-analysis-controller-lazy-runtime-regression.mjs`
  - ainda procurava o preload R163 dentro do `CardVisionApp`;
  - agora verifica a autoridade de navegação R176, onde o preload por intenção realmente mora.

- `tests/v40-80-r164-reader-interaction-light-model-regression.mjs`
  - mesma atualização para o preload R164 via navegação R176.

Nenhuma regra foi retirada: consenso forense, calibração, avatar, preload por intenção e runtimes R163/R164 continuam obrigatórios.

## Nova regressão R178

Adicionado:

- `tests/v40-80-r178-cardvision-experience-observability-boundary-regression.mjs`

Ela trava:

- experiência fora do shell;
- nenhum `saveProfileAvatar/removeProfileAvatar` estático no `CardVisionApp`;
- observabilidade fora do shell;
- flag oficial `ocrVision2` dentro do gate lazy;
- retorno `null` quando a flag está desligada;
- `OcrVisionCenter` real atrás de segundo import dinâmico;
- labels/acento de tema centralizados;
- roteamento Premium reutilizando autoridades existentes;
- CardVision abaixo de 2.550 linhas.

## Static closure R178

Adicionado:

- `scripts/check-cardvision-static-closure-r178.mjs`

Orçamento:

- máximo **189 módulos**;
- máximo **2.690.000 bytes**.

Forbids adicionais:

- `profileAvatar.ts`;
- `useObservabilityFeatureFlag.ts`;
- `observabilityEngine.ts`.

## Validações críticas

Passaram:

- v31.80 / scanner forense;
- v34.00 / identidade visual + avatar;
- v38.40 / fail-open;
- R138 — autoridade final / fachada de produção;
- R140 — persistência confirmada e rollback;
- R153 — fila canônica do Cofre;
- R154 — guard/feedback do Cofre;
- R157 — sessão dividida/autosave;
- R163 — análise pesada do Leitor lazy;
- R164 — interações/modelos leves do Leitor;
- R174 — lazy registry;
- R177 — startup lifecycle;
- R178 — nova boundary;
- R178 static closure.

## Gates sistêmicos

- Whole-source TypeScript R151/R178: aprovado
- Sintaxe: **658 arquivos TS/TSX**
- Interação: **790 botões tipados / 34 imagens com alt**
- Visual/acessibilidade: aprovado
- Auditoria: **127/127**
- Pré-voo produção: **138/138**
- Assinatura lógica: `7be21748120de763`
- Pré-voo Play: **27/27**

Avisos conhecidos do Play:

- código-fonte ~6,68 MB;
- `CardVisionApp.tsx` ainda grande (2.546 linhas pela convenção do preflight).

`quality:bundle` histórico não foi executado e não é declarado verde. Nenhum orçamento histórico foi enfraquecido.

## Arquivos alterados/adicionados

Alterados:

- `package.json`
- `src/components/CardVisionApp.tsx`
- `src/components/lazy/CardVisionLazyPanelsR174.tsx`
- `tests/v31-50-forensic-scanner-regression.ts`
- `tests/v34-00-identity-themes-profile-regression.mjs`
- `tests/v40-80-r163-reader-analysis-controller-lazy-runtime-regression.mjs`
- `tests/v40-80-r164-reader-interaction-light-model-regression.mjs`

Adicionados:

- `src/modules/card-reader/OcrVisionFeatureGateR178.tsx`
- `src/modules/experience/cardVisionExperienceControllerR178.ts`
- `tests/v40-80-r178-cardvision-experience-observability-boundary-regression.mjs`
- `scripts/check-cardvision-static-closure-r178.mjs`
- `R178_CARDVISION_EXPERIENCE_OBSERVABILITY_BOUNDARY.md`

## Autoridades não alteradas

Não houve mudança em:

- cálculo esportivo;
- progressão;
- 5 habilidades adicionais;
- Ímpetos;
- DNA/identidade de carta;
- posição final;
- evidências OCR R131–R134;
- `OcrVisionCenter` real;
- feature flag engine;
- `profileAvatar.ts`;
- writer do Cofre;
- commit R140;
- fila R153;
- guard R154;
- Backup;
- sessão R157;
- navegação R176;
- startup lifecycle R177.

## Status

**R178 aprovada para base canônica.**
