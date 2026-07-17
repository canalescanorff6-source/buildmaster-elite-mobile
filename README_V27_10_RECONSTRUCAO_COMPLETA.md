# BuildMaster v27.10 — Reconstrução Completa

## Objetivo

Aplicar integralmente as melhorias encontradas na auditoria da v27.00 sem remover as funções consolidadas: fichas, Cofre, formações, contas, segurança, backup, atualização, treino, adversário e Central Inteligente.

## 1. Print Único Pro

O leitor de uma imagem agora trabalha por template e por campo, não por um único texto bruto.

### Campos analisados

- arte e moldura da carta;
- nome;
- posição;
- estilo de jogo;
- GER;
- tipo da carta;
- nível;
- pontos disponíveis;
- atributos;
- posições jogáveis;
- progressão;
- habilidades normais e especial.

### Correção de nível e GER

- nível e GER têm regiões e parsers separados;
- o nível aceita valores legítimos como 27, 30, 31, 32 e 48;
- números altos dentro do selo da carta recebem forte preferência como GER;
- um candidato igual ao GER é penalizado como nível;
- rótulos como `Nível`, `Lv`, `Level` e formatos como `31/31` aumentam a confiança;
- pontos visíveis e coerência do orçamento ajudam a desempatar;
- resultados críticos de baixa confiança exigem confirmação.

### Evidência e auditoria

O usuário pode ver:

- o mapa do print original com caixas por região;
- o recorte utilizado para cada campo;
- texto reconhecido;
- alternativas encontradas;
- confiança do resultado;
- comparação com leitura anterior.

### Desempenho do OCR

- um worker Tesseract é reutilizado;
- a resolução é limitada por região;
- a segunda passagem ocorre somente quando necessária;
- resultados são guardados por hash;
- a leitura pode ser cancelada;
- fila local evita perder trabalhos pendentes;
- correções anteriores ajudam leituras futuras do mesmo template.

A leitura por vários prints da v26.81 permanece como opção avançada quando uma única tela não contém todos os dados.

## 2. Armazenamento e desempenho

Foi adicionada uma base IndexedDB separada por conta para:

- cache e fila de OCR;
- correções e histórico de confiança;
- cartões, fichas, formações e partidas espelhados;
- miniaturas separadas de imagens completas;
- diagnósticos seguros.

O repositório estruturado inclui paginação e migração não destrutiva do armazenamento antigo. A compatibilidade com os dados existentes foi preservada.

## 3. Design premium

A folha histórica foi isolada em `legacy-compat.css`. O novo ponto de entrada importa primeiro a compatibilidade e depois `design-system-v2710.css`, evitando uma nova sequência de sobrescritas desorganizadas.

Foram padronizados:

- cores, tipografia e espaçamento;
- botões com área de toque mínima;
- cartões, abas, campos e alertas;
- foco visível por teclado;
- estados pressionado, carregando e desabilitado;
- animações curtas e discretas;
- preferência de movimento reduzido;
- ícones normal e maskable separados.

## 4. Inteligência integrada

### Explicação dos investimentos

A ficha mostra por que cada grupo recebeu pontos, relacionando posição, função, deficiência inicial e retorno esperado.

### Detector de lacunas

O time identifica funções ausentes ou frágeis e descreve o perfil necessário, sem inventar jogadores.

### Planos de partida

Planos para controlar, defender resultado ou buscar o placar usam titulares, banco e funções salvas no próprio aplicativo.

### Registro confiável da carta

Cada carta pode registrar origem, versão, data e forma de confirmação. O app não chama um dado de oficial sem fonte oficial registrada.

### Diagnóstico seguro

O relatório técnico remove senhas, tokens, sessões, cookies, chaves e outros dados sensíveis antes de salvar ou compartilhar.

## 5. Modularização

Foram extraídos leitor adaptativo, processamento de imagem, fila de OCR, orçamento de pontos e tipos de domínio do analisador. Painéis pesados usam carregamento dinâmico.

O `CardVisionApp.tsx` continua como coordenador de compatibilidade porque uma substituição total em uma única versão aumentaria o risco de perda de dados e regressões. A v27.10 reduz o acoplamento real sem fingir que todo o legado deixou de existir.

## 6. Testes

A versão inclui:

- casos críticos de nível, GER e pontos;
- regressão específica v27.10;
- regressões anteriores de fichas, leitores, formações, time, segurança, backup e atualização;
- TypeScript com variáveis e parâmetros não utilizados tratados como erro;
- auditoria de dependências de produção.

## 7. Limites reais

- OCR não pode reconhecer um dado que não aparece ou está ilegível.
- A base não deve ser chamada de oficial sem fonte confirmada.
- A validação visual final depende do APK instalado e de prints reais em diferentes aparelhos.
- A confirmação de assinatura, instalação por cima e release depende do GitHub Actions.
