# BuildMaster Elite Tático — r123

## Objetivo

A r123 evolui o Clean Slate para aumentar a confiabilidade da ficha de máximo desempenho online sem criar outra autoridade de decisão. Ficha, Top 5 e Ímpeto continuam pertencendo exclusivamente ao Clean Slate.

## 1. Confiança da ficha

A confiança passa a ser separada do Overall/GER e também da confiança bruta do OCR. O perfil considera:

- qualidade dos dados lidos;
- cobertura de atributos;
- evidência de habilidades;
- certeza dos estilos ofensivo/defensivo;
- estabilidade da ficha diante de alternativas próximas;
- segurança do retorno marginal;
- evidência real de partidas quando já existir histórico validado.

Níveis exibidos: `ALTA`, `MODERADA` e `BAIXA`.

Evidência real aumenta a confiança, mas não sobrescreve automaticamente a ficha.

## 2. Saturação dos pontos

Cada grupo usado na ficha recebe uma auditoria local dos níveis finais. A r123 compara o retorno por custo de cada incremento com o melhor retorno daquele mesmo grupo naquela mesma carta.

Estados:

- `EFICIENTE`: retorno final ainda consistente;
- `ATENCAO`: retorno está caindo;
- `SATURADO`: últimos níveis entraram em zona de retorno baixo.

Não existem tetos fixos por posição, nome de jogador, Overall ou receitas como “Passe máximo 8”. Saturação é evidência local da carta.

## 3. Laboratório competitivo A/B

O próprio Clean Slate gera os braços:

- **A**: ficha final oficial r123;
- **B**: alternativa controlada de orçamento idêntico e suficientemente diferente quando existir.

O laboratório de partidas v40.50 passa a preferir esses braços atuais em vez de alternativas históricas.

Protocolo:

- no mínimo 5 partidas por braço;
- alternar A/B em condições semelhantes;
- priorizar Ranked e conexão estável;
- registrar delay, minutos e queda de rendimento no segundo tempo;
- carta e posição devem permanecer equivalentes para comparação.

O laboratório é `READ_ONLY_AB`: um vencedor nunca muda sozinho ficha, Top 5, Ímpeto, GP, itens ou progressão.

## 4. Autoridade única

Marcadores estruturais:

- `BM_R123_ONLINE_OBJECTIVE`
- `BM_R123_NAME_AGNOSTIC`
- `BM_R123_MARGINAL_RETURN`
- `BM_R123_SATURATION_AUDIT`
- `BM_R123_CONFIDENCE_PROFILE`
- `BM_R123_AB_LAB_READ_ONLY`
- `BM_R123_ONLINE_SINGLE_WRITER`

Motores históricos permanecem somente como diagnóstico/regressão e não recebem autoridade final.

## 5. Interface

A tela principal da ficha agora mostra:

- confiança da ficha e seus componentes;
- saturação/retorno dos grupos investidos;
- braço A e braço B do laboratório competitivo;
- hipótese que diferencia B da ficha principal;
- aviso explícito de que A/B é somente leitura.

O fluxo r121 das habilidades adicionadas e toda a Central 2027 são preservados.

## 6. Validação executada

Aprovados nesta base:

- `typecheck:v4080`
- `typecheck:v3920`
- `test:r119`
- `test:r120`
- `test:r121`
- `test:r122`
- `test:r123`
- `test:v4050`
- `test:v4060`
- `quality:syntax` — 543 arquivos TS/TSX
- `quality:interactive` — 796 botões tipados
- `quality:visual`
- `quality:audit` — 127 verificações

Advertências não funcionais da auditoria: `src/lib/analyzer.ts` e `src/components/CardVisionApp.tsx` continuam grandes e merecem divisão em uma revisão futura isolada.
