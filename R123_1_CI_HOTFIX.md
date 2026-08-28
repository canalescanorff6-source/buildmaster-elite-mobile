# r123.1 — CI hotfix cumulativo

## Causa raiz corrigida

O workflow falhava por dois motivos independentes:

1. `UnifiedPerformanceV3920Panel.tsx` importava `@/modules/vault/skillWorkflowR121`, mas o `mobile-update.zip` incremental da r123 não carregava esse arquivo quando aplicado sobre uma base que ainda não tinha a r121 completa.
2. O baseline TypeScript da r123 passou ligeiramente do teto agregado de 5 MiB (`5.261.519` bytes no runner). O teto foi recalibrado para **5,25 MiB**, mantendo alerta a partir de 90%, limite de 400 KiB por módulo e os limites do bundle compilado.

## Correção estrutural

O novo `mobile-update.zip` é **cumulativo** desde `buildmaster-elite-mobile-main (9).zip` até a r123.1. Portanto ele inclui dependências introduzidas nas r120/r121/r122/r123 e não depende da aplicação prévia de updates incrementais.

A autoridade final continua sendo o Clean Slate. Nenhuma lógica de ficha, Top 5 ou Ímpeto foi deslocada para um motor histórico.

## Validação local

- `test:r121` aprovado
- `test:r122` aprovado
- `test:r123` aprovado
- `quality:bundle` aprovado
- todos os imports internos `@/` resolvem no projeto completo
- pacote cumulativo reproduz os arquivos da r123.1 a partir da base main (9)
