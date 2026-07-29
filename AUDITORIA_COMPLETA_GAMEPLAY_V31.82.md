# Auditoria completa de gameplay — BuildMaster Elite Tático v31.82

Esta revisão foi feita sobre o último projeto completo, abrangendo leitura do print, interpretação da carta, orçamento de progressão, escolha da ficha, habilidades adicionais, Ímpetos, posição, estilo individual, formação, estilo coletivo, técnico, sessão, interface e publicação.

## Correções críticas encontradas

### 1. Linha vazia de habilidades podia contaminar a leitura

Quando `HABILIDADES JÁ POSSUI:` aparecia vazia, o leitor podia atravessar a quebra de linha e interpretar o primeiro atributo seguinte como habilidade. A leitura agora fica restrita à linha correta e nunca transforma atributos numéricos em habilidades.

### 2. Cache podia reaproveitar uma ficha antiga

A chave do cache não incluía todos os atributos, habilidades existentes, Ímpetos e contexto tático. Assim, uma carta modificada podia receber parte da recomendação anterior. A nova impressão digital considera:

- atributos completos;
- habilidades nativas e especiais;
- Ímpetos existentes;
- posição e estilo;
- formação, estilo coletivo e técnico;
- orçamento e distribuição;
- feedbacks registrados.

Qualquer mudança relevante invalida a análise anterior.

### 3. Formação e técnico tinham influência fraca

A formação agora distribui responsabilidades específicas por setor e posição. A proficiência do técnico controla o peso desse contexto sobre as candidatas, em vez de produzir apenas uma nota constante. Exemplos:

- centroavante em 5-3-2 recebe maior peso de apoio, presença física e jogo aéreo;
- ataque estreito valoriza tabela e conexão curta;
- ponta em 4-3-3 valoriza drible, ruptura e apoio lateral;
- primeiro volante único recebe maior peso de proteção e saída;
- zagueiros em linha de três/cinco recebem mais responsabilidade de cobertura e duelo.

### 4. Catálogo de Ímpetos estava desencontrado

O leitor OCR reconhecia menos nomes que o motor de recomendação e ainda misturava habilidades especiais, como `Esticada de Perna`, `Sombra veloz` e `Impulso ofensivo`, na lista de Ímpetos. Foi criado um catálogo compartilhado entre:

- scanner;
- analisador;
- IA local;
- recomendação final.

Habilidades especiais não podem mais ser interpretadas como Ímpetos.

### 5. Ficha adaptada à jogabilidade atual

O motor foi ajustado para valorizar melhor:

- controle de bola, drible e condução firme em atacantes tecnicamente fortes;
- finalização e força do chute em cartas realmente capazes de concluir de média/longa distância;
- talento defensivo, desarme e participação defensiva em CB, LB, RB e DMF;
- redução de pontos redundantes quando o atributo já está alto;
- orçamento exato sem perseguir overall artificial.

A referência de balanceamento foi alinhada às alterações oficiais de jogabilidade das versões 5.2.0 e 5.4.0 do eFootball, especialmente defesa, talento defensivo, drible responsivo, chutes de longa distância, compactação e movimentações de ataque.

## Regras finais preservadas

- A posição escolhida pelo usuário continua soberana.
- A ficha não ultrapassa o total informado.
- Quando existe solução válida, todos os pontos são usados exatamente.
- O Top 5 não repete habilidades já presentes.
- Habilidades especiais não entram como habilidades adicionais treináveis.
- Goleiro não recebe ficha ou habilidade de jogador de linha.
- Ímpeto existente não aparece novamente como recomendação principal.
- Ímpeto é recalculado depois da ficha definitiva e das cinco habilidades.
- Formação, estilo coletivo e técnico influenciam sem apagar a identidade da carta.

## Matriz funcional validada

Foram executados cenários representativos para:

- LWF — Ala produtivo em 4-3-3;
- AMF — Armador criativo em 4-2-3-1;
- DMF — Primeiro volante em 4-1-2-3;
- CB — Defensor criativo em 4-2-2-2;
- LB — Lateral defensivo em 4-3-3;
- GK — Goleiro ofensivo em 4-2-2-2.

Todos usaram 64 de 64 pontos, entregaram cinco habilidades únicas sem repetição, mantiveram a posição escolhida e produziram Ímpeto contextualizado.

## Validação do projeto completo

As regressões históricas da v30.00 até a v31.82 foram executadas individualmente. Também foram validados:

- OCR e recortes;
- leitor eFHUB;
- sessão e contas;
- criação e renovação de usuários;
- calibrador em tela cheia;
- gravação e análise de partidas;
- interface e acessibilidade;
- rotas críticas;
- publicação APK/Google Play;
- orçamento do código;
- contratos do GitHub Actions;
- integridade do pacote.

## Pontos estruturais para uma versão futura

Não foi encontrado bloqueio funcional, mas dois arquivos continuam grandes:

- `src/components/CardVisionApp.tsx` — aproximadamente 4 mil linhas;
- `src/lib/analyzer.ts` — aproximadamente 3,4 mil linhas.

Eles passaram nos testes atuais, porém devem ser divididos gradualmente em versões futuras para reduzir custo de manutenção e risco de regressões.

## Limite técnico honesto

Nenhum motor consegue garantir que uma ficha será universalmente a melhor para toda pessoa e toda partida. Forma do jogador, controle usado, conexão, delay, instruções individuais, adversário e maneira de jogar alteram o resultado. O BuildMaster agora entrega uma ficha tecnicamente coerente e testável, priorizando gameplay e função real em vez de apenas overall; o histórico de partidas continua sendo o melhor mecanismo para refinamento posterior.
