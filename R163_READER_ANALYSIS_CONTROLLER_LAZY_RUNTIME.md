# R163 — Reader Analysis Controller + Lazy Runtime

## Objetivo

Reduzir o monólito `src/components/CardVisionApp.tsx` sem criar estado paralelo nem alterar a lógica do Leitor/OCR, movendo a orquestração pesada das leituras unitária e total para um runtime carregado sob demanda.

## Base canônica

- Entrada: R162 — `buildmaster-elite-mobile-r162-backup-controller-lazy-runtime.zip`
- Saída: R163 — `buildmaster-elite-mobile-r163-reader-analysis-controller-lazy-runtime.zip`
- Versão pública do app permanece `40.80.0`; R163 é revisão arquitetural interna.

## Alterações principais

### 1. Orquestração pesada do Leitor extraída

Novo runtime:

- `src/modules/card-reader/readerAnalysisRuntimeR163.ts`

Foram movidas, sem reescrita algorítmica:

- `analyzeSelectedImage(...)`
- `analyzeTotalCardCaptures(...)`

As duas funções foram comparadas com a R162 original e permaneceram textualmente idênticas após a extração.

### 2. Estado canônico permanece no CardVisionApp

A R163 não cria uma segunda autoridade para:

- arquivo selecionado;
- preview/recorte;
- texto OCR;
- sessão Single Print;
- sessão Total Reader;
- progresso do leitor;
- resultado/draft;
- campos manuais;
- calibração EFHub.

O runtime recebe um contrato explícito `ReaderAnalysisContextR163` com os valores, refs, setters e callbacks do shell.

### 3. Runtime sob demanda

O carregamento R163 foi integrado ao loader leve já existente:

- `src/modules/card-reader/readerRuntimeR160.ts`

Novas funções:

- `loadReaderAnalysisRuntimeR163()`
- `preloadReaderAnalysisRuntimeR163()`

O `CardVisionApp` não possui import estático do runtime pesado. O preload acontece somente quando o usuário entra no Leitor.

### 4. Autoridades preservadas

A R163 continua usando:

- R160 para motores OCR/crop/fila/processamento de imagem;
- R161 para workflow de revisão/evidência;
- R131 para aprendizado apenas de habilidades OCR confirmadas;
- R134 para fronteira física/permanente e texto de produção;
- R138 para criação da análise de produção.

Nenhum writer de gameplay, Cofre ou Backup foi duplicado.

## Métricas

| Métrica | R162 | R163 | Diferença |
|---|---:|---:|---:|
| `CardVisionApp.tsx` | 3.432 linhas | 2.893 linhas | -539 (-15,71%) |
| Tamanho de `CardVisionApp.tsx` | 248.637 B | 215.237 B | -33.400 B (-13,43%) |
| Módulos na árvore estática | 213 | 213 | 0 |
| Fonte estática alcançável | 3.228.385 B | 3.195.405 B | -32.980 B (-1,02%) |

## Limpeza adicional

Após a extração foram removidos do shell imports mortos que pertenciam apenas à orquestração movida, incluindo referências runtime a catálogo local, macros de calibração, scans históricos e catálogo provisório.

## Regressões atualizadas

Testes históricos que procuravam a implementação literalmente dentro de `CardVisionApp.tsx` foram atualizados para apontar para a nova autoridade R163. As regras verificadas não foram removidas nem flexibilizadas.

Entre os contratos revalidados:

- v40.00 — Leitor por quadrados;
- v40.10/v40.20 — progresso visual OCR;
- v40.70 — Catálogo Vivo / Desempenho Máximo;
- R131 — evidence boundary;
- R132 — attribute evidence boundary;
- R133 — structured evidence boundary;
- R134 — physical/permanent evidence;
- R138 — fachada canônica de produção;
- R155–R163 — cadeia de performance/lazy-loading.

## Travas R163

Novo teste:

- `tests/v40-80-r163-reader-analysis-controller-lazy-runtime-regression.mjs`

Nova trava de orçamento:

- `scripts/check-cardvision-static-closure-r163.mjs`

Limites R163:

- máximo de 213 módulos estáticos;
- máximo de 3.205.000 bytes de fonte estática;
- `CardVisionApp.tsx` com no máximo 2.900 linhas.

O teste proíbe o retorno ao shell de marcadores centrais da orquestração pesada e exige import dinâmico do runtime R163.

## Validação final

Aprovados:

- TypeScript autocontido de toda `src`;
- sintaxe em 632 arquivos TS/TSX;
- 790 botões tipados;
- 34 imagens com `alt`;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- 127/127 auditorias do projeto;
- 138/138 pré-voo de produção;
- 27/27 pré-voo Play;
- regressões R155, R156, R157, R158, R159, R160, R161, R162 e R163;
- regressões v40.00, v40.10/v40.20, v40.70, R131, R132, R133, R134 e R138.

## Próximo alvo provável

O shell ainda possui aproximadamente 2,9 mil linhas. O próximo domínio de maior impacto deve ser escolhido por dependência e risco, não apenas por tamanho. Candidatos naturais:

1. coordenação restante do Leitor (seleção/recorte/fila/calibração/retomada);
2. fluxo de geração/finalização da ficha;
3. navegação/estado de shell.

A próxima extração deve continuar preservando autoridade única e writers canônicos.
