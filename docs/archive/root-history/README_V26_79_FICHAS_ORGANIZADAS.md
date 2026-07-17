# BuildMaster Elite Tático v26.79 — Fichas Organizadas

## Objetivo desta versão

Esta versão reorganiza a experiência de criação e leitura das fichas sem remover nenhuma função do motor. O problema principal encontrado na v26.78 era a quantidade de informações concorrendo na mesma tela, especialmente em celulares.

## O que mudou na criação da ficha

- Fluxo reduzido para quatro etapas: Entrada, Identidade, Revisão e Resultado.
- O método de leitura continua disponível, mas deixou de ocupar uma etapa própria.
- Cabeçalho e textos encurtados para destacar a tarefa atual.
- Ação principal fixa no celular, evitando rolagem longa para gerar a ficha.
- Prévia decorativa ocultada em telas pequenas para reduzir ruído visual.
- Campos essenciais agrupados como Identidade da ficha.
- Contexto tático continua opcional e separado dos dados obrigatórios.

## O que mudou no resultado

A antiga página longa foi transformada em um espaço de trabalho dividido em cinco áreas:

1. **Resumo** — recomendação principal, distribuição exata, motivo da escolha, forças e limitação.
2. **3 propostas** — recomendada, agressiva e segura, com seleção do foco.
3. **Ajustar** — comparação da ficha personalizada com a recomendação.
4. **Pós-jogo** — registro do comportamento real e sugestões de correção.
5. **Auditoria** — confiança dos dados, habilidades, validação matemática e explicação completa.

Nenhuma função foi removida. As informações apenas aparecem na ordem de decisão mais útil.

## Melhorias de celular

- Abas legíveis com rolagem horizontal.
- Fim dos nomes comprimidos em fonte muito pequena.
- Cartões reorganizados em uma coluna quando necessário.
- Botão principal acima da navegação inferior.
- Menos conteúdo decorativo antes do resultado.

## O que ainda falta para o app evoluir mais

### 1. Validação por partidas reais

O motor já recebe feedback pós-jogo, mas o próximo salto de precisão é criar um painel que compare, ao longo de várias partidas, a ficha recomendada com resultados reais: erros de passe, finalizações, perdas físicas, cansaço e posicionamento.

### 2. Banco oficial de cartas com histórico

Cada carta deveria ter registro de origem, temporada, atualização do eFootball, atributos oficiais confirmados e data da última validação. Isso reduziria dependência de leitura manual e evitaria misturar versões diferentes do mesmo jogador.

### 3. Explicação de peso das decisões

A ficha já explica o resultado, mas pode mostrar quanto cada fator pesou: posição, estilo, função, habilidade especial, formação e pontos disponíveis. Isso aumentaria a confiança do usuário sem esconder a incerteza.

### 4. Reestruturação técnica interna

`CardVisionApp.tsx` e `globals.css` ainda são arquivos muito grandes. Dividir o app em módulos menores facilitará manutenção, testes, carregamento sob demanda e futuras melhorias sem quebrar áreas já prontas.

### 5. Testes visuais em aparelhos reais

A compilação e os testes automáticos foram aprovados, mas o acabamento final precisa ser confirmado no APK em diferentes tamanhos de tela Android, principalmente aparelhos menores e com fontes ampliadas.

## Validações executadas

- TypeScript.
- Layout v26.79.
- Motor de identidade e formações.
- Ficha Studio.
- Atualização definitiva.
- Integridade da release.
- Segurança, contas, sessão e backup.
- Catálogos oficiais de posições, estilos e habilidades.
- Leitura de prints.
- Precisão, orçamento e três propostas de ficha.
- Técnicos, entrosamento, escalação, adversário e plano de jogo.
- Exportação estática usada pelo APK.

## Publicação

Envie o projeto ao GitHub em um novo commit e execute o workflow de geração/publicação. A atualização v26.79 deve ser gerada com o mesmo `ANDROID_SIGNING_BUNDLE` usado na v26.78 para instalar por cima e preservar os dados.
