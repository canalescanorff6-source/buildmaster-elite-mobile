# R484 Chemistry Graph — Design

## Objetivo

Adicionar ao `Meu Time` uma camada determinística e somente leitura que meça **química estrutural entre jogadores realmente vizinhos na formação**, substituindo o cartão simplificado de “Entrosamento” que hoje reaproveita `team.globalScore`.

O R484 não cria nova autoridade de ficha, não otimiza GER/Overall e não altera escalação automaticamente.

## Fontes de verdade

- `TeamDiagnosis` fornece formação, slots, escalação e encaixe estrutural atual.
- `IntegratedPlayerRecord` fornece identidade da carta, função, confiança, status de scouting e evidência já consolidada.
- `evaluatePairSynergyR454()` continua sendo o avaliador canônico de sinergia de dupla.
- `SquadBrain R481` fornece rotações candidatas; R484 apenas simula o impacto químico dessas trocas.
- `MatchValidationRecord` só aumenta **confiança** quando existe coocorrência inequívoca via mesmo `sessionIdR462`, mesma formação e mesmo estilo. Partidas nunca fabricam sinergia estrutural.

## Grafo tático

Cada titular preenchido vira um nó identificado pelo fingerprint da carta e pelo slot atual.

Uma aresta só existe entre vizinhos táticos:

- setores iguais: distância espacial entre slots `<= 38`;
- setores adjacentes: distância espacial `<= 42`;
- setores separados por mais de uma linha nunca recebem link direto;
- goleiro conecta apenas com a linha defensiva.

Ordem das linhas: `goleiro → defesa → meio → ataque`.

O score da aresta vem de `evaluatePairSynergyR454(left, right, { formationId, teamStyle })` e mantém os rótulos canônicos `FORTE | BOA | NEUTRA | REDUNDANTE | RUIM`.

O R484 não recalcula atributos, não usa GER e não duplica a lógica R454.

## Confiança

A confiança do link é separada do score de química.

Ela considera:

- confiança das duas cartas;
- presença de motivos produzidos pelo R454;
- bônus limitado para sessões compartilhadas confirmadas.

Sem `sessionIdR462` compartilhado, o score permanece estrutural e a confiança não ganha bônus de partida.

## Saída

`ChemistryGraphSnapshotR484` deve expor:

- `score` geral do grafo;
- `confidence` geral;
- contagem de links por status;
- `nodes` e `links`;
- cinco setores: Defesa, Meio-campo, Ataque, Defesa ↔ Meio e Meio ↔ Ataque;
- melhor link e link mais frágil;
- jogador mais conectado e jogador mais isolado;
- até três simulações de troca originadas das rotações R481;
- `warnings`, `authority` e `guardrails`.

Setores sem links recebem `score: null`, nunca um zero artificial.

## Simulação de troca

Para cada uma das melhores rotações R481 com titular e reserva resolvidos:

1. substituir o titular apenas no snapshot local do grafo;
2. recalcular somente os links afetados pela topologia da formação;
3. comparar score geral atual vs. simulado;
4. devolver `delta`, resumo de ganho/perda e nomes envolvidos.

Nenhuma simulação escreve escalação, preset, Cofre ou resultado.

## UI

Não criar item novo no menu principal.

No `IntegratedTeamLab`:

- o cartão `Entrosamento` passa a mostrar `chemistryR484.score`, confiança e links fortes reais;
- em `Escalação`, adicionar painel `Chemistry Graph • R484` com visão geral, setores, melhores/piores ligações e impacto das rotações;
- reutilizar classes visuais já existentes (`luxury-panel`, `v27-pairing-list`, `v27-recommendation-list`) para evitar CSS novo desnecessário.

## Autoridade e segurança

Obrigatório:

- `readOnly: true`
- `canChangeLineupAutomatically: false`
- `canWriteTraining: false`
- `canWriteSkills: false`
- `canWriteImpetus: false`
- `canChangePosition: false`
- `canOverrideSquadBrain: false`
- `canOverrideTacticalTwin: false`
- `canOverrideR128: false`
- `optimizeOverall: false`

O motor não pode importar writers de ficha, persistência, store ou APIs de rede.

A autoridade final permanece `R119 → R126 → R128`.

## Compatibilidade

O R484 precisa:

- ser determinístico para a mesma entrada;
- não mutar `team`, `players`, `records`, `twin` ou `squadBrain`;
- funcionar com escalação parcial;
- degradar com `links=[]`, `score=0` e avisos quando não houver pares suficientes;
- preservar R480, R481, R483 e os contratos históricos `v31.70/v31.76/v31.77/v38.32`;
- entrar no workflow de PR antes do build de produção.
