# Testes — autorreparo da configuração TypeScript v38.39

## Causa confirmada no checkout do GitHub

O `tsconfig.json` publicado no commit que falhou estava configurado como uma fixture da regressão v31.70: continha `baseUrl: ../..`, aliases para `tests/types-v3170-ui`, `files` com stubs e compilava apenas `MatchTrainerCenter.tsx`.

## Testes executados e aprovados

- `npm run types:repair`
- `npm run quality:root-tsconfig`
- regressão temporária com `tsconfig.json` contaminado
- `npm run test:v3839`
- `npm run quality:typecheck-isolation`
- `npm run quality:ci-contract`
- `npm run release:preflight` — 127 verificações
- `node tests/v31-82-ci-protection-regression.mjs`
- `npm run test:v3110`
- `npm run test:v3170`
- `npm run quality:bundle` — 89,1% de 4 MiB
- `npm run quality:version-guards`
- `npm run quality:syntax` — 354 arquivos TS/TSX
- `npm run quality:interactive` — 726 botões e 27 imagens
- `npm run quality:visual`
- `npm run quality:card-crop-types`
- `npm run quality:native-java`
- `npm run quality:routes`
- `npm run release:play-preflight` — 27 verificações
- `npm run quality:audit` — 111 verificações

## Limitação do ambiente

O `npm ci` não concluiu neste ambiente porque o proxy interno não forneceu `zlibjs@0.3.1`. Por isso, o typecheck global com todas as dependências e a geração do APK serão confirmados no GitHub Actions. Os grupos que falhavam por contaminação do `tsconfig.json` foram executados e aprovados após a correção.
