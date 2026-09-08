# R179 — CardVision Derived State + Conditional UI Boundary

## Objetivo
Continuar a fase final de desmontagem do `CardVisionApp` sem criar segunda autoridade de dados e sem regredir o startup. A R179 separa leituras derivadas do Cofre/resultado das mutações e coloca componentes de criação/time atrás de uma fronteira dinâmica própria.

## Base canônica
- R178 — CardVision Experience + Observability Lazy Boundary.
- Startup R178: 189 módulos / 2.689.357 bytes.
- `CardVisionApp` R178: 2.545 linhas (`wc -l`) / 192.538 bytes.

## Mudanças
### 1. Estado derivado do CardVision
Criado `src/hooks/useCardVisionDerivedStateR179.ts`.

O hook concentra apenas leituras/memos:
- `renderHistory` sanitizado;
- análise salva ativa;
- histórico filtrado/ordenado;
- dashboard do Cofre;
- resumo bootstrap do Cofre;
- resumo Smart Home;
- integridade local;
- estilos disponíveis;
- habilidades disponíveis;
- comparação entre jogadores;
- contagem de filtros ativos.

A implementação reutiliza as autoridades existentes (`normalizeHistoryList`, `filterVaultHistoryR151`, `buildDashboardStats`, `buildVaultBootstrapSummaryR173`, `buildSmartHomeSummary`, `inspectDataIntegrity`, `comparePlayers`, etc.). Não contém `setHistory`, persistência, commit, lixeira nem mutação canônica.

### 2. UI condicional de criação/time
Criado `src/components/lazy/CardVisionConditionalFieldsR179.tsx`.

Passaram para `next/dynamic`:
- `CalibrationProfileFields`;
- `ManagerSelectionField`;
- `EfootballV600PreviewV4070`;
- `UnifiedCreationFlowV3790`;
- `UnifiedCreationResumeCardV3790`.

O registro R174 permaneceu byte-for-byte igual à R178; a nova responsabilidade fica numa fronteira R179 separada.

## Resultado
- Startup: **188 módulos / 2.686.413 bytes**.
- Delta vs R178: **-1 módulo / -2.944 bytes**.
- `CardVisionApp`: **2.524 linhas / 189.428 bytes**.
- Delta do shell vs R178: **-21 linhas / -3.110 bytes**.
- Cumulativo vs R159: **245 → 188 módulos** e **3.580.879 → 2.686.413 bytes** = **-894.466 bytes (-24,98%)**.

## Segurança arquitetural
Preservado:
- R138: autoridade única de produção/posição de uso;
- R140: persistência confirmada + rollback crítico;
- R153: fila canônica do Cofre;
- R154: guard de ações;
- R157: sessão dividida/autosave;
- R174: registro lazy específico original intacto;
- R175: Central Profissional;
- R176: navegação;
- R177: lifecycle de startup;
- R178: experiência/observabilidade.

Nenhum writer novo foi criado.

## Validações
- Whole-source TypeScript: aprovado.
- R138, R140, R153, R154, R157: aprovados.
- R174–R179: aprovados.
- `quality:syntax`: 660 arquivos TS/TSX.
- `quality:interactive`: 790 botões / 34 imagens com alt.
- `quality:visual`: aprovado.
- `quality:audit`: 127/127.
- `release:preflight`: 138/138; assinatura lógica `1762fa8d42b9ebdb`.
- `release:play-preflight`: 27/27.
- Avisos conhecidos: fonte total ~6,69 MB e `CardVisionApp` ainda grande (~2.525 linhas pela convenção do preflight).

## Débito conhecido
`quality:bundle` histórico não foi declarado verde e nenhum limite foi enfraquecido.
