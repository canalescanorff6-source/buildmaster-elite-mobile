# R152 — Integridade de Ações + Histórico Real de Busca

## Objetivo
Eliminar uma classe de falha de UX em que um elemento visualmente apresentado como botão não possui ação real e corrigir a tela de busca para exibir histórico de comandos realmente usados, preservando integralmente o motor de fichas R149 e as fronteiras R150/R151.

## Diagnóstico de origem
A varredura AST encontrou seis `button type="button"` sem `onClick`. Quatro eram elementos de apresentação/drag e dois mereciam correção direta de UX. O caso mais claro estava em `PremiumSearchScreen`: o botão **Ver todas** não possuía ação e o bloco **Buscas recentes** usava apenas `commands.slice(0, 4)`, ou seja, não representava uso real.

Também havia elementos puramente visuais usando semântica de botão em prévia de aparência, mapa de formação e escalação integrada. Isso induzia affordance incorreta e tornava impossível distinguir automaticamente controles reais de decoração.

## Implementação

### 1. Fronteira global contra botões mortos
`scripts/check-interactive-contracts.mjs` agora exige que todo `button type="button"` tenha pelo menos um contrato explícito de interação (`onClick`, `onPointerDown`, `onKeyDown`) ou estado `disabled`.

Um elemento apenas visual deve usar semântica não interativa.

### 2. Histórico real de busca por conta
Novo módulo:

- `src/lib/searchCommandHistoryR152.ts`

Responsabilidades:

- armazenar apenas IDs de comandos;
- isolamento por conta através de `accountStorage`;
- deduplicação por uso mais recente;
- limite de 12 comandos;
- descarte seguro de IDs que não existem mais;
- limpeza explícita do histórico.

Tanto `AppCommandPalette` quanto `PremiumSearchScreen` registram o comando realmente executado.

### 3. Busca Premium corrigida
A tela agora:

- mostra buscas recentes reais;
- permite limpar o histórico;
- exibe estado vazio quando não há uso anterior;
- usa sugestões separadas do histórico;
- registra ações executadas pela própria tela;
- informa falha síncrona de execução via região `aria-live`;
- substitui o texto impreciso “Aprendendo...” por descrição fiel da busca contextual existente.

### 4. Semântica corrigida
Deixaram de ser botões falsos:

- CTA apenas visual da prévia de Aparência;
- slots estáticos do mapa de Formação;
- cards estáticos da escalação integrada.

Os controles realmente arrastáveis continuam como botões e são reconhecidos por `onPointerDown`.

## Escopo protegido
Auditoria diferencial R151 → R152 confirmou alterações apenas na camada de UI/busca/checks/testes. Nenhum arquivo do motor Clean Slate, progressão, Top 5, Ímpeto, OCR de produção, calibração de partidas ou autoridade do Cofre foi modificado.

## Validação

- `typecheck:r151`: toda `src` aprovada;
- `quality:interactive`: 790 botões reais + 34 imagens aprovados;
- `quality:syntax`: 615 TS/TSX aprovados;
- visual/acessibilidade aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- Play Store: 27/27;
- regressões R119–R152 aprovadas;
- teste R152 de histórico: deduplicação, limite, resolução e persistência por conta;
- teste R152 de fonte: bloqueio de retorno do botão morto e dos falsos recentes.

## Contrato de continuidade
R152 não altera a inteligência esportiva. R149 permanece a autoridade do hot path Clean Slate; R150 protege os contratos do shell; R151 mantém o typecheck autocontido de toda `src`; R152 adiciona a fronteira de ação real da interface e o histórico correto da busca.
