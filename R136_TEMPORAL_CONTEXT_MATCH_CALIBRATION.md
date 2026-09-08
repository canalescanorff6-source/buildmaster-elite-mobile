# R136 — Calibração temporal/contextual de partidas reais

## Objetivo

Evitar que feedback antigo, de patch legado ou de contexto tático diferente permaneça influenciando indefinidamente a ficha atual.

A R136 **não é um motor de ficha**. Ela entrega somente multiplicadores limitados de necessidade para ações já avaliadas pelo Clean Slate. O Clean Slate R125 continua sendo o único escritor de progressão, Top 5 e Ímpeto.

## Contexto vigente validado

- Temporada: eFootball 2027
- Versão-base validada: 6.0.0
- Data de verificação do contexto: 2026-09-04
- Catálogo interno: `EFOOTBALL_V600_LIVE_CATALOG_VERSION`

Novas partidas registradas pelo app recebem automaticamente `gameSeason`, `gameVersion` e `gameplayEpoch`.

## Regras R136

### 1. Decaimento temporal

Peso-base por idade da partida:

- 0–14 dias: 1,00
- 15–30 dias: 0,92
- 31–60 dias: 0,78
- 61–120 dias: 0,58
- 121–240 dias: 0,40
- 241+ dias: 0,25

A evidência não é apagada. Ela perde autoridade progressivamente.

### 2. Compatibilidade de versão

- v6.0.0 explícita: peso 1,00
- outra 6.x explícita: 0,88
- somente epoch V6, sem versão: 0,78
- histórico sem versão/epoch: 0,62
- versão explícita fora da geração v6: 0,30

Versão explícita é soberana sobre rótulo de epoch para impedir metadado contraditório de mascarar histórico legado.

### 3. Contexto tático

Mesma carta + mesma posição continuam sendo pré-condições absolutas.

Quando formação/estilo coletivo são conhecidos e diferem do contexto atual:

- movimentação e defesa sofrem desconto maior;
- passe, finalização, físico e resistência sofrem desconto menor;
- nenhuma evidência é apagada.

Isso distingue tendências intrínsecas da carta de problemas dependentes do sistema tático.

### 4. Déficit precisa continuar atual

Um domínio só vira `domainNeed` se:

- houver suporte efetivo mínimo;
- aparecer em pelo menos duas sessões independentes;
- aparecer em pelo menos duas sessões dos últimos 60 dias.

Assim, um problema antigo não permanece ativo apenas porque houve muitas partidas ruins meses atrás.

### 5. Anti-overfitting preservado

Continuam bloqueados como causa suficiente de mudança:

- uma partida isolada;
- uma única sessão;
- problema presente em apenas uma sessão;
- amostra dominada por delay;
- evidência de outra posição;
- Overall/GER;
- resultado bruto de vitória/derrota.

O ajuste máximo por ação continua em 12%.

## Persistência de partidas

Criado `matchValidationRepositoryR136.ts` como porta única para:

- leitura de registros;
- gravação limitada a 1.000 entradas;
- evento de atualização;
- assinatura de versão do subsistema.

`MatchValidationCenter`, `ProfessionalIntelligenceCenter` e `useCentralMatchRecordsR135` passam a usar o mesmo repositório.

## Invalidação de produção

`ensureCurrentProductionAnalysisR128()` usa `matchEvidenceCalibrationCurrentR136()`.

O fingerprint R136 inclui:

- conteúdo das partidas;
- faixa temporal de cada partida;
- versão/epoch;
- formação/estilo;
- contexto v6/catálogo atual.

A produção só fica obsoleta quando algo material muda — inclusive quando uma partida cruza uma faixa de recência — evitando recálculo diário desnecessário.

## Contrato de autoridade

Fluxo de produção:

`Carta → evidência OCR confiável → calibração R136 (read-only) → Clean Slate R125 → selo R128/R134 → Cofre`

R136 nunca escreve:

- níveis de progressão;
- Top 5;
- Ímpeto;
- orçamento;
- posição final.
