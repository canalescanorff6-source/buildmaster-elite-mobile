# R160 — Lazy Reader/OCR Runtime

## Objetivo

Reduzir o caminho crítico de abertura do BuildMaster Elite Tático no Android sem alterar a inteligência esportiva, as regras de produção, o OCR, a calibração, o Cofre ou os critérios de evidência.

A R159 já havia retirado superfícies ocasionais da árvore inicial. A auditoria seguinte mostrou que o `CardVisionApp.tsx` ainda importava estaticamente grande parte do runtime do leitor, mesmo em sessões nas quais o usuário não abria o Leitor.

## Diagnóstico

Na R159, a árvore estática alcançável a partir de `CardVisionApp.tsx` media:

- 245 módulos
- 3.580.879 bytes de fonte estática

Os principais grupos do leitor ainda importados no startup incluíam:

- leitura total da carta;
- Single Print Pro;
- crop/preview da carta;
- OCR de alta precisão;
- consenso forense;
- normalização EFHub;
- calibração de template;
- worker OCR;
- proteção/retomada em background;
- fila OCR;
- processamento de imagem.

## Mudanças

### 1. Runtime lazy central do leitor

Foi criado:

`src/modules/card-reader/readerRuntimeR160.ts`

O módulo é uma fachada leve baseada em `import()` dinâmico e memoização. O runtime completo só é adquirido quando uma operação real do leitor necessita dos motores pesados.

### 2. Preload por intenção do usuário

Ao abrir a seção `leitor`, o app chama `preloadReaderRuntimeR160()`.

Assim, o custo sai da abertura global do aplicativo, mas o download/resolução do chunk pode começar assim que o usuário demonstra intenção de ler uma carta.

### 3. Loaders granulares para tarefas pequenas

Duas operações não precisam acordar o leitor inteiro:

- retomada/checkpoint em background;
- fila local de OCR.

Por isso existem loaders próprios e memoizados:

- `loadBackgroundOcrRuntimeR160()`;
- `loadOcrQueueRuntimeR160()`.

Isso evita transformar uma verificação de checkpoint ou uma atualização da fila em carregamento do pipeline completo.

### 4. Evidência R133 desacoplada do Single Print runtime

`cardStructuredEvidenceBoundaryR133.ts` importava `fieldByKey` de `singlePrintPro` em runtime, embora o helper apenas execute uma busca em `session.fields`.

A R160 mantém exatamente a mesma semântica localmente:

`session?.fields.find((field) => field.key === key) ?? null`

Os contratos `SingleFieldEvidence` e `SinglePrintSession` continuam como `import type`.

Isso impede que a cadeia R134 → R133 puxe o motor `singlePrintPro` inteiro durante o startup apenas para localizar um campo.

### 5. Comportamento preservado

Os algoritmos continuam nos módulos originais. A R160 muda quando eles são carregados, não como calculam.

Foram preservados:

- Single Print Pro;
- Leitor Total;
- OCR de alta precisão;
- consenso forense;
- normalização/determinismo EFHub;
- calibração manual e de template;
- aprendizado local de OCR;
- checkpoint/background;
- fila OCR;
- crop/preview da carta;
- autoridade de produção R138;
- fronteiras de evidência R131–R134.

## Resultado de startup

### R159

- 245 módulos estáticos
- 3.580.879 bytes

### R160

- 227 módulos estáticos
- 3.342.810 bytes

### Redução

- 18 módulos
- 238.069 bytes
- aproximadamente 7,35% menos módulos na árvore estática
- aproximadamente 6,65% menos fonte estática alcançável

Novo teto R160:

- máximo 230 módulos
- máximo 3.380.000 bytes

O teto é verificado por `scripts/check-cardvision-static-closure-r160.mjs`.

## Regressão permanente

Foi adicionado:

`tests/v40-80-r160-lazy-reader-runtime-regression.mjs`

O teste impede:

- reintrodução de imports runtime estáticos dos motores deferidos no `CardVisionApp`;
- retorno da dependência runtime R133 → `singlePrintPro` apenas por `fieldByKey`;
- remoção do preload por intenção;
- remoção dos loaders granulares de background/fila;
- perda da memoização dos chunks.

A R160 foi integrada à bateria da v40.80 sem alterar o contrato histórico de `test:all`: `test:v4080` permanece como último estágio e agora inclui `test:r160`.

## Validação executada

Passaram nesta versão:

- typecheck autocontido de toda `src`;
- R130 parser/boundaries;
- R131 review evidence boundary;
- R132 OCR attribute evidence boundary;
- R133 structured evidence boundary;
- R134 physical/permanent evidence boundary;
- R138 canonical production facade;
- R155 startup lazy;
- R156 image memory lifecycle;
- R157 split session persistence;
- R158 lazy domain surfaces;
- R159 lazy overlays/settings;
- R160 lazy reader runtime;
- sintaxe: 628 arquivos TS/TSX;
- contratos interativos: 790 botões tipados e 34 imagens com `alt`;
- visual/acessibilidade;
- auditoria geral: 127/127;
- pré-voo de produção: 138/138;
- pré-voo Play: 27/27.

Os timeouts observados ao agrupar testes longos foram operacionais do executor; os mesmos testes foram repetidos individualmente e aprovados.

## Observação para a próxima rodada

`src/components/CardVisionApp.tsx` continua grande (3.922 linhas). A auditoria o mantém como aviso, não como falha.

Depois de retirar mais peso da árvore inicial, o próximo ganho estrutural provável é dividir responsabilidades do `CardVisionApp` em controladores/hooks menores, desde que isso seja feito sem criar escritores paralelos, duplicar estado ou quebrar a autoridade canônica já consolidada.

## Resultado final

R160 melhora o tempo e o custo de abertura mantendo intacta a inteligência esportiva e o comportamento do leitor. O OCR pesado deixa de ser custo obrigatório de toda sessão e passa a ser carregado sob demanda, com antecipação quando o usuário entra no Leitor.
