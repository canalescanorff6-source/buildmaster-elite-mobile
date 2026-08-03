# Testes executados — v38.39

## Aprovados

- `test:v3835` — contrato legado corrigido;
- `test:v3838` — regressões v35 e perfil automático preservados;
- `test:v3839` — proteção específica da correção final;
- `test:v3771` — cache versionado e contexto de delay/controle;
- `test:v3831` — cache derivado do `package.json`;
- `test:v3100` — inteligência unificada;
- `test:v3510` — ficha por posição natural/escolhida;
- `test:v3170` e `test:v3177` — gravação e Análise de Vídeo 2.0;
- `test:v3834` — orçamento, rota e Gerador Tático;
- orçamento do código: 88,6% de 4 MiB;
- sintaxe: 351 arquivos TypeScript/TSX;
- contratos: 720 botões e 27 imagens com `alt`;
- visual e acessibilidade;
- rotas críticas;
- Java nativo gerado;
- auditoria estrutural: 111 verificações;
- pré-voo de produção: 126 verificações;
- assinatura lógica: `9eda2f53cca482b9`;
- pré-voo Google Play: 27 verificações;
- manifesto de integridade.

## Limitações reais

O `npm ci` foi tentado, mas o registry intermediário retornou HTTP 404 para `zlibjs@0.3.1`. Por isso, o typecheck global com dependências completas e a geração do APK não foram concluídos localmente.

O diagnóstico consolidado foi executado sem `node_modules`. Ele confirmou a correção da regressão v38.35 e revelou contratos antigos adicionais de texto de versão, que também foram atualizados e executados isoladamente com sucesso. As falhas do typecheck global local foram exclusivamente módulos não instalados, como React, Next.js e Capacitor.
