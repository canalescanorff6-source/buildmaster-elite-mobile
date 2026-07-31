# Correção Meu Time — v34.00

## Sintoma

Ao tocar em **Meu Time**, o aplicativo podia abrir a tela global de **Recuperação protegida** em vez da escalação.

## Causa

A rota montava imediatamente a Central Profissional avançada, mesmo com o painel recolhido. Essa central executava vários relatórios sobre todas as fichas do Cofre. Uma ficha antiga, incompleta ou incompatível podia lançar uma exceção antes de o estado vazio ser mostrado, derrubando a rota completa.

## Correções

- Meu Time básico abre primeiro, sem montar relatórios avançados ocultos.
- A Central avançada é carregada somente quando o usuário abre **Configuração avançada do time**.
- O histórico é filtrado antes de entrar nos motores táticos.
- Fichas antigas ou não renderizáveis são ignoradas sem serem apagadas.
- Cada relatório avançado possui isolamento próprio e retorna estado seguro em caso de falha.
- Toda a rota Meu Time possui uma barreira local; uma falha isolada não leva mais à tela global de recuperação.
- O esquema de cache nativo foi atualizado para descartar o bundle anterior na primeira abertura do APK corrigido.

## Dados preservados

Nenhum jogador, ficha, imagem ou arquivo do Cofre é excluído pela correção.
