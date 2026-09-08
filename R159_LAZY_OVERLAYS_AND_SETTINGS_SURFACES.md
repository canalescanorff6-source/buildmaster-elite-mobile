# R159 — Lazy Overlays + Settings Surfaces

## Objetivo

Reduzir trabalho de carregamento e chunks desnecessários no Android sem alterar o motor de fichas, OCR, Cofre, cloud ou calibração.

## Diagnóstico

A R158 já havia retirado superfícies grandes de time/admin da árvore inicial, porém algumas telas ocasionais ainda eram importadas estaticamente pelo `CardVisionApp.tsx`:

- `PremiumMenuScreen`
- `PremiumSearchScreen`
- `PremiumSettingsOverview`
- `IdentityAppearancePanel`
- `RefinementCenterPanel`
- `AppCommandPalette`

Além disso, dois overlays lazy eram montados mesmo quando fechados:

- `FirstUseOnboarding`
- `AppCommandPalette`

Montar um componente `dynamic()` fechado ainda pode iniciar a resolução/download do chunk, mesmo que o componente interno retorne `null`.

## Mudanças

### Superfícies ocasionais fora da árvore estática

Os seis componentes acima foram movidos para `src/components/lazy/AppLazyPanels.tsx` com `dynamic(..., { ssr:false })`.

Menu e Busca carregam somente quando a respectiva seção é aberta.

As superfícies de Ajustes carregam somente quando a área/subárea é usada e também participam do preload adaptativo do grupo `ajustes` em dispositivos elegíveis.

### Overlays só montam quando abertos

O onboarding agora é renderizado apenas quando:

`onboardingOpen && !showSplash`

A Paleta de Comandos agora é renderizada apenas quando:

`commandPaletteOpen`

Isso evita resolver o chunk para usuários que nunca abrem esses recursos na sessão.

### Orçamento estático reforçado

R158:

- 254 módulos estáticos
- 3.629.233 bytes de fonte estática alcançável

R159:

- 245 módulos estáticos
- 3.580.879 bytes de fonte estática alcançável

Redução sobre R158:

- 9 módulos
- 48.354 bytes
- aproximadamente 1,33% de fonte estática adicional removida

Novo teto R159:

- máximo 248 módulos
- máximo 3.620.000 bytes

O objetivo do teto é impedir reintrodução silenciosa dessas superfícies na abertura.

## Autoridades preservadas

A auditoria diferencial R158 → R159 mostrou mudanças de runtime somente em:

- `src/components/CardVisionApp.tsx`
- `src/components/lazy/AppLazyPanels.tsx`

Nenhum arquivo de:

- Clean Slate
- beam/scoring
- Top 5
- Ímpeto
- analyzer/performance engine
- OCR engine
- calibração
- Cofre/persistência
- cloud

foi alterado.

## Validação

Passaram:

- R119 Clean Slate
- R119 output quality
- R149–R159
- typecheck de toda `src`
- sintaxe em 627 arquivos TS/TSX
- contratos interativos: 790 botões e 34 imagens com alt
- acessibilidade/visual
- auditoria: 127/127
- produção: 138/138
- Play: 27/27
- teste R159 de lazy boundaries
- orçamento estático R159

## Resultado

R159 reduz mais o caminho inicial sem mudar decisão esportiva. O ganho principal desta versão é duplo: menos módulos estáticos e menos chunks de overlays ocasionais carregados sem uso.
