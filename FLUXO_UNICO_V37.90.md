# BuildMaster Elite Tático — v37.90 Fluxo Único

## Objetivo

Reduzir duplicações na criação de fichas sem remover nenhum motor de análise. A entrada por imagem e o preenchimento manual passam a compartilhar a mesma experiência visual, o mesmo rascunho e as mesmas etapas.

## Mudanças implementadas

### Fluxo centralizado

A criação agora possui uma barra única com três etapas:

1. Entrada
2. Revisão
3. Resultado

O usuário pode alternar entre **Usar imagem** e **Digitar dados** sem perder os campos que já informou.

### Rascunho automático por conta

O app salva de forma automática:

- método de entrada;
- nome do jogador;
- pontos disponíveis;
- posição escolhida;
- posição da carta;
- estilo de jogo;
- presença de imagem;
- quantidade de atributos preenchidos;
- etapa e percentual de conclusão.

A sessão completa continua protegida pelo armazenamento de sessão já existente.

### Retomada na Central

Quando existe uma ficha incompleta, a Central mostra apenas um card compacto com:

- nome do rascunho;
- etapa atual;
- percentual concluído;
- botão Continuar;
- botão Descartar.

### Menos duplicação

- o guia antigo de criação foi substituído pela barra única;
- o cabeçalho repetido do modo manual foi ocultado;
- os rascunhos antigos de imagem e manual foram unificados no ID `current-creation`;
- ao salvar ou descartar, os rascunhos antigos também são removidos.

### Segurança

- trocar o método não apaga a imagem nem os campos manuais;
- descartar uma criação não altera o Cofre;
- a ficha continua exigindo revisão antes da conclusão;
- o cache nativo foi atualizado para `37.90.0-unified-creation-1`.

## Validações

- typecheck isolado do motor v37.90;
- typecheck isolado da interface e do controlador;
- regressão funcional do progresso e rascunho;
- regressão de integração da tela;
- regressões v37.71 e v37.80;
- regressão visual v33.00;
- sintaxe de 324 arquivos TypeScript/TSX;
- 111 verificações da auditoria;
- 122 verificações do pré-voo de produção.
