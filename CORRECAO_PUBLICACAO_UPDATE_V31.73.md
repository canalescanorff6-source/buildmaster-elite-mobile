# Correção de publicação e atualização — v31.73

## Causa
O código e o APK estavam configurados como 31.73.0, mas três regressões históricas ainda exigiam 31.72.0. O workflow `Gerar APK v31.73 Canal Direto` parava no diagnóstico consolidado antes de gerar o APK, a release e o manifesto do canal.

## Correções
- teste de publicação Play atualizado para 31.73.0;
- teste integrado de produção atualizado para 31.73.0;
- teste da interface premium atualizado para 31.73.0;
- validação do `APP_DATA_VERSION` e do manifesto PWA sincronizada com 31.73;
- diagnóstico consolidado corrigido para executar separadamente as regressões v31.72 e v31.73;
- nenhuma regra funcional de contas, fichas, gravação ou atualização foi removida.

## Resultado esperado
Após o workflow de APK terminar verde, o canal `buildmaster-update` passa a publicar o manifesto 31.73.0, a release imutável é criada e o aplicativo instalado recebe a oferta de atualização.
