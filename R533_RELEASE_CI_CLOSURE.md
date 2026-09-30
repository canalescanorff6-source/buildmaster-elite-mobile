# R533 — Release CI Closure

Data: 2026-09-30  
Base: R532 — Release Closure / Device Acceptance

## Objetivo

Fechar inconsistências de CI/release que ainda poderiam fazer o artefato publicado divergir do commit realmente compilado, do validador usado na aceitação física ou da versão atual do projeto.

## Estado

**SOURCE_RELEASE_CANDIDATE / CI_SOURCE_LOCKED / DEVICE_PENDING**

A R533 não altera OCR, ficha, PP, Skills, Ímpeto, Táticas, Cofre ou qualquer writer funcional. As mudanças ficam restritas a workflows, recibos de release, regressão e documentação.

## Correções

### 1. Source SHA único no APK direto

O build Android agora exporta `NEXT_PUBLIC_BUILDMASTER_BUILD_ID="$SOURCE_SHA"` no shell imediatamente antes do build web. O `buildId` do manifesto também usa `SOURCE_SHA`, não `GITHUB_SHA` do evento. Isso protege recompilações via `source_ref` e rollback.

### 2. Aceitação física usa o validador do mesmo commit da release

O workflow R532 baixa o manifesto e o APK, extrai `sourceSha`, busca esse commit e executa `git checkout --detach "$SOURCE_SHA"` antes de `npm run validate:r532:device`.

Assim, uma branch futura não pode mudar silenciosamente a regra usada para aceitar uma release antiga.

### 3. Gate legado R457 removido do build

A entrada `device_acceptance_json` e a validação R457 dentro de `build-apk.yml` foram removidas. A aceitação física permanece exclusivamente pós-release pelo gate R532, ligado ao APK imutável.

### 4. Recibo de estado R533

Novo `scripts/create-release-verification-r533.mjs` produz:

- `BUILD_VERIFIED / DEVICE_PENDING` após o APK assinado;
- `BUILD_VERIFIED / DEVICE_ACCEPTED` apenas depois do recibo físico R532 válido.

O recibo carrega package, sourceSha, SHA-256 do APK, versão, versionCode, tag e canal.

### 5. Workflow Google Play atualizado

`build-play-store.yml` estava travado em `40.70.0` e usava nomes/notas históricos. A R533:

- remove hardcode de versão;
- lê a versão atual de `package.json`;
- registra `SOURCE_SHA` real;
- embute esse SHA no build web;
- exige `ci:stabilize` sem alteração da árvore;
- executa `ci:gate` antes do AAB;
- usa notas de release da versão atual;
- remove nome de artefato histórico fixo.

### 6. Workflow YAML

Foi removida uma chave `uses:` duplicada no upload do diagnóstico do APK direto.

## Evidências executadas

- R419/R501→R518: GREEN.
- R519/R520→R530: GREEN.
- R531: GREEN.
- R532: GREEN.
- R533: GREEN.
- Regra Zero-Red: ponto fixo em 2 passagens, 0 divergências.
- `quality:syntax`: 826 TS/TSX aprovados.
- `quality:interactive`: 730 botões e 35 imagens aprovados.
- `quality:visual`: GREEN.
- `quality:routes`: GREEN.
- `quality:audit`: 127 verificações aprovadas.
- `release:preflight`: 138 verificações aprovadas.
- `release:play-preflight`: 27 verificações aprovadas.
- YAML válido: `build-apk.yml`, `device-acceptance-r532.yml`, `build-play-store.yml`.

## Limite ambiental

`npm ci` foi tentado novamente e falhou por indisponibilidade de rede/DNS do ambiente (`EAI_AGAIN` ao buscar tarballs em `registry.npmjs.org`). Portanto, nesta cópia ainda não há evidência local fresca para:

- `npm run typecheck` completo;
- `next build`/`apk:build-web` com dependências completas;
- Gradle/APK/AAB reais.

Esses gates permanecem obrigatórios no runner real do GitHub e não são marcados como GREEN por inferência.

## Próximo gate real

Depois do commit manual da R533:

1. rodar GitHub Actions do APK direto;
2. confirmar `npm ci`, `ci:gate`, build web, Capacitor/Gradle, assinatura e release imutável;
3. se usar Play, executar o workflow AAB atualizado;
4. instalar o APK imutável em aparelho físico;
5. preencher o template R532;
6. executar `Validar Aceitação Física R532`;
7. considerar a release `DEVICE_ACCEPTED` somente se o recibo aceito estiver anexado à mesma release.
