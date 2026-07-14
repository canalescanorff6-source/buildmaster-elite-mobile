# BuildMaster Elite Tático v26.70 — Build Android seguro

## Antes de gerar

- mantenha `package.json` e `package-lock.json` sincronizados;
- não envie `node_modules`, `.next`, `out` ou `android` antigos;
- use a branch `main` para a publicação automática;
- configure a assinatura persistente antes de distribuir atualizações por cima.

## Workflow

Execute **Gerar APK e publicar atualização v26.70**. Ele cria:

- `BuildMaster-Elite-Tatico-v26.70.apk`;
- `update-manifest.json`;
- artefato do GitHub Actions;
- release móvel `buildmaster-latest`, quando a assinatura persistente estiver habilitada.

## Se o app antigo tiver outra assinatura

1. Exporte o backup dos jogadores treinados.
2. Desinstale a versão antiga.
3. Instale uma vez o APK assinado de forma persistente.
4. Restaure o backup.

A partir daí, os APKs futuros assinados com a mesma chave podem ser instalados por cima.
