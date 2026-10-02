# BuildMaster R-VIS 11 Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o redesign premium já existente com um gate R530 único, executável e preventivo, provando que R521–R529 continuam presentes, todas as superfícies principais têm implementação real e o core R119→R126→R128 permanece idêntico ao baseline congelado.

**Architecture:** Não haverá reescrita visual ampla. O trabalho cria uma camada de aceitação estática R530 sobre a arquitetura já implantada: um teste de fechamento lê as superfícies canônicas, a camada visual v44, a navegação e o fingerprint de R119; o mesmo gate é executado no Pull Request e no diagnóstico completo de release. Qualquer lacuna funcional/visual revelada pelo teste será tratada em mudança focada posterior, em vez de mascarada por hardcode.

**Tech Stack:** Next.js/React/TypeScript, CSS existente, Node.js regression scripts, GitHub Actions, Capacitor/Android pipeline existente.

**Spec:** `docs/roadmap-validations/r-vis-0-visual-inventory.md` — derivado do Prompt Mestre `buildmaster_prompt_2_continuidade_core_redesign_premium.docx` e do baseline `27faa2a78e1c59d1d200e3b9a89fb7a0cf98851a`.

## Global Constraints

- Estado do core continua `CORE_FROZEN_GATE_B`; não declarar `ENGINE_CERTIFIED`.
- R510 continua `PROVISIONAL_UNCALIBRATED / ENGINEERING_SEED / certifiedForFinalWrite=false` até evidência real suficiente.
- Não alterar semanticamente R119, R126, R128, R501, R510 ou R517 neste plano.
- SHA-256 aprovado de `src/lib/cleanSlatePerformance2027V4080R119.ts`: `48e317ccc20d775e86ed2aaf050462aa3555f361deec84ae7eabfd959674ddd8`.
- Não criar segundo writer, não importar writer de produção em superfícies visuais e não recalcular ficha durante render/exportação.
- Não hardcodar números, raridade, PP, score, confiança, favoritos, certificação ou outro dado de mockup em produção.
- Preservar todos os grupos/seções canônicos de `appNavigationR127.ts`.
- Preservar mobile-first, safe areas Android, foco visível, touch target, reduced motion, tema claro/presets e web responsiva.
- Não adicionar dependência nova para este fechamento.
- Não consolidar/apagar a base CSS em massa neste plano; mudanças de CSS só entram se um teste de aceitação revelar uma lacuna específica.

## Review Focus

1. **Android pequeno / safe areas / teclado:** navegação e CTAs não podem ficar cobertos por barra de sistema ou dock; o teste R530 deve exigir os contratos de safe area/reduced motion já presentes e a verificação final deve incluir regressões responsivas existentes.
2. **Tema claro e presets alternativos:** a camada v44 não pode tornar texto/controles ilegíveis fora do preset obsidian-gold; R530 deve preservar o contrato R201 e `quality:visual`.
3. **Sem resultado / coleção vazia / OCR sem sessão:** superfícies continuam funcionais sem dados; R530 deve verificar que Home, Reader, Cofre e Resultado são conectados às implementações reais, sem exigir dados fictícios.
4. **Modo básico vs. avançado:** recursos técnicos podem ser condicionais, mas as funções principais não podem desaparecer; R530 deve mapear as superfícies canônicas e não apenas procurar uma screenshot feliz.
5. **Deriva de autoridade ou bundle:** nenhuma correção visual pode tocar R119/R126/R128 ou introduzir writer direto; a verificação final deve executar R419, R128, TypeScript, bundle e build.

---

### Task 1: Criar a regressão de fechamento R530

**Files:**
- Create: `tests/v44-00-r530-reference-redesign-closure-regression.mjs`
- Read/protect: `src/app/layout.tsx`
- Read/protect: `src/app/v44-buildmaster-reference.css`
- Read/protect: `src/lib/appNavigationR127.ts`
- Read/protect: `src/components/CardVisionAppChromeR185.tsx`
- Read/protect: `src/modules/core/IntegratedHomePanel.tsx`
- Read/protect: `src/components/CardVisionApp.tsx`
- Read/protect: `src/components/result/ResultWorkspace.tsx`
- Read/protect: `src/modules/tactical-studio/MetaFormationStudioV3832.tsx`
- Read/protect: `src/components/vault/CardVisionVaultWorkspaceR191.tsx`
- Read/protect: `src/components/CompactSharePanel.tsx`
- Read/protect: `src/components/settings/CardVisionSettingsWorkspaceR190.tsx`
- Read/protect: `src/lib/cleanSlatePerformance2027V4080R119.ts`
- Read/protect: `package.json`
- Read/protect: `.github/workflows/pull-request-validation.yml`
- Read/protect: `scripts/ci-doctor-config.mjs`

**Interfaces:**
- Consumes: os marcadores R521–R529, `bm-r530-final-polish`, o modelo de navegação R127 e o fingerprint R119 congelado.
- Produces: um teste Node estático `v44-00-r530-reference-redesign-closure-regression.mjs` que falha fechado quando o redesign perde superfície, CI ou autoridade.

- [ ] **Step 1: Write the failing test**

Criar `tests/v44-00-r530-reference-redesign-closure-regression.mjs` com assertions para:

```js
assert.match(layout, /v44-buildmaster-reference\.css/);
assert.match(layout, /bm-r530-final-polish/);
for (const marker of ['R521','R522','R523','R524','R525','R526','R527','R528','R529','R530']) {
  assert.ok(referenceCss.includes(marker), `R530: etapa ${marker} ausente da camada de referência.`);
}
for (const section of ['inicio','jogadores','mapeamento','time','partidas','ajustes','menu','buscar','leitor','manual','resultado','cofre']) {
  assert.ok(navigation.includes(`'${section}'`), `R530: superfície canônica ${section} ausente.`);
}
assert.match(chrome, /bm-r521-/);
assert.match(home, /bm-r522-/);
assert.match(app, /bm-r523-/);
assert.match(result, /bm-r524-/);
assert.match(result, /bm-r525-/);
assert.match(tactics, /bm-r526-/);
assert.match(vault, /bm-r527-/);
assert.match(share, /bm-r528-/);
assert.match(settings, /bm-r529-/);
assert.equal(sha256(r119), '48e317ccc20d775e86ed2aaf050462aa3555f361deec84ae7eabfd959674ddd8');
assert.match(packageJson, /"test:r530"/);
assert.match(prWorkflow, /npm run test:r530/);
assert.match(doctorConfig, /test:r530/);
```

Adicionar também uma denylist de imports/chamadas de writer nas superfícies visuais principais, cobrindo pelo menos `cleanSlatePerformance2027V4080R119`, `createProductionAnalysisR138`, `rebuildProductionAnalysisR138` e `applyCleanSlatePerformance2027R119` quando usados como chamada/import direto fora do orquestrador permitido.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/v44-00-r530-reference-redesign-closure-regression.mjs
```

Expected: **FAIL** inicialmente porque `test:r530` e a fiação de CI ainda não existem; qualquer falha anterior em R521–R530 deve ser tratada como lacuna real, não ignorada.

- [ ] **Step 3: Confirm the RED reason**

Registrar no PR/andamento a primeira assertion que falhou. Se a falha for uma superfície/marcador real ausente, parar esta tarefa e abrir uma correção focada para essa lacuna antes de prosseguir com a fiação de CI.

- [ ] **Step 4: Commit the RED test**

```bash
git add tests/v44-00-r530-reference-redesign-closure-regression.mjs
git commit -m "test(ui): adicionar gate RED do fechamento R530"
```

### Task 2: Expor R530 como gate executável e alinhar PR/release

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`
- Modify: `scripts/ci-doctor-config.mjs`
- Test: `tests/v44-00-r530-reference-redesign-closure-regression.mjs`

**Interfaces:**
- Consumes: teste R530 da Task 1.
- Produces: `npm run test:r530` e paridade entre prevenção de PR e diagnóstico completo de release.

- [ ] **Step 1: Add the package script**

Adicionar exatamente:

```json
"test:r530": "node tests/v44-00-r530-reference-redesign-closure-regression.mjs"
```

Sem adicionar dependência.

- [ ] **Step 2: Wire the Pull Request gate**

Adicionar no workflow de PR um passo nomeado de forma explícita, próximo dos gates visuais/Android e antes do build final:

```yaml
- name: R530 — fechamento do redesign premium
  run: npm run test:r530
```

- [ ] **Step 3: Wire the release diagnostic**

Adicionar `test:r530` ao `scripts/ci-doctor-config.mjs` como grupo próprio de diagnóstico visual/closure, mantendo a paridade com o PR gate.

- [ ] **Step 4: Run R530 to verify GREEN**

Run:

```bash
npm run test:r530
```

Expected: PASS com R521–R530 presentes, todas as superfícies canônicas mapeadas, SHA R119 intacto e PR/release contendo `test:r530`.

- [ ] **Step 5: Commit the GREEN wiring**

```bash
git add package.json .github/workflows/pull-request-validation.yml scripts/ci-doctor-config.mjs tests/v44-00-r530-reference-redesign-closure-regression.mjs
git commit -m "test(ui): fechar redesign premium com gate R530"
```

### Task 3: Executar a bateria de aceitação visual e funcional

**Files:**
- No product files expected.
- Test existing gates only.

**Interfaces:**
- Consumes: `test:r530` e contratos já existentes R201–R204/R419/R128.
- Produces: evidência executável de que o fechamento visual não alterou o core e continua compatível com web/APK.

- [ ] **Step 1: Run the focused visual closure**

```bash
npm run test:r530
npm run test:r201
npm run test:r202
npm run test:r203
npm run test:r204
npm run quality:visual
```

Expected: todos PASS.

- [ ] **Step 2: Run responsive/bundle protections**

```bash
npm run test:v3400
npm run quality:bundle
```

Expected: PASS; nenhuma regressão de touch/scroll/menu/theme ou orçamento de bundle.

- [ ] **Step 3: Re-prove frozen core**

```bash
npm run test:r128
npm run test:r419
```

Expected: PASS e working tree rastreada limpa após R419.

- [ ] **Step 4: Run TypeScript and production build**

```bash
npm run typecheck
npm run typecheck:r151
npm run build
```

Expected: PASS.

- [ ] **Step 5: Verify tracked tree cleanliness**

```bash
git diff --exit-code
test -z "$(git status --porcelain --untracked-files=no)"
```

Expected: exit 0.

### Task 4: Fechar R-VIS 11 no CI real

**Files:**
- Modify: `docs/roadmap-validations/r-vis-0-visual-inventory.md`
- Create: `docs/roadmap-validations/r-vis-11-final-closure.md`

**Interfaces:**
- Consumes: evidência GREEN das Tasks 1–3 e workflow real do PR.
- Produces: checkpoint formal `R_VIS_11_CLOSED` sem promover R510/R517.

- [ ] **Step 1: Update the inventory only after local gates are GREEN**

Trocar R-VIS 11 de `PARCIAL` para `EXISTE / FECHADO` apenas se todos os comandos da Task 3 passarem. Registrar o commit/head exato usado.

- [ ] **Step 2: Create the final closure checkpoint**

`docs/roadmap-validations/r-vis-11-final-closure.md` deve registrar:

- baseline de core `27faa2a78e1c59d1d200e3b9a89fb7a0cf98851a`;
- branch/head do redesign closure;
- R521–R530 mapeados;
- resultados `test:r530`, R201–R204, `quality:visual`, v3400, bundle, R128, R419, typecheck e build;
- estado do core ainda `CORE_FROZEN_GATE_B`;
- R510 ainda provisória e R517 sem `ENGINE_CERTIFIED`;
- confirmação de que nenhum product file precisou mudar, caso essa seja a evidência real.

- [ ] **Step 3: Commit documentation**

```bash
git add docs/roadmap-validations/r-vis-0-visual-inventory.md docs/roadmap-validations/r-vis-11-final-closure.md
git commit -m "docs(ui): registrar fechamento R-VIS 11"
```

- [ ] **Step 4: Open PR and observe exact-head CI**

Abrir PR para `main`. Critério de merge: workflow do PR totalmente GREEN no head exato, incluindo `R530 — fechamento do redesign premium`, R419, R128, TypeScript completo e build.

- [ ] **Step 5: Merge only after exact-head GREEN**

Fazer merge preservando a mensagem de que o core continua `CORE_FROZEN_GATE_B`, não `ENGINE_CERTIFIED`.

- [ ] **Step 6: Verify main post-merge**

Confirmar o workflow `Gerar APK Canal Direto` no SHA final da `main`. Só declarar R-VIS 11 encerrado quando o pipeline real terminar `success`; cancelamento por concorrência não conta como falha funcional, mas também não conta como prova final.

## Expected End State

- R-VIS 0 documentado e rastreável.
- R-VIS 1–10 reconhecidos como implementação existente, sem retrabalho destrutivo.
- R-VIS 11 fechado por um gate executável R530.
- PR e release executam o mesmo fechamento visual.
- Core R119→R126→R128 permanece intacto.
- R510/R517 permanecem honestamente provisórios até `REAL_MATCH_DATA` suficiente.
- Próximas mudanças visuais passam a ser dívidas pontuais de fidelidade, não um novo redesign total.