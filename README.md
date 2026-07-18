# BuildMaster Elite Tático v27.26

Aplicativo Android/Next.js para criação de fichas, análise de jogadores, gestão tática, Cofre, contas/licenças e leitura de prints do eFootball.

## Atualização automática em três canais

A v27.26 compara simultaneamente o canal independente `buildmaster-update`, a ponte `buildmaster-latest` para versões antigas e a API `releases/latest`. O app escolhe sempre o manifesto com o maior `versionCode`, cria uma cópia local de recuperação, baixa o APK, valida integridade/pacote/versão/assinatura e abre o instalador Android automaticamente quando a permissão estiver liberada.

O Android ainda exige a liberação inicial de “Instalar apps desconhecidos” e o toque final em “Atualizar”.

Leia primeiro: `LEIA-PRIMEIRO-V27.26-ATUALIZACAO-AUTOMATICA-REAL.txt`  
Relatório: `docs/current/VALIDACAO_V27_26_ATUALIZACAO_AUTOMATICA_REAL.md`

## Comandos principais

```bash
npm ci
npm run typecheck
npm run test:all
npm run apk:build-web
```

A geração e assinatura do APK oficial são feitas pelo workflow `.github/workflows/build-apk.yml` com o secret permanente `ANDROID_SIGNING_BUNDLE`.
