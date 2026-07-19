# Correção da falha “Manifesto placeholder antigo” — v27.26

## Causa real

O arquivo `public/update-manifest.json` ainda estava rastreado no repositório antigo. Ao enviar um pacote novo pelo navegador do GitHub, arquivos ausentes no ZIP não são apagados automaticamente. Por isso, o arquivo antigo permaneceu no repositório e o teste de segurança bloqueou a compilação antes da geração do APK.

O bloqueio era correto: um manifesto local antigo não deve ser empacotado no APK, porque pode apontar para checksum, tamanho ou URL que já não correspondem ao APK oficial.

## Correção aplicada

- criado `scripts/sanitize-update-source.mjs`;
- limpeza executada antes do TypeScript, antes da suíte completa e antes da exportação Android;
- limpeza adicionada diretamente ao workflow logo após o checkout;
- `scripts/build-static.mjs` também limpa o manifesto antes do build;
- `.gitignore` impede que `public/update-manifest.json` volte a ser adicionado;
- teste de regressão cria manifestos antigos em uma pasta temporária e confirma que todos são removidos sem apagar `update-manifest.example.json`;
- o manifesto oficial continua sendo criado somente no fim do GitHub Actions, depois da validação pública do APK assinado.

## Resultado esperado

Mesmo que o arquivo antigo ainda permaneça no histórico ou no conteúdo atual da branch, o workflow o remove do ambiente de compilação antes dos testes. Portanto, ele não entra no APK e não interrompe novamente a publicação.
