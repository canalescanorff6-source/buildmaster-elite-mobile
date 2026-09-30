# R532 — Release Closure / Device Acceptance

Data: 2026-09-29/30  
Base: R531 — Auditoria Final de Release  
Objetivo: fechar o contrato entre artefato de release e aceitação física sem declarar sucesso que não foi observado.

## Estado

**RELEASE_CANDIDATE_WITH_EXACT_DEVICE_ACCEPTANCE_GATE**

A R532 não altera OCR, ficha, PP, Skills, Ímpeto, Táticas, Cofre ou qualquer writer do core. Ela adiciona um gate de aceitação física ligado ao APK exato produzido pela release.

A aceitação física ainda precisa acontecer em um aparelho Android real depois que o GitHub Actions gerar o APK. Até esse recibo ser validado, não chamar a release de DEVICE_ACCEPTED.

## Mudanças R532

### 1. Template físico v2 ligado ao APK

Novo script `scripts/create-device-acceptance-template-r532.mjs` gera `device-acceptance-r532-template.json` após assinatura do APK com:

- `sourceSha` real compilado;
- SHA-256 do APK;
- versão;
- `versionCode`;
- tag imutável da release;
- canal;
- package Android;
- checklist físico R521–R530;
- cobertura mínima de cartas/posições e Cofre.

O template é enviado como artefato do workflow e como asset da release imutável.

### 2. Validator R532 fail-closed

Novo `scripts/validate-device-acceptance-r532.mjs` exige:

- schema v2;
- mesmo package `com.buildmaster.elitetatico`;
- mesmo `sourceSha`;
- mesmo SHA-256 do APK;
- mesma versão, `versionCode` e release tag;
- aparelho físico Android identificado;
- recibo com no máximo 7 dias;
- ao menos 10 cartas reais;
- cobertura GK, CB, DMF/CMF, AMF/SS e CF;
- Cofre com pelo menos 225 itens;
- fluxo R521–R530 aprovado;
- fluxo completo sem crash;
- regressões 0/56, persistência, formação, banco e atualização aprovadas.

Um checksum diferente foi testado e corretamente rejeitado.

### 3. Workflow separado para o mesmo APK

Novo `.github/workflows/device-acceptance-r532.yml`:

1. recebe a `release_tag` já gerada e o recibo JSON preenchido;
2. baixa o manifesto imutável dessa release;
3. resolve o `assetName` exato a partir do manifesto;
4. baixa o APK exato da mesma release;
5. recalcula SHA-256 e compara com o manifesto;
6. extrai `sourceSha`, versão, `versionCode`, tag e canal do manifesto;
7. executa `npm run validate:r532:device`;
8. somente em GREEN anexa `device-acceptance-r532-accepted.json` à mesma release.

Isso evita validar um APK diferente do que foi realmente testado no aparelho.

### 4. Manifesto de release

O manifesto de atualização passa a registrar explicitamente:

- `sourceSha` real do checkout (`SOURCE_SHA`);
- `deviceAcceptance.schemaVersion = 2`;
- `deviceAcceptance.status = pending` no momento do build;
- nome do template físico R532.

A prova aceita posteriormente fica como asset separado da release, preservando a imutabilidade do manifesto original.

### 5. Manifesto de integridade atual

O workflow ainda anexava `MANIFESTO_PRODUCAO_V34.00.sha256`. A R532 corrige o pacote de release para anexar `MANIFESTO_PRODUCAO_V40.80.sha256`, que corresponde à árvore atual.

## Evidências executadas nesta rodada

- `test:r532`: GREEN.
- teste positivo do template + validator R532: GREEN.
- teste negativo com checksum divergente: corretamente RED.
- YAML de `build-apk.yml`: parse válido.
- YAML de `device-acceptance-r532.yml`: parse válido.
- `test:r531`: GREEN.
- `test:r457:release-gate`: GREEN (compatibilidade legada preservada).
- R519/R520 → R530: GREEN.
- R419 → R518: GREEN.
- `quality:syntax`: 826 TS/TSX aprovados.
- `quality:interactive`: 730 botões e 35 imagens aprovados.
- `quality:visual`: GREEN.
- `quality:routes`: GREEN.
- `quality:audit`: 127 verificações aprovadas.
- `release:preflight`: 138 verificações aprovadas.
- `release:play-preflight`: 27 verificações aprovadas.
- `quality:bundle`: 98,9% do orçamento TypeScript — GREEN com alerta de proximidade do teto.

## Limite ambiental ainda aberto

A instalação de dependências continua incompleta neste ambiente. Por isso:

- `typecheck` para em definições ausentes de `fs-extra`, `node`, `react`, `react-dom` e `slice-ansi`;
- `next build` para com `next: not found`;
- `ci:preflight` passa 14/15 grupos e reprova somente compatibilidade das dependências.

Esses pontos devem ser comprovados no GitHub Actions, onde `npm ci` instala a árvore completa.

## Definition of Done da R532

A implementação R532 está concluída quando o código contém o template, validator, workflow separado, manifesto atualizado e regressão correspondente — condição atendida nesta cópia.

A **release física** só estará concluída quando:

1. GitHub Actions concluir `npm ci`, `typecheck`, `ci:gate`, build web e Android;
2. APK assinado for publicado em uma tag imutável;
3. o APK dessa tag for instalado em aparelho físico;
4. o template R532 for preenchido com evidência real;
5. `Validar Aceitação Física R532` ficar GREEN;
6. `device-acceptance-r532-accepted.json` aparecer na mesma release.

## Próxima etapa

Depois do commit manual desta base: observar o CI real. Se o build ficar GREEN, baixar o APK gerado, testar no aparelho e executar o workflow R532 com o recibo do template. Se houver RED de dependência/typecheck/build/Gradle, corrigir a causa antes de aceitar fisicamente.
