# R140 — Persistência confirmada e restauração crítica transacional

## Objetivo

Eliminar estados em que o BuildMaster aparenta ter salvo/alterado o Cofre antes de a memória local confirmar a gravação. A nuvem permanece réplica secundária; a verdade primária é a persistência local confirmada da conta atual.

## Regras novas

1. Uma mutação do Cofre é calculada primeiro e só é adotada pela UI depois que `persistHistoryStore()` retorna `saved: true`.
2. Pull/sync de nuvem não substitui o estado local se o aparelho recusar a gravação.
3. Salvar ficha e marcar Top 5 só atualizam o registro ativo depois da persistência confirmada.
4. Abrir/migrar uma ficha pode exibir o resultado na sessão, mas uma migração não confirmada não é tratada como registro salvo.
5. Operações de pasta, arquivo, favoritos, status, variantes, mesclagem, Lixeira e confirmação de habilidade usam a mesma fronteira.
6. Observações continuam responsivas durante a digitação, mas usam revisão monotônica: somente a revisão mais recente pode confirmar ou reverter o campo.
7. A restauração integral faz commit crítico de `partidas + Cofre` antes das demais seções. Se partidas falharem, o Cofre não muda. Se o Cofre falhar depois das partidas, as partidas são revertidas para o snapshot anterior.
8. A restauração não chama mais `replaceMatchValidationRepositoryR137()` diretamente na UI; essa operação fica encapsulada pelo coordenador R140.
9. Antes de uma atualização do app, a persistência do Cofre precisa ser confirmada antes de gerar o recovery backup.
10. Nuvem nunca autoriza uma mutação local que não foi persistida.

## Novo módulo

`src/modules/vault/vaultPersistenceCoordinatorR140.ts`

Responsabilidades:

- `commitVaultHistoryR140()` — confirmação local de uma nova coleção do Cofre;
- `commitCriticalVaultRestoreR140()` — restauração coordenada de Cofre + partidas com rollback da memória de partidas em falha de gravação do Cofre;
- dependências injetáveis para regressão determinística de falhas de storage.

O módulo não calcula ficha, Top 5, Ímpeto, posição ou DNA. A autoridade competitiva continua sendo Clean Slate via fachada de produção R138/R139.

## Correções funcionais

### Nuvem

Antes, `pullCloudHistory()` podia chamar `setHistory()` e disparar a persistência sem esperar o retorno. Agora a coleção baixada só é adotada depois de confirmação local.

`syncCloudHistory()` também confirma o Cofre local antes de enviar o conjunto mesclado à nuvem.

### Cofre

Salvar, arquivar, mover pasta, favoritar, alterar status, criar variante, mesclar registros e marcar habilidades deixam de assumir sucesso antes da memória local.

### Lixeira

Mover para Lixeira possui compensação: se a remoção do Cofre ativo falhar, o item é retirado novamente da Lixeira e o Cofre anterior permanece oficial.

Restauração da Lixeira também recoloca o item na Lixeira se a persistência do Cofre falhar.

### Backup

A restauração crítica é preparada antes de modificar a UI:

`normalizar -> gravar partidas -> gravar Cofre -> rollback das partidas se necessário -> adotar estado`.

Isso corrige o fluxo antigo em que o Cofre podia ser modificado antes de uma falha posterior da restauração das partidas.

## Dívida removida

`src/modules/formations/MarquesFormationStudio.tsx` foi removido porque estava totalmente órfão: nenhuma importação de runtime, teste, loader ou navegação dependia dele. Os estúdios atuais já substituem esse componente.

A remoção recupera orçamento de fonte sem aumentar artificialmente o limite.

## Regressão

Novo teste:

`tests/v40-80-r140-confirmed-persistence-backup-transaction-regression.ts`

Casos protegidos:

- commit normal de Cofre;
- recusa da persistência local;
- falha da escrita das partidas impede escrita do Cofre;
- falha do Cofre depois de partidas executa rollback;
- commit crítico bem-sucedido mantém ambos os recursos coerentes;
- CardVision não restaura partidas diretamente fora do coordenador;
- pull da nuvem não adota estado antes de salvar;
- backup integral passa pela transação crítica.

O contrato R137 foi atualizado para reconhecer R140 como fronteira externa de restauração, mantendo o repositório R137 encapsulado.

## Estado arquitetural

- Clean Slate continua escritor único da ficha.
- R138 continua fachada única de produção.
- R139 continua lifecycle único do Cofre.
- R140 passa a ser autoridade de confirmação de persistência local do Cofre e restauração crítica.
- Nuvem continua secundária.
- Overall/GER continua fora da identidade e da otimização.
