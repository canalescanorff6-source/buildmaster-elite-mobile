# Testes executados — BuildMaster v38.35

## Falhas reproduzidas da execução anterior

Foram reproduzidas localmente as regressões que bloquearam o workflow:

- v31.82 rejeitava o orçamento protegido de 4 MiB;
- v34.00 não reconhecia o rótulo `Professional Suite · v38.34`;
- v36.00 não reconhecia o manifesto e a navegação da linha v38.34;
- proteções de cache antigas também precisavam reconhecer a v38.35.

## Testes aprovados após a correção

- `npm run test:v3182`;
- `npm run test:v3400`;
- `npm run test:v3600`;
- `npm run test:v3771`;
- `npm run test:v3831`;
- `npm run test:v3834`;
- `npm run test:v3835`;
- `npm run quality:audit` — 111 verificações;
- `npm run quality:bundle` — 3.698.322 de 4.194.304 bytes (88,2%);
- `npm run quality:syntax` — 349 arquivos TypeScript/TSX;
- `npm run quality:interactive` — 720 botões e 27 imagens;
- `npm run quality:visual`;
- `npm run quality:routes`;
- `npm run release:preflight` — 124 verificações, assinatura `7dc8c8ce6379a00e`;
- `npm run release:play-preflight` — 27 verificações.

## TypeScript completo

O comando foi iniciado, mas este ambiente não possui `node_modules`. Os erros retornados foram de módulos ausentes, como React, Next.js, Lucide e Capacitor. Portanto, isso não representa um erro de tipagem confirmado no código da v38.35. A confirmação integral depende do `npm ci` do GitHub Actions.

## APK

O APK não foi gerado localmente. A confirmação final de compilação, assinatura e atualização por cima ocorrerá no workflow `Gerar APK Canal Direto`.
