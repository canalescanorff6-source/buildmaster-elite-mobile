# BuildMaster Elite Tático v31.40 — OCR Rígido Adaptativo

## Objetivo da versão

Esta versão reforça o fluxo **Usar Imagem** para interpretar um único print da carta com mais rigor, preservar o enquadramento correto do jogador e impedir que o aplicativo confirme dados frágeis como se fossem certos.

O princípio central mudou de “preencher tudo mesmo com dúvida” para **ler por evidência, comparar resultados independentes e bloquear o que não estiver confirmado**.

## 1. Recorte exato da carta e da foto do jogador

- Detecção inicial da área completa da carta.
- Refinamento fino das bordas para remover margens do print.
- Geração de dois recortes independentes:
  - carta completa detectada;
  - retrato quadrado do jogador, sem bordas extras.
- Pré-visualização simultânea do print original, da carta e da foto quadrada.
- O retrato quadrado passa a ser a imagem principal salva na ficha.

## 2. Leitura por zonas adaptativas

Cada informação importante é lida em várias regiões próximas, em vez de depender de um único retângulo fixo. O motor cria variações exatas, deslocadas, expandidas e refinadas para:

- nome do jogador;
- overall;
- nível;
- pontos disponíveis;
- posição;
- estilo de jogo;
- atributos;
- lista de habilidades.

As zonas críticas usam mais tentativas e maior exigência de concordância.

## 3. Múltiplos tratamentos de imagem

Cada zona pode ser analisada com diferentes preparações, incluindo nitidez, contraste, escala e modos esparsos específicos para tabelas e habilidades. O resultado final usa consenso entre leituras independentes.

Uma repetição do mesmo erro no mesmo recorte não é tratada como confirmação real. O motor leva em conta a diversidade de regiões e de tratamentos que chegaram ao mesmo valor.

## 4. Nome rígido, sem preenchimento aleatório

O nome só é aceito automaticamente quando a zona própria do nome apresenta evidência suficiente e concordância entre leituras independentes.

Quando houver conflito ou baixa confiança:

- o aplicativo não substitui por outro nome aleatório;
- o campo permanece pendente;
- a interface mostra que a identidade precisa de confirmação manual;
- o valor só entra no aprendizado depois da confirmação do usuário.

## 5. Habilidades completas e catálogo evolutivo

A leitura diferencia:

- habilidades oficiais já conhecidas;
- habilidades aprendidas e confiáveis da conta;
- novos candidatos ainda não confirmados.

Uma habilidade nova encontrada no print não é descartada. Ela aparece separadamente para revisão. Ao ser confirmada pelo usuário:

- é preservada na ficha atual;
- entra no catálogo local da conta;
- passa a ser reconhecida em leituras futuras;
- recebe confirmações e referências de imagens independentes;
- pode evoluir de pendente para confiável.

O sistema não transforma automaticamente qualquer ruído do OCR em habilidade oficial. A confirmação explícita evita contaminar o banco com palavras erradas.

## 6. Memória local e backup

O catálogo aprendido utiliza armazenamento local IndexedDB no repositório `ocr-lexicon`.

São armazenados:

- nomes confirmados;
- habilidades confirmadas;
- aliases encontrados;
- quantidade de confirmações;
- hashes de prints independentes;
- estado pendente ou confiável.

O catálogo também entra na exportação e restauração de backup do aplicativo.

## 7. Parâmetros visíveis de conferência

A tela de evidências apresenta por campo:

- valor interpretado;
- confiança;
- estado confirmado, pendente ou bloqueado;
- avisos de divergência;
- novas habilidades que exigem confirmação.

O usuário pode conferir cada parte antes de salvar a ficha.

## 8. Segurança da ficha

A finalização fica condicionada à revisão dos campos críticos. Dados incertos não devem ser silenciosamente inventados.

A posição final escolhida pelo usuário, o estilo do jogador, a formação e o contexto do técnico permanecem preservados e continuam alimentando o Motor Supremo de Fichas.

## 9. Versões internas

- Aplicativo: `31.40.0`
- OCR de alta precisão: `31.40-rigid-vision-1`
- Leitor detalhado: `31.40-rigid-detailed-print-1`
- Motor de visão: `31.40.0`

## 10. Validações executadas

- Suíte completa de regressões: aprovada.
- Teste específico v31.40: aprovado.
- TypeScript direcionado ao OCR v31.40 e à interface: aprovado.
- Sintaxe: 232 arquivos TypeScript/TSX aprovados.
- Contratos interativos: 671 botões tipados aprovados.
- Acessibilidade de imagens: 24 imagens com texto alternativo.
- Visual e acessibilidade: contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.
- Pré-voo de produção: 75 verificações aprovadas.
- Auditoria: 56 verificações aprovadas.

## Limites reais

Nenhum OCR pode garantir acerto absoluto em todo print. Compressão, desfoque, reflexo, texto coberto, resolução baixa, interface alterada pelo jogo ou corte incompleto ainda podem exigir correção manual.

A proteção implementada para esses casos é **não inventar**: quando a evidência não for suficiente, o aplicativo bloqueia ou marca o campo para revisão. A confirmação humana também é necessária antes de incorporar uma habilidade desconhecida ao catálogo evolutivo.

O build completo do Next.js e o typecheck global não foram executados neste ambiente porque o pacote não contém `node_modules`. As verificações TypeScript específicas da versão, todas as regressões, a auditoria e o pré-voo foram executados com sucesso.
