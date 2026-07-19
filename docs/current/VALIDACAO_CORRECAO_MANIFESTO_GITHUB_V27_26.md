# Validação — correção do manifesto antigo no GitHub Actions

## Erro reproduzido

O teste `tests/v27-26-automatic-update-regression.ts` encontrou `public/update-manifest.json` e interrompeu a compilação com a mensagem:

> Manifesto placeholder antigo não pode ser empacotado no APK.

Isso aconteceu porque a substituição de arquivos pelo navegador do GitHub não remove arquivos antigos que deixaram de existir no pacote enviado.

## Solução aplicada

1. `scripts/sanitize-update-source.mjs` remove os três locais proibidos:
   - `public/update-manifest.json`;
   - `out/update-manifest.json`;
   - `android/app/src/main/assets/public/update-manifest.json`.
2. A limpeza é executada em `pretypecheck`, `pretest:all`, `pretest:v2726` e `preapk:build-web`.
3. O workflow executa a limpeza imediatamente depois do checkout, antes de instalar dependências e antes dos testes.
4. `scripts/build-static.mjs` executa a mesma proteção diretamente.
5. `.gitignore` impede que o manifesto local volte a ser adicionado.
6. O exemplo `public/update-manifest.example.json` é preservado.
7. O manifesto oficial continua sendo gerado pelo workflow somente depois que o APK assinado é publicado e conferido publicamente.

## Validações executadas

- reprodução exata com criação deliberada de `public/update-manifest.json`: aprovada;
- remoção automática antes de `test:v2726`: aprovada;
- regressão da limpeza em pasta temporária: aprovada;
- TypeScript: aprovado;
- todos os grupos da suíte do aplicativo: aprovados em execuções segmentadas;
- exportação estática do app Android: aprovada;
- workflow YAML: aprovado;
- 32 blocos shell do workflow: aprovados em `bash -n`;
- pacote final: sem manifesto local, APK, keystore, token, segredo, `node_modules`, `.next` ou `out`.

## Limite da confirmação

A correção elimina a falha mostrada no print. A publicação assinada e o teste da atualização no aparelho dependem da nova execução do GitHub Actions com os Secrets e Variables já configurados no repositório.
