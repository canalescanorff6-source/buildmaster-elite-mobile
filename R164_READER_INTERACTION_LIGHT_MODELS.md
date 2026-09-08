# R164 — Reader Interaction Runtime + Lightweight OCR/EFHub Models

## Objetivo

Continuar a modularização iniciada em R160–R163 retirando do `CardVisionApp.tsx` a coordenação operacional restante do Leitor sem mover a autoridade canônica de estado e sem alterar os algoritmos de OCR/evidência/produção.

## Mudanças principais

### 1. Runtime lazy de interações do Leitor
Novo arquivo: `src/modules/card-reader/readerInteractionRuntimeR164.ts`.

Passaram para runtime sob demanda:
- cancelamento do OCR;
- retomada/descarte de leitura interrompida;
- seleção e validação do print;
- detecção/redetecção e ajuste do recorte da carta;
- fila OCR local (guardar, abrir e remover);
- melhoria local de imagem/preview.

O `CardVisionApp` continua dono dos estados e setters. O runtime recebe apenas o contrato canônico e não cria uma segunda fonte de verdade.

### 2. Modelo OCR leve
Novo arquivo: `src/lib/ocrZonesModelR164.ts`.

`DEFAULT_OCR_ZONES` e os tipos `OcrZone/OcrZoneKey` foram separados do processamento Canvas/bitmap de `ocr.ts`. `ocr.ts` reexporta os mesmos contratos para compatibilidade legada.

### 3. Modelo de calibração EFHub leve
Novo arquivo: `src/modules/card-reader/efhubCalibrationModelR164.ts`.

Defaults, normalização, serialização e leitura do mapa EFHub agora podem ser usados no startup sem carregar detector de cápsulas nem a implementação pesada do calibrador. A regressão R164 compara as 10 zonas leves com `EFHUB_CANONICAL_MACRO_BOXES` para impedir drift.

### 4. Backup sem dependência pesada indireta
`backupSectionCollectorR141`, `useCardVisionBackupControllerR162` e `cardVisionBackupRuntimeR162` passaram a consumir o modelo leve de OCR/calibração quando só precisam de dados/defaults. Isso removeu da árvore estática uma cadeia pesada que chegava a `efhubManualCalibration`, `efhubLayoutGeometry` e `skillCapsuleDetector`.

## Métricas

### CardVisionApp
- R163: 2.893 linhas / 215.237 bytes
- R164: 2.838 linhas / 210.985 bytes
- Redução: 55 linhas (-1,90%) e 4.252 bytes (-1,98%)

### Árvore estática do startup
- R163: 213 módulos / 3.195.405 bytes
- R164: 210 módulos / 3.146.289 bytes
- Redução: 3 módulos e 49.116 bytes (-1,54%)

## Equivalência das rotinas movidas

Comparação contra a R163 original:
- `cancelCurrentOcr`: idêntica
- `resumeInterruptedReading`: idêntica
- `discardInterruptedReading`: idêntica
- `adjustDetectedCard`: idêntica
- `redetectPlayerCard`: idêntica
- `queueSelectedPrint`: idêntica
- `openQueuedPrint`: idêntica
- `discardQueuedPrint`: idêntica
- `handleFile`: mesmas instruções; apenas simplificação de chaves de bloco

## Autoridades preservadas

- R131 — revisão/evidência OCR
- R132 — atributos/skills por evidência
- R133 — evidência estruturada
- R134 — físico/permanente
- R138 — fachada canônica de produção e posição real
- R140/R141 — persistência/backup
- R153/R154 — fila e guardas do Cofre
- R157 — persistência dividida da sessão
- R160/R161/R163 — fronteiras lazy anteriores

Nenhum motor esportivo, distribuição de pontos, habilidades adicionais, Ímpetos, táticas, posição final ou lógica de build foi alterado na R164.

## Validação

Aprovados:
- typecheck autocontido de toda `src`;
- R131, R132, R133, R134, R138, R140, R141, R157;
- R160, R161, R162, R163 e R164;
- v31.81, v40.00 e regressões v38.40 de fast path/causa-raiz;
- 636 arquivos TS/TSX com sintaxe válida;
- 790 botões tipados;
- 34 imagens com `alt`;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- 127/127 auditorias gerais;
- 138/138 pré-voo de produção;
- 27/27 pré-voo Play.

## Nova trava R164

`tests/v40-80-r164-reader-interaction-light-model-regression.mjs` impede:
- retorno de `ocr.ts` pesado ao import estático do shell;
- retorno de `efhubManualCalibration` pesado ao shell/backup inicial;
- retorno das operações de seleção/crop/fila/melhoria ao `CardVisionApp`;
- remoção da memoização/import dinâmico do runtime R164.

`tests/v40-80-r164-calibration-model-runtime-regression.ts` garante equivalência entre o modelo leve e a geometria canônica EFHub.
