# BuildMaster v29.20 — Hotfix 2 do TypeScript no GitHub Actions

## Segunda execução do workflow

Depois do isolamento dos stubs de teste, o GitHub Actions avançou e revelou quatro erros reais restantes no typecheck principal:

1. `CardVisionApp.tsx`: a ação `onCreateSnapshot` devolvia um objeto, mas o componente aceita somente `void | Promise<void>`;
2. `PremiumExperienceLayer.tsx`: o ícone `Check` estava importado sem uso;
3. `PremiumExperienceLayer.tsx`: `toast.actionEvent` continuava como `string | undefined` dentro do callback;
4. `MatchLaboratory.tsx`: `team.formation` era exposta como `string`, embora o painel competitivo exija `TacticalFormation`.

## Correções aplicadas

- a criação do ponto de restauração agora usa um callback `async` que aguarda a operação sem repassar o objeto interno;
- o import não utilizado de `Check` foi removido;
- o nome do evento do toast é estreitado no ponto exato de criação do `CustomEvent`;
- `TeamDiagnosis.formation` passou a usar `TacticalFormation`;
- o motor central devolve o `blueprint.id`, preservando o identificador oficial da formação;
- foi adicionada a regressão `tests/v29-20-github-actions-typecheck-hotfix2-regression.mjs`;
- `test:v2920` passou a executar essa nova proteção.

## Limite da validação local

A instalação integral das dependências voltou a falhar neste ambiente porque o registro de pacotes respondeu HTTP 503. Por isso, o typecheck completo com React, Next e Lucide reais deve ser confirmado na próxima execução do GitHub Actions.

Os quatro erros exibidos na segunda execução foram corrigidos diretamente nas linhas e contratos correspondentes. A versão permanece `29.20.0`, pois nenhum APK foi publicado.

## Validações locais depois da correção

- 27/27 regressões MJS aprovadas;
- 4/4 regressões CJS funcionais aprovadas;
- 3/3 typechecks isolados aprovados;
- 241 arquivos TypeScript/TSX com sintaxe aprovada;
- 520 botões com tipo explícito;
- 19 imagens com texto alternativo;
- 29 verificações de pré-voo aprovadas;
- 66 verificações de auditoria aprovadas;
- regressão própria do Hotfix 2 aprovada.

O `npm ci` integral não terminou localmente porque o registro de dependências respondeu HTTP 503 em vários pacotes. A próxima execução do GitHub Actions é a confirmação obrigatória do typecheck completo.
