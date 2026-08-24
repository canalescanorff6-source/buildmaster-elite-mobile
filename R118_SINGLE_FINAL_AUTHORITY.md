# r118 — Single Final Authority

## Objetivo

Eliminar a concorrência entre motores históricos na ficha final. Os motores antigos continuam disponíveis como especialistas e fontes de métricas, mas não podem mais sobrescrever a distribuição final.

## Arquitetura final

1. Motores históricos: métricas e diagnósticos em modo somente-leitura.
2. r60: identidade canônica da carta.
3. r70/r107/r108/r109: especialistas; r108 contém a Card Signature.
4. r50: compatibilidade e auditoria somente-leitura.
5. Gerador de habilidades + integridade: prepara candidatas.
6. r80: autoridade sobre Top 5 permanente e Ímpeto seguro.
7. r118: único escritor final de ficha + Top 5 + Ímpeto.
8. r90/r100/finalizador: somente-leitura para os campos selados pelo r118.
9. r45: apenas fallback emergencial quando a Card Signature não tem dados confiáveis.

## Guardas principais

- Escritas de `training` feitas pelos motores históricos são descartadas imediatamente.
- Depois do r118, `training`, `recommendedSkills` e `recommendedImpetos` ficam protegidos.
- `Homem de Área` não vira especialista aéreo apenas pelo estilo: exige prova de especialização aérea na própria carta.
- O padrão histórico `8/8/8/12` é auditado; uma candidata muito semelhante só permanece quando há ganho funcional demonstrável.
- Se o r80 não encontrar Ímpeto seguro, nenhum Ímpeto legado é exibido como fallback.
- A interface mostra o motor final real e prioriza resposta, sinergia, confiança, DNA e habilidade especial.

## Validação executada

- `npm run test:v4080`: suíte completa aprovada antes da prova final de sanitização.
- `scripts/sanitize-update-source.mjs`: executado novamente com sucesso.
- Após a sanitização: typecheck v40.80 e regressões críticas r60/r70/r80/r90/r100/r101/r107/r108/r114/r115/r116/r118 aprovadas.
- Arquivos TypeScript/TSX alterados foram verificados por transpile do TypeScript sem erro de sintaxe.

## Arquivos centrais da reforma

- `src/lib/finalDecisionAuthority2027V4080R118.ts`
- `src/lib/cardIntelligencePipeline.ts`
- `src/lib/masterCardEngineV4080R50.ts`
- `src/lib/performanceEngine2027V4080R108.ts`
- `src/lib/permanentResources2027V4080R80.ts`
- `src/lib/production2027V4080R100.ts`
- `src/components/UnifiedPerformanceV3920Panel.tsx`
- `tests/v40-80-r118-single-final-authority-regression.mjs`
