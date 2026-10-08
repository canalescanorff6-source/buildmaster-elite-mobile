# Prévia da leitura parcial — plano de implementação

> **For agentic workers:** Use superpowers:executing-plans para implementar e testar cada tarefa nesta sessão.

**Goal:** Eliminar a promessa de finalizar uma ficha incompleta e identificar os atributos que faltaram.

**Architecture:** A conferência distingue prévia de confirmação final. A prévia usa o caminho existente `runAnalysis(false)` com os campos atuais; a confirmação continua passando pela certificação existente.

**Tech Stack:** React 19, TypeScript, testes Node e Playwright.

**Spec:** Pedido autorizado nesta conversa: corrigir a contradição da tela de 24/26 atributos e mostrar os campos ausentes. A investigação do OCR depende do print original ainda não fornecido.

## Global Constraints

- Não inventar atributos, níveis, orçamento, posição ou edição.
- Não promover nem salvar uma prévia como ficha final.
- Preservar as proteções de conta, arquivo e gravação duplicada.
- Não adicionar serviço pago nem modificar as condições de certificação.

## Review Focus

- Atributos apagados na conferência não podem reaparecer do texto OCR antigo.
- Gerar uma prévia não pode consumir a única confirmação do bridge.
- Resposta antiga não pode fechar a conferência de uma carta nova.
- Campos preenchidos posteriormente devem restaurar a opção de ficha final.
- Mensagens de prévia não podem anunciar uma ficha final já utilizável.

### Task 1: Leitura parcial abre prévia com dados atuais

**Files:** `PreFinalCardReviewR548.tsx`, `CardVisionApp.tsx`, `cardVisionReaderActionsR542.ts`, testes de ação e conferência React.

**Interfaces:** `onGenerate(fields: ManualFields, confirmed: boolean)`; `runAnalysis(false)` produz `preview`, sem persistência.

- [ ] Adicionar testes de 24/26, campo apagado, confirmação após prévia e campos corrigidos.
- [ ] Executar os testes e confirmar a falha anterior à correção.
- [ ] Listar atributos ausentes, distinguir o botão de prévia e encaminhar o modo correto com os campos atuais.
- [ ] Executar `npm run test:reader`, teste React e TypeScript da aplicação; salvar a mudança no GitHub.

### Task 2: Mensagens de revisão descrevem o estado real

**Files:** `singleReaderFinalizationR503.ts`, `ResultReviewPanelR189.tsx`.

- [ ] Substituir códigos internos por motivos de revisão e remover a promessa de ficha final já utilizável na prévia.
- [ ] Executar o teste R503 para garantir que somente a ficha certificada pode persistir.
- [ ] Revisar o diff e registrar a limitação: a falha específica do OCR ainda exige o print original.
