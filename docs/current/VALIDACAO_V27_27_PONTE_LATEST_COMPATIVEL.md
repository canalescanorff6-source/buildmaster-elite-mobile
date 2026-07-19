# BuildMaster Elite Tático v27.27 — ponte `latest.apk` compatível

## Diagnóstico confirmado

O APK v27.00 instalado consulta o manifesto fixo abaixo:

`https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/update-manifest.json`

Além disso, o código TypeScript e o plugin Android dessa versão exigem que o endereço do APK também pertença à release `buildmaster-latest`. O fluxo da v27.26 atualizava o manifesto dessa release, mas apontava o campo `apkUrl` para uma release imutável chamada `buildmaster-v...`.

Isso fazia a v27.00 rejeitar o manifesto antes mesmo de iniciar o download. As capturas enviadas também mostram que `update-manifest.json` havia sido atualizado recentemente, enquanto `BuildMaster-Elite-Tatico-latest.apk` continuava com data antiga.

## Correção aplicada

1. A release imutável continua sendo criada para as versões novas.
2. O mesmo APK assinado recebe uma cópia chamada `BuildMaster-Elite-Tatico-latest.apk`.
3. Essa cópia é publicada dentro da release `buildmaster-latest`.
4. O workflow baixa a cópia pública e compara tamanho e SHA-256.
5. Somente depois dessa validação o `update-manifest.json` antigo é substituído.
6. O manifesto da ponte aponta exatamente para:

`https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk?...`

7. A validação final repete o contrato do APK v27.00: mesma release, nome permitido, checksum e tamanho corretos.

## O que não precisa ser alterado

- Supabase;
- `ANDROID_SIGNING_BUNDLE` já existente;
- permissões adicionais além de `contents: write` no workflow;
- criação manual de Release;
- download manual do APK.

## Validações locais

- TypeScript sem erros.
- Build estático do Next.js concluído.
- YAML do workflow analisado.
- 34 blocos shell do workflow passaram em `bash -n`.
- Testes específicos v27.27, v27.26, v27.25, v27.22 e integridade da release aprovados.
- Toda a suíte foi executada em blocos por limite de tempo do ambiente; todos os testes individuais foram aprovados.
- Nenhum manifesto placeholder ficou dentro de `public`, `out` ou dos assets Android.

## Prova final necessária

A geração do APK assinado ocorre no GitHub Actions porque depende do Secret privado. A confirmação final acontece quando o workflow v27.27 termina verde e a v27.00 instalada encontra, baixa e abre a atualização pelo próprio aplicativo.
