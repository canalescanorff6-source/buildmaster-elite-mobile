# BuildMaster v38.40 — Hotfix r7 do contrato preventivo do CI

## Falha observada
O diagnóstico consolidado concluía as regressões até a v39.50, porém encerrava com `Contrato preventivo do CI (código 1)`.

## Causa raiz
`scripts/ci-doctor.mjs` declarava `CI_SOURCE_BUILD` fora do padrão que `scripts/check-ci-contract.mjs` exige.

Valor anterior:
`v38.40-ocr-r6-legacy-ci-compat-20260810`

Padrão exigido:
`v38.40-ci-[identificador]-AAAAMMDD-rN`

## Correção
O identificador foi alterado para:
`v38.40-ci-ocr-r7-20260810-r7`

Nenhuma lógica de OCR, fichas, habilidades, posição escolhida, Supabase ou Android foi alterada neste hotfix.

## Validações executadas após a correção
- `npm run quality:ci-contract`: aprovado.
- `npm run integrity:generate`: manifesto regenerado.
- `npm run integrity:verify`: aprovado.
- `npm run quality:syntax`: 417 arquivos TypeScript/TSX aprovados.
- `npm run release:preflight`: 138 verificações aprovadas.

O diagnóstico completo foi iniciado localmente. O contrato preventivo passou; a etapa de dependências/typecheck completo não é representativa neste pacote limpo porque `node_modules` não está incluído. No GitHub Actions, `npm ci` instala as dependências antes da verificação.
