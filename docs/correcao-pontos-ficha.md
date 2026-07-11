# Correção da ficha por pontos reais do eFootball

Esta versão corrige a geração da ficha para usar o custo real progressivo dos pontos de treino do eFootball.

## Por que 64 pontos viram apenas 41 níveis?

No eFootball, cada categoria não custa 1 ponto para sempre:

- níveis 1 a 4 custam 1 ponto cada;
- níveis 5 a 8 custam 2 pontos cada;
- níveis 9 a 12 custam 3 pontos cada;
- níveis 13 a 16 custam 4 pontos cada.

Exemplo da ficha do Edgar Davids:

- Passe +8 = 12 pontos
- Drible +4 = 4 pontos
- Destreza +4 = 4 pontos
- Força nas pernas +8 = 12 pontos
- Bola aérea +4 = 4 pontos
- Defesa +13 = 28 pontos

Total: 64/64 pontos.

## O que mudou

- O app tenta ler `Pontos 64 / 64` quando aparecer no print.
- Se não ler os pontos, ele infere pelo nível máximo: exemplo, nível 33 vira 64 pontos.
- A ficha agora mostra os níveis e o custo real em pontos.
- A IA ajusta a ficha ao orçamento real disponível.
- Para cartas como VOL/Destruidor, a distribuição prioriza Defesa, Passe, Força nas pernas, Destreza, Drible e Bola aérea.

## Observação

Para máxima precisão, use print nítido da tela de construção da carta quando quiser que o app leia diretamente os pontos disponíveis.
