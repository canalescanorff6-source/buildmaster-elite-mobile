# BuildMaster Elite Tático v27.26 — rota automática direta

## Problema tratado

A primeira rota baseada na API `releases/latest` podia falhar por limite temporário, propagação ou resposta da API do GitHub. Embora existisse fallback, a experiência parecia uma falha do atualizador.

## Arquitetura corrigida

- O manifesto fixo `buildmaster-latest/update-manifest.json` é a rota principal.
- O manifesto principal aponta para o APK da release imutável.
- A API `releases/latest` é consultada somente quando o canal direto falha.
- O APK é enviado uma única vez, sem duplicação no release `buildmaster-latest`.
- Antes de ativar o manifesto, o workflow baixa o APK público e verifica SHA-256, tamanho, pacote, versão e assinatura.
- Após a ativação, o workflow baixa novamente o APK usando exatamente a URL presente no manifesto.

## Resultado esperado

A falha da API Latest não bloqueia a verificação nem a instalação automática. O canal fixo é independente do limite da API e continua compatível com a URL usada pelas versões antigas do aplicativo.
