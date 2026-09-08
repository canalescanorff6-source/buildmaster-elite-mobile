# R195 — Controller Props + Analyzer Hot Path + Net Source Reduction

## Base canônica

- Base de entrada: R194 (`buildmaster-elite-mobile-r194-cardvision-contract-dedup-net-reduction.zip`).
- Versão do pacote: `40.80.0`.
- Autoridade esportiva final: R119.
- SHA-256 do R119: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo

Continuar reduzindo o tamanho e o acoplamento reais do shell, sem criar fronteira cosmética nem writer novo, e remover uma alocação repetitiva do hot path do `analyzer.ts`.

## Mudanças

### 1. Ações do Cofre deixam de ser reempacotadas no shell

`useCardVisionVaultActionsR185` já é a autoridade de ações do Cofre. A R194 ainda reconstruía manualmente um objeto com dezenas de handlers ao renderizar `CardVisionVaultWorkspaceR191`.

A R195 mantém o objeto retornado pelo hook e o entrega diretamente para a prop `actions`, cuja tipagem do workspace continua limitada ao `Pick` R191. O shell só desestrutura as poucas ações que realmente usa fora do Cofre.

Benefícios:

- menos boilerplate no `CardVisionApp`;
- menos objeto intermediário criado por render;
- menor risco de esquecer uma ação quando o hook canônico evoluir;
- nenhuma nova autoridade de persistência.

Os objetos de `coordinator` e `backup` enviados ao Cofre continuam deliberadamente estreitos; a R195 não expõe writers crus R153/R140 ao workspace do Cofre.

### 2. Ajustes passa a consumir o controller canônico de backup R162

A tela lazy `CardVisionSettingsWorkspaceR190` recebia aproximadamente duas dezenas de funções/estados de backup achatados como props individuais.

A R195 passa `backupControllerR162` como uma única fronteira. O workspace de Ajustes lê os campos necessários do controller existente.

Isso não move persistência nem cria controller paralelo: `useCardVisionBackupControllerR162` permanece a única fonte desse conjunto de operações.

### 3. Ajustes passa a consumir o controller de experiência R178

As ações de tema/avatar/Evolução 360/Experiência 2.0 agora chegam à superfície de Ajustes por `experienceControllerR178`, em vez de sete props independentes.

`openEvolutionTarget` continua desestruturado no shell apenas porque também é usado pelo `SmartQuickDock`.

### 4. Comandos de Ajustes deduplicados

Os metadados estáticos de oito comandos da paleta de Ajustes foram consolidados em `SETTINGS_COMMANDS_R195`, eliminando repetição de `group`, `run` e estrutura de objeto sem alterar rótulos, descrições, palavras-chave ou destinos.

### 5. Ponte de ações R188 simplificada

As ações fire-and-forget do Resultado passaram a compartilhar `fireResultActionR188`, preservando as mesmas funções públicas usadas pelo `ResultCard`.

### 6. Recomendação central simplificada

O roteamento simples da Central para Jogadores/Leitor/Manual/Time/Partidas/Ajustes passou a usar uma tabela local compacta. Cofre, Resultado e abertura de jogador continuam com os caminhos especiais anteriores.

### 7. Hot path do analyzer sem `Set` por chamada

`automaticPositionFamilyCompatible` recriava quatro `Set<PositionCode>` a cada chamada.

A R195 introduz `AUTO_POSITION_FAMILIES` em escopo de módulo. O conteúdo e as regras são os mesmos; apenas a alocação repetitiva foi removida.

A função continua sendo usada na escolha automática de posição e a equivalência congelada R186/R193 permaneceu aprovada.

## Métricas contra a R194 congelada

| Métrica | R194 | R195 | Diferença |
|---|---:|---:|---:|
| `src` TS/TSX | 5.339.892 B | **5.336.611 B** | **−3.281 B** |
| `CardVisionApp.tsx` | 110.772 B | **107.449 B** | **−3.323 B** |
| `CardVisionApp.tsx` linhas (`wc -l`) | 1.670 | **1.606** | **−64** |
| `analyzer.ts` | 109.285 B | **109.361 B** | +76 B, em troca de eliminar 4 Sets por chamada |
| `CardVisionSettingsWorkspaceR190.tsx` | 26.095 B | **26.061 B** | −34 B |
| closure inicial CardVision | 2.381.801 B | **2.378.554 B** | **−3.247 B** |
| módulos closure CardVision | 178 | **178** | estável |
| closure inicial Resultado | 2.126.356 B | **2.126.432 B** | +76 B do cache do hot path |

Orçamento atual de `src`: **5.336.611 / 5.505.024 B (96,9%)**.

Margem real: **168.413 B**.

Nenhum teto foi aumentado.

## Gate R195

Adicionados:

- `tests/v40-80-r195-controller-prop-hotpath-regression.mjs`
- `scripts/check-cardvision-static-closure-r195.mjs`
- `npm run test:r195`

O gate impede:

- retorno do reempacotamento das dezenas de ações R185 dentro do shell;
- perda do controller R162 como fronteira de backup de Ajustes;
- perda do controller R178 como fronteira de experiência;
- retorno de `new Set<PositionCode>` dentro do hot path de compatibilidade automática;
- crescimento do `CardVisionApp` acima de 108 KB;
- crescimento líquido de `src` acima do limite congelado R195;
- crescimento da closure inicial acima de 2.379.000 B;
- qualquer alteração no SHA da autoridade R119.

## Regressões executadas

### Autoridade esportiva

- R119 Clean Slate — aprovado.
- R119 Output Quality — aprovado.
- R119 Result UI — aprovado.
- R122 Máximo Online + DNA — aprovado.
- R125 role-aware/card-specific — aprovado.
- R184 estabilidade por posição — aprovado.
- R186 equivalência congelada — aprovado.
- R193 equivalência especial — aprovado.

### OCR / Cofre / superfícies

- v38.40 — **15/15 aprovadas**.
- R185 — ações/Chrome aprovados.
- R186–R189 — boundaries/equivalência aprovadas.
- R190 — Ajustes lazy aprovado.
- R191 — Cofre lazy sem writer paralelo aprovado.
- R192 — Resultado avançado lazy aprovado.
- R193/R194/R195 — gates de redução e autoridade aprovados.

### Release / qualidade

- R180 — auditoria global/single writer aprovada.
- R181 — motores legados aposentados e v31.72 aprovados.
- R182 — 51 contratos Android de fonte/workflow aprovados.
- R183 — 17 contratos de convergência de release aprovados.
- Sintaxe: **660 arquivos TS/TSX**.
- Interativos: **790 botões** e **34 imagens com `alt`**.
- Visual/acessibilidade — aprovado.
- Auditoria: **127/127**.
- Pré-voo de produção: **138/138**.
- Assinatura lógica: `ace8b7e809658332`.
- Google Play: **27/27**.
- Java nativo gerado — aprovado.

## Limitação ambiental

O ambiente local continua sem dependências npm/Capacitor e sem Android SDK/`sdkmanager`/`adb`. Portanto, a R195 valida fonte, Java gerado, workflows e preflights, mas não declara APK/AAB físico compilado localmente.

## Resultado

A R195 reduz de forma líquida o shell e o código total, elimina reempacotamento desnecessário de controllers e remove alocação repetitiva de Sets no analyzer sem alterar a saída esportiva. O maior módulo passa a ser `src/lib/analyzer.ts` (109.361 B), seguido por `CardVisionApp.tsx` (107.449 B).
