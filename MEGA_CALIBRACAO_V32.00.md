# BuildMaster Elite Tático v32.00 — Mega Calibração

A v32.00 acrescenta uma camada final de calibração sobre os motores existentes. Ela não tenta maximizar GER/overall: compara distribuições pelo encaixe funcional da carta, pelo custo real dos pontos e pelo comportamento esperado dentro da partida.

## Três perfis de ficha

- **Ranqueado robusto:** prioriza execução segura, resposta, passe, aceleração funcional, resistência a delay e estabilidade defensiva.
- **Universal equilibrado:** busca uma ficha única com bom rendimento no online e no offline.
- **Offline expressivo:** permite maior especialização em drible, condução, finalização e criatividade quando a conexão não limita a execução.

O usuário escolhe o perfil principal, mas o motor compara os três antes de confirmar a vencedora.

## Calibração por contexto real

A matriz considera simultaneamente:

- posição escolhida pelo usuário;
- posição registrada e Estilo de Jogo da carta;
- função exigida pela formação;
- estilo coletivo e proficiência do técnico;
- condição da conexão: estável, variável ou delay alto;
- modo de controle: equilibrado, passe, drible ou jogo direto;
- atributos base e déficits funcionais;
- habilidades nativas, especiais e cinco adicionais;
- Ímpetos existentes e recomendados;
- custo progressivo de cada grupo de treino;
- estabilidade entre ranqueado, universal e offline.

## Proteções

- usa exatamente o orçamento quando existe candidata exata;
- impede grupos de goleiro em jogadores de linha e vice-versa;
- penaliza investimento alto em grupos de pouca relevância para a função;
- não recebe overall como objetivo ou variável de pontuação;
- invalida o cache quando modo, conexão ou estilo de controle mudam;
- recalcula habilidades e Ímpetos depois da ficha definitiva;
- mantém a posição final escolhida pelo usuário;
- mostra bloqueios, avisos, confiança, prontidão e dez dimensões de encaixe.

## Painel de calibração

O resultado apresenta:

- nota final de calibração;
- quantidade de candidatas simuladas e candidatas de orçamento exato;
- encaixe de função, formação, Estilo de Jogo e controle;
- robustez de conexão;
- eficiência dos pontos;
- sinergia com habilidades e Ímpetos;
- proteção contra desperdício orientado a overall;
- estabilidade entre modos;
- comparação das três fichas.

## Referência de balanceamento

A referência de gameplay registrada pelo motor é **eFootball v5.4.0**, com data de calibração de 29/07/2026. A referência oficial orienta os pesos gerais, mas não transforma tendências competitivas em regras absolutas.

## Testes permanentes

A regressão `v32-00-mega-calibration-regression.ts` confirma:

- os três perfis;
- diferença real entre ranqueado e offline;
- orçamento exato;
- cinco habilidades únicas e complementares;
- exclusão de Ímpeto já existente;
- bloqueio de grupos incompatíveis;
- cache sensível ao contexto;
- ausência de foco em overall;
- sincronização das análises derivadas com a ficha final.
