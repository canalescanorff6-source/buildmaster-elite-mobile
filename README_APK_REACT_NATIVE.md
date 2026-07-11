# Gerar APK React Native sem navegador

Esta versão é React Native/Expo. Ela não usa WebView para abrir o site publicado.

## Passos no GitHub

1. Envie o projeto para o repositório.
2. Entre em **Actions**.
3. Abra **Gerar APK React Native**.
4. Clique em **Run workflow**.
5. Aguarde o check verde.
6. Baixe o artifact.
7. Instale o APK no celular.

## Observação sobre Neon

A senha do Neon não deve ficar dentro do APK. Para sincronizar com Neon no app nativo, o certo é o app conversar com uma API segura no Vercel, e a API conversa com o Neon.

Por isso esta primeira versão salva localmente no celular. A sincronização com nuvem deve entrar depois, por API.
