# R184 — Production Legacy Isolation + Position Stability

## Base canônica

- Base de entrada: **R183 — Android Release Channel Convergence**.
- Package version preservada: `40.80.0`.
- Autoridade esportiva preservada: **Clean Slate / R119 single writer**.
- R184 não altera catálogo oficial, orçamento de pontos, regra de custo, Top 5, catálogo de Ímpetos, Supabase, applicationId, assinatura Android nem canais de release da R183.

## Problema 1 — margem de fonte crítica

A R183 estava em:

- `5.497.941 / 5.505.024 bytes` de TypeScript em `src`;
- margem de apenas **7.083 bytes**;
- aproximadamente **99,87%** do teto.

O Android/browser já usa o Fast Path com R119 como autoridade final, porém `cardIntelligencePipeline.ts` ainda importava estaticamente motores diagnósticos históricos v38.50→v38.90 e `ResultWorkspace.tsx` ainda importava cinco painéis que não possuem dados no Fast Path de produção.

### Correção R184

Foram removidos de `src` e preservados em `legacy-src`:

Motores históricos:

- `performanceBuildEngineV3850.ts`;
- `supremePerformanceEngineV3870.ts`;
- `cardFirstAiEngineV3880.ts`;
- `canonicalCardEngineV3890.ts`.

Painéis históricos:

- `PowerBuildEngineV3850Panel.tsx`;
- `MaxMatchPerformanceV3860Panel.tsx`;
- `SupremePerformanceV3870Panel.tsx`;
- `CardFirstAiV3880Panel.tsx`;
- `CanonicalCardV3890Panel.tsx`.

`maxMatchPerformanceEngineV3860.ts` **permanece em `src/lib`**, pois ainda é dependência estrutural de motores posteriores ativos na cadeia histórica.

### Ponte histórica test-only

Foi criada:

- `legacy-src/lib/legacyPerformanceDiagnosticsR184.ts`.

`tests/_ts-require.cjs` instala de forma lazy, apenas em Node/testes, o hook:

- `__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__`.

Essa ponte reproduz v38.50→v38.90 em modo read-only para progressão, mantendo as regressões antigas executáveis sem colocar esses módulos no runtime de produção.

Nenhum arquivo de `src` importa `legacy-src`.

## Resultado de margem

Após o isolamento:

- `416` arquivos TS/TSX em `src`;
- `5.303.491 / 5.505.024 bytes`;
- margem real: **201.533 bytes**;
- uso: **96,3%**;
- ganho de margem em relação à R183: **194.450 bytes**;
- o teto **não foi aumentado**.

A closure estática do CardVision caiu para:

- `178` módulos;
- `2.434.175 bytes` de fonte estática.

## Problema 2 — regressão latente v39.20

Durante a validação da R184, `tests/v39-20-recipe-memory-regression.ts` falhou no cenário:

- mesma carta natural `SS`;
- uso `AMF` versus `SS`;
- diferença de apenas 1 ponto OCR em `Passe rasteiro` (`87` → `86`);
- decisão funcional praticamente empatada.

A falha foi reproduzida na **R183 original intacta**, provando que não foi introduzida pelo isolamento R184.

Com a R183, a progressão oscilava entre:

- `shooting 10 / passing 10 / dribbling 4 / dexterity 8 / lowerBody 8`;
- `shooting 10 / passing 8 / dribbling 4 / dexterity 10 / lowerBody 8`.

## Correção de estabilidade funcional R184

O R119 agora mede a vantagem real da adaptação de posição antes de aceitar uma redistribuição estreita.

Contrato:

- a posição real de uso continua sendo avaliada normalmente;
- a ficha adaptada continua vencedora quando há ganho funcional material;
- quando a adaptação ganha no máximo `0,25` ponto e a distância entre planos é no máximo `4` níveis agregados, o resultado é tratado como empate funcional estreito;
- nesse empate, a ficha canônica da posição natural é preservada;
- Top 5 e Ímpeto usam a mesma âncora canônica nesse caso para não oscilarem junto com ruído marginal;
- mudanças funcionais grandes continuam adaptando a ficha.

Nova telemetria:

- `positionStabilityR184.version`;
- `decision = NATURAL_ANCHOR | TARGET_ADAPTATION`;
- `targetGain`;
- `planDistance`;
- limites e motivo da decisão.

### Não houve neutralização geral por posição

Regressões preservadas confirmam:

- `SS → AMF` com redistribuição funcional maior ainda altera a ficha;
- `SS → CF` ainda altera a ficha;
- `CF → CB` altera fortemente a ficha e eleva defesa;
- Overall/GER continua proibido de decidir progressão;
- identidade permanente da carta continua independente da posição escolhida.

## Regressões R184

Novos testes:

- `tests/v40-80-r184-production-legacy-isolation-regression.mjs`;
- `tests/v40-80-r184-position-stability-regression.ts`.

Novo comando:

- `npm run test:r184`.

A cauda da cadeia `test:v4080` passa a ser:

`R180 → R181 → R182 → R183 → R184`.

## Validações executadas

Aprovadas nesta revisão:

- v38.50;
- v38.60;
- v38.70;
- v38.80;
- v38.90;
- v39.00;
- v39.10;
- v39.20, incluindo o teste que falhava na R183 original;
- R125 role-aware;
- R180 global/runtime/static closure;
- R181 aposentadoria + bundle;
- R182 Android direct readiness;
- R183 release convergence;
- R184 isolamento + estabilidade + bundle.

## Limite do ambiente local

A fonte Android continua pronta, mas este ambiente não possui toolchain Android físico completo:

- `ANDROID_HOME/ANDROID_SDK_ROOT` ausente;
- `sdkmanager` ausente;
- `adb` ausente;
- dependências npm/Capacitor nativas não instaladas para build físico.

Portanto, APK/AAB assinado continua sendo prova final do GitHub Actions. Isso não é tratado como regressão do produto.

## Próximo débito estrutural

O maior arquivo individual continua sendo:

- `src/components/CardVisionApp.tsx` — aproximadamente `189 KB`.

A margem de fonte deixou de ser emergencial, mas o próximo ciclo deve continuar reduzindo o acoplamento do shell principal sem tocar no motor esportivo sem necessidade.

## Gates gerais finais

Também aprovados após a consolidação completa:

- sintaxe: **647** arquivos TypeScript/TSX;
- contratos interativos: **790** botões tipados e **34** imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria estrutural: **127/127**;
- pré-voo de produção: **138/138**;
- pré-voo Google Play: **27/27**;
- contrato preventivo de CI: aprovado;
- integridade final: **1.247 arquivos**.

A regressão R119/R122/R123/R124/R125/R135/R136 também foi reexecutada após a trava de estabilidade e permaneceu verde.
