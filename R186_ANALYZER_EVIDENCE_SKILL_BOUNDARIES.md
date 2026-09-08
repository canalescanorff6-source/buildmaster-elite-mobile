# R186 — Analyzer Evidence + Skill Intelligence Boundaries

## Base canônica
- Base de entrada: R185 — CardVision Chrome + Vault Actions Boundary.
- Package version preservada: `40.80.0`.
- Autoridade esportiva final preservada: `src/lib/cleanSlatePerformance2027V4080R119.ts`.
- SHA-256 congelado do R119: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo
Reduzir o segundo grande monólito remanescente do projeto, `src/lib/analyzer.ts`, sem alterar parsing, progressão, Top 5, Ímpetos, DNA, posição de uso, validação ou a autoridade final Clean Slate.

A R186 é uma modularização de fronteiras. Não cria motor competitivo novo e não muda fórmula esportiva.

## Situação R185
`src/lib/analyzer.ts`:
- 2.384 linhas;
- 181.269 bytes;
- maior módulo TypeScript do projeto na R185.

O arquivo concentrava ao mesmo tempo:
1. parsing/evidência OCR;
2. identidade e posições da carta;
3. validação pré-ficha;
4. inteligência de habilidades adicionais;
5. inteligência de Ímpetos;
6. progressão provisória/diagnósticos;
7. montagem do `AnalysisResult`.

## Fronteira 1 — evidência da carta
Novo módulo:
- `src/modules/analysis/analyzerCardEvidenceR186.ts`

Responsabilidades extraídas:
- `parseCard`;
- identificação da carta;
- leitura de posição/estilo;
- orçamento de treino;
- evidência física/skills/Ímpetos;
- posições permitidas;
- posições a evitar;
- validação pré-ficha.

Tamanho final:
- 289 linhas;
- 19.410 bytes.

A fachada pública histórica `parseCard` continua disponível por `src/lib/analyzer.ts`.

## Fronteira 2 — inteligência de habilidades e Ímpetos
Novo módulo:
- `src/modules/analysis/analyzerSkillIntelligenceR186.ts`

Responsabilidades extraídas:
- blueprints por função/estilo;
- bans contextuais;
- score provisório de habilidades;
- Top 5 complementar do analyzer-base;
- recomendações e tiers de skills;
- recomendações de Ímpetos;
- normalização de inventário oficial.

Tamanho final:
- 691 linhas;
- 43.856 bytes.

O contrato público histórico `recommendImpetos()` permanece em `analyzer.ts` como fachada fina para não quebrar integrações/regressões antigas.

## Resultado no monólito
`src/lib/analyzer.ts` após R186:
- 1.377 linhas;
- 118.507 bytes.

Redução em relação à R185:
- menos 1.007 linhas (~42,2%);
- menos 62.762 bytes (~34,6%).

O conjunto `analyzer.ts + duas fronteiras R186` possui 181.773 bytes, somente 504 bytes acima do monólito R185. Esse pequeno overhead corresponde a contratos/imports explícitos entre módulos.

## Orçamento e closure
R185 original:
- 180 módulos estáticos;
- 2.444.219 bytes na closure CardVision;
- 418 arquivos TypeScript no orçamento de fonte;
- 5.313.535 / 5.505.024 bytes.

R186:
- 182 módulos estáticos;
- 2.444.723 bytes na closure CardVision;
- 420 arquivos TypeScript no orçamento de fonte;
- 5.314.039 / 5.505.024 bytes.

Importante:
- o teto estático de bytes da R185 continua exatamente `2.445.000`;
- o limite de módulos sobe de 180 para 182 somente quando **as duas fronteiras R186 existem**;
- nenhuma folga artificial de bytes foi adicionada;
- a margem global de fonte permanece 190.985 bytes.

## Equivalência esportiva congelada
Foi executado o mesmo cenário representativo na R185 original e na R186.

As saídas congeladas foram idênticas byte-a-byte para:
- `parseCard`;
- posição escolhida;
- ficha provisória;
- orçamento;
- habilidades recomendadas;
- tiers/razões de habilidades;
- habilidades a evitar;
- Ímpetos;
- validação;
- posições permitidas/evitadas;
- Card DNA;
- identidade do jogador.

Hash SHA-256 do JSON congelado, sem newline:
`d3a8c3226cdc2cceab2e19fab6751ae11745b66c6a93844657ccc516b27cd57f`.

## Proteções R186
Novos testes:
- `tests/v40-80-r186-analyzer-boundary-regression.mjs`;
- `tests/v40-80-r186-analyzer-equivalence-regression.ts`.

Eles bloqueiam:
- retorno de parsing/evidência ao monólito;
- retorno da inteligência de skills ao monólito;
- crescimento de `analyzer.ts` acima de 120 KB / 1.400 linhas;
- alteração do R119 durante esta modularização;
- criação de writer Clean Slate nos módulos auxiliares;
- relaxamento do teto estático em bytes;
- quebra das fachadas públicas `parseCard` e `recommendImpetos`;
- divergência das saídas congeladas da R185.

A cadeia `test:v4080` agora fecha em `test:r186`, enquanto `test:all` continua fechando por `test:v4080` para preservar o contrato histórico da auditoria.

## Regressões esportivas revalidadas
Aprovadas após a extração:
- R119 — Clean Slate / output quality / Top 5 / Ímpeto;
- R122 — máximo online + DNA;
- R125 — build card-specific por posição de uso;
- R130 — parser boundaries;
- R131 — review/evidence boundary;
- R134 — evidência física permanente;
- R135/R136 — calibração por partidas sem writer paralelo;
- R142 — analyzer boundary / produção enxuta;
- v31.72 — skills complementares + Ímpetos;
- v35.00 — catálogo oficial + Top 5 por função/estilo;
- R180–R185 — cadeia estrutural/release anterior;
- R186 — fronteiras + equivalência.

## Gates finais
- TypeScript autocontido de `src`: aprovado.
- Auditoria limpa: 127/127.
- Pré-voo de produção: 138/138.
- Pré-voo Google Play: 27/27.
- Contratos interativos: 790 botões tipados / 34 imagens com `alt`.
- Contrato preventivo de CI: aprovado.
- Bundle/source budget: aprovado.

## Android
Nenhuma lógica Android/workflow foi modificada na R186. Permanecem válidas as proteções R182/R183.

O ambiente local continua sem Android SDK/adb/sdkmanager/node_modules completos para gerar e assinar o APK físico. Isso é limitação de toolchain local, não regressão da fonte; compilação/assinatura final continuam no GitHub Actions.

## Próxima fronteira recomendada
O maior arquivo TypeScript passa a ser:
- `src/components/CardVisionApp.tsx` — 164.049 bytes.

O próximo ciclo deve continuar reduzindo responsabilidades do shell CardVision ou separar a parte restante de treino/diagnósticos do analyzer, sempre preservando R119 como single writer e exigindo equivalência mensurável.
