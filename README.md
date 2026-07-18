# BuildMaster Elite Tático v27.23 — Melhorias e atualização automática

A v27.23 preserva as funções do aplicativo e melhora principalmente a atualização Android. A rede do atualizador foi separada da interface, ganhou diagnóstico próprio, histórico técnico e recuperação em três rodadas antes de apresentar uma falha ao usuário.

## Leia primeiro

- `LEIA-PRIMEIRO-V27.23-MELHORIAS-ATUALIZACAO.txt`
- `docs/current/VALIDACAO_V27_23_MELHORIAS_ATUALIZACAO.md`
- `docs/current/AUDITORIA_COMPLETA_V27_20.md`
- `TESTE_APARELHO_REAL_V27_10.md`

## Novidades da v27.23

- Botão **Testar atualizador**, sem baixar o APK.
- Verificação de conexão, canal oficial, pacote, versão, versionCode, permissão e armazenamento.
- Histórico técnico das verificações, downloads e instalação.
- Botão para copiar o diagnóstico completo.
- Limpeza somente do cache de atualização, sem apagar fichas ou configurações.
- Recuperação em até três rodadas no app, além das tentativas do downloader nativo.
- Recuperação do manifesto pendente ao reabrir a tela.
- Interface responsiva para celular e desktop.

## Publicação Android

O fluxo de produção é:

```text
build release assinado
→ release imutável isolada
→ upload do APK e manifesto
→ download público de verificação
→ tamanho + SHA-256 + assinatura + versionCode
→ APK antigo preservado
→ manifesto de compatibilidade ativado por último
→ release nova marcada como Latest
```

A v27.23 consulta primeiro a API `releases/latest`. Se essa rota estiver temporariamente indisponível, usa o manifesto oficial da release `buildmaster-latest`, compatível com a v27.00 já instalada.

## Desenvolvimento

Requisitos:

- Node.js 22.16 ou superior, abaixo da versão 25;
- npm com `package-lock.json` preservado.

Comandos principais:

```bash
npm ci
npm run typecheck
npm run test:v2723
npm run test:all
npm run apk:build-web
```

## APK e publicação

Use somente o workflow:

```text
Gerar APK v27.23 e publicar atualização automática
```

Mantenha o Secret permanente `ANDROID_SIGNING_BUNDLE` e as Variables do Supabase. Não envie keystore, `.env`, token ou credencial ao repositório.

## Estrutura atual

```text
src/lib/updateChannel.ts  consulta API Latest e ponte de compatibilidade
src/lib/updateAudit.ts    histórico local seguro do atualizador
src/components/UpdateCenterPanel.tsx  diagnóstico e instalação
src/lib/appUpdates.ts     confiança, manifesto e comparação de versões
scripts/install-android-security-plugin.mjs  download e instalação nativa
.github/workflows/build-apk.yml  assinatura e publicação atômica
tests                     regressões funcionais e de publicação
```
