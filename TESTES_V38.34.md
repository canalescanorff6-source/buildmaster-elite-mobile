# Testes e resultados reais — v38.34

## Testes aprovados neste ambiente

- `npm run quality:bundle`;
- `npm run quality:routes`;
- `npm run quality:syntax`;
- `npm run quality:interactive`;
- `npm run quality:visual`;
- `npm run quality:audit`;
- `npm run release:preflight`;
- `npm run release:play-preflight`;
- `npm run typecheck:v3833`;
- `npm run test:v3177`;
- `npm run test:v3771`;
- `npm run test:v3831`;
- `npm run test:v3832`;
- `npm run test:v3833`;
- `npm run test:v3834`.

## Resultados confirmados

- orçamento: 259 arquivos e 3.698.316 de 4.194.304 bytes — 88,2%;
- maior módulo abaixo do limite individual de 400 KiB;
- sintaxe aprovada em 349 arquivos TypeScript/TSX;
- contratos interativos: 720 botões tipados;
- acessibilidade: 27 imagens com texto alternativo;
- contraste, foco, toque e movimento reduzido aprovados;
- auditoria estrutural: 111 verificações aprovadas;
- pré-voo de produção: 124 verificações aprovadas;
- assinatura lógica do pré-voo: `2ca5b2abc30a516a`;
- pré-voo Google Play: 27 verificações aprovadas;
- regressão específica da v38.34 aprovada.

## Avisos não bloqueantes

- `src/components/CardVisionApp.tsx`: 3.972 linhas;
- `src/lib/analyzer.ts`: 3.431 linhas.

Esses arquivos continuam funcionais, mas devem ser modularizados antes de outro crescimento estrutural grande.

## Limitação do ambiente

O comando `npm ci` foi iniciado, porém não concluiu porque o registry intermediário retornou HTTP 404 para `zlibjs@0.3.1`.

Consequentemente, não foram confirmados localmente:

- o `npm run typecheck` global com uma instalação limpa de dependências;
- o build completo do Next.js;
- a geração e assinatura do APK/AAB;
- a instalação por cima do APK existente.

O typecheck direcionado do gerador v38.33 passou, e a incompatibilidade de propriedades indicada pelo GitHub foi corrigida diretamente no contrato do componente. A confirmação definitiva do typecheck global e do APK deve ocorrer no workflow **Gerar APK Canal Direto** após o push.

## Execução consolidada

Uma tentativa do conjunto completo `test:all` excedeu o tempo disponível neste ambiente. Por isso, esta documentação não afirma que todos os grupos históricos foram executados em uma única rodada. Os grupos listados acima foram executados individualmente e aprovados.
