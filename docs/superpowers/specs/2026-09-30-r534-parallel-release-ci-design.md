# R534 — Parallel Release CI

Data: 2026-09-30
Status: DESIGN APPROVED / SPEC AWAITING REVIEW

## Objetivo

Reduzir significativamente o tempo do workflow `Gerar APK Canal Direto` sem remover testes, sem enfraquecer a Regra Zero-Red, sem permitir publicação parcial e sem alterar qualquer autoridade funcional de OCR, ficha, Skills, Ímpeto, Táticas, Cofre ou motores do BuildMaster.

O problema observado no Run #601 foi estrutural: o job principal possuía `timeout-minutes: 90`, enquanto o diagnóstico consolidado podia executar até `120` minutos e continha 97 grupos executados sequencialmente. O job foi cancelado pelo teto global antes da conclusão do diagnóstico e antes da geração/publicação do APK.

## Invariantes obrigatórios

1. Os 97 grupos do `ci-doctor` continuam existindo.
2. Cada grupo deve executar exatamente uma vez por rodada completa de diagnóstico.
3. Nenhum shard pode omitir ou duplicar grupos.
4. A distribuição deve ser determinística para o mesmo código/configuração.
5. `fail-fast` permanece desativado: uma falha não pode esconder falhas dos outros shards.
6. O APK só pode ser gerado, assinado ou publicado se todos os shards obrigatórios estiverem GREEN.
7. A Regra Zero-Red continua sendo executada antes da validação paralela e deve convergir antes da publicação.
8. O fluxo R532/R533 de integridade, source SHA, checksum, assinatura e aceitação física permanece intacto.
9. Não haverá `sleep` artificial nem remoção de teste para ganhar tempo.
10. `BUILD GREEN != ENGINE_CERTIFIED`; esta mudança é exclusivamente de CI/release.

## Arquitetura proposta

### 1. Stabilize Source

Mantém o job atual `stabilize-source`.

Responsabilidades:
- checkout do ref correto;
- `npm run ci:stabilize`;
- detectar mudanças determinísticas;
- auto-commit apenas quando necessário;
- impedir que o build valide uma árvore diferente daquela que será publicada.

Quando houver auto-commit, o run atual não publica. Um novo run valida o commit estabilizado.

### 2. Diagnostic Matrix

Após a estabilização, o diagnóstico completo será distribuído em 4 shards paralelos.

Matriz conceitual:

- shard 0/4
- shard 1/4
- shard 2/4
- shard 3/4

Cada shard:
- faz checkout do mesmo commit;
- configura Node;
- instala dependências travadas;
- usa cache npm;
- executa `ci-doctor.mjs --full --shard-index N --shard-count 4 --report-dir ...`;
- grava relatório próprio;
- sobe artifact próprio mesmo em caso de falha.

A estratégia da matriz deve usar `fail-fast: false`.

### 3. Contrato de sharding

`scripts/ci-doctor.mjs` aceitará:

- `--shard-index <0..N-1>`
- `--shard-count <N>`

Sem argumentos de shard, o comportamento atual permanece compatível: roda todos os grupos.

A partição será determinística por índice da lista canônica de checks. Regra inicial:

`groupIndex % shardCount === shardIndex`

Isso preserva ordem interna, evita dependência de hashing e torna simples provar cobertura total.

O `EXPECTED_FULL_GROUPS = 97` permanece como contrato global. O modo shard deve validar argumentos e rejeitar:
- `shardCount < 1`;
- `shardIndex < 0`;
- `shardIndex >= shardCount`;
- valores não inteiros.

Cada relatório deve registrar:
- `mode`;
- `shardIndex`;
- `shardCount`;
- quantidade de grupos do shard;
- labels executados;
- duração;
- falhas.

### 4. Gate agregado

Depois da matriz, um gate de release exige sucesso de todos os 4 shards.

Se qualquer shard falhar:
- build web não inicia;
- Android não inicia;
- APK não é assinado;
- release não é publicada;
- relatórios dos 4 shards permanecem disponíveis.

Nenhum mecanismo deve transformar falha de shard em GREEN.

### 5. Build final

Somente após o gate agregado GREEN começa o fluxo pesado de publicação:

1. validar configuração/segredos públicos obrigatórios;
2. calcular versão/versionCode/sourceSha;
3. confirmar árvore Zero-Red limpa;
4. gerar/verificar manifesto de integridade;
5. gerar web app estático;
6. validar bundle e configuração real;
7. criar/sincronizar Capacitor Android;
8. configurar plugins nativos;
9. Gradle;
10. assinar APK;
11. verificar assinatura e checksum;
12. gerar template R532;
13. gerar recibo R533 `BUILD_VERIFIED / DEVICE_PENDING`;
14. publicar artefatos/release/manifestos conforme os gates existentes.

O job final pode usar `timeout-minutes: 180` como margem de segurança. Esse valor não é uma espera artificial; é apenas um teto superior.

### 6. Eliminação de duplicação

O diagnóstico consolidado completo não deve ser executado novamente dentro do job final depois que os 4 shards já provaram a mesma lista canônica de checks.

Os gates rápidos que protegem invariantes específicos de release podem permanecer quando tiverem propósito diferente do diagnóstico completo. Qualquer duplicação removida deve ser coberta por teste de contrato para provar que não houve perda de checks.

## Testes obrigatórios antes da integração

### Regressão de partição

Criar teste que importe/inspecione a lista canônica e prove, para 4 shards:

- união = 97 grupos;
- interseção entre shards = vazia;
- nenhum label duplicado;
- nenhum label ausente;
- mesma entrada gera mesma partição;
- índices inválidos falham fechado.

### Regressão do workflow

Provar por inspeção estrutural que `build-apk.yml` contém:

- matriz com 4 shards;
- `fail-fast: false`;
- reports por shard;
- dependência explícita do build final em todos os shards;
- nenhum build/publicação antes do gate agregado;
- timeout final >= maior timeout interno + margem;
- fluxo R532/R533 preservado.

### Compatibilidade

Executar também, no mínimo:

- teste R457 corrigido;
- R531;
- R532;
- R533;
- contrato do CI;
- validação YAML;
- Regra Zero-Red/assert-clean;
- regressão específica R534.

## Critérios de sucesso

R534 só pode ser considerada implementada quando:

1. testes de partição e workflow estiverem GREEN;
2. YAML dos workflows estiver válido;
3. o commit estiver na `main`;
4. um novo `Gerar APK Canal Direto` usar a matriz paralela;
5. todos os shards terminarem;
6. o gate agregado refletir corretamente GREEN/RED;
7. se GREEN, o build final avançar para web/Android/assinatura/publicação;
8. se RED, o APK permanecer bloqueado e os relatórios identificarem a causa.

## Fora de escopo

- alterar regras de OCR;
- alterar ficha/PP;
- alterar Skills ou Ímpeto;
- alterar Táticas/Cofre;
- reduzir cobertura de testes;
- mover testes obrigatórios para nightly apenas;
- alterar critérios de certificação do motor;
- marcar ENGINE_CERTIFIED por causa de um build GREEN.

## Rollback

A implementação deve ser reversível para o diagnóstico sequencial sem tocar no core do app. Como o `ci-doctor` manterá o modo sem shards, o fallback é remover a matriz do workflow e voltar a chamar `--full` em um único job.
