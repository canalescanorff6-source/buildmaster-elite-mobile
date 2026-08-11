# BuildMaster v40.10.0 — correção da regressão v38.31

## Causa
A regressão `tests/v38-31-ci-regression-hotfix.mjs` verificava literalmente se o teste legado v37.71 continha `40.00.0`. Após a evolução real do aplicativo para `40.10.0`, esse contrato textual passou a falhar mesmo com o cache, o leitor v40.00 e a experiência de progresso v40.10 corretos.

## Correção
A validação v38.31 deixou de exigir uma release fixa. Agora ela confirma que a regressão v37.71 continua validando `NATIVE_CACHE_SCHEMA` e `pkg.version`, permitindo a evolução da linha 40 sem quebrar o CI por um número antigo embutido no teste.

Nenhuma lógica do OCR, leitura por quadrados, atualização do APK, barra de progresso, login, Supabase, fichas ou motores de gameplay foi alterada.

## Verificações executadas
- `test:v3831`: aprovado.
- `test:v3771`: aprovado.
- `typecheck:v4000` + `test:v4000`: aprovado.
- `typecheck:v4010` + `test:v4010`: aprovado.
- Sintaxe: 426 arquivos TypeScript/TSX aprovados.
- Visual/acessibilidade: aprovado.
- Rotas críticas: aprovadas sem autorreparo.
- Contrato preventivo do CI: aprovado.
- Pré-voo: 138 verificações aprovadas.
- Manifesto de integridade: 1020 arquivos aprovados.

## Versão
Permanece `40.10.0`, pois este pacote corrige o CI da mesma entrega antes da publicação do APK.
