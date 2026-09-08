# R153 — Canonical Vault Mutation Queue

## Objetivo

Eliminar uma condição de corrida no Cofre sem criar um segundo writer ou alterar qualquer decisão do motor de fichas.

Na R152, a gravação física R140 já era serializada, porém várias ações da UI ainda calculavam `nextHistory` antes de entrarem na fila. Duas ações rápidas podiam, portanto, partir do mesmo snapshot antigo e a segunda confirmação sobrescrever uma alteração já confirmada pela primeira.

## Correção estrutural

A R153 introduz uma fronteira canônica de mutação em `vaultCanonicalMutationQueueR153.ts`:

1. a transformação do estado entra na fila;
2. a transformação sempre recebe o último snapshot canônico confirmado;
3. o resultado é enviado ao writer oficial R140;
4. o snapshot canônico só avança quando R140 confirma o commit;
5. uma falha não altera a verdade canônica e não bloqueia operações posteriores.

A fila não acessa `localStorage`, IndexedDB nem storage nativo. Persistência continua pertencendo à infraestrutura já existente.

## Coordenação CardVision + nuvem

`useCardVisionVaultCoordinatorR153.ts` centraliza a ligação entre:

- CardVision;
- fila canônica R153;
- commit local R140;
- sincronização cloud R141.

O hook R141 continua sendo a autoridade de nuvem. A R153 apenas garante que pull/sync/merge trabalhem sobre o último estado local confirmado, eliminando disputa entre uma ação do usuário e uma sincronização concorrente.

## Ações protegidas

A fronteira canônica cobre as mutações críticas do Cofre, incluindo:

- salvar ficha;
- marcar/desmarcar habilidades Top 5;
- mover ficha de pasta;
- arquivar/restaurar;
- exclusão/restauração;
- favoritos e status individuais/em lote;
- importação e mesclagem;
- duplicação/variantes;
- edição de observações;
- merge recebido da nuvem.

## Modularização

A coordenação local+nuvem saiu do `CardVisionApp.tsx` e foi movida para um hook próprio. O shell permanece abaixo do limite estrutural preservado pela R151 (3897 linhas pelo auditor do projeto).

## Motor de fichas

A auditoria diferencial R152 -> R153 confirmou que nenhum arquivo do motor Clean Slate/análise foi modificado. Permanecem congelados:

- autoridade final Clean Slate;
- beam 20;
- orçamento e custos;
- DNA da carta;
- função/posição real de uso;
- Top 5;
- Ímpeto;
- score competitivo;
- calibração por partidas;
- otimizações R143-R149;
- neutralidade de GER/Overall.

## Validação

- regressões R119-R153: aprovadas;
- typecheck autocontido de toda `src`: aprovado;
- teste concorrente R153: aprovado;
- CardVision + cloud source regression R153: aprovado;
- sintaxe: 618 arquivos TypeScript/TSX;
- contratos interativos: 790 botões e 34 imagens com alt;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play: 27/27.

## Resultado

A R153 transforma o Cofre em uma sequência transacional lógica: ações concorrentes são rebaseadas sobre a última verdade confirmada antes de gravar. Isso reduz risco de perda silenciosa de alterações sem introduzir writer, motor ou autoridade paralela.
