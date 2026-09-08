# R181 — Bundle Closure + Controlled Legacy Engine Retirement

## Objetivo
Fechar os dois débitos remanescentes da R180 sem enfraquecer gates nem alterar a autoridade esportiva final:
1. `quality:bundle` acima do orçamento;
2. regressão histórica v31.72 excessivamente lenta.

## Base
- Base canônica: R180 — Global Final Audit + Regression Sanitation.
- Package version preservada: `40.80.0`.
- R181 é revisão interna/arquitetural; não altera a identidade pública da versão do app.

## Mudanças de produção
Foram aposentados do runtime de `src` seis estágios históricos redundantes:
- `individualIdentityEngineV4080R39.ts`;
- `individualCalibrationEngineV4080R41.ts`;
- `performanceFoundation2027V4080R60.ts`;
- `performanceEngine2027V4080R70.ts`;
- `performanceEngine2027V4080R107.ts`;
- `performanceEngine2027V4080R109.ts`.

A cadeia moderna preservada é:
`Canonical Identity R60 -> Card Signature R108 (read-only) -> Clean Slate R119 (single writer) -> produção/selos read-only`.

Também foram removidos fallbacks/tipos mortos de R70/R107 em R80, R90 e R100. Nenhum novo writer foi introduzido.

## Autoridade final preservada
- R108 permanece especialista moderno de Card Signature e diagnóstico read-only.
- R119 permanece `CLEAN_SLATE_SINGLE_WRITER` para ficha, Top 5 e Ímpeto.
- R126/R128 continuam selando contrato e integridade de produção.
- R138 continua como fachada canônica de uso/posição/produção.
- Cofre R140/R153/R154 e sessão R157 não foram alterados.
- OCR R131–R134/R163/R164 não teve lógica de produção alterada.

## v31.72
A regressão `v31-72-complementary-skills-regression.ts` deixou de recalcular o pipeline completo para todas as 13 posições.

Cobertura preservada:
- 3 pipelines completos representativos: ataque, defesa e goleiro;
- 13 posições verificadas diretamente no catálogo oficial de habilidades;
- nomes oficiais canônicos;
- compatibilidade por posição;
- ausência de duplicatas;
- skills já possuídas excluídas;
- Top 5/Ímpeto/skill-integrity validados nos pipelines completos;
- fast production pipeline explicitamente usado no teste.

Tempo observado no estado final: aproximadamente **2,65 s** para a regressão principal. O `test:v3172` completo, incluindo autorreparo, passou.

## Regressões históricas realinhadas
Testes antigos que ainda apontavam para localizações anteriores foram realinhados às autoridades atuais, sem remover exigências funcionais:
- R31 -> modelo EFHub R164;
- R39/R41/R42/R60/R70/R107 -> aposentadoria controlada + R108/R119;
- R100/R101 -> Card Signature R108;
- R150 -> Central canônica + reader runtime R163/cardArtCrop;
- R151 -> selector derivado R179;
- R160/R161/R169 -> navigation controller R176;
- R171/R173 -> selector derivado R179;
- R180 -> cadeia oficial agora exige R180 seguido de R181.

## Métricas
### Startup CardVision
- R180: 188 módulos / 2.686.413 B.
- R181: **182 módulos / 2.589.514 B**.
- Delta: **-6 módulos / -96.899 B**.

### Orçamento global TypeScript
- Limite preservado: **5.505.024 B**.
- R180: 5.594.840 B (vermelho).
- R181 final: **5.497.941 B (verde)**.
- Margem atual: **7.083 B**.
- Arquivos TypeScript/TSX em `src`: **425**.

### CardVisionApp
- `wc -l`: **2.524 linhas**.
- bytes: **189.428 B**.
- Não foi modificado nesta R.

## Validações executadas
- whole-source TypeScript R151/R181: PASS;
- `test:v3172` completo + autorreparo: PASS;
- regressões históricas afetadas R31/R39/R41/R42/R60/R70/R100/R101/R107/R108: PASS;
- R108–R124: PASS;
- R125–R149: PASS;
- R150–R181: PASS, executados nos seus testes/runtime/checkers específicos sem typechecks redundantes;
- `quality:bundle`: PASS;
- `quality:syntax`: **655 TS/TSX** PASS;
- `quality:interactive`: **790 botões / 34 imagens com alt** PASS;
- `quality:visual`: PASS;
- `quality:audit`: **127/127** PASS;
- `release:preflight`: **138/138** PASS;
- assinatura lógica: `55102ebd58de443c`;
- `release:play-preflight`: **27/27** PASS.

Observação: o runner monolítico `test:v4080` não foi usado como único gate final porque repete muitos typechecks e excede a janela operacional. Seus trechos afetados e toda a cadeia moderna R108–R181 foram executados diretamente no estado final, com os mesmos arquivos de regressão/checkers.

## Débitos remanescentes
O `quality:bundle` está verde, mas com margem pequena (**7.083 B**). Próximas mudanças devem evitar crescimento de `src` sem compensação estrutural.

O Play preflight ainda emite avisos não bloqueantes:
- fonte total aproximada ~6,59 MB;
- `CardVisionApp` ainda ~2,5 mil linhas.

## Conclusão
A R181 fecha os dois débitos explícitos da R180 sem elevar o orçamento, sem criar autoridade paralela e sem alterar o motor final R119. Se o pacote final e a integridade SHA passarem, R181 pode substituir R180 como base canônica.
