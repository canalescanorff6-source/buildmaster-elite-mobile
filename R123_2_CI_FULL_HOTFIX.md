# r123.2 — CI Full Hotfix

Correção consolidada dos três bloqueios encontrados no workflow de 27/08/2026:

1. Orçamento TypeScript mantido em 5,25 MiB, agora expresso diretamente como `5.25 * 1024 * 1024`, preservando a guarda e satisfazendo as regressões v31.82/v38.34.
2. Regressão v40.70 alinhada ao locale PT-BR: o nome oficial da Konami Brasil para o novo estilo coletivo da v6.0.0 é `Sobreposição`. `Todos por Um` é a tradução pt-PT e não deve substituir a interface brasileira.
3. Nenhuma alteração na autoridade final de ficha, Top 5 ou Ímpeto. Clean Slate r123 permanece o único escritor final.

Validação obrigatória: v31.82, v38.34, v40.70 e `test:r1232`, além das regressões r119-r123 e verificações estruturais antes de empacotar.
