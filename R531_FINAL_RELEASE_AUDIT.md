# R531 — Auditoria Final de Release

Data de auditoria: 2026-09-29/30
Base: R530 / R-VIS 11
Objetivo: auditar a atualização completa sem adicionar nova autoridade funcional ao core.

## Classificação atual

**SOURCE_RELEASE_CANDIDATE / GATE B preservado.**

O código-fonte está convergido nos gates que podem ser executados sem dependências externas. A release **não deve ser chamada de 100% certificada** até uma execução com instalação completa de dependências comprovar `typecheck`, `next build`, build estático/Capacitor e APK assinado no CI/dispositivo.

A certificação funcional do motor continua fail-closed: R517/R518 não promovem artificialmente o R510 nem transformam ausência de `REAL_MATCH_DATA` suficiente em `ENGINE_CERTIFIED`.

## Correções R531

### 1. Manifesto de integridade

O `MANIFESTO_PRODUCAO_V40.80.sha256` estava desatualizado em relação à árvore real R530. O manifesto foi regenerado a partir da fonte atual e `integrity:verify` passou.

### 2. Zero-Red / sanitizer forward-only

`ci:stabilize` encontrou um conflito real: `apply-r413-progressive-vault-render.mjs` tentava reaplicar um fragmento textual histórico do R413 depois que o R527 acrescentou classes visuais à mesma estrutura. A funcionalidade R413 já estava presente, mas o patcher exigia o texto antigo exatamente e abortava com `ocorrências=0`.

A correção R531 faz o patch R413 reconhecer semanticamente a árvore já convergida antes de tentar os replacements históricos. Não altera paginação, Cofre, PP, comparação, filtros ou writer do core.

Foi adicionado `tests/v40-80-r531-sanitize-forward-idempotence-regression.mjs`, protegido por `npm run test:r531` e incluído em `ci:gate`.

Com uma pasta `.git` temporária usada somente para simular o ambiente GitHub, `npm run ci:stabilize` atingiu ponto fixo em duas passagens com **0 arquivos divergentes**.

## Evidências verdes

- `quality:syntax`: 826 arquivos TypeScript/TSX aprovados.
- `quality:interactive`: 730 botões tipados e 35 imagens com `alt`.
- `quality:visual`: contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.
- `quality:audit`: 127 verificações aprovadas.
- `release:preflight`: 138 verificações aprovadas.
- `release:play-preflight`: 27 verificações aprovadas.
- `quality:routes`: rotas críticas aprovadas.
- `quality:bundle`: fonte dentro do orçamento; uso observado em 98,9% do teto configurado.
- R419 executou o gate integrado Card Truth → Projected State → Skills/Ímpeto → Gameplay/Posse → Joint Optimizer → Golden/Calibration → R517/R518 sem regressão.
- Os testes individuais restantes R506→R518 e o redesign R519/R520→R530 passaram.
- `test:r531`: sanitizer forward-only idempotente sobre a árvore moderna pós-R527.
- `integrity:verify`: manifesto final correspondente à árvore desta release.

## Limites que ainda precisam do CI real

### Dependências

O ZIP de commit manual não inclui `node_modules`. Duas tentativas de `npm ci` neste ambiente não concluíram dentro do limite da ferramenta. Por isso `quality:dependencies` acusa pacotes ausentes; isso não foi interpretado como defeito de versão do projeto.

### Typecheck

O `tsc` global consegue iniciar, mas sem as dependências instaladas interrompe em tipos ausentes (`node`, `react`, `react-dom`, etc.). Portanto **typecheck completo não está certificado nesta auditoria local**.

### Build web / APK

`next build`, `apk:build-web`, Capacitor sync e build Android dependem da instalação completa de pacotes. Devem ser comprovados pelo GitHub Actions após o commit manual. O pré-voo estrutural de Android/Play passou, mas isso não substitui o APK realmente compilado e assinado.

### Aceitação física

Instalação, abertura, OCR/câmera, persistência e fluxo completo em aparelho Android continuam sendo validação física externa ao ZIP.

## Gate para considerar a atualização pronta para publicação

Após o commit deste pacote, exigir no GitHub:

1. `npm ci` concluído.
2. `quality:dependencies` verde.
3. `typecheck` verde.
4. `ci:gate` verde, incluindo `test:r531`.
5. `build`/build estático verde.
6. Capacitor/Android sync e compilação verde.
7. APK assinado gerado pelo workflow correto.
8. Smoke test físico do APK.
9. Nenhuma promoção artificial para `ENGINE_CERTIFIED` sem evidência real suficiente.

## Próxima decisão

Se o CI após o commit ficar completamente verde, a próxima etapa é **R532 — Release Closure / Device Acceptance**, focada em validar o artefato gerado (APK/web) em vez de continuar redesenhando telas.
