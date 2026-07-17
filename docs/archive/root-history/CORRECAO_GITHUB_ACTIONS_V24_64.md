# Correção do GitHub Actions — v24.64

O workflow do APK foi corrigido para evitar travamento indefinido na instalação das dependências.

## Alterações

- `npm install` substituído por `npm ci`.
- Cache do npm ativado pelo `actions/setup-node`.
- Cache do Gradle ativado pelo `actions/setup-java`.
- Limite de 12 minutos para a instalação das dependências.
- Limite global de 45 minutos para o trabalho.
- Execuções antigas da mesma branch são canceladas quando uma nova começa.
- Removida a opção obsoleta `always-auth` do `.npmrc`.
- Workflow, trabalho e artefato atualizados para a versão v24.64.
- `package-lock.json` sincronizado com o nome e a versão do `package.json`.
- Comandos Capacitor passam a usar `npx --no-install`.
- APK final renomeado para `BuildMaster-Elite-Tatico-v24.64.apk`.

## Validação executada

- Instalação limpa com `npm ci`.
- TypeScript.
- Todos os testes de regressão (`npm run test:all`).
- Exportação estática do Next.js para o APK.

## Como executar

1. Envie este projeto para a branch `main` do GitHub.
2. Abra **Actions**.
3. Escolha **Gerar APK Android Fiel v24.64 Calibracao com Resultados Reais**.
4. Clique em **Run workflow**.
5. Ao finalizar, baixe o artefato **BuildMaster-Elite-Tatico-v24.64-APK-Fiel**.
