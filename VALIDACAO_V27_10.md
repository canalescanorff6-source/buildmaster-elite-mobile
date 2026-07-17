# Validação técnica — v27.10

Data da validação: 17/07/2026.

## Aprovado neste ambiente

- `npm run typecheck` com `noUnusedLocals` e `noUnusedParameters`;
- bateria de 52 arquivos de teste executada em blocos;
- seis casos críticos dedicados a nível, GER e pontos;
- regressões de leitor, fichas, habilidades, formações, elenco, banco, partidas, segurança, contas, backup e atualização;
- exportação estática otimizada do Next.js;
- três rotas públicas estáticas (`/`, `/login` e fallback 404), quatro páginas internas geradas;
- auditoria das dependências de produção: zero vulnerabilidades conhecidas reportadas pelo npm;
- maior chunk JavaScript da exportação: aproximadamente 823 KB antes de compressão;
- manifesto local de publicação removido; o manifesto real continua sendo gerado pelo workflow.

## Não executado localmente

- Gradle Android e APK assinado;
- instalação por cima em aparelho real;
- inspeção visual pixel a pixel em todos os tamanhos de tela;
- precisão OCR em todas as variações reais do eFootball.

Esses itens dependem do GitHub Actions, da mesma chave de assinatura e dos prints/aparelhos reais descritos em `TESTE_APARELHO_REAL_V27_10.md`.
