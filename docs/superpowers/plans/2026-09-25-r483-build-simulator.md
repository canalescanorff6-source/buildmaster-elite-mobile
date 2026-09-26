# R483 Build Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** adicionar um simulador determinístico e somente leitura que compare a ficha oficial com variantes Equilibrada, Especialista e Gameplay sem alterar a autoridade Clean Slate/R126/R128 e sem usar GER/Overall como objetivo.

**Architecture:** o R483 será uma ramificação observacional pós-ficha oficial. O motor recebe o `AnalysisResult` já finalizado, usa `result.training` como baseline, valida o custo com `trainingPlanCore`, gera candidatos por redistribuições pequenas e limitadas e devolve um snapshot read-only. A UI será um painel isolado dentro de `Resultado → Avançado → Ferramentas → Comparar`; qualquer falha no simulador degrada somente esse painel e nunca impede a ficha oficial de aparecer.

**Tech Stack:** TypeScript, React/Next.js, `trainingPlanCore`, `pointBudget`, conhecimento funcional já exposto por `trainingOptimizer`, Node regression tests via `tests/_ts-require.cjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-25-r483-build-simulator-design.md`

## Global Constraints

- A ficha oficial continua soberana; R483 é somente comparação.
- Não criar botão `Aplicar`, `Salvar como oficial`, `Substituir ficha` nem qualquer escrita de produção.
- `trainingPointsTotal = 0` continua significando orçamento desconhecido/bloqueado; nunca fabricar 64 PP.
- Cada variante válida deve consumir exatamente o mesmo número de PP que a ficha Oficial, não apenas ficar abaixo do teto.
- Recalcular custo exclusivamente por `trainingPlanTotalCost()` / núcleo canônico; não duplicar fórmula de PP.
- Não alterar Card ID, edição, booster, atributos-base, posição final, playstyle oficial, skills existentes ou fingerprint.
- Não escrever `recommendedSkills`, `recommendedImpetos`, stores, Cofre ou sessão.
- Não importar nem chamar writers de ficha/persistência no motor R483.
- `Overall`/`GER` não pode entrar no score, desempate ou justificativa.
- R460/R470/R472 e evidência de partidas ficam fora da v1.
- O motor deve ser determinístico, local/offline e sem rede/LLM obrigatório.
- O perfil Gameplay pode usar somente posição, função/playstyle, objetivo e contexto tático já presente no resultado.
- R119, R126 e R128 permanecem soberanos.

## Review Focus

- **Ficha oficial com custo inconsistente:** se `trainingPlanTotalCost(result.training) !== result.trainingPointsUsed`, bloquear variantes em vez de mascarar ou corrigir o resultado.
- **Orçamento válido mas menor que o custo oficial:** bloquear o simulador e preservar a ficha oficial sem alteração.
- **Perfil funcional inexistente/insuficiente:** produzir Oficial e, se houver candidato seguro, Equilibrada; não inventar Especialista/Gameplay.
- **Candidato que não consegue repor exatamente os PP retirados por causa do custo escalonado:** descartá-lo; nunca aceitar custo diferente do Oficial.
- **Erro de runtime no painel R483:** mostrar fallback local `Simulador temporariamente indisponível. Sua ficha oficial continua intacta.` e manter o restante do Resultado funcional.

---

### Task 1: Contrato read-only, bloqueios e baseline Oficial

**Files:**
- Create: `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- Create: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: `AnalysisResult`, `PositionCode`, `TrainingKey`, `TrainingPlan` de `@/lib/analyzer`; `normalizeTrainingPlan`, `trainingPlanTotalCost`, `TRAINING_KEYS` de `@/lib/trainingPlanCore`; `normalizePlayerTrainingBudget` de `@/modules/builds/pointBudget`.
- Produces: `BUILD_SIMULATOR_R483_VERSION`, `BuildSimulatorInputR483`, `BuildSimulatorVariantR483`, `BuildSimulatorSnapshotR483`, `buildBuildSimulatorR483(input)`.

Contrato público obrigatório:

```ts
export type BuildSimulatorInputR483 = {
  result: AnalysisResult;
  targetPosition: PositionCode;
};

export type BuildSimulatorVariantR483 = {
  id: 'official' | 'balanced' | 'specialist' | 'gameplay';
  label: string;
  plan: TrainingPlan;
  pointsUsed: number;
  pointsAvailable: number;
  validBudget: boolean;
  score: number;
  deltas: Array<{ key: TrainingKey; before: number; after: number; delta: number }>;
  strengths: string[];
  sacrifices: string[];
  explanation: string;
};

export type BuildSimulatorSnapshotR483 = {
  version: string;
  baselineFingerprint: string | null;
  budget: number;
  officialPointsUsed: number;
  variants: BuildSimulatorVariantR483[];
  blockedReason: string | null;
  authority: {
    readOnly: true;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canChangePosition: false;
    canOverrideCleanSlate: false;
    canOverrideR126: false;
    canOverrideR128: false;
    optimizeOverall: false;
  };
};

export function buildBuildSimulatorR483(input: BuildSimulatorInputR483): BuildSimulatorSnapshotR483;
```

- [ ] **Step 1: escrever os testes falhando para bloqueios, baseline e autoridade**

No teste R483, criar um `AnalysisResult` mínimo compatível com os campos usados e afirmar:

```ts
const before = JSON.stringify(input);
const snapshot = buildBuildSimulatorR483(input);
assert.equal(snapshot.variants[0].id, 'official');
assert.deepEqual(snapshot.variants[0].plan, result.training);
assert.equal(snapshot.variants[0].pointsUsed, result.trainingPointsUsed);
assert.equal(snapshot.authority.readOnly, true);
assert.equal(snapshot.authority.canOverrideR128, false);
assert.equal(snapshot.authority.optimizeOverall, false);
assert.equal(JSON.stringify(input), before);
```

Adicionar casos separados:

```ts
assert.match(buildBuildSimulatorR483({ ...input, result: zeroBudgetResult }).blockedReason!, /orçamento real/i);
assert.equal(buildBuildSimulatorR483({ ...input, result: zeroBudgetResult }).variants.length, 0);
assert.match(buildBuildSimulatorR483({ ...input, result: inconsistentCostResult }).blockedReason!, /inconsistência de orçamento/i);
```

Também afirmar que `64` não aparece como fallback em snapshot bloqueado quando o orçamento de entrada é `0`.

- [ ] **Step 2: executar o teste e verificar falha por módulo inexistente**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: FAIL porque `buildSimulatorEngineR483` ainda não existe.

- [ ] **Step 3: implementar o contrato mínimo e os guardrails**

Em `buildSimulatorEngineR483.ts`:

- clonar/normalizar `result.training` sem mutar entrada;
- calcular `canonicalOfficialCost = trainingPlanTotalCost(officialPlan)`;
- calcular `budget = normalizePlayerTrainingBudget(result.trainingPointsTotal)`;
- bloquear quando `budget === 0` com a mensagem exata `Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.`;
- bloquear quando `canonicalOfficialCost !== result.trainingPointsUsed` ou `canonicalOfficialCost > budget` com `A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.`;
- criar somente a variante `official` neste task;
- `pointsAvailable = budget - canonicalOfficialCost`;
- `baselineFingerprint` pode usar `result.parsed.internalId` como fallback estável; se o resultado já expuser fingerprint canônico, preferi-lo sem criar novo algoritmo de identidade;
- não ler `overall`, `maxOverall`, `pri.GER`, `recommendedSkills` ou `recommendedImpetos`.

- [ ] **Step 4: rodar o teste R483**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: PASS nos testes de baseline/bloqueio/imutabilidade; ainda não exigir as três variantes adicionais.

- [ ] **Step 5: commit**

```bash
git add src/modules/build-simulator/buildSimulatorEngineR483.ts tests/v40-80-r483-build-simulator-regression.ts
git commit -m "R483: criar contrato read-only do Build Simulator"
```

---

### Task 2: Gerador determinístico de variantes com custo exatamente igual

**Files:**
- Modify: `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- Modify: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: contrato do Task 1; `addTrainingLevel`, `removeTrainingLevel`, `trainingPlanTotalCost`, `trainingPlanSignature` se disponível no branch de execução; `trainingRoleProfile(position, objective, attributes, parsed)` de `src/modules/builds/trainingOptimizer.ts` apenas como conhecimento funcional read-only.
- Produces: variantes `balanced`, `specialist` e `gameplay` quando houver evidência funcional suficiente, todas com `pointsUsed === officialPointsUsed`.

Decisão de algoritmo da v1:

- espaço de busca limitado a redistribuições entre pares de `TrainingKey`;
- por candidato, remover no máximo 2 níveis do grupo doador e adicionar no máximo 4 níveis ao receptor;
- testar todas as combinações em ordem fixa de `TRAINING_KEYS`;
- descartar qualquer candidato cujo custo canônico não volte exatamente a `officialPointsUsed`;
- nunca criar busca combinatória recursiva ilimitada;
- desempate sempre por ordem determinística, nunca por GER.

Regras por perfil:

- **Balanced:** receptor e doador devem pertencer aos grupos que já têm investimento na ficha Oficial; score principal reduz dispersão dos níveis ativos e aplica penalidade pela distância absoluta à Oficial.
- **Specialist:** usar `trainingRoleProfile(...).priority` quando o perfil existir; priorizar transferências para os primeiros grupos funcionais e penalizar retirada desses mesmos grupos.
- **Gameplay:** partir da prioridade funcional do Specialist e aplicar ajuste pequeno pelo `result.tacticalProfile.style`/`result.objective`; não consultar R460/R470/R472 nem histórico de partidas.
- Se `trainingRoleProfile` retornar `null`, omitir Specialist/Gameplay em vez de inventar função.

- [ ] **Step 1: adicionar testes falhando para custo exato, determinismo e perfis**

Adicionar assertions:

```ts
const first = buildBuildSimulatorR483(input);
const second = buildBuildSimulatorR483(input);
assert.deepEqual(first, second);

for (const variant of first.variants) {
  assert.equal(trainingPlanTotalCost(variant.plan), result.trainingPointsUsed);
  assert.equal(variant.pointsUsed, result.trainingPointsUsed);
  assert.ok(variant.pointsUsed <= result.trainingPointsTotal);
}
assert.deepEqual(first.variants.map((v) => v.id), ['official', 'balanced', 'specialist', 'gameplay']);
```

Criar um caso de custo escalonado em que uma transferência simples não fecha os PP e afirmar que o candidato inválido não aparece.

Criar um caso sem `trainingRoleProfile` válido e afirmar que o snapshot não inventa `specialist`/`gameplay`.

- [ ] **Step 2: executar e confirmar FAIL nas variantes ainda ausentes**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: FAIL porque ainda existe apenas `official`.

- [ ] **Step 3: implementar enumerador de candidatos bounded**

Criar funções privadas pequenas no engine:

```ts
function enumerateExactCostTransfersR483(official: TrainingPlan, officialPoints: number): TrainingPlan[];
function planDistanceR483(a: TrainingPlan, b: TrainingPlan): number;
function buildDeltasR483(official: TrainingPlan, candidate: TrainingPlan): BuildSimulatorVariantR483['deltas'];
```

Cada candidato deve ser normalizado e validado com `trainingPlanTotalCost`; deduplicar por assinatura estável do plano.

- [ ] **Step 4: implementar seleção Equilibrada**

Criar:

```ts
function selectBalancedVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null;
```

Escolher somente entre candidatos exatos. O score deve favorecer menor dispersão dos grupos já ativos e menor distância da Oficial. Empates seguem a ordem estável gerada pelo enumerador.

- [ ] **Step 5: implementar seleção Especialista e Gameplay**

Criar:

```ts
function selectSpecialistVariantR483(...): TrainingPlan | null;
function selectGameplayVariantR483(...): TrainingPlan | null;
```

Usar o `priority` do `trainingRoleProfile` como fonte funcional. Para Gameplay, aplicar somente ajustes táticos v1 definidos no próprio engine e explicitamente limitados aos grupos de treino; manter ajuste pequeno o bastante para não substituir a prioridade de função.

- [ ] **Step 6: rodar teste R483 e typecheck**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: commit**

```bash
git add src/modules/build-simulator/buildSimulatorEngineR483.ts tests/v40-80-r483-build-simulator-regression.ts
git commit -m "R483: gerar variantes determinísticas com PP exato"
```

---

### Task 3: Explicações derivadas dos deltas e proibição estrutural de GER/escrita

**Files:**
- Modify: `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- Modify: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: variantes exatas do Task 2.
- Produces: `strengths`, `sacrifices`, `explanation` e scores relativos da mesma carta, sem Overall/GER e sem writers.

- [ ] **Step 1: escrever testes falhando para explicabilidade e autoridade**

Adicionar verificações:

```ts
for (const variant of snapshot.variants.slice(1)) {
  assert.ok(variant.deltas.some((d) => d.delta !== 0));
  assert.ok(variant.strengths.length > 0);
  assert.ok(variant.sacrifices.length > 0);
  assert.ok(variant.explanation.length > 0);
}
```

Adicionar teste estrutural que lê `src/modules/build-simulator/buildSimulatorEngineR483.ts` e rejeita tokens/imports de writers e objetivos proibidos, incluindo:

- `save`/`persist`/`vault` quando usados como import/chamada de produção;
- `recommendedSkills` e `recommendedImpetos` como destinos de escrita;
- `overall`, `maxOverall`, `pri.GER` na função de score;
- qualquer setter de resultado oficial.

O teste não deve proibir a palavra `Overall` apenas em comentários/guardrails; deve focar uso executável no engine.

- [ ] **Step 2: executar e confirmar FAIL na explicabilidade ainda incompleta**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 3: implementar score relativo e textos a partir dos deltas reais**

Criar funções privadas:

```ts
function scoreVariantR483(...): number;
function explainVariantR483(...): Pick<BuildSimulatorVariantR483, 'strengths' | 'sacrifices' | 'explanation'>;
```

O score serve somente para ordenar variantes da mesma carta. O texto deve citar apenas grupos com delta real; nunca afirmar melhora de um grupo cujo delta seja `0` ou negativo.

- [ ] **Step 4: rodar regressão, typecheck e autoridade R128**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
npm run test:r128
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add src/modules/build-simulator/buildSimulatorEngineR483.ts tests/v40-80-r483-build-simulator-regression.ts
git commit -m "R483: explicar trade-offs sem autoridade paralela"
```

---

### Task 4: Painel read-only dentro de Ferramentas → Comparar

**Files:**
- Create: `src/modules/build-simulator/BuildSimulatorPanelR483.tsx`
- Modify: `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- Modify: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: `buildBuildSimulatorR483({ result, targetPosition })`; `analysisUsagePositionR138(result)` para fornecer a posição já escolhida pelo pipeline atual.
- Produces: painel visual `BuildSimulatorPanelR483({ result }: { result: AnalysisResult })` sem callbacks de escrita.

Decisão de integração:

- manter a aba existente `comparar` em `ResultAdvancedWorkspaceR192`;
- renderizar o painel R483 no topo dessa aba e preservar o comparador legado abaixo durante a v1 para não remover funcionalidade existente;
- o painel não recebe `onSave`, `onApply`, `setResult` ou equivalente;
- erro do R483 deve ficar contido em boundary local ou fallback seguro do painel.

- [ ] **Step 1: escrever teste de integração UI falhando**

No teste R483, ler os fontes e afirmar:

```ts
assert.match(advancedWorkspaceSource, /BuildSimulatorPanelR483/);
assert.match(panelSource, /Somente simulação/);
assert.match(panelSource, /Ficha oficial/);
assert.doesNotMatch(panelSource, />\s*Aplicar\s*</i);
assert.doesNotMatch(panelSource, /Salvar como oficial/i);
assert.doesNotMatch(panelSource, /Substituir ficha/i);
```

Também afirmar que o componente exportado recebe somente `result` e não callbacks de escrita.

- [ ] **Step 2: executar e confirmar FAIL porque painel não existe**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 3: implementar `BuildSimulatorPanelR483`**

O painel deve:

- calcular `targetPosition` via `analysisUsagePositionR138(result)`;
- usar `useMemo` para montar snapshot quando `result` mudar;
- mostrar cabeçalho `Simulador de ficha — R483`;
- mostrar `Somente simulação — não altera sua ficha`;
- quando bloqueado, mostrar `blockedReason` sem lançar erro;
- mostrar cartões em ordem `official`, `balanced`, `specialist`, `gameplay` quando presentes;
- mostrar PP usados, PP disponíveis, principais deltas, forças, sacrifícios e explicação;
- rotular `official` como `Ficha oficial`;
- não incluir controles mutáveis.

Se uma exceção inesperada ocorrer na renderização/cálculo, usar boundary local com fallback exato:

`Simulador temporariamente indisponível. Sua ficha oficial continua intacta.`

- [ ] **Step 4: integrar no bloco `tab === 'comparar'` de `ResultAdvancedWorkspaceR192.tsx`**

Importar o painel de forma compatível com o boundary/lazy pattern atual e renderizá-lo antes do comparador legado `buildComparison`.

Não adicionar nova entrada a `RESULT_PRIMARY_TABS`, navegação principal ou menu global.

- [ ] **Step 5: validar regressões históricas da superfície Resultado**

Run:

```bash
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run typecheck
```

Expected: PASS. Estes typechecks históricos são obrigatórios porque o R482 demonstrou que uma integração nova pode passar no TypeScript moderno e falhar em stubs legados.

- [ ] **Step 6: commit**

```bash
git add src/modules/build-simulator/BuildSimulatorPanelR483.tsx src/components/result/ResultAdvancedWorkspaceR192.tsx tests/v40-80-r483-build-simulator-regression.ts
git commit -m "R483: integrar simulador read-only ao Resultado"
```

---

### Task 5: Gate próprio R483 e prevenção de PR-green/main-red

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`
- Modify: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: regressão R483 completa dos Tasks 1–4.
- Produces: `npm run test:r483` como gate único do recurso, incluído em `ci:gate` e no PR workflow.

- [ ] **Step 1: adicionar teste estrutural que exige o gate no CI**

No teste R483, ler `package.json` e o workflow e afirmar:

```ts
assert.match(pkg.scripts['ci:gate'], /npm run test:r483/);
assert.ok(pkg.scripts['test:r483']);
assert.match(prWorkflow, /Regressão R483/);
assert.match(prWorkflow, /npm run test:r483/);
```

- [ ] **Step 2: executar e confirmar FAIL porque scripts/workflow ainda não contêm R483**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 3: adicionar scripts**

Em `package.json`:

```json
"typecheck:r483-legacy": "tsc -p tests/types-v3170-ui/tsconfig.json --pretty false",
"test:r483": "npm run typecheck:r483-legacy && node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts"
```

Inserir `npm run test:r483` imediatamente após `npm run test:r482` no `ci:gate`.

- [ ] **Step 4: adicionar etapa explícita no PR workflow**

Logo após R482:

```yaml
      - name: Regressão R483 — Build Simulator read-only
        run: npm run test:r483
```

- [ ] **Step 5: rodar gates direcionados**

Run:

```bash
npm run test:r483
npm run test:r482
npm run test:r180
npm run test:r128
```

Expected: PASS.

- [ ] **Step 6: commit**

```bash
git add package.json .github/workflows/pull-request-validation.yml tests/v40-80-r483-build-simulator-regression.ts
git commit -m "R483: adicionar gate preventivo do Build Simulator"
```

---

### Task 6: Verificação completa, PR e publicação segura

**Files:**
- No new production files expected.
- Review all files changed in Tasks 1–5.

**Interfaces:**
- Consumes: branch R483 completa.
- Produces: evidência de branch pronta para PR; depois do merge, release oficial somente se toda a cadeia `main` passar.

- [ ] **Step 1: executar suíte local direcionada final**

Run:

```bash
npm run test:r483
npm run typecheck
npm run test:r180
npm run test:r192
npm run test:r200
npm run test:r128
node tests/v38-40-definitive-android-opening-regression.mjs
npm run build
```

Expected: todos PASS / build concluído sem erro.

- [ ] **Step 2: revisar diff por autoridade**

Confirmar manualmente no diff:

- nenhum writer/persistência importado no motor R483;
- nenhum `onApply`/`setResult`/`save` adicionado ao painel;
- nenhuma alteração em Clean Slate, R126, R128, pipeline de finalização, skills ou Ímpeto;
- nenhuma alteração em fórmula de PP;
- nenhuma remoção de funcionalidade existente da aba Comparar;
- nenhuma referência executável a GER/Overall no score.

- [ ] **Step 3: abrir PR contra `main` e aguardar o workflow completo**

O PR só pode ser considerado apto ao merge após:

- TypeScript normal GREEN;
- TypeScript completo do APK GREEN;
- R178/R180 GREEN;
- R470–R483 GREEN;
- v38.40 GREEN;
- build de produção GREEN.

- [ ] **Step 4: merge somente se PR estiver mergeable e totalmente GREEN**

Usar squash merge e registrar o novo SHA de `main`.

- [ ] **Step 5: validar o workflow oficial da `main` até o fim**

Não encerrar no primeiro GREEN. Verificar a cadeia completa:

1. Zero-Red;
2. diagnóstico consolidado;
3. build web;
4. projeto/assets Android;
5. Gradle APK;
6. align/sign/validate;
7. manifestos imutáveis/principal/legado;
8. artefato `BuildMaster-Elite-Tatico-v40.80.0-APK-e-Manifestos`;
9. release imutável;
10. validação pública;
11. rota fixa `buildmaster-latest`;
12. APK versionado da rota principal;
13. manifesto do canal principal;
14. validação do canal principal;
15. cópia latest para versões antigas;
16. manifesto/ponte legacy;
17. nova release marcada `Latest`.

- [ ] **Step 6: confirmar integridade da release**

Confirmar via GitHub:

- `/branches/main` aponta para o SHA do merge R483;
- `/releases/latest.target_commitish` é exatamente o mesmo SHA;
- asset APK existe;
- `signing-report.txt` existe;
- manifesto imutável `update-manifest-*.json` existe;
- artefato do workflow existe e não está expirado.

Somente então declarar o R483 concluído/publicado.
