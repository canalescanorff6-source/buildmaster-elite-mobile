# BuildMaster — Roadmap R564–R570 (eFootball 2027)

## Princípios não negociáveis
- A edição exata da carta e os 26 atributos devem ser provenientes de evidência verificada. Dado ausente => PENDENTE, sem preencher com chute.
- O custo de treino usa `trainingPlanCore.ts` e o limite de pontos não pode ser ultrapassado.
- Nunca maximizar GER/OVR como substituto para desempenho dentro de campo.
- Técnico, buffs e ímpetos devem ter procedência e não podem ser somados duas vezes a prints que já exibem valores ajustados.
- Não modificar as cartas salvas nem o OCR legado durante o rollout de novas decisões; usar funções puras, shadow checks e testes.
- Calibração empírica com partidas reais: placar, posse e estatísticas coletivas não são medições individuais.

## Etapas e gates
| Etapa | Escopo | Critério de aceite | Situação |
|---|---|---|---|
| R564 | Certificação de dados e orçamento | 26 atributos com procedência, pontos exatos, habilidades/boosters sem conflito; leitura incompleta não pode autorizar recomendação | Motor, testes e diagnóstico visual no laboratório de fichas neste PR; aplicação de bônus permanece bloqueada sem prova |
| R565 | Comparador de builds (equilibrada/especialista/competitiva) | Reaproveitar os otimizadores existentes; filtrar custos inválidos e não declarar vencedor sem métrica comparável calibrada | Motor e testes neste PR; ligação dos otimizadores pendente |
| R566 | DNA tático e formação fluida | Confirmar estilo ofensivo/defensivo, posições e funções reais dos 11; medir compatibilidade sem inventar ativação | PENDENTE |
| R567 | Habilidades e booster crafting | Respeitar habilidade nativa, slots adicionais ocupados, disponibilidade de tokens, booster de base/fonte e custo | PENDENTE |
| R568 | Laboratório de partidas e AB | Captura consentida de partidas comparáveis, medidas reais, tamanho amostral e relatórios de incerteza | PENDENTE |
| R569 | OCR de alta confiabilidade | Fixtures reais diversos; taxa por campo, falha amigável e revisão manual; sem regressões do cofre | PENDENTE; aguarda finalização da R563 |
| R570 | Painel decisório final | Expor razões, custos, perdas, conflitos, evidências e opções; decisão final do usuário | PENDENTE |

## Política de integração
- R564–R565 em branch e PR próprias; não fazer merge com CI RED.
- O painel `PerformanceCertificationPanelR564` apenas mostra diagnóstico: não aceita como comprovada a origem sem bônus de `result.parsed.attributes`.
- O adaptador R565 ainda não toma decisões por conta própria na interface; requer ligação a candidatos reais de otimizadores e calibração.
- PR #128 (R563) trata OCR opcional e está independente; não sobrescrever essa implementação.
- Implantação gradual com geração de resultados paralela; cada módulo só assume autoridade após validação no Android e fixtures reais.
- `MATCH_CALIBRATED` é uma declaração fornecida por quem chama o R565: não há verificação experimental automática nesta fase. R568 deverá validá-la com amostras reais e contexto controlado.
- A R564 não aplica bônus de técnico: somente informa elegibilidade por campo, e jamais reescreve `card.attributes`.

## Comandos de verificação locais
```bash
node -r ./tests/_ts-require.cjs tests/r564-r565-performance-certification-regression.ts
npm run typecheck
npm run build
```
