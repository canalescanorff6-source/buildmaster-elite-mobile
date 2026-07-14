# APK Nativo — BuildMaster Elite Tático v26.70

O projeto usa Capacitor para abrir o aplicativo dentro do próprio APK Android, sem redirecionar a interface principal para o navegador.

## Build pelo GitHub

O workflow executa:

1. instalação travada com `npm ci`;
2. TypeScript e testes;
3. exportação estática segura;
4. geração do projeto Android;
5. compilação do APK;
6. assinatura persistente, quando os Secrets estiverem configurados;
7. publicação do APK e de `update-manifest.json` na release `buildmaster-latest`.

## Neon Cloud

O APK estático pode chamar uma API online. Configure a variável de repositório:

`BUILDMASTER_CLOUD_API_URL=https://SEU-DOMINIO/api/cloud/fichas`

Sem uma API válida, os recursos locais continuam disponíveis, mas a sincronização Neon não funcionará.

## Atualizações

A Central de Atualizações consulta o manifesto publicado pelo workflow. O Android exige confirmação do usuário para instalar um APK baixado. Alterações nativas sempre exigem um novo APK.
