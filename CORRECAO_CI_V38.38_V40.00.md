# BuildMaster v40.00 — correção de compatibilidade da regressão v38.38

## Causa

A regressão `tests/v38-38-legacy-profile-regressions-hotfix.mjs` verificava literalmente se o teste v35.00 continha a expressão antiga `Automática v38\\.(?:37|38|39|40)`.

Na v40.00, a expressão foi corretamente ampliada para aceitar também a nova linha `40.00`: `Automática v(?:38\\.(?:37|38|39|40)|40\\.00)`.

O comportamento da calibração estava correto e a regressão v40.00 passava, mas o teste legado v38.38 falhava por comparar a representação textual antiga da regex.

## Correção

O contrato legado v38.38 agora aceita tanto o formato anterior quanto a expressão compatível com a v40.00, sem alterar o OCR, o leitor por quadrados, o motor de fichas ou a calibração automática.

## Validações executadas

- `node tests/v38-38-legacy-profile-regressions-hotfix.mjs`: aprovado.
- `npm run test:v4000`: aprovado.
- `npm run integrity:generate`: manifesto regenerado.
- `npm run integrity:verify`: aprovado.
- `npm run release:preflight`: 138 verificações aprovadas.
- `npm run quality:ci-contract`: aprovado.

O grupo completo `test:v3838` também executa novamente as regressões v35.00 e v35.20. No workflow mostrado pelo usuário, esses contratos já haviam chegado até a etapa v38.38; a falha reproduzida localmente estava no último teste estático v38.38 e foi corrigida.
