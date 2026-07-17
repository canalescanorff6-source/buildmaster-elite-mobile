# v17 — Correção de posição e estilo

## Problema encontrado

Havia um bug nas expressões regulares usadas para detectar a posição no badge da carta. Algumas strings usavam `\b`, `\d` e `\s` de forma incorreta dentro de template strings, fazendo o JavaScript interpretar parte da regex como caractere de controle ou texto comum.

Isso enfraquecia a leitura do padrão `overall + posição`, por exemplo:

- `103 CB`
- `98 DMF`
- `107 AMF`
- `104` na linha acima e `CB` na linha abaixo

Quando o badge falhava, o app caía em fallback pela grade de posições/overall. Isso causava erros como carta `ZAG` virar `LE`.

## Correção

- Regex do badge corrigida com escapes válidos.
- Leitura de posição principal prioriza `CARD BADGE`.
- Estilo de jogo agora passa por validação de compatibilidade com a posição original.
- Se o OCR detectar estilo incompatível, o app não exibe esse estilo no card principal; mantém a identidade mais segura e mostra aviso.

## Comportamento esperado

- Carta `CB / O destruidor` → card mostra `ZAG / O destruidor`.
- Carta `DMF / O destruidor` → card mostra `VOL / O destruidor`.
- Carta `AMF / Armador criativo` → card mostra `MAT / Armador criativo`.
- Melhor posição de gameplay pode ser recomendada abaixo, mas não altera o card principal.
