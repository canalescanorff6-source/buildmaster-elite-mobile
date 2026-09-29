# R518 — Real Match Calibration Evidence — Design

**Data:** 2026-09-29  
**Projeto:** BuildMaster Elite Tático  
**Base:** `main` em `397051588fb0f70e52b0718f93242950c8046206`  
**Branch:** `feature/r518-real-match-calibration-evidence`  
**Status:** aguardando revisão final do usuário antes do plano de implementação  
**Objetivo:** transformar a evidência de partidas reais já produzida por R460/R470/R472/R516 em um dossiê determinístico, auditável e fail-closed que diga se existe base suficiente para uma futura promoção explícita da calibração R510, sem alterar automaticamente o motor, a ficha, Top 5, Ímpeto ou qualquer autoridade de produção.

---

## 1. Problema

A Fase 10 deixou a R517 deliberadamente travada e read-only enquanto a R510 permanece sem certificação real para escrita final. O projeto já possui os blocos necessários para observar desempenho real:

- R460 mede diferença entre promessa estrutural e desempenho observado;
- R470 transforma evidência forte em proposta, sem mutação automática;
- R472 controla lifecycle Experimental → Candidate e exige revisão humana;
- R516 prova a tradução das lacunas R460 para os primitivos da R510, ainda como contrato test-only;
- R517 respeita o estado de certificação da R510 e não pode inventar autoridade.

O que falta é uma camada única que agregue essas provas e responda, de forma reproduzível, se a evidência real é insuficiente, ainda está sendo coletada, está pronta para revisão ou já sustentaria uma promoção explícita da calibração R510.

A R518 resolve essa lacuna sem criar um segundo motor.

---

## 2. Decisão de produto

A R518 v1 será **read-only, determinística e fail-closed**.

Pode:

- ler partidas reais já registradas;
- ler o resultado agregado da R460;
- ler a proposta e o drift da R470;
- ler o lifecycle da R472;
- traduzir evidência R460 para primitivos R510 usando o contrato R516;
- medir cobertura, qualidade e diversidade da evidência;
- produzir um fingerprint estável do dossiê;
- dizer quais gates passaram e quais ainda faltam;
- declarar que a evidência está pronta para revisão/promoção explícita.

Não pode:

- mudar `GAMEPLAY_ENGINE_R510_SEED_POLICY`;
- mudar `GAMEPLAY_ENGINE_R510_CALIBRATION`;
- marcar `certifiedForFinalWrite=true`;
- aplicar multiplicadores automaticamente;
- gravar ficha final;
- alterar treino, Top 5, habilidades adicionais ou Ímpeto;
- alterar posição final, função ou estilo oficial;
- usar GER/Overall como evidência de calibração;
- aceitar testes golden/sintéticos como substituto de partidas reais;
- promover Production sem revisão humana e regressão completa.

---

## 3. Arquitetura de autoridade

A autoridade oficial permanece:

```text
Carta / leitura
  ↓
pipeline oficial
  ↓
Clean Slate / treino
  ↓
R126
  ↓
R128
  ↓
ficha final
```

A cadeia de aprendizado real permanece paralela e read-only:

```text
Partidas reais
  ↓
R460 — Build Outcome Calibration
  ↓
R470 — Intelligent Learning
  ↓
R472 — Motor Lab Lifecycle
  ↓
R516 — tradução explícita para primitivos R510
  ↓
R518 — Real Match Calibration Evidence Dossier
  ↓
revisão humana
  ↓
[futura mudança explícita da calibração R510]
```

R517 continua apenas consumindo o estado oficial de certificação da R510. R518 não pode escrever esse estado por conta própria.

---

## 4. R516 deixa de ser lógica duplicada de teste

Hoje o contrato R516 existe dentro do teste de regressão. Para R518 consumir a mesma tradução sem duplicar regras, a implementação deve extrair a lógica pura para um módulo read-only, mantendo exatamente os invariantes já comprovados.

Módulo proposto:

`src/modules/analysis/gameplayCalibrationBridgeR516.ts`

Responsabilidade única:

- receber `BuildOutcomeCalibrationR460` + `LearningProposalR470`;
- produzir candidatos de primitivos R510;
- preservar teto conservador atual de 6%;
- reportar ações de evidência sem mapeamento;
- nunca escrever em R510;
- nunca aplicar automaticamente candidato.

O teste R516 existente deve passar a importar esse módulo, eliminando a implementação duplicada dentro do teste.

Isso não transforma R516 em writer. Apenas transforma o contrato já testado em biblioteca runtime read-only reutilizável.

---

## 5. Novo módulo R518

Módulo proposto:

`src/modules/analysis/realMatchCalibrationEvidenceR518.ts`

Versão proposta:

`40.80-r518-real-match-calibration-evidence-v1`

### 5.1 Entrada

A R518 recebe somente resultados já existentes:

```ts
{
  outcomeR460,
  learningR470,
  lifecycleR472,
  bridgeR516,
  calibrationR510,
  records
}
```

Ela não recalcula ficha nem cria um algoritmo paralelo de performance.

### 5.2 Saída conceitual

```ts
{
  version,
  status,
  fingerprint,
  authority,
  evidenceSummary,
  qualityGates,
  coverage,
  primitiveCandidates,
  blockers,
  missingRequirements,
  audit
}
```

`authority` é invariável:

```ts
authority: {
  readOnly: true,
  productionWriteAllowed: false,
  automaticApplyAllowed: false,
  canCertifyR510: false,
  humanReviewRequired: true
}
```

---

## 6. Estados R518

Estados permitidos:

### `INSUFFICIENT_EVIDENCE`

Não existe volume mínimo de evidência real utilizável.

### `COLLECTING`

Há evidência válida, porém ainda falta volume, qualidade, cobertura ou diversidade.

### `READY_FOR_REVIEW`

Existe candidato sustentado por evidência forte em pelo menos um contexto funcional, mas ainda não existe cobertura suficiente para tratar a calibração como pronta em nível de engine.

### `READY_FOR_R510_PROMOTION`

O dossiê cumpriu os gates globais definidos nesta especificação e pode ser submetido à revisão humana para uma alteração explícita da R510.

Esse estado **não** equivale a:

- `ENGINE_CERTIFIED`;
- `certifiedForFinalWrite=true`;
- autorização automática de escrita.

### `BLOCKED`

Existe um bloqueador estrutural, como drift, conflito de evidência, lifecycle bloqueado ou dependência incompatível.

---

## 7. Evidência elegível

A R518 não cria uma segunda regra de peso de partida. Ela consome os números já normalizados por R460/R470 e usa os metadados das partidas apenas para auditoria e diversidade.

Um contexto só pode contribuir para promoção quando todos estes pontos forem verdadeiros:

1. R460 está `ACTIVE` ou em estado equivalente que contenha evidência operacional válida;
2. existe pelo menos uma ação `PERSISTENT_GAP` suportada pelo R516;
3. R470 produziu `CALIBRATION_WEIGHT` com `status='PROPOSED'`;
4. `autoPromotionEligible=true` no sentido já existente da R470 — isto significa elegível para revisão, nunca aplicação automática;
5. `learningR470.confidence >= 88`;
6. `learningR470.drift.detected === false`;
7. R472 está `READY_FOR_REVIEW` e `eligibleForReview=true`;
8. o contexto possui pelo menos 8 partidas snapshot compatíveis;
9. existem pelo menos 3 sessões distintas;
10. `stableShare >= 70`;
11. `currentPatchShare >= 80`;
12. a geração atual da ficha não está sendo ensinada por registros de outra geração;
13. o bridge R516 não alterou a seed policy R510 e o candidato permanece read-only.

Os percentuais e contagens acima são gates da R518 v1. Ajustes futuros exigem nova revisão explícita; não podem ser aprendidos silenciosamente.

---

## 8. Compatibilidade obrigatória da evidência

A evidência precisa permanecer compatível com o contexto que a gerou.

A R518 deve respeitar as exclusões já feitas por R460/R470 para:

- carta/fingerprint;
- posição-alvo;
- função de uso;
- geração da ficha R464;
- patch/game version;
- sessão;
- qualidade de conexão/input delay.

Registros incompatíveis podem aparecer na auditoria como excluídos, mas não podem aumentar readiness.

Partidas legacy podem continuar informativas para os módulos existentes, porém não podem sozinhas fechar um gate global R518 quando a evidência atual de geração/patch é insuficiente.

---

## 9. Cobertura funcional

A prontidão de uma ação individual é diferente da prontidão global do engine.

### 9.1 Famílias de primitivos R510

A R518 agrupa os primitivos existentes apenas para medir cobertura, sem alterar o score de nenhum deles:

**Criação/combinação**
- `shortCombination`
- `lineBreakingPass`

**Controle/progressão**
- `firstTouchUnderPressure`
- `centralCarry`
- `pressEscape`

**Ataque/finalização**
- `attackingMovement`
- `finishingAction`

**Duelo/sustentação defensiva**
- `duelShield`
- `defensiveDuel`

**Jogo aéreo**
- `aerialDuel`

Essas famílias existem apenas para cobertura e auditoria; não recebem pesos próprios.

### 9.2 Prontidão local

Um contexto com 8+ partidas fortes e todos os gates de qualidade pode levar a `READY_FOR_REVIEW` para os primitivos que possuem evidência direta/mapeada.

Uma única carta/função nunca libera `READY_FOR_R510_PROMOTION` global.

### 9.3 Prontidão global

Para `READY_FOR_R510_PROMOTION`, a R518 v1 exige cumulativamente:

- pelo menos 24 partidas elegíveis no total;
- pelo menos 6 sessões distintas no total;
- pelo menos 3 contextos independentes, cada um com 8+ partidas elegíveis;
- pelo menos 3 famílias de primitivos cobertas;
- pelo menos 3 funções/posições de uso distintas entre os contextos;
- nenhum contexto com drift ativo;
- nenhum lifecycle R472 bloqueado entre os contextos usados;
- nenhum candidato R516 fora do teto conservador;
- nenhuma mutação da seed/calibração R510 durante a derivação.

A intenção é impedir que um comportamento observado em uma única carta, posição ou função seja promovido como verdade global do motor.

---

## 10. Golden/sintético não certifica engine

Dados sintéticos continuam permitidos para:

- testes unitários;
- regressão;
- golden cards;
- determinismo;
- simulação de bloqueios.

Mas devem carregar origem de teste e não contam para o dossiê real de promoção.

Regra de regressão obrigatória:

> um conjunto 100% sintético pode fazer todos os testes de software passarem, mas o status operacional da R518 deve continuar `INSUFFICIENT_EVIDENCE` ou `COLLECTING` quando não houver evidência real persistida.

---

## 11. GER/Overall é irrelevante

Overall/GER não pode:

- aumentar confiança R518;
- satisfazer gate de cobertura;
- alterar multiplicador candidato;
- desempatar readiness;
- mudar status;
- justificar promoção.

Teste obrigatório: modificar somente Overall/GER, mantendo toda a evidência real idêntica, deve produzir o mesmo fingerprint e o mesmo status R518.

---

## 12. Determinismo

A R518 deve ser totalmente determinística.

Regras:

- ordenar registros por chave canônica antes de serializar;
- ordenar candidatos por `action`;
- ordenar IDs de evidência;
- não usar `Date.now()` no fingerprint;
- não usar ordem de chegada como sinal;
- arredondar números antes de compor o fingerprint;
- hash derivado somente de inputs normalizados relevantes.

Gate obrigatório:

- executar 100 vezes o mesmo input deve produzir o mesmo `status`, o mesmo `fingerprint`, a mesma cobertura e os mesmos candidatos;
- embaralhar a ordem das partidas deve produzir exatamente o mesmo resultado.

---

## 13. Conflitos e fail-closed

R518 bloqueia promoção quando:

- R470 detecta drift;
- R472 retorna `BLOCKED`;
- a R510 alvo não corresponde à versão esperada;
- R516 reporta candidato fora dos limites permitidos;
- há evidência usada para o dossiê cuja geração não corresponde à geração atual;
- dados obrigatórios do contexto estão ausentes;
- um gate estrutural não consegue ser avaliado com segurança.

Na dúvida, o resultado é `COLLECTING` ou `BLOCKED`, nunca promoção otimista.

---

## 14. Relação com R510 e R517

A R518 não altera estas invariantes:

```ts
GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite === false
```

até que exista uma mudança posterior, explícita, revisada e testada especificamente para promover a calibração.

Enquanto isso:

- R510 continua com o estado atual;
- R517 continua fail-closed;
- nenhuma ficha final ganha autoridade nova por causa da R518.

Uma futura promoção deverá ser um change-set separado, com diff de calibração legível, evidência R518 anexada, regressão completa e aprovação humana.

---

## 15. Testes obrigatórios

### 15.1 R516 extraído

- teste atual R516 continua passando;
- mesmos candidatos para o mesmo input;
- teto de 6% preservado;
- seed R510 permanece byte-for-byte equivalente após derivação;
- ação sem mapeamento permanece reportada, nunca inventada.

### 15.2 Sem evidência real

- zero partidas reais → `INSUFFICIENT_EVIDENCE`;
- golden/sintético sozinho não promove.

### 15.3 Volume insuficiente

- 7 partidas fortes no contexto → não passa gate de 8;
- 8 partidas fortes em uma única função → no máximo `READY_FOR_REVIEW` local;
- uma única carta nunca libera promoção global.

### 15.4 Evidência forte

- 8+ partidas, 3+ sessões, patch/estabilidade/confiança válidos → contexto local elegível;
- 3 contextos independentes, 24+ partidas, 6+ sessões e 3+ famílias → pode atingir `READY_FOR_R510_PROMOTION` se nenhum bloqueador existir.

### 15.5 Isolamento

- geração R464 diferente não aumenta readiness;
- função diferente não ensina o contexto atual;
- posição diferente não ensina o contexto atual;
- patch antigo não pode fechar sozinho o gate atual.

### 15.6 Drift/bloqueio

- drift ativo → `BLOCKED`;
- R472 bloqueado → `BLOCKED`;
- dependência/version mismatch → `BLOCKED`.

### 15.7 Determinismo

- 100/100 execuções idênticas;
- ordem de input embaralhada não altera resultado;
- Overall/GER alterado isoladamente não altera resultado.

### 15.8 Não mutação

Antes/depois da avaliação:

- R510 seed igual;
- R510 calibration igual;
- ficha igual;
- treino igual;
- skills iguais;
- Ímpeto igual.

---

## 16. Integração e exposição

R518 deve ser inicialmente infraestrutura interna e auditável.

Não é necessário criar nova tela de usuário na v1.

A saída pode ser anexada ao resultado técnico apenas quando isso não alterar contratos públicos existentes, ou ficar disponível por função pura usada pelos testes/lab. Qualquer UI de "certificação" fica fora deste escopo para evitar apresentar readiness experimental como verdade de produção.

---

## 17. CI e aceite

A implementação só é considerada concluída quando:

1. novos testes R516/R518 passam;
2. regressões R460, R470, R472, R510 e R517 passam;
3. typecheck passa;
4. build passa;
5. testes de invariantes de autoridade passam;
6. determinismo 100/100 passa;
7. nenhuma seed/calibração R510 é alterada implicitamente;
8. CI do PR fica green.

Mesmo com CI green, R510 permanece não certificada até uma etapa posterior explicitamente dedicada a essa promoção.

---

## 18. Fora do escopo da R518 v1

- auto-tuning em produção;
- alteração automática de pesos R510;
- treinamento ML externo;
- API paga;
- reescrita automática de ficha;
- mudança de skills/Ímpeto por telemetria;
- promoção automática de Experimental para Production;
- UI pública de selo `ENGINE_CERTIFIED`;
- certificação baseada somente em golden cards.

---

## 19. Critério final de sucesso

A R518 está correta quando o BuildMaster consegue responder, com a mesma saída para a mesma evidência:

> "Existe evidência real, diversa e atual suficiente para levar esta calibração da R510 à revisão humana?"

sem responder uma pergunta diferente:

> "Devemos aplicar automaticamente esta calibração?"

A primeira pergunta pertence à R518. A segunda continua exigindo uma mudança futura, explícita e humana.