# BuildMaster Elite Tático — v38.20 Otimização Invisível

## Objetivo

Melhorar velocidade, estabilidade e consumo de memória sem adicionar novas telas, cards, botões ou informações ao resultado. A interface clean da v38.10 foi preservada.

## Perfil adaptativo do aparelho

O app identifica silenciosamente a capacidade aproximada do dispositivo usando memória disponível, quantidade de núcleos, economia de dados e qualidade da conexão.

São aplicados três perfis internos:

- econômico;
- equilibrado;
- alto desempenho.

O perfil controla apenas processamento, imagens, pré-carregamento e manutenção de cache. Ele não altera a ficha, as habilidades, o Booster nem o visual principal.

## Imagens e OCR com limite de memória

O processamento deixou de criar primeiro uma cópia do print na resolução completa para depois redimensioná-la.

Agora o app:

- calcula o tamanho seguro antes de criar o canvas;
- limita megapixels conforme o aparelho;
- mantém mais resolução em aparelhos fortes;
- reduz picos de memória em celulares modestos;
- aplica limites separados ao print completo e aos recortes do OCR;
- preserva o tratamento de contraste, nitidez e binarização já existente.

## OCR serializado e reutilizável

O mesmo worker do Tesseract continua sendo reutilizado, mas as leituras passam por uma fila segura.

Isso evita que duas tarefas simultâneas alterem os parâmetros do mesmo worker ao mesmo tempo. Também foram adicionados:

- deduplicação de leituras idênticas em andamento;
- validade de 30 dias para o cache OCR;
- liberação automática do worker após inatividade;
- liberação antecipada quando o app vai para segundo plano;
- cancelamento preservado;
- estado interno com tarefas pendentes e último uso.

## Carregamento sob demanda

Os módulos secundários continuam usando importação dinâmica, mas o pré-carregamento passou a respeitar:

- capacidade do aparelho;
- economia de dados;
- conexão offline ou 2G;
- aba em segundo plano;
- limite de módulos por ciclo;
- carregamento escalonado durante períodos ociosos.

No perfil econômico, os módulos são carregados somente quando realmente abertos.

## Manutenção silenciosa

Durante períodos ociosos, o app reduz automaticamente apenas caches temporários:

- cache do OCR;
- miniaturas;
- diagnósticos;
- fila de leituras.

Fichas, jogadores, formações, partidas, backups e dados do usuário não entram nessa limpeza.

Os limites ficam mais conservadores quando o armazenamento do aparelho está próximo do máximo.

## Cache da aplicação

O esquema passou para:

```text
38.20.0-invisible-optimization-1
```

O service worker usa:

```text
buildmaster-v38-20-invisible-optimization-1
```

Manifesto, logotipo e ícones usam cache com atualização silenciosa em segundo plano.

## Arquivos principais

- `src/lib/invisibleOptimizationV3820.ts`
- `src/components/RuntimeOptimizationBootstrapV3820.tsx`
- `src/lib/ocrWorkerManager.ts`
- `src/modules/card-reader/imageProcessing.ts`
- `src/components/lazy/AppLazyPanels.tsx`
- `tests/v38-20-invisible-optimization-regression.ts`
- `tests/v38-20-invisible-optimization-integration-regression.mjs`

## Validações executadas

- typecheck direcionado da v38.20;
- typecheck do OCR e processamento de imagens;
- regressão funcional e de integração da v38.20;
- regressões v37.40 até v38.10;
- regressões v37.71, v33.00 e v36.00;
- sintaxe aprovada em 338 arquivos TypeScript/TSX;
- 704 contratos de botões e 27 imagens com texto alternativo;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- 111 verificações da auditoria estrutural;
- 122 verificações do pré-voo de produção;
- assinatura lógica: `fab9c2d725cf7f31`.

O `npm ci` completo não foi concluído neste ambiente porque o gateway de pacotes retornou 404 para `zlibjs@0.3.1`. Por isso, o typecheck global e o build Next/Android permanecem para o GitHub Actions, onde as dependências são instaladas.
