# R169 — Vault Deferred Lifecycle + Mutations

## Objetivo

Retirar do startup do `CardVisionApp` o lifecycle pesado de produção do Cofre (R139) e as mutações de catálogo (R129), preservando:

- R138 como autoridade final da ficha;
- R140 como commit local confirmado;
- R153 como fila canônica única;
- R154 como gate contra ações concorrentes/duplo clique;
- edição de notas com resposta otimista imediata;
- APIs históricas R129/R139 sem duplicar regras.

## Mudanças

### 1. Runtime lazy do Cofre

Novo arquivo:

`src/modules/vault/vaultDeferredRuntimeR169.ts`

O runtime memoiza e carrega dinamicamente:

- `vaultProductionLifecycleR139`
- `vaultHistoryMutationsR129`

O `CardVisionApp` não possui mais imports runtime estáticos desses dois módulos.

### 2. Preload por intenção explícita

O runtime R169 é pré-carregado quando o usuário abre:

- Cofre;
- Resultado.

`openCofreDeJogadores()` também dispara preload para caminhos que abrem o Cofre sem passar por `openMainSection()`.

### 3. Lifecycle R139 preservado

`vaultProductionLifecycleR139.ts` permaneceu byte-a-byte inalterado.

As operações continuam dentro da fila canônica R153:

- `prepareVaultOpenR139`
- `prepareVaultSaveR139`
- `prepareVaultSkillToggleR139`

A única diferença é que o módulo é obtido antes da mutação por `loadVaultDeferredRuntimeR169()`.

### 4. Mutações R129 sob demanda

Operações de catálogo agora carregam o runtime somente quando acionadas:

- mover para pasta;
- arquivar/restaurar;
- excluir do Cofre ativo;
- favoritos em lote;
- status em lote;
- mesclar duplicatas;
- favoritar;
- duplicar ficha;
- alterar status;
- concluir/reabrir Top 5.

As implementações continuam sendo as funções R129 originais.

### 5. Notas continuam imediatas

A edição de observações não foi colocada atrás de import assíncrono porque faz parte do caminho de digitação/feedback instantâneo.

Novo módulo leve:

`src/modules/vault/vaultNoteMutationR169.ts`

Ele contém o mesmo corpo histórico de `updateHistoryNotesR129`.

`vaultHistoryMutationsR129.ts` apenas reexporta essa função, preservando a API R129 e evitando uma segunda regra de negócio.

## Medição de startup

| Métrica | R168 | R169 | Delta |
|---|---:|---:|---:|
| Módulos estáticos | 194 | 192 | -2 |
| Fonte estática | 2.777.514 B | 2.751.994 B | -25.520 B |
| Redução de bytes | — | — | -0,92% |

Os módulos abaixo ficaram fora da árvore estática do `CardVisionApp`:

- `src/modules/vault/vaultProductionLifecycleR139.ts`
- `src/modules/vault/vaultHistoryMutationsR129.ts`

Contratos leves mantidos no startup:

- `vaultDeferredRuntimeR169.ts`
- `vaultNoteMutationR169.ts`

## Evolução acumulada do startup

Comparando R159 com R169:

- módulos: 245 → 192 (-53; -21,63%);
- fonte estática: 3.580.879 B → 2.751.994 B (-828.885 B; -23,15%).

## CardVisionApp

A R169 prioriza dependências, não redução de linhas do shell.

- R168: 2.848 linhas / 211.828 B
- R169: 2.876 linhas / 213.189 B

O aumento é wiring explícito de loaders/desestruturação. Nenhuma lógica esportiva foi adicionada ao shell. Esse débito permanece candidato a uma futura extração de controller.

## Regressões e validações

Aprovados:

- TypeScript autocontido de toda `src`;
- R128 (teste atualizado para localizar a fila cloud na autoridade R166);
- R129;
- R138;
- R139;
- R140;
- R153;
- R154;
- R157;
- R166;
- R167;
- R168;
- R169;
- 642 arquivos TS/TSX com sintaxe válida;
- 790 botões tipados;
- 34 imagens com `alt`;
- contraste, toque, foco, reduced motion e live regions;
- 127/127 auditorias;
- 138/138 pré-voo de produção;
- 27/27 pré-voo Play.

Avisos conhecidos preservados:

- código-fonte total ~6,65 MB;
- `CardVisionApp.tsx` ainda é um componente grande (~2,88 mil linhas).

## Testes/travas R169

Novos:

- `tests/v40-80-r169-vault-deferred-lifecycle-mutations-regression.mjs`
- `scripts/check-cardvision-static-closure-r169.mjs`

Orçamento R169:

- máximo 192 módulos estáticos;
- máximo 2.765.000 bytes de fonte estática.

Medição final:

- 192 módulos;
- 2.751.994 bytes.

## Invariantes de release

- `test:v4080` termina em `npm run test:r169`;
- `test:all` continua terminando em `npm run test:v4080`;
- versão do pacote permanece `40.80.0`;
- R169 é revisão estrutural dentro da linha v40.80.

## Próximo alvo provável

Os maiores pesos estáticos restantes identificados são:

1. `useCardVisionBackupControllerR162` (~22,9 KB exclusivos na medição pré-R169);
2. `useCardVisionVaultCoordinatorR153` (~17,5 KB exclusivos);
3. `confidenceComparison` (~11,8 KB exclusivos).

O próximo ciclo deve priorizar uma separação leve do Backup Controller ou uma redução do coordenador R153 somente se for possível preservar hooks, fila e writers sem duplicação de estado.
