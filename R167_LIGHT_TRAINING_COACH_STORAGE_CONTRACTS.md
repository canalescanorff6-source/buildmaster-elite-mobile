# R167 — Light Training / Smart Coach Storage Contracts

## Objetivo

Remover do caminho estático de abertura motores completos que o `CardVisionApp` utilizava somente para acessar duas chaves de armazenamento no payload de compartilhamento de plano de treino.

## Diagnóstico

Na R166, o `CardVisionApp.tsx` importava:

- `TRAINING_GOALS_STORAGE_KEY` de `trainingEvolutionEngine.ts`;
- `SMART_COACH_REVIEW_STORAGE_KEY` de `smartCoachEngine.ts`.

Esses imports de constantes faziam o startup alcançar também o motor de Smart Coach, o motor de Training Evolution e, por dependência, o `competitivePerformanceEngine`.

Nenhuma função desses motores era necessária para a abertura do app ou para montar o payload; apenas as chaves estáveis de storage eram usadas.

## Mudança R167

Foram criados contratos leves:

- `src/modules/training/trainingStorageKeysR167.ts`;
- `src/modules/coaching/smartCoachStorageKeysR167.ts`.

Os valores das chaves permanecem exatamente iguais aos da R166.

Os motores originais agora reexportam essas mesmas constantes, preservando compatibilidade com consumidores existentes:

- `trainingEvolutionEngine.ts` reexporta as chaves de treino;
- `smartCoachEngine.ts` reexporta as chaves do Smart Coach.

O `CardVisionApp` passou a importar somente os contratos leves.

## Autoridades preservadas

A R167 não altera:

- cálculo de treino;
- Smart Coach;
- Competitive Performance;
- builds/progressão;
- habilidades adicionais;
- ímpetos;
- posição final;
- OCR;
- R138;
- Cofre R153/R154;
- persistência R140/R157;
- Backup R141/R162;
- nuvem R166.

Também não cria nova chave, novo storage, segundo writer ou segundo motor.

## Métrica de startup

Medição pela mesma closure estática usada nas releases recentes:

| Métrica | R166 | R167 | Variação |
|---|---:|---:|---:|
| Módulos estáticos | 198 | 197 | -1 |
| Fonte estática | 2.896.921 B | 2.821.204 B | -75.717 B |
| Redução de bytes | — | — | -2,61% |

Após a R167 ficaram fora da árvore estática:

- `src/modules/coaching/smartCoachEngine.ts`;
- `src/modules/matches/competitivePerformanceEngine.ts`;
- `src/modules/training/trainingEvolutionEngine.ts`.

Desde a R159, a closure caiu de 245 módulos / 3.580.879 B para 197 módulos / 2.821.204 B: 48 módulos e 759.675 B a menos no caminho inicial.

## Regressão R167

Adicionados:

- `tests/v40-80-r167-light-training-coach-storage-contracts-regression.mjs`;
- `scripts/check-cardvision-static-closure-r167.mjs`;
- `test:r167` no `package.json`.

A regressão impede:

- retorno dos motores completos ao `CardVisionApp` apenas por chaves;
- alteração silenciosa dos quatro valores canônicos de storage;
- quebra dos exports históricos dos motores;
- retorno dos três motores pesados à closure inicial;
- crescimento acima do orçamento R167 de 197 módulos / 2.830.000 B.

## Validação

Passaram:

- typecheck autocontido R151 de toda `src`;
- R138;
- R140;
- R141;
- R153;
- R154;
- R157;
- R162;
- R164;
- R165;
- R166;
- R167;
- sintaxe: 639 arquivos TS/TSX;
- contratos interativos: 790 botões e 34 imagens com `alt`;
- visual/acessibilidade;
- auditoria: 127/127;
- pré-voo de produção: 138/138;
- pré-voo Play: 27/27.

O aviso estrutural existente permanece: o código-fonte total é grande e `CardVisionApp.tsx` ainda possui aproximadamente 2,84 mil linhas. A R167 não aumentou o shell; seu objetivo foi reduzir dependências de startup.
