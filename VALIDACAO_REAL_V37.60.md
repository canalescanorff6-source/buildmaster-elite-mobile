# BuildMaster Elite Tático — v37.60 Validação Real

## Escopo implementado

### Laboratório A/B
- cria automaticamente duas opções de teste a partir do Motor Avançado v37.50;
- vincula cada partida ao braço A ou B;
- exige amostra mínima por braço antes de apontar vencedor;
- separa nota bruta de nota ajustada por contexto e delay;
- compara erros de passe e perdas de bola por 90 minutos;
- nunca substitui a ficha automaticamente com amostra insuficiente.

### Métricas por posição
- goleiro: defesas, gols sofridos, distribuição e domínio aéreo;
- defensores: cortes, bloqueios, duelos, interceptações e saída segura;
- meio-campistas: passes progressivos, passes-chave, recuperações e segurança sob pressão;
- atacantes: chutes no alvo, desmarques, dribles, pressão e produção ofensiva.

### Análise de partidas
- nota de desempenho real por função;
- métricas normalizadas por 90 minutos;
- identificação de forças, fraquezas e padrões repetidos;
- separação entre partidas estáveis, variáveis e com delay alto;
- controle de queda de rendimento no segundo tempo.

### Aprendizado por usuário
- perfil vinculado à conta;
- estilos de controle: passes rápidos, condução/drible, misto e defesa manual;
- pesos aprendidos usados apenas como desempate;
- registro de tendências e problemas recorrentes;
- salvamento do perfil derivado em armazenamento da conta.

### Ajustes por delay e estilo de controle
- mede diferença entre desempenho estável e com delay;
- prioriza ficha robusta quando a sensibilidade ao atraso é alta;
- adapta pesos de Passe, Destreza, Drible, Defesa e Força nas pernas;
- preserva posição escolhida, orçamento exato, habilidades oficiais e DNA da carta.

## Validações executadas
- typecheck do motor v37.60;
- typecheck da interface v37.60;
- regressão específica v37.60;
- regressões v37.50 e v37.40;
- regressão da Central Profissional v37.00;
- regressão do treinador de partidas v31.77;
- sintaxe em 312 arquivos TypeScript/TSX;
- 716 botões tipados e 27 imagens com alt;
- contraste, foco, toque, movimento reduzido e regiões ao vivo;
- auditoria estrutural: 111 verificações;
- pré-voo de produção: 122 verificações.

## Compatibilidade
O motor novo usa a identificação interna `37.60.0`. O versionamento público-base do pacote permanece protegido pelas regras atuais do atualizador e dos testes legados.
