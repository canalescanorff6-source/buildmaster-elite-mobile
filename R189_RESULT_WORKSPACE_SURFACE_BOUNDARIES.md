# R189 — Result Workspace Surface Boundaries

## Base canônica
- Base de entrada: R188 — CardVision Result Actions Lazy Boundary.
- Package version preservada: `40.80.0`.
- Autoridade esportiva final preservada: R119 Clean Slate.
- SHA-256 R119 preservado: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo
Reduzir o maior módulo de resultado da R188 sem alterar progressão, DNA, Top 5, Ímpetos, orçamento, Cofre ou fluxo OCR.

O alvo foi `src/components/result/ResultWorkspace.tsx`, que ainda concentrava três responsabilidades distintas:
1. workspace da ficha pronta;
2. calibração real pós-partida;
3. revisão opcional do OCR antes da ficha.

## Novas fronteiras
### `src/components/result/ResultReviewPanelR189.tsx`
Passou a concentrar a superfície de revisão opcional:
- identidade e origem da leitura;
- evidência Single Print;
- posição da carta e posição alvo;
- estilo ofensivo/defensivo;
- nível e orçamento lidos;
- habilidades nativas/especiais;
- atributos revisáveis;
- posições permitidas/evitadas;
- confirmação explícita de candidatos OCR em review.

O registro lazy `CardVisionLazyPanelsR174.tsx` agora aponta `ReviewPanel` diretamente para esta fronteira. Assim, abrir a revisão não carrega mais o `ResultWorkspace` apenas para obter esse componente.

### `src/components/result/RealMatchCalibrationPanelR189.tsx`
Passou a concentrar:
- feedback pós-partida;
- teste A/B de ficha;
- relatório de calibração;
- calibração avançada por ficha/técnico/formação;
- preferência pessoal aprendida;
- persistência em `CALIBRATION_STORAGE_KEY`;
- disparo de `COMPETITIVE_FUSION_EVENT`.

A calibração é adquirida por `import()` somente quando a aba correspondente é aberta.

## Métricas
### ResultWorkspace
- R188: 2234 linhas / 152297 bytes.
- R189: 1738 linhas / 120714 bytes.
- redução: 496 linhas (~22,2%).
- redução: 31583 bytes (~20,7%).

### Fronteiras extraídas
- `ResultReviewPanelR189.tsx`: 393 linhas / 22957 bytes.
- `RealMatchCalibrationPanelR189.tsx`: 135 linhas / 10187 bytes.

### Closure estática do ResultWorkspace
- R188: 143 módulos / 2305419 bytes.
- R189: 131 módulos / 2197406 bytes.
- redução: 12 módulos.
- redução: 108013 bytes (~4,7%).

O ganho de closure é maior que a simples redução física do arquivo porque dependências específicas de revisão/calibração também deixam o carregamento inicial da ficha pronta.

### Closure estática do CardVision
- 179 módulos / 2424244 bytes.
- A R189 não reintroduziu ações R188 nem runtimes pesados no startup.

### Orçamento total de `src`
- 424 arquivos.
- 5328251 / 5505024 bytes.
- margem: 176773 bytes.
- uso: 96,8%.

O total de fonte cresce levemente em relação à R188 porque as novas fronteiras explicitam contratos/imports próprios; o custo de carregamento do resultado, porém, caiu de forma mensurável.

## Regressões históricas realinhadas
Foram corrigidos apenas contratos que dependiam da localização física antiga do código:
- R131 passou a verificar confirmação de nome/skills no controlador de leitor R187, onde a finalização realmente vive;
- R132 passou a verificar a UI de evidência de atributos no `ResultReviewPanelR189`;
- R188 continua obrigatório na cadeia v40.80, mas deixou de ser o gate terminal após a inclusão da R189.

Nenhuma exigência funcional foi removida.

## Validação esportiva
Aprovados após a extração:
- R119 Clean Slate;
- R119 Output Quality;
- R122 Máximo Online + DNA;
- R125 role-aware/card-specific;
- R130 parser boundaries;
- R131 review evidence;
- R132 OCR attribute evidence;
- R133 structured evidence;
- R184 Position Stability;
- R186 equivalência congelada por meio da cadeia preservada.

A R189 não modifica fórmulas de progressão, Top 5, Ímpetos, posição de uso, orçamento ou neutralidade de GER/Overall.

## Lazy/OCR
Revalidados:
- R160 Lazy Reader Runtime;
- R161 Reader Surface Evidence;
- R162 Backup Controller;
- R163 Reader Analysis Controller;
- R164 Reader Interaction Light Models;
- R174 CardVision Lazy Registry.

A revisão continua lazy e a calibração pós-partida passou a ser lazy dentro do próprio resultado.

## Cadeia de release
Revalidados:
- R180;
- R181;
- R182;
- R183;
- R184;
- R185;
- R186;
- R187;
- R188;
- R189.

## Gates de produção
- TypeScript autocontido de `src`: aprovado.
- Sintaxe: 656 TS/TSX.
- Interativos: 790 botões tipados e 34 imagens com `alt`.
- Auditoria: 127/127.
- Pré-voo de produção: 138/138.
- Google Play: 27/27.
- Java nativo gerado: aprovado.
- Release convergence R183: aprovado.

## Limite do ambiente local
O diagnóstico consolidado detecta como único grupo vermelho a compatibilidade de dependências porque `node_modules` não está instalado neste container. Continuam ausentes localmente, entre outros, Next/React/Capacitor/TypeScript e o Android SDK/adb.

Isso é bloqueio do ambiente de build, não regressão do código-fonte. Os contratos autocontidos, auditoria, pré-voo, Java gerado e Google Play permanecem verdes. A geração e assinatura física de APK/AAB continuam sob responsabilidade do GitHub Actions autorizado.

## Próximo alvo
Após R189, o maior módulo de `src` volta a ser `src/components/CardVisionApp.tsx` (~149 KB). A próxima revisão deve atacar outra responsabilidade de orquestração do shell, preservando R119 e as fronteiras lazy R187/R188/R189.
