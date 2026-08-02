# Correção final do manifesto no CI — v31.81

## Problema

O diagnóstico consolidado validava um manifesto SHA-256 previamente gravado no repositório. Esse arquivo podia ficar divergente após normalização do Git, cópia do projeto, reparo de rotas ou atualização de arquivos, mesmo quando todos os testes de código estavam aprovados.

## Correção

- O manifesto deixou de bloquear o diagnóstico consolidado.
- O workflow agora gera o manifesto no próprio checkout do GitHub Actions e o verifica imediatamente em uma etapa dedicada.
- O nome padrão do manifesto é derivado automaticamente da versão em `package.json`.
- O workflow de APK foi sincronizado com a v31.81.
- O workflow de Google Play foi sincronizado com a v31.81.

## Resultado esperado

O diagnóstico executa os testes e regressões sem falhar por um manifesto antigo. Em seguida, o workflow cria `MANIFESTO_PRODUCAO_V31.81.sha256` com os arquivos efetivamente usados no build e valida os checksums antes de gerar o APK.
