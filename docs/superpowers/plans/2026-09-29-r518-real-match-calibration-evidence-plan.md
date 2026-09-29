# R518 Real Match Calibration Evidence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` (or subagent-driven development when available) and execute this plan task-by-task. Use TDD for every behavioral change: RED first, minimal GREEN, then refactor. Do not skip CI/root-cause debugging.

**Goal:** implementar a R518 como dossiê determinístico, auditável e fail-closed de evidência de partidas reais, capaz de dizer se existe base suficiente para uma futura promoção explícita da calibração R510, sem alterar automaticamente R510, ficha, Top 5, Ímpeto, R517 ou qualquer writer de produção.

**Architecture:** R518 fica em uma ramificação observacional: R460 → R470 → R472 → R516 → R518. A R516 deixa de ter lógica duplicada apenas dentro do teste e vira módulo puro/read-only reutilizável. A R518 agrega resultados já calculados, mede qualidade/diversidade/cobertura, normaliza a evidência em ordem canônica e produz um fingerprint estável. O adaptador operacional pode ler o repositório real de partidas R137, mas a função pura recebe uma origem explícita para impedir que fixtures/sintéticos sejam promovidos como evidência operacional. R517 continua consumindo somente o estado oficial de certificação R510.

**Tech Stack:** TypeScript, módulos de análise existentes, Node regression tests via `tests/_ts-require.cjs`, `MatchValidationRecord`, R137/R460/R470/R472/R510/R516/R517, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-29-r518-real-match-calibration-evidence-design.md`

## Non-negotiable invariants

- R518 é read-only e fail-closed.
- `productionWriteAllowed:false`, `automaticApplyAllowed:false`, `canCertifyR510:false`, `humanReviewRequired:true` são invariantes.
- R518 nunca muda `GAMEPLAY_ENGINE_R510_SEED_POLICY` ou `GAMEPLAY_ENGINE_R510_CALIBRATION`.
- Este PR não pode trocar `certifiedForFinalWrite:false` para `true`.
- `READY_FOR_R510_PROMOTION` significa somente "evidência pronta para revisão humana de um change-set futuro"; nunca `ENGINE_CERTIFIED`.
- R517 deve continuar retornando `EXPERIMENTAL_VALIDATED`/blocker R510 enquanto R510 não estiver oficialmente certificada.
- Nenhum writer, optimizer de produção ou persistência de ficha pode ser importado pela R518.
- Nenhuma ficha, treino, `recommendedSkills`, Top 5, Ímpeto, posição, função ou estilo é recalculado/escrito pela R518.
- Card GER/Overall não entra em status, fingerprint, cobertura, score ou desempate.
- `MatchValidationRecord.overallRating` é nota de desempenho da partida e não deve ser confundida com GER da carta.
- Dados sintéticos/golden são válidos para teste de software, mas não fecham readiness operacional.
- Na dúvida/ausência de metadados, degradar para `COLLECTING`, `INSUFFICIENT_EVIDENCE` ou `BLOCKED`; nunca promover otimisticamente.
- Uma única carta/função não pode liberar readiness global do engine.
- Não aumentar limites de bundle/código por conveniência; se surgir RED de orçamento, diagnosticar antes de alterar teto.

---

### Task 0: Baseline de contratos e imutabilidade da Fase 10

**Files:**
- Read: `src/modules/analysis/gameplayEngineR510.ts`
- Read: `src/modules/analysis/engineCertificationR517.ts`
- Read: `src/modules/analysis/index.ts`
- Read: `tests/v40-80-r516-real-match-calibration-bridge-regression.ts`
- Read: `tests/v40-80-r517-engine-certification-regression.ts`
- No source modification.

- [ ] **Step 1: confirmar HEAD/branch e delta documental**

Confirmar que `feature/r518-real-match-calibration-evidence` parte da main pós-R517 e, antes do código, contém somente spec + plan R518.

- [ ] **Step 2: executar baseline das regressões diretamente relacionadas**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r516-real-match-calibration-bridge-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts
```

Expected: PASS.

- [ ] **Step 3: registrar invariantes antes da mudança**

Confirmar por teste/leitura:

```ts
GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite === false
buildEngineCertificationR517(validInput).status !== 'ENGINE_CERTIFIED'
buildEngineCertificationR517(validInput).blockers.includes('R510_CALIBRATION_NOT_CERTIFIED')
```

Nenhum commit de código nesta Task.

---

### Task 1: Extrair o bridge R516 sem mudar comportamento

**Files:**
- Create: `src/modules/analysis/gameplayCalibrationBridgeR516.ts`
- Modify: `tests/v40-80-r516-real-match-calibration-bridge-regression.ts`

**Public contract:**

```ts
export const GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION =
  '40.80-r516-real-match-calibration-contract-v1' as const;

export type GameplayCalibrationBridgeInputR516 = {
  outcome: BuildOutcomeCalibrationR460;
  proposal: LearningProposalR470;
};

export function buildGameplayCalibrationBridgeR516(
  input: GameplayCalibrationBridgeInputR516,
): GameplayCalibrationBridgeR516;
```

- [ ] **Step 1: RED — trocar o teste R516 para importar módulo inexistente**

Remover a implementação local `ACTION_MAP_R516`/`buildIntegrationContractR516` do teste e importar o módulo novo.

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r516-real-match-calibration-bridge-regression.ts
```

Expected: FAIL por módulo/export inexistente.

- [ ] **Step 2: implementar apenas a lógica já comprovada pelo teste atual**

Mover para o módulo:

- mapping atual de ações R460 → primitivos R510;
- teto `1.06`;
- gate `R460 ACTIVE + R470 PROPOSED/CALIBRATION_WEIGHT`;
- candidatos ordenados deterministicamente por `action`;
- IDs de evidência deduplicados/ordenados;
- ações sem mapping em `unsupportedEvidenceActions`;
- flags read-only/sem auto-apply/revisão humana.

Não adicionar novas heurísticas nesta Task.

- [ ] **Step 3: provar ausência de side effect**

Antes/depois da derivação:

```ts
const seedBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY);
const calibrationBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION);
buildGameplayCalibrationBridgeR516(input);
assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY), seedBefore);
assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION), calibrationBefore);
```

- [ ] **Step 4: GREEN R516 + R472**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r516-real-match-calibration-bridge-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r472-motor-lab-lifecycle-regression.ts
```

Expected: PASS e comportamento equivalente ao contrato anterior.

- [ ] **Step 5: commit**

```bash
git add src/modules/analysis/gameplayCalibrationBridgeR516.ts tests/v40-80-r516-real-match-calibration-bridge-regression.ts
git commit -m "refactor(core): extract R516 calibration bridge"
```

---

### Task 2: Criar núcleo fail-closed da R518

**Files:**
- Create: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`
- Create: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`

**Core types:**

```ts
export type EvidenceOriginR518 = 'PERSISTED_REAL' | 'TEST_FIXTURE' | 'UNKNOWN';

export type RealMatchCalibrationStatusR518 =
  | 'INSUFFICIENT_EVIDENCE'
  | 'COLLECTING'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_R510_PROMOTION'
  | 'BLOCKED';
```

A saída deve incluir `version`, `status`, `fingerprint`, `authority`, `evidenceSummary`, `qualityGates`, `coverage`, `primitiveCandidates`, `blockers`, `missingRequirements`, `audit`.

- [ ] **Step 1: RED — escrever testes de ausência/origem e autoridade**

Testar:

- zero contextos/records → `INSUFFICIENT_EVIDENCE`;
- `TEST_FIXTURE` não pode virar readiness operacional;
- `UNKNOWN` falha fechado;
- todas as flags de authority permanecem false/read-only;
- seed/calibration R510 permanecem byte-for-byte iguais;
- mesma entrada produz mesmo output básico.

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r518-real-match-calibration-evidence-regression.ts
```

Expected: FAIL por módulo inexistente.

- [ ] **Step 2: implementar contrato mínimo**

Criar versão:

```ts
export const REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION =
  '40.80-r518-real-match-calibration-evidence-v1' as const;
```

Implementar somente os estados fail-closed iniciais e authority invariável. Ainda não liberar `READY_FOR_R510_PROMOTION`.

- [ ] **Step 3: GREEN mínimo**

Rodar teste R518 até PASS sem afrouxar asserts.

- [ ] **Step 4: commit**

```bash
git add src/modules/analysis/realMatchCalibrationEvidenceR518.ts tests/v40-80-r518-real-match-calibration-evidence-regression.ts
git commit -m "feat(core): add fail-closed R518 evidence dossier"
```

---

### Task 3: Gates de um contexto real — testar limites exatos

**Files:**
- Modify: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`

- [ ] **Step 1: RED — testes de fronteira individual, um por gate**

Criar fixtures que variam uma dimensão por vez:

- 7 partidas elegíveis → não ready; 8 → pode passar volume local;
- 2 sessões → não ready; 3 → pode passar sessões;
- stableShare 69 → falha; 70 → passa;
- currentPatchShare 79 → falha; 80 → passa;
- R470 confidence 87 → falha; 88 → passa;
- drift `true` → `BLOCKED`;
- R472 diferente de `READY_FOR_REVIEW` → não promove;
- `eligibleForReview=false` → não promove;
- R460 sem `PERSISTENT_GAP` suportado → não promove;
- R470 sem `CALIBRATION_WEIGHT/PROPOSED` → não promove;
- geração incompatível/excluída → não promove;
- candidato R516 acima de 1.06 → `BLOCKED`.

- [ ] **Step 2: implementar `evaluateContextR518`**

Consumir números já normalizados por R460/R470. Não reimplementar `recordWeight`, recency, estabilidade ou scoring de partida.

Produzir estrutura explícita de gates com `passed`, `observed`, `required` e reason.

- [ ] **Step 3: GREEN + regressão R516**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r518-real-match-calibration-evidence-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r516-real-match-calibration-bridge-regression.ts
```

- [ ] **Step 4: commit**

```bash
git commit -am "feat(core): enforce R518 context evidence gates"
```

---

### Task 4: Cobertura global e readiness para futura promoção R510

**Files:**
- Modify: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`

- [ ] **Step 1: RED — matriz global**

Testar cumulativamente:

- 1 contexto forte → `READY_FOR_REVIEW`, nunca global promotion;
- 23 partidas totais → não global; 24 → volume global passa;
- 5 sessões → não global; 6 → passa;
- 2 contextos → não global; 3 → passa;
- 2 famílias de primitivos → não global; 3 → passa;
- 2 funções/posições distintas → não global; 3 → passa;
- qualquer contexto usado com drift/block R472 → bloqueia ou exclui de readiness conforme natureza do gate;
- 3 contextos válidos + todos os thresholds → `READY_FOR_R510_PROMOTION`;
- esse status continua com `canCertifyR510:false` e `productionWriteAllowed:false`.

- [ ] **Step 2: implementar famílias de cobertura**

Somente para auditoria/cobertura:

- Creation: `shortCombination`, `lineBreakingPass`;
- Control/progression: `firstTouchUnderPressure`, `centralCarry`, `pressEscape`;
- Attack/finishing: `attackingMovement`, `finishingAction`;
- Duel/defensive: `duelShield`, `defensiveDuel`;
- Aerial: `aerialDuel`.

Não atribuir pesos novos a famílias.

- [ ] **Step 3: implementar agregação global**

Chave de contexto canônica deve derivar de identidade funcional já presente (carta/posição/função/geração), sem GER.

- [ ] **Step 4: GREEN**

Rodar regressão R518 completa.

- [ ] **Step 5: commit**

```bash
git commit -am "feat(core): add R518 global calibration readiness"
```

---

### Task 5: Determinismo, ordem canônica e firewall de GER

**Files:**
- Modify: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`

- [ ] **Step 1: RED — 100× determinismo**

Para o mesmo dossiê válido, executar 100 vezes e comparar integralmente:

```ts
const expected = buildRealMatchCalibrationEvidenceR518(input);
for (let i = 0; i < 100; i += 1) {
  assert.deepEqual(buildRealMatchCalibrationEvidenceR518(input), expected);
}
```

- [ ] **Step 2: RED — shuffle**

Embaralhar records/contextos/candidatos e exigir mesmo `status`, `fingerprint`, coverage e primitive candidates.

- [ ] **Step 3: RED — independência de card GER/Overall**

Alterar somente campos de rating agregado da carta em fixtures/contexto externo, mantendo evidência real idêntica; resultado/fingerprint R518 deve permanecer idêntico.

Não confundir isso com `MatchValidationRecord.overallRating`, que é observação de desempenho de partida usada pelos módulos existentes.

- [ ] **Step 4: implementar canonical serializer/hash**

- ordenar keys de objetos relevantes;
- ordenar contextos por contextKey;
- ordenar actions/candidates por `action`;
- ordenar evidence IDs;
- arredondar números antes do payload do fingerprint;
- nunca usar `Date.now()`, random, insertion order ou timestamp de execução.

- [ ] **Step 5: GREEN e source firewall**

Adicionar teste estrutural que rejeita uso de card `overall`, `maxOverall`, `GER` no módulo R518, permitindo somente tipos/nomes estritamente necessários quando inevitáveis.

- [ ] **Step 6: commit**

```bash
git commit -am "test(core): harden R518 determinism and GER firewall"
```

---

### Task 6: Provar firewall R510/R517 e ausência de segundo writer

**Files:**
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`
- Modify only if required by type exposure: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`

- [ ] **Step 1: snapshots antes/depois**

Assertar byte-for-byte:

```ts
GAMEPLAY_ENGINE_R510_SEED_POLICY
GAMEPLAY_ENGINE_R510_CALIBRATION
```

antes/depois de construir dossiês `READY_FOR_REVIEW` e `READY_FOR_R510_PROMOTION`.

- [ ] **Step 2: R517 continua fail-closed**

Construir evidência R518 totalmente pronta e depois executar R517 com evidência estrutural válida. Enquanto `R510_CALIBRATION.certifiedForFinalWrite === false`:

- R517 não pode retornar `ENGINE_CERTIFIED`;
- blocker `R510_CALIBRATION_NOT_CERTIFIED` permanece.

- [ ] **Step 3: scan de imports proibidos**

O source R518 não pode importar/chamar writers, production orchestrator, joint optimizer para escrita, training writer, recommendation writer ou persistência de ficha.

- [ ] **Step 4: GREEN R517 + R518**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r518-real-match-calibration-evidence-regression.ts
```

- [ ] **Step 5: commit**

```bash
git commit -am "test(core): enforce R518 certification firewall"
```

---

### Task 7: Adaptador de evidência persistida e fachada pública read-only

**Files:**
- Modify: `src/modules/analysis/realMatchCalibrationEvidenceR518.ts`
- Modify: `src/modules/analysis/index.ts`
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts`
- Read/consume: `src/modules/matches/matchValidationRepositoryR137.ts`

- [ ] **Step 1: RED — origem operacional explícita**

Testar duas entradas logicamente iguais:

- `TEST_FIXTURE` não pode produzir readiness operacional;
- wrapper que lê R137 e marca a fonte como `PERSISTED_REAL` pode produzir readiness se todos os gates forem reais e suficientes;
- `UNKNOWN` falha fechado.

Não alterar schema global de `MatchValidationRecord` nesta v1, salvo impossibilidade técnica demonstrada.

- [ ] **Step 2: implementar wrapper fino**

A função pura continua recebendo origem explícita. Criar wrapper operacional que:

1. chama `readMatchValidationRepositoryR137()`;
2. deriva/recebe os resultados R460/R470/R472 já existentes necessários;
3. marca apenas dados realmente lidos do repository como `PERSISTED_REAL`;
4. chama o evaluator puro;
5. não persiste nada.

Se a derivação exigir contexto que o wrapper não pode obter com segurança, retornar fail-closed em vez de inventar.

- [ ] **Step 3: exportar pela fachada**

Adicionar em `src/modules/analysis/index.ts` somente exports read-only necessários:

- versão;
- builder/evaluator;
- tipos públicos mínimos.

- [ ] **Step 4: teste da fachada**

Seguir padrão R517: `import * as analysisFacade` e comprovar função/version exportadas, authority read-only e ausência de writer.

- [ ] **Step 5: commit**

```bash
git add src/modules/analysis/index.ts src/modules/analysis/realMatchCalibrationEvidenceR518.ts tests/v40-80-r518-real-match-calibration-evidence-regression.ts
git commit -m "feat(core): expose persisted-real R518 evidence facade"
```

---

### Task 8: Integrar R518 à suíte v40.80 sem criar CI paralelo

**Files:**
- Modify: regression/gate v40.80 que atualmente encadeia R517/R516, após confirmar o arquivo exato na árvore da branch.
- Modify: `package.json` somente se o padrão atual exigir um script explícito para R518; não criar script redundante se `test:v4080` já descobre/encadeia o gate.
- Modify: `tests/v40-80-r518-real-match-calibration-evidence-regression.ts` apenas para integração, não para afrouxar asserts.

- [ ] **Step 1: descobrir e registrar o ponto de encadeamento vigente**

Usar a suíte existente em vez de inventar um “R419 novo”. O gate deve continuar terminando em `npm run test:v4080`.

- [ ] **Step 2: RED do gate agregado**

Encadear R518 e executar:

```bash
npm run test:v4080
```

Se RED, corrigir a causa; não remover o novo gate.

- [ ] **Step 3: TypeScript e auditoria**

```bash
npm run typecheck
npm run quality:audit
```

Expected: PASS.

- [ ] **Step 4: regressões focadas novamente**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r516-real-match-calibration-bridge-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r518-real-match-calibration-evidence-regression.ts
```

Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add package.json tests src/modules/analysis
git commit -m "test(core): gate R518 in v40.80 regression suite"
```

---

### Task 9: Verificação completa de produção e CI

**Files:**
- No intentional feature changes. Correções somente se um gate revelar causa raiz real.

- [ ] **Step 1: executar preflight local disponível**

```bash
npm run ci:preflight
npm run typecheck
npm run test:v4080
npm run quality:audit
npm run build
```

Se o fluxo Android vigente exigir validação adicional no CI, não substituí-la por um atalho local.

- [ ] **Step 2: revisão estrutural final**

Confirmar no diff:

- nenhum `certifiedForFinalWrite:true` introduzido;
- nenhum writer novo;
- nenhum auto-apply;
- nenhum uso de card GER/Overall na decisão R518;
- nenhum relaxamento de gate para obter GREEN;
- nenhuma alteração não relacionada;
- R510/R517 continuam semanticamente fail-closed.

- [ ] **Step 3: abrir PR R518**

Título sugerido:

`Fase 10+: R518 Real Match Calibration Evidence`

No corpo, declarar explicitamente:

- R518 pode provar readiness de evidência;
- este PR **não** promove R510;
- GREEN **não** equivale a ENGINE_CERTIFIED;
- promoção R510 futura exige change-set separado + revisão humana.

- [ ] **Step 4: acompanhar GitHub Actions até estado terminal**

Para qualquer RED:

1. obter job/step e mensagem exata;
2. reproduzir ou isolar o menor teste possível;
3. formular causa raiz;
4. corrigir a causa, não o sintoma;
5. rerodar foco + suíte relevante;
6. commitar correção isolada;
7. acompanhar novo run.

Nunca trocar flags de certificação, remover asserts ou ampliar orçamento estrutural apenas para conseguir GREEN.

- [ ] **Step 5: GREEN final e revisão do PR**

Somente declarar a implementação concluída quando o commit HEAD do PR tiver:

- regressões R516/R517/R518 GREEN;
- `test:v4080` GREEN;
- TypeScript GREEN;
- audit GREEN;
- production build GREEN;
- Actions do PR GREEN.

- [ ] **Step 6: merge somente após GREEN**

Após merge, registrar a main resultante e manter R510 como não certificada até um futuro change-set explícito de promoção com evidência R518 real.

---

## Expected end state

Ao final deste plano:

- R516 terá uma implementação runtime reutilizável, mas read-only e equivalente ao contrato previamente testado;
- R518 terá um dossiê determinístico de evidência real, com origem explícita e fail-closed;
- um contexto forte poderá atingir `READY_FOR_REVIEW`;
- somente cobertura global suficiente poderá atingir `READY_FOR_R510_PROMOTION`;
- esse estado continuará sem autorização de escrita/certificação;
- R510 continuará intocada neste PR;
- R517 continuará bloqueando `ENGINE_CERTIFIED` enquanto a R510 oficial não for promovida por change-set separado;
- GER/Overall da carta continuará fora da decisão;
- synthetic/golden continuará útil para regressão, mas incapaz de substituir evidência real persistida;
- o projeto continuará com uma única autoridade de produção e sem segundo writer.
