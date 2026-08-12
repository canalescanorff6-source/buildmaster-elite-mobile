# BuildMaster v40.40 — Precisão Competitiva 99

## Transformação principal

- Motor multiobjetivo após o Desempenho Máximo Adaptativo v40.30.
- Busca determinística de até 480 candidatas com o mesmo orçamento de progressão.
- Fronteira de Pareto para impedir que um único score esconda trade-offs importantes.
- Avaliação separada para ranqueadas, eventos e partidas contra amigos.
- Resposta funcional calculada sobre atributos relevantes da posição, com curva interna contínua e sem alegar thresholds oficiais da Konami.
- Preservação do DNA e eficiência de pontos entram no critério final.
- Confiança explicável considera qualidade dos dados lidos e margem entre as melhores candidatas.
- Até 3 alternativas: Máximo competitivo, Resposta online e DNA preservado.
- Top 5 de habilidades adicionais reordenado somente a partir das habilidades já reconhecidas pelo catálogo/pipeline do app.
- Duplicação com habilidades nativas, adicionais já possuídas ou especiais é bloqueada.
- GER/overall continua fora do objetivo de otimização.

## Meta do eFootball

- Base estável: v5.5.1.
- v6.0.0: anunciada para meados de agosto de 2026.
- Novo estilo de equipe anunciado: Todos por Um (Overload).
- Nenhum peso da v6.0.0 é aplicado antes de comportamento confirmado e validação.

## Compatibilidade

- OCR v40.20 dos 8 quadrados preservado.
- Motor Adaptativo v39.30, Função Real v39.40 e Desempenho Máximo Adaptativo v40.30 continuam como camadas anteriores do pipeline.

## Validações executadas nesta transformação

- Regressão estrutural v40.40: aprovada.
- Regressão runtime v40.40: cenários SA, ZAG e GO aprovados; no fixture ofensivo foram 480 candidatas e 7 soluções Pareto, com orçamento exato e 5 habilidades complementares sem duplicação nativa. Jogadores de linha não recebem treino de goleiro e o goleiro não desvia pontos para grupos incompatíveis.
- Typecheck dedicado v40.40: aprovado.
- Typecheck v40.30 e v40.20: aprovados.
- OCR v40.20 dos 8 quadrados: regressões aprovadas.
- Sintaxe: 445 arquivos TypeScript/TSX aprovados.
- Contratos interativos: 775 botões tipados e 32 imagens com alt.
- Auditoria estrutural: 127 verificações aprovadas.
- Pré-voo de produção: 138 verificações aprovadas.
- Pré-voo Google Play: 27 verificações aprovadas.
- Integridade: 1.062 arquivos verificados por SHA-256.

### Observação do diagnóstico rápido

O único grupo que não roda no pacote limpo é a verificação de dependências instaladas, porque `node_modules` é removido do pacote de entrega. O GitHub Actions executa `npm ci` antes do diagnóstico completo, portanto essa checagem será feita no CI com as dependências presentes.
