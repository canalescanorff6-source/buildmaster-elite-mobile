# R483 — Build Simulator — Design

**Data:** 2026-09-25  
**Projeto:** BuildMaster Elite Tático  
**Base:** `main` em `c9242179f5af25d584fbde37e530d45693b8a8a5`  
**Status:** aguardando revisão final do usuário antes do plano de implementação  
**Objetivo:** adicionar um laboratório de comparação de fichas que gere variantes temporárias e explicáveis a partir da ficha oficial já produzida pelo pipeline atual, sem criar autoridade paralela, sem otimizar GER/Overall e sem escrever automaticamente na ficha de produção.

---

## 1. Problema

O BuildMaster já possui um pipeline de produção com orçamento, otimização funcional, Clean Slate, identidade da carta e selos finais. Falta uma forma segura de comparar redistribuições de PP sem transformar a comparação em uma segunda “ficha oficial”.

A R483 cria uma bancada de testes local para visualizar trade-offs. A ficha final existente continua sendo a única verdade de produção.

---

## 2. Decisão de produto

A R483 v1 será **somente comparação**.

Pode:

- ler a ficha oficial selada;
- ler o orçamento real de PP já validado;
- gerar variantes temporárias;
- recalcular custo pelo núcleo existente;
- comparar deltas funcionais;
- explicar ganhos e perdas;
- ordenar variantes por adequação funcional.

Não pode:

- aplicar ou salvar uma variante como ficha oficial;
- escrever Top 5 de habilidades;
- escrever Ímpeto;
- mudar posição final ou estilo oficial;
- sobrescrever Clean Slate, R126 ou R128;
- usar GER/Overall, estrelas ou proxies de Overall na função objetivo.

---

## 3. Arquitetura de autoridade

Fluxo oficial permanece intacto:

```text
Carta / leitura
  ↓
pipeline atual
  ↓
Clean Slate / autoridade de treino
  ↓
R126
  ↓
R128
  ↓
Ficha oficial selada
```

A R483 fica em uma ramificação read-only:

```text
Ficha oficial selada
  ↓
R483 Build Simulator
  ├── Oficial
  ├── Equilibrada
  ├── Especialista
  └── Gameplay
```

Nenhuma saída R483 retorna ao pipeline oficial.

---

## 4. Orçamento e custo

### 4.1 Fontes de verdade

- `trainingPointsTotal` continua primário quando validado;
- `0` continua significando orçamento desconhecido/bloqueado;
- `0` nunca pode virar `64` por fallback;
- custo deve ser calculado pelo mesmo `trainingPlanCore` usado pelo app;
- R483 não cria tabela própria de custo ou orçamento.

### 4.2 Comparação justa

Existem dois números diferentes:

- **budget**: teto real disponível para a carta;
- **officialPointsUsed**: PP realmente consumidos pela ficha oficial.

Para comparar fichas sem favorecer uma variante com mais investimento, toda alternativa válida deve consumir **exatamente `officialPointsUsed`**.

Se uma combinação candidata não conseguir manter o mesmo custo real, ela é descartada. O simulador não usa PP que a ficha oficial deixou livres apenas para fazer uma variante parecer melhor.

Consequências:

- `pointsUsed` deve ser igual ao Oficial em todas as variantes válidas;
- `pointsAvailable` deve permanecer igual ao Oficial;
- nenhuma variante pode ultrapassar `budget`;
- se o plano oficial já exceder `budget`, o simulador bloqueia em vez de corrigir silenciosamente.

### 4.3 Orçamento desconhecido

Se o orçamento estiver ausente, inválido ou bloqueado:

`Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.`

---

## 5. DNA da carta

O simulador não pode modificar:

- edição/Card ID;
- fingerprint;
- nível máximo validado;
- booster conhecido;
- atributos-base de origem;
- posições originais;
- estilo oficial da carta;
- habilidades existentes;
- identidade do jogador/cartão.

A R483 só redistribui grupos de treino dentro do mesmo custo oficial.

---

## 6. Sem otimização de GER

`Overall`, `GER`, estrela visual ou proxy de Overall pode ser exibido apenas se já fizer parte da UI, mas não pode ser usado para:

- gerar candidatos;
- escolher variante;
- desempatar;
- aumentar score;
- justificar recomendação.

Os testes devem procurar regressões estruturais que introduzam Overall/GER na função objetivo.

---

## 7. Autoridade read-only

Toda saída R483 carrega:

```ts
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
}
```

Essas flags são invariantes de produto e de regressão.

---

## 8. Perfis de simulação

### 8.1 Oficial

Baseline idêntico ao plano oficial selado.

- não redistribui PP;
- mantém `pointsUsed` e `pointsAvailable` originais;
- é referência para todos os deltas.

### 8.2 Equilibrada

Pequena redistribuição com baixa distância do Oficial.

- preserva prioridades principais da função;
- evita mudanças agressivas;
- busca melhor equilíbrio entre grupos já relevantes;
- mantém o mesmo custo real do Oficial.

### 8.3 Especialista

Concentra o mesmo custo oficial nos grupos mais determinantes para a função reconhecida.

Exemplos conceituais:

- CA finalizador: finalização/destreza/força inferior conforme perfil;
- SA infiltrador: destreza, aceleração funcional e finalização;
- MLG meia versátil: mobilidade, passe, controle e sustentação;
- VOL 1º volante: defesa, físico e passe seguro;
- ZAG destruidor: defesa, contato e jogo aéreo conforme perfil;
- lateral defensivo: defesa e sustentação.

O conhecimento de função deve vir dos perfis já existentes, não de uma segunda tabela paralela.

### 8.4 Gameplay

Na v1, usa apenas sinais estáveis já disponíveis no contexto da carta:

- posição-alvo;
- função/playstyle;
- objetivo funcional;
- estilo tático configurado, quando disponível;
- perfil do motor de treino existente.

**R460/R470/R472 e evidência de partidas ficam fora da R483 v1.** Isso reduz acoplamento e evita transformar observações de gameplay em autoridade de ficha. Uma integração posterior exigirá design próprio.

---

## 9. Motor R483

Novo módulo:

`src/modules/build-simulator/buildSimulatorEngineR483.ts`

Responsabilidade:

`entrada imutável → validar orçamento/autoridade → gerar candidatos → validar custo idêntico ao Oficial → calcular score funcional → calcular deltas → explicar trade-offs → snapshot read-only`

Contrato alvo:

```ts
export type BuildSimulatorInputR483 = {
  result: AnalysisResult;
  officialPlan: TrainingPlan;
  budget: number;
  targetPosition: PositionCode;
  objective: Objective;
  tacticalStyle?: TacticalStyle | null;
};

export type BuildSimulatorVariantR483 = {
  id: 'official' | 'balanced' | 'specialist' | 'gameplay';
  label: string;
  plan: TrainingPlan;
  pointsUsed: number;
  pointsAvailable: number;
  validBudget: boolean;
  score: number;
  deltas: Array<{
    key: TrainingKey;
    before: number;
    after: number;
    delta: number;
  }>;
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
```

O contrato final pode adaptar nomes a tipos reais desde que preserve essas garantias.

---

## 10. Reuso obrigatório

Reutilizar, quando aplicável:

- `trainingPlanCore` para custo/normalização;
- `pointBudget` para orçamento/bloqueio;
- perfis funcionais do otimizador atual;
- atributos e posição já validados;
- fingerprint/identidade já selados.

Não criar:

- segunda implementação de custo;
- segunda tabela de PP;
- segundo resolvedor de posição;
- segundo Clean Slate;
- segunda autoridade de skills;
- segundo sistema de Ímpeto.

---

## 11. Geração determinística de variantes

Mesma entrada deve produzir a mesma saída, inclusive ordem e score.

Algoritmo de alto nível:

1. normalizar plano oficial;
2. calcular `officialPointsUsed` pelo núcleo oficial;
3. validar contra `budget`;
4. extrair prioridades funcionais existentes;
5. gerar conjunto limitado de candidatos por pequenas redistribuições;
6. recalcular custo de cada candidato;
7. rejeitar candidato cujo custo não seja exatamente `officialPointsUsed`;
8. rejeitar candidato estruturalmente inválido;
9. pontuar por perfil funcional;
10. aplicar penalidade por distância do Oficial quando pertinente;
11. escolher um vencedor por perfil;
12. calcular deltas e explicações.

Sem busca combinatória ilimitada. O espaço de candidatos deve ser pequeno, previsível e adequado ao mobile.

---

## 12. Score funcional

O score serve apenas para comparar variantes **da mesma carta e do mesmo contexto**.

Pode usar:

- posição-alvo;
- função/playstyle;
- objetivo funcional;
- grupos de treino relevantes;
- estilo tático configurado.

Não pode usar:

- GER/Overall;
- preço;
- raridade estética;
- popularidade;
- nome do jogador como atalho de força;
- previsão de resultado;
- dados de matchmaking/servidor.

Scores de jogadores diferentes não são comparáveis.

---

## 13. Explicabilidade

Cada variante responde:

1. o que mudou;
2. o que tende a melhorar;
3. o que foi sacrificado.

Exemplo:

```text
Gameplay
+2 Destreza
+1 Força inferior
-2 Passe

Tende a favorecer infiltração curta e aceleração após apoio.
Sacrifício: menor margem para criação e passe sob pressão.
```

O texto deve derivar dos deltas reais. Nenhuma explicação pode contradizer a distribuição calculada.

---

## 14. Interface

Não criar novo item no menu principal.

Local:

`Resultado da carta → área avançada → Simulador de ficha — R483`

Conteúdo:

- orçamento real;
- aviso `Somente simulação — não altera sua ficha`;
- cartão Oficial destacado;
- cartões Equilibrada, Especialista e Gameplay quando válidos;
- PP usados/disponíveis;
- principais deltas;
- pontos fortes;
- sacrifícios;
- explicação.

Fora da v1:

- Aplicar;
- Salvar como oficial;
- Substituir ficha;
- sliders livres;
- persistir variante no Cofre.

---

## 15. Estados de erro

### 15.1 Orçamento desconhecido

Bloqueia todas as variantes alternativas.

### 15.2 Plano oficial acima do orçamento

Bloqueia o simulador:

`A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.`

### 15.3 Nenhum candidato de custo idêntico

Omitir a variante específica e explicar:

`Nenhuma redistribuição segura com o mesmo custo da ficha oficial foi encontrada para este perfil.`

### 15.4 Dados funcionais insuficientes

Mostrar Oficial e somente variantes que possam ser produzidas sem inferência inventada.

### 15.5 Falha interna

Nunca derrubar o resultado oficial:

`Simulador temporariamente indisponível. Sua ficha oficial continua intacta.`

---

## 16. Imutabilidade

O R483 não muta:

- `AnalysisResult`;
- `ParsedCard`;
- plano oficial;
- habilidades;
- Ímpeto;
- objetos de autoridade;
- stores persistentes.

Testes devem serializar entradas antes/depois e exigir igualdade.

---

## 17. Testes obrigatórios

Novo teste:

`tests/v40-80-r483-build-simulator-regression.ts`

Deve provar:

1. determinismo;
2. imutabilidade;
3. orçamento `0` bloqueia;
4. nenhum fallback inventa `64` PP;
5. Oficial é idêntica ao plano oficial;
6. toda alternativa válida usa exatamente `officialPointsUsed`;
7. nenhuma alternativa excede `budget`;
8. custo vem do núcleo existente;
9. flags read-only permanecem invariantes;
10. nenhuma propriedade de skills/Ímpeto é escrita;
11. nenhuma ação sobrescreve Clean Slate/R126/R128;
12. `optimizeOverall === false`;
13. score não usa Overall/GER;
14. candidatos de custo diferente são descartados;
15. ordem/resultados são estáveis para a mesma entrada;
16. erro do simulador não derruba a ficha oficial;
17. UI v1 não expõe ação `Aplicar`.

Integração CI:

- adicionar `test:r483` ao `ci:gate`;
- adicionar etapa R483 ao workflow de PR;
- executar typechecks históricos que importarem o componente de resultado;
- executar build de produção.

---

## 18. Segurança contra autoridade paralela

A regressão deve impedir que o motor:

- importe persistência de ficha;
- chame setter da ficha oficial;
- grave no Cofre;
- escreva `recommendedSkills`;
- escreva `recommendedImpetos`;
- altere posição final;
- ofereça botão Aplicar na v1.

---

## 19. Performance e operação

R483 é local e offline.

- sem rede obrigatória;
- sem Supabase para simular;
- sem LLM obrigatório;
- conjunto de candidatos limitado;
- sem loops combinatórios explosivos;
- memoização quando a entrada não mudar.

A falha do simulador é isolada e não bloqueia a tela de resultado.

---

## 20. Observabilidade

Pode usar a telemetria global existente apenas para eventos técnicos, como:

- simulador aberto;
- bloqueio por orçamento;
- quantidade de variantes válidas;
- falha técnica.

Não enviar imagem original nem transformar decisões de simulação em autoridade persistente.

---

## 21. Arquivos previstos

Novos:

- `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- `src/modules/build-simulator/BuildSimulatorPanelR483.tsx`
- `tests/v40-80-r483-build-simulator-regression.ts`

Possíveis alterações:

- componente avançado da tela de resultado;
- `package.json`;
- `.github/workflows/pull-request-validation.yml`.

`trainingOptimizer.ts` ou `trainingPlanCore.ts` só podem ser alterados para extrair função pura reutilizável, sem mudar o comportamento de produção.

---

## 22. Fora do escopo e aceite

### Fora da v1

- aplicar variante;
- editor manual livre;
- salvar múltiplas fichas oficiais;
- sincronizar variantes;
- compartilhar variantes;
- comparar jogadores diferentes;
- alterar Top 5;
- alterar Ímpeto;
- alterar posição final;
- usar evidência R460/R470/R472;
- prever desempenho/resultado;
- declarar automaticamente “a melhor ficha definitiva”.

### Critérios de aceite

R483 só pode ir para merge quando:

- aparecer dentro do resultado, sem novo menu;
- Oficial estiver claramente identificado;
- alternativas tiverem o mesmo `officialPointsUsed`;
- orçamento desconhecido bloquear;
- nenhum PP for inventado;
- nenhuma escrita em produção existir;
- nenhum score usar GER/Overall;
- motor for determinístico e imutável;
- R119/R126/R128 permanecerem soberanos;
- `test:r483`, typechecks históricos e build de produção passarem;
- PR estiver GREEN.

Após merge, a `main` deve passar pelo protocolo completo: Zero-Red, diagnóstico consolidado, build web, Android, APK, assinatura, manifestos, artefato, release imutável, canal principal, ponte legacy e validação de `Latest` contra o SHA correto.

---

## Decisão final

A R483 é um **laboratório de comparação com custo idêntico à ficha oficial**, não uma segunda autoridade. Sua função é tornar trade-offs visíveis e verificáveis sem alterar a única fonte de verdade de produção.