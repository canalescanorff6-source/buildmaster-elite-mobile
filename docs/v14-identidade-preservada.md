# BuildMaster Local Pro v14 — Identidade da carta preservada

Correção feita para impedir que o card principal altere a posição ou o estilo do jogador.

## Regra nova

A área visual da carta sempre mostra a identidade lida no print:

- posição principal da carta;
- estilo de jogo da carta;
- overall lido;
- imagem recortada do jogador.

A recomendação de gameplay fica separada nos textos e abas:

- melhor posição real;
- ranking de posições;
- ficha Elite;
- habilidades adicionais;
- ímpetos recomendados.

Exemplo:

- Carta: ZAG + O destruidor
- Card principal: continua ZAG + O destruidor
- Recomendação: pode dizer ZAG, VOL, LE ou LD conforme a função real, mas sem mudar a identidade visual da carta.

## Correções internas

- O motor deixou de trocar `mainPosition` com base em overall/estilo.
- O detector de estilo agora prioriza o topo da carta para não confundir listas/menus com estilo do jogador.
- A aba de posições separa `Identidade da carta` de `Ranking de gameplay real`.
