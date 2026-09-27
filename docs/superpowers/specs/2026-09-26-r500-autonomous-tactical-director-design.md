# R500 Autonomous Tactical Director — Design

## Objetivo

Adicionar ao BuildMaster Elite Tático uma camada de coordenação tática que transforme as decisões e evidências já produzidas pelos motores existentes em um **plano de ação tático único, contextual, rastreável e read-only**.

O R500 não substitui os motores anteriores e não cria uma segunda autoridade de ficha. Ele coordena:

- `R128`: decisão oficial soberana;
- `R480 Tactical Twin`: estrutura e cenários táticos;
- `R481 Squad Brain`: elenco, cobertura, núcleo e rotações;
- `R482 Match Vision`: evidência real confirmada de partida;
- `R483 Build Simulator`: alternativas read-only de ficha;
- `R484 Chemistry Graph`: química coletiva e impacto de rotações;
- `R489 Explainable AI`: explicação auditável das decisões e evidências;
- `Pro Meta Evidence`: padrões competitivos externos, verificados, versionados por patch e plataforma.

A saída do R500 é um **plano recomendado**, nunca uma alteração automática.

A autoridade final permanece:

```text
R119 → R126 → R128 = decisão oficial
R480–R484 = evidência especializada
R489 = explicabilidade
R500 = coordenação tática e recomendação
usuário = decisão final
```

## Princípios obrigatórios

1. **Local e determinístico no runtime.** A geração do plano não depende de rede, LLM remoto ou API paga.
2. **Read-only.** O R500 não escreve ficha, PP, skills, Ímpeto, posição, escalação, Vault ou marcadores de partida.
3. **Sem Overall/GER como objetivo.** Overall pode existir visualmente no restante do app, mas não participa do objetivo ou desempate do R500.
4. **Sem evidência inventada.** Fonte ausente continua ausente.
5. **Sem dupla contagem.** R480, R481 e R484 formam uma família estrutural correlacionada.
6. **Patch-aware e platform-aware.** Evidência profissional precisa estar ligada à versão do jogo e à plataforma.
7. **Evidência pessoal tem prioridade contextual.** Pro Meta complementa; não substitui evidência real do usuário.
8. **R489 explica; não aumenta confiança.** Explicabilidade não é nova evidência.
9. **Mudanças estáveis.** O plano não troca por diferença marginal sem evidência material.
10. **Degradação segura.** Incompatibilidades reduzem ou bloqueiam evidências; nunca são corrigidas silenciosamente.

## Escopo da v1

O R500 v1 cobre quatro capacidades:

1. **Pré-jogo** — plano principal, prioridades, riscos, jogadores-chave e contingências.
2. **Durante a partida** — respostas condicionais preparadas para cenários reais do R480, sem fingir telemetria ao vivo inexistente.
3. **Pós-jogo** — auditoria entre plano recomendado e evidência confirmada do R482.
4. **Memória tática derivada** — tendências reconstruídas a partir de registros confirmados já existentes, sem novo banco paralelo.

Também entra na v1 a **Pro Meta Evidence Layer**, mas apenas como dataset curado, versionado e embarcado no app.

Fora da v1:

- crawler/scraper automático de torneios;
- ingestão automática de YouTube em produção;
- LLM obrigatório no runtime;
- treinamento online/autônomo do motor;
- alteração automática de formação ou escalação;
- persistência de uma segunda “memória de IA”;
- previsão de resultado da partida;
- afirmações de que uma tática “sempre funciona”.

## Arquitetura

```text
                         R128
                          │
                   DECISÃO OFICIAL
                          │
        ┌─────────────────┼────────────────┐
        │                 │                │
       R480              R482             R483
    Tactical Twin    Match Evidence       Builds
        │
       R481
    Squad Brain
        │
       R484
     Chemistry
        │
        │        PRO META EVIDENCE
        │        ├─ torneios oficiais
        │        ├─ club events
        │        ├─ FIFAe / seleções
        │        ├─ conteúdo verificável de pros
        │        └─ referências de patch
        │               │
        └───────────────┬┘
                        │
                       R500
               AUTONOMOUS TACTICAL
                     DIRECTOR
                        │
          ┌─────────────┼─────────────┐
       Pré-jogo       Durante       Pós-jogo
          │             │              │
       Plano         Cenários       Auditoria
                        │
                     R489
                 EXPLICABILIDADE
```

## Contrato público proposto

```ts
export type TacticalDirectorAvailabilityR500 =
  | 'READY'
  | 'PARTIAL'
  | 'INSUFFICIENT'
  | 'BLOCKED';

export type TacticalDirectorConflictLevelR500 =
  | 'NONE'
  | 'LOW'
  | 'MATERIAL'
  | 'BLOCKING';

export type TacticalDirectorPhaseR500 =
  | 'PRE_MATCH'
  | 'IN_MATCH_PREPARED'
  | 'POST_MATCH';

export type TacticalDirectorScenarioR500 =
  | 'base'
  | 'pressao'
  | 'proteger'
  | 'buscar';

export type TacticalDirectorConfidenceR500 = {
  planConfidence: number;
  evidenceConfidence: number;
  executionConfidence: number;
};

export type TacticalDirectorPlanR500 = {
  version: string;
  availability: TacticalDirectorAvailabilityR500;
  phase: TacticalDirectorPhaseR500;
  contextFingerprint: string;
  planFingerprint: string;
  scenario: TacticalDirectorScenarioR500;
  title: string;
  summary: string;
  priorities: string[];
  risks: string[];
  recommendedActions: TacticalDirectorActionR500[];
  contingencies: TacticalDirectorContingencyR500[];
  conflicts: TacticalDirectorConflictR500[];
  confidence: TacticalDirectorConfidenceR500;
  evidence: TacticalDirectorEvidenceR500[];
  proMeta: TacticalDirectorProMetaSummaryR500;
  memory: TacticalDirectorMemoryR500;
  explanations: TacticalDirectorExplanationLinkR500[];
  limitations: string[];
  authority: TacticalDirectorAuthorityR500;
  guardrails: string[];
};
```

Entrada conceitual:

```ts
export type TacticalDirectorInputR500 = {
  officialDecisionFingerprint: string;
  formation: string;
  teamStyle: TacticalStyle;
  tacticalTwin?: TacticalTwinSnapshotR480 | null;
  squadBrain?: SquadBrainSnapshotR481 | null;
  matchVision?: MatchVisionSnapshotR482 | null;
  buildSimulator?: BuildSimulatorSnapshotR483 | null;
  chemistry?: ChemistryGraphSnapshotR484 | null;
  explanations?: ExplainableDecisionR489[];
  confirmedMatchRecords: MatchValidationRecord[];
  proMetaDataset?: ProMetaDatasetR500 | null;
  currentScenario?: TacticalDirectorScenarioR500;
  previousPlan?: TacticalDirectorPlanR500 | null;
};

export function buildAutonomousTacticalDirectorR500(
  input: TacticalDirectorInputR500
): TacticalDirectorPlanR500;
```

## Authority

```ts
export type TacticalDirectorAuthorityR500 = {
  readOnly: true;
  canWriteTraining: false;
  canWriteSkills: false;
  canWriteImpetus: false;
  canChangePosition: false;
  canChangeLineupAutomatically: false;
  canConfirmMatchMarkersAutomatically: false;
  canWriteVault: false;
  canPersistTacticalMemory: false;
  canOverrideR119: false;
  canOverrideR126: false;
  canOverrideR128: false;
  optimizeOverall: false;
};
```

O R500 pode recomendar:

- cenário tático;
- prioridade por setor;
- redução/aumento de risco;
- rotação já existente no R481;
- manutenção de função;
- mudança de comportamento já sustentada por evidência;
- sequência de contingências;
- adaptação de um padrão Pro Meta ao elenco atual.

O R500 não pode executar essas mudanças automaticamente.

## Context fingerprint

O contexto deve separar claramente estados táticos distintos.

O fingerprint mínimo inclui:

- formação;
- estilo tático;
- slots dos titulares;
- fingerprint exato de cada carta titular;
- identidade oficial relevante;
- versão do contrato R500.

Exemplo conceitual:

```text
R500CTX:4-2-2-2:POSSE_DE_BOLA:GK=<fp>|CB1=<fp>|CB2=<fp>|...
```

Regras:

- jogadores com mesmo nome mas cartas diferentes não podem colidir;
- ordem deve ser estável por slot, não por ordem incidental de arrays;
- ausência de um slot precisa aparecer explicitamente no fingerprint;
- `AUTO` é um contexto diferente de um estilo confirmado;
- nenhuma informação temporal aleatória participa do fingerprint.

## Plan fingerprint

O plano adiciona ao contexto:

- cenário selecionado;
- versões de R480–R489 consumidas;
- ids/fingerprints das evidências efetivamente utilizadas;
- versão e digest do dataset Pro Meta aplicável;
- fingerprint do plano anterior quando a histerese é avaliada.

Mesma entrada deve produzir exatamente o mesmo `planFingerprint`.

É proibido usar:

- `Date.now()`;
- `Math.random()`;
- UUID aleatório;
- ordem não determinística de `Map`/objetos sem normalização;
- estado global oculto.

## Validação de coerência

Antes de gerar recomendações fortes, o R500 verifica:

1. formação R480 compatível com o contexto atual;
2. formação R484 compatível com o contexto atual;
3. estilo R480 compatível com o contexto atual;
4. estilo R484 compatível com o contexto atual;
5. R482 pertence ao contexto relevante quando usado para comparação contextual;
6. fingerprints das cartas ainda representam os titulares atuais;
7. baseline R483 corresponde à decisão oficial quando R483 participa;
8. explicações R489 pertencem às decisões/evidências realmente consumidas;
9. dataset Pro Meta possui patch/plataforma compatíveis ou transferibilidade explicitamente reduzida.

Incompatibilidade importante nunca é corrigida por inferência. A fonte é degradada ou bloqueada.

## Estados de disponibilidade

### READY

Contexto coerente, estrutura válida e evidência suficiente para recomendação forte.

### PARTIAL

Plano utilizável, mas existe ausência ou limitação relevante. O plano deve expor essa limitação.

### INSUFFICIENT

Não há base suficiente para recomendação forte. O R500 pode devolver orientações conservadoras e fatos disponíveis, mas não deve fabricar confiança.

### BLOCKED

Existe conflito estrutural/fingerprint que torna inseguro combinar fontes. Evidências incompatíveis ficam fora do cálculo.

## Evidências e famílias

```ts
export type TacticalDirectorEvidenceFamilyR500 =
  | 'OFFICIAL_CONTEXT'
  | 'STRUCTURAL_TEAM'
  | 'MATCH_CONFIRMED'
  | 'BUILD_ALTERNATIVE'
  | 'PRO_META';

export type TacticalDirectorEvidenceR500 = {
  id: string;
  family: TacticalDirectorEvidenceFamilyR500;
  source: 'R128' | 'R480' | 'R481' | 'R482' | 'R483' | 'R484' | 'PRO_META';
  claim: string;
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  contextCompatibility: number;
  effectiveWeight: number;
  fingerprint: string;
};
```

R489 não aparece como evidência porque explica, mas não aumenta confiança.

## Anti-dupla-contagem

Dependência estrutural:

```text
R480
  └─ R481
       └─ R484
```

Portanto R480 + R481 + R484 formam a família `STRUCTURAL_TEAM`.

Regras:

- R480 pode ser base estrutural principal;
- R481 adiciona informação exclusiva de cobertura/rotação, mas não duplica a mesma afirmação de R480;
- R484 adiciona links/química exclusivos, mas impactos derivados de uma rotação R481 têm independência reduzida;
- R482 confirmado é família independente de evidência real de partida;
- R483 é independente apenas para comparação de build quando aplicável;
- Pro Meta é uma família externa independente, porém sofre penalidade de compatibilidade de patch/plataforma/contexto;
- R489 nunca adiciona uma nova família.

## Confiança

O R500 publica três confianças separadas.

### Plan Confidence

Quão sólida é a escolha do plano atual.

Pesos máximos da v1:

- estrutura própria (`R480 + R481 + R484`): até 35%;
- partidas pessoais confirmadas (`R482`/registros): até 30%;
- Pro Meta compatível: até 20%;
- integridade/coerência contextual: até 10%;
- R483, quando realmente aplicável: até 5%.

Esses são tetos, não pesos obrigatórios. Fonte indisponível não é substituída artificialmente.

### Evidence Confidence

Mede a força da base observacional:

- quantidade de partidas confirmadas;
- cobertura de titulares;
- consistência contextual;
- diversidade de famílias independentes;
- qualidade e atualidade de Pro Meta;
- ausência/presença de contradições.

### Execution Confidence

Mede quão preparado o elenco está para executar o plano:

- cobertura R481;
- readiness de rotações;
- química R484;
- confiança/estado das cartas do contexto;
- disponibilidade de funções necessárias ao plano.

Não é previsão de placar ou vitória.

## Caps de confiança

Para reduzir falsa precisão:

- sem evidência real compatível de partida: `planConfidence <= 65`;
- estrutura + evidência de partida válida: pode chegar a `85`;
- acima de `85` exige múltiplas famílias independentes, contexto coerente e histórico consistente;
- Pro Meta sozinho nunca permite ultrapassar `65`;
- `AUTO` reduz teto de confiança contextual;
- conflito `MATERIAL` aplica penalidade explícita;
- conflito `BLOCKING` exclui a fonte incompatível e pode levar a `BLOCKED`.

## Conflitos

```ts
export type TacticalDirectorConflictR500 = {
  id: string;
  level: TacticalDirectorConflictLevelR500;
  title: string;
  description: string;
  sourceIds: string[];
  penalty: number;
};
```

### NONE

Fontes compatíveis ou diferenças irrelevantes.

### LOW

Divergência pequena que não muda o plano.

### MATERIAL

Divergência capaz de mudar prioridade, risco ou rotação; deve aparecer na UI.

Exemplos:

- R481 favorece uma reserva, mas R484 registra perda química relevante;
- R480 considera estrutura segura, mas R482 mostra padrão recorrente de turnover/late recomposition.

### BLOCKING

Fonte não pode ser combinada com o contexto atual.

Exemplos:

- evidência de formação diferente;
- fingerprint de carta incompatível;
- baseline R483 incompatível;
- dataset Pro Meta marcado como outra plataforma/patch sem regra de transferibilidade adequada.

## Estabilidade e histerese

O R500 não muda o plano principal por diferença marginal.

### Promoção normal

Uma alternativa precisa superar o plano atual em pelo menos **8 pontos efetivos**.

### Exceções válidas

A histerese pode ser quebrada quando:

- o usuário muda explicitamente o cenário (`base`, `pressao`, `proteger`, `buscar`);
- aparece conflito `BLOCKING`;
- R482 confirma risco crítico recorrente;
- o contexto muda por formação, estilo ou carta titular;
- nova evidência independente e material invalida a premissa do plano anterior.

Diferença de `+1` ou `+2` sem nova evidência não promove alternativa.

## Ciclo pré-jogo

O plano pré-jogo inclui:

- plano principal;
- cenário base;
- prioridade de setor;
- principal risco;
- jogadores-chave;
- cobertura crítica;
- rotações preparadas;
- contingências `pressao`, `proteger` e `buscar`;
- compatibilidade com Pro Meta;
- três níveis de confiança;
- limitações.

O usuário deve conseguir ver a recomendação principal sem abrir detalhes técnicos.

## Durante a partida

O v1 usa **modo preparado**, não telemetria falsa.

O usuário pode selecionar uma situação:

- sob pressão;
- vencendo/proteger;
- perdendo/buscar;
- saída bloqueada;
- risco de contra-ataque;
- dificuldade de progressão;
- necessidade de segurança/controle.

O R500 responde apenas com cenários e rotações sustentados pelos snapshots existentes.

Se houver integração real futura com telemetria, isso será outro projeto/versão.

## Pós-jogo

O R500 compara:

1. plano recomendado antes da partida;
2. contexto realmente utilizado;
3. eventos confirmados do R482;
4. padrões recorrentes;
5. resultado estrutural observado.

O pós-jogo deve distinguir:

- **plano inadequado**;
- **plano adequado com execução fraca**;
- **plano validado pela evidência**;
- **evidência insuficiente**.

Não conclui causalidade quando a amostra não permite.

## Memória tática derivada

A v1 não cria novo banco de memória.

`TacticalDirectorMemoryR500` é reconstruído a partir dos registros confirmados já existentes.

```ts
export type TacticalMemoryStateR500 =
  | 'SEM_EVIDENCIA'
  | 'EM_OBSERVACAO'
  | 'TENDENCIA'
  | 'CONFIRMADO';

export type TacticalDirectorMemoryR500 = {
  state: TacticalMemoryStateR500;
  compatibleMatches: number;
  recurringStrengths: TacticalMemoryPatternR500[];
  recurringRisks: TacticalMemoryPatternR500[];
  validatedScenarios: TacticalMemoryScenarioR500[];
  confidence: number;
  limitations: string[];
};
```

Regras iniciais:

- `SEM_EVIDENCIA`: 0 partidas compatíveis;
- `EM_OBSERVACAO`: 1–2 partidas;
- `TENDENCIA`: 3–5 partidas e padrão presente em pelo menos 60%;
- `CONFIRMADO`: 6+ partidas e padrão presente em pelo menos 70%.

Restrições:

- uma partida nunca gera `CONFIRMADO`;
- contradição forte reduz estado/confiança;
- `AUTO` não pode chegar diretamente a `CONFIRMADO`;
- suggested markers não contam como fatos;
- somente evidência confirmada pode alimentar padrão;
- mudanças de formação/estilo/cartas criam outro contexto.

## Pro Meta Evidence Layer

### Objetivo

Incorporar padrões competitivos observáveis de jogadores de elite sem transformar opinião de internet em autoridade do motor.

### Dataset da v1

O dataset é curado durante o desenvolvimento/release e embarcado no app.

O runtime não faz scraping nem consulta remota.

```ts
export type ProMetaPlatformR500 = 'MOBILE' | 'CONSOLE';

export type ProMetaSourceTierR500 =
  | 'OFFICIAL_MATCH'
  | 'OFFICIAL_COMPETITION_REPORT'
  | 'VERIFIED_PRO_CONTENT'
  | 'VERIFIED_TOP_RANK'
  | 'COMMUNITY_REFERENCE';

export type ProMetaObservationR500 = {
  id: string;
  playerName: string;
  platform: ProMetaPlatformR500;
  gameVersion: string;
  competition: string;
  eventDate: string;
  stage?: string;
  opponent?: string;
  sourceTier: ProMetaSourceTierR500;
  sourceUrl: string;
  sourceFingerprint: string;
  verified: boolean;
  formation?: string;
  teamStyle?: TacticalStyle;
  scenario?: TacticalDirectorScenarioR500;
  patterns: ProMetaPatternR500[];
  notes: string[];
};

export type ProMetaDatasetR500 = {
  schemaVersion: string;
  gameVersion: string;
  generatedAtBuild: string;
  digest: string;
  observations: ProMetaObservationR500[];
};
```

`generatedAtBuild` pode existir como metadado do dataset, mas nunca participa do fingerprint do plano. O `digest` é calculado sobre conteúdo normalizado.

### Hierarquia de fonte

Pesos máximos de qualidade de origem:

- partida oficial, mesma plataforma e patch: 1.00;
- relatório oficial de competição, mesma plataforma: 0.90;
- conteúdo verificável do próprio pro: até 0.85;
- partida oficial de outra plataforma: até 0.70;
- top rank verificável: até 0.75;
- referência comunitária: até 0.50 e nunca suficiente para recomendação forte sozinha;
- “meta” sem fonte: 0 e não entra no dataset de decisão.

O peso efetivo ainda é multiplicado por compatibilidade de patch, plataforma e contexto.

### Patch awareness

Cada observação declara `gameVersion`.

Quando a versão muda:

- mesma major/minor e sem mudança tática relevante: penalidade pequena ou nenhuma;
- patch com mudanças comprovadas de movimentação/defesa/posicionamento: penalidade maior;
- versão claramente incompatível: evidência histórica permanece consultável, mas não participa de uma recomendação “meta atual”.

A matriz exata de compatibilidade deve ser configurável no dataset/contrato, não codificada por nome de jogador.

### Platform awareness

Mobile e Console são contextos distintos.

- `MOBILE → MOBILE`: compatibilidade máxima quando patch e contexto batem;
- `CONSOLE → MOBILE`: princípios podem transferir, mas peso reduzido;
- nenhuma observação de Console deve ser rotulada como “meta Mobile” sem evidência Mobile.

### Fontes iniciais verificadas para seed

Na elaboração desta spec, foram confirmadas fontes oficiais recentes que justificam o seed inicial e o modelo de versionamento:

1. **eFootball Championship 2026 World Finals** — página oficial registra Rentao como campeão mundial Mobile e FUTEASY_10 como campeão Console, com YASSINE ETTADLAOUI e ETTORITO como finalistas.
2. **CBF / FIFAe Continental Championship 2026 Mobile** — CBF registra Brasil campeão com Juninho e Rentao.
3. **Notas oficiais da v6.0.0** — Konami registra mudanças relevantes em linhas de passe, posicionamento ofensivo, marcação, reação defensiva e comportamento de jogadores, demonstrando que evidência tática precisa ser versionada por patch.

Referências de curadoria:

- https://efootballchampionship.konami.net/news/detail/eFC2026-World-Finals-Results/
- https://www.cbf.com.br/selecao-brasileira/noticias/selecao-brasileira/a/brasil-bate-a-argentina-e-conquista-o-fifae-continental-championship-no-e-football-mobile
- https://www.konami.com/efootball/pt-br/topic/news/5651
- https://www.konami.com/efootball/pt-br/topic/news/5638
- https://www.konami.com/efootball/pt-br/topic/news/5630

Essas referências não transformam nomes específicos em hardcode do motor. Jogadores e competições entram por dataset.

## Pro Meta patterns

O dataset pode registrar apenas padrões observáveis e rastreáveis, por exemplo:

- formação inicial;
- estrutura de progressão;
- uso de largura/centro;
- prioridade de apoio curto;
- comportamento de pressão;
- cobertura defensiva;
- rotações/substituições observadas;
- proteção de vantagem;
- comportamento ao buscar resultado;
- funções recorrentes por setor;
- riscos recorrentes observáveis.

Não registrar como fato:

- intenção psicológica não observável;
- atributo oculto;
- comando não visível sem evidência;
- “melhor formação do mundo”;
- causalidade derivada de uma única partida.

## Compatibilidade Pro Meta com o elenco do usuário

O R500 não copia cegamente uma estrutura profissional.

Ele calcula compatibilidade entre padrão e contexto atual usando:

- formação;
- estilo;
- funções necessárias;
- cobertura do elenco;
- química;
- plataforma;
- patch;
- evidência pessoal.

Saídas possíveis:

- `DIRECT_FIT`: padrão reproduzível com o elenco atual;
- `ADAPT`: princípio útil, mas exige adaptação;
- `LOW_FIT`: incompatibilidade alta;
- `NOT_APPLICABLE`: contexto insuficiente/incompatível.

Um padrão Pro Meta incompatível não reduz a qualidade do time; apenas deixa de ser recomendação direta.

## Pro Player Similarity

Recurso permitido na v1 apenas quando há métricas comparáveis.

Pode comparar:

- tendência de construção;
- centralidade/largura;
- velocidade de progressão;
- tolerância a risco;
- prioridade de cobertura;
- padrões de cenário;
- estruturas de formação.

É proibido preencher métrica inexistente com valor inventado.

Quando a comparação não é válida:

```text
SEM_COMPARACAO_VALIDA
```

A similaridade nunca é prova de superioridade.

## Pro Benchmark

O benchmark compara somente métricas com mesma definição e unidade.

Pode mostrar:

- usuário;
- referência Pro Meta;
- gap;
- confiança da comparação;
- origem da métrica.

Se a mesma métrica não existir nos dois lados, a linha não é exibida.

## Prioridade entre evidência pessoal e Pro Meta

Hierarquia operacional:

1. integridade/autoridade R128;
2. evidência pessoal confirmada e contextual;
3. adequação estrutural do elenco;
4. Pro Meta compatível;
5. referências comunitárias de baixa autoridade.

Exemplo de regra:

Se o padrão profissional favorece A, mas o usuário possui histórico contextual consistente favorecendo B com o próprio elenco, o R500 mantém B e explica que Pro Meta aponta A como alternativa externa.

## Ações e contingências

```ts
export type TacticalDirectorActionR500 = {
  id: string;
  rank: number;
  kind:
    | 'KEEP_STRUCTURE'
    | 'REDUCE_RISK'
    | 'INCREASE_PROGRESSION'
    | 'ROTATION'
    | 'PROTECT_SECTOR'
    | 'PRESERVE_ROLE'
    | 'ADAPT_PRO_PATTERN';
  title: string;
  description: string;
  expectedBenefit: string;
  expectedTradeOff: string | null;
  evidenceIds: string[];
  confidence: number;
};

export type TacticalDirectorContingencyR500 = {
  scenario: TacticalDirectorScenarioR500;
  triggerDescription: string;
  actions: TacticalDirectorActionR500[];
  confidence: number;
};
```

Toda ação forte precisa ter `evidenceIds` válidos.

## R489 no R500

O R500 reutiliza os kinds atuais do R489:

- `TACTICAL`;
- `ROTATION`;
- `MATCH`;
- `BUILD` quando necessário;
- `STARTER` quando necessário.

Não criar `DIRECTOR` no R489 v1.

O R500 agrega links para explicações existentes:

```ts
export type TacticalDirectorExplanationLinkR500 = {
  kind: 'TACTICAL' | 'ROTATION' | 'MATCH' | 'BUILD' | 'STARTER';
  fingerprint: string;
  verdict: string;
};
```

R489 não participa do cálculo de confiança.

## Interface

O R500 não cria uma nova aba global na v1.

Integração principal em **Meu Time / laboratório de equipe**.

### Resumo compacto

Mostrar inicialmente:

- plano atual;
- `planConfidence`;
- prioridade principal;
- maior risco;
- uma recomendação principal;
- botões `Base`, `Sob pressão`, `Proteger`, `Buscar`;
- indicador Pro Meta quando aplicável.

### Plano completo

Seções expansíveis:

1. Antes da partida;
2. Durante;
3. Depois;
4. Evidências;
5. Pro Meta;
6. Por quê? (R489);
7. Limitações.

Detalhes técnicos ficam recolhidos por padrão.

## Linguagem de confiança

O R500 não usa afirmações absolutas como:

- “sempre funciona”;
- “vai ganhar”;
- “100% melhor”.

Usar formulações calibradas:

- “mais consistente com as evidências disponíveis”;
- “tendência favorável neste contexto”;
- “amostra ainda pequena”;
- “padrão profissional compatível, mas não validado no seu elenco”;
- “evidência pessoal diverge da referência profissional”.

## Degradação segura

Falha de uma fonte não derruba todo o R500.

Exemplos:

- sem R482: plano estrutural `PARTIAL`, confiança limitada;
- sem Pro Meta: R500 continua normalmente sem benchmark externo;
- sem R483: apenas ações de build ficam indisponíveis;
- R484 incompatível: excluir química e relatar limitação;
- fingerprint oficial incompatível: `BLOCKED` para a cadeia afetada;
- dataset Pro Meta inválido/digest incorreto: ignorar o dataset inteiro e continuar com fontes internas.

## Dataset integrity

Antes de aceitar `ProMetaDatasetR500`:

- validar schema;
- validar ids únicos;
- validar URLs de fonte não vazias;
- exigir `verified=true` para tiers de alta autoridade entrarem no cálculo;
- validar `gameVersion` e `platform`;
- normalizar ordenação;
- calcular digest determinístico;
- impedir observação sem `sourceFingerprint`;
- impedir peso de decisão para `COMMUNITY_REFERENCE` sem corroborar fonte superior.

## Segurança contra contaminação de meta

1. Nome de pro player nunca vira regra de negócio.
2. Formação de campeão não vira recomendação automática.
3. Popularidade não equivale a eficácia.
4. Um torneio não representa todas as versões do jogo.
5. Console não vira Mobile por aproximação textual.
6. Uma única partida não cria tendência consolidada.
7. Dataset antigo permanece histórico, mas perde peso quando patch muda.
8. Comunidade serve para descoberta/corroboracão, não como autoridade máxima.

## Testes obrigatórios

### Determinismo

1. mesma entrada → mesmo resultado;
2. mesma entrada → mesmo `contextFingerprint`;
3. mesma entrada → mesmo `planFingerprint`;
4. proibir `Date.now()` no cálculo;
5. proibir `Math.random()`;
6. ordenar todas as coleções que entram no fingerprint.

### Autoridade

7. `readOnly === true`;
8. nenhum writer de treino;
9. nenhum writer de skills;
10. nenhum writer de Ímpeto;
11. nenhuma troca automática de posição;
12. nenhuma troca automática de escalação;
13. nenhuma confirmação automática de marker;
14. nenhum writer de Vault;
15. nenhuma persistência de memória R500;
16. nenhum override R119/R126/R128;
17. `optimizeOverall === false`.

### Evidência

18. R480/R481/R484 não contam como três famílias independentes;
19. R489 não aumenta confiança;
20. suggested marker R482 não conta como fato;
21. ausência R482 limita confiança;
22. conflito material reduz confiança;
23. conflito blocking exclui fonte incompatível;
24. fonte ausente não é inferida.

### Contexto

25. formação incompatível degrada/bloqueia evidência;
26. estilo incompatível degrada/bloqueia evidência;
27. carta/fingerprint incompatível bloqueia fonte;
28. R483 baseline incompatível bloqueia comparação de build;
29. `AUTO` reduz teto contextual;
30. mudança de carta cria outro contexto.

### Memória

31. 0 partidas = `SEM_EVIDENCIA`;
32. 1–2 = `EM_OBSERVACAO`;
33. 3–5 + >=60% pode gerar `TENDENCIA`;
34. 6+ + >=70% pode gerar `CONFIRMADO`;
35. uma partida nunca gera `CONFIRMADO`;
36. 3 partidas abaixo de 60% não geram `TENDENCIA`;
37. `AUTO` não gera `CONFIRMADO`;
38. contradição forte reduz confiança/estado.

### Histerese

39. alternativa +2 não substitui plano atual;
40. alternativa +8 pode ser promovida;
41. risco crítico confirmado R482 pode quebrar histerese;
42. mudança explícita de cenário pode quebrar histerese;
43. mudança de contexto invalida plano anterior.

### Pro Meta

44. `OFFICIAL_MATCH`, mesma plataforma/patch, recebe maior teto de qualidade;
45. Console → Mobile sofre penalidade;
46. patch incompatível perde peso;
47. dataset com digest inválido é ignorado;
48. fonte sem URL/fingerprint falha validação;
49. `COMMUNITY_REFERENCE` sozinha não gera recomendação forte;
50. Pro Meta sozinho não supera `planConfidence=65`;
51. evidência pessoal forte pode prevalecer sobre Pro Meta;
52. nome do jogador não altera algoritmo;
53. métrica ausente não é inventada em Similarity/Benchmark;
54. mesma dataset normalizado → mesmo digest;
55. troca da dataset version muda `planFingerprint` quando a evidência Pro Meta é usada.

### Integração e regressão

56. regressões R480 continuam verdes;
57. regressões R481 continuam verdes;
58. regressões R482 continuam verdes;
59. regressões R483 continuam verdes;
60. regressões R484 continuam verdes;
61. regressões R489 continuam verdes;
62. TypeScript verde;
63. build de produção verde;
64. gate preventivo do app verde;
65. UI principal não cria nova aba global;
66. UI funciona sem dataset Pro Meta;
67. UI expõe limitações e conflitos materiais;
68. PR inteiro GREEN antes de merge;
69. merge na `main` somente após validação exata do head;
70. pipeline oficial do APK GREEN;
71. release `Latest` apontando para o SHA novo;
72. APK, signing report e manifest presentes na release.

## Arquivos/módulos previstos

A implementação deve preferir um módulo isolado, por exemplo:

```text
src/modules/tactical-director/
  tacticalDirectorTypesR500.ts
  tacticalDirectorEvidenceR500.ts
  tacticalDirectorContextR500.ts
  tacticalDirectorMemoryR500.ts
  tacticalDirectorProMetaR500.ts
  tacticalDirectorEngineR500.ts
  TacticalDirectorPanelR500.tsx
  pro-meta/
    proMetaSchemaR500.ts
    proMetaDatasetR500.ts
```

Os nomes finais podem ser ajustados ao padrão real do repositório durante o plano, mas as responsabilidades devem permanecer separadas.

## Estratégia de dados Pro Meta na v1

O dataset inicial deve ser pequeno, de alta qualidade e auditável.

Prioridade:

1. partidas oficiais e finais mundiais;
2. competições oficiais Mobile/Console relevantes;
3. fontes oficiais de seleção/club event;
4. conteúdo verificável do próprio jogador profissional;
5. comunidade apenas como pista ou corroboracão.

A v1 não precisa “ter milhares de pros”. Precisa ter **poucas observações confiáveis e uma arquitetura correta para crescer**.

Atualização do dataset acontece junto de versão/release do app até existir projeto específico de ingestão automatizada.

## Critérios de aceitação do produto

O R500 está pronto quando:

- coordena R480–R484 sem reimplementar seus algoritmos;
- preserva autoridade R128;
- usa R489 apenas para explicar;
- distingue confiança de plano/evidência/execução;
- mostra conflitos em vez de escondê-los;
- mantém estabilidade/histerese;
- aprende apenas por memória derivada de evidência confirmada;
- incorpora Pro Meta com fonte, patch e plataforma rastreáveis;
- funciona 100% sem rede no runtime;
- não depende de LLM pago;
- não fabrica métricas ou certezas;
- permanece utilizável quando Pro Meta está ausente;
- não polui a navegação com nova aba global;
- passa regressões existentes e gate próprio;
- só é considerado lançado após CI, APK e release Latest serem verificados.

## Decisões arquiteturais finais

1. **Approach A confirmado:** R500 é orquestrador read-only, não supermotor que substitui R480–R484.
2. **Pro Meta é evidência externa, não autoridade.**
3. **Runtime local e determinístico.**
4. **Dataset Pro Meta curado na v1; ingestão automática é projeto futuro.**
5. **Memória é derivada dos registros existentes; não há segunda base de verdade.**
6. **R489 não ganha novo kind `DIRECTOR` na v1.**
7. **UI entra em Meu Time/laboratório, sem nova aba global.**
8. **Evidência pessoal contextual pode superar a referência profissional.**
9. **Patch e plataforma são dimensões obrigatórias para Pro Meta.**
10. **Nenhuma promessa de “100% acerto”; precisão significa rastreabilidade, coerência, validação e ausência de informação inventada.**
