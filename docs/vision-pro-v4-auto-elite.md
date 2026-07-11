# Correção v4 Auto Elite

Esta versão troca o comportamento de “remendar OCR” por um fluxo mais seguro:

1. Tenta ler a imagem com IA Vision quando `OPENAI_API_KEY` existe.
2. Se não houver chave, usa OCR local por áreas.
3. Nunca usa números soltos da imagem como orçamento de pontos.
4. O orçamento vem do nível máximo ou fallback 64.
5. A ficha é otimizada por simulação de ganho de desempenho por custo real, não por ficha automática do jogo.

Limitação honesta: sem um modelo de visão externo, nenhum OCR em navegador garante 100% de leitura em todo print. A IA Vision reduz muito esse problema.
