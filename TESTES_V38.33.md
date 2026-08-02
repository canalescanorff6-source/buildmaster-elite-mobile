# Testes executados — v38.33

## Aprovados

- `npm run test:v3833`;
- typecheck direcionado do motor e da interface do Estúdio;
- regressão v38.32;
- regressão v38.31;
- regressão v37.71;
- regressões visuais v33.00, v34.00 e v36.00;
- sintaxe em 349 arquivos TypeScript/TSX;
- contratos de 720 botões e 27 imagens com texto alternativo;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- pré-voo de produção: 124 verificações, assinatura `84b18c0490cd713a`;
- auditoria estrutural: 111 verificações;
- renderização real de SVG e conversão para PNG 1080 × 1920;
- validação de exatamente 11 jogadores no template;
- validação de exportação sem `foreignObject` e sem chamada de IA/API.

## Não concluídos neste ambiente

`npm ci` não concluiu porque o registry interno retornou HTTP 404 para `zlibjs@0.3.1`. Sem `node_modules`, o typecheck global acusa módulos externos ausentes (`react`, `next`, `lucide-react` e Capacitor). Essas mensagens não apontaram erro específico do novo renderizador; os typechecks direcionados da v38.33 passaram.

O APK e o AAB não foram gerados localmente. A compilação completa precisa ser confirmada pelo workflow do GitHub Actions após o push.
