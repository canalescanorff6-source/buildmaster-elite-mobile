# BuildMaster Elite Tático — Motor Supremo de Fichas v38.70

## Objetivo

A v38.70 amplia a v38.60 com uma camada final de otimização robusta. A ficha deixa de ser escolhida apenas pela melhor média interna e passa a sobreviver a múltiplas fases da partida, arquétipos de adversário, incerteza de leitura e comparação Pareto. Overall/GER permanece fora da decisão.

## Autoridade final do pipeline

Ordem preservada:

1. inteligência de carta e correções locais;
2. integridade das habilidades;
3. Motor Avançado v37.50;
4. Motor de Desempenho v38.50;
5. Motor Máximo v38.60;
6. Motor Supremo v38.70;
7. auditoria final de habilidades.

## Núcleo novo

- quatro rodadas de busca em feixe;
- centenas de distribuições únicas avaliadas, variando conforme a carta;
- orçamento exato obrigatório;
- posição escolhida preservada;
- seis fases da partida;
- seis arquétipos de adversário;
- envelope esperado/conservador/otimista;
- fronteira de Pareto;
- retorno marginal por grupo de treino;
- matriz de gatilhos das cinco habilidades;
- estresse dos Ímpetos contra o pior caso;
- ficha principal e três alternativas situacionais;
- protocolo A/B para validação em partidas.

## Fases avaliadas

- saída de bola;
- progressão central;
- terço final;
- transição defensiva;
- defesa organizada;
- minutos finais.

O peso de cada fase muda conforme a posição. Um meia-atacante não é penalizado como se fosse zagueiro, e um zagueiro não é premiado por atributos ofensivos que não executam sua função principal.

## Arquétipos de adversário

- bloco baixo;
- pressão alta;
- contra-ataque veloz;
- time físico e compacto;
- controle por posse;
- adversário competitivo equilibrado.

## Proteção contra investimento inadequado

A v38.70 inclui limites funcionais suaves por posição. Eles não bloqueiam automaticamente um grupo, mas penalizam investimento excessivo em áreas que não sustentam a função. O estilo oficial da carta pode ampliar limites específicos, como jogo aéreo para um centroavante pivô ou passe para um defensor criativo.

## Habilidades adicionais

O Top 5 continua sem repetir habilidades nativas, especiais ou adicionais existentes. Cada habilidade recebe:

- frequência provável de ativação;
- fases cobertas;
- adversários cobertos;
- dependência dos atributos da ficha;
- justificativa funcional.

## Ímpetos

Os Ímpetos são recalculados usando a distribuição vencedora da v38.70. A nota considera ganho na pior fase, ganho contra o pior adversário e risco de saturação.

## Validação

A ficha é uma recomendação de desempenho esperado. O app não declara perfeição e orienta teste A/B em pelo menos dez partidas, separando condições de conexão e registrando ações da função, não apenas gols e assistências.
