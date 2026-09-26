# R484 Chemistry Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** adicionar química estrutural explicável e somente leitura ao `Meu Time`, usando o avaliador R454 e as rotações R481 sem criar autoridade paralela.

**Architecture:** o R484 constrói um grafo a partir dos slots já ocupados do `TeamDiagnosis`. A topologia usa coordenadas dos slots e adjacência entre linhas; a qualidade de cada aresta vem exclusivamente de `evaluatePairSynergyR454`. Evidência de partida só aumenta confiança quando há `sessionIdR462` compartilhada e contexto tático igual. A UI consome o snapshot no `IntegratedTeamLab` e nenhuma função do motor escreve estado de produção.

**Tech Stack:** TypeScript, React/Next.js, R454 Gameplay Scouting, R481 Squad Brain, Node regression tests via `tests/_ts-require.cjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-r484-chemistry-graph-design.md`

## Global Constraints

- R119 → R126 → R128 continua autoridade final.
- R484 é read-only e não muda automaticamente escalação, posição, ficha, Top 5 ou Ímpeto.
- GER/Overall não entra em score, desempate, confiança ou justificativa.
- `evaluatePairSynergyR454()` é a única fonte do score de dupla.
- Partidas sem `sessionIdR462` compartilhada não aumentam confiança de dupla.
- Sem links suficientes, retornar estado degradado explícito, sem inventar química.
- Preservar R480, R481, R483 e contratos históricos.

## Review Focus

- Escalação parcial ou vazia deve retornar snapshot válido e determinístico.
- Dois jogadores distantes no campo não podem ganhar link apenas por terem score individual alto.
- Sessões diferentes não podem contar como evidência de química conjunta.
- Simulação de reserva não pode mutar o `TeamDiagnosis` original.
- Nenhum import de persistência/writer/rede pode entrar no motor.

---

### Task 1: Contrato e regressão RED

**Files:**
- Create: `tests/v40-80-r484-chemistry-graph-regression.ts`
- Modify: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Consumes futuramente: `buildChemistryGraphR484` e `CHEMISTRY_GRAPH_R484_VERSION`.
- Produces: teste que fixa contrato, topologia, autoridade, determinismo e integração UI.

- [ ] **Step 1:** escrever o teste importando o motor ainda inexistente e cobrindo: determinismo, não mutação, somente vizinhos, labels R454, setores, sessão compartilhada, autoridade e simulação R481.
- [ ] **Step 2:** adicionar o teste como etapa explícita do workflow de PR antes do TypeScript/build.
- [ ] **Step 3:** abrir PR e verificar que a etapa R484 falha pelo motivo correto: módulo/função ainda inexistente.

### Task 2: Motor Chemistry Graph

**Files:**
- Create: `src/modules/chemistry/chemistryGraphEngineR484.ts`
- Test: `tests/v40-80-r484-chemistry-graph-regression.ts`

**Interfaces:**
- Consumes: `TeamDiagnosis`, `IntegratedPlayerRecord[]`, `MatchValidationRecord[]`, `TacticalStyle`, `SquadBrainSnapshotR481`.
- Produces: `CHEMISTRY_GRAPH_R484_VERSION`, `ChemistryGraphSnapshotR484`, `buildChemistryGraphR484(input)`.

- [ ] **Step 1:** implementar nós a partir apenas dos titulares resolvidos no `team.lineup`.
- [ ] **Step 2:** criar links somente para slots dentro das regras espaciais da spec e calcular score/label via `evaluatePairSynergyR454`.
- [ ] **Step 3:** calcular confiança separada, com bônus apenas para `sessionIdR462` realmente compartilhada no mesmo contexto.
- [ ] **Step 4:** agregar score geral, contadores e os cinco setores; setor sem aresta retorna `null`.
- [ ] **Step 5:** calcular jogador mais conectado/isolado e melhor/pior link de forma determinística.
- [ ] **Step 6:** simular até três rotações R481 sem mutação e devolver delta de química.
- [ ] **Step 7:** retornar authority/guardrails obrigatórios e warnings degradados.
- [ ] **Step 8:** verificar a regressão R484 GREEN.

### Task 3: Integração em Meu Time

**Files:**
- Modify: `src/modules/squad/IntegratedTeamLab.tsx`
- Test: `tests/v40-80-r484-chemistry-graph-regression.ts`

**Interfaces:**
- Consumes: `buildChemistryGraphR484({ team, players, records, teamStyle, squadBrain: squadBrainR481 })`.
- Produces: cartão real de Entrosamento + painel detalhado em Escalação.

- [ ] **Step 1:** calcular snapshot com `useMemo` depois de R480/R481.
- [ ] **Step 2:** substituir `team.globalScore` no cartão Entrosamento por score/confiança/links reais R484.
- [ ] **Step 3:** adicionar painel `Chemistry Graph • R484` em Escalação usando componentes/classes existentes.
- [ ] **Step 4:** mostrar setores, melhor/pior link, mais conectado/isolado e simulações de troca sem botões de aplicar.
- [ ] **Step 5:** garantir no teste que não existe chamada de escrita ligada ao snapshot R484.

### Task 4: Gates e compatibilidade

**Files:**
- Modify apenas se necessário: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Consumes: regressões existentes.
- Produces: branch pronta para merge.

- [ ] **Step 1:** confirmar GREEN do teste R484.
- [ ] **Step 2:** confirmar TypeScript completo e build de produção GREEN.
- [ ] **Step 3:** confirmar R480, R481, R483 e R128 GREEN.
- [ ] **Step 4:** confirmar `v31.70`, `v31.76`, `v31.77` e `v38.32` GREEN.
- [ ] **Step 5:** revisar patch integral da PR procurando authority leak, mutação, GER/Overall no motor e duplicação de R454.

### Task 5: Merge e publicação

**Files:** nenhum adicional previsto.

**Interfaces:**
- Consumes: PR totalmente GREEN.
- Produces: release oficial do R484.

- [ ] **Step 1:** merge seguro da PR e capturar SHA novo da `main`.
- [ ] **Step 2:** acompanhar `Gerar APK Canal Direto` até todos os jobs/steps passarem.
- [ ] **Step 3:** verificar artefato APK + manifesto + assinatura.
- [ ] **Step 4:** verificar `/branches/main` no SHA esperado.
- [ ] **Step 5:** verificar `/releases/latest` apontando exatamente para esse SHA e contendo APK, `signing-report.txt` e manifesto imutável.
