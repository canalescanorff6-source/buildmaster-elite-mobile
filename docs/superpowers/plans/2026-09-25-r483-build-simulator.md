# R483 Build Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** adicionar um simulador determinístico e somente leitura que compare a ficha oficial com variantes Equilibrada, Especialista e Gameplay sem alterar a autoridade Clean Slate/R126/R128 e sem usar GER/Overall como objetivo.

**Architecture:** o R483 será uma ramificação observacional pós-ficha oficial. O motor recebe o `AnalysisResult` já finalizado, usa `result.training` como baseline funcional e fonte de verdade dos PP consumidos, valida tudo com `trainingPlanCore` e gera candidatos por redistribuições pequenas e limitadas. A UI será um painel isolado dentro de `Resultado → Avançado → Ferramentas → Comparar`; falha do simulador degrada somente esse painel e nunca impede a ficha oficial de aparecer.

**Tech Stack:** TypeScript, React/Next.js, `trainingPlanCore`, `pointBudget`, `AnalysisResult` já selado pelo pipeline, Node regression tests via `tests/_ts-require.cjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-25-r483-build-simulator-design.md`

## Global Constraints

- A ficha oficial continua soberana; R483 é somente comparação.
- Não criar botão `Aplicar`, `Salvar como oficial`, `Substituir ficha` nem qualquer escrita de produção.
- `trainingPointsTotal = 0` continua significando orçamento desconhecido/bloqueado; nunca fabricar 64 PP.
- Cada variante válida deve consumir exatamente o mesmo número de PP que a ficha Oficial, não apenas ficar abaixo do teto.
- Recalcular custo exclusivamente por `trainingPlanTotalCost()`; não duplicar fórmula de PP.
- Não alterar Card ID, edição, booster, atributos-base, posição final, playstyle oficial, skills existentes ou identidade da carta.
- Não escrever `recommendedSkills`, `recommendedImpetos`, stores, Cofre ou sessão.
- Não importar nem chamar writers de ficha/persistência no motor R483.
- `Overall`/`GER` não pode entrar no score, desempate ou justificativa.
- R460/R470/R472 e evidência de partidas ficam fora da v1.
- O motor deve ser determinístico, local/offline e sem rede/LLM obrigatório.
- O perfil Gameplay pode usar somente a prioridade implícita na ficha oficial, posição, objetivo e contexto tático já presente no resultado.
- R119, R126 e R128 permanecem soberanos.

## Review Focus

- **Ficha oficial com custo inconsistente:** se `trainingPlanTotalCost(result.training) !== result.trainingPointsUsed`, bloquear variantes em vez de mascarar ou corrigir o resultado.
- **Orçamento válido mas menor que o custo oficial:** bloquear o simulador e preservar a ficha oficial sem alteração.
- **Função insuficiente:** se `result.validation.level === 'blocked'` ou `result.teamMap.functionLabel` estiver vazio, produzir Oficial e, se houver candidato seguro, Equilibrada; não inventar Especialista/Gameplay.
- **Transferência com custo escalonado que não fecha exatamente os PP:** descartar o candidato; nunca aceitar custo diferente da Oficial.
- **Erro de runtime no painel R483:** mostrar `Simulador temporariamente indisponível. Sua ficha oficial continua intacta.` e manter o restante do Resultado funcional.

---

### Task 1: Contrato read-only, bloqueios e baseline Oficial

**Files:**
- Create: `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- Create: `tests/v40-80-r483-build-simulator-regression.ts`

**Interfaces:**
- Consumes: `AnalysisResult`, `PositionCode`, `TrainingKey`, `TrainingPlan` de `@/lib/analyzer`; `normalizeTrainingPlan`, `trainingPlanTotalCost` e `TRAINING_KEYS` de `@/lib/trainingPlanCore`; `normalizePlayerTrainingBudget` de `@/modules/builds/pointBudget`.
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

Criar fixture de `AnalysisResult` com `trainingPointsTotal > 0`, `trainingPointsUsed` coerente e `result.training` não vazio. Testar:

```ts
const before = JSON.stringify(input);
const snapshot = buildBuildSimulatorR483(input);
assert.equal(snapshot.variants[0].id, 'official');
assert.deepEqual(snapshot.variants[0].plan, result.training);
assert.equal(snapshot.variants[0].pointsUsed, result.trainingPointsUsed);
assert.equal(snapshot.baselineFingerprint, result.parsed.internalId);
assert.equal(snapshot.authority.readOnly, true);
assert.equal(snapshot.authority.canOverrideR128, false);
assert.equal(snapshot.authority.optimizeOverall, false);
assert.equal(JSON.stringify(input), before);
```

Adicionar casos:

```ts
const blocked = buildBuildSimulatorR483({ ...input, result: zeroBudgetResult });
assert.match(blocked.blockedReason!, /orçamento real/i);
assert.equal(blocked.variants.length, 0);
assert.equal(blocked.budget, 0);

const inconsistent = buildBuildSimulatorR483({ ...input, result: inconsistentCostResult });
assert.match(inconsistent.blockedReason!, /inconsistência de orçamento/i);
assert.equal(inconsistent.variants.length, 0);
```

Afirmar que snapshot com orçamento `0` nunca contém `budget: 64` nem cria variante com 64 PP.

- [ ] **Step 2: executar e verificar FAIL por módulo inexistente**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: FAIL porque `buildSimulatorEngineR483` ainda não existe.

- [ ] **Step 3: implementar contrato mínimo e guardrails**

Em `buildSimulatorEngineR483.ts`:

- `BUILD_SIMULATOR_R483_VERSION = '40.80-r483-build-simulator-v1'`;
- `officialPlan = normalizeTrainingPlan({ ...result.training })`;
- `canonicalOfficialCost = trainingPlanTotalCost(officialPlan)`;
- `budget = normalizePlayerTrainingBudget(result.trainingPointsTotal)`;
- bloquear `budget === 0` com `Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.`;
- bloquear `canonicalOfficialCost !== result.trainingPointsUsed` ou `canonicalOfficialCost > budget` com `A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.`;
- criar somente a variante `official` neste task;
- `pointsAvailable = budget - canonicalOfficialCost`;
- `baselineFingerprint = result.parsed.internalId || null`; não criar algoritmo novo de identidade;
- não ler `overall`, `maxOverall`, `pri.GER`, `recommendedSkills` ou `recommendedImpetos`.

- [ ] **Step 4: rodar o teste R483**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: PASS nos testes de baseline, bloqueio, orçamento e imutabilidade.

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
- Consumes: contrato do Task 1; `TRAINING_KEYS`, `addTrainingLevel`, `removeTrainingLevel`, `trainingPlanTotalCost` de `trainingPlanCore`; a própria distribuição oficial `result.training` como prioridade funcional já decidida pelo pipeline soberano.
- Produces: variantes `balanced`, `specialist` e `gameplay` quando o resultado tiver função suficiente, todas com `pointsUsed === officialPointsUsed`.

Decisão de algoritmo da v1:

- enumerar transferências entre pares de `TrainingKey` na ordem fixa de `TRAINING_KEYS`;
- por candidato, remover 1 ou 2 níveis do grupo doador;
- depois adicionar de 1 a 4 níveis ao receptor;
- normalizar e recalcular custo após cada candidato;
- aceitar somente candidatos cujo custo seja exatamente `officialPointsUsed`;
- deduplicar por `planKeyR483(plan) = TRAINING_KEYS.map((key) => `${key}:${plan[key]}`).join('|')`;
- não usar recursão nem busca combinatória sem limite;
- desempate pela ordem estável dos candidatos, nunca por GER.

Prioridade funcional v1:

```ts
function officialPriorityR483(official: TrainingPlan): TrainingKey[];
```

Ordenar grupos com investimento `> 0` por:
1. nível oficial decrescente;
2. custo canônico do grupo decrescente;
3. ordem de `TRAINING_KEYS`.

Isso reutiliza a decisão funcional da própria ficha final em vez de criar uma segunda tabela de funções.

Ajuste tático do perfil Gameplay:

```ts
const GAMEPLAY_STYLE_PRIORITY_R483: Partial<Record<TacticalStyle, TrainingKey[]>> = {
  POSSE_DE_BOLA: ['passing', 'dribbling', 'dexterity'],
  CONTRA_ATAQUE_RAPIDO: ['dexterity', 'lowerBodyStrength', 'shooting'],
  CONTRA_ATAQUE: ['lowerBodyStrength', 'passing', 'dexterity'],
  POR_FORA: ['lowerBodyStrength', 'passing', 'dribbling'],
  PASSE_LONGO: ['passing', 'lowerBodyStrength', 'aerialStrength'],
  SOBREPOSICAO: ['passing', 'lowerBodyStrength', 'dexterity']
};
```

`AUTO` não adiciona prioridade. O ajuste tático só desempata/bonifica candidatos; não pode superar a prioridade funcional base a ponto de escolher um candidato que retire investimento dos dois primeiros grupos oficiais para alimentar um grupo sem relevância oficial.

- [ ] **Step 1: adicionar testes falhando para custo exato e determinismo**

```ts
const first = buildBuildSimulatorR483(input);
const second = buildBuildSimulatorR483(input);
assert.deepEqual(first, second);
assert.deepEqual(first.variants.map((v) => v.id), ['official', 'balanced', 'specialist', 'gameplay']);

for (const variant of first.variants) {
  assert.equal(trainingPlanTotalCost(variant.plan), result.trainingPointsUsed);
  assert.equal(variant.pointsUsed, result.trainingPointsUsed);
  assert.ok(variant.pointsUsed <= result.trainingPointsTotal);
}
```

A fixture deve ser escolhida para permitir ao menos uma transferência exata em cada perfil.

Criar outro caso em que uma transferência libera PP que não podem ser recolocados exatamente dentro dos limites 1–4 níveis; afirmar que esse plano não aparece.

Criar caso com `validation.level = 'blocked'` ou `teamMap.functionLabel = ''` e afirmar que não há `specialist`/`gameplay`.

- [ ] **Step 2: executar e confirmar FAIL nas variantes ainda ausentes**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

Expected: FAIL porque ainda existe apenas `official`.

- [ ] **Step 3: implementar enumerador bounded**

Criar:

```ts
function planKeyR483(plan: TrainingPlan): string;
function enumerateExactCostTransfersR483(official: TrainingPlan, officialPoints: number): TrainingPlan[];
function planDistanceR483(a: TrainingPlan, b: TrainingPlan): number;
function buildDeltasR483(official: TrainingPlan, candidate: TrainingPlan): BuildSimulatorVariantR483['deltas'];
```

Nenhuma função acima pode mutar `official`.

- [ ] **Step 4: implementar seleção Equilibrada**

```ts
function selectBalancedVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null;
```

Critérios, nesta ordem:
1. somente receptor/doador dentro dos grupos ativos na Oficial;
2. menor dispersão dos níveis ativos;
3. menor `planDistanceR483`;
4. ordem estável original do enumerador.

- [ ] **Step 5: implementar seleção Especialista**

```ts
function selectSpecialistVariantR483(candidates: TrainingPlan[], official: TrainingPlan): TrainingPlan | null;
```

Usar `officialPriorityR483`. Bonificar ganho nos primeiros 3 grupos da prioridade e penalizar retirada deles; candidatos que retiram de um dos 2 primeiros grupos para alimentar grupo fora do top 3 não podem vencer.

Só produzir Specialist se `result.validation.level !== 'blocked'` e `result.teamMap.functionLabel.trim()` não estiver vazio.

- [ ] **Step 6: implementar seleção Gameplay**

```ts
function selectGameplayVariantR483(candidates: TrainingPlan[], official: TrainingPlan, tacticalStyle: TacticalStyle): TrainingPlan | null;
```

Pontuar primeiro pela prioridade funcional oficial e usar `GAMEPLAY_STYLE_PRIORITY_R483[result.tacticalProfile.style]` apenas como bônus secundário. Não consultar partidas, R460, R470 ou R472.

- [ ] **Step 7: rodar teste R483 e typecheck**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: commit**

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
- Produces: `strengths`, `sacrifices`, `explanation` e score relativo dentro da mesma carta.

- [ ] **Step 1: escrever testes falhando para explicabilidade**

```ts
for (const variant of snapshot.variants.slice(1)) {
  assert.ok(variant.deltas.some((d) => d.delta !== 0));
  assert.ok(variant.strengths.length > 0);
  assert.ok(variant.sacrifices.length > 0);
  assert.ok(variant.explanation.length > 0);
}
```

Para cada delta positivo citado em `strengths`, exigir que o mesmo `TrainingKey` tenha `delta > 0`; para cada sacrifício citado, exigir `delta < 0`.

- [ ] **Step 2: adicionar teste estrutural de autoridade**

Ler o source do engine e rejeitar:

- imports de módulos de persistência/Cofre;
- chamadas com prefixos `save`, `persist`, `store` dirigidas a ficha oficial;
- atribuições a `recommendedSkills` ou `recommendedImpetos`;
- leitura de `result.parsed.overall`, `result.parsed.maxOverall` ou `result.pri.GER` dentro do engine;
- setter/callback de resultado oficial.

Também afirmar as oito flags do objeto `authority`, incluindo `optimizeOverall === false`.

- [ ] **Step 3: executar e confirmar FAIL na explicabilidade ainda incompleta**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 4: implementar score e textos somente a partir dos deltas**

```ts
function scoreVariantR483(...): number;
function explainVariantR483(...): Pick<BuildSimulatorVariantR483, 'strengths' | 'sacrifices' | 'explanation'>;
```

O score só ordena variantes da mesma carta. Não expor o score como qualidade absoluta entre jogadores.

- [ ] **Step 5: rodar regressão, R128 e typecheck**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
npm run test:r128
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: commit**

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
- Consumes: `buildBuildSimulatorR483({ result, targetPosition })`; `analysisUsagePositionR138(result)` para usar a posição já decidida pelo pipeline atual.
- Produces: `BuildSimulatorPanelR483({ result }: { result: AnalysisResult })`; nenhuma prop de callback de escrita.

Decisão de integração:

- manter a aba existente `comparar` em `ResultAdvancedWorkspaceR192`;
- renderizar R483 no topo dessa aba;
- manter o comparador legado abaixo na v1 para não remover funcionalidade existente;
- não adicionar item de navegação principal;
- o painel não recebe `onSave`, `onApply`, `setResult` ou equivalente.

- [ ] **Step 1: escrever teste de integração UI falhando**

Ler os sources e afirmar:

```ts
assert.match(advancedWorkspaceSource, /BuildSimulatorPanelR483/);
assert.match(panelSource, /Simulador de ficha — R483/);
assert.match(panelSource, /Somente simulação — não altera sua ficha/);
assert.match(panelSource, /Ficha oficial/);
assert.doesNotMatch(panelSource, />\s*Aplicar\s*</i);
assert.doesNotMatch(panelSource, /Salvar como oficial/i);
assert.doesNotMatch(panelSource, /Substituir ficha/i);
```

Afirmar também que a assinatura pública do componente aceita somente `{ result: AnalysisResult }`.

- [ ] **Step 2: executar e confirmar FAIL porque o painel não existe**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 3: implementar `BuildSimulatorPanelR483`**

Estrutura do arquivo:

```ts
export function BuildSimulatorPanelR483({ result }: { result: AnalysisResult }): React.ReactNode;
```

Internamente:

- `targetPosition = analysisUsagePositionR138(result)`;
- `useMemo(() => buildBuildSimulatorR483({ result, targetPosition }), [result, targetPosition])`;
- mostrar orçamento, Oficial e variantes;
- para cada variante mostrar PP usados, PP disponíveis, deltas, forças, sacrifícios e explicação;
- se `blockedReason`, renderizar aviso sem lançar erro;
- não renderizar controle mutável.

Criar no mesmo arquivo uma boundary local `BuildSimulatorBoundaryR483` para capturar exceções de render/cálculo e exibir exatamente:

`Simulador temporariamente indisponível. Sua ficha oficial continua intacta.`

- [ ] **Step 4: integrar no bloco `tab === 'comparar'` de `ResultAdvancedWorkspaceR192.tsx`**

Importar `BuildSimulatorPanelR483` e renderizá-lo antes dos cards atuais de `buildComparison`. Não alterar `ResultTab`, `RESULT_PRIMARY_TABS` ou navegação normal.

- [ ] **Step 5: validar superfície Resultado e stubs históricos**

Run:

```bash
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run typecheck
```

Expected: PASS. Esta verificação é obrigatória para evitar repetição do padrão PR-green/main-red observado no R482.

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
- Consumes: regressão R483 dos Tasks 1–4.
- Produces: `npm run test:r483`, incluído em `ci:gate` e no workflow de PR.

- [ ] **Step 1: adicionar teste estrutural que exige R483 no CI**

```ts
assert.match(pkg.scripts['ci:gate'], /npm run test:r483/);
assert.ok(pkg.scripts['test:r483']);
assert.match(prWorkflow, /Regressão R483/);
assert.match(prWorkflow, /npm run test:r483/);
```

- [ ] **Step 2: executar e confirmar FAIL antes das alterações de CI**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
```

- [ ] **Step 3: adicionar scripts exatos**

Em `package.json`:

```json
"typecheck:r483-legacy": "npm run typecheck:v3170",
"test:r483": "npm run typecheck:r151 && npm run typecheck:r483-legacy && node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts"
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
- Review all files changed in Tasks 1–5.

**Interfaces:**
- Consumes: branch R483 completa.
- Produces: evidência de branch pronta para PR e, depois do merge, release oficial validada ponta a ponta.

- [ ] **Step 1: executar suíte final direcionada**

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

Confirmar:

- nenhum writer/persistência importado no motor R483;
- nenhum callback de Apply/Save/setResult no painel;
- nenhuma alteração em Clean Slate, R126, R128, pipeline de finalização, skills ou Ímpeto;
- nenhuma alteração na fórmula canônica de PP;
- nenhuma remoção do comparador existente;
- nenhuma leitura de GER/Overall no engine R483.

- [ ] **Step 3: abrir PR contra `main` e aguardar workflow completo**

O PR só fica apto a merge após:

- TypeScript normal GREEN;
- TypeScript completo do APK GREEN;
- R178/R180 GREEN;
- R470–R483 GREEN;
- v38.40 GREEN;
- build de produção GREEN.

- [ ] **Step 4: merge somente se PR estiver mergeable e totalmente GREEN**

Usar squash merge e registrar o novo SHA de `main`.

- [ ] **Step 5: validar workflow oficial da `main` até o fim**

Verificar:

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

- [ ] **Step 6: confirmar integridade final da release**

Confirmar via GitHub:

- `/branches/main` aponta para o SHA do merge R483;
- `/releases/latest.target_commitish` é exatamente o mesmo SHA;
- asset APK existe;
- `signing-report.txt` existe;
- manifesto imutável `update-manifest-*.json` existe;
- artefato do workflow existe e não está expirado.

Somente então declarar o R483 concluído/publicado.
