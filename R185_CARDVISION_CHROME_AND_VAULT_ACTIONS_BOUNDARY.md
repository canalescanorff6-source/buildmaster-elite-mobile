# R185 — CardVision Chrome + Vault Actions Boundary

## Base
- Base canônica: R184 — Production Legacy Isolation + Position Stability.
- Package version preservada: 40.80.0.
- Nenhuma regra esportiva R119/R122/R125 foi alterada.

## Objetivo
Reduzir a concentração de responsabilidades do `CardVisionApp.tsx` sem mudar comportamento, persistência, OCR ou autoridade de gameplay.

## Mudanças
### 1. Casca global isolada
Novo componente `src/components/CardVisionAppChromeR185.tsx` concentra:
- splash;
- topbar/conta;
- status global;
- PremiumContextBar;
- RefinedNavigation;
- aviso de atualização;
- launcher móvel;
- cartão de contexto da área.

O estado continua pertencendo ao `CardVisionApp`; o novo componente é apenas uma fronteira de apresentação/orquestração.

### 2. Ações do Cofre isoladas
Novo hook `src/hooks/useCardVisionVaultActionsR185.ts` concentra ações de Cofre/Histórico:
- criar pasta;
- mover/arquivar/restaurar ficha;
- salvar ficha;
- habilidades salvas;
- lixeira/exclusão permanente;
- favoritos/status em lote;
- mesclagem/duplicação;
- notas;
- exportação individual.

A autoridade transacional continua em `useCardVisionVaultCoordinatorR153`; o hook R185 não cria writer paralelo.

## Resultado estrutural
- `CardVisionApp.tsx`: 2524 linhas na R184 -> 2168 linhas na R185.
- Redução: 356 linhas (~14,1%).
- Closure estática R180/R181: 180 módulos, ~2,444 MB de fonte estática.
- Orçamento geral `src`: 5.313.316 / 5.505.024 bytes (96,5%).
- Margem: 191.708 bytes.

A pequena alta no orçamento total em relação à R184 vem dos contratos/tipos explícitos das novas fronteiras; a árvore de runtime permanece dentro do gate e o shell ficou substancialmente menos acoplado.

## Regressão R185
Novo teste `tests/v40-80-r185-cardvision-chrome-boundary-regression.mjs` exige:
- componente Chrome próprio;
- `CardVisionApp` <= 2450 linhas;
- marcadores de UI global fora do shell;
- autoridades funcionais (R138/R153/R163/DNA) ainda no orquestrador correto;
- R185 no final da cadeia `test:v4080`.

## Validações executadas
- `test:r185`: aprovado.
- Typecheck autocontido de toda `src`: aprovado.
- R153: aprovado.
- R154: aprovado.
- R169: aprovado.
- R174–R179: aprovados.
- R180: aprovado.
- R181: aprovado.
- R182: aprovado.
- R183: aprovado.
- R184: aprovado após alinhamento da cadeia R185.
- Auditoria: 127/127.
- Pré-voo: 138/138.
- Play preflight: 27/27.
- Bundle budget: aprovado.

## Limites do ambiente
A geração física de APK/AAB ainda depende do ambiente Android completo (SDK, adb, sdkmanager e dependências npm/Capacitor), conforme doctors R182/R183. Isso não representa regressão de fonte.

## Próxima fronteira recomendada
O maior módulo remanescente por bytes é `src/lib/analyzer.ts` (~181 KB). Depois da redução do shell, o próximo ciclo deve modularizar o analyzer por fronteiras puras e testáveis, preservando R119 como autoridade final única.
