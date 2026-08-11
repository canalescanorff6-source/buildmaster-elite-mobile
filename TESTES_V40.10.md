# Testes executados — BuildMaster v40.10

## Aprovados neste ambiente
- Sintaxe TypeScript/TSX: 424 arquivos.
- Typecheck direcionado da v40.10: componentes de progresso, leitor e cartão de origem.
- Regressão v40.10: progresso de atualização + progresso de OCR.
- Regressão v40.00: leitor por quadrados reconstruído preservado.
- Regressões legadas críticas v38.34, v38.35, v38.36, v38.39 e executor detalhado v38.40.
- Contratos interativos: 775 botões e 32 imagens com alt.
- Visual/acessibilidade: aprovado.
- Java nativo gerado: aprovado.
- Rotas críticas: aprovadas.
- Guardas de versão: aprovadas.
- Contrato preventivo do CI: aprovado.
- Orçamento de fonte: aprovado (94,1%).
- Pré-voo de produção: 138 verificações.
- Pré-voo de publicação: 27 verificações.
- Auditoria estrutural: 127 verificações.

## Limitação local
O pacote de distribuição não inclui `node_modules`. Por isso o `npm ci` e o typecheck global com todas as dependências não foram usados como validação local final. O GitHub Actions continua responsável por instalar as dependências, executar o diagnóstico completo e compilar o APK.
