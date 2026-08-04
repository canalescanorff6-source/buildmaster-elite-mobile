# BuildMaster v38.40 — Leitura rápida e retomada protegida

## Mudanças

- OCR adaptativo: campos críticos usam duas passagens balanceadas; campos simples usam passagem rápida.
- Redução controlada da resolução intermediária para diminuir tempo e memória sem reduzir o print original.
- Checkpoint da leitura no IndexedDB com arquivo, etapa, progresso e mensagem.
- Retomada automática ao reabrir o app ou voltar após suspensão do Android.
- Serviço nativo em primeiro plano com notificação durante a leitura.
- Worker OCR não é descarregado quando existe leitura ativa.
- Sessão da conta preservada em snapshot local por sete dias e revalidada silenciosamente.
- Tela completa de verificação exibida apenas na primeira inicialização; nas seguintes há retomada silenciosa.

## Limite técnico

O serviço nativo reduz a chance de o Android encerrar o processo. Alguns fabricantes podem congelar a WebView quando o aplicativo permanece muito tempo em segundo plano. Por isso a v38.40 também salva checkpoints e retoma automaticamente. O resultado não é perdido mesmo quando o processamento é pausado pelo sistema.
