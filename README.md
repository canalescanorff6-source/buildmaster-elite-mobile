# BuildMaster Elite Tático v27.29

Aplicativo Android/Next.js para criação de fichas, análise de jogadores, gestão tática, Cofre, contas/licenças, leitura de prints e preparação de partidas do eFootball.

## Atualização automática reforçada

A v27.29 consulta os canais oficiais, escolhe o maior `versionCode` válido e ordena as rotas pelo histórico de sucesso do aparelho. O download nativo impede concorrência, solicita bytes sem compressão intermediária, alterna o tratamento de redirecionamentos e valida o arquivo recebido por tamanho real, SHA-256, estrutura APK, pacote, versão, `versionCode` e assinatura antes de abrir o instalador Android.

O fluxo de publicação mantém:

- release imutável por compilação;
- ativo versionado na ponte `buildmaster-latest`;
- `BuildMaster-Elite-Tatico-latest.apk` para clientes antigos;
- canal independente e API Latest como rotas adicionais;
- manifesto ativado somente depois da validação pública do APK.

Não é necessário alterar o Supabase nem substituir o secret `ANDROID_SIGNING_BUNDLE`. O Android ainda exige a autorização inicial para instalar apps desconhecidos e a confirmação final **Atualizar**.

## Qualidade e segurança

A auditoria da v27.29 cobre armazenamento local seguro, backups, isolamento de falhas, acessibilidade, service worker, workflow, assinatura, integridade do APK e regressões das fichas. A verificação obrigatória pode ser executada com:

```bash
npm ci
npm run typecheck
npm run quality:audit
npm run test:all
npm run apk:build-web
```

Relatório: `docs/current/AUDITORIA_COMPLETA_V27_29.md`  
Instruções: `LEIA-PRIMEIRO-V27.29-AUDITORIA-TOTAL.txt`

A geração e assinatura do APK oficial são feitas pelo workflow `.github/workflows/build-apk.yml` com o secret permanente `ANDROID_SIGNING_BUNDLE`.
