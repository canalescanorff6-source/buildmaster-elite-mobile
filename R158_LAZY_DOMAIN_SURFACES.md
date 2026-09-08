# R158 — Lazy Domain Surfaces

## Objetivo
Reduzir o código carregado no caminho inicial do `CardVisionApp` sem alterar motor de fichas, OCR, persistência ou regras competitivas.

## Mudança
As seguintes superfícies saíram dos imports estáticos do shell e passaram ao catálogo `AppLazyPanels`:
- `SquadMappingCenter`
- `MetaFormationStudioV3832`
- `AdministrationSecurityCenter`

Elas continuam disponíveis normalmente quando a área correspondente é aberta e participam do preload adaptativo existente (`time` / `ajustes`) quando o perfil do dispositivo permite.

## Orçamento estático
Baseline R157 medida: 264 módulos / 3.854.429 bytes.
R158: 254 módulos / 3.629.233 bytes.
Redução: 10 módulos e 225.196 bytes (~5,84% em bytes de fonte estática alcançável).

Novo teto R158: <=258 módulos e <=3.700.000 bytes.

## Invariantes
- Nenhum arquivo do Clean Slate/beam/scoring é alterado.
- Nenhum contrato esportivo muda.
- As três superfícies permanecem acessíveis na mesma UI.
- O preload continua adaptativo; não vira preload obrigatório.

## Validação final
- Typecheck autocontido de toda `src`: aprovado.
- R119 Clean Slate e output quality: aprovados.
- R149: aprovado.
- R150–R158: regressões relevantes aprovadas.
- Sintaxe: 627 arquivos TS/TSX.
- Interações: 790 botões e 34 imagens com alt.
- Auditoria: 127/127.
- Produção: 138/138.
- Play Store: 27/27.
- `CardVisionApp.tsx`: 3883 linhas no auditor final.
- Diff runtime R157→R158: somente `CardVisionApp.tsx` e `AppLazyPanels.tsx`.
