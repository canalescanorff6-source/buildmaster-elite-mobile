# Auditoria completa — BuildMaster Elite Tático v27.20

## Escopo revisado

A auditoria percorreu a árvore completa do projeto e suas áreas de execução: código-fonte, componentes, motores de análise, OCR, armazenamento local, backup, contas, Supabase, atualização do APK, GitHub Actions, testes, recursos públicos e documentação.

Resumo estrutural na data da revisão:

- 524 arquivos no pacote, desconsiderando dependências instaladas e artefatos de build;
- 511 arquivos de texto/código;
- aproximadamente 55 mil linhas;
- 99 arquivos em `src`;
- 55 testes de regressão;
- 254 documentos históricos e atuais;
- workflows de build, assinatura, publicação, manifesto e verificação pública do APK.

## O que já estava forte

- O motor respeita posição escolhida, orçamento e nomes oficiais.
- A leitura possui OCR por áreas, cache, fila local, calibração e evidências.
- O Cofre tem migração, histórico, backup criptografado e separação por conta.
- A atualização do APK possui manifesto, checksum, tamanho, pacote e assinatura.
- A suíte de regressão cobre fichas, goleiros, formações, tática, segurança, contas, backup e atualização.
- A navegação principal já estava separada por áreas e adequada para uso móvel.

## Problemas encontrados e corrigidos na v27.20

### 1. Não havia um veredito único antes de usar a ficha

A qualidade estava espalhada entre validação, confiança, dados, habilidades e comparação. Foi criado o **Controle Final da Ficha**, que reúne:

- orçamento e custo;
- validação do motor;
- identidade da carta;
- confiança da leitura;
- habilidades oficiais e duplicadas;
- cobertura de atributos;
- encaixe tático;
- diversidade e orçamento das três variantes;
- origem dos pontos.

O painel entrega nota de 0 a 100, aprovados, avisos, bloqueios e atalhos diretos para a área que precisa de correção.

### 2. Um resultado incompleto podia parecer definitivo

Resultados com bloqueios agora recebem estado visual claro. Ao salvar, eles entram no Cofre com a marca **Revisar**. O aplicativo alerta, mas não retira do usuário a decisão final.

### 3. Localizar áreas ainda exigia navegar por vários menus

Foi adicionada uma busca global com:

- botão **Buscar** no cabeçalho;
- atalho `Ctrl+K` ou `Cmd+K`;
- pesquisa por nome, descrição e palavras relacionadas;
- navegação por teclado;
- acesso direto a criação por print, Manual Pro, jogadores, Cofre, time, partidas, backup, atualização, segurança, contas e assistente.

### 4. O rascunho era gravado a cada alteração

A sessão em andamento passou a usar salvamento com atraso de 450 ms. Isso reduz escrita repetida no armazenamento, principalmente durante digitação de atributos e OCR.

Também foi incluído um indicador de estado: salvando, salvo ou erro.

### 5. Imagens temporárias podiam permanecer na memória

URLs `blob:` de prévias e imagens tratadas agora são revogadas ao trocar de arquivo ou sair da tela. Isso reduz crescimento de memória durante várias leituras consecutivas.

### 6. O Cofre podia guardar uma URL temporária inválida

Uma URL `blob:` não existe após fechar o aplicativo. A v27.20 só persiste a prévia completa quando ela for realmente persistente. A arte recortada da carta continua protegida normalmente.

### 7. Faltava um modo leve para aparelhos que aquecem

O novo **Modo Econômico** reduz:

- desfoques de fundo;
- sombras pesadas;
- animações decorativas;
- elementos visuais sem impacto funcional;
- renderização antecipada de painéis fora da tela.

O modo não altera OCR, ficha, regras, pontos ou cálculos.

### 8. As novas melhorias precisavam ficar isoladas do CSS histórico

Foi criada a camada `design-system-v2720.css`, carregada depois das camadas antigas. Isso facilita manutenção e evita ampliar ainda mais o arquivo legado.

### 9. Faltava uma regressão própria para o novo controle

O teste `v27-20-quality-structure-regression.ts` verifica:

- ficha válida;
- estouro de orçamento;
- habilidades duplicadas;
- integração do painel;
- busca global;
- modo econômico;
- salvamento otimizado;
- versão e estilos da v27.20.

## Melhorias estruturais que ainda devem ser feitas em próximas versões

### Prioridade crítica

1. **Dividir `CardVisionApp.tsx`**: o arquivo ainda concentra estado, navegação, criação, resultado, Cofre, time e ajustes. A divisão deve ser gradual, com testes a cada extração.
2. **Dividir `analyzer.ts`**: o motor ainda reúne parsing, identidade, treino, habilidades, tática e geração das variantes em um arquivo muito grande.
3. **Reduzir `legacy-compat.css`**: o arquivo histórico é o maior do projeto. Regras não utilizadas devem ser removidas com comparação visual real no Android.

### Prioridade alta

4. Criar testes reais de interface e navegação, além das regressões por código.
5. Montar um conjunto de prints reais por resolução, aparelho e tela do eFootball para medir precisão do OCR.
6. Migrar imagens maiores para IndexedDB com limpeza por limite de espaço e idade.
7. Criar telemetria local opcional e sem dados pessoais para falhas de OCR, memória e atualização.
8. Consolidar a nuvem em uma única implementação para evitar caminhos antigos paralelos.
9. Assinar também os pacotes de regras remotas, não apenas validar seu formato.

### Prioridade média

10. Criar um editor visual de variantes A/B com comparação lado a lado.
11. Adicionar pesquisa unificada dentro do resultado por atributo, habilidade e função.
12. Criar relatório de desempenho pós-partida que compare a previsão da ficha com o resultado real.
13. Adicionar limpeza assistida de dados antigos, caches e imagens não usadas.
14. Criar um painel de compatibilidade por versão do Android e fabricante.

## Validação da entrega

Foram executados com sucesso:

- `npm run typecheck`;
- `npm run build`;
- `npm run test:all`;
- regressão específica `npm run test:v2720`.

A correção de atualização imutável da v27.12 foi preservada na v27.20.
