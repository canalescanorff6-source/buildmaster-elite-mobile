# Build Android reproduzível — v27.10

Antes do build:

- mantenha `package.json` e `package-lock.json` sincronizados;
- não envie `node_modules`, `.next`, `out`, `android` antigo ou `dist-apk`;
- não publique `.env`, keystore ou pacote da chave;
- use o mesmo `ANDROID_SIGNING_BUNDLE` em todas as versões oficiais;
- faça um novo commit antes de executar o workflow.

A execução só deve ser distribuída quando testes, assinatura, versão, pacote, SHA-256 e verificação da release estiverem verdes.
