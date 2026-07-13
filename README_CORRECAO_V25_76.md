# v25.76 — Reparo definitivo de Cofre e execução mobile

Esta versão corrige a causa mais provável da queda após gerar a ficha: registros antigos ou incompletos do Cofre eram carregados por módulos coletivos e podiam derrubar o aplicativo inteiro assim que uma nova ficha era salva.

## Correções
- validação profunda de todas as fichas carregadas do Cofre;
- reconstrução automática de fichas antigas quando o texto original estiver disponível;
- isolamento de registros incompatíveis sem apagar fichas válidas;
- bloqueio para resultado incompleto entrar no Cofre;
- reparo e persistência automática do histórico após a abertura;
- proteção adicional dos indicadores da tela inicial;
- versão, manifesto, cache e workflow alinhados para v25.76.
