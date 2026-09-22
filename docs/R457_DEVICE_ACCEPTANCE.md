# R457 — Aceitação física obrigatória antes de Stable

A CI verde não significa "100% validado".

## Fluxo de publicação

1. Push na `main` gera **BETA**.
2. Instale o beta em aparelho físico.
3. Use **o mesmo commit/SHA** que será promovido.
4. Teste no mínimo 10 cartas reais, cobrindo:
   - GK
   - CB
   - DMF ou CMF
   - AMF ou SS
   - CF
5. Teste Cofre com pelo menos 225 entradas.
6. Preencha o recibo JSON.
7. Rode manualmente o workflow escolhendo `stable` e cole o JSON no campo
   `device_acceptance_json`.
8. O workflow valida `sourceSha`, data, aparelho físico e todos os checks.
9. Só então o canal stable pode ser publicado.

## Cadeia real obrigatória

Carta -> edição exata -> ficha -> 5 skills finais -> Ímpeto -> salvar -> fechar app ->
abrir -> mesma decisão -> formação -> banco/substituições -> gameplay -> feedback ->
reanálise -> atualização APK.

## 0/56

O check `zero56RegressionChecked` só é verdadeiro depois de confirmar no aparelho que
uma ficha com PP válido não reaparece vazia como `0 usados / 56 disponíveis`.

## Observação

Rollback de emergência para uma base conhecida como boa permanece permitido pelo
mecanismo atual de rollback. Isso não equivale a uma nova certificação R457.
