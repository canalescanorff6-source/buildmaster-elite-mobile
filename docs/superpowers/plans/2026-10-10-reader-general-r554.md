# Reader R554: leitura independente das margens do print

**Goal:** Corrigir a leitura geral de nomes, atributos, nível máximo e pontos para prints com a carta inteira ou dentro de uma captura maior, sem regras por jogador.
**Architecture:** Detectar o painel EFHub pela estrutura visual repetida de três colunas de atributos antes de escolher as zonas. Manter coordenadas da imagem original, ajustar os recortes automáticos ao painel e dimensionar a ampliação pelo painel efetivo. Preservar calibração explícita válida, fotos ajustadas e incerteza em imagens ilegíveis.
**Tech Stack:** TypeScript, canvas, Tesseract local, Playwright, Next.js/Capacitor.
**Spec:** Pedido de Tiago neste chat e os quatro prints originais anexados em 2026-10-10; abrangência geral, não apenas Cristiano Ronaldo.

## Global Constraints

- Nenhum nome ou valor esperado de jogador no código de produção.
- Não alterar motores de Skills, Ímpeto ou treino, nem sobrescrever dados confirmados manualmente.
- Manter limites de memória, um crop ativo e liberação de recursos; nenhum OCR externo.
- Campos ilegíveis continuam pendentes; nível atual não vira nível máximo e pontos só derivam de nível máximo confiável.
- Uma calibração explícita correta conserva autoridade; uma foto ajustada manualmente não deve ser substituída na releitura.

## Review Focus

Prints não EFHub, barras e margens, cartas deslocadas, baixa resolução, mais de um painel, calibração salva de outra geometria, arredondamento das coordenadas, cancelamento e descarte de canvas.

## Task 1: Reproduzir e localizar o painel

**Interfaces:** Produzir bounds normalizados opcionais na sessão de imagem, consumidos pelos recortes automáticos.

1. Acrescentar regressão real de OCR com os quatro jogadores existentes dentro de capturas de dimensões e deslocamentos variados.
2. Executar o teste antes do fix. **Expected:** falha no nome/atributos/nível do print completo.
3. Acrescentar testes da localização, incluindo falso positivo e dois painéis ambíguos.
4. Implementar localização estrutural e mapeamento das zonas, com ampliação baseada no painel.
5. Executar testes. **Expected:** prints legíveis com valores exatos; imagens ambíguas não aceitas como um painel único.

## Task 2: Integrar calibração e foto com autoridade

**Interfaces:** Consumir bounds sem alterar coordenadas de calibração manual correta. Aplicar recuperação automática quando a calibração antiga se refere a outro layout; preservar foto manual.

1. Criar testes que falhem para calibração padrão/antiga aplicada a print com margens e foto manual substituída.
2. Corrigir os fluxos identificados, mantendo os campos confirmados.
3. Executar regressões de ação, cancelamento, autoridade manual e OCR real. **Expected:** recuperação geral sem sobrescrever dados confirmados.

## Task 3: Verificar e publicar a correção

**Interfaces:** Validar alterações das tarefas 1 e 2 contra o app e CI existentes.

1. Executar suíte do leitor, browser com Tesseract real, typecheck, build e orçamento dos bundles. **Expected:** todos aprovados.
2. Revisar o diff com contexto novo e resolver problemas materiais com regressões RED→GREEN.
3. Commit/PR da R554 e acompanhar verificações e geração do APK conforme autorização já existente no chat.
4. Reportar resultado real, link da alteração/APK quando disponível e limites de prints sem resolução suficiente.
