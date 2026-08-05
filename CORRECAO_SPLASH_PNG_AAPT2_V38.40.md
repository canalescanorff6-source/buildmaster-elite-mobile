# Correção da splash PNG e do AAPT2 — v38.40

## Falha corrigida

O Gradle interrompia a tarefa `:app:mergeReleaseResources` porque o arquivo
`drawable-nodpi/buildmaster_native_splash.png` estava truncado no bloco `IDAT`.
O AAPT2 encerrava o processo sem conseguir apresentar a mensagem normal de erro.

## Correções aplicadas

- substituição da splash truncada pela arte original válida de 2732 × 2732 pixels;
- validação completa da estrutura dos PNGs antes de copiá-los ao projeto Android;
- descompressão dos blocos `IDAT` para detectar checksum incompleto ou arquivo truncado;
- validação repetida depois da instalação dos recursos no projeto Android;
- teste de regressão para impedir a publicação de PNG incompleto nas próximas versões.
