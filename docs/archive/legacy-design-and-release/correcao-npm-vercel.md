# Correção de instalação na Vercel

Este pacote corrige o erro `ETIMEDOUT` em URLs internas do ambiente de geração.

Alterações:

- `package-lock.json` agora aponta para `https://registry.npmjs.org/`.
- `.npmrc` força a Vercel a usar o registry público do npm.
- Foram adicionadas opções de retry para reduzir falhas temporárias de rede.

Depois de subir estes arquivos no GitHub, faça um novo Redeploy na Vercel.
