# BuildMaster Elite Tático — Correção CI v37.71

## Falhas corrigidas
- TypeScript completo: importação `UploadCloud` não utilizada no `ResultWorkspace`;
- regressão v32.00: a segunda passagem do Motor v37.50 apagava a adaptação de modo, conexão e controle;
- regressão v33.00: o teste legado não aceitava o esquema de cache `37.70.0-continuous-rules-1`.

## Correção funcional
O Motor v37.50 agora:
- mantém como referência a ficha contextual produzida pela Calibração v32;
- aplica pesos próprios para ranqueado, offline, conexão estável, delay alto e estilo de controle;
- penaliza combinações que ficam abaixo da referência em grupos críticos do contexto;
- continua fechando exatamente o orçamento de pontos.

## Proteção do workflow
O diagnóstico consolidado agora também executa as regressões v37.50, v37.60, v37.70 e v37.71.
