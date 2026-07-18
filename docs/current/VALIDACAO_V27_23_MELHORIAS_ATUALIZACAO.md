# BuildMaster Elite Tático v27.23 — melhorias e teste automático

## Melhorias implementadas

- A rede do atualizador foi separada da interface em `updateChannel.ts`.
- A consulta identifica se respondeu pela release imutável ou pela ponte de compatibilidade.
- A Central de Atualizações ganhou um teste completo sem baixar o APK.
- O teste verifica conexão, origem oficial, pacote instalado, manifesto, comparação de versões, permissão e armazenamento.
- Cada tentativa fica registrada em um histórico técnico local com no máximo 30 eventos.
- O diagnóstico pode ser copiado para análise sem expor senhas ou dados das fichas.
- É possível limpar somente o estado do atualizador, sem apagar jogadores, fichas, backup ou preferências.
- O fluxo de download pode atualizar o manifesto e repetir a operação por até três rodadas; o módulo nativo mantém suas próprias tentativas de rede.
- O manifesto pendente é recuperado ao reabrir a tela de atualizações.
- A tela escuta imediatamente o evento global de nova versão.
- O layout foi adaptado para celular e desktop.

## Segurança preservada

- APK com nome único por execução.
- Manifesto ativado somente depois de validar o APK público.
- SHA-256, tamanho, pacote, versionCode, versão e assinatura.
- Tráfego HTTPS e download sem cache.
- Compatibilidade com o canal `buildmaster-latest` usado pela v27.00.

## Limite do Android

O aplicativo detecta e baixa a atualização automaticamente. O instalador do Android ainda exige a confirmação final do usuário para atualizar um aplicativo comum.
