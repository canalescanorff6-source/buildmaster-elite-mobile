# R193 — Analyzer Dedup + Net Source Reduction

## Objetivo

Reduzir de forma líquida o orçamento de código-fonte do BuildMaster Elite Tático sem mover complexidade para outro módulo e sem alterar a autoridade esportiva do R119, a identidade/DNA das cartas, progressão, orçamento, Top 5, Ímpetos, posição de uso, neutralidade de GER/Overall, OCR ou Cofre.

Base canônica de entrada: R192.

## Resultado estrutural

### `src/lib/analyzer.ts`

- R192: 118.507 bytes / 1.377 linhas físicas.
- R193: 109.549 bytes / 1.238 linhas físicas.
- Redução: 8.958 bytes (~7,6%).
- Redução: 139 linhas (~10,1%).

Com essa redução, `CardVisionApp.tsx` (112.350 bytes) volta a ser o maior módulo do `src` e passa a ser candidato prioritário para a revisão seguinte.

### Orçamento total do `src`

- R192: 5.346.352 / 5.505.024 bytes.
- R193: 5.343.058 / 5.505.024 bytes.
- Redução líquida: 3.294 bytes.
- Margem atual: 161.966 bytes.
- Nenhum teto foi aumentado.

### Closures estáticas

CardVision:
- R192: 2.386.992 bytes.
- R193: 2.383.698 bytes.
- Ganho: 3.294 bytes.

Resultado:
- R192: 2.130.004 bytes.
- R193: 2.126.710 bytes.
- Ganho: 3.294 bytes.

A mesma redução aparecer nas duas closures confirma que o ganho ocorreu em código compartilhado real e não por simples deslocamento para uma fronteira lazy.

## Deduplicações aplicadas

### 1. Metadados especiais unificados

Foi criada uma única fonte de metadados analíticos para habilidades especiais em `analyzerCatalog.ts` (`SPECIAL_SKILL_ANALYSIS_META`).

Ela substitui tabelas paralelas que existiam dentro de `analyzer.ts` para:
- grupos de treino;
- atributos afetados;
- posições relacionadas;
- texto de uso;
- pesos de identidade.

Foram preservadas exatamente 20 habilidades especiais já reconhecidas. Nenhuma habilidade nova foi inventada. `Tap Trick` continua sem metadado analítico inventado.

O caso sensível `Comandante da defesa (GO)` mantém separadamente:
- grupos `gk1`, `gk2`, `gk3`;
- peso histórico `identity.defending = 0.4`.

### 2. Matemática canônica reutilizada

`clamp`, `clampDecimal` e `avg` passaram a ser exportados pelo núcleo posicional R142 e reutilizados pelo analyzer, eliminando cópias locais.

### 3. APIs canônicas de treino

O analyzer passou a reutilizar:
- `TRAINING_KEYS`;
- `trainingLevelCost`;
- `emptyTraining()`.

Foram removidas versões locais equivalentes (`emptyTrainingWeights` e `nextTrainingPointCost`).

### 4. Variantes de treino deduplicadas

`softenTraining` e `aggressiveTraining` compartilham agora um helper de deslocamento, preservando clamp, custo e zeragem de grupos de goleiro.

### 5. Template genérico anti-clone unificado

O objeto genérico de carta utilizado no mecanismo anti-clone passou a ser construído por `genericPositionTemplateCard`, eliminando duas construções equivalentes.

### 6. Labels e posições simétricas

Foram reutilizados:
- `ATTRIBUTE_PT` com apenas overrides semânticos necessários;
- tabelas compartilhadas para LWF/RWF, LMF/RMF e LB/RB;
- mapa canônico para famílias de posição.

Os textos e resultados públicos foram preservados.

## Equivalência congelada

Além da regressão ampla já existente da R186, a R193 adicionou snapshots específicos contra a R192 original.

### Carta AMF com Curva descendente
SHA-256 do snapshot congelado:

`f21026b25c75a461539622ad5dfe7fbf904824a9244b783bba9f143d5d50b3a7`

Inclui progressão, variantes, identidade, DNA, mapeamento, função tática, habilidade especial, metas de atributo, limite de correção, retorno marginal, tolerância de erro, prioridade de skills e optimizer avançado.

### Goleiro com Comandante da defesa (GO)
SHA-256 do snapshot congelado:

`95abe08f9b9e765212a2d99f45bf18e4f1b0fe0aacc8880fcd9ee9865dca0393`

Inclui treino, variantes, identidade, DNA, mapeamento, análise da habilidade, motor físico, metas e retorno marginal.

Os dois snapshots foram calculados tanto na R192 original congelada quanto na R193 e permaneceram byte-a-byte idênticos.

## Autoridade esportiva

O R119 permanece intacto.

SHA-256:

`765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`

A R193 não altera:
- progressão;
- orçamento;
- Top 5;
- Ímpetos;
- DNA;
- posição de uso;
- builds específicas por função/carta;
- neutralidade em relação a GER/Overall.

## Regressões e gates validados

Foram validados nesta revisão, entre outros:
- R119 Clean Slate;
- R119 Output Quality;
- R122 Máximo Online + DNA;
- R125 Role-Aware Card-Specific Builds;
- R142 Analyzer Boundary;
- R184 Position Stability;
- R186 Analyzer Equivalence;
- R180 → R192;
- R193 estrutural e equivalência especial;
- bateria v38.40: 15/15;
- TypeScript/source contract;
- qualidade de bundle;
- sintaxe;
- interativos/acessibilidade;
- auditoria 127/127;
- release preflight 138/138;
- Play preflight 27/27;
- Java nativo.

Assinatura lógica de preflight observada na R193: `271f08126cad7916`.

## Nota sobre teste histórico v37.40

O teste direto legado `v37-40-structural-precision-regression.ts` ainda procura `StructuralPrecisionPanel` fisicamente dentro de `ResultWorkspace.tsx`. Esse contrato já estava incompatível na R192, pois a R192 moveu painéis avançados para `ResultAdvancedWorkspaceR192.tsx`. Portanto, esse ponto é pré-existente e não representa regressão introduzida pela R193. O gate R142 atual permanece verde.

## Ambiente Android

A fonte continua passando os contratos Android/Java/Play disponíveis localmente. O ambiente deste ciclo não possui Android SDK, `adb`, `sdkmanager`, `node_modules` e runtime Capacitor instalados; portanto não foi produzido APK/AAB físico localmente. A compilação física deve permanecer no CI configurado para Android.

## Próximo alvo recomendado

`src/components/CardVisionApp.tsx` passou a ser o maior módulo do `src`, com 112.350 bytes. A próxima revisão deve priorizar redução líquida adicional — preferencialmente removendo duplicação/estado derivado ou responsabilidade ainda compartilhada — sem simplesmente transferir bytes para outra fronteira.
