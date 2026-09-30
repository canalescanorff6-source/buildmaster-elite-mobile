# R534 Parallel Release CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paralelizar o diagnóstico completo do release CI em 4 shards determinísticos, mantendo os 97 grupos obrigatórios e bloqueando qualquer build/publicação quando um shard falhar.

**Architecture:** Extrair a lista canônica de checks e a partição de shards para um módulo puro reutilizado pelo `ci-doctor`, provar cobertura/disjunção por regressão, e dividir `build-apk.yml` em `stabilize-source -> diagnostic-matrix -> build-apk`. O job final não repete o diagnóstico completo já provado pelos shards.

**Tech Stack:** Node.js ESM, npm scripts, GitHub Actions YAML, matrix jobs, Actions cache/artifacts, testes `.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-30-r534-parallel-release-ci-design.md`

## Global Constraints

- Os 97 grupos continuam obrigatórios.
- Cada grupo executa exatamente uma vez no conjunto dos 4 shards.
- Partição: `groupIndex % shardCount === shardIndex`.
- `fail-fast: false`.
- Qualquer shard RED impede web build, Android, assinatura e publicação.
- Zero-Red continua antes da matriz.
- R532/R533, source SHA, checksum, assinatura e device acceptance permanecem intactos.
- Nenhum `sleep` artificial e nenhum teste removido.
- `BUILD GREEN != ENGINE_CERTIFIED`.

## Review Focus

- Argumentos de shard inválidos falham fechado.
- Sem argumentos de shard, `--full` continua rodando os 97 grupos.
- A união dos 4 shards contém exatamente 97 labels únicos e sem interseção.
- Um shard RED bloqueia o job final mesmo com três shards GREEN.
- O build final preserva checksum, R532 e R533 sem repetir o diagnóstico completo.

---

### Task 1: Tornar o `ci-doctor` shard-aware

**Files:**
- Create: `scripts/ci-doctor-config.mjs`
- Modify: `scripts/ci-doctor.mjs`
- Test: `tests/v40-80-r534-ci-doctor-sharding-regression.mjs`

**Interfaces:**
- Produces: `EXPECTED_FULL_GROUPS`, `quickChecks`, `fullChecks`, `selectChecksForShard(checks, shardIndex, shardCount)`, `parseShardArgs(argv)`.
- `Check` mantém a forma `[label: string, npmArgs: string[]]`.

- [ ] Escrever regressão inicialmente RED provando `EXPECTED_FULL_GROUPS === 97`, união=97, interseções vazias, ordem determinística, compatibilidade sem shard e rejeição de argumentos inválidos.
- [ ] Rodar `node tests/v40-80-r534-ci-doctor-sharding-regression.mjs`; esperado: FAIL por módulo ausente.
- [ ] Extrair lista canônica e helpers para `scripts/ci-doctor-config.mjs`.
- [ ] Adaptar `ci-doctor.mjs` para `--shard-index`/`--shard-count`, mantendo modo legado sem shard.
- [ ] Fazer `summary.json` registrar `shardIndex`, `shardCount`, `groupsExecuted`, `labels`, `elapsedSeconds`, `failures`.
- [ ] Rodar regressão; esperado: PASS.
- [ ] Commit: `feat(ci): shard full diagnostic deterministically`.

### Task 2: Criar contrato estrutural R534 do workflow

**Files:**
- Create: `tests/v40-80-r534-parallel-release-workflow-regression.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes shard CLI da Task 1.
- Produces `npm run test:r534`.

- [ ] Escrever teste inicialmente RED que exija job matrix com 4 shards, `fail-fast: false`, report por shard, dependência do build final, ausência do diagnóstico completo duplicado no job final, timeout final >=180 e marcadores R532/R533 preservados.
- [ ] Rodar o teste; esperado: FAIL porque o workflow ainda é sequencial.
- [ ] Registrar `test:r534` em `package.json` e acrescentá-lo a `ci:gate` depois de R533.
- [ ] Rodar `npm run test:r534`; esperado: sharding PASS, workflow RED.
- [ ] Commit: `test(ci): define R534 parallel release contract`.

### Task 3: Converter `build-apk.yml` para 4 shards paralelos

**Files:**
- Modify: `.github/workflows/build-apk.yml`
- Test: `tests/v40-80-r534-parallel-release-workflow-regression.mjs`

**Interfaces:**
- Consumes `node scripts/ci-doctor.mjs --full --shard-index N --shard-count 4 --report-dir ...`.
- Produces jobs `stabilize-source`, `diagnostic-matrix`, `build-apk`.

- [ ] Adicionar `diagnostic-matrix` depois de `stabilize-source`, com 4 entradas e `fail-fast: false`.
- [ ] Cada shard faz checkout do mesmo ref, configura Node/cache, instala dependências travadas, roda seu shard e usa `if: always()` apenas no upload do relatório.
- [ ] Não usar `continue-on-error` no comando/job de shard.
- [ ] Fazer `build-apk` depender de `stabilize-source` e `diagnostic-matrix`, mantendo `changed != 'true'` e exigindo sucesso da matriz.
- [ ] Alterar timeout do job final para `180`.
- [ ] Remover somente a execução completa duplicada de `ci:diagnose-all`, seu upload consolidado e condição baseada em `diagnose_all`; preservar gates rápidos com finalidade distinta.
- [ ] Confirmar que source SHA, integridade, build web, Capacitor/Gradle, assinatura, APK SHA-256, R532, R533 e publicação permanecem.
- [ ] Rodar `npm run test:r534`; esperado: PASS.
- [ ] Validar YAML com parser existente do projeto; esperado: YAML válido, sem chaves duplicadas.
- [ ] Commit: `feat(ci): parallelize release diagnostics in four shards`.

### Task 4: Compatibilidade histórica e Zero-Red

**Files:**
- Modify somente se uma regressão real exigir correção; sem alterações especulativas no core.

- [ ] Rodar regressões R457 corrigida, R531, R532, R533, R534, `quality:ci-contract` e `ci:r463-contract`.
- [ ] Rodar `quality:syntax`, `quality:interactive`, `quality:visual`, `quality:routes`, `quality:audit`, `release:preflight`, `release:play-preflight`.
- [ ] Rodar `ci:stabilize` até fixed point e `ci:assert-clean`; esperado: segunda passagem sem arquivos divergentes.
- [ ] Se surgir incompatibilidade legítima, criar teste RED específico antes da correção e commitar separadamente.

### Task 5: Fechamento R534 e CI real

**Files:**
- Create: `R534_PARALLEL_RELEASE_CI.md`
- Modify: `MANIFESTO_PRODUCAO_V40.80.sha256`
- Optionally modify status in the R534 spec.

- [ ] Documentar arquitetura, arquivos alterados, evidências, invariantes e a regra `BUILD GREEN != ENGINE_CERTIFIED`.
- [ ] Rodar `npm run integrity:generate` e `npm run integrity:verify`.
- [ ] Repetir R531/R532/R533/R534 e validação YAML após relatório/manifesto.
- [ ] Commitar a árvore final somente após verificação fresca.
- [ ] Integrar/push na `main` conforme método aprovado.
- [ ] Inspecionar o GitHub Actions real: 4 shards criados, execução concorrente quando runners disponíveis, reports dos 4, gate agregado e build final somente após quatro GREEN.
- [ ] Se final GREEN, confirmar web/Android/Gradle/assinatura/publicação pelos jobs/artefatos; se RED/cancelled, diagnosticar a etapa exata antes de continuar features.
