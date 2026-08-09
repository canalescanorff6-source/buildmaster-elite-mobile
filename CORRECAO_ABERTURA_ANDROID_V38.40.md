# Correção de abertura no Android — v38.40

## Falha corrigida

O aplicativo podia abrir a tela **“Esta área não conseguiu abrir”** quando uma atualização encontrava no armazenamento local um JSON válido, porém com formato incompatível com o esperado. O caso mais crítico estava na lixeira do Cofre: um registro legado que não fosse uma lista podia provocar erro durante a inicialização de `CardVisionApp`.

## Alterações aplicadas

- o leitor seguro de JSON agora valida o tipo estrutural básico antes de devolver o valor;
- formatos legados incompatíveis passam a usar o valor seguro sem apagar automaticamente o conteúdo original;
- a lixeira do Cofre agora ignora entradas inválidas e recupera os itens utilizáveis;
- o shell inteiro, incluindo autenticação e aplicativo principal, foi envolvido pela barreira de recuperação;
- a recuperação automática ganhou proteção contra redirecionamento repetitivo;
- foi mantida a correção da regressão v31.72 para habilidades adicionais e Ímpetos em trilhas separadas.

## Dados preservados

A correção não limpa jogadores, fichas, imagens do Cofre, Mapeamento de Elenco ou backups. Somente dados transitórios incompatíveis podem ser descartados pelo modo seguro.

## Validação

Foram aprovadas as suítes direcionadas de recuperação v39.30, armazenamento defensivo, OCR/Mapeamento v38.40, motor unificado v39.20, Mapeamento Total v39.50, rotas críticas e regressões funcionais v31.72.
