# v25.73 — Correção da geração de ficha

Esta versão corrige a tela que falhava ao finalizar uma ficha quando o aparelho restaurava uma sessão antiga com valores de objetivo de versões anteriores.

## Correções

- Migração automática de objetivos antigos para o catálogo atual.
- Fallback seguro para valores desconhecidos.
- Proteção com `try/catch` durante a geração da ficha.
- Preservação dos dados preenchidos quando ocorrer erro.
- Tela de recuperação em português no lugar da página genérica do Next.js.
- Teste de regressão para sessões antigas.

## Depois de instalar

Se o aparelho ainda abrir uma sessão antiga, a própria versão converte os valores automaticamente. Não é necessário limpar os dados do aplicativo.
