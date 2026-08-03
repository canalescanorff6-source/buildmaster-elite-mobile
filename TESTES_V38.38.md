# Testes reais — BuildMaster v38.38

## Aprovados

- `npm run test:v3500`;
- `npm run test:v3520`;
- `npm run test:v3837`;
- `npm run test:v3838`;
- `npm run test:v3170`;
- `npm run test:v3177`;
- `npm run test:v3300`;
- `npm run test:v3400`;
- `npm run test:v3600`;
- `npm run test:v3832`;
- `npm run test:v3833`;
- `npm run test:v3834`;
- `npm run test:v3835`;
- `npm run test:v3836`;
- `npm run test:v3771`;
- `npm run quality:bundle`;
- `npm run quality:syntax`;
- `npm run quality:interactive`;
- `npm run quality:visual`;
- `npm run quality:audit`;
- `npm run release:preflight`;
- `npm run release:play-preflight`;
- `npm run integrity:verify`.

## Resultados

- orçamento: 3.714.485 de 4.194.304 bytes, 88,6%;
- sintaxe: 351 arquivos TypeScript/TSX;
- contratos: 720 botões e 27 imagens com texto alternativo;
- auditoria: 111 verificações;
- pré-voo: 126 verificações;
- assinatura lógica: `091c12af08149787`;
- pré-voo Google Play: 27 verificações;
- manifesto de integridade: 758 arquivos.

## Limitações do ambiente

O comando `test:all` foi iniciado e avançou pelas regressões iniciais, mas excedeu o tempo local disponível durante um typecheck legado. Os grupos diretamente relacionados à falha do GitHub e os grupos atuais foram executados isoladamente e aprovados.

O typecheck global e a geração do APK não foram executados localmente porque o pacote não contém `node_modules`. A confirmação final ocorre no GitHub Actions depois do `npm ci`.
