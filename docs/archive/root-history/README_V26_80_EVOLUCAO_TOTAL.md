# BuildMaster Elite Tático v26.80 — Evolução Total

Esta versão consolida o fluxo do aplicativo do primeiro acesso à validação da ficha em partidas. A base de segurança, contas, Cofre, formações, treinos, adversário, backup e atualização foi preservada.

## O que entrou nesta versão

### Primeiro uso guiado

- escolha entre modo **Simples** e **Avançado**;
- seleção da formação favorita;
- seleção do estilo coletivo;
- definição da prioridade inicial: fichas, elenco, formações ou treino;
- atalho direto para começar por print ou modo manual;
- opção de refazer a configuração em Ajustes.

### Modo simples e modo avançado

O modo simples deixa visível primeiro o essencial para criar a ficha. O modo avançado mantém auditoria, contexto tático, comparadores e ferramentas especializadas. Nenhum recurso é apagado ao alternar de modo.

### Registro por versão da carta

Cada carta pode ser registrada com uma impressão digital calculada a partir de:

- jogador;
- posição original;
- estilo informado;
- nível;
- pontos;
- atributos;
- habilidades existentes.

O aplicativo informa claramente que um registro é **confirmado pelo usuário**. Ele não chama o dado de oficial sem uma fonte oficial verificável.

### Explicação da decisão da ficha

O resultado mostra a participação de:

- posição escolhida;
- função em campo;
- estilo de jogo;
- base de atributos;
- habilidades e ímpetos;
- formação e contexto.

Os pesos somam 100% e são gerados a partir dos dados efetivamente disponíveis na análise.

### Validação em partidas reais

Cada carta pode guardar avaliações por partida, incluindo:

- minutos usados;
- nota geral;
- passe;
- movimentação;
- finalização;
- defesa;
- físico;
- resistência;
- problemas percebidos;
- observação livre.

Após três ou mais registros, o painel aumenta a confiança da amostra, encontra áreas fortes, pontos fracos e padrões repetidos. A ficha original não é alterada automaticamente.

### Backup ampliado

O backup completo passou a incluir:

- configuração inicial;
- modo de experiência;
- registro das versões das cartas;
- avaliações de partidas.

O esquema de dados foi elevado para `2680`, com migração de backups antigos.

### Divisão técnica segura

Quatro áreas foram retiradas do componente principal e transformadas em módulos independentes:

- `FirstUseOnboarding`;
- `DecisionWeightPanel`;
- `VerifiedCardRegistryPanel`;
- `MatchValidationCenter`.

Essa divisão reduz o risco de regressões e inicia a modularização progressiva do arquivo principal sem reescrever de uma vez as áreas antigas e estáveis.

## O que foi preservado

- login, licença e sessão persistente;
- segurança v26.75;
- Ficha Studio e layout organizado;
- motor de identidade por carta;
- três propostas de ficha;
- editor e comparação personalizada;
- habilidades oficiais e especiais;
- formações e formações personalizadas;
- escalação, banco, substituições e Planos A/B/C;
- análise de adversário;
- treinos e diagnóstico de delay;
- Cofre, filtros, comparação e nuvem;
- backup criptografado;
- atualizador com assinatura, SHA-256 e versionCode.

## Supabase

A v26.80 não exige nova função nem nova migração no Supabase. As funções e a migração de segurança da v26.75 continuam válidas.

## Publicação

1. Envie o projeto completo para o branch `main` em um novo commit.
2. Confirme o Secret `ANDROID_SIGNING_BUNDLE` e as Variables do Supabase.
3. Execute o workflow **Gerar APK e publicar atualização definitiva**.
4. Espere a etapa **Verificar release publicada de ponta a ponta** ficar verde.
5. Abra o BuildMaster instalado e use **Ajustes → Atualizações → Verificar agora**.

Não use apenas `Re-run jobs` em uma execução associada a um commit antigo.

## Validações locais realizadas

- TypeScript;
- regressão v26.80;
- layout v26.79;
- atualizador;
- segurança;
- contas e licenças;
- backup e migração;
- identidade das cartas;
- pontos e fichas;
- habilidades e técnicos;
- formações, escalação, banco e planos;
- adversário;
- treinos e delay;
- exportação estática para o APK.

A compilação e assinatura do APK Android continuam sendo feitas pelo GitHub Actions. A confirmação visual final deve ser feita no aparelho real após a instalação.
