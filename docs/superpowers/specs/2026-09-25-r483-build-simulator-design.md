# R483 — Build Simulator — Design

**Data:** 2026-09-25  
**Projeto:** BuildMaster Elite Tático  
**Base:** `main` em `c9242179f5af25d584fbde37e530d45693b8a8a5`  
**Status:** design aprovado para implementação posterior  
**Objetivo:** adicionar um laboratório de comparação de fichas que gere variantes temporárias e explicáveis a partir da ficha oficial já produzida pelo pipeline atual, sem criar uma autoridade paralela, sem otimizar GER/Overall e sem escrever automaticamente na ficha de produção.

---

## 1. Problema que a R483 resolve

O BuildMaster já possui um pipeline de produção com regras rígidas de orçamento, otimização, Clean Slate, identidade da carta e selos finais. O usuário, porém, precisa comparar alternativas de distribuição de PP antes de decidir se uma característica específica de gameplay valeria sacrificar outra.

Hoje essa comparação tende a acontecer de forma manual ou mental. A R483 deve transformar isso em uma bancada de testes interna e segura.

O Build Simulator não deve competir com o pipeline de produção. A ficha final continua sendo produzida e selada pelas autoridades existentes.

---

## 2. Decisão principal de produto

A primeira versão da R483 será **somente comparação**.

Ela poderá:

- ler a ficha oficial final;
- ler orçamento real de PP já validado;
- gerar variantes temporárias;
- calcular custo real de cada variante;
- comparar atributos e tendências de gameplay;
- explicar ganhos e perdas;
- ordenar variantes por adequação funcional, nunca por GER.

Ela não poderá:

- aplicar uma variante automaticamente;
- substituir a ficha oficial;
- salvar uma variante como nova autoridade;
- escrever Top 5 de habilidades adicionais;
- escrever Ímpeto;
- alterar posição final;
- alterar estilo de jogo da carta;
- sobrescrever R119, R126 ou R128;
- usar GER/Overall como função objetivo.

---

## 3. Arquitetura de autoridade

Fluxo oficial continua intacto:

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

A R483 fica depois do resultado oficial, em uma ramificação somente leitura:

```text
Ficha oficial selada
  ↓
R483 Build Simulator
  ├── Oficial
  ├── Equilibrada
  ├── Especialista
  └── Gameplay
```

A saída do R483 é descartável e observacional. Nenhuma variante retorna ao pipeline de autoridade.

---

## 4. Princípios obrigatórios

### 4.1 Orçamento exato

Toda variante deve respeitar exatamente o orçamento real reconhecido para a carta.

Regras:

- `trainingPointsTotal` continua sendo a fonte primária quando validado;
- `0` significa orçamento desconhecido/bloqueado e nunca deve virar `64` por fallback;
- uma variante nunca pode gastar mais PP que o orçamento real;
- uma variante não pode inventar PP livres;
- o custo deve ser recalculado pelo mesmo núcleo de custo de treino já usado pelo app;
- se o orçamento estiver ausente, inválido ou bloqueado, a simulação deve ser bloqueada.

Mensagem esperada:

`Simulação indisponível: confirme primeiro o orçamento real de PP desta carta.`

### 4.2 DNA da carta

O simulador trabalha sobre a identidade da carta já conhecida.

Não pode modificar:

- edição/card ID;
- nível máximo validado;
- booster conhecido;
- atributos-base de origem;
- posições originais;
- estilo oficial da carta;
- habilidades existentes;
- identidade/fingerprint da carta.

### 4.3 Sem otimização de GER

`Overall`, `GER`, estrela visual ou qualquer proxy de Overall não entra na função objetivo.

O motor pode exibir Overall existente como informação se a UI já o recebe, mas não pode usá-lo para:

- escolher uma variante;
- desempatar variantes;
- aumentar score;
- justificar a recomendação.

### 4.4 Read-only por contrato

Toda saída R483 deve carregar explicitamente:

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

Os testes devem falhar se qualquer flag acima mudar.

---

## 5. Perfis de simulação

A primeira versão terá quatro cartões comparáveis.

### 5.1 Oficial

É o baseline.

- cópia fiel da ficha oficial selada;
- não sofre redistribuição;
- PP usados e orçamento devem coincidir com o resultado oficial;
- serve como referência para todos os deltas.

### 5.2 Equilibrada

Objetivo: procurar uma distribuição com pequenas mudanças e baixa distância em relação à ficha oficial.

Características:

- preserva as prioridades principais da função;
- limita mudanças agressivas;
- favorece uma distribuição mais homogênea entre grupos já relevantes;
- nunca enfraquece deliberadamente o principal atributo funcional abaixo de um piso de segurança derivado da ficha oficial.

Uso esperado: usuário quer ver se existe uma alternativa menos extrema sem mudar o DNA funcional.

### 5.3 Especialista

Objetivo: concentrar PP nos grupos mais determinantes para a função reconhecida da carta.

Exemplos conceituais:

- CA finalizador: finalização, destreza, força inferior conforme o perfil;
- SA infiltrador: destreza, aceleração funcional e finalização;
- MLG meia versátil: mobilidade, passe, controle e sustentação;
- VOL 1º volante: defesa, físico e passe de segurança;
- ZAG destruidor: defesa, contato, jogo aéreo conforme perfil;
- lateral defensivo: defesa e sustentação, evitando gasto sem função.

O simulador deve reutilizar conhecimento de função existente no projeto em vez de manter uma tabela paralela desnecessária.

### 5.4 Gameplay

Objetivo: testar uma variante voltada para impacto prático da função no modelo de jogo configurado, sem virar uma nova autoridade.

Pode considerar, quando disponíveis:

- posição-alvo;
- função reconhecida;
- estilo de jogo da carta;
- estilo tático do time;
- perfil já calculado pelo motor de treino;
- evidência observacional de partidas já disponível no resultado, desde que seja somente leitura e não se torne autoridade.

Não pode considerar como verdade:

- previsão de vitória;
- matchmaking;
- suposição de servidor;
- lag não confirmado;
- GER como objetivo.

---

## 6. Motor R483

Novo módulo proposto:

`src/modules/build-simulator/buildSimulatorEngineR483.ts`

Responsabilidade única:

`entrada imutável → validar autoridade/orçamento → gerar variantes → validar custo → calcular deltas → explicar trade-offs → retornar snapshot read-only`

Contrato sugerido:

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

O contrato final pode ser adaptado aos tipos reais disponíveis, desde que preserve essas garantias semânticas.

---

## 7. Reuso do núcleo existente

A R483 deve reutilizar, sempre que aplicável:

- `trainingPlanCore` para custo e normalização;
- `pointBudget` para orçamento e bloqueios;
- perfis já existentes no otimizador de treino;
- atributos e posição já validados pela análise oficial;
- fingerprint/identidade já produzidos pelo pipeline.

Não criar:

- segunda implementação de custo de PP;
- segunda tabela de orçamento;
- segundo resolvedor de posição;
- segundo Clean Slate;
- segunda autoridade de habilidades;
- segundo sistema de Ímpeto.

---

## 8. Estratégia de geração de variantes

A R483 deve ser determinística.

Mesma entrada deve produzir exatamente a mesma saída.

Estratégia recomendada:

1. normalizar o plano oficial;
2. validar custo oficial contra orçamento;
3. extrair prioridades funcionais existentes;
4. gerar candidatos por pequenas operações de redistribuição entre grupos de treino;
5. rejeitar qualquer candidato que exceda orçamento;
6. rejeitar candidato estruturalmente inválido;
7. calcular score funcional por perfil;
8. aplicar penalidade por distância excessiva da ficha oficial onde aplicável;
9. escolher o melhor candidato de cada perfil;
10. calcular deltas contra a ficha oficial;
11. produzir explicações curtas e objetivas.

O motor não deve fazer busca combinatória sem limite. A primeira versão deve usar um espaço de candidatos controlado e determinístico para manter custo previsível no mobile.

---

## 9. Score funcional

O score interno da R483 não representa qualidade absoluta da carta.

Serve apenas para comparar variantes da mesma carta sob o mesmo contexto.

Deve usar pesos derivados de:

- posição-alvo;
- função/playstyle;
- objetivo funcional já reconhecido pelo motor;
- grupos de treino relevantes;
- contexto tático quando disponível.

Deve excluir explicitamente:

- GER/Overall;
- preço da carta;
- raridade estética;
- popularidade;
- nome do jogador como atalho para força;
- previsão de resultado de partida.

Os scores não devem ser comparados entre jogadores diferentes.

---

## 10. Explicabilidade

Cada variante precisa responder três perguntas:

1. **O que mudou?**
2. **O que tende a melhorar?**
3. **O que foi sacrificado?**

Exemplo de apresentação:

```text
Gameplay
+2 Destreza
+1 Força inferior
-2 Passe

Tende a favorecer infiltração curta e aceleração após apoio.
Sacrifício: menor margem para criação e passe sob pressão.
```

A explicação deve ser baseada nos deltas reais calculados, não em texto genérico pré-fabricado que contradiga a variante.

---

## 11. Interface

A R483 não cria item novo no menu principal.

Local preferido:

`Resultado da carta → área avançada / Simulador de ficha`

Nome de UI:

**Simulador de ficha — R483**

Estrutura:

- cabeçalho com orçamento real;
- aviso `Somente simulação — não altera sua ficha`;
- quatro cartões comparáveis;
- PP usados / disponíveis;
- principais deltas;
- pontos fortes;
- sacrifícios;
- explicação;
- indicação clara de qual cartão é a ficha Oficial.

Não incluir na v1:

- botão Aplicar;
- botão Salvar como oficial;
- botão Substituir ficha;
- edição livre de sliders;
- publicação no Cofre como nova ficha.

---

## 12. Estados de erro e bloqueio

### 12.1 Orçamento desconhecido

Bloquear a geração de variantes.

### 12.2 Plano oficial excede orçamento

Tratar como inconsistência de autoridade. Não tentar “consertar” dentro do R483.

Mensagem:

`A ficha oficial possui uma inconsistência de orçamento. O simulador foi bloqueado para não mascarar o problema.`

### 12.3 Dados insuficientes de função

Manter `Oficial` e, se for seguro, `Equilibrada`.

Não inventar perfil Especialista/Gameplay sem base suficiente.

A UI deve mostrar por que a variante não foi produzida.

### 12.4 Exceção interna

Falha no R483 não pode impedir a exibição da ficha oficial.

O componente deve degradar para:

`Simulador temporariamente indisponível. Sua ficha oficial continua intacta.`

---

## 13. Imutabilidade

O motor não pode mutar:

- `AnalysisResult` recebido;
- `ParsedCard`;
- `TrainingPlan` oficial;
- arrays de habilidades;
- Ímpeto;
- objetos de autoridade;
- stores persistentes.

Os testes devem serializar a entrada antes/depois e exigir igualdade.

---

## 14. Integração com evidência de gameplay

A primeira versão pode consumir apenas sinais já consolidados e read-only.

Se dados de R460/R470/R472 estiverem disponíveis na análise, podem ajustar levemente o perfil `Gameplay`, desde que:

- nunca alterem orçamento;
- nunca alterem ficha oficial;
- nunca sejam tratados como verdade universal;
- nunca façam previsão de vitória;
- nunca provoquem escrita em produção.

Se essa integração aumentar demais o acoplamento, ela deve ficar fora da primeira implementação e o perfil Gameplay deve usar apenas posição, função e contexto tático.

---

## 15. Testes obrigatórios

Novo teste principal:

`tests/v40-80-r483-build-simulator-regression.ts`

Deve provar:

1. determinismo;
2. imutabilidade da entrada;
3. nenhuma variante acima do orçamento;
4. orçamento `0` bloqueia simulação;
5. nenhum fallback inventa `64` PP;
6. `Official` é idêntica ao plano oficial;
7. toda variante válida tem custo recalculado pelo núcleo existente;
8. autoridade read-only completa;
9. nenhuma propriedade de skills/Ímpeto é escrita;
10. nenhuma variante pode sobrescrever R128;
11. `optimizeOverall === false`;
12. score não usa Overall/GER;
13. candidatos inválidos são descartados;
14. mesma entrada produz mesma ordem e mesmo resultado;
15. erro do simulador não derruba a ficha oficial na UI.

Além disso:

- adicionar `test:r483` ao `ci:gate`;
- adicionar regressão explícita ao workflow de PR;
- garantir compatibilidade com os typechecks históricos que importarem o componente onde o R483 for integrado;
- executar build de produção.

---

## 16. Segurança contra regressão de autoridade

O teste R483 deve fazer busca estrutural suficiente para impedir integração acidental com escritores de produção.

Exemplos de proibições a validar:

- motor R483 não importar função de persistência de ficha;
- motor R483 não chamar setter de resultado oficial;
- motor R483 não salvar no Cofre;
- motor R483 não alterar `recommendedSkills`;
- motor R483 não alterar `recommendedImpetos`;
- UI não possuir ação `Aplicar` na primeira versão.

---

## 17. Performance

A R483 deve rodar localmente e offline.

Metas de desenho:

- busca de candidatos limitada;
- sem dependência de rede;
- sem LLM obrigatório;
- sem chamadas Supabase para simular;
- sem loops combinatórios explosivos;
- memoização na UI quando entrada não mudar.

A simulação deve ser suficientemente leve para uso em Android intermediário sem travar a tela de resultado.

---

## 18. Observabilidade

Pode registrar apenas telemetria técnica já suportada pela camada global, por exemplo:

- simulador aberto;
- simulação bloqueada por orçamento;
- quantidade de variantes geradas;
- falha técnica do motor.

Não registrar como telemetria:

- conteúdo sensível desnecessário da carta;
- imagem original;
- decisões que possam virar autoridade paralela.

---

## 19. Arquivos previstos para implementação

Arquivos novos prováveis:

- `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- `src/modules/build-simulator/BuildSimulatorPanelR483.tsx`
- `tests/v40-80-r483-build-simulator-regression.ts`

Arquivos existentes que podem ser alterados:

- componente avançado do resultado da carta onde o painel será encaixado;
- `package.json`;
- `.github/workflows/pull-request-validation.yml`.

Alterações em `trainingOptimizer.ts` ou `trainingPlanCore.ts` só devem ocorrer se for necessário extrair uma função pura reutilizável. Não alterar comportamento de produção apenas para facilitar o simulador.

---

## 20. Fora do escopo da R483 v1

- aplicar variante automaticamente;
- editor manual livre;
- salvar múltiplas fichas oficiais;
- sincronizar variantes na nuvem;
- compartilhar variantes;
- comparar jogadores diferentes;
- alterar Top 5;
- alterar Ímpeto;
- alterar posição final;
- prever desempenho futuro;
- escolher automaticamente “a melhor ficha definitiva”.

Esses itens podem ser avaliados em versões futuras somente se mantiverem a autoridade única do pipeline.

---

## 21. Critérios de aceite

A R483 estará pronta para merge somente quando:

- o simulador aparecer dentro da área de resultado, sem novo menu principal;
- a ficha oficial permanecer claramente identificada;
- variantes respeitarem orçamento real;
- orçamento desconhecido bloquear a simulação;
- nenhum PP for inventado;
- nenhuma variante escrever em produção;
- nenhum score usar GER/Overall;
- o motor for determinístico;
- entradas permanecerem imutáveis;
- R119/R126/R128 permanecerem soberanos;
- `test:r483` passar;
- gates históricos relevantes passarem;
- build de produção passar;
- PR ficar GREEN antes de qualquer merge.

Após merge, a publicação oficial deverá seguir o protocolo completo da `main`: Zero-Red, diagnóstico consolidado, build web, Android, APK, assinatura, manifestos, artefato, release imutável, canal principal, ponte legacy e validação de `Latest` contra o SHA correto da `main`.

---

## 22. Decisão final

A R483 é um **laboratório de comparação**, não uma segunda autoridade de ficha.

A ficha oficial continua sendo a única fonte de verdade para produção. O Build Simulator existe para mostrar trade-offs de forma segura, transparente e tecnicamente verificável antes de qualquer decisão humana futura.
