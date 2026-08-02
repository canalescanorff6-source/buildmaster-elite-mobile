# Correção CI v31.78

Esta correção elimina os dois bloqueios observados no workflow da v31.78:

- remove a importação TypeScript não utilizada `LayoutTemplate` em `CardVisionApp.tsx`;
- tipa explicitamente o evento do seletor de estilos no Estúdio de Formações;
- atualiza a regressão v30.20 para aceitar a identidade visível `Marques Fichas`, preservando compatibilidade com o nome legado `BuildMaster`.

Validações executadas:

- `npm run test:v3020`;
- `npm run test:v3178`;
- testes direcionados de v30.00 até v31.78;
- sintaxe de 265 arquivos TypeScript/TSX;
- 702 contratos interativos;
- pré-voo de produção com 120 verificações;
- auditoria estrutural com 80 verificações;
- manifesto de integridade regenerado e verificado.

O typecheck global com dependências reais será repetido pelo GitHub Actions. No ambiente local, a instalação integral foi bloqueada exclusivamente pela indisponibilidade de `zlibjs@0.3.1` no proxy de pacotes.
