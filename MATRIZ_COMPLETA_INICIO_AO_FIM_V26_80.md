# Matriz completa — BuildMaster do início ao fim

Esta matriz registra todas as áreas solicitadas para evitar que alguma melhoria seja esquecida. “Preservado” significa que o recurso já existia na base e continuou coberto pelos testes. “Reforçado v26.80” indica implementação nova nesta versão.

| # | Área | Situação na v26.80 | Cobertura principal |
|---|---|---|---|
| 1 | Entrada e login | Preservado | sessão persistente, licença, modo offline limitado, diagnóstico de conexão, mensagens específicas |
| 2 | Primeiro uso | **Reforçado v26.80** | assistente em cinco etapas, modo simples/avançado, formação, estilo e prioridade |
| 3 | Tela inicial | Reforçado v26.80 | próxima ação baseada na prioridade definida e continuidade do último fluxo |
| 4 | Leitura do print | Preservado | confiança por dado, calibrador, revisão antes de gerar, separação entre leitura e escolha |
| 5 | Modo manual | Preservado | posição soberana, validação dos pontos e campos compatíveis |
| 6 | Identidade da carta | **Reforçado v26.80** | impressão digital, registro por versão, comparação e estado confirmado/revisar |
| 7 | Motor de fichas | Preservado | posição, função, estilo, atributos, habilidades, retorno marginal e antidesperdício |
| 8 | Resultado da ficha | Reforçado v26.79/v26.80 | resumo primeiro, abas, explicação dos pesos e auditoria separada |
| 9 | Três propostas | Preservado | recomendada, agressiva e segura |
| 10 | Habilidades | Preservado | catálogo oficial, habilidades existentes, recomendadas e especiais |
| 11 | Formação e encaixe | Preservado | função e estilo por espaço, combinações e análise do Cofre |
| 12 | Formação personalizada | Preservado | duplicação, posições, estilos e salvamento por conta |
| 13 | Análise do elenco | Preservado | setores, dependências, corredores, equilíbrio com e sem bola |
| 14 | Banco e substituições | Preservado | cobertura, reserva por titular, banco equilibrado, Planos A/B/C |
| 15 | Análise do adversário | Preservado | ameaças, fraquezas, comparação de setores e plano prático |
| 16 | Treinos práticos | Preservado | repetição, meta, erro, correção, registro e plano semanal |
| 17 | Pós-jogo | **Reforçado v26.80** | avaliação por partida, tendências, consistência e problemas repetidos |
| 18 | Cofre | Preservado | pastas, filtros, comparação, favoritos, migração e histórico |
| 19 | Backup e nuvem | **Reforçado v26.80** | criptografia, restauração seletiva e inclusão dos novos dados |
| 20 | Atualizações | Preservado | versionCode, APK único, SHA-256, assinatura e verificação pós-release |
| 21 | Painel administrativo | Preservado | contas, prazo, aparelhos, MFA e diagnóstico de licença |
| 22 | Configurações contra delay | Preservado | jogo, aparelho, rede, causa provável e ressalvas realistas |
| 23 | Desempenho do app | Em evolução segura | exportação estática, imagens preguiçosas e início da divisão em componentes |
| 24 | Design e experiência | Reforçado v26.79/v26.80 | fluxo em etapas, modo simples, abas móveis e menos informação simultânea |
| 25 | Ajuda dentro do app | Preservado/reforçado | explicações, motivos das recomendações e guia inicial |
| 26 | Qualidade e confiança | **Reforçado v26.80** | pesos, confiança por evidência e distinção entre confirmado e inferido |
| 27 | Testes automáticos | Reforçado v26.80 | nova regressão e bateria completa integrada ao workflow |
| 28 | Relatório e diagnóstico de erro | Preservado | integridade, conexão, atualização e campos de diagnóstico sem senha/token |
| 29 | Integração completa | **Reforçado v26.80** | configuração inicial → ficha → formação → Cofre → partida → aprendizado |

## Limites honestos

### Base oficial de cartas

O app agora registra e compara versões com precisão, mas só deve chamar uma carta de “oficialmente verificada” quando houver uma fonte oficial autorizada e atualizada. Sem essa fonte, o estado correto é “confirmada pelo usuário”.

### Validação prática

O motor consegue encontrar padrões, mas a qualidade da recomendação pós-jogo depende dos registros reais feitos pelo usuário. Com menos de três partidas, a confiança permanece baixa.

### Desempenho e aparência no Android

Os testes automatizados e a exportação estática foram aprovados. Tamanho de fonte, teclado, barra inferior e desempenho final precisam ser conferidos no APK instalado em aparelhos reais.

### Modularização

A divisão técnica foi iniciada nas quatro áreas novas. Reescrever todas as telas antigas de uma só vez aumentaria o risco de quebrar cálculos e dados estáveis; a estratégia segura é continuar extraindo módulos em versões posteriores, sempre com testes.
