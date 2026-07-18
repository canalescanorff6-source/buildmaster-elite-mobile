# BuildMaster Elite Tático v27.21 — Atualizador Definitivo

A v27.21 preserva todas as melhorias da v27.20 e reconstrói o sistema de atualização Android para eliminar a dependência de um arquivo mutável. O novo canal usa **release imutável**, consulta pela **API oficial de releases do GitHub**, validação pública antes de ativar e fallback compatível com APKs antigos.

## Leia primeiro

- `LEIA-PRIMEIRO-V27.21-ATUALIZADOR-DEFINITIVO.txt`
- `docs/current/ATUALIZADOR_DEFINITIVO_V27_21.md`
- `docs/current/AUDITORIA_COMPLETA_V27_20.md`
- `TESTE_APARELHO_REAL_V27_10.md`

## Atualização Android

O fluxo de produção é:

```text
build release assinado
→ release imutável isolada
→ upload do APK e manifesto
→ download público de verificação
→ tamanho + SHA-256 + assinatura + versionCode
→ release marcada como latest
→ canal antigo atualizado para compatibilidade
```

A v27.21 consulta a API `releases/latest`. Se a API estiver temporariamente indisponível, usa o manifesto oficial da release `buildmaster-latest`.

## Fluxo principal do app

```text
Print único ou leitura completa
→ auditoria dos campos reconhecidos
→ confirmação da identidade da carta
→ escolha soberana da posição
→ ficha exata com explicação dos investimentos
→ encaixe no time e nas formações
→ validação pós-jogo
```

## Desenvolvimento

Requisitos:

- Node.js 22.16 ou superior, abaixo da versão 25;
- npm com `package-lock.json` preservado.

Comandos principais:

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:v2721
npm run test:all
npm run apk:build-web
```

## APK e publicação

Use somente o workflow:

```text
Gerar APK e publicar atualização definitiva
```

Mantenha o Secret permanente `ANDROID_SIGNING_BUNDLE` e as Variables do Supabase. Não envie keystore, `.env`, token ou credencial ao repositório.

## Estrutura atual

```text
src/modules/card-reader   Print Único Pro, fila e processamento
src/modules/builds        orçamento de pontos e motor de fichas
src/modules/players       Laboratório do Jogador
src/modules/squad         time, encaixe e detector de lacunas
src/modules/matches       partida e pós-jogo
src/modules/core          repositório e inteligência integrada
src/lib/appUpdates.ts     confiança, manifesto e avaliação de atualização
scripts/install-android-security-plugin.mjs  download e instalação nativa
tests                     regressões funcionais e de publicação
```
