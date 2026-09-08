# R199 — Persistence, Session, Cache & Recovery Audit

## Base canônica

Entrada: `buildmaster-elite-mobile-r198-e2e-production-finalization-authority-audit.zip`

A R199 audita e endurece persistência local, restauração de sessão e lifecycle do IndexedDB sem alterar a autoridade competitiva R119, OCR, Cofre ou a arquitetura lazy consolidada.

## 1. Correção de confiabilidade do autosave de sessão

Problema encontrado: `useActiveSessionAutosaveR157` tratava a gravação de mídia (`preview`/`playerCardImage`) como efeito separado, mas o estado visual `saved` considerava somente o retorno da gravação dos metadados. Em uma falha de quota/storage da mídia, a interface podia informar que o rascunho estava salvo mesmo sem a mídia correspondente.

Correção R199:
- `mediaPersistedRef` rastreia a confirmação real da mídia;
- mudança de mídia que falha muda o estado para `error` imediatamente;
- flush de metadados tenta novamente a mídia caso a última gravação tenha falhado;
- estado `saved` exige `metadataOk && mediaOk`;
- background/pagehide continuam usando o mesmo flush coalescido R157.

Resultado: o indicador de sessão passa a refletir a persistência efetiva do snapshot dividido, não apenas dos metadados.

## 2. Recuperação segura de versões incompatíveis

Problema encontrado: em `readActiveSessionSnapshotR157`, um payload JSON com `repositoryVersion` de uma versão split futura/desconhecida podia retornar `null` na detecção R157 e cair no fallback R137. Como o fallback legado valida principalmente `savedAt`, um payload incompatível podia ser interpretado como sessão antiga parcial.

Correção R199:
- payload que declara `repositoryVersion` diferente de `ACTIVE_SESSION_REPOSITORY_R157_VERSION` é classificado como `INVALID`;
- metadados + mídia associada são limpos com `clearActiveSessionSnapshotR157`;
- somente snapshots realmente legados, sem `repositoryVersion`, continuam elegíveis ao fallback R137.

Teste R199 cobre os dois lados:
1. versão split futura => `INVALID` + limpeza;
2. snapshot R137 verdadeiro => `RESTORED`.

## 3. IndexedDB: trim em transação única

Problema encontrado: `runtimeTrimStore` fazia:
1. `runtimeList(...)` para listar entradas;
2. `Promise.all(runtimeDelete(...))` para cada exclusão.

Cada `runtimeDelete` abria uma nova conexão IndexedDB. Em caches grandes, o trim podia criar muitas conexões/transações simultâneas, aumentando pressão de memória, risco de bloqueio e custo de abertura/fechamento.

Correção R199:
- `runtimeTrimStore` abre uma única conexão;
- usa uma única transação `readwrite`;
- percorre o store com cursor reverso;
- mantém exatamente `keep` entradas e apaga as restantes dentro da mesma transação;
- não chama `runtimeList`, `runtimeDelete` nem `Promise.all` no trim.

Também foi criada `transactionGuard`, compartilhando timeout, fechamento e settle de transações entre `runtimeGet`, `runtimePut/runtimeDelete`, `runtimeList` e `runtimeTrimStore`.

## 4. Tamanho e closure

R198:
- `src`: 5.335.307 bytes
- CardVision static closure: 178 módulos / 2.377.283 bytes
- `localDatabase.ts`: 7.923 bytes
- `useActiveSessionAutosaveR157.ts`: 3.561 bytes
- `activeSessionRepositoryR137.ts`: 9.449 bytes

R199:
- `src`: **5.335.241 bytes**
- CardVision static closure: **178 módulos / 2.377.217 bytes**
- `localDatabase.ts`: **7.585 bytes**
- `useActiveSessionAutosaveR157.ts`: **3.691 bytes**
- `activeSessionRepositoryR137.ts`: **9.591 bytes**

Saldo líquido:
- `src`: **-66 bytes**
- closure inicial: **-66 bytes**
- nenhum teto de bundle foi aumentado.

Novo checker R199:
- máximo: 178 módulos
- máximo: 2.377.220 bytes
- R188/R190/R191 continuam fora da árvore estática inicial.

## 5. Autoridade esportiva

R119 permanece byte-a-byte intacto.

SHA-256:
`765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`

Validações verdes:
- R119 Clean Slate
- R119 Output Quality
- R119 Result UI
- R122 Maximum Online + DNA
- R125 role-aware/card-specific
- R184 Position Stability
- R186 frozen analyzer equivalence
- R193 special-meta equivalence
- R197 training-budget equivalence

## 6. OCR / sessão / Supabase / Cofre

`test:v3840`: **15/15** verde, incluindo:
- OCR em segundo plano;
- anti-freeze OCR;
- leitura ativa x fila;
- base local grande;
- startup fail-open;
- login + Supabase;
- recuperação da conta principal;
- Cofre nativo;
- deep link/rota inicial.

R157 também foi realinhado para exigir confirmação de mídia e retry no flush, mantendo mídia e metadados separados.

## 7. Cadeia recente

R190, R191, R192, R193, R194, R195, R196, R197, R198 e R199 aprovados.

R180/R181 aprovados.
R182: 51 contratos Android aprovados.
R183: 17 contratos de convergência aprovados.

## 8. Gates globais

- TypeScript autocontido R151: aprovado
- Sintaxe: **662 TS/TSX**
- Interativos: **790 botões**
- Imagens: **34 com alt**
- Visual/acessibilidade: aprovado
- Auditoria: **127/127**
- Pré-voo produção: **138/138**
- assinatura lógica: `ad211d3b9290db21`
- Google Play: **27/27**
- Java nativo: aprovado
- `quality:ci-contract`: aprovado

`ci:preflight` executou os 15 grupos. Todos os grupos de código/arquitetura/release passaram. A única falha foi `Compatibilidade das dependências` porque este ambiente não possui `node_modules` localmente (Capacitor, React, Next, TypeScript etc.). Isso é limitação ambiental já conhecida e não uma regressão de código R199.

## 9. Limitação local Android

O ambiente continua sem:
- Android SDK configurado;
- `sdkmanager`;
- `adb`;
- `node_modules`/Capacitor.

Portanto, não há alegação de APK/AAB físico compilado ou assinado localmente. Fonte, Java gerado, workflows e preflights permanecem verdes.

## 10. Resultado

A R199 fecha a etapa de persistência/sessão/cache com três melhorias estruturais:
1. autosave não pode mais declarar sucesso quando a mídia falhou;
2. sessão split incompatível não pode ser reclassificada como legado R137;
3. trim de cache IndexedDB não abre uma conexão por item removido.

A revisão melhora confiabilidade e pressão de memória sem aumentar `src` nem o startup estático.
