# R154 — Vault Action Guard + Operation Feedback

## Objetivo

Fechar a classe de falha que restou após a R153: a fila canônica já impedia perda de atualização, porém dois toques rápidos na mesma ação ainda podiam gerar duas mutações semanticamente válidas em sequência (por exemplo, favoritar duas vezes e voltar ao estado anterior ou criar duas variantes).

## Mudanças de produção

- `vaultActionGuardR154.ts`: gate puro por chave semântica. Ele bloqueia somente a repetição da mesma ação enquanto ela está ativa e não possui acesso a storage/cloud.
- `useCardVisionVaultCoordinatorR153.ts`: mantém a fila R153 e o commit R140, adicionando estado reativo das ações R154, rótulo de operação e wrappers protegidos para sync/pull manual da nuvem.
- `CleanVaultV3800.tsx`: ações de abrir, favorito, arquivar, duplicar, mover, status, habilidades e merge refletem o estado pendente e desabilitam somente a ação equivalente.
- `ResultWorkspace.tsx`: salvar ficha exibe `Confirmando...` e bloqueia repetição durante o commit.
- `VaultOperationStatusR154.tsx`: feedback acessível (`role=status`, `aria-live`, `aria-busy`) para commit local e nuvem.
- `useVaultCloudR141.ts`: `cloudLoading` passou de booleano simples para contador de operações pendentes, evitando apagar o indicador enquanto outra operação cloud ainda está na fila.
- Sincronização integral e download/merge integral usam gate R154 imediato, além da serialização cloud R128.
- Observações do Cofre permanecem fora do gate de clique: continuam versionadas e serializadas pela R153 para aceitar digitação/revisões rápidas.

## Autoridades preservadas

- R140 continua sendo o único commit local do Cofre.
- R153 continua sendo a fila canônica de transformação + persistência.
- R141 continua sendo a autoridade de cloud/backup.
- R128 continua serializando mutações físicas na nuvem.
- Nenhum arquivo do motor Clean Slate/analisador foi alterado nesta release.

## Proteção de CI

- `test:r154` cobre o gate puro e a integração de fonte.
- `typecheck:r154` reutiliza o typecheck autocontido de toda `src` da R151.
- O umbrella `test:v4080` agora inclui também R152, R153 e R154, fechando o ponto cego em que as releases mais recentes existiam como scripts isolados mas não faziam parte da regressão v40.80 completa.

## Validação executada

- R119–R149: aprovadas em blocos; R134 foi repetida separadamente após timeout do comando agregado e passou.
- R150–R154: aprovadas.
- Typecheck de toda `src`: aprovado.
- Sintaxe: 621 arquivos TS/TSX.
- Contratos interativos: 790 botões tipados e 34 imagens com `alt`.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Preflight Play: 27/27.
- `CardVisionApp.tsx`: 3900 linhas no contador da regressão R151, abaixo do teto de 3901; o teste não foi relaxado.

## Escopo diferencial R153 → R154

Arquivos de runtime alterados somente em shell/UI, Cofre e cloud:

- `src/components/CardVisionApp.tsx`
- `src/components/CleanVaultV3800.tsx`
- `src/components/result/ResultWorkspace.tsx`
- `src/app/v38-clean-vault.css`
- `src/modules/backup/useVaultCloudR141.ts`
- `src/modules/vault/useCardVisionVaultCoordinatorR153.ts`
- `src/modules/vault/vaultActionGuardR154.ts` (novo)
- `src/modules/vault/VaultOperationStatusR154.tsx` (novo)

Nenhum arquivo do motor de ficha/score/beam foi modificado.
