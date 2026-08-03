# Testes — Hotfix definitivo da regressão v31.20 na v38.39

## Testes executados e aprovados

- `npm run typecheck:v3110`
- `npm run test:v3120`
- execução dos dois testes v31.20 fora da raiz do projeto, a partir de `/tmp`
- `npm run test:v3839`
- `npm run quality:version-guards`
- `npm run quality:bundle`
- `npm run quality:syntax`
- `npm run quality:interactive`
- `npm run quality:visual`
- `npm run quality:audit`
- `npm run release:preflight`
- `npm run release:play-preflight`
- `npm run integrity:generate`
- `npm run integrity:verify`

## Resultados

- regressão v31.20 aprovada nos dois contratos;
- typecheck direcionado v31.10 aprovado;
- orçamento: 88,6% de 4 MiB;
- sintaxe: 351 arquivos TypeScript/TSX;
- contratos interativos: 720 botões e 27 imagens com `alt`;
- auditoria estrutural: 111 verificações;
- pré-voo de produção: 126 verificações;
- pré-voo Google Play: 27 verificações;
- manifesto de integridade: 769 arquivos.

## Teste completo

`npm run test:all` foi iniciado, mas o ambiente local atingiu o limite de tempo durante os typechecks legados anteriores à v31.20. Por isso, não é correto afirmar que todo o conjunto terminou localmente. Os grupos diretamente relacionados à falha e as verificações estruturais foram executados isoladamente e passaram.

O `npm ci`, o typecheck global com dependências instaladas e a geração do APK continuam dependentes do GitHub Actions.
