# R162 — Backup Controller + Lazy Runtime

## Objetivo

Reduzir o monólito `CardVisionApp.tsx` e retirar o runtime pesado de Backup/Sync do caminho crítico de abertura sem criar segunda autoridade de estado, persistência ou nuvem.

## Alterações estruturais

- Extraído `useCardVisionBackupControllerR162.ts` para concentrar refs, estado, diagnóstico e interface das ações de Backup/Sync.
- Criado `cardVisionBackupRuntimeR162.ts` para criptografia, exportação/importação, snapshots, restore, merge e sincronização integral.
- O runtime pesado é carregado apenas por `import('./cardVisionBackupRuntimeR162')`.
- Ao abrir Ajustes > Backup, o bootstrap do runtime carrega senha segura, snapshots e última sincronização sob demanda.
- `CardVisionApp.tsx` continua dono dos estados canônicos de jogador, Cofre, tema, OCR e navegação; o controlador recebe essas referências e setters, sem espelhar uma segunda verdade.
- Writers/transações R140/R128/R154 permanecem dentro do runtime de backup, sem duplicação no shell.
- A restauração de sessão continua usando `writeActiveSessionBackupPayloadR157`.
- A forma de coleta das preferências do backup foi preservada conforme a R161: tema, acento, modo avançado, escala, densidade, movimento e alto contraste.

## Redução do monólito

| Métrica | R161 | R162 | Ganho |
|---|---:|---:|---:|
| Linhas em `CardVisionApp.tsx` | 3.924 | 3.432 | -492 (-12,54%) |
| Módulos na árvore estática | 214 | 213 | -1 |
| Fonte estática alcançável | 3.255.139 B | 3.228.385 B | -26.754 B (-0,82%) |

`backupCrypto.ts` e `backupSnapshotRepositoryR141.ts` deixaram a árvore estática inicial.

## Autoridades preservadas

- R138 — posição de uso/produção canônica.
- R140 — persistência confirmada e restauração crítica com rollback.
- R141 — coleta modular de backup e snapshots.
- R153 — fila canônica de mutações do Cofre.
- R154 — guard de ações e feedback operacional.
- R157 — persistência dividida da sessão.
- R155–R161 — todas as fronteiras lazy e otimizações anteriores.

## Compatibilidade dos testes legados

Os testes R140 e R157 foram atualizados apenas quanto à localização estrutural das responsabilidades: em vez de procurar operações de backup dentro do `CardVisionApp`, passam a verificá-las no runtime R162. As mesmas funções e invariantes continuam exigidas.

## Validação

- `test:r162`: aprovado, incluindo typecheck autocontido de toda a pasta `src`.
- R138, R140, R141, R153 e R154: aprovados.
- R155, R156, R157, R158, R159, R160 e R161: aprovados.
- Sintaxe: 632 arquivos TS/TSX aprovados.
- Contratos interativos: 790 botões tipados e 34 imagens com `alt`.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Pré-voo de produção: 138/138.
- Pré-voo Play: 27/27.

## Travas R162

`tests/v40-80-r162-backup-controller-lazy-runtime-regression.mjs` impede:

- retorno das ações pesadas ao `CardVisionApp`;
- imports estáticos de criptografia/snapshot/persistência no controlador;
- duplicação de `commitCriticalVaultRestoreR140` e `runSerializedVaultCloudMutationR128` no shell;
- perda do guard R154;
- restauração padrão da sessão ativa;
- crescimento de `CardVisionApp.tsx` acima de 3.500 linhas.

`scripts/check-cardvision-static-closure-r162.mjs` limita a árvore estática a no máximo 214 módulos e 3.240.000 bytes.

## Próximo alvo recomendado

O shell ainda possui ~3,4 mil linhas. A próxima extração deve priorizar outro domínio com baixa chance de criar estado paralelo, preferencialmente o controlador do Leitor ou o bloco de navegação/estado de superfícies, mantendo o mesmo princípio: shell como composição, autoridade única e runtimes pesados sob demanda.
