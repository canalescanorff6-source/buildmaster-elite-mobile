# R121 — Habilidades + Upgrade geral do app

## Objetivo

Restaurar o fluxo operacional de habilidades adicionais que existia no app e melhorar a tela principal sem criar uma segunda autoridade de ficha.

## Habilidades adicionais

- Toque em uma habilidade pendente abre confirmação: **“Você já adicionou esta habilidade?”**.
- A confirmação tem **Cancelar** e **Confirmar**.
- Confirmar remove a habilidade da fila pendente e a move para **Habilidades adicionadas**.
- Se 1 habilidade for concluída, restam 4; se 3 forem concluídas, restam 2.
- Uma habilidade concluída pode voltar para a fila pendente se foi marcada por engano.
- O progresso fica persistido no Cofre e atualiza o status da ficha para `completo` quando todas as recomendações atuais forem concluídas.
- A ação **“A carta já possui? Gerar outra”** é separada do fluxo de conclusão e também exige confirmação antes de recalcular.
- Quando uma habilidade já possuída é confirmada, o resultado recalculado e o novo Top 5 são sincronizados com a ficha salva.
- Progresso obsoleto de uma recomendação substituída não contamina o Top 5 novo.

## Upgrade da tela principal

- O Top 5 agora é interativo também no resultado compacto, onde antes aparecia apenas como leitura estática.
- Barra de progresso 0–100% e contagem `concluídas / total`.
- Seção sempre visível de habilidades pendentes e seção separada de habilidades adicionadas.
- **Central 2027** com:
  - estilo ofensivo;
  - estilo defensivo ou Básico;
  - posição usada;
  - estilo coletivo;
  - progresso das habilidades;
  - próxima ação operacional.
- Cabeçalho do jogador exibe ataque e defesa separadamente.
- Compartilhamento da ficha inclui estilos ofensivo/defensivo e habilidades pendentes/adicionadas.

## Integridade estrutural

- Nenhum motor histórico ganhou poder de escrita.
- O Clean Slate continua sendo a autoridade final da ficha, Top 5 e Ímpeto.
- O novo `skillWorkflowR121` é apenas uma autoridade de estado/UX das habilidades, não um motor de desempenho.
- O fluxo de habilidades salva na memória local e sincroniza o histórico já existente.

## Teste

```bash
npm run test:r121
```

- Compatibilidade de tipo de Sobreposição corrigida em módulo histórico sem adicionar peso novo de gameplay.
