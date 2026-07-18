# Relatório de validação — v27.21.0

## Código e testes

- TypeScript estrito: aprovado (`npm run typecheck`).
- Regressão do atualizador v27.21: aprovada.
- Regressões de atualização, segurança, assinatura, backup e publicação: aprovadas.
- Suíte funcional completa executada em blocos: todos os testes declarados em `test:all` foram aprovados.
- YAML do GitHub Actions carregado e validado.
- Dependências instaladas compatíveis com o `package-lock.json` (`npm ls --depth=0`).

## Exportação e Android

- Exportação estática Next.js 16 com Turbopack: aprovada.
- Restauração automática de `src/app/api` e `middleware.ts` após o export: aprovada.
- Criação do projeto Capacitor Android: aprovada.
- Instalação e sincronização do plugin nativo: aprovada.
- Java gerado verificado quanto a erros de sintaxe; as referências Android só são resolvidas no runner com Android SDK.

## Publicação que ainda depende do GitHub

A geração do APK release assinado e o teste final em aparelho exigem o Secret `ANDROID_SIGNING_BUNDLE`, as Variables do Supabase, Android SDK e o ambiente do GitHub Actions. O workflow incluído executa essa etapa após o novo commit na branch `main`.
