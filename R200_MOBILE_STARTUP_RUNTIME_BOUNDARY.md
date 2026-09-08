# R200 — Mobile Startup Runtime Boundary

## Base canônica

- Entrada: `buildmaster-elite-mobile-r199-persistence-session-cache-recovery-audit.zip`
- Linha de versão do app: `40.80.0`
- Objetivo: reduzir trabalho e código estático no primeiro render mobile sem alterar a autoridade competitiva, OCR, Cofre, sessão ou compatibilidade histórica.

## Resultado principal

A closure estática inicial do `CardVisionApp` foi reduzida de:

- R199: **178 módulos / 2.377.217 bytes**
- R200: **86 módulos / 635.955 bytes**

Ganho:

- **−92 módulos** no startup
- **−1.741.262 bytes** de fonte estática no startup
- **−73,2%** de bytes na closure inicial

O checker R200 congela o novo limite e impede que os módulos pesados retornem ao primeiro carregamento.

## Arquitetura aplicada

### 1. Análise de produção sob demanda

O shell deixou de importar o barrel pesado `@/modules/analysis` no startup. Tipos e constantes leves usam `analyzerDomain`, enquanto `productionOrchestratorR138` é carregado por `import()` somente quando criação/rebuild de análise é realmente necessária.

Isso retira do primeiro render o `analyzer.ts`, R119 e dependências de produção sem mudar a autoridade final.

### 2. Modelo leve do Cofre

Foi criado:

- `src/modules/vault/cardHistoryStartupModelR200.ts`

Ele contém somente helpers leves necessários no render inicial: chaves, status, estatísticas e sanitização defensiva do histórico já canônico.

Ele **não** contém criação de análise, persistência, IndexedDB ou `localStorage` e não se torna nova autoridade.

A migração/reparo pesado permanece no `cardHistoryStore` e é carregada apenas nas bordas de ingestão/commit que realmente precisam dela.

### 3. Commit do Cofre lazy

`vaultHistoryCommitR172` passou a carregar `cardHistoryStore` apenas no momento do commit. A exigência de writer local confirmado antes da adoção do estado foi preservada.

### 4. Comparador leve

`playerComparisonR171` passou a consumir tipos/labels de `analyzerDomain` em vez de puxar `analyzer.ts` para o startup.

### 5. Eventos de pesquisa sem engines pesados no startup

Os nomes de eventos de Creator Research, Competitive Fusion e Global Pro foram consolidados em contrato app-level já carregado. Os engines continuam emitindo os mesmos eventos, mas deixam de entrar no primeiro render só para fornecer constantes.

### 6. Regras dinâmicas separadas do contrato inicial

O shell usa contrato/default leve do catálogo remoto. O motor completo de regras dinâmicas permanece sob demanda.

### 7. Catálogos/fallbacks mortos removidos do startup

Dependências pesadas usadas apenas como fallback inalcançável/duplicado foram removidas do shell, preservando a mesma lista funcional através dos catálogos leves já existentes.

## Equivalência funcional

O teste `v40-80-r200-startup-model-equivalence-regression.ts` compara os helpers leves R200 com o `cardHistoryStore` canônico para:

- `memoryKey`
- `resultHistoryKey`
- progresso de skills
- status de ficha
- estatísticas do dashboard
- sanitização de duplicatas em memória

As saídas são equivalentes. Histórico canônico sem corrupção preserva a própria referência para evitar cópia desnecessária no render.

## Segurança competitiva

R119 permaneceu byte-a-byte intacto:

`765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`

Passaram novamente:

- R119 Clean Slate
- R119 Output Quality
- R122 Máximo Online + DNA
- R125 builds específicos por carta/função
- R184 estabilidade posicional
- equivalências R186/R193 via cadeia R198

Nenhuma regra de progressão, DNA, Top 5, Ímpeto, posição de uso ou neutralidade de GER/Overall foi alterada.

## OCR / operação

`test:v3840`: **15/15**.

O teste fail-open histórico foi realinhado apenas para reconhecer a sanitização leve `sanitizeRuntimeHistoryR200()` na fronteira R179; continua exigindo normalização/sanitização antes da renderização e isolamento via `safeViewComputationR130`.

## Resultado Workspace preservado

O teto R192 não foi aumentado:

- **125 módulos / 2.126.023 bytes**

Revisão, calibração e ferramentas avançadas continuam fora do carregamento inicial do Resultado.

## Orçamento de fonte

A R200 troca pequena quantidade de fonte por redução muito maior de startup:

- R199 TypeScript source: **5.335.241 bytes**
- R200 TypeScript source: **5.340.502 bytes**
- diferença: **+5.261 bytes**
- limite: **5.505.024 bytes**
- uso: **97,0%**
- margem: **164.522 bytes**

Nenhum teto global foi aumentado. O aumento é composto principalmente pelo modelo leve R200 e pelos testes/checker que congelam a nova fronteira.

## Métricas de módulos principais

- `src/lib/analyzer.ts`: **108.337 bytes / 1.219 linhas**
- `src/components/CardVisionApp.tsx`: **107.653 bytes / 1.614 linhas**
- `src/components/result/ResultWorkspace.tsx`: **99.453 bytes / 1.425 linhas**
- `src/modules/vault/cardHistoryStartupModelR200.ts`: **3.566 bytes / 73 linhas**

## Gates finais

Aprovados:

- TypeScript autocontido R151
- R198, R199 e R200
- R180 auditoria global
- R181 isolamento de engines legados
- R182 Android: 51 contratos de fonte/workflow
- R183 release convergence: 17 contratos
- sintaxe: **664 arquivos TS/TSX**
- interativos: **790 botões / 34 imagens com alt**
- auditoria: **127/127**
- preflight de produção: **138/138**
- assinatura lógica: `8bfdf557b8ba1d0d`
- Play preflight: **27/27**
- Java nativo
- budget de fonte
- closure R192
- closure R200

## Ambiente Android/CI

O `ci:preflight` executou 15 grupos; 14 ficaram verdes. O único grupo vermelho foi `Compatibilidade das dependências`, pois o container não possui `node_modules` instalados (`next`, `react`, Capacitor, TypeScript etc.).

Também permanecem ausentes Android SDK, `sdkmanager` e `adb` neste ambiente. Portanto, não é alegado build físico local de APK/AAB.

## Conclusão

A R200 transforma o startup mobile de uma closure de ~2,38 MB para ~0,64 MB, mantendo as autoridades canônicas, compatibilidade histórica e gates esportivos/operacionais. É uma redução estrutural de primeiro carregamento, não uma remoção de funcionalidades.
