# Correção do erro ETIMEDOUT no GitHub Actions — v27.10

## Causa

Uma entrada do `package-lock.json` apontava para um registro interno usado durante a preparação do projeto:

`packages.applied-caas-gateway1.internal.api.openai.org`

Esse endereço não existe para o runner público do GitHub. Por isso o download de `postcss-8.5.19.tgz` terminava com `ETIMEDOUT`.

## Correção aplicada

- URL de `postcss` corrigida para `https://registry.npmjs.org/`;
- `.npmrc` fixado no registro público;
- validação automática antes de `npm ci`;
- bloqueio de URLs privadas no lockfile;
- até três tentativas para falhas temporárias de rede;
- tempos de espera ampliados;
- mensagem de erro mais clara no workflow.

## Publicação

Envie o projeto corrigido em um novo commit e inicie uma nova execução do workflow. Não use `Re-run jobs` na execução antiga, porque ela está ligada ao commit que contém o lockfile incorreto.
