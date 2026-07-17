# Correção: OCR lendo pontos como 2/2

Esta versão corrige um erro comum em prints do eFHUB/eFootBase: o OCR pode ler pequenos elementos da tela como se fossem `Pontos 2/2`.

## O que mudou

- O app não aceita mais automaticamente valores de pontos muito baixos quando existe `Nível máximo` lido na carta.
- Se o OCR ler algo como `Pontos 2/2`, mas a carta tiver nível máximo 32, o app ignora o 2/2 e calcula o orçamento pelo nível:
  - nível 32 = 62 pontos
  - nível 33 = 64 pontos
- A aba **Dados lidos** agora mostra se os pontos foram:
  - lidos no print;
  - calculados pelo nível;
  - ou usados como padrão do app.

## Exemplo

Para El-Hadji Diouf com `Nível 32`, se o print não mostrar claramente `Pontos 62/62`, o app usa automaticamente 62 pontos.

Assim a ficha deixa de sair quebrada com `2/2` e volta a usar o orçamento real do jogador.
