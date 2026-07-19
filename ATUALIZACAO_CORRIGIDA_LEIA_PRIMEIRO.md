# Atualização automática corrigida — v27.28.0

O erro visto na v27.26 acontece depois que a atualização é encontrada e antes do instalador Android: o APK recebido não corresponde ao tamanho/SHA-256 informado pelo manifesto.

A v27.28 corrige a causa estrutural. A rota principal usa um APK versionado e imutável dentro de `buildmaster-latest`; o workflow valida publicamente esse mesmo endereço antes de publicar o manifesto. A nova versão também percorre rotas realmente diferentes e mostra o diagnóstico completo quando houver divergência.

Não altere Supabase nem `ANDROID_SIGNING_BUNDLE`. Substitua todo o repositório, incluindo `.github`, faça um novo commit na `main` e aguarde o workflow da v27.28 terminar em verde.
