# Rebaseline R550 — evidência real da carta

Mudança funcional solicitada pelo proprietário para corrigir a geração de
fichas com atributos ausentes e impedir receitas genéricas por posição/PP.
Entrega no [PR #115](https://github.com/canalescanorff6-source/buildmaster-elite-mobile/pull/115),
partindo de `main` em `8a81d617c4cc1a57ece0c4661afe9612c2546ab4`.

| Referência | Versão do R119 | SHA-256 do arquivo R119 |
|---|---|---|
| Freeze anterior | `40.80-r406-match-calibration-group-return-fix5` | `48e317ccc20d775e86ed2aaf050462aa3555f361deec84ae7eabfd959674ddd8` |
| Rebaseline desta correção | `40.80-r550-verified-card-evidence-v1` | `630f2097ccbb4e58d3669294f50ecf6fe4eead0b33d07716e0d49aad2c9aa1fd` |

## Mudança semântica deliberada

O orçamento conhecido e uma contagem declarada pelo OCR não bastam para
distribuir PP. O motor conta valores reais de atributos conhecidos, entre
1 e 110. Abaixo do mínimo crítico (10 para jogadores de linha, 4 para
goleiros), preserva o orçamento e gera uma prévia com zero PP distribuído.
A cobertura útil parcial permite uma ficha provisória. A promoção final
depende dos 26 atributos e dos demais requisitos de identidade, nível e PP.

R126 revalida a cobertura e a certificação ao abrir um resultado salvo.
A nova versão do R119 também invalida selos produzidos pela versão anterior.
O histórico permanece preservado para revisão e reconstrução.

## Autoridades preservadas

R119 continua sendo o único escritor da recomendação; R126 declara a
autoridade, R128 sela o resultado, R138 orquestra a geração e R501 controla
a certificação. A alteração restringe a promoção de dados insuficientes.
Overall/GER não passa a orientar a ficha. R510/R517 permanecem provisórios
e não recebem autorização de escrita ou certificação de gameplay.

## Evidência de revisão

As regressões R452, R453 e R501 primeiro reproduziram os defeitos de
atributos ausentes, contagem inflada e certificação parcial indevida.
Depois da correção, exercitam o motor e a abertura real de fichas salvas.
A regressão com três cartas reais de CF e o mesmo orçamento usa o caminho
de produção e verifica que dados e habilidades de cada edição são mantidos.
Não obriga diferenças artificiais entre cartas com decisões equivalentes.

O R530 remoto detectou o fingerprint antigo após essa mudança autorizada.
Os gates visuais R203/R204/R530 agora exigem o fingerprint R550 explícito;
eles não calculam e aceitam automaticamente uma nova referência.
As verificações de superfícies read-only e single writer permanecem ativas.

A entrega exige `test:r419`, R128, testes do leitor/auditoria, TypeScript e
PR completo aprovados no SHA entregue. Resultados e limites da validação
estão na [auditoria do app](../app-audit-2026-10-06.md). CI aprovado comprova
esses contratos; desempenho físico no eFootball depende de dados de jogo.
