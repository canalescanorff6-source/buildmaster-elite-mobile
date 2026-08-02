# BuildMaster Elite Tático v31.76 — Exportação de gravações

## Correção aplicada

A gravação original continua no armazenamento privado do aplicativo para revisão e análise. Ao encerrar uma partida, o BuildMaster cria uma cópia pública no Android por meio do MediaStore.

## Pasta pública

`Filmes/BuildMaster/Partidas`

## Ações disponíveis

- **Salvar vídeo:** cria ou recupera a cópia pública na Galeria.
- **Compartilhar vídeo:** prepara a cópia pública e abre o seletor oficial do Android.
- **Excluir sessão:** remove o arquivo privado e o relatório do app, mas preserva a cópia pública já exportada.

## Segurança

O compartilhamento usa URI `content://` com permissão temporária de leitura. O app não utiliza `file://` e não envia o vídeo automaticamente para servidores.
