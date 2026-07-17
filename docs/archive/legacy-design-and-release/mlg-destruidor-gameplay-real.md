# Correção MLG + O destruidor

Esta versão adiciona regra específica para cartas `CMF/MLG` com estilo `O destruidor`.

## Nova regra

- `CMF` agora é exibido como `MLG` no app.
- Se a carta for `MLG/CMF` e o estilo for `O destruidor`, a prioridade de gameplay fica:
  1. `MLG`
  2. `VOL`
  3. `ZAG`
- O app não deve mais jogar automaticamente esse tipo de carta para `LE/LD`, mesmo que o OCR leia uma nota alta em lateral.

## Conversão de posições

- `CF → CA`
- `SS → SA`
- `LWF → PE`
- `RWF → PD`
- `LMF → ME`
- `RMF → MD`
- `AMF → MAT`
- `CMF → MLG`
- `DMF → VOL`
- `CB → ZAG`
- `LB → LE`
- `RB → LD`
- `GK → GOL`

## Objetivo

A análise continua priorizando gameplay real, não overall máximo.
