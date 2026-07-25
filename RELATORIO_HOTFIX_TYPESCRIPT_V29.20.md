# BuildMaster v29.20 — Hotfix do TypeScript no GitHub Actions

## Erro observado

O workflow parou na etapa **Validar TypeScript**. O log mostrou três famílias de erro:

1. componentes do `lucide-react` supostamente inexistentes;
2. `event.target.files` e `event.currentTarget` ausentes em campos de upload;
3. `number | null | undefined` incompatível com `number | null` no teste do Bloco 7.

## Causa principal

Os arquivos abaixo foram criados para checagens TypeScript isoladas:

- `tests/types-v2910/stubs.d.ts`;
- `tests/types-v2920/stubs.d.ts`.

O `tsconfig.json` principal incluía `**/*.ts` e `**/*.tsx`, portanto também carregava esses stubs. Eles declaravam versões reduzidas de React, JSX e `lucide-react`. Isso contaminava o typecheck real e fazia o compilador enxergar apenas parte dos ícones e um evento de formulário simplificado.

Os ícones dos componentes não precisavam ser trocados; o problema era o escopo indevido dos stubs de teste.

## Correções aplicadas

- `tsconfig.json` passou a excluir:
  - `tests/types-v2910`;
  - `tests/types-v2920`.
- Os três typechecks isolados continuam funcionando por seus próprios `tsconfig.json`.
- O teste `v28-60-advanced-build-intelligence-regression.ts` agora usa:

```ts
maxOverall: result.parsed.maxOverall ?? null
```

- Foi criada a regressão `tests/v29-20-typecheck-isolation-regression.mjs`.
- O comando `test:v2920` executa a nova regressão.
- O pré-voo de produção agora bloqueia o pacote se os stubs voltarem a contaminar o typecheck principal.
- README, relatório da v29.20 e manifesto de integridade foram atualizados.

## Validações executadas após o hotfix

- 26/26 regressões MJS aprovadas;
- 4/4 regressões CJS funcionais aprovadas;
- 3/3 typechecks isolados aprovados;
- 241 arquivos TypeScript/TSX com sintaxe aprovada;
- 520 botões e 19 imagens aprovados nos contratos de interface;
- 29 verificações de pré-voo aprovadas;
- 66 verificações de auditoria aprovadas;
- integridade interna validada por SHA-256.

## Validação ainda necessária

Este ambiente não conseguiu instalar novamente todas as dependências externas. Por isso, o typecheck principal com os tipos reais de React, Next e Lucide deve ser confirmado ao executar novamente o GitHub Actions com o pacote corrigido.

Como o build anterior falhou antes de gerar o APK, a versão funcional permanece `29.20.0`; este pacote é um hotfix do código-fonte, não uma nova release Android publicada.
