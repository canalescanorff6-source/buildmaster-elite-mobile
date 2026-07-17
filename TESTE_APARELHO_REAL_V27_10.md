# Checklist de validação real — v27.10

Execute após o GitHub Actions gerar o APK assinado.

## Instalação e atualização

- [ ] versão instalada mostra `27.10.0`;
- [ ] atualização por cima mantém login, Cofre e formações;
- [ ] assinatura é aceita pelo Android;
- [ ] backup é criado antes da atualização;
- [ ] app abre novamente após a instalação.

## Print Único Pro

Teste pelo menos cartas com nível 27, 30, 31, 32 e 48.

Para cada print:

- [ ] imagem da carta foi recortada corretamente;
- [ ] nome correto;
- [ ] posição correta;
- [ ] estilo correto;
- [ ] GER correto;
- [ ] nível não foi confundido com GER;
- [ ] pontos corretos;
- [ ] atributos visíveis corretos;
- [ ] habilidades visíveis corretas;
- [ ] campo incerto pediu confirmação;
- [ ] mapa visual mostra caixas na região correspondente;
- [ ] cancelar leitura funciona;
- [ ] repetir o mesmo print usa o cache sem duplicar registros.

## Desempenho

- [ ] leitura não fecha o app;
- [ ] celular não trava durante processamento;
- [ ] progresso avança por etapa;
- [ ] alternar de aplicativo e voltar preserva a sessão;
- [ ] Cofre com muitas cartas abre e pesquisa corretamente;
- [ ] rolagem não apresenta engasgos graves.

## Visual

- [ ] textos não ficam cortados;
- [ ] botões possuem área confortável;
- [ ] barra inferior não cobre ações;
- [ ] teclado não esconde campo ativo;
- [ ] abas continuam legíveis em tela pequena;
- [ ] modo claro e escuro mantêm contraste;
- [ ] animações respeitam movimento reduzido.

## Funções integradas

- [ ] ficha usa exatamente os pontos disponíveis;
- [ ] explicação dos investimentos aparece;
- [ ] detector de lacunas usa apenas o elenco salvo;
- [ ] formação sugere funções e alternativas;
- [ ] banco aparece nos planos de partida;
- [ ] pós-jogo não altera a ficha sem autorização;
- [ ] diagnóstico não exibe senha, token ou chave.

Anote o modelo do aparelho, resolução do print e campo incorreto para permitir calibração reproduzível.
