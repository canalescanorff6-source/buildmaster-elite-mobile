# R489 Explainable AI — Design

## Objetivo

Adicionar ao BuildMaster Elite Tático uma camada única de explicabilidade que responda **por que** uma recomendação, ficha, titularidade, rotação, leitura tática ou conclusão de partida foi apresentada, usando somente decisões e evidências já produzidas pelos motores soberanos e read-only existentes.

O R489 **não decide nada novo**. Ele recebe decisões já concluídas, coleta evidências rastreáveis, mede a força explicativa dessas evidências sem dupla contagem e devolve uma cadeia auditável: **veredito → motivos → evidências → benefícios → trade-offs → riscos → alternativas → contrafactual → confiança**.

A autoridade final permanece `R119 → R126 → R128`. O R489 existe apenas depois dessa cadeia e nunca a substitui.

## Escopo da v1

A v1 explica cinco classes de decisão:

1. **Ficha do jogador** — por que a ficha oficial venceu e por que variantes R483 perderam ou servem apenas como alternativas.
2. **Titularidade** — por que um jogador está estruturalmente mais importante que uma alternativa.
3. **Banco/rotação** — por que determinada reserva é adequada a um cenário sem aplicar a troca.
4. **Tática/coletivo** — por que determinado cenário, risco ou setor é relevante.
5. **Partida** — por que uma leitura de jogo foi produzida a partir de lances confirmados e janelas/padrões R482.

Fora da v1:

- criar ou recalcular fichas;
- distribuir PP;
- escolher skills, Top 5 ou Ímpeto;
- mudar posição, formação, titularidade ou banco;
- salvar no Cofre;
- confirmar automaticamente lances de vídeo;
- chamar rede, LLM remoto ou APIs externas;
- usar GER/Overall como objetivo, evidência ou desempate.

## Fontes de verdade

### Autoridade

- `R128`/resultado oficial: decisão soberana de ficha e contexto final já validado.

### Evidência explicativa

- `R480 Tactical Twin`: cenários táticos, riscos, prontidão e confiança contextual.
- `R481 Squad Brain`: importância estrutural, cobertura, rotações e banco por cenário.
- `R482 Match Vision`: evidência de partida confirmada, linha do tempo, padrões e janelas críticas.
- `R483 Build Simulator`: baseline oficial e variantes read-only com PP exato.
- `R484 Chemistry Graph`: química estrutural, links, setores e simulações de rotação.

O R489 não deve reimplementar algoritmos desses módulos. Ele consome snapshots e só cria explicações.

## Modelo de dependência e anti-dupla-contagem

Nem todas as fontes são independentes:

```text
R128
│
├── R480
│   └── R481
│       └── R484
│
├── R482
│
└── R483
```

R481 já incorpora R480. R484 usa R481 e R454. Portanto, R480/R481/R484 não podem valer como três provas independentes da mesma afirmação.

Cada item de evidência deve declarar origem, família, confiança nativa, relevância, independência e completude.

```ts
export type EvidenceSourceR489 = 'R128' | 'R480' | 'R481' | 'R482' | 'R483' | 'R484';

export type EvidenceFamilyR489 =
  | 'OFFICIAL_DECISION'
  | 'TACTICAL_STRUCTURE'
  | 'SQUAD_STRUCTURE'
  | 'MATCH_EVIDENCE'
  | 'BUILD_ALTERNATIVES'
  | 'CHEMISTRY';

export type ExplainableEvidenceR489 = {
  id: string;
  source: EvidenceSourceR489;
  family: EvidenceFamilyR489;
  claim: string;
  nativeConfidence: number;
  relevance: number;
  independence: number;
  completeness: number;
  effectiveWeight: number;
  fingerprint: string;
};
```

Regras de independência da v1:

- R128: `1.00` para existência/identidade da decisão oficial; não serve como prova de desempenho futuro.
- R482: `1.00` quando explica fatos confirmados da partida.
- R483: `1.00` para comparação entre variantes de ficha.
- R480: `1.00` para cenário tático base.
- R481: no máximo `0.75` quando sustenta a mesma afirmação de R480; `1.00` quando a afirmação é exclusivamente de cobertura/rotação.
- R484: no máximo `0.65` quando a afirmação deriva de rotação R481; `1.00` quando a afirmação é exclusivamente de links/química calculados pelo R454.

Esses multiplicadores são limites de independência, não novos scores de qualidade.

## Confiança

O R489 deve separar claramente **confiança da decisão** de **confiança de desempenho**.

```ts
export type ExplainableConfidenceR489 = {
  decisionConfidence: number;
  performanceConfidence: number | null;
  evidenceState: 'FULL' | 'PARTIAL' | 'INSUFFICIENT';
};
```

### Confiança da decisão

Mede quão certo o R489 está sobre **o que foi decidido**. Quando a decisão vem diretamente do resultado oficial R128 e o fingerprint bate, pode ser alta mesmo sem evidência de partida.

Ela não significa que a decisão terá desempenho superior em campo.

### Confiança de desempenho

Só existe quando há evidência suficiente para falar sobre provável comportamento em contexto. Pode usar R480/R481/R482/R484 e a comparação R483, respeitando relevância e independência.

Sem base suficiente, deve ser `null`, nunca um número fabricado.

### Peso efetivo

Para cada evidência válida:

```text
effectiveWeight =
  nativeConfidence
  × relevance
  × independence
  × completeness
```

Todos os fatores são normalizados em `[0, 1]` antes do cálculo. O valor público final é convertido para `[0, 100]`.

O R489 não recalcula `nativeConfidence`; ele recebe a confiança fornecida pelo motor de origem.

### Teto por diversidade de famílias independentes

Para evitar falsa precisão:

- 0 famílias independentes válidas: `INSUFFICIENT`, confiança explicativa máxima 35.
- 1 família independente válida: máximo 65.
- 2 famílias independentes válidas: máximo 82.
- 3 ou mais famílias independentes válidas: até 100.

Apenas famílias realmente relevantes à pergunta contam.

## Contradições e lacunas

O R489 nunca deve esconder desacordo entre motores.

Se R483 indicar ganho de progressão, R484 indicar perda de química e R482 confirmar problemas reais de progressão, a saída deve declarar benefício, sacrifício e conflito.

```ts
export type ExplainableReasonKindR489 =
  | 'BENEFIT'
  | 'TRADE_OFF'
  | 'RISK'
  | 'CONTRADICTION';

export type ExplainableReasonR489 = {
  rank: number;
  type: ExplainableReasonKindR489;
  title: string;
  explanation: string;
  evidenceIds: string[];
  impact: number;
};
```

Regras:

- motivo sem `evidenceIds` é inválido;
- contradição relevante reduz confiança;
- ausência de uma fonte necessária reduz completude;
- fontes ausentes nunca são preenchidas com inferência textual;
- uma fonte `NOT_APPLICABLE` não é tratada como erro.

## Disponibilidade das fontes

```ts
export type EvidenceAvailabilityR489 = 'AVAILABLE' | 'BLOCKED' | 'UNAVAILABLE' | 'NOT_APPLICABLE';

export type ExplainableAvailabilityR489 = {
  r480: EvidenceAvailabilityR489;
  r481: EvidenceAvailabilityR489;
  r482: EvidenceAvailabilityR489;
  r483: EvidenceAvailabilityR489;
  r484: EvidenceAvailabilityR489;
};
```

Sem partida analisada, R482 deve ser `NOT_APPLICABLE`, não `UNAVAILABLE`.

Se R483 estiver bloqueado por inconsistência de PP, deve ser `BLOCKED`; o R489 pode explicar a ficha oficial, mas não pode inventar alternativas.

Falha de uma fonte não derruba o R489 inteiro. O motor degrada para `PARTIAL` ou `INSUFFICIENT` e relata a limitação.

## Contrafactual

O R489 pode responder perguntas como “o que teria que mudar para a alternativa Gameplay ficar mais competitiva?”, mas apenas usando candidatos que já existem.

Fontes permitidas:

- variantes reais do R483;
- rotações reais do R481;
- cenários reais do R480;
- simulações de rotação reais do R484.

```ts
export type ExplainableCounterfactualR489 = {
  available: boolean;
  explanation: string | null;
  evidenceIds: string[];
};
```

Se não houver candidato real e rastreável, retornar `available: false` e `explanation: null`.

## Contrato público

```ts
export type ExplainableDecisionKindR489 =
  | 'BUILD'
  | 'STARTER'
  | 'ROTATION'
  | 'TACTICAL'
  | 'MATCH';

export type ExplainableDecisionR489 = {
  version: string;
  kind: ExplainableDecisionKindR489;
  verdict: string;
  decisionConfidence: number;
  performanceConfidence: number | null;
  evidenceState: 'FULL' | 'PARTIAL' | 'INSUFFICIENT';
  availability: ExplainableAvailabilityR489;
  reasons: ExplainableReasonR489[];
  evidence: ExplainableEvidenceR489[];
  benefits: string[];
  tradeOffs: string[];
  risks: string[];
  alternatives: string[];
  counterfactual: ExplainableCounterfactualR489;
  limitations: string[];
  fingerprint: string;
  authority: {
    readOnly: true;
    canWriteTraining: false;
    canWriteSkills: false;
    canWriteImpetus: false;
    canChangePosition: false;
    canChangeLineupAutomatically: false;
    canConfirmMatchMarkersAutomatically: false;
    canWriteVault: false;
    canOverrideR119: false;
    canOverrideR126: false;
    canOverrideR128: false;
    optimizeOverall: false;
  };
  guardrails: string[];
};
```

A implementação deve expor uma entrada única e discriminada por `kind`, para não criar cinco motores independentes.

```ts
export function buildExplainableDecisionR489(input: ExplainableDecisionInputR489): ExplainableDecisionR489;
```

## Entradas por tipo de explicação

### BUILD

Obrigatório:

- resultado oficial final;
- snapshot R483 quando disponível;
- contexto tático já associado ao resultado.

Uso:

- explicar por que a Oficial permanece soberana;
- comparar benefícios/sacrifícios de variantes existentes;
- nunca promover automaticamente variante.

### STARTER

Obrigatório:

- jogador titular alvo;
- R481;
- R484 quando disponível.

Uso:

- importância estrutural;
- gap para substituição;
- links químicos relevantes;
- risco de perda estrutural.

### ROTATION

Obrigatório:

- rotação R481 real;
- cenário R480 relacionado;
- simulação R484 quando disponível.

Uso:

- explicar por que a rotação faz sentido naquele cenário;
- mostrar efeito químico sem aplicar a troca.

### TACTICAL

Obrigatório:

- cenário R480;
- cobertura R481 relevante;
- R484 opcional.

Uso:

- explicar readiness, risco, setor forte/fraco e dependências do banco.

### MATCH

Obrigatório:

- snapshot R482.

Uso:

- explicar padrões, janelas críticas e observações de estilo somente a partir de lances confirmados/revisados.

R489 não deve usar candidatos automáticos pendentes do R482 como prova confirmada.

## Rastreabilidade

Toda afirmação relevante deve formar uma cadeia navegável:

```text
ExplainableDecisionR489
  → reason.evidenceIds[]
  → ExplainableEvidenceR489
  → source + fingerprint
  → snapshot de origem
```

O `fingerprint` do R489 deve ser determinístico para a mesma entrada e incluir:

- `kind`;
- fingerprint/ID da decisão oficial quando aplicável;
- versões dos snapshots utilizados;
- IDs/fingerprints das evidências selecionadas;
- estado de disponibilidade.

Não incluir timestamps correntes, `Math.random()` ou dados de UI no fingerprint.

## Seleção de motivos

O R489 deve priorizar clareza e não volume.

Na saída principal:

- máximo 5 motivos;
- máximo 3 benefícios;
- máximo 3 trade-offs;
- máximo 3 riscos;
- máximo 3 alternativas;
- contradições relevantes têm prioridade sobre motivos redundantes.

Ordenação determinística:

1. impacto decrescente;
2. força efetiva da evidência decrescente;
3. prioridade de tipo: `CONTRADICTION > RISK > TRADE_OFF > BENEFIT` quando o impacto empatar;
4. ID estável como último desempate.

## UI

Não criar nova seção principal nem nova aba global.

### Superfície normal

Integrar na **Análise Pro** por meio de um bloco compacto “Por que esta recomendação?”.

Mostrar:

- veredito;
- confiança da decisão;
- confiança de desempenho quando disponível;
- estado `FULL | PARTIAL | INSUFFICIENT` em linguagem amigável;
- 3–5 motivos principais;
- principal benefício;
- principal sacrifício;
- riscos relevantes;
- ação “Ver evidências”.

### Superfície profunda

“Ver evidências” abre detalhe local/reutilizando superfície avançada existente, sem criar item novo no menu principal.

Mostrar:

- fonte de cada motivo;
- confiança nativa;
- relevância;
- independência;
- completude;
- contradições;
- limitações;
- fingerprints e versões de origem.

A UI não pode ter botões “Aplicar”, “Promover”, “Salvar como oficial”, “Trocar titular” ou equivalentes ligados ao R489.

## Degradação e erros

O R489 deve ser puro e determinístico; erro de uma fonte é representado na entrada como disponibilidade e não por exceção usada como fluxo normal.

Comportamentos obrigatórios:

- nenhuma evidência válida: snapshot `INSUFFICIENT`, motivos vazios ou estritamente descritivos da decisão oficial, sem previsão;
- apenas R128: pode explicar qual é a decisão oficial, mas `performanceConfidence = null`;
- R482 não aplicável: nenhuma penalidade de erro, apenas ausência de prova de partida;
- R483 bloqueado: reportar bloqueio e não criar alternativa;
- R484 indisponível: não falar de química;
- conflito forte entre fontes: criar motivo `CONTRADICTION` e reduzir confiança;
- entrada inválida/fingerprint incompatível: retornar `INSUFFICIENT` com limitação explícita, sem tentar corrigir a origem.

## Segurança e autoridade

Obrigatório em toda saída:

```ts
readOnly: true
canWriteTraining: false
canWriteSkills: false
canWriteImpetus: false
canChangePosition: false
canChangeLineupAutomatically: false
canConfirmMatchMarkersAutomatically: false
canWriteVault: false
canOverrideR119: false
canOverrideR126: false
canOverrideR128: false
optimizeOverall: false
```

O motor R489 não pode importar:

- stores mutáveis;
- helpers de persistência;
- writers de ficha;
- writers de Cofre;
- APIs de rede;
- clientes Supabase;
- funções de atualização de escalação;
- funções de confirmação automática de vídeo.

## Testes de contrato

Criar regressão dedicada `tests/v40-80-r489-explainable-ai-regression.ts` cobrindo no mínimo:

1. determinismo com a mesma entrada;
2. não mutação das entradas;
3. autoridade read-only completa;
4. motivo sem `evidenceIds` é proibido;
5. `performanceConfidence = null` quando não houver evidência suficiente;
6. teto de 65 para uma única família independente;
7. teto de 82 para duas famílias independentes;
8. R480/R481/R484 não contam automaticamente como três provas independentes da mesma afirmação;
9. contradição explícita quando fontes relevantes divergem;
10. ausência de R482 como `NOT_APPLICABLE` não derruba explicação de ficha;
11. R483 `BLOCKED` impede contrafactual de build inexistente;
12. R484 indisponível impede qualquer frase sobre química;
13. R482 usa somente evidência confirmada/revisada;
14. nenhum uso de `.overall`, `maxOverall`, `GER` ou equivalentes no motor;
15. nenhum `fetch`, `localStorage`, `sessionStorage`, `upsert`, Supabase ou writer no motor;
16. fingerprint estável e sem timestamp/random;
17. UI contém “Por que esta recomendação?” e “Ver evidências” sem criar menu principal novo;
18. UI não contém ação R489 para aplicar/promover/escrever decisão;
19. R128 continua soberano quando R483 mostra alternativa com score explicativo maior;
20. falha/ausência de uma fonte degrada para `PARTIAL`/`INSUFFICIENT` sem exceção global.

## Compatibilidade e gates

O R489 deve entrar no workflow de PR antes do build de produção.

Antes de merge, exigir GREEN de:

- `test:r489`;
- `test:r480`;
- `test:r481`;
- `test:r482`;
- regressão R483;
- regressão R484;
- `test:r128`;
- TypeScript completo;
- build de produção;
- contratos históricos já protegidos pelo pipeline principal.

Se qualquer gate soberano falhar, o R489 não pode ser usado para mascarar a falha.

## Critérios de aceite

O R489 está pronto quando:

- explica decisões existentes sem criar decisões novas;
- toda afirmação relevante possui evidência rastreável;
- confiança nativa dos motores é herdada e não recalculada;
- dependências entre R480/R481/R484 evitam dupla contagem;
- decisão e desempenho usam confianças separadas;
- contradições são mostradas, não escondidas;
- ausência de fonte degrada de forma explícita;
- nenhum GER/Overall participa da função explicativa;
- nenhuma escrita de produção existe no motor ou na UI;
- R119/R126/R128 permanecem soberanos;
- a UI principal continua limpa, usando Análise Pro em vez de uma nova aba global;
- todos os gates de CI terminam GREEN.
