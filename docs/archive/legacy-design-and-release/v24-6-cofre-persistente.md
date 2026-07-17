# BuildMaster Elite Tático v24.6 — Cofre de Fichas Persistente

Esta versão mantém a base estável v24.4/v24.5 e melhora o histórico de jogadores.

## O que mudou

- O histórico virou **Cofre de Fichas**.
- As fichas são salvas no **IndexedDB do navegador**, que é mais adequado para dados grandes e imagens do que localStorage.
- As fichas permanecem no mesmo celular/navegador enquanto o usuário não apagar os dados do site.
- Limite aumentado para até 200 fichas salvas.
- Botão para **exportar backup JSON**.
- Botão para **importar backup JSON**.
- Migração automática do histórico antigo v24.5, v24.4 e v24.3 quando existir no mesmo navegador.

## Observação importante

O cofre é local do dispositivo. Se o usuário limpar os dados do navegador, trocar de celular ou reinstalar o app/PWA apagando dados do site, o cofre pode ser perdido. Para segurança, use o backup exportado.
