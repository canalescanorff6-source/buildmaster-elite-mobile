# Atualização automática reforçada — v27.29.0

A v27.29 mantém a compatibilidade com as versões antigas e corrige pontos que podiam fazer o APK baixado divergir do manifesto ou repetir uma rota já defeituosa.

O atualizador agora memoriza falhas por rota, evita downloads simultâneos, solicita bytes sem compressão, limita as tentativas e só aceita o APK depois de conferir tamanho real, SHA-256, cabeçalho, pacote, versão, `versionCode` e assinatura. O workflow publica os canais somente depois de baixar e validar publicamente o próprio arquivo.

Não altere o Supabase e não substitua o `ANDROID_SIGNING_BUNDLE`. Substitua todo o repositório, incluindo `.github`, faça um novo commit na `main` e aguarde o workflow v27.29 terminar em verde.
