# Testes da v39.20

## Contratos principais

- Mesma carta em MLG, MAT e SA mantém ficha, habilidades, Ímpeto e assinatura.
- A posição escolhida não entra na assinatura canônica.
- Cartas diferentes não compartilham a mesma assinatura.
- Não existe uso de `Math.random` no motor unificado.
- Apenas uma ficha pública é exibida.
- Habilidades nativas/adicionais/especiais não são duplicadas.
- O Ímpeto é bloqueado quando o encaixe ou a confiança não justificam o gasto.
- O diagnóstico tático não sobrescreve a receita canônica.
- Uma segunda leitura da mesma versão com diferença de 1 ponto em um atributo recupera a receita da memória canônica.
- A memória exige correspondência forte e não mistura versões apenas pelo nome.

## Cenário Scholes / Meia versátil

O teste reproduz uma carta de Meia versátil em:

- MLG numa 4-3-3 de Posse de bola;
- MAT;
- SA.

A receita permanece igual. Como MLG, o estilo fica ativo e o motor identifica risco de avanço excessivo, sobreposição com SA e isolamento do VOL. Como MAT, o estilo pode ficar neutro e o encaixe estrutural melhora sem criar outra ficha.

## Comandos

```bash
npm run typecheck:v3920
npm run test:v3920
node scripts/check-source-syntax.mjs
node scripts/check-interactive-contracts.mjs
node scripts/check-visual-accessibility.mjs
node scripts/audit-project.mjs
node scripts/production-preflight.mjs
node scripts/verify-integrity-manifest.mjs
```
