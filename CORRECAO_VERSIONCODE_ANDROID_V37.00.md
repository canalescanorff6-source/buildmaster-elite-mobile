# Correção do versionCode Android — v37.00

## Erro corrigido

O GitHub Actions parava em **Pré-compilar Java do atualizador** com:

- `android/app/build.gradle line: 10`
- `A problem occurred evaluating project ':app'`
- `Value is null`

A linha 10 do projeto Android gerado é o `versionCode`. A fórmula antiga reservava 60 milhões por versão principal. Na v37.00 ela produziria um número acima de `2.147.483.647`, limite do inteiro aceito pelo Android/Gradle.

## Solução aplicada

- substituição da fórmula semântica por uma época monotônica baseada em `github.run_number` e `github.run_attempt`;
- migração acima do último APK publicado (`2.110.001.431`);
- leitura das tags existentes para impedir regressão do código;
- bloqueio explícito antes do Gradle caso o limite Android seja alcançado;
- validação do número realmente gravado no `android/app/build.gradle`;
- teste de regressão permanente em `tests/v37-00-version-code-overflow-regression.mjs`.

A assinatura, o APK imutável, os manifestos de atualização e o restante do fluxo foram preservados.
