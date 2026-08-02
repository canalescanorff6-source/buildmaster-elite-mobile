# BuildMaster Elite Tático v38.30 — Identidade e Habilidades Inteligentes

## Objetivo

Corrigir dois pontos críticos da geração de fichas sem adicionar novas telas ou poluir a interface:

1. preservar exatamente o nome confirmado pelo usuário;
2. impedir que uma das cinco vagas adicionais seja ocupada por uma habilidade que a carta já possui.

## Nome confirmado pelo usuário

O nome digitado ou corrigido na revisão passou a ter prioridade absoluta sobre qualquer nome encontrado pelo OCR no restante do print.

A ordem agora é:

1. nome informado em **Ajustes manuais**;
2. campo explícito `Nome do jogador`;
3. nome reconhecido pelo OCR;
4. nome do arquivo, apenas como último recurso.

A prévia da carta também exibe imediatamente o nome digitado, antes da ficha ser finalizada.

## Inventário completo de habilidades

O motor considera como já possuídas todas as categorias confirmadas na leitura:

- habilidades nativas da carta;
- habilidades adicionais já instaladas;
- habilidades especiais;
- habilidades especiais exclusivas identificadas pelo catálogo.

Essas habilidades são normalizadas pelo nome oficial e retiradas do conjunto elegível antes da montagem do Top 5.

## Proteção final contra repetição

A verificação de duplicidade passou a ocorrer novamente depois da última execução do Motor Avançado. Assim, nenhuma etapa posterior pode recolocar uma habilidade que já exista na carta.

O resultado final e a auditoria de integridade passam a usar exatamente o mesmo conjunto de cinco habilidades.

## Nova ação clean: “Já possui? Gerar outra”

Cada habilidade recomendada possui duas ações distintas:

- **Marcar como feita**: confirma que o usuário adicionou aquela habilidade no jogo;
- **Já possui? Gerar outra**: informa que a carta já tinha a habilidade antes da recomendação.

Ao usar **Já possui? Gerar outra**, o app:

1. registra a habilidade como já possuída;
2. remove a habilidade da vaga adicional;
3. impede que ela volte para o mesmo jogador e função;
4. reprocessa a carta completa;
5. recalcula o conjunto de cinco habilidades;
6. seleciona a melhor substituta oficial compatível.

A substituição não é sorteada nem escolhida aleatoriamente. Ela reaplica o motor completo considerando posição escolhida, estilo de jogo, atributos, função, perfil de gameplay, ficha, Booster, contexto de conexão, delay e estilo de controle já registrados.

Se não existir outra opção oficial segura, o app mantém a vaga sem inventar uma habilidade incompatível e informa isso ao usuário.

## Interface preservada

Nenhuma aba ou painel adicional foi criado. A nova opção aparece como uma ação secundária pequena dentro da própria lista de habilidades, mantendo o Resultado Premium Clean.

## Proteções preservadas

- exatamente cinco habilidades quando existem cinco opções oficiais compatíveis;
- nenhuma habilidade nativa repetida;
- nenhuma habilidade adicional já instalada repetida;
- nenhuma habilidade especial repetida;
- nenhuma habilidade incompatível com a posição apenas para completar a quantidade;
- posição escolhida pelo usuário preservada;
- orçamento exato de pontos preservado;
- foco em função e gameplay, sem priorização automática de overall.

## Testes adicionados

A regressão `tests/v38-30-name-skill-replacement-regression.ts` verifica:

- prioridade do nome manual sobre nomes incorretos encontrados pelo OCR;
- bloqueio de habilidade nativa no Top 5;
- separação de habilidade especial;
- sincronização entre recomendação final e auditoria;
- recomposição inteligente das cinco vagas;
- permanência da posição e do orçamento de pontos;
- integração da nova ação na interface.

## Cache

- esquema nativo: `38.30.0-name-skill-integrity-1`;
- service worker: `buildmaster-v38-30-name-skill-integrity-1`.
