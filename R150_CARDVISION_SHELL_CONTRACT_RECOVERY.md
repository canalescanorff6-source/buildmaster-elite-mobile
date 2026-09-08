# R150 — CardVision Shell Contract Recovery

## Objetivo

Recuperar contratos funcionais que ficaram órfãos no shell integrado `CardVisionApp.tsx` após refactors históricos, sem alterar a inteligência esportiva Clean Slate, sem criar uma segunda autoridade de persistência e sem mascarar o problema com callbacks vazios.

## Problema encontrado

A revisão estrutural iniciada para modularizar o `CardVisionApp.tsx` revelou um problema de correção mais urgente que o tamanho do arquivo: o componente possuía pontos de uso para callbacks e tipos que não tinham implementação/importação válida no shell atual.

Entre os contratos afetados estavam:

- abertura integrada de jogador;
- abertura do Cofre de Jogadores;
- restauração de ficha;
- arquivamento/desarquivamento;
- movimentação entre pastas;
- criação de pasta;
- reset de filtros do Cofre;
- roteamento de recomendações da Central;
- logout;
- tipos/imports de card crop e jogador integrado.

Esse tipo de falha é especialmente perigoso porque pode permanecer invisível em testes do motor e aparecer somente ao clicar numa ação específica da UI.

## Recuperação estrutural

A R150 restaurou os contratos usando as autoridades já existentes no projeto:

1. `restoreHistory` passa por `prepareVaultOpenR139` e só adota o histórico após `commitVaultHistoryR140` confirmado.
2. `moveHistoryToFolder` reutiliza `moveHistoryEntryToFolderR129` e `persistAndAdoptVaultHistoryR140`.
3. `archiveHistoryItem` reutiliza `archiveHistoryEntryR129` e `persistAndAdoptVaultHistoryR140`.
4. `openIntegratedPlayer` resolve o jogador pelo histórico canônico e reutiliza `openCofreDeJogadores`/`restoreHistory`, sem navegação paralela.
5. `handleCentralRecommendation` roteia para as seções oficiais e para `openIntegratedPlayer` quando existe `playerId`.
6. `logout` usa a conta oficial quando disponível e mantém somente o fallback de sessão já existente.
7. `createVaultFolder` e `resetVaultFilters` foram restaurados como operações de UI locais, sem introduzir writer paralelo.
8. Imports/tipos de `IntegratedPlayerRecord`, `CardCropResult`, `createEfhubCardPreview` e `createSmartCardPreview` foram restabelecidos.
9. A posição sugerida por hidratação agora é validada contra `POSITION_LABELS` antes do cast para `PositionCode`.

## Nova fronteira de regressão

Foi criado `typecheck:r150`, dedicado ao shell CardVision. Ele executa o TypeScript sobre o componente e falha caso exista qualquer diagnóstico direto em `src/components/CardVisionApp.tsx`, mesmo no ZIP clean onde dependências externas completas não estão instaladas.

Também foi criado `test:r150`, que congela os contratos recuperados e verifica que:

- os nove callbacks críticos possuem implementação;
- restauração continua sob R139/R140;
- mover/arquivar continuam sob R129/R140;
- abertura integrada reutiliza os fluxos oficiais;
- recomendações centrais continuam conectadas;
- validação de posição usa o catálogo oficial;
- não reaparecem persistência/navegação paralelas dentro desses contratos.

## Invariantes esportivos

A R150 não altera:

- kernel Clean Slate;
- beam = 20;
- orçamento/custo de progressão;
- pesos e heurísticas;
- desempate;
- ficha vencedora;
- Top 5;
- Ímpeto;
- posição real de uso;
- regra anti-Overall/GER;
- telemetria/otimizações R143–R149.

## Validação

- `typecheck:r150`: aprovado, zero diagnósticos TypeScript diretos no CardVision;
- `test:r150`: aprovado;
- `typecheck:v4080`: aprovado;
- sintaxe: 610 arquivos TypeScript/TSX;
- contratos interativos: 792 botões tipados e 34 imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play Store: 27/27;
- regressões principais R119–R150: aprovadas em blocos, sem regressão funcional.

## Débito estrutural explicitamente mantido

O `CardVisionApp.tsx` passou de aproximadamente 3799 para 3901 linhas porque a R150 recupera lógica que estava ausente. A R150 **não** removeu comportamento necessário para melhorar uma métrica de tamanho.

A próxima etapa correta é modularizar esses contratos recuperados e outros blocos coesos em módulos menores, preservando o novo checker R150 como fronteira de segurança.

## Resultado

A R150 prioriza correção sobre cosmética arquitetural: antes de dividir o monólito, restaura a integridade do shell e cria uma proteção permanente contra callbacks/tipos órfãos. Com isso, Cofre, jogador integrado, recomendações centrais e ações de manutenção voltam a ter contratos concretos e verificáveis sobre as autoridades existentes do projeto.
