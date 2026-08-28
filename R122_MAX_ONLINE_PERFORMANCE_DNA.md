# BuildMaster Elite Tático — r122

## Objetivo

A r122 transforma a autoridade Clean Slate em um otimizador de **máximo desempenho online** para partidas ranqueadas e casuais com amigos, sem usar Overall/GER como meta.

## Contrato permanente

- Uma única autoridade final continua responsável por ficha, Top 5 e Ímpeto.
- Motores históricos permanecem somente em diagnóstico, auditoria ou regressão.
- O nome do jogador não participa da pontuação da ficha.
- O DNA é inferido de atributos, habilidades nativas/adicionais/especiais, estilos e frequência provável das ações.
- A posição escolhida não reescreve a assinatura permanente da mesma carta.
- Nenhum grupo recebe pontos apenas para corrigir uma fraqueza global ou aumentar GER.

## Otimização online

Cada candidata passa a ser avaliada por:

1. execução das ações naturais;
2. resposta sob pressão;
3. sustentabilidade de stamina conforme carga funcional;
4. consistência de partida;
5. preservação do DNA;
6. desempenho projetado em Ranked;
7. desempenho projetado em amistoso online.

Ranked recebe peso maior na escolha, sem tornar a ficha extrema a ponto de perder identidade ou consistência em partidas com amigos.

## Por que esta ficha?

A r122 calcula o retorno marginal do último nível investido em cada grupo e mostra quais ações justificam esse gasto. Isso permite auditar por que existem pontos em Passe, Drible, Destreza, Pernas, Bola aérea, Defesa ou grupos de goleiro.

## Interface

A tela principal passa a mostrar:

- objetivo `Máximo online`;
- nota de Ranked;
- nota de partidas com amigos;
- confiabilidade sob pressão;
- consistência;
- sustentabilidade de stamina;
- preservação do DNA;
- seção `Por que esta ficha?` com retorno marginal dos grupos usados.

## Proteções

Marcadores estruturais:

- `BM_R122_ONLINE_OBJECTIVE`
- `BM_R122_NAME_AGNOSTIC`
- `BM_R122_MARGINAL_RETURN`
- `BM_R122_ONLINE_SINGLE_WRITER`

## Regressões

`npm run test:r122` valida:

- orçamento exato;
- autoridade única;
- independência de nome;
- independência de Overall/GER;
- estabilidade da assinatura com mudança da posição selecionada;
- influência real de habilidades no DNA;
- stamina adaptativa;
- bloqueio de finalização inútil em perfil defensivo;
- exposição do retorno marginal na interface.
