# Correção TypeScript e segurança do recorte — v31.71

## Erros corrigidos

1. `TS6133` em `src/components/CardVisionApp.tsx`
   - removida a importação não utilizada `OFFICIAL_ADDITIONAL_SKILL_NAMES`;
   - o catálogo oficial continua disponível e utilizado nos módulos que realmente precisam dele.

2. `TS2739` na aplicação da memória de recorte
   - `applyRememberedCardBox` agora preserva o tipo completo recebido;
   - quando recebe uma `OcrZone`, devolve a mesma `OcrZone`, mantendo `key`, `label` e `enabled`;
   - somente `x`, `y`, `w` e `h` são recalibrados.

## Proteções adicionadas

- novo portão `quality:card-crop-types`;
- verificação no pré-voo de produção;
- execução automática nos workflows de APK e Google Play;
- inclusão na regressão v31.71;
- bloqueio contra retorno da importação ociosa;
- bloqueio contra perda dos metadados da zona OCR.

## Validações executadas

- sintaxe: 251 arquivos TypeScript/TSX aprovados;
- contratos interativos: 684 botões e 24 imagens aprovados;
- rotas críticas: aprovadas;
- isolamento TypeScript: aprovado;
- segurança de tipos do recorte: 4 verificações aprovadas;
- pré-voo: 104 verificações aprovadas;
- auditoria: 71 verificações aprovadas;
- Google Play: 27 verificações aprovadas;
- regressões v31.40, v31.50, v31.60 e v31.71: aprovadas.

O typecheck global com dependências reais continua sendo executado no GitHub depois de `npm ci`. Os dois erros mostrados no log foram corrigidos diretamente na origem e agora possuem portões permanentes contra regressão.
