# Correção definitiva do npm no GitHub Actions — v24.64

## Causa identificada

O `package-lock.json` continha URLs `resolved` apontando para um registro interno do ambiente de preparação do projeto:

`packages.applied-caas-gateway1.internal.api.openai.org`

Esse endereço não é acessível pelos runners do GitHub Actions. Por isso `npm ci` ficava aguardando até atingir o tempo limite.

## Correções aplicadas

- Todas as URLs internas do `package-lock.json` foram substituídas por `https://registry.npmjs.org/`.
- A instalação passou a forçar explicitamente o registro público.
- `--prefer-offline` foi removido para evitar tentativas com cache incompleto.
- O log da instalação foi ativado com `--loglevel=info`.
- O limite da etapa foi aumentado para 25 minutos como proteção, embora a instalação normalmente deva terminar muito antes.

Depois de enviar estes arquivos, inicie uma execução nova do workflow.
