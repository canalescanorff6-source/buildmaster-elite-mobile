# R190 — CardVision Settings Workspace Lazy Boundary

## Base canônica
- Base de entrada: R189 — Result Workspace Surface Boundaries.
- Package version preservada: `40.80.0`.
- Autoridade esportiva final preservada: R119 Clean Slate.
- SHA-256 R119 preservado: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo
Reduzir novamente o `CardVisionApp.tsx` e o carregamento inicial do aplicativo sem alterar progressão, DNA, Top 5, Ímpetos, OCR, Cofre, backup ou regras esportivas.

O alvo foi a orquestração de **Ajustes**, que ainda permanecia fisicamente dentro do shell principal mesmo sendo uma superfície ocasional.

## Nova fronteira
### `src/components/settings/CardVisionSettingsWorkspaceR190.tsx`
Passou a concentrar a UI de:
- visão geral dos Ajustes;
- Evolução 360;
- Experiência 2.0;
- aparência, temas, avatar e acessibilidade;
- desempenho e modo economia;
- segurança, integridade e diagnóstico;
- suporte e observabilidade;
- comunidade;
- comercialização/LGPD;
- publicação Google Play;
- backup, criptografia, restauração e sincronização cloud;
- contas/administração;
- atualizações do aplicativo.

A R190 não cria estado nem writer paralelo. Os estados e controladores canônicos continuam no `CardVisionApp`; a nova fronteira recebe somente os valores e ações existentes.

## Carregamento lazy
`CardVisionLazyPanelsR174.tsx` passou a expor `CardVisionSettingsWorkspaceR190` via `next/dynamic` + `import()`.

Consequências:
- o workspace de Ajustes não entra na closure estática inicial do CardVision;
- componentes específicos de Ajustes continuam lazy individualmente;
- abrir outras áreas do aplicativo não exige carregar o markup/orquestração de Ajustes.

## Métricas
### CardVisionApp
- R189: 1915 linhas / 148953 bytes.
- R190: **1808 linhas / 128643 bytes**.
- redução: **107 linhas** (~5,6%).
- redução: **20310 bytes** (~13,6%).

### Nova fronteira
- `CardVisionSettingsWorkspaceR190.tsx`: 278 linhas / 26182 bytes.

### Closure estática do CardVision
- R189: 179 módulos / 2424244 bytes.
- R190: **179 módulos / 2404161 bytes**.
- redução: **20083 bytes** (~0,8%).
- quantidade de módulos não aumentou.

### Orçamento total de `src`
- 425 arquivos.
- **5334350 / 5505024 bytes**.
- margem: **170674 bytes**.
- uso: **96,9%**.

O total bruto de fonte cresce levemente em relação à R189 por causa do contrato explícito da nova fronteira, mas o carregamento inicial cai de forma mensurável e nenhum teto foi aumentado.

## Regressões históricas realinhadas
Foram alterados somente contratos que ainda dependiam da localização física antiga do código:
- `v31-20-premium-complete-screens-regression.mjs`: Premium Settings agora pode estar na fronteira R190; importação de arquivo continua validada na autoridade atual `ReaderImageSourceCardV4010`.
- `v34-00-identity-themes-profile-regression.mjs`: `IdentityAppearancePanel` passa a ser exigido na fronteira R190.
- `v40-80-r159-lazy-overlays-settings-surfaces-regression.mjs`: menu/busca/Ajustes continuam lazy, considerando Chrome R185 e Settings R190 como superfícies atuais.
- R189 permanece obrigatório na cadeia v40.80, deixando de ser apenas o gate terminal após inclusão da R190.

Nenhuma exigência funcional foi removida.

## Validação esportiva
Aprovados após a extração:
- R119 Clean Slate;
- R119 Output Quality;
- R122 Máximo Online + DNA;
- R125 role-aware/card-specific;
- R184 Position Stability;
- R186 equivalência congelada pela cadeia preservada.

A R190 não altera:
- fórmula de progressão;
- orçamento;
- Top 5;
- Ímpetos;
- DNA;
- posição de uso;
- neutralidade de GER/Overall.

## Cadeia estrutural/release
Revalidados:
- R159;
- R180;
- R181;
- R182;
- R183;
- R184;
- R185;
- R186;
- R187;
- R188;
- R189;
- R190.

## Gates de produção
- TypeScript autocontido de `src`: aprovado.
- Sintaxe: **657 TS/TSX**.
- Interativos: **790 botões tipados** e **34 imagens com `alt`**.
- Auditoria: **127/127**.
- Pré-voo de produção: **138/138**.
- Google Play: **27/27**.
- Java nativo gerado: aprovado.
- Release convergence R183: aprovado.
- Bundle/source budget: aprovado.

## Limite do ambiente local
O `ci:preflight` executou 15 grupos e deixou somente **Compatibilidade das dependências** em vermelho porque `node_modules` não está instalado neste container. Estão ausentes localmente pacotes como React, Next, Capacitor, Tesseract e TypeScript npm, além de Android SDK/adb.

Os outros grupos do diagnóstico — configuração, orçamento, rotas, sintaxe, interativos, visual/acessibilidade, tipos, Java nativo, pré-voo, Play e auditoria — permaneceram verdes.

A geração e assinatura física de APK/AAB continuam sendo confirmadas pelo GitHub Actions autorizado.

## Próximo alvo
Após R190, os três maiores módulos principais ficam próximos:
1. `CardVisionApp.tsx`: 128643 bytes;
2. `ResultWorkspace.tsx`: 120714 bytes;
3. `analyzer.ts`: 118507 bytes.

A próxima revisão deve atacar uma responsabilidade adicional do `CardVisionApp` — preferencialmente criação/manual ou Cofre — preservando R119 e as fronteiras lazy R187–R190.
