# R500 Pro Meta — Addendum de Precisão

Este documento é **normativo** e complementa `2026-09-26-r500-autonomous-tactical-director-design.md`. Em caso de ambiguidade na camada Pro Meta, estas regras prevalecem.

## Motivo do addendum

A auto-revisão da spec R500 identificou quatro dimensões que precisam estar explícitas para evitar falsa equivalência competitiva:

1. formato de partida (`1V1` vs `2V2`);
2. ruleset da competição;
3. dupla contagem da mesma partida entre R482/memória;
4. digest determinístico do dataset Pro Meta.

## Formato de partida

Toda observação Pro Meta deve declarar:

```ts
export type ProMetaMatchFormatR500 = '1V1' | '2V2' | 'UNKNOWN';
```

Adicionar a `ProMetaObservationR500`:

```ts
matchFormat: ProMetaMatchFormatR500;
```

Regras:

- `1V1 → 1V1`: compatibilidade máxima, demais dimensões iguais;
- `2V2 → 1V1`: nunca é equivalência direta; apenas princípios transferíveis recebem peso reduzido;
- `UNKNOWN`: não pode receber compatibilidade máxima;
- uma competição Mobile em dupla não pode ser rotulada como benchmark direto de Mobile 1v1;
- Similarity e Benchmark precisam expor quando a fonte vem de formato diferente.

## Ruleset competitivo

Competições podem limitar cartas, número de épicos, elenco, substituições ou outras condições. O R500 não deve comparar contextos como se fossem idênticos quando o ruleset muda.

Adicionar a `ProMetaObservationR500`:

```ts
rulesetId: string;
rulesetFingerprint: string;
rulesetTags: string[];
```

Exemplos de `rulesetTags` permitidos:

- `EPIC_LIMIT_3`;
- `CLUB_EVENT`;
- `NATIONAL_TEAM_EVENT`;
- `OPEN_SQUAD`;
- `UNKNOWN_RULESET`.

Esses exemplos são tags de dados, não regras hardcoded do motor.

Regras:

- ruleset diferente reduz `contextCompatibility` quando afeta diretamente composição/estratégia;
- `UNKNOWN_RULESET` nunca recebe compatibilidade máxima;
- mudança de ruleset não invalida princípios gerais automaticamente, mas impede benchmark direto quando a métrica depende da composição;
- `rulesetFingerprint` entra no fingerprint da observação Pro Meta.

## Contexto Pro Meta completo

A chave contextual mínima externa passa a considerar:

```text
platform
+ gameVersion
+ matchFormat
+ rulesetFingerprint
+ formation (quando confirmada)
+ teamStyle (quando confirmado)
+ competition/stage
```

Nome do jogador profissional **não** faz parte da regra algorítmica; ele é metadado da observação.

## Compatibilidade externa

O cálculo de compatibilidade Pro Meta deve considerar fatores separados:

```ts
export type ProMetaCompatibilityR500 = {
  platform: number;
  patch: number;
  matchFormat: number;
  ruleset: number;
  tacticalContext: number;
  finalCompatibility: number;
};
```

`finalCompatibility` precisa ser derivado deterministicamente dos fatores e limitado a `[0, 1]`.

Nenhum fator ausente pode ser tratado como `1.0` por padrão.

## Anti-dupla-contagem de partidas pessoais

R482 e a memória tática podem derivar da mesma partida. Portanto:

- um `sessionIdR462`/identificador canônico de partida só pode contribuir uma vez para a família `MATCH_CONFIRMED` em uma mesma afirmação;
- R482 pode enriquecer a descrição da partida com timeline/padrões, mas a memória agregada não cria uma segunda evidência independente da mesma sessão;
- memória é histórico agregado, não nova família;
- se não houver id canônico de sessão confiável, a evidência deve receber independência reduzida ou ser excluída da agregação forte.

## Digest determinístico do dataset

O digest Pro Meta deve ser calculado sobre uma representação canônica que:

- ordena observações por `id`;
- ordena arrays internos relevantes;
- normaliza strings onde o contrato exigir;
- inclui conteúdo tático, fonte, patch, plataforma, formato e ruleset;
- **exclui `generatedAtBuild`**;
- exclui campos puramente operacionais que não mudam a evidência.

Dessa forma, recompilar o mesmo dataset em outro horário não muda seu digest.

## Direitos e conteúdo derivado

O dataset do app deve armazenar **anotações estruturadas derivadas**, não cópias integrais de vídeo, áudio, screenshots extensos ou transcrições protegidas.

É permitido manter:

- URL da fonte;
- fingerprint da fonte;
- metadados competitivos;
- observações táticas curtas e estruturadas;
- métricas calculadas pelo pipeline de curadoria.

## Testes adicionais obrigatórios

Adicionar ao gate R500:

1. `2V2` não recebe compatibilidade máxima para contexto `1V1`;
2. `UNKNOWN` match format limita confiança;
3. ruleset incompatível reduz compatibilidade;
4. `UNKNOWN_RULESET` limita confiança;
5. mesma sessão R482 + memória não conta duas vezes;
6. duas observações com mesmo conteúdo e `generatedAtBuild` diferente geram o mesmo digest;
7. alteração real de `matchFormat` muda fingerprint/digest;
8. alteração real de `rulesetFingerprint` muda fingerprint/digest;
9. Similarity/Benchmark identificam transferência entre formatos;
10. dataset não depende de mídia protegida embutida para funcionar.

## Decisão final da auto-revisão

Com estas regras, a camada Pro Meta passa a distinguir **plataforma, patch, formato e ruleset**, reduzindo o risco de chamar uma evidência competitiva válida em um contexto de “meta” para outro contexto incompatível.
