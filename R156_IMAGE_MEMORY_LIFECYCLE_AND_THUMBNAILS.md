# R156 — Image Memory Lifecycle + Bounded Thumbnails

## Objetivo

Reduzir retenção de `File`/`Blob`, object URLs e superfícies de decodificação de imagens no Android sem alterar OCR, Clean Slate, ficha, Top 5, Ímpeto ou autoridades de persistência.

## Diagnóstico da R155

A abertura progressiva R155 reduziu a árvore estática, mas o fluxo de imagem ainda mantinha alguns recursos pesados além do necessário:

1. `CardVisionApp` possuía refs e `URL.revokeObjectURL` espalhados para preview original e imagem melhorada.
2. Depois de confirmar uma ficha, `selectedFile`, `cardCropResult`, `qualityReport`, sessões OCR e outros dados transitórios podiam continuar referenciados mesmo com `preview` já removido.
3. O Leitor Total guardava corretamente os arquivos originais para OCR, porém usava esses mesmos arquivos como previews dos cinco slots. Assim, a UI podia decodificar várias imagens de alta resolução simultaneamente apenas para exibir miniaturas.
4. O print do adversário também usava o arquivo original inteiro como preview, embora o OCR pudesse continuar usando o original separadamente.

## Mudanças de produção

### 1. Lease única para object URLs do Leitor

Novos módulos:

- `src/modules/images/objectUrlLeaseR156.ts`
- `src/hooks/useReaderImageMemoryR156.ts`

A lease possui uma única URL ativa por finalidade e garante:

- `replace()` revoga a URL anterior antes de assumir a nova;
- `release()` é idempotente;
- unmount libera preview e imagem melhorada;
- o `CardVisionApp` não mantém mais `previewObjectUrlRef`/`enhancedObjectUrlRef` nem revogações duplicadas espalhadas.

### 2. Compactação após confirmação da ficha

Depois que `runAnalysis(true)` conclui e toda evidência necessária já foi consumida, a R156 libera imediatamente:

- object URL do print original;
- object URL da imagem melhorada;
- `selectedFile`;
- `cardCropResult`;
- `qualityReport`;
- `totalReadingSession`;
- `singlePrintSession`;
- estado de cancelamento/progresso OCR transitório.

A arte compacta `playerCardImage` permanece disponível para o resultado/Cofre. A lógica esportiva e o texto OCR permanecem intactos.

### 3. Imagem melhorada não fica viva fora do laboratório

A URL da melhoria local é revogada quando:

- o usuário escolhe `original`;
- sai do Leitor;
- desliga o modo avançado;
- troca o print;
- confirma a ficha;
- desmonta o app.

### 4. Leitor Total usa miniaturas WebP limitadas

`TotalCardReaderPanel` continua armazenando o `File` original em cada slot para OCR, mas o preview visual passa por:

- validação/sanitização existente;
- `createImageThumbnail(..., 420)`;
- object URL da miniatura;
- `loading="lazy"` + `decoding="async"`.

Cada slot possui posse própria da URL e libera a miniatura ao trocar, remover, limpar ou desmontar o painel.

No caminho normal de miniatura, cada preview possui no máximo 420 × 420 = 176.400 pixels. Para cinco slots, o teto visual é 882.000 pixels. O limite de importação permite até 40 milhões de pixels por arquivo, portanto cinco previews originais poderiam representar até 200 milhões de pixels-fonte. Esta comparação é de superfície potencial de decodificação, não uma medição direta de RAM do WebView.

O arquivo original continua sendo usado pelo OCR; não houve redução de resolução da leitura.

### 5. Print do adversário também usa preview reduzido

`TeamFullMapPanel` agora cria preview com `createImageThumbnail(..., 720)` e mantém o arquivo original exclusivamente para qualidade/OCR.

## Proteção permanente

Novos testes:

- `tests/v40-80-r156-object-url-lease-regression.ts`
- `tests/v40-80-r156-image-memory-source-regression.mjs`

Novo comando:

- `test:r156`

Ele valida:

- lease idempotente e sem revogação duplicada;
- ausência das refs antigas no CardVision;
- compactação do payload transitório após confirmação;
- liberação da imagem melhorada ao sair do laboratório;
- miniaturas de 420 px no Leitor Total;
- previews lazy/async;
- preview total não substitui o print original do CardVision;
- miniatura de 720 px para o adversário.

`test:v4080` passou a incluir `test:r156`.

## Orçamento R155 preservado

A árvore estática ficou em:

- 263 módulos;
- 3.845.618 bytes de fonte estática alcançável.

Continua abaixo dos limites R155:

- 265 módulos;
- 3.900.000 bytes.

`CardVisionApp.tsx`: 3893 linhas por `wc -l` / 3894 no auditor, abaixo do teto R151.

## Autoridades preservadas

Nenhum arquivo do motor de fichas foi alterado na R156.

Permanecem intactos:

- R119 Clean Slate;
- beam 20;
- orçamento/custos;
- pesos e heurísticas;
- DNA/identidade;
- posição canônica;
- Top 5;
- Ímpeto;
- calibração R135/R136;
- otimizações R143–R149;
- R140 persistência local;
- R141 cloud;
- R153 fila canônica;
- R154 action guard;
- R155 startup progressivo.

## Escopo diferencial R155 → R156

Runtime alterado:

- `src/components/CardVisionApp.tsx`;
- `src/components/TotalCardReaderPanel.tsx`;
- `src/modules/squad/TeamFullMapPanel.tsx`;
- `src/hooks/useReaderImageMemoryR156.ts` (novo);
- `src/modules/images/objectUrlLeaseR156.ts` (novo).

Infra/testes:

- `tests/v40-80-r156-object-url-lease-regression.ts` (novo);
- `tests/v40-80-r156-image-memory-source-regression.mjs` (novo);
- `package.json`.

Nenhum arquivo Clean Slate/analyzer/performance engine foi alterado.

## Validação executada

- R119–R156: aprovadas em blocos.
- `typecheck:v4080`: aprovado.
- Typecheck autocontido de toda `src`: aprovado.
- Sintaxe: 625 arquivos TS/TSX.
- Contratos interativos: 790 botões e 34 imagens com `alt`.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Preflight Play: 27/27.
- Static closure R155 preservado: 263 módulos / 3.845.618 bytes.
