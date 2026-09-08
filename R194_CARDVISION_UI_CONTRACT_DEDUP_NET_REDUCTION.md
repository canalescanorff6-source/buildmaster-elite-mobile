# R194 — CardVision UI Contract Dedup + Net Source Reduction

## Base canônica

- Base de entrada: R193 (`buildmaster-elite-mobile-r193-analyzer-dedup-net-source-reduction.zip`).
- Versão do pacote: `40.80.0`.
- Autoridade esportiva final preservada: R119.
- SHA-256 do R119: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo

Reduzir o tamanho total de `src` e o peso do shell sem criar nova fronteira cosmética, consolidando contratos/tabelas repetidos e removendo resíduos históricos deixados pelas modularizações R185–R193.

## Mudanças

### 1. Contratos de aparência únicos

`src/lib/easyExperience.ts` agora expõe, derivados de `EasyUiPreferences`, os contratos canônicos:

- `AppTheme`
- `AccentTheme`
- `TextScale`
- `DensityMode`
- `MotionPreference`
- `PerformanceMode`

CardVision, backup, experiência e aparência deixam de manter unions independentes para os mesmos valores.

### 2. Views canônicas de Ajustes e Cofre

`src/lib/appNavigationR127.ts` passa a ser a fonte única para:

- `CardVisionSettingsView`
- `CardVisionVaultView`

R185/R190/R191 e o shell consomem esses contratos sem recriar listas paralelas.

### 3. Modo de leitura canônico

`cardVisionReaderActionsR187.ts` exporta `CardVisionReadingModeR187`; o shell reutiliza o mesmo contrato em vez de declarar uma union duplicada.

### 4. Nomes táticos únicos

`src/lib/analyzerDomain.ts` passa a expor `TACTICAL_STYLE_NAME`.

Passaram a reutilizá-lo:

- `analyzer.ts`
- `teamOptimizer.ts`
- `ResultWorkspace.tsx`
- `TeamFullMapPanel.tsx`
- `appOptions.ts` preserva a API histórica `tacticalStyleName` como alias da fonte canônica.

Os rótulos permanecem byte-a-byte equivalentes nos pontos consolidados.

### 5. Posições PT sem mapas paralelos

`POSITION_PT` passou a ser reutilizado por:

- `teamOptimizer.ts`
- `ResultWorkspace.tsx`
- `ResultAdvancedWorkspaceR192.tsx`

Foram removidos mapas locais duplicados CA/SA/PE/PD/MLG/VOL/ZAG etc.

### 6. Shell enxugado

Foram removidos imports runtime históricos já mortos após as extrações anteriores, inclusive dependências que não deveriam mais entrar pelo shell.

Também foram consolidados:

- navegação repetida para Ajustes;
- estado derivado redundante de estágio/progresso da criação;
- wrapper de busy do Cofre usado uma única vez;
- variável intermediária do controller de experiência;
- memo usado uma única vez para habilitar a geração.

Nenhum estado canônico de ficha, OCR ou Cofre foi movido para um writer novo.

## Métricas contra a R193 congelada

| Métrica | R193 | R194 | Ganho |
|---|---:|---:|---:|
| `src` TS/TSX | 5.343.058 B | 5.339.892 B | **−3.166 B** |
| `CardVisionApp.tsx` | 112.350 B | 110.772 B | **−1.578 B** |
| `CardVisionApp.tsx` (`wc -l`) | 1.711 | 1.670 | **−41 linhas** |
| `analyzer.ts` | 109.549 B | 109.285 B | **−264 B** |
| `ResultWorkspace.tsx` | 99.861 B | 99.453 B | **−408 B** |
| closure inicial CardVision | 2.383.698 B | 2.381.801 B | **−1.897 B** |
| módulos closure CardVision | 178 | 178 | estável |
| closure inicial Resultado | 2.126.710 B | 2.126.356 B | **−354 B** |
| módulos closure Resultado | 125 | 125 | estável |

Orçamento atual de `src`: **5.339.892 / 5.505.024 B (97,0%)**.

Margem real: **165.132 B**.

Nenhum teto de orçamento foi aumentado.

## Gate R194

Adicionados:

- `tests/v40-80-r194-cardvision-contract-dedup-regression.mjs`
- `scripts/check-cardvision-static-closure-r194.mjs`
- `npm run test:r194`

O gate impede:

- retorno de unions paralelas de UI;
- retorno de tabelas táticas duplicadas;
- retorno de mapas locais de posição PT nos módulos consolidados;
- reintrodução dos imports históricos mortos no shell;
- crescimento do `CardVisionApp` acima de 111 KB;
- perda da redução líquida de `src`;
- crescimento da closure inicial acima de 2.382.000 B;
- qualquer mudança do SHA da R119.

## Regressões executadas

### Autoridade esportiva

- R119 Clean Slate — aprovado.
- R119 Output Quality — aprovado.
- R119 Result UI — aprovado.
- R122 Máximo Online + DNA — aprovado.
- R125 role-aware/card-specific — aprovado.
- R184 estabilidade por posição — aprovado.
- R186 equivalência congelada — aprovado.
- R193 equivalência de habilidades especiais — aprovado.

### OCR / aplicação

- v38.40 — **15/15 aprovadas**.
- R162 e R170 — backup/sync lazy aprovados.
- R178 — experiência/observabilidade aprovadas.
- R185–R194 — fronteiras recentes aprovadas, com ajustes apenas em contratos históricos de localização/encadeamento quando necessário.

### Release / qualidade

- Sintaxe: **660 TS/TSX**.
- Interativos: **790 botões** e **34 imagens com alt**.
- Visual/acessibilidade — aprovado.
- Auditoria: **127/127**.
- Pré-voo de produção: **138/138**.
- Assinatura lógica: `13158e0e8aaa8468`.
- Google Play: **27/27**.
- Java nativo gerado — aprovado.
- R182 Android source/workflow readiness — aprovado.
- R183 release convergence — **17 contratos** aprovados.

## Limitação ambiental

O container atual continua sem `node_modules`/Capacitor e sem Android SDK/`sdkmanager`/`adb`. Portanto, a R194 valida fonte, Java gerado, workflows e preflights, mas **não declara APK/AAB físico compilado localmente**.

## Resultado

A R194 reduz código total e peso inicial sem criar nova autoridade, sem mudar o motor esportivo e sem ampliar orçamento. A próxima revisão deve continuar priorizando redução líquida/complexidade real antes de novas extrações puramente estruturais.
