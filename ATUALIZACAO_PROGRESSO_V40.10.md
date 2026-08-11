# BuildMaster v40.10 — Progresso visível

## Atualizador
- Barra global visível mesmo fora da tela de Configurações.
- Etapas: consulta do manifesto, backup, permissão, conexão, download, cópia, validação, abertura do instalador e confirmação na próxima abertura.
- Download mostra porcentagem real, bytes transferidos, velocidade e ETA quando o tamanho é conhecido.
- O instalador final é controlado pelo Android; o BuildMaster mostra 98% na entrega ao sistema e confirma 100% na primeira abertura após a nova versão estar instalada.

## Leitura de cartas
- Barra com porcentagem real do pipeline.
- Exibe fase atual, detalhe do campo, quantidade concluída e ETA estimado.
- O progresso recebe eventos do OCR e das oito regiões calibradas, sem alterar a lógica de precisão da v40.00.

## Compatibilidade
- Leitor reconstruído da v40.00 preservado.
- Cofre, fichas, posições adaptadas, Supabase, login, gravação e demais módulos não são migrados ou apagados.
